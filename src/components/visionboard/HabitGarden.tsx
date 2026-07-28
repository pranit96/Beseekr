import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import type { Habit, HabitLog } from "@/api/visionboard";

interface HabitGardenProps {
  habits: Habit[];
  year: number;
  month: number;
  onAddHabit:  (payload: { name: string; icon?: string }) => Promise<any>;
  onDeleteHabit: (habitId: string) => Promise<any>;
  onLogHabit:  (habitId: string, payload: { logDate: string; status: HabitLog["status"] }) => Promise<any>;
}

const STATUS_DOT: Record<HabitLog["status"], string> = {
  done:    "●",
  partial: "◐",
  missed:  "○",
};

const STATUS_CLASS: Record<HabitLog["status"], string> = {
  done:    "vb-dot-done",
  partial: "vb-dot-partial",
  missed:  "vb-dot-missed",
};

const CYCLE: HabitLog["status"][] = ["done", "partial", "missed"];
const ICONS = ["🌱","🌿","🌼","🌸","☀","💧","📚","🏃","🧘","🎯"];

function getLogForDay(logs: HabitLog[], date: string): HabitLog | undefined {
  return logs.find((l) => l.log_date === date);
}

function getDaysInMonth(year: number, month: number): string[] {
  const count = new Date(year, month, 0).getDate();
  return Array.from({ length: count }, (_, i) => {
    const d = i + 1;
    return `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  });
}

export function HabitGarden({ habits, year, month, onAddHabit, onDeleteHabit, onLogHabit }: HabitGardenProps) {
  const [showForm, setShowForm]   = useState(false);
  const [habitName, setHabitName] = useState("");
  const [habitIcon, setHabitIcon] = useState("🌱");
  const [saving, setSaving]       = useState(false);

  const days  = getDaysInMonth(year, month);
  const today = new Date().toISOString().split("T")[0];

  async function handleAdd() {
    if (!habitName.trim()) return;
    setSaving(true);
    await onAddHabit({ name: habitName.trim(), icon: habitIcon });
    setHabitName(""); setHabitIcon("🌱"); setShowForm(false);
    setSaving(false);
  }

  async function handleDotClick(habitId: string, date: string, currentLog?: HabitLog) {
    // Only allow logging today or past days
    if (date > today) return;
    const currentStatus = currentLog?.status || null;
    // cycle: null → done → partial → missed → null (remove)
    let nextStatus: HabitLog["status"] | null = "done";
    if (currentStatus === "done")    nextStatus = "partial";
    if (currentStatus === "partial") nextStatus = "missed";
    if (currentStatus === "missed")  nextStatus = "done";
    await onLogHabit(habitId, { logDate: date, status: nextStatus || "done" });
  }

  // Show last 7 days for compact view, full month for scroll
  const showDays = days.slice(-7);

  return (
    <div className="vb-section vb-habit-garden">
      <div className="vb-section-header">
        <div className="vb-section-label">
          <span>🌱</span>
          <span>Habit Garden</span>
        </div>
        <button className="vb-chip-add" onClick={() => setShowForm((s) => !s)}>
          <Plus size={12} /> Add Habit
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="vb-goals-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{    height: 0, opacity: 0 }}
          >
            <div className="vb-emoji-grid">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  className={`vb-emoji-btn ${habitIcon === ic ? "vb-emoji-selected" : ""}`}
                  onClick={() => setHabitIcon(ic)}
                >{ic}</button>
              ))}
            </div>
            <input
              className="vb-form-input"
              placeholder="Habit name (e.g. Meditate)"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              autoFocus
            />
            <div className="vb-form-actions">
              <button className="vb-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="vb-btn-primary" onClick={handleAdd} disabled={saving || !habitName.trim()}>
                {saving ? "Adding…" : "Plant"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day header */}
      {habits.length > 0 && (
        <div className="vb-habit-header-row">
          <span className="vb-habit-name-col" />
          {showDays.map((d) => {
            const dayNum = parseInt(d.split("-")[2], 10);
            return (
              <span key={d} className={`vb-dot-col vb-day-label ${d === today ? "vb-today-label" : ""}`}>
                {dayNum}
              </span>
            );
          })}
        </div>
      )}

      {/* Habit rows */}
      <AnimatePresence>
        {habits.length === 0 && !showForm && (
          <motion.p className="vb-empty-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            Plant your first habit for the month…
          </motion.p>
        )}

        {habits.map((habit) => (
          <motion.div
            key={habit.id}
            className="vb-habit-row"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            layout
          >
            <div className="vb-habit-name-col">
              <span className="vb-habit-icon">{habit.icon}</span>
              <span className="vb-habit-name">{habit.name}</span>
              <button className="vb-goal-del" onClick={() => onDeleteHabit(habit.id)}>
                <Trash2 size={10} />
              </button>
            </div>

            {showDays.map((d) => {
              const log = getLogForDay(habit.logs, d);
              const isFuture = d > today;
              return (
                <motion.button
                  key={d}
                  className={`vb-dot-col vb-habit-dot ${log ? STATUS_CLASS[log.status] : "vb-dot-empty"} ${isFuture ? "vb-dot-future" : ""}`}
                  onClick={() => handleDotClick(habit.id, d, log)}
                  disabled={isFuture}
                  whileHover={!isFuture ? { scale: 1.3 } : {}}
                  whileTap={!isFuture  ? { scale: 0.9 } : {}}
                  title={d}
                >
                  {log ? STATUS_DOT[log.status] : "·"}
                </motion.button>
              );
            })}
          </motion.div>
        ))}
      </AnimatePresence>

      <p className="vb-area-hint">● done &nbsp; ◐ partial &nbsp; ○ missed — click a dot to log</p>
    </div>
  );
}
