// src/components/canvas/SplitNode.tsx
// Feature 3: Fan-Out Broadcasting — one input, N parallel branches
// Each branch fires a separate LLM call simultaneously

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  GitFork,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Cpu,
} from "lucide-react";
import { useMyAgents } from "@/hooks/use-api-queries";

interface Branch {
  label: string;
  instruction: string;
}

const BRANCH_COLORS = [
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
];

const SplitNode = memo(({ data, selected }: NodeProps) => {
  const [expanded, setExpanded] = useState(true);
  const { data: agentsResponse } = useMyAgents();
  const agents = agentsResponse?.data || [];

  const branches: Branch[] = (data.branches as Branch[]) || [
    { label: "Branch 1", instruction: "" },
    { label: "Branch 2", instruction: "" },
  ];
  const label = (data.label as string) || "Fan-Out Split";
  const isRunning = (data.status as string) === "running";
  const agentName = (data.agentName as string) || "None (Shared)";

  const addBranch = () => {
    const newBranches = [
      ...branches,
      { label: `Branch ${branches.length + 1}`, instruction: "" },
    ];
    (data.onBranchesChange as Function)?.(newBranches);
  };

  const removeBranch = (idx: number) => {
    if (branches.length <= 1) return;
    (data.onBranchesChange as Function)?.(branches.filter((_, i) => i !== idx));
  };

  const updateBranch = (idx: number, field: keyof Branch, value: string) => {
    const updated = branches.map((b, i) =>
      i === idx ? { ...b, [field]: value } : b,
    );
    (data.onBranchesChange as Function)?.(updated);
  };

  return (
    <div
      className={`
        relative min-w-[240px] max-w-[280px] rounded-2xl border-2 shadow-xl shadow-black/20 overflow-hidden
        transition-all duration-300
        ${selected ? "border-cyan-400 shadow-cyan-500/30" : "border-cyan-500/30"}
        ${isRunning ? "shadow-cyan-500/50 border-cyan-400/80" : ""}
      `}
      style={{ background: "hsl(195 20% 9%)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3.5 pt-3 pb-2.5 border-b border-cyan-500/15">
        <div
          className={`
          w-8 h-8 rounded-xl flex items-center justify-center shrink-0
          bg-gradient-to-br from-cyan-500 to-blue-600
          shadow-lg shadow-cyan-500/30
          ${isRunning ? "animate-pulse" : ""}
        `}
        >
          <GitFork className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
            Fan-Out
          </div>
          <div className="text-xs font-bold text-foreground truncate">
            {label}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-black text-cyan-400/60 bg-cyan-500/10 border border-cyan-500/20 rounded-md px-1.5 py-0.5">
            {branches.length}×
          </span>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="p-1 rounded-lg hover:bg-cyan-500/10 text-cyan-400/60 hover:text-cyan-400 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Branch list */}
      <div className="px-3.5 py-3 space-y-2">
        {/* Shared Agent Chip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-500/8 border border-cyan-500/15">
          <Cpu className="w-3 h-3 text-cyan-400 shrink-0" />
          <span className="text-[11px] font-semibold text-cyan-300/80 truncate">
            {agentName}
          </span>
        </div>

        {expanded && (
          <div className="space-y-1 pb-2 border-b border-cyan-500/10">
            <label className="text-[9px] font-black text-cyan-400/50 uppercase tracking-widest">
              Shared Agent (Optional)
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
                  selectedAgent ? selectedAgent.name : "None (Shared)",
                );
              }}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-background/40 border border-cyan-500/20 text-foreground focus:border-cyan-400/50 focus:outline-none"
            >
              <option value="">None (Use default)</option>
              {agents.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Parallel indicator */}
        {isRunning && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <div className="flex gap-0.5">
              {branches.map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-3 rounded-full bg-cyan-400"
                  style={{
                    animation: `bar-bounce 0.8s ease-in-out infinite`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] font-bold text-cyan-400">
              Running {branches.length} branches in parallel…
            </span>
          </div>
        )}

        {expanded &&
          branches.map((branch, idx) => (
            <div
              key={idx}
              className="group space-y-1.5 p-2.5 rounded-xl bg-cyan-500/5 border border-cyan-500/10 hover:border-cyan-500/25 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${BRANCH_COLORS[idx % BRANCH_COLORS.length]} shrink-0`}
                />
                <input
                  value={branch.label}
                  onChange={(e) => updateBranch(idx, "label", e.target.value)}
                  placeholder={`Branch ${idx + 1}`}
                  className="flex-1 min-w-0 text-[11px] font-bold text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                />
                {branches.length > 1 && (
                  <button
                    onClick={() => removeBranch(idx)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground/50 hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <textarea
                value={branch.instruction}
                onChange={(e) =>
                  updateBranch(idx, "instruction", e.target.value)
                }
                placeholder="Branch-specific instruction (e.g. Write a tweet thread)"
                rows={2}
                className="w-full px-2 py-1.5 rounded-lg text-[11px] bg-background/30 border border-cyan-500/10 text-foreground placeholder:text-muted-foreground/35 focus:border-cyan-400/40 focus:outline-none resize-none"
              />
            </div>
          ))}

        {expanded && branches.length < 10 && (
          <button
            onClick={addBranch}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-dashed border-cyan-500/25 text-[11px] font-bold text-cyan-400/60 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Branch
          </button>
        )}
      </div>

      {/* Source handles — one per branch */}
      <Handle
        type="target"
        position={Position.Left}
        id="split-in"
        className="!w-3 !h-3 !border-2 !border-cyan-400 !bg-cyan-900"
      />
      {branches.map((_, idx) => (
        <Handle
          key={idx}
          type="source"
          position={Position.Right}
          id={`branch_${idx}`}
          style={{ top: `${((idx + 0.5) / branches.length) * 100}%` }}
          className="!w-3 !h-3 !border-2 !border-cyan-400 !bg-cyan-900"
        />
      ))}

      <style>{`
        @keyframes bar-bounce {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
});

SplitNode.displayName = "SplitNode";
export default SplitNode;
