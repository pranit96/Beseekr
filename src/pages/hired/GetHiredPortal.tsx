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
  CheckSquare,
  Play,
  RotateCcw,
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import HiredShell from "./HiredShell";

export default function GetHiredPortal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resumeData, setResumeData, saveActiveDraft, workspaceMode, setWorkspaceMode } = useResume();
  const hasResume = Boolean(resumeData?.personal_info?.name);

  // Redesigned step-based onboarding mode state
  const [onboardingMode, setOnboardingMode] = useState<"upload" | "template" | "continue">("continue");

  // Sync state with active resume availability
  useEffect(() => {
    if (hasResume) {
      setOnboardingMode("continue");
    } else {
      setOnboardingMode("upload");
    }
  }, [hasResume]);

  // Target Job State
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");

  // Automated Integration options
  const [autoTrack, setAutoTrack] = useState(true);
  const [autoResearch, setAutoResearch] = useState(true);

  // Execution statuses
  const [isParsing, setIsParsing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"ats" | "cover" | "prep" | "research">("ats");

  // Diagnostic checklist states for real-time analysis animation
  const [analysisStep, setAnalysisStep] = useState(0);

  // Analysis result storage
  const [atsResult, setAtsResult] = useState<ATSAnalysis | null>(null);
  const [coverLetterResult, setCoverLetterResult] = useState<string | null>(null);
  const [interviewPrepResult, setInterviewPrepResult] = useState<InterviewPrepKit | null>(null);
  const [researchResult, setResearchResult] = useState<ResearchSummary | null>(null);
  const [trackedApp, setTrackedApp] = useState<JobApplication | null>(null);

  const [copiedLetter, setCopiedLetter] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);

  // Onboarding: Handle file parser
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const parsed = await resumeApi.uploadAndParseResume(file);
      if (parsed?.personal_info?.name) {
        setResumeData(parsed);
        setWorkspaceMode("upload");
        await saveActiveDraft(parsed, undefined);
        setOnboardingMode("continue");
        toast({
          title: "Profile Configured",
          description: `Imported experience details for ${parsed.personal_info.name}.`,
        });
      } else {
        throw new Error("Empty details returned from file processor.");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Parsing Failed",
        description: err.message || "Please upload a valid PDF or DOCX file.",
      });
    } finally {
      setIsParsing(false);
    }
  };

  // Onboarding: Handle template selection
  const handleSelectTemplate = async (template: any) => {
    try {
      setResumeData(template.data);
      setWorkspaceMode("template");
      await saveActiveDraft(template.data, undefined);
      setOnboardingMode("continue");
      toast({
        title: "Preset Profile Loaded",
        description: `Now using sandbox profile: ${template.data.personal_info.name} (${template.name}).`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Template Failed",
        description: "Could not apply preset sandbox profile.",
      });
    }
  };

  // Onboarding: Wipe workspace
  const handleWipeResume = async () => {
    setResumeData(EMPTY_RESUME);
    await saveActiveDraft(EMPTY_RESUME, "");
    setAtsResult(null);
    setCoverLetterResult(null);
    setInterviewPrepResult(null);
    setResearchResult(null);
    setTrackedApp(null);
    setOnboardingMode("upload");
    toast({
      title: "Workspace Purged",
      description: "Profile highlights and active analysis cleared.",
    });
  };

  // Copilot execution trigger
  const handleLaunchCopilot = async () => {
    if (!hasResume) {
      toast({
        variant: "destructive",
        title: "Resume Required",
        description: "Please configure your resume profile in Step 1 first.",
      });
      return;
    }
    if (!companyName.trim() || !jobTitle.trim() || !jobDescription.trim()) {
      toast({
        variant: "destructive",
        title: "Required Fields",
        description: "Company, Role, and Job Description are required fields.",
      });
      return;
    }

    setIsAnalyzing(true);
    setAtsResult(null);
    setCoverLetterResult(null);
    setInterviewPrepResult(null);
    setResearchResult(null);
    setTrackedApp(null);
    setAnalysisStep(1);

    // Simulate progressive analytical checkpoints for top-tier visual flow
    const stepTimer1 = setTimeout(() => setAnalysisStep(2), 1200);
    const stepTimer2 = setTimeout(() => setAnalysisStep(3), 2800);
    const stepTimer3 = setTimeout(() => setAnalysisStep(4), 4500);

    try {
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
        try {
          sessionStorage.setItem(`prepKit:${tempAppId}`, JSON.stringify(prepRes.value));
        } catch (_) {}
      }

      // Connection 1: Sync to Job Tracker Board
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
          
          if (prepRes.status === "fulfilled" && prepRes.value) {
            try {
              sessionStorage.setItem(`prepKit:${appObj.id}`, JSON.stringify(prepRes.value));
            } catch (_) {}
          }
        } catch (trackerErr) {
          console.error("Auto tracker sync failed:", trackerErr);
        }
      }

      // Connection 2: Deep Community Research Crawl
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
        title: "CoPilot Analysis Complete",
        description: "ATS grades, Tailored Cover Letter, and Interview roadmap are fully generated.",
      });

    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "CoPilot Failed",
        description: err.message || "An unexpected error occurred during scoring.",
      });
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setIsAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  const handleCopyLetter = () => {
    if (!coverLetterResult) return;
    navigator.clipboard.writeText(coverLetterResult);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2000);
    toast({ title: "Letter Copied", description: "Cover letter copied to clipboard." });
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
    toast({ title: "Pitch Copied", description: "Elevator pitch copied to clipboard." });
  };

  return (
    <HiredShell>
      <div className="max-w-7xl mx-auto space-y-8 py-8 px-4 sm:px-6 lg:px-8 text-left">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-white/[0.05]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-indigo-500 animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase">
                Career Platform · Unified Command Center
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              Career <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">CoPilot.</span>
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Analyze ATS alignment indices, generate tailored cover letters, predict interview formats, and crawl wage statistics in a single dashboard.
            </p>
          </div>
        </div>

        {/* STEP 1: ONBOARDING GATE (FILE / TEMPLATES / CONTINUE) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-black">1</span>
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Step 1: Configure Profile Foundation</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Onboarding Mode: Uploader */}
            <div
              onClick={() => setOnboardingMode("upload")}
              className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden ${
                onboardingMode === "upload"
                  ? "bg-indigo-500/[0.03] border-indigo-500/50 shadow-md shadow-indigo-500/5"
                  : "bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.1]"
              }`}
            >
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Upload className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">Upload Resume File</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Parse a personal PDF/DOCX file to extract highlights.
                </p>
              </div>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pt-2">Configure File Uploader</span>
            </div>

            {/* Onboarding Mode: Templates Preset */}
            <div
              onClick={() => setOnboardingMode("template")}
              className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden ${
                onboardingMode === "template"
                  ? "bg-indigo-500/[0.03] border-indigo-500/50 shadow-md shadow-indigo-500/5"
                  : "bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.1]"
              }`}
            >
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">Playground Presets</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Choose pre-built profiles to test the workspace immediately.
                </p>
              </div>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pt-2">Choose sandbox preset</span>
            </div>

            {/* Onboarding Mode: Continue Session */}
            <div
              onClick={() => {
                if (hasResume) {
                  setOnboardingMode("continue");
                } else {
                  toast({
                    title: "No Profile Loaded",
                    description: "Please upload a resume or select a template first.",
                  });
                }
              }}
              className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden ${
                !hasResume ? "opacity-50 cursor-not-allowed" : ""
              } ${
                onboardingMode === "continue" && hasResume
                  ? "bg-emerald-500/[0.03] border-emerald-500/50 shadow-md shadow-emerald-500/5"
                  : "bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.1]"
              }`}
            >
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <FileCheck className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">Continue Sandbox Session</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {hasResume 
                    ? `Active: ${resumeData.personal_info.name || "My Profile"}`
                    : "No active draft session locked in right now."}
                </p>
              </div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest pt-2">
                {hasResume ? "Continue active workspace" : "Locked"}
              </span>
            </div>

          </div>

          {/* ACTIVE ONBOARDING SELECTION WORKSPACE CONTENT */}
          <div className="bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-white/[0.05] rounded-3xl p-6 transition-all duration-300">
            {onboardingMode === "upload" && (
              <div className="flex flex-col items-center justify-center py-4 text-center space-y-4 animate-in fade-in duration-200">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 animate-pulse">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">Upload PDF/DOCX Resume</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Upload your profile. Once parsed, we will automatically customize all AI material.
                  </p>
                </div>
                <label className="cursor-pointer bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-2 rounded-xl text-xs uppercase tracking-wider shadow-md shadow-amber-500/10 transition-all flex items-center gap-2 select-none">
                  {isParsing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Extracting details...
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
              </div>
            )}

            {onboardingMode === "template" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="text-center space-y-1">
                  <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">Select a Playground Template Profile</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Click any pre-built template to instantly hydrate your workspace and run CoPilot calculations.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto pt-2">
                  {RESUME_TEMPLATES.filter(t => t.id !== "blank_master").map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className="p-4 rounded-xl border border-zinc-200 dark:border-white/[0.08] hover:border-indigo-500/40 hover:bg-indigo-500/[0.02] cursor-pointer text-center space-y-2 transition-all"
                    >
                      <Badge className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase tracking-wider px-2 rounded">
                        {template.name.replace("Modern ", "").replace("Classic ", "")}
                      </Badge>
                      <h5 className="font-extrabold text-xs text-zinc-900 dark:text-white">{template.data.personal_info.name}</h5>
                      <p className="text-[10px] text-muted-foreground truncate">{template.data.personal_info.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {onboardingMode === "continue" && hasResume && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <FileCheck className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                        {resumeData.personal_info.name || "Active Resume Profile"}
                      </h4>
                      <Badge className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                        Active Draft Hydrated
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold flex items-center gap-2 flex-wrap">
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
                    className="text-xs font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl px-4 py-2 cursor-pointer font-bold border-none"
                  >
                    Adjust Profile Details
                  </button>
                  <button
                    onClick={handleWipeResume}
                    className="text-xs font-black uppercase tracking-wider text-red-600 hover:text-red-500 dark:text-red-400/80 dark:hover:text-red-300 transition-colors bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl px-4 py-2 cursor-pointer font-bold border-none"
                  >
                    Wipe Draft
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: SPLIT-SCREEN ANALYTICAL COCKPIT (Only enabled when profile is active) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-black">2</span>
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Step 2: Redesigned Analytical Workspace</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Target position forms & parameters (40%) */}
            <div className={`lg:col-span-5 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.07] rounded-3xl p-6 sm:p-7 shadow-sm space-y-6 relative overflow-hidden transition-opacity duration-300 ${
              !hasResume ? "opacity-40 pointer-events-none" : "opacity-100"
            }`}>
              <div className="absolute top-0 left-0 w-80 h-80 bg-purple-500/[0.01] rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-1.5 border-b border-zinc-100 dark:border-white/[0.05] pb-4">
                <h4 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Target Position Setup
                </h4>
                <p className="text-xs text-muted-foreground">
                  Map target specifications to customize keyword match indices.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Company Name <span className="text-purple-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Stripe, Google, Netflix"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full h-11 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] focus:border-purple-500/50 rounded-xl px-4 text-sm text-zinc-900 dark:text-zinc-100 outline-none transition-all"
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
                    className="w-full h-11 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] focus:border-purple-500/50 rounded-xl px-4 text-sm text-zinc-900 dark:text-zinc-100 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Job Posting URL <span className="text-zinc-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. https://careers.stripe.com/..."
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    className="w-full h-11 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] focus:border-purple-500/50 rounded-xl px-4 text-sm text-zinc-900 dark:text-zinc-100 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Job Description <span className="text-purple-500">*</span>
                  </label>
                  <textarea
                    placeholder="Paste full job duties and keywords to align keyword optimization metrics..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={6}
                    className="w-full bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] focus:border-purple-500/50 rounded-xl p-4 text-sm text-zinc-900 dark:text-zinc-100 outline-none resize-none leading-relaxed font-semibold transition-all"
                  />
                </div>

                {/* AUTOMATION CONTROLS */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="autoTrack"
                      checked={autoTrack}
                      onChange={(e) => setAutoTrack(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 cursor-pointer"
                    />
                    <label htmlFor="autoTrack" className="text-xs font-bold text-zinc-900 dark:text-zinc-200 cursor-pointer flex items-center gap-1.5 select-none">
                      <LayoutDashboard className="w-3.5 h-3.5 text-zinc-400" />
                      Auto-Sync into Kanban Job Tracker
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
                    <label htmlFor="autoResearch" className="text-xs font-bold text-zinc-900 dark:text-zinc-200 cursor-pointer flex items-center gap-1.5 select-none">
                      <Globe className="w-3.5 h-3.5 text-zinc-400" />
                      Crawl Reddit CTC & Culture details
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleLaunchCopilot}
                  disabled={isAnalyzing || !hasResume || !companyName.trim() || !jobTitle.trim() || !jobDescription.trim()}
                  className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold px-8 rounded-xl shadow-lg shadow-purple-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none select-none"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> CoPilot Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 animate-bounce" /> Launch Career CoPilot
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: REAL-TIME ANALYTICAL DESK (60%) */}
            <div className="lg:col-span-7 space-y-6">
              
              <AnimatePresence mode="wait">
                {isAnalyzing ? (
                  /* ANALYTICAL CRAWLER / RUNNING MODE SKELETON DISPLAY */
                  <motion.div
                    key="analyzing-desk"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.07] rounded-3xl p-8 sm:p-12 shadow-sm min-h-[500px] flex flex-col justify-between"
                  >
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                        <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">Analyzing Target Specifications</h4>
                      </div>
                      
                      {/* Diagnostic Checklist */}
                      <div className="space-y-4 pt-4">
                        {[
                          { step: 1, label: "Scanning profile highlights for tech stacks & highlights...", active: analysisStep >= 1 },
                          { step: 2, label: "Scoring ATS compatibility rating & gaps analysis...", active: analysisStep >= 2 },
                          { step: 3, label: "Compiling cover letter hooks & custom layout...", active: analysisStep >= 3 },
                          { step: 4, label: "Searching Reddit compensation indices & HR reports...", active: autoResearch ? analysisStep >= 4 : false },
                        ].map((diag) => (
                          <div key={diag.step} className={`flex items-start gap-3 transition-opacity duration-300 ${
                            diag.active ? "opacity-100" : "opacity-30"
                          }`}>
                            {diag.active ? (
                              <CheckSquare className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded border border-zinc-300 dark:border-zinc-700 mt-0.5 shrink-0" />
                            )}
                            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-300 leading-relaxed">{diag.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-100 dark:border-white/[0.04]">
                      <div className="w-full bg-zinc-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${(analysisStep / 4) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-2">
                        <span>Initiating</span>
                        <span>{Math.round((analysisStep / 4) * 100)}% Compiling</span>
                      </div>
                    </div>
                  </motion.div>
                ) : atsResult || coverLetterResult || interviewPrepResult || researchResult ? (
                  /* ACTIVE RESULTS CONSOLE */
                  <motion.div
                    key="results-desk"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Diagnostic Summary Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-indigo-500/[0.03] border border-indigo-500/10">
                      <div>
                        <h4 className="font-extrabold text-sm text-zinc-950 dark:text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                          Evaluation Report Ready
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 font-semibold">
                          Material generated specifically for {jobTitle} @ {companyName}.
                        </p>
                      </div>
                      {trackedApp && (
                        <Badge className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider px-3 py-1 flex items-center gap-1.5 self-start sm:self-auto rounded">
                          <LayoutDashboard className="w-3.5 h-3.5" /> Tracked
                        </Badge>
                      )}
                    </div>

                    {/* Console Tab Selectors */}
                    <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/[0.06] p-1.5 rounded-2xl w-full flex overflow-x-auto gap-1">
                      {[
                        { id: "ats", label: "ATS Score", icon: FileCheck },
                        { id: "cover", label: "Cover Letter", icon: FileText },
                        { id: "prep", label: "Hiring Journey", icon: Target },
                        { id: "research", label: "Wage & Culture", icon: Globe },
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

                    {/* TAB: ATS SCORING */}
                    {activeTab === "ats" && atsResult && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        {/* Score Circle & aspect widgets */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.07] rounded-3xl p-6">
                          
                          <div className="sm:col-span-4 text-center space-y-3">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Match Index</h5>
                            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" className="text-zinc-100 dark:text-white/5" fill="transparent" />
                                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" className="text-indigo-500" strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - atsResult.score / 100)}`} fill="transparent" strokeLinecap="round" />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">{atsResult.score}</span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Rating</span>
                              </div>
                            </div>
                          </div>

                          <div className="sm:col-span-8 text-left space-y-1">
                            <h5 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">CoPilot Analysis Verdict</h5>
                            <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                              {atsResult.general_feedback}
                            </p>
                          </div>
                        </div>

                        {/* Alignment grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            { name: "Keywords Alignment", score: atsResult.aspects.skills_match },
                            { name: "Formatting Grade", score: atsResult.aspects.formatting },
                            { name: "Impact Score", score: atsResult.aspects.impact },
                            { name: "Tone Metrics", score: atsResult.aspects.language_tone },
                          ].map((cat) => (
                            <div key={cat.name} className="p-4 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.07] rounded-2xl space-y-1.5 text-left">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200">{cat.name}</span>
                                <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded">
                                  {cat.score.rating}/10
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">{cat.score.why}</p>
                              <div className="pt-2 border-t border-zinc-100 dark:border-white/[0.03] text-[10px] text-zinc-500 leading-relaxed font-medium">
                                <span className="font-bold text-indigo-500 block uppercase mb-0.5">Optimization tip:</span>
                                {cat.score.how_to_improve}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Keyword capsules */}
                        {atsResult.missing_keywords?.length > 0 && (
                          <div className="bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl p-5 space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5 select-none">
                              <AlertTriangle className="w-3.5 h-3.5" /> High Impact Missing Keywords
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {atsResult.missing_keywords.map((kw) => (
                                <Badge key={kw} className="bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 uppercase rounded-lg">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Bullet point optimizer */}
                        {atsResult.bullet_point_suggestions?.length > 0 && (
                          <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.07] rounded-3xl p-5 space-y-4">
                            <h5 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                              <Zap className="w-4 h-4 text-purple-500" /> Optimize Work Highlights
                            </h5>
                            <div className="space-y-3.5">
                              {atsResult.bullet_point_suggestions.map((sug, i) => (
                                <div key={i} className="p-3.5 rounded-xl bg-zinc-50 dark:bg-white/[0.01] border border-zinc-200 dark:border-white/[0.04] space-y-1.5 text-left">
                                  <div className="text-[11px] text-red-500 line-through leading-relaxed">{sug.original}</div>
                                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold leading-relaxed flex items-start gap-1">
                                    <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                    <span>{sug.improved}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB: COVER LETTER */}
                    {activeTab === "cover" && coverLetterResult && (
                      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.07] rounded-3xl overflow-hidden shadow-sm animate-in fade-in duration-200">
                        <div className="p-6 max-h-[450px] overflow-y-auto custom-scrollbar border-b border-zinc-100 dark:border-white/[0.04]">
                          <p className="text-sm text-zinc-800 dark:text-zinc-300 leading-8 whitespace-pre-wrap font-medium">
                            {coverLetterResult}
                          </p>
                        </div>
                        <div className="px-6 py-4 bg-zinc-50 dark:bg-white/[0.01] flex items-center justify-between flex-wrap gap-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Executive Letter Blueprint</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleCopyLetter}
                              className="h-9 px-4 text-xs font-bold text-muted-foreground hover:text-zinc-950 dark:hover:text-white bg-transparent border border-zinc-200 dark:border-white/[0.08] rounded-xl flex items-center gap-1.5 cursor-pointer border-none"
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

                    {/* TAB: INTERVIEW TIMELINE */}
                    {activeTab === "prep" && interviewPrepResult && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        
                        {/* Elevator Pitch */}
                        <div className="bg-gradient-to-br from-indigo-500/[0.02] to-purple-500/[0.02] border border-indigo-500/10 rounded-2xl p-5 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-200 dark:border-white/[0.04] pb-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-indigo-500 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" /> 30-Second Elevator Pitch
                            </span>
                            <button
                              onClick={handleCopyPitch}
                              className="text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 flex items-center gap-1 bg-transparent border-none outline-none cursor-pointer"
                            >
                              {copiedPitch ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>Copy Pitch</span>
                            </button>
                          </div>
                          <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed italic font-semibold">
                            "{interviewPrepResult.elevator_pitch}"
                          </p>
                        </div>

                        {/* Chronological predicted rounds */}
                        <div className="space-y-3.5">
                          {interviewPrepResult.rounds.map((round, idx) => {
                            let diffStyle = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
                            if (round.difficulty === "Medium") diffStyle = "text-amber-500 bg-amber-500/10 border-amber-500/20";
                            if (round.difficulty === "Hard") diffStyle = "text-rose-500 bg-rose-500/10 border-rose-500/20";

                            return (
                              <div key={idx} className="flex items-start gap-4 p-4 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.07] rounded-2xl hover:border-indigo-500/30 transition-all text-left">
                                <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-white/[0.04] text-[10px] font-black text-zinc-500 flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </div>
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <h5 className="font-extrabold text-sm text-zinc-950 dark:text-white leading-tight">{round.name}</h5>
                                    <Badge className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${diffStyle}`}>{round.difficulty}</Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground font-semibold leading-relaxed">{round.focus}</p>
                                  <div className="flex flex-wrap gap-1 pt-1.5 border-t border-zinc-100 dark:border-white/[0.03]">
                                    {round.likely_topics.map((t, i) => (
                                      <Badge key={i} className="bg-zinc-100 dark:bg-white/[0.04] text-zinc-500 border-transparent text-[8px] font-bold px-1.5 rounded-md">
                                        {t}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Transition deep link */}
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => {
                              const appCtx = trackedApp || {
                                id: `temp-${Date.now()}`,
                                company_name: companyName,
                                job_title: jobTitle,
                                status: "Applied",
                                jd_text: jobDescription,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                              };
                              navigate("/dashboard/hired/prep", { state: { app: appCtx } });
                            }}
                            className="h-10 px-6 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 border-none shadow-md shrink-0 transition-transform active:scale-95 cursor-pointer"
                          >
                            <span>Launch Dedicated Practice room</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    )}

                    {/* TAB: REDDIT CRAWLER */}
                    {activeTab === "research" && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        {researchResult ? (
                          <>
                            {/* Summary Consensus */}
                            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.07] rounded-3xl p-6 relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.01] rounded-full blur-3xl pointer-events-none" />
                              <div className="space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1.5 select-none">
                                    <Zap className="w-4 h-4 animate-pulse" /> Consensus Culture Vibe
                                  </span>
                                  {researchResult.difficulty_rating && (
                                    <Badge className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                                      Hiring bar: {researchResult.difficulty_rating}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-zinc-800 dark:text-zinc-250 leading-relaxed font-semibold bg-zinc-50 dark:bg-white/[0.01] p-4 border border-zinc-100 dark:border-white/[0.04] rounded-xl">
                                  {researchResult.key_insight}
                                </p>
                              </div>
                            </div>

                            {/* Wage and signals */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              {/* Wages */}
                              <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.07] rounded-3xl p-6 space-y-4">
                                <h5 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-emerald-500" /> Reddit Salary benchmarks
                                </h5>
                                {researchResult.salary_range ? (
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-start gap-2 bg-emerald-500/[0.03] border border-emerald-500/10 p-3.5 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 leading-relaxed">
                                      <Flame className="w-3.5 h-3.5 shrink-0 mt-0.5 animate-pulse" />
                                      <span>{researchResult.salary_range}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground py-4 font-semibold text-center">
                                    No wages benchmarks extracted for this firm yet.
                                  </p>
                                )}
                              </div>

                              {/* Culture Warnings */}
                              <div className="bg-rose-500/[0.02] border border-rose-500/10 rounded-3xl p-6 space-y-4">
                                <h5 className="text-xs font-black uppercase tracking-widest text-rose-500 flex items-center gap-2">
                                  <ShieldAlert className="w-4 h-4 animate-pulse" /> Culture Signals
                                </h5>
                                {researchResult.culture_signals?.length > 0 ? (
                                  <div className="flex flex-col gap-2">
                                    {researchResult.culture_signals.map((flag: string, i: number) => (
                                      <div key={i} className="flex items-start gap-2 bg-rose-500/[0.05] border border-rose-500/10 p-3.5 rounded-xl text-xs font-bold text-rose-800 dark:text-rose-350 leading-relaxed">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-2" />
                                        <span>{flag}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-rose-500/60 py-4 font-semibold text-center">
                                    Forum reviews indicate standard workplace health.
                                  </p>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.07] rounded-3xl p-12 text-center py-16 flex flex-col items-center justify-center gap-4">
                            <Globe className="w-10 h-10 text-zinc-400 animate-spin" />
                            <div>
                              <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">Crawling Forum Indexes</h4>
                              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                                reddit.com is currently being indexed for cultural parameters and salary reports.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  /* WORKSPACE LANDING PLAYGROUND SKELETON */
                  <motion.div
                    key="playground-desk"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.07] rounded-3xl p-8 sm:p-12 shadow-sm min-h-[500px] flex flex-col items-center justify-center text-center space-y-6"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Target className="w-7 h-7 animate-pulse" />
                    </div>
                    <div className="space-y-2 max-w-sm">
                      <h4 className="font-extrabold text-sm text-zinc-950 dark:text-white uppercase tracking-wider">AI CoPilot Desk Idle</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                        Enter target position details on the left (Company, Role, Job Description) and trigger CoPilot calculations. Results will populate here side-by-side.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
            </div>

          </div>
        </div>

        {/* STEP 3: ADVANCED CAPABILITY HUBS */}
        <div className="space-y-4 pt-6">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-black">3</span>
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Step 3: Advanced Specialization Suites</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div
              onClick={() => navigate("resume")}
              className="group bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] hover:border-indigo-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-300"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 transition-transform group-hover:scale-110">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1">
                Resume Intelligence
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Build high-score target profiles, adjust skills blocks, and export PDFs.
              </p>
            </div>

            <div
              onClick={() => navigate("tracker")}
              className="group bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] hover:border-emerald-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-300"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 transition-transform group-hover:scale-110">
                <LayoutDashboard className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1">
                Job Tracker Board
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Kanban status pipelines to track positions, log application links, and write interview notes.
              </p>
            </div>

            <div
              onClick={() => navigate("prep")}
              className="group bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] hover:border-purple-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-300"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 transition-transform group-hover:scale-110">
                <Target className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1">
                Interview Intelligence
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Chronologicalpredicted Q&A simulators, behavioral diagnostic tips, and company filters.
              </p>
            </div>

            <div
              onClick={() => navigate("cover-letter")}
              className="group bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] hover:border-amber-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-300"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 transition-transform group-hover:scale-110">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1">
                Cover Letter Engine
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Re-generate custom letters with precise tone parameters on the fly.
              </p>
            </div>

          </div>
        </div>

      </div>
    </HiredShell>
  );
}
