// src/pages/healing/WorryTime.tsx
// Worry Parking — defer worries to a dedicated 15-minute daily slot

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Check, Trash2, Clock, Loader2 } from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
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
      toast({
        title: t("healing.worry.parked_title", "Worry parked"),
        description: t(
          "healing.worry.parked_desc",
          "Come back to it at your scheduled worry time.",
        ),
      });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (id: string) => healingApi.reviewWorry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["healing-worries"] });
      toast({
        title: t("healing.worry.reviewed_title", "Marked as reviewed"),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => healingApi.deleteWorry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["healing-worries"] });
    },
  });

  const handlePark = () => {
    if (!draft.trim()) return;
    createMutation.mutate(draft.trim());
  };

  const pending = worries.filter((w) => !w.reviewed_at);
  const reviewed = worries.filter((w) => w.reviewed_at);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500/20">
      <GlobalHeader />

      <main className="relative z-10 flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
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
              Healing / <strong className="text-foreground">Worry Time</strong>
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("healing.worry.title", "Worry Time Vault")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t(
              "healing.disclaimer_short",
              "Postpone intrusive worries to a focused 15-minute daily review window",
            )}
          </p>
        </div>

        {/* Explainer */}
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm p-5 sm:p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <Clock
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t("healing.worry.how_it_works_title", "How worry postponement works")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {t(
                  "healing.worry.how_it_works",
                  "When an anxious thought appears outside your dedicated window, write it down here and set it aside. During your fixed 15-minute daily slot, examine each worry with clear eyes. Outside that window, your mind is free to focus.",
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Add worry */}
        <div>
          {!showAdd ? (
            <Button
              variant="outline"
              className="w-full gap-2 border-dashed border-amber-500/40 hover:border-amber-500 hover:bg-amber-500/5 h-12 rounded-2xl"
              onClick={() => setShowAdd(true)}
              id="worry-add-btn"
            >
              <Plus className="h-4 w-4" />
              {t("healing.worry.park_btn", "Park a new worry")}
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm p-5 space-y-3 shadow-md"
            >
              <p className="text-sm font-medium text-foreground">
                {t(
                  "healing.worry.park_prompt",
                  "What's on your mind? Deposit it now, review it later.",
                )}
              </p>
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, 500))}
                placeholder={t(
                  "healing.worry.placeholder",
                  "e.g. What if the client interview goes terribly wrong tomorrow?",
                )}
                rows={3}
                className="resize-none text-sm rounded-2xl bg-background/60"
                autoFocus
                aria-label={t("healing.worry.input_label", "Worry text")}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAdd(false);
                    setDraft("");
                  }}
                >
                  {t("common.cancel", "Cancel")}
                </Button>
                <Button
                  size="sm"
                  onClick={handlePark}
                  disabled={!draft.trim() || createMutation.isPending}
                  className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                  id="worry-park-confirm-btn"
                >
                  {createMutation.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {t("healing.worry.deposit_btn", "Deposit Worry")}
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Pending worries */}
        {!isLoading && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">
                  {t("healing.worry.pending_title", "Parked Worries")}
                </h2>
                <span className="text-xs text-muted-foreground font-mono">
                  {pending.length}
                </span>
              </div>

              {pending.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
                  {t(
                    "healing.worry.empty_pending",
                    "No pending worries parked. Your worry vault is clear! ✨",
                  )}
                </div>
              ) : (
                <ul className="space-y-2.5" role="list">
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
              )}
            </div>

            {/* Reviewed worries */}
            {reviewed.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-muted-foreground">
                    {t("healing.worry.reviewed_section", "Examined & Let Go")}
                  </h2>
                  <span className="text-xs text-muted-foreground font-mono">
                    {reviewed.length}
                  </span>
                </div>
                <ul className="space-y-2 opacity-60" role="list">
                  {reviewed.map((w) => (
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
          </div>
        )}
      </main>

      <GlobalFooter />
    </div>
  );
}

function WorryItem({
  worry,
  reviewed,
  onReview,
  onDelete,
}: {
  worry: Worry;
  reviewed?: boolean;
  onReview: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm text-foreground break-words ${reviewed ? "line-through text-muted-foreground" : ""}`}
          >
            {worry.text}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {(() => {
              const rawDate = worry.parked_at || (worry as any).created_at;
              if (!rawDate) return "";
              const d = new Date(rawDate);
              return !isNaN(d.getTime()) ? format(d, "MMM d, h:mm a") : "";
            })()}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!reviewed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReview}
              className="h-8 gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
              aria-label={t("healing.worry.mark_reviewed", "Mark as reviewed")}
            >
              <Check className="h-3.5 w-3.5" />
              <span>Let Go</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            aria-label={t("healing.worry.delete_aria", "Delete worry")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.li>
  );
}
