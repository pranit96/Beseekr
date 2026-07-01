// src/components/canvas/LoopNode.tsx
// Feature 1: Iterative Agent Loop Node
// Feeds output back into itself N times with optional AI convergence check

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { RefreshCw, ChevronDown, ChevronUp, Cpu } from "lucide-react";
import { useMyAgents } from "@/hooks/use-api-queries";

const CONVERGENCE_MODES = [
  { value: "count", label: "Fixed Iterations" },
  { value: "ai", label: "AI Convergence Check" },
];

const LoopNode = memo(({ data, selected }: NodeProps) => {
  const [expanded, setExpanded] = useState(false);
  const { data: agentsResponse } = useMyAgents();
  const agents = agentsResponse?.data || [];

  const maxIter = (data.maxIterations as number) || 3;
  const mode = (data.convergenceMode as string) || "count";
  const agentName = (data.agentName as string) || "No agent selected";
  const label = (data.label as string) || "Loop";

  // Live iteration indicator (set during execution)
  const currentIter = (data._currentIteration as number) || 0;
  const isRunning = (data.status as string) === "running";
  const isDone = (data.status as string) === "done";

  return (
    <div
      className={`
        relative min-w-[220px] rounded-2xl border-2 shadow-xl shadow-black/20 overflow-hidden
        transition-all duration-300
        ${selected ? "border-amber-400 shadow-amber-500/30" : "border-amber-500/30"}
        ${isRunning ? "shadow-amber-500/50 border-amber-400/80" : ""}
      `}
      style={{ background: "hsl(24 20% 9%)" }}
    >
      {/* Animated scanning line during run */}
      {isRunning && (
        <div
          className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent"
          style={{
            animation: "scan 1.5s ease-in-out infinite",
            top: `${((currentIter / maxIter) * 100).toFixed(0)}%`,
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2.5 px-3.5 pt-3 pb-2.5 border-b border-amber-500/15">
        <div
          className={`
            w-8 h-8 rounded-xl flex items-center justify-center shrink-0
            bg-gradient-to-br from-amber-500 to-orange-600
            shadow-lg shadow-amber-500/30
            ${isRunning ? "animate-spin" : ""}
          `}
          style={{ animationDuration: "2s" }}
        >
          <RefreshCw className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
            Loop
          </div>
          <div className="text-xs font-bold text-foreground truncate">
            {label}
          </div>
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="p-1 rounded-lg hover:bg-amber-500/10 text-amber-400/60 hover:text-amber-400 transition-colors"
        >
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Iteration Progress */}
      <div className="px-3.5 py-3 space-y-2.5">
        {/* Visual iteration dots */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-amber-400/60 font-bold mr-1">
            Iterations:
          </span>
          {Array.from({ length: maxIter }).map((_, i) => (
            <div
              key={i}
              className={`
                rounded-full transition-all duration-500
                ${isRunning && i === currentIter - 1 ? "w-4 h-4 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" : ""}
                ${i < currentIter ? "w-3 h-3 bg-amber-500/70" : ""}
                ${i >= currentIter && !(isRunning && i === currentIter - 1) ? "w-3 h-3 bg-amber-900/50 border border-amber-500/20" : ""}
              `}
            />
          ))}
          {isDone && (
            <span className="ml-1 text-[10px] font-black text-emerald-400">
              ✓ Done
            </span>
          )}
        </div>

        {/* Agent chip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/8 border border-amber-500/15">
          <Cpu className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="text-[11px] font-semibold text-amber-300/80 truncate">
            {agentName}
          </span>
        </div>

        {/* Expanded config */}
        {expanded && (
          <div className="space-y-2 pt-1 border-t border-amber-500/10">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-amber-400/50 uppercase tracking-widest">
                Agent
              </label>
              <select
                value={(data.agentId as string) || ""}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const selectedAgent = agents.find(
                    (a: any) => a.id === selectedId,
                  );
                  (data.onAgentChange as Function)?.(
                    selectedId,
                    selectedAgent ? selectedAgent.name : "Unknown",
                  );
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-background/40 border border-amber-500/20 text-foreground focus:border-amber-400/50 focus:outline-none"
              >
                <option value="">-- Select Agent --</option>
                {agents.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-amber-400/50 uppercase tracking-widest">
                Max Iterations
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={maxIter}
                onChange={(e) =>
                  (data.onMaxIterationsChange as Function)?.(
                    parseInt(e.target.value),
                  )
                }
                className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-background/40 border border-amber-500/20 text-foreground focus:border-amber-400/50 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-amber-400/50 uppercase tracking-widest">
                Convergence
              </label>
              <select
                value={mode}
                onChange={(e) =>
                  (data.onConvergenceModeChange as Function)?.(e.target.value)
                }
                className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-background/40 border border-amber-500/20 text-foreground focus:border-amber-400/50 focus:outline-none"
              >
                {CONVERGENCE_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            {mode === "ai" && (
              <div className="space-y-1">
                <label className="text-[9px] font-black text-amber-400/50 uppercase tracking-widest">
                  Convergence Prompt
                </label>
                <textarea
                  value={(data.convergencePrompt as string) || ""}
                  onChange={(e) =>
                    (data.onConvergencePromptChange as Function)?.(
                      e.target.value,
                    )
                  }
                  placeholder="Is this output complete and satisfactory?"
                  rows={2}
                  className="w-full px-2.5 py-1.5 rounded-lg text-[11px] bg-background/40 border border-amber-500/20 text-foreground placeholder:text-muted-foreground/40 focus:border-amber-400/50 focus:outline-none resize-none"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="loop-in"
        className="!w-3 !h-3 !border-2 !border-amber-400 !bg-amber-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="loop-out"
        className="!w-3 !h-3 !border-2 !border-amber-400 !bg-amber-900"
      />

      <style>{`
        @keyframes scan {
          0%, 100% { opacity: 0.3; transform: scaleX(0.3); }
          50% { opacity: 1; transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
});

LoopNode.displayName = "LoopNode";
export default LoopNode;
