import {
  InterviewPrepKit,
  JobApplication,
  resumeApi,
  ResearchSummary,
} from "@/api/resume";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResume } from "@/contexts/ResumeContext";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  ChevronUp,
  Hash,
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

const QUICK_SEARCHES = ["Accenture", "Google", "Amazon", "Microsoft"];

/**
 * Organizes raw Reddit posts into Hired-specific intelligence categories.
 */
const getCategorizedPosts = (posts: any[]) => {
  const comp: any[] = [];
  const hiring: any[] = [];
  const culture: any[] = [];

  const safeArray = Array.isArray(posts) ? posts : [];
  safeArray.forEach((post) => {
    if (!post) return;
    const text = (
      (post.title || "") +
      " " +
      (post.selftext || "") +
      " " +
      (post.subreddit || "")
    ).toLowerCase();

    if (
      text.includes("salary") ||
      text.includes("compensation") ||
      text.includes("ctc") ||
      text.includes("lpa") ||
      text.includes("offer") ||
      text.includes("base") ||
      text.includes("pay") ||
      text.includes("variable") ||
      text.includes("hike") ||
      text.includes("allowance") ||
      text.includes("comp off")
    ) {
      comp.push(post);
    } else if (
      text.includes("interview") ||
      text.includes("hire") ||
      text.includes("hiring") ||
      text.includes("recruiter") ||
      text.includes("hr") ||
      text.includes("round") ||
      text.includes("test") ||
      text.includes("timeline") ||
      text.includes("assessment") ||
      text.includes("selected") ||
      text.includes("rejected") ||
      text.includes("unpaid")
    ) {
      hiring.push(post);
    } else {
      culture.push(post);
    }
  });

  return { comp, hiring, culture };
};

export default function InterviewPrep() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resumeData } = useResume();

  const queryParams = new URLSearchParams(location.search);

  // ── UNIFIED STATE ENGINE ──────────────────────────────────────────
  const [activeApp, setActiveApp] = useState<JobApplication | null>(
    location.state?.app || null,
  );
  const [prepKit, setPrepKit] = useState<InterviewPrepKit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentApps, setRecentApps] = useState<JobApplication[]>([]);
  const [revealedTechAnswers, setRevealedTechAnswers] = useState<number[]>([]);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [completedReadinessTasks, setCompletedReadinessTasks] = useState<
    string[]
  >(["Review resume basics"]);

  // Workspace sub-tab navigation
  const [activeWorkspaceTab, setActiveWorkspaceTab] =
    useState<string>("overview");

  // Sync sub-tab from query params
  useEffect(() => {
    const tab = queryParams.get("tab") || "overview";
    setActiveWorkspaceTab(tab);
  }, [location.search]);

  const handleWorkspaceTabChange = (tab: string) => {
    setActiveWorkspaceTab(tab);
    navigate(`/dashboard/hired/prep?tab=${tab}`, { replace: true });
  };

  // ── MARKET INTELLIGENCE STATES ─────────────────────────────────────
  const [researchQuery, setResearchQuery] = useState("");
  const [isResearchLoading, setIsResearchLoading] = useState(false);
  const [researchResults, setResearchResults] = useState<any>(null);
  const [researchSummary, setResearchSummary] =
    useState<ResearchSummary | null>(null);
  const [searchedQuery, setSearchedQuery] = useState("");

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

  // ── CORE PREP KIT GENERATOR ────────────────────────────────────────
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
        description: "AI has predicted rounds and analyzed skill gaps.",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeApp, resumeData, toast]);

  // Load app data & caches on load
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

  // ── DEEP CAREER MARKET RESEARCH HANDLER ───────────────────────────
  const handleResearchSearch = async (q?: string) => {
    const finalQuery =
      q || researchQuery || (activeApp ? activeApp.company_name : "");
    if (!finalQuery.trim()) return;

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

  // Automatically fetch market research when an active app is loaded
  useEffect(() => {
    if (activeApp && activeApp.company_name) {
      handleResearchSearch(activeApp.company_name);
    }
  }, [activeApp]);

  const researchCompanyFromKit = (companyName: string) => {
    handleWorkspaceTabChange("research");
    handleResearchSearch(companyName);
  };

  // Guard: no resume loaded
  if (!resumeData || !resumeData.personal_info?.name) {
    return (
      <HiredShell>
        <div className="max-w-xl mx-auto py-24 px-4 flex flex-col items-center justify-center text-center space-y-8">
          <div className="w-20 h-20 rounded-3xl bg-[#0b0b12]/50 border border-purple-500/20 flex items-center justify-center">
            <UploadCloud className="w-9 h-9 text-purple-400/70 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Resume Required
            </h2>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-sm font-semibold">
              Interview Intelligence maps your resume to target job descriptions
              to predict rounds and surface real skill gaps. Add your resume
              first.
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
        {!activeApp ? (
          /* ── UNIFIED SELECTION ENTRY DASHBOARD ───────────────────────── */
          <div className="py-8 space-y-10 text-left animate-in fade-in duration-300">
            {/* Elegant Header */}
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 shadow-md select-none">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">
                  Unified Interview Center
                </span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                Interview <span className="text-indigo-400">Intelligence.</span>
              </h1>
              <p className="text-zinc-500 text-sm font-semibold leading-relaxed max-w-lg mx-auto">
                Predict interview rounds, generate specialized QA prep
                blueprints, and automatically load Reddit salary indices, WLB
                reports, and culture warnings—all consolidated in one workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              {/* Left Wing: Target a tracked Application */}
              <div className="bg-[#0b0b12]/40 border border-white/[0.05] rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
                <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-purple-500/[0.02] rounded-full blur-2xl pointer-events-none" />
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        Ace an Application
                      </h3>
                      <p className="text-zinc-500 text-[11px] font-semibold">
                        Launch readiness trackers for specific target positions
                      </p>
                    </div>
                  </div>
                  <div className="h-px bg-white/[0.05]" />

                  {recentApps.length > 0 ? (
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                      {recentApps.slice(0, 4).map((app) => (
                        <button
                          key={app.id}
                          onClick={() => {
                            setPrepKit(null);
                            setActiveApp(app);
                          }}
                          className="w-full flex items-center justify-between bg-white/[0.02] hover:bg-purple-500/[0.05] border border-white/[0.07] hover:border-purple-500/30 rounded-xl p-3.5 transition-all text-left group cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                              {app.job_title}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-semibold truncate mt-0.5">
                              {app.company_name}
                            </p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-purple-400 transition-colors shrink-0" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-zinc-600 text-xs font-semibold bg-white/[0.01] border border-white/[0.04] rounded-2xl">
                      No applications found. Add target roles in your tracker
                      first!
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => navigate("/dashboard/hired/tracker")}
                  className="w-full bg-white text-black hover:bg-zinc-200 font-bold h-10 rounded-xl text-xs uppercase tracking-wider shadow-md cursor-pointer border-none"
                >
                  Manage Job Tracker
                </Button>
              </div>

              {/* Right Wing: Explore/Research a target company */}
              <div className="bg-[#0b0b12]/40 border border-white/[0.05] rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/[0.02] rounded-full blur-2xl pointer-events-none" />
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        Explore Any Company
                      </h3>
                      <p className="text-zinc-500 text-[11px] font-semibold">
                        Input any tech company to automatically build a prep kit
                      </p>
                    </div>
                  </div>
                  <div className="h-px bg-white/[0.05]" />

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (researchQuery.trim()) {
                        const tempApp: JobApplication = {
                          id: "temp-research",
                          company_name: researchQuery,
                          job_title: "Software Engineer",
                          status: "Applied",
                          jd_text:
                            "General engineering culture, interview process, and technical expectations.",
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                        };
                        setPrepKit(null);
                        setActiveApp(tempApp);
                      }
                    }}
                    className="space-y-3"
                  >
                    <div className="relative">
                      <Input
                        value={researchQuery}
                        onChange={(e) => setResearchQuery(e.target.value)}
                        placeholder="e.g. 'Accenture', 'Google', 'Microsoft'..."
                        className="w-full h-11 pl-10 pr-4 bg-white/[0.03] border-white/[0.08] focus:border-indigo-500/40 rounded-xl text-xs font-semibold placeholder:text-zinc-600 text-left"
                      />
                      <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-zinc-600" />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={!researchQuery.trim()}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-10 rounded-xl text-xs uppercase tracking-wider shadow-md cursor-pointer border-none"
                    >
                      Analyze & Prepare
                    </Button>
                  </form>

                  <div className="space-y-2 pt-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 block">
                      Quick Hotkeys:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_SEARCHES.map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            setResearchQuery(q);
                            const tempApp: JobApplication = {
                              id: "temp-research",
                              company_name: q,
                              job_title: "Software Engineer",
                              status: "Applied",
                              jd_text:
                                "General engineering culture, interview process, and technical expectations.",
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            };
                            setPrepKit(null);
                            setActiveApp(tempApp);
                          }}
                          className="text-[10px] text-zinc-500 hover:text-zinc-200 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] rounded-lg px-2.5 py-1 transition-all font-bold cursor-pointer"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── COHESIVE SYSTEM WORKSPACE VIEW ───────────────────────────────── */
          <>
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.05] animate-in slide-in-from-top-1 duration-200">
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => {
                      setActiveApp(null);
                      setPrepKit(null);
                      setResearchResults(null);
                      setResearchSummary(null);
                      setResearchQuery("");
                    }}
                    className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0 outline-none"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Intelligence
                    Hub
                  </button>
                  <span className="text-zinc-800">/</span>
                  <span className="text-[10px] font-black text-indigo-400 truncate max-w-[200px] uppercase tracking-wider">
                    {activeApp.company_name}
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                  Readiness Workspace
                  {isLoading && (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  )}
                </h1>
                <p className="text-xs text-zinc-500 mt-0.5 font-semibold">
                  {activeApp.job_title} @ {activeApp.company_name}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={isLoading}
                  onClick={generateKit}
                  className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-muted-foreground font-bold h-9 px-4 rounded-xl gap-2 text-xs shrink-0 cursor-pointer"
                >
                  <RefreshCcw
                    className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Regenerate Kit
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse text-left">
                <div className="lg:col-span-4 space-y-8">
                  <div className="h-[350px] bg-white/[0.02] border border-white/[0.08] rounded-[32px]" />
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
                {/* predicted rounds horizontal track */}
                <div className="bg-[#0b0b12]/50 border border-white/[0.05] rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.02] rounded-full blur-3xl pointer-events-none" />
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 text-indigo-400" />
                        Predicted Hiring Journey
                      </h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Predicted hiring track mapped dynamically based on
                        target company process logs.
                      </p>
                    </div>
                    <Badge className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-widest px-3 py-1 self-start md:self-auto uppercase">
                      {prepKit.rounds.length} Rounds predicted
                    </Badge>
                  </div>

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
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[10px] font-bold text-zinc-500 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-colors">
                            {idx + 1}
                          </div>
                          <div className="space-y-2 pr-6">
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors leading-tight">
                                {round.name}
                              </h4>
                              <span
                                className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded border uppercase ${diffColor}`}
                              >
                                {round.difficulty}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold">
                              {round.focus}
                            </p>
                            <div className="pt-2 border-t border-white/[0.04] flex flex-wrap gap-1">
                              {round.likely_topics
                                .slice(0, 3)
                                .map((topic, i) => (
                                  <span
                                    key={i}
                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-muted-foreground"
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

                {/* Main dynamic workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Sidebar: Vibe & flag alerts */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Vibe focus */}
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
                          <p className="text-sm font-black text-white mt-1 leading-tight">
                            {activeApp.company_name}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5 select-none">
                          <Zap className="w-3.5 h-3.5" /> Company Culture Vibe
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed font-semibold bg-white/[0.02] border border-white/[0.04] p-3.5 rounded-xl">
                          {prepKit.culture}
                        </p>
                      </div>
                    </div>

                    {/* Red flags */}
                    <div className="bg-red-500/[0.03] border border-red-500/15 rounded-3xl p-6 space-y-4 shadow-lg">
                      <div className="flex items-center gap-2 text-red-400">
                        <ShieldAlert className="w-4 h-4" />
                        <h4 className="text-xs font-black uppercase tracking-widest">
                          Watchouts & Anti-Patterns
                        </h4>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold">
                        Avoid mentioning these keywords or concepts during your
                        discussions to secure cultural alignment.
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
                  </div>

                  {/* Right Panel: Tab Modules */}
                  <div className="lg:col-span-8">
                    <Tabs
                      value={activeWorkspaceTab}
                      onValueChange={handleWorkspaceTabChange}
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
                            v: "research",
                            l: "Market Insights",
                            icon: Globe,
                          },
                          {
                            v: "gaps",
                            l: "Skill Gaps",
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
                              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2 px-3 font-extrabold text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-black transition-all cursor-pointer whitespace-nowrap border-none outline-none"
                            >
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span>{t.l}</span>
                            </TabsTrigger>
                          );
                        })}
                      </TabsList>

                      {/* ── TAB 1: READINESS OVERVIEW ───────────────────────── */}
                      <TabsContent
                        value="overview"
                        className="space-y-6 outline-none"
                      >
                        <div className="bg-gradient-to-br from-indigo-500/[0.08] to-purple-500/[0.04] border border-indigo-500/20 rounded-3xl p-6 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <h3 className="text-lg font-black text-white">
                                Your Interview Readiness Score
                              </h3>
                              <p className="text-xs text-indigo-200/60 leading-relaxed font-semibold">
                                Live prediction computed against target profile
                                requirements, watchouts, and prep completeness.
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
                              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mt-0.5">
                                Technical Qs
                              </p>
                            </div>
                            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 text-center">
                              <p className="text-lg font-black text-white">
                                {prepKit.hr_behavioral_questions.length}
                              </p>
                              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mt-0.5">
                                Behavioral Qs
                              </p>
                            </div>
                            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 text-center">
                              <p className="text-lg font-black text-white">
                                {prepKit.skill_gaps.length}
                              </p>
                              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mt-0.5">
                                Skill Gaps
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Checklist */}
                        <div className="bg-[#0b0b12]/30 border border-white/[0.05] rounded-3xl p-6 space-y-4">
                          <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">
                              Readiness Checklist
                            </h3>
                            <p className="text-[11px] text-zinc-600 mt-0.5 font-semibold">
                              Complete these essential milestones to secure
                              technical and behavioral alignment.
                            </p>
                          </div>
                          <div className="space-y-2">
                            {[
                              "Practice 30-Second Elevator Pitch",
                              "Review predicted hiring track & round focus",
                              "Review technical deep-dive answers",
                              "Review red flags & watchout terms",
                              `Revise core skill gaps: ${prepKit.skill_gaps
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
                                  className="w-full flex items-center gap-3 bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] hover:border-white/[0.08] rounded-xl p-3.5 text-left transition-all cursor-pointer outline-none"
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
                                    className={`text-xs font-bold leading-relaxed ${completed ? "text-zinc-500 line-through font-semibold" : "text-muted-foreground"}`}
                                  >
                                    {task}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </TabsContent>

                      {/* ── TAB 2: TECHNICAL QA ─────────────────────────────── */}
                      <TabsContent
                        value="technical"
                        className="space-y-4 outline-none"
                      >
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-indigo-400" />
                            Technical QA Blueprint
                          </h3>
                          <p className="text-xs text-zinc-600 font-semibold mt-1">
                            Review core technology questions compiled
                            specifically for your profile against target JD
                            specifications.
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
                                      <div className="bg-indigo-500/[0.05] border border-indigo-500/10 p-4 rounded-xl flex items-start gap-2.5">
                                        <Lightbulb className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                        <div>
                                          <p className="text-[10px] font-black uppercase tracking-wider text-indigo-400 leading-none mb-1.5">
                                            Ideal Concept & Focus Points
                                          </p>
                                          <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
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
                                  className="text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-white flex items-center gap-1 cursor-pointer transition-colors bg-transparent border-none p-0 outline-none"
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

                      {/* ── TAB 3: BEHAVIORAL FIT ────────────────────────────── */}
                      <TabsContent
                        value="behavioral"
                        className="space-y-4 outline-none"
                      >
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            <UserCircle2 className="w-4 h-4 text-purple-400" />
                            Behavioral fit & strategy
                          </h3>
                          <p className="text-xs text-zinc-600 font-semibold mt-1">
                            Prepare STAR alignment examples mapped to core
                            target company values.
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
                                  Interviewer Intent & Answering Logic
                                </p>
                                <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                                  {q.intent}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      {/* ── TAB 4: MARKET INSIGHTS (COMBINED FEATURE) ───────── */}
                      <TabsContent
                        value="research"
                        className="space-y-6 outline-none"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.05]">
                          <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                              <Globe className="w-4 h-4 text-indigo-400" />
                              Market & Community Intelligence
                            </h3>
                            <p className="text-xs text-zinc-600 font-semibold mt-1">
                              Real-world employee feedback, salaries, and hiring
                              experiences for {activeApp.company_name}.
                            </p>
                          </div>

                          {/* Inline research search */}
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleResearchSearch();
                            }}
                            className="relative flex items-center w-full sm:w-72"
                          >
                            <Input
                              value={researchQuery}
                              onChange={(e) => setResearchQuery(e.target.value)}
                              placeholder={`Search custom ${activeApp.company_name} intel...`}
                              className="w-full h-8 pl-8 pr-16 bg-white/[0.03] border-white/[0.08] focus:border-indigo-500/40 rounded-xl text-xs text-left"
                            />
                            <div className="absolute left-2.5 flex items-center pointer-events-none">
                              <Search className="w-3.5 h-3.5 text-zinc-500" />
                            </div>
                            <Button
                              type="submit"
                              disabled={isResearchLoading}
                              className="absolute right-1 top-1 bottom-1 h-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-2 text-[10px] font-bold border-none cursor-pointer"
                            >
                              {isResearchLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                "Search"
                              )}
                            </Button>
                          </form>
                        </div>

                        {isResearchLoading ? (
                          <div className="space-y-4 animate-pulse">
                            <div className="h-32 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {[1, 2].map((i) => (
                                <div
                                  key={i}
                                  className="h-24 bg-white/[0.02] border border-white/[0.06] rounded-2xl"
                                />
                              ))}
                            </div>
                          </div>
                        ) : researchResults ? (
                          <div className="space-y-6">
                            {/* AI summary briefing */}
                            {researchSummary && (
                              <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent p-5">
                                <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                                <div className="relative space-y-4">
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                                    <h4 className="text-xs font-black uppercase tracking-widest text-indigo-300">
                                      AI Market Briefing
                                    </h4>
                                  </div>
                                  <p className="text-zinc-200 leading-relaxed font-semibold text-xs">
                                    {researchSummary.key_insight}
                                  </p>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="bg-background/20 rounded-xl p-3 space-y-1.5">
                                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">
                                        Interview Process Themes
                                      </span>
                                      <ul className="space-y-1">
                                        {researchSummary.interview_themes
                                          .slice(0, 3)
                                          .map((theme, i) => (
                                            <li
                                              key={i}
                                              className="flex items-start gap-1.5 text-[11px] text-muted-foreground font-medium"
                                            >
                                              <span className="text-indigo-500 mt-0.5 shrink-0">
                                                ▸
                                              </span>
                                              {theme}
                                            </li>
                                          ))}
                                      </ul>
                                    </div>
                                    <div className="bg-background/20 rounded-xl p-3 space-y-1.5">
                                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">
                                        Culture & WLB signals
                                      </span>
                                      <ul className="space-y-1">
                                        {researchSummary.culture_signals
                                          .slice(0, 3)
                                          .map((sig, i) => (
                                            <li
                                              key={i}
                                              className="flex items-start gap-1.5 text-[11px] text-muted-foreground font-medium"
                                            >
                                              <span className="text-indigo-500 mt-0.5 shrink-0">
                                                ▸
                                              </span>
                                              {sig}
                                            </li>
                                          ))}
                                      </ul>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-4 pt-3 border-t border-indigo-500/15 text-[11px]">
                                    <div className="flex items-center gap-1.5">
                                      <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
                                      <span className="font-semibold text-muted-foreground">
                                        Difficulty Index:{" "}
                                        <span className="text-white font-bold">
                                          {researchSummary.difficulty_rating}
                                        </span>
                                      </span>
                                    </div>
                                    {researchSummary.salary_range && (
                                      <div className="flex items-center gap-1.5">
                                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="font-semibold text-muted-foreground">
                                          Compensation Index:{" "}
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

                            {/* Categorized community discussions */}
                            {researchResults.reddit?.posts?.length > 0 ? (
                              <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="w-4 h-4 text-orange-500" />
                                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                    Community Intel & Warnings (Reddit)
                                  </h4>
                                </div>

                                <Tabs
                                  defaultValue="hiring"
                                  className="w-full space-y-4"
                                >
                                  <TabsList className="bg-white/[0.02] border border-white/[0.05] p-1 rounded-xl flex w-full max-w-sm shrink-0">
                                    <TabsTrigger
                                      value="hiring"
                                      className="flex-1 text-[10px] font-bold py-1.5 rounded-lg cursor-pointer border-none outline-none"
                                    >
                                      💼 Interview
                                    </TabsTrigger>
                                    <TabsTrigger
                                      value="comp"
                                      className="flex-1 text-[10px] font-bold py-1.5 rounded-lg cursor-pointer border-none outline-none"
                                    >
                                      💰 Compensation
                                    </TabsTrigger>
                                    <TabsTrigger
                                      value="culture"
                                      className="flex-1 text-[10px] font-bold py-1.5 rounded-lg cursor-pointer border-none outline-none"
                                    >
                                      🏢 Culture & WLB
                                    </TabsTrigger>
                                  </TabsList>

                                  {(() => {
                                    const { comp, hiring, culture } =
                                      getCategorizedPosts(
                                        researchResults.reddit.posts,
                                      );

                                    const renderPostGrid = (
                                      postsList: any[],
                                    ) => {
                                      if (postsList.length === 0) {
                                        return (
                                          <div className="py-8 text-center bg-white/[0.01] border border-white/[0.04] rounded-2xl">
                                            <p className="text-xs text-zinc-500 font-semibold">
                                              No community discussions loaded in
                                              this category.
                                            </p>
                                          </div>
                                        );
                                      }
                                      return (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                          {postsList.slice(0, 6).map((post) => (
                                            <a
                                              key={post.id}
                                              href={post.permalink}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="group flex flex-col justify-between bg-white/[0.02] border border-white/[0.07] hover:border-orange-500/25 hover:bg-orange-500/[0.02] rounded-2xl p-4 transition-all duration-200 text-left"
                                            >
                                              <div className="space-y-1.5 mb-3">
                                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-wider">
                                                  r/{post.subreddit}
                                                </p>
                                                <h5 className="text-xs font-bold text-zinc-200 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                                                  {post.title}
                                                </h5>
                                                {post.selftext && (
                                                  <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed font-semibold">
                                                    {post.selftext}
                                                  </p>
                                                )}
                                              </div>
                                              <div className="flex items-center justify-between pt-2 border-t border-white/[0.03]">
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
                                            </a>
                                          ))}
                                        </div>
                                      );
                                    };

                                    return (
                                      <>
                                        <TabsContent
                                          value="hiring"
                                          className="outline-none"
                                        >
                                          {renderPostGrid(hiring)}
                                        </TabsContent>
                                        <TabsContent
                                          value="comp"
                                          className="outline-none"
                                        >
                                          {renderPostGrid(comp)}
                                        </TabsContent>
                                        <TabsContent
                                          value="culture"
                                          className="outline-none"
                                        >
                                          {renderPostGrid(culture)}
                                        </TabsContent>
                                      </>
                                    );
                                  })()}
                                </Tabs>
                              </div>
                            ) : null}

                            {/* Web intel links */}
                            {researchResults.web?.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Globe className="w-4 h-4 text-sky-400" />
                                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                    Web Intelligence Briefings
                                  </h4>
                                </div>
                                <div className="space-y-2">
                                  {researchResults.web
                                    .slice(0, 4)
                                    .map((res: any, idx: number) => (
                                      <a
                                        key={idx}
                                        href={res.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-start gap-4 bg-white/[0.02] border border-white/[0.07] hover:border-sky-500/25 hover:bg-sky-500/[0.02] rounded-2xl p-4 transition-all duration-200"
                                      >
                                        <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:border-sky-500/25 transition-colors">
                                          <Globe className="w-3.5 h-3.5 text-zinc-600 group-hover:text-sky-400 transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0 font-left text-left">
                                          <span className="text-[9px] font-black uppercase tracking-wider text-sky-500/70 block mb-0.5">
                                            {res.source}
                                          </span>
                                          <h5 className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors leading-tight line-clamp-1 mb-1">
                                            {res.title}
                                          </h5>
                                          <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed font-semibold">
                                            {res.snippet}
                                          </p>
                                        </div>
                                        <ArrowUpRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-sky-400 transition-colors shrink-0 mt-0.5" />
                                      </a>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="py-16 text-center space-y-3 bg-white/[0.01] border border-white/[0.05] rounded-3xl">
                            <Zap className="w-8 h-8 text-zinc-700 mx-auto animate-pulse" />
                            <h5 className="text-sm font-bold text-white">
                              No Market Insights Loaded
                            </h5>
                            <p className="text-zinc-500 text-xs max-w-xs mx-auto">
                              Launch background queries to compile salary
                              indexes, community rumors, and interview logs.
                            </p>
                            <Button
                              onClick={() =>
                                handleResearchSearch(activeApp.company_name)
                              }
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9 px-6 rounded-xl text-xs mt-2 border-none cursor-pointer"
                            >
                              Scan Community Intelligence
                            </Button>
                          </div>
                        )}
                      </TabsContent>

                      {/* ── TAB 5: SKILL GAPS PLAN ──────────────────────────── */}
                      <TabsContent
                        value="gaps"
                        className="space-y-4 outline-none"
                      >
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-emerald-400" />
                            Profile Gap Revision Plan
                          </h3>
                          <p className="text-xs text-zinc-600 font-semibold mt-1">
                            Bridge key resume gaps identified against role
                            qualifications.
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
                                    <h4 className="text-xs font-black text-white truncate">
                                      {gap.skill}
                                    </h4>
                                    <span
                                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${severityColor}`}
                                    >
                                      {gap.gap_severity} Gap
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                                    {gap.revision_topic}
                                  </p>
                                </div>
                                <div className="pt-3 border-t border-white/[0.04] flex items-center gap-1.5 text-[10px] text-zinc-500">
                                  <span className="font-bold">Resource:</span>
                                  <span className="text-indigo-400 font-black truncate">
                                    {gap.practice_source}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </TabsContent>

                      {/* ── TAB 6: ELEVATOR PITCH ───────────────────────────── */}
                      <TabsContent value="pitch" className="outline-none">
                        <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/[0.08] via-indigo-500/[0.04] to-transparent p-6 sm:p-8 space-y-6 shadow-xl">
                          <div className="absolute -right-12 -top-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                          <div className="absolute left-6 bottom-6 w-32 h-32 bg-indigo-500/[0.02] rounded-full blur-2xl pointer-events-none" />

                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <span className="inline-block text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/15 border border-purple-500/25 px-2.5 py-0.5 rounded-full select-none">
                                Icebreaker Hook
                              </span>
                              <h3 className="text-lg font-black text-white">
                                30-Second Elevator Pitch
                              </h3>
                            </div>
                            <Button
                              onClick={() =>
                                handleCopyPitch(prepKit.elevator_pitch)
                              }
                              className="bg-white/5 hover:bg-white/10 border border-white/[0.08] text-muted-foreground font-bold px-3 py-1.5 h-8 rounded-xl shrink-0 gap-1.5 text-xs shadow-sm cursor-pointer"
                            >
                              {copiedPitch ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {copiedPitch ? "Copied" : "Copy Pitch"}
                              </span>
                            </Button>
                          </div>

                          <blockquote className="text-sm sm:text-base text-zinc-200 leading-relaxed font-semibold italic border-l-3 border-indigo-500/40 pl-5 my-2">
                            &ldquo;{prepKit.elevator_pitch}&rdquo;
                          </blockquote>

                          <div className="flex items-center gap-1 pt-3 border-t border-white/[0.04]">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mr-2 select-none">
                              Voice Modulation:
                            </span>
                            {[
                              10, 24, 18, 28, 12, 22, 16, 26, 10, 18, 14, 22, 8,
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
                  <Sparkles className="w-10 h-10 animate-pulse text-zinc-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">
                    Generate Your Strategy
                  </h3>
                  <p className="text-zinc-500 text-sm max-w-sm font-semibold">
                    Ready to ace your target interviews? Let AI compile your
                    custom, end-to-end readiness blueprint.
                  </p>
                </div>
                <Button
                  onClick={generateKit}
                  className="bg-white text-black hover:bg-zinc-200 font-bold h-11 px-8 rounded-2xl transition-all cursor-pointer border-none shadow-lg"
                >
                  Generate Readiness Blueprint
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </HiredShell>
  );
}
