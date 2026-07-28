import { motion } from "framer-motion";
import type { MonthSummary } from "@/api/visionboard";

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface YearJourneyProps {
  summary: MonthSummary[];
  currentYear: number;
  activeMonth: number;
  onNavigate: (month: number) => void;
}

export function YearJourney({
  summary,
  currentYear,
  activeMonth,
  onNavigate,
}: YearJourneyProps) {
  const now = new Date();
  const isCurrentYear = now.getFullYear() === currentYear;

  return (
    <div className="vb-section vb-year-journey">
      <div className="vb-section-label">
        <span>🗺</span>
        <span>Year Journey — {currentYear}</span>
      </div>

      <div className="vb-journey-strip">
        {summary.map((ms) => {
          const isActive = ms.month === activeMonth;
          const isPast = isCurrentYear
            ? ms.month < now.getMonth() + 1
            : ms.month <= 12;
          const isCurrent = isCurrentYear && ms.month === now.getMonth() + 1;
          const isFuture = isCurrentYear && ms.month > now.getMonth() + 1;

          return (
            <motion.button
              key={ms.month}
              className={[
                "vb-journey-month",
                isActive ? "vb-journey-active" : "",
                isCurrent ? "vb-journey-current" : "",
                isFuture ? "vb-journey-future" : "",
              ].join(" ")}
              onClick={() => onNavigate(ms.month)}
              whileHover={{ y: -2, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={`${MONTH_ABBR[ms.month - 1]} — ${ms.done_count}/${ms.goal_count} goals done`}
            >
              <span className="vb-journey-label">
                {MONTH_ABBR[ms.month - 1]}
              </span>

              {/* Dots: done goals */}
              <div className="vb-journey-dots">
                {isCurrent && <span className="vb-journey-star">✨</span>}
                {!isCurrent && ms.exists && (
                  <>
                    {Array.from({ length: Math.min(ms.done_count, 3) }).map(
                      (_, i) => (
                        <span key={i} className="vb-dot-done">
                          ●
                        </span>
                      ),
                    )}
                    {Array.from({
                      length: Math.min(ms.goal_count - ms.done_count, 3),
                    }).map((_, i) => (
                      <span
                        key={`o${i}`}
                        className={isFuture ? "vb-dot-future" : "vb-dot-missed"}
                      >
                        ○
                      </span>
                    ))}
                    {!ms.goal_count && (
                      <span className="vb-dot-future">···</span>
                    )}
                  </>
                )}
                {!ms.exists && !isCurrent && (
                  <span className="vb-dot-future">···</span>
                )}
              </div>

              {/* Completion bar */}
              {ms.exists && ms.goal_count > 0 && (
                <div className="vb-journey-bar">
                  <motion.div
                    className="vb-journey-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${ms.completion_pct}%` }}
                    transition={{ duration: 0.8, delay: ms.month * 0.05 }}
                  />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
