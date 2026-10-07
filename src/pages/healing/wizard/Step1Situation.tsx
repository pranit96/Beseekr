// src/pages/healing/wizard/Step1Situation.tsx
import { useTranslation } from "react-i18next";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Step1Props {
  value: string;
  onChange: (v: string) => void;
}

export function Step1Situation({ value, onChange }: Step1Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {t("healing.wizard.s1.title", "What's happening?")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("healing.wizard.s1.hint",
            "Describe the situation briefly — where you are, who's involved, what triggered this feeling. Stick to facts, not judgements.")}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="situation-input" className="text-sm font-medium">
          {t("healing.wizard.s1.label", "The situation")}
        </Label>
        <Textarea
          id="situation-input"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 500))}
          placeholder={t("healing.wizard.s1.placeholder",
            'e.g. "I have a job interview tomorrow morning and I can\'t stop thinking about it."')}
          rows={5}
          className="resize-none text-sm leading-relaxed"
          aria-describedby="situation-hint"
          maxLength={500}
        />
        <div className="flex justify-between">
          <span id="situation-hint" className="text-xs text-muted-foreground sr-only">
            {t("healing.wizard.s1.hint", "Describe the situation briefly")}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">{value.length}/500</span>
        </div>
      </div>

      <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
        💡 {t("healing.wizard.s1.tip",
          'Tip: Try "Just the facts" — what would a camera see? Avoid interpretations for now.')}
      </div>
    </div>
  );
}
