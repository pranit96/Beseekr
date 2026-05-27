import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useResume } from "@/contexts/ResumeContext";
import { resumeApi, type TailorRunRecord } from "@/api/resume";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, Sparkles, Trophy, Trash2, Download,
  Check, Plus, Loader2, Briefcase, AlertTriangle, Link2,
  ExternalLink, ChevronRight, Target, Zap, Eye,
  ArrowLeft, X, RefreshCw, Clock, ChevronDown,
} from "lucide-react";

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

const STEPS = [
  "Parsing resume structure",
  "Reading job requirements",
  "Matching keywords & skills",
  "Rewriting with XYZ format",
  "Compiling LaTeX PDF",
  "Scoring ATS compatibility",
];

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
  const fileRef = useRef<HTMLInputElement>(null);

  // processing
  const [processing, setProcessing]   = useState(false);
  const [pct, setPct]                 = useState(0);
  const [stepIdx, setStepIdx]         = useState(0);

  // ui
  const [online, setOnline]           = useState(navigator.onLine);
  const [historyOpen, setHistoryOpen] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  // ── close history dropdown on outside click ─────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setHistoryOpen(false);
      }
    };
    if (historyOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [historyOpen]);

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
      if (first && data.length) { setActiveRun(data[0]); }
    } catch { /* silent */ }
    finally { setLoadingRuns(false); }
  }, []);

  useEffect(() => { loadRuns(true); }, [loadRuns]);

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

  // ── run tailoring ─────────────────────────────────────────────────────────
  const runTailoring = async () => {
    if (!file && isResumeBlank) {
      toast({ title: "No resume loaded", description: "Upload a file or fill workspace resume.", variant: "destructive" }); return;
    }
    if (jd.trim().length < 20) {
      toast({ title: "Job description too short", variant: "destructive" }); return;
    }
    setProcessing(true); setPct(0); setStepIdx(0);

    const pI = setInterval(() => setPct(p => p >= 93 ? 93 : p + Math.floor(Math.random() * 5) + 2), 380);
    const sI = setInterval(() => setStepIdx(i => i < STEPS.length - 1 ? i + 1 : i), 1800);

    try {
      const result = await resumeApi.tailorAlignResume(file, jd, mode, selectedResumeId || undefined);
      clearInterval(pI); clearInterval(sI); setPct(100);
      toast({ title: "Resume tailored ✓" });
      setTimeout(async () => {
        setProcessing(false);
        setFile(null); setJd(""); setUrl("");
        sessionStorage.removeItem("tr_jd"); sessionStorage.removeItem("tr_url");
        await loadRuns(false);
        setActiveRun(result as unknown as TailorRunRecord);
      }, 700);
    } catch (err: unknown) {
      clearInterval(pI); clearInterval(sI);
      setProcessing(false);
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
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeRun.company_name ?? "resume"}_tailored.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── apply to workspace ────────────────────────────────────────────────────
  const applyWorkspace = () => {
    if (!activeRun?.resume) return;
    setResumeData(activeRun.resume);
    setWorkspaceMode("upload", true);
    setShowOnboarding(false);
    navigate("/");
    toast({ title: "Draft applied to workspace ✓" });
  };

  return (
    <div className="w-full min-h-[calc(100vh-100px)] flex flex-col font-sans relative bg-background text-foreground">

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
                    {STEPS[stepIdx]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Step dots */}
              <div className="flex items-center justify-center gap-1.5">
                {STEPS.map((_, i) => (
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
      <header className="shrink-0 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 border-b border-border bg-background">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 bg-indigo-500/10 border border-indigo-500/20">
            <Target className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-sm font-black text-foreground tracking-tight leading-tight">ATS Match & Tailor</h1>
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

      {/* ── MAIN LAYOUT (Scrollable Split Container) ───────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {!activeRun ? (
              /* ═══════════════════════════════════════════════════════════
                 1. EDITOR VIEW (Split layout: Left = Form, Right = History)
                 ═══════════════════════════════════════════════════════════ */
              <motion.div
                key="editor"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
              >
                {/* Left Side: Form Inputs */}
                <div className="lg:col-span-7 space-y-6">
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

                  {/* Step 2: Job Description */}
                  <div className="rounded-2xl overflow-hidden border border-border bg-card/45">
                    <div className="px-4 py-3 flex items-center justify-between border-b border-border/60 bg-muted/20">
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

                    <div className="p-4 space-y-3">
                      {/* URL Import */}
                      <div className="flex gap-2">
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
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-border/60" />
                        <span className="text-[11px] text-muted-foreground/40">or paste manually</span>
                        <div className="flex-1 h-px bg-border/60" />
                      </div>

                      {/* Textarea */}
                      <textarea
                        value={jd} onChange={e => { setJd(e.target.value); sessionStorage.setItem("tr_jd", e.target.value); }}
                        placeholder="Paste the full job description here…"
                        rows={6}
                        className="w-full p-3 text-sm rounded-xl resize-none outline-none transition-colors bg-muted/30 border border-border focus:border-primary/50 text-foreground caret-primary"
                      />
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

                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Option 1: Enhance */}
                      <div
                        onClick={() => setMode("enhance")}
                        className={`p-4 rounded-xl cursor-pointer border-2 transition-all flex flex-col gap-2 relative overflow-hidden ${
                          mode === "enhance"
                            ? "border-primary bg-primary/5 dark:bg-primary/10"
                            : "border-border hover:border-muted-foreground/35 bg-muted/10 hover:bg-muted/20"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${mode === "enhance" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-black text-foreground">Enhance Resume</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Refines existing achievements using the XYZ formula (Accomplished [X], measured by [Y], by doing [Z]) and target keywords. Preserves your exact career history, dates, and company details intact.
                        </p>
                        {mode === "enhance" && (
                          <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Option 2: Rewrite */}
                      <div
                        onClick={() => setMode("rewrite")}
                        className={`p-4 rounded-xl cursor-pointer border-2 transition-all flex flex-col gap-2 relative overflow-hidden ${
                          mode === "rewrite"
                            ? "border-primary bg-primary/5 dark:bg-primary/10"
                            : "border-border hover:border-muted-foreground/35 bg-muted/10 hover:bg-muted/20"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${mode === "rewrite" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                            <RefreshCw className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-black text-foreground">Rewrite Completely</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Performs a full re-engineering of your experience and skills to match the Job Description. Generates custom, realistic highlights and accomplishment statements mapped directly to key responsibilities.
                        </p>
                        {mode === "rewrite" && (
                          <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={runTailoring}
                    disabled={(!file && !selectedResumeId && isResumeBlank) || jd.trim().length < 20}
                    className="w-full h-12 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2.5 transition-all uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed border-none cursor-pointer bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-glow hover:shadow-strong"
                  >
                    <Zap className="h-4 w-4" />
                    Run ATS Match & Tailor
                  </button>
                </div>

                {/* Right Side: Past Runs Directory */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-4 w-4 text-indigo-400" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80">
                      Past Tailored Runs
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                      {runs.length}
                    </span>
                  </div>

                  {loadingRuns ? (
                    <div className="flex items-center justify-center py-12 border border-border rounded-2xl bg-card/25">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/30" />
                    </div>
                  ) : runs.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-border rounded-2xl bg-card/10">
                      <Trophy className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-xs font-bold text-muted-foreground/60">No runs yet</p>
                      <p className="text-[10px] text-muted-foreground/40 max-w-xs mx-auto mt-1 leading-relaxed">
                        Your tailored runs will appear here, letting you switch back to them anytime.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                      {runs.map(run => (
                        <button key={run.id}
                          onClick={() => setActiveRun(run)}
                          className="w-full text-left p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer border border-border bg-card/25 hover:border-primary/30 hover:bg-muted/30 transition-all group relative"
                        >
                          <span className={`text-xs font-black px-2.5 py-1 rounded-lg border shrink-0 ${scoreClass(run.ats_score)}`}>
                            {run.ats_score}%
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{run.company_name}</p>
                            <p className="text-xs truncate text-muted-foreground">{run.job_title}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-muted-foreground/60">
                              {new Date(run.saved_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                          </div>
                          <button
                            onClick={e => deleteRun(e, run.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-5 w-5 rounded flex items-center justify-center border-none cursor-pointer transition-opacity bg-destructive/15 text-destructive hover:bg-destructive/25"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              /* ═══════════════════════════════════════════════════════════
                 2. RESULTS VIEW (Split layout: Left = Runs Dir, Right = Report)
                 ═══════════════════════════════════════════════════════════ */
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
              >
                {/* Left Side: Runs Sidebar Directory (Desktop only) */}
                <div className="hidden lg:block lg:col-span-4 space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80">
                      Runs Directory
                    </span>
                    <button
                      onClick={() => setActiveRun(null)}
                      className="text-[10px] font-black flex items-center gap-1 cursor-pointer border-none bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-2.5 py-1 rounded-lg"
                    >
                      <Plus className="h-3 w-3" /> New Run
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
                    {runs.map(run => {
                      const isActive = activeRun?.id === run.id;
                      return (
                        <button key={run.id}
                          onClick={() => setActiveRun(run)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer group relative ${
                            isActive
                              ? "bg-primary/10 border-primary/30"
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
                    })}
                  </div>
                </div>

                {/* Right Side: Report Results & PDF Preview */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Results Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">Tailored Result</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-tight">{activeRun.company_name}</h2>
                      <p className="text-sm font-semibold text-muted-foreground">{activeRun.job_title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      <button onClick={applyWorkspace}
                        className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-black border border-primary/20 bg-primary/10 text-primary cursor-pointer transition-opacity hover:opacity-85">
                        <Sparkles className="h-3.5 w-3.5" /> Apply Draft
                      </button>
                      <button onClick={downloadPdf}
                        className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-black text-white cursor-pointer transition-opacity hover:opacity-85 border-none bg-gradient-to-r from-indigo-500 to-purple-600 shadow-glow">
                        <Download className="h-3.5 w-3.5" /> Download PDF
                      </button>
                    </div>
                  </div>

                  {/* Score & Feedback Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {/* Radial ATS Score */}
                    <div className="rounded-2xl p-5 flex flex-col items-center justify-center gap-3 border border-border bg-card/25">
                      <svg width="84" height="84" viewBox="0 0 84 84" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="42" cy="42" r="36" fill="none" className="stroke-muted/30" strokeWidth="5" />
                        <circle cx="42" cy="42" r="36" fill="none" stroke={scoreStroke(activeRun.ats_score)} strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray={String(2 * Math.PI * 36)}
                          strokeDashoffset={String(2 * Math.PI * 36 * (1 - activeRun.ats_score / 100))}
                          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }} />
                      </svg>
                      <div className="text-center -mt-1">
                        <p className="text-2xl font-black text-foreground">{activeRun.ats_score}%</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">ATS Score</p>
                      </div>
                    </div>

                    {/* Executive Summary Feedback */}
                    <div className="sm:col-span-3 rounded-2xl p-5 border border-border bg-card/25">
                      <p className="text-[10px] font-black uppercase tracking-widest mb-3 text-muted-foreground/60">Executive Summary</p>
                      <p className="text-sm leading-relaxed text-foreground/80">{activeRun.general_feedback}</p>
                    </div>
                  </div>

                  {/* Bullet improvements */}
                  {activeRun.bullet_point_suggestions?.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-primary" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-foreground/70">
                          Bullet Improvements
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                          {activeRun.bullet_point_suggestions.length}
                        </span>
                      </div>

                      {activeRun.bullet_point_suggestions.map((sug, i) => (
                        <div key={i} className="rounded-2xl overflow-hidden border border-border bg-card/15">
                          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
                            <div className="p-4 space-y-2 bg-destructive/5">
                              <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20">Before</span>
                              <p className="text-xs italic leading-relaxed text-muted-foreground/70">"{sug.original}"</p>
                            </div>
                            <div className="p-4 space-y-2 bg-emerald-500/5">
                              <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">After</span>
                              <p className="text-xs font-semibold leading-relaxed text-foreground/90">"{sug.improved}"</p>
                            </div>
                          </div>
                          {sug.reason && (
                            <div className="px-4 py-2.5 flex items-start gap-2 bg-muted/10 border-t border-border/60">
                              <Sparkles className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                              <p className="text-[11px] leading-relaxed text-muted-foreground">{sug.reason}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Integrated Keywords */}
                  {activeRun.missing_keywords?.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Keywords Integrated</p>
                      <div className="flex flex-wrap gap-2">
                        {activeRun.missing_keywords.map((kw, i) => (
                          <span key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-muted border border-border text-foreground/80">
                            <Check className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />{kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inline PDF Preview */}
                  <div className="rounded-2xl overflow-hidden border border-border bg-card/25">
                    <div className="px-4 py-3 flex items-center justify-between border-b border-border/80 bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground/60" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80">PDF Preview</span>
                      </div>
                      <button onClick={downloadPdf} disabled={!activeRun?.pdf_base64}
                        className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[10px] font-black border border-border bg-muted/60 text-muted-foreground hover:text-foreground transition-all hover:bg-muted/80 disabled:opacity-40">
                        <Download className="h-3.5 w-3.5" /> Download
                      </button>
                    </div>
                    <div className="relative bg-muted/10" style={{ height: "min(70vh, 600px)" }}>
                      {activeRun?.pdf_base64 ? (
                        <iframe
                          src={`data:application/pdf;base64,${activeRun.pdf_base64}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                          className="absolute inset-0 w-full h-full border-none"
                          title="Tailored Resume PDF"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                          <FileText className="h-10 w-10 text-muted-foreground/30" />
                          <p className="text-sm font-medium text-muted-foreground/50">No PDF available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Bar (hidden on desktop sidebar, visible on mobile) */}
                  <div className="flex flex-col sm:flex-row lg:hidden items-stretch gap-2 pt-2 pb-4">
                    <button onClick={applyWorkspace}
                      className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-black border border-primary/20 bg-primary/10 text-primary cursor-pointer transition-opacity hover:opacity-85">
                      <Sparkles className="h-4 w-4" /> Apply to Workspace
                    </button>
                    <button onClick={downloadPdf}
                      className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-black text-white cursor-pointer transition-opacity hover:opacity-95 border-none bg-gradient-to-r from-indigo-500 to-purple-600 shadow-glow">
                      <Download className="h-4 w-4" /> Download PDF
                    </button>
                    <button onClick={() => setActiveRun(null)}
                      className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-black cursor-pointer transition-opacity hover:opacity-80 border border-border bg-muted/50 text-muted-foreground hover:text-foreground">
                      <ArrowLeft className="h-4 w-4" /> Back to Editor
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}