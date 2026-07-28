import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, CheckSquare, Target } from "lucide-react";
import type { VisionGoal } from "@/api/visionboard";

interface MonthGoalsProps {
  goals: VisionGoal[];
  onAdd:    (payload: { title: string; progressTarget: number; progressUnit: string }) => Promise<any>;
  onUpdate: (goalId: string, updates: Partial<{ status: VisionGoal["status"]; progressCurrent: number }>) => Promise<any>;
  onDelete: (goalId: string) => Promise<any>;
}

const STATUS_LABELS: Record<VisionGoal["status"], string> = {
  not_started: "○ Not Started",
  in_progress: "◉ In Progress",
  done:        "✓ Done",
};

function GoalProgress({ goal }: { goal: VisionGoal }) {
  if (!goal.progress_target) {
    return <span className="vb-goal-status">{STATUS_LABELS[goal.status]}</span>;
  }

  const pct = Math.min(100, Math.round((goal.progress_current / goal.progress_target) * 100));
  const unit = goal.progress_unit || "";

  if (unit === "%") {
    return (
      <div className="vb-goal-progress-wrap">
        <div className="vb-goal-progress-track">
          <motion.div
            className="vb-goal-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${goal.progress_current}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <span className="vb-goal-pct">{goal.progress_current}%</span>
      </div>
    );
  }

  return (
    <span className="vb-goal-status">
      ○ {goal.progress_current} / {goal.progress_target}{unit ? ` ${unit}` : ""}
    </span>
  );
}

export function MonthGoals({ goals, onAdd, onUpdate, onDelete }: MonthGoalsProps) {
  const [showForm, setShowForm]   = useState(false);
  const [title, setTitle]         = useState("");
  const [target, setTarget]       = useState("");
  const [unit, setUnit]           = useState("");
  const [saving, setSaving]       = useState(false);

  async function handleAdd() {
    if (!title.trim()) return;
    setSaving(true);
    await onAdd({
      title: title.trim(),
      progressTarget: parseFloat(target) || 0,
      progressUnit: unit.trim(),
    });
    setTitle(""); setTarget(""); setUnit(""); setShowForm(false);
    setSaving(false);
  }

  async function cycleStatus(goal: VisionGoal) {
    const next: Record<VisionGoal["status"], VisionGoal["status"]> = {
      not_started: "in_progress",
      in_progress: "done",
      done: "not_started",
    };
    await onUpdate(goal.id, { status: next[goal.status] });
  }

  return (
    <div className="vb-section vb-goals-section">
      <div className="vb-section-header">
        <div className="vb-section-label">
          <Target size={14} />
          <span>Month Goals</span>
        </div>
        <button className="vb-chip-add" onClick={() => setShowForm((s) => !s)}>
          <Plus size={12} /> Add Goal
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
            <input
              className="vb-form-input"
              placeholder="Goal title (e.g. Read 3 Books)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            <div className="vb-goals-form-row">
              <input
                className="vb-form-input vb-form-input-sm"
                placeholder="Target (e.g. 3)"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                type="number"
                min="0"
              />
              <input
                className="vb-form-input vb-form-input-sm"
                placeholder="Unit (e.g. books, days, %)"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div className="vb-form-actions">
              <button className="vb-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="vb-btn-primary" onClick={handleAdd} disabled={saving || !title.trim()}>
                {saving ? "Adding…" : "Add"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals list */}
      <div className="vb-goals-list">
        <AnimatePresence>
          {goals.length === 0 && !showForm && (
            <motion.p
              className="vb-empty-hint"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              Set your first goal for this month…
            </motion.p>
          )}

          {goals.map((goal) => (
            <motion.div
              key={goal.id}
              className={`vb-goal-row ${goal.status === "done" ? "vb-goal-done" : ""}`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0,   opacity: 1 }}
              exit={{    x: -20, opacity: 0 }}
              layout
            >
              {/* Checkbox-style status toggle */}
              <button
                className={`vb-goal-check ${goal.status === "done" ? "vb-check-done" : goal.status === "in_progress" ? "vb-check-progress" : ""}`}
                onClick={() => cycleStatus(goal)}
                aria-label="Toggle status"
              >
                {goal.status === "done" ? "✓" : goal.status === "in_progress" ? "◉" : "□"}
              </button>

              <div className="vb-goal-body">
                <span className="vb-goal-title">{goal.title}</span>
                <GoalProgress goal={goal} />
              </div>

              {/* Inline progress bump */}
              {goal.progress_target > 0 && goal.status !== "done" && (
                <button
                  className="vb-goal-bump"
                  onClick={() =>
                    onUpdate(goal.id, {
                      progressCurrent: Math.min(goal.progress_target, goal.progress_current + 1),
                    })
                  }
                  title="Log +1 progress"
                >
                  +1
                </button>
              )}

              <button className="vb-goal-del" onClick={() => onDelete(goal.id)}>
                <Trash2 size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
