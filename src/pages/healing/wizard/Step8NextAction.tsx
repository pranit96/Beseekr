// src/pages/healing/wizard/Step8NextAction.tsx
import { useTranslation } from "react-i18next";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";

interface Step8Props {
  value: string;
  onChange: (v: string) => void;
}

const EXAMPLES = [
  "healing.wizard.s8.example1",
  "healing.wizard.s8.example2",
  "healing.wizard.s8.example3",
];
const EXAMPLE_DEFAULTS = [
  'Prepare one answer per interview question tonight, then close my laptop.',
  'Take a 5-minute walk before the interview to clear my head.',
  'Remind myself of my balanced thought if I feel anxious before entering.',
];

export function Step8NextAction({ value, onChange }: Step8Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {t("healing.wizard.s8.title", "One small step forward")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("healing.wizard.s8.hint",
            "What is one concrete, achievable action you can take today? Keep it small — something you can actually do in the next 24 hours.")}
        </p>
      </div>

      {/* Suggestion chips */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("healing.wizard.s8.ideas_label", "Ideas to get you started:")}
        </p>
        <div className="flex flex-col gap-2">
          {EXAMPLES.map((key, i) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange(t(key, EXAMPLE_DEFAULTS[i]))}
              className="text-left rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={t("healing.wizard.s8.use_idea", { text: t(key, EXAMPLE_DEFAULTS[i]) }, `Use: ${t(key, EXAMPLE_DEFAULTS[i])}`)}
            >
              {t(key, EXAMPLE_DEFAULTS[i])}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="next-action-input" className="text-sm font-medium">
          {t("healing.wizard.s8.label", "My next action")}
        </Label>
        <Textarea
          id="next-action-input"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 300))}
          placeholder={t("healing.wizard.s8.placeholder", "Write a small, specific action…")}
          rows={3}
          className="resize-none text-sm"
          maxLength={300}
        />
        <span className="text-xs text-muted-foreground">{value.length}/300</span>
      </div>

      {/* Completion encouragement */}
      {value.trim().length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-green-300/40 bg-green-50 dark:bg-green-950/20 p-3">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
          <p className="text-sm text-green-700 dark:text-green-300">
            {t("healing.wizard.s8.ready", "Great — you're ready to complete this exercise.")}
          </p>
        </div>
      )}

      <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
        💡 {t("healing.wizard.s8.tip",
          'Use "when-then" planning: "When X happens, I will do Y." It makes follow-through much more likely.')}
      </div>
    </div>
  );
}
