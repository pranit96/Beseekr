import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  Download,
  Eye,
  Check,
  X,
  Trophy,
  Briefcase,
  FileText,
  ChevronDown,
  Target,
  TrendingUp,
} from "lucide-react";
import type { TailorRunRecord } from "@/api/resume";

const scoreStroke = (s: number) =>
  s >= 85 ? "#10b981" : s >= 70 ? "#6366f1" : "#f59e0b";

const scoreLabel = (s: number) =>
  s >= 85 ? "Excellent match" : s >= 70 ? "Strong match" : "Room to improve";

type Props = {
  run: TailorRunRecord;
  activeView: "resume" | "cover_letter";
  onViewChange: (v: "resume" | "cover_letter") => void;
  onApplyWorkspace: () => void;
  onDownloadPdf: () => void;
  onDownloadCoverLetterPdf?: () => void;
  onDownloadCoverLetterWord?: () => void;
  previewRef?: React.RefObject<HTMLDivElement | null>;
};

export function TailorResultsView({
  run,
  activeView,
  onViewChange,
  onApplyWorkspace,
  onDownloadPdf,
  onDownloadCoverLetterPdf,
  onDownloadCoverLetterWord,
  previewRef,
}: Props) {
  const [tab, setTab] = useState<"overview" | "improvements" | "preview">(
    "overview",
  );
  const [showDetails, setShowDetails] = useState(false);

  const modeRewrite =
    (run as TailorRunRecord & { mode?: string }).mode === "rewrite";

  return (
    <div className="space-y-6">
      {/* Success hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card/40 to-indigo-500/10 p-6 sm:p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-8">
          <div className="flex items-center gap-6 shrink-0">
            <div className="relative w-28 h-28">
              <svg
                width="112"
                height="112"
                viewBox="0 0 112 112"
                className="-rotate-90"
              >
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  fill="none"
                  className="stroke-muted/25"
                  strokeWidth="8"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  fill="none"
                  stroke={scoreStroke(run.ats_score)}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={String(2 * Math.PI * 48)}
                  strokeDashoffset={String(
                    2 * Math.PI * 48 * (1 - run.ats_score / 100),
                  )}
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black tabular-nums">
                  {run.ats_score}%
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  ATS
                </span>
              </div>
            </div>
            <div className="hidden sm:block space-y-1">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Check className="h-4 w-4" /> Tailoring complete
              </p>
              <p className="text-xs text-muted-foreground">
                {scoreLabel(run.ats_score)}
              </p>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-500 border border-indigo-500/25">
                Tailored result
              </span>
              {modeRewrite ? (
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-purple-500/15 text-purple-500 border border-purple-500/25 flex items-center gap-1">
                  <RefreshCw className="h-2.5 w-2.5" /> Rewrite
                </span>
              ) : (
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" /> Enhance
                </span>
              )}
              <span className="text-[9px] text-muted-foreground">
                {new Date(run.saved_at).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight truncate">
              {run.company_name}
            </h2>
            <p className="text-sm font-semibold text-muted-foreground">
              {run.job_title}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={onApplyWorkspace}
              className="h-10 px-4 rounded-xl text-xs font-black border border-primary/25 bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-2"
            >
              <Sparkles className="h-3.5 w-3.5" /> Apply to workspace
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("preview");
                setTimeout(
                  () =>
                    previewRef?.current?.scrollIntoView({ behavior: "smooth" }),
                  120,
                );
              }}
              className="h-10 px-4 rounded-xl text-xs font-black border border-border bg-muted/40 hover:bg-muted/60 transition-colors flex items-center gap-2"
            >
              <Eye className="h-3.5 w-3.5" /> Preview PDF
            </button>
            <button
              type="button"
              onClick={onDownloadPdf}
              className="h-10 px-4 rounded-xl text-xs font-black text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-glow flex items-center gap-2"
            >
              <Download className="h-3.5 w-3.5" /> Download PDF
            </button>
          </div>
        </div>
      </motion.div>

      {run.generate_cover_letter && (
        <div className="flex p-1 rounded-xl bg-muted/50 border border-border w-fit">
          <button
            type="button"
            onClick={() => onViewChange("resume")}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
              activeView === "resume"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground"
            }`}
          >
            Resume
          </button>
          <button
            type="button"
            onClick={() => onViewChange("cover_letter")}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
              activeView === "cover_letter"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground"
            }`}
          >
            Cover letter
          </button>
        </div>
      )}

      {activeView === "resume" ? (
        <>
          <div className="flex p-1 rounded-xl bg-muted/40 border border-border w-full sm:w-fit">
            {(
              [
                ["overview", "Overview", Target],
                ["improvements", "Improvements", TrendingUp],
                ["preview", "PDF Preview", FileText],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  tab === id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="rounded-2xl border border-border bg-card/30 p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                    Recruiter summary
                  </p>
                  <p className="text-sm leading-relaxed text-foreground/85">
                    {run.general_feedback}
                  </p>
                </div>

                {run.missing_keywords && run.missing_keywords.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card/30 p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                      Keywords integrated
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {run.missing_keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                        >
                          <Check className="h-3 w-3" />
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-border bg-card/20 hover:bg-card/35 text-xs font-bold text-muted-foreground transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-indigo-400" />
                    {showDetails ? "Hide" : "Show"} detailed ATS breakdown
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${showDetails ? "rotate-180" : ""}`}
                  />
                </button>

                {showDetails && run.score_breakdown && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl border border-border bg-card/20">
                    {Object.entries(run.score_breakdown).map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                          {k.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm font-black">{String(v)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {tab === "improvements" && (
              <motion.div
                key="improvements"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {(run.bullet_point_suggestions?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">
                    No bullet-level changes were suggested for this run.
                  </p>
                ) : (
                  run.bullet_point_suggestions?.map((sug, i) => (
                    <div
                      key={i}
                      className="rounded-2xl overflow-hidden border border-border bg-card/20"
                    >
                      <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                        <div className="p-4 bg-destructive/5">
                          <span className="text-[9px] font-black uppercase text-destructive">
                            Before
                          </span>
                          <p className="text-xs italic mt-2 text-muted-foreground">
                            "{sug.original}"
                          </p>
                        </div>
                        <div className="p-4 bg-emerald-500/5">
                          <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                            After
                          </span>
                          <p className="text-xs font-semibold mt-2">
                            "{sug.improved}"
                          </p>
                        </div>
                      </div>
                      {sug.reason && (
                        <div className="px-4 py-2 border-t border-border bg-muted/10 text-[11px] text-muted-foreground flex gap-2">
                          <Sparkles className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                          {sug.reason}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {tab === "preview" && (
              <motion.div
                key="preview"
                ref={previewRef as React.RefObject<HTMLDivElement>}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl overflow-hidden border border-border bg-card/25"
              >
                <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-muted/20">
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    PDF preview
                  </span>
                  <button
                    type="button"
                    onClick={onDownloadPdf}
                    className="text-[10px] font-black text-primary flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" /> Download
                  </button>
                </div>
                <div
                  className="relative bg-muted/10"
                  style={{ minHeight: "min(70vh, 560px)" }}
                >
                  {run.pdf_base64 ? (
                    <iframe
                      title="Tailored resume"
                      src={`data:application/pdf;base64,${run.pdf_base64}#toolbar=0&navpanes=0`}
                      className="absolute inset-0 w-full h-full border-0"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                      No PDF preview available
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div className="rounded-2xl border border-border bg-card/30 p-6 prose prose-sm dark:prose-invert max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-sm">
            {run.cover_letter_text}
          </pre>
          <div className="flex gap-2 mt-6 not-prose">
            {onDownloadCoverLetterWord && (
              <button
                type="button"
                onClick={onDownloadCoverLetterWord}
                className="h-9 px-4 rounded-xl text-xs font-black border border-border"
              >
                Download Word
              </button>
            )}
            {onDownloadCoverLetterPdf && (
              <button
                type="button"
                onClick={onDownloadCoverLetterPdf}
                className="h-9 px-4 rounded-xl text-xs font-black text-white bg-gradient-to-r from-indigo-500 to-purple-600"
              >
                Download PDF
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
