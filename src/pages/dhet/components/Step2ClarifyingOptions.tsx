// src/pages/dhet/components/Step2ClarifyingOptions.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowLeft, Wand2, Loader2, Quote } from "lucide-react";
import { ClarifyingOptionsData } from "@/types/dhet";
import { cn } from "@/lib/utils";

interface Step2ClarifyingOptionsProps {
  initialPrompt: string;
  optionsData: ClarifyingOptionsData;
  initialSelections: Record<string, string>;
  onBack: () => void;
  onSubmit: (selections: Record<string, string>) => void;
  onSelectionChange?: (selections: Record<string, string>) => void;
  isLoading: boolean;
}

// Author → accent color mapping
const QUESTION_ACCENTS = [
  "rgba(139,92,246,1)",    // violet
  "rgba(6,182,212,1)",     // cyan
  "rgba(245,158,11,1)",    // amber
  "rgba(16,185,129,1)",    // emerald
  "rgba(239,68,68,1)",     // rose
  "rgba(99,102,241,1)",    // indigo
];

export const Step2ClarifyingOptions: React.FC<Step2ClarifyingOptionsProps> = ({
  initialPrompt,
  optionsData,
  initialSelections,
  onBack,
  onSubmit,
  onSelectionChange,
  isLoading,
}) => {
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = { ...initialSelections };
    (optionsData?.questions || []).forEach((q) => {
      if (!initial[q.id]) {
        initial[q.id] = q.default_option_id || q.options[0]?.id || "";
      }
    });
    return initial;
  });

  const questions = optionsData?.questions || [];
  const answeredCount = questions.filter((q) => selections[q.id]).length;

  const handleSelect = (questionId: string, optionId: string) => {
    const updated = { ...selections, [questionId]: optionId };
    setSelections(updated);
    onSelectionChange?.(updated);
  };

  const handleGenerate = () => onSubmit(selections);

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative w-full flex flex-col"
    >
      {/* ── BACKGROUND GRID ───────────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto w-full px-4 pt-10 pb-40 flex flex-col gap-10">
        {/* ── DESIGN BRIEF HEADER ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(139,92,246,0.7)" }}>
              Step 02 / Clarify Direction
            </span>
            <h1
              className="text-3xl md:text-5xl font-black tracking-tighter leading-tight"
              style={{ color: "hsl(214 32% 91%)" }}
            >
              {optionsData?.title || "Refine Your Design Direction"}
            </h1>
          </div>

          {/* Design brief pull-quote */}
          <div
            className="relative p-5 rounded-2xl border-l-2 overflow-hidden"
            style={{
              borderColor: "rgba(139,92,246,0.6)",
              background: "rgba(139,92,246,0.05)",
              border: "1px solid rgba(139,92,246,0.15)",
              borderLeft: "3px solid rgba(139,92,246,0.7)",
            }}
          >
            <Quote
              className="absolute top-4 right-4 w-8 h-8 opacity-10"
              style={{ color: "rgb(167,139,250)" }}
            />
            <p className="text-sm leading-relaxed italic pr-8" style={{ color: "rgba(196,181,253,0.75)" }}>
              "{initialPrompt}"
            </p>
            <p className="text-[11px] font-semibold mt-2" style={{ color: "rgba(139,92,246,0.6)" }}>
              — Your Design Brief
            </p>
          </div>
        </motion.div>

        {/* ── QUESTIONS ────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-8">
          {questions.map((question, qIdx) => {
            const accent = QUESTION_ACCENTS[qIdx % QUESTION_ACCENTS.length];
            const selectedOptionId = selections[question.id];

            return (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: qIdx * 0.08 }}
                className="flex flex-col gap-4"
              >
                {/* Question header with giant faded number */}
                <div className="relative flex flex-col gap-1 pl-5">
                  {/* Giant faded number */}
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 text-8xl font-black leading-none select-none pointer-events-none"
                    style={{ color: accent, opacity: 0.07, fontVariantNumeric: "tabular-nums" }}
                  >
                    {String(qIdx + 1).padStart(2, "0")}
                  </span>

                  {/* Left accent stripe */}
                  <div
                    className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full"
                    style={{ background: accent, opacity: 0.5 }}
                  />

                  <h3 className="text-base md:text-lg font-bold pl-2" style={{ color: "hsl(214 32% 91%)" }}>
                    {question.label}
                  </h3>
                  <p className="text-sm pl-2" style={{ color: "rgba(196,181,253,0.5)" }}>
                    {question.question}
                  </p>
                </div>

                {/* Option tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {question.options.map((option) => {
                    const isSelected = selectedOptionId === option.id;
                    const isDefault = question.default_option_id === option.id;

                    return (
                      <motion.button
                        key={option.id}
                        type="button"
                        onClick={() => handleSelect(question.id, option.id)}
                        disabled={isLoading}
                        whileHover={!isLoading ? { scale: 1.02, y: -1 } : {}}
                        whileTap={!isLoading ? { scale: 0.98 } : {}}
                        className="relative text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-2 overflow-hidden group"
                        style={{
                          background: isSelected
                            ? `linear-gradient(135deg, ${accent}18, ${accent}08)`
                            : "rgba(255,255,255,0.025)",
                          borderColor: isSelected
                            ? accent
                            : "rgba(255,255,255,0.07)",
                          boxShadow: isSelected
                            ? `0 0 0 1px ${accent}60, 0 8px 24px ${accent}15`
                            : "none",
                        }}
                      >
                        {/* Selected gradient wash overlay */}
                        {isSelected && (
                          <div
                            className="absolute inset-0 opacity-5"
                            style={{ background: `radial-gradient(ellipse at 0% 0%, ${accent}, transparent)` }}
                          />
                        )}

                        <div className="relative z-10 flex items-start justify-between gap-2">
                          <span
                            className="text-sm font-bold leading-tight"
                            style={{ color: isSelected ? "hsl(214 32% 94%)" : "hsl(214 32% 75%)" }}
                          >
                            {option.label}
                          </span>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isDefault && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase"
                                style={{
                                  background: "rgba(255,255,255,0.06)",
                                  color: "rgba(196,181,253,0.5)",
                                }}
                              >
                                Suggested
                              </span>
                            )}

                            {/* Animated checkmark */}
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-200"
                              style={{
                                background: isSelected ? accent : "transparent",
                                borderColor: isSelected ? accent : "rgba(255,255,255,0.15)",
                                boxShadow: isSelected ? `0 0 10px ${accent}50` : "none",
                              }}
                            >
                              <AnimatePresence>
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ duration: 0.15, type: "spring", stiffness: 500 }}
                                  >
                                    <Check className="w-3 h-3 text-white stroke-[3]" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>

                        {option.description && (
                          <p className="relative z-10 text-xs leading-relaxed" style={{ color: "rgba(196,181,253,0.45)" }}>
                            {option.description}
                          </p>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── STICKY FOOTER CTA ─────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-4 py-4"
        style={{ background: "linear-gradient(0deg, hsl(222 47% 3%) 60%, transparent)" }}
      >
        <div
          className="max-w-3xl mx-auto flex items-center justify-between p-4 rounded-2xl border"
          style={{
            background: "rgba(14,16,26,0.95)",
            backdropFilter: "blur(20px)",
            borderColor: "rgba(255,255,255,0.07)",
            boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {/* Progress indicator */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold" style={{ color: "hsl(214 32% 91%)" }}>
              {answeredCount} of {questions.length} answered
            </span>
            <div className="flex items-center gap-1">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: "20px",
                    background: selections[questions[i]?.id]
                      ? QUESTION_ACCENTS[i % QUESTION_ACCENTS.length]
                      : "rgba(255,255,255,0.08)",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all"
              style={{
                background: "transparent",
                borderColor: "rgba(255,255,255,0.08)",
                color: "rgba(196,181,253,0.6)",
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <motion.button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading}
              whileHover={!isLoading ? { scale: 1.03 } : {}}
              whileTap={!isLoading ? { scale: 0.97 } : {}}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: "linear-gradient(135deg, #6d28d9, #8b5cf6)",
                color: "#fff",
                boxShadow: "0 0 20px rgba(139,92,246,0.35)",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate Proposal</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
