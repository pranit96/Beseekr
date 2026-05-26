import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useResume } from "@/contexts/ResumeContext";
import {
  resumeApi,
  type ResumeSchema,
  type TailorRunRecord,
} from "@/api/resume";
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
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Target,
  Zap,
  LayoutGrid,
  Eye,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_EXT = /\.(pdf|docx)$/i;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type MobileTab = "new" | "history" | "results" | "preview";

export default function ResumeTailor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resumeData, setResumeData, setWorkspaceMode, setShowOnboarding } =
    useResume();
  const isResumeBlank =
    !resumeData?.personal_info?.name && resumeData?.experience?.length === 0;

  // History & active run
  const [runs, setRuns] = useState<TailorRunRecord[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);
  const [activeRun, setActiveRun] = useState<TailorRunRecord | null>(null);

  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [displayPercent, setDisplayPercent] = useState(0);
  const [processingStep, setProcessingStep] = useState(0);

  // UI state
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>("new");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const processingSteps = [
    "Parsing your resume structure…",
    "Analyzing job requirements…",
    "Aligning keywords & outcomes…",
    "Applying Google XYZ format…",
    "Compiling LaTeX PDF…",
    "Scoring ATS compatibility…",
  ];

  useEffect(() => {
    const on = () => {
      setIsOnline(true);
      toast({ title: "Back online", description: "Connection restored." });
    };
    const off = () => {
      setIsOnline(false);
      toast({
        title: "Offline",
        description: "Results saved to cloud when reconnected.",
        variant: "destructive",
      });
    };
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [toast]);

  useEffect(() => {
    const jd = sessionStorage.getItem("tailor_jdText");
    const url = sessionStorage.getItem("tailor_jobUrl");
    if (jd) setJdText(jd);
    if (url) setJobUrl(url);
  }, []);

  const handleJdTextChange = (text: string) => {
    setJdText(text);
    sessionStorage.setItem("tailor_jdText", text);
  };
  const handleJobUrlChange = (url: string) => {
    setJobUrl(url);
    sessionStorage.setItem("tailor_jobUrl", url);
  };

  const loadRuns = useCallback(async (selectFirst = false) => {
    setIsLoadingRuns(true);
    try {
      const data = await resumeApi.getTailorRuns();
      setRuns(data);
      if (selectFirst && data.length > 0) setActiveRun(data[0]);
    } catch (e) {
      console.error("Failed to load runs:", e);
    } finally {
      setIsLoadingRuns(false);
    }
  }, []);

  useEffect(() => {
    loadRuns(true);
  }, [loadRuns]);

  const handleParseJobUrl = async () => {
    if (!jobUrl || !jobUrl.trim().startsWith("http")) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid HTTP/HTTPS job link.",
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
          title: "Job parsed!",
          description: `Extracted JD for ${result.job_title || "role"} at ${result.company_name || "company"}.`,
        });
      } else throw new Error("No job description found.");
    } catch (e: any) {
      toast({
        title: "Parse failed",
        description: e.message || "Could not extract job description.",
        variant: "destructive",
      });
    } finally {
      setIsParsingUrl(false);
    }
  };

  const handleDeleteRun = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await resumeApi.deleteTailorRun(id);
      toast({ title: "Run deleted" });
      setRuns((prev) => prev.filter((r) => r.id !== id));
      if (activeRun?.id === id) setActiveRun(null);
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleRunTailoring = async () => {
    if (!selectedFile && isResumeBlank) {
      toast({
        title: "No resume",
        description:
          "Upload a resume file or fill your workspace resume first.",
        variant: "destructive",
      });
      return;
    }
    if (!jdText || jdText.trim().length < 20) {
      toast({
        title: "Job description too short",
        description: "Paste at least 20 characters of job description.",
        variant: "destructive",
      });
      return;
    }
    setIsProcessing(true);
    setDisplayPercent(0);
    setProcessingStep(0);

    const pct = setInterval(() => {
      setDisplayPercent((prev) => {
        const next = prev + Math.floor(Math.random() * 6) + 2;
        return next >= 95 ? 95 : next;
      });
    }, 350);

    const stepInterval = setInterval(() => {
      setProcessingStep((prev) =>
        prev < processingSteps.length - 1 ? prev + 1 : prev,
      );
    }, 2000);

    try {
      const result = await resumeApi.tailorAlignResume(selectedFile, jdText);
      clearInterval(pct);
      clearInterval(stepInterval);
      setDisplayPercent(100);
      toast({
        title: "Done! Resume tailored ✓",
        description: "Your ATS-optimized resume is ready.",
      });
      setTimeout(async () => {
        setIsProcessing(false);
        setSelectedFile(null);
        setJdText("");
        setJobUrl("");
        sessionStorage.removeItem("tailor_jdText");
        sessionStorage.removeItem("tailor_jobUrl");
        await loadRuns(false);
        setActiveRun(result as unknown as TailorRunRecord);
        setMobileTab("results");
      }, 800);
    } catch (err: any) {
      clearInterval(pct);
      clearInterval(stepInterval);
      setIsProcessing(false);
      toast({
        title: "Tailoring failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleApplyToWorkspace = () => {
    if (!activeRun?.resume) return;
    setResumeData(activeRun.resume);
    setWorkspaceMode("upload", true);
    setShowOnboarding(false);
    toast({
      title: "Draft loaded!",
      description: "Switched to editor with tailored resume.",
    });
    navigate("/dashboard/hired/resume/workspace");
  };

  const handleDownloadPdf = () => {
    if (!activeRun?.pdf_base64) return;
    try {
      const bytes = Uint8Array.from(atob(activeRun.pdf_base64), (c) =>
        c.charCodeAt(0),
      );
      const blob = new Blob([bytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${activeRun.company_name.replace(/\s+/g, "_")}_Resume.pdf`;
      link.click();
      toast({ title: "Downloading PDF…" });
    } catch (e: any) {
      toast({
        title: "Download failed",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const scoreColor = (score: number) =>
    score >= 85
      ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
      : score >= 70
        ? "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
        : "text-amber-500 bg-amber-500/10 border-amber-500/20";

  const scoreRingColor = (score: number) =>
    score >= 85 ? "#10b981" : score >= 70 ? "#818cf8" : "#f59e0b";

  // ─── SIDEBAR ──────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside
      className={`flex flex-col bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-white/[0.05] transition-all duration-300 shrink-0 ${sidebarOpen ? "w-64" : "w-0 overflow-hidden border-none"}`}
    >
      <div className="p-3 border-b border-zinc-200 dark:border-white/[0.05] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-indigo-400" />
          <span className="text-[11px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
            History
          </span>
          {runs.length > 0 && (
            <span className="text-[9px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded-md">
              {runs.length}
            </span>
          )}
        </div>
        <button
          onClick={() => {
            setActiveRun(null);
            setMobileTab("new");
          }}
          className="h-7 w-7 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 flex items-center justify-center border-none cursor-pointer transition-colors"
          title="New tailoring run"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoadingRuns ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Loading…
            </span>
          </div>
        ) : runs.length === 0 ? (
          <div className="m-2 p-4 border-2 border-dashed border-zinc-200 dark:border-white/[0.05] rounded-xl text-center">
            <Trophy className="h-7 w-7 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
            <p className="text-[11px] font-bold text-zinc-500">No runs yet</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Tailored resumes appear here
            </p>
          </div>
        ) : (
          runs.map((run) => {
            const isActive = activeRun?.id === run.id;
            return (
              <button
                key={run.id}
                onClick={() => {
                  setActiveRun(run);
                  setMobileTab("results");
                }}
                className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer group relative ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-500/[0.08] border-indigo-300 dark:border-indigo-500/40"
                    : "bg-transparent border-transparent hover:bg-zinc-50 dark:hover:bg-white/[0.02] hover:border-zinc-200 dark:hover:border-white/[0.05]"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate leading-tight">
                    {run.company_name}
                  </span>
                  <span
                    className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 ${scoreColor(run.ats_score)}`}
                  >
                    {run.ats_score}%
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-zinc-400 truncate">
                    {run.job_title}
                  </span>
                  <span className="text-[9px] text-zinc-400 shrink-0">
                    {new Date(run.saved_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDeleteRun(e, run.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-5 w-5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center border-none cursor-pointer transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );

  // ─── PROCESSING OVERLAY ───────────────────────────────────────────────────
  const ProcessingOverlay = () => (
    <motion.div
      key="processing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-white/97 dark:bg-zinc-950/97 z-50 flex flex-col items-center justify-center p-8"
    >
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="relative mx-auto h-20 w-20">
          <div className="absolute inset-0 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Sparkles className="h-9 w-9 text-indigo-500" />
          </div>
          <div className="absolute -inset-2 rounded-3xl border-2 border-indigo-300/30 border-t-indigo-500 animate-spin" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">
            Tailoring your resume
          </h2>
          <AnimatePresence mode="wait">
            <motion.p
              key={processingStep}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-sm text-zinc-500"
            >
              {processingSteps[processingStep]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <Progress
            value={displayPercent}
            className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full"
          />
          <p className="text-[11px] font-bold text-zinc-400 tabular-nums">
            {displayPercent}% complete
          </p>
        </div>

        <div className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-2.5 leading-relaxed">
          Results are saved to the cloud — safe to navigate away.
        </div>
      </div>
    </motion.div>
  );

  // ─── NEW TAILORING FORM ───────────────────────────────────────────────────
  const TailoringForm = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Target className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">
                ATS Match & Tailor
              </h1>
              <p className="text-[11px] text-zinc-500">
                Align your resume to any job description
              </p>
            </div>
          </div>
          {!isResumeBlank && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg px-3 py-1.5 w-fit">
              <Check className="h-3.5 w-3.5" />
              Active workspace resume loaded
            </div>
          )}
        </div>

        {/* Step 1 */}
        <div className="border border-zinc-200 dark:border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/[0.04] bg-zinc-50/50 dark:bg-white/[0.01] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-500 text-white px-2 py-0.5 rounded-md">
                01
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Resume File
              </span>
            </div>
            {selectedFile && (
              <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                <Check className="h-3 w-3" /> Ready
              </span>
            )}
          </div>
          <div className="p-4">
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
                if (
                  file &&
                  (ALLOWED_MIME_TYPES.has(file.type) ||
                    ALLOWED_EXT.test(file.name))
                ) {
                  setSelectedFile(file);
                } else {
                  toast({
                    title: "Unsupported file",
                    description: "Please upload PDF or DOCX.",
                    variant: "destructive",
                  });
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex items-center gap-4 p-4 border-2 border-dashed cursor-pointer rounded-xl transition-all ${
                isDragOver
                  ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/[0.04]"
                  : selectedFile
                    ? "border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-500/[0.03]"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-zinc-50/50 dark:bg-white/[0.01]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setSelectedFile(f);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              />
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${selectedFile ? "bg-emerald-500/10" : "bg-zinc-100 dark:bg-white/[0.04]"}`}
              >
                {selectedFile ? (
                  <FileText className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Upload className="h-5 w-5 text-zinc-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {selectedFile ? (
                  <>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                      {isDragOver
                        ? "Drop file here"
                        : "Drag & drop or click to upload"}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      {!isResumeBlank
                        ? "Optional — skip to use active workspace resume"
                        : "PDF or DOCX · Max 5 MB"}
                    </p>
                  </>
                )}
              </div>
              {selectedFile && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="h-7 w-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center border-none cursor-pointer shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="border border-zinc-200 dark:border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/[0.04] bg-zinc-50/50 dark:bg-white/[0.01] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-500 text-white px-2 py-0.5 rounded-md">
                02
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Job Description
              </span>
            </div>
            {jdText.trim().length >= 20 && (
              <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                <Check className="h-3 w-3" /> {jdText.trim().length} chars
              </span>
            )}
          </div>
          <div className="p-4 space-y-3">
            {/* URL Parser */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                <Input
                  value={jobUrl}
                  onChange={(e) => handleJobUrlChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleParseJobUrl()}
                  placeholder="Paste job link to auto-import…"
                  className="pl-8 h-9 text-sm border-zinc-200 dark:border-white/[0.06] rounded-xl"
                />
              </div>
              <button
                onClick={handleParseJobUrl}
                disabled={isParsingUrl || !jobUrl}
                className="h-9 px-3.5 rounded-xl text-xs font-black bg-zinc-100 dark:bg-white/[0.06] hover:bg-zinc-200 dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 border border-zinc-200 dark:border-white/[0.08] disabled:opacity-40 cursor-pointer transition-colors whitespace-nowrap"
              >
                {isParsingUrl ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="h-3.5 w-3.5" />
                )}
                {isParsingUrl ? "Parsing…" : "Parse"}
              </button>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-zinc-400 select-none">
              <div className="flex-1 h-px bg-zinc-200 dark:bg-white/[0.05]" />
              <span>or paste manually</span>
              <div className="flex-1 h-px bg-zinc-200 dark:bg-white/[0.05]" />
            </div>

            <Textarea
              value={jdText}
              onChange={(e) => handleJdTextChange(e.target.value)}
              placeholder="Paste the full job description here…"
              className="min-h-[180px] text-sm leading-relaxed border-zinc-200 dark:border-white/[0.06] rounded-xl resize-none"
            />
          </div>
        </div>

        {/* Run Button */}
        <button
          onClick={handleRunTailoring}
          disabled={
            (!selectedFile && isResumeBlank) ||
            !jdText ||
            jdText.trim().length < 20
          }
          className="w-full h-12 rounded-xl text-sm font-black bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none uppercase tracking-wider"
        >
          <Zap className="h-4 w-4" />
          Run ATS Match & Tailor
        </button>
      </div>
    </div>
  );

  // ─── RESULTS PANEL ────────────────────────────────────────────────────────
  const ResultsPanel = () => {
    if (!activeRun) return null;
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 space-y-6">
          {/* Header bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-white/[0.05]">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">
                Tailored Result
              </p>
              <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">
                {activeRun.company_name}
              </h1>
              <p className="text-sm text-zinc-500 font-medium">
                {activeRun.job_title}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleApplyToWorkspace}
                className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-black bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 transition-colors uppercase tracking-wide cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Apply Draft
              </button>
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-black bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 border-none transition-opacity uppercase tracking-wide cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </button>
            </div>
          </div>

          {/* Score + Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Score ring */}
            <div className="sm:col-span-1 border border-zinc-200 dark:border-white/[0.05] bg-white dark:bg-zinc-900/30 rounded-2xl p-5 flex flex-col items-center justify-center gap-3">
              <svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                className="-rotate-90"
              >
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="currentColor"
                  className="text-zinc-100 dark:text-white/[0.05]"
                  strokeWidth="6"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke={scoreRingColor(activeRun.ats_score)}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - activeRun.ats_score / 100)}`}
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                />
              </svg>
              <div className="text-center -mt-1">
                <p className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                  {activeRun.ats_score}%
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  ATS Score
                </p>
              </div>
            </div>

            {/* Feedback */}
            <div className="sm:col-span-3 border border-zinc-200 dark:border-white/[0.05] bg-white dark:bg-zinc-900/30 rounded-2xl p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
                Executive Summary
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {activeRun.general_feedback}
              </p>
            </div>
          </div>

          {/* Bullet improvements */}
          {activeRun.bullet_point_suggestions?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-indigo-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Bullet Improvements
                </h3>
                <span className="text-[10px] bg-zinc-100 dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-md font-bold">
                  {activeRun.bullet_point_suggestions.length}
                </span>
              </div>

              <div className="space-y-3">
                {activeRun.bullet_point_suggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    className="border border-zinc-200 dark:border-white/[0.05] bg-white dark:bg-zinc-900/30 rounded-2xl overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100 dark:divide-white/[0.04]">
                      <div className="p-4 space-y-2">
                        <span className="inline-block text-[9px] font-black uppercase tracking-wider text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-2 py-0.5 rounded">
                          Before
                        </span>
                        <p className="text-xs text-zinc-500 italic leading-relaxed">
                          "{sug.original}"
                        </p>
                      </div>
                      <div className="p-4 space-y-2">
                        <span className="inline-block text-[9px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded">
                          After
                        </span>
                        <p className="text-xs text-zinc-800 dark:text-zinc-100 font-semibold leading-relaxed">
                          "{sug.improved}"
                        </p>
                      </div>
                    </div>
                    {sug.reason && (
                      <div className="px-4 py-2.5 bg-zinc-50/80 dark:bg-white/[0.01] border-t border-zinc-100 dark:border-white/[0.04] flex gap-2 items-start">
                        <Sparkles className="h-3 w-3 text-indigo-400 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          {sug.reason}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keywords */}
          {activeRun.missing_keywords?.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Keywords Integrated
              </p>
              <div className="flex flex-wrap gap-2">
                {activeRun.missing_keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-[11px] font-bold bg-zinc-100 dark:bg-white/[0.05] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08] flex items-center gap-1.5"
                  >
                    <Check className="h-3 w-3 text-emerald-500" />
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── PDF PREVIEW PANEL ────────────────────────────────────────────────────
  const PdfPanel = () => (
    <div
      className="flex flex-col bg-zinc-100 dark:bg-zinc-950/40 h-full overflow-hidden border-l border-zinc-200 dark:border-white/[0.05]"
      style={{ width: "420px", minWidth: "420px" }}
    >
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/[0.05] bg-white dark:bg-zinc-950/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-zinc-400" />
          <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
            PDF Preview
          </span>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={!activeRun?.pdf_base64}
          className="h-7 px-3 rounded-lg bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-600 dark:text-zinc-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-zinc-200 dark:border-white/[0.06] disabled:opacity-40 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </button>
      </div>
      <div className="flex-1 relative">
        {activeRun?.pdf_base64 ? (
          <iframe
            src={`data:application/pdf;base64,${activeRun.pdf_base64}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            className="absolute inset-0 w-full h-full border-none"
            title="Tailored Resume PDF"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <FileText className="h-10 w-10 opacity-20" />
            <p className="text-sm font-medium">No PDF available</p>
          </div>
        )}
      </div>
    </div>
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full min-h-[calc(100vh-100px)] flex flex-col bg-zinc-50 dark:bg-[#070709] border border-zinc-200 dark:border-white/[0.04] rounded-2xl overflow-hidden font-sans relative">
      {/* Offline banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-0 left-0 right-0 z-50 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold py-2 px-4 flex items-center justify-center gap-2"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Offline — results will sync when connection is restored
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DESKTOP LAYOUT ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-12 w-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] border-l-0 rounded-r-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer transition-colors"
          style={{
            left: sidebarOpen ? "256px" : "0px",
            transition: "left 0.3s",
          }}
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-3 w-3" />
          ) : (
            <PanelLeftOpen className="h-3 w-3" />
          )}
        </button>

        {/* Main area */}
        <div className="flex-1 flex overflow-hidden relative bg-white dark:bg-zinc-900/10">
          <AnimatePresence mode="wait">
            {isProcessing && <ProcessingOverlay />}
          </AnimatePresence>

          {activeRun ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex overflow-hidden"
            >
              <ResultsPanel />
              <PdfPanel />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex overflow-hidden"
            >
              <TailoringForm />
            </motion.div>
          )}
        </div>
      </div>

      {/* ── MOBILE LAYOUT ──────────────────────────────────────────────── */}
      <div className="flex lg:hidden flex-col flex-1 overflow-hidden">
        {/* Mobile content area */}
        <div className="flex-1 overflow-hidden relative bg-white dark:bg-zinc-900/10">
          <AnimatePresence mode="wait">
            {isProcessing && <ProcessingOverlay />}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {mobileTab === "new" && (
              <motion.div
                key="m-form"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="absolute inset-0 overflow-y-auto"
              >
                <TailoringForm />
              </motion.div>
            )}
            {mobileTab === "history" && (
              <motion.div
                key="m-history"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="absolute inset-0 overflow-y-auto bg-white dark:bg-zinc-950"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      History
                    </h2>
                    <button
                      onClick={() => {
                        setActiveRun(null);
                        setMobileTab("new");
                      }}
                      className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border-none cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {isLoadingRuns ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                    </div>
                  ) : runs.length === 0 ? (
                    <div className="py-16 text-center">
                      <Trophy className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                      <p className="text-sm font-bold text-zinc-500">
                        No runs yet
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Start a new tailoring run
                      </p>
                    </div>
                  ) : (
                    runs.map((run) => (
                      <button
                        key={run.id}
                        onClick={() => {
                          setActiveRun(run);
                          setMobileTab("results");
                        }}
                        className="w-full text-left p-3.5 border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900/50 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-colors"
                      >
                        <div
                          className={`shrink-0 text-xs font-black px-2 py-1 rounded-lg border ${scoreColor(run.ats_score)}`}
                        >
                          {run.ats_score}%
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">
                            {run.company_name}
                          </p>
                          <p className="text-xs text-zinc-400 truncate">
                            {run.job_title}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-zinc-300 shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
            {mobileTab === "results" && activeRun && (
              <motion.div
                key="m-results"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="absolute inset-0 overflow-y-auto"
              >
                <ResultsPanel />
              </motion.div>
            )}
            {mobileTab === "preview" && activeRun && (
              <motion.div
                key="m-preview"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="absolute inset-0 flex flex-col"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/[0.05] bg-white dark:bg-zinc-950 flex items-center justify-between shrink-0">
                  <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                    PDF Preview
                  </span>
                  <button
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-1.5 text-[11px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-lg px-3 py-1.5 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                </div>
                <div className="flex-1 relative bg-zinc-100 dark:bg-zinc-950/40">
                  {activeRun.pdf_base64 ? (
                    <iframe
                      src={`data:application/pdf;base64,${activeRun.pdf_base64}#toolbar=0&navpanes=0`}
                      className="absolute inset-0 w-full h-full border-none"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-400">
                      <FileText className="h-10 w-10 opacity-20" />
                      <p className="text-sm">No PDF available</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile bottom nav */}
        <nav className="shrink-0 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-white/[0.06] px-2 py-2 safe-area-inset-bottom">
          <div className="flex gap-1">
            {[
              { id: "new" as MobileTab, icon: Plus, label: "New" },
              {
                id: "history" as MobileTab,
                icon: Clock,
                label: `Runs${runs.length > 0 ? ` (${runs.length})` : ""}`,
              },
              ...(activeRun
                ? [
                    {
                      id: "results" as MobileTab,
                      icon: LayoutGrid,
                      label: "Results",
                    },
                    { id: "preview" as MobileTab, icon: Eye, label: "PDF" },
                  ]
                : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMobileTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all cursor-pointer border-none ${
                  mobileTab === tab.id
                    ? "bg-indigo-50 dark:bg-indigo-500/[0.08] text-indigo-600 dark:text-indigo-400"
                    : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 bg-transparent"
                }`}
              >
                <tab.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                <span className="text-[9px] font-black uppercase tracking-wide">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
