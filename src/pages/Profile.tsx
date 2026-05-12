import { useState, useEffect } from "react";
import {
  User,
  Shield,
  Bell,
  Database,
  Palette,
  Laptop,
  Smartphone,
  Trash2,
  Download,
  RotateCcw,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { Navigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  useConversations,
  useUpdateConversationStatus,
  useDeleteConversation,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/use-api-queries";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { ChangePasswordDialog } from "@/components/profile/ChangePasswordDialog";
import { TwoFactorSection } from "@/components/profile/TwoFactorSection";
import { SessionsSection } from "@/components/profile/SessionsSection";
import { AvatarPicker } from "@/components/profile/AvatarPicker";

const SIDEBAR_NAV = [
  { id: "general", label: "General", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "data", label: "Data & Privacy", icon: Database },
];

interface NotificationPreferences {
  email_weekly_digest: boolean;
  email_problem_alerts: boolean;
  email_product_updates: boolean;
  email_marketing: boolean;
}

export default function Profile() {
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return SIDEBAR_NAV.some((item) => item.id === hash) ? hash : "general";
  });

  // States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [savingNotification, setSavingNotification] = useState<string | null>(
    null,
  );
  const [fullName, setFullName] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Real UI features
  const { theme, setTheme } = useTheme();

  const { t, i18n } = useTranslation();

  const [timezone, setTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      return "UTC";
    }
  });
  const [language, setLanguage] = useState(i18n.resolvedLanguage || i18n.language || "en");

  const { user, loading, exportData, deleteAccount, refreshAuth } = useAuth();

  useEffect(() => {
    if (user?.timezone) setTimezone(user.timezone);
    // Only overwrite language if backend explicitly differs from active resolved language
    if (user?.language && user.language !== language) {
      setLanguage(user.language);
    }
  }, [user?.timezone, user?.language]);

  const { toast } = useToast();

  useEffect(() => {
    if (user?.full_name || user?.name) {
      setFullName(user.full_name || user?.name || "");
    }
    if ((user as any)?.avatar) setAvatarUrl((user as any).avatar);
  }, [user]);

  // React Query hooks
  const {
    data: archivedResponse,
    isLoading: loadingArchived,
    error,
  } = useConversations({
    status: "archived",
    page: 1,
    limit: 50,
  });
  const updateStatusMutation = useUpdateConversationStatus();
  const deleteConversationMutation = useDeleteConversation();

  const archivedConversations = archivedResponse?.data || [];

  const { data: notificationPrefsData, isLoading: loadingNotifications } =
    useNotificationPreferences();

  const updateNotificationMutation = useUpdateNotificationPreferences();

  // Default values to use before data is loaded
  const notificationPrefs = notificationPrefsData || {
    email_weekly_digest: true,
    email_problem_alerts: true,
    email_product_updates: false,
    email_marketing: false,
  };

  useEffect(() => {
    if (error) {
      toast({
        title: "Failed to load archived conversations",
        description: (error as any).message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      const payload: any = { full_name: fullName };
      if (timezone !== user?.timezone) payload.timezone = timezone;
      if (language !== (user?.language || "en")) payload.language = language;

      const response = await apiClient.updateProfile(payload);
      if (response.success) {
        if (payload.language) {
          i18n.changeLanguage(payload.language);
        }
        toast({
          title: "Profile updated",
          description: "Your profile information has been saved.",
        });
        refreshAuth(true);
      }
    } catch (err) {
      toast({
        title: "Failed to update profile",
        description: (err as any).message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleNotificationToggle = async (
    key: keyof NotificationPreferences,
  ) => {
    const newValue = !notificationPrefs[key];
    setSavingNotification(key);

    updateNotificationMutation.mutate(
      { [key]: newValue },
      {
        onSettled: () => setSavingNotification(null),
      },
    );
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your data has been downloaded successfully.",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmEmail !== user?.email) {
      toast({
        title: "Email mismatch",
        description: "Please enter your email correctly to confirm deletion.",
        variant: "destructive",
      });
      return;
    }
    try {
      await deleteAccount(confirmEmail);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRestoreConversation = async (conversationId: string) => {
    await updateStatusMutation.mutateAsync({
      conversationId,
      status: "active",
    });
  };

  const handleDeleteArchivedConversation = async (conversationId: string) => {
    await deleteConversationMutation.mutateAsync(conversationId);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-xl font-medium text-foreground">
                {t("profile.profileInformation")}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("profile.manageDetails")}
              </p>
            </div>

            <AvatarPicker
              currentAvatar={avatarUrl}
              userInitial={user?.full_name?.charAt(0) || user?.email?.charAt(0)}
              onAvatarChange={(url) => setAvatarUrl(url)}
            />

            <Separator />

            <div className="grid gap-6 max-w-xl">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("profile.fullName")}</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("profile.emailAddress")}</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted/30"
                />
                <p className="text-xs text-muted-foreground">
                  To change your email, please contact support.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("profile.language")}</Label>
                  <Select
                    value={language}
                    onValueChange={(val) => setLanguage(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={timezone}
                    onValueChange={(val) => setTimezone(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">
                        UTC (Coordinated Universal Time)
                      </SelectItem>
                      <SelectItem value="America/New_York">
                        Eastern Time (US & Canada)
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        Pacific Time (US & Canada)
                      </SelectItem>
                      <SelectItem value="Asia/Kolkata">
                        India Standard Time
                      </SelectItem>
                      {/* If the user's real timezone isn't one of the above, make sure it's selectable */}
                      {timezone &&
                        ![
                          "utc",
                          "America/New_York",
                          "America/Los_Angeles",
                          "Asia/Kolkata",
                        ].includes(timezone) && (
                          <SelectItem value={timezone}>{timezone}</SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleUpdateProfile}
                disabled={
                  isUpdatingProfile ||
                  (fullName === user?.full_name &&
                    timezone === (user?.timezone || timezone) &&
                    language === (user?.language || "en"))
                }
              >
                {isUpdatingProfile
                  ? t("profile.savingChanges")
                  : t("profile.saveChanges")}
              </Button>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-xl font-medium text-foreground">
                Security Settings
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your password, sessions and two-factor authentication.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Password</h3>
              <div className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-medium">Account Password</div>
                  <p className="text-sm text-muted-foreground">
                    Change the password you use to sign in.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowChangePassword(true)}
                >
                  Change Password
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium">Two-Factor Authentication</h3>
              <TwoFactorSection />
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium">Active Sessions</h3>
              <p className="text-sm text-muted-foreground">
                Devices currently signed into your account. Revoke any session
                you don&apos;t recognize.
              </p>
              <SessionsSection />
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-xl font-medium text-foreground">
                Email Notifications
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choose what emails you'd like to receive from us.
              </p>
            </div>

            {loadingNotifications ? (
              <div className="py-8 text-muted-foreground animate-pulse">
                Loading preferences...
              </div>
            ) : (
              <div className="rounded-xl border divide-y">
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1 pr-4">
                    <div className="font-medium">Weekly Digest</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Receive a weekly summary of new activities and updates.
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs.email_weekly_digest}
                    onCheckedChange={() =>
                      handleNotificationToggle("email_weekly_digest")
                    }
                    disabled={savingNotification === "email_weekly_digest"}
                  />
                </div>

                <div className="flex items-center justify-between p-4">
                  <div className="flex-1 pr-4">
                    <div className="font-medium">Problem Alerts</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Get notified instantly when there are critical alerts.
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs.email_problem_alerts}
                    onCheckedChange={() =>
                      handleNotificationToggle("email_problem_alerts")
                    }
                    disabled={savingNotification === "email_problem_alerts"}
                  />
                </div>

                <div className="flex items-center justify-between p-4">
                  <div className="flex-1 pr-4">
                    <div className="font-medium">Product Updates</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      News about new features, improvements, and changes.
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs.email_product_updates}
                    onCheckedChange={() =>
                      handleNotificationToggle("email_product_updates")
                    }
                    disabled={savingNotification === "email_product_updates"}
                  />
                </div>

                <div className="flex items-center justify-between p-4">
                  <div className="flex-1 pr-4">
                    <div className="font-medium">Marketing Communications</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Receive tips, guides, and promotional content.
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs.email_marketing}
                    onCheckedChange={() =>
                      handleNotificationToggle("email_marketing")
                    }
                    disabled={savingNotification === "email_marketing"}
                  />
                </div>
              </div>
            )}
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-xl font-medium text-foreground">
                Appearance
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Customize how the application looks and feels.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Theme Preferences</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all ${theme === "light" ? "border-primary bg-primary/5" : "border-transparent hover:border-border bg-muted/30"}`}
                >
                  <div className="w-full h-24 rounded-md bg-white border shadow-sm mb-2 p-2 flex flex-col gap-2">
                    <div className="h-2 w-1/3 bg-slate-200 rounded"></div>
                    <div className="h-2 w-full bg-slate-100 rounded"></div>
                    <div className="h-2 w-2/3 bg-slate-100 rounded"></div>
                  </div>
                  <span className="font-medium text-sm">Light Mode</span>
                </button>

                <button
                  onClick={() => setTheme("dark")}
                  className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all ${theme === "dark" ? "border-primary bg-primary/5" : "border-transparent hover:border-border bg-muted/30"}`}
                >
                  <div className="w-full h-24 rounded-md bg-slate-950 border border-slate-800 shadow-sm mb-2 p-2 flex flex-col gap-2">
                    <div className="h-2 w-1/3 bg-slate-700 rounded"></div>
                    <div className="h-2 w-full bg-slate-800 rounded"></div>
                    <div className="h-2 w-2/3 bg-slate-800 rounded"></div>
                  </div>
                  <span className="font-medium text-sm">Dark Mode</span>
                </button>

                <button
                  onClick={() => setTheme("system")}
                  className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all ${theme === "system" ? "border-primary bg-primary/5" : "border-transparent hover:border-border bg-muted/30"}`}
                >
                  <div className="w-full h-24 rounded-md bg-gradient-to-r from-white to-slate-950 border shadow-sm mb-2 p-2 flex flex-col gap-2">
                    <div className="h-2 w-1/3 bg-slate-400 rounded opacity-50"></div>
                    <div className="h-2 w-full bg-slate-400 rounded opacity-50"></div>
                    <div className="h-2 w-2/3 bg-slate-400 rounded opacity-50"></div>
                  </div>
                  <span className="font-medium text-sm">System Default</span>
                </button>
              </div>
            </div>
          </div>
        );

      case "data":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-xl font-medium text-foreground">
                Data & Privacy
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your data footprint and archived information.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Export Data</h3>
              <div className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Download a copy of your personal data, including all
                    settings and conversations.
                  </div>
                </div>
                <Button
                  onClick={handleExportData}
                  disabled={isExporting}
                  variant="outline"
                  className="gap-2 whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? "Exporting..." : "Request Export"}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium">Archived Items</h3>
              <div className="rounded-xl border overflow-hidden">
                <ScrollArea className="h-64">
                  {loadingArchived ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Loading archives...
                    </div>
                  ) : archivedConversations.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                      <Database className="w-8 h-8 mb-3 opacity-20" />
                      <p className="text-sm">No archived conversations</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {archivedConversations.map((conversation: any) => (
                        <div
                          key={conversation.id}
                          className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-sm font-medium truncate">
                              {conversation.title || "Untitled Conversation"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Last active:{" "}
                              {new Date(
                                conversation.last_message_at,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() =>
                                handleRestoreConversation(conversation.id)
                              }
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() =>
                                handleDeleteArchivedConversation(
                                  conversation.id,
                                )
                              }
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium text-destructive">Danger Zone</h3>
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-medium text-destructive flex items-center gap-2">
                    Delete Account
                  </div>
                  <p className="text-sm text-destructive/80">
                    Permanently delete your account and all associated data.
                    This action is irreversible.
                  </p>
                </div>
                <Button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  variant="destructive"
                  className="gap-2 whitespace-nowrap"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8 h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {t("profile.settings")}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t("profile.manageAccount")}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12 flex-1 min-h-0">
        {/* Sidebar Navigation */}
        <aside className="md:w-64 flex-shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-4 md:pb-0 hide-scrollbar">
            {SIDEBAR_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    window.location.hash = item.id;
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${isActive ? "text-primary" : "opacity-70"}`}
                  />
                  {t(`profile.${item.id}`, item.label)}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto pr-2 pb-8">
          {renderContent()}
        </main>
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All your data, settings, and history
              will be permanently deleted from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-3">
            <Label htmlFor="confirm-email">
              Please type your email to confirm
            </Label>
            <Input
              id="confirm-email"
              type="email"
              placeholder={user?.email}
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className="font-mono"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmEmail("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={confirmEmail !== user?.email}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm Deletion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ChangePasswordDialog
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
      />
    </div>
  );
}
