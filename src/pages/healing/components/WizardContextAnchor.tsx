// src/pages/healing/components/WizardContextAnchor.tsx
// Persistent, beautiful context anchor that grounds the user at every step of the CBT process.
// Prevents cognitive overload by keeping the situation, automatic thought, emotions, and evidence visible.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  ChevronUp,
  Brain,
  Scale,
  Sparkles,
  Heart,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RecordEmotion, ThinkingTrap } from "@/api/healing";
import { TRAP_META } from "./ThinkingTrapCard";

interface WizardContextAnchorProps {
  step: number;
  situation?: string;
  thought?: string;
  emotions?: RecordEmotion[];
  traps?: ThinkingTrap[];
  evidenceFor?: string[];
  evidenceAgainst?: string[];
  balancedThought?: string;
  beliefBefore?: number;
  beliefAfter?: number;
  onOpenWorksheet?: () => void;
}

export function WizardContextAnchor({
  step,
  situation,
  thought,
  emotions = [],
  traps = [],
  evidenceFor = [],
  evidenceAgainst = [],
  balancedThought,
  beliefBefore = 70,
  beliefAfter,
  onOpenWorksheet,
}: WizardContextAnchorProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  // Don't render on step 1 since nothing has been entered yet
  if (step === 1) return null;

  const hasSituation = Boolean(situation?.trim());
  const hasThought = Boolean(thought?.trim());
  const hasEmotions = emotions.length > 0;
  const hasTraps = traps.length > 0;
  const hasEvidence = evidenceFor.length > 0 || evidenceAgainst.length > 0;
  const hasBalanced = Boolean(balancedThought?.trim());

  return (
    <div className="rounded-2xl border border-indigo-200/60 dark:border-indigo-900/50 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-card dark:from-indigo-950/25 dark:via-purple-950/15 dark:to-card p-3.5 sm:p-4 shadow-sm transition-all duration-200">
      {/* Top Banner Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Step-specific context anchor pill */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
              {step === 2 && <MapPin className="w-3 h-3" />}
              {step === 3 && <Heart className="w-3 h-3" />}
              {step === 4 && <Brain className="w-3 h-3" />}
              {step === 5 && <Scale className="w-3 h-3" />}
              {step === 6 && <Sparkles className="w-3 h-3" />}
              {step === 7 && <Scale className="w-3 h-3" />}
              {step === 8 && <CheckCircle2 className="w-3 h-3" />}
              {step === 2 && t("healing.context.trigger_context", "Trigger Situation")}
              {step === 3 && t("healing.context.feelings_context", "Trigger & Emotional State")}
              {step === 4 && t("healing.context.analyzing_thought", "Target Thought Being Examined")}
              {step === 5 && t("healing.context.thought_on_trial", "Thought on Trial")}
              {step === 6 && t("healing.context.synthesis_anchor", "Reframing Target")}
              {step === 7 && t("healing.context.comparison_anchor", "Before & After Perspective")}
              {step === 8 && t("healing.context.grounding_anchor", "New Balanced Mindset")}
            </span>

            {/* Badges for quick reference */}
            {hasThought && step >= 4 && (
              <Badge variant="outline" className="text-[10px] px-2 py-0 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-normal">
                Belief: <strong className="ml-1 font-semibold">{beliefBefore}%</strong>
              </Badge>
            )}

            {hasEmotions && step >= 3 && step < 6 && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                {emotions.slice(0, 2).map((e) => (
                  <span key={e.emotion} className="inline-flex items-center font-medium text-foreground/80">
                    {t(`healing.emotions.${e.emotion}`, e.emotion)} ({e.intensity_before}/10)
                  </span>
                ))}
                {emotions.length > 2 && <span className="text-[10px]">+{emotions.length - 2}</span>}
              </span>
            )}
          </div>

          {/* Primary Anchor Headline */}
          {step <= 3 ? (
            <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
              <span className="text-muted-foreground font-normal">Situation: </span>
              &ldquo;{situation || t("healing.context.no_situation", "Situation recorded")}&rdquo;
            </p>
          ) : (
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground leading-snug">
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">Automatic Thought: </span>
                &ldquo;{thought || t("healing.context.no_thought", "Untitled Thought")}&rdquo;
              </p>
              {hasSituation && !expanded && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  Trigger: {situation}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Controls: Expand Drawer + Worksheet peek */}
        <div className="flex items-center gap-1 shrink-0">
          {onOpenWorksheet && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onOpenWorksheet}
              className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground hover:bg-indigo-100/50 dark:hover:bg-indigo-950/50"
              title={t("healing.context.view_full_sheet", "View Full Thought Worksheet")}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("healing.context.sheet_btn", "Worksheet")}</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((e) => !e)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            aria-label={expanded ? "Collapse details" : "Expand details"}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Expanded Multi-Step Context Drawer */}
      {expanded && (
        <div className="mt-3.5 pt-3 border-t border-indigo-200/50 dark:border-indigo-900/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in-50 duration-150">
          {/* Situation trigger */}
          {hasSituation && (
            <div className="rounded-xl bg-card/60 p-2.5 border border-border/50">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                📍 {t("healing.wizard.s1.label", "Trigger Situation")}
              </span>
              <p className="text-foreground leading-relaxed text-xs">{situation}</p>
            </div>
          )}

          {/* Automatic Thought & Belief */}
          {hasThought && (
            <div className="rounded-xl bg-card/60 p-2.5 border border-border/50">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                💭 {t("healing.wizard.s3.label", "Automatic Thought")}
              </span>
              <p className="text-foreground font-medium leading-relaxed text-xs">{thought}</p>
              <span className="text-[11px] text-muted-foreground mt-1 block">
                Initial belief: <strong className="text-foreground">{beliefBefore}%</strong>
              </span>
            </div>
          )}

          {/* Emotions */}
          {hasEmotions && (
            <div className="rounded-xl bg-card/60 p-2.5 border border-border/50">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                🎭 {t("healing.wizard.s2.title", "Initial Emotions")}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {emotions.map((e) => (
                  <Badge key={e.emotion} variant="secondary" className="text-[10px] font-normal py-0">
                    {t(`healing.emotions.${e.emotion}`, e.emotion)}: <strong className="ml-1">{e.intensity_before}/10</strong>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Identified Thinking Traps */}
          {hasTraps && (
            <div className="rounded-xl bg-card/60 p-2.5 border border-border/50">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                ⚠️ {t("healing.wizard.s4.title", "Identified Patterns")}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {traps.map((tr) => (
                  <Badge key={tr} variant="outline" className="text-[10px] bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 font-normal py-0">
                    {TRAP_META[tr]?.label || tr}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Evidence Gathered */}
          {hasEvidence && (
            <div className="sm:col-span-2 rounded-xl bg-card/60 p-2.5 border border-border/50 space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                🔬 {t("healing.wizard.s5.title", "Gathered Evidence")}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 block mb-1">
                    Supporting Facts ({evidenceFor.length}):
                  </span>
                  {evidenceFor.length === 0 ? (
                    <span className="text-muted-foreground italic text-[11px]">None recorded</span>
                  ) : (
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground">
                      {evidenceFor.map((item, idx) => (
                        <li key={idx} className="line-clamp-2">{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <span className="text-[11px] font-medium text-sky-700 dark:text-sky-400 block mb-1">
                    Challenging Facts ({evidenceAgainst.length}):
                  </span>
                  {evidenceAgainst.length === 0 ? (
                    <span className="text-muted-foreground italic text-[11px]">None recorded</span>
                  ) : (
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground">
                      {evidenceAgainst.map((item, idx) => (
                        <li key={idx} className="line-clamp-2">{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Balanced Thought */}
          {hasBalanced && (
            <div className="sm:col-span-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 border border-emerald-300/40 dark:border-emerald-800/40">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">
                🌿 {t("healing.wizard.s6.label", "Balanced Alternative Perspective")}
              </span>
              <p className="text-foreground font-medium text-xs leading-relaxed">{balancedThought}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
