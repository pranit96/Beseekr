// src/components/WorkflowHistoryViewer.tsx
// Read-only display of a completed workflow execution retrieved from the DB.
// Renders the final_answer markdown, agent chips, and an execution metadata footer.

import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  AlertCircle,
  Cpu,
  Clock,
  Zap,
  Copy,
  Check,
  ArrowLeft,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { WorkflowExecution } from "./WorkflowHistorySidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkflowHistoryViewerProps {
  executionId: string;
  onBack: () => void;
  onNewWorkflow: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AGENT_PALETTES = [
  { from: "#6366f1", glow: "rgba(99,102,241,0.4)" },
  { from: "#06b6d4", glow: "rgba(6,182,212,0.4)" },
  { from: "#f59e0b", glow: "rgba(245,158,11,0.4)" },
  { from: "#10b981", glow: "rgba(16,185,129,0.4)" },
  { from: "#ec4899", glow: "rgba(236,72,153,0.4)" },
  { from: "#8b5cf6", glow: "rgba(139,92,246,0.4)" },
];

function formatDuration(ms?: number): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function formatDate(str?: string): string {
  if (!str) return "—";
  return new Date(str).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WorkflowHistoryViewer({
  executionId,
  onBack,
  onNewWorkflow,
}: WorkflowHistoryViewerProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch the full execution (cached 5 min — past results are immutable)
  const { data, isLoading, isError } = useQuery({
    queryKey: ["workflow-execution", executionId],
    queryFn: async () => {
      const res = await apiClient.getWorkflowExecution(executionId);
      return res?.data as WorkflowExecution;
    },
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    refetchOnWindowFocus: false,
  });

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading execution…</span>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle className="w-10 h-10 text-destructive/50" />
        <p className="text-sm text-muted-foreground">
          Failed to load execution
        </p>
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
        </Button>
      </div>
    );
  }

  // ── Extract agent info ────────────────────────────────────────────────────

  const agents =
    data.agent_results && data.agent_results.length > 0
      ? data.agent_results
      : data.planned_agents ?? [];

  const isCompleted = data.status === "completed";
  const statusColor = isCompleted ? "#10b981" : "#ef4444";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div
      key={executionId}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full overflow-y-auto"
    >
      <div className="max-w-5xl w-full mx-auto py-8 px-6 lg:px-10">
        {/* ── Top bar ── */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            id="workflow-history-back-btn"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Button>
          <div className="flex-1" />
          <Button
            id="workflow-history-new-btn"
            onClick={onNewWorkflow}
            size="sm"
            className="gap-2 text-white shadow-lg hover:opacity-90 transition-opacity"
            style={{
              background:
                "linear-gradient(135deg, #10b981, #06b6d4)",
              boxShadow: "0 0 16px rgba(16,185,129,0.35)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            New Workflow
          </Button>
        </div>

        {/* ── Card ── */}
        <div className="relative bg-background/80 backdrop-blur-2xl border border-primary/15 rounded-3xl shadow-2xl p-8 sm:p-10 overflow-hidden">
          {/* Ambient glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/6 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/6 rounded-full blur-[80px] pointer-events-none translate-y-1/3 -translate-x-1/3" />

          {/* ── Header ── */}
          <div className="relative z-10 flex items-start gap-4 mb-6 pb-5 border-b border-border/30">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg shrink-0"
              style={{ background: `linear-gradient(135deg, ${statusColor}, ${statusColor}cc)` }}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : (
                <AlertCircle className="w-5 h-5 text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">
                {formatDate(data.completed_at ?? data.created_at)}
              </p>
              <p className="text-base font-semibold text-foreground leading-snug line-clamp-3">
                {data.prompt}
              </p>
            </div>
          </div>

          {/* ── Agent chips ── */}
          {agents.length > 0 && (
            <div className="relative z-10 flex flex-wrap gap-1.5 mb-6">
              {agents.map((agent: any, i: number) => {
                const p = AGENT_PALETTES[i % AGENT_PALETTES.length];
                const name = agent.agent_name ?? agent.name ?? `Agent ${i + 1}`;
                return (
                  <span
                    key={i}
                    className="text-[10px] px-2.5 py-1 rounded-full font-semibold border"
                    style={{
                      background: `${p.glow}`,
                      color: p.from,
                      borderColor: `${p.from}33`,
                    }}
                  >
                    {name}
                  </span>
                );
              })}
            </div>
          )}

          {/* ── Markdown answer ── */}
          {data.final_answer ? (
            <div
              className="relative z-10 prose prose-sm sm:prose-base max-w-none dark:prose-invert mb-10
              prose-headings:font-bold prose-headings:tracking-tight
              prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8 prose-h1:bg-clip-text prose-h1:text-transparent
              prose-h1:bg-gradient-to-r prose-h1:from-primary prose-h1:to-accent
              prose-h2:text-xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:text-foreground prose-h2:border-b prose-h2:border-border/40 prose-h2:pb-2
              prose-h3:text-base prose-h3:mb-3 prose-h3:mt-6 prose-h3:text-primary prose-h3:uppercase prose-h3:tracking-wider
              prose-p:text-foreground/80 prose-p:leading-7 prose-p:mb-4
              prose-a:text-accent prose-a:no-underline prose-a:border-b prose-a:border-accent/30 hover:prose-a:border-accent
              prose-strong:text-foreground prose-strong:font-bold
              prose-code:text-accent prose-code:bg-accent/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-code:font-mono prose-code:text-[0.88em] prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-border/40 prose-pre:rounded-xl prose-pre:p-5
              prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5
              prose-blockquote:rounded-r-xl prose-blockquote:py-4 prose-blockquote:px-5 prose-blockquote:italic
              prose-ul:pl-6 prose-ol:pl-6
              prose-table:border-collapse prose-table:my-6 prose-table:rounded-xl prose-table:overflow-hidden
              prose-table:border prose-table:border-primary/15
              prose-thead:bg-primary/5 prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-semibold
              prose-td:px-4 prose-td:py-3 prose-td:border-b prose-td:border-border/30"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  img: ({ node, ...props }) => (
                    <img
                      {...props}
                      className="rounded-lg shadow-md my-4 mx-auto max-w-full"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ),
                  code: ({ node, className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeString = String(children).replace(/\n$/, "");
                    return match ? (
                      <div className="relative my-4">
                        <div className="flex items-center justify-between bg-muted/50 border-b border-border/50 px-4 py-2 rounded-t-lg">
                          <span className="text-xs font-medium text-muted-foreground">
                            {match[1]}
                          </span>
                          <button
                            onClick={() => handleCopyCode(codeString)}
                            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {copiedCode === codeString ? (
                              <>
                                <Check className="w-3 h-3" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" /> Copy
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="bg-muted border border-border/50 rounded-b-lg p-4 overflow-x-auto">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      <code
                        className="text-primary bg-muted px-1.5 py-0.5 rounded text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-4 border border-border/50 rounded-lg">
                      <table className="w-full border-collapse" {...props} />
                    </div>
                  ),
                  a: ({ node, ...props }) => (
                    <a
                      {...props}
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="border-l-4 border-primary/30 pl-4 py-2 my-4 italic text-foreground/80 bg-muted/30 rounded-r-lg"
                      {...props}
                    />
                  ),
                }}
              >
                {data.final_answer}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="relative z-10 text-muted-foreground text-sm italic mb-8">
              No final answer recorded for this execution.
            </p>
          )}

          {/* ── Metadata footer ── */}
          <div className="relative z-10 pt-5 border-t border-border/25 flex flex-wrap items-center gap-5">
            {data.execution_time_ms && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDuration(data.execution_time_ms)}</span>
              </div>
            )}
            {data.total_tokens && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                <Zap className="w-3.5 h-3.5" />
                <span>{data.total_tokens.toLocaleString()} tokens</span>
              </div>
            )}
            {agents.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                <Cpu className="w-3.5 h-3.5" />
                <span>
                  {agents.length} agent{agents.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {data.model_used && (
              <span className="ml-auto text-[10px] font-mono bg-muted/60 px-2 py-0.5 rounded-md text-muted-foreground/40">
                {data.model_used}
              </span>
            )}
          </div>
        </div>

        {/* ── Action footer ── */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={onNewWorkflow}
            className="gap-2 font-semibold text-white shadow-xl hover:opacity-90 transition-opacity"
            style={{
              background:
                "linear-gradient(135deg, #10b981, #06b6d4)",
              boxShadow: "0 0 24px rgba(16,185,129,0.4)",
            }}
          >
            <Sparkles className="w-4 h-4" />
            Start New Workflow
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
