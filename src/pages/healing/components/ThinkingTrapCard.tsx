// src/pages/healing/components/ThinkingTrapCard.tsx
import { useTranslation } from "react-i18next";
import { Info, Check } from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ThinkingTrap } from "@/api/healing";

interface TrapMeta {
  label: string;
  description: string;
  example: string;
}

export const TRAP_META: Record<ThinkingTrap, TrapMeta> = {
  catastrophizing: {
    label: "Catastrophizing",
    description: "Expecting the worst possible outcome, even when it's unlikely.",
    example: '"If I mess up this interview, my career is over."',
  },
  mind_reading: {
    label: "Mind Reading",
    description: "Assuming you know what others are thinking, without evidence.",
    example: '"They must think I\'m incompetent."',
  },
  fortune_telling: {
    label: "Fortune Telling",
    description: "Predicting a negative outcome as if it were certain.",
    example: '"I\'m going to blank out on every question."',
  },
  all_or_nothing: {
    label: "All-or-Nothing",
    description: "Seeing things in black and white — perfect or total failure.",
    example: '"If it\'s not perfect, it\'s worthless."',
  },
  overgeneralizing: {
    label: "Overgeneralizing",
    description: 'Using "always" or "never" based on one or two events.',
    example: '"I always freeze under pressure."',
  },
  emotional_reasoning: {
    label: "Emotional Reasoning",
    description: "Believing something is true because it feels true.",
    example: '"I feel like a failure, so I must be one."',
  },
  should_statements: {
    label: "Should Statements",
    description: "Rigid rules about how you or others must behave.",
    example: '"I should be confident by now."',
  },
  personalization: {
    label: "Personalization",
    description: "Blaming yourself for things outside your control.",
    example: '"The interviewer looked bored — that\'s my fault."',
  },
};

interface ThinkingTrapCardProps {
  trap: ThinkingTrap;
  selected: boolean;
  onToggle: (trap: ThinkingTrap) => void;
  aiSuggested?: boolean;
}

export function ThinkingTrapCard({ trap, selected, onToggle, aiSuggested }: ThinkingTrapCardProps) {
  const { t } = useTranslation();
  const meta = TRAP_META[trap];

  return (
    <TooltipProvider>
      <div
        className={cn(
          "relative rounded-2xl border p-4 cursor-pointer transition-all duration-200 select-none",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          selected
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-border bg-card hover:border-primary/40 hover:bg-muted/30",
        )}
        onClick={() => onToggle(trap)}
        role="checkbox"
        aria-checked={selected}
        aria-label={`${selected ? "Deselect" : "Select"} thinking trap: ${meta.label}`}
        tabIndex={0}
        onKeyDown={(e) => e.key === " " || e.key === "Enter" ? onToggle(trap) : undefined}
      >
        {/* Selected check */}
        {selected && (
          <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
            <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
          </div>
        )}

        {/* AI badge */}
        {aiSuggested && !selected && (
          <span className="absolute top-2 right-2 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
            {t("healing.ai.suggested", "AI suggestion")}
          </span>
        )}

        <div className="pr-6">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm font-semibold text-foreground">{meta.label}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`More info about ${meta.label}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px] text-xs">
                <p className="mb-1">{meta.description}</p>
                <p className="italic text-muted-foreground">{meta.example}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-xs text-muted-foreground leading-snug">{meta.description}</p>
        </div>
      </div>
    </TooltipProvider>
  );
}
