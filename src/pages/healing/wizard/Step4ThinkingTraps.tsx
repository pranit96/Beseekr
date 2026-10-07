// src/pages/healing/wizard/Step4ThinkingTraps.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { ThinkingTrapCard, TRAP_META } from "../components/ThinkingTrapCard";
import { AiSuggestionBadge } from "../components/AiSuggestionBadge";
import healingApi from "@/api/healing";
import { useToast } from "@/hooks/use-toast";
import type { ThinkingTrap } from "@/api/healing";

const ALL_TRAPS = Object.keys(TRAP_META) as ThinkingTrap[];

interface Step4Props {
  selected: ThinkingTrap[];
  onChange: (traps: ThinkingTrap[]) => void;
  thought: string;
  situation: string;
  aiEnabled: boolean;
}

export function Step4ThinkingTraps({ selected, onChange, thought, situation, aiEnabled }: Step4Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiSuggested, setAiSuggested] = useState<ThinkingTrap[]>([]);
  const [aiReason, setAiReason] = useState<string | null>(null);

  const toggle = (trap: ThinkingTrap) => {
    onChange(
      selected.includes(trap) ? selected.filter((t) => t !== trap) : [...selected, trap],
    );
  };

  const handleAiSuggest = async () => {
    if (!thought.trim()) return;
    setLoadingAi(true);
    try {
      const res = await healingApi.suggestTraps(thought, situation);
      if (res.crisis) {
        // Crisis handled at wizard level — shouldn't reach here but guard anyway
        return;
      }
      if (res.data) {
        setAiSuggested(res.data.traps);
        setAiReason(res.data.brief_reason || null);
        // Auto-select AI suggestions (user can deselect)
        const merged = Array.from(new Set([...selected, ...res.data.traps]));
        onChange(merged as ThinkingTrap[]);
        toast({ title: t("healing.ai.traps_loaded", "AI suggestions applied"), description: t("healing.ai.edit_freely", "Edit them freely.") });
      } else if (res.fallback) {
        toast({ title: t("healing.ai.unavailable", "AI unavailable"), description: t("healing.ai.continue_manually", "Please continue on your own.") });
      }
    } catch {
      toast({ title: t("common.error", "Error"), variant: "destructive" });
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {t("healing.wizard.s4.title", "Do you notice any thinking patterns?")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("healing.wizard.s4.hint",
            "These are common cognitive shortcuts that can distort how we see situations. Select any that feel familiar — or skip if none apply.")}
        </p>
      </div>

      {/* AI Reason */}
      {aiReason && aiSuggested.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/5 p-3">
          <AiSuggestionBadge />
          <p className="text-xs text-muted-foreground mt-0.5">{aiReason}</p>
        </div>
      )}

      {/* Trap grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        role="group"
        aria-label={t("healing.wizard.s4.group", "Thinking trap options")}
      >
        {ALL_TRAPS.map((trap) => (
          <ThinkingTrapCard
            key={trap}
            trap={trap}
            selected={selected.includes(trap)}
            onToggle={toggle}
            aiSuggested={aiSuggested.includes(trap) && !selected.includes(trap)}
          />
        ))}
      </div>

      {aiEnabled && thought.trim() && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAiSuggest}
          disabled={loadingAi}
          className="gap-2 w-full"
          id="ai-trap-suggest-btn"
        >
          {loadingAi
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Sparkles className="h-4 w-4" />}
          {t("healing.wizard.s4.ai_suggest", "Suggest thinking traps with AI")}
        </Button>
      )}

      <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
        💡 {t("healing.wizard.s4.tip", "You can select 0 traps if none apply — this step is optional.")}
      </div>
    </div>
  );
}
