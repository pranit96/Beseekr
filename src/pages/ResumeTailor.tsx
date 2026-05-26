import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useResume } from "@/contexts/ResumeContext";
import { resumeApi, type TailorRunRecord } from "@/api/resume";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, Sparkles, Trophy, Trash2, Download,
  Check, Plus, Loader2, Briefcase, AlertTriangle, Link2,
  ExternalLink, ChevronRight, Target, Zap, Eye, LayoutList,
  ArrowLeft, X, RefreshCw,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

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

type Panel = "form" | "history" | "results" | "pdf";

// ─── score helpers ──────────────────────────────────────────────────────────
const scoreClass = (s: number) =>
  s >= 85 ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/25"
  : s >= 70 ? "text-indigo-400 bg-indigo-400/10 border-indigo-400/25"
  : "text-amber-400 bg-amber-400/10 border-amber-400/25";

const scoreStroke = (s: number) =>
  s >= 85 ? "#34d399" : s >= 70 ? "#818cf8" : "#fbbf24";

// ═══════════════════════════════════════════════════════════════════════════
export default function ResumeTailor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resumeData, setResumeData, setWorkspaceMode, setShowOnboarding } = useResume();
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
  const fileRef = useRef<HTMLInputElement>(null);

  // processing
  const [processing, setProcessing]   = useState(false);
  const [pct, setPct]                 = useState(0);
  const [stepIdx, setStepIdx]         = useState(0);

  // ui
  const [panel, setPanel]       = useState<Panel>("form");
  const [online, setOnline]     = useState(navigator.onLine);

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
      if (first && data.length) { setActiveRun(data[0]); setPanel("results"); }
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
    } catch (e: any) {
      toast({ title: "Parse failed", description: e.message, variant: "destructive" });
    } finally { setParsingUrl(false); }
  };

  // ── delete run ───────────────────────────────────────────────────────────
  const deleteRun = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await resumeApi.deleteTailorRun(id);
      setRuns(p => p.filter(r => r.id !== id));
      if (activeRun?.id === id) { setActiveRun(null); setPanel("form"); }
    } catch (e: any) { toast({ title: "Delete failed", description: e.message, variant: "destructive" }); }
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
      const result = await resumeApi.tailorAlignResume(file, jd);
      clearInterval(pI); clearInterval(sI); setPct(100);
      toast({ title: "Resume tailored ✓" });
      setTimeout(async () => {
        setProcessing(false);
        setFile(null); setJd(""); setUrl("");
        sessionStorage.removeItem("tr_jd"); sessionStorage.removeItem("tr_url");
        await loadRuns(false);
        setActiveRun(result as unknown as TailorRunRecord);
        setPanel("results");
      }, 700);
    } catch (e: any) {
      clearInterval(pI); clearInterval(sI);
      setProcessing(false);
      toast({ title: "Tailoring failed", description: e.message, variant: "destructive" });
    }
  };

  // ── apply to workspace ────────────────────────────────────────────────────
  const applyWorkspace = () => {
    if (!activeRun?.resume) return;
    setResumeData(activeRun.resume);
    setWorkspaceMode("upload", true);
    setShowOnboarding(false);
    navigate("/dashboard/hired/resume/workspace");
  };

  // ── download pdf ──────────────────────────────────────────────────────────
  const downloadPdf = () => {
    if (!activeRun?.pdf_base64) return;
    try {
      const bytes = Uint8Array.from(atob(activeRun.pdf_base64), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${activeRun.company_name.replace(/\s+/g, "_")}_Resume.pdf`;
      a.click();
    } catch (e: any) { toast({ title: "Download failed", variant: "destructive" }); }
  };

  // ── file drop ─────────────────────────────────────────────────────────────
  const acceptFile = (f: File) => {
    if (ALLOWED_MIME.has(f.type) || ALLOWED_EXT.test(f.name)) {
      if (f.size > 5_242_880) { toast({ title: "File too large (max 5 MB)", variant: "destructive" }); return; }
      setFile(f);
    } else { toast({ title: "PDF or DOCX only", variant: "destructive" }); }
  };

  // ════════════════════════════════════════════════════════════════════════
  // SUB-COMPONENTS
  // ════════════════════════════════════════════════════════════════════════

  // ── Processing overlay — LIGHT so it's always visible ────────────────────
  const ProcessingOverlay = () => (
    <motion.div
      key="overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(10,10,18,0.92)", backdropFilter: "blur(12px)" }}
    >
      <div className="w-full max-w-xs mx-auto px-6 text-center space-y-7">
        {/* Spinner ring */}
        <div className="relative mx-auto" style={{ width: 88, height: 88 }}>
          <svg width="88" height="88" viewBox="0 0 88 88" className="absolute inset-0" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
            <circle cx="44" cy="44" r="38" fill="none" stroke="#818cf8" strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={String(2 * Math.PI * 38)}
              strokeDashoffset={String(2 * Math.PI * 38 * (1 - pct / 100))}
              style={{ transition: "stroke-dashoffset 0.4s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-black text-white tabular-nums">{pct}%</span>
          </div>
        </div>

        {/* Step text */}
        <div className="space-y-1.5">
          <h3 className="text-base font-black text-white tracking-tight">Tailoring your resume…</h3>
          <AnimatePresence mode="wait">
            <motion.p
              key={stepIdx}
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.25 }}
              className="text-sm font-medium"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              {STEPS[stepIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-300"
              style={{
                width: i === stepIdx ? 20 : 6,
                height: 6,
                background: i <= stepIdx ? "#818cf8" : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>

        {/* Cloud note */}
        <p className="text-xs font-semibold rounded-xl px-4 py-2.5"
          style={{ background: "rgba(251,191,36,0.1)", color: "rgba(251,191,36,0.85)", border: "1px solid rgba(251,191,36,0.2)" }}>
          ☁ Compiling in the cloud — safe to navigate away
        </p>
      </div>
    </motion.div>
  );

  // ── History sidebar list ────────────────────────────────────────────────
  const HistoryList = ({ compact = false }: { compact?: boolean }) => (
    <div className={`flex flex-col h-full ${compact ? "" : "overflow-hidden"}`}>
      <div className="px-4 py-3.5 flex items-center justify-between border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-indigo-400" />
          <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>History</span>
          {runs.length > 0 && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md border"
              style={{ background: "rgba(129,140,248,0.1)", color: "#818cf8", borderColor: "rgba(129,140,248,0.25)" }}>
              {runs.length}
            </span>
          )}
        </div>
        <button
          onClick={() => { setActiveRun(null); setPanel("form"); }}
          className="h-7 w-7 rounded-lg flex items-center justify-center border-none cursor-pointer transition-colors"
          style={{ background: "rgba(129,140,248,0.12)" }}
          title="New run"
        >
          <Plus className="h-4 w-4 text-indigo-400" />
        </button>
      </div>

      <div className={`flex-1 p-2 space-y-1 ${compact ? "" : "overflow-y-auto"}`}>
        {loadingRuns ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: "rgba(255,255,255,0.25)" }} />
          </div>
        ) : runs.length === 0 ? (
          <div className="m-2 py-8 px-4 rounded-2xl text-center border-2 border-dashed"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <Trophy className="h-7 w-7 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
            <p className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>No runs yet</p>
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>Results appear here</p>
          </div>
        ) : runs.map(run => {
          const isActive = activeRun?.id === run.id;
          return (
            <button key={run.id}
              onClick={() => { setActiveRun(run); setPanel("results"); }}
              className="w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer group relative"
              style={{
                background: isActive ? "rgba(129,140,248,0.1)" : "transparent",
                borderColor: isActive ? "rgba(129,140,248,0.35)" : "transparent",
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }}
            >
              <div className="flex items-start justify-between gap-1.5 mb-1">
                <span className="text-xs font-bold text-white truncate leading-tight">{run.company_name}</span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border shrink-0 ${scoreClass(run.ats_score)}`}>
                  {run.ats_score}%
                </span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{run.job_title}</span>
                <span className="text-[9px] shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {new Date(run.saved_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </div>
              <button
                onClick={e => deleteRun(e, run.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-5 w-5 rounded flex items-center justify-center border-none cursor-pointer transition-opacity"
                style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── Tailoring form ────────────────────────────────────────────────────────
  const TailoringForm = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-xl mx-auto px-5 sm:px-8 py-8 space-y-5">

        {/* Page title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(129,140,248,0.25), rgba(167,139,250,0.15))", border: "1px solid rgba(129,140,248,0.3)" }}>
            <Target className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">ATS Match & Tailor</h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Align your resume to any job description</p>
          </div>
        </div>

        {/* Active resume badge */}
        {!isResumeBlank && (
          <div className="flex items-center gap-2 text-xs font-bold w-fit px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}>
            <Check className="h-3.5 w-3.5" />
            Active workspace resume loaded
          </div>
        )}

        {/* ── STEP 1 ── */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-2.5">
              <span className="text-[9px] font-black text-white px-2 py-0.5 rounded-md"
                style={{ background: "linear-gradient(90deg,#6366f1,#8b5cf6)" }}>01</span>
              <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.6)" }}>Resume File</span>
            </div>
            {file && (
              <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: "#34d399" }}>
                <Check className="h-3 w-3" /> Ready
              </span>
            )}
          </div>

          <div className="p-4">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) acceptFile(f); }}
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all"
              style={{
                border: `2px dashed ${dragOver ? "#6366f1" : file ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.1)"}`,
                background: dragOver ? "rgba(99,102,241,0.06)" : file ? "rgba(52,211,153,0.04)" : "transparent",
              }}
            >
              <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) acceptFile(f); if (fileRef.current) fileRef.current.value = ""; }} />
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: file ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.06)" }}>
                {file ? <FileText className="h-5 w-5" style={{ color: "#34d399" }} /> : <Upload className="h-5 w-5" style={{ color: "rgba(255,255,255,0.3)" }} />}
              </div>
              <div className="flex-1 min-w-0">
                {file ? (
                  <>
                    <p className="text-sm font-bold text-white truncate">{file.name}</p>
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{fmtSize(file.size)}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {dragOver ? "Drop to upload" : "Drag & drop or click"}
                    </p>
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {!isResumeBlank ? "Optional — skip to use active resume" : "PDF or DOCX · max 5 MB"}
                    </p>
                  </>
                )}
              </div>
              {file && (
                <button onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="h-7 w-7 rounded-lg flex items-center justify-center border-none cursor-pointer shrink-0"
                  style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}>
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── STEP 2 ── */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-2.5">
              <span className="text-[9px] font-black text-white px-2 py-0.5 rounded-md"
                style={{ background: "linear-gradient(90deg,#6366f1,#8b5cf6)" }}>02</span>
              <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.6)" }}>Job Description</span>
            </div>
            {jd.trim().length >= 20 && (
              <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: "#34d399" }}>
                <Check className="h-3 w-3" /> {jd.trim().length} chars
              </span>
            )}
          </div>

          <div className="p-4 space-y-3">
            {/* URL row */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: "rgba(255,255,255,0.25)" }} />
                <input
                  value={url} onChange={e => { setUrl(e.target.value); sessionStorage.setItem("tr_url", e.target.value); }}
                  onKeyDown={e => e.key === "Enter" && parseUrl()}
                  placeholder="Paste job link to auto-import…"
                  className="w-full h-9 pl-9 pr-3 text-sm rounded-xl outline-none transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.8)", caretColor: "#818cf8",
                  }}
                />
              </div>
              <button onClick={parseUrl} disabled={parsingUrl || !url}
                className="h-9 px-3.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-opacity disabled:opacity-40 border-none whitespace-nowrap"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)" }}>
                {parsingUrl ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                {parsingUrl ? "Parsing…" : "Parse"}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>or paste manually</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
            </div>

            {/* Textarea */}
            <textarea
              value={jd} onChange={e => { setJd(e.target.value); sessionStorage.setItem("tr_jd", e.target.value); }}
              placeholder="Paste the full job description here…"
              rows={8}
              className="w-full p-3 text-sm rounded-xl resize-none outline-none transition-colors"
              style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.8)", caretColor: "#818cf8", lineHeight: 1.6,
              }}
            />
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={runTailoring}
          disabled={(!file && isResumeBlank) || jd.trim().length < 20}
          className="w-full h-12 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2.5 transition-all uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed border-none cursor-pointer"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 8px 32px rgba(99,102,241,0.3)" }}
        >
          <Zap className="h-4 w-4" />
          Run ATS Match & Tailor
        </button>
      </div>
    </div>
  );

  // ── Results panel ─────────────────────────────────────────────────────────
  const ResultsPanel = () => {
    if (!activeRun) return null;
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 py-6 space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#818cf8" }}>Tailored Result</p>
              <h1 className="text-2xl font-black text-white tracking-tight">{activeRun.company_name}</h1>
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>{activeRun.job_title}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={applyWorkspace}
                className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-black border cursor-pointer transition-opacity hover:opacity-80"
                style={{ background: "rgba(129,140,248,0.1)", color: "#818cf8", borderColor: "rgba(129,140,248,0.25)" }}>
                <Sparkles className="h-3.5 w-3.5" /> Apply Draft
              </button>
              <button onClick={downloadPdf}
                className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-black text-white cursor-pointer transition-opacity hover:opacity-80 border-none"
                style={{ background: "rgba(255,255,255,0.1)" }}>
                <Download className="h-3.5 w-3.5" /> Download PDF
              </button>
            </div>
          </div>

          {/* Score + summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Ring */}
            <div className="rounded-2xl p-5 flex flex-col items-center justify-center gap-3"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <svg width="84" height="84" viewBox="0 0 84 84" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="42" cy="42" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                <circle cx="42" cy="42" r="36" fill="none" stroke={scoreStroke(activeRun.ats_score)} strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={String(2 * Math.PI * 36)}
                  strokeDashoffset={String(2 * Math.PI * 36 * (1 - activeRun.ats_score / 100))}
                  style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }} />
              </svg>
              <div className="text-center -mt-1">
                <p className="text-2xl font-black text-white">{activeRun.ats_score}%</p>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>ATS Score</p>
              </div>
            </div>

            {/* Feedback */}
            <div className="sm:col-span-3 rounded-2xl p-5"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Executive Summary</p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{activeRun.general_feedback}</p>
            </div>
          </div>

          {/* Bullet improvements */}
          {activeRun.bullet_point_suggestions?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-indigo-400" />
                <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Bullet Improvements
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                  {activeRun.bullet_point_suggestions.length}
                </span>
              </div>

              {activeRun.bullet_point_suggestions.map((sug, i) => (
                <div key={i} className="rounded-2xl overflow-hidden"
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x"
                    style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <div className="p-4 space-y-2" style={{ background: "rgba(239,68,68,0.03)" }}>
                      <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>Before</span>
                      <p className="text-xs italic leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>"{sug.original}"</p>
                    </div>
                    <div className="p-4 space-y-2" style={{ background: "rgba(52,211,153,0.03)" }}>
                      <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{ background: "rgba(52,211,153,0.12)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}>After</span>
                      <p className="text-xs font-semibold leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>"{sug.improved}"</p>
                    </div>
                  </div>
                  {sug.reason && (
                    <div className="px-4 py-2.5 flex items-start gap-2" style={{ background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <Sparkles className="h-3 w-3 text-indigo-400 mt-0.5 shrink-0" />
                      <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{sug.reason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Keywords */}
          {activeRun.missing_keywords?.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Keywords Integrated</p>
              <div className="flex flex-wrap gap-2">
                {activeRun.missing_keywords.map((kw, i) => (
                  <span key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Check className="h-3 w-3" style={{ color: "#34d399" }} />{kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── PDF panel ─────────────────────────────────────────────────────────────
  const PdfPanel = ({ full = false }: { full?: boolean }) => (
    <div className={`flex flex-col overflow-hidden ${full ? "flex-1" : ""}`}
      style={{ width: full ? "100%" : 420, minWidth: full ? undefined : 420, borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="px-4 py-3 flex items-center justify-between shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" style={{ color: "rgba(255,255,255,0.3)" }} />
          <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>PDF Preview</span>
        </div>
        <button onClick={downloadPdf} disabled={!activeRun?.pdf_base64}
          className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[10px] font-black border cursor-pointer disabled:opacity-40 transition-opacity hover:opacity-70"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.08)" }}>
          <Download className="h-3.5 w-3.5" /> Download
        </button>
      </div>
      <div className="flex-1 relative" style={{ background: "rgba(0,0,0,0.15)" }}>
        {activeRun?.pdf_base64 ? (
          <iframe
            src={`data:application/pdf;base64,${activeRun.pdf_base64}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            className="absolute inset-0 w-full h-full border-none"
            title="Tailored Resume PDF"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <FileText className="h-10 w-10" style={{ color: "rgba(255,255,255,0.1)" }} />
            <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.2)" }}>No PDF available</p>
          </div>
        )}
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="w-full h-full min-h-[calc(100vh-100px)] flex flex-col rounded-2xl overflow-hidden font-sans relative"
      style={{ background: "#0a0a12", border: "1px solid rgba(255,255,255,0.06)" }}>

      {/* Offline banner */}
      <AnimatePresence>
        {!online && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="flex items-center justify-center gap-2 text-xs font-bold py-2 px-4 shrink-0"
            style={{ background: "rgba(251,191,36,0.1)", borderBottom: "1px solid rgba(251,191,36,0.2)", color: "rgba(251,191,36,0.85)" }}>
            <AlertTriangle className="h-3.5 w-3.5" /> Offline — results sync automatically on reconnect
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ DESKTOP (lg+): 3-column ══════════════════════════════════════ */}
      <div className="hidden lg:flex flex-1 overflow-hidden">

        {/* Col 1 — History sidebar (fixed 220px) */}
        <aside className="w-[220px] shrink-0 flex flex-col overflow-hidden"
          style={{ borderRight: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
          <HistoryList />
        </aside>

        {/* Col 2 — Main panel (flex-1) */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <AnimatePresence>{processing && <ProcessingOverlay />}</AnimatePresence>
          <AnimatePresence mode="wait">
            {activeRun ? (
              <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex overflow-hidden">
                <ResultsPanel />
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex overflow-hidden">
                <TailoringForm />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Col 3 — PDF preview (fixed 400px, only when run active) */}
        <AnimatePresence>
          {activeRun && (
            <motion.div
              key="pdf-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="flex overflow-hidden shrink-0 h-full"
              style={{ minWidth: 0 }}
            >
              <PdfPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══ MOBILE / TABLET (<lg): stacked with bottom nav ══════════════ */}
      <div className="flex lg:hidden flex-col flex-1 overflow-hidden">
        {/* Content area */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence>{processing && <ProcessingOverlay />}</AnimatePresence>

          <AnimatePresence mode="wait">
            {panel === "form" && (
              <motion.div key="m-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }} className="absolute inset-0 overflow-y-auto">
                <TailoringForm />
              </motion.div>
            )}
            {panel === "history" && (
              <motion.div key="m-hist" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }} className="absolute inset-0 overflow-y-auto"
                style={{ background: "rgba(0,0,0,0.2)" }}>
                {/* Full-screen history on mobile */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between py-1">
                    <h2 className="text-sm font-black text-white uppercase tracking-wider">Run History</h2>
                    <button onClick={() => { setActiveRun(null); setPanel("form"); }}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-black border-none cursor-pointer"
                      style={{ background: "rgba(129,140,248,0.15)", color: "#818cf8" }}>
                      <Plus className="h-3.5 w-3.5" /> New Run
                    </button>
                  </div>
                  {loadingRuns ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin" style={{ color: "rgba(255,255,255,0.2)" }} />
                    </div>
                  ) : runs.length === 0 ? (
                    <div className="py-16 text-center">
                      <Trophy className="h-8 w-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.1)" }} />
                      <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>No runs yet</p>
                    </div>
                  ) : runs.map(run => (
                    <button key={run.id} onClick={() => { setActiveRun(run); setPanel("results"); }}
                      className="w-full text-left p-4 rounded-2xl flex items-center gap-3 cursor-pointer border transition-colors"
                      style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-lg border shrink-0 ${scoreClass(run.ats_score)}`}>{run.ats_score}%</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{run.company_name}</p>
                        <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{run.job_title}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "rgba(255,255,255,0.2)" }} />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
            {panel === "results" && activeRun && (
              <motion.div key="m-res" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }} className="absolute inset-0 overflow-y-auto">
                <ResultsPanel />
              </motion.div>
            )}
            {panel === "pdf" && activeRun && (
              <motion.div key="m-pdf" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }} className="absolute inset-0 flex flex-col">
                <PdfPanel full />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom navigation */}
        <nav className="shrink-0 px-3 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.4)" }}>
          <div className="flex gap-1">
            {([
              { id: "form",    icon: Zap,        label: "New" },
              { id: "history", icon: LayoutList,  label: `History${runs.length ? ` · ${runs.length}` : ""}` },
              ...(activeRun ? [
                { id: "results", icon: Trophy, label: "Results" },
                { id: "pdf",     icon: Eye,    label: "PDF" },
              ] : []),
            ] as { id: Panel; icon: any; label: string }[]).map(tab => {
              const isActive = panel === tab.id;
              return (
                <button key={tab.id} onClick={() => setPanel(tab.id)}
                  className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all cursor-pointer border-none"
                  style={{
                    background: isActive ? "rgba(129,140,248,0.12)" : "transparent",
                    color: isActive ? "#818cf8" : "rgba(255,255,255,0.3)",
                  }}>
                  <tab.icon style={{ width: 18, height: 18 }} />
                  <span className="text-[9px] font-black uppercase tracking-wide">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}