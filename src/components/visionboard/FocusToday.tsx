import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Zap } from "lucide-react";
import type { BoardMonth } from "@/api/visionboard";

interface FocusTodayProps {
  focusItems: string[];
  month: number;
  year: number;
  onUpdate: (updates: Partial<Pick<BoardMonth, "focus_items">>) => void;
}

export function FocusToday({ focusItems, month, year, onUpdate }: FocusTodayProps) {
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem]       = useState("");

  // % of month elapsed
  const now       = new Date();
  const totalDays = new Date(year, month, 0).getDate();
  const elapsed   = now.getFullYear() === year && now.getMonth() + 1 === month
    ? now.getDate()
    : totalDays;
  const pct = Math.round((elapsed / totalDays) * 100);

  function addItem() {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    onUpdate({ focus_items: [...focusItems, trimmed] });
    setNewItem(""); setAddingItem(false);
  }

  function removeItem(item: string) {
    onUpdate({ focus_items: focusItems.filter((f) => f !== item) });
  }

  return (
    <div className="vb-section vb-sidebar vb-sidebar-right">
      <div className="vb-section-label">
        <Zap size={13} />
        <span>Focus Today</span>
      </div>

      <div className="vb-focus-list">
        <AnimatePresence>
          {focusItems.map((item) => (
            <motion.div
              key={item}
              className="vb-focus-item"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0,  opacity: 1 }}
              exit={{    x: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
            >
              <span className="vb-focus-dot">▸</span>
              <span className="vb-focus-text">{item}</span>
              <button className="vb-chip-x" onClick={() => removeItem(item)}>
                <X size={10} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {focusItems.length === 0 && (
          <p className="vb-empty-hint">Add today's 3 priorities…</p>
        )}
      </div>

      {addingItem ? (
        <input
          className="vb-chip-input vb-mt-2"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addItem(); if (e.key === "Escape") setAddingItem(false); }}
          onBlur={() => { if (newItem.trim()) addItem(); else setAddingItem(false); }}
          placeholder="e.g. Finish onboarding"
          autoFocus
        />
      ) : (
        <button className="vb-chip-add vb-mt-2" onClick={() => setAddingItem(true)}>
          <Plus size={11} /> Add Focus
        </button>
      )}

      {/* Month progress */}
      <div className="vb-month-progress">
        <div className="vb-progress-label">
          <span>Month Progress</span>
          <span className="vb-progress-pct">{pct}%</span>
        </div>
        <div className="vb-progress-track">
          <motion.div
            className="vb-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}
