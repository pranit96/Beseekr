// src/components/canvas/ExecutionDiffPanel.tsx
// Feature: Execution Diff Viewer — compare current vs previous run output
// Side-by-side with animated diff highlighting

import { memo, useState, useEffect } from "react";
import { X, GitCompare, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Clock } from "lucide-react";

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
}

interface RunSnapshot {
  run_id: string;
  timestamp: string;
  output: string;
  tokens: number;
  duration_ms: number;
  status: "success" | "failed";
}

interface ExecutionDiffPanelProps {
  currentResult: string;
  currentTokens: number;
  currentDuration: number;
  previousRun: RunSnapshot | null;
  workflowId: string | null;
  onClose: () => void;
}

function computeDiff(prev: string, curr: string): DiffLine[] {
  if (!prev) return curr.split("\n").map(l => ({ type: "added", content: l }));

  const prevLines = prev.split("\n");
  const currLines = curr.split("\n");
  const result: DiffLine[] = [];

  // Simple LCS-based diff
  const maxLen = Math.max(prevLines.length, currLines.length);
  const prevSet = new Set(prevLines);
  const currSet = new Set(currLines);

  let pi = 0, ci = 0;
  while (pi < prevLines.length || ci < currLines.length) {
    const pl = prevLines[pi];
    const cl = currLines[ci];

    if (pi >= prevLines.length) {
      result.push({ type: "added", content: cl });
      ci++;
    } else if (ci >= currLines.length) {
      result.push({ type: "removed", content: pl });
      pi++;
    } else if (pl === cl) {
      result.push({ type: "unchanged", content: cl });
      pi++;
      ci++;
    } else if (!currSet.has(pl)) {
      result.push({ type: "removed", content: pl });
      pi++;
    } else if (!prevSet.has(cl)) {
      result.push({ type: "added", content: cl });
      ci++;
    } else {
      result.push({ type: "removed", content: pl });
      result.push({ type: "added", content: cl });
      pi++;
      ci++;
    }
  }

  return result.slice(0, 500); // Cap at 500 lines
}

function MetricDelta({ label, prev, curr, unit = "", lowerBetter = false }: {
  label: string; prev: number; curr: number; unit?: string; lowerBetter?: boolean;
}) {
  const delta = curr - prev;
  const pct = prev === 0 ? 0 : Math.round((delta / prev) * 100);
  const improved = lowerBetter ? delta < 0 : delta > 0;
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const color = delta === 0 ? "text-muted-foreground" : improved ? "text-emerald-400" : "text-rose-400";

  return (
    <div className="flex flex-col gap-0.5 px-3 py-2 rounded-xl bg-muted/20 border border-border/20">
      <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-sm font-black text-foreground">{curr.toLocaleString()}{unit}</span>
        <div className={`flex items-center gap-0.5 ${color} text-[10px] font-bold`}>
          <Icon className="w-3 h-3" />
          {delta !== 0 && <span>{pct > 0 ? "+" : ""}{pct}%</span>}
        </div>
      </div>
    </div>
  );
}

export const ExecutionDiffPanel = memo(({
  currentResult,
  currentTokens,
  currentDuration,
  previousRun,
  onClose,
}: ExecutionDiffPanelProps) => {
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
  const [showUnchanged, setShowUnchanged] = useState(false);
  const [tab, setTab] = useState<"diff" | "metrics">("diff");

  useEffect(() => {
    if (previousRun?.output && currentResult) {
      setDiffLines(computeDiff(previousRun.output, currentResult));
    } else if (currentResult) {
      setDiffLines(currentResult.split("\n").map(l => ({ type: "added", content: l })));
    }
  }, [previousRun, currentResult]);

  const addedCount = diffLines.filter(l => l.type === "added").length;
  const removedCount = diffLines.filter(l => l.type === "removed").length;
  const unchangedCount = diffLines.filter(l => l.type === "unchanged").length;

  const visibleLines = showUnchanged
    ? diffLines
    : diffLines.filter(l => l.type !== "unchanged");

  return (
    <div className="absolute bottom-4 left-4 right-4 z-30 max-h-[55vh] rounded-2xl border border-border/30 bg-card/95 backdrop-blur-2xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md shadow-blue-500/30">
            <GitCompare className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Execution Diff</h3>
            {previousRun && (
              <p className="text-[10px] text-muted-foreground">
                vs. {new Date(previousRun.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Change summary chips */}
          {addedCount > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
              +{addedCount}
            </span>
          )}
          {removedCount > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500/15 border border-rose-500/25 text-rose-400">
              -{removedCount}
            </span>
          )}
          {unchangedCount > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-muted/40 border border-border/30 text-muted-foreground">
              ~{unchangedCount}
            </span>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 px-4 pt-2 border-b border-border/15 shrink-0">
        {(["diff", "metrics"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-[11px] font-bold rounded-t-lg transition-all border-b-2 ${
              tab === t
                ? "text-foreground border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {t === "diff" ? "Output Diff" : "Run Metrics"}
          </button>
        ))}
        {tab === "diff" && (
          <button
            onClick={() => setShowUnchanged(s => !s)}
            className="ml-auto mb-1.5 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-muted-foreground hover:text-foreground bg-muted/20 hover:bg-muted/40 transition-all"
          >
            {showUnchanged ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showUnchanged ? "Hide" : "Show"} unchanged
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "diff" && (
          <div className="font-mono text-[11px] leading-relaxed">
            {!previousRun ? (
              <div className="px-4 py-6 text-center text-muted-foreground/60 text-sm">
                <GitCompare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No previous run to compare against.<br />
                <span className="text-[11px]">Run the workflow again to see the diff.</span>
              </div>
            ) : visibleLines.length === 0 ? (
              <div className="px-4 py-6 text-center text-muted-foreground/60 text-sm">
                No changes — output is identical to previous run.
              </div>
            ) : (
              visibleLines.map((line, i) => (
                <div
                  key={i}
                  className={`px-4 py-0.5 flex gap-2 ${
                    line.type === "added"
                      ? "bg-emerald-500/8 border-l-2 border-emerald-500/50"
                      : line.type === "removed"
                      ? "bg-rose-500/8 border-l-2 border-rose-500/50"
                      : "border-l-2 border-transparent"
                  }`}
                  style={{ animationDelay: `${i * 10}ms` }}
                >
                  <span className={`select-none shrink-0 w-3 font-black ${
                    line.type === "added" ? "text-emerald-500" :
                    line.type === "removed" ? "text-rose-500" :
                    "text-muted-foreground/20"
                  }`}>
                    {line.type === "added" ? "+" : line.type === "removed" ? "−" : " "}
                  </span>
                  <span className={`flex-1 whitespace-pre-wrap break-all ${
                    line.type === "added" ? "text-emerald-300/90" :
                    line.type === "removed" ? "text-rose-300/70 line-through" :
                    "text-foreground/50"
                  }`}>
                    {line.content || " "}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "metrics" && (
          <div className="px-4 py-3 space-y-3">
            {!previousRun ? (
              <p className="text-sm text-muted-foreground/60 text-center py-6">No previous run data available.</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <MetricDelta
                    label="Tokens"
                    prev={previousRun.tokens}
                    curr={currentTokens}
                    lowerBetter={true}
                  />
                  <MetricDelta
                    label="Duration"
                    prev={previousRun.duration_ms}
                    curr={currentDuration}
                    unit="ms"
                    lowerBetter={true}
                  />
                  <MetricDelta
                    label="Output Length"
                    prev={previousRun.output.length}
                    curr={currentResult.length}
                    unit=" ch"
                  />
                </div>

                {/* Previous run info */}
                <div className="px-3 py-2.5 rounded-xl bg-muted/15 border border-border/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="font-bold">Previous run:</span>
                    <span>{new Date(previousRun.timestamp).toLocaleString()}</span>
                    <span className={`ml-auto font-black ${previousRun.status === "success" ? "text-emerald-400" : "text-rose-400"}`}>
                      {previousRun.status}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

ExecutionDiffPanel.displayName = "ExecutionDiffPanel";
