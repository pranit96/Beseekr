// src/pages/healing/BehavioralExperiment.tsx
// Behavioral Experiment planner: prediction → test plan → schedule → record outcome

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, ChevronDown, ChevronUp, Trash2, Loader2, FlaskConical } from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IntensitySlider } from "./components/IntensitySlider";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import healingApi from "@/api/healing";
import type { BehavioralExperiment as BExperiment } from "@/api/healing";

const STATUS_COLOR = {
  planned: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-muted text-muted-foreground",
};

function ExperimentCard({ exp, onUpdate, onDelete }: { exp: BExperiment; onUpdate: (updates: Partial<BExperiment & { prediction: string; plan: string; outcome: string }>) => void; onDelete: () => void }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [outcomeText, setOutcomeText] = useState(exp.outcome ?? "");
  const [confAfter, setConfAfter] = useState(exp.confidence_after ?? 50);

  const canAddOutcome = exp.status === "planned";

  return (
    <motion.div layout className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-label={exp.prediction ?? t("healing.experiment.unnamed", "Experiment")}
      >
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground line-clamp-2">
            {exp.prediction || exp.plan || t("healing.experiment.unnamed", "Untitled Experiment")}
          </p>
          {exp.plan && exp.prediction && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              <span className="font-medium text-foreground/80">Plan:</span> {exp.plan}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_COLOR[exp.status])}>
              {t(`healing.experiment.status.${exp.status}`, exp.status)}
            </span>
            {exp.confidence_before != null && (
              <span className="text-[11px] text-muted-foreground">
                Initial Belief: <strong className="text-foreground">{exp.confidence_before}%</strong>
              </span>
            )}
            {exp.confidence_after != null && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                • After: <strong>{exp.confidence_after}%</strong>
              </span>
            )}
            {exp.scheduled_for && (() => {
              const d = new Date(exp.scheduled_for);
              return !isNaN(d.getTime()) ? (
                <span className="text-[11px] text-muted-foreground">
                  • {format(d, "MMM d")}
                </span>
              ) : null;
            })()}
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />}
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
              {exp.plan && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t("healing.experiment.plan_label", "Test plan")}</p>
                  <p className="text-sm text-foreground">{exp.plan}</p>
                </div>
              )}

              {exp.confidence_before != null && (
                <p className="text-xs text-muted-foreground">
                  {t("healing.experiment.confidence_before_display", `Confidence in prediction: ${exp.confidence_before}%`, { v: exp.confidence_before })}
                </p>
              )}

              {/* Outcome (if completed) */}
              {exp.outcome && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t("healing.experiment.outcome_label", "What actually happened")}</p>
                  <p className="text-sm text-foreground">{exp.outcome}</p>
                  {exp.confidence_after != null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("healing.experiment.confidence_after_display", `Confidence after: ${exp.confidence_after}%`, { v: exp.confidence_after })}
                    </p>
                  )}
                </div>
              )}

              {/* Record outcome */}
              {canAddOutcome && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold text-foreground">{t("healing.experiment.add_outcome", "Record what happened:")}</p>
                  <Textarea
                    value={outcomeText}
                    onChange={(e) => setOutcomeText(e.target.value.slice(0, 500))}
                    placeholder={t("healing.experiment.outcome_placeholder", "What actually happened? How close was your prediction?")}
                    rows={3}
                    className="text-sm resize-none"
                  />
                  <IntensitySlider
                    id={`conf-after-${exp.id}`}
                    label={t("healing.experiment.confidence_after_label", "Confidence in prediction now (0–100%)")}
                    value={confAfter}
                    onChange={setConfAfter}
                    min={0}
                    max={100}
                  />
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!outcomeText.trim()}
                    onClick={() => onUpdate({ outcome: outcomeText, confidence_after: confAfter, status: "completed" })}
                  >
                    {t("healing.experiment.save_outcome", "Save outcome")}
                  </Button>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-xs text-muted-foreground hover:text-destructive gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("common.delete", "Delete")}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function BehavioralExperiment() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ prediction: "", plan: "", confidence_before: 70, scheduled_for: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["healing-experiments"],
    queryFn: healingApi.listExperiments,
  });
  const experiments = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () => healingApi.createExperiment({
      prediction: form.prediction,
      plan: form.plan,
      confidence_before: form.confidence_before,
      scheduled_for: form.scheduled_for || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["healing-experiments"] });
      setShowForm(false);
      setForm({ prediction: "", plan: "", confidence_before: 70, scheduled_for: "" });
      toast({ title: t("healing.experiment.created_title", "Experiment planned!") });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<BExperiment & { prediction: string; plan: string; outcome: string }> }) =>
      healingApi.updateExperiment(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["healing-experiments"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => healingApi.deleteExperiment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["healing-experiments"] }),
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-violet-500/20">
      <GlobalHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 pb-20 space-y-6">
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
              Healing / <strong className="text-foreground">Behavioral Experiments</strong>
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("healing.experiment.title", "Behavioral Experiments")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t("healing.disclaimer_short", "Self-help tool — not medical advice")}
          </p>
        </div>

        {/* Explainer: What is a Behavioral Experiment? */}
        <div className="rounded-3xl border border-violet-500/25 bg-violet-500/10 backdrop-blur-sm p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-violet-500/20 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                What is a Behavioral Experiment?
              </p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Anxious thoughts often feel like absolute facts (e.g. <em>&ldquo;If I speak up in the meeting, everyone will think I&apos;m stupid&rdquo;</em>). Because we believe them, we avoid situations, which reinforces the fear.
              </p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                A <strong>behavioral experiment</strong> turns that fear into a testable <strong>hypothesis</strong>. Instead of accepting the catastrophic prediction, you test it in the real world like a scientist.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-violet-500/15">
            <div className="rounded-2xl bg-background/60 border border-border/50 p-3 text-xs space-y-1">
              <div className="font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center text-[10px] font-bold">1</span>
                The Prediction
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                State what catastrophic thing you expect to happen and rate your belief (0–100%).
              </p>
            </div>

            <div className="rounded-2xl bg-background/60 border border-border/50 p-3 text-xs space-y-1">
              <div className="font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center text-[10px] font-bold">2</span>
                The Test Action
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Pick a concrete, manageable action to test it (e.g. <em>&ldquo;Ask 1 question in tomorrow&apos;s meeting&rdquo;</em>).
              </p>
            </div>

            <div className="rounded-2xl bg-background/60 border border-border/50 p-3 text-xs space-y-1">
              <div className="font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center text-[10px] font-bold">3</span>
                The Reality
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Record what actually occurred. In almost every case, reality is far milder than predicted.
              </p>
            </div>
          </div>
        </div>

        {/* Add experiment form */}
        {!showForm ? (
          <Button
            variant="outline"
            className="w-full gap-2 border-dashed border-violet-500/40 hover:border-violet-500 hover:bg-violet-500/5 h-12 rounded-2xl"
            onClick={() => setShowForm(true)}
            id="experiment-add-btn"
          >
            <Plus className="h-4 w-4" />
            {t("healing.experiment.add_btn", "New experiment")}
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm p-6 space-y-4 shadow-md"
          >
            <p className="text-sm font-semibold text-foreground">{t("healing.experiment.new_title", "New Experiment")}</p>

            <div className="space-y-1.5">
              <Label className="text-xs">{t("healing.experiment.prediction_label", "My anxious prediction")}</Label>
              <Textarea
                value={form.prediction}
                onChange={(e) => setForm((f) => ({ ...f, prediction: e.target.value.slice(0, 500) }))}
                placeholder={t("healing.experiment.prediction_placeholder", 'e.g. "If I speak up in the meeting, everyone will think I\'m stupid."')}
                rows={2}
                className="text-sm resize-none rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t("healing.experiment.plan_label", "How I'll test it")}</Label>
              <Textarea
                value={form.plan}
                onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value.slice(0, 500) }))}
                placeholder={t("healing.experiment.plan_placeholder", 'e.g. "Ask one question in tomorrow\'s meeting."')}
                rows={2}
                className="text-sm resize-none rounded-xl"
              />
            </div>

            <IntensitySlider
              id="conf-before-new"
              label={t("healing.experiment.confidence_before_label", "How strongly do you believe this prediction? (0–100%)")}
              value={form.confidence_before}
              onChange={(v) => setForm((f) => ({ ...f, confidence_before: v }))}
              min={0}
              max={100}
            />

            <div className="space-y-1.5">
              <Label className="text-xs">{t("healing.experiment.scheduled_label", "Scheduled for (optional)")}</Label>
              <Input
                type="date"
                value={form.scheduled_for}
                onChange={(e) => setForm((f) => ({ ...f, scheduled_for: e.target.value }))}
                className="text-sm h-10 rounded-xl"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => setShowForm(false)}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                size="sm"
                className="flex-1 gap-2 rounded-xl"
                disabled={!form.prediction.trim() || !form.plan.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate()}
                id="experiment-create-btn"
              >
                {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {t("healing.experiment.create_btn", "Plan it")}
              </Button>
            </div>
          </motion.div>
        )}

        {/* List */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && experiments.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border/70 p-12 text-center">
            <FlaskConical className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No experiments planned yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("healing.experiment.empty", "No experiments yet. Plan your first one above.")}
            </p>
          </div>
        )}
        <div className="space-y-3">
          <AnimatePresence>
            {experiments.map((exp) => (
              <ExperimentCard
                key={exp.id}
                exp={exp}
                onUpdate={(updates) => updateMutation.mutate({ id: exp.id, updates })}
                onDelete={() => deleteMutation.mutate(exp.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}
