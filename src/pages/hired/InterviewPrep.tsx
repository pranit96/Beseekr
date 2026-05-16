import { InterviewPrepKit, JobApplication, resumeApi } from "@/api/resume";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResume } from "@/contexts/ResumeContext";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Cpu,
  HelpCircle,
  Lightbulb,
  Loader2,
  MessageSquare,
  RefreshCcw,
  Sparkles,
  Target,
  UploadCloud,
  UserCircle2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import HiredShell from "./HiredShell";

export default function InterviewPrep() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resumeData } = useResume();
  const [prepKit, setPrepKit] = useState<InterviewPrepKit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeApp, setActiveApp] = useState<JobApplication | null>(
    location.state?.app || null,
  );
  // For the app-selector shown when no app is pre-selected
  const [recentApps, setRecentApps] = useState<JobApplication[]>([]);

  const generateKit = useCallback(async () => {
    if (!activeApp || !resumeData) return;
    setIsLoading(true);
    try {
      const kit = await resumeApi.generateInterviewPrep({
        resume: resumeData,
        job_description: activeApp.jd_text || "",
        company_name: activeApp.company_name,
        job_title: activeApp.job_title,
      });
      setPrepKit(kit);
      // FEAT-03: Persist so back-navigation avoids regenerating (skips 5-8s LLM call)
      try {
        sessionStorage.setItem(`prepKit:${activeApp.id}`, JSON.stringify(kit));
      } catch (_) {}
      toast({
        title: "Prep Kit Ready",
        description: "AI has analyzed your rounds and skill gaps.",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        variant: "destructive",
        title: "Prep failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeApp, resumeData, toast]);
  // FEAT-03: Restore from sessionStorage first, then fall back to LLM call
  // UX-01: Load recent apps for selector when no app is pre-selected
  useEffect(() => {
    if (!activeApp) {
      resumeApi
        .getApplications()
        .then(setRecentApps)
        .catch(() => {});
      return;
    }
    try {
      const cached = sessionStorage.getItem(`prepKit:${activeApp.id}`);
      if (cached) {
        setPrepKit(JSON.parse(cached));
        return;
      }
    } catch (_) {}
    if (!prepKit) generateKit();
  }, [activeApp]);

  // Guard: no resume loaded
  if (!resumeData) {
    return (
      <HiredShell>
        <div className="max-w-xl mx-auto py-24 px-4 flex flex-col items-center justify-center text-center space-y-8">
          <div className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <UploadCloud className="w-9 h-9 text-purple-400/70" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Resume Required
            </h2>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
              Interview Intelligence maps your resume to the job description to
              predict rounds and surface real skill gaps. Add your resume first.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate("/dashboard/hired/resume")}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold h-11 px-6 rounded-2xl"
            >
              Add Resume
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard/hired")}
              className="text-zinc-500 hover:text-white h-11 px-6 rounded-2xl"
            >
              Back to Portal
            </Button>
          </div>
        </div>
      </HiredShell>
    );
  }

  return (
    <HiredShell>
      <div className="max-w-5xl mx-auto space-y-7 py-7 px-4 sm:px-6 lg:px-8">
        {!activeApp ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-8">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Target className="w-7 h-7 text-purple-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Pick an Application
              </h2>
              <p className="text-zinc-500 text-sm max-w-sm">
                Choose a job to generate a tailored interview prep kit with
                predicted rounds and skill gaps.
              </p>
            </div>
            {recentApps.length > 0 ? (
              <div className="w-full max-w-lg space-y-3 text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">
                  Recent Applications
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {recentApps.slice(0, 6).map((app) => (
                    <button
                      key={app.id}
                      onClick={() => setActiveApp(app)}
                      className="flex items-center justify-between bg-white/[0.02] hover:bg-purple-500/[0.05] border border-white/[0.07] hover:border-purple-500/30 rounded-xl p-4 transition-all text-left group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                          {app.job_title}
                        </p>
                        <p className="text-xs text-zinc-600 font-medium truncate">
                          {app.company_name}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-purple-400 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => navigate("/dashboard/hired/tracker")}
                  className="w-full text-[11px] font-bold text-zinc-600 hover:text-white transition-colors pt-2"
                >
                  View all in Tracker →
                </button>
              </div>
            ) : (
              <Button
                onClick={() => navigate("/dashboard/hired/tracker")}
                className="bg-purple-600 hover:bg-purple-500 rounded-xl px-8 font-bold"
              >
                Go to Job Tracker
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div className="flex items-center justify-between gap-4 pb-5 border-b border-white/[0.05]">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => setActiveApp(null)}
                    className="text-[10px] font-bold text-zinc-600 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" /> All Applications
                  </button>
                  <span className="text-zinc-800">/</span>
                  <span className="text-[10px] font-bold text-purple-400 truncate max-w-[200px]">
                    {activeApp.company_name}
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                  Interview Intelligence
                  {isLoading && (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  )}
                </h1>
                <p className="text-xs text-zinc-500 mt-0.5 font-medium">
                  {activeApp.job_title} @ {activeApp.company_name}
                </p>
              </div>
              <Button
                disabled={isLoading}
                onClick={generateKit}
                className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-zinc-300 font-bold h-9 px-4 rounded-xl gap-2 text-xs shrink-0"
              >
                <RefreshCcw
                  className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
                />
                Regenerate
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
                <div className="lg:col-span-4 space-y-8">
                  <div className="h-[400px] bg-white/[0.02] border border-white/[0.08] rounded-[32px]" />
                  <div className="h-[200px] bg-indigo-500/5 border border-indigo-500/10 rounded-[32px]" />
                </div>
                <div className="lg:col-span-8 space-y-8">
                  <div className="h-12 w-64 bg-white/[0.02] rounded-2xl" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-40 bg-white/[0.02] border border-white/[0.05] rounded-2xl"
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : prepKit ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pb-8">
                {/* LEFT COLUMN */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="space-y-4 bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-purple-400" />
                      Predicted Rounds
                    </h3>
                    <div className="space-y-4">
                      {prepKit.rounds.map((round, idx) => (
                        <div
                          key={idx}
                          className="relative pl-6 pb-6 border-l border-white/[0.05] last:pb-0"
                        >
                          <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-white">
                                {round.name}
                              </span>
                              <Badge className="text-[9px] font-black tracking-widest bg-white/[0.05] border-none text-zinc-500">
                                {round.difficulty}
                              </Badge>
                            </div>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                              {round.focus}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-purple-500/[0.06] border border-purple-500/15 rounded-2xl p-5 space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-purple-400 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5" /> Company Vibe
                    </h3>
                    <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                      {prepKit.culture}
                    </p>
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-500/70">
                        Watch Out For
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {prepKit.red_flags.map((f) => (
                          <span
                            key={f}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="lg:col-span-8 space-y-4">
                  <Tabs defaultValue="gaps" className="w-full">
                    <TabsList className="bg-white/[0.02] border border-white/[0.07] p-1 rounded-xl h-9 w-full sm:w-auto gap-0.5">
                      {[
                        { v: "gaps", l: "Skill Gaps" },
                        { v: "questions", l: "Questions" },
                        { v: "pitch", l: "Elevator Pitch" },
                      ].map((t) => (
                        <TabsTrigger
                          key={t.v}
                          value={t.v}
                          className="rounded-lg px-4 font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-black transition-all h-7"
                        >
                          {t.l}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    <TabsContent value="gaps" className="pt-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {prepKit.skill_gaps.map((gap, idx) => {
                          const isHigh = gap.gap_severity === "High";
                          return (
                            <div
                              key={idx}
                              className={`bg-white/[0.02] border rounded-xl p-4 transition-all hover:border-white/[0.12] ${
                                isHigh
                                  ? "border-red-500/15"
                                  : "border-amber-500/10"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-white">
                                  {gap.skill}
                                </span>
                                <span
                                  className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                                    isHigh
                                      ? "text-red-400 bg-red-500/10 border-red-500/20"
                                      : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                  }`}
                                >
                                  {gap.gap_severity}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-500 leading-relaxed mb-2">
                                {gap.revision_topic}
                              </p>
                              <span className="text-[10px] font-bold text-indigo-400">
                                → {gap.practice_source}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </TabsContent>

                    <TabsContent value="questions" className="pt-6 space-y-8">
                      <div className="space-y-6">
                        <h4 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-600 flex items-center gap-2">
                          <Cpu className="w-4 h-4" /> Technical Deep-Dive
                        </h4>
                        <div className="space-y-4">
                          {prepKit.technical_questions.map((q, i) => (
                            <div
                              key={i}
                              className="group bg-white/[0.01] border border-white/[0.05] rounded-2xl p-6 hover:bg-white/[0.02] transition-all"
                            >
                              <p className="text-sm font-bold text-zinc-200 mb-3 group-hover:text-white transition-colors">
                                Q: {q.question}
                              </p>
                              <div className="flex items-start gap-2 text-[11px] text-zinc-500 bg-white/[0.03] p-3 rounded-xl">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                <span className="font-medium leading-relaxed italic">
                                  <span className="font-black text-zinc-400 uppercase mr-1">
                                    Concept:
                                  </span>{" "}
                                  {q.ideal_answer_concept}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6 pt-6 border-t border-white/[0.05]">
                        <h4 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-600 flex items-center gap-2">
                          <UserCircle2 className="w-4 h-4" /> Behavioral /
                          Culture Fit
                        </h4>
                        <div className="space-y-4">
                          {prepKit.hr_behavioral_questions.map((q, i) => (
                            <div
                              key={i}
                              className="group bg-white/[0.01] border border-white/[0.05] rounded-2xl p-6 hover:bg-white/[0.02] transition-all"
                            >
                              <p className="text-sm font-bold text-zinc-200 mb-3 group-hover:text-white transition-colors">
                                Q: {q.question}
                              </p>
                              <p className="text-[10px] text-zinc-600 font-black uppercase tracking-wider">
                                Interviewer Intent:{" "}
                                <span className="text-zinc-500 font-bold">
                                  {q.intent}
                                </span>
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="pitch" className="pt-4">
                      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent p-6 space-y-5">
                        <div className="absolute -right-6 -top-6 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-widest text-purple-300 mb-1">
                            30-Second Hook
                          </h3>
                          <p className="text-[11px] text-zinc-500 font-medium">
                            Tailored for "Tell me about yourself" at{" "}
                            {activeApp.company_name}.
                          </p>
                        </div>
                        <blockquote className="text-base text-zinc-200 leading-relaxed font-medium italic border-l-2 border-purple-500/40 pl-4">
                          &ldquo;{prepKit.elevator_pitch}&rdquo;
                        </blockquote>
                        <div className="flex items-center gap-3 pt-2 border-t border-purple-500/10">
                          <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1">
                            Confidence: High
                          </span>
                          <span className="text-[10px] text-zinc-700 font-bold uppercase tracking-wider">
                            Use in screening round
                          </span>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            ) : (
              <div className="py-32 flex flex-col items-center justify-center space-y-6 text-center">
                <div className="w-20 h-20 bg-white/[0.02] border border-white/[0.08] rounded-3xl flex items-center justify-center text-zinc-600">
                  <Sparkles className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">
                    Generate Your Strategy
                  </h3>
                  <p className="text-zinc-500 text-sm max-w-sm">
                    Ready to ace this interview? Let AI map your profile to the
                    JD and build your custom prep kit.
                  </p>
                </div>
                <Button
                  onClick={generateKit}
                  className="bg-white text-black hover:bg-zinc-200 font-bold h-11 px-8 rounded-2xl transition-all"
                >
                  Start AI Analysis
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </HiredShell>
  );
}
