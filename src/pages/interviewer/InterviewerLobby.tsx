import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  Sparkles,
  Play,
  Award,
  Clock,
  ShieldCheck,
  Building2,
  Trash2,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Radio,
  Volume2,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  interviewerApi,
  InterviewSession,
  InterviewSessionConfig,
} from "@/api/interviewer";
import { StartInterviewModal } from "./components/StartInterviewModal";
import { cn } from "@/lib/utils";

export default function InterviewerLobby() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Fetch recent interview sessions with staleTime to avoid sluggish refetches
  const { data: sessions = [], isLoading, error } = useQuery({
    queryKey: ["interviewer-sessions"],
    queryFn: () => interviewerApi.listSessions(30),
    staleTime: 30 * 1000,
  });

  // Delete session mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => interviewerApi.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviewer-sessions"] });
      toast.success("Session deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete session");
    },
  });

  const handleStartInterview = async (config: InterviewSessionConfig) => {
    try {
      setIsStarting(true);
      const res = await interviewerApi.createSession(config);
      setIsModalOpen(false);
      toast.success("Interview session initialized!");
      // Navigate to the live interview room
      navigate(`/interviewer/session/${res.sessionId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to initialize interview");
    } finally {
      setIsStarting(false);
    }
  };

  // Memoize high-level stats for fast rendering without sluggishness
  const { completedSessions, averageScore, topVerdict } = React.useMemo(() => {
    const completed = sessions.filter(
      (s) => s.status === "completed" || s.feedback,
    );
    const scores = sessions
      .map((s) => s.feedback?.overallScore)
      .filter((score): score is number => typeof score === "number");

    const avg = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    const top =
      completed.find((s) => s.feedback?.verdict === "Strong Hire")
        ?.feedback?.verdict ||
      completed[0]?.feedback?.verdict ||
      "N/A";

    return { completedSessions: completed, averageScore: avg, topVerdict: top };
  }, [sessions]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-violet-500/30">
      <GlobalHeader />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-b from-card via-card/80 to-card/50 p-6 sm:p-10 mb-8 sm:mb-10 shadow-xl backdrop-blur-xl">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none -ml-20 -mb-20" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20 text-xs font-semibold uppercase tracking-wider mb-4">
                <Radio className="w-3.5 h-3.5 animate-pulse text-violet-600 dark:text-violet-400" />
                Real-time Voice AI Simulation
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-4">
                AI Interviewer
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground font-medium leading-relaxed mb-6">
                Practice high-stakes technical, behavioral, and system design interviews with an adaptive voice interviewer. Talk naturally using your microphone, receive live follow-up questions, and get instant hiring committee scorecards.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => setIsModalOpen(true)}
                  size="lg"
                  className="rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-violet-500/25 px-6 sm:px-7 py-5 sm:py-6 text-sm sm:text-base"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Start New Interview
                </Button>

                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-xl border border-border/40">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>AES-256 Encrypted</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 gap-3 min-w-[280px] sm:min-w-[320px]">
              <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Sessions</span>
                  <Award className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {sessions.length}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {completedSessions.length} evaluated
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Avg Score</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {averageScore > 0 ? `${averageScore}%` : "—"}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {topVerdict !== "N/A" ? topVerdict : "Ready to practice"}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm col-span-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Whisper STT + ElevenLabs TTS</div>
                    <div className="text-[11px] text-muted-foreground">Word-accurate speech translation with natural voice delivery</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES BANNER */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 sm:mb-10">
          <div className="p-5 rounded-2xl border border-border/50 bg-card shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground mb-1">Live Voice Conversation</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Speak into your mic. OpenAI Whisper transcribes every nuance while Claude answers realistically with custom personas.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/50 bg-card shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground mb-1">Adaptive Follow-Up Questions</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The interviewer doesn't just read a script — it drills down into edge cases, system trade-offs, and behavioral nuances.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/50 bg-card shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground mb-1">Hiring Rubric & Scores</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Get an overall hire verdict, 5-pillar skill analysis (STAR method, technical depth, communication), and question critiques.
            </p>
          </div>
        </section>

        {/* SESSIONS SECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Your Interview Sessions
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Past mock interviews, transcripts, and evaluation scorecards.
              </p>
            </div>

            <Button
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              size="sm"
              className="rounded-xl border-border/50 hover:bg-muted"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Session
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-36 rounded-2xl border border-border/30 bg-muted/10 animate-pulse"
                />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-border/50 bg-card/20">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center mx-auto mb-4">
                <Mic className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">No interview sessions yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                Start your first realistic mock interview today to test your technical depth, system design, or behavioral skills.
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold px-5"
              >
                <Plus className="w-4 h-4 mr-2" />
                Launch First Interview
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map((session) => {
                const isCompleted = session.status === "completed" || session.feedback;
                const score = session.feedback?.overallScore;
                const verdict = session.feedback?.verdict;

                return (
                  <motion.div
                    key={session.id}
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                    className="p-5 rounded-2xl border border-border/50 bg-card hover:border-border transition-all shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      {/* Top row badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-[10px] uppercase font-bold tracking-wider"
                          >
                            {session.config?.interviewType || "General"}
                          </Badge>

                          {session.config?.company && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                              <Building2 className="w-3 h-3 text-muted-foreground/60" />
                              {session.config.company}
                            </span>
                          )}
                        </div>

                        {/* Status / Score badge */}
                        {score !== undefined ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-bold font-mono",
                              score >= 75
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                : score >= 50
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                                : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
                            )}
                          >
                            {score}/100 • {verdict || "Evaluated"}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[10px] font-semibold"
                          >
                            In Progress
                          </Badge>
                        )}
                      </div>

                      {/* Title & Persona */}
                      <h3 className="font-bold text-base text-foreground mb-1">
                        {session.config?.role || "Software Engineer Interview"}
                      </h3>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                        {session.config?.persona}
                      </p>
                    </div>

                    {/* Bottom actions & timestamp */}
                    <div className="pt-3 border-t border-border/30 flex items-center justify-between">
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
                        {session.created_at
                          ? formatDistanceToNow(new Date(session.created_at), { addSuffix: true })
                          : "Recently"}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this session?")) {
                              deleteMutation.mutate(session.id);
                            }
                          }}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>

                        {isCompleted ? (
                          <Button
                            size="sm"
                            onClick={() => navigate(`/interviewer/feedback/${session.id}`)}
                            className="rounded-xl text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                          >
                            View Feedback
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => navigate(`/interviewer/session/${session.id}`)}
                            className="rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white"
                          >
                            Resume Room
                            <Play className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <GlobalFooter />

      {/* Start Modal */}
      <StartInterviewModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onStart={handleStartInterview}
        loading={isStarting}
      />
    </div>
  );
}
