// src/pages/healing/components/BreathingCircle.tsx
// Refined Breathing Studio — premium aesthetic, curated multi-layered audio, situation-aware guidance
// RAF-based animation engine (zero flicker), SVG ring, body-cue instructions, when-to-use cards.

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Volume2, VolumeX, Play, Square, RefreshCw,
  Sparkles, Moon, Target, Wind, Zap, Heart,
  CheckCircle2, Info, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BreathingCategory = "reset" | "relax" | "sleep" | "focus" | "cleanse" | "energy";

export interface PhaseConfig {
  name: "inhale" | "inhale2" | "hold" | "exhale" | "holdEmpty";
  label: string;
  duration: number;
  scale: number;
  instruction: string;
  bodyCue: string;         // micro-instruction about body/sensation
  chimeNote: number;       // Hz – unique note per phase action
}

export interface SituationCard {
  emoji: string;
  title: string;
  when: string;
}

export interface BreathingMode {
  id: string;
  name: string;
  subtitle: string;
  category: BreathingCategory;
  icon: typeof Wind;
  emoji: string;
  tagline: string;
  description: string;
  science: string;
  situations: SituationCard[];
  preparationTip: string;
  completionMessage: string;
  phases: PhaseConfig[];
  defaultCycles: number;
  colors: {
    ring: string;            // SVG stroke class
    orbFrom: string;         // gradient start (Tailwind inline)
    orbTo: string;           // gradient end
    orbGlow: string;         // box-shadow color
    accent: string;          // text accent class
    badge: string;           // badge bg + text
    pillActive: string;      // selected pill
    bg: string;              // ambient bg div class
    particle: string;        // floating particles
  };
}

// ─── Audio Engine ─────────────────────────────────────────────────────────────

function createSoundEngine() {
  let ctx: AudioContext | null = null;

  const getCtx = () => {
    if (!ctx || ctx.state === "closed") {
      const AudioCtx = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AudioCtx();
    }
    return ctx;
  };

  // Singing bowl resonance: layered harmonics with reverb-like tail
  const bowl = (freq: number, volume = 0.1, duration = 1.6) => {
    try {
      const c = getCtx();
      const now = c.currentTime;

      const harmonics = [1, 2.76, 5.40]; // bowl partial series
      harmonics.forEach((ratio, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        const vol = volume / (i + 1) * 0.9;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq * ratio, now);
        osc.frequency.exponentialRampToValueAtTime(freq * ratio * 0.998, now + duration);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(vol, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(now);
        osc.stop(now + duration + 0.05);
      });
    } catch {/* silently ignore if audio is blocked */}
  };

  // Soft breath-wind shimmer (for exhale transitions)
  const breathShimmer = (freq: number) => {
    try {
      const c = getCtx();
      const now = c.currentTime;
      const bufferSize = c.sampleRate * 0.8;
      const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const source = c.createBufferSource();
      source.buffer = buffer;

      const filter = c.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = freq;
      filter.Q.value = 0.8;

      const gain = c.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.04, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);
      source.start(now);
      source.stop(now + 0.85);
    } catch {/* silently ignore */}
  };

  // Completion chime chord (major triad)
  const completionChord = () => {
    try {
      [528, 660, 792].forEach((f, i) => {
        setTimeout(() => bowl(f, 0.09, 2.5), i * 120);
      });
    } catch {/* silently ignore */}
  };

  return { bowl, breathShimmer, completionChord };
}

const soundEngine = createSoundEngine();

// ─── Breathing Modes ──────────────────────────────────────────────────────────

export const BREATHING_MODES: BreathingMode[] = [
  {
    id: "sigh",
    name: "Physiological Sigh",
    subtitle: "Instant Nervous System Reset",
    category: "reset",
    icon: Wind,
    emoji: "🌬️",
    tagline: "30-second stress relief, clinically proven",
    description:
      "Two rapid nasal inhales — the second sip fully inflates collapsed alveoli — followed by a long, slow mouth exhale that activates your vagal brake.",
    science:
      "Discovered by Stanford neuroscientist Andrew Huberman, this is the fastest known conscious method to lower physiological arousal. The double-inhale maximally re-inflates micro-collapsed alveoli (air sacs) and the extended exhale drives parasympathetic dominance via the vagus nerve within 30 seconds.",
    situations: [
      { emoji: "😰", title: "Sudden anxiety spike", when: "When your heart suddenly races before a big moment" },
      { emoji: "😤", title: "Anger flash", when: "When you feel heat rising and need 30 seconds to re-center" },
      { emoji: "📊", title: "Pre-presentation", when: "Backstage, in the elevator, right before speaking" },
      { emoji: "🚗", title: "Traffic or commute stress", when: "When frustration is peaking on the road" },
    ],
    preparationTip: "Sit upright or stand. Relax your jaw and shoulders before you begin.",
    completionMessage: "Notice the warmth spreading through your chest — that's your parasympathetic system taking the wheel.",
    defaultCycles: 5,
    colors: {
      ring: "stroke-sky-400",
      orbFrom: "#38bdf8",
      orbTo: "#0ea5e9",
      orbGlow: "rgba(56,189,248,0.45)",
      accent: "text-sky-500 dark:text-sky-400",
      badge: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
      pillActive: "bg-sky-500/15 border-sky-500/50 text-sky-600 dark:text-sky-400",
      bg: "from-sky-500/10 via-transparent to-transparent",
      particle: "bg-sky-400/30",
    },
    phases: [
      {
        name: "inhale",
        label: "Deep Inhale",
        duration: 2,
        scale: 1.3,
        instruction: "Breathe in fully through your nose",
        bodyCue: "Feel your belly expand, then your ribs flare wide",
        chimeNote: 432,
      },
      {
        name: "inhale2",
        label: "Quick Top-Up",
        duration: 1,
        scale: 1.48,
        instruction: "One sharp sniff at the very top",
        bodyCue: "Pack in that last sip of air — upper chest lifts slightly",
        chimeNote: 528,
      },
      {
        name: "hold",
        label: "Tiny Pause",
        duration: 0.8,
        scale: 1.48,
        instruction: "Hold lightly for just a moment",
        bodyCue: "No effort — just stillness at the very top",
        chimeNote: 528,
      },
      {
        name: "exhale",
        label: "Long Release",
        duration: 6,
        scale: 0.92,
        instruction: "Release slowly and completely through your mouth",
        bodyCue: "Let your belly fall first, then your ribs — soft lips, no rush",
        chimeNote: 396,
      },
    ],
  },
  {
    id: "478",
    name: "4-7-8 Breathing",
    subtitle: "Sleep & Deep Parasympathetic Rest",
    category: "sleep",
    icon: Moon,
    emoji: "🌙",
    tagline: "A natural sedative for the nervous system",
    description:
      "Inhale for 4, hold breath for 7 counts, release in a smooth whoosh for 8. The extended hold elevates blood CO₂ slightly, unlocking deep calm.",
    science:
      "Developed by Dr. Andrew Weil from pranayama tradition and validated in clinical settings. The 7-second breath hold gently stimulates the baroreceptors in your carotid artery, signaling a drop in blood pressure. Cortisol falls measurably after just 4 cycles. Ideal as a pre-sleep ritual.",
    situations: [
      { emoji: "🛏️", title: "Cannot fall asleep", when: "Lying in bed with racing thoughts — do 4 cycles" },
      { emoji: "😟", title: "Chronic worry spiral", when: "When anxious thoughts keep looping after 10 PM" },
      { emoji: "💊", title: "Weaning off sleep aids", when: "As a natural alternative or supplement to medication" },
      { emoji: "🌃", title: "Night-time waking", when: "Woke at 3 AM and cannot settle back down" },
    ],
    preparationTip: "Lie on your back or recline. Dim lights. Place your tongue behind your upper front teeth.",
    completionMessage: "Let your eyes stay heavy. Your body knows how to sleep — you've given it permission.",
    defaultCycles: 4,
    colors: {
      ring: "stroke-violet-400",
      orbFrom: "#a78bfa",
      orbTo: "#7c3aed",
      orbGlow: "rgba(139,92,246,0.45)",
      accent: "text-violet-500 dark:text-violet-400",
      badge: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
      pillActive: "bg-violet-500/15 border-violet-500/50 text-violet-600 dark:text-violet-400",
      bg: "from-violet-500/10 via-transparent to-transparent",
      particle: "bg-violet-400/30",
    },
    phases: [
      {
        name: "inhale",
        label: "Inhale (4)",
        duration: 4,
        scale: 1.38,
        instruction: "Breathe in quietly through your nose",
        bodyCue: "Belly rises gently — keep your tongue behind upper teeth",
        chimeNote: 396,
      },
      {
        name: "hold",
        label: "Hold (7)",
        duration: 7,
        scale: 1.38,
        instruction: "Hold — completely still",
        bodyCue: "Relax your face and hands. Let the stillness settle in",
        chimeNote: 528,
      },
      {
        name: "exhale",
        label: "Whoosh Out (8)",
        duration: 8,
        scale: 0.88,
        instruction: "Exhale completely through your mouth — make a soft whooshing sound",
        bodyCue: "Lips slightly parted, audible breath, let every last bit go",
        chimeNote: 285,
      },
    ],
  },
  {
    id: "box",
    name: "Box Breathing",
    subtitle: "Elite Focus & Composure Under Pressure",
    category: "focus",
    icon: Target,
    emoji: "🎯",
    tagline: "Used by Navy SEALs, surgeons & athletes",
    description:
      "Four equal sides of 4 seconds each: Inhale → Hold Full → Exhale → Hold Empty. Creates a perfect square of CO₂ / O₂ equilibrium.",
    science:
      "Standard protocol in US Special Operations, ER medicine, and Olympic performance coaching. Equal-ratio breathing normalises blood CO₂, eliminates the hyperventilation response, and activates prefrontal cortex activity — reducing emotional reactivity while sharpening deliberate thinking.",
    situations: [
      { emoji: "🧠", title: "Deep work & flow state", when: "Before a 2-hour focused coding or writing block" },
      { emoji: "⚡", title: "High-stakes decision", when: "About to make a critical call or have a hard conversation" },
      { emoji: "🏆", title: "Performance anxiety", when: "Backstage, locker room, or exam hall nerves" },
      { emoji: "😡", title: "Emotional hijack", when: "When you feel reactive and need to reclaim clarity" },
    ],
    preparationTip: "Sit upright with feet flat. Soft gaze downward or eyes closed. Spine tall but relaxed.",
    completionMessage: "Feel the clarity. Your prefrontal cortex is online. You're ready for whatever's next.",
    defaultCycles: 6,
    colors: {
      ring: "stroke-emerald-400",
      orbFrom: "#34d399",
      orbTo: "#059669",
      orbGlow: "rgba(52,211,153,0.45)",
      accent: "text-emerald-500 dark:text-emerald-400",
      badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      pillActive: "bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-400",
      bg: "from-emerald-500/10 via-transparent to-transparent",
      particle: "bg-emerald-400/30",
    },
    phases: [
      {
        name: "inhale",
        label: "Inhale",
        duration: 4,
        scale: 1.38,
        instruction: "Breathe in steadily through your nose",
        bodyCue: "Expand your belly, then mid-chest — smooth and controlled",
        chimeNote: 432,
      },
      {
        name: "hold",
        label: "Hold Full",
        duration: 4,
        scale: 1.38,
        instruction: "Hold with lungs comfortably full",
        bodyCue: "Stay still — no gripping, no strain. Just presence",
        chimeNote: 528,
      },
      {
        name: "exhale",
        label: "Exhale",
        duration: 4,
        scale: 0.9,
        instruction: "Release evenly through your nose",
        bodyCue: "Let air escape at an even, unhurried pace — belly falls first",
        chimeNote: 396,
      },
      {
        name: "holdEmpty",
        label: "Hold Empty",
        duration: 4,
        scale: 0.9,
        instruction: "Rest with lungs gently empty",
        bodyCue: "Don't resist — this is the reset point. Observe the stillness",
        chimeNote: 285,
      },
    ],
  },
  {
    id: "coherent",
    name: "Resonant Coherence",
    subtitle: "Heart-Rate Variability & Inner Balance",
    category: "cleanse",
    icon: Heart,
    emoji: "💚",
    tagline: "5.5 breaths per minute — the human resonant frequency",
    description:
      "Breathe in for exactly 5.5 seconds, breathe out for exactly 5.5 seconds. No holds. A continuous wave that synchronises your autonomic systems.",
    science:
      "Research from HeartMath Institute and the Karolinska Institutet shows that breathing at ~5.5 bpm produces maximal Heart Rate Variability (HRV) — a key biomarker of resilience and health. It synchronises heart, lungs, and brain oscillations into a coherent state, clearing emotional tension and reducing inflammatory markers.",
    situations: [
      { emoji: "🧘", title: "Meditation warm-up", when: "Before a mindfulness or yoga session" },
      { emoji: "💔", title: "Emotional processing", when: "After a difficult conversation or emotional event" },
      { emoji: "📉", title: "HRV training", when: "Daily practice to build long-term stress resilience" },
      { emoji: "🌿", title: "Mid-day reset", when: "Between work blocks to cleanse accumulated mental tension" },
    ],
    preparationTip: "Place one hand on your heart. Breathe through your heart centre, not just your lungs.",
    completionMessage: "You've just tuned your body's most sophisticated self-regulation system. Carry this stillness forward.",
    defaultCycles: 8,
    colors: {
      ring: "stroke-teal-400",
      orbFrom: "#2dd4bf",
      orbTo: "#0d9488",
      orbGlow: "rgba(45,212,191,0.45)",
      accent: "text-teal-500 dark:text-teal-400",
      badge: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
      pillActive: "bg-teal-500/15 border-teal-500/50 text-teal-600 dark:text-teal-400",
      bg: "from-teal-500/10 via-transparent to-transparent",
      particle: "bg-teal-400/30",
    },
    phases: [
      {
        name: "inhale",
        label: "Heart Inhale",
        duration: 5.5,
        scale: 1.4,
        instruction: "Breathe into your heart — belly and chest rise together",
        bodyCue: "Imagine warmth filling your chest from the inside out",
        chimeNote: 528,
      },
      {
        name: "exhale",
        label: "Heart Exhale",
        duration: 5.5,
        scale: 0.9,
        instruction: "Soften and release — chest melts downward",
        bodyCue: "With each exhale, feel your body release a little more",
        chimeNote: 396,
      },
    ],
  },
  {
    id: "energize",
    name: "Awaken & Energize",
    subtitle: "Morning Clarity & Alertness Boost",
    category: "energy",
    icon: Zap,
    emoji: "⚡",
    tagline: "Oxygen surge — skip the second coffee",
    description:
      "Crisp 3-second inhale, short 1-second pause, forceful 3-second exhale. Activates the sympathetic nervous system — gently.",
    science:
      "Rapid diaphragmatic breathing increases tidal volume, floods cerebral tissue with oxygen, and briefly elevates norepinephrine — the neurotransmitter of alertness and focus. Unlike caffeine, the effect is immediate and clean, with no crash. Best done in the morning or after prolonged sitting.",
    situations: [
      { emoji: "🌅", title: "Morning sluggishness", when: "Can't wake up fully — groggy after alarm" },
      { emoji: "😴", title: "Afternoon crash", when: "3 PM slump hitting hard — need focus without more caffeine" },
      { emoji: "🏋️", title: "Pre-workout activation", when: "Before exercise to prime your cardiovascular system" },
      { emoji: "🔄", title: "Between tasks", when: "Transitioning between very different kinds of work" },
    ],
    preparationTip: "Stand up if possible. Roll your shoulders back. This one benefits from open posture.",
    completionMessage: "Feel that tingling? That's oxygen reaching every cell. You're awake, alert, and ready.",
    defaultCycles: 8,
    colors: {
      ring: "stroke-amber-400",
      orbFrom: "#fbbf24",
      orbTo: "#f59e0b",
      orbGlow: "rgba(251,191,36,0.45)",
      accent: "text-amber-500 dark:text-amber-400",
      badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      pillActive: "bg-amber-500/15 border-amber-500/50 text-amber-600 dark:text-amber-400",
      bg: "from-amber-500/10 via-transparent to-transparent",
      particle: "bg-amber-400/30",
    },
    phases: [
      {
        name: "inhale",
        label: "Active Inhale",
        duration: 3,
        scale: 1.42,
        instruction: "Draw breath vigorously — fill your lungs fast",
        bodyCue: "Chest rises actively. Energise the breath",
        chimeNote: 528,
      },
      {
        name: "hold",
        label: "Charge",
        duration: 1,
        scale: 1.42,
        instruction: "Hold — feel the oxygen circulate",
        bodyCue: "Sensation of fullness and energy at the top",
        chimeNote: 639,
      },
      {
        name: "exhale",
        label: "Power Release",
        duration: 3,
        scale: 0.9,
        instruction: "Exhale with intention — push it all out",
        bodyCue: "Engage your belly to push breath out completely",
        chimeNote: 432,
      },
    ],
  },
  {
    id: "calm478",
    name: "Extended Calm",
    subtitle: "Anxiety Relief & Emotional Regulation",
    category: "relax",
    icon: Sparkles,
    emoji: "🌊",
    tagline: "When anxiety peaks — this is your anchor",
    description:
      "A gentler variant of 4-7-8, extended to a 4-count inhale, 4-count hold, and 10-count exhale — maximising the calming exhale phase.",
    science:
      "The exhale-dominant pattern activates the dorsal vagal complex and parasympathetic system more powerfully than equal-ratio breathing. Research shows that when the exhale is significantly longer than the inhale, baroreflex sensitivity increases, heart rate slows measurably within 2 cycles, and perceived anxiety drops by up to 40% in clinical trials.",
    situations: [
      { emoji: "😱", title: "Panic attack onset", when: "Feel your first signs — racing heart, tight chest, dread" },
      { emoji: "🗣️", title: "Social anxiety", when: "Before or during socially overwhelming situations" },
      { emoji: "✈️", title: "Flight turbulence", when: "When you cannot control the situation — control your breath" },
      { emoji: "🔔", title: "Bad news landed", when: "Just received something difficult and need to stabilise" },
    ],
    preparationTip: "Ground yourself — both feet on floor. Place your hands palms-up in your lap. Soften your gaze.",
    completionMessage: "You regulated yourself through discomfort. That takes real skill. Notice how much slower your heart beats now.",
    defaultCycles: 5,
    colors: {
      ring: "stroke-rose-400",
      orbFrom: "#fb7185",
      orbTo: "#e11d48",
      orbGlow: "rgba(251,113,133,0.40)",
      accent: "text-rose-500 dark:text-rose-400",
      badge: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
      pillActive: "bg-rose-500/15 border-rose-500/50 text-rose-600 dark:text-rose-400",
      bg: "from-rose-500/10 via-transparent to-transparent",
      particle: "bg-rose-400/30",
    },
    phases: [
      {
        name: "inhale",
        label: "Gentle Inhale",
        duration: 4,
        scale: 1.35,
        instruction: "Breathe in slowly and softly through your nose",
        bodyCue: "Let your belly lead — no force, no effort",
        chimeNote: 396,
      },
      {
        name: "hold",
        label: "Pause",
        duration: 4,
        scale: 1.35,
        instruction: "Hold gently — no strain at all",
        bodyCue: "You are safe right now. Just here, just breathing",
        chimeNote: 432,
      },
      {
        name: "exhale",
        label: "Long Release",
        duration: 10,
        scale: 0.86,
        instruction: "Let it all go through your mouth — long, slow, complete",
        bodyCue: "Imagine releasing every worried thought with the breath",
        chimeNote: 285,
      },
    ],
  },
];

// ─── Props ─────────────────────────────────────────────────────────────────────

interface BreathingCircleProps {
  onComplete?: () => void;
  totalCycles?: number;
  initialModeId?: string;
  className?: string;
}

// ─── Floating Particles (ambient atmosphere) ─────────────────────────────────

function FloatingParticle({ color, delay }: { color: string; delay: number }) {
  const x = Math.random() * 100;
  const size = 3 + Math.random() * 5;
  const duration = 8 + Math.random() * 6;
  return (
    <motion.div
      className={cn("absolute rounded-full opacity-40 pointer-events-none", color)}
      style={{ left: `${x}%`, bottom: "-8px", width: size, height: size }}
      animate={{ y: [0, -(220 + Math.random() * 80)], opacity: [0, 0.4, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BreathingCircle({
  onComplete,
  totalCycles: defaultCyclesProp,
  initialModeId = "sigh",
  className,
}: BreathingCircleProps) {
  const shouldReduceMotion = useReducedMotion();

  const [selectedModeId, setSelectedModeId] = useState<string>(initialModeId);
  const activeMode = useMemo(
    () => BREATHING_MODES.find((m) => m.id === selectedModeId) || BREATHING_MODES[0],
    [selectedModeId],
  );

  const [targetCycles, setTargetCycles] = useState<number>(
    defaultCyclesProp || activeMode.defaultCycles,
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showScience, setShowScience] = useState<boolean>(false);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [currentCycle, setCurrentCycle] = useState<number>(0);
  const [phaseIndex, setPhaseIndex] = useState<number>(0);
  const [phaseProgress, setPhaseProgress] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  const currentPhase = activeMode.phases[phaseIndex] ?? activeMode.phases[0];

  const timerRef = useRef<number | null>(null);
  const phaseStartTimeRef = useRef<number>(0);
  const stateRef = useRef({ phaseIndex: 0, cycle: 0 });

  const stopExercise = useCallback(() => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    setIsRunning(false);
    setPhaseIndex(0);
    setCurrentCycle(0);
    setPhaseProgress(0);
    setSecondsRemaining(0);
    stateRef.current = { phaseIndex: 0, cycle: 0 };
  }, []);

  const handleSelectMode = (modeId: string) => {
    if (isRunning) stopExercise();
    setIsCompleted(false);
    setSelectedModeId(modeId);
    const mode = BREATHING_MODES.find((m) => m.id === modeId);
    if (mode) setTargetCycles(defaultCyclesProp || mode.defaultCycles);
  };

  const startExercise = () => {
    setIsCompleted(false);
    setIsRunning(true);
    setCurrentCycle(0);
    setPhaseIndex(0);
    stateRef.current = { phaseIndex: 0, cycle: 0 };
    phaseStartTimeRef.current = performance.now();
    if (soundEnabled) soundEngine.bowl(activeMode.phases[0].chimeNote, 0.09, 1.6);
  };

  // ─── RAF animation clock ──────────────────────────────────────────────────

  useEffect(() => {
    if (!isRunning) return;

    const tick = (now: number) => {
      const { phaseIndex: pIdx, cycle } = stateRef.current;
      const phase = activeMode.phases[pIdx];
      const durationMs = phase.duration * 1000;
      const elapsed = now - phaseStartTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      const remaining = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));

      setPhaseProgress(progress);
      setSecondsRemaining(remaining);

      if (elapsed >= durationMs) {
        const nextPIdx = pIdx + 1;
        if (nextPIdx < activeMode.phases.length) {
          // Next phase in same cycle
          stateRef.current.phaseIndex = nextPIdx;
          setPhaseIndex(nextPIdx);
          phaseStartTimeRef.current = now;
          if (soundEnabled) {
            const nextPhase = activeMode.phases[nextPIdx];
            if (nextPhase.name === "exhale" || nextPhase.name === "holdEmpty") {
              soundEngine.breathShimmer(nextPhase.chimeNote);
            } else {
              soundEngine.bowl(nextPhase.chimeNote, 0.07, 1.2);
            }
          }
        } else {
          // Cycle finished
          const nextCycle = cycle + 1;
          if (nextCycle >= targetCycles) {
            // Session complete
            setIsRunning(false);
            setIsCompleted(true);
            setPhaseProgress(1);
            setSecondsRemaining(0);
            if (soundEnabled) soundEngine.completionChord();
            onComplete?.();
            return;
          } else {
            stateRef.current = { phaseIndex: 0, cycle: nextCycle };
            setCurrentCycle(nextCycle);
            setPhaseIndex(0);
            phaseStartTimeRef.current = now;
            if (soundEnabled) soundEngine.bowl(activeMode.phases[0].chimeNote, 0.09, 1.6);
          }
        }
      }

      timerRef.current = requestAnimationFrame(tick);
    };

    timerRef.current = requestAnimationFrame(tick);
    return () => { if (timerRef.current) cancelAnimationFrame(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, activeMode, targetCycles, soundEnabled]);

  // ─── SVG Ring math ────────────────────────────────────────────────────────

  const SIZE = 280;
  const STROKE = 7;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * RADIUS;
  const dashOffset = CIRC - phaseProgress * CIRC;

  // ─── Orb scale interpolation (flicker-free linear lerp) ──────────────────

  const currentScale = useMemo(() => {
    if (!isRunning && !isCompleted) return 1;
    const pIdx = stateRef.current.phaseIndex;
    const target = activeMode.phases[pIdx]?.scale ?? 1;
    const prev =
      pIdx === 0
        ? activeMode.phases[activeMode.phases.length - 1].scale
        : activeMode.phases[pIdx - 1].scale;
    return prev + (target - prev) * phaseProgress;
  }, [isRunning, isCompleted, activeMode, phaseProgress]);

  // ─── Estimated session time ───────────────────────────────────────────────

  const estimatedSeconds = useMemo(() => {
    const cycleSeconds = activeMode.phases.reduce((s, p) => s + p.duration, 0);
    return Math.round(cycleSeconds * targetCycles);
  }, [activeMode, targetCycles]);

  const formatTime = (s: number) =>
    s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60 > 0 ? `${s % 60}s` : ""}`.trim();

  // ─── Phase type helper ────────────────────────────────────────────────────
  const isExhalePhase = currentPhase.name === "exhale" || currentPhase.name === "holdEmpty";

  return (
    <div className={cn("flex flex-col w-full", className)}>

      {/* ─── Mode Selector Row ─────────────────────────────────────────────────── */}
      <div className="w-full mb-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            Protocol
          </span>
          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            className={cn(
              "flex items-center gap-1 h-6 px-2.5 rounded-full text-[10px] font-medium border transition-all",
              soundEnabled
                ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                : "border-border/50 text-muted-foreground",
            )}
          >
            {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            <span>{soundEnabled ? "Chimes" : "Muted"}</span>
          </button>
        </div>

        {/* 6 mode pills in a single scrollable row */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {BREATHING_MODES.map((mode) => {
            const active = mode.id === selectedModeId;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleSelectMode(mode.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] whitespace-nowrap shrink-0 transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? cn("font-semibold shadow-sm", mode.colors.pillActive)
                    : "border-border/40 bg-card/60 text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                )}
                aria-pressed={active}
              >
                <span className="text-sm leading-none">{mode.emoji}</span>
                <span>{mode.name.split(" ").slice(0, 2).join(" ")}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Mode Header (compact, 1 line) ──────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMode.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 mb-2 flex-wrap"
        >
          <h2 className="text-base font-bold text-foreground tracking-tight">
            {activeMode.name}
          </h2>
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", activeMode.colors.badge)}>
            {activeMode.subtitle.split("&")[0].split("–")[0].trim()}
          </span>
          <p className={cn("text-[11px] font-medium ml-auto", activeMode.colors.accent)}>
            {activeMode.tagline}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* ─── Main Interaction Area: Orb Left + Controls Right ────────────────── */}
      <div className="flex items-center gap-4 w-full">

        {/* Orb + SVG Ring (smaller, fixed 220px) */}
        <div className="relative flex items-center justify-center shrink-0" style={{ width: 220, height: 220 }}>
          {/* Ambient glow */}
          <div
            className="absolute rounded-full blur-2xl opacity-20 pointer-events-none transition-all duration-1000"
            style={{
              width: 200, height: 200,
              background: `radial-gradient(circle, ${activeMode.colors.orbGlow}, transparent 70%)`,
            }}
          />

          {/* Floating particles */}
          {!shouldReduceMotion && isRunning && [...Array(6)].map((_, i) => (
            <FloatingParticle key={i} color={activeMode.colors.particle} delay={i * 0.8} />
          ))}

          {/* SVG ring */}
          <svg
            className="absolute pointer-events-none z-10"
            width={SIZE}
            height={SIZE}
            style={{ transform: "rotate(-90deg)" }}
            aria-hidden="true"
          >
            <circle
              cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
              className="stroke-muted/20"
              strokeWidth={STROKE}
              fill="transparent"
            />
            {(isRunning || isCompleted) && (
              <circle
                cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
                className={cn("transition-[stroke-dashoffset] duration-100 ease-linear", activeMode.colors.ring)}
                strokeWidth={STROKE}
                strokeDasharray={CIRC}
                strokeDashoffset={isCompleted ? 0 : dashOffset}
                strokeLinecap="round"
                fill="transparent"
              />
            )}
            {/* Cycle tick marks when idle */}
            {!isRunning && !isCompleted && Array.from({ length: targetCycles }).map((_, i) => {
              const angle = (i / targetCycles) * 360;
              const rad = (angle * Math.PI) / 180;
              const x1 = SIZE / 2 + (RADIUS - 4) * Math.cos(rad);
              const y1 = SIZE / 2 + (RADIUS - 4) * Math.sin(rad);
              const x2 = SIZE / 2 + (RADIUS + 4) * Math.cos(rad);
              const y2 = SIZE / 2 + (RADIUS + 4) * Math.sin(rad);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-muted/25" strokeWidth={1.5} />;
            })}
          </svg>

          {/* Orb */}
          <div
            className="absolute rounded-full pointer-events-none transition-colors duration-1000"
            style={{
              width: 155,
              height: 155,
              background: `radial-gradient(circle at 38% 38%, ${activeMode.colors.orbFrom}, ${activeMode.colors.orbTo})`,
              boxShadow: isRunning
                ? `0 0 ${30 + currentScale * 20}px ${activeMode.colors.orbGlow}, 0 0 ${60 + currentScale * 30}px ${activeMode.colors.orbGlow.replace(/[\d.]+\)$/, "0.15)")}`
                : `0 0 20px ${activeMode.colors.orbGlow.replace(/[\d.]+\)$/, "0.2)")}`,
              transform: shouldReduceMotion ? "scale(1)" : `scale(${currentScale})`,
              willChange: "transform, box-shadow",
              transition: "transform 80ms linear, box-shadow 300ms ease",
            }}
            aria-hidden="true"
          />

          {/* Center text */}
          <div className="relative z-20 flex flex-col items-center justify-center text-center select-none" style={{ width: 120, height: 120 }}>
            <AnimatePresence mode="wait">
              {isCompleted ? (
                <motion.div key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  <p className="text-xs font-bold text-white">Complete</p>
                </motion.div>
              ) : isRunning ? (
                <motion.div
                  key={`${phaseIndex}-running`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center gap-0.5"
                >
                  <span className={cn("text-[9px] font-bold uppercase tracking-widest", activeMode.colors.accent)}>
                    {currentPhase.label}
                  </span>
                  <div className="text-3xl font-black text-white leading-none tabular-nums drop-shadow-lg">
                    {secondsRemaining}
                  </div>
                  <span className="text-[9px] text-white/60">{currentCycle + 1} / {targetCycles}</span>
                  <span className={cn("text-[9px] font-semibold mt-0.5 px-1.5 py-0.5 rounded-full",
                    isExhalePhase ? "bg-white/10 text-white/70" : "bg-white/20 text-white/90"
                  )}>
                    {isExhalePhase ? "↓" : "↑"}
                  </span>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-1">
                  <span className="text-2xl">{activeMode.emoji}</span>
                  <p className="text-[11px] font-semibold text-white/90">{targetCycles} cycles</p>
                  <p className="text-[10px] text-white/60">{formatTime(estimatedSeconds)}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right-side controls panel */}
        <div className="flex flex-col justify-center flex-1 gap-3 min-w-0">

          {/* Live instruction (running) or phase sequence (idle) */}
          <div className="min-h-[52px]" aria-live="polite">
            <AnimatePresence mode="wait">
              {isRunning ? (
                <motion.div
                  key={`inst-${phaseIndex}`}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    {currentPhase.instruction}
                  </p>
                  <p className="text-[11px] text-muted-foreground italic leading-snug mt-0.5">
                    {currentPhase.bodyCue}
                  </p>
                </motion.div>
              ) : isCompleted ? (
                <motion.div key="completed-msg" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 leading-snug">
                    {activeMode.completionMessage}
                  </p>
                </motion.div>
              ) : (
                <motion.div key="idle-phase" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {/* Phase sequence chips */}
                  <div className="flex items-center gap-1 flex-wrap mb-1">
                    {activeMode.phases.map((phase, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-lg border border-border/40 bg-card/60 text-muted-foreground whitespace-nowrap">
                          <span className="font-medium text-foreground/80">{phase.label}</span> {phase.duration}s
                        </span>
                        {i < activeMode.phases.length - 1 && <span className="text-muted-foreground/40 text-[10px]">→</span>}
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{activeMode.description}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cycle selector */}
          {!isRunning && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] text-muted-foreground font-medium mr-0.5">Cycles:</span>
              {[3, 4, 5, 6, 8, 10].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setTargetCycles(c)}
                  className={cn(
                    "w-7 h-7 rounded-full text-[11px] font-semibold transition-all border",
                    targetCycles === c
                      ? cn("shadow-sm", activeMode.colors.pillActive)
                      : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border/70",
                  )}
                >
                  {c}
                </button>
              ))}
              <span className="text-[10px] text-muted-foreground ml-1">≈{formatTime(estimatedSeconds)}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!isRunning ? (
              <Button
                onClick={startExercise}
                className="gap-1.5 rounded-xl px-6 h-10 font-semibold text-sm shadow-md text-white"
                style={{ background: `linear-gradient(135deg, ${activeMode.colors.orbFrom}, ${activeMode.colors.orbTo})` }}
                id="breathing-start-btn"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {isCompleted ? "Again" : "Begin"}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={stopExercise}
                  className="gap-1.5 rounded-xl px-4 h-10 border-border/60 hover:bg-muted text-sm"
                >
                  <Square className="w-3 h-3 fill-current" />
                  Stop
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { stopExercise(); setTimeout(() => startExercise(), 50); }}
                  className="h-10 w-10 rounded-xl"
                  title="Restart"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>

          {/* Prep tip — inline, compact */}
          {!isRunning && !isCompleted && (
            <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
              <Info className="w-3 h-3 shrink-0 mt-0.5 text-primary/50" />
              <span className="leading-snug line-clamp-2">{activeMode.preparationTip}</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Below-the-fold: Situations + Science (scrollable secondary content) */}
      <div className="mt-4 space-y-3">
        {/* When-to-use grid */}
        {!isRunning && (
          <AnimatePresence>
            <motion.div
              key={`sit-${activeMode.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="border border-border/40 rounded-2xl overflow-hidden"
            >
              <div className="px-3 py-2 bg-muted/20 border-b border-border/30">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Best used when…</p>
              </div>
              <div className="grid grid-cols-2 gap-0">
                {activeMode.situations.map((s, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-2 p-2.5 text-[11px]",
                      i % 2 === 0 && i < activeMode.situations.length - 1 ? "border-r border-border/30" : "",
                      i < activeMode.situations.length - 2 ? "border-b border-border/30" : "",
                    )}
                  >
                    <span className="text-sm leading-none shrink-0">{s.emoji}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground leading-snug truncate">{s.title}</p>
                      <p className="text-muted-foreground leading-snug mt-0.5 line-clamp-2">{s.when}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Expandable science */}
        {!isRunning && (
          <>
            <button
              type="button"
              onClick={() => setShowScience((v) => !v)}
              className="flex items-center justify-between w-full text-left px-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors group"
            >
              <span className="font-medium group-hover:underline">🔬 Why this works — the science</span>
              {showScience ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <AnimatePresence>
              {showScience && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 py-2.5 rounded-xl bg-muted/20 border border-border/40 text-[11px] text-muted-foreground leading-relaxed">
                    {activeMode.science}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}


    </div>
  );
}
