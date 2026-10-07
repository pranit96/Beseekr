// src/pages/healing/HealingHub.tsx
// ─── Healing Feature Hub — Bento Grid Experience ─────────────────────────────

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Brain,
  Wind,
  Clock,
  FlaskConical,
  TrendingUp,
  BookOpen,
  ChevronRight,
  Settings,
  ArrowLeft,
  Lock,
  Sparkles,
  HeartHandshake,
  Shield,
  Phone,
  Flame,
  ArrowUpRight,
  RotateCcw,
  SlidersHorizontal,
  PlusCircle,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";

import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import healingApi, { type Helpline } from "@/api/healing";
import { useAuth } from "@/contexts/AuthContext";

const DEFAULT_HELPLINES: Helpline[] = [
  {
    name: "Tele-MANAS (India)",
    number: "14416",
    type: "call",
    note: "24/7 National Mental Health Helpline (Toll-Free)",
  },
  {
    name: "Vandrevala Foundation",
    number: "9999 666 555",
    type: "call",
    note: "24/7 Free Crisis Counseling",
  },
  {
    name: "AASRA (India)",
    number: "91-9820466726",
    type: "call",
    note: "24/7 Suicide Prevention Helpline",
  },
  {
    name: "988 Suicide & Crisis Lifeline (US & Canada)",
    number: "988",
    type: "call",
    note: "24/7 Free & Confidential Support",
  },
  {
    name: "Crisis Text Line",
    number: "Text HOME to 741741",
    type: "text",
    note: "Free, 24/7 crisis support via SMS",
  },
];

export default function HealingHub() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [crisisDialogOpen, setCrisisDialogOpen] = useState(false);

  // Recent completed records
  const { data: recordsData } = useQuery({
    queryKey: ["healing-records", "recent"],
    queryFn: () => healingApi.listRecords({ limit: 3, status: "completed" }),
  });
  const recentRecords = recordsData?.data ?? [];

  // Active draft record
  const { data: draftData } = useQuery({
    queryKey: ["healing-records", "draft"],
    queryFn: () => healingApi.listRecords({ limit: 1, status: "draft" }),
  });
  const draftRecord = draftData?.data?.[0];

  // 8-week progress summary
  const { data: progressData } = useQuery({
    queryKey: ["healing-progress-hub"],
    queryFn: () => healingApi.getProgress(8),
  });
  const totalCompleted = progressData?.data?.total_completed ?? 0;
  const weekly = progressData?.data?.weekly ?? [];

  // Compute average emotional relief delta
  const avgBefore =
    weekly.length > 0
      ? weekly.reduce((acc, w) => acc + (w.avg_intensity_before ?? 0), 0) /
        weekly.length
      : 0;
  const avgAfter =
    weekly.length > 0
      ? weekly.reduce((acc, w) => acc + (w.avg_intensity_after ?? 0), 0) /
        weekly.length
      : 0;
  const deltaPercent =
    avgBefore > 0 ? Math.round(((avgBefore - avgAfter) / avgBefore) * 100) : null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500/20">
      <GlobalHeader />

      {/* Ambient Glow Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-16 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-[150px]" />
      </div>

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* ─── Breadcrumb & Top Bar ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2 text-muted-foreground hover:text-foreground -ml-2 h-9 px-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium text-xs sm:text-sm">Back to Home</span>
            </Button>
            <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
            <nav className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-foreground font-semibold">Healing</span>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1.5 py-1 px-2.5 text-xs font-medium"
            >
              <Lock className="w-3 h-3 text-emerald-500" />
              <span>AES-256 Encrypted</span>
            </Badge>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCrisisDialogOpen(true)}
              className="h-8 gap-1.5 text-xs border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden md:inline">Helplines & Crisis Support</span>
              <span className="md:hidden">Helplines</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/healing/settings")}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Healing Settings"
              aria-label="Healing Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ─── Hero Card ───────────────────────────────────────────────────── */}
        <section className="relative rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-black/5 overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  <Brain className="w-3.5 h-3.5" />
                  Cognitive Behavioral Self-Help
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  • Non-Clinical Reflection
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Reframe Thoughts, Restore Clarity
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Step-by-step cognitive reframing, instant breathing resets, and
                evidence-based exercises to challenge anxiety, overthinking, and
                harsh self-talk.
              </p>
            </div>

            {/* Live Momentum Metrics */}
            <div className="flex sm:grid sm:grid-cols-2 gap-3 shrink-0 flex-wrap">
              <div className="flex-1 sm:flex-initial rounded-2xl border border-border/50 bg-background/60 backdrop-blur-sm p-4 min-w-[140px]">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  <span>Reframes Done</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {totalCompleted}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Completed sessions
                </div>
              </div>

              <div className="flex-1 sm:flex-initial rounded-2xl border border-border/50 bg-background/60 backdrop-blur-sm p-4 min-w-[140px]">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Avg Relief Delta</span>
                </div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {deltaPercent != null && deltaPercent > 0
                    ? `-${deltaPercent}%`
                    : "Calm"}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Post-reframe intensity
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── In-Progress Draft Alert Banner (If Any) ────────────────────── */}
        {draftRecord && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Unfinished Thought Record In Progress
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {draftRecord.situation
                    ? `"${draftRecord.situation}"`
                    : "You have an autosaved reflection draft ready to resume."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(`/healing/thought-record?id=${draftRecord.id}`)
                }
                className="border-amber-500/40 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium text-xs h-9"
              >
                Resume Draft
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ─── Bento Grid Dashboard ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Bento Tile 1: Flagship Thought Record Wizard (2 Columns on Desktop) */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className="md:col-span-2 relative rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-card/90 backdrop-blur-xl p-6 sm:p-7 shadow-lg shadow-indigo-500/5 flex flex-col justify-between overflow-hidden group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-3 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-sm">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <Badge className="bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/30 font-semibold mb-1 text-[11px]">
                      Core Tool
                    </Badge>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                      8-Step Thought Record
                    </h2>
                  </div>
                </div>

                <Button
                  onClick={() => navigate("/healing/thought-record")}
                  className="hidden sm:inline-flex gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                >
                  Start New Session
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                Break unhelpful thought cycles through guided cognitive restructuring.
                Identify cognitive distortions, test evidence objectively, and
                construct rational, balanced perspectives.
              </p>

              {/* 8-Step Pipeline Strip */}
              <div className="rounded-2xl border border-border/50 bg-background/50 p-3 sm:p-4 backdrop-blur-sm">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Structured CBT Framework</span>
                  <span className="text-indigo-500">8 Progressive Steps</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center text-[10px]">
                  {[
                    "Situation",
                    "Emotions",
                    "Auto Thought",
                    "Traps",
                    "Evidence",
                    "Balance",
                    "Re-Rate",
                    "Next Action",
                  ].map((stepName, idx) => (
                    <div
                      key={stepName}
                      className="px-1.5 py-1.5 rounded-lg bg-card/80 border border-border/40 font-medium text-foreground/80 truncate"
                      title={stepName}
                    >
                      <span className="text-indigo-500 block text-[9px] font-mono">
                        0{idx + 1}
                      </span>
                      {stepName}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  Optional AI Reframe Assistance
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  At-rest Encryption
                </span>
              </div>

              <Button
                onClick={() => navigate("/healing/thought-record")}
                className="w-full sm:w-auto sm:hidden gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Start New Session
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>

          {/* Bento Tile 2: Quick Calm (Emergency Grounding Station) */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-card to-card/90 backdrop-blur-xl p-6 sm:p-7 shadow-lg shadow-cyan-500/5 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  <Wind className="w-6 h-6 animate-pulse" />
                </div>
                <Badge
                  variant="outline"
                  className="border-cyan-500/40 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 text-[10px]"
                >
                  &lt; 2 Minutes
                </Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Quick Calm
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  Fast physiological interventions to immediately lower autonomic
                  nervous arousal when feeling flooded.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/50 bg-background/40 text-xs">
                  <span className="text-lg">🫁</span>
                  <div>
                    <div className="font-semibold text-foreground">
                      Physiological Sigh
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Dual inhale + extended exhale
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/50 bg-background/40 text-xs">
                  <span className="text-lg">🌿</span>
                  <div>
                    <div className="font-semibold text-foreground">
                      5-4-3-2-1 Grounding
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Sensory present-moment anchor
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate("/healing/quick-calm")}
              className="mt-5 w-full border-cyan-500/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/10 gap-1.5"
            >
              Start Quick Calm
              <ArrowUpRight className="w-4 h-4 ml-auto" />
            </Button>
          </motion.div>

          {/* Bento Tile 3: Worry Time Vault */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card/90 backdrop-blur-xl p-6 sm:p-7 shadow-lg shadow-amber-500/5 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Clock className="w-6 h-6" />
                </div>
                <Badge
                  variant="outline"
                  className="border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[10px]"
                >
                  Postponement
                </Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Worry Time
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  Park intrusive thoughts now so you can focus on your day. Review
                  them calmly during your designated 15-minute window.
                </p>
              </div>

              <div className="p-3 rounded-2xl border border-border/50 bg-background/40 text-xs space-y-1.5">
                <div className="font-semibold text-foreground flex items-center justify-between">
                  <span>How it works</span>
                  <span className="text-amber-500 text-[11px]">2-Step Loop</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  1. Offload the worry immediately. <br />
                  2. At scheduled worry time: classify as actionable vs non-actionable.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate("/healing/worry-time")}
              className="mt-5 w-full border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 gap-1.5"
            >
              Open Worry Vault
              <ArrowUpRight className="w-4 h-4 ml-auto" />
            </Button>
          </motion.div>

          {/* Bento Tile 4: Behavioral Experiments Lab */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-card to-card/90 backdrop-blur-xl p-6 sm:p-7 shadow-lg shadow-violet-500/5 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <Badge
                  variant="outline"
                  className="border-violet-500/40 text-violet-600 dark:text-violet-400 bg-violet-500/10 text-[10px]"
                >
                  Hypothesis Testing
                </Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Behavioral Experiments
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  Test catastrophic predictions like a scientist. Turn vague fears
                  into concrete tests and record what really happened.
                </p>
              </div>

              <div className="p-3 rounded-2xl border border-border/50 bg-background/40 text-xs space-y-1.5">
                <div className="font-semibold text-foreground flex items-center justify-between">
                  <span>Confidence Gauge</span>
                  <span className="text-violet-500 text-[11px]">0% – 100%</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Record belief confidence before vs after the real-world experiment
                  to dismantle fear conditioning.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate("/healing/experiments")}
              className="mt-5 w-full border-violet-500/30 text-violet-700 dark:text-violet-300 hover:bg-violet-500/10 gap-1.5"
            >
              Design Experiment
              <ArrowUpRight className="w-4 h-4 ml-auto" />
            </Button>
          </motion.div>

          {/* Bento Tile 5: Mood Progress & Insights */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card/90 backdrop-blur-xl p-6 sm:p-7 shadow-lg shadow-emerald-500/5 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px]"
                >
                  Analytics
                </Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Mood & Pattern Trends
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  Track emotional intensity curves over time and identify your most
                  frequent thinking traps across 8 weeks.
                </p>
              </div>

              <div className="p-3 rounded-2xl border border-border/50 bg-background/40 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Exercises:</span>
                  <span className="font-bold text-foreground">{totalCompleted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Relief Factor:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {deltaPercent ? `${deltaPercent}% shift` : "Active"}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate("/healing/progress")}
              className="mt-5 w-full border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 gap-1.5"
            >
              View Progress Charts
              <ArrowUpRight className="w-4 h-4 ml-auto" />
            </Button>
          </motion.div>

          {/* Bento Tile 6: Encrypted Archives & History (Spans Across) */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className="md:col-span-2 lg:col-span-3 rounded-3xl border border-border/60 bg-gradient-to-br from-rose-500/5 via-card to-card/90 backdrop-blur-xl p-6 sm:p-7 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6"
          >
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-foreground">
                  My Encrypted Thought Records
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Review past sessions, evaluate what reframes worked best, and
                export your complete reflection history at any time.
              </p>

              {recentRecords.length > 0 && (
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[11px] text-muted-foreground">Recent:</span>
                  {recentRecords.map((rec) => (
                    <Badge
                      key={rec.id}
                      variant="secondary"
                      className="text-[11px] font-normal"
                    >
                      {format(new Date(rec.created_at), "MMM d")}
                      {rec.emotions?.[0] ? ` • ${rec.emotions[0].emotion}` : ""}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="outline"
                onClick={() => navigate("/healing/history")}
                className="gap-2"
              >
                Browse All Records
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </div>

        {/* ─── Compassionate Crisis Helpline Ribbon ────────────────────────── */}
        <section className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-muted/60 text-muted-foreground shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                Self-Help & Clinical Boundaries
              </p>
              <p className="text-[11px]">
                Healing is a self-help tool and not a substitute for clinical care.
                If you are in distress or experiencing a mental health emergency,
                free support is available 24/7.
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCrisisDialogOpen(true)}
            className="text-xs text-primary hover:text-primary/80 shrink-0 self-start sm:self-center h-8 px-3"
          >
            View Emergency Hotlines &rarr;
          </Button>
        </section>
      </main>

      {/* ─── Emergency Helplines Dialog ───────────────────────────────────── */}
      <Dialog open={crisisDialogOpen} onOpenChange={setCrisisDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <div className="mx-auto mb-2 p-3 rounded-2xl bg-rose-500/10 text-rose-500 w-fit">
              <Phone className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center text-xl">
              24/7 Crisis Helplines
            </DialogTitle>
            <DialogDescription className="text-center text-xs">
              Free, confidential, and professional support available at any time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 my-2">
            {DEFAULT_HELPLINES.map((line) => (
              <div
                key={line.name}
                className="p-3 rounded-2xl border border-border/60 bg-card/60 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-semibold text-foreground">
                    {line.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {line.note}
                  </div>
                </div>
                {line.type === "call" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    className="h-8 text-xs border-rose-500/30 text-rose-600 dark:text-rose-400"
                  >
                    <a href={`tel:${line.number.replace(/\s+/g, "")}`}>
                      {line.number}
                    </a>
                  </Button>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    {line.number}
                  </Badge>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCrisisDialogOpen(false)}
              className="text-xs text-muted-foreground"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <GlobalFooter />
    </div>
  );
}
