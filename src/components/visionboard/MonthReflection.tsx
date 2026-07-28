import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Check } from "lucide-react";
import type { BoardNotes } from "@/api/visionboard";

const PROMPTS: Array<{
  key: keyof Pick<BoardNotes, "win" | "challenge" | "gratitude" | "improve">;
  icon: string;
  label: string;
  placeholder: string;
}> = [
  { key: "win",       icon: "🌟", label: "Biggest Win",               placeholder: "What are you most proud of this month?" },
  { key: "challenge", icon: "💭", label: "What challenged me?",        placeholder: "What was difficult or unexpected?" },
  { key: "gratitude", icon: "❤️", label: "Something I'm grateful for", placeholder: "Something or someone that made a difference…" },
  { key: "improve",   icon: "🚀", label: "One thing I'll improve",     placeholder: "What will you do differently next month?" },
];

interface MonthReflectionProps {
  notes: BoardNotes | null;
  onSave: (updates: Partial<Pick<BoardNotes, "win" | "challenge" | "gratitude" | "improve">>) => Promise<any>;
}

export function MonthReflection({ notes, onSave }: MonthReflectionProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [drafts, setDrafts]   = useState<Record<string, string>>({
    win:       notes?.win       || "",
    challenge: notes?.challenge || "",
    gratitude: notes?.gratitude || "",
    improve:   notes?.improve   || "",
  });
  const [saving, setSaving]   = useState(false);

  async function saveField(key: string) {
    setSaving(true);
    await onSave({ [key]: drafts[key] } as any);
    setSaving(false);
    setEditing(null);
  }

  return (
    <div className="vb-section vb-reflection">
      <div className="vb-section-label">
        <span>🪷</span>
        <span>Month Reflection</span>
      </div>

      <div className="vb-reflection-grid">
        {PROMPTS.map((p) => {
          const isEditing = editing === p.key;
          const hasValue  = !!drafts[p.key];

          return (
            <motion.div
              key={p.key}
              className={`vb-reflection-card ${isEditing ? "vb-reflection-editing" : ""}`}
              layout
            >
              <div className="vb-reflection-header">
                <span className="vb-refl-icon">{p.icon}</span>
                <span className="vb-refl-label">{p.label}</span>
                {!isEditing && (
                  <button
                    className="vb-refl-edit"
                    onClick={() => setEditing(p.key)}
                    aria-label="Edit"
                  >
                    <Pencil size={11} />
                    {hasValue ? "" : " Write"}
                  </button>
                )}
              </div>

              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    key="editor"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{    opacity: 0, height: 0 }}
                  >
                    <textarea
                      className="vb-refl-textarea"
                      value={drafts[p.key]}
                      onChange={(e) => setDrafts((d) => ({ ...d, [p.key]: e.target.value }))}
                      placeholder={p.placeholder}
                      rows={3}
                      autoFocus
                    />
                    <div className="vb-form-actions">
                      <button className="vb-btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
                      <button className="vb-btn-primary" onClick={() => saveField(p.key)} disabled={saving}>
                        <Check size={13} /> Save
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.p
                    key="display"
                    className={`vb-refl-text ${!hasValue ? "vb-refl-empty" : ""}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setEditing(p.key)}
                  >
                    {hasValue ? drafts[p.key] : p.placeholder}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
