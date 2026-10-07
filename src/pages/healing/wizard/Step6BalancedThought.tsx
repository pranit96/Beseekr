// src/pages/healing/wizard/Step6BalancedThought.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, ChevronRight } from "lucide-react";
import { AiSuggestionBadge } from "../components/AiSuggestionBadge";
import { IntensitySlider } from "../components/IntensitySlider";
import healingApi from "@/api/healing";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ThinkingTrap } from "@/api/healing";

interface Step6Props {
  value: string;
  onChange: (v: string) => void;
  beliefBefore: number;
  onBeliefBeforeChange: (v: number) => void;
  situation: string;
  thought: string;
  evidenceFor: string[];
  evidenceAgainst: string[];
  traps: ThinkingTrap[];
  aiEnabled: boolean;
}

export function Step6BalancedThought({
  value, onChange, beliefBefore, onBeliefBeforeChange,
  situation, thought, evidenceFor, evidenceAgainst, traps, aiEnabled,
}: Step6Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [options, setOptions] = useState<string[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleAiSuggest = async () => {
    setLoadingAi(true);
    try {
      const res = await healingApi.suggestBalanced({
        thought, situation, evidence_for: evidenceFor, evidence_against: evidenceAgainst, traps,
      });
      if (res.data?.options) {
        setOptions(res.data.options);
      } else if (res.fallback) {
        toast({ title: t("healing.ai.unavailable", "AI unavailable"), description: t("healing.ai.continue_manually", "Continue on your own.") });
      }
    } catch {
      toast({ title: t("common.error", "Error"), variant: "destructive" });
    } finally {
      setLoadingAi(false);
    }
  };

  const applyOption = (opt: string) => {
    onChange(opt);
    setOptions([]); // clear options after applying
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {t("healing.wizard.s6.title", "What's a more balanced view?")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("healing.wizard.s6.hint",
            "Not forced positivity — just a fairer, more realistic way of seeing this situation based on all the evidence.")}
        </p>
      </div>

      {/* Belief before */}
      <IntensitySlider
        id="belief-before"
        label={t("healing.wizard.s6.belief_before", "How much do you believe the original thought? (0–100%)")}
        value={beliefBefore}
        onChange={onBeliefBeforeChange}
        min={0}
        max={100}
      />

      {/* AI Options */}
      {options.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AiSuggestionBadge />
            <span className="text-xs text-muted-foreground">
              {t("healing.wizard.s6.ai_options_hint", "Tap one to use it, or write your own below.")}
            </span>
          </div>
          {options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applyOption(opt)}
              className={cn(
                "w-full text-left rounded-2xl border border-border bg-card p-3 text-sm leading-snug",
                "hover:border-primary/50 hover:bg-primary/5 transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              )}
              aria-label={t("healing.wizard.s6.use_option", { text: opt }, `Use: ${opt}`)}
            >
              <div className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {opt}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Free-text input */}
      <div className="space-y-1.5">
        <Label htmlFor="balanced-thought-input" className="text-sm font-medium">
          {t("healing.wizard.s6.label", "My balanced thought")}
        </Label>
        <Textarea
          id="balanced-thought-input"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 500))}
          placeholder={t("healing.wizard.s6.placeholder",
            'e.g. "I\'ve prepared well and even if I don\'t perform perfectly, one interview doesn\'t define me."')}
          rows={4}
          className="resize-none text-sm"
          maxLength={500}
        />
        <span className="text-xs text-muted-foreground">{value.length}/500</span>
      </div>

      {aiEnabled && thought.trim() && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAiSuggest}
          disabled={loadingAi || !thought.trim()}
          className="gap-2 w-full"
          id="ai-balanced-suggest-btn"
        >
          {loadingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {t("healing.wizard.s6.ai_suggest", "Suggest balanced thoughts with AI")}
        </Button>
      )}

      <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
        💡 {t("healing.wizard.s6.tip",
          'Ask yourself: "What would I say to a close friend in this situation?"')}
      </div>
    </div>
  );
}
