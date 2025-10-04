import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Trash2, Download, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Profile = () => {
  const { toast } = useToast();

  const handleLogout = () => {
    toast({ title: 'Logged out successfully' });
  };

  const handleDeleteData = () => {
    toast({
      title: 'All data deleted',
      description: 'Your conversation history has been cleared',
    });
  };

  const handleExportData = () => {
    toast({
      title: 'Export started',
      description: 'Your data is being prepared for download',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and preferences
          </p>
        </div>

        <Card className="p-8 glass shadow-soft space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">User Profile</h2>
              <p className="text-sm text-muted-foreground">
                user@example.com
              </p>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="font-medium">Account Actions</h3>

            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleExportData}
            >
              <Download className="w-4 h-4" />
              Export All Data
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your conversation history and
                    custom agents. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteData}>
                    Delete Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-medium mb-2">Accessibility</h3>
            <p className="text-sm text-muted-foreground">
              This interface is optimized for screen readers and keyboard
              navigation. Press Tab to navigate, Enter to select, and Escape to
              close dialogs.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
