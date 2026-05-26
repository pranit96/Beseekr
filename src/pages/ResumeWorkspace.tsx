// src/pages/ResumeWorkspace.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useResume,
  EMPTY_RESUME,
  PRESET_TEMPLATE,
} from "@/contexts/ResumeContext";
import {
  FileText,
  Sparkles,
  Trophy,
  Download,
  Briefcase,
  GraduationCap,
  Cpu,
  User,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldCheck,
  History,
  RotateCcw,
  MessageSquare,
  Copy,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ATSAnalysis, resumeApi } from "@/api/resume";
import { GlobalFooter } from "@/components/GlobalFooter";
import { generateLatexResume } from "@/utils/latexGenerator";

/* ─── NAV TABS CONFIG ─────────────────────────────────────────────── */
const NAV_TABS = [
  {
    id: "personal",
    label: "Personal",
    icon: User,
    color: "text-violet-400",
    ring: "ring-violet-500/30",
    dot: "bg-violet-400",
  },
  {
    id: "experience",
    label: "Experience",
    icon: Briefcase,
    color: "text-sky-400",
    ring: "ring-sky-500/30",
    dot: "bg-sky-400",
  },
  {
    id: "education",
    label: "Education",
    icon: GraduationCap,
    color: "text-emerald-400",
    ring: "ring-emerald-500/30",
    dot: "bg-emerald-400",
  },
  {
    id: "skills",
    label: "Skills",
    icon: Cpu,
    color: "text-purple-400",
    ring: "ring-purple-500/30",
    dot: "bg-purple-400",
  },
  {
    id: "design",
    label: "Theme",
    icon: Sparkles,
    color: "text-amber-400",
    ring: "ring-amber-500/30",
    dot: "bg-amber-400",
  },
  {
    id: "coverletter",
    label: "Cover Letter",
    icon: MessageSquare,
    color: "text-rose-400",
    ring: "ring-rose-500/30",
    dot: "bg-rose-400",
  },
  {
    id: "tailor",
    label: "ATS Match & Tailor",
    icon: Trophy,
    color: "text-indigo-400",
    ring: "ring-indigo-500/30",
    dot: "bg-indigo-400",
  },
];

/* ─── SECTION CARD WRAPPER ──────────────────────────────────────── */
const SectionCard = ({ children }: { children: React.ReactNode }) => (
  <div className="border border-zinc-100 dark:border-white/[0.04] bg-white/60 dark:bg-white/[0.01] rounded-2xl p-6 shadow-sm space-y-5 transition-all">
    {children}
  </div>
);

/* ─── EMPTY STATE ───────────────────────────────────────────────── */
const EmptyState = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center py-14 border-2 border-dashed border-zinc-200 dark:border-white/[0.05] rounded-2xl gap-3 text-zinc-400 bg-zinc-50/40 dark:bg-white/[0.005]">
    <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-white/[0.03] flex items-center justify-center">
      <Plus className="h-4 w-4 opacity-40" />
    </div>
    <p className="text-xs font-semibold">{label}</p>
  </div>
);

export default function ResumeWorkspace() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    resumeData,
    setResumeData,
    jobDescription,
    setJobDescription,
    atsReport,
    setAtsReport,
    isScoring,
    setIsScoring,
    isOptimizing,
    setIsOptimizing,
    saveStatus,
    saveSnapshot,
    resetWorkspace,
    workspaceMode,
    showOnboarding,
    setShowOnboarding,
    uploadSource,
  } = useResume();

  const [injectedKeywords, setInjectedKeywords] = useState<string[]>([]);
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewOutdated, setPreviewOutdated] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<"preview" | "ai">(
    "preview",
  );

  const isResumeBlank =
    !resumeData?.personal_info?.name && resumeData?.experience?.length === 0;

  useEffect(() => {
    let active = true;
    const initPreview = async () => {
      setIsPreviewLoading(true);
      try {
        const url = await resumeApi.downloadResumePdf(resumeData);
        if (active) {
          setPreviewUrl(url);
          setPreviewOutdated(false);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setIsPreviewLoading(false);
      }
    };
    if (resumeData?.personal_info?.name && !previewUrl) {
      initPreview();
    }
    return () => {
      active = false;
    };
  }, [resumeData?.personal_info?.name, previewUrl]);

  const [isFirstRender, setIsFirstRender] = useState(true);
  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }
    setPreviewOutdated(true);
  }, [resumeData]);

  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state?.activeTab]);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  const [isLatexOpen, setIsLatexOpen] = useState(false);
  const [latexCode, setLatexCode] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isLatexCompiling, setIsLatexCompiling] = useState(false);

  // Tailor & Align AI State
  const [tailorJd, setTailorJd] = useState("");
  const [tailorFile, setTailorFile] = useState<File | null>(null);
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailorResult, setTailorResult] = useState<any | null>(null);

  /* ─── HANDLERS ──────────────────────────────────────────────────── */
  const handleTailorResume = async () => {
    if (!tailorFile) {
      toast({
        variant: "destructive",
        title: "No Resume File",
        description: "Please upload a PDF or DOCX resume first.",
      });
      return;
    }
    if (!tailorJd || tailorJd.trim().length < 20) {
      toast({
        variant: "destructive",
        title: "Invalid Job Description",
        description: "Please enter a job description of at least 20 characters.",
      });
      return;
    }

    setIsTailoring(true);
    try {
      const result = await resumeApi.tailorAlignResume(tailorFile, tailorJd);
      setTailorResult(result);
      toast({
        title: "Resume Tailored & Aligned! 🎉",
        description: "Your optimized LaTeX PDF and ATS score are ready below.",
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Tailoring Failed",
        description: e.message || "Failed to parse and optimize resume.",
      });
    } finally {
      setIsTailoring(false);
    }
  };

  const handleApplyTailoredResume = () => {
    if (!tailorResult || !tailorResult.resume) return;
    setResumeData(tailorResult.resume);
    
    // Revoke old preview and load new one
    if (tailorResult.pdf_base64) {
      const binaryString = window.atob(tailorResult.pdf_base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      if (previewUrl) window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
      setPreviewOutdated(false);
    }
    
    toast({
      title: "Workspace Updated! 🚀",
      description: "The optimized resume fields and PDF preview have been loaded into your active workspace.",
    });
  };

  const handleDownloadTailoredPdf = () => {
    if (!tailorResult || !tailorResult.pdf_base64) return;
    try {
      const binaryString = window.atob(tailorResult.pdf_base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${tailorResult.resume?.personal_info?.name || "Tailored"}_Tailored_Resume.pdf`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download Initiated! 📄",
        description: "Your tailored LaTeX PDF is downloading.",
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: e.message || "Failed to download tailored PDF.",
      });
    }
  };

  const handleExportLatex = () => {
    try {
      const code = generateLatexResume(resumeData);
      setLatexCode(code);
      setIsCopied(false);
      setIsLatexOpen(true);
      toast({
        title: "LaTeX Generated!",
        description: "Review and copy your LaTeX source code.",
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "LaTeX Generation Failed",
        description: e.message,
      });
    }
  };

  const handleDownloadLatex = () => {
    try {
      const blob = new Blob([latexCode], { type: "text/x-tex;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${resumeData.personal_info?.name || "Resume"}_Resume.tex`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: "File Saved!",
        description: "Your .tex document was downloaded.",
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: e.message,
      });
    }
  };

  const handleCopyLatex = async () => {
    try {
      await navigator.clipboard.writeText(latexCode);
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: "LaTeX code copied to clipboard.",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Could not copy code.",
      });
    }
  };

  const handleDownloadLatexPdf = async () => {
    setIsLatexCompiling(true);
    try {
      const url = await resumeApi.downloadLatexPdf(resumeData);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${resumeData.personal_info?.name || "Resume"}_LaTeX_Resume.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: "LaTeX PDF Downloaded! 🎉",
        description: "Your ATS-optimized LaTeX resume PDF is ready.",
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "LaTeX PDF Compilation Failed",
        description:
          e.message ||
          "Could not compile LaTeX. Try downloading the .tex file instead.",
      });
    } finally {
      setIsLatexCompiling(false);
    }
  };

  const handleExportWord = async () => {
    setIsDownloading(true);
    try {
      const url = await resumeApi.downloadResumeWord(resumeData);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${resumeData.personal_info.name || "Resume"}_Resume.docx`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Word File Ready!" });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Word Export Failed",
        description: e.message,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setIsGeneratingCL(true);
    try {
      const content = await resumeApi.generateCoverLetter({
        resume: resumeData,
        job_description: jobDescription,
        company_name: "",
        job_title: resumeData.personal_info.summary.split(" ")[0],
      });
      setCoverLetter(content);
      setActiveTab("coverletter");
      toast({ title: "Cover Letter Generated" });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: e.message,
      });
    } finally {
      setIsGeneratingCL(false);
    }
  };

  const handleBackupToVault = async () => {
    setIsBackingUp(true);
    try {
      await saveSnapshot();
    } finally {
      setIsBackingUp(false);
    }
  };
  const handleClearWorkspace = () => setIsClearDialogOpen(true);
  const confirmClearWorkspace = () => {
    resetWorkspace();
    toast({ title: "Workspace Reset" });
  };

  const handleRunATSAnalysis = async () => {
    setIsScoring(true);
    try {
      const result = await resumeApi.scoreResume(resumeData, jobDescription);
      setAtsReport(result);
      toast({
        title: "Resume Scored",
        description: `Score: ${result.score}/100`,
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Scoring error",
        description: e.message,
      });
    } finally {
      setIsScoring(false);
    }
  };

  const handleOptimizeBullets = async () => {
    setIsOptimizing(true);
    try {
      const optimized = await resumeApi.optimizeResume(
        resumeData,
        jobDescription,
      );
      setResumeData(optimized);
      toast({ title: "AI Improvements Applied" });
      if (atsReport) handleRunATSAnalysis();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "AI Refactor Failed",
        description: e.message,
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleExportPdf = async () => {
    setIsDownloading(true);
    try {
      const url = await resumeApi.downloadResumePdf(resumeData);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${resumeData.personal_info.name || "Resume"}_Resume.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: "Export Successful 🚀" });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: e.message,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadFromPreview = () => {
    if (!previewUrl) return;
    setIsDownloading(true);
    try {
      const link = document.createElement("a");
      link.href = previewUrl;
      link.setAttribute(
        "download",
        `${resumeData.personal_info.name || "Resume"}_Resume.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Downloaded!" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRefreshPreview = async () => {
    setIsPreviewLoading(true);
    try {
      const url = await resumeApi.downloadResumePdf(resumeData);
      if (previewUrl) window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
      setPreviewOutdated(false);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Refresh Failed",
        description: e.message,
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  /* ─── FIELD MUTATORS ────────────────────────────────────────────── */
  const updatePersonalInfo = (
    field: keyof typeof EMPTY_RESUME.personal_info,
    value: string,
  ) =>
    setResumeData((p) => ({
      ...p,
      personal_info: { ...p.personal_info, [field]: value },
    }));

  const renderATSReportTabs = (isDrawer: boolean = false) => {
    if (!atsReport) return null;
    const cardBg = isDrawer
      ? "bg-zinc-50 dark:bg-white/[0.02]"
      : "bg-white dark:bg-white/[0.01]";
    const ringSize = isDrawer ? "h-24 w-24" : "h-20 w-20";
    const gradId = isDrawer ? "atsGrad" : "atsGradRightPanel";

    return (
      <Tabs defaultValue="overview" className="w-full text-left">
        <TabsList className="w-full bg-zinc-100 dark:bg-white/[0.04] rounded-xl border border-zinc-200 dark:border-white/[0.06] h-9 p-0.5 mb-4">
          <TabsTrigger
            value="overview"
            className="flex-1 text-[10px] font-bold rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-white/[0.08] data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white text-zinc-500 transition-all animate-none"
          >
            ⚡ Overview
          </TabsTrigger>
          <TabsTrigger
            value="audits"
            className="flex-1 text-[10px] font-bold rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-white/[0.08] data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white text-zinc-500 transition-all animate-none"
          >
            🔍 ATS Audits
          </TabsTrigger>
          <TabsTrigger
            value="upgrades"
            className="flex-1 text-[10px] font-bold rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-white/[0.08] data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white text-zinc-500 transition-all animate-none"
          >
            🚀 Upgrades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-0 text-left">
          {/* Score Ring */}
          <div className={`flex flex-col items-center py-5 border border-zinc-200 dark:border-white/[0.05] rounded-2xl ${cardBg}`}>
            <div className={`relative ${ringSize}`}>
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <defs>
                  <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                <path
                  className="stroke-zinc-200 dark:stroke-white/[0.05]"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <motion.path
                  stroke={`url(#${gradId})`}
                  strokeWidth="3"
                  strokeDasharray={`${atsReport.score || 0}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-zinc-900 dark:text-white">
                  {atsReport.score || 0}
                </span>
                <span className="text-[6px] font-black text-zinc-400 uppercase tracking-widest">
                  ATS Score
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {Object.entries(atsReport.aspects).map(([key, aspect]: [string, any]) => (
              <div
                key={key}
                className={`border border-zinc-200 dark:border-white/[0.05] rounded-xl p-3 text-left ${
                  isDrawer ? "bg-white dark:bg-white/[0.01]" : "bg-white dark:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="capitalize text-[8px] font-black text-zinc-400 uppercase tracking-wider">
                    {key.replace("_", " ")}
                  </span>
                  <span className="text-[8px] font-black font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-white/[0.04] px-1 py-0.5 rounded">
                    {aspect.rating}/10
                  </span>
                </div>
                <p className="text-[9px] text-zinc-500 leading-relaxed line-clamp-2" title={aspect.why}>
                  {aspect.why}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <Label className={labelCls + " flex items-center gap-1"}>
              <Sparkles className="h-2.5 w-2.5 text-indigo-400" /> Overall Assessment
            </Label>
            <div className={`text-[10px] leading-relaxed text-zinc-500 border border-zinc-200 dark:border-white/[0.04] rounded-xl p-3 ${
              isDrawer ? "bg-white dark:bg-white/[0.01]" : "bg-white dark:bg-white/[0.01]"
            }`}>
              {atsReport.general_feedback}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audits" className="space-y-4 mt-0 text-left">
          {/* Spellcheck & Grammar Card */}
          <div className={`p-4 rounded-2xl border border-zinc-200 dark:border-white/[0.05] space-y-3 ${
            isDrawer ? "bg-white dark:bg-white/[0.01]" : "bg-white dark:bg-white/[0.01]"
          }`}>
            <div className="flex items-center gap-2 justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5 font-bold">
                ✨ Spelling & Grammar Check
              </span>
              {(!atsReport.ats_checks?.spelling_grammar || atsReport.ats_checks.spelling_grammar.passed) ? (
                <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Clean
                </span>
              ) : (
                <span className="text-[8px] font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Issues Found
                </span>
              )}
            </div>

            {(!atsReport.ats_checks?.spelling_grammar ||
              atsReport.ats_checks.spelling_grammar.passed ||
              !atsReport.ats_checks.spelling_grammar.errors ||
              atsReport.ats_checks.spelling_grammar.errors.length === 0) ? (
              <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/10 rounded-xl text-emerald-500 text-[9px] font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" /> No spelling or grammar errors detected!
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[9px] text-zinc-400 font-medium">
                  Flagged by the recruiter engine (Score Impact: {atsReport.ats_checks.spelling_grammar.score_impact} pts):
                </p>
                <div className="space-y-1.5">
                  {atsReport.ats_checks.spelling_grammar.errors.map((err: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-rose-50/30 dark:bg-rose-500/[0.02] border border-rose-100 dark:border-rose-500/10 rounded-lg text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      {err}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Metric Density Compliance Card */}
          <div className={`p-4 rounded-2xl border border-zinc-200 dark:border-white/[0.05] space-y-3 ${
            isDrawer ? "bg-white dark:bg-white/[0.01]" : "bg-white dark:bg-white/[0.01]"
          }`}>
            <div className="flex items-center gap-2 justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-bold">
                📊 Quantifiable Metrics Check
              </span>
              {atsReport.ats_checks?.quantifiable_metrics?.passed ? (
                <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Compliant
                </span>
              ) : (
                <span className="text-[8px] font-black text-amber-500 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Action Needed
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold">
              {atsReport.ats_checks?.quantifiable_metrics?.details || "Checks for percentage improvements, scaling numbers, or budgets in experience bullets."}
            </p>
            {atsReport.ats_checks?.quantifiable_metrics?.score_impact !== 0 && (
              <span className="inline-block text-[8px] font-black text-amber-500 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-lg">
                Impact: {atsReport.ats_checks?.quantifiable_metrics?.score_impact} pts
              </span>
            )}
          </div>

          {/* Action Verbs Check */}
          <div className={`p-4 rounded-2xl border border-zinc-200 dark:border-white/[0.05] space-y-3 ${
            isDrawer ? "bg-white dark:bg-white/[0.01]" : "bg-white dark:bg-white/[0.01]"
          }`}>
            <div className="flex items-center gap-2 justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-bold">
                🚀 Strong Action Verbs Check
              </span>
              {atsReport.ats_checks?.action_verbs?.passed ? (
                <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Good Phrasing
                </span>
              ) : (
                <span className="text-[8px] font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Needs Rewrite
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold">
              {atsReport.ats_checks?.action_verbs?.details || "Verifies if work bullets start with impactful actions rather than passive summaries."}
            </p>
            {atsReport.ats_checks?.action_verbs?.score_impact !== 0 && (
              <span className="inline-block text-[8px] font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-2 py-0.5 rounded-lg">
                Impact: {atsReport.ats_checks?.action_verbs?.score_impact} pts
              </span>
            )}
          </div>

          {/* Section Completeness Check */}
          <div className={`p-4 rounded-2xl border border-zinc-200 dark:border-white/[0.05] space-y-3 ${
            isDrawer ? "bg-white dark:bg-white/[0.01]" : "bg-white dark:bg-white/[0.01]"
          }`}>
            <div className="flex items-center gap-2 justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-bold">
                🏢 Section Completeness Check
              </span>
              {atsReport.ats_checks?.completeness?.passed ? (
                <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Complete
                </span>
              ) : (
                <span className="text-[8px] font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Incomplete
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold">
              {atsReport.ats_checks?.completeness?.details || "Validates presence of work experience, technical skills, and academic sections."}
            </p>
            {atsReport.ats_checks?.completeness?.score_impact !== 0 && (
              <span className="inline-block text-[8px] font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-2 py-0.5 rounded-lg">
                Impact: {atsReport.ats_checks?.completeness?.score_impact} pts
              </span>
            )}
          </div>
        </TabsContent>

        <TabsContent value="upgrades" className="space-y-4 mt-0 text-left">
          {/* Missing Keywords */}
          <div className={`p-3.5 rounded-2xl border border-zinc-200 dark:border-white/[0.05] space-y-2.5 ${cardBg}`}>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
              🔍 Missing Keywords
            </p>
            <p className="text-[8px] text-zinc-400">
              Click to auto-append to your skills list.
            </p>
            {atsReport.missing_keywords.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-2.5 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/10 rounded-xl text-emerald-500 text-[9px] font-bold">
                <CheckCircle2 className="h-3 w-3" /> Full Coverage Achieved
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {atsReport.missing_keywords.map((keyword: string, i: number) => {
                  const added = injectedKeywords.includes(keyword);
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (added) return;
                        setResumeData((p) => {
                          const s = [...p.skills];
                          if (s[0])
                            s[0] = {
                              ...s[0],
                              items: [...new Set([...s[0].items, keyword])],
                            };
                          return { ...p, skills: s };
                        });
                        setInjectedKeywords((p) => [...p, keyword]);
                        toast({ title: `Added: ${keyword}` });
                      }}
                      className={`text-[8px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                        added
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border-emerald-200 dark:border-emerald-500/20 line-through opacity-50 cursor-not-allowed"
                          : "bg-zinc-50 dark:bg-white/[0.03] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-white/[0.08] hover:text-zinc-800 dark:hover:text-white"
                      }`}
                    >
                      + {keyword}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bullet Upgrades */}
          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
              🛠 Smart Bullet Refactors
            </p>
            {atsReport.bullet_point_suggestions.length === 0 ? (
              <div className="text-center py-6 text-zinc-400 text-[10px] border border-dashed border-zinc-200 dark:border-white/[0.05] rounded-xl">
                No suggestions. Try the AI Optimizer.
              </div>
            ) : (
              atsReport.bullet_point_suggestions.map((sug: any, sIdx: number) => {
                const nImp = sug.improved.trim().toLowerCase();
                const isApplied =
                  appliedSuggestions.includes(nImp) ||
                  resumeData.experience.some((e) => e.highlights.some((h) => h.trim().toLowerCase() === nImp)) ||
                  resumeData.projects.some((p) => p.highlights.some((h) => h.trim().toLowerCase() === nImp));
                return (
                  <div
                    key={sIdx}
                    className={`rounded-xl border overflow-hidden transition-all ${
                      isApplied
                        ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5"
                        : "border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] hover:border-zinc-300"
                    }`}
                  >
                    <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-white/[0.04] text-[8px] text-zinc-400 italic">
                      &ldquo;{sug.original}&rdquo;
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-[10px] font-semibold text-zinc-800 dark:text-zinc-200 leading-relaxed text-left">
                        &ldquo;{sug.improved}&rdquo;
                      </p>
                      {sug.reason && (
                        <p className="text-[8px] text-zinc-400 italic flex items-start gap-1">
                          <Sparkles className="h-2.5 w-2.5 mt-0.5 text-indigo-400 shrink-0" />
                          {sug.reason}
                        </p>
                      )}
                      {isApplied ? (
                        <span className="inline-flex items-center gap-1 text-[8px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-lg">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Applied
                        </span>
                      ) : (
                        <button
                          onClick={() => applyRefactor(sug.original, sug.improved)}
                          className="h-6 px-3 rounded-lg text-[8px] font-black bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 transition-all shadow-sm border-none"
                        >
                          Apply Suggestion
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    );
  };

  const addCustomField = () => {
    setResumeData((p) => {
      const custom_fields = [...((p.personal_info as any).custom_fields || [])];
      custom_fields.push({ label: "", value: "", type: "text" });
      return {
        ...p,
        personal_info: {
          ...p.personal_info,
          custom_fields,
        },
      };
    });
  };

  const updateCustomField = (index: number, key: "label" | "value" | "type", val: string) => {
    setResumeData((p) => {
      const custom_fields = [...((p.personal_info as any).custom_fields || [])];
      if (custom_fields[index]) {
        custom_fields[index] = {
          ...custom_fields[index],
          [key]: val,
        };
      }
      return {
        ...p,
        personal_info: {
          ...p.personal_info,
          custom_fields,
        },
      };
    });
  };

  const removeCustomField = (index: number) => {
    setResumeData((p) => {
      const custom_fields = [...((p.personal_info as any).custom_fields || [])].filter((_, i) => i !== index);
      return {
        ...p,
        personal_info: {
          ...p.personal_info,
          custom_fields,
        },
      };
    });
  };

  const updateStyleConfig = (field: string, value: string) =>
    setResumeData((p) => ({
      ...p,
      styles: { ...(p.styles || {}), [field]: value },
    }));

  const addExperience = () =>
    setResumeData((p) => ({
      ...p,
      experience: [
        ...p.experience,
        {
          company: "",
          position: "",
          location: "",
          period: "",
          highlights: [""],
        },
      ],
    }));
  const deleteExperience = (i: number) =>
    setResumeData((p) => ({
      ...p,
      experience: p.experience.filter((_, idx) => idx !== i),
    }));
  const updateExperience = (i: number, field: any, val: any) =>
    setResumeData((p) => {
      const u = [...p.experience];
      u[i] = { ...u[i], [field]: val };
      return { ...p, experience: u };
    });

  const addSkillCategory = () =>
    setResumeData((p) => ({
      ...p,
      skills: [...p.skills, { category: "New Category", items: [] }],
    }));
  const updateSkillGroup = (i: number, cat: string, str: string) =>
    setResumeData((p) => {
      const u = [...p.skills];
      u[i] = {
        category: cat,
        items: str
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      return { ...p, skills: u };
    });

  const addEducation = () =>
    setResumeData((p) => ({
      ...p,
      education: [
        ...p.education,
        { institution: "", degree: "", period: "", location: "" },
      ],
    }));
  const deleteEducation = (i: number) =>
    setResumeData((p) => ({
      ...p,
      education: p.education.filter((_, idx) => idx !== i),
    }));
  const updateEducation = (i: number, field: any, val: any) =>
    setResumeData((p) => {
      const u = [...p.education];
      u[i] = { ...u[i], [field]: val };
      return { ...p, education: u };
    });

  const addProject = () =>
    setResumeData((p) => ({
      ...p,
      projects: [
        ...p.projects,
        { name: "", description: "", link: "", highlights: [""] },
      ],
    }));
  const deleteProject = (i: number) =>
    setResumeData((p) => ({
      ...p,
      projects: p.projects.filter((_, idx) => idx !== i),
    }));
  const updateProject = (i: number, field: any, val: any) =>
    setResumeData((p) => {
      const u = [...p.projects];
      u[i] = { ...u[i], [field]: val };
      return { ...p, projects: u };
    });

  const addCertification = () =>
    setResumeData((p) => ({ ...p, certifications: [...p.certifications, ""] }));
  const updateCertification = (i: number, val: string) =>
    setResumeData((p) => {
      const u = [...p.certifications];
      u[i] = val;
      return { ...p, certifications: u };
    });
  const deleteCertification = (i: number) =>
    setResumeData((p) => ({
      ...p,
      certifications: p.certifications.filter((_, idx) => idx !== i),
    }));

  const applyRefactor = (original: string, improved: string) => {
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    const normalizedOriginal = normalize(original);
    const normalizedImproved = normalize(improved);
    const originalWords = normalizedOriginal.split(" ").filter(Boolean);
    let bestMatch = { type: "", parentIdx: -1, bulletIdx: -1, score: 0 };
    const getScore = (nh: string) => {
      if (!nh || !normalizedOriginal) return 0;
      if (
        nh === normalizedOriginal ||
        normalizedOriginal.includes(nh) ||
        nh.includes(normalizedOriginal)
      )
        return 1;
      const nhWords = nh.split(" ").filter(Boolean);
      if (!nhWords.length || !originalWords.length) return 0;
      return (
        originalWords.filter((w) => nhWords.includes(w)).length /
        Math.max(originalWords.length, nhWords.length)
      );
    };
    resumeData.experience.forEach((job, pi) =>
      job.highlights.forEach((h, bi) => {
        const s = getScore(normalize(h));
        if (s > bestMatch.score)
          bestMatch = {
            type: "experience",
            parentIdx: pi,
            bulletIdx: bi,
            score: s,
          };
      }),
    );
    resumeData.projects.forEach((proj, pi) =>
      (proj.highlights || []).forEach((h, bi) => {
        const s = getScore(normalize(h));
        if (s > bestMatch.score)
          bestMatch = {
            type: "projects",
            parentIdx: pi,
            bulletIdx: bi,
            score: s,
          };
      }),
    );
    setAppliedSuggestions((p) =>
      p.includes(normalizedImproved) ? p : [...p, normalizedImproved],
    );
    if (bestMatch.score > 0.45) {
      setResumeData((prev) => {
        const next = { ...prev };
        if (bestMatch.type === "experience") {
          const u = [...next.experience];
          const j = { ...u[bestMatch.parentIdx] };
          const hl = [...j.highlights];
          hl[bestMatch.bulletIdx] = improved;
          j.highlights = hl;
          u[bestMatch.parentIdx] = j;
          next.experience = u;
        } else if (bestMatch.type === "projects") {
          const u = [...next.projects];
          const pr = { ...u[bestMatch.parentIdx] };
          const hl = [...(pr.highlights || [])];
          hl[bestMatch.bulletIdx] = improved;
          pr.highlights = hl;
          u[bestMatch.parentIdx] = pr;
          next.projects = u;
        }
        return next;
      });
      toast({ title: "Suggestion Applied ✅" });
    } else {
      navigator.clipboard.writeText(improved);
      toast({
        title: "Copied to Clipboard",
        description: "Paste manually — couldn't auto-match.",
      });
    }
  };

  /* ─── ACTIVE TAB META ───────────────────────────────────────────── */
  const activeTabMeta = NAV_TABS.find((t) => t.id === activeTab) || NAV_TABS[0];

  /* ─── INPUT / TEXTAREA SHARED CLASSES ──────────────────────────── */
  const inputCls =
    "bg-zinc-50 dark:bg-white/[0.02] focus:bg-white dark:focus:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06] focus:border-indigo-400/50 dark:focus:border-indigo-400/40 focus:ring-0 text-zinc-800 dark:text-zinc-200 rounded-xl h-11 px-4 transition-all text-sm shadow-sm";
  const textareaCls =
    "bg-zinc-50 dark:bg-white/[0.02] focus:bg-white dark:focus:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06] focus:border-indigo-400/50 dark:focus:border-indigo-400/40 focus:ring-0 text-zinc-800 dark:text-zinc-200 rounded-xl px-4 py-3 leading-relaxed transition-all text-sm resize-none";
  const labelCls =
    "text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400 ml-0.5";



  return (
    <div className="h-screen flex flex-col bg-zinc-50 dark:bg-[#08080c] text-foreground overflow-hidden">
      {/* ══════════════ HEADER BAR ══════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#09090d]/80 backdrop-blur-xl border-b border-zinc-200/80 dark:border-white/[0.05] shrink-0">
        <div className="flex items-center justify-between px-5 h-14 gap-4">
          {/* LEFT: Breadcrumb + Name */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate("/dashboard/hired")}
              className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/[0.08] transition-all shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>

            <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-black tracking-[0.2em] text-zinc-400 uppercase select-none">
              <span>Get Hired</span>
              <ChevronRight className="h-2.5 w-2.5 opacity-40" />
              <span className="text-zinc-600 dark:text-zinc-300">
                Workspace
              </span>
            </div>

            <div className="w-px h-4 bg-zinc-200 dark:bg-white/[0.08] hidden sm:block" />

            <h1 className="text-sm font-black tracking-tight text-foreground truncate max-w-[160px] sm:max-w-[240px]">
              {resumeData.personal_info.name || "Untitled Resume"}
            </h1>

            {/* Save status */}
            {saveStatus === "saving" && (
              <div className="flex items-center gap-1 text-indigo-400 animate-pulse">
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                <span className="text-[8px] font-black uppercase tracking-wider hidden sm:inline">
                  Saving
                </span>
              </div>
            )}
            {saveStatus === "saved" && (
              <div className="flex items-center gap-1 text-emerald-500/70">
                <ShieldCheck className="h-3 w-3" />
                <span className="text-[8px] font-black uppercase tracking-wider hidden sm:inline">
                  Synced
                </span>
              </div>
            )}
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleClearWorkspace}
              className="hidden sm:flex h-8 px-3 rounded-lg text-[10px] font-bold text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/5 transition-all items-center gap-1.5 uppercase tracking-wide"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>

            <button
              onClick={handleBackupToVault}
              disabled={isBackingUp}
              className="hidden sm:flex h-8 px-3 rounded-lg text-[10px] font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-all items-center gap-1.5 uppercase tracking-wide"
            >
              {isBackingUp ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <History className="h-3 w-3" />
              )}
              Backup
            </button>

            <div className="w-px h-4 bg-zinc-200 dark:bg-white/[0.08] hidden sm:block mx-1" />

            <button
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setRightPanelTab("ai");
                  toast({
                    title: "AI Analysis Mode Active",
                    description:
                      "Review and calibrate your ATS scores in the side panel.",
                  });
                } else {
                  setIsAiPanelOpen(true);
                }
              }}
              className="h-8 px-3.5 rounded-lg text-[10px] font-black bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 transition-all flex items-center gap-1.5 uppercase tracking-wide"
            >
              <Sparkles className="h-3 w-3 animate-pulse" /> Optimize Resume
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={isDownloading || isPreviewLoading}
                  className="h-8 px-4 rounded-lg text-[10px] font-black bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all flex items-center gap-1.5 uppercase tracking-widest shadow-sm border-none disabled:opacity-50"
                >
                  <Download className="h-3 w-3" /> Download
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.1] rounded-xl shadow-xl text-sm">
                <DropdownMenuItem
                  onClick={handleExportPdf}
                  className="font-semibold text-xs py-2.5 gap-2 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 opacity-50" /> PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExportWord}
                  className="font-semibold text-xs py-2.5 gap-2 cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5 opacity-50" /> Word (.docx)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExportLatex}
                  className="font-semibold text-xs py-2.5 gap-2 cursor-pointer text-indigo-600 dark:text-indigo-300"
                >
                  <Sparkles className="w-3.5 h-3.5 opacity-60" /> LaTeX (.tex)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ══════════════ ONBOARDING BANNER ═══════════════════════════ */}
      <AnimatePresence>
        {showOnboarding && !isResumeBlank && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden shrink-0"
          >
            <div className="px-5 py-4 bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50 dark:from-indigo-500/[0.06] dark:via-violet-500/[0.04] dark:to-purple-500/[0.06] border-b border-indigo-100 dark:border-indigo-500/10">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                      {uploadSource === "fresh_upload"
                        ? "Resume uploaded & parsed!"
                        : uploadSource === "template"
                          ? "Template loaded!"
                          : "Welcome to your workspace!"}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      {
                        label: "ATS Score",
                        desc: "Check compatibility",
                        icon: Trophy,
                        action: () => {
                          setRightPanelTab("ai");
                          if (window.innerWidth < 1024) setIsAiPanelOpen(true);
                        },
                      },
                      {
                        label: "AI Optimize",
                        desc: "Enhance bullet points",
                        icon: Sparkles,
                        action: () => {
                          setRightPanelTab("ai");
                          if (window.innerWidth < 1024) setIsAiPanelOpen(true);
                          handleOptimizeBullets();
                        },
                      },
                      {
                        label: "Edit Details",
                        desc: "Fine-tune sections",
                        icon: User,
                        action: () => {
                          setActiveTab("personal");
                        },
                      },
                      {
                        label: "Export PDF",
                        desc: "Download resume",
                        icon: Download,
                        action: () => {
                          handleExportPdf();
                        },
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          onClick={item.action}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/70 dark:bg-white/[0.04] border border-indigo-100 dark:border-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/25 transition-all text-left group"
                        >
                          <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Icon className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 truncate">
                              {item.label}
                            </p>
                            <p className="text-[9px] text-zinc-500 truncate">
                              {item.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  onClick={() => setShowOnboarding(false)}
                  className="h-6 w-6 rounded-lg bg-zinc-200/60 dark:bg-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all shrink-0 mt-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════ BODY: TWO-PAGE SPLIT ════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── PAGE 1 — LEFT SIDEBAR NAV + FORM ────────────────────── */}
        <div className="flex flex-1 min-w-0 overflow-hidden">
          {/* Vertical Nav Rail */}
          <nav className="hidden lg:flex flex-col w-[72px] xl:w-[200px] shrink-0 border-r border-zinc-200 dark:border-white/[0.05] bg-white dark:bg-[#09090d] py-6 px-3 gap-1 overflow-y-auto">
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                    isActive
                      ? `bg-zinc-100 dark:bg-white/[0.06] text-zinc-900 dark:text-white ring-1 ${tab.ring}`
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
                  }`}
                >
                  <div
                    className={`shrink-0 ${isActive ? tab.color : "text-zinc-400 group-hover:text-zinc-500"}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="hidden xl:block text-[11px] font-bold tracking-wide truncate">
                    {tab.label}
                  </span>
                  {isActive && (
                    <div
                      className={`hidden xl:block ml-auto h-1.5 w-1.5 rounded-full ${tab.dot} shrink-0`}
                    />
                  )}
                </button>
              );
            })}

            {/* Divider + extra actions for mobile-hidden toolbar */}
            <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-white/[0.04] flex flex-col gap-1">
              <button
                onClick={handleClearWorkspace}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/5 transition-all text-left"
              >
                <RotateCcw className="h-4 w-4 shrink-0" />
                <span className="hidden xl:block text-[11px] font-bold tracking-wide">
                  Reset
                </span>
              </button>
              <button
                onClick={handleBackupToVault}
                disabled={isBackingUp}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/[0.03] transition-all text-left"
              >
                {isBackingUp ? (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                ) : (
                  <History className="h-4 w-4 shrink-0" />
                )}
                <span className="hidden xl:block text-[11px] font-bold tracking-wide">
                  Backup
                </span>
              </button>
            </div>
          </nav>

          {/* Mobile Tab Strip */}
          <div className="lg:hidden w-full flex gap-1 px-4 pt-3 pb-0 border-b border-zinc-200 dark:border-white/[0.05] bg-white dark:bg-[#09090d] overflow-x-auto shrink-0 absolute top-14 left-0 right-0 z-30">
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[10px] font-bold whitespace-nowrap border-b-2 transition-all ${
                    isActive
                      ? `border-indigo-500 text-zinc-900 dark:text-white bg-zinc-50 dark:bg-white/[0.03]`
                      : "border-transparent text-zinc-500"
                  }`}
                >
                  <Icon className={`h-3 w-3 ${isActive ? tab.color : ""}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Form Content Area */}
          <div className="flex-1 overflow-y-auto px-5 lg:px-8 py-7 lg:py-8 mt-10 lg:mt-0 bg-zinc-50 dark:bg-[#08080c]">
            <div className="max-w-2xl mx-auto space-y-5">
              {/* Section Header */}
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-3 mb-6"
              >
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center border ${activeTabMeta.color} bg-white dark:bg-white/[0.03] border-zinc-200 dark:border-white/[0.08] shadow-sm`}
                >
                  <activeTabMeta.icon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900 dark:text-white tracking-tight leading-none">
                    {activeTabMeta.label}
                  </h2>
                  <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                    {activeTab === "personal" &&
                      "Contact info and professional summary"}
                    {activeTab === "experience" &&
                      "Work history and impact highlights"}
                    {activeTab === "education" &&
                      "Degrees and academic institutions"}
                    {activeTab === "skills" &&
                      "Tech stacks, projects, and certifications"}
                    {activeTab === "design" && "Typography and color theme"}
                    {activeTab === "coverletter" &&
                      "AI-generated tailored cover letter"}
                    {activeTab === "tailor" &&
                      "Optimize & tailor your resume to any Job Description with AI"}
                  </p>
                </div>
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* ── PERSONAL ───────────────────────────────────── */}
                  {activeTab === "personal" && (
                    <>
                      <SectionCard>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {[
                            {
                              field: "name",
                              label: "Full Name",
                              placeholder: "Your full name",
                            },
                            {
                              field: "email",
                              label: "Email Address",
                              placeholder: "you@email.com",
                            },
                            {
                              field: "phone",
                              label: "Phone Number",
                              placeholder: "+1 234 567 8900",
                            },
                            {
                              field: "website",
                              label: "Website / Link",
                              placeholder: "github.com/alias",
                            },
                          ].map(({ field, label, placeholder }) => (
                            <div key={field} className="space-y-1.5 text-left">
                              <Label className={labelCls}>{label}</Label>
                              <Input
                                value={(resumeData.personal_info as any)[field]}
                                onChange={(e) =>
                                  updatePersonalInfo(
                                    field as any,
                                    e.target.value,
                                  )
                                }
                                placeholder={placeholder}
                                className={inputCls}
                              />
                            </div>
                          ))}
                        </div>
                      </SectionCard>

                      {/* Custom Personal Fields Card */}
                      <SectionCard>
                        <div className="flex items-center justify-between mb-3 text-left">
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">
                              Custom Fields
                            </h4>
                            <p className="text-[9px] text-zinc-400 mt-0.5 font-semibold">
                              Add items like LinkedIn, GitHub, Clearance, Nationality, etc.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={addCustomField}
                            className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[10px] font-black uppercase bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-white transition-all shadow-sm"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add Field
                          </button>
                        </div>

                        {(!resumeData.personal_info.custom_fields ||
                          resumeData.personal_info.custom_fields.length === 0) ? (
                          <div className="text-center py-6 text-zinc-400 text-[10px] border border-dashed border-zinc-200 dark:border-white/[0.06] rounded-xl font-medium">
                            No custom contact fields added.
                          </div>
                        ) : (
                          <div className="space-y-3.5">
                            {resumeData.personal_info.custom_fields.map((field, idx) => (
                              <div key={idx} className="flex items-end gap-2 animate-fade-in">
                                <div className="flex-1 space-y-1.5 text-left">
                                  <Label className={labelCls}>Field Label</Label>
                                  <Input
                                    value={field.label}
                                    onChange={(e) =>
                                      updateCustomField(idx, "label", e.target.value)
                                    }
                                    placeholder="e.g. GitHub, Clearance"
                                    className={inputCls}
                                  />
                                </div>
                                <div className="w-24 space-y-1.5 text-left">
                                  <Label className={labelCls}>Type</Label>
                                  <select
                                    value={field.type || "text"}
                                    onChange={(e) =>
                                      updateCustomField(idx, "type", e.target.value as any)
                                    }
                                    className="w-full h-9 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] text-zinc-800 dark:text-zinc-200 px-2 py-1 text-xs focus:ring-0 focus:border-indigo-400 focus:outline-none"
                                  >
                                    <option value="text">Text</option>
                                    <option value="link">Link</option>
                                    <option value="email">Email</option>
                                  </select>
                                </div>
                                <div className="flex-[2] space-y-1.5 text-left">
                                  <Label className={labelCls}>Field Value</Label>
                                  <Input
                                    value={field.value}
                                    onChange={(e) =>
                                      updateCustomField(idx, "value", e.target.value)
                                    }
                                    placeholder="e.g. github.com/alias, Secret"
                                    className={inputCls}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeCustomField(idx)}
                                  className="h-9 w-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-zinc-200 dark:border-white/[0.08] transition-all mb-[1px]"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </SectionCard>
                      <SectionCard>
                        <div className="space-y-1.5 text-left">
                          <Label className={labelCls}>
                            Professional Summary
                          </Label>
                          <Textarea
                            value={resumeData.personal_info.summary}
                            onChange={(e) =>
                              updatePersonalInfo("summary", e.target.value)
                            }
                            placeholder="A brief overview of your professional background and core strengths."
                            className={`${textareaCls} min-h-[120px]`}
                          />
                        </div>
                      </SectionCard>
                    </>
                  )}

                  {/* ── EXPERIENCE ─────────────────────────────────── */}
                  {activeTab === "experience" && (
                    <>
                      <div className="flex justify-end">
                        <button
                          onClick={addExperience}
                          className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[10px] font-bold bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-500/20 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-all uppercase tracking-wide"
                        >
                          <Plus className="h-3 w-3" /> Add Role
                        </button>
                      </div>
                      {resumeData.experience.length === 0 ? (
                        <EmptyState label="No work history yet — add your first role" />
                      ) : (
                        resumeData.experience.map((exp, idx) => (
                          <SectionCard key={idx}>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-1">
                                Role {idx + 1}
                              </span>
                              <button
                                onClick={() => deleteExperience(idx)}
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                              {[
                                {
                                  f: "company",
                                  l: "Company",
                                  ph: "e.g., Stripe",
                                },
                                {
                                  f: "position",
                                  l: "Position/Title",
                                  ph: "Staff Software Engineer",
                                },
                                {
                                  f: "period",
                                  l: "Dates",
                                  ph: "Jan 2022 – Present",
                                },
                                {
                                  f: "location",
                                  l: "Location",
                                  ph: "San Francisco, CA",
                                },
                              ].map(({ f, l, ph }) => (
                                <div key={f} className="space-y-1.5 text-left">
                                  <Label className={labelCls}>{l}</Label>
                                  <Input
                                    value={(exp as any)[f]}
                                    onChange={(e) =>
                                      updateExperience(idx, f, e.target.value)
                                    }
                                    placeholder={ph}
                                    className={inputCls}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="space-y-2 text-left">
                              <Label
                                className={`${labelCls} flex items-center gap-1.5`}
                              >
                                <Sparkles className="h-2.5 w-2.5 text-sky-400" />{" "}
                                Achievements
                              </Label>
                              <div className="space-y-2">
                                {exp.highlights.map((b, bi) => (
                                  <div
                                    key={bi}
                                    className="flex gap-2 group/blt items-start"
                                  >
                                    <Textarea
                                      value={b}
                                      onChange={(e) => {
                                        const n = [...exp.highlights];
                                        n[bi] = e.target.value;
                                        updateExperience(idx, "highlights", n);
                                      }}
                                      className={`${textareaCls} min-h-[60px] flex-1`}
                                      placeholder="Increased throughput by 3× via async pipeline redesign..."
                                    />
                                    <button
                                      onClick={() => {
                                        updateExperience(
                                          idx,
                                          "highlights",
                                          exp.highlights.filter(
                                            (_, i) => i !== bi,
                                          ),
                                        );
                                      }}
                                      className="h-8 w-8 mt-1 shrink-0 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover/blt:opacity-100 transition-all"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={() =>
                                  updateExperience(idx, "highlights", [
                                    ...exp.highlights,
                                    "",
                                  ])
                                }
                                className="flex items-center gap-1.5 text-[10px] font-bold text-sky-500 hover:text-sky-600 transition-all mt-1"
                              >
                                <Plus className="h-3 w-3" /> Add Bullet
                              </button>
                            </div>
                          </SectionCard>
                        ))
                      )}
                    </>
                  )}

                  {/* ── EDUCATION ──────────────────────────────────── */}
                  {activeTab === "education" && (
                    <>
                      <div className="flex justify-end">
                        <button
                          onClick={addEducation}
                          className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all uppercase tracking-wide"
                        >
                          <Plus className="h-3 w-3" /> Add Degree
                        </button>
                      </div>
                      {resumeData.education.length === 0 ? (
                        <EmptyState label="No education records yet" />
                      ) : (
                        resumeData.education.map((edu, idx) => (
                          <SectionCard key={idx}>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-1">
                                Institution {idx + 1}
                              </span>
                              <button
                                onClick={() => deleteEducation(idx)}
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                              {[
                                {
                                  f: "institution",
                                  l: "Institution",
                                  ph: "Stanford University",
                                },
                                {
                                  f: "degree",
                                  l: "Degree",
                                  ph: "B.S. Computer Science",
                                },
                                {
                                  f: "period",
                                  l: "Term Period",
                                  ph: "2018 – 2022",
                                },
                                {
                                  f: "location",
                                  l: "City / Country",
                                  ph: "Stanford, CA",
                                },
                              ].map(({ f, l, ph }) => (
                                <div key={f} className="space-y-1.5 text-left">
                                  <Label className={labelCls}>{l}</Label>
                                  <Input
                                    value={(edu as any)[f]}
                                    onChange={(e) =>
                                      updateEducation(idx, f, e.target.value)
                                    }
                                    placeholder={ph}
                                    className={inputCls}
                                  />
                                </div>
                              ))}
                            </div>
                          </SectionCard>
                        ))
                      )}
                    </>
                  )}

                  {/* ── SKILLS ─────────────────────────────────────── */}
                  {activeTab === "skills" && (
                    <>
                      {/* Skills */}
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          Skill Categories
                        </p>
                        <button
                          onClick={addSkillCategory}
                          className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[10px] font-bold bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20 hover:bg-purple-100 transition-all uppercase tracking-wide"
                        >
                          <Plus className="h-3 w-3" /> Category
                        </button>
                      </div>
                      <div className="space-y-2.5">
                        {resumeData.skills.map((skill, idx) => (
                          <SectionCard key={idx}>
                            <div className="flex gap-3 items-start">
                              <div className="w-1/3 space-y-1.5">
                                <Label className={labelCls}>Category</Label>
                                <Input
                                  value={skill.category}
                                  onChange={(e) =>
                                    updateSkillGroup(
                                      idx,
                                      e.target.value,
                                      skill.items.join(", "),
                                    )
                                  }
                                  placeholder="Languages"
                                  className={inputCls}
                                />
                              </div>
                              <div className="flex-1 space-y-1.5">
                                <Label className={labelCls}>
                                  Items (comma separated)
                                </Label>
                                <Input
                                  value={skill.items.join(", ")}
                                  onChange={(e) =>
                                    updateSkillGroup(
                                      idx,
                                      skill.category,
                                      e.target.value,
                                    )
                                  }
                                  placeholder="TypeScript, Rust, Python…"
                                  className={inputCls}
                                />
                              </div>
                              <button
                                onClick={() =>
                                  setResumeData((p) => ({
                                    ...p,
                                    skills: p.skills.filter(
                                      (_, i) => i !== idx,
                                    ),
                                  }))
                                }
                                className="h-9 w-9 mt-6 shrink-0 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </SectionCard>
                        ))}
                      </div>

                      {/* Projects */}
                      <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-white/[0.05] mt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          Key Projects
                        </p>
                        <button
                          onClick={addProject}
                          className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[10px] font-bold bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-500/20 hover:bg-sky-100 transition-all uppercase tracking-wide"
                        >
                          <Plus className="h-3 w-3" /> Project
                        </button>
                      </div>
                      {resumeData.projects.length === 0 ? (
                        <EmptyState label="No projects added yet" />
                      ) : (
                        resumeData.projects.map((proj, idx) => (
                          <SectionCard key={idx}>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-1">
                                Project {idx + 1}
                              </span>
                              <button
                                onClick={() => deleteProject(idx)}
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5 text-left">
                                <Label className={labelCls}>Title</Label>
                                <Input
                                  value={proj.name}
                                  onChange={(e) =>
                                    updateProject(idx, "name", e.target.value)
                                  }
                                  placeholder="Task Scheduler Suite"
                                  className={inputCls}
                                />
                              </div>
                              <div className="space-y-1.5 text-left">
                                <Label className={labelCls}>
                                  Link{" "}
                                  <span className="opacity-40">(optional)</span>
                                </Label>
                                <Input
                                  value={proj.link}
                                  onChange={(e) =>
                                    updateProject(idx, "link", e.target.value)
                                  }
                                  placeholder="github.com/owner/repo"
                                  className={inputCls}
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5 text-left">
                              <Label className={labelCls}>Description</Label>
                              <Input
                                value={proj.description}
                                onChange={(e) =>
                                  updateProject(
                                    idx,
                                    "description",
                                    e.target.value,
                                  )
                                }
                                placeholder="High-performance workflow engine…"
                                className={inputCls}
                              />
                            </div>
                            <div className="space-y-2 text-left">
                              <Label className={labelCls}>Highlights</Label>
                              <div className="space-y-2">
                                {proj.highlights?.map((b, bi) => (
                                  <div
                                    key={bi}
                                    className="flex gap-2 group/pb items-center"
                                  >
                                    <Input
                                      value={b}
                                      onChange={(e) => {
                                        const n = [...(proj.highlights || [])];
                                        n[bi] = e.target.value;
                                        updateProject(idx, "highlights", n);
                                      }}
                                      className={`${inputCls} flex-1`}
                                      placeholder="Achieved 40% latency reduction…"
                                    />
                                    <button
                                      onClick={() =>
                                        updateProject(
                                          idx,
                                          "highlights",
                                          proj.highlights.filter(
                                            (_, i) => i !== bi,
                                          ),
                                        )
                                      }
                                      className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover/pb:opacity-100 transition-all"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={() =>
                                  updateProject(idx, "highlights", [
                                    ...(proj.highlights || []),
                                    "",
                                  ])
                                }
                                className="flex items-center gap-1.5 text-[10px] font-bold text-sky-500 hover:text-sky-600 transition-all mt-1"
                              >
                                <Plus className="h-3 w-3" /> Add Highlight
                              </button>
                            </div>
                          </SectionCard>
                        ))
                      )}

                      {/* Certifications */}
                      <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-white/[0.05] mt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          Certifications
                        </p>
                        <button
                          onClick={addCertification}
                          className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 transition-all uppercase tracking-wide"
                        >
                          <Plus className="h-3 w-3" /> Add Cert
                        </button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {resumeData.certifications.map((cert, idx) => (
                          <div
                            key={idx}
                            className="flex gap-2 items-center group/cert bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] rounded-xl px-3 py-2 shadow-sm"
                          >
                            <Trophy className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                            <Input
                              value={cert}
                              onChange={(e) =>
                                updateCertification(idx, e.target.value)
                              }
                              placeholder="AWS Architect Associate"
                              className="border-none bg-transparent focus:ring-0 text-sm h-8 flex-1 px-1 text-zinc-800 dark:text-zinc-200"
                            />
                            <button
                              onClick={() => deleteCertification(idx)}
                              className="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover/cert:opacity-100 transition-all"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* ── DESIGN ─────────────────────────────────────── */}
                  {activeTab === "design" && (
                    <>
                      <SectionCard>
                        <Label className={labelCls}>Color Theme</Label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          {[
                            {
                              name: "Classic Navy",
                              primary: "#1A365D",
                              accent: "#3182CE",
                            },
                            {
                              name: "Modern Emerald",
                              primary: "#065F46",
                              accent: "#059669",
                            },
                            {
                              name: "Ruby Burgundy",
                              primary: "#7F1D1D",
                              accent: "#DC2626",
                            },
                            {
                              name: "Deep Onyx",
                              primary: "#111827",
                              accent: "#4B5563",
                            },
                          ].map((theme) => {
                            const sel =
                              (resumeData.styles?.primaryColor || "#1A365D") ===
                              theme.primary;
                            return (
                              <button
                                key={theme.name}
                                onClick={() => {
                                  updateStyleConfig(
                                    "primaryColor",
                                    theme.primary,
                                  );
                                  updateStyleConfig(
                                    "accentColor",
                                    theme.accent,
                                  );
                                }}
                                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${sel ? "border-indigo-400/50 bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-400/30" : "border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] hover:border-zinc-300 dark:hover:border-white/[0.1]"}`}
                              >
                                <div
                                  className="h-7 w-7 rounded-full shrink-0 shadow-md flex items-center justify-center"
                                  style={{ backgroundColor: theme.primary }}
                                >
                                  {sel && (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                  )}
                                </div>
                                <span
                                  className={`text-xs font-bold ${sel ? "text-zinc-900 dark:text-white" : "text-zinc-500"}`}
                                >
                                  {theme.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </SectionCard>
                      <SectionCard>
                        <Label className={labelCls}>Font Family</Label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          {[
                            {
                              id: "Sans",
                              name: "Sans-Serif",
                              cls: "font-sans font-bold",
                            },
                            {
                              id: "Serif",
                              name: "Serif Modern",
                              cls: "font-serif font-black",
                            },
                          ].map((font) => {
                            const sel =
                              (resumeData.styles?.fontFamily || "Sans") ===
                              font.id;
                            return (
                              <button
                                key={font.id}
                                onClick={() =>
                                  updateStyleConfig("fontFamily", font.id)
                                }
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${sel ? "border-indigo-400/50 bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-400/30 text-zinc-900 dark:text-white" : "border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] text-zinc-500 hover:border-zinc-300"}`}
                              >
                                <span
                                  className={`text-3xl leading-none ${font.cls}`}
                                >
                                  Aa
                                </span>
                                <span className="text-[11px] font-bold">
                                  {font.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </SectionCard>
                    </>
                  )}

                  {/* ── COVER LETTER ───────────────────────────────── */}
                  {activeTab === "coverletter" && (
                    <>
                      <SectionCard>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">
                              AI Cover Letter
                            </p>
                            <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                              Generated from your resume + job description
                            </p>
                          </div>
                          <button
                            disabled={isGeneratingCL || !jobDescription}
                            onClick={handleGenerateCoverLetter}
                            className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 uppercase tracking-wide shrink-0"
                          >
                            {isGeneratingCL ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5" />
                            )}
                            {coverLetter ? "Regenerate" : "Generate"}
                          </button>
                        </div>
                      </SectionCard>

                      {!coverLetter ? (
                        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-200 dark:border-white/[0.06] rounded-2xl gap-4 text-zinc-400 bg-white/40 dark:bg-white/[0.005]">
                          <Sparkles className="h-8 w-8 opacity-30" />
                          <div className="text-center space-y-1">
                            <p className="text-sm font-bold text-zinc-500">
                              Your tailored letter is one click away
                            </p>
                            <p className="text-xs text-zinc-400 max-w-[260px] leading-relaxed">
                              {!jobDescription
                                ? "Add a Job Description in the AI Tools panel first."
                                : "Click Generate to create your letter."}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <SectionCard>
                          <Textarea
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            className={`${textareaCls} min-h-[420px] font-serif text-sm leading-[1.85]`}
                          />
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                              {coverLetter.split(" ").length} words · AI Draft
                            </span>
                            <button
                              onClick={() => setCoverLetter(null)}
                              className="text-xs font-bold text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-all"
                            >
                              Discard
                            </button>
                          </div>
                        </SectionCard>
                      )}
                    </>
                  )}

                  {/* ── ATS MATCH & TAILOR AI ─────────────────────── */}
                  {activeTab === "tailor" && (
                    <>
                      <SectionCard>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-block text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2.5 py-1 rounded-lg">
                              Step 1: Upload Current Resume
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500">
                            Upload your existing resume in PDF or DOCX format. We will extract and parse its contents using our secure, sandbox-native parsing engine.
                          </p>
                          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-200 dark:border-white/[0.08] hover:border-indigo-400/50 rounded-2xl bg-zinc-50/50 dark:bg-white/[0.01] transition-all relative">
                            {tailorFile ? (
                              <div className="text-center space-y-2">
                                <FileText className="h-8 w-8 text-indigo-500 mx-auto animate-bounce" />
                                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                  {tailorFile.name}
                                </p>
                                <p className="text-[10px] text-zinc-400">
                                  {(tailorFile.size / 1024 / 1024).toFixed(2)} MB · Ready
                                </p>
                                <button
                                  onClick={() => setTailorFile(null)}
                                  className="text-[10px] font-black text-red-500 hover:text-red-600 transition-all uppercase tracking-wide pt-1"
                                >
                                  Remove File
                                </button>
                              </div>
                            ) : (
                              <div className="text-center space-y-2">
                                <Plus className="h-8 w-8 text-zinc-400 mx-auto opacity-60" />
                                <p className="text-xs font-bold text-zinc-500">
                                  Select Resume PDF or DOCX
                                </p>
                                <p className="text-[10px] text-zinc-400">
                                  Max size 5MB
                                </p>
                                <input
                                  type="file"
                                  accept=".pdf,.docx"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      setTailorFile(e.target.files[0]);
                                    }
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </SectionCard>

                      <SectionCard>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-block text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2.5 py-1 rounded-lg">
                              Step 2: Enter Target Job Description
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500">
                            Paste the full target job posting or description. Our resilient AI models will identify core keywords, required skills, and key qualifications.
                          </p>
                          <Textarea
                            value={tailorJd}
                            onChange={(e) => setTailorJd(e.target.value)}
                            placeholder="Paste the target job description here..."
                            className={`${textareaCls} min-h-[160px] text-xs leading-relaxed`}
                          />
                        </div>
                      </SectionCard>

                      <div className="flex justify-end pt-2">
                        <button
                          disabled={isTailoring || !tailorFile || !tailorJd}
                          onClick={handleTailorResume}
                          className="flex items-center gap-2.5 h-11 px-6 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                        >
                          {isTailoring ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          {isTailoring ? "Tailoring & Compiling..." : "Run ATS Match & Tailor"}
                        </button>
                      </div>

                      {tailorResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-5 pt-4"
                        >
                          {/* ATS Score & Action Card */}
                          <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 to-indigo-950 text-white border border-zinc-800 shadow-xl space-y-5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                              <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full border-4 border-indigo-400/20 border-t-indigo-400 flex items-center justify-center shrink-0">
                                  <span className="text-xl font-black text-indigo-300">
                                    {tailorResult.ats_score}%
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs font-black uppercase tracking-wider text-indigo-400">
                                    ATS Match Rating
                                  </p>
                                  <p className="text-sm font-bold leading-tight">
                                    Your tailored resume has been aligned successfully!
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={handleDownloadTailoredPdf}
                                  className="h-9 px-4 rounded-lg text-[10px] font-black uppercase bg-indigo-500 hover:bg-indigo-600 text-white transition-all"
                                >
                                  Download PDF
                                </button>
                                <button
                                  onClick={handleApplyTailoredResume}
                                  className="h-9 px-4 rounded-lg text-[10px] font-black uppercase bg-white hover:bg-zinc-100 text-zinc-900 transition-all"
                                >
                                  Apply to Workspace
                                </button>
                              </div>
                            </div>

                            <div className="border-t border-white/[0.08] pt-4">
                              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                                Executive AI Summary
                              </p>
                              <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                                {tailorResult.general_feedback}
                              </p>
                            </div>
                          </div>

                          {/* Keywords Aligned */}
                          {tailorResult.missing_keywords && tailorResult.missing_keywords.length > 0 && (
                            <SectionCard>
                              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                Keywords Integrated
                              </p>
                              <div className="flex flex-wrap gap-1.5 pt-2">
                                {tailorResult.missing_keywords.map((kw: string) => (
                                  <span
                                    key={kw}
                                    className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20"
                                  >
                                    + {kw}
                                  </span>
                                ))}
                              </div>
                            </SectionCard>
                          )}

                          {/* Bullet Point Suggestions */}
                          {tailorResult.bullet_point_suggestions && tailorResult.bullet_point_suggestions.length > 0 && (
                            <SectionCard>
                              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                Highlight Enhancements (Google XYZ Formula)
                              </p>
                              <div className="space-y-4 pt-3 divide-y divide-zinc-100 dark:divide-white/[0.04]">
                                {tailorResult.bullet_point_suggestions.map((sug: any, idx: number) => (
                                  <div key={idx} className={`space-y-2 ${idx > 0 ? "pt-4" : ""}`}>
                                    <div className="flex items-start gap-2">
                                      <span className="text-[9px] font-black uppercase tracking-wider text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded shrink-0">
                                        Original
                                      </span>
                                      <p className="text-[11px] text-zinc-500 italic">
                                        "{sug.original}"
                                      </p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
                                        Tailored
                                      </span>
                                      <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 leading-relaxed">
                                        "{sug.improved}"
                                      </p>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 font-medium pl-14">
                                      {sug.reason}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </SectionCard>
                          )}
                        </motion.div>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── PAGE 2 — RIGHT: LIVE PREVIEW ─────────────────────────── */}
        <div className="hidden lg:flex w-[420px] xl:w-[480px] 2xl:w-[520px] shrink-0 flex-col border-l border-zinc-200 dark:border-white/[0.05] bg-zinc-100 dark:bg-[#06060a]">
          {isResumeBlank ? (
            /* Onboarding Quickstart View when Resume is Blank */
            <div className="flex-grow flex flex-col justify-between p-6 overflow-y-auto space-y-6 text-left bg-zinc-50 dark:bg-[#09090d]">
              <div className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center shadow-sm">
                    <Sparkles className="h-5 w-5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
                  </div>
                  <h3 className="text-base font-black tracking-tight text-zinc-900 dark:text-white leading-snug">
                    Ready to craft a standout resume?
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                    Get hired faster with real-time ATS optimization. Load our
                    preset tech vanguard template in one click to see how the
                    editor works, or start entering your personal details on the
                    left.
                  </p>
                </div>

                {/* 1-Click Preset Template Card */}
                <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.01] border border-zinc-200/80 dark:border-white/[0.06] shadow-sm space-y-3 hover:border-indigo-400/20 transition-all">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
                      <Trophy className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      1-Click Vanguard Preset
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Instantly fill the workspace with a robust, pre-optimized
                    software engineer draft to experiment with our AI bullet
                    refactors and layouts.
                  </p>
                  <button
                    onClick={() => {
                      setResumeData(PRESET_TEMPLATE);
                      toast({
                        title: "Vanguard Template Loaded!",
                        description:
                          "The workspace has been filled with sample data. Live preview is now ready!",
                      });
                    }}
                    className="w-full h-9 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Load Preset Template
                  </button>
                </div>

                {/* Direct ATS Calibrator */}
                <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.01] border border-zinc-200/85 dark:border-white/[0.05] space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center">
                      <Briefcase className="h-3.5 w-3.5 text-zinc-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      Target Job Calibration
                    </span>
                  </div>
                  <Textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the target job description to pre-calibrate the ATS Scorer..."
                    className={`${textareaCls} min-h-[100px] w-full text-xs`}
                  />
                </div>
              </div>

              {/* Footer hint */}
              <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-white/[0.02] text-center border border-zinc-200/40 dark:border-white/[0.04]">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-zinc-400" /> Live PDF
                  Preview will activate once name is added.
                </p>
              </div>
            </div>
          ) : (
            /* Regular View: Toggle Tabs between Live PDF Preview and AI & ATS */
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 h-12 border-b border-zinc-200 dark:border-white/[0.06] bg-white/80 dark:bg-[#09090d]/80 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2 bg-zinc-100 dark:bg-white/[0.04] rounded-lg p-0.5 border border-zinc-200/60 dark:border-white/[0.05]">
                  <button
                    onClick={() => setRightPanelTab("preview")}
                    className={`h-7 px-3 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${
                      rightPanelTab === "preview"
                        ? "bg-white dark:bg-white/[0.08] text-zinc-900 dark:text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    }`}
                  >
                    <FileText className="h-3 w-3" /> Live PDF
                  </button>
                  <button
                    onClick={() => setRightPanelTab("ai")}
                    className={`h-7 px-3 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${
                      rightPanelTab === "ai"
                        ? "bg-white dark:bg-white/[0.08] text-zinc-900 dark:text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    }`}
                  >
                    <Sparkles className="h-3 w-3" /> AI & ATS
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {rightPanelTab === "preview" ? (
                    <>
                      {previewOutdated && (
                        <span className="text-[8px] font-black text-amber-500 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full animate-pulse uppercase tracking-wider">
                          Outdated
                        </span>
                      )}
                      <button
                        onClick={handleRefreshPreview}
                        disabled={isPreviewLoading}
                        className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[10px] font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/[0.08] transition-all"
                      >
                        {isPreviewLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3 w-3" />
                        )}
                        Refresh
                      </button>
                      <button
                        onClick={handleDownloadFromPreview}
                        disabled={
                          isDownloading || isPreviewLoading || !previewUrl
                        }
                        className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[10px] font-black text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-sm disabled:opacity-40"
                      >
                        {isDownloading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                        PDF
                      </button>
                    </>
                  ) : (
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest select-none">
                      ATS Calibrator
                    </span>
                  )}
                </div>
              </div>

              {/* Main Content Area */}
              {rightPanelTab === "preview" ? (
                /* PDF Preview View */
                <div className="flex-1 overflow-y-auto flex flex-col bg-zinc-200/60 dark:bg-[#050507]">
                  <div className="flex-1 flex items-start justify-center p-5">
                    {isPreviewLoading ? (
                      <div className="flex flex-col items-center justify-center gap-3 py-24 w-full">
                        <div className="relative h-12 w-12">
                          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
                          <div className="h-12 w-12 rounded-full border-2 border-indigo-500/40 flex items-center justify-center">
                            <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
                          </div>
                        </div>
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                          Assembling PDF…
                        </p>
                      </div>
                    ) : previewUrl ? (
                      <div
                        className="w-full max-w-[380px] shadow-2xl rounded-xl overflow-hidden border border-zinc-300/50 dark:border-white/[0.06]"
                        style={{ aspectRatio: "1 / 1.4142" }}
                      >
                        <iframe
                          key={previewUrl}
                          src={`${previewUrl}#toolbar=0&navpanes=0`}
                          className="w-full h-full border-0 bg-white"
                          title="Resume PDF Preview"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center w-full">
                        <FileText className="h-9 w-9 text-zinc-400 opacity-30" />
                        <div>
                          <p className="text-xs font-bold text-zinc-500">
                            No Preview
                          </p>
                          <p className="text-[10px] text-zinc-500 mt-1">
                            Click Refresh to generate
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── FLOATING EXPORT BAR ── */}
                  {previewUrl && !isPreviewLoading && (
                    <div className="shrink-0 px-4 py-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-t border-zinc-200 dark:border-white/[0.06] flex items-center justify-between gap-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hidden sm:block">
                        Export Resume
                      </span>
                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          onClick={handleExportPdf}
                          disabled={isDownloading}
                          className="h-8 px-4 rounded-lg text-[10px] font-black bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all flex items-center gap-1.5 uppercase tracking-wide shadow-sm disabled:opacity-50"
                        >
                          {isDownloading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Download className="h-3 w-3" />
                          )}
                          PDF
                        </button>
                        <button
                          onClick={handleExportWord}
                          disabled={isDownloading}
                          className="h-8 px-4 rounded-lg text-[10px] font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/[0.06] hover:bg-zinc-200 dark:hover:bg-white/[0.1] border border-zinc-200 dark:border-white/[0.08] transition-all flex items-center gap-1.5 uppercase tracking-wide disabled:opacity-50"
                        >
                          <Briefcase className="h-3 w-3" />
                          Word
                        </button>
                        <button
                          onClick={handleExportLatex}
                          className="h-8 px-3 rounded-lg text-[10px] font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/20 transition-all flex items-center gap-1.5 uppercase tracking-wide"
                        >
                          <Sparkles className="h-3 w-3" />
                          LaTeX
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Embedded AI Analysis Workspace */
                <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-10 text-left bg-zinc-50 dark:bg-[#09090d]">
                  {/* Job Description Input */}
                  <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-white/[0.01] border border-zinc-200 dark:border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        Target Job Calibrate
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Paste Job Description</Label>
                      <Textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the target job description to calibrate your ATS score…"
                        className={`${textareaCls} min-h-[90px] w-full text-xs`}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleRunATSAnalysis}
                        disabled={isScoring}
                        className="w-full h-9 rounded-xl text-[11px] font-black uppercase tracking-wider bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                      >
                        {isScoring ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trophy className="h-3.5 w-3.5" />
                        )}
                        {isScoring ? "Computing…" : "Run ATS Analysis"}
                      </button>
                      <button
                        onClick={handleOptimizeBullets}
                        disabled={isOptimizing}
                        className="w-full h-8 rounded-xl text-[10px] font-bold uppercase tracking-wide bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isOptimizing ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3 text-indigo-400" />
                        )}
                        Refine with AI Optimizer
                      </button>

                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <button
                            disabled={isDownloading || isPreviewLoading}
                            className="w-full h-8 rounded-xl text-[10px] font-bold uppercase tracking-wide bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm border-none mt-1"
                          >
                            {isDownloading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                            Export Resume
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          sideOffset={4}
                          className="w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.1] rounded-xl shadow-xl text-sm"
                        >
                          <DropdownMenuItem
                            onClick={handleExportPdf}
                            className="font-semibold text-xs py-2.5 gap-2 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 opacity-50" /> PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={handleExportWord}
                            className="font-semibold text-xs py-2.5 gap-2 cursor-pointer"
                          >
                            <Briefcase className="w-3.5 h-3.5 opacity-50" />{" "}
                            Word (.docx)
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={handleExportLatex}
                            className="font-semibold text-xs py-2.5 gap-2 cursor-pointer text-indigo-600 dark:text-indigo-300"
                          >
                            <Sparkles className="w-3.5 h-3.5 opacity-60" />{" "}
                            LaTeX (.tex)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Results */}
                  {!atsReport ? (
                    <div className="flex flex-col items-center justify-center py-14 border border-dashed border-zinc-200 dark:border-white/[0.06] rounded-2xl gap-3 text-zinc-400">
                      <AlertCircle className="h-7 w-7 opacity-25" />
                      <div className="text-center">
                        <p className="text-xs font-bold text-zinc-500">
                          No Analysis Yet
                        </p>
                        <p className="text-[10px] text-zinc-400 max-w-[180px] mx-auto mt-1 leading-relaxed">
                          Paste a job description and run ATS Analysis to see
                          results.
                        </p>
                      </div>
                    </div>
                  ) : (
                    renderATSReportTabs(false)
                  )}
                </div>
              )}

              {/* Bottom hint */}
              <div className="h-9 flex items-center justify-center border-t border-zinc-200 dark:border-white/[0.05] bg-white/60 dark:bg-[#09090d]/60 shrink-0">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                  Edit → <span className="text-zinc-500">Refresh</span> →
                  Download
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══════════════ AI PANEL DRAWER ═════════════════════════════ */}
      <AnimatePresence>
        {isAiPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
              onClick={() => setIsAiPanelOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-[420px] z-50 bg-white dark:bg-[#09090d] border-l border-zinc-200 dark:border-white/[0.08] shadow-2xl flex flex-col"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-5 h-14 border-b border-zinc-200 dark:border-white/[0.06] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-zinc-900 dark:text-white tracking-tight">
                      AI Analysis
                    </p>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                      ATS Scorer Engine
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAiPanelOpen(false)}
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Panel Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-10">
                {/* Job Description Input */}
                <div className="space-y-3 p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      Target Job Calibrate
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Paste Job Description</Label>
                    <Textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the target job description to calibrate your ATS score…"
                      className={`${textareaCls} min-h-[100px]`}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleRunATSAnalysis}
                      disabled={isScoring}
                      className="w-full h-10 rounded-xl text-[11px] font-black uppercase tracking-wider bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                    >
                      {isScoring ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trophy className="h-3.5 w-3.5" />
                      )}
                      {isScoring ? "Computing…" : "Run ATS Analysis"}
                    </button>
                    <button
                      onClick={handleOptimizeBullets}
                      disabled={isOptimizing}
                      className="w-full h-9 rounded-xl text-[11px] font-bold uppercase tracking-wide bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isOptimizing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3 text-indigo-400" />
                      )}
                      Refine with AI Optimizer
                    </button>

                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <button
                          disabled={isDownloading || isPreviewLoading}
                          className="w-full h-9 rounded-xl text-[11px] font-bold uppercase tracking-wide bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md border-none mt-1"
                        >
                          {isDownloading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                          Export Resume
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        sideOffset={4}
                        className="w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.1] rounded-xl shadow-xl text-sm"
                      >
                        <DropdownMenuItem
                          onClick={handleExportPdf}
                          className="font-semibold text-xs py-2.5 gap-2 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 opacity-50" /> PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleExportWord}
                          className="font-semibold text-xs py-2.5 gap-2 cursor-pointer"
                        >
                          <Briefcase className="w-3.5 h-3.5 opacity-50" /> Word
                          (.docx)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleExportLatex}
                          className="font-semibold text-xs py-2.5 gap-2 cursor-pointer text-indigo-600 dark:text-indigo-300"
                        >
                          <Sparkles className="w-3.5 h-3.5 opacity-60" /> LaTeX
                          (.tex)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Results */}
                {!atsReport ? (
                  <div className="flex flex-col items-center justify-center py-14 border-2 border-dashed border-zinc-200 dark:border-white/[0.06] rounded-2xl gap-3 text-zinc-400">
                    <AlertCircle className="h-7 w-7 opacity-25" />
                    <div className="text-center">
                      <p className="text-xs font-bold text-zinc-500">
                        No Analysis Yet
                      </p>
                      <p className="text-[10px] text-zinc-400 max-w-[180px] mx-auto mt-1 leading-relaxed">
                        Paste a job description and run ATS Analysis to see
                        results.
                      </p>
                    </div>
                  </div>
                ) : (
                  renderATSReportTabs(true)
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════ LATEX MODAL ══════════════════════════════════ */}
      <AnimatePresence>
        {isLatexOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-[#09090d]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 h-14 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-[#0c0c0e]/80 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wide">
                    LaTeX Export
                  </p>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
                    Charter Premium · ATS Ready
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadLatexPdf}
                  disabled={isLatexCompiling}
                  className="flex items-center gap-1.5 h-8 px-2 md:px-4 rounded-lg text-[10px] font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-sm shadow-indigo-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed border-none"
                >
                  {isLatexCompiling ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                  <span className="hidden md:inline">
                    {isLatexCompiling ? "Compiling…" : "Download PDF"}
                  </span>
                </button>
                <button
                  onClick={handleCopyLatex}
                  className="flex items-center gap-1.5 h-8 px-2 md:px-3.5 rounded-lg text-[10px] font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-200 transition-all"
                >
                  {isCopied ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span className="hidden md:inline">
                    {isCopied ? "Copied" : "Copy"}
                  </span>
                </button>
                <button
                  onClick={handleDownloadLatex}
                  className="flex items-center gap-1.5 h-8 px-2 md:px-3.5 rounded-lg text-[10px] font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-200 transition-all"
                >
                  <Download className="h-3 w-3" />{" "}
                  <span className="hidden md:inline">Download .tex</span>
                </button>
                <button
                  onClick={() => setIsLatexOpen(false)}
                  className="flex items-center gap-1.5 h-8 px-2 md:px-3.5 rounded-lg text-[10px] font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-200 transition-all"
                >
                  <X className="h-3 w-3" />{" "}
                  <span className="hidden md:inline">Close</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 flex flex-col md:flex-row gap-5 p-4 md:p-5 overflow-y-auto md:overflow-hidden">
              {/* Info Sidebar */}
              <div className="w-full md:w-72 shrink-0 flex flex-col justify-between p-5 border border-zinc-200 dark:border-white/[0.06] rounded-2xl bg-zinc-50 dark:bg-white/[0.01] text-left space-y-4 md:overflow-y-auto">
                <div className="space-y-4">
                  <span className="inline-block text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2.5 py-1 rounded-lg">
                    Why LaTeX?
                  </span>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    The Gold Standard for Engineers
                  </p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    LaTeX resumes produce highly semantic PDFs that ATS systems
                    can parse with 100% accuracy, with no coordinate shifting or
                    formatting loss.
                  </p>
                  <div className="h-px bg-zinc-200 dark:bg-white/[0.06]" />
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    How to Get Your PDF:
                  </p>
                  <div className="space-y-3">
                    <div className="p-3 bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/15 rounded-xl">
                      <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                        ⚡ Quick (Recommended)
                      </p>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        Click{" "}
                        <strong className="text-indigo-500">Download PDF</strong>{" "}
                        above — we compile your LaTeX to PDF instantly in the cloud.
                      </p>
                    </div>
                    <div className="p-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] rounded-xl">
                      <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                        🔧 Manual (Overleaf)
                      </p>
                      <ol className="list-decimal pl-4 text-[10px] text-zinc-500 space-y-1 leading-relaxed">
                        <li>
                          Download the{" "}
                          <code className="text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-1 rounded">
                            .tex
                          </code>{" "}
                          file
                        </li>
                        <li>
                          Go to{" "}
                          <a
                            href="https://www.overleaf.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-500 hover:underline"
                          >
                            Overleaf.com
                          </a>{" "}
                          (free)
                        </li>
                        <li>Create a new blank project &amp; upload</li>
                        <li>
                          Click <strong>Recompile</strong> → download PDF
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
                <p className="text-[9px] text-zinc-400 text-center border-t border-zinc-200 dark:border-white/[0.06] pt-4">
                  Premium Export Engine
                </p>
              </div>

              {/* Code View */}
              <div className="flex-1 min-h-[300px] border border-zinc-200 dark:border-white/[0.08] rounded-2xl overflow-hidden flex flex-col bg-white dark:bg-[#0c0c10]">
                <div className="flex items-center justify-between px-4 h-10 border-b border-zinc-200 dark:border-white/[0.06] bg-zinc-50/60 dark:bg-white/[0.02] shrink-0">
                  <span className="text-[10px] font-mono font-bold text-zinc-400">
                    source_code.tex
                  </span>
                  <span className="text-[9px] font-mono text-zinc-400 bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.06] px-2 py-0.5 rounded">
                    LaTeX
                  </span>
                </div>
                <pre className="flex-1 p-5 overflow-auto font-mono text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed text-left">
                  <code>{latexCode}</code>
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════ RESET DIALOG ════════════════════════════════ */}
      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl max-w-sm p-6 shadow-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center">
              <RotateCcw className="h-4 w-4 text-zinc-500" />
            </div>
            <AlertDialogTitle className="text-lg font-black text-zinc-900 dark:text-white">
              Reset Workspace?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-zinc-500 leading-relaxed">
              This clears all current edits. Use <strong>Backup</strong> first
              if you want to save a snapshot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-5 gap-2.5 flex-row">
            <AlertDialogCancel className="flex-1 h-10 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-transparent text-zinc-600 dark:text-zinc-400 font-bold text-xs hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-all">
              Keep Working
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearWorkspace}
              className="flex-1 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black text-xs hover:bg-zinc-800 transition-all border-none shadow-md"
            >
              Yes, Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══════════════ FOOTER ══════════════════════════════════════ */}
      <div className="shrink-0">
        <GlobalFooter>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
              <ShieldCheck className="h-2.5 w-2.5 text-emerald-500/60" />{" "}
              Encrypted
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
              Synced ·{" "}
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </GlobalFooter>
      </div>
    </div>
  );
}
