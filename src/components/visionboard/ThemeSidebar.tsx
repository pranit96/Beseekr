import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Leaf } from "lucide-react";
import type { BoardMonth } from "@/api/visionboard";

interface ThemeSidebarProps {
  themeWords: string[];
  focusItems: string[];
  onUpdate: (updates: Partial<Pick<BoardMonth, "theme_words" | "focus_items">>) => void;
}

export function ThemeSidebar({ themeWords, focusItems, onUpdate }: ThemeSidebarProps) {
  const [newTheme, setNewTheme]   = useState("");
  const [newFocus, setNewFocus]   = useState("");
  const [addingTheme, setAddingTheme] = useState(false);
  const [addingFocus, setAddingFocus] = useState(false);

  function addTheme() {
    const trimmed = newTheme.trim();
    if (!trimmed) return;
    onUpdate({ theme_words: [...themeWords, trimmed] });
    setNewTheme(""); setAddingTheme(false);
  }

  function removeTheme(word: string) {
    onUpdate({ theme_words: themeWords.filter((w) => w !== word) });
  }

  function addFocus() {
    const trimmed = newFocus.trim();
    if (!trimmed) return;
    onUpdate({ focus_items: [...focusItems, trimmed] });
    setNewFocus(""); setAddingFocus(false);
  }

  function removeFocus(item: string) {
    onUpdate({ focus_items: focusItems.filter((f) => f !== item) });
  }

  return (
    <div className="vb-section vb-sidebar vb-sidebar-left">
      <div className="vb-sidebar-block">
        <div className="vb-section-label">
          <Leaf size={13} />
          <span>Monthly Theme</span>
        </div>
        <div className="vb-theme-chips">
          <AnimatePresence>
            {themeWords.map((word) => (
              <motion.span
                key={word}
                className="vb-theme-chip"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{    scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                {word}
                <button className="vb-chip-x" onClick={() => removeTheme(word)}>
                  <X size={10} />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>

          {addingTheme ? (
            <input
              className="vb-chip-input"
              value={newTheme}
              onChange={(e) => setNewTheme(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addTheme(); if (e.key === "Escape") setAddingTheme(false); }}
              onBlur={() => { if (newTheme.trim()) addTheme(); else setAddingTheme(false); }}
              placeholder="e.g. Discipline"
              autoFocus
              maxLength={20}
            />
          ) : (
            <button className="vb-chip-add" onClick={() => setAddingTheme(true)}>
              <Plus size={11} /> Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
