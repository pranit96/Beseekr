// src/pages/healing/wizard/Step7ReRateEmotions.tsx
import { useTranslation } from "react-i18next";
import { IntensitySlider } from "../components/IntensitySlider";
import type { RecordEmotion } from "@/api/healing";

interface Step7Props {
  emotions: RecordEmotion[];
  onChange: (emotions: RecordEmotion[]) => void;
  beliefAfter: number;
  onBeliefAfterChange: (v: number) => void;
}

export function Step7ReRateEmotions({ emotions, onChange, beliefAfter, onBeliefAfterChange }: Step7Props) {
  const { t } = useTranslation();

  const setAfterIntensity = (emotion: string, intensity: number) => {
    onChange(emotions.map((e) => e.emotion === emotion ? { ...e, intensity_after: intensity } : e));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {t("healing.wizard.s7.title", "How do you feel now?")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("healing.wizard.s7.hint",
            "Re-rate your emotions after working through the exercise. Even a small shift is meaningful — notice it.")}
        </p>
      </div>

      {/* Belief after */}
      <IntensitySlider
        id="belief-after"
        label={t("healing.wizard.s7.belief_after", "How much do you now believe the original thought? (0–100%)")}
        value={beliefAfter}
        onChange={onBeliefAfterChange}
        min={0}
        max={100}
      />

      {/* Re-rate each emotion */}
      {emotions.length > 0 && (
        <div className="space-y-5">
          <p className="text-sm font-medium text-foreground">
            {t("healing.wizard.s7.rerate_label", "Re-rate each emotion now:")}
          </p>
          {emotions.map((e) => (
            <div key={e.emotion} className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">
                  {t(`healing.emotions.${e.emotion}`, e.emotion)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("healing.wizard.s7.before_value", { v: e.intensity_before }, `Was: ${e.intensity_before}/10`)}
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
                  {t("healing.wizard.s7.improved", { diff: e.intensity_before - e.intensity_after }, `↓ ${e.intensity_before - e.intensity_after} points — that's progress.`)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
        💡 {t("healing.wizard.s7.tip",
          "Some emotions may stay similar — that's okay. The goal isn't to feel nothing, it's to feel more accurately.")}
      </div>
    </div>
  );
}
