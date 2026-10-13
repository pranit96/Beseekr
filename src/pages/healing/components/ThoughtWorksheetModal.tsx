// src/pages/healing/components/ThoughtWorksheetModal.tsx
// Classic 7-column CBT Thought Record worksheet summary viewable anytime during the wizard.

import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TRAP_META } from "./ThinkingTrapCard";
import type { RecordEmotion, ThinkingTrap } from "@/api/healing";

interface ThoughtWorksheetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  situation: string;
  thought: string;
  emotions: RecordEmotion[];
  traps: ThinkingTrap[];
  evidenceFor: string[];
  evidenceAgainst: string[];
  balancedThought: string;
  beliefBefore: number;
  beliefAfter: number;
  nextAction: string;
}

export function ThoughtWorksheetModal({
  open,
  onOpenChange,
  situation,
  thought,
  emotions,
  traps,
  evidenceFor,
  evidenceAgainst,
  balancedThought,
  beliefBefore,
  beliefAfter,
  nextAction,
}: ThoughtWorksheetModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            📋 {t("healing.worksheet.title", "CBT Thought Record Worksheet")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("healing.worksheet.desc", "A holistic overview of your thought exploration as you work through each column.")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* 1. Situation */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              1. Situation (Trigger)
            </span>
            <p className="text-sm font-medium text-foreground leading-relaxed">
              {situation || <span className="text-muted-foreground italic font-normal">Not entered yet</span>}
            </p>
          </div>

          {/* 2. Automatic Thought */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              2. Automatic Thought
            </span>
            <p className="text-sm font-semibold text-foreground leading-relaxed">
              {thought ? `“${thought}”` : <span className="text-muted-foreground italic font-normal">Not entered yet</span>}
            </p>
            {thought && (
              <Badge variant="outline" className="text-[11px] font-normal">
                Initial belief: <strong className="ml-1">{beliefBefore}%</strong>
              </Badge>
            )}
          </div>

          {/* 3. Emotions */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              3. Emotions & Intensity
            </span>
            {emotions.length === 0 ? (
              <span className="text-muted-foreground italic">None selected yet</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {emotions.map((e) => (
                  <Badge key={e.emotion} variant="secondary" className="text-xs py-0.5">
                    {t(`healing.emotions.${e.emotion}`, e.emotion)}: {e.intensity_before}/10
                    {e.intensity_after != null && (
                      <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        → {e.intensity_after}/10
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 4. Thinking Traps */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              4. Thinking Traps / Distortions
            </span>
            {traps.length === 0 ? (
              <span className="text-muted-foreground italic">No traps tagged</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {traps.map((tr) => (
                  <Badge key={tr} variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300">
                    {TRAP_META[tr]?.label || tr}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 5. Evidence Examination */}
          <div className="md:col-span-2 rounded-2xl border border-border/70 bg-card p-4 space-y-3">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              5. Evidence Examination
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-amber-50/50 dark:bg-amber-950/20 p-3 border border-amber-200/50 dark:border-amber-900/40">
                <span className="font-semibold text-amber-800 dark:text-amber-300 block mb-1.5">
                  Facts Supporting Thought ({evidenceFor.length})
                </span>
                {evidenceFor.length === 0 ? (
                  <p className="text-muted-foreground italic text-xs">No supporting evidence</p>
                ) : (
                  <ul className="list-disc list-inside space-y-1 text-xs text-foreground">
                    {evidenceFor.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl bg-sky-50/50 dark:bg-sky-950/20 p-3 border border-sky-200/50 dark:border-sky-900/40">
                <span className="font-semibold text-sky-800 dark:text-sky-300 block mb-1.5">
                  Facts Challenging Thought ({evidenceAgainst.length})
                </span>
                {evidenceAgainst.length === 0 ? (
                  <p className="text-muted-foreground italic text-xs">No challenging evidence</p>
                ) : (
                  <ul className="list-disc list-inside space-y-1 text-xs text-foreground">
                    {evidenceAgainst.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* 6. Balanced Alternative */}
          <div className="md:col-span-2 rounded-2xl border border-emerald-300/60 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-1.5">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
              6. Balanced / Alternative Thought
            </span>
            <p className="text-sm font-semibold text-foreground leading-relaxed">
              {balancedThought ? `“${balancedThought}”` : <span className="text-muted-foreground italic font-normal">Not drafted yet</span>}
            </p>
            {balancedThought && beliefAfter != null && (
              <Badge variant="outline" className="text-[11px] font-normal border-emerald-400 text-emerald-700 dark:text-emerald-300">
                Belief in original thought now: <strong className="ml-1">{beliefAfter}%</strong>
                <span className="text-muted-foreground ml-1">(down from {beliefBefore}%)</span>
              </Badge>
            )}
          </div>

          {/* 7. Action Step */}
          {nextAction && (
            <div className="md:col-span-2 rounded-2xl border border-border/70 bg-card p-4 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                7. Concrete Next Action
              </span>
              <p className="text-sm text-foreground font-medium">{nextAction}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
