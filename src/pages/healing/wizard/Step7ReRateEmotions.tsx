// src/pages/healing/wizard/Step7ReRateEmotions.tsx
import { useTranslation } from "react-i18next";
import { IntensitySlider } from "../components/IntensitySlider";
import { Badge } from "@/components/ui/badge";
import type { RecordEmotion } from "@/api/healing";

interface Step7Props {
  emotions: RecordEmotion[];
  onChange: (emotions: RecordEmotion[]) => void;
  beliefAfter: number;
  onBeliefAfterChange: (v: number) => void;
  thought?: string;
  beliefBefore?: number;
  balancedThought?: string;
}

export function Step7ReRateEmotions({
  emotions,
  onChange,
  beliefAfter,
  onBeliefAfterChange,
  thought,
  beliefBefore,
  balancedThought,
}: Step7Props) {
  const { t } = useTranslation();

  const setAfterIntensity = (emotion: string, intensity: number) => {
    onChange(emotions.map((e) => e.emotion === emotion ? { ...e, intensity_after: intensity } : e));
  };

  const beliefShift = beliefBefore != null ? beliefBefore - beliefAfter : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {t("healing.wizard.s7.title", "How do you feel now?")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("healing.wizard.s7.hint",
            "Re-rate your beliefs and emotions after examining the evidence. Notice even the smallest shift in intensity.")}
        </p>
      </div>

      {/* Perspective Comparison Card */}
      {(thought || balancedThought) && (
        <div className="rounded-2xl border border-indigo-200/70 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/40 via-card to-card p-4 space-y-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block">
            🔄 {t("healing.wizard.s7.perspective_shift", "Perspective Comparison")}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Original Thought */}
            <div className="rounded-xl border border-border bg-card/80 p-3 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-medium text-[11px]">Original Automatic Thought</span>
                {beliefBefore != null && (
                  <Badge variant="outline" className="text-[10px] py-0">
                    Was {beliefBefore}%
                  </Badge>
                )}
              </div>
              <p className="text-foreground font-medium text-xs leading-relaxed">
                &ldquo;{thought}&rdquo;
              </p>
            </div>

            {/* Balanced Alternative */}
            <div className="rounded-xl border border-emerald-300/50 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 space-y-1">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300 text-[11px] block">
                🌿 Balanced Alternative
              </span>
              <p className="text-foreground font-medium text-xs leading-relaxed">
                {balancedThought ? `“${balancedThought}”` : "Not drafted"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Belief after */}
      <div className="space-y-2">
        <IntensitySlider
          id="belief-after"
          label={t("healing.wizard.s7.belief_after", "How much do you believe the original thought now? (0–100%)")}
          value={beliefAfter}
          onChange={onBeliefAfterChange}
          min={0}
          max={100}
        />
        {beliefShift != null && beliefShift > 0 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            ↓ {beliefShift}% reduction in conviction — your balanced perspective is weakening the distortion.
          </p>
        )}
      </div>

      {/* Re-rate each emotion */}
      {emotions.length > 0 && (
        <div className="space-y-5">
          <p className="text-sm font-medium text-foreground">
            {t("healing.wizard.s7.rerate_label", "Re-rate each emotion's current intensity:")}
          </p>
          {emotions.map((e) => (
            <div key={e.emotion} className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">
                  {t(`healing.emotions.${e.emotion}`, e.emotion)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("healing.wizard.s7.before_value", `Was: ${e.intensity_before}/10`, { v: e.intensity_before })}
                </span>
              </div>
              <IntensitySlider
                id={`rerating-${e.emotion}`}
                label={t("healing.wizard.s7.now_label", "Now")}
                value={e.intensity_after ?? e.intensity_before}
                onChange={(v) => setAfterIntensity(e.emotion, v)}
                colorScale
              />
              {e.intensity_after != null && e.intensity_after < e.intensity_before && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  {t("healing.wizard.s7.improved", `↓ ${e.intensity_before - e.intensity_after} points — that's meaningful progress.`, { diff: e.intensity_before - e.intensity_after })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
        💡 {t("healing.wizard.s7.tip",
          "Emotions don't have to hit zero. The goal of CBT isn't total numbness — it's emotional proportionality.")}
      </div>
    </div>
  );
}
