import {
  InterviewPrepKit,
  JobApplication,
  resumeApi,
  ResearchSummary,
} from "@/api/resume";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResume } from "@/contexts/ResumeContext";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
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
  Search,
  Globe,
  Zap,
  ArrowUpRight,
  ChevronUp,
  Hash,
  DollarSign,
  AlertCircle,
  Copy,
  Check,
  CheckCircle2,
  ShieldAlert,
  BookOpen,
  Terminal,
  Briefcase,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import HiredShell from "./HiredShell";

const QUICK_SEARCHES = [
  "Google L4 Software Engineer",
  "Accenture interview",
  "Amazon SDE2 culture",
  "Microsoft senior PM salary",
];

export default function InterviewPrep() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resumeData } = useResume();

  // Get active tab from URL query params
  const queryParams = new URLSearchParams(location.search);
  const initialTab =
    queryParams.get("tab") === "research" ? "research" : "prep";
  const [activeMainTab, setActiveMainTab] = useState<"prep" | "research">(
    initialTab,
  );

  // Sync tab state with query params
  useEffect(() => {
    const tab = queryParams.get("tab") === "research" ? "research" : "prep";
    setActiveMainTab(tab);
  }, [location.search]);

  const handleTabChange = (tab: "prep" | "research") => {
    setActiveMainTab(tab);
    navigate(`/dashboard/hired/prep?tab=${tab}`, { replace: true });
  };

  // ── PREP KIT STATES ────────────────────────────────────────────────
  const [prepKit, setPrepKit] = useState<InterviewPrepKit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeApp, setActiveApp] = useState<JobApplication | null>(
    location.state?.app || null,
  );
  const [recentApps, setRecentApps] = useState<JobApplication[]>([]);
  const [revealedTechAnswers, setRevealedTechAnswers] = useState<number[]>([]);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [completedReadinessTasks, setCompletedReadinessTasks] = useState<
    string[]
  >(["Review resume basics"]);

  const toggleReadinessTask = (task: string) => {
    setCompletedReadinessTasks((prev) =>
      prev.includes(task) ? prev.filter((t) => t !== task) : [...prev, task],
    );
  };

  const handleCopyPitch = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
    toast({
      title: "Pitch Copied",
      description: "Tailored 30-second elevator pitch saved to clipboard.",
    });
  };

  // ── CAREER RESEARCH STATES ─────────────────────────────────────────
  const [researchQuery, setResearchQuery] = useState("");
  const [isResearchLoading, setIsResearchLoading] = useState(false);
  const [researchResults, setResearchResults] = useState<any>(null);
  const [researchSummary, setResearchSummary] =
    useState<ResearchSummary | null>(null);
  const [searchedQuery, setSearchedQuery] = useState("");

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

  // ── CAREER RESEARCH SEARCH HANDLER ───────────────────────────────
  const handleResearchSearch = async (q?: string) => {
    const finalQuery = q || researchQuery;
    if (!finalQuery.trim()) return;
    if (q) setResearchQuery(q);

    setIsResearchLoading(true);
    setResearchResults(null);
    setResearchSummary(null);
    setSearchedQuery(finalQuery);

    try {
      const data = await resumeApi.performCareerResearch(finalQuery);
      setResearchResults(data.data);
      if (
        data.data &&
        (data.data.reddit?.posts?.length > 0 || data.data.web?.length > 0)
      ) {
        const sumData = await resumeApi.summarizeResearch({
          reddit: data.data.reddit,
          web: data.data.web,
        });
        setResearchSummary(sumData);
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Research failed",
        description: "Could not fetch market intelligence. Please try again.",
      });
    } finally {
      setIsResearchLoading(false);
    }
  };

  // Cross-pollination helper: Research company from Prep Kit
  const researchCompanyFromKit = (companyName: string) => {
    const queryStr = `${companyName} interview questions`;
    handleTabChange("research");
    handleResearchSearch(queryStr);
  };

  const hasResearchResults =
    researchResults &&
    (researchResults.reddit?.posts?.length > 0 ||
      researchResults.web?.length > 0);

  // Guard: no resume loaded
  if (!resumeData || !resumeData.personal_info?.name) {
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
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold h-11 px-6 rounded-2xl animate-pulse"
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
        {/* PREMIUM TOP MULTI-MODE TABS */}
        <div className="flex bg-[#0c0c12]/40 border border-white/[0.05] p-1.5 rounded-2xl shrink-0 self-start sm:self-center shadow-lg w-full max-w-md mx-auto select-none mb-4">
          <button
            onClick={() => handleTabChange("prep")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-extrabold tracking-wide uppercase transition-all duration-200 outline-none ${
              activeMainTab === "prep"
                ? "bg-white text-black shadow-lg scale-[1.01]"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            AI Prep Kits
          </button>
          <button
            onClick={() => handleTabChange("research")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-extrabold tracking-wide uppercase transition-all duration-200 outline-none ${
              activeMainTab === "research"
                ? "bg-white text-black shadow-lg scale-[1.01]"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Company & Market Research
          </button>
        </div>

        {activeMainTab === "prep" ? (
          /* ── AI PREP KITS VIEW ────────────────────────────────────────── */
          <>
            {!activeApp ? (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-8">
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
                      className="w-full text-[11px] font-bold text-zinc-600 hover:text-white transition-colors pt-2 text-center"
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
                  <div className="min-w-0 text-left">
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
                  <div className="flex gap-2">
                    {/* CROSS POLLINATION BUTTON */}
                    <Button
                      onClick={() =>
                        researchCompanyFromKit(activeApp.company_name)
                      }
                      className="bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 text-indigo-300 font-bold h-9 px-4 rounded-xl gap-2 text-xs shrink-0"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Research Company
                    </Button>
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
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse text-left">
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
                  <div className="space-y-8 animate-in fade-in duration-300 pb-16 text-left">
                    {/* ── Predicted Rounds Pipeline Horizontal Track ── */}
                    <div className="bg-[#0b0b12]/50 border border-white/[0.05] rounded-3xl p-6 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.02] rounded-full blur-3xl pointer-events-none" />
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                            <Target className="w-3.5 h-3.5 text-indigo-400" />
                            Predicted Hiring Journey
                          </h3>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            Tailored path based on role structure and market
                            patterns.
                          </p>
                        </div>
                        <Badge className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-widest px-3 py-1 self-start md:self-auto uppercase">
                          {prepKit.rounds.length} Total Rounds
                        </Badge>
                      </div>

                      {/* Timeline track */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {prepKit.rounds.map((round, idx) => {
                          let diffColor =
                            "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                          if (round.difficulty === "Medium") {
                            diffColor =
                              "text-amber-400 bg-amber-500/10 border-amber-500/20";
                          } else if (round.difficulty === "Hard") {
                            diffColor =
                              "text-red-400 bg-red-500/10 border-red-500/20";
                          }
                          return (
                            <div
                              key={idx}
                              className="relative group bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-4 transition-all duration-300"
                            >
                              {/* Step circle index */}
                              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[10px] font-bold text-zinc-500 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-colors">
                                {idx + 1}
                              </div>
                              <div className="space-y-2 pr-6">
                                <div className="space-y-1">
                                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors leading-tight">
                                    {round.name}
                                  </h4>
                                  <span
                                    className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded border uppercase ${diffColor}`}
                                  >
                                    {round.difficulty} Difficulty
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                                  {round.focus}
                                </p>
                                <div className="pt-2 border-t border-white/[0.04] flex flex-wrap gap-1">
                                  {round.likely_topics
                                    .slice(0, 3)
                                    .map((topic, i) => (
                                      <span
                                        key={i}
                                        className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-zinc-400"
                                      >
                                        {topic}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Main workspace layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      {/* Left: Company Vibe and Red Flags Context Sidebar (4 Columns) */}
                      <div className="lg:col-span-4 space-y-6">
                        {/* Company Card */}
                        <div className="bg-[#0b0b12]/40 border border-white/[0.05] rounded-3xl p-6 space-y-5 relative overflow-hidden shadow-lg">
                          <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-indigo-500/[0.01] rounded-full blur-2xl pointer-events-none" />
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest leading-none">
                                Target Company
                              </h4>
                              <p className="text-base font-black text-white mt-1 leading-tight">
                                {activeApp.company_name}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5 select-none">
                              <Zap className="w-3.5 h-3.5" /> Company Vibe &
                              Focus
                            </span>
                            <p className="text-xs text-zinc-300 leading-relaxed font-semibold bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                              {prepKit.culture}
                            </p>
                          </div>
                        </div>

                        {/* Red Flags Alert Card */}
                        <div className="bg-red-500/[0.03] border border-red-500/15 rounded-3xl p-6 space-y-4 shadow-lg">
                          <div className="flex items-center gap-2 text-red-400">
                            <ShieldAlert className="w-4 h-4" />
                            <h4 className="text-xs font-black uppercase tracking-widest">
                              Crucial Watchouts
                            </h4>
                          </div>
                          <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                            Avoid these red flags or buzzwords during your
                            interviews to maintain alignment.
                          </p>
                          <div className="flex flex-col gap-2">
                            {prepKit.red_flags.map((flag, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 bg-red-500/[0.06] border border-red-500/10 rounded-xl p-3"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                                <span className="text-xs text-red-300 font-bold leading-relaxed">
                                  {flag}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Quick Navigation / Cross Pollination Actions */}
                        <div className="bg-white/[0.01] border border-white/[0.05] rounded-3xl p-5 space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            Related Actions
                          </h4>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() =>
                                researchCompanyFromKit(activeApp.company_name)
                              }
                              className="w-full flex items-center justify-between text-xs text-zinc-400 hover:text-white bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] rounded-xl px-4 py-3 text-left transition-all group"
                            >
                              <span className="font-bold flex items-center gap-2">
                                <Search className="w-3.5 h-3.5 text-indigo-400" />{" "}
                                Research Company Intel
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
                            </button>
                            <button
                              onClick={() =>
                                navigate("/dashboard/hired/tracker")
                              }
                              className="w-full flex items-center justify-between text-xs text-zinc-400 hover:text-white bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] rounded-xl px-4 py-3 text-left transition-all group"
                            >
                              <span className="font-bold flex items-center gap-2">
                                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />{" "}
                                View Application Details
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right: Prep Modules Navigation Tabs (8 Columns) */}
                      <div className="lg:col-span-8">
                        <Tabs
                          defaultValue="overview"
                          className="w-full space-y-6"
                        >
                          <TabsList className="bg-[#0b0b12]/50 border border-white/[0.05] p-1.5 rounded-2xl w-full flex overflow-x-auto no-scrollbar gap-1">
                            {[
                              {
                                v: "overview",
                                l: "Readiness Hub",
                                icon: Target,
                              },
                              {
                                v: "technical",
                                l: "Technical Prep",
                                icon: Terminal,
                              },
                              {
                                v: "behavioral",
                                l: "Behavioral Prep",
                                icon: UserCircle2,
                              },
                              {
                                v: "gaps",
                                l: "Skill Gap Plan",
                                icon: BookOpen,
                              },
                              {
                                v: "pitch",
                                l: "Elevator Pitch",
                                icon: Sparkles,
                              },
                            ].map((t) => {
                              const Icon = t.icon;
                              return (
                                <TabsTrigger
                                  key={t.v}
                                  value={t.v}
                                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2 px-3 font-extrabold text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-black transition-all cursor-pointer whitespace-nowrap"
                                >
                                  <Icon className="w-3.5 h-3.5 shrink-0" />
                                  <span>{t.l}</span>
                                </TabsTrigger>
                              );
                            })}
                          </TabsList>

                          {/* ── TAB 1: READINESS HUB OVERVIEW ────────────────────── */}
                          <TabsContent
                            value="overview"
                            className="space-y-6 outline-none"
                          >
                            {/* Readiness Index & Stats */}
                            <div className="bg-gradient-to-br from-indigo-500/[0.08] to-purple-500/[0.04] border border-indigo-500/20 rounded-3xl p-6 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <h3 className="text-lg font-black text-white">
                                    Your Interview Readiness Score
                                  </h3>
                                  <p className="text-xs text-indigo-200/60 leading-relaxed font-semibold">
                                    Calculated from your profile match, gap
                                    severity, and completed checklist.
                                  </p>
                                </div>
                                <div className="flex items-baseline gap-1 bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-2.5 shrink-0">
                                  <span className="text-3xl font-black text-white tracking-tight">
                                    85
                                  </span>
                                  <span className="text-xs text-zinc-500 font-bold">
                                    /100
                                  </span>
                                </div>
                              </div>

                              <div className="w-full bg-white/[0.04] rounded-full h-2.5 overflow-hidden">
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full w-[85%]" />
                              </div>

                              <div className="grid grid-cols-3 gap-2.5 pt-2">
                                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 text-center">
                                  <p className="text-lg font-black text-white">
                                    {prepKit.technical_questions.length}
                                  </p>
                                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">
                                    Tech Questions
                                  </p>
                                </div>
                                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 text-center">
                                  <p className="text-lg font-black text-white">
                                    {prepKit.hr_behavioral_questions.length}
                                  </p>
                                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">
                                    Behavioral Qs
                                  </p>
                                </div>
                                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 text-center">
                                  <p className="text-lg font-black text-white">
                                    {prepKit.skill_gaps.length}
                                  </p>
                                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">
                                    Skill Gaps
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Readiness Checklist */}
                            <div className="bg-[#0b0b12]/30 border border-white/[0.05] rounded-3xl p-6 space-y-4">
                              <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">
                                  Interview Action Plan Checklist
                                </h3>
                                <p className="text-[11px] text-zinc-600 mt-0.5 font-semibold">
                                  Tackle these steps before jumping into the
                                  rounds.
                                </p>
                              </div>
                              <div className="space-y-2">
                                {[
                                  "Practice 30-Second Elevator Pitch",
                                  "Review Technical Questions & Answer Concepts",
                                  "Memorize Company Vibe / Focus Areas",
                                  "Review Critical Watchouts & Red Flags",
                                  `Create study sheets for skill gaps: ${prepKit.skill_gaps
                                    .map((g) => g.skill)
                                    .slice(0, 2)
                                    .join(", ")}`,
                                ].map((task, i) => {
                                  const completed =
                                    completedReadinessTasks.includes(task);
                                  return (
                                    <button
                                      key={i}
                                      onClick={() => toggleReadinessTask(task)}
                                      className="w-full flex items-center gap-3 bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] hover:border-white/[0.08] rounded-xl p-3 text-left transition-all"
                                    >
                                      <div
                                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                                          completed
                                            ? "bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-500/10"
                                            : "border-white/10 hover:border-white/30"
                                        }`}
                                      >
                                        {completed && (
                                          <Check className="w-3.5 h-3.5 text-white animate-in scale-in duration-200" />
                                        )}
                                      </div>
                                      <span
                                        className={`text-xs font-bold leading-relaxed ${completed ? "text-zinc-500 line-through" : "text-zinc-300"}`}
                                      >
                                        {task}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </TabsContent>

                          {/* ── TAB 2: TECHNICAL QA ──────────────────────────────── */}
                          <TabsContent
                            value="technical"
                            className="space-y-4 outline-none"
                          >
                            <div>
                              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-indigo-400" />{" "}
                                Technical QA Deep-Dive
                              </h3>
                              <p className="text-xs text-zinc-600 font-semibold mt-1">
                                Review critical technical concepts tailored to
                                your profile vs this JD.
                              </p>
                            </div>
                            <div className="space-y-4">
                              {prepKit.technical_questions.map((q, idx) => {
                                const isRevealed =
                                  revealedTechAnswers.includes(idx);
                                return (
                                  <div
                                    key={idx}
                                    className="bg-white/[0.01] border border-white/[0.05] rounded-2xl p-5 space-y-4 hover:border-white/[0.1] transition-all"
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <p className="text-sm font-black text-white leading-relaxed">
                                        {idx + 1}. {q.question}
                                      </p>
                                    </div>
                                    <AnimatePresence initial={false}>
                                      {isRevealed ? (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{
                                            height: "auto",
                                            opacity: 1,
                                          }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="bg-indigo-500/[0.05] border border-indigo-500/10 p-4 rounded-xl flex items-start gap-2">
                                            <Lightbulb className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                            <div>
                                              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-400 leading-none mb-1.5">
                                                Ideal Concept & Key Points
                                              </p>
                                              <p className="text-xs text-zinc-300 font-semibold leading-relaxed">
                                                {q.ideal_answer_concept}
                                              </p>
                                            </div>
                                          </div>
                                        </motion.div>
                                      ) : null}
                                    </AnimatePresence>
                                    <button
                                      onClick={() => {
                                        setRevealedTechAnswers((prev) =>
                                          prev.includes(idx)
                                            ? prev.filter((i) => i !== idx)
                                            : [...prev, idx],
                                        );
                                      }}
                                      className="text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      {isRevealed
                                        ? "Hide Answer Concept"
                                        : "Reveal Answer Concept"}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </TabsContent>

                          {/* ── TAB 3: BEHAVIORAL QA ─────────────────────────────── */}
                          <TabsContent
                            value="behavioral"
                            className="space-y-4 outline-none"
                          >
                            <div>
                              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                <UserCircle2 className="w-4 h-4 text-purple-400" />{" "}
                                Behavioral & Cultural Fit
                              </h3>
                              <p className="text-xs text-zinc-600 font-semibold mt-1">
                                Practice behaviorals mapped to company culture
                                and your background details.
                              </p>
                            </div>
                            <div className="space-y-4">
                              {prepKit.hr_behavioral_questions.map((q, idx) => (
                                <div
                                  key={idx}
                                  className="bg-white/[0.01] border border-white/[0.05] rounded-2xl p-5 space-y-4 hover:border-white/[0.1] transition-all"
                                >
                                  <p className="text-sm font-black text-white leading-relaxed">
                                    {idx + 1}. {q.question}
                                  </p>
                                  <div className="bg-purple-500/[0.04] border border-purple-500/10 p-4 rounded-xl">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-purple-400 leading-none mb-1.5">
                                      Interviewer Intent & Strategy
                                    </p>
                                    <p className="text-xs text-zinc-300 font-semibold leading-relaxed">
                                      {q.intent}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TabsContent>

                          {/* ── TAB 4: SKILL GAPS PLAN ────────────────────────────── */}
                          <TabsContent
                            value="gaps"
                            className="space-y-4 outline-none"
                          >
                            <div>
                              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-emerald-400" />{" "}
                                Profile Gap Revision Guide
                              </h3>
                              <p className="text-xs text-zinc-600 font-semibold mt-1">
                                Bridge identified resume gaps to perfectly match
                                the target JD qualifications.
                              </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {prepKit.skill_gaps.map((gap, idx) => {
                                const isHigh = gap.gap_severity === "High";
                                let severityColor =
                                  "text-amber-400 bg-amber-500/10 border-amber-500/20";
                                if (isHigh) {
                                  severityColor =
                                    "text-red-400 bg-red-500/10 border-red-500/20";
                                }
                                return (
                                  <div
                                    key={idx}
                                    className={`bg-white/[0.01] border rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-white/[0.1] transition-all duration-300 ${
                                      isHigh
                                        ? "border-red-500/10"
                                        : "border-amber-500/10"
                                    }`}
                                  >
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between gap-3">
                                        <h4 className="text-sm font-black text-white truncate">
                                          {gap.skill}
                                        </h4>
                                        <span
                                          className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${severityColor}`}
                                        >
                                          {gap.gap_severity} Gap
                                        </span>
                                      </div>
                                      <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                                        {gap.revision_topic}
                                      </p>
                                    </div>
                                    <div className="pt-3 border-t border-white/[0.04] flex items-center gap-1.5 text-[10px] text-zinc-500">
                                      <span className="font-bold">
                                        Resource:
                                      </span>
                                      <span className="text-indigo-400 font-black truncate">
                                        {gap.practice_source}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </TabsContent>

                          {/* ── TAB 5: ELEVATOR PITCH ────────────────────────────── */}
                          <TabsContent value="pitch" className="outline-none">
                            <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/[0.08] via-indigo-500/[0.04] to-transparent p-6 sm:p-8 space-y-6 shadow-xl">
                              <div className="absolute -right-12 -top-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                              <div className="absolute left-6 bottom-6 w-32 h-32 bg-indigo-500/[0.02] rounded-full blur-2xl pointer-events-none" />

                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <span className="inline-block text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/15 border border-purple-500/25 px-2.5 py-0.5 rounded-full select-none">
                                    Elevator Pitch Hook
                                  </span>
                                  <h3 className="text-lg font-black text-white">
                                    30-Second Icebreaker Hook
                                  </h3>
                                </div>
                                <Button
                                  onClick={() =>
                                    handleCopyPitch(prepKit.elevator_pitch)
                                  }
                                  className="bg-white/5 hover:bg-white/10 border border-white/[0.08] text-zinc-300 font-bold px-3 py-1.5 h-8 rounded-xl shrink-0 gap-1.5 text-xs shadow-sm cursor-pointer"
                                >
                                  {copiedPitch ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                  <span>{copiedPitch ? "Copied" : "Copy"}</span>
                                </Button>
                              </div>

                              <blockquote className="text-sm sm:text-base text-zinc-200 leading-relaxed font-semibold italic border-l-3 border-indigo-500/40 pl-5 my-2">
                                &ldquo;{prepKit.elevator_pitch}&rdquo;
                              </blockquote>

                              {/* Decorative speech wave visualization */}
                              <div className="flex items-center gap-1 pt-3 border-t border-white/[0.04]">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mr-2 select-none">
                                  Tone Indicator:
                                </span>
                                {[
                                  10, 24, 18, 28, 12, 22, 16, 26, 10, 18, 14,
                                  22, 8,
                                ].map((h, i) => (
                                  <div
                                    key={i}
                                    style={{ height: `${h}px` }}
                                    className="w-1 rounded-full bg-gradient-to-t from-indigo-500 to-purple-500 opacity-60 shrink-0"
                                  />
                                ))}
                                <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] ml-2 select-none">
                                  Confident & Tailored
                                </span>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-24 flex flex-col items-center justify-center space-y-6 text-center">
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
          </>
        ) : (
          /* ── CAREER & MARKET RESEARCH VIEW ────────────────────────────────── */
          <div className="pb-10">
            <div
              className={`transition-all duration-500 ${hasResearchResults || isResearchLoading ? "pt-2 pb-6" : "pt-12 pb-8"}`}
            >
              <div
                className={`text-center transition-all duration-500 ${hasResearchResults || isResearchLoading ? "mb-6" : "mb-8"}`}
              >
                {!hasResearchResults && !isResearchLoading && (
                  <>
                    <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      <span className="text-xs font-bold text-indigo-300">
                        AI-powered · Reddit + HN + Web
                      </span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-3">
                      Deep{" "}
                      <span className="text-indigo-400">Company Research.</span>
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium max-w-md mx-auto leading-relaxed">
                      Real interview experiences, salary data, and culture
                      signals — sourced from Reddit, HN, and the web.
                    </p>
                  </>
                )}

                {/* Search bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleResearchSearch();
                  }}
                  className="relative group max-w-2xl mx-auto"
                >
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <Input
                    value={researchQuery}
                    onChange={(e) => setResearchQuery(e.target.value)}
                    placeholder="e.g. 'Google Software Engineer Interview' or 'Stripe culture'"
                    className="w-full h-14 pl-14 pr-36 bg-white/[0.03] border-white/[0.08] focus:border-indigo-500/40 rounded-2xl text-base font-medium placeholder:text-zinc-600 transition-all text-left"
                  />
                  <Button
                    type="submit"
                    disabled={isResearchLoading || !researchQuery.trim()}
                    className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 font-bold text-xs tracking-wider transition-all active:scale-95"
                  >
                    {isResearchLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Analyze"
                    )}
                  </Button>
                </form>

                {/* Quick searches */}
                {!hasResearchResults && !isResearchLoading && (
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                      Try:
                    </span>
                    {QUICK_SEARCHES.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleResearchSearch(q)}
                        className="text-xs text-zinc-500 hover:text-zinc-200 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] rounded-full px-3 py-1 transition-all font-medium"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── LOADING SKELETON ─────────────────────────────────────── */}
            <AnimatePresence mode="wait">
              {isResearchLoading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="h-48 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl animate-pulse" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-28 bg-white/[0.02] border border-white/[0.06] rounded-2xl animate-pulse"
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── RESULTS ──────────────────────────────────────────────── */}
              {!isResearchLoading && researchResults && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8 pb-8 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/[0.05]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                      Results for "{searchedQuery}"
                    </span>
                    <div className="h-px flex-1 bg-white/[0.05]" />
                  </div>

                  {/* ── AI SUMMARY ───────────────────────────────────────── */}
                  {researchSummary && (
                    <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent p-6">
                      <div className="absolute -right-8 -top-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                      <div className="relative space-y-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          </div>
                          <h2 className="text-sm font-black uppercase tracking-widest text-indigo-300">
                            AI Executive Summary
                          </h2>
                        </div>

                        <p className="text-zinc-200 leading-relaxed font-medium text-sm">
                          {researchSummary.key_insight}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-black/20 rounded-xl p-4 space-y-2.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                              Interview Themes
                            </span>
                            <ul className="space-y-1.5">
                              {researchSummary.interview_themes.map(
                                (theme, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-2 text-xs text-zinc-300 font-medium"
                                  >
                                    <span className="text-indigo-500 mt-0.5 shrink-0">
                                      ▸
                                    </span>
                                    {theme}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                          <div className="bg-black/20 rounded-xl p-4 space-y-2.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                              Culture Signals
                            </span>
                            <ul className="space-y-1.5">
                              {researchSummary.culture_signals.map(
                                (signal, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-2 text-xs text-zinc-300 font-medium"
                                  >
                                    <span className="text-indigo-500 mt-0.5 shrink-0">
                                      ▸
                                    </span>
                                    {signal}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2 border-t border-indigo-500/15">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-xs font-medium text-zinc-400">
                              Difficulty:{" "}
                              <span className="text-white font-bold">
                                {researchSummary.difficulty_rating}
                              </span>
                            </span>
                          </div>
                          {researchSummary.salary_range && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-xs font-medium text-zinc-400">
                                Salary:{" "}
                                <span className="text-white font-bold">
                                  {researchSummary.salary_range}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── REDDIT DISCUSSION CARDS ───────────────────────────── */}
                  {researchResults.reddit?.posts?.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                          <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
                        </div>
                        <h2 className="text-sm font-bold text-white">
                          Reddit Discussions
                        </h2>
                        <span className="text-[10px] font-bold text-zinc-600 bg-white/[0.03] border border-white/[0.07] rounded-full px-2 py-0.5">
                          {researchResults.reddit.totalPosts} threads
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {researchResults.reddit.posts
                          .slice(0, 6)
                          .map((post: any, i: number) => (
                            <motion.a
                              key={post.id}
                              href={post.permalink}
                              target="_blank"
                              rel="noopener noreferrer"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04 }}
                              className="group flex flex-col justify-between bg-white/[0.02] border border-white/[0.07] hover:border-orange-500/25 hover:bg-orange-500/[0.02] rounded-2xl p-4 transition-all duration-200"
                            >
                              <div className="space-y-2 mb-3">
                                <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
                                  r/{post.subreddit}
                                </p>
                                <h3 className="text-sm font-semibold text-zinc-200 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                                  {post.title}
                                </h3>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-600">
                                  <span className="flex items-center gap-1">
                                    <ChevronUp className="w-3 h-3 text-emerald-600" />
                                    {post.ups?.toLocaleString()}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Hash className="w-3 h-3" />
                                    {post.num_comments}
                                  </span>
                                </div>
                                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-orange-400 transition-colors" />
                              </div>
                            </motion.a>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* ── WEB RESULTS ──────────────────────────────────────── */}
                  {researchResults.web?.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                          <Globe className="w-3.5 h-3.5 text-sky-400" />
                        </div>
                        <h2 className="text-sm font-bold text-white">
                          Web Intelligence
                        </h2>
                        <span className="text-[10px] font-bold text-zinc-600 bg-white/[0.03] border border-white/[0.07] rounded-full px-2 py-0.5">
                          {researchResults.web.length} sources
                        </span>
                      </div>

                      <div className="space-y-2">
                        {researchResults.web.map((res: any, idx: number) => (
                          <motion.a
                            key={idx}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className="group flex items-start gap-4 bg-white/[0.02] border border-white/[0.07] hover:border-sky-500/25 hover:bg-sky-500/[0.02] rounded-2xl p-4 transition-all duration-200"
                          >
                            <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:border-sky-500/25 transition-colors">
                              <Globe className="w-4 h-4 text-zinc-600 group-hover:text-sky-400 transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0 font-left text-left">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-sky-500/70">
                                  {res.source}
                                </span>
                              </div>
                              <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors leading-tight line-clamp-1 mb-1">
                                {res.title}
                              </h3>
                              <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                                {res.snippet}
                              </p>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-zinc-700 group-hover:text-sky-400 transition-colors shrink-0 mt-0.5" />
                          </motion.a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── NO RESULTS EMPTY STATE ───────────────────────────── */}
                  {!hasResearchResults && (
                    <div className="py-20 text-center space-y-3">
                      <Zap className="w-10 h-10 text-zinc-800 mx-auto animate-pulse" />
                      <p className="text-zinc-600 font-medium text-sm">
                        No results for "{searchedQuery}". Try a more specific
                        query.
                      </p>
                      <button
                        onClick={() => {
                          setResearchResults(null);
                          setResearchQuery("");
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                      >
                        Clear & search again →
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </HiredShell>
  );
}
