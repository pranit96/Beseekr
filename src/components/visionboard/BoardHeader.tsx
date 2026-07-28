import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Pencil, Check } from "lucide-react";
import { useState } from "react";
import type { BoardMonth } from "@/api/visionboard";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

interface BoardHeaderProps {
  boardMonth: BoardMonth;
  onPrev: () => void;
  onNext: () => void;
  onUpdate: (updates: Partial<Pick<BoardMonth, "quote" | "mood_tag">>) => void;
  isCurrentMonth: boolean;
}

export function BoardHeader({ boardMonth, onPrev, onNext, onUpdate, isCurrentMonth }: BoardHeaderProps) {
  const [editingQuote, setEditingQuote] = useState(false);
  const [editingMood, setEditingMood]   = useState(false);
  const [quoteVal, setQuoteVal]         = useState(boardMonth.quote || "");
  const [moodVal, setMoodVal]           = useState(boardMonth.mood_tag || "");
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  function saveQuote() {
    onUpdate({ quote: quoteVal });
    setEditingQuote(false);
  }
  function saveMood() {
    onUpdate({ mood_tag: moodVal });
    setEditingMood(false);
  }

  return (
    <motion.div
      key={`${boardMonth.year}-${boardMonth.month}`}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="vb-header-card"
    >
      {/* Decorative grain */}
      <div className="vb-grain-overlay" />

      {/* Month nav */}
      <div className="vb-header-inner">
        <button onClick={onPrev} className="vb-nav-btn" aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>

        <div className="vb-header-center">
          {/* Month + Year */}
          <div className="vb-month-title">
            <span className="vb-ornament">✿</span>
            <span>{MONTHS[boardMonth.month - 1].toUpperCase()} • {boardMonth.year}</span>
            <span className="vb-ornament">✿</span>
          </div>

          {/* Quote */}
          <div className="vb-quote-row">
            {editingQuote ? (
              <div className="vb-edit-row">
                <input
                  className="vb-quote-input"
                  value={quoteVal}
                  onChange={e => setQuoteVal(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveQuote()}
                  autoFocus
                />
                <button onClick={saveQuote} className="vb-save-btn"><Check size={14} /></button>
              </div>
            ) : (
              <p className="vb-quote" onClick={() => setEditingQuote(true)}>
                "{boardMonth.quote || "Click to add your monthly quote..."}"
                <Pencil size={11} className="vb-inline-pencil" />
              </p>
            )}
          </div>

          {/* Meta row */}
          <div className="vb-meta-row">
            {/* Mood tag */}
            {editingMood ? (
              <div className="vb-edit-row">
                <input
                  className="vb-mood-input"
                  value={moodVal}
                  onChange={e => setMoodVal(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveMood()}
                  autoFocus
                  placeholder="e.g. Calm Morning"
                />
                <button onClick={saveMood} className="vb-save-btn"><Check size={14} /></button>
              </div>
            ) : (
              <span className="vb-mood-tag" onClick={() => setEditingMood(true)}>
                ☁ {boardMonth.mood_tag || "Set mood"}
                <Pencil size={10} className="vb-inline-pencil" />
              </span>
            )}

            <span className="vb-divider">•</span>
            <span className="vb-time">🕐 {timeStr}</span>
            {isCurrentMonth && (
              <>
                <span className="vb-divider">•</span>
                <span className="vb-current-badge">This Month</span>
              </>
            )}
          </div>
        </div>

        <button onClick={onNext} className="vb-nav-btn" aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}
