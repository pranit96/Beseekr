// src/pages/healing/wizard/Step2Emotions.tsx
import { useTranslation } from "react-i18next";
import { EmotionChip } from "../components/EmotionChip";
import { IntensitySlider } from "../components/IntensitySlider";
import type { EmotionLabel, RecordEmotion } from "@/api/healing";

const ALL_EMOTIONS: EmotionLabel[] = [
  "anxious", "afraid", "ashamed", "angry", "sad", "hopeless", "other",
];

interface Step2Props {
  emotions: RecordEmotion[];
  onChange: (emotions: RecordEmotion[]) => void;
}

export function Step2Emotions({ emotions, onChange }: Step2Props) {
  const { t } = useTranslation();

  const toggleEmotion = (emotion: EmotionLabel) => {
    const exists = emotions.find((e) => e.emotion === emotion);
    if (exists) {
      onChange(emotions.filter((e) => e.emotion !== emotion));
    } else {
      onChange([...emotions, { emotion, intensity_before: 5 }]);
    }
  };

  const setIntensity = (emotion: EmotionLabel, intensity: number) => {
    onChange(emotions.map((e) => e.emotion === emotion
      ? { ...e, intensity_before: intensity }
      : e));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {t("healing.wizard.s2.title", "How are you feeling right now?")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("healing.wizard.s2.hint",
            "Select all that apply, then rate the intensity of each on a scale from 0 (barely) to 10 (overwhelming).")}
        </p>
      </div>

      {/* Emotion grid */}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={t("healing.wizard.s2.group_label", "Select emotions")}
      >
        {ALL_EMOTIONS.map((em) => (
          <EmotionChip
            key={em}
            emotion={em}
            selected={emotions.some((e) => e.emotion === em)}
            onToggle={toggleEmotion}
            label={t(`healing.emotions.${em}`, em.charAt(0).toUpperCase() + em.slice(1))}
          />
        ))}
      </div>

      {/* Intensity sliders for selected */}
      {emotions.length > 0 && (
        <div className="space-y-5">
          <p className="text-sm font-medium text-foreground">
            {t("healing.wizard.s2.rate_label", "Rate each emotion's intensity:")}
          </p>
          {emotions.map((e) => (
            <IntensitySlider
              key={e.emotion}
              id={`intensity-${e.emotion}`}
              label={t(`healing.emotions.${e.emotion}`, e.emotion)}
              value={e.intensity_before}
              onChange={(v) => setIntensity(e.emotion, v)}
              colorScale
            />
          ))}
        </div>
      )}

      {emotions.length === 0 && (
        <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
          {t("healing.wizard.s2.prompt", "Select at least one emotion to continue.")}
        </div>
      )}
    </div>
  );
}
