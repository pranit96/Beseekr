// src/pages/healing/wizard/Step5Evidence.tsx
import { useTranslation } from "react-i18next";
import { EvidenceList } from "../components/EvidenceList";
import { Badge } from "@/components/ui/badge";
import { TRAP_META } from "../components/ThinkingTrapCard";
import type { ThinkingTrap } from "@/api/healing";

interface Step5Props {
  evidenceFor: string[];
  evidenceAgainst: string[];
  onChangeFor: (v: string[]) => void;
  onChangeAgainst: (v: string[]) => void;
  thought?: string;
  situation?: string;
  traps?: ThinkingTrap[];
}

export function Step5Evidence({
  evidenceFor,
  evidenceAgainst,
  onChangeFor,
  onChangeAgainst,
  thought,
  situation,
  traps = [],
}: Step5Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {t("healing.wizard.s5.title", "What's the factual evidence?")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("healing.wizard.s5.hint",
            "Think like a scientist in a courtroom. What objective facts support or challenge your automatic thought? Avoid assumptions — focus on real facts.")}
        </p>
      </div>

      {/* Target Thought Being Tested */}
      {thought?.trim() && (
        <div className="rounded-2xl border border-indigo-200/70 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              💭 {t("healing.wizard.s5.testing_thought", "Thought On Trial:")}
            </span>
            {traps.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-muted-foreground mr-1">Patterns:</span>
                {traps.map((tr) => (
                  <Badge key={tr} variant="outline" className="text-[10px] bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 py-0">
                    {TRAP_META[tr]?.label || tr}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <p className="text-base font-semibold text-foreground leading-snug">
            &ldquo;{thought}&rdquo;
          </p>
          {situation?.trim() && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              Trigger: {situation}
            </p>
          )}
        </div>
      )}

      <EvidenceList
        items={evidenceFor}
        onChange={onChangeFor}
        label={t("healing.wizard.s5.for_label", "Facts that support this thought")}
        placeholder={t("healing.wizard.s5.for_placeholder", 'e.g. "I did stumble once during my last presentation"')}
        side="for"
      />

      <EvidenceList
        items={evidenceAgainst}
        onChange={onChangeAgainst}
        label={t("healing.wizard.s5.against_label", "Facts that challenge or weaken this thought")}
        placeholder={t("healing.wizard.s5.against_placeholder", 'e.g. "My manager praised my technical clarity last week"')}
        side="against"
      />

      <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
        💡 {t("healing.wizard.s5.tip",
          "It's normal for the 'challenging' list to feel harder — our survival instinct naturally prioritizes threatening thoughts first.")}
      </div>
    </div>
  );
}
