// src/pages/healing/WorryTime.tsx
// Worry Parking — defer worries to a dedicated 15-minute daily slot

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Check, Trash2, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import healingApi from "@/api/healing";
import type { Worry } from "@/api/healing";

export default function WorryTime() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [draft, setDraft] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["healing-worries"],
    queryFn: healingApi.listWorries,
  });

  const worries = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (text: string) => healingApi.createWorry(text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["healing-worries"] });
      setDraft("");
      setShowAdd(false);
      toast({ title: t("healing.worry.parked_title", "Worry parked"), description: t("healing.worry.parked_desc", "Come back to it at your scheduled worry time.") });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (id: string) => healingApi.reviewWorry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["healing-worries"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => healingApi.deleteWorry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["healing-worries"] }),
  });

  const handlePark = () => {
    if (!draft.trim()) return;
    createMutation.mutate(draft.trim());
  };

  const pending = worries.filter((w) => !w.reviewed_at);
  const reviewed = worries.filter((w) => w.reviewed_at);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      <div className="mx-auto max-w-md px-4 py-6 pb-24">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/healing")} aria-label={t("common.back", "Back")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-base font-semibold text-foreground">
              {t("healing.worry.title", "Worry Time")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("healing.disclaimer_short", "Self-help tool — not medical advice")}
            </p>
          </div>
        </div>

        {/* Explainer */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t("healing.worry.how_it_works_title", "How it works")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {t("healing.worry.how_it_works",
                  "When a worry appears outside your dedicated worry time, park it here. Then at a fixed 15-minute daily slot, open these and examine each one. Outside that slot, your mind is free.")}
              </p>
            </div>
          </div>
        </div>

        {/* Add worry */}
        <div className="mb-4">
          {!showAdd ? (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setShowAdd(true)}
              id="worry-add-btn"
            >
              <Plus className="h-4 w-4" />
              {t("healing.worry.park_btn", "Park a worry")}
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-4 space-y-3"
            >
              <p className="text-sm font-medium text-foreground">
                {t("healing.worry.park_prompt", "What's the worry? Write it down, then set it aside.")}
              </p>
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, 500))}
                placeholder={t("healing.worry.placeholder", "e.g. What if I don't get the job?")}
                rows={3}
                className="resize-none text-sm"
                autoFocus
                aria-label={t("healing.worry.input_label", "Worry text")}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowAdd(false); setDraft(""); }}
                  className="flex-1"
                >
                  {t("common.cancel", "Cancel")}
                </Button>
                <Button
                  size="sm"
                  onClick={handlePark}
                  disabled={!draft.trim() || createMutation.isPending}
                  className="flex-1 gap-2"
                  id="worry-park-confirm-btn"
                >
                  {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {t("healing.worry.park_confirm", "Park it")}
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Pending worries */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && pending.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {t("healing.worry.pending_label", "Parked ({count})", { count: pending.length })}
            </p>
            <ul className="space-y-2" aria-label={t("healing.worry.pending_label", "Parked worries")}>
              <AnimatePresence>
                {pending.map((w) => (
                  <WorryItem
                    key={w.id}
                    worry={w}
                    onReview={() => reviewMutation.mutate(w.id)}
                    onDelete={() => deleteMutation.mutate(w.id)}
                  />
                ))}
              </AnimatePresence>
            </ul>
          </div>
        )}

        {/* Reviewed */}
        {reviewed.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {t("healing.worry.reviewed_label", "Reviewed")}
            </p>
            <ul className="space-y-2 opacity-60">
              {reviewed.slice(0, 5).map((w) => (
                <WorryItem
                  key={w.id}
                  worry={w}
                  reviewed
                  onReview={() => {}}
                  onDelete={() => deleteMutation.mutate(w.id)}
                />
              ))}
            </ul>
          </div>
        )}

        {!isLoading && worries.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">{t("healing.worry.empty", "No parked worries — your mind is clear right now.")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function WorryItem({ worry, reviewed, onReview, onDelete }: { worry: Worry; reviewed?: boolean; onReview: () => void; onDelete: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl border border-border bg-card p-4"
    >
      <p className="text-sm text-foreground leading-snug mb-2">{worry.text}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {format(new Date(worry.parked_at), "MMM d, h:mm a")}
        </span>
        {!reviewed && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReview}
              className="h-7 gap-1 text-xs text-green-600 dark:text-green-400 hover:text-green-700"
              aria-label={t("healing.worry.mark_reviewed", "Mark as reviewed")}
            >
              <Check className="h-3.5 w-3.5" />
              {t("healing.worry.reviewed_btn", "Reviewed")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
              aria-label={t("healing.worry.delete_aria", "Delete worry")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </motion.li>
  );
}
