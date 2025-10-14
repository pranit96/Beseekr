// src/components/ConversationHistory.tsx
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  MessageSquare,
  Plus,
  Archive,
  Trash2,
  Search,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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

type MessagePreview = {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  created_at?: string;
};

interface Conversation {
  id: string;
  title: string;
  last_message_at?: string;
  last_message?: MessagePreview;
  status: 'active' | 'archived';
  metadata?: {
    orchestration_mode?: string;
    agent_ids?: string[];
  };
}

interface ConversationHistoryProps {
  conversations: Conversation[];
  onSelectConversation: (conversationId: string) => void;
  onNewSession: () => void;
  onConversationDeleted: () => void;
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

  // Search both title and last message content
  const filtered = useMemo(() => {
    if (!query.trim()) return localConversations;
    const q = query.trim().toLowerCase();
    return localConversations.filter((c) => {
      const title = (c.title || 'untitled').toLowerCase();
      const lastContent = (c.last_message?.content || '').toLowerCase();
      return title.includes(q) || lastContent.includes(q);
    });
  }, [localConversations, query]);

  // --- handleSelectConversation must be declared before the keydown effect ---
  const handleSelectConversation = useCallback(
    (id: string) => {
      onSelectConversation(id);
      const idx = filtered.findIndex((c) => c.id === id);
      setFocusedIndex(idx >= 0 ? idx : null);
    },
    [onSelectConversation, filtered]
  );

  // Keyboard navigation: arrow up/down + enter to select
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!filtered.length) return;
      const activeTag = document.activeElement?.tagName;
      if (activeTag && (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || (document.activeElement as HTMLElement).isContentEditable)) return;

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
  }, [filtered, focusedIndex, handleSelectConversation]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex === null || !listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-conversation-item]');
    const el = items[focusedIndex] as HTMLElement | undefined;
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedIndex, filtered]);

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;
    setDeleteDialogOpen(false);
    setLoading(true);

    const original = localConversations;
    setLocalConversations((prev) => prev.filter((c) => c.id !== selectedConversation.id));
    try {
      const response = await apiClient.deleteConversation(selectedConversation.id);
      if (response.success) {
        toast({
          title: 'Conversation deleted',
          description: 'The conversation has been permanently deleted.',
        });
        onConversationDeleted();
      } else {
        throw new Error(response.error || response.message || 'Failed to delete conversation');
      }
    } catch (error: any) {
      setLocalConversations(original);
      toast({
        title: 'Failed to delete conversation',
        description: error.message || String(error),
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
        throw new Error(response.error || response.message || 'Failed to archive conversation');
      }
    } catch (error: any) {
      setLocalConversations(original);
      toast({
        title: 'Failed to archive conversation',
        description: error.message || String(error),
        variant: 'destructive',
      });
    } finally {
      setSelectedConversation(null);
      setLoading(false);
    }
  };

  const snippetFor = (conv: Conversation, max = 80) => {
    const content = conv.last_message?.content?.trim() || '';
    if (!content) return 'No messages yet';
    const truncated = content.length > max ? content.slice(0, max - 1).trim() + '…' : content;
    const role = conv.last_message?.role;
    const prefix = role === 'user' ? 'You: ' : role === 'assistant' ? 'AI: ' : '';
    return prefix + truncated;
  };

  const renderConversationRow = (conversation: Conversation, idx: number) => {
    const isActive = currentConversationId === conversation.id;
    const lastAt = conversation.last_message_at || conversation.last_message?.created_at;
    const date = lastAt ? new Date(lastAt) : null;
    const subtitle = snippetFor(conversation, 80);

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
        className={`group relative flex items-start gap-3 rounded-lg px-3 py-3 transition-smooth cursor-pointer focus:outline-none ${
          isActive ? 'bg-muted border border-border' : 'hover:bg-muted/50'
        } ${focusedIndex === idx ? 'ring-2 ring-primary/30' : ''}`}
      >
        {/* left icon */}
        <div className="rounded-md p-2 bg-muted/20 flex items-center justify-center shrink-0 mt-1">
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* middle: title + subtitle (constrain title height) */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-start justify-between gap-2 min-w-0">
            {/* Title: clamp to 2 lines so row doesn't expand */}
            <p
              className="text-sm font-medium leading-tight flex-1 min-w-0"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                wordBreak: 'break-word',
              }}
            >
              {conversation.title || 'Untitled'}
            </p>

            <span className="text-xs text-muted-foreground shrink-0 ml-2 mt-0.5">
              {date ? date.toLocaleDateString() : ''}
            </span>
          </div>

          <p className="text-xs text-muted-foreground truncate mt-1">{subtitle}</p>
        </div>

        {/* right: actions (archive + delete + open) — small buttons that won't grow the row */}
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <button
            aria-label={`Open conversation ${conversation.title || 'Untitled'}`}
            onClick={(e) => {
              e.stopPropagation();
              handleSelectConversation(conversation.id);
            }}
            className="p-2 rounded-md hover:bg-muted/40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Archive button (visible) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedConversation(conversation);
              setArchiveDialogOpen(true);
            }}
            title="Archive conversation"
            className="p-2 rounded-md hover:bg-muted/40"
            aria-label="Archive conversation"
          >
            <Archive className="w-4 h-4" />
          </button>

          {/* Delete button (visible) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedConversation(conversation);
              setDeleteDialogOpen(true);
            }}
            title="Delete conversation"
            className="p-2 rounded-md hover:bg-muted/40"
            aria-label="Delete conversation"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
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
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No conversations found
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
