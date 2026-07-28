import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { StickyNote } from "lucide-react";
import type { BoardNotes } from "@/api/visionboard";

interface QuickNotesProps {
  notes: BoardNotes | null;
  onSave: (updates: Partial<Pick<BoardNotes, "quick_notes">>) => Promise<any>;
}

export function QuickNotes({ notes, onSave }: QuickNotesProps) {
  const [value, setValue] = useState(notes?.quick_notes || "");
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  async function handleSave(val: string) {
    setSaving(true);
    await onSave({ quick_notes: val });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="vb-section vb-quick-notes">
      <div className="vb-section-header">
        <div className="vb-section-label">
          <StickyNote size={13} />
          <span>Quick Notes</span>
        </div>
        <span className="vb-save-indicator">
          {saving ? "Saving…" : saved ? "✓ Saved" : ""}
        </span>
      </div>

      <textarea
        className="vb-notes-area"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => handleSave(value)}
        placeholder={"• Build before consuming\n• Don't compare\n• Sleep before midnight…"}
        rows={6}
      />
    </div>
  );
}
