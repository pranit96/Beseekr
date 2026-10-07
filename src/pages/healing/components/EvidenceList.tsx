// src/pages/healing/components/EvidenceList.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EvidenceListProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  maxItems?: number;
  label: string;
  side: "for" | "against";
}

export function EvidenceList({ items, onChange, placeholder, maxItems = 10, label, side }: EvidenceListProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");

  const addItem = () => {
    const trimmed = draft.trim();
    if (!trimmed || items.length >= maxItems) return;
    onChange([...items, trimmed]);
    setDraft("");
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addItem(); }
  };

  const borderColor = side === "for"
    ? "border-amber-300/40 dark:border-amber-700/40"
    : "border-sky-300/40 dark:border-sky-700/40";
  const dotColor = side === "for" ? "bg-amber-400" : "bg-sky-400";

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>

      {/* Item list */}
      {items.length > 0 && (
        <ul className="space-y-1.5" aria-label={label}>
          {items.map((item, i) => (
            <li
              key={i}
              className={cn(
                "flex items-start gap-2 rounded-xl border px-3 py-2 text-sm bg-muted/20",
                borderColor,
              )}
            >
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dotColor)} aria-hidden="true" />
              <span className="flex-1 leading-snug text-foreground">{item}</span>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors mt-0.5"
                aria-label={t("healing.evidence.remove", { text: item }, `Remove: ${item}`)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add input */}
      {items.length < maxItems && (
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 300))}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? t("healing.evidence.add_placeholder", "Add a piece of evidence…")}
            className="flex-1 h-9 text-sm"
            aria-label={t("healing.evidence.input_label", { label }, `Add to ${label}`)}
            maxLength={300}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            disabled={!draft.trim()}
            className="h-9 px-3"
            aria-label={t("healing.evidence.add", "Add")}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}

      {items.length >= maxItems && (
        <p className="text-xs text-muted-foreground">
          {t("healing.evidence.max_reached", { max: maxItems }, `Max ${maxItems} items reached`)}
        </p>
      )}
    </div>
  );
}
