// src/pages/healing/HealingHub.tsx
// ─── Healing Feature Hub — Landing Page ───────────────────────────────────────

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Brain, Wind, Clock, FlaskConical, TrendingUp, BookOpen,
  ChevronRight, AlertCircle, Plus, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import healingApi from "@/api/healing";

const MODULES = [
  {
    id: "thought-record",
    icon: Brain,
    gradient: "from-primary/20 to-primary/5",
    iconColor: "text-primary",
    titleKey: "healing.hub.thought_record",
    titleDefault: "Thought Record",
    descKey: "healing.hub.thought_record_desc",
    descDefault: "8-step CBT exercise to challenge anxious thoughts",
    route: "/healing/thought-record",
    primary: true,
  },
  {
    id: "quick-calm",
    icon: Wind,
    gradient: "from-cyan-400/20 to-cyan-400/5",
    iconColor: "text-cyan-500",
    titleKey: "healing.hub.quick_calm",
    titleDefault: "Quick Calm",
    descKey: "healing.hub.quick_calm_desc",
    descDefault: "Breathing exercise or grounding in under 2 minutes",
    route: "/healing/quick-calm",
  },
  {
    id: "worry-time",
    icon: Clock,
    gradient: "from-amber-400/20 to-amber-400/5",
    iconColor: "text-amber-500",
    titleKey: "healing.hub.worry_time",
    titleDefault: "Worry Time",
    descKey: "healing.hub.worry_time_desc",
    descDefault: "Park worries now, examine them at a set time",
    route: "/healing/worry-time",
  },
  {
    id: "experiments",
    icon: FlaskConical,
    gradient: "from-violet-400/20 to-violet-400/5",
    iconColor: "text-violet-500",
    titleKey: "healing.hub.experiments",
    titleDefault: "Behavioral Experiments",
    descKey: "healing.hub.experiments_desc",
    descDefault: "Test anxious predictions in real life",
    route: "/healing/experiments",
  },
  {
    id: "progress",
    icon: TrendingUp,
    gradient: "from-green-400/20 to-green-400/5",
    iconColor: "text-green-500",
    titleKey: "healing.hub.progress",
    titleDefault: "My Progress",
    descKey: "healing.hub.progress_desc",
    descDefault: "Charts showing emotion intensity trends over time",
    route: "/healing/progress",
  },
  {
    id: "history",
    icon: BookOpen,
    gradient: "from-rose-400/20 to-rose-400/5",
    iconColor: "text-rose-500",
    titleKey: "healing.hub.history",
    titleDefault: "My Records",
    descKey: "healing.hub.history_desc",
    descDefault: "Browse and export past thought records",
    route: "/healing/history",
  },
];

export default function HealingHub() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Recent records
  const { data: recordsData } = useQuery({
    queryKey: ["healing-records", "recent"],
    queryFn: () => healingApi.listRecords({ limit: 3, status: "completed" }),
  });
  const recentRecords = recordsData?.data ?? [];

  // Draft record
  const { data: draftData } = useQuery({
    queryKey: ["healing-records", "draft"],
    queryFn: () => healingApi.listRecords({ limit: 1, status: "draft" }),
  });
  const draftRecord = draftData?.data?.[0];

  // Progress (8 weeks summary)
  const { data: progressData } = useQuery({
    queryKey: ["healing-progress-hub"],
    queryFn: () => healingApi.getProgress(4),
  });
  const totalCompleted = progressData?.data?.total_completed ?? 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      <div className="mx-auto max-w-2xl px-4 py-8 pb-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 relative text-center"
        >
          <div className="absolute right-0 top-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/healing/settings")}
              aria-label={t("healing.hub.settings", "Healing Settings")}
            >
              <Settings className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 shadow-sm">
            <Brain className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("healing.hub.title", "Healing")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            {t("healing.hub.subtitle",
              "Evidence-based self-help exercises for anxiety and overthinking. Not a substitute for professional care.")}
          </p>
        </motion.div>

        {/* Draft banner */}
        {draftRecord && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-300/40 bg-amber-50 dark:bg-amber-950/20 p-4 cursor-pointer hover:border-amber-400 transition-colors"
            onClick={() => navigate(`/healing/thought-record?id=${draftRecord.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate(`/healing/thought-record?id=${draftRecord.id}`)}
            aria-label={t("healing.hub.resume_draft", "Resume your draft thought record")}
          >
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {t("healing.hub.draft_title", "You have an unfinished thought record")}
              </p>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                {format(new Date(draftRecord.created_at), "MMM d, h:mm a")} · {t("healing.hub.tap_to_resume", "Tap to resume")}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          </motion.div>
        )}

        {/* Quick stats */}
        {totalCompleted > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-5 rounded-2xl border border-border bg-card p-4 flex items-center gap-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 shrink-0">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t("healing.hub.stats", `${totalCompleted} exercise${totalCompleted !== 1 ? "s" : ""} completed`, { count: totalCompleted })}
              </p>
              <p className="text-xs text-muted-foreground">{t("healing.hub.stats_sub", "Keep going — patterns take time to shift.")}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto shrink-0 text-xs"
              onClick={() => navigate("/healing/progress")}
            >
              {t("healing.hub.view_progress", "View")}
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </motion.div>
        )}

        {/* Modules grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <motion.button
                key={mod.id}
                variants={itemVariants}
                type="button"
                className={`w-full text-left rounded-2xl border border-border bg-gradient-to-br ${mod.gradient} p-5 flex items-center gap-4 hover:shadow-md hover:border-primary/30 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${mod.primary ? "ring-1 ring-primary/20" : ""}`}
                onClick={() => navigate(mod.route)}
                id={`healing-module-${mod.id}`}
                aria-label={t(mod.titleKey, mod.titleDefault)}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm shadow-sm">
                  <Icon className={`h-5 w-5 ${mod.iconColor}`} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {t(mod.titleKey, mod.titleDefault)}
                    </p>
                    {mod.primary && (
                      <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        {t("healing.hub.main_badge", "Main")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {t(mod.descKey, mod.descDefault)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </motion.button>
            );
          })}
        </motion.div>

        {/* Start new — floating action style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <Button
            className="w-full gap-2 h-12 text-base shadow-lg"
            onClick={() => navigate("/healing/thought-record")}
            id="healing-start-new-btn"
          >
            <Plus className="h-5 w-5" />
            {t("healing.hub.start_new", "Start a new Thought Record")}
          </Button>
        </motion.div>

        {/* Footer disclaimer */}
        <p className="mt-6 text-center text-xs text-muted-foreground leading-relaxed px-4">
          {t("healing.disclaimer",
            "This is a self-help tool and is not a substitute for professional mental health care. If you are in crisis, please contact a qualified professional or emergency services.")}
        </p>
      </div>
    </div>
  );
}
