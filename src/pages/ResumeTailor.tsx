import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useResume } from "@/contexts/ResumeContext";
import { resumeApi, type TailorRunRecord } from "@/api/resume";
import { TailorResultsView } from "@/components/resume/TailorResultsView";
import { useTailorJob } from "@/hooks/useTailorJob";
import ResumeTailorMobile from "./ResumeTailorMobile";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, Sparkles, Trophy, Trash2, Download,
  Check, Plus, Loader2, Briefcase, AlertTriangle, Link2,
  ExternalLink, ChevronRight, Target, Zap, Eye,
  ArrowLeft, X, RefreshCw, Clock, ChevronDown, PanelLeftClose,
} from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";

// ─── constants ─────────────────────────────────────────────────────────────
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_EXT = /\.(pdf|docx)$/i;

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

// ─── score helpers ──────────────────────────────────────────────────────────
const scoreClass = (s: number) =>
  s >= 85 ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
  : s >= 70 ? "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
  : "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";

const scoreStroke = (s: number) =>
  s >= 85 ? "#10b981" : s >= 70 ? "#6366f1" : "#f59e0b";

// ═══════════════════════════════════════════════════════════════════════════
export default function ResumeTailor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resumeData, setResumeData, setWorkspaceMode, setShowOnboarding, uploadedResumes } = useResume();
  const isResumeBlank = !resumeData?.personal_info?.name && !resumeData?.experience?.length;

  const isMobile = useIsMobile();

  // data
  const [runs, setRuns]               = useState<TailorRunRecord[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [activeRun, setActiveRun]     = useState<TailorRunRecord | null>(null);

  // form
  const [file, setFile]           = useState<File | null>(null);
  const [jd, setJd]               = useState("");
  const [url, setUrl]             = useState("");
  const [parsingUrl, setParsingUrl] = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const [mode, setMode]           = useState<"enhance" | "rewrite">("enhance");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [generateCL, setGenerateCL]   = useState(false);
  const [clCompanyName, setClCompanyName] = useState("");
  const [trackApp, setTrackApp]       = useState(false);
  const [trackedAppId, setTrackedAppId] = useState<string | null>(null);
  const [jobTitle, setJobTitle]       = useState("");
  const [activeResultView, setActiveResultView] = useState<"resume" | "cover_letter">("resume");
  const fileRef = useRef<HTMLInputElement>(null);

  const tailorJob = useTailorJob();
  const { processing, pct, stepIdx, stepMessage, steps: TAILOR_STEPS } = tailorJob;

  // ui
  const [online, setOnline] = useState(navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  // ── sync tracked application helper ─────────────────────────────────────────
  const syncTrackedApplication = async (shouldTrack: boolean, currentCompany = clCompanyName, currentJobTitle = jobTitle) => {
    if (shouldTrack) {
      if (trackedAppId) return;
      if (!currentCompany.trim()) return;
      try {
        const app = await resumeApi.createApplication({
          company_name: currentCompany.trim(),
          job_title: currentJobTitle.trim() || "Tailored Role",
          status: "Applied",
          job_url: url || undefined,
          jd_text: jd || undefined,
        });
        setTrackedAppId(app.id);
        toast({
          title: "Application Tracked 🎯",
          description: `${currentJobTitle.trim() || "Tailored Role"} at ${currentCompany.trim()} has been added to your Job Tracker.`,
        });
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Tracking failed",
          description: err.message || "Could not track this application.",
        });
      }
    } else {
      if (trackedAppId) {
        try {
          await resumeApi.deleteApplication(trackedAppId);
          setTrackedAppId(null);
          toast({
            title: "Application Untracked ✕",
            description: "Removed from your Job Tracker.",
          });
        } catch (err: any) {
          toast({
            variant: "destructive",
            title: "Failed to untrack",
            description: err.message || "Could not remove application.",
          });
        }
      }
    }
  };

  const handleFieldBlur = async (currentCompany = clCompanyName, currentJobTitle = jobTitle) => {
    if (trackApp && currentCompany.trim()) {
      if (trackedAppId) {
        try {
          await resumeApi.updateApplication(trackedAppId, {
            company_name: currentCompany.trim(),
            job_title: currentJobTitle.trim() || "Tailored Role",
          });
        } catch {}
      } else {
        await syncTrackedApplication(true, currentCompany, currentJobTitle);
      }
    }
  };

  // ── session restore ──────────────────────────────────────────────────────
  useEffect(() => {
    const j = sessionStorage.getItem("tr_jd"), u = sessionStorage.getItem("tr_url");
    if (j) setJd(j);
    if (u) setUrl(u);
  }, []);

  // ── online/offline ───────────────────────────────────────────────────────
  useEffect(() => {
    const on  = () => { setOnline(true);  toast({ title: "Back online" }); };
    const off = () => { setOnline(false); toast({ title: "Offline — results cloud-saved", variant: "destructive" }); };
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, [toast]);

  // ── load history ─────────────────────────────────────────────────────────
  const loadRuns = useCallback(async (first = false) => {
    setLoadingRuns(true);
    try {
      const data = await resumeApi.getTailorRuns();
      setRuns(data);
      // Never auto-open last run — user always lands on the new-run form.
    } catch { /* silent */ }
    finally { setLoadingRuns(false); }
  }, []);

  useEffect(() => { loadRuns(true); }, [loadRuns]);

  useEffect(() => {
    setActiveResultView("resume");
  }, [activeRun]);

  // ── parse url ────────────────────────────────────────────────────────────
  const parseUrl = async () => {
    if (!url.trim().startsWith("http")) {
      toast({ title: "Invalid URL", variant: "destructive" }); return;
    }
    setParsingUrl(true);
    try {
      const r = await resumeApi.parseJobUrl(url);
      if (!r.jd_text) throw new Error("Nothing found");
      setJd(r.jd_text);
      sessionStorage.setItem("tr_jd", r.jd_text);
      if (r.company_name) setClCompanyName(r.company_name);
      if (r.job_title) setJobTitle(r.job_title);
      toast({ title: `Imported: ${r.job_title || "role"} @ ${r.company_name || "company"}` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Parse failed", description: msg, variant: "destructive" });
    } finally { setParsingUrl(false); }
  };

  // ── delete run ───────────────────────────────────────────────────────────
  const deleteRun = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await resumeApi.deleteTailorRun(id);
      setRuns(p => p.filter(r => r.id !== id));
      if (activeRun?.id === id) { setActiveRun(null); }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    }
  };

  // ── run tailoring (signed upload + async worker + socket progress) ────────
  const runTailoring = async () => {
    if (!file && !selectedResumeId && isResumeBlank) {
      toast({ title: "No resume loaded", description: "Upload a file or fill workspace resume.", variant: "destructive" }); return;
    }
    if (jd.trim().length < 20) {
      toast({ title: "Job description too short", variant: "destructive" }); return;
    }

    try {
      const result = await tailorJob.run({
        file,
        jd,
        mode,
        resumeId: selectedResumeId || undefined,
        generateCoverLetter: generateCL,
        companyName: clCompanyName || undefined,
        jobTitle: jobTitle || undefined,
      });
      toast({ title: "Resume tailored ✓" });
      setFile(null);
      setJd("");
      setUrl("");
      setGenerateCL(false);
      setClCompanyName("");
      setTrackApp(false);
      setTrackedAppId(null);
      setJobTitle("");
      sessionStorage.removeItem("tr_jd");
      sessionStorage.removeItem("tr_url");
      await loadRuns(false);
      setActiveRun(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Tailoring failed", description: msg, variant: "destructive" });
    }
  };

  // ── accept file ──────────────────────────────────────────────────────────
  const acceptFile = (f: File) => {
    if (!ALLOWED_MIME.has(f.type) && !ALLOWED_EXT.test(f.name)) {
      toast({ title: "Unsupported file", description: "Please upload a PDF or DOCX file.", variant: "destructive" });
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5 MB.", variant: "destructive" });
      return;
    }
    setFile(f);
    setSelectedResumeId("");
  };

  // ── download pdf ──────────────────────────────────────────────────────────
  const downloadPdf = () => {
    if (!activeRun?.pdf_base64) {
      toast({ title: "No PDF available", variant: "destructive" }); return;
    }
    const byteStr = atob(activeRun.pdf_base64);
    const bytes = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeRun.company_name ?? "resume"}_tailored.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCoverLetterPdf = () => {
    if (!activeRun?.cover_letter_pdf_base64) {
      toast({ title: "No Cover Letter PDF available", variant: "destructive" }); return;
    }
    const byteStr = atob(activeRun.cover_letter_pdf_base64);
    const bytes = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeRun.company_name ?? "Cover_Letter"}_Cover_Letter.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCoverLetterWord = async () => {
    if (!activeRun?.cover_letter_text) {
      toast({ title: "No Cover Letter text available", variant: "destructive" }); return;
    }
    try {
      toast({ title: "Generating Word document...", description: "Converting cover letter..." });
      const objectUrl = await resumeApi.downloadCoverLetterWord(activeRun.resume, activeRun.cover_letter_text);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${activeRun.company_name ?? "Cover_Letter"}_Cover_Letter.docx`;
      a.click();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err: any) {
      toast({ title: "Word generation failed", description: err.message, variant: "destructive" });
    }
  };

  // ── apply to workspace ────────────────────────────────────────────────────
  const applyWorkspace = () => {
    if (!activeRun?.resume) return;
    setResumeData(activeRun.resume);
    setWorkspaceMode("upload", true);
    setShowOnboarding(false);
    navigate("/dashboard/resume/workspace");
    toast({ title: "Draft applied to workspace ✓" });
  };

  if (isMobile) {
    return (
      <div className="w-full h-full flex flex-col font-sans relative bg-background text-foreground animate-fadeIn overflow-hidden">
        <AnimatePresence>
          {processing && (
            <motion.div
              key="mobile-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md"
            >
              <div className="w-full max-w-xs mx-auto px-6 text-center space-y-7">
                {/* Spinner ring */}
                <div className="relative mx-auto w-24 h-24">
                  <svg width="96" height="96" viewBox="0 0 96 96" className="absolute inset-0 -rotate-90">
                    <circle cx="48" cy="48" r="40" fill="none" className="stroke-muted/30" strokeWidth="5" />
                    <circle cx="48" cy="48" r="40" fill="none" stroke="#818cf8" strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={String(2 * Math.PI * 40)}
                      strokeDashoffset={String(2 * Math.PI * 40 * (1 - pct / 100))}
                      style={{ transition: "stroke-dashoffset 0.4s ease", filter: "drop-shadow(0 0 8px rgba(129,140,248,0.4))" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-foreground tabular-nums">{pct}%</span>
                  </div>
                </div>

                {/* Step text */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-foreground tracking-tight">Tailoring your resume…</h3>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={stepIdx}
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.25 }}
                      className="text-sm font-medium text-muted-foreground"
                    >
                      {stepMessage || TAILOR_STEPS[stepIdx]}
                    </motion.p>
                  </AnimatePresence>
                </div>

                {/* Step dots */}
                <div className="flex items-center justify-center gap-1.5">
                  {TAILOR_STEPS.map((_, i) => (
                    <div key={i} className={`rounded-full transition-all duration-300 ${i <= stepIdx ? "bg-primary" : "bg-muted"}`}
                      style={{
                        width: i === stepIdx ? 22 : 6,
                        height: 6,
                      }}
                    />
                  ))}
                </div>

                {/* Cloud note */}
                <p className="text-xs font-semibold rounded-xl px-4 py-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  ☁ Compiling in the cloud — safe to navigate away
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ResumeTailorMobile
          generateCL={generateCL}
          setGenerateCL={setGenerateCL}
          clCompanyName={clCompanyName}
          setClCompanyName={setClCompanyName}
          downloadCoverLetterPdf={downloadCoverLetterPdf}
          downloadCoverLetterWord={downloadCoverLetterWord}
          runs={runs}
          loadingRuns={loadingRuns}
          activeRun={activeRun}
          setActiveRun={setActiveRun}
          file={file}
          setFile={setFile}
          jd={jd}
          setJd={setJd}
          url={url}
          setUrl={setUrl}
          mode={mode}
          setMode={setMode}
          selectedResumeId={selectedResumeId}
          setSelectedResumeId={setSelectedResumeId}
          processing={processing}
          pct={pct}
          stepIdx={stepIdx}
          stepMessage={stepMessage}
          runTailoring={runTailoring}
          deleteRun={deleteRun}
          downloadPdf={downloadPdf}
          applyWorkspace={applyWorkspace}
          uploadedResumes={uploadedResumes}
          isResumeBlank={isResumeBlank}
          parseUrl={parseUrl}
          parsingUrl={parsingUrl}
          fmtSize={fmtSize}
          trackApp={trackApp}
          setTrackApp={setTrackApp}
          jobTitle={jobTitle}
          setJobTitle={setJobTitle}
          syncTrackedApplication={syncTrackedApplication}
          handleFieldBlur={handleFieldBlur}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background text-foreground">
      <GlobalHeader />

      {/* ── PROCESSING OVERLAY (fixed fullscreen, always on top) ───────── */}
      <AnimatePresence>
        {processing && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md"
          >
            <div className="w-full max-w-xs mx-auto px-6 text-center space-y-7">
              {/* Spinner ring */}
              <div className="relative mx-auto w-24 h-24">
                <svg width="96" height="96" viewBox="0 0 96 96" className="absolute inset-0 -rotate-90">
                  <circle cx="48" cy="48" r="40" fill="none" className="stroke-muted/30" strokeWidth="5" />
                  <circle cx="48" cy="48" r="40" fill="none" stroke="#818cf8" strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={String(2 * Math.PI * 40)}
                    strokeDashoffset={String(2 * Math.PI * 40 * (1 - pct / 100))}
                    style={{ transition: "stroke-dashoffset 0.4s ease", filter: "drop-shadow(0 0 8px rgba(129,140,248,0.4))" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-foreground tabular-nums">{pct}%</span>
                </div>
              </div>

              {/* Step text */}
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-foreground tracking-tight">Tailoring your resume…</h3>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={stepIdx}
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.25 }}
                    className="text-sm font-medium text-muted-foreground"
                  >
                    {stepMessage || TAILOR_STEPS[stepIdx]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Step dots */}
              <div className="flex items-center justify-center gap-1.5">
                {TAILOR_STEPS.map((_, i) => (
                  <div key={i} className={`rounded-full transition-all duration-300 ${i <= stepIdx ? "bg-primary" : "bg-muted"}`}
                    style={{
                      width: i === stepIdx ? 22 : 6,
                      height: 6,
                    }}
                  />
                ))}
              </div>

              {/* Cloud note */}
              <p className="text-xs font-semibold rounded-xl px-4 py-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                ☁ Compiling in the cloud — safe to navigate away
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── OFFLINE BANNER ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {!online && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="flex items-center justify-center gap-2 text-xs font-bold py-2 px-4 shrink-0 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" /> Offline — results sync automatically on reconnect
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOP BAR ────────────────────────────────────────────────────── */}
      <header className="shrink-0 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 border-b border-border bg-background">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 bg-indigo-500/10 border border-indigo-500/20">
            <Target className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-sm font-black text-foreground tracking-tight leading-tight">Optimize Resume</h1>
            <p className="text-[10px] hidden sm:block text-muted-foreground">Optimize and rewrite your resume for any job</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeRun && (
            <button
              onClick={() => setActiveRun(null)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-bold cursor-pointer border border-border bg-background text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Editor
            </button>
          )}
        </div>
      </header>

      {/* ── MAIN LAYOUT (Collapsible Split Container) ───────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`transition-all duration-300 ease-in-out border-r border-border bg-muted/30 flex-shrink-0 absolute md:relative z-40 md:z-20 h-full ${
            sidebarOpen
              ? "w-[85vw] max-w-[320px] md:w-80 2xl:w-96 opacity-100 translate-x-0"
              : "w-0 md:w-0 opacity-0 -translate-x-full md:translate-x-0"
          } overflow-hidden`}
        >
          <div className="h-full flex flex-col overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-border/60 bg-muted/20 shrink-0">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-indigo-400 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-widest text-foreground/80">
                  Past Runs
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  {runs.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setActiveRun(null);
                    setTrackApp(false); setTrackedAppId(null); setJobTitle("");
                    if (isMobile) setSidebarOpen(false);
                  }}
                  className="text-[10px] font-black flex items-center gap-1 cursor-pointer border-none bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-2.5 py-1 rounded-lg"
                >
                  <Plus className="h-3 w-3" /> New
                </button>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center border border-border bg-background text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Close sidebar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingRuns ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/30" />
                </div>
              ) : runs.length === 0 ? (
                <div className="py-12 text-center">
                  <Trophy className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-xs font-bold text-muted-foreground/60">No runs yet</p>
                  <p className="text-[10px] text-muted-foreground/40 max-w-xs mx-auto mt-1 leading-relaxed">
                    Optimized runs will appear here, letting you view or restore them anytime.
                  </p>
                </div>
              ) : (
                runs.map(run => {
                  const isActive = activeRun?.id === run.id;
                  return (
                    <button key={run.id}
                      onClick={() => {
                        setActiveRun(run);
                        if (isMobile) setSidebarOpen(false);
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer group relative ${
                        isActive
                          ? "bg-primary/10 border-primary/30 font-bold"
                          : "bg-card/30 border-border hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-foreground truncate">{run.company_name}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border shrink-0 ${scoreClass(run.ats_score)}`}>
                          {run.ats_score}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] truncate text-muted-foreground">{run.job_title}</span>
                        <span className="text-[9px] shrink-0 text-muted-foreground/60">
                          {new Date(run.saved_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <button
                        onClick={e => deleteRun(e, run.id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-5 w-5 rounded flex items-center justify-center border-none cursor-pointer transition-opacity bg-destructive/15 text-destructive hover:bg-destructive/25"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* Sidebar Toggle Handle */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 z-50 pointer-events-none transition-all duration-300 ${
            sidebarOpen
              ? "left-[calc(min(85vw,320px))] md:left-80 2xl:left-96 ml-0 -translate-x-1/2"
              : "left-0"
          }`}
        >
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className={`pointer-events-auto flex items-center justify-center transition-all duration-300 shadow-xl border bg-background/80 backdrop-blur-md cursor-pointer group
              ${
                sidebarOpen
                  ? "h-10 w-10 rounded-full border-border hover:bg-muted"
                  : "h-24 w-6 rounded-r-xl rounded-l-none border-border border-l-0 hover:w-8 hover:bg-muted/50 bg-gradient-to-b from-background via-muted/30 to-background hover:from-primary/10 hover:to-primary/5 hover:border-primary/30"
              }`}
            aria-label={sidebarOpen ? "Hide runs directory" : "Show runs directory"}
            title={sidebarOpen ? "Hide runs directory" : "Show runs directory"}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                <div className="w-1 h-1 rounded-full bg-foreground/60 group-hover:bg-primary transition-colors" />
                <div className="w-1 h-1 rounded-full bg-foreground/60 group-hover:bg-primary transition-colors" />
                <div className="w-1 h-1 rounded-full bg-foreground/60 group-hover:bg-primary transition-colors" />
              </div>
            )}
          </button>
        </div>

        {/* Main scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              {!activeRun ? (
                /* ═══════════════════════════════════════════════════════════
                   1. EDITOR VIEW (Horizontal Optimized layout)
                   ═══════════════════════════════════════════════════════════ */
                <motion.div
                  key="editor"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-5xl mx-auto"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Step 1 (Resume Select), Step 3 (Mode Selection) & CTA */}
                    <div className="lg:col-span-5 space-y-6">
                      {/* Active resume badge */}
                      {!isResumeBlank && (
                        <div className="flex items-center gap-2 text-xs font-bold w-fit px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Check className="h-3.5 w-3.5" />
                          Active workspace resume loaded
                        </div>
                      )}

                      {/* Step 1: Resume File & History Select */}
                      <div className="rounded-2xl overflow-hidden border border-border bg-card/45">
                        <div className="px-4 py-3 flex items-center justify-between border-b border-border/60 bg-muted/20">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[9px] font-black text-white px-2 py-0.5 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500">01</span>
                            <span className="text-[11px] font-black uppercase tracking-widest text-foreground/80">Resume File</span>
                          </div>
                          {(file || selectedResumeId) && (
                            <span className="text-[10px] font-bold flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <Check className="h-3 w-3" /> Ready
                            </span>
                          )}
                        </div>

                        <div className="p-4 space-y-4">
                          {/* Drag and Drop box */}
                          <div
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) acceptFile(f); }}
                            onClick={() => fileRef.current?.click()}
                            className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border-2 border-dashed ${
                              dragOver
                                ? "border-primary bg-primary/5"
                                : (file || selectedResumeId)
                                ? "border-emerald-500/40 bg-emerald-500/5"
                                : "border-border hover:border-muted-foreground/35 hover:bg-muted/10"
                            }`}
                          >
                            <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden"
                              onChange={e => { const f = e.target.files?.[0]; if (f) acceptFile(f); if (fileRef.current) fileRef.current.value = ""; }} />
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${(file || selectedResumeId) ? "bg-emerald-500/10" : "bg-muted"}`}>
                              {(file || selectedResumeId) ? <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : <Upload className="h-5 w-5 text-muted-foreground/60" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              {file || selectedResumeId ? (
                                <>
                                  <p className="text-sm font-bold text-foreground truncate">
                                    {file ? file.name : uploadedResumes.find(r => r.id === selectedResumeId)?.name}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {file ? fmtSize(file.size) : "Using past uploaded resume"}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm font-semibold text-foreground/70">
                                    {dragOver ? "Drop to upload" : "Drag & drop or click"}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground/60">
                                    {!isResumeBlank ? "Optional — skip to use active resume" : "PDF or DOCX · max 5 MB"}
                                  </p>
                                </>
                              )}
                            </div>
                            {(file || selectedResumeId) && (
                              <button onClick={e => { e.stopPropagation(); setFile(null); setSelectedResumeId(""); if (fileRef.current) fileRef.current.value = ""; }}
                                className="h-7 w-7 rounded-lg flex items-center justify-center border-none cursor-pointer shrink-0 bg-destructive/10 text-destructive hover:bg-destructive/25 transition-colors">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Dropdown past resumes */}
                          {uploadedResumes.length > 0 && (
                            <div className="pt-3.5 border-t border-border/60">
                              <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
                                Or select from last 5 uploaded resumes
                              </label>
                              <div className="relative">
                                <select
                                  value={selectedResumeId}
                                  onChange={(e) => {
                                    setSelectedResumeId(e.target.value);
                                    if (e.target.value) {
                                      setFile(null); // Clear local file if using past resume
                                    }
                                  }}
                                  className="w-full h-10 pl-3.5 pr-10 text-xs rounded-xl outline-none appearance-none transition-colors bg-muted/40 border border-border focus:border-primary/50 text-foreground"
                                >
                                  <option value="">-- Select a past resume --</option>
                                  {uploadedResumes.slice(0, 5).map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.name} ({new Date(r.uploaded_at).toLocaleDateString()})
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-muted-foreground/60" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step 3: Tailoring Mode */}
                      <div className="rounded-2xl overflow-hidden border border-border bg-card/45">
                        <div className="px-4 py-3 flex items-center justify-between border-b border-border/60 bg-muted/20">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[9px] font-black text-white px-2 py-0.5 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500">03</span>
                            <span className="text-[11px] font-black uppercase tracking-widest text-foreground/80">Tailoring Mode</span>
                          </div>
                        </div>

                        <div className="p-3.5 space-y-2 bg-card/10">
                          {/* Option 1: Enhance */}
                          <button
                            onClick={() => setMode("enhance")}
                            type="button"
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                              mode === "enhance"
                                ? "border-indigo-500/30 bg-indigo-500/10 text-foreground"
                                : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/45 hover:text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg shrink-0 ${mode === "enhance" ? "bg-indigo-500/20 text-indigo-400" : "bg-muted text-muted-foreground"}`}>
                                <Sparkles className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-xs font-black text-foreground">Enhance Resume</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">Refine with XYZ formula and keywords.</p>
                              </div>
                            </div>
                            <div className={`h-4.5 w-4.5 rounded-full shrink-0 flex items-center justify-center border ${
                              mode === "enhance" ? "bg-indigo-500 border-indigo-500" : "border-border bg-background"
                            }`}>
                              {mode === "enhance" && <Check className="h-3 w-3 text-white stroke-[3]" />}
                            </div>
                          </button>

                          {/* Option 2: Rewrite */}
                          <button
                            onClick={() => setMode("rewrite")}
                            type="button"
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                              mode === "rewrite"
                                ? "border-indigo-500/30 bg-indigo-500/10 text-foreground"
                                : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/45 hover:text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg shrink-0 ${mode === "rewrite" ? "bg-indigo-500/20 text-indigo-400" : "bg-muted text-muted-foreground"}`}>
                                <RefreshCw className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-xs font-black text-foreground">Rewrite Completely</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">Re-engineer experience achievements.</p>
                              </div>
                            </div>
                            <div className={`h-4.5 w-4.5 rounded-full shrink-0 flex items-center justify-center border ${
                              mode === "rewrite" ? "bg-indigo-500 border-indigo-500" : "border-border bg-background"
                            }`}>
                              {mode === "rewrite" && <Check className="h-3 w-3 text-white stroke-[3]" />}
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* CTA */}
                      <button
                        onClick={runTailoring}
                        disabled={(!file && !selectedResumeId && isResumeBlank) || jd.trim().length < 20}
                        className="w-full h-12 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2.5 transition-all uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed border-none cursor-pointer bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-glow hover:shadow-strong"
                      >
                        <Zap className="h-4 w-4" />
                        Optimize Resume
                      </button>
                    </div>

                    {/* Right Column: Step 2 (Job Description & Cover Letter Options) */}
                    <div className="lg:col-span-7 h-full flex flex-col">
                      {/* Step 2: Job Description */}
                      <div className="rounded-2xl overflow-hidden border border-border bg-card/45 flex flex-col h-full">
                        <div className="px-4 py-3 flex items-center justify-between border-b border-border/60 bg-muted/20 shrink-0">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[9px] font-black text-white px-2 py-0.5 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500">02</span>
                            <span className="text-[11px] font-black uppercase tracking-widest text-foreground/80">Job Description</span>
                          </div>
                          {jd.trim().length >= 20 && (
                            <span className="text-[10px] font-bold flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <Check className="h-3 w-3" /> {jd.trim().length} chars
                            </span>
                          )}
                        </div>

                        <div className="p-4 space-y-4 flex-1 flex flex-col">
                          {/* URL Import */}
                          <div className="flex gap-2 shrink-0">
                            <div className="relative flex-1">
                              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-muted-foreground/60" />
                              <input
                                value={url} onChange={e => { setUrl(e.target.value); sessionStorage.setItem("tr_url", e.target.value); }}
                                onKeyDown={e => e.key === "Enter" && parseUrl()}
                                placeholder="Paste job link to auto-import…"
                                className="w-full h-9 pl-9 pr-3 text-sm rounded-xl outline-none transition-colors bg-muted/40 border border-border focus:border-primary/50 text-foreground caret-primary"
                              />
                            </div>
                            <button onClick={parseUrl} disabled={parsingUrl || !url}
                              className="h-9 px-3.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-opacity disabled:opacity-40 border border-border bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted/80 whitespace-nowrap">
                              {parsingUrl ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                              {parsingUrl ? "Parsing…" : "Parse"}
                            </button>
                          </div>

                          {/* Divider */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex-1 h-px bg-border/60" />
                            <span className="text-[11px] text-muted-foreground/40">or paste manually</span>
                            <div className="flex-1 h-px bg-border/60" />
                          </div>

                          {/* Textarea */}
                          <textarea
                            value={jd} onChange={e => { setJd(e.target.value); sessionStorage.setItem("tr_jd", e.target.value); }}
                            placeholder="Paste the full job description here…"
                            rows={8}
                            className="w-full p-3 text-sm rounded-xl resize-none outline-none transition-colors bg-muted/30 border border-border focus:border-primary/50 text-foreground caret-primary flex-1 min-h-[160px]"
                          />

                          {/* Cover Letter Option */}
                          <div className="pt-4 border-t border-border/40 space-y-3 shrink-0">
                            <label className="flex items-start gap-3 cursor-pointer group select-none">
                              <input
                                type="checkbox"
                                checked={generateCL}
                                onChange={e => setGenerateCL(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-border focus:ring-primary/45 accent-indigo-500 cursor-pointer"
                              />
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-zinc-800 dark:text-foreground group-hover:text-primary transition-colors">
                                  Generate matching Cover Letter with AI
                                </span>
                                <span className="text-[10px] text-muted-foreground/80 mt-0.5 leading-snug">
                                  Creates a perfectly structured, professionally aligned cover letter.
                                </span>
                              </div>
                            </label>

                            <AnimatePresence>
                              {generateCL && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden space-y-3 pl-7"
                                >
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-550">
                                        Target Company Name <span className="text-destructive">*</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={clCompanyName}
                                        onChange={e => setClCompanyName(e.target.value)}
                                        onBlur={() => handleFieldBlur()}
                                        placeholder="e.g. Stripe, Acme Corp, Google..."
                                        className="w-full h-9 px-3.5 text-xs rounded-xl outline-none transition-colors bg-muted/40 border border-border focus:border-primary/50 text-foreground caret-primary"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-555">
                                        Job Title / Role
                                      </label>
                                      <input
                                        type="text"
                                        value={jobTitle}
                                        onChange={e => setJobTitle(e.target.value)}
                                        onBlur={() => handleFieldBlur()}
                                        placeholder="e.g. SWE II, PM..."
                                        className="w-full h-9 px-3.5 text-xs rounded-xl outline-none transition-colors bg-muted/40 border border-border focus:border-primary/50 text-foreground caret-primary"
                                      />
                                    </div>
                                  </div>

                                  <label className="flex items-center gap-2.5 pt-1.5 cursor-pointer group select-none">
                                    <input
                                      type="checkbox"
                                      checked={trackApp}
                                      onChange={async (e) => {
                                        const val = e.target.checked;
                                        setTrackApp(val);
                                        await syncTrackedApplication(val);
                                      }}
                                      className="h-3.5 w-3.5 rounded border-border focus:ring-primary/45 accent-indigo-500 cursor-pointer"
                                    />
                                    <span className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors">
                                      Track this application in Job Tracker
                                    </span>
                                  </label>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
            ) : (
              /* ═══════════════════════════════════════════════════════════
                 2. RESULTS VIEW (Centered layout)
                 ═══════════════════════════════════════════════════════════ */
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="max-w-5xl mx-auto"
              >
                {activeRun && (
                  <TailorResultsView
                    run={activeRun}
                    activeView={activeResultView}
                    onViewChange={setActiveResultView}
                    onApplyWorkspace={applyWorkspace}
                    onDownloadPdf={downloadPdf}
                    onDownloadCoverLetterPdf={downloadCoverLetterPdf}
                    onDownloadCoverLetterWord={downloadCoverLetterWord}
                    previewRef={previewRef}
                  />
                )}
                <div className="flex flex-col sm:hidden gap-2 pt-4 pb-4">
                  <button
                    type="button"
                    onClick={applyWorkspace}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-black border border-primary/20 bg-primary/10 text-primary"
                  >
                    <Sparkles className="h-4 w-4" /> Apply to Workspace
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRun(null)}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-black border border-border bg-muted/50 text-muted-foreground"
                  >
                    <Plus className="h-4 w-4" /> New Run
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
    </div>
  );
}
