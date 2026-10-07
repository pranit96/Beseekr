// src/pages/healing/components/WizardProgress.tsx
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardProgressProps {
  currentStep: number; // 1-indexed
  totalSteps: number;
  stepLabels?: string[];
}

export function WizardProgress({ currentStep, totalSteps, stepLabels }: WizardProgressProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
      {/* Step fraction */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-muted-foreground">
          {t("healing.wizard.step_of", { current: currentStep, total: totalSteps }, `Step ${currentStep} of ${totalSteps}`)}
        </span>
        <span className="text-xs text-muted-foreground font-medium">
          {Math.round(((currentStep - 1) / totalSteps) * 100)}%
        </span>
      </div>

      {/* Bar */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Dots */}
      <div className="mt-3 flex items-center gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const step = i + 1;
          const isDone = step < currentStep;
          const isCurrent = step === currentStep;
          return (
            <div
              key={step}
              className={cn(
                "flex-1 h-1 rounded-full transition-all duration-300",
                isDone ? "bg-primary" : isCurrent ? "bg-primary/60" : "bg-muted",
              )}
              aria-label={stepLabels?.[i] ?? `Step ${step}`}
            />
          );
        })}
      </div>
    </div>
  );
}
