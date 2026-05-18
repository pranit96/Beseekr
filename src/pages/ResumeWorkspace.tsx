// src/pages/ResumeWorkspace.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useResume, EMPTY_RESUME } from "@/contexts/ResumeContext";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

export default function ResumeWorkspace() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Inject Global Context Engine
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
  } = useResume();

  // Local Visual/Action States
  const [injectedKeywords, setInjectedKeywords] = useState<string[]>([]);
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewOutdated, setPreviewOutdated] = useState(false);

  // Auto-generate preview on mount
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
      } catch (error) {
        console.error("Failed to generate initial preview:", error);
      } finally {
        if (active) setIsPreviewLoading(false);
      }
    };
    if (resumeData && resumeData.personal_info?.name) {
      initPreview();
    }
    return () => {
      active = false;
    };
  }, []);

  // Track edits to flag outdated preview
  const [isFirstRender, setIsFirstRender] = useState(true);
  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }
    setPreviewOutdated(true);
  }, [resumeData]);

  // Navigation & Panel states for Designer UI
  const [activeTab, setActiveTab] = useState("personal");
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  const [companyNameInput, setCompanyNameInput] = useState("");
  const [hiringManagerInput, setHiringManagerInput] = useState("");
  const [isExportingCL, setIsExportingCL] = useState<"pdf" | "word" | null>(null);

  // LaTeX Export States
  const [isLatexOpen, setIsLatexOpen] = useState(false);
  const [latexCode, setLatexCode] = useState("");
  const [isCopied, setIsCopied] = useState(false);

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
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "LaTeX Generation Failed",
        description: error.message || "Failed to compile LaTeX structure.",
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
        description: "Your .tex document was downloaded successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: error.message || "Failed to download the .tex file.",
      });
    }
  };

  const handleCopyLatex = async () => {
    try {
      await navigator.clipboard.writeText(latexCode);
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: "LaTeX code has been copied to your clipboard.",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Could not copy code to clipboard.",
      });
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
      toast({
        title: "Word File Ready!",
        description: "Your editable resume has been saved.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Word Export Failed",
        description: error.message,
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
        company_name: companyNameInput || "",
        job_title: resumeData.personal_info.summary.split(" ")[0], // Fallback
        hiring_manager: hiringManagerInput || "",
      });
      setCoverLetter(content);
      setActiveTab("coverletter");
      toast({
        title: "Cover Letter Generated",
        description: "Your tailored letter is ready to review.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error.message,
      });
    } finally {
      setIsGeneratingCL(false);
    }
  };

  const handleExportCoverLetterPdf = async () => {
    if (!coverLetter) return;
    setIsExportingCL("pdf");
    try {
      const url = await resumeApi.downloadCoverLetterPdf(resumeData, coverLetter);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${resumeData.personal_info.name || "Candidate"}_Cover_Letter.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Cover Letter PDF Ready!",
        description: "Your professional PDF cover letter is saved to your device.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "PDF Export Failed",
        description: error.message || "Could not export PDF.",
      });
    } finally {
      setIsExportingCL(null);
    }
  };

  const handleExportCoverLetterWord = async () => {
    if (!coverLetter) return;
    setIsExportingCL("word");
    try {
      const url = await resumeApi.downloadCoverLetterWord(resumeData, coverLetter);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${resumeData.personal_info.name || "Candidate"}_Cover_Letter.docx`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Cover Letter Word File Ready!",
        description: "Your editable cover letter is saved to your device.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Word Export Failed",
        description: error.message || "Could not export Word file.",
      });
    } finally {
      setIsExportingCL(null);
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

  const handleClearWorkspace = () => {
    setIsClearDialogOpen(true);
  };

  const confirmClearWorkspace = () => {
    resetWorkspace();
    toast({
      title: "Workspace Reset",
      description: "A fresh, empty resume slate has been initialized.",
    });
  };

  // ── Handlers: Workspace Operations ─────────────────────────────────
  const handleRunATSAnalysis = async () => {
    setIsScoring(true);
    try {
      const result = await resumeApi.scoreResume(resumeData, jobDescription);
      setAtsReport(result);
      toast({
        title: "Resume Scored",
        description: `Your score is ${result.score}/100. Check the suggestions below.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Scoring error",
        description: error.message,
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
      toast({
        title: "AI Improvements Applied",
        description:
          "Your bullet points have been rewritten for better impact.",
      });
      // Trigger automatic score refresh if report existed
      if (atsReport) handleRunATSAnalysis();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "AI Refactor Failed",
        description: error.message,
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  // Directly download PDF on export click
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
      toast({
        title: "Export Successful 🚀",
        description: "Your PDF resume is saved to your device.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: error.message || "Could not export PDF.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Triggered from inside the preview modal
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
      toast({ title: "Downloaded!", description: "Your resume PDF is saved." });
    } finally {
      setIsDownloading(false);
    }
  };

  // Refresh preview with latest resume data
  const handleRefreshPreview = async () => {
    setIsPreviewLoading(true);
    try {
      const url = await resumeApi.downloadResumePdf(resumeData);
      if (previewUrl) window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
      setPreviewOutdated(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Refresh Failed",
        description: error.message || "Could not regenerate the preview.",
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    // Note: keep blob URL alive until next generation so user can re-open
  };

  // ── Handlers: Sub-field Mutators ────────────────────────────────────
  const updatePersonalInfo = (
    field: keyof typeof EMPTY_RESUME.personal_info,
    value: string,
  ) => {
    setResumeData((prev) => ({
      ...prev,
      personal_info: { ...prev.personal_info, [field]: value },
    }));
  };

  const updateStyleConfig = (field: string, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      styles: { ...(prev.styles || {}), [field]: value },
    }));
  };

  const addExperience = () => {
    setResumeData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          company: "",
          position: "",
          location: "",
          period: "",
          highlights: [""],
        },
      ],
    }));
  };

  const deleteExperience = (idx: number) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx),
    }));
  };

  const updateExperience = (idx: number, field: any, value: any) => {
    setResumeData((prev) => {
      const updated = [...prev.experience];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, experience: updated };
    });
  };

  const addSkillCategory = () => {
    setResumeData((prev) => ({
      ...prev,
      skills: [...prev.skills, { category: "New Category", items: [] }],
    }));
  };

  const updateSkillGroup = (
    idx: number,
    category: string,
    itemsStr: string,
  ) => {
    setResumeData((prev) => {
      const updated = [...prev.skills];
      updated[idx] = {
        category,
        items: itemsStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      return { ...prev, skills: updated };
    });
  };

  const addEducation = () => {
    setResumeData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { institution: "", degree: "", period: "", location: "" },
      ],
    }));
  };

  const deleteEducation = (idx: number) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx),
    }));
  };

  const updateEducation = (idx: number, field: any, value: any) => {
    setResumeData((prev) => {
      const updated = [...prev.education];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, education: updated };
    });
  };

  const addProject = () => {
    setResumeData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        { name: "", description: "", link: "", highlights: [""] },
      ],
    }));
  };

  const deleteProject = (idx: number) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== idx),
    }));
  };

  const updateProject = (idx: number, field: any, value: any) => {
    setResumeData((prev) => {
      const updated = [...prev.projects];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, projects: updated };
    });
  };

  const addCertification = () => {
    setResumeData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, ""],
    }));
  };

  const updateCertification = (idx: number, value: string) => {
    setResumeData((prev) => {
      const updated = [...prev.certifications];
      updated[idx] = value;
      return { ...prev, certifications: updated };
    });
  };

  const deleteCertification = (idx: number) => {
    setResumeData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== idx),
    }));
  };

  const applyRefactor = (original: string, improved: string) => {
    // Normalize for robust fuzzy matching — strip punctuation, collapse whitespace
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
      ) {
        return 1;
      }
      const nhWords = nh.split(" ").filter(Boolean);
      if (nhWords.length === 0 || originalWords.length === 0) return 0;
      
      const matchCount = originalWords.filter((w) => nhWords.includes(w)).length;
      return matchCount / Math.max(originalWords.length, nhWords.length);
    };

    // Find best match in experience
    resumeData.experience.forEach((job, parentIdx) => {
      job.highlights.forEach((h, bulletIdx) => {
        const score = getScore(normalize(h));
        if (score > bestMatch.score) {
          bestMatch = { type: "experience", parentIdx, bulletIdx, score };
        }
      });
    });

    // Find best match in projects
    resumeData.projects.forEach((proj, parentIdx) => {
      (proj.highlights || []).forEach((h, bulletIdx) => {
        const score = getScore(normalize(h));
        if (score > bestMatch.score) {
          bestMatch = { type: "projects", parentIdx, bulletIdx, score };
        }
      });
    });

    const hasMatched = bestMatch.score > 0.45; // Flexible threshold for LLM variations

    // Record immediate tracking event for bulletproof visual persistence
    setAppliedSuggestions((prev) => {
      if (!prev.includes(normalizedImproved)) {
        return [...prev, normalizedImproved];
      }
      return prev;
    });

    if (hasMatched) {
      setResumeData((prev) => {
        const next = { ...prev };
        if (bestMatch.type === "experience") {
          const updated = [...next.experience];
          const job = { ...updated[bestMatch.parentIdx] };
          const hl = [...job.highlights];
          hl[bestMatch.bulletIdx] = improved;
          job.highlights = hl;
          updated[bestMatch.parentIdx] = job;
          next.experience = updated;
        } else if (bestMatch.type === "projects") {
          const updated = [...next.projects];
          const proj = { ...updated[bestMatch.parentIdx] };
          const hl = [...(proj.highlights || [])];
          hl[bestMatch.bulletIdx] = improved;
          proj.highlights = hl;
          updated[bestMatch.parentIdx] = proj;
          next.projects = updated;
        }
        return next;
      });

      toast({
        title: "Suggestion Applied ✅",
        description: "Bullet point upgraded successfully in your resume.",
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(improved);
      toast({
        title: "Copied to Clipboard",
        description:
          "Couldn't auto-match the exact bullet — copied to clipboard so you can paste manually.",
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden selection:bg-white/10">
      {/* ── STICKY HEADER TOOLBAR ───────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/[0.05] shrink-0">
        <div className="w-full px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2.5">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => navigate("/dashboard/hired/resume")}
                  className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/[0.08] shrink-0 transition-all shadow-sm"
                  title="Back to Portal"
                >
                  <ArrowLeft className="h-3 w-3" />
                </Button>
                <span className="text-[9px] font-black tracking-[0.2em] text-zinc-500 uppercase select-none">
                  GET HIRED <span className="text-zinc-400 dark:text-zinc-700 px-0.5">/</span>{" "}
                  WORKSPACE
                </span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-foreground leading-none">
                {resumeData.personal_info.name || "Untitled Resume"}
              </h1>
            </div>

            {/* TOOLBAR ACTION ROW */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {/* Auto-Save status indicator */}
              <div className="mr-2">
                {saveStatus === "saving" && (
                  <div className="flex items-center gap-1.5 text-indigo-400 animate-pulse">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">
                      Saving
                    </span>
                  </div>
                )}
                {saveStatus === "saved" && (
                  <div className="flex items-center gap-1.5 text-emerald-500/80">
                    <ShieldCheck className="h-3 w-3" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">
                      Synced
                    </span>
                  </div>
                )}
              </div>

              <div className="h-4 w-px bg-zinc-200 dark:bg-white/[0.08] mx-1 hidden sm:block" />

              {workspaceMode === "template" && (
                <Button
                  onClick={() => navigate("/dashboard/hired/resume/templates")}
                  variant="ghost"
                  className="rounded-lg font-bold text-zinc-500 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-white/5 transition-all h-8 px-2.5 text-[10px] uppercase tracking-wider"
                >
                  Templates
                </Button>
              )}

              <Button
                onClick={handleClearWorkspace}
                variant="ghost"
                className="rounded-lg font-bold text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all h-8 px-2.5 text-[10px] uppercase tracking-wider"
              >
                Reset
              </Button>

              <Button
                onClick={handleBackupToVault}
                disabled={isBackingUp}
                variant="ghost"
                className="rounded-lg font-bold text-zinc-500 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-white/5 transition-all h-8 px-2.5 text-[10px] uppercase tracking-wider"
              >
                {isBackingUp ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                ) : (
                  <History className="h-3 w-3 mr-1.5 opacity-50" />
                )}
                Backup
              </Button>

              <div className="h-4 w-px bg-zinc-200 dark:bg-white/[0.08] mx-1 hidden sm:block" />

              {/* INTEGRATED AI OPTIMIZER BUTTON */}
              <Button
                onClick={() => setIsAiPanelOpen(true)}
                className="rounded-lg font-black bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-white border border-indigo-500/20 transition-all h-8 px-3 text-[10px] uppercase tracking-wider"
              >
                <Sparkles className="h-3 w-3 mr-1.5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
                AI Optimizer
              </Button>

              {/* PRIMARY CTA FOR PREVIEW & EXPORT */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    disabled={isDownloading || isPreviewLoading}
                    className="rounded-lg font-black bg-primary text-primary-foreground hover:opacity-90 transition-all h-8 px-4 text-[10px] uppercase tracking-widest border-none shadow-xl"
                  >
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background border border-zinc-200 dark:border-white/[0.1] text-muted-foreground rounded-xl">
                  <DropdownMenuItem
                    onClick={handleExportPdf}
                    className="font-bold text-xs py-2.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/[0.05]"
                  >
                    <FileText className="w-3.5 h-3.5 mr-2 opacity-60" /> PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleExportWord}
                    className="font-bold text-xs py-2.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/[0.05]"
                  >
                    <Briefcase className="w-3.5 h-3.5 mr-2 opacity-60" /> Word
                    (.docx)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleExportLatex}
                    className="font-bold text-xs py-2.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/[0.05] text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-white"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-2 opacity-60 text-indigo-500 dark:text-indigo-400" />{" "}
                    LaTeX (.tex)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* ── SCROLLABLE MAIN CONTENT ────────────────────────────────── */}
      <main className="flex-1 flex flex-row overflow-hidden relative">
        {/* Left Column: Form Editor */}
        <div className="w-1/2 h-full overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-8 py-6 sm:py-10 border-r border-zinc-200 dark:border-white/[0.05]">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="w-full relative space-y-6"
            >
            {/* FULL WIDTH CAPSULE TAB LIST */}
            <div className="flex items-center justify-between gap-1.5 p-1.5 bg-zinc-100/80 dark:bg-[#0c0c12]/40 border border-zinc-200 dark:border-white/[0.05] rounded-2xl backdrop-blur-3xl shadow-lg w-full overflow-x-auto select-none">
              {[
                { id: "personal", label: "Personal", icon: User },
                { id: "experience", label: "Experience", icon: Briefcase },
                { id: "education", label: "Education", icon: GraduationCap },
                { id: "skills", label: "Skills & Projects", icon: Cpu },
                { id: "design", label: "Theme Settings", icon: Sparkles },
                {
                  id: "coverletter",
                  label: "Cover Letter",
                  icon: MessageSquare,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[11px] font-extrabold tracking-wide uppercase transition-all duration-200 outline-none min-w-[110px] ${
                      isActive
                        ? "bg-background text-foreground shadow-md dark:shadow-[0_4px_20px_rgba(255,255,255,0.15)] scale-[1.01]"
                        : "text-zinc-500 hover:text-muted-foreground hover:bg-zinc-200/50 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 ${isActive ? "text-foreground" : "text-zinc-500 group-hover:text-muted-foreground"}`}
                    />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <Card className="border border-zinc-200 dark:border-white/[0.06] bg-card/60 backdrop-blur-3xl rounded-[24px] p-6 sm:p-10 shadow-2xl dark:shadow-[0_32px_96px_-32px_rgba(0,0,0,0.8)] min-h-[500px] transition-all duration-300">
              {activeTab === "personal" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="space-y-1.5 text-left">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
                      <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                        <User className="h-4 w-4 text-indigo-400" />
                      </div>
                      Personal Details
                    </h2>
                    <p className="text-xs text-zinc-500 font-medium">
                      Tell employers who you are and how to reach you.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6 border-t border-zinc-200 dark:border-white/[0.03] pt-6">
                    <div className="space-y-2 text-left">
                      <Label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 ml-1">
                        Full Name
                      </Label>
                      <Input
                        value={resumeData.personal_info.name}
                        onChange={(e) =>
                          updatePersonalInfo("name", e.target.value)
                        }
                        placeholder="Your full name"
                        className="bg-zinc-50 dark:bg-white/[0.02] focus:bg-zinc-100 dark:focus:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06] focus:border-indigo-500/40 dark:focus:border-indigo-500/40 focus:ring-0 text-zinc-800 dark:text-zinc-200 rounded-2xl h-12 px-4 transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2 text-left">
                      <Label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 ml-1">
                        Email Address
                      </Label>
                      <Input
                        value={resumeData.personal_info.email}
                        onChange={(e) =>
                          updatePersonalInfo("email", e.target.value)
                        }
                        placeholder="you@email.com"
                        className="bg-zinc-50 dark:bg-white/[0.02] focus:bg-zinc-100 dark:focus:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06] focus:border-indigo-500/40 dark:focus:border-indigo-500/40 focus:ring-0 text-zinc-800 dark:text-zinc-200 rounded-2xl h-12 px-4 transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2 text-left">
                      <Label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 ml-1">
                        Phone Number
                      </Label>
                      <Input
                        value={resumeData.personal_info.phone}
                        onChange={(e) =>
                          updatePersonalInfo("phone", e.target.value)
                        }
                        placeholder="+1 234 567 8900"
                        className="bg-zinc-50 dark:bg-white/[0.02] focus:bg-zinc-100 dark:focus:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06] focus:border-indigo-500/40 dark:focus:border-indigo-500/40 focus:ring-0 text-zinc-800 dark:text-zinc-200 rounded-2xl h-12 px-4 transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2 text-left">
                      <Label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 ml-1">
                        Website / Link
                      </Label>
                      <Input
                        value={resumeData.personal_info.website}
                        onChange={(e) =>
                          updatePersonalInfo("website", e.target.value)
                        }
                        placeholder="github.com/alias"
                        className="bg-zinc-50 dark:bg-white/[0.02] focus:bg-zinc-100 dark:focus:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06] focus:border-indigo-500/40 dark:focus:border-indigo-500/40 focus:ring-0 text-zinc-800 dark:text-zinc-200 rounded-2xl h-12 px-4 transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-left border-t border-zinc-200 dark:border-white/[0.03] pt-6">
                    <Label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 ml-1">
                      Summary
                    </Label>
                    <Textarea
                      value={resumeData.personal_info.summary}
                      onChange={(e) =>
                        updatePersonalInfo("summary", e.target.value)
                      }
                      placeholder="A brief overview of your professional background and core strengths."
                      className="bg-zinc-50 dark:bg-white/[0.02] focus:bg-zinc-100 dark:focus:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06] focus:border-indigo-500/40 dark:focus:border-indigo-500/40 focus:ring-0 text-zinc-800 dark:text-zinc-200 rounded-2xl min-h-[120px] px-4 py-3 leading-relaxed transition-all text-sm resize-none shadow-inner"
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === "experience" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.03] pb-5">
                    <div className="space-y-1.5 text-left">
                      <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
                        <div className="p-1.5 bg-sky-500/10 border border-sky-500/20 rounded-lg">
                          <Briefcase className="h-4 w-4 text-sky-400" />
                        </div>
                        Work Experience
                      </h2>
                      <p className="text-xs text-zinc-500 font-medium">
                        Highlight your previous roles and impact.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={addExperience}
                      className="h-9 font-bold text-xs bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200 rounded-xl flex items-center gap-1.5 px-4 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Role
                    </Button>
                  </div>

                  <div className="space-y-6 pt-2">
                    {resumeData.experience.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-white/[0.05] rounded-[24px] text-zinc-500 text-xs bg-zinc-50/50 dark:bg-white/[0.01]">
                        No work history items added yet.
                      </div>
                    ) : (
                      resumeData.experience.map((exp, idx) => (
                        <div
                          key={idx}
                          className="p-6 rounded-[24px] bg-zinc-50/50 dark:bg-white/[0.01] hover:bg-zinc-100/50 dark:hover:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] relative space-y-6 transition-all group/exp text-left shadow-md"
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteExperience(idx)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover/exp:opacity-100 transition-all duration-300 h-8 w-8 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>

                          <div className="grid sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 ml-1">
                                Company
                              </Label>
                              <Input
                                value={exp.company}
                                onChange={(e) =>
                                  updateExperience(
                                    idx,
                                    "company",
                                    e.target.value,
                                  )
                                }
                                placeholder="e.g., Stripe"
                                className="bg-zinc-50 dark:bg-white/[0.02] focus:bg-zinc-100 dark:focus:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06] focus:border-sky-500/40 dark:focus:border-sky-500/40 text-sm text-zinc-800 dark:text-zinc-200 rounded-2xl h-11 px-3.5 transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 ml-1">
                                Position / Title
                              </Label>
                              <Input
                                value={exp.position}
                                onChange={(e) =>
                                  updateExperience(
                                    idx,
                                    "position",
                                    e.target.value,
                                  )
                                }
                                placeholder="Staff Software Engineer"
                                className="bg-zinc-50 dark:bg-white/[0.02] focus:bg-zinc-100 dark:focus:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06] focus:border-sky-500/40 dark:focus:border-sky-500/40 text-sm text-zinc-800 dark:text-zinc-200 rounded-2xl h-11 px-3.5 transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 ml-1">
                                Dates
                              </Label>
                              <Input
                                value={exp.period}
                                onChange={(e) =>
                                  updateExperience(
                                    idx,
                                    "period",
                                    e.target.value,
                                  )
                                }
                                placeholder="Jan 2022 - Present"
                                className="bg-zinc-50 dark:bg-white/[0.02] focus:bg-zinc-100 dark:focus:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06] focus:border-sky-500/40 dark:focus:border-sky-500/40 text-sm text-zinc-800 dark:text-zinc-200 rounded-2xl h-11 px-3.5 transition-all font-mono"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 ml-1">
                                Location / City
                              </Label>
                              <Input
                                value={exp.location}
                                onChange={(e) =>
                                  updateExperience(
                                    idx,
                                    "location",
                                    e.target.value,
                                  )
                                }
                                placeholder="San Francisco, CA"
                                className="bg-zinc-50 dark:bg-white/[0.02] focus:bg-zinc-100 dark:focus:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06] focus:border-sky-500/40 dark:focus:border-sky-500/40 text-sm text-zinc-800 dark:text-zinc-200 rounded-2xl h-11 px-3.5 transition-all"
                              />
                            </div>
                          </div>

                          <div className="space-y-3 pt-2">
                            <Label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 ml-1">
                              <Sparkles className="h-3 w-3 text-sky-400 animate-pulse" />{" "}
                              Role Achievements
                            </Label>
                            <div className="space-y-2.5">
                              {exp.highlights.map((bullet, bIdx) => (
                                <div
                                  key={bIdx}
                                  className="flex gap-2 group/bullet items-start"
                                >
                                  <Textarea
                                    value={bullet}
                                    onChange={(e) => {
                                      const nextHighlights = [
                                        ...exp.highlights,
                                      ];
                                      nextHighlights[bIdx] = e.target.value;
                                      updateExperience(
                                        idx,
                                        "highlights",
                                        nextHighlights,
                                      );
                                    }}
                                    className="bg-zinc-50/50 dark:bg-white/[0.01] border-zinc-200 dark:border-white/[0.06] focus:border-sky-500/40 dark:focus:border-sky-500/40 min-h-[64px] text-sm text-zinc-800 dark:text-zinc-200 rounded-xl px-3 py-2 leading-relaxed resize-none transition-all flex-1"
                                    placeholder="Designed highly available microservices processing 50k payloads/sec..."
                                  />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      const nextHighlights =
                                        exp.highlights.filter(
                                          (_, i) => i !== bIdx,
                                        );
                                      updateExperience(
                                        idx,
                                        "highlights",
                                        nextHighlights,
                                      );
                                    }}
                                    className="h-8 w-8 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover/bullet:opacity-100 transition-all mt-1 shrink-0"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                updateExperience(idx, "highlights", [
                                  ...exp.highlights,
                                  "",
                                ])
                              }
                              className="text-[11px] text-sky-400 hover:text-sky-300 font-bold px-1.5 hover:bg-sky-500/5 transition-all flex items-center gap-1.5 mt-1 rounded-lg"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add Bullet Point
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "education" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.03] pb-5">
                    <div className="space-y-1.5 text-left">
                      <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
                        <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                          <GraduationCap className="h-4 w-4 text-emerald-400" />
                        </div>
                        Education History
                      </h2>
                      <p className="text-xs text-zinc-500 font-medium">
                        Degrees, certifications and institutions.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={addEducation}
                      className="h-9 font-bold text-xs bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200 rounded-xl flex items-center gap-1.5 px-4 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Degree
                    </Button>
                  </div>

                  <div className="space-y-6 pt-2">
                    {resumeData.education.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-white/[0.05] rounded-[24px] text-zinc-500 text-xs bg-zinc-50/50 dark:bg-white/[0.01]">
                        No education records added yet.
                      </div>
                    ) : (
                      resumeData.education.map((edu, idx) => (
                        <div
                          key={idx}
                          className="p-6 rounded-[24px] bg-zinc-50/50 dark:bg-white/[0.01] hover:bg-zinc-100/50 dark:hover:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] relative space-y-4 transition-all group/edu text-left shadow-md"
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteEducation(idx)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover/edu:opacity-100 transition-all duration-300 h-8 w-8 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <div className="grid sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 ml-1">
                                Institution Name
                              </Label>
                              <Input
                                value={edu.institution}
                                onChange={(e) =>
                                  updateEducation(
                                    idx,
                                    "institution",
                                    e.target.value,
                                  )
                                }
                                placeholder="e.g., Stanford University"
                                className="bg-zinc-50 dark:bg-white/[0.02] focus:bg-zinc-100 dark:focus:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06] focus:border-emerald-500/40 dark:focus:border-emerald-500/40 text-sm text-zinc-800 dark:text-zinc-200 rounded-2xl h-11 px-3.5 transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 ml-1">
                                Degree / Discipline
                              </Label>
                              <Input
                                value={edu.degree}
                                onChange={(e) =>
                                  updateEducation(idx, "degree", e.target.value)
                                }
                                placeholder="Bachelor of Science in Computer Science"
                                className="bg-zinc-50 dark:bg-white/[0.02] focus:bg-zinc-100 dark:focus:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06] focus:border-emerald-500/40 dark:focus:border-emerald-500/40 text-sm text-zinc-800 dark:text-zinc-200 rounded-2xl h-11 px-3.5 transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 ml-1">
                                Term Period
                              </Label>
                              <Input
                                value={edu.period}
                                onChange={(e) =>
                                  updateEducation(idx, "period", e.target.value)
                                }
                                placeholder="2018 - 2022"
                                className="bg-zinc-50 dark:bg-white/[0.02] focus:bg-zinc-100 dark:focus:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06] focus:border-emerald-500/40 dark:focus:border-emerald-500/40 text-sm text-zinc-800 dark:text-zinc-200 font-mono rounded-2xl h-11 px-3.5 transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 ml-1">
                                City / Country
                              </Label>
                              <Input
                                value={edu.location}
                                onChange={(e) =>
                                  updateEducation(
                                    idx,
                                    "location",
                                    e.target.value,
                                  )
                                }
                                placeholder="Stanford, CA"
                                className="bg-zinc-50 dark:bg-white/[0.02] focus:bg-zinc-100 dark:focus:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06] focus:border-emerald-500/40 dark:focus:border-emerald-500/40 text-sm text-zinc-800 dark:text-zinc-200 rounded-2xl h-11 px-3.5 transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "skills" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-12 text-left"
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/[0.03] pb-4">
                      <div className="space-y-1">
                        <h2 className="text-base font-bold text-foreground flex items-center gap-2.5">
                          <div className="p-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                            <Cpu className="h-4 w-4 text-purple-400" />
                          </div>
                          Skills
                        </h2>
                        <p className="text-[11px] text-zinc-500 font-medium">
                          Categorized tech stacks and keywords.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={addSkillCategory}
                        className="h-8 font-bold text-[11px] bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] rounded-xl px-3 transition-all text-zinc-800 dark:text-zinc-200"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Category
                      </Button>
                    </div>

                    <div className="space-y-4 pt-2">
                      {resumeData.skills.map((skill, idx) => (
                        <div
                          key={idx}
                          className="flex gap-4 items-start group/skill bg-zinc-50/50 dark:bg-white/[0.01] hover:bg-zinc-100/50 dark:hover:bg-white/[0.02] p-5 border border-zinc-200 dark:border-white/[0.04] rounded-2xl transition-all"
                        >
                          <div className="w-1/3 space-y-1.5">
                            <Label className="text-[10px] font-extrabold tracking-wider uppercase text-zinc-500 ml-1">
                              Skill Category
                            </Label>
                            <Input
                              value={skill.category}
                              onChange={(e) =>
                                updateSkillGroup(
                                  idx,
                                  e.target.value,
                                  skill.items.join(", "),
                                )
                              }
                              placeholder="e.g., Languages"
                              className="bg-zinc-50 dark:bg-white/[0.02] focus:bg-zinc-100 dark:focus:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06] text-xs text-zinc-800 dark:text-zinc-200 font-bold rounded-xl h-10 transition-all"
                            />
                          </div>
                          <div className="flex-grow space-y-1.5">
                            <Label className="text-[10px] font-extrabold tracking-wider uppercase text-zinc-500 ml-1">
                              List (Comma Separated)
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
                              placeholder="TypeScript, Python, Rust..."
                              className="bg-zinc-50 dark:bg-white/[0.02] focus:bg-zinc-100 dark:focus:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06] text-xs text-zinc-800 dark:text-zinc-200 rounded-xl h-10 transition-all"
                            />
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              setResumeData((p) => ({
                                ...p,
                                skills: p.skills.filter((_, i) => i !== idx),
                              }))
                            }
                            className="mt-6 h-9 w-9 shrink-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl opacity-0 group-hover/skill:opacity-100 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6 border-t border-zinc-200 dark:border-white/[0.03] pt-10">
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.03] pb-4">
                      <div className="space-y-1">
                        <h2 className="text-base font-bold text-foreground flex items-center gap-2.5">
                          <div className="p-1.5 bg-sky-500/10 border border-sky-500/20 rounded-lg">
                            <FileText className="h-4 w-4 text-sky-400" />
                          </div>
                          Key Projects
                        </h2>
                        <p className="text-[11px] text-zinc-500 font-medium">
                          Demonstrate capability via built deliverables.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={addProject}
                        className="h-8 font-bold text-[11px] bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] rounded-xl px-3 transition-all text-zinc-800 dark:text-zinc-200"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Project
                      </Button>
                    </div>

                    <div className="space-y-6 pt-2">
                      {resumeData.projects.map((proj, idx) => (
                        <div
                          key={idx}
                          className="p-5 rounded-[24px] bg-zinc-50/50 dark:bg-white/[0.01] hover:bg-zinc-100/50 dark:hover:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] relative space-y-4 transition-all group/proj shadow-sm"
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteProject(idx)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover/proj:opacity-100 transition-all duration-300 h-8 w-8 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 ml-1">
                                Project Title
                              </Label>
                              <Input
                                value={proj.name}
                                onChange={(e) =>
                                  updateProject(idx, "name", e.target.value)
                                }
                                placeholder="Task Scheduler Suite"
                                className="bg-zinc-50 dark:bg-white/[0.02] focus:bg-zinc-100 dark:focus:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06] focus:border-sky-500/40 dark:focus:border-sky-500/40 text-sm text-zinc-800 dark:text-zinc-200 rounded-xl h-10 px-3.5 transition-all"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 ml-1 flex items-center gap-1">
                                Link{" "}
                                <span className="text-[8px] opacity-40">
                                  (Optional)
                                </span>
                              </Label>
                              <Input
                                value={proj.link}
                                onChange={(e) =>
                                  updateProject(idx, "link", e.target.value)
                                }
                                placeholder="github.com/owner/repo"
                                className="bg-zinc-50 dark:bg-white/[0.02] focus:bg-zinc-100 dark:focus:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06] focus:border-sky-500/40 dark:focus:border-sky-500/40 text-sm text-zinc-800 dark:text-zinc-200 font-mono rounded-xl h-10 px-3.5 transition-all"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 ml-1">
                              Brief Description
                            </Label>
                            <Input
                              value={proj.description}
                              onChange={(e) =>
                                updateProject(
                                  idx,
                                  "description",
                                  e.target.value,
                                )
                              }
                              placeholder="High-performance workflow engine built with Rust and Redis..."
                              className="bg-zinc-50 dark:bg-white/[0.02] focus:bg-zinc-100 dark:focus:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06] focus:border-sky-500/40 dark:focus:border-sky-500/40 text-sm text-zinc-800 dark:text-zinc-200 rounded-xl h-10 px-3.5 transition-all"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground ml-1">
                              Project Highlights
                            </Label>
                            <div className="space-y-2">
                              {proj.highlights?.map((b, bIdx) => (
                                <div
                                  key={bIdx}
                                  className="flex gap-2 group/proj-bullet items-start"
                                >
                                  <Input
                                    value={b}
                                    onChange={(e) => {
                                      const nextH = [
                                        ...(proj.highlights || []),
                                      ];
                                      nextH[bIdx] = e.target.value;
                                      updateProject(idx, "highlights", nextH);
                                    }}
                                    className="bg-zinc-50/50 dark:bg-white/[0.01] border-zinc-200 dark:border-white/[0.06] focus:border-sky-500/40 dark:focus:border-sky-500/40 text-sm text-zinc-800 dark:text-zinc-200 rounded-xl px-3.5 h-10 transition-all flex-1"
                                    placeholder="Achieved latency reduction of 40% in cluster operations..."
                                  />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      const nextH = proj.highlights.filter(
                                        (_, i) => i !== bIdx,
                                      );
                                      updateProject(idx, "highlights", nextH);
                                    }}
                                    className="h-9 w-9 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl opacity-0 group-hover/proj-bullet:opacity-100 transition-all"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                updateProject(idx, "highlights", [
                                  ...(proj.highlights || []),
                                  "",
                                ])
                              }
                              className="text-[11px] text-sky-400 hover:text-sky-300 font-bold px-1.5 hover:bg-sky-500/5 flex items-center gap-1.5 rounded-lg"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add Highlight
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6 border-t border-zinc-200 dark:border-white/[0.03] pt-10">
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.03] pb-4">
                      <div className="space-y-1">
                        <h2 className="text-base font-bold text-foreground flex items-center gap-2.5">
                          <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <Trophy className="h-4 w-4 text-amber-400" />
                          </div>
                          Certifications
                        </h2>
                        <p className="text-[11px] text-zinc-500 font-medium">
                          Relevant professional certifications.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={addCertification}
                        className="h-8 font-bold text-[11px] bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] rounded-xl px-3 transition-all text-zinc-800 dark:text-zinc-200"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Cert
                      </Button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 pt-2">
                      {resumeData.certifications.map((cert, idx) => (
                        <div
                          key={idx}
                          className="flex gap-2 group/cert bg-zinc-50/50 dark:bg-white/[0.01] hover:bg-zinc-100/50 dark:hover:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.04] p-3 rounded-2xl transition-all"
                        >
                          <Input
                            value={cert}
                            onChange={(e) =>
                              updateCertification(idx, e.target.value)
                            }
                            placeholder="e.g., AWS Architect Associate"
                            className="bg-transparent focus:bg-zinc-100/50 dark:focus:bg-white/[0.02] border-none focus:ring-0 text-sm text-zinc-800 dark:text-zinc-200 h-9 flex-1 px-1.5 transition-all"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteCertification(idx)}
                            className="text-zinc-600 hover:text-red-400 opacity-0 group-hover/cert:opacity-100 transition-all h-9 w-9 rounded-xl"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "design" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="space-y-1.5 text-left">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
                      <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                      </div>
                      Theme Options
                    </h2>
                    <p className="text-xs text-zinc-500 font-medium">
                      Customize typography and header highlights.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-8 border-t border-zinc-200 dark:border-white/[0.03] pt-8 text-left">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-extrabold tracking-widest uppercase text-zinc-500 ml-1">
                        Theme / Header Accent
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
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
                          const isSelected =
                            (resumeData.styles?.primaryColor || "#1A365D") ===
                            theme.primary;
                          return (
                            <button
                              key={theme.name}
                              type="button"
                              onClick={() => {
                                updateStyleConfig(
                                  "primaryColor",
                                  theme.primary,
                                );
                                updateStyleConfig("accentColor", theme.accent);
                              }}
                              className={`flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.01] border transition-all text-left shadow-sm hover:bg-zinc-100 dark:hover:bg-white/[0.03] ${
                                isSelected
                                  ? "border-indigo-500/40 bg-indigo-500/5 ring-1 ring-indigo-500/20"
                                  : "border-zinc-200 dark:border-white/[0.05]"
                              }`}
                            >
                              <div
                                className="h-6 w-6 rounded-full border border-white/10 shrink-0 shadow-inner flex items-center justify-center"
                                style={{ backgroundColor: theme.primary }}
                              >
                                {isSelected && (
                                  <CheckCircle2 className="w-3 h-3 text-white bg-background/20 rounded-full" />
                                )}
                              </div>
                              <span
                                className={`text-xs font-bold ${isSelected ? "text-zinc-800 dark:text-white" : "text-muted-foreground"}`}
                              >
                                {theme.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-extrabold tracking-widest uppercase text-zinc-500 ml-1">
                        Font Family
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          {
                            id: "Sans",
                            name: "Sans-Serif",
                            class: "font-sans font-bold",
                          },
                          {
                            id: "Serif",
                            name: "Serif Modern",
                            class: "font-serif font-black",
                          },
                        ].map((font) => {
                          const isSelected =
                            (resumeData.styles?.fontFamily || "Sans") ===
                            font.id;
                          return (
                            <button
                              key={font.id}
                              type="button"
                              onClick={() =>
                                updateStyleConfig("fontFamily", font.id)
                              }
                              className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all bg-zinc-50 dark:bg-white/[0.01] hover:bg-zinc-100 dark:hover:bg-white/[0.03] ${
                                isSelected
                                  ? "border-indigo-500/40 bg-indigo-500/5 text-zinc-800 dark:text-white shadow-md ring-1 ring-indigo-500/20"
                                  : "border-zinc-200 dark:border-white/[0.05] text-muted-foreground"
                              }`}
                            >
                              <span
                                className={`text-2xl leading-none ${font.class}`}
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
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "coverletter" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-200 dark:border-white/[0.03] pb-6">
                    <div className="space-y-1.5 text-left">
                      <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                          <Sparkles className="h-5 w-5 text-amber-400" />
                        </div>
                        Cover Letter Studio
                      </h2>
                      <p className="text-sm text-zinc-500 font-medium leading-relaxed max-w-md">
                        Generate a high-impact, tailored cover letter based on
                        your current resume and job description.
                      </p>
                    </div>
                    <Button
                      disabled={isGeneratingCL || !jobDescription}
                      onClick={handleGenerateCoverLetter}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-11 px-8 rounded-2xl flex items-center gap-2.5 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
                    >
                      {isGeneratingCL ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {coverLetter ? "Regenerate Letter" : "Generate with AI"}
                    </Button>
                  </div>

                  {/* Parameter controls for letter context */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                        Company Name
                      </label>
                      <Input
                        value={companyNameInput}
                        onChange={(e) => setCompanyNameInput(e.target.value)}
                        placeholder="e.g. OpenAI (optional)"
                        className="h-12 bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.08] focus:border-indigo-500 rounded-xl text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                        Hiring Manager Name
                      </label>
                      <Input
                        value={hiringManagerInput}
                        onChange={(e) => setHiringManagerInput(e.target.value)}
                        placeholder="e.g. Jane Doe (optional)"
                        className="h-12 bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.08] focus:border-indigo-500 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {!coverLetter ? (
                    <div className="py-24 text-center space-y-6 bg-zinc-50 dark:bg-white/[0.01] border border-dashed border-zinc-200 dark:border-white/[0.08] rounded-[32px]">
                      <div className="w-20 h-20 bg-zinc-100 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] rounded-3xl mx-auto flex items-center justify-center text-zinc-700">
                        <Sparkles className="w-10 h-10 opacity-40" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-muted-foreground font-bold text-lg tracking-tight">
                          Your tailored letter is one click away
                        </p>
                        <p className="text-zinc-500 text-sm max-w-sm mx-auto font-medium leading-relaxed">
                          {!jobDescription
                            ? "Please add a Job Description in the 'AI Tools' panel first to personalize your letter."
                            : "We'll analyze your achievements and match them to the job requirements."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] p-4 rounded-2xl">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-2">
                          Export Cover Letter
                        </span>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            onClick={handleExportCoverLetterPdf}
                            disabled={!!isExportingCL}
                            className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.08] text-foreground hover:bg-zinc-100 dark:hover:bg-white/[0.04] text-xs font-bold h-9 px-4 rounded-xl flex items-center gap-2"
                          >
                            {isExportingCL === "pdf" ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            Download PDF
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleExportCoverLetterWord}
                            disabled={!!isExportingCL}
                            className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.08] text-foreground hover:bg-zinc-100 dark:hover:bg-white/[0.04] text-xs font-bold h-9 px-4 rounded-xl flex items-center gap-2"
                          >
                            {isExportingCL === "word" ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <FileText className="w-3.5 h-3.5" />
                            )}
                            Download Word (.docx)
                          </Button>
                        </div>
                      </div>

                      <Textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        className="min-h-[500px] bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.08] focus:border-indigo-500/40 text-zinc-800 dark:text-zinc-200 text-sm p-8 leading-[1.8] font-serif rounded-[32px] transition-all resize-none shadow-inner border"
                        placeholder="Dear Hiring Manager..."
                      />
                      <div className="flex items-center justify-between pt-4 opacity-70">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          AI Draft • Professional Tone •{" "}
                          {coverLetter.split(" ").length} Words
                        </span>
                        <Button
                          variant="ghost"
                          className="text-xs font-bold text-muted-foreground hover:text-zinc-800 dark:hover:text-white"
                          onClick={() => setCoverLetter(null)}
                        >
                          Discard & Restart
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </Card>
          </motion.div>

          {isAiPanelOpen && (
            <>
              <div
                className="fixed inset-x-0 bottom-0 top-[72px] sm:top-[82px] z-[40] bg-background/30 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => setIsAiPanelOpen(false)}
              />

              <div className="fixed top-[72px] sm:top-[82px] right-0 bottom-0 w-full max-w-[450px] z-[45] bg-background/95 border-l border-zinc-200 dark:border-white/[0.08] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 backdrop-blur-2xl">
                <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-white/[0.06] shrink-0 select-none">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground tracking-tight">
                        AI Analysis & Tools
                      </h3>
                      <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                        ATS Scorer Engine
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsAiPanelOpen(false)}
                    className="h-8 w-8 text-muted-foreground hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.05] rounded-xl transition-all"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-16">
                  <Card className="p-5 border border-zinc-200 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-[#0c0c12] backdrop-blur-md rounded-2xl space-y-4 shadow-inner relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-1 select-none text-left">
                      <div className="p-1.5 bg-zinc-100 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-muted-foreground">
                        <Trophy className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                      <h3 className="text-[10px] font-black tracking-wider uppercase text-muted-foreground font-mono">
                        Target Job calibrate
                      </h3>
                    </div>

                    <div className="space-y-2 text-left">
                      <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                        <span>Paste Job Description</span>
                      </Label>
                      <Textarea
                        placeholder="Paste raw target job description here to calibrate your ATS score..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="min-h-[100px] bg-zinc-50 dark:bg-white/[0.01] border-zinc-200 dark:border-white/[0.05] focus:bg-zinc-100 dark:focus:bg-white/[0.03] text-sm text-zinc-800 dark:text-zinc-200 resize-none rounded-xl px-3.5 py-2.5 leading-relaxed placeholder:text-zinc-400 dark:placeholder:text-zinc-700 transition-all shadow-inner border"
                      />
                    </div>

                    <Button
                      onClick={handleRunATSAnalysis}
                      disabled={isScoring}
                      className="w-full rounded-xl h-11 font-black text-xs tracking-wider uppercase bg-zinc-950 dark:bg-white text-white dark:text-black hover:bg-zinc-900 dark:hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 border-none shadow-lg"
                    >
                      {isScoring ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      ) : (
                        <Trophy className="h-4 w-4 mr-1.5" />
                      )}
                      {isScoring ? "Computing Score..." : "Run ATS Analysis"}
                    </Button>

                    <Button
                      onClick={handleOptimizeBullets}
                      disabled={isOptimizing}
                      variant="outline"
                      className="w-full rounded-xl border-zinc-200 dark:border-white/[0.08] bg-zinc-100 dark:bg-white/[0.02] hover:bg-zinc-200 dark:hover:bg-white/[0.05] text-muted-foreground font-bold text-xs h-10 transition-all flex items-center justify-center gap-2"
                    >
                      {isOptimizing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-indigo-400 mr-1" />
                      )}
                      Refine with AI Optimizer
                    </Button>
                  </Card>

                  <div className="space-y-4">
                    {!atsReport ? (
                      <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-white/[0.05] rounded-[24px] text-zinc-500 space-y-3 select-none bg-zinc-50/50 dark:bg-white/[0.01]">
                        <AlertCircle className="h-8 w-8 mx-auto opacity-30 text-muted-foreground" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-muted-foreground">
                            No Analysis Computed
                          </p>
                          <p className="text-[10px] text-zinc-600 max-w-[200px] mx-auto leading-relaxed">
                            Paste a job description above and click "Run ATS
                            Analysis" to trigger LLM diagnostic feed.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Tabs
                        defaultValue="overview"
                        className="w-full flex flex-col"
                      >
                        <TabsList className="w-full bg-zinc-100 dark:bg-white/[0.02] rounded-xl border border-zinc-200 dark:border-white/[0.05] h-9 p-0.5 mb-4">
                          <TabsTrigger
                            value="overview"
                            className="flex-1 text-[10px] font-bold rounded-[9px] select-none data-[state=active]:bg-white dark:data-[state=active]:bg-white/[0.05] text-muted-foreground data-[state=active]:text-zinc-800 dark:data-[state=active]:text-white transition-all"
                          >
                            ⚡ Overview
                          </TabsTrigger>
                          <TabsTrigger
                            value="upgrades"
                            className="flex-1 text-[10px] font-bold rounded-[9px] select-none data-[state=active]:bg-white dark:data-[state=active]:bg-white/[0.05] text-muted-foreground data-[state=active]:text-zinc-800 dark:data-[state=active]:text-white transition-all"
                          >
                            🚀 Bullet Upgrades
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent
                          value="overview"
                          className="space-y-5 mt-0 text-left"
                        >
                          <div className="flex flex-col items-center justify-center py-3 bg-zinc-50/50 dark:bg-white/[0.01] border border-zinc-200 dark:border-white/[0.04] rounded-2xl relative select-none">
                            {(() => {
                              const score = atsReport.score || 0;
                              return (
                                <div className="relative h-28 w-28 flex items-center justify-center animate-in zoom-in-90 duration-300">
                                  <svg
                                    className="h-full w-full -rotate-90 drop-shadow-[0_0_16px_rgba(99,102,241,0.25)]"
                                    viewBox="0 0 36 36"
                                  >
                                    <defs>
                                      <linearGradient
                                        id="atsNeonGradDrawer"
                                        x1="0%"
                                        y1="0%"
                                        x2="100%"
                                        y2="100%"
                                      >
                                        <stop offset="0%" stopColor="#a855f7" />
                                        <stop
                                          offset="100%"
                                          stopColor="#6366f1"
                                        />
                                      </linearGradient>
                                    </defs>
                                    <path
                                      className="stroke-zinc-100 dark:stroke-white/[0.02]"
                                      strokeWidth="3"
                                      fill="none"
                                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <motion.path
                                      stroke="url(#atsNeonGradDrawer)"
                                      strokeWidth="3"
                                      strokeDasharray={`${score}, 100`}
                                      strokeLinecap="round"
                                      fill="none"
                                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      initial={{ pathLength: 0 }}
                                      animate={{ pathLength: 1 }}
                                      transition={{
                                        duration: 1.2,
                                        ease: "easeOut",
                                      }}
                                    />
                                  </svg>
                                  <div className="absolute flex flex-col items-center text-center">
                                    <span className="font-black text-3xl text-zinc-800 dark:text-white tracking-tighter">
                                      {score}
                                    </span>
                                    <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">
                                      ATS INDEX
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(atsReport.aspects).map(
                              ([key, aspect]: [string, any]) => (
                                <div
                                  key={key}
                                  className="border border-zinc-200 dark:border-white/[0.03] bg-zinc-50/50 dark:bg-white/[0.01] rounded-xl p-3.5 transition-all hover:bg-zinc-100/50 dark:hover:bg-white/[0.02]"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="capitalize font-bold text-[10px] text-muted-foreground tracking-tight leading-none font-mono">
                                      {key.replace("_", " ")}
                                    </span>
                                    <span className="text-[10px] font-black font-mono text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06] px-1 py-0.5 rounded">
                                      {aspect.rating}/10
                                    </span>
                                  </div>
                                  <p
                                    className="text-[9px] text-zinc-500 leading-relaxed font-medium line-clamp-2 hover:line-clamp-none cursor-pointer transition-all"
                                    title={aspect.why}
                                  >
                                    {aspect.why}
                                  </p>
                                </div>
                              ),
                            )}
                          </div>

                          <div className="space-y-2 border-t border-zinc-200 dark:border-white/[0.03] pt-4">
                            <Label className="text-[9px] font-extrabold tracking-widest uppercase text-zinc-500 flex items-center gap-1.5 select-none ml-1">
                              <Sparkles className="h-3 w-3 text-indigo-400" />{" "}
                              Overall Assessment Summary
                            </Label>
                            <div className="text-[11px] leading-relaxed font-medium bg-zinc-50/50 dark:bg-white/[0.01] border border-zinc-200 dark:border-white/[0.03] rounded-xl p-3.5 text-muted-foreground leading-relaxed">
                              {atsReport.general_feedback}
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent
                          value="upgrades"
                          className="space-y-6 mt-0 text-left"
                        >
                          <div className="space-y-3 bg-zinc-50/50 dark:bg-white/[0.01] rounded-2xl p-4 border border-zinc-200 dark:border-white/[0.03]">
                            <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-[10px] flex items-center gap-1.5 font-mono uppercase tracking-wider">
                              🔍 Missing Keywords
                            </h4>
                            <p className="text-[9px] text-zinc-500 font-medium">
                              Terms that can boost your score. Click one to
                              automatically append to skills category.
                            </p>

                            {atsReport.missing_keywords.length === 0 ? (
                              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-[10px] text-emerald-400 text-center flex items-center justify-center gap-1.5 font-mono">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Full
                                Coverage Achieved
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {atsReport.missing_keywords.map(
                                  (keyword, i) => {
                                    const isAlreadyAdded =
                                      injectedKeywords.includes(keyword);
                                    return (
                                      <Badge
                                        key={i}
                                        onClick={() => {
                                          if (isAlreadyAdded) return;
                                          setResumeData((prev) => {
                                            const nextSkills = [...prev.skills];
                                            if (nextSkills[0]) {
                                              nextSkills[0] = {
                                                ...nextSkills[0],
                                                items: Array.from(
                                                  new Set([
                                                    ...nextSkills[0].items,
                                                    keyword,
                                                  ]),
                                                ),
                                              };
                                            }
                                            return {
                                              ...prev,
                                              skills: nextSkills,
                                            };
                                          });
                                          setInjectedKeywords((p) => [
                                            ...p,
                                            keyword,
                                          ]);
                                          toast({
                                            title: `Added: ${keyword}`,
                                            description:
                                              "Appended to your skills classification list.",
                                          });
                                        }}
                                        className={`text-[9px] font-extrabold px-2.5 py-1 cursor-pointer transition-all rounded-lg tracking-tight border ${
                                          isAlreadyAdded
                                            ? "bg-emerald-500/10 text-emerald-400/80 border-emerald-500/20 line-through cursor-not-allowed opacity-50"
                                            : "bg-zinc-100 dark:bg-white/[0.02] hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-700 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white border-zinc-200 dark:border-white/[0.06] hover:scale-[1.02] active:scale-95"
                                        }`}
                                      >
                                        + {keyword}
                                      </Badge>
                                    );
                                  },
                                )}
                              </div>
                            )}
                          </div>

                          <div className="space-y-4 pt-1">
                            <Label className="text-[9px] font-extrabold tracking-widest uppercase text-zinc-500 flex items-center gap-1.5 ml-1">
                              🛠 Smart Bullet Refactors
                            </Label>

                            {atsReport.bullet_point_suggestions.length === 0 ? (
                              <div className="text-center py-10 text-zinc-500 text-[10px] border border-dashed border-zinc-200 dark:border-white/[0.04] rounded-xl bg-zinc-50/50 dark:bg-white/[0.01]">
                                No suggestions available. Try refining with
                                optimizer.
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {atsReport.bullet_point_suggestions.map(
                                  (sug, sIdx) => {
                                    const normalizedOriginal = sug.original
                                      .trim()
                                      .toLowerCase();
                                    const normalizedImproved = sug.improved
                                      .trim()
                                      .toLowerCase();

                                    const isApplied =
                                      appliedSuggestions.includes(
                                        normalizedImproved,
                                      ) ||
                                      resumeData.experience.some((e) =>
                                        e.highlights.some(
                                          (h) =>
                                            h.trim().toLowerCase() ===
                                            normalizedImproved,
                                        ),
                                      ) ||
                                      resumeData.projects.some((p) =>
                                        p.highlights.some(
                                          (h) =>
                                            h.trim().toLowerCase() ===
                                            normalizedImproved,
                                        ),
                                      );

                                    return (
                                      <div
                                        key={sIdx}
                                        className={`rounded-xl border overflow-hidden transition-all shadow-sm flex flex-col ${
                                          isApplied
                                            ? "bg-[#065F46]/5 border-[#065F46]/20"
                                            : "bg-zinc-50/50 dark:bg-white/[0.01] hover:bg-zinc-100/50 dark:hover:bg-white/[0.02] border-zinc-200 dark:border-white/[0.04] hover:border-zinc-300 dark:hover:border-white/[0.08]"
                                        }`}
                                      >
                                        <div className="bg-zinc-100/50 dark:bg-white/[0.01] border-b border-zinc-200 dark:border-white/[0.03] px-3.5 py-2 text-[10px] font-medium text-zinc-500 italic truncate leading-relaxed">
                                          "{sug.original}"
                                        </div>

                                        <div className="p-3.5 flex flex-col gap-3.5">
                                          <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 leading-relaxed">
                                            "{sug.improved}"
                                          </p>

                                          {sug.reason && (
                                            <p className="text-[9px] text-zinc-500 italic flex items-center gap-1 leading-relaxed font-medium select-none">
                                              <Sparkles className="h-3 w-3 text-indigo-400/60 shrink-0" />{" "}
                                              {sug.reason}
                                            </p>
                                          )}

                                          {isApplied ? (
                                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold shrink-0 w-fit px-2 py-0.5 flex items-center gap-1 rounded-md">
                                              <CheckCircle2 className="h-3 w-3" />{" "}
                                              Applied
                                            </Badge>
                                          ) : (
                                            <Button
                                              type="button"
                                              size="sm"
                                              onClick={() =>
                                                applyRefactor(
                                                  sug.original,
                                                  sug.improved,
                                                )
                                              }
                                              className="h-7 px-3.5 rounded-lg text-[9px] font-black bg-zinc-950 dark:bg-white hover:bg-zinc-900 dark:hover:bg-zinc-200 text-white dark:text-black border-none w-fit transition-all shadow-md"
                                            >
                                              Apply Suggestion
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          <AlertDialog
            open={isClearDialogOpen}
            onOpenChange={setIsClearDialogOpen}
          >
            <AlertDialogContent className="bg-background border border-zinc-200 dark:border-white/[0.08] rounded-3xl max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <AlertDialogHeader className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-muted-foreground mb-2">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <AlertDialogTitle className="text-xl font-bold tracking-tight text-foreground">
                  Reset Your Workspace?
                </AlertDialogTitle>
                <div className="text-muted-foreground text-sm leading-relaxed font-medium space-y-2 select-none">
                  <p>
                    This will clear all your current edits. Save a version first
                    if you want to keep them.
                  </p>
                  <div className="text-indigo-400/90 text-xs flex items-center gap-1.5 pt-1 font-semibold">
                    <Sparkles className="w-3 h-3" />
                    <span>Tip: click "Save Version" before resetting.</span>
                  </div>
                </div>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-6 gap-3 flex-col sm:flex-row">
                <AlertDialogCancel className="bg-transparent border border-zinc-200 dark:border-white/[0.08] text-muted-foreground hover:bg-zinc-100 dark:hover:bg-white/[0.03] hover:text-zinc-800 dark:hover:text-white rounded-xl font-bold text-xs px-5 py-2 h-10 transition-all">
                  Keep Working
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmClearWorkspace}
                  className="bg-zinc-950 dark:bg-white hover:bg-zinc-900 dark:hover:bg-zinc-200 text-white dark:text-black rounded-xl font-bold text-xs px-5 py-2 h-10 transition-all border-none shadow-lg"
                >
                  Yes, Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Right Column: Live PDF Preview */}
        <div className="w-1/2 bg-zinc-50/90 dark:bg-[#07070a]/90 backdrop-blur-3xl border-l border-zinc-200 dark:border-white/[0.06] flex flex-col h-full overflow-hidden shrink-0">
          {/* Live Preview Top Bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-white/[0.06] bg-zinc-100/80 dark:bg-[#09090b]/80 shrink-0 select-none">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-zinc-400" />
              <span className="text-xs font-bold text-foreground tracking-tight">
                Live Preview
              </span>
              {previewOutdated && (
                <span className="text-[9px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full animate-pulse">
                  Outdated — refresh
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshPreview}
                disabled={isPreviewLoading}
                className="h-7 text-[10px] font-bold rounded-lg border-zinc-200 dark:border-white/[0.08] bg-zinc-100 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/[0.08] transition-all px-2.5"
              >
                {isPreviewLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <RotateCcw className="h-3 w-3 mr-1" />
                )}
                Refresh
              </Button>

              <Button
                size="sm"
                onClick={handleDownloadFromPreview}
                disabled={isDownloading || isPreviewLoading}
                className="h-7 text-[10px] font-black rounded-lg bg-zinc-950 dark:bg-white hover:bg-zinc-900 dark:hover:bg-zinc-200 text-white dark:text-black transition-all border-none shadow-md px-3"
              >
                {isDownloading ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Download className="h-3 w-3 mr-1" />
                )}
                Download PDF
              </Button>
            </div>
          </div>

          {/* Interactive PDF view dock */}
          <div className="flex-1 relative bg-zinc-100 dark:bg-[#09090c] flex items-center justify-center p-4 selection:bg-white/5 overflow-y-auto custom-scrollbar">
            {isPreviewLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 animate-pulse">
                <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
                <p className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase font-mono">
                  Assembling Vector Paths...
                </p>
              </div>
            ) : previewUrl ? (
              <div
                className="relative w-full h-[92%] max-w-[90%] bg-background border border-zinc-200 dark:border-white/[0.08] rounded-xl overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300 flex flex-col shrink"
                style={{ aspectRatio: "1 / 1.4142" }}
              >
                <iframe
                  key={previewUrl}
                  src={`${previewUrl}#toolbar=0&navpanes=0`}
                  className="w-full h-full border-0 opacity-95 hover:opacity-100 transition-opacity bg-white dark:bg-[#07070a]"
                  title="Resume PDF Preview"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center select-none text-zinc-500">
                <FileText className="h-10 w-10 opacity-30 text-muted-foreground animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground">
                    No Preview Generated
                  </p>
                  <p className="text-[10px] text-zinc-600 max-w-[200px] mx-auto mt-1 leading-relaxed">
                    Click "Refresh" above to assemble the PDF preview.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom hint bar */}
          <div className="px-5 py-2 border-t border-zinc-200 dark:border-white/[0.04] bg-zinc-100/60 dark:bg-[#09090b]/60 text-center shrink-0">
            <p className="text-zinc-600 text-[9px] font-bold tracking-wider uppercase">
              Made a change? Click <span className="text-zinc-400">Refresh</span> to update live view.
            </p>
          </div>
        </div>

          {/* LaTeX Preview Modal */}
          {isLatexOpen && (
            <div
              className="fixed inset-0 z-50 flex flex-col bg-background/95 animate-in fade-in duration-300"
              role="dialog"
              aria-label="LaTeX Code Export"
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-100/80 dark:bg-[#0c0c0e]/80 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-sm font-black text-foreground tracking-wide uppercase">
                      LaTeX Document Export
                    </h2>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      Jake's Template Structure • ATS Ready
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLatex}
                    className="h-8 text-xs font-bold rounded-xl border-zinc-200 dark:border-white/[0.08] bg-zinc-100 dark:bg-white/[0.03] text-muted-foreground hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/[0.08] transition-all"
                  >
                    {isCopied ? (
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {isCopied ? "Copied" : "Copy Code"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadLatex}
                    className="h-8 text-xs font-bold rounded-xl border-zinc-200 dark:border-white/[0.08] bg-zinc-100 dark:bg-white/[0.03] text-muted-foreground hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/[0.08] transition-all"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Download .tex
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsLatexOpen(false)}
                    className="h-8 text-xs font-bold rounded-xl border-zinc-200 dark:border-white/[0.08] bg-zinc-100 dark:bg-white/[0.03] text-muted-foreground hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/[0.08] transition-all"
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Close
                  </Button>
                </div>
              </div>

              {/* Centered Responsive LaTeX View */}
              <div className="flex-1 flex flex-col md:flex-row gap-6 p-6 overflow-hidden">
                {/* Left panel: Info & Compile tips */}
                <div className="w-full md:w-80 flex flex-col justify-between p-5 border border-zinc-200 dark:border-white/[0.05] rounded-2xl bg-zinc-50/50 dark:bg-white/[0.01] shrink-0 text-left">
                  <div className="space-y-4">
                    <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 text-[9px] uppercase tracking-wider font-bold">
                      Why Use LaTeX?
                    </Badge>
                    <h3 className="text-foreground text-xs font-bold uppercase tracking-wider">
                      The Gold Standard for Engineers
                    </h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      LaTeX compiled resumes produce highly semantic PDFs with a
                      clean horizontal text reading grid. Applicant Tracking
                      Systems (ATS) can parse 100% of the content accurately
                      without coordinates shifting.
                    </p>
                    <div className="h-px bg-zinc-200 dark:bg-white/[0.05]" />
                    <h3 className="text-foreground text-xs font-bold uppercase tracking-wider">
                      How to Compile:
                    </h3>
                    <ol className="list-decimal pl-4 text-[11px] text-muted-foreground space-y-2">
                      <li>
                        Download the{" "}
                        <code className="text-indigo-400 bg-zinc-100 dark:bg-white/[0.03] px-1 py-0.5 rounded">
                          .tex
                        </code>{" "}
                        file using the top button.
                      </li>
                      <li>
                        Go to{" "}
                        <a
                          href="https://www.overleaf.com"
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:underline"
                        >
                          Overleaf.com
                        </a>{" "}
                        (Free online editor).
                      </li>
                      <li>Create a new blank project and upload the file.</li>
                      <li>
                        Click <strong>Recompile</strong> to download your
                        flawless PDF resume!
                      </li>
                    </ol>
                  </div>

                  <div className="pt-4 text-center border-t border-zinc-200 dark:border-white/[0.04] text-[10px] text-zinc-500">
                    BeSeekr Premium Export Engine
                  </div>
                </div>

                {/* Right panel: Raw scrollable code view */}
                <div className="flex-1 border border-zinc-200 dark:border-white/[0.08] rounded-2xl bg-background overflow-hidden flex flex-col shadow-inner">
                  <div className="px-4 py-2 border-b border-zinc-200 dark:border-white/[0.05] bg-zinc-100/50 dark:bg-card/50 flex items-center justify-between shrink-0">
                    <span className="text-[10px] font-mono font-bold text-zinc-500">
                      source_code.tex
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] font-mono text-muted-foreground border-zinc-200 dark:border-white/[0.08]"
                    >
                      LaTeX
                    </Badge>
                  </div>
                  <pre className="flex-1 p-5 overflow-auto font-mono text-xs text-muted-foreground leading-relaxed text-left selection:bg-indigo-500/20 custom-scrollbar">
                    <code>{latexCode}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── GLOBAL FOOTER WITH WORKSPACE STATUS ────────────────────── */}
      <div className="flex-shrink-0">
        <GlobalFooter>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-600 uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3 text-emerald-500/50" />
              Encrypted
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">
              <span className="hidden sm:inline">
                Synced:{" "}
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </GlobalFooter>
      </div>
    </div>
  );
}
