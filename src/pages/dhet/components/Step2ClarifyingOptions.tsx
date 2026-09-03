// src/pages/dhet/components/Step2ClarifyingOptions.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowLeft, Wand2, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export const Step2ClarifyingOptions: React.FC<Step2ClarifyingOptionsProps> = ({
  initialPrompt,
  optionsData,
  initialSelections,
  onBack,
  onSubmit,
  onSelectionChange,
  isLoading,
}) => {
  // Initialize selections with user defaults or provided defaults
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = { ...initialSelections };
    (optionsData?.questions || []).forEach((q) => {
      if (!initial[q.id]) {
        initial[q.id] = q.default_option_id || q.options[0]?.id || "";
      }
    });
    return initial;
  });

  const handleSelect = (questionId: string, optionId: string) => {
    const updated = {
      ...selections,
      [questionId]: optionId,
    };
    setSelections(updated);
    onSelectionChange?.(updated);
  };

  const handleGenerate = () => {
    onSubmit(selections);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="max-w-4xl mx-auto w-full px-4 py-6 md:py-10 flex flex-col gap-8"
    >
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <span>Step 2 of 3</span>
          <span>•</span>
          <span>Strategic Clarification</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground">
          {optionsData?.title || "Refine Your Design Direction"}
        </h1>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
          Based on your concept, choose the architectural nuances that fit best. We'll use these to ground the design decisions and tokens.
        </p>

        {/* Selected Prompt Quote */}
        <div className="mt-2 p-3 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
          <span className="italic line-clamp-2">"{initialPrompt}"</span>
        </div>
      </div>

      {/* ── QUESTIONS LIST ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        {(optionsData?.questions || []).map((question, qIdx) => {
          const selectedOptionId = selections[question.id];

          return (
            <div
              key={question.id}
              className="p-5 md:p-6 rounded-2xl border border-border/60 bg-card shadow-sm flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {qIdx + 1}
                  </span>
                  <h3 className="text-base md:text-lg font-semibold text-foreground">
                    {question.label}
                  </h3>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground pl-7">
                  {question.question}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-0 md:pl-7">
                {question.options.map((option) => {
                  const isSelected = selectedOptionId === option.id;
                  const isDefault = question.default_option_id === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelect(question.id, option.id)}
                      disabled={isLoading}
                      className={cn(
                        "relative text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col gap-1",
                        isSelected
                          ? "border-primary bg-primary/[0.06] shadow-sm shadow-primary/10 ring-1 ring-primary"
                          : "border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={cn(
                            "font-semibold text-sm flex items-center gap-1.5",
                            isSelected ? "text-primary" : "text-foreground"
                          )}
                        >
                          {option.label}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {isDefault && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase font-medium">
                              Suggested
                            </span>
                          )}
                          <div
                            className={cn(
                              "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                              isSelected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-muted-foreground/40"
                            )}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>

                      {option.description && (
                        <span className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                          {option.description}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FOOTER ACTIONS ─────────────────────────────────────────────────── */}
      <div className="sticky bottom-4 z-20 bg-background/80 backdrop-blur-xl p-4 rounded-2xl border border-border/80 shadow-2xl flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="rounded-xl flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Prompt</span>
        </Button>

        <Button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading}
          size="lg"
          className="rounded-xl px-6 font-semibold shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Synthesizing Design Proposal...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              <span>Generate Design Proposal</span>
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};
