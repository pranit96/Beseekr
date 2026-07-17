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
  Loader2,
  AlignLeft,
  BookOpen,
  Smile,
} from "lucide-react";
import { Navigate } from "react-router-dom";

const STYLE_OPTIONS = [
  {
    key: "bullets" as const,
    label: "Bullet Points",
    description: "Tight, scannable summaries. Perfect for busy mornings.",
    icon: AlignLeft,
    color: "border-blue-500/40 bg-blue-500/5 text-blue-400 hover:border-blue-500/60",
  },
  {
    key: "narrative" as const,
    label: "Narrative",
    description: "Flowing paragraphs — like a friend explaining the week.",
    icon: BookOpen,
    color: "border-violet-500/40 bg-violet-500/5 text-violet-400 hover:border-violet-500/60",
  },
  {
    key: "eli5" as const,
    label: "ELI5",
    description: "Explain Like I'm Five. Simple, fun, and delightful.",
    icon: Smile,
    color: "border-amber-500/40 bg-amber-500/5 text-amber-400 hover:border-amber-500/60",
  },
];

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
  notify_budget_reminders: boolean;
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

  const [detectedTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      return "UTC";
    }
  });
  const [detectedLang] = useState(
    i18n.resolvedLanguage || i18n.language || "en",
  );

  const [timezone, setTimezone] = useState(detectedTimezone);
  const [language, setLanguage] = useState(detectedLang);
  const [preferredCurrency, setPreferredCurrency] = useState("USD");

  const { user, loading, exportData, deleteAccount, refreshAuth } = useAuth();

  useEffect(() => {
    if (user?.timezone) setTimezone(user.timezone);
    if (user?.language) setLanguage(user.language);
    if (user?.preferred_currency) setPreferredCurrency(user.preferred_currency);
  }, [user?.timezone, user?.language, user?.preferred_currency]);

  const { toast } = useToast();

  useEffect(() => {
    setFullName(user?.full_name || user?.name || "");
    setAvatarUrl(user?.avatar || null);
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

  const archivedData = archivedResponse?.data as any;
  const archivedConversations = Array.isArray(archivedData)
    ? archivedData
    : archivedData?.conversations || [];

  const { data: notificationPrefsData, isLoading: loadingNotifications } =
    useNotificationPreferences();

    const updateNotificationMutation = useUpdateNotificationPreferences();

  // Weekly Digest Preferences States
  const [digestEmail, setDigestEmail] = useState("");
  const [digestStyle, setDigestStyle] = useState<"bullets" | "narrative" | "eli5">("bullets");
  const [digestEnabled, setDigestEnabled] = useState(false);
  const [loadingDigestPrefs, setLoadingDigestPrefs] = useState(false);
  const [savingDigestPrefs, setSavingDigestPrefs] = useState(false);

  // Sync digest preferences on mount
  useEffect(() => {
    const fetchDigestPrefs = async () => {
      setLoadingDigestPrefs(true);
      try {
        const res = await apiClient.getDigestPreferences();
        if (res.success && res.data) {
          setDigestEmail(res.data.email || user?.email || "");
          setDigestStyle(res.data.style || "bullets");
          setDigestEnabled(res.data.enabled ?? false);
        } else {
          setDigestEmail(user?.email || "");
        }
      } catch (err) {
        console.error("Failed to load digest preferences:", err);
      } finally {
        setLoadingDigestPrefs(false);
      }
    };

    if (user) {
      fetchDigestPrefs();
    }
  }, [user]);

  const handleSaveDigestPrefs = async () => {
    if (!digestEmail.trim()) {
      return toast({
        title: "Validation error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
    }

    setSavingDigestPrefs(true);
    try {
      // 1. Save digest preferences
      const res = await apiClient.upsertDigestPreferences({
        email: digestEmail.trim(),
        style: digestStyle,
        enabled: digestEnabled,
      });

      if (res.success && res.data) {
        // 2. Sync to notifications panel in profiles table
        if (notificationPrefs.email_weekly_digest !== digestEnabled) {
          await updateNotificationMutation.mutateAsync({
            email_weekly_digest: digestEnabled
          });
        }
        
        toast({
          title: "Digest preferences updated",
          description: "Your weekly digest delivery settings have been saved.",
        });
      } else {
        throw new Error(res.error || "Failed to save digest preferences");
      }
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingDigestPrefs(false);
    }
  };

  // Default values to use before data is loaded
  const notificationPrefs = (notificationPrefsData as any) || {
    email_weekly_digest: false,
    email_problem_alerts: true,
    email_product_updates: false,
    email_marketing: false,
    notify_budget_reminders: false,
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
      const payload: any = {};

      if (fullName !== (user?.full_name || user?.name || "")) {
        payload.full_name = fullName;
      }

      const baselineAvatar = user?.avatar || null;
      // No longer adding avatar_url to explicit batch save, as it auto-saves backgrounded now.
      // This maintains clean stateless segregation between simple form fields and cloud assets.

      const baselineTz = user?.timezone || detectedTimezone;
      if (timezone !== baselineTz) {
        payload.timezone = timezone;
      }

      const baselineLang = user?.language || detectedLang;
      if (language !== baselineLang) {
        payload.language = language;
      }

      const baselineCurrency = user?.preferred_currency || "USD";
      if (preferredCurrency !== baselineCurrency) {
        payload.preferred_currency = preferredCurrency;
      }

      if (Object.keys(payload).length === 0) {
        // Nothing changed, skip network request
        setIsUpdatingProfile(false);
        return;
      }

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

  const handleAvatarUpdate = async (url: string | null) => {
    // 1. Instant Optimistic UI
    setAvatarUrl(url);

    // 2. Immediate Background Network Save
    try {
      const response = await apiClient.updateProfile({ avatar_url: url });
      if (response.success) {
        refreshAuth(true); // Keep global layout headers in sync instantly
        toast({
          title: url ? "Picture updated" : "Picture removed",
          description: url
            ? "Your profile picture is active."
            : "Your profile picture has been cleared.",
        });
      }
    } catch (e: any) {
      toast({
        title: "Failed to update photo",
        description: e.message || "Could not sync with database.",
        variant: "destructive",
      });
      // Revert optimistic UI on hard error
      setAvatarUrl(user?.avatar || null);
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
        onSuccess: async () => {
          if (key === "email_weekly_digest") {
            setDigestEnabled(newValue);
            await apiClient.upsertDigestPreferences({
              email: digestEmail || user?.email || "",
              style: digestStyle,
              enabled: newValue
            }).catch(err => console.error("Failed to sync digest preference:", err));
          }
        },
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
              onAvatarChange={handleAvatarUpdate}
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

              <div className="grid grid-cols-3 gap-4">
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
                      <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                      <SelectItem value="ja">日本語 (Japanese)</SelectItem>
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
                <div className="space-y-2">
                  <Label>Preferred Currency</Label>
                  <Select
                    value={preferredCurrency}
                    onValueChange={(val) => setPreferredCurrency(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD (CA$)</SelectItem>
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
                  (fullName === (user?.full_name || user?.name || "") &&
                    avatarUrl === (user?.avatar || null) &&
                    timezone === (user?.timezone || detectedTimezone) &&
                    language === (user?.language || detectedLang) &&
                    preferredCurrency === (user?.preferred_currency || "USD"))
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

                <div className="flex items-center justify-between p-4">
                  <div className="flex-1 pr-4">
                    <div className="font-medium">Monthly Budget Reminders</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Receive email summaries and reminders for budget data
                      collection.
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs.notify_budget_reminders}
                    onCheckedChange={() =>
                      handleNotificationToggle("notify_budget_reminders")
                    }
                    disabled={savingNotification === "notify_budget_reminders"}
                  />
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-border/40">
              <h2 className="text-lg font-medium text-foreground">
                Weekly Personal Digest Configurations
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure your newsletter delivery email, layout design, and summary style.
              </p>
            </div>

            {loadingDigestPrefs ? (
              <div className="py-8 text-muted-foreground animate-pulse">
                Loading digest preferences...
              </div>
            ) : (
              <div className="rounded-xl border p-6 space-y-6 bg-muted/5">
                {/* Enable Switch */}
                <div className="flex items-center justify-between pb-4 border-b border-border/40">
                  <div>
                    <div className="font-medium text-sm">Weekly Digest Dispatch</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Check this to receive compiled briefs on Sundays.
                    </div>
                  </div>
                  <Switch
                    checked={digestEnabled}
                    onCheckedChange={(checked) => {
                      setDigestEnabled(checked);
                    }}
                  />
                </div>

                {/* Email Address */}
                <div>
                  <Label htmlFor="digest-email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    Delivery Email Address
                  </Label>
                  <Input
                    id="digest-email"
                    type="email"
                    placeholder="you@example.com"
                    value={digestEmail}
                    onChange={(e) => setDigestEmail(e.target.value)}
                    className="text-sm rounded-xl max-w-md bg-background border-border/60"
                  />
                </div>

                {/* Summary Style Selector */}
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
                    Synthesis Style
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {STYLE_OPTIONS.map(({ key, label, description, icon: Icon, color }) => (
                      <button
                        key={key}
                        onClick={() => setDigestStyle(key)}
                        className={`rounded-xl border p-4 text-left transition-all duration-300 flex flex-col gap-2 ${
                          digestStyle === key
                            ? `${color} border-opacity-100 shadow-md`
                            : "border-border bg-white/[0.01] hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {label}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSaveDigestPrefs}
                    disabled={savingDigestPrefs}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 text-xs font-bold"
                  >
                    {savingDigestPrefs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Digest Settings
                  </Button>
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
                  <div className="w-full h-24 rounded-md bg-slate-950 border border-border shadow-sm mb-2 p-2 flex flex-col gap-2">
                    <div className="h-2 w-1/3 bg-slate-700 rounded"></div>
                    <div className="h-2 w-full bg-muted rounded"></div>
                    <div className="h-2 w-2/3 bg-muted rounded"></div>
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
