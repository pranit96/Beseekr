// src/components/ConversationHistory.tsx
import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { Plus, MoreHorizontal, Archive, Trash2, Search } from 'lucide-react';
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
}

interface ConversationHistoryProps {
  conversations: Conversation[];
  onSelectConversation: (conversationId: string) => void;
  onNewSession: () => void;
  onConversationDeleted: (conversationId?: string) => void;
  onConversationArchived: () => void;
  currentConversationId?: string;
}

function relativeTime(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const ConversationRow = memo(({
  conversation,
  isActive,
  onClick,
  onArchive,
  onDelete,
  onMouseEnter,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onMouseEnter: () => void;
}) => (
  <div
    role="button"
    tabIndex={0}
    aria-selected={isActive}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
    }}
    className={`conv-row group ${isActive ? 'conv-row-active' : ''}`}
  >
    {/* Active accent bar */}
    <span className={`conv-accent-bar ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`} />

    <div className="flex-1 min-w-0 pl-3">
      <p className="text-[13px] font-medium text-foreground/85 truncate leading-snug group-hover:text-foreground transition-colors">
        {conversation.title || 'Untitled'}
      </p>
      {conversation.last_message && (
        <p className="text-[11px] text-muted-foreground/50 truncate mt-0.5 leading-snug">
          {conversation.last_message}
        </p>
      )}
      <p className="text-[10px] text-muted-foreground/35 mt-1">
        {relativeTime(conversation.last_message_at)}
      </p>
    </div>

    {/* Actions — appear on hover */}
    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pr-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1.5 rounded-md hover:bg-muted/60 transition-colors"
            onClick={(e) => e.stopPropagation()}
            aria-label="Conversation options"
          >
            <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground/60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(); }} className="gap-2 text-xs">
            <Archive className="w-3.5 h-3.5" /> Archive
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="gap-2 text-xs text-destructive focus:text-destructive">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
), (prev, next) =>
  prev.conversation.id === next.conversation.id &&
  prev.isActive === next.isActive &&
  prev.conversation.last_message_at === next.conversation.last_message_at &&
  prev.conversation.title === next.conversation.title
);
ConversationRow.displayName = 'ConversationRow';

export const ConversationHistory = memo(({
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

  useEffect(() => { setLocalConversations(conversations); }, [conversations]);

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
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex((p) => (p === null ? 0 : Math.min(p + 1, filtered.length - 1))); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIndex((p) => (p === null ? filtered.length - 1 : Math.max(p - 1, 0))); }
      else if (e.key === 'Enter' && focusedIndex !== null) { e.preventDefault(); const t = filtered[focusedIndex]; if (t) handleSelectConversation(t.id); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [filtered, focusedIndex]);

  useEffect(() => {
    if (focusedIndex === null || !listRef.current) return;
    const el = listRef.current.querySelectorAll('[data-conv-item]')[focusedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedIndex, filtered]);

  const handleSelectConversation = useCallback((id: string) => {
    onSelectConversation(id);
    const idx = filtered.findIndex((c) => c.id === id);
    setFocusedIndex(idx >= 0 ? idx : null);
  }, [onSelectConversation, filtered]);

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;
    const toDelete = selectedConversation;
    setDeleteDialogOpen(false);
    setLoading(true);
    const original = localConversations;
    setLocalConversations((prev) => prev.filter((c) => c.id !== toDelete.id));
    try {
      const res = await apiClient.deleteConversation(toDelete.id);
      if (res.success) {
        toast({ title: 'Deleted', duration: 2000 });
        onConversationDeleted(toDelete.id);
      } else throw new Error(res.message || 'Failed');
    } catch (err: any) {
      setLocalConversations(original);
      toast({ title: 'Failed to delete', description: err.message, variant: 'destructive' });
    } finally { setSelectedConversation(null); setLoading(false); }
  };

  const handleArchiveConversation = async () => {
    if (!selectedConversation) return;
    setArchiveDialogOpen(false);
    setLoading(true);
    const original = localConversations;
    setLocalConversations((prev) => prev.map((c) => c.id === selectedConversation.id ? { ...c, status: 'archived' } : c));
    try {
      const res = await apiClient.updateConversationStatus(selectedConversation.id, 'archived');
      if (res.success) { toast({ title: 'Archived', duration: 2000 }); onConversationArchived(); }
      else throw new Error(res.message || 'Failed');
    } catch (err: any) {
      setLocalConversations(original);
      toast({ title: 'Failed to archive', description: err.message, variant: 'destructive' });
    } finally { setSelectedConversation(null); setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full bg-background/60 backdrop-blur-sm">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40 select-none">
            Conversations
          </span>
          <button
            onClick={onNewSession}
            className="sidebar-new-btn"
            aria-label="New conversation"
          >
            <Plus className="w-3 h-3 mr-1" />
            New
          </button>
        </div>

        {/* Ghost search */}
        <div className="relative">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
          <input
            aria-label="Search conversations"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="sidebar-search"
          />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-4 space-y-0.5" ref={listRef}>
          {loading ? (
            <>
              <Skeleton className="h-14 w-full rounded-lg mb-1" />
              <Skeleton className="h-14 w-full rounded-lg mb-1" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-xs text-muted-foreground/40">
                {query ? 'No matches found' : 'No conversations yet'}
              </p>
            </div>
          ) : (
            filtered.map((conv, idx) => (
              <div key={conv.id} data-conv-item>
                <ConversationRow
                  conversation={conv}
                  isActive={currentConversationId === conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  onArchive={() => { setSelectedConversation(conv); setArchiveDialogOpen(true); }}
                  onDelete={() => { setSelectedConversation(conv); setDeleteDialogOpen(true); }}
                  onMouseEnter={() => setFocusedIndex(idx)}
                />
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{selectedConversation?.title || 'this conversation'}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConversation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Move <strong>{selectedConversation?.title || 'this conversation'}</strong> to archives?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveConversation}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});
ConversationHistory.displayName = 'ConversationHistory';