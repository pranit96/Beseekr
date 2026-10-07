// src/pages/healing/HealingSettings.tsx
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import healingApi, { type CbtSettings } from "@/api/healing";

export default function HealingSettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["healing-settings"],
    queryFn: healingApi.getSettings,
  });

  const settings = data?.data;

  const mutation = useMutation({
    mutationFn: (updates: Partial<CbtSettings>) => healingApi.updateSettings(updates as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["healing-settings"] });
      toast({ title: t("healing.settings.saved", "Settings saved") });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleToggleAi = (checked: boolean) => {
    mutation.mutate({ ai_enabled: checked });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
        <div className="mb-8 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/healing")} aria-label={t("common.back", "Back")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {t("healing.settings.title", "Healing Settings")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("healing.settings.subtitle", "Configure your privacy and AI preferences.")}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* AI Consent */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground mb-4">
              {t("healing.settings.ai_title", "AI Suggestions")}
            </h2>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 text-sm">
                <Label htmlFor="ai-toggle" className="font-medium">
                  {t("healing.settings.ai_enable", "Enable AI Assistant")}
                </Label>
                <p className="text-muted-foreground leading-relaxed">
                  {t("healing.settings.ai_desc",
                    "Allow the AI to suggest thinking traps, balanced thoughts, and Socratic questions during exercises. Your data is sent to secure models and is never used for training.")}
                </p>
                {settings?.ai_consent_given_at && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    {t("healing.settings.ai_consented_at", "Consent given on ")}
                    {new Date(settings.ai_consent_given_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Switch
                id="ai-toggle"
                checked={settings?.ai_enabled ?? false}
                onCheckedChange={handleToggleAi}
                disabled={mutation.isPending}
              />
            </div>
            {!settings?.ai_enabled && (
              <div className="mt-4 flex gap-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
                <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
                <p>
                  {t("healing.settings.ai_disabled_hint",
                    "AI suggestions are turned off. You can still use all exercises entirely on your own.")}
                </p>
              </div>
            )}
          </section>

          {/* Privacy & Data */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground mb-4">
              {t("healing.settings.privacy_title", "Privacy & Security")}
            </h2>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-primary font-bold">✓</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {t("healing.settings.encryption", "Field-Level Encryption")}
                  </p>
                  <p className="text-xs leading-relaxed mt-0.5">
                    {t("healing.settings.encryption_desc",
                      "All free-text inputs in your thought records are encrypted in the database using AES-256-GCM. We cannot read your entries.")}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-primary font-bold">✓</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {t("healing.settings.safety", "Local Safety First")}
                  </p>
                  <p className="text-xs leading-relaxed mt-0.5">
                    {t("healing.settings.safety_desc",
                      "Safety screening happens locally and via secure cloud checks before any AI processing.")}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
