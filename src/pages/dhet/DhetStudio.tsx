// src/pages/dhet/DhetStudio.tsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Step1PromptInput } from "./components/Step1PromptInput";
import { Step2ClarifyingOptions } from "./components/Step2ClarifyingOptions";
import { Step3ProposalView } from "./components/Step3ProposalView";
import { ClarifyingOptionsData, DhetDesignRecord } from "@/types/dhet";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { Sparkles, Layers, Wand2 } from "lucide-react";

export const DhetStudio: React.FC = () => {
  const location = useLocation();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [prompt, setPrompt] = useState<string>("");
  const [optionsData, setOptionsData] = useState<ClarifyingOptionsData | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [currentDesign, setCurrentDesign] = useState<DhetDesignRecord | null>(null);

  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(false);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState<boolean>(false);

  // If redirected from Saved Designs with state
  useEffect(() => {
    if (location.state?.design) {
      setCurrentDesign(location.state.design);
      setPrompt(location.state.design.initial_prompt || "");
      setStep(3);
    }
  }, [location.state]);

  // Step 1 -> Step 2
  const handlePromptSubmit = async (submittedPrompt: string) => {
    try {
      setIsLoadingOptions(true);
      setPrompt(submittedPrompt);

      const res = await apiClient.getDhetClarifyingOptions(submittedPrompt);
      if (res.success && res.data) {
        setOptionsData(res.data);
        setStep(2);
      } else {
        throw new Error(res.error || "Failed to clarify prompt.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate clarifying options. Please try again.");
    } finally {
      setIsLoadingOptions(false);
    }
  };

  // Step 2 -> Step 3
  const handleOptionsSubmit = async (selectedChoices: Record<string, string>) => {
    try {
      setIsGeneratingProposal(true);
      setSelections(selectedChoices);

      const res = await apiClient.generateDhetProposal({
        prompt,
        selections: selectedChoices,
        clarifying_options: optionsData?.questions || [],
      });

      if (res.success && res.data) {
        setCurrentDesign(res.data);
        setStep(3);
        toast.success("Design proposal generated successfully!");
      } else {
        throw new Error(res.error || "Failed to generate design proposal.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate design proposal. Please try again.");
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setPrompt("");
    setOptionsData(null);
    setSelections({});
    setCurrentDesign(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── STEP PROGRESS BAR ────────────────────────────────────────────── */}
      <div className="w-full border-b border-border/50 bg-card/30 backdrop-blur-md sticky top-14 z-20">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-primary/10 text-primary">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-foreground">
              DHET Studio
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-xs font-semibold">
            <div
              className={`flex items-center gap-1.5 ${
                step >= 1 ? "text-primary font-bold" : "text-muted-foreground"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step >= 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                1
              </span>
              <span className="hidden sm:inline">Concept</span>
            </div>

            <span className="w-4 h-[1px] bg-border" />

            <div
              className={`flex items-center gap-1.5 ${
                step >= 2 ? "text-primary font-bold" : "text-muted-foreground"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step >= 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                2
              </span>
              <span className="hidden sm:inline">Clarify</span>
            </div>

            <span className="w-4 h-[1px] bg-border" />

            <div
              className={`flex items-center gap-1.5 ${
                step >= 3 ? "text-primary font-bold" : "text-muted-foreground"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step >= 3
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                3
              </span>
              <span className="hidden sm:inline">Proposal</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── STEP CONTENT ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col pb-16">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <Step1PromptInput
              key="step-1"
              initialValue={prompt}
              onSubmit={handlePromptSubmit}
              isLoading={isLoadingOptions}
            />
          )}

          {step === 2 && optionsData && (
            <Step2ClarifyingOptions
              key="step-2"
              initialPrompt={prompt}
              optionsData={optionsData}
              initialSelections={selections}
              onBack={() => setStep(1)}
              onSubmit={handleOptionsSubmit}
              isLoading={isGeneratingProposal}
            />
          )}

          {step === 3 && currentDesign && (
            <Step3ProposalView
              key="step-3"
              design={currentDesign}
              onReset={handleReset}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default DhetStudio;
