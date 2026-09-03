// src/pages/dhet/components/DesignDecisionsViewer.tsx
import React from "react";
import { DesignDecision } from "@/types/dhet";
import { Award, BookOpen, Lightbulb, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

interface DesignDecisionsViewerProps {
  decisions: DesignDecision[];
}

const AUTHOR_BADGES: Record<string, { label: string; color: string; border: string; bg: string }> = {
  "Don Norman": {
    label: "Don Norman",
    color: "text-amber-500 dark:text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
  },
  "Dieter Rams": {
    label: "Dieter Rams",
    color: "text-blue-500 dark:text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
  },
  "Jakob Nielsen": {
    label: "Jakob Nielsen",
    color: "text-emerald-500 dark:text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
  },
  "Steve Krug": {
    label: "Steve Krug",
    color: "text-purple-500 dark:text-purple-400",
    border: "border-purple-500/30",
    bg: "bg-purple-500/10",
  },
  "Alan Cooper": {
    label: "Alan Cooper",
    color: "text-cyan-500 dark:text-cyan-400",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
  },
  "Susan Weinschenk": {
    label: "Susan Weinschenk",
    color: "text-rose-500 dark:text-rose-400",
    border: "border-rose-500/30",
    bg: "bg-rose-500/10",
  },
};

export const DesignDecisionsViewer: React.FC<DesignDecisionsViewerProps> = ({
  decisions,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          <span>Grounded Design Decisions</span>
        </h3>
        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
          Each architectural choice is derived directly from foundational human-computer interaction and design thinking principles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {decisions.map((decision, idx) => {
          const authorBadge = AUTHOR_BADGES[decision.attribution] || {
            label: decision.attribution || "UX Principle",
            color: "text-primary",
            border: "border-primary/30",
            bg: "bg-primary/10",
          };

          return (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-border/60 bg-card hover:border-primary/30 transition-all shadow-sm flex flex-col justify-between gap-3 group"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span
                    className={cn(
                      "text-xs px-2.5 py-0.5 rounded-full font-semibold border inline-flex items-center gap-1.5",
                      authorBadge.bg,
                      authorBadge.border,
                      authorBadge.color
                    )}
                  >
                    <BookOpen className="w-3 h-3" />
                    {decision.attribution}
                  </span>

                  <span className="text-xs text-muted-foreground font-mono">
                    #{idx + 1}
                  </span>
                </div>

                <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  {decision?.title || `Decision ${idx + 1}`}
                </h4>

                <div className="text-xs font-semibold text-primary/90 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 shrink-0" />
                  <span>{decision.principle}</span>
                </div>

                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed pt-1">
                  {decision.rationale}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
