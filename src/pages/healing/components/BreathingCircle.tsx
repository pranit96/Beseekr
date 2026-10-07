// src/pages/healing/components/BreathingCircle.tsx
// Multi-mode breathing studio: Physiological Sigh, 4-7-8 Relax, Box Focus, Resonant Cleanse, Energize
// Flicker-free hardware-accelerated CSS animations, SVG countdown ring, optional harmonic audio chimes.

import { useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sparkles,
  Moon,
  Target,
  Wind,
  Zap,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type BreathingCategory = "reset" | "relax" | "sleep" | "focus" | "cleanse" | "energy";

export interface PhaseConfig {
  name: "inhale" | "inhale2" | "hold" | "exhale" | "holdEmpty";
  label: string;
  duration: number; // in seconds
  scale: number;
  instruction: string;
}

export interface BreathingMode {
  id: string;
  name: string;
  category: BreathingCategory;
  categoryLabel: string;
  icon: typeof Wind;
  tag: string;
  description: string;
  scientificBenefit: string;
  phases: PhaseConfig[];
  defaultCycles: number;
  colorScheme: {
    ring: string;
    glow: string;
    badge: string;
    bgGlow: string;
  };
}

export const BREATHING_MODES: BreathingMode[] = [
  {
    id: "sigh",
    name: "Physiological Sigh",
    category: "reset",
    categoryLabel: "Instant Reset",
    icon: Wind,
    tag: "Stress Downregulation",
    description: "Two quick nasal inhales followed by a prolonged, relaxed exhale.",
    scientificBenefit:
      "Rapidly re-inflates collapsed alveoli in the lungs and triggers the vagus nerve to slow heart rate in under 90 seconds.",
    defaultCycles: 4,
    colorScheme: {
      ring: "stroke-cyan-500",
      glow: "from-cyan-500/30 to-blue-500/10",
      badge: "border-cyan-500/40 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10",
      bgGlow: "bg-cyan-500/10",
    },
    phases: [
      { name: "inhale", label: "Deep Inhale", duration: 2, scale: 1.35, instruction: "Breathe in deeply through your nose" },
      { name: "inhale2", label: "Top-Up Inhale", duration: 1, scale: 1.5, instruction: "Take a sharp second sip of air at the top" },
      { name: "hold", label: "Brief Hold", duration: 1, scale: 1.5, instruction: "Hold effortlessly for just a second" },
      { name: "exhale", label: "Long Exhale", duration: 5, scale: 1.0, instruction: "Release slowly and completely through mouth" },
    ],
  },
  {
    id: "478",
    name: "4-7-8 Relax & Sleep",
    category: "sleep",
    categoryLabel: "Sleep & Deep Rest",
    icon: Moon,
    tag: "Parasympathetic Shift",
    description: "Inhale 4s, hold gently for 7s, and exhale smoothly for 8s.",
    scientificBenefit:
      "Acts as a natural tranquilizer for the central nervous system, drastically lowering cortisol and encouraging melatonin release.",
    defaultCycles: 4,
    colorScheme: {
      ring: "stroke-indigo-500",
      glow: "from-indigo-500/30 to-purple-500/10",
      badge: "border-indigo-500/40 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
      bgGlow: "bg-indigo-500/10",
    },
    phases: [
      { name: "inhale", label: "Inhale Quietly", duration: 4, scale: 1.45, instruction: "Inhale quietly through your nose" },
      { name: "hold", label: "Hold Breath", duration: 7, scale: 1.45, instruction: "Hold gently without straining" },
      { name: "exhale", label: "Slow Exhale", duration: 8, scale: 1.0, instruction: "Make a soft whoosh sound through your mouth" },
    ],
  },
  {
    id: "box",
    name: "Box Breathing (4-4-4-4)",
    category: "focus",
    categoryLabel: "Concentration",
    icon: Target,
    tag: "High Focus & Clarity",
    description: "Equal 4-second intervals for inhale, hold full, exhale, and hold empty.",
    scientificBenefit:
      "Used by tactical operators and elite performers to stabilize CO₂ levels, eliminate mental chatter, and sharpen focus under high stakes.",
    defaultCycles: 4,
    colorScheme: {
      ring: "stroke-emerald-500",
      glow: "from-emerald-500/30 to-teal-500/10",
      badge: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
      bgGlow: "bg-emerald-500/10",
    },
    phases: [
      { name: "inhale", label: "Inhale (4s)", duration: 4, scale: 1.4, instruction: "Breathe in steadily through your nose" },
      { name: "hold", label: "Hold Full (4s)", duration: 4, scale: 1.4, instruction: "Hold comfortably with lungs full" },
      { name: "exhale", label: "Exhale (4s)", duration: 4, scale: 1.0, instruction: "Exhale smoothly at an even rate" },
      { name: "holdEmpty", label: "Hold Empty (4s)", duration: 4, scale: 1.0, instruction: "Rest peacefully with lungs empty" },
    ],
  },
  {
    id: "coherent",
    name: "Resonant Coherence",
    category: "cleanse",
    categoryLabel: "Cleanse & Balance",
    icon: Sparkles,
    tag: "Heart-Rate Variability (HRV)",
    description: "Smooth 5.5-second inhalation and 5.5-second exhalation (5.5 breaths per minute).",
    scientificBenefit:
      "Synchronizes heart rhythm, blood pressure, and brain wave oscillations to produce peak autonomic coherence and clear emotional tension.",
    defaultCycles: 5,
    colorScheme: {
      ring: "stroke-teal-500",
      glow: "from-teal-500/30 to-emerald-500/10",
      badge: "border-teal-500/40 text-teal-600 dark:text-teal-400 bg-teal-500/10",
      bgGlow: "bg-teal-500/10",
    },
    phases: [
      { name: "inhale", label: "Smooth Inhale", duration: 5.5, scale: 1.4, instruction: "Expand your lower belly as you inhale" },
      { name: "exhale", label: "Smooth Exhale", duration: 5.5, scale: 1.0, instruction: "Soften your chest and abdomen as you exhale" },
    ],
  },
  {
    id: "energize",
    name: "Awaken & Energize",
    category: "energy",
    categoryLabel: "Vitality & Awake",
    icon: Zap,
    tag: "Morning Clarity",
    description: "Crisp 3s inhale, 1s pause, and 3s active exhale.",
    scientificBenefit:
      "Stimulates oxygen delivery to cerebral tissue, increases alertness, and shakes off afternoon fatigue or morning lethargy.",
    defaultCycles: 6,
    colorScheme: {
      ring: "stroke-amber-500",
      glow: "from-amber-500/30 to-orange-500/10",
      badge: "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10",
      bgGlow: "bg-amber-500/10",
    },
    phases: [
      { name: "inhale", label: "Active Inhale", duration: 3, scale: 1.4, instruction: "Draw breath vigorously into your chest" },
      { name: "hold", label: "Brief Pause", duration: 1, scale: 1.4, instruction: "Feel the oxygen circulate" },
      { name: "exhale", label: "Crisp Exhale", duration: 3, scale: 1.0, instruction: "Push breath out with intention" },
    ],
  },
];

interface BreathingCircleProps {
  onComplete?: () => void;
  totalCycles?: number;
  initialModeId?: string;
  className?: string;
}

// Gentle harmonic chime via Web Audio API (Zero external assets needed)
function playGentleChime(freq = 528) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Smooth envelope: soft rise, exponential decay like a singing bowl
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.25);
  } catch {
    // Audio context may be restricted by user agent until first interaction
  }
}

export function BreathingCircle({
  onComplete,
  totalCycles: defaultCyclesProp,
  initialModeId = "sigh",
  className,
}: BreathingCircleProps) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  // Selected mode state
  const [selectedModeId, setSelectedModeId] = useState<string>(initialModeId);
  const activeMode = useMemo(
    () => BREATHING_MODES.find((m) => m.id === selectedModeId) || BREATHING_MODES[0],
    [selectedModeId],
  );

  // Cycle and duration settings
  const [targetCycles, setTargetCycles] = useState<number>(
    defaultCyclesProp || activeMode.defaultCycles,
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Exercise running state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [currentCycle, setCurrentCycle] = useState<number>(0);
  const [phaseIndex, setPhaseIndex] = useState<number>(0);
  const [phaseProgress, setPhaseProgress] = useState<number>(0); // 0 to 1
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  const currentPhase = activeMode.phases[phaseIndex] || activeMode.phases[0];

  // Animation timing reference
  const timerRef = useRef<number | null>(null);
  const phaseStartTimeRef = useRef<number>(0);

  // Update targetCycles if mode changes while stopped
  const handleSelectMode = (modeId: string) => {
    if (isRunning) stopExercise();
    setSelectedModeId(modeId);
    const mode = BREATHING_MODES.find((m) => m.id === modeId);
    if (mode) {
      setTargetCycles(defaultCyclesProp || mode.defaultCycles);
    }
  };

  const stopExercise = () => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    setIsRunning(false);
    setPhaseIndex(0);
    setCurrentCycle(0);
    setPhaseProgress(0);
    setSecondsRemaining(0);
  };

  const startExercise = () => {
    setIsCompleted(false);
    setIsRunning(true);
    setCurrentCycle(0);
    setPhaseIndex(0);
    phaseStartTimeRef.current = performance.now();
    if (soundEnabled) playGentleChime(432);
  };

  // Main animation clock loop using requestAnimationFrame for zero-flicker smoothness
  useEffect(() => {
    if (!isRunning) return;

    let localPhaseIdx = phaseIndex;
    let localCycle = currentCycle;

    const tick = (now: number) => {
      const activePhase = activeMode.phases[localPhaseIdx];
      const durationMs = activePhase.duration * 1000;
      const elapsed = now - phaseStartTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      const remaining = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));

      setPhaseProgress(progress);
      setSecondsRemaining(remaining);

      if (elapsed >= durationMs) {
        // Transition to next phase
        const nextPhaseIdx = localPhaseIdx + 1;
        if (nextPhaseIdx < activeMode.phases.length) {
          localPhaseIdx = nextPhaseIdx;
          setPhaseIndex(nextPhaseIdx);
          phaseStartTimeRef.current = now;
          if (soundEnabled) {
            const nextPhaseName = activeMode.phases[nextPhaseIdx].name;
            const chimeFreq = nextPhaseName === "exhale" ? 396 : 528;
            playGentleChime(chimeFreq);
          }
        } else {
          // Completed a cycle
          const nextCycle = localCycle + 1;
          if (nextCycle >= targetCycles) {
            // Exercise completed
            setIsRunning(false);
            setIsCompleted(true);
            setPhaseProgress(1);
            setSecondsRemaining(0);
            if (soundEnabled) playGentleChime(639);
            onComplete?.();
            return;
          } else {
            localCycle = nextCycle;
            localPhaseIdx = 0;
            setCurrentCycle(nextCycle);
            setPhaseIndex(0);
            phaseStartTimeRef.current = now;
            if (soundEnabled) playGentleChime(432);
          }
        }
      }

      timerRef.current = requestAnimationFrame(tick);
    };

    timerRef.current = requestAnimationFrame(tick);

    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [isRunning, activeMode, targetCycles, soundEnabled, onComplete, phaseIndex, currentCycle]);

  // SVG circular dimensions
  const size = 260;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - phaseProgress * circumference;

  // Compute smooth scale factor for the orb
  const currentScale = useMemo(() => {
    if (!isRunning) return 1;
    const targetScale = currentPhase.scale;
    const prevPhaseScale =
      phaseIndex === 0
        ? activeMode.phases[activeMode.phases.length - 1].scale
        : activeMode.phases[phaseIndex - 1].scale;

    // Linear interpolation between previous phase scale and target phase scale
    return prevPhaseScale + (targetScale - prevPhaseScale) * phaseProgress;
  }, [isRunning, currentPhase, activeMode, phaseIndex, phaseProgress]);

  return (
    <div className={cn("flex flex-col items-center gap-6 w-full max-w-xl mx-auto", className)}>
      {/* ─── Mode Selector Tabs ────────────────────────────────────────────── */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Breathing Protocol
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled((v) => !v)}
            className="h-8 px-2 text-xs text-muted-foreground gap-1.5"
            title={soundEnabled ? "Mute audio cues" : "Unmute audio cues"}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-500" />
                <span className="hidden sm:inline">Chime On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-muted-foreground" />
                <span className="hidden sm:inline">Chime Off</span>
              </>
            )}
          </Button>
        </div>

        {/* Mode Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {BREATHING_MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = mode.id === selectedModeId;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleSelectMode(mode.id)}
                className={cn(
                  "flex flex-col items-center text-center p-2.5 rounded-2xl border transition-all text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                    : "border-border/60 bg-card/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                )}
              >
                <Icon className={cn("w-4 h-4 mb-1", isSelected ? "text-primary" : "text-muted-foreground")} />
                <span className="truncate w-full">{mode.categoryLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode Title & Science Callout */}
      <div className="text-center space-y-1 w-full px-2">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <h2 className="text-xl font-bold text-foreground">{activeMode.name}</h2>
          <Badge variant="outline" className={cn("text-[10px]", activeMode.colorScheme.badge)}>
            {activeMode.tag}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
          {activeMode.scientificBenefit}
        </p>
      </div>

      {/* ─── Animated Breathing Orb & Ring ─────────────────────────────────── */}
      <div className="relative flex items-center justify-center w-72 h-72 my-2">
        {/* Ambient atmospheric backlight */}
        <div
          className={cn(
            "absolute inset-0 rounded-full blur-3xl opacity-60 transition-colors duration-1000",
            activeMode.colorScheme.bgGlow,
          )}
        />

        {/* Outer SVG Progress Ring */}
        <svg className="absolute w-[260px] h-[260px] transform -rotate-90 pointer-events-none z-10" aria-hidden="true">
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-muted/20"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Dynamic progress stroke */}
          {isRunning && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className={cn("transition-all duration-75", activeMode.colorScheme.ring)}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          )}
        </svg>

        {/* Morphing Atmospheric Pulse Orb (No class-swapping to eliminate flicker) */}
        <div
          className={cn(
            "absolute w-44 h-44 rounded-full bg-gradient-radial shadow-2xl transition-transform duration-100 ease-linear",
            activeMode.colorScheme.glow,
          )}
          style={{
            transform: shouldReduceMotion ? "scale(1)" : `scale(${currentScale})`,
            willChange: "transform",
          }}
          aria-hidden="true"
        />

        {/* Center Display Capsule */}
        <motion.div
          className="relative z-20 flex flex-col items-center justify-center w-40 h-40 rounded-full bg-background/90 border border-border/80 backdrop-blur-md shadow-inner text-center p-3 select-none"
          initial={false}
          animate={{ scale: isRunning ? 1.02 : 1 }}
          transition={{ duration: 0.3 }}
        >
          {isCompleted ? (
            <div className="space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-foreground">Complete</p>
              <p className="text-[10px] text-muted-foreground">Feel the stillness</p>
            </div>
          ) : isRunning ? (
            <div className="space-y-0.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {currentPhase.label}
              </span>
              <div className="text-4xl font-extrabold text-foreground tracking-tighter my-0.5">
                {secondsRemaining}s
              </div>
              <span className="text-[10px] font-medium text-muted-foreground block">
                Cycle {currentCycle + 1} of {targetCycles}
              </span>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-3xl">🫁</span>
              <p className="text-xs font-semibold text-foreground">Ready</p>
              <p className="text-[10px] text-muted-foreground">{targetCycles} cycles</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* ─── Instruction Subtext ───────────────────────────────────────────── */}
      <div className="text-center min-h-[2.5rem] px-4" aria-live="polite">
        {isRunning ? (
          <p className="text-sm font-medium text-foreground transition-all">
            {currentPhase.instruction}
          </p>
        ) : isCompleted ? (
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Great session! Notice how your shoulders, jaw, and breath feel now.
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-muted-foreground">
            {activeMode.description}
          </p>
        )}
      </div>

      {/* ─── Controls & Duration Adjuster ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
        {/* Target Cycles / Time Selector (When stopped) */}
        {!isRunning && (
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-card/60 border border-border/50 text-xs">
            <span className="px-2 text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Cycles:
            </span>
            {[3, 4, 6, 8, 10].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setTargetCycles(c)}
                className={cn(
                  "px-2.5 py-1 rounded-xl text-xs font-medium transition-colors",
                  targetCycles === c
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <Button
              size="lg"
              onClick={startExercise}
              className="gap-2 rounded-2xl px-8 h-12 shadow-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              id="breathing-start-btn"
            >
              <Play className="w-4 h-4 fill-current" />
              {isCompleted ? "Start Again" : "Begin Breathing"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="lg"
              onClick={stopExercise}
              className="gap-2 rounded-2xl px-8 h-12 border-border/70 hover:bg-muted"
            >
              <RotateCcw className="w-4 h-4" />
              Stop Session
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
