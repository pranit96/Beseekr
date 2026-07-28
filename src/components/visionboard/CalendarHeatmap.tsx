import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Habit, HabitLog } from "@/api/visionboard";

interface CalendarHeatmapProps {
  habits: Habit[];
  year: number;
  month: number;
}

type DayStatus = "full" | "partial" | "missed" | "future" | "empty";

function getDayStatus(habits: Habit[], dateStr: string, today: string): DayStatus {
  if (dateStr > today) return "future";
  if (!habits.length)  return "empty";

  const allLogs = habits.flatMap((h) => h.logs.filter((l) => l.log_date === dateStr));
  if (!allLogs.length) return "missed";

  const donePct = allLogs.filter((l) => l.status === "done").length / habits.length;
  if (donePct >= 0.8) return "full";
  if (donePct >= 0.4) return "partial";
  return "missed";
}

const DOT_MAP: Record<DayStatus, { char: string; cls: string }> = {
  full:    { char: "●", cls: "vb-heat-full"    },
  partial: { char: "◐", cls: "vb-heat-partial" },
  missed:  { char: "○", cls: "vb-heat-missed"  },
  future:  { char: "·", cls: "vb-heat-future"  },
  empty:   { char: "·", cls: "vb-heat-empty"   },
};

const DAY_LABELS = ["M","T","W","T","F","S","S"];

export function CalendarHeatmap({ habits, year, month }: CalendarHeatmapProps) {
  const today = new Date().toISOString().split("T")[0];

  const weeks = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay  = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();

    // Monday = 0, Sunday = 6
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const cells: Array<{ date: string | null; label: string }> = [];

    // Leading empty cells
    for (let i = 0; i < startOffset; i++) {
      cells.push({ date: null, label: "" });
    }
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      cells.push({ date: dateStr, label: String(d) });
    }

    // Chunk into weeks
    const ws: typeof cells[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      ws.push(cells.slice(i, i + 7));
    }
    return ws;
  }, [year, month]);

  return (
    <div className="vb-section vb-heatmap">
      <div className="vb-section-label">
        <span>🗓</span>
        <span>Calendar Heatmap</span>
      </div>

      <div className="vb-heatmap-grid">
        {/* Day headers */}
        <div className="vb-heatmap-row">
          {DAY_LABELS.map((d, i) => (
            <span key={i} className="vb-heat-day-label">{d}</span>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="vb-heatmap-row">
            {week.map((cell, di) => {
              if (!cell.date) {
                return <span key={di} className="vb-heat-cell vb-heat-empty">·</span>;
              }
              const status = getDayStatus(habits, cell.date, today);
              const { char, cls } = DOT_MAP[status];
              const isToday = cell.date === today;
              return (
                <motion.span
                  key={di}
                  className={`vb-heat-cell ${cls} ${isToday ? "vb-heat-today" : ""}`}
                  title={`${cell.date}: ${status}`}
                  whileHover={{ scale: 1.3 }}
                >
                  {char}
                </motion.span>
              );
            })}
          </div>
        ))}
      </div>

      <div className="vb-heatmap-legend">
        <span className="vb-heat-full">●</span> All habits done &nbsp;
        <span className="vb-heat-partial">◐</span> Partial &nbsp;
        <span className="vb-heat-missed">○</span> Missed
      </div>
    </div>
  );
}
