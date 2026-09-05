// src/pages/dhet/components/Step1PromptInput.tsx
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, Coffee, Thermometer, Music, Train, ChevronRight } from "lucide-react";

interface Step1PromptInputProps {
  initialValue: string;
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

const INSPIRATION_EXAMPLES = [
  {
    icon: Coffee,
    title: "Pour-Over Coffee Timer",
    accent: "#f59e0b",
    prompt:
      "A minimalist mobile companion app for dialed-in manual pour-over coffee, tracking bloom time, water pour ratios, and extraction notes without cognitive clutter.",
  },
  {
    icon: Thermometer,
    title: "Ambient Home Thermostat",
    accent: "#06b6d4",
    prompt:
      "An intuitive wall-mounted touchscreen thermostat interface with immediate visual feedback, tactile temperature rings, and effortless schedule adjustments for elderly users.",
  },
  {
    icon: Music,
    title: "Focus Audio Deck",
    accent: "#8b5cf6",
    prompt:
      "A distraction-free desktop music and ambient sound generator for deep work, featuring tactile mechanical knobs, subtle volume signifiers, and zero social feeds.",
  },
  {
    icon: Train,
    title: "Transit Kiosk Screen",
    accent: "#10b981",
    prompt:
      "An accessible train station ticket machine interface designed for rushed commuters, prioritizing high contrast, instant mistake-reversal, and zero ambiguous menus.",
  },
];

const PRINCIPLES = ["Don Norman", "Dieter Rams", "Nielsen", "Steve Krug", "Alan Cooper"];

export const Step1PromptInput: React.FC<Step1PromptInputProps> = ({
  initialValue,
  onSubmit,
  isLoading,
}) => {
  const [prompt, setPrompt] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-focus after mount with a slight delay for animation
    const timer = setTimeout(() => textareaRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmit(prompt.trim());
  };

  const canSubmit = prompt.trim().length > 0 && !isLoading;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative flex flex-col items-center justify-start w-full px-4 pt-14 pb-20"
    >
      {/* ── BACKGROUND GRID PATTERN ──────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 max-w-3xl w-full flex flex-col gap-14">
        {/* ── HERO HEADING ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col items-center text-center gap-5"
        >
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border"
            style={{
              background: "rgba(139,92,246,0.12)",
              borderColor: "rgba(139,92,246,0.3)",
              color: "rgb(167,139,250)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span>Design Everyday Things Studio</span>
          </div>

          {/* Main heading */}
          <div className="flex flex-col gap-2">
            <h1
              className="text-5xl md:text-7xl font-black tracking-tighter leading-none"
              style={{ color: "hsl(214 32% 91%)" }}
            >
              What will you
            </h1>
            <h1
              className="text-5xl md:text-7xl font-black tracking-tighter leading-none"
              style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 40%, #c4b5fd 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              design today?
            </h1>
          </div>

          <p className="text-base max-w-xl leading-relaxed" style={{ color: "rgba(196,181,253,0.6)" }}>
            Describe any screen, app, or everyday human-facing tool. We'll clarify the core
            dimensions and construct a full UX specification grounded in timeless principles.
          </p>

          {/* Principle chips */}
          <div className="flex flex-wrap justify-center items-center gap-2 pt-1">
            {PRINCIPLES.map((p) => (
              <span
                key={p}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
                style={{
                  background: "rgba(139,92,246,0.06)",
                  borderColor: "rgba(139,92,246,0.18)",
                  color: "rgba(196,181,253,0.7)",
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </motion.div>

        {/* ── TEXTAREA SPOTLIGHT ───────────────────────────────────────────── */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.25 }}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          {/* Glow wrapper */}
          <div
            className="relative rounded-3xl transition-all duration-500"
            style={{
              background: "rgba(139,92,246,0.04)",
              border: `1px solid ${isFocused ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.07)"}`,
              boxShadow: isFocused
                ? "0 0 0 4px rgba(139,92,246,0.08), 0 24px 48px rgba(0,0,0,0.4)"
                : "0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="e.g. A calm desktop markdown notes editor with physical typewriter acoustics, tactile focus modes, and zero popups..."
              className="w-full bg-transparent resize-none p-6 md:p-8 text-base md:text-lg leading-relaxed outline-none placeholder:opacity-30 font-light"
              style={{
                color: "hsl(214 32% 91%)",
                minHeight: "180px",
                caretColor: "rgb(167,139,250)",
              }}
              autoFocus
              disabled={isLoading}
              rows={5}
            />

            {/* Bottom bar with char count and CTA */}
            <div
              className="flex items-center justify-between px-6 py-4 border-t"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}
            >
              <span className="text-xs font-mono" style={{ color: "rgba(196,181,253,0.35)" }}>
                {prompt.length} chars
              </span>

              <motion.button
                type="submit"
                disabled={!canSubmit}
                whileHover={canSubmit ? { scale: 1.03 } : {}}
                whileTap={canSubmit ? { scale: 0.97 } : {}}
                className="flex items-center gap-2.5 px-6 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300"
                style={{
                  background: canSubmit
                    ? "linear-gradient(135deg, #6d28d9, #8b5cf6)"
                    : "rgba(139,92,246,0.15)",
                  color: canSubmit ? "#fff" : "rgba(196,181,253,0.4)",
                  boxShadow: canSubmit ? "0 0 24px rgba(139,92,246,0.35)" : "none",
                  cursor: canSubmit ? "pointer" : "not-allowed",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Vision...</span>
                  </>
                ) : (
                  <>
                    <span>Clarify & Refine</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.form>

        {/* ── INSPIRATION RAIL ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col gap-4"
        >
          <div className="flex items-center gap-2">
            <div className="h-[1px] flex-1" style={{ background: "rgba(255,255,255,0.05)" }} />
            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(196,181,253,0.4)" }}>
              Or start with an archetype
            </span>
            <div className="h-[1px] flex-1" style={{ background: "rgba(255,255,255,0.05)" }} />
          </div>

          {/* Horizontal scroll rail */}
          <div className="relative">
            {/* Left fade */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10" style={{ background: "linear-gradient(90deg, hsl(222 47% 3%), transparent)" }} />
            {/* Right fade */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10" style={{ background: "linear-gradient(-90deg, hsl(222 47% 3%), transparent)" }} />

            <div className="flex gap-3 overflow-x-auto pb-2 px-2 scroll-smooth" style={{ scrollbarWidth: "none" }}>
              {INSPIRATION_EXAMPLES.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={idx}
                    type="button"
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPrompt(item.prompt)}
                    disabled={isLoading}
                    className="shrink-0 w-56 p-4 rounded-2xl text-left flex flex-col gap-3 transition-all duration-200 border"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      borderColor: "rgba(255,255,255,0.07)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = `${item.accent}50`;
                      (e.currentTarget as HTMLElement).style.background = `${item.accent}08`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `${item.accent}18`, color: item.accent }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold" style={{ color: "hsl(214 32% 91%)" }}>
                        {item.title}
                      </span>
                      <span className="text-[11px] leading-relaxed line-clamp-3" style={{ color: "rgba(196,181,253,0.5)" }}>
                        {item.prompt}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: item.accent }}>
                      <span>Use this</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
