// src/pages/healing/HealingSettings.tsx
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Info } from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
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
    mutationFn: (updates: Partial<CbtSettings>) =>
      healingApi.updateSettings(updates as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["healing-settings"] });
      toast({ title: t("healing.settings.saved", "Settings saved") });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <GlobalHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <GlobalFooter />
      </div>
    );
  }

  const handleToggleAi = (checked: boolean) => {
    mutation.mutate({ ai_enabled: checked });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500/20">
      <GlobalHeader />

      <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Breadcrumb & Sub Navigation Bar */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/healing")}
              className="gap-2 text-muted-foreground hover:text-foreground -ml-2 h-9 px-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Healing</span>
            </Button>
            <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Healing / <strong className="text-foreground">Settings</strong>
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("healing.settings.title", "Healing Settings & Privacy")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t(
              "healing.settings.subtitle",
              "Configure your AI reframe assistant and security preferences.",
            )}
          </p>
        </div>

        <div className="space-y-6 pt-2">
          {/* AI Consent */}
          <section className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm p-6 sm:p-7 shadow-sm">
            <h2 className="text-base font-semibold text-foreground mb-4">
              {t("healing.settings.ai_title", "AI Suggestions")}
            </h2>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 text-sm">
                <Label htmlFor="ai-toggle" className="font-medium">
                  {t("healing.settings.ai_enable", "Enable AI Assistant")}
                </Label>
                <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
                  {t(
                    "healing.settings.ai_desc",
                    "Allow the AI to suggest thinking traps, balanced thoughts, and Socratic questions during exercises. Your data is sent to secure models and is never used for training.",
                  )}
                </p>
              </div>
              <Switch
                id="ai-toggle"
                checked={settings?.ai_enabled ?? true}
                onCheckedChange={handleToggleAi}
                disabled={mutation.isPending}
                aria-label={t(
                  "healing.settings.ai_enable",
                  "Enable AI Assistant",
                )}
              />
            </div>
          </section>

          {/* Privacy Note */}
          <section className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm p-6 sm:p-7 shadow-sm">
            <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              {t("healing.settings.privacy_title", "Privacy Architecture")}
            </h2>
            <div className="space-y-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-primary font-bold">✓</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {t(
                      "healing.settings.encrypted",
                      "At-Rest Encryption (AES-256-GCM)",
                    )}
                  </p>
                  <p className="text-xs leading-relaxed mt-0.5">
                    {t(
                      "healing.settings.encrypted_desc",
                      "Your situations, thoughts, and reflections are encrypted in the database before storage.",
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-primary font-bold">✓</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {t("healing.settings.safety", "Local Safety Screening")}
                  </p>
                  <p className="text-xs leading-relaxed mt-0.5">
                    {t(
                      "healing.settings.safety_desc",
                      "Safety screening triggers immediately if crisis indicators are detected to guide you to 24/7 care.",
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}
