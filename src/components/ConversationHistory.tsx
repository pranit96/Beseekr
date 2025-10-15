import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  MessageSquare,
  Plus,
  MoreVertical,
  Archive,
  Trash2,
  Search,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Conversation {
  id: string;
  title: string;
  last_message_at: string;
  status: 'active' | 'archived';
  last_message?: string;
  metadata?: {
    orchestration_mode?: string;
    agent_ids?: string[];
  };
}

interface ConversationHistoryProps {
  conversations: Conversation[];
  onSelectConversation: (conversationId: string) => void;
  onNewSession: () => void;
  onConversationDeleted: (conversationId?: string) => void;
  onConversationArchived: () => void;
  currentConversationId?: string;
}

export const ConversationHistory = ({
  conversations = [],
  onSelectConversation,
  onNewSession,
  onConversationDeleted,
  onConversationArchived,
  currentConversationId,
}: ConversationHistoryProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [localConversations, setLocalConversations] = useState<Conversation[]>(conversations);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setLocalConversations(conversations);
  }, [conversations]);

  const filtered = useMemo(() => {
    if (!query.trim()) return localConversations;
    const q = query.trim().toLowerCase();
    return localConversations.filter((c) => 
      (c.title || 'untitled').toLowerCase().includes(q) ||
      (c.last_message || '').toLowerCase().includes(q)
    );
  }, [localConversations, query]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!filtered.length) return;
      if (document.activeElement && (document.activeElement as HTMLElement).tagName === 'INPUT') return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev === null ? 0 : Math.min(prev + 1, filtered.length - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev === null ? filtered.length - 1 : Math.max(prev - 1, 0)));
      } else if (e.key === 'Enter' && focusedIndex !== null) {
        e.preventDefault();
        const target = filtered[focusedIndex];
        if (target) handleSelectConversation(target.id);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [filtered, focusedIndex]);

  useEffect(() => {
    if (focusedIndex === null || !listRef.current) return;
    const el = listRef.current.querySelectorAll('[data-conversation-item]')[focusedIndex] as HTMLElement | undefined;
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedIndex, filtered]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      onSelectConversation(id);
      const idx = filtered.findIndex((c) => c.id === id);
      setFocusedIndex(idx >= 0 ? idx : null);
    },
    [onSelectConversation, filtered]
  );

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;
    const conversationToDelete = selectedConversation;
    setDeleteDialogOpen(false);
    setLoading(true);

    const original = localConversations;
    setLocalConversations((prev) => prev.filter((c) => c.id !== conversationToDelete.id));
    
    try {
      const response = await apiClient.deleteConversation(conversationToDelete.id);
      if (response.success) {
        toast({
          title: 'Conversation deleted',
          description: 'The conversation has been permanently deleted.',
        });
        // Pass the deleted conversation ID to parent
        onConversationDeleted(conversationToDelete.id);
      } else {
        throw new Error(response.message || 'Failed to delete conversation');
      }
    } catch (error: any) {
      setLocalConversations(original);
      toast({
        title: 'Failed to delete conversation',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSelectedConversation(null);
      setLoading(false);
    }
  };

  const handleArchiveConversation = async () => {
    if (!selectedConversation) return;
    setArchiveDialogOpen(false);
    setLoading(true);

    const original = localConversations;
    setLocalConversations((prev) => prev.map((c) => (c.id === selectedConversation.id ? { ...c, status: 'archived' } : c)));
    try {
      const response = await apiClient.updateConversationStatus(selectedConversation.id, 'archived');
      if (response.success) {
        toast({
          title: 'Conversation archived',
          description: 'The conversation has been moved to archives.',
        });
        onConversationArchived();
      } else {
        throw new Error(response.message || 'Failed to archive conversation');
      }
    } catch (error: any) {
      setLocalConversations(original);
      toast({
        title: 'Failed to archive conversation',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSelectedConversation(null);
      setLoading(false);
    }
  };

  const renderConversationRow = (conversation: Conversation, idx: number) => {
    const isActive = currentConversationId === conversation.id;
    const lastAt = conversation.last_message_at ? new Date(conversation.last_message_at) : null;
    const dateStr = lastAt ? lastAt.toLocaleDateString() : '';
    const timeStr = lastAt ? lastAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    return (
      <div
        key={conversation.id}
        data-conversation-item
        role="button"
        tabIndex={0}
        aria-selected={isActive}
        onClick={() => handleSelectConversation(conversation.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelectConversation(conversation.id);
          }
        }}
        onMouseEnter={() => setFocusedIndex(idx)}
        className={`group relative flex items-start gap-3 rounded-lg px-3 py-3 transition-all cursor-pointer focus:outline-none ${
          isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
        } ${focusedIndex === idx ? 'ring-2 ring-primary/30' : ''}`}
      >
        {/* Icon */}
        <div className="rounded-md p-2 bg-muted/20 flex items-center justify-center shrink-0 mt-0.5">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p
              className="text-sm font-medium break-words line-clamp-1 leading-snug"
              style={{ wordBreak: 'break-word' }}
            >
              {conversation.title || 'Untitled'}
            </p>
            {conversation.status === 'archived' && (
              <span className="text-xs text-muted-foreground shrink-0">Archived</span>
            )}
          </div>

          {/* Last message preview */}
          {conversation.last_message && (
            <p
              className="text-xs text-muted-foreground line-clamp-2 mb-1 leading-relaxed break-all"
              style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
            >
              {conversation.last_message}
            </p>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
            <span>{dateStr}</span>
            {timeStr && (
              <>
                <span>•</span>
                <span>{timeStr}</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            aria-label={`Open conversation ${conversation.title || 'Untitled'}`}
            onClick={(e) => {
              e.stopPropagation();
              handleSelectConversation(conversation.id);
            }}
            className="p-2 rounded-md hover:bg-muted/40 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-haspopup="menu"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedConversation(conversation);
                  setArchiveDialogOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Archive className="w-4 h-4" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedConversation(conversation);
                  setDeleteDialogOpen(true);
                }}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[480px] 2xl:max-w-[520px] border-r border-border bg-muted/30 flex flex-col h-full">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              aria-label="Search conversations"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-3 py-2 rounded-md bg-background/60 border border-border text-sm focus:ring-2 focus:ring-primary/30 outline-none"
            />
          </div>
        </div>

        <Button onClick={onNewSession} size="sm" className="ml-2 gap-2">
          <Plus className="w-4 h-4" />
          New
        </Button>
      </div>

      <ScrollArea className="flex-1" ref={listRef}>
        <div className="p-2 space-y-1">
          {loading ? (
            <>
              <Skeleton className="h-20 w-full rounded-md" />
              <Skeleton className="h-20 w-full rounded-md" />
              <Skeleton className="h-20 w-full rounded-md" />
            </>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {query ? 'No matching conversations' : 'No conversations found'}
            </div>
          ) : (
            filtered.map((conversation, idx) => renderConversationRow(conversation, idx))
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedConversation?.title || 'this conversation'}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Move <strong>{selectedConversation?.title || 'this conversation'}</strong> to archives. You can restore it later from your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveConversation}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};