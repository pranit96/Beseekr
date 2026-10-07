// src/pages/healing/components/BreathingCircle.tsx
// Animated physiological-sigh breathing guide.
// Respects prefers-reduced-motion.

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Phase = "idle" | "inhale1" | "inhale2" | "hold" | "exhale" | "done";

interface BreathingCircleProps {
  onComplete?: () => void;
  totalCycles?: number;
  className?: string;
}

// Physiological sigh: 2 quick nasal inhales, then long exhale
const PHASES: { phase: Exclude<Phase, "idle" | "done">; duration: number; label: string }[] = [
  { phase: "inhale1", duration: 1800, label: "Inhale (1st)" },
  { phase: "inhale2", duration: 800,  label: "Inhale again" },
  { phase: "hold",    duration: 800,  label: "Hold" },
  { phase: "exhale",  duration: 4000, label: "Exhale slowly" },
];

export function BreathingCircle({ onComplete, totalCycles = 3, className }: BreathingCircleProps) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const [cycle, setCycle] = useState(0);
  const [phaseLabel, setPhaseLabel] = useState("");
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  const runCycle = (cycleNum: number, phaseIdx: number) => {
    if (phaseIdx >= PHASES.length) {
      const nextCycle = cycleNum + 1;
      if (nextCycle >= totalCycles) {
        setPhase("done");
        setRunning(false);
        onComplete?.();
        return;
      }
      setCycle(nextCycle);
      runCycle(nextCycle, 0);
      return;
    }
    const { phase: p, duration, label } = PHASES[phaseIdx];
    setPhase(p);
    setPhaseLabel(label);
    timerRef.current = setTimeout(() => runCycle(cycleNum, phaseIdx + 1), duration);
  };

  const start = () => {
    clear();
    setCycle(0);
    setRunning(true);
    runCycle(0, 0);
  };

  const stop = () => {
    clear();
    setPhase("idle");
    setRunning(false);
  };

  useEffect(() => () => clear(), []);

  // Circle scale based on phase
  const circleScale = {
    idle: 1,
    inhale1: 1.35,
    inhale2: 1.5,
    hold: 1.5,
    exhale: 0.85,
    done: 1,
  }[phase];

  // Phase-based gradient color
  const circleColor = {
    idle: "from-primary/30 to-primary/10",
    inhale1: "from-primary/60 to-primary/30",
    inhale2: "from-primary/80 to-primary/50",
    hold: "from-primary/70 to-primary/40",
    exhale: "from-accent/60 to-accent/30",
    done: "from-green-400/40 to-green-300/20",
  }[phase];

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      {/* Circle */}
      <div className="relative flex items-center justify-center w-44 h-44">
        {/* Outer ring glow */}
        <motion.div
          className={cn("absolute inset-0 rounded-full bg-gradient-radial", circleColor)}
          animate={shouldReduceMotion ? {} : { scale: circleScale }}
          transition={{ duration: phase === "exhale" ? 4 : phase === "inhale1" ? 1.8 : 0.8, ease: "easeInOut" }}
          aria-hidden="true"
        />
        {/* Inner circle */}
        <motion.div
          className="relative z-10 flex items-center justify-center h-24 w-24 rounded-full bg-background border border-border shadow-inner"
          animate={shouldReduceMotion ? {} : { scale: circleScale * 0.7 + 0.3 }}
          transition={{ duration: phase === "exhale" ? 4 : phase === "inhale1" ? 1.8 : 0.8, ease: "easeInOut" }}
          aria-hidden="true"
        >
          <span className="text-2xl select-none">
            {phase === "done" ? "✓" : phase === "idle" ? "🫁" : ""}
          </span>
        </motion.div>
      </div>

      {/* Phase label */}
      <div className="text-center min-h-[3rem]" aria-live="polite" aria-atomic="true">
        {running && phase !== "done" && (
          <>
            <p className="text-lg font-semibold text-foreground">{t(`healing.breathing.${phase}`, phaseLabel)}</p>
            <p className="text-sm text-muted-foreground">
              {t("healing.breathing.cycle", { current: cycle + 1, total: totalCycles }, `Cycle ${cycle + 1}/${totalCycles}`)}
            </p>
          </>
        )}
        {phase === "idle" && (
          <p className="text-sm text-muted-foreground">{t("healing.breathing.start_hint", "Press Start to begin")}</p>
        )}
        {phase === "done" && (
          <p className="text-base font-medium text-green-600 dark:text-green-400">
            {t("healing.breathing.done", "Great job! Take a moment to notice how you feel.")}
          </p>
        )}
      </div>

      {/* Control */}
      <div className="flex gap-3">
        {!running ? (
          <button
            type="button"
            onClick={start}
            className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            id="breathing-start-btn"
          >
            {phase === "done"
              ? t("healing.breathing.again", "Again")
              : t("healing.breathing.start", "Start")}
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="rounded-full border border-border bg-card px-6 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {t("healing.breathing.stop", "Stop")}
          </button>
        )}
      </div>

      {/* Instruction */}
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        {t("healing.breathing.instruction",
          "Physiological sigh: two quick nasal inhales, then a long exhale. Activates your calm response.")}
      </p>
    </div>
  );
}
