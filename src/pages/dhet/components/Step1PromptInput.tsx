// src/pages/dhet/components/Step1PromptInput.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Lightbulb, Compass, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Step1PromptInputProps {
  initialValue: string;
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

const INSPIRATION_EXAMPLES = [
  {
    title: "Pour-Over Coffee Timer",
    prompt: "A minimalist mobile companion app for dialed-in manual pour-over coffee, tracking bloom time, water pour ratios, and extraction notes without cognitive clutter.",
  },
  {
    title: "Ambient Home Thermostat",
    prompt: "An intuitive wall-mounted touchscreen thermostat interface with immediate visual feedback, tactile temperature rings, and effortless schedule adjustments for elderly users.",
  },
  {
    title: "Focus Audio Deck",
    prompt: "A distraction-free desktop music and ambient sound generator for deep work, featuring tactile mechanical knobs, subtle volume signifiers, and zero social feeds.",
  },
  {
    title: "Transit Kiosk Screen",
    prompt: "An accessible train station ticket machine interface designed for rushed commuters, prioritizing high contrast, instant mistake-reversal, and zero ambiguous menus.",
  },
];

export const Step1PromptInput: React.FC<Step1PromptInputProps> = ({
  initialValue,
  onSubmit,
  isLoading,
}) => {
  const [prompt, setPrompt] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmit(prompt.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="max-w-4xl mx-auto w-full px-4 py-6 md:py-10 flex flex-col gap-8"
    >
      {/* ── HERO BANNER ────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Design Human Everyday Things</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
          What would you like to design today?
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl leading-relaxed">
          Describe any screen, app, or everyday human-facing tool. We'll clarify the core
          dimensions and construct a full UX specification grounded in timeless human-centered design principles.
        </p>
      </div>

      {/* ── INPUT CARD ──────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative group rounded-2xl p-[1px] bg-gradient-to-b from-border via-border/50 to-border/20 shadow-xl shadow-black/5 hover:from-primary/40 transition-all duration-300">
          <div className="bg-card rounded-[15px] p-4 md:p-6 flex flex-col gap-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A calm desktop markdown notes editor with physical typewriter acoustics, tactile focus modes, and zero popups..."
              className="min-h-[140px] md:min-h-[160px] text-base md:text-lg border-0 bg-transparent focus-visible:ring-0 resize-none placeholder:text-muted-foreground/60 p-0 leading-relaxed"
              autoFocus
              disabled={isLoading}
            />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t border-border/50 gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Compass className="w-3.5 h-3.5 text-primary" />
                <span>Grounded in Norman, Rams, Nielsen, Krug, Cooper & Weinschenk</span>
              </div>

              <Button
                type="submit"
                disabled={!prompt.trim() || isLoading}
                size="lg"
                className="rounded-xl px-6 font-semibold shadow-md shadow-primary/20 flex items-center gap-2 group/btn"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Vision...</span>
                  </>
                ) : (
                  <>
                    <span>Next: Clarifying Options</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* ── INSPIRATION PROMPT CARDS ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>Need inspiration? Pick an archetype to start:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {INSPIRATION_EXAMPLES.map((item, idx) => (
            <motion.button
              key={idx}
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setPrompt(item.prompt)}
              disabled={isLoading}
              className="p-3.5 rounded-xl border border-border/50 bg-card/60 hover:bg-card hover:border-primary/40 transition-all text-left flex flex-col gap-1 text-sm shadow-sm"
            >
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {item.title}
              </span>
              <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {item.prompt}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
