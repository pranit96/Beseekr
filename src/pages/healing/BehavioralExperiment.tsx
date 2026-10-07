// src/pages/healing/BehavioralExperiment.tsx
// Behavioral Experiment planner: prediction → test plan → schedule → record outcome

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, ChevronDown, ChevronUp, Trash2, Loader2, FlaskConical } from "lucide-react";
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
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground line-clamp-2">{exp.prediction ?? "—"}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_COLOR[exp.status])}>
              {t(`healing.experiment.status.${exp.status}`, exp.status)}
            </span>
            {exp.scheduled_for && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(exp.scheduled_for), "MMM d")}
              </span>
            )}
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
                  {t("healing.experiment.confidence_before_display", { v: exp.confidence_before }, `Confidence in prediction: ${exp.confidence_before}%`)}
                </p>
              )}

              {/* Outcome (if completed) */}
              {exp.outcome && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t("healing.experiment.outcome_label", "What actually happened")}</p>
                  <p className="text-sm text-foreground">{exp.outcome}</p>
                  {exp.confidence_after != null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("healing.experiment.confidence_after_display", { v: exp.confidence_after }, `Confidence after: ${exp.confidence_after}%`)}
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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      <div className="mx-auto max-w-md px-4 py-6 pb-24">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/healing")} aria-label={t("common.back", "Back")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-base font-semibold text-foreground">{t("healing.experiment.title", "Behavioral Experiments")}</h1>
            <p className="text-xs text-muted-foreground">{t("healing.disclaimer_short", "Self-help tool — not medical advice")}</p>
          </div>
        </div>

        {/* Explainer */}
        <div className="mb-5 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          {t("healing.experiment.explainer",
            "Test your anxious predictions in real life. Plan an experiment, do it, then record what actually happened — often much less catastrophic than predicted.")}
        </div>

        {/* Add experiment form */}
        {!showForm ? (
          <Button variant="outline" className="w-full gap-2 mb-5" onClick={() => setShowForm(true)} id="experiment-add-btn">
            <Plus className="h-4 w-4" />
            {t("healing.experiment.add_btn", "New experiment")}
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-4 space-y-4 mb-5"
          >
            <p className="text-sm font-semibold text-foreground">{t("healing.experiment.new_title", "New Experiment")}</p>

            <div className="space-y-1.5">
              <Label className="text-xs">{t("healing.experiment.prediction_label", "My anxious prediction")}</Label>
              <Textarea value={form.prediction} onChange={(e) => setForm((f) => ({ ...f, prediction: e.target.value.slice(0, 500) }))}
                placeholder={t("healing.experiment.prediction_placeholder", 'e.g. "If I speak up in the meeting, everyone will think I\'m stupid."')}
                rows={2} className="text-sm resize-none" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t("healing.experiment.plan_label", "How I'll test it")}</Label>
              <Textarea value={form.plan} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value.slice(0, 500) }))}
                placeholder={t("healing.experiment.plan_placeholder", 'e.g. "Ask one question in tomorrow\'s meeting."')}
                rows={2} className="text-sm resize-none" />
            </div>

            <IntensitySlider
              id="conf-before-new"
              label={t("healing.experiment.confidence_before_label", "How strongly do you believe this prediction? (0–100%)")}
              value={form.confidence_before}
              onChange={(v) => setForm((f) => ({ ...f, confidence_before: v }))}
              min={0} max={100}
            />

            <div className="space-y-1.5">
              <Label className="text-xs">{t("healing.experiment.scheduled_label", "Scheduled for (optional)")}</Label>
              <Input type="date" value={form.scheduled_for} onChange={(e) => setForm((f) => ({ ...f, scheduled_for: e.target.value }))}
                className="text-sm h-9" />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowForm(false)}>{t("common.cancel", "Cancel")}</Button>
              <Button size="sm" className="flex-1 gap-2" disabled={!form.prediction.trim() || !form.plan.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate()} id="experiment-create-btn">
                {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {t("healing.experiment.create_btn", "Plan it")}
              </Button>
            </div>
          </motion.div>
        )}

        {/* List */}
        {isLoading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
        {!isLoading && experiments.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            {t("healing.experiment.empty", "No experiments yet. Plan your first one above.")}
          </p>
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
      </div>
    </div>
  );
}
