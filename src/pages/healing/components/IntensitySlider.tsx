// src/pages/healing/components/IntensitySlider.tsx
// WCAG 2.1 AA: has text alternative + numeric input fallback

import { useTranslation } from "react-i18next";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface IntensitySliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  id: string;
  disabled?: boolean;
  colorScale?: boolean; // shows color gradient from calm to intense
}

export function IntensitySlider({
  label, value, onChange, min = 0, max = 10, id, disabled, colorScale,
}: IntensitySliderProps) {
  const { t } = useTranslation();

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (!isNaN(v) && v >= min && v <= max) onChange(v);
  };

  // Color based on intensity (0=calm green, 10=intense orange — never red/alarming)
  const getColor = (v: number) => {
    if (!colorScale) return undefined;
    const hue = 140 - v * 10; // 140=green → 40=warm orange
    return `hsl(${hue}, 60%, 45%)`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={`${id}-input`} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {/* Numeric input as text alternative */}
        <div className="flex items-center gap-1">
          <Input
            id={`${id}-input`}
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={handleNumericChange}
            disabled={disabled}
            className="w-14 h-8 text-center text-sm p-1"
            aria-label={`${label} ${t("healing.intensity.numeric_input", "numeric value")} (${min}–${max})`}
          />
          <span className="text-xs text-muted-foreground">/{max}</span>
        </div>
      </div>

      <Slider
        id={id}
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        disabled={disabled}
        className={cn("w-full", disabled && "opacity-50")}
        aria-label={`${label}, value ${value} out of ${max}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value} out of ${max}`}
      />

      <div className="flex justify-between text-xs text-muted-foreground" aria-hidden="true">
        <span>{t("healing.intensity.low", "Low")}</span>
        <span>{t("healing.intensity.high", "High")}</span>
      </div>
    </div>
  );
}
