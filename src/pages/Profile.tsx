import { useState, useEffect } from 'react';
import { Download, Trash2, Archive, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface ArchivedConversation {
  id: string;
  title: string;
  last_message_at: string;
  archived_at: string;
}

const Profile = () => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [archivedConversations, setArchivedConversations] = useState<ArchivedConversation[]>([]);
  const [loadingArchived, setLoadingArchived] = useState(true);
  const { user, exportData, deleteAccount } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchArchivedConversations();
  }, []);

  const fetchArchivedConversations = async () => {
    try {
      const response = await apiClient.getConversations({ 
        status: 'archived',
        page: 1,
        limit: 50 
      });
      
      if (response.success && response.data) {
        setArchivedConversations(response.data);
      } else {
        throw new Error(response.message || 'Failed to load archived conversations');
      }
    } catch (error: any) {
      toast({
        title: 'Failed to load archived conversations',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingArchived(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agentflow-data-export-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Data exported',
        description: 'Your data has been downloaded successfully.',
      });
    } catch (error) {
      // Error handled in context
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmEmail !== user?.email) {
      toast({
        title: 'Email mismatch',
        description: 'Please enter your email correctly to confirm deletion.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await deleteAccount(confirmEmail);
    } catch (error) {
      // Error handled in context
    }
  };

  const handleRestoreConversation = async (conversationId: string) => {
    try {
      const response = await apiClient.updateConversationStatus(conversationId, 'active');
      if (response.success) {
        setArchivedConversations(prev => 
          prev.filter(conv => conv.id !== conversationId)
        );
        toast({
          title: 'Conversation restored',
          description: 'The conversation has been restored to active list.',
        });
      } else {
        throw new Error(response.message || 'Failed to restore conversation');
      }
    } catch (error: any) {
      toast({
        title: 'Failed to restore conversation',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteArchivedConversation = async (conversationId: string) => {
    try {
      const response = await apiClient.deleteConversation(conversationId);
      if (response.success) {
        setArchivedConversations(prev => 
          prev.filter(conv => conv.id !== conversationId)
        );
        toast({
          title: 'Conversation deleted',
          description: 'The archived conversation has been permanently deleted.',
        });
      } else {
        throw new Error(response.message || 'Failed to delete conversation');
      }
    } catch (error: any) {
      toast({
        title: 'Failed to delete conversation',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Profile Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and data
        </p>
      </div>

      <div className="space-y-6">
        <Card className="p-6 glass">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Name</div>
              <div className="font-medium">{user?.full_name || 'Not set'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{user?.email}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass">
          <h2 className="text-xl font-semibold mb-4">Archived Conversations</h2>
          <ScrollArea className="h-64">
            {loadingArchived ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading archived conversations...
              </div>
            ) : archivedConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No archived conversations
              </div>
            ) : (
              <div className="space-y-2">
                {archivedConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {conversation.title || 'Untitled Conversation'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last active: {new Date(conversation.last_message_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={() => handleRestoreConversation(conversation.id)}
                        variant="outline"
                        size="sm"
                        className="h-8 gap-2"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restore
                      </Button>
                      <Button
                        onClick={() => handleDeleteArchivedConversation(conversation.id)}
                        variant="destructive"
                        size="sm"
                        className="h-8 gap-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        <Card className="p-6 glass">
          <h2 className="text-xl font-semibold mb-4">Data Management</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Export Your Data</div>
                <div className="text-sm text-muted-foreground">
                  Download all your data in JSON format
                </div>
              </div>
              <Button
                onClick={handleExportData}
                disabled={isExporting}
                variant="outline"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass border-destructive/50">
          <h2 className="text-xl font-semibold mb-4 text-destructive">Danger Zone</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Delete Account</div>
                <div className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </div>
              </div>
              <Button
                onClick={() => setIsDeleteDialogOpen(true)}
                variant="destructive"
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All your agents, conversations, and data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="confirm-email">Confirm your email to proceed</Label>
            <Input
              id="confirm-email"
              type="email"
              placeholder={user?.email}
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmEmail('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;