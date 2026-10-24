import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Award,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Building2,
  Copy,
  RotateCcw,
  ShieldCheck,
  Briefcase,
  HelpCircle,
  Loader2,
  Share2,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { interviewerApi } from "@/api/interviewer";
import { cn } from "@/lib/utils";

export default function InterviewerFeedbackPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: session,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["interviewer-session", sessionId],
    queryFn: () => (sessionId ? interviewerApi.getSession(sessionId) : null),
    enabled: Boolean(sessionId),
  });

  const feedback = session?.feedback;

  const handleCopySummary = () => {
    if (!feedback) return;
    const text = `Mock Interview Evaluation — ${session?.config?.role || "Software Engineer"}\nOverall Score: ${feedback.overallScore}/100 (${feedback.verdict})\n\nSummary: ${feedback.summary}\n\nHiring Notes: ${feedback.hiringNotes}`;
    navigator.clipboard.writeText(text);
    toast.success("Feedback summary copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">
            Generating In-Depth Evaluation Report...
          </p>
        </div>
      </div>
    );
  }

  if (error || !session || !feedback) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <GlobalHeader />
        <div className="max-w-md w-full mx-auto p-6 rounded-3xl border border-border/50 bg-card text-center space-y-4 my-auto">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold">Feedback Report Pending</h2>
          <p className="text-sm text-muted-foreground">
            The evaluation report hasn't been generated yet for this session.
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate("/interviewer")}
              className="rounded-xl"
            >
              Back to Lobby
            </Button>
            {sessionId && (
              <Button
                onClick={() => navigate(`/interviewer/session/${sessionId}`)}
                className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white"
              >
                Return to Room
              </Button>
            )}
          </div>
        </div>
        <GlobalFooter />
      </div>
    );
  }

  const role = session.config?.role || "Software Engineer";
  const company = session.config?.company || "Tech Company";
  const overallScore = feedback.overallScore;

  const getVerdictStyle = (verdict: string) => {
    const v = verdict.toLowerCase();
    if (v.includes("strong hire")) {
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 shadow-emerald-500/10";
    }
    if (v.includes("hire")) {
      return "bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/40 shadow-teal-500/10";
    }
    if (v.includes("lean")) {
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40 shadow-amber-500/10";
    }
    return "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40 shadow-rose-500/10";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 65) return "text-teal-600 dark:text-teal-400";
    if (score >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-violet-500/30">
      <GlobalHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* NAV & ACTION BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/interviewer")}
            className="rounded-xl w-fit text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Interviewer Lobby
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopySummary}
              className="rounded-xl border-border/50 text-xs font-semibold"
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy Summary
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/interviewer")}
              className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Practice Another
            </Button>
          </div>
        </div>

        {/* HERO SCORE & VERDICT BANNER */}
        <section className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-b from-card via-card/70 to-card/40 p-6 sm:p-10 shadow-2xl backdrop-blur-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/10 rounded-full blur-[90px] pointer-events-none -mr-16 -mt-16" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-xl space-y-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "px-3 py-1 text-xs uppercase font-extrabold tracking-wider border shadow-sm",
                    getVerdictStyle(feedback.verdict),
                  )}
                >
                  Verdict: {feedback.verdict}
                </Badge>
                <Badge variant="secondary" className="text-xs font-medium">
                  {session.config?.interviewType || "General"}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {role}
              </h1>

              <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
                <Building2 className="w-4 h-4 text-muted-foreground/70" />
                <span>{company}</span>
                <span>•</span>
                <span>AI Hiring Committee Evaluation</span>
              </div>

              <p className="text-sm sm:text-base text-muted-foreground/90 leading-relaxed pt-2">
                {feedback.summary}
              </p>
            </div>

            {/* Overall Score Dial */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-card border border-border/50 shadow-sm min-w-[200px]">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted/40 dark:text-muted/20"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={289}
                    strokeDashoffset={289 - (289 * overallScore) / 100}
                    strokeLinecap="round"
                    className={cn(
                      "transition-all duration-1000",
                      overallScore >= 75
                        ? "text-emerald-500"
                        : overallScore >= 50
                        ? "text-amber-500"
                        : "text-rose-500",
                    )}
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn("text-3xl font-extrabold font-mono", getScoreColor(overallScore))}>
                    {overallScore}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    out of 100
                  </span>
                </div>
              </div>
              <span className="mt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Overall Rating
              </span>
            </div>
          </div>
        </section>

        {/* 5-DIMENSION COMPETENCY SCORES */}
        {feedback.scores && (
          <section className="p-6 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-md space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
              <Award className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              Core Competence Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              {[
                { label: "Technical Depth", value: feedback.scores.technicalDepth },
                { label: "Communication & Clarity", value: feedback.scores.communication },
                { label: "Problem Solving", value: feedback.scores.problemSolving },
                { label: "Confidence & Presence", value: feedback.scores.confidence },
                { label: "Relevance & Alignment", value: feedback.scores.relevance },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-border/40 bg-muted/20 space-y-2"
                >
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-foreground">{item.label}</span>
                    <span className={cn("font-mono", getScoreColor(item.value))}>
                      {item.value}%
                    </span>
                  </div>
                  <Progress value={item.value} className="h-2 rounded-full" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* STRENGTHS & IMPROVEMENTS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Strengths */}
          <div className="p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.04] backdrop-blur-md space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Key Strengths Demonstrated
            </h3>

            <ul className="space-y-3">
              {feedback.strengths?.map((strength, i) => (
                <li
                  key={i}
                  className="p-3.5 rounded-2xl bg-card border border-emerald-500/20 text-xs sm:text-sm text-foreground/90 leading-relaxed flex items-start gap-2.5 shadow-xs"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    ✓
                  </span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div className="p-6 rounded-3xl border border-amber-500/20 bg-amber-500/[0.04] backdrop-blur-md space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Areas for Growth & Refinement
            </h3>

            <ul className="space-y-3">
              {feedback.improvements?.map((imp, i) => (
                <li
                  key={i}
                  className="p-3.5 rounded-2xl bg-card border border-amber-500/20 text-xs sm:text-sm text-foreground/90 leading-relaxed flex items-start gap-2.5 shadow-xs"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    ↑
                  </span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* QUESTION BY QUESTION BREAKDOWN */}
        {feedback.questionBreakdown && feedback.questionBreakdown.length > 0 && (
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-foreground tracking-tight">
                Question-by-Question Deep Dive
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Evaluation of each candidate response and interviewer question.
              </p>
            </div>

            <div className="space-y-4">
              {feedback.questionBreakdown.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-5 sm:p-6 rounded-2xl border border-border/50 bg-card backdrop-blur-md space-y-3 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                      Question {idx + 1}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] uppercase font-bold tracking-wider w-fit",
                        item.quality === "Excellent"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                          : item.quality === "Good"
                          ? "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/30"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
                      )}
                    >
                      {item.quality} Response
                    </Badge>
                  </div>

                  <h4 className="font-bold text-sm sm:text-base text-foreground leading-snug">
                    {item.question}
                  </h4>

                  {item.candidateResponse && (
                    <div className="p-3.5 rounded-xl bg-muted/20 border border-border/30 text-xs text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground/80 block mb-1">
                        Your Answer Summary:
                      </span>
                      {item.candidateResponse}
                    </div>
                  )}

                  <div className="pt-1 text-xs sm:text-sm text-foreground/90 leading-relaxed flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    <span>{item.comment}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* HIRING COMMITTEE NOTES */}
        {feedback.hiringNotes && (
          <section className="p-6 rounded-3xl border border-violet-500/30 bg-gradient-to-r from-violet-500/[0.05] via-card to-indigo-500/[0.05] backdrop-blur-md space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              Hiring Committee Recommendation
            </h4>
            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed font-medium">
              "{feedback.hiringNotes}"
            </p>
          </section>
        )}
      </main>

      <GlobalFooter />
    </div>
  );
}
