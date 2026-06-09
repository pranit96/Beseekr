import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  X,
  Download,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  Loader2,
} from "lucide-react";
import type { CanvasExecutionResult } from "@/types/agent";

interface CanvasResultPanelProps {
  result: CanvasExecutionResult | null;
  isRunning: boolean;
  onClose: () => void;
  onDownload: (format: string) => void;
}

export const CanvasResultPanel: React.FC<CanvasResultPanelProps> = ({
  result,
  isRunning,
  onClose,
  onDownload,
}) => {
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());

  const toggleAgent = (id: string) => {
    setExpandedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!result && !isRunning) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 max-h-[55vh] bg-card/95 backdrop-blur-2xl border-t border-border/40 flex flex-col animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/20 shrink-0">
        <div className="flex items-center gap-3">
          {isRunning ? (
            <div className="flex items-center gap-2 text-amber-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs font-semibold">Executing workflow…</span>
            </div>
          ) : result ? (
            <>
              <div className="flex items-center gap-2">
                {result.metadata.agents_succeeded ===
                result.metadata.agents_executed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
                <span className="text-xs font-bold text-foreground">
                  {result.workflow_name} — Results
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {result.metadata.total_tokens.toLocaleString()} tokens
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {(result.metadata.execution_time_ms / 1000).toFixed(1)}s
                </span>
                <span>
                  {result.metadata.agents_succeeded}/
                  {result.metadata.agents_executed} agents
                </span>
              </div>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {result && (
            <button
              onClick={() => onDownload(result.output_format)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <Download className="w-3 h-3" />
              Download {result.output_format.toUpperCase()}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isRunning && !result && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin mb-4" />
            <p className="text-xs text-muted-foreground/60">
              Running agents in topological order…
            </p>
          </div>
        )}

        {result && (
          <div className="p-5 space-y-4">
            {/* Agent results accordion */}
            {result.agent_results.length > 1 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                  Agent Outputs
                </p>
                {result.agent_results.map((ar) => (
                  <div
                    key={ar.node_id}
                    className="border border-border/20 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleAgent(ar.node_id)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-muted/20 transition-colors"
                    >
                      {ar.error ? (
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                      <span className="text-xs font-semibold text-foreground flex-1">
                        {ar.agent_name}
                      </span>
                      {ar.tokens && (
                        <span className="text-[10px] text-muted-foreground/40">
                          {ar.tokens} tokens
                        </span>
                      )}
                      {expandedAgents.has(ar.node_id) ? (
                        <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/40" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" />
                      )}
                    </button>
                    {expandedAgents.has(ar.node_id) && (
                      <div className="px-4 pb-3 border-t border-border/10">
                        <div className="prose prose-invert prose-xs max-w-none mt-2 text-xs leading-relaxed text-muted-foreground/80">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {ar.response || ar.error || "No output"}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Final output */}
            <div>
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2">
                Final Output
              </p>
              <div className="border border-border/20 rounded-xl p-4 bg-background/30">
                <div className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result.final_output || "No output generated."}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasResultPanel;
