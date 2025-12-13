import { useState, useEffect } from 'react';
import { Download, Trash2, Archive, RotateCcw, Shield, Lock, Eye, Users, Server, Bell } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useConversations, useUpdateConversationStatus, useDeleteConversation } from '@/hooks/use-api-queries';
import { apiClient } from '@/lib/api';

interface ArchivedConversation {
  id: string;
  title: string;
  last_message_at: string;
  archived_at: string;
}

interface NotificationPreferences {
  email_weekly_digest: boolean;
  email_problem_alerts: boolean;
  email_product_updates: boolean;
  email_marketing: boolean;
}

const Profile = () => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    email_weekly_digest: true,
    email_problem_alerts: true,
    email_product_updates: false,
    email_marketing: false,
  });
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [savingNotification, setSavingNotification] = useState<string | null>(null);

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

  // Fetch notification preferences
  useEffect(() => {
    const fetchNotificationPrefs = async () => {
      try {
        const response = await apiClient.getNotificationPreferences();
        if (response.success && response.data) {
          setNotificationPrefs(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch notification preferences:', err);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotificationPrefs();
  }, []);

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

  // Handle notification toggle
  const handleNotificationToggle = async (key: keyof NotificationPreferences) => {
    const newValue = !notificationPrefs[key];
    setSavingNotification(key);

    // Optimistically update UI
    setNotificationPrefs(prev => ({ ...prev, [key]: newValue }));

    try {
      const response = await apiClient.updateNotificationPreferences({ [key]: newValue });
      if (response.success && response.data) {
        setNotificationPrefs(response.data);
        toast({
          title: 'Preferences updated',
          description: 'Your notification settings have been saved.',
        });
      }
    } catch (err) {
      // Revert on error
      setNotificationPrefs(prev => ({ ...prev, [key]: !newValue }));
      toast({
        title: 'Failed to update preferences',
        description: (err as any).message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingNotification(null);
    }
  };

  // Handle unsubscribe from all
  const handleUnsubscribeAll = async () => {
    setSavingNotification('all');
    const previousPrefs = { ...notificationPrefs };

    // Optimistically update all to false
    setNotificationPrefs({
      email_weekly_digest: false,
      email_problem_alerts: false,
      email_product_updates: false,
      email_marketing: false,
    });

    try {
      const response = await apiClient.updateNotificationPreferences({
        email_weekly_digest: false,
        email_problem_alerts: false,
        email_product_updates: false,
        email_marketing: false,
      });
      if (response.success && response.data) {
        setNotificationPrefs(response.data);
        toast({
          title: 'Unsubscribed from all',
          description: 'You will no longer receive any emails from us.',
        });
      }
    } catch (err) {
      // Revert on error
      setNotificationPrefs(previousPrefs);
      toast({
        title: 'Failed to update preferences',
        description: (err as any).message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingNotification(null);
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
    <div className="space-y-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Profile Settings
        </h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
          Manage your account, data, and privacy
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
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

        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6 glass">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Email Notifications</h2>
                <p className="text-sm text-muted-foreground">
                  Manage which emails you receive from us
                </p>
              </div>
            </div>

            {loadingNotifications ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading notification preferences...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium">Weekly Digest</div>
                    <div className="text-sm text-muted-foreground">
                      Receive a weekly summary of new problems and opportunities
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs.email_weekly_digest}
                    onCheckedChange={() => handleNotificationToggle('email_weekly_digest')}
                    disabled={savingNotification === 'email_weekly_digest'}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium">Problem Alerts</div>
                    <div className="text-sm text-muted-foreground">
                      Get notified when problems in your watchlist have updates
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs.email_problem_alerts}
                    onCheckedChange={() => handleNotificationToggle('email_problem_alerts')}
                    disabled={savingNotification === 'email_problem_alerts'}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium">Product Updates</div>
                    <div className="text-sm text-muted-foreground">
                      Receive news about new features and improvements
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs.email_product_updates}
                    onCheckedChange={() => handleNotificationToggle('email_product_updates')}
                    disabled={savingNotification === 'email_product_updates'}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium">Marketing Communications</div>
                    <div className="text-sm text-muted-foreground">
                      Receive tips, guides, and promotional content
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs.email_marketing}
                    onCheckedChange={() => handleNotificationToggle('email_marketing')}
                    disabled={savingNotification === 'email_marketing'}
                  />
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6 glass border-destructive/30">
            <h3 className="font-semibold mb-2">Unsubscribe from All</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Turn off all email notifications. You can also use the unsubscribe link at the bottom of any email.
            </p>
            <Button
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={handleUnsubscribeAll}
              disabled={savingNotification === 'all' || (
                !notificationPrefs.email_weekly_digest &&
                !notificationPrefs.email_problem_alerts &&
                !notificationPrefs.email_product_updates &&
                !notificationPrefs.email_marketing
              )}
            >
              {savingNotification === 'all' ? 'Unsubscribing...' : 'Unsubscribe from All Emails'}
            </Button>
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
                    <a href="mailto:hello@support.beseekr.com" className="text-primary hover:underline">
                      hello@support.beseekr.com
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
                      <a href="mailto:hello@support.beseekr.com" className="text-primary hover:underline">
                        hello@support.beseekr.com
                      </a>
                    </p>
                    <p>
                      <strong className="text-foreground">Support:</strong>{' '}
                      <a href="mailto:support@beseekr.com" className="text-primary hover:underline">
                        support@beseekr.com
                      </a>
                    </p>
                  </div>
                  <p className="text-xs mt-4">Last updated: December 13, 2025</p>
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
  );
};

export default Profile;