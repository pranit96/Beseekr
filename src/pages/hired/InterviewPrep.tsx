import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  resumeApi,
  InterviewPrepKit,
  JobApplication,
  ResumeSchema,
} from "@/api/resume";
import { useResume } from "@/contexts/ResumeContext";
import {
  Target,
  ArrowLeft,
  Loader2,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Cpu,
  UserCircle2,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  Building2,
  ChevronRight,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { GlobalFooter } from "@/components/GlobalFooter";

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

  return (
    <div className="h-screen flex flex-col bg-[#09090b] text-zinc-100 overflow-hidden">
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-12 py-10 px-4 sm:px-6 lg:px-8">
          {!activeApp ? (
            <div className="py-20 flex flex-col items-center justify-center p-6 text-center space-y-8">
              <Building2 className="w-16 h-16 text-zinc-800 opacity-40" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">
                  Select an Application
                </h2>
                <p className="text-zinc-500 max-w-md">
                  Choose a job from your tracker to generate a tailored prep
                  kit.
                </p>
              </div>
              {recentApps.length > 0 ? (
                <div className="w-full max-w-md space-y-3 text-left">
                  <p className="text-[11px] font-black uppercase tracking-widest text-zinc-600">
                    Recent Applications
                  </p>
                  {recentApps.slice(0, 6).map((app) => (
                    <button
                      key={app.id}
                      onClick={() => setActiveApp(app)}
                      className="w-full flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-indigo-500/30 rounded-2xl p-4 transition-all text-left group"
                    >
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {app.job_title}
                        </p>
                        <p className="text-xs text-zinc-500 font-medium">
                          {app.company_name}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                    </button>
                  ))}
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/dashboard/hired/tracker")}
                    className="w-full text-zinc-500 hover:text-white text-xs font-bold"
                  >
                    View All Applications
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => navigate("/dashboard/hired/tracker")}
                  className="bg-indigo-600 hover:bg-indigo-500 rounded-xl px-8 font-bold"
                >
                  Go to Job Tracker
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* HEADER */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/[0.05] pb-10">
                <div className="space-y-4">
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/dashboard/hired/tracker")}
                    className="text-zinc-500 hover:text-white transition-colors -ml-3"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tracker
                  </Button>
                  <div className="space-y-1">
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tighter">
                      Interview{" "}
                      <span className="text-indigo-400">Intelligence.</span>
                    </h1>
                    <div className="flex items-center gap-3 pt-2">
                      <Badge
                        variant="outline"
                        className="bg-white/[0.03] border-white/[0.08] text-zinc-400 font-bold px-3 py-1"
                      >
                        {activeApp.job_title} @ {activeApp.company_name}
                      </Badge>
                      {isLoading && (
                        <span className="flex items-center gap-2 text-xs font-bold text-indigo-400 animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" /> Analyzing
                          company data...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  disabled={isLoading}
                  onClick={generateKit}
                  className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-200 font-bold h-11 px-6 rounded-2xl flex items-center gap-2 transition-all active:scale-95"
                >
                  <RefreshCcw
                    className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Re-generate Kit
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
                  {/* LEFT COLUMN: ROUNDS & CULTURE */}
                  <div className="lg:col-span-4 space-y-8">
                    <div className="space-y-6 bg-white/[0.02] border border-white/[0.08] rounded-[32px] p-8">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-400" />
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

                    <Card className="bg-indigo-500/5 border-indigo-500/20 rounded-[32px] p-8 space-y-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-base font-bold text-indigo-300 tracking-tight">
                          Company Vibe
                        </h3>
                      </div>
                      <p className="text-sm text-indigo-200/70 leading-relaxed font-medium">
                        {prepKit.culture}
                      </p>
                      <div className="pt-4 space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                          Avoid these Red Flags
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {prepKit.red_flags.map((f) => (
                            <Badge
                              key={f}
                              className="bg-red-500/10 text-red-400 border-red-500/20 rounded-lg text-[10px] font-bold"
                            >
                              {f}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* RIGHT COLUMN: SKILL GAPS & QUESTIONS */}
                  <div className="lg:col-span-8 space-y-8">
                    <Tabs defaultValue="gaps" className="w-full">
                      <TabsList className="bg-white/[0.02] border border-white/[0.08] p-1 rounded-2xl h-12 w-full sm:w-auto">
                        <TabsTrigger
                          value="gaps"
                          className="rounded-xl px-6 font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-black transition-all"
                        >
                          Skill Gaps
                        </TabsTrigger>
                        <TabsTrigger
                          value="questions"
                          className="rounded-xl px-6 font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-black transition-all"
                        >
                          Practice Questions
                        </TabsTrigger>
                        <TabsTrigger
                          value="pitch"
                          className="rounded-xl px-6 font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-black transition-all"
                        >
                          Elevator Pitch
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="gaps" className="pt-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {prepKit.skill_gaps.map((gap, idx) => (
                            <div
                              key={idx}
                              className="bg-white/[0.01] border border-white/[0.05] hover:border-indigo-500/30 rounded-2xl p-5 transition-all"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-bold text-white">
                                  {gap.skill}
                                </span>
                                <Badge
                                  className={`text-[9px] font-black ${gap.gap_severity === "High" ? "text-red-400 bg-red-400/10" : "text-amber-400 bg-amber-400/10"} border-none`}
                                >
                                  {gap.gap_severity} GAP
                                </Badge>
                              </div>
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <span className="text-[9px] font-black uppercase text-zinc-600">
                                    Revision Focus
                                  </span>
                                  <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                                    {gap.revision_topic}
                                  </p>
                                </div>
                                <div className="pt-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-[10px] text-indigo-400 hover:bg-indigo-400/10 font-bold rounded-lg px-2"
                                  >
                                    Study: {gap.practice_source}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
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

                      <TabsContent value="pitch" className="pt-6">
                        <div className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-[32px] p-10 space-y-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-8 opacity-5">
                            <MessageSquare className="w-32 h-32 text-white" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-2xl font-bold tracking-tight">
                              The 30-Second Hook
                            </h3>
                            <p className="text-zinc-500 text-xs font-medium italic">
                              Tailored for "Tell me about yourself" in this
                              specific role.
                            </p>
                          </div>
                          <p className="text-lg text-zinc-300 leading-relaxed font-serif italic relative z-10">
                            &ldquo;{prepKit.elevator_pitch}&rdquo;
                          </p>
                          <div className="flex items-center gap-4 pt-4">
                            <Badge className="bg-indigo-500/20 text-indigo-400 border-none rounded-full px-3 py-1 text-[10px] font-bold">
                              Confidence Level: High
                            </Badge>
                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                              Recommended for Screening Round
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
                      Ready to ace this interview? Let AI map your profile to
                      the JD and build your custom prep kit.
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
      </main>

      <div className="flex-shrink-0">
        <GlobalFooter>
          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <Target className="w-3 h-3 text-indigo-400" />
            Interview Strategy Engine Ready
          </div>
        </GlobalFooter>
      </div>
    </div>
  );
}
