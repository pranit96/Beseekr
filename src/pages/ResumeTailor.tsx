import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useResume } from "@/contexts/ResumeContext";
import { resumeApi, type ResumeSchema, type TailorRunRecord } from "@/api/resume";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  FileText,
  Sparkles,
  Trophy,
  Trash2,
  Download,
  Check,
  Plus,
  Loader2,
  Clock,
  Briefcase,
  AlertTriangle,
  Link2,
  ExternalLink,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ResumeTailor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setResumeData, setWorkspaceMode, setShowOnboarding } = useResume();

  const inputCls =
    "bg-zinc-50 dark:bg-white/[0.02] focus:bg-white dark:focus:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06] focus:border-indigo-400/50 dark:focus:border-indigo-400/40 focus:ring-0 text-zinc-800 dark:text-zinc-200 rounded-xl h-11 px-4 transition-all text-sm shadow-sm";
  const textareaCls =
    "bg-zinc-50 dark:bg-white/[0.02] focus:bg-white dark:focus:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06] focus:border-indigo-400/50 dark:focus:border-indigo-400/40 focus:ring-0 text-zinc-800 dark:text-zinc-200 rounded-xl px-4 py-3 leading-relaxed transition-all text-sm resize-none";

  // Tailoring Runs History
  const [runs, setRuns] = useState<TailorRunRecord[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);
  const [activeRun, setActiveRun] = useState<TailorRunRecord | null>(null);

  // Form inputs state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [displayPercent, setDisplayPercent] = useState(0);

  // Drag & Drop State
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // Load History Runs
  // ---------------------------------------------------------------------------
  const loadRuns = useCallback(async (selectFirst = false) => {
    setIsLoadingRuns(true);
    try {
      const data = await resumeApi.getTailorRuns();
      setRuns(data);
      if (selectFirst && data.length > 0) {
        setActiveRun(data[0]);
      }
    } catch (e) {
      console.error("Failed to load runs:", e);
    } finally {
      setIsLoadingRuns(false);
    }
  }, []);

  useEffect(() => {
    loadRuns(true);
  }, [loadRuns]);

  // ---------------------------------------------------------------------------
  // Parse Job URL Helper
  // ---------------------------------------------------------------------------
  const handleParseJobUrl = async () => {
    if (!jobUrl || !jobUrl.trim().startsWith("http")) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid HTTP or HTTPS job link.",
        variant: "destructive",
      });
      return;
    }

    setIsParsingUrl(true);
    try {
      const result = await resumeApi.parseJobUrl(jobUrl);
      if (result.jd_text) {
        setJdText(result.jd_text);
        toast({
          title: "Job Link Parsed!",
          description: `Successfully extracted JD for ${result.job_title || "Target Role"} at ${result.company_name || "Target Company"}.`,
        });
      } else {
        throw new Error("No job description found on this page.");
      }
    } catch (e: any) {
      toast({
        title: "Parsing Failed",
        description: e.message || "Failed to extract job description details from the link.",
        variant: "destructive",
      });
    } finally {
      setIsParsingUrl(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete a past run
  // ---------------------------------------------------------------------------
  const handleDeleteRun = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await resumeApi.deleteTailorRun(id);
      toast({
        title: "Run deleted",
        description: "The tailoring run was successfully deleted from your history.",
      });
      setRuns((prev) => prev.filter((r) => r.id !== id));
      if (activeRun?.id === id) {
        setActiveRun(null);
      }
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message || "Could not delete this run from your history.",
        variant: "destructive",
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Run Aligned Tailoring
  // ---------------------------------------------------------------------------
  const handleRunTailoring = async () => {
    if (!selectedFile) {
      toast({
        title: "Resume missing",
        description: "Please upload your current resume file first.",
        variant: "destructive",
      });
      return;
    }
    if (!jdText || jdText.trim().length < 20) {
      toast({
        title: "Job description empty",
        description: "Please paste a job description (minimum 20 characters) or parse a job link.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setDisplayPercent(0);

    // Smoothly animate progress indicator
    const interval = setInterval(() => {
      setDisplayPercent((prev) => {
        if (prev >= 98) return 98;
        return prev + Math.floor(Math.random() * 8) + 1;
      });
    }, 400);

    try {
      const result = await resumeApi.tailorAlignResume(selectedFile, jdText);
      clearInterval(interval);
      setDisplayPercent(100);

      toast({
        title: "Tailoring Succeeded!",
        description: "Your optimized LaTeX resume and scorecard have been built successfully.",
      });

      // Reload runs list and set the newly generated run as active
      setTimeout(async () => {
        setIsProcessing(false);
        setSelectedFile(null);
        setJdText("");
        setJobUrl("");
        await loadRuns(false);
        setActiveRun(result as unknown as TailorRunRecord);
      }, 1000);

    } catch (err: any) {
      clearInterval(interval);
      setIsProcessing(false);
      toast({
        title: "Tailoring Failed",
        description: err.message || "Failed to parse, align, or compile your resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Load tailored schema directly into Live builder workspace
  // ---------------------------------------------------------------------------
  const handleApplyToWorkspace = () => {
    if (!activeRun || !activeRun.resume) return;
    setResumeData(activeRun.resume);
    setWorkspaceMode("upload", true);
    setShowOnboarding(false);
    toast({
      title: "Aligned Draft Loaded!",
      description: "You have been switched to your editor workspace containing this tailored draft.",
    });
    navigate("/dashboard/hired/resume/workspace");
  };

  // ---------------------------------------------------------------------------
  // Download LaTeX compiled PDF
  // ---------------------------------------------------------------------------
  const handleDownloadPdf = () => {
    if (!activeRun || !activeRun.pdf_base64) return;
    try {
      const binaryString = window.atob(activeRun.pdf_base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `${activeRun.company_name.replace(/\s+/g, "_")}_Tailored_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Downloading...",
        description: "Your compiled, ATS-aligned resume PDF is now downloading.",
      });
    } catch (e: any) {
      toast({
        title: "Download Failed",
        description: e.message || "Failed to download tailored PDF.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full h-full min-h-[calc(100vh-100px)] flex bg-zinc-50 dark:bg-[#070709] border border-zinc-200 dark:border-white/[0.04] rounded-2xl overflow-hidden font-sans">
      {/* ─── LEFT PANEL: RUNS HISTORY ─── */}
      <div className="w-72 border-r border-zinc-200 dark:border-white/[0.05] bg-white/40 dark:bg-zinc-950/20 flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-200 dark:border-white/[0.05] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-indigo-500" />
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Align History
            </h2>
          </div>
          <button
            onClick={() => setActiveRun(null)}
            className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border-none transition-all cursor-pointer"
            title="Create New Tailoring"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* History Runs List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 select-none">
          {isLoadingRuns ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-zinc-400">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Loading runs...
              </span>
            </div>
          ) : runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400/60 p-4 border-2 border-dashed border-zinc-200 dark:border-white/[0.04] rounded-xl bg-zinc-50/20 dark:bg-white/[0.005]">
              <Trophy className="h-8 w-8 opacity-30 mb-2" />
              <p className="text-xs font-bold">No runs saved yet</p>
              <p className="text-[10px] leading-relaxed">
                Run ATS tailoring to save and score optimized resumes.
              </p>
            </div>
          ) : (
            runs.map((run) => {
              const isActive = activeRun?.id === run.id;
              return (
                <div
                  key={run.id}
                  onClick={() => setActiveRun(run)}
                  className={`flex flex-col gap-1.5 p-3 rounded-xl border transition-all cursor-pointer relative group ${
                    isActive
                      ? "bg-zinc-100 dark:bg-white/[0.06] border-indigo-500/50 shadow-sm text-zinc-950 dark:text-white"
                      : "bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/[0.04] hover:bg-zinc-50 dark:hover:bg-white/[0.02] text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 min-w-0">
                    <p className="text-xs font-black truncate leading-tight flex-1">
                      {run.company_name}
                    </p>
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                        run.ats_score >= 80
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      }`}
                    >
                      {run.ats_score}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-medium text-zinc-400">
                    <span className="truncate flex-1 max-w-[130px]">
                      {run.job_title}
                    </span>
                    <span className="text-[9px] opacity-75 whitespace-nowrap shrink-0">
                      {new Date(run.saved_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteRun(e, run.id)}
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center border-none shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── RIGHT PANEL: MAIN APP INTERFACE ─── */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900/10 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {/* ── PHASE 1: LOADING SCREEN ── */}
          {isProcessing && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/95 dark:bg-zinc-950/95 z-40 flex flex-col items-center justify-center p-8 select-none"
            >
              <div className="w-full max-w-md space-y-6 text-center">
                <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto animate-pulse">
                  <Sparkles className="h-8 w-8 text-indigo-500 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-black tracking-tight text-zinc-800 dark:text-zinc-100">
                    Running Job Tailoring...
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Processing resume structure, evaluating keywords, applying Google XYZ outcomes, and compiling LaTeX PDF.
                  </p>
                </div>

                <div className="space-y-2">
                  <Progress value={displayPercent} className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-wide px-1">
                    <span>Analyzing target role</span>
                    <span>{displayPercent}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── PHASE 2: RESULT VIEW (IF RUN ACTIVE) ── */}
          {activeRun ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex-1 flex overflow-hidden"
            >
              {/* Left Scroll: Feedback, Bullets, and Keywords */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
                {/* Header title */}
                <div className="flex items-start justify-between border-b border-zinc-100 dark:border-white/[0.06] pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        ATS MATCH & TAILOR
                      </span>
                    </div>
                    <h1 className="text-2xl font-black tracking-tight">
                      {activeRun.company_name}
                    </h1>
                    <p className="text-sm font-semibold text-zinc-500">
                      {activeRun.job_title}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleApplyToWorkspace}
                      className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-black bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 transition-all uppercase tracking-wide"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Apply to Workspace
                    </button>
                    <button
                      onClick={handleDownloadPdf}
                      className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-black bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 border-none transition-all uppercase tracking-wide"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download PDF
                    </button>
                  </div>
                </div>

                {/* ATS Score Circular & executive summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Gauge */}
                  <div className="border border-zinc-200 dark:border-white/[0.04] bg-white/40 dark:bg-zinc-950/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center select-none shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">
                      Match Score
                    </span>
                    <div className="h-28 w-28 rounded-full border-4 border-zinc-100 dark:border-white/[0.03] flex items-center justify-center relative bg-zinc-50/50 dark:bg-white/[0.005]">
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-r-transparent animate-spin opacity-20" />
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-3xl font-black tracking-tight text-indigo-500">
                          {activeRun.ats_score}%
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400">
                          ATS Grade
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Feedback */}
                  <div className="md:col-span-2 border border-zinc-200 dark:border-white/[0.04] bg-white/40 dark:bg-zinc-950/10 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-3">
                      Executive Feedback
                    </span>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                      {activeRun.general_feedback}
                    </p>
                  </div>
                </div>

                {/* Improvements bullet diff */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      Improvements Done (Google XYZ Outcomes)
                    </h3>
                  </div>

                  <div className="space-y-3 select-none">
                    {activeRun.bullet_point_suggestions?.length === 0 ? (
                      <div className="p-4 border border-dashed border-zinc-200 dark:border-white/[0.04] rounded-xl text-center text-zinc-400 text-xs">
                        No revisions or bullet adjustments required. Faver-friendly ATS matching verified.
                      </div>
                    ) : (
                      activeRun.bullet_point_suggestions?.map((sug, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-zinc-200 dark:border-white/[0.04] bg-white dark:bg-zinc-900/30 space-y-3 flex flex-col text-left"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Original */}
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-wider text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-2 py-0.5 rounded">
                                Original Resume bullet
                              </span>
                              <p className="text-xs text-zinc-500 italic font-medium leading-relaxed">
                                &ldquo;{sug.original}&rdquo;
                              </p>
                            </div>

                            {/* Improved */}
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded">
                                Optimized Aligned bullet
                              </span>
                              <p className="text-xs text-zinc-800 dark:text-zinc-200 font-bold leading-relaxed">
                                &ldquo;{sug.improved}&rdquo;
                              </p>
                            </div>
                          </div>

                          {sug.reason && (
                            <div className="text-[10px] text-zinc-400 italic flex items-start gap-1 bg-zinc-50 dark:bg-zinc-950/20 p-2 rounded-lg border border-zinc-100 dark:border-white/[0.01]">
                              <Sparkles className="h-3 w-3 text-indigo-400 mt-0.5 shrink-0" />
                              <span className="flex-1 leading-normal font-medium">{sug.reason}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Missing Keywords */}
                {activeRun.missing_keywords && activeRun.missing_keywords.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
                      Target Keywords identified & Integrated
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeRun.missing_keywords.map((kw, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide bg-zinc-100 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08]"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right PDF Frame */}
              <div className="w-[450px] border-l border-zinc-200 dark:border-white/[0.05] bg-zinc-100/50 dark:bg-zinc-950/20 flex flex-col shrink-0 overflow-hidden relative">
                <div className="p-4 border-b border-zinc-200 dark:border-white/[0.05] flex items-center justify-between shrink-0 bg-white dark:bg-zinc-950/40">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Live Compiled LaTeX PDF
                  </span>
                  <button
                    onClick={handleDownloadPdf}
                    className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] flex items-center justify-center border-none shrink-0"
                    title="Download LaTeX PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 relative bg-zinc-900/5 dark:bg-zinc-950/40">
                  {activeRun.pdf_base64 ? (
                    <iframe
                      src={`data:application/pdf;base64,${activeRun.pdf_base64}#toolbar=0&navpanes=0`}
                      className="w-full h-full border-none"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 text-xs">
                      <FileText className="h-10 w-10 opacity-30 mb-2 animate-pulse" />
                      PDF compilation unavailable.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            /* ── PHASE 3: FORM / UPLOAD VIEW ── */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex-1 overflow-y-auto p-8 flex items-center justify-center text-left"
            >
              <div className="w-full max-w-xl space-y-6">
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto scale-110">
                    <Trophy className="h-6 w-6 text-indigo-500" />
                  </div>
                  <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                    ATS Match & Tailor
                  </h1>
                  <p className="text-sm text-zinc-500 max-w-md mx-auto">
                    Secure, sandbox-grade career optimization. Upload your current resume and paste a target Job Description to align and score.
                  </p>
                </div>

                {/* Step 1: Upload Resume File */}
                <div className="p-5 border border-zinc-200 dark:border-white/[0.04] bg-white dark:bg-zinc-900/50 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2 py-0.5 rounded">
                      Step 1
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      Upload Current Resume
                    </span>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        if (ALLOWED_MIME_TYPES.has(file.type)) {
                          setSelectedFile(file);
                        } else {
                          toast({
                            title: "Unsupported file",
                            description: "Please upload a valid PDF or DOCX file.",
                            variant: "destructive",
                          });
                        }
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed cursor-pointer rounded-xl transition-all min-h-[120px] ${
                      isDragOver
                        ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/[0.04]"
                        : "border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-white/[0.005] hover:border-zinc-400"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setSelectedFile(file);
                      }}
                      className="hidden"
                    />

                    {selectedFile ? (
                      <div className="text-center space-y-1 select-none">
                        <FileText className="h-6 w-6 text-indigo-500 mx-auto" />
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          {selectedFile.name}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Ready
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                          className="text-[9px] font-black uppercase text-red-500 hover:text-red-600 transition-all border-none bg-transparent pt-1"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <div className="text-center space-y-1 select-none">
                        <Upload className="h-6 w-6 text-zinc-400 mx-auto opacity-70" />
                        <p className="text-xs font-bold text-zinc-500">
                          {isDragOver ? "Drop file to upload" : "Drag & drop PDF or DOCX"}
                        </p>
                        <p className="text-[10px] text-zinc-400">or click to browse files (Max 5MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2: Paste Job Link / URL (Parsed) */}
                <div className="p-5 border border-zinc-200 dark:border-white/[0.04] bg-white dark:bg-zinc-900/50 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2 py-0.5 rounded">
                      Step 2
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      Import from Link or Paste JD
                    </span>
                  </div>

                  {/* Link Parser */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                      <Input
                        value={jobUrl}
                        onChange={(e) => setJobUrl(e.target.value)}
                        placeholder="Paste target job link (e.g. LinkedIn, Indeed, etc.)"
                        className="pl-9 h-9 text-xs"
                      />
                    </div>
                    <button
                      onClick={handleParseJobUrl}
                      disabled={isParsingUrl || !jobUrl}
                      className="h-9 px-4 rounded-xl text-xs font-black bg-zinc-100 dark:bg-white/[0.06] hover:bg-zinc-200 dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 uppercase border border-zinc-200 dark:border-white/[0.08] disabled:opacity-40 select-none cursor-pointer"
                    >
                      {isParsingUrl ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ExternalLink className="h-3.5 w-3.5" />
                      )}
                      Parse URL
                    </button>
                  </div>

                  {/* Textarea */}
                  <Textarea
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Alternatively, paste the full job description text here..."
                    className="min-h-[140px] text-xs leading-relaxed"
                  />
                </div>

                {/* Run ATS align button */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleRunTailoring}
                    disabled={!selectedFile || !jdText || jdText.trim().length < 20}
                    className="flex items-center gap-2.5 h-11 px-6 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider select-none"
                  >
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    Run ATS Match & Tailor
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
