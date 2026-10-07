// src/pages/healing/ThoughtRecordWizard.tsx
// ─── 8-step CBT Thought Record Wizard ────────────────────────────────────────
// Features:
//   - Saves draft on every step change (debounced 1.5s)
//   - Saves to localStorage for offline resilience
//   - Back/Next navigation with progress indicator
//   - Safety check response shown as full-screen CrisisScreen
//   - Completes record on step 8 Next
//   - Loads existing draft by ?id= query param

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Save, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { WizardProgress } from "./components/WizardProgress";
import { CrisisScreen } from "./components/CrisisScreen";
import { Step1Situation } from "./wizard/Step1Situation";
import { Step2Emotions } from "./wizard/Step2Emotions";
import { Step3AutoThought } from "./wizard/Step3AutoThought";
import { Step4ThinkingTraps } from "./wizard/Step4ThinkingTraps";
import { Step5Evidence } from "./wizard/Step5Evidence";
import { Step6BalancedThought } from "./wizard/Step6BalancedThought";
import { Step7ReRateEmotions } from "./wizard/Step7ReRateEmotions";
import { Step8NextAction } from "./wizard/Step8NextAction";
import healingApi from "@/api/healing";
import type { RecordEmotion, ThinkingTrap, Helpline } from "@/api/healing";

const TOTAL_STEPS = 8;
const DRAFT_KEY = "healing_draft";

interface WizardState {
  recordId: string | null;
  situation: string;
  emotions: RecordEmotion[];
  thought: string;
  traps: ThinkingTrap[];
  evidenceFor: string[];
  evidenceAgainst: string[];
  balancedThought: string;
  beliefBefore: number;
  beliefAfter: number;
  nextAction: string;
}

const INITIAL_STATE: WizardState = {
  recordId: null,
  situation: "",
  emotions: [],
  thought: "",
  traps: [],
  evidenceFor: [],
  evidenceAgainst: [],
  balancedThought: "",
  beliefBefore: 70,
  beliefAfter: 30,
  nextAction: "",
};

function loadDraft(): WizardState {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return { ...INITIAL_STATE, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return INITIAL_STATE;
}
function saveDraft(state: WizardState) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}
function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

export default function ThoughtRecordWizard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const qc = useQueryClient();

  const existingId = searchParams.get("id");

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [state, setState] = useState<WizardState>(() =>
    existingId ? INITIAL_STATE : loadDraft()
  );
  const [crisis, setCrisis] = useState<Helpline[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load existing record
  const { data: existingRecord } = useQuery({
    queryKey: ["healing-record", existingId],
    queryFn: () => healingApi.getRecord(existingId!),
    enabled: !!existingId,
  });

  // Load settings for AI enabled state
  const { data: settingsData } = useQuery({
    queryKey: ["healing-settings"],
    queryFn: healingApi.getSettings,
  });
  const aiEnabled = settingsData?.data?.ai_enabled ?? false;

  // Populate state from existing record
  useEffect(() => {
    if (existingRecord?.data) {
      const r = existingRecord.data;
      setState({
        recordId: r.id,
        situation: r.situation ?? "",
        emotions: r.emotions ?? [],
        thought: r.thought ?? "",
        traps: r.traps ?? [],
        evidenceFor: r.evidence_for ?? [],
        evidenceAgainst: r.evidence_against ?? [],
        balancedThought: r.balanced_thought ?? "",
        beliefBefore: r.belief_before ?? 70,
        beliefAfter: r.belief_after ?? 30,
        nextAction: r.next_action ?? "",
      });
    }
  }, [existingRecord]);

  const updateState = useCallback((patch: Partial<WizardState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      // Debounce draft save to localStorage
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => saveDraft(next), 1500);
      return next;
    });
  }, []);

  // Auto-save to backend
  const saveMutation = useMutation({
    mutationFn: async (payload: WizardState) => {
      const body = {
        situation: payload.situation || undefined,
        thought: payload.thought || undefined,
        traps: payload.traps,
        evidence_for: payload.evidenceFor,
        evidence_against: payload.evidenceAgainst,
        balanced_thought: payload.balancedThought || undefined,
        belief_before: payload.beliefBefore,
        belief_after: payload.beliefAfter,
        next_action: payload.nextAction || undefined,
      };

      if (payload.recordId) {
        return healingApi.updateRecord(payload.recordId, body);
      } else {
        return healingApi.createRecord(body);
      }
    },
    onSuccess: (data) => {
      // Check for crisis response
      if ("crisis" in data && data.crisis) {
        setCrisis((data as any).helplines ?? []);
        return;
      }
      // Store record id if first save
      if ("data" in data && data.data?.id && !state.recordId) {
        updateState({ recordId: data.data.id });
      }
    },
    onError: () => {
      // Silent fail — user can continue; draft is in localStorage
    },
  });

  const saveEmotionsMutation = useMutation({
    mutationFn: ({ id, emotions }: { id: string; emotions: RecordEmotion[] }) =>
      healingApi.upsertEmotions(id, emotions.map((e) => ({
        emotion: e.emotion,
        intensity_before: e.intensity_before,
        intensity_after: e.intensity_after ?? undefined,
      }))),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => healingApi.completeRecord(id),
    onSuccess: () => {
      clearDraft();
      qc.invalidateQueries({ queryKey: ["healing-records"] });
      toast({ title: t("healing.wizard.completed_title", "Exercise completed!"), description: t("healing.wizard.completed_desc", "Your thought record has been saved.") });
      navigate("/healing");
    },
  });

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await saveMutation.mutateAsync(state);
      // Save emotions separately if we have a record id
      if (state.recordId && state.emotions.length > 0) {
        await saveEmotionsMutation.mutateAsync({ id: state.recordId, emotions: state.emotions });
      }
      toast({ title: t("healing.wizard.draft_saved", "Draft saved") });
    } finally {
      setIsSaving(false);
    }
  };

  const goNext = async () => {
    // Save on step boundary
    await saveMutation.mutateAsync(state);
    if (state.recordId && state.emotions.length > 0) {
      await saveEmotionsMutation.mutateAsync({ id: state.recordId, emotions: state.emotions });
    }

    if (step === TOTAL_STEPS) {
      // Complete the record
      if (state.recordId) {
        await completeMutation.mutateAsync(state.recordId);
      } else {
        // Save as completed directly
        const res = await healingApi.createRecord({ ...buildPayload(), status: "completed" });
        if ("crisis" in res && res.crisis) { setCrisis((res as any).helplines ?? []); return; }
        clearDraft();
        navigate("/healing");
      }
      return;
    }

    setDirection("forward");
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setDirection("backward");
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  function buildPayload() {
    return {
      situation: state.situation || undefined,
      thought: state.thought || undefined,
      traps: state.traps,
      evidence_for: state.evidenceFor,
      evidence_against: state.evidenceAgainst,
      balanced_thought: state.balancedThought || undefined,
      belief_before: state.beliefBefore,
      belief_after: state.beliefAfter,
      next_action: state.nextAction || undefined,
    };
  }

  // Can the user proceed to next step?
  const canProceed = (() => {
    switch (step) {
      case 1: return state.situation.trim().length >= 10;
      case 2: return state.emotions.length > 0;
      case 3: return state.thought.trim().length >= 5;
      case 4: return true; // traps optional
      case 5: return state.evidenceFor.length > 0 || state.evidenceAgainst.length > 0;
      case 6: return state.balancedThought.trim().length >= 10;
      case 7: return true;
      case 8: return true;
      default: return true;
    }
  })();

  const stepLabels = [
    t("healing.wizard.steps.situation", "Situation"),
    t("healing.wizard.steps.emotions", "Emotions"),
    t("healing.wizard.steps.thought", "Thought"),
    t("healing.wizard.steps.traps", "Patterns"),
    t("healing.wizard.steps.evidence", "Evidence"),
    t("healing.wizard.steps.balanced", "Balance"),
    t("healing.wizard.steps.rerate", "Re-rate"),
    t("healing.wizard.steps.action", "Action"),
  ];

  const slide = {
    forward: { initial: { x: 40, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: -40, opacity: 0 } },
    backward: { initial: { x: -40, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: 40, opacity: 0 } },
  }[direction];

  return (
    <>
      {/* Crisis overlay */}
      {crisis && (
        <CrisisScreen helplines={crisis} onContinue={() => setCrisis(null)} />
      )}

      <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500/20">
        <GlobalHeader />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
          {/* Breadcrumb & Sub Navigation Bar */}
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/healing")}
                className="gap-2 text-muted-foreground hover:text-foreground -ml-2 h-9 px-3"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Healing</span>
              </Button>
              <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Healing / <strong className="text-foreground">Thought Record Wizard</strong>
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="gap-1.5 text-xs h-9 rounded-xl border-border/60 shadow-sm"
              aria-label={t("healing.wizard.save_draft", "Save draft")}
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{t("healing.wizard.save_draft", "Save draft")}</span>
              <span className="sm:hidden">{t("common.save", "Save")}</span>
            </Button>
          </div>

          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("healing.wizard.title", "Thought Record")}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t("healing.disclaimer_short", "Step-by-step cognitive reappraisal exercise — not medical advice")}
            </p>
          </div>

          {/* Progress */}
          <div className="py-2">
            <WizardProgress
              currentStep={step}
              totalSteps={TOTAL_STEPS}
              stepLabels={stepLabels}
            />
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={slide.initial}
              animate={slide.animate}
              exit={slide.exit}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm p-6 sm:p-8 shadow-sm"
            >
              {step === 1 && (
                <Step1Situation value={state.situation} onChange={(v) => updateState({ situation: v })} />
              )}
              {step === 2 && (
                <Step2Emotions emotions={state.emotions} onChange={(v) => updateState({ emotions: v })} />
              )}
              {step === 3 && (
                <Step3AutoThought
                  value={state.thought}
                  onChange={(v) => updateState({ thought: v })}
                  situation={state.situation}
                  aiEnabled={aiEnabled}
                />
              )}
              {step === 4 && (
                <Step4ThinkingTraps
                  selected={state.traps}
                  onChange={(v) => updateState({ traps: v })}
                  thought={state.thought}
                  situation={state.situation}
                  aiEnabled={aiEnabled}
                />
              )}
              {step === 5 && (
                <Step5Evidence
                  evidenceFor={state.evidenceFor}
                  evidenceAgainst={state.evidenceAgainst}
                  onChangeFor={(v) => updateState({ evidenceFor: v })}
                  onChangeAgainst={(v) => updateState({ evidenceAgainst: v })}
                />
              )}
              {step === 6 && (
                <Step6BalancedThought
                  value={state.balancedThought}
                  onChange={(v) => updateState({ balancedThought: v })}
                  beliefBefore={state.beliefBefore}
                  onBeliefBeforeChange={(v) => updateState({ beliefBefore: v })}
                  situation={state.situation}
                  thought={state.thought}
                  evidenceFor={state.evidenceFor}
                  evidenceAgainst={state.evidenceAgainst}
                  traps={state.traps}
                  aiEnabled={aiEnabled}
                />
              )}
              {step === 7 && (
                <Step7ReRateEmotions
                  emotions={state.emotions}
                  onChange={(v) => updateState({ emotions: v })}
                  beliefAfter={state.beliefAfter}
                  onBeliefAfterChange={(v) => updateState({ beliefAfter: v })}
                />
              )}
              {step === 8 && (
                <Step8NextAction
                  value={state.nextAction}
                  onChange={(v) => updateState({ nextAction: v })}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border/60 bg-background/85 backdrop-blur-md px-4 py-3 safe-area-inset-bottom">
            <div className="mx-auto max-w-4xl flex items-center gap-3">
              <Button
                variant="outline"
                onClick={goBack}
                disabled={step === 1}
                className="flex-1 gap-2 rounded-xl h-11"
                id="wizard-back-btn"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("common.back", "Back")}
              </Button>
              <Button
                onClick={goNext}
                disabled={!canProceed || completeMutation.isPending || saveMutation.isPending}
                className="flex-[2] gap-2 rounded-xl h-11"
                id="wizard-next-btn"
              >
                {(completeMutation.isPending || saveMutation.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {step === TOTAL_STEPS
                  ? t("healing.wizard.complete", "Complete exercise")
                  : t("common.next", "Next")}
                {step < TOTAL_STEPS && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </main>

        <GlobalFooter />
      </div>
    </>
  );
}
