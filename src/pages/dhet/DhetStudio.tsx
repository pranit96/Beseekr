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
import { cn } from "@/lib/utils";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";

const DESIGN_PROGRESS_MESSAGES = [
  "Don Norman: Mapping affordances, signifiers & conceptual models...",
  "Dieter Rams: Applying honest utility and radical aesthetic reduction...",
  "Jakob Nielsen: Guaranteeing visibility of system status & recognition...",
  "Steve Krug: Designing for effortless scanning (Don't Make Me Think)...",
  "Ensuring 1:1 twin parity between AI image prompt & Figma auto-layout...",
  "Alan Cooper: Defining user goals and persona-driven interaction models...",
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
    const session = JSON.parse(raw);
    if (session.step === 3 && session.currentDesign && !session.currentDesign.proposal && !session.currentDesign.id) {
      session.step = 1;
      session.currentDesign = null;
    }
    return session;
  } catch (err) {
    console.warn("Could not parse saved DHET session:", err);
    return null;
  }
}

export const DhetStudio: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const savedSession = useMemo(() => loadSavedSession(), []);

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
  const [isGeneratingProposal, setIsGeneratingProposal] = useState<boolean>(false);
  const [isLoadingDesign, setIsLoadingDesign] = useState<boolean>(false);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState<number>(0);

  useEffect(() => {
    let interval: any;
    if (isLoadingOptions || isGeneratingProposal) {
      interval = setInterval(() => {
        setLoadingMessageIdx((prev) => (prev + 1) % DESIGN_PROGRESS_MESSAGES.length);
      }, 2200);
    }
    return () => clearInterval(interval);
  }, [isLoadingOptions, isGeneratingProposal]);

  useEffect(() => {
    try {
      if (!prompt && !optionsData && !currentDesign && step === 1) {
        localStorage.removeItem(DHET_SESSION_STORAGE_KEY);
      } else {
        const payload: DhetSavedSession = { step, prompt, optionsData, selections, currentDesign };
        localStorage.setItem(DHET_SESSION_STORAGE_KEY, JSON.stringify(payload));
      }
    } catch (err) {
      console.warn("Failed to save DHET session to localStorage:", err);
    }
  }, [step, prompt, optionsData, selections, currentDesign]);

  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    const targetId = idFromUrl || (currentDesign?.id && !currentDesign?.proposal ? currentDesign.id : null);
    if (targetId && (!currentDesign || currentDesign.id !== targetId || !currentDesign.proposal)) {
      setIsLoadingDesign(true);
      apiClient
        .getDhetDesign(targetId)
        .then((res) => {
          if (res.success && res.data) {
            setCurrentDesign(res.data);
            setPrompt(res.data.initial_prompt || "");
            if (res.data.selected_options) setSelections(res.data.selected_options);
            setStep(3);
          }
        })
        .catch((err) => {
          console.warn("Failed to load design from ID", err);
          toast.error("Failed to load design proposal details.");
        })
        .finally(() => setIsLoadingDesign(false));
    }
  }, [searchParams, currentDesign?.id, currentDesign?.proposal]);

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

  useEffect(() => {
    if (location.state?.design) {
      const designFromState = location.state.design;
      setPrompt(designFromState.initial_prompt || "");
      if (designFromState.selected_options) setSelections(designFromState.selected_options);
      setStep(3);
      if (designFromState.proposal) {
        setCurrentDesign(designFromState);
      } else if (designFromState.id) {
        setIsLoadingDesign(true);
        apiClient
          .getDhetDesign(designFromState.id)
          .then((res) => {
            setCurrentDesign(res.success && res.data ? res.data : designFromState);
          })
          .catch(() => setCurrentDesign(designFromState))
          .finally(() => setIsLoadingDesign(false));
      } else {
        setCurrentDesign(designFromState);
      }
    }
  }, [location.state]);

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
    try { localStorage.removeItem(DHET_SESSION_STORAGE_KEY); } catch {}
    setStep(1);
    setPrompt("");
    setOptionsData(null);
    setSelections({});
    setCurrentDesign(null);
    setSearchParams({}, { replace: true });
    toast.info("Studio reset. Starting fresh design concept.");
  };

  const isLoading = isLoadingOptions || isGeneratingProposal;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "hsl(222 47% 3%)", color: "hsl(214 32% 91%)" }}>
      {/* ── AMBIENT GRAIN TEXTURE ─────────────────────────────────────────── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />

      {/* ── AMBIENT RADIAL GLOW ───────────────────────────────────────────── */}
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] z-0"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        <GlobalHeader />

        {/* ── FLOATING VERTICAL STEP DOTS (Left Edge) ─────────────────────── */}
        {step < 3 && (
          <div className="fixed left-5 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col items-center gap-3">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  if (s === 1) setStep(1);
                  if (s === 2 && optionsData) setStep(2);
                  if (s === 3 && currentDesign) setStep(3);
                }}
                disabled={(s === 2 && !optionsData) || (s === 3 && !currentDesign)}
                title={["Concept", "Clarify", "Proposal"][s - 1]}
                className={cn(
                  "transition-all duration-300 rounded-full border",
                  step === s
                    ? "w-2.5 h-8 bg-violet-500 border-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.7)]"
                    : s < step
                    ? "w-2 h-2 bg-violet-600/60 border-violet-500/40"
                    : "w-2 h-2 bg-white/10 border-white/10"
                )}
              />
            ))}
          </div>
        )}

        {/* ── CINEMATIC LOADING OVERLAY ─────────────────────────────────────── */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              key="loading-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center"
              style={{ background: "rgba(8, 10, 18, 0.92)", backdropFilter: "blur(16px)" }}
            >
              {/* Animated glow ring */}
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 animate-ping" style={{ animationDuration: "2s" }} />
                <div className="absolute inset-2 rounded-full border border-violet-400/30 animate-pulse" />
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "conic-gradient(from 0deg, transparent 0%, rgba(139,92,246,0.6) 30%, transparent 60%)",
                    animation: "spin 1.4s linear infinite",
                  }}
                />
                <div
                  className="absolute inset-1.5 rounded-full"
                  style={{ background: "hsl(222 47% 5%)" }}
                />
                <div
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-violet-400">
                    <path d="M12 3L4 9v6l8 6 8-6V9l-8-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M12 3v18M4 9l8 6 8-6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Linear progress bar */}
              <div className="w-64 h-[2px] rounded-full bg-white/5 mb-6 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #6d28d9, #8b5cf6, #a78bfa)" }}
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingMessageIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                  className="text-sm text-center max-w-xs font-medium"
                  style={{ color: "rgba(196,181,253,0.85)" }}
                >
                  {DESIGN_PROGRESS_MESSAGES[loadingMessageIdx]}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── STEP CONTENT ────────────────────────────────────────────────── */}
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

            {step === 3 && (isLoadingDesign || (currentDesign && !currentDesign.proposal)) && (
              <motion.div
                key="step-3-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center py-24 gap-6 text-center"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-2xl animate-pulse" style={{ background: "rgba(139,92,246,0.15)" }} />
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="relative z-10" style={{ color: "rgb(167,139,250)" }}>
                    <path d="M12 3L4 9v6l8 6 8-6V9l-8-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1.5">
                  <h2 className="text-lg font-bold" style={{ color: "hsl(214 32% 91%)" }}>Loading Design Proposal...</h2>
                  <p className="text-sm" style={{ color: "rgba(196,181,253,0.6)" }}>Retrieving full specification and architectural blueprint.</p>
                </div>
              </motion.div>
            )}

            {step === 3 && currentDesign && currentDesign.proposal && !isLoadingDesign && (
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

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default DhetStudio;