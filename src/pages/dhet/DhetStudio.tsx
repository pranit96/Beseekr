// src/pages/dhet/DhetStudio.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Step1PromptInput } from "./components/Step1PromptInput";
import { Step2ClarifyingOptions } from "./components/Step2ClarifyingOptions";
import { Step3ProposalView } from "./components/Step3ProposalView";
import { ClarifyingOptionsData, DhetDesignRecord } from "@/types/dhet";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { Layers, Check, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";

const DESIGN_PROGRESS_MESSAGES = [
  "Don Norman: Mapping affordances, signifiers & conceptual models...",
  "Dieter Rams: Applying honest utility and radical aesthetic reduction...",
  "Jakob Nielsen: Guaranteeing visibility of system status & recognition...",
  "Steve Krug: Designing for effortless scanning (Don't Make Me Think)...",
  "Ensuring 1:1 twin parity between AI image prompt & Figma auto-layout...",
];

const DHET_SESSION_STORAGE_KEY = "dhet_studio_session";

interface DhetSavedSession {
  step?: 1 | 2 | 3;
  prompt?: string;
  optionsData?: ClarifyingOptionsData | null;
  selections?: Record<string, string>;
  currentDesign?: DhetDesignRecord | null;
}

function loadSavedSession(): DhetSavedSession | null {
  try {
    const raw = localStorage.getItem(DHET_SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Could not parse saved DHET session:", err);
    return null;
  }
}

export const DhetStudio: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Load session from localStorage once on component mount
  const savedSession = useMemo(() => loadSavedSession(), []);

  // Initialize state with persistence fallbacks
  const [step, setStep] = useState<1 | 2 | 3>(() => {
    if (location.state?.design) return 3;
    if (savedSession?.currentDesign) return 3;
    if (savedSession?.optionsData && savedSession?.step === 2) return 2;
    if (savedSession?.step) return savedSession.step;
    return 1;
  });

  const [prompt, setPrompt] = useState<string>(() => {
    if (location.state?.design?.initial_prompt) return location.state.design.initial_prompt;
    return savedSession?.prompt || "";
  });

  const [optionsData, setOptionsData] = useState<ClarifyingOptionsData | null>(() => {
    return savedSession?.optionsData || null;
  });

  const [selections, setSelections] = useState<Record<string, string>>(() => {
    if (location.state?.design?.selected_options) return location.state.design.selected_options;
    return savedSession?.selections || {};
  });

  const [currentDesign, setCurrentDesign] = useState<DhetDesignRecord | null>(() => {
    if (location.state?.design) return location.state.design;
    return savedSession?.currentDesign || null;
  });

  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(false);
  const [isGeneratingProposal, setIsGeneratingProposal] =
    useState<boolean>(false);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState<number>(0);

  // Rotate loading heuristic messages for transparent, rich user feedback
  useEffect(() => {
    let interval: any;
    if (isLoadingOptions || isGeneratingProposal) {
      interval = setInterval(() => {
        setLoadingMessageIdx(
          (prev) => (prev + 1) % DESIGN_PROGRESS_MESSAGES.length,
        );
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoadingOptions, isGeneratingProposal]);

  // Persist session to localStorage on every meaningful state change
  useEffect(() => {
    try {
      if (!prompt && !optionsData && !currentDesign && step === 1) {
        localStorage.removeItem(DHET_SESSION_STORAGE_KEY);
      } else {
        const payload: DhetSavedSession = {
          step,
          prompt,
          optionsData,
          selections,
          currentDesign,
        };
        localStorage.setItem(DHET_SESSION_STORAGE_KEY, JSON.stringify(payload));
      }
    } catch (err) {
      console.warn("Failed to save DHET session to localStorage:", err);
    }
  }, [step, prompt, optionsData, selections, currentDesign]);

  // Load design from URL query param ?id=... if present
  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    if (idFromUrl && (!currentDesign || currentDesign.id !== idFromUrl)) {
      apiClient
        .getDhetDesign(idFromUrl)
        .then((res) => {
          if (res.success && res.data) {
            setCurrentDesign(res.data);
            setPrompt(res.data.initial_prompt || "");
            if (res.data.selected_options) setSelections(res.data.selected_options);
            setStep(3);
          }
        })
        .catch((err) => {
          console.warn("Failed to load design from URL id", err);
        });
    }
  }, [searchParams]);

  // Synchronize URL query param when viewing a proposal (Step 3)
  useEffect(() => {
    if (currentDesign?.id && step === 3) {
      if (searchParams.get("id") !== currentDesign.id) {
        setSearchParams({ id: currentDesign.id }, { replace: true });
      }
    } else if (step < 3 && searchParams.has("id")) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("id");
      setSearchParams(newParams, { replace: true });
    }
  }, [currentDesign?.id, step]);

  // If redirected from Saved Designs with state
  useEffect(() => {
    if (location.state?.design) {
      setCurrentDesign(location.state.design);
      setPrompt(location.state.design.initial_prompt || "");
      if (location.state.design.selected_options) {
        setSelections(location.state.design.selected_options);
      }
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
      toast.error(
        err.message ||
          "Failed to generate clarifying options. Please try again.",
      );
    } finally {
      setIsLoadingOptions(false);
    }
  };

  // Step 2 -> Step 3
  const handleOptionsSubmit = async (
    selectedChoices: Record<string, string>,
  ) => {
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
      toast.error(
        err.message || "Failed to generate design proposal. Please try again.",
      );
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  const handleReset = () => {
    try {
      localStorage.removeItem(DHET_SESSION_STORAGE_KEY);
    } catch (err) {
      console.warn("Failed to clear DHET session from localStorage:", err);
    }
    setStep(1);
    setPrompt("");
    setOptionsData(null);
    setSelections({});
    setCurrentDesign(null);
    setSearchParams({}, { replace: true });
    toast.info("Studio reset. Starting fresh design concept.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <GlobalHeader />

      {/* ── STEP PROGRESS & NAV BAR (Norman Affordances & Nielsen System Status) ─ */}
      <div className="w-full border-b border-border/50 bg-card/60 backdrop-blur-md sticky top-14 z-20">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-primary/10 text-primary">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-foreground">
              Everyday Things Studio
            </span>
          </div>

          {/* Interactive Navigation Steps */}
          <nav
            className="flex items-center gap-1.5 sm:gap-3 text-xs"
            aria-label="Studio Progress"
          >
            {/* Step 1: Concept */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all cursor-pointer",
                step === 1
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              <span
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                  step === 1
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {optionsData ? (
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                ) : (
                  "1"
                )}
              </span>
              <span>1. Concept</span>
            </button>

            <span className="w-3 h-[1px] bg-border/80" />

            {/* Step 2: Clarify */}
            <button
              type="button"
              disabled={!optionsData}
              onClick={() => optionsData && setStep(2)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all",
                optionsData
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-40",
                step === 2
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : optionsData
                    ? "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                  step === 2
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {currentDesign ? (
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                ) : (
                  "2"
                )}
              </span>
              <span>2. Clarify</span>
            </button>

            <span className="w-3 h-[1px] bg-border/80" />

            {/* Step 3: Proposal */}
            <button
              type="button"
              disabled={!currentDesign}
              onClick={() => currentDesign && setStep(3)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all",
                currentDesign
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-40",
                step === 3
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : currentDesign
                    ? "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                  step === 3
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                3
              </span>
              <span>3. Proposal</span>
            </button>
          </nav>
        </div>
      </div>

      {/* ── LIVE HEURISTIC FEEDBACK BANNER (During Generation) ─────────────── */}
      {(isLoadingOptions || isGeneratingProposal) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-primary/10 border-b border-primary/20 px-4 py-3 flex items-center justify-center gap-2.5 text-xs text-primary font-medium"
        >
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span className="truncate">
            {DESIGN_PROGRESS_MESSAGES[loadingMessageIdx]}
          </span>
        </motion.div>
      )}

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
              onSelectionChange={(updated) => setSelections(updated)}
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

      <GlobalFooter />
    </div>
  );
};

export default DhetStudio;