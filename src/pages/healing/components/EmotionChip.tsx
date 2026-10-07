// src/pages/healing/components/EmotionChip.tsx
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { EmotionLabel } from "@/api/healing";

interface EmotionChipProps {
  emotion: EmotionLabel;
  selected: boolean;
  onToggle: (emotion: EmotionLabel) => void;
  label?: string;
}

const EMOTION_COLORS: Record<EmotionLabel, string> = {
  anxious: "border-yellow-400/40 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300",
  afraid: "border-orange-400/40 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300",
  ashamed: "border-purple-400/40 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300",
  angry: "border-red-400/30 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300",
  sad: "border-blue-400/40 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300",
  hopeless: "border-slate-400/40 bg-slate-50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-300",
  other: "border-teal-400/40 bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300",
};

const SELECTED_COLORS: Record<EmotionLabel, string> = {
  anxious: "border-yellow-500 bg-yellow-100 dark:bg-yellow-900/40",
  afraid: "border-orange-500 bg-orange-100 dark:bg-orange-900/40",
  ashamed: "border-purple-500 bg-purple-100 dark:bg-purple-900/40",
  angry: "border-red-400 bg-red-100 dark:bg-red-900/40",
  sad: "border-blue-500 bg-blue-100 dark:bg-blue-900/40",
  hopeless: "border-slate-500 bg-slate-100 dark:bg-slate-900/40",
  other: "border-teal-500 bg-teal-100 dark:bg-teal-900/40",
};

export function EmotionChip({ emotion, selected, onToggle, label }: EmotionChipProps) {
  const displayLabel = label ?? emotion.charAt(0).toUpperCase() + emotion.slice(1);

  return (
    <button
      type="button"
      onClick={() => onToggle(emotion)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium",
        "transition-all duration-150 cursor-pointer select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected ? SELECTED_COLORS[emotion] : EMOTION_COLORS[emotion],
        selected ? "shadow-sm scale-105" : "hover:scale-102 opacity-80 hover:opacity-100",
      )}
      aria-pressed={selected}
      aria-label={`${selected ? "Deselect" : "Select"} ${displayLabel}`}
    >
      {selected && <Check className="h-3 w-3 shrink-0" aria-hidden="true" />}
      {displayLabel}
    </button>
  );
}
