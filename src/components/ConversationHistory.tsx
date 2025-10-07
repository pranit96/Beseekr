//conversasation history componant
import { useState, useEffect } from 'react';
import { MessageSquare, Plus, MoreVertical, Archive, Trash2 } from 'lucide-react';
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

interface Conversation {
  id: string;
  title: string;
  last_message_at: string;
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
  conversations,
  onSelectConversation,
  onNewSession,
  onConversationDeleted,
  onConversationArchived,
  currentConversationId,
}: ConversationHistoryProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const { toast } = useToast();

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;

    try {
      const response = await apiClient.deleteConversation(selectedConversation.id);
      if (response.success) {
        toast({
          title: 'Conversation deleted',
          description: 'The conversation has been permanently deleted.',
        });
        onConversationDeleted();
      } else {
        throw new Error(response.message || 'Failed to delete conversation');
      }
    } catch (error: any) {
      toast({
        title: 'Failed to delete conversation',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedConversation(null);
    }
  };

  const handleArchiveConversation = async () => {
    if (!selectedConversation) return;

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
      toast({
        title: 'Failed to archive conversation',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setArchiveDialogOpen(false);
      setSelectedConversation(null);
    }
  };

  return (
    <div className="w-80 border-r border-border bg-muted/30 flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <Button
          onClick={onNewSession}
          className="w-full gap-2"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          New Session
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group relative flex items-center rounded-lg hover:bg-muted/50 transition-smooth ${
                  currentConversationId === conversation.id
                    ? 'bg-muted border border-border'
                    : ''
                }`}
              >
                <button
                  onClick={() => onSelectConversation(conversation.id)}
                  className="flex-1 text-left p-3"
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {conversation.title || 'Untitled'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conversation.last_message_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 mr-2"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedConversation(conversation);
                        setArchiveDialogOpen(true);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedConversation(conversation);
                        setDeleteDialogOpen(true);
                      }}
                      className="flex items-center gap-2 text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone and all messages will be permanently lost.
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
              This conversation will be moved to archives. You can restore it later from your profile page.
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