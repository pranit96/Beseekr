// src/pages/healing/components/AiSuggestionBadge.tsx
// Shows a small badge with "AI suggestion — edit freely" above AI-generated content.
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";

interface AiSuggestionBadgeProps {
  className?: string;
}

export function AiSuggestionBadge({ className }: AiSuggestionBadgeProps) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent-foreground ${className ?? ""}`}
      aria-label={t("healing.ai.badge_aria", "AI-generated suggestion, you can edit this freely")}
    >
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      {t("healing.ai.badge", "AI suggestion — edit freely")}
    </span>
  );
}
