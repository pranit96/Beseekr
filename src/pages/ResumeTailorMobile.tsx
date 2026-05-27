import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, Sparkles, Trophy, Trash2, Download,
  Check, Plus, Loader2, Briefcase, AlertTriangle, Link2,
  ExternalLink, ChevronRight, Target, Zap, Eye,
  ArrowLeft, X, RefreshCw, ChevronDown, Award
} from "lucide-react";
import { type TailorRunRecord } from "@/api/resume";

interface ResumeTailorMobileProps {
  generateCL: boolean;
  setGenerateCL: (val: boolean) => void;
  clCompanyName: string;
  setClCompanyName: (val: string) => void;
  downloadCoverLetterPdf: () => void;
  downloadCoverLetterWord: () => void;
  runs: TailorRunRecord[];
  loadingRuns: boolean;
  activeRun: TailorRunRecord | null;
  setActiveRun: (run: TailorRunRecord | null) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  jd: string;
  setJd: (jd: string) => void;
  url: string;
  setUrl: (url: string) => void;
  mode: "enhance" | "rewrite";
  setMode: (mode: "enhance" | "rewrite") => void;
  selectedResumeId: string;
  setSelectedResumeId: (id: string) => void;
  processing: boolean;
  pct: number;
  stepIdx: number;
  runTailoring: () => Promise<void>;
  deleteRun: (e: React.MouseEvent, id: string) => Promise<void>;
  downloadPdf: () => void;
  applyWorkspace: () => void;
  uploadedResumes: any[];
  isResumeBlank: boolean;
  parseUrl: () => Promise<void>;
  parsingUrl: boolean;
  fmtSize: (bytes: number) => string;
}

const scoreClass = (s: number) =>
  s >= 85 ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
  : s >= 70 ? "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
  : "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";

const scoreStroke = (s: number) =>
  s >= 85 ? "#10b981" : s >= 70 ? "#6366f1" : "#f59e0b";

export default function ResumeTailorMobile({
  generateCL,
  setGenerateCL,
  clCompanyName,
  setClCompanyName,
  downloadCoverLetterPdf,
  downloadCoverLetterWord,
  runs,
  loadingRuns,
  activeRun,
  setActiveRun,
  file,
  setFile,
  jd,
  setJd,
  url,
  setUrl,
  mode,
  setMode,
  selectedResumeId,
  setSelectedResumeId,
  processing,
  pct,
  stepIdx,
  runTailoring,
  deleteRun,
  downloadPdf,
  applyWorkspace,
  uploadedResumes,
  isResumeBlank,
  parseUrl,
  parsingUrl,
  fmtSize
}: ResumeTailorMobileProps) {
  // Mobile sub-tabs when not in active run: "tailor" or "runs"
  const [formTab, setFormTab] = useState<"tailor" | "runs">("tailor");

  // Mobile sub-tabs when viewing results: "overview" | "bullets" | "pdf" | "cover_letter"
  const [resultsTab, setResultsTab] = useState<"overview" | "bullets" | "pdf" | "cover_letter">("overview");

  // Local drag-over state (touch fallback is click)
  const [dragOver, setDragOver] = useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const acceptFile = (f: File) => {
    if (f.size > 5 * 1024 * 1024) return;
    setFile(f);
    setSelectedResumeId("");
  };

  return (
    <div className="w-full flex-1 flex flex-col font-sans bg-background text-foreground select-none pb-20">
      
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border bg-card sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-indigo-500/10 border border-indigo-500/20">
            <Target className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-sm font-black text-foreground tracking-tight">Optimize Resume</h1>
            <p className="text-[9px] text-muted-foreground">Optimize resume for target roles</p>
          </div>
        </div>

        {activeRun && (
          <button
            onClick={() => setActiveRun(null)}
            className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[10px] font-bold border border-border bg-background text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
        )}
      </div>

      {/* ── SCROLLABLE CONTAINER ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <AnimatePresence mode="wait">
          {!activeRun ? (
            /* ═══════════════════════════════════════════════════════════
               1. MOBILE FORM & HISTORY PANEL
               ═══════════════════════════════════════════════════════════ */
            <motion.div
              key="mobile-form-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Segmented Controller Tab Selector */}
              <div className="flex p-1 rounded-xl bg-muted/65 border border-border/40">
                <button
                  onClick={() => setFormTab("tailor")}
                  className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                    formTab === "tailor"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground/80"
                  }`}
                >
                  Tailor New
                </button>
                <button
                  onClick={() => setFormTab("runs")}
                  className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    formTab === "runs"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground/80"
                  }`}
                >
                  Past Runs
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-black">
                    {runs.length}
                  </span>
                </button>
              </div>

              {formTab === "tailor" ? (
                /* ── FORM TAB ── */
                <div className="space-y-4">
                  {/* Workspace Status Badge */}
                  {!isResumeBlank && (
                    <div className="flex items-center gap-2 text-xs font-bold w-full px-3.5 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Check className="h-4 w-4" />
                      Active workspace resume loaded
                    </div>
                  )}

                  {/* Step 1: Resume Upload */}
                  <div className="rounded-2xl border border-border bg-card/45 p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-white px-2 py-0.5 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500">01</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">Select Resume File</span>
                    </div>

                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) acceptFile(f); }}
                      onClick={() => fileRef.current?.click()}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed transition-all active:scale-[0.98] ${
                        (file || selectedResumeId)
                          ? "border-emerald-500/40 bg-emerald-500/5"
                          : "border-border bg-muted/10"
                      }`}
                    >
                      <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) acceptFile(f); }} />
                      
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${(file || selectedResumeId) ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                        {(file || selectedResumeId) ? <FileText className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        {file || selectedResumeId ? (
                          <>
                            <p className="text-xs font-black text-foreground truncate">
                              {file ? file.name : uploadedResumes.find(r => r.id === selectedResumeId)?.name}
                            </p>
                            <p className="text-[9px] text-muted-foreground">
                              {file ? fmtSize(file.size) : "Using last uploaded resume"}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs font-bold text-foreground/80">Tap to upload PDF/DOCX</p>
                            <p className="text-[9px] text-muted-foreground/60">
                              {!isResumeBlank ? "Optional — skip to use active workspace" : "Max 5 MB"}
                            </p>
                          </>
                        )}
                      </div>

                      {(file || selectedResumeId) && (
                        <button
                          onClick={e => { e.stopPropagation(); setFile(null); setSelectedResumeId(""); }}
                          className="h-7 w-7 rounded-lg flex items-center justify-center bg-destructive/10 text-destructive border-none"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Past Resumes Dropdown */}
                    {uploadedResumes.length > 0 && (
                      <div className="pt-3 border-t border-border/40">
                        <label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
                          Or use a past uploaded resume
                        </label>
                        <div className="relative">
                          <select
                            value={selectedResumeId}
                            onChange={(e) => {
                              setSelectedResumeId(e.target.value);
                              if (e.target.value) setFile(null);
                            }}
                            className="w-full h-10 pl-3.5 pr-10 text-xs rounded-xl outline-none appearance-none bg-muted/40 border border-border text-foreground"
                          >
                            <option value="">-- Select past resume --</option>
                            {uploadedResumes.slice(0, 5).map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-muted-foreground/60" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Job Description */}
                  <div className="rounded-2xl border border-border bg-card/45 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-white px-2 py-0.5 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500">02</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">Job Description</span>
                      </div>
                      {jd.trim().length >= 20 && (
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                          ✓ {jd.trim().length} chars
                        </span>
                      )}
                    </div>

                    {/* Import URL */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-muted-foreground/60" />
                        <input
                          value={url}
                          onChange={e => setUrl(e.target.value)}
                          placeholder="Paste job link to auto-fill..."
                          className="w-full h-9 pl-8 pr-3 text-xs rounded-xl outline-none bg-muted/40 border border-border focus:border-primary/50 text-foreground caret-primary"
                        />
                      </div>
                      <button
                        onClick={parseUrl}
                        disabled={parsingUrl || !url}
                        className="h-9 px-3 rounded-xl text-[10px] font-black flex items-center gap-1 border border-border bg-muted/60 text-foreground hover:bg-muted/80 disabled:opacity-40"
                      >
                        {parsingUrl ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
                        Import
                      </button>
                    </div>

                    <textarea
                      value={jd}
                      onChange={e => setJd(e.target.value)}
                      placeholder="Paste target job requirements / descriptions here..."
                      rows={5}
                      className="w-full p-3 text-xs rounded-xl resize-none outline-none bg-muted/30 border border-border focus:border-primary/50 text-foreground caret-primary leading-relaxed"
                    />

                    {/* Cover Letter Option */}
                    <div className="pt-3 border-t border-border/40 space-y-2">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={generateCL}
                          onChange={e => setGenerateCL(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-border focus:ring-primary/45 accent-indigo-500 cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground">
                            Generate Cover Letter with AI
                          </span>
                          <span className="text-[9px] text-muted-foreground/80 leading-normal mt-0.5">
                            Creates a matching cover letter aligned to this job description.
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
                            className="overflow-hidden space-y-1.5 pl-6"
                          >
                            <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500">
                              Company Name <span className="text-destructive">*</span>
                            </label>
                            <input
                              type="text"
                              value={clCompanyName}
                              onChange={e => setClCompanyName(e.target.value)}
                              placeholder="e.g. Stripe, Acme Corp..."
                              className="w-full h-9 px-3 text-xs rounded-xl outline-none transition-colors bg-muted/40 border border-border focus:border-primary/50 text-foreground caret-primary"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Step 3: Mode Selector */}
                  <div className="rounded-2xl border border-border bg-card/45 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-white px-2 py-0.5 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500">03</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">Tailoring Mode</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div
                        onClick={() => setMode("enhance")}
                        className={`p-3 rounded-xl cursor-pointer border-2 transition-all flex flex-col gap-1 relative ${
                          mode === "enhance"
                            ? "border-primary bg-primary/5"
                            : "border-border bg-muted/10"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                          <span className="text-xs font-black">Enhance</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground leading-normal">
                          Refines bullets, fixes wording. Preserves facts & dates intact.
                        </p>
                        {mode === "enhance" && (
                          <div className="absolute top-1.5 right-1.5 h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-2 w-2 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div
                        onClick={() => setMode("rewrite")}
                        className={`p-3 rounded-xl cursor-pointer border-2 transition-all flex flex-col gap-1 relative ${
                          mode === "rewrite"
                            ? "border-primary bg-primary/5"
                            : "border-border bg-muted/10"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <RefreshCw className="h-3.5 w-3.5 text-purple-500" />
                          <span className="text-xs font-black">Rewrite</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground leading-normal">
                          Fully re-engineers highlights to map directly to JD responsibilities.
                        </p>
                        {mode === "rewrite" && (
                          <div className="absolute top-1.5 right-1.5 h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-2 w-2 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submit Action Block */}
                  <button
                    onClick={runTailoring}
                    disabled={(!file && !selectedResumeId && isResumeBlank) || jd.trim().length < 20}
                    className="w-full h-11 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 transition-all uppercase tracking-wider disabled:opacity-40 bg-gradient-to-r from-indigo-500 to-purple-600 border-none cursor-pointer"
                  >
                    <Zap className="h-3.5 w-3.5 animate-pulse" />
                    Optimize Resume
                  </button>
                </div>
              ) : (
                /* ── PAST RUNS TAB ── */
                <div className="space-y-3">
                  {loadingRuns ? (
                    <div className="flex items-center justify-center py-16 border border-border bg-card/25 rounded-2xl">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/30" />
                    </div>
                  ) : runs.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-border rounded-2xl bg-card/10 space-y-2">
                      <Trophy className="h-8 w-8 mx-auto text-muted-foreground/25" />
                      <p className="text-xs font-bold text-muted-foreground/50">No saved tailoring runs</p>
                      <p className="text-[10px] text-muted-foreground/40 max-w-[200px] mx-auto leading-relaxed">
                        Optimized resumes will appear here for easy retrieval.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {runs.map(run => (
                        <div
                          key={run.id}
                          onClick={() => setActiveRun(run)}
                          className="w-full p-3.5 rounded-2xl flex items-center gap-3 border border-border bg-card/45 hover:border-primary/30 transition-all group relative active:bg-muted/30"
                        >
                          <span className={`text-xs font-black px-2 py-0.5 rounded-lg border shrink-0 ${scoreClass(run.ats_score)}`}>
                            {run.ats_score}%
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-foreground truncate">{run.company_name}</p>
                            <p className="text-[10px] truncate text-muted-foreground">{run.job_title}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[9px] text-muted-foreground/50">
                              {new Date(run.saved_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/45" />
                          </div>
                          <button
                            onClick={e => deleteRun(e, run.id)}
                            className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full flex items-center justify-center bg-destructive/15 text-destructive border border-destructive/20"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            /* ═══════════════════════════════════════════════════════════
               2. MOBILE RESULTS VIEW
               ═══════════════════════════════════════════════════════════ */
            <motion.div
              key="mobile-results-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Result Meta Banner */}
              <div className="rounded-2xl border border-border bg-card/50 p-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">Tailored Result</span>
                  {(activeRun as any).mode === "rewrite" ? (
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center gap-0.5">
                      <RefreshCw className="h-2 w-2" /> Rewrite
                    </span>
                  ) : (
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5">
                      <Sparkles className="h-2 w-2" /> Enhance
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-base font-black text-foreground tracking-tight leading-tight">{activeRun.company_name}</h2>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">{activeRun.job_title}</p>
                </div>

                {/* Score & General Feedback Grid */}
                <div className="grid grid-cols-1 gap-3 pt-2">
                  {/* Circle score & quick rating */}
                  <div className="flex items-center gap-4 bg-muted/20 border border-border/40 p-3 rounded-xl">
                    <div className="relative shrink-0">
                      <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="28" cy="28" r="24" fill="none" className="stroke-muted/30" strokeWidth="4" />
                        <circle cx="28" cy="28" r="24" fill="none" stroke={scoreStroke(activeRun.ats_score)} strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={String(2 * Math.PI * 24)}
                          strokeDashoffset={String(2 * Math.PI * 24 * (1 - activeRun.ats_score / 100))} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-black text-foreground">{activeRun.ats_score}%</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">ATS Match Level</span>
                      <p className="text-xs font-bold mt-0.5 text-foreground/90">
                        {activeRun.ats_score >= 85 ? "Excellent Alignment ✓" : activeRun.ats_score >= 70 ? "Good Compatibility" : "Needs Adjustments"}
                      </p>
                    </div>
                  </div>

                  {/* Feedback prose */}
                  <div className="bg-muted/10 border border-border/20 p-3 rounded-xl">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 block mb-1">AI Executive Summary</span>
                    <p className="text-xs leading-relaxed text-foreground/80">{activeRun.general_feedback}</p>
                  </div>
                </div>
              </div>

              <div className="flex p-1 rounded-xl bg-muted/65 border border-border/40">
                <button
                  onClick={() => setResultsTab("overview")}
                  className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    resultsTab === "overview" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground/85"
                  }`}
                >
                  Score
                </button>
                <button
                  onClick={() => setResultsTab("bullets")}
                  className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    resultsTab === "bullets" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground/85"
                  }`}
                >
                  Bullets
                </button>
                <button
                  onClick={() => setResultsTab("pdf")}
                  className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    resultsTab === "pdf" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground/85"
                  }`}
                >
                  Resume PDF
                </button>
                {activeRun.generate_cover_letter && (
                  <button
                    onClick={() => setResultsTab("cover_letter")}
                    className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                      resultsTab === "cover_letter" ? "bg-background text-foreground shadow-sm animate-fadeIn" : "text-muted-foreground/85"
                    }`}
                  >
                    Cover Letter
                  </button>
                )}
              </div>

              {/* RESULTS TAB: SCORE DETAILS */}
              {resultsTab === "overview" && (
                <div className="space-y-4">
                  {/* Score breakdown */}
                  {activeRun.score_breakdown && Object.keys(activeRun.score_breakdown).length > 0 && (
                    <div className="rounded-2xl border border-border bg-card/45 overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-border/60 bg-muted/20">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Deduction Analysis</p>
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-3">
                        {([
                          ["Grammar", activeRun.score_breakdown.spelling_grammar_deduction],
                          ["Metrics Density", activeRun.score_breakdown.metrics_density_deduction],
                          ["Weak Action Verbs", activeRun.score_breakdown.weak_verb_deduction],
                          ["Missing Sections", activeRun.score_breakdown.missing_sections_deduction],
                          ["Missing Keywords", activeRun.score_breakdown.missing_keywords_deduction],
                          ["Total Deductions", activeRun.score_breakdown.total_deductions],
                        ] as [string, number][]).filter(([, v]) => v !== undefined && v !== null).map(([label, val]) => (
                          <div key={label} className="flex flex-col gap-0.5 bg-muted/5 border border-border/10 p-2 rounded-xl">
                            <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">{label}</span>
                            <span className={`text-xs font-black ${ val < 0 ? "text-destructive" : "text-emerald-500"}`}>
                              {val === 0 ? "✓ 0" : val}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ATS Checks list */}
                  {activeRun.ats_checks && Object.keys(activeRun.ats_checks).length > 0 && (
                    <div className="rounded-2xl border border-border bg-card/45 overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-border/60 bg-muted/20">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">ATS Standards Checklist</p>
                      </div>
                      <div className="divide-y divide-border/40">
                        {Object.entries(activeRun.ats_checks).map(([key, check]: [string, any]) => (
                          <div key={key} className="px-4 py-3 flex items-start gap-2.5">
                            <div className={`mt-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center shrink-0 ${
                              check.passed ? "bg-emerald-500/15 text-emerald-500" : "bg-destructive/15 text-destructive"
                            }`}>
                              {check.passed ? <Check className="h-2 w-2 stroke-[3]" /> : <X className="h-2 w-2 stroke-[3]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black text-foreground capitalize">
                                {key.replace(/_/g, " ")}
                              </p>
                              <p className="text-[9px] text-muted-foreground mt-0.5 leading-snug">
                                {check.details ?? (check.errors?.join(", ") ?? "")}
                              </p>
                            </div>
                            {check.score_impact < 0 && (
                              <span className="text-[9px] font-black text-destructive shrink-0">{check.score_impact}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* RESULTS TAB: UPGRADED BULLETS */}
              {resultsTab === "bullets" && (
                <div className="space-y-3">
                  {activeRun.bullet_point_suggestions?.length > 0 ? (
                    activeRun.bullet_point_suggestions.map((sug, i) => (
                      <div key={i} className="rounded-2xl overflow-hidden border border-border bg-card/45 p-3.5 space-y-3">
                        <div className="space-y-1.5">
                          <span className="inline-block text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20">Original Bullet</span>
                          <p className="text-xs italic leading-relaxed text-muted-foreground/75">"{sug.original}"</p>
                        </div>
                        <div className="space-y-1.5 pt-2.5 border-t border-border/40">
                          <span className="inline-block text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">ATS Optimized (XYZ Formula)</span>
                          <p className="text-xs font-bold leading-relaxed text-foreground">"{sug.improved}"</p>
                        </div>
                        {sug.reason && (
                          <div className="pt-2 flex items-start gap-1.5 border-t border-border/20 text-[10px] text-muted-foreground">
                            <Sparkles className="h-3 w-3 text-indigo-500 shrink-0 mt-0.5" />
                            <p className="leading-normal">{sug.reason}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center border border-dashed border-border rounded-2xl bg-card/10 space-y-2">
                      <Award className="h-8 w-8 mx-auto text-muted-foreground/25" />
                      <p className="text-xs font-bold text-muted-foreground/50">No bullet point modifications made</p>
                    </div>
                  )}

                  {/* Integrated keywords tags list */}
                  {activeRun.missing_keywords?.length > 0 && (
                    <div className="rounded-2xl border border-border bg-card/45 p-4 space-y-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Keywords Successfully Integrated</p>
                      <div className="flex flex-wrap gap-1.5">
                        {activeRun.missing_keywords.map((kw, i) => (
                          <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-muted border border-border text-foreground/80">
                            <Check className="h-3 w-3 text-emerald-500" />
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* RESULTS TAB: DOWNLOAD & ACTIONS */}
              {resultsTab === "pdf" && (
                <div className="space-y-4">
                  {/* Clean mobile PDF Status Card */}
                  <div className="rounded-2xl border border-border bg-card/45 p-6 flex flex-col items-center gap-4 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">Optimized PDF Compiled</p>
                      <p className="text-xs text-muted-foreground/60 mt-1 max-w-[240px] leading-relaxed">
                        Tap download to fetch your tailored PDF directly. Compatible with all mobile viewers.
                      </p>
                    </div>
                    <button
                      onClick={downloadPdf}
                      disabled={!activeRun?.pdf_base64}
                      className="w-full h-11 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-indigo-500 to-purple-600 border-none cursor-pointer shadow-glow disabled:opacity-40"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download PDF File
                    </button>
                  </div>

                  {/* Apply Workspace Card */}
                  <div className="rounded-2xl border border-border bg-card/45 p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-emerald-500" />
                      <p className="text-xs font-black text-foreground">Apply Tailoring to Editor Draft</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      Load this tailored draft straight into your active workspace resume. You can review, format, or generate other document files immediately.
                    </p>
                    <button
                      onClick={applyWorkspace}
                      className="w-full h-10 rounded-xl text-xs font-black border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-pointer active:bg-emerald-500/20 transition-colors"
                    >
                      Apply Tailored Resume Draft
                    </button>
                  </div>
                </div>
              )}

              {/* RESULTS TAB: COVER LETTER */}
              {resultsTab === "cover_letter" && activeRun.generate_cover_letter && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Action buttons card */}
                  <div className="rounded-2xl border border-border bg-card/45 p-5 flex flex-col items-center gap-3.5 text-center">
                    <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground">Cover Letter Ready</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1 max-w-[200px] leading-relaxed mx-auto">
                        Download your cover letter instantly in your preferred format.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 w-full">
                      <button
                        onClick={downloadCoverLetterWord}
                        className="h-10 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 bg-muted border border-border text-foreground hover:bg-muted/80 cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5 text-blue-500" /> Word (Docx)
                      </button>
                      <button
                        onClick={downloadCoverLetterPdf}
                        className="h-10 rounded-xl text-[10px] font-black text-white flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 border-none cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" /> PDF (LaTeX)
                      </button>
                    </div>
                  </div>

                  {/* Letter body */}
                  <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950 p-5 shadow-inner">
                    <div className="text-zinc-800 dark:text-zinc-200 font-serif leading-relaxed text-[11px] select-text whitespace-pre-wrap">
                      {activeRun.cover_letter_text}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
