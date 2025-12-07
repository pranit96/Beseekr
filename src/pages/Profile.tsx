import { useState, useEffect } from 'react';
import { Download, Trash2, Archive, RotateCcw, Shield, Lock, Eye, Users, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { TopBar } from '@/components/TopBar';
import { useConversations, useUpdateConversationStatus, useDeleteConversation } from '@/hooks/use-api-queries';

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
  const { user, exportData, deleteAccount } = useAuth();
  const { toast } = useToast();

  // React Query hooks
  const { data: archivedResponse, isLoading: loadingArchived, error } = useConversations({
    status: 'archived',
    page: 1,
    limit: 50,
  });
  const updateStatusMutation = useUpdateConversationStatus();
  const deleteConversationMutation = useDeleteConversation();

  const archivedConversations = archivedResponse?.data || [];

  // Show error toast if query fails (only once)
  useEffect(() => {
    if (error) {
      toast({
        title: 'Failed to load archived conversations',
        description: (error as any).message,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `beseekr-data-export-${new Date().toISOString()}.json`;
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
    await updateStatusMutation.mutateAsync({ conversationId, status: 'active' });
  };

  const handleDeleteArchivedConversation = async (conversationId: string) => {
    await deleteConversationMutation.mutateAsync(conversationId);
  };

  return (
    <>
      <TopBar />
      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Manage your account, data, and privacy
          </p>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="data">Data & Archive</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4 glass text-center">
                <Lock className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-sm mb-1">End-to-End Encryption</h3>
                <p className="text-xs text-muted-foreground">
                  Your conversations are encrypted and secure
                </p>
              </Card>
              <Card className="p-4 glass text-center">
                <Eye className="w-8 h-8 text-accent mx-auto mb-3" />
                <h3 className="font-semibold text-sm mb-1">No Data Selling</h3>
                <p className="text-xs text-muted-foreground">
                  We never sell your personal information
                </p>
              </Card>
              <Card className="p-4 glass text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-sm mb-1">Your Control</h3>
                <p className="text-xs text-muted-foreground">
                  Export or delete your data anytime
                </p>
              </Card>
            </div>

            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                <Card className="p-6 glass">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                    <Server className="w-5 h-5 text-primary" />
                    Information We Collect
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Account Information</h3>
                      <p className="text-sm text-muted-foreground mb-2">When you create an account, we collect:</p>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                        <li>• Your name and email address</li>
                        <li>• Password (encrypted and never stored in plain text)</li>
                        <li>• Account preferences and settings</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Usage Data</h3>
                      <p className="text-sm text-muted-foreground mb-2">To improve our services, we collect:</p>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                        <li>• Conversation metadata (timestamps, agent interactions)</li>
                        <li>• Feature usage patterns</li>
                        <li>• Performance and error logs</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Conversation Content</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                        <li>• Encrypted in transit and at rest</li>
                        <li>• Used only to provide our services</li>
                        <li>• Never shared with third parties for marketing</li>
                      </ul>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 glass">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                    <Lock className="w-5 h-5 text-primary" />
                    How We Use Your Information
                  </h2>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      <strong className="text-foreground">Provide Services:</strong> We use your information to deliver and improve beseekr's features.
                    </p>
                    <p>
                      <strong className="text-foreground">Communication:</strong> We may send you service updates and security alerts. Marketing is opt-in only.
                    </p>
                    <p>
                      <strong className="text-foreground">Security:</strong> We monitor for suspicious activity to protect your account.
                    </p>
                    <p>
                      <strong className="text-foreground">Analytics:</strong> We analyze usage patterns to improve features. All data is anonymized.
                    </p>
                  </div>
                </Card>

                <Card className="p-6 glass">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-primary" />
                    Data Security
                  </h2>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>We implement industry-standard security measures:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• <strong className="text-foreground">Encryption:</strong> AES-256 at rest, TLS 1.3 in transit</li>
                      <li>• <strong className="text-foreground">Access Controls:</strong> Strict limits on data access</li>
                      <li>• <strong className="text-foreground">Regular Audits:</strong> Security audits and vulnerability assessments</li>
                      <li>• <strong className="text-foreground">Secure Infrastructure:</strong> Certified cloud platforms</li>
                    </ul>
                  </div>
                </Card>

                <Card className="p-6 glass">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" />
                    Your Rights and Choices
                  </h2>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>You have the following rights regarding your data:</p>
                    <ul className="space-y-2 ml-4">
                      <li><strong className="text-foreground">Access:</strong> Request a copy of all your data</li>
                      <li><strong className="text-foreground">Correction:</strong> Update your personal information</li>
                      <li><strong className="text-foreground">Deletion:</strong> Delete your account and all data permanently</li>
                      <li><strong className="text-foreground">Export:</strong> Download your data in portable format</li>
                    </ul>
                    <p className="mt-3">
                      To exercise these rights, use the Data & Archive tab or contact{' '}
                      <a href="mailto:privacy@beseekr.com" className="text-primary hover:underline">
                        privacy@beseekr.com
                      </a>
                    </p>
                  </div>
                </Card>

                <Card className="p-6 glass">
                  <h2 className="text-xl font-bold mb-4">Data Retention</h2>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>When you delete your account:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• Personal data is permanently deleted within 30 days</li>
                      <li>• Anonymized analytics may be retained for improvements</li>
                      <li>• Backup copies are purged within 90 days</li>
                    </ul>
                  </div>
                </Card>

                <Card className="p-6 glass">
                  <h2 className="text-xl font-bold mb-4">Third-Party Services</h2>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>We use select third-party services:</p>
                    <ul className="space-y-1 ml-4">
                      <li><strong className="text-foreground">AI Providers:</strong> OpenAI and Anthropic (data processing agreements in place)</li>
                      <li><strong className="text-foreground">Cloud Hosting:</strong> Secure infrastructure providers</li>
                      <li><strong className="text-foreground">Analytics:</strong> Privacy-focused tools (no personal data shared)</li>
                    </ul>
                  </div>
                </Card>

                <Card className="p-6 glass">
                  <h2 className="text-xl font-bold mb-4">Contact Us</h2>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>Questions about this Privacy Policy?</p>
                    <div className="space-y-1">
                      <p>
                        <strong className="text-foreground">Email:</strong>{' '}
                        <a href="mailto:privacy@beseekr.com" className="text-primary hover:underline">
                          privacy@beseekr.com
                        </a>
                      </p>
                      <p>
                        <strong className="text-foreground">Support:</strong>{' '}
                        <a href="mailto:support@beseekr.com" className="text-primary hover:underline">
                          support@beseekr.com
                        </a>
                      </p>
                    </div>
                    <p className="text-xs mt-4">Last updated: October 14, 2024</p>
                  </div>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

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
    </>
  );
};

export default Profile;