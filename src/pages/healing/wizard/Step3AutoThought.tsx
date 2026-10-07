// src/pages/healing/wizard/Step3AutoThought.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { AiSuggestionBadge } from "../components/AiSuggestionBadge";
import healingApi from "@/api/healing";
import { useToast } from "@/hooks/use-toast";

interface Step3Props {
  value: string;
  onChange: (v: string) => void;
  situation: string;
  aiEnabled: boolean;
}

export function Step3AutoThought({ value, onChange, situation, aiEnabled }: Step3Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [aiQuestion, setAiQuestion] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleAiHelp = async () => {
    if (!situation.trim()) return;
    setLoadingAi(true);
    try {
      const res = await healingApi.helpFindThought(situation);
      if (res.data?.question) {
        setAiQuestion(res.data.question);
      } else if (res.fallback) {
        toast({ title: t("healing.ai.unavailable", "AI suggestion unavailable"), description: t("healing.ai.continue_manually", "Please continue on your own.") });
      }
    } catch {
      toast({ title: t("common.error", "Error"), description: t("healing.ai.error", "Couldn't load AI suggestion."), variant: "destructive" });
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {t("healing.wizard.s3.title", "What's going through your mind?")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("healing.wizard.s3.hint",
            'This is your "automatic thought" — the first thing that popped into your head. Try to capture it as a specific sentence.')}
        </p>
      </div>

      {/* AI Socratic question */}
      {aiQuestion && (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4 space-y-1">
          <AiSuggestionBadge />
          <p className="text-sm text-foreground mt-2 leading-relaxed">{aiQuestion}</p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="thought-input" className="text-sm font-medium">
          {t("healing.wizard.s3.label", "My automatic thought")}
        </Label>
        <Textarea
          id="thought-input"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 500))}
          placeholder={t("healing.wizard.s3.placeholder",
            'e.g. "I\'m going to completely freeze and they\'ll see I\'m a fraud."')}
          rows={4}
          className="resize-none text-sm"
          maxLength={500}
        />
        <span className="text-xs text-muted-foreground">{value.length}/500</span>
      </div>

      {aiEnabled && situation.trim() && !aiQuestion && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAiHelp}
          disabled={loadingAi}
          className="gap-2"
          id="ai-help-thought-btn"
        >
          {loadingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {t("healing.wizard.s3.ai_help", "Help me find the thought")}
        </Button>
      )}

      <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
        💡 {t("healing.wizard.s3.tip",
          'Try "What was I telling myself?" or "What does this situation mean to me?"')}
      </div>
    </div>
  );
}
