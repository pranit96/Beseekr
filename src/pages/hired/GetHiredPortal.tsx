import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useResume, EMPTY_RESUME, RESUME_TEMPLATES } from "../../contexts/ResumeContext";
import { resumeApi, type ATSAnalysis, type InterviewPrepKit, type ResearchSummary, type JobApplication } from "../../api/resume";
import { useToast } from "../../hooks/use-toast";
import {
  FileText,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  Target,
  Trophy,
  Search,
  AlertTriangle,
  CheckCircle2,
  Upload,
  Globe,
  DollarSign,
  Copy,
  Download,
  Check,
  Briefcase,
  Zap,
  ShieldAlert,
  Loader2,
  FileCheck,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  Flame,
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import HiredShell from "./HiredShell";

export default function GetHiredPortal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resumeData, setResumeData, saveActiveDraft } = useResume();
  const hasResume = Boolean(resumeData?.personal_info?.name);

  // Unified Target Job Form State
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");

  // Automated connection settings (Minimalist flow enhancers)
  const [autoTrack, setAutoTrack] = useState(true);
  const [autoResearch, setAutoResearch] = useState(true);

  // Status & Loading states
  const [isParsing, setIsParsing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"ats" | "cover" | "prep" | "research">("ats");

  // Output workspace storage
  const [atsResult, setAtsResult] = useState<ATSAnalysis | null>(null);
  const [coverLetterResult, setCoverLetterResult] = useState<string | null>(null);
  const [interviewPrepResult, setInterviewPrepResult] = useState<InterviewPrepKit | null>(null);
  const [researchResult, setResearchResult] = useState<ResearchSummary | null>(null);
  const [trackedApp, setTrackedApp] = useState<JobApplication | null>(null);

  const [copiedLetter, setCopiedLetter] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);

  // 1. Frictionless Resume Uploader handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const parsed = await resumeApi.uploadAndParseResume(file);
      if (parsed?.personal_info?.name) {
        setResumeData(parsed);
        await saveActiveDraft(parsed);
        toast({
          title: "Resume Loaded Successfully",
          description: `Extracted profile for ${parsed.personal_info.name}.`,
        });
      } else {
        throw new Error("Unable to parse profile highlights.");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Parsing Failed",
        description: err.message || "Please upload a valid PDF or DOCX resume.",
      });
    } finally {
      setIsParsing(false);
    }
  };

  // Sandbox Preset Loader
  const handleLoadPreset = async (presetData: any) => {
    try {
      setResumeData(presetData);
      await saveActiveDraft(presetData);
      toast({
        title: "Sandbox Preset Loaded",
        description: `Successfully loaded sandbox profile for ${presetData.personal_info.name}.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Preset Load Failed",
        description: "Unable to load sandbox preset profile. Please try again.",
      });
    }
  };

  // Reset Resume action
  const handleResetResume = async () => {
    setResumeData(EMPTY_RESUME);
    await saveActiveDraft(EMPTY_RESUME);
    toast({
      title: "Workspace Reset",
      description: "Resume profile cleared.",
    });
  };

  // 2. Unified Career CoPilot Launcher (One-Click flow)
  const handleLaunchCopilot = async () => {
    if (!hasResume) {
      toast({
        variant: "destructive",
        title: "Resume Profile Required",
        description: "Please upload or set up your resume above first.",
      });
      return;
    }
    if (!companyName.trim() || !jobTitle.trim() || !jobDescription.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please supply a Company, Role Title, and Job Description.",
      });
      return;
    }

    setIsAnalyzing(true);
    setAtsResult(null);
    setCoverLetterResult(null);
    setInterviewPrepResult(null);
    setResearchResult(null);
    setTrackedApp(null);

    try {
      // Run core generations concurrently (High speed!)
      const [atsRes, coverRes, prepRes] = await Promise.allSettled([
        resumeApi.scoreResume(resumeData, jobDescription),
        resumeApi.generateCoverLetter({
          resume: resumeData,
          job_description: jobDescription,
          company_name: companyName,
          job_title: jobTitle,
          tone: "professional",
        }),
        resumeApi.generateInterviewPrep({
          resume: resumeData,
          job_description: jobDescription,
          company_name: companyName,
          job_title: jobTitle,
        }),
      ]);

      if (atsRes.status === "fulfilled") setAtsResult(atsRes.value);
      if (coverRes.status === "fulfilled") setCoverLetterResult(coverRes.value);
      
      let tempAppId = `temp-${Date.now()}`;
      if (prepRes.status === "fulfilled" && prepRes.value) {
        setInterviewPrepResult(prepRes.value);
        // Seed InterviewPrep session storage for a seamless deep transition
        try {
          sessionStorage.setItem(`prepKit:${tempAppId}`, JSON.stringify(prepRes.value));
        } catch (_) {}
      }

      // Logical Connection 1: Auto Sync to Kanban Tracker Board
      if (autoTrack) {
        try {
          const appObj = await resumeApi.createApplication({
            company_name: companyName,
            job_title: jobTitle,
            status: "Bookmarked",
            jd_text: jobDescription,
            job_url: jobUrl || undefined,
          });
          setTrackedApp(appObj);
          
          // Reseed the interview prep session storage with real application ID
          if (prepRes.status === "fulfilled" && prepRes.value) {
            try {
              sessionStorage.setItem(`prepKit:${appObj.id}`, JSON.stringify(prepRes.value));
            } catch (_) {}
          }
        } catch (trackerErr) {
          console.error("Auto tracker sync failed:", trackerErr);
        }
      }

      // Logical Connection 2: Deep Community Compensation & Culture research
      if (autoResearch) {
        try {
          const crawlRes = await resumeApi.performCareerResearch(companyName);
          if (crawlRes?.data) {
            const summarized = await resumeApi.summarizeResearch({
              reddit: crawlRes.data.reddit,
              web: crawlRes.data.web,
            });
            setResearchResult(summarized);
          }
        } catch (researchErr) {
          console.error("Salary crawl failed:", researchErr);
        }
      }

      toast({
        title: "AI CoPilot Success",
        description: "ATS compatibility, Cover letter, and Prep kit compiled.",
      });
      
      // Auto-focus the results area
      setTimeout(() => {
        document.getElementById("copilot-workspace")?.scrollIntoView({ behavior: "smooth" });
      }, 300);

    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "CoPilot processing failed",
        description: err.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyLetter = () => {
    if (!coverLetterResult) return;
    navigator.clipboard.writeText(coverLetterResult);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2000);
    toast({
      title: "Copied",
      description: "Cover letter copied to clipboard.",
    });
  };

  const handleDownloadLetter = () => {
    if (!coverLetterResult) return;
    const blob = new Blob([coverLetterResult], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${companyName || "tailored"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyPitch = () => {
    if (!interviewPrepResult?.elevator_pitch) return;
    navigator.clipboard.writeText(interviewPrepResult.elevator_pitch);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
    toast({
      title: "Pitch Copied",
      description: "30-second elevator pitch copied.",
    });
  };

  return (
    <HiredShell>
      <div className="max-w-6xl mx-auto space-y-8 py-8 px-4 sm:px-6 lg:px-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-white/[0.05] text-left">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-indigo-500 animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase">
                Get Hired · Command Center
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              Career <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">CoPilot.</span>
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              A unified target job dashboard. Input a company and role to customize your profile, generate letters, predict interviews, and sync boards.
            </p>
          </div>
        </div>

        {/* 1. RESUME PROFILE INDICATOR CARD / GLASSMORPHIC DROPZONE */}
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.07] rounded-3xl p-6 shadow-sm backdrop-blur-xl relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/[0.02] rounded-full blur-3xl pointer-events-none" />
          
          {hasResume ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <FileCheck className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-zinc-900 dark:text-white">
                      {resumeData.personal_info.name || "My Loaded Resume"}
                    </h3>
                    <Badge className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                      AI Integration Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-2 flex-wrap">
                    <span>{resumeData.personal_info.email}</span>
                    {resumeData.personal_info.phone && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                        <span>{resumeData.personal_info.phone}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("resume")}
                  className="text-xs font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl px-4 py-2 cursor-pointer font-bold"
                >
                  Manage Resume
                </button>
                <button
                  onClick={handleResetResume}
                  className="text-xs font-black uppercase tracking-wider text-red-600 hover:text-red-500 dark:text-red-400/80 dark:hover:text-red-300 transition-colors bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl px-4 py-2 cursor-pointer font-bold"
                >
                  Unload
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 animate-pulse">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="font-bold text-zinc-900 dark:text-white">
                  Add your Resume to unlock AI CoPilot
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Drag & drop your resume file (.pdf, .docx) to seed your career records. We will immediately extract experience highlights to support instant matching.
                </p>
              </div>
              <label className="relative cursor-pointer bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-md shadow-amber-500/10 transition-all flex items-center gap-2 cursor-pointer select-none">
                {isParsing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Parsing Resume...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" /> Load Resume File
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  disabled={isParsing}
                  className="hidden"
                />
              </label>

              {/* Presets Onboarding Sandbox */}
              <div className="w-full border-t border-zinc-200 dark:border-white/[0.05] mt-4 pt-4 max-w-lg">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">
                  Or load a pre-configured Sandbox profile to test immediately:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {RESUME_TEMPLATES.filter(t => t.id !== "blank_master").map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleLoadPreset(template.data)}
                      className="text-[11px] font-bold px-4 py-2 border border-zinc-200 dark:border-white/[0.08] hover:border-indigo-500/30 hover:bg-indigo-500/5 bg-transparent rounded-xl text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer font-semibold"
                    >
                      {template.name.replace("Modern ", "").replace("Classic ", "")} ({template.data.personal_info.name})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. UNIFIED CO-PILOT TARGET WORKSPACE */}
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.07] rounded-3xl p-6 sm:p-8 shadow-sm backdrop-blur-xl space-y-6 relative overflow-hidden text-left">
          <div className="absolute top-0 left-0 w-80 h-80 bg-purple-500/[0.01] rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-1.5 border-b border-zinc-100 dark:border-white/[0.05] pb-4">
            <h2 className="text-md font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Target Position Copilot
            </h2>
            <p className="text-xs text-muted-foreground">
              Map where you are applying to automatically align profiles, predict timelines, and build cover letters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Company Name <span className="text-purple-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Stripe, Google, Apple"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full h-11 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] focus:border-purple-500/50 rounded-xl px-4 text-sm text-zinc-900 dark:text-zinc-100 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Role Title <span className="text-purple-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Software Engineer II"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full h-11 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] focus:border-purple-500/50 rounded-xl px-4 text-sm text-zinc-900 dark:text-zinc-100 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Job Posting URL <span className="text-zinc-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. https://stripe.com/jobs/..."
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                className="w-full h-11 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] focus:border-purple-500/50 rounded-xl px-4 text-sm text-zinc-900 dark:text-zinc-100 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Job Description <span className="text-purple-500">*</span>
            </label>
            <textarea
              placeholder="Paste the full job description details here to analyze compatibility, keywords, and tailor assets..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={5}
              className="w-full bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] focus:border-purple-500/50 rounded-xl p-4 text-sm text-zinc-900 dark:text-zinc-100 outline-none resize-none leading-relaxed font-medium"
            />
          </div>

          {/* DYNAMIC CONNECTIONS CONFIG */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06]">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoTrack"
                  checked={autoTrack}
                  onChange={(e) => setAutoTrack(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 cursor-pointer"
                />
                <label htmlFor="autoTrack" className="text-xs font-bold text-zinc-900 dark:text-zinc-200 cursor-pointer flex items-center gap-1.5">
                  <LayoutDashboard className="w-3.5 h-3.5 text-zinc-400" />
                  Auto-Sync details into Job Tracker Kanban board
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoResearch"
                  checked={autoResearch}
                  onChange={(e) => setAutoResearch(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 cursor-pointer"
                />
                <label htmlFor="autoResearch" className="text-xs font-bold text-zinc-900 dark:text-zinc-200 cursor-pointer flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-zinc-400" />
                  Initiate Reddit Compensation & Culture research crawl
                </label>
              </div>
            </div>

            <button
              onClick={handleLaunchCopilot}
              disabled={isAnalyzing || !hasResume || !companyName.trim() || !jobTitle.trim() || !jobDescription.trim()}
              className="w-full md:w-auto h-11 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold px-8 rounded-xl shadow-lg shadow-purple-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none shrink-0"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> CoPilot Tailoring...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 animate-bounce" /> Launch AI CoPilot
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3. COPILOT WORKSPACE RESULTS DOCK */}
        <div id="copilot-workspace">
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/[0.07] rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-5 min-h-[350px]"
              >
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <div className="space-y-2">
                  <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white">
                    CoPilot Synthesizing Application Pack...
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Calculating ATS match index, custom drafting your cover letter, predicting interview phases, and compiling salary review datasets.
                  </p>
                </div>
              </motion.div>
            ) : atsResult || coverLetterResult || interviewPrepResult || researchResult ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 text-left"
              >
                {/* Visual Status Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-indigo-500/[0.04] border border-indigo-500/10">
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                      Synthesized Assets Ready
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tailored specifically for <span className="font-bold text-zinc-800 dark:text-zinc-200">{jobTitle} @ {companyName}</span>.
                    </p>
                  </div>
                  {trackedApp && (
                    <Badge className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider px-3 py-1 flex items-center gap-1.5 self-start sm:self-auto">
                      <LayoutDashboard className="w-3.5 h-3.5" /> Checked into Tracker
                    </Badge>
                  )}
                </div>

                {/* Workspace Tabs Navigation */}
                <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/[0.06] p-1.5 rounded-2xl w-full flex overflow-x-auto gap-1">
                  {[
                    { id: "ats", label: "ATS Analysis", icon: FileCheck },
                    { id: "cover", label: "Cover Letter", icon: FileText },
                    { id: "prep", label: "Interview Journey", icon: Target },
                    { id: "research", label: "Community Research", icon: Globe },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border-none outline-none ${
                          activeTab === tab.id
                            ? "bg-white dark:bg-white/10 text-zinc-950 dark:text-white shadow-sm font-extrabold"
                            : "text-muted-foreground hover:text-zinc-900 dark:hover:text-zinc-200"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* TAB CONTENT: ATS ANALYSIS */}
                {activeTab === "ats" && atsResult && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
                    
                    {/* Left: Score Gauge */}
                    <div className="lg:col-span-4 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.07] rounded-3xl p-6 text-center space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        Match Compatibility
                      </h4>
                      <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" className="text-zinc-100 dark:text-white/5" fill="transparent" />
                          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" className="text-indigo-500" strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - atsResult.score / 100)}`} fill="transparent" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">{atsResult.score}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">/ 100 Score</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                        {atsResult.general_feedback}
                      </p>
                    </div>

                    {/* Right: Insights Grid */}
                    <div className="lg:col-span-8 space-y-6">
                      {/* Aspects */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { title: "Skills Alignment", data: atsResult.aspects.skills_match, color: "sky" },
                          { title: "Formatting & Style", data: atsResult.aspects.formatting, color: "emerald" },
                          { title: "Workplace Impact", data: atsResult.aspects.impact, color: "purple" },
                          { title: "Language Tone", data: atsResult.aspects.language_tone, color: "amber" },
                        ].map((asp) => (
                          <div key={asp.title} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.07] p-5 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                                {asp.title}
                              </h5>
                              <span className="text-xs font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">
                                {asp.data.rating}/10
                              </span>
                            </div>
                            <p className="text-xs text-zinc-700 dark:text-muted-foreground font-semibold leading-relaxed">
                              {asp.data.why}
                            </p>
                            <div className="pt-2 border-t border-zinc-100 dark:border-white/[0.04] text-[10px] text-zinc-500 leading-relaxed font-medium">
                              <span className="font-black text-indigo-500 dark:text-indigo-400 block uppercase mb-0.5">Improvement Tip:</span>
                              {asp.data.how_to_improve}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Missing Keywords */}
                      {atsResult.missing_keywords?.length > 0 && (
                        <div className="bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl p-5 space-y-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" /> Highly Recommended Keywords to Add
                          </span>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {atsResult.missing_keywords.map((kw) => (
                              <Badge key={kw} className="bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2.5 py-0.5 rounded-lg uppercase">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bullet Suggs */}
                      {atsResult.bullet_point_suggestions?.length > 0 && (
                        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.07] rounded-3xl p-6 space-y-4">
                          <h5 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-purple-500" /> Bullet Point Highlights Optimization
                          </h5>
                          <div className="space-y-4">
                            {atsResult.bullet_point_suggestions.map((sug, i) => (
                              <div key={i} className="space-y-2 p-4 rounded-xl bg-zinc-50 dark:bg-white/[0.01] border border-zinc-200 dark:border-white/[0.04]">
                                <div className="text-xs text-red-600 dark:text-red-400 line-through leading-relaxed">
                                  {sug.original}
                                </div>
                                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold leading-relaxed flex items-start gap-1">
                                  <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                  <span>{sug.improved}</span>
                                </div>
                                <p className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-200 dark:border-white/[0.04] font-medium leading-relaxed">
                                  <span className="font-black text-indigo-500 uppercase">Reason:</span> {sug.reason}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: TAILORED COVER LETTER */}
                {activeTab === "cover" && coverLetterResult && (
                  <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.07] rounded-3xl overflow-hidden shadow-sm animate-in fade-in duration-200">
                    <div className="p-6 sm:p-8 max-h-[500px] overflow-y-auto custom-scrollbar border-b border-zinc-100 dark:border-white/[0.04]">
                      <p className="text-sm text-zinc-800 dark:text-zinc-300 leading-8 whitespace-pre-wrap font-[450] text-left">
                        {coverLetterResult}
                      </p>
                    </div>
                    <div className="px-6 py-4 bg-zinc-50 dark:bg-white/[0.01] flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Tailored Executive Format</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyLetter}
                          className="h-9 px-4 text-xs font-bold text-muted-foreground hover:text-zinc-950 dark:hover:text-white bg-transparent border border-zinc-200 dark:border-white/[0.08] rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedLetter ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedLetter ? "Copied" : "Copy"}</span>
                        </button>
                        <button
                          onClick={handleDownloadLetter}
                          className="h-9 px-4 text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 rounded-xl flex items-center gap-1.5 cursor-pointer border-none"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download .txt</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: PREDICTED INTERVIEW ROUNDS */}
                {activeTab === "prep" && interviewPrepResult && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Elevator Pitch Box */}
                    <div className="bg-gradient-to-br from-indigo-500/[0.03] to-purple-500/[0.03] border border-indigo-500/10 rounded-3xl p-6 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-zinc-200 dark:border-white/[0.04] pb-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-500 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4" /> 30-Second Elevator Pitch
                        </span>
                        <button
                          onClick={handleCopyPitch}
                          className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 outline-none"
                        >
                          {copiedPitch ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Copy Pitch</span>
                        </button>
                      </div>
                      <p className="text-sm text-zinc-800 dark:text-zinc-300 leading-relaxed italic font-medium">
                        "{interviewPrepResult.elevator_pitch}"
                      </p>
                    </div>

                    {/* Rounds Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {interviewPrepResult.rounds.map((round, idx) => {
                        let diffStyle = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
                        if (round.difficulty === "Medium") diffStyle = "text-amber-500 bg-amber-500/10 border-amber-500/20";
                        if (round.difficulty === "Hard") diffStyle = "text-rose-500 bg-rose-500/10 border-rose-500/20";

                        return (
                          <div key={idx} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.07] rounded-2xl p-5 relative group transition-all duration-300 hover:border-indigo-500/30">
                            <span className="absolute top-4 right-4 text-[10px] font-black bg-zinc-100 dark:bg-white/[0.04] text-zinc-500 w-6 h-6 rounded-full flex items-center justify-center">
                              R{idx + 1}
                            </span>
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-extrabold text-sm text-zinc-950 dark:text-white leading-tight">
                                  {round.name}
                                </h4>
                                <Badge className={`mt-1.5 text-[9px] font-black uppercase px-2 py-0.5 rounded ${diffStyle}`}>
                                  {round.difficulty}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                                {round.focus}
                              </p>
                              <div className="flex flex-wrap gap-1 pt-2 border-t border-zinc-100 dark:border-white/[0.03]">
                                {round.likely_topics.slice(0, 3).map((topic, tIdx) => (
                                  <Badge key={tIdx} className="bg-zinc-100 dark:bg-white/[0.04] text-zinc-500 border-transparent text-[8px] font-bold px-1.5 py-0.5 rounded-md">
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Transition Button */}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          if (trackedApp) {
                            navigate("/dashboard/hired/prep", { state: { app: trackedApp } });
                          } else {
                            // If they opted out of tracking, we fabricate a temporary trackedApp so they can still transition seamlessly!
                            const tempApp: JobApplication = {
                              id: `temp-${Date.now()}`,
                              company_name: companyName,
                              job_title: jobTitle,
                              status: "Applied",
                              jd_text: jobDescription,
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            };
                            navigate("/dashboard/hired/prep", { state: { app: tempApp } });
                          }
                        }}
                        className="h-10 px-6 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer border-none shadow-md shrink-0 transition-transform active:scale-95"
                      >
                        <span>Launch Full Q&A Practice Room</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: REDDIT INSIGHTS & COMPENSATION */}
                {activeTab === "research" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {researchResult ? (
                      <>
                        {/* Culture Vibe Card */}
                        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.07] rounded-3xl p-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.01] rounded-full blur-3xl pointer-events-none" />
                          <div className="space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1.5 select-none">
                                <Zap className="w-4 h-4 animate-pulse" /> Community Consensus Insight
                              </span>
                              {researchResult.difficulty_rating && (
                                <Badge className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                                  Hiring Bar: {researchResult.difficulty_rating}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-semibold bg-zinc-50 dark:bg-white/[0.01] p-4 border border-zinc-100 dark:border-white/[0.04] rounded-xl">
                              {researchResult.key_insight}
                            </p>
                          </div>
                        </div>

                        {/* Reddit Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Salaries */}
                          <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.07] rounded-3xl p-6 space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-emerald-500" /> Reddit Salary Indices
                            </h4>
                            {researchResult.salary_range ? (
                              <div className="flex flex-col gap-2">
                                <div className="flex items-start gap-2 bg-emerald-500/[0.03] border border-emerald-500/10 p-3.5 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 leading-relaxed">
                                  <Flame className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                  <span>{researchResult.salary_range}</span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground py-4 font-semibold text-center">
                                No direct compensation statistics gathered for this company yet.
                              </p>
                            )}
                          </div>

                          {/* HR Warnings */}
                          <div className="bg-rose-500/[0.02] border border-rose-500/10 rounded-3xl p-6 space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-rose-500 flex items-center gap-2">
                              <ShieldAlert className="w-4 h-4" /> Culture & Workplace Signals
                            </h4>
                            {researchResult.culture_signals?.length > 0 ? (
                              <div className="flex flex-col gap-2">
                                {researchResult.culture_signals.map((flag: string, i: number) => (
                                  <div key={i} className="flex items-start gap-2.5 bg-rose-500/[0.05] border border-rose-500/10 p-3.5 rounded-xl text-xs font-bold text-rose-800 dark:text-rose-300/90 leading-relaxed">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-2" />
                                    <span>{flag}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-rose-500/60 py-4 font-semibold text-center">
                                Good signs: No significant alerts detected in forums.
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.07] rounded-3xl p-12 text-center py-16 flex flex-col items-center justify-center gap-4">
                        <Globe className="w-10 h-10 text-zinc-400 animate-spin" />
                        <div>
                          <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                            Crawling Forum Data...
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                            Reddit forum records are being examined to cross-check hiring trends, employee warnings, and CTC brackets.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* 4. ADVANCED CAREER PRODUCT HUBS (BOTTOM ANCHOR) */}
        <div className="space-y-4 text-left pt-6">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
            Advanced Career Hubs
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div
              onClick={() => navigate("resume")}
              className="group bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] hover:border-indigo-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 transition-transform group-hover:scale-110">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                Resume Intelligence
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Build premium ATS-scoreable profiles, rewrite highlight points, and export PDFs.
              </p>
            </div>

            <div
              onClick={() => navigate("tracker")}
              className="group bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] hover:border-emerald-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 transition-transform group-hover:scale-110">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                Job Tracker Board
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Kanban status pipeline to catalog target roles, track applications, and write interview notes.
              </p>
            </div>

            <div
              onClick={() => navigate("prep")}
              className="group bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] hover:border-purple-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 transition-transform group-hover:scale-110">
                <Target className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                Interview Intelligence
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Predicted round QA practice simulators, customized elevator pitch generators, and behavioral checks.
              </p>
            </div>

            <div
              onClick={() => navigate("cover-letter")}
              className="group bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] hover:border-amber-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 transition-transform group-hover:scale-110">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                Cover Letter Engine
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Generate highly tailored cover letters on the fly with customizable tone controls.
              </p>
            </div>

          </div>
        </div>

      </div>
    </HiredShell>
  );
}
