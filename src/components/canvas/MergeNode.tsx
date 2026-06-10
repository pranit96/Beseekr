import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Merge, ChevronDown } from "lucide-react";

interface MergeNodeData {
  label?: string;
  onLabelChange?: (val: string) => void;
  strategy?: string;
  onStrategyChange?: (val: string) => void;
  separator?: string;
  onSeparatorChange?: (val: string) => void;
  [key: string]: unknown;
}

const STRATEGIES = [
  { value: "concat", label: "Concatenate Text" },
  { value: "bullets", label: "Bullet Points" },
  { value: "summarize", label: "AI Summarize (LLM)" },
  { value: "pick_best", label: "Pick Best (LLM)" },
  { value: "table", label: "Format as Table" },
];

const MergeNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as MergeNodeData;
  const strategy = d.strategy || "concat";

  return (
    <div
      className={`group relative min-w-[260px] max-w-[320px] rounded-2xl border transition-all duration-300 ${
        selected
          ? "border-indigo-500/60 shadow-lg shadow-indigo-500/20 bg-indigo-500/[0.04]"
          : "border-border/40 hover:border-indigo-500/30 bg-card/60"
      } backdrop-blur-xl`}
    >
      {/* Target input handle (supports multiple incoming connections in React Flow) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-indigo-500 !border-2 !border-background !rounded-full !shadow-lg !shadow-indigo-500/30"
      />

      {/* Source output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-indigo-500 !border-2 !border-background !rounded-full !shadow-lg !shadow-indigo-500/30"
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/20">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background:
              "linear-gradient(135deg, hsl(235,80%,60%), hsl(250,80%,55%))",
            boxShadow: "0 4px 16px hsla(235,70%,60%,0.3)",
          }}
        >
          <Merge className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-foreground tracking-tight">
            {d.label || "Merge / Combiner"}
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            Combine multiple node outputs
          </p>
        </div>
      </div>

      {/* Body / Configuration */}
      <div className="px-4 py-3 flex flex-col gap-2.5">
        {/* Node Name */}
        <div>
          <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
            Node Name
          </label>
          <input
            type="text"
            value={d.label || ""}
            onChange={(e) => d.onLabelChange?.(e.target.value)}
            placeholder="e.g. Combine Reports"
            className="w-full bg-background/40 border border-border/30 rounded-lg px-2.5 py-1 text-[10px] text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all"
          />
        </div>

        {/* Strategy */}
        <div>
          <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
            Merge Strategy
          </label>
          <div className="relative">
            <select
              value={strategy}
              onChange={(e) => d.onStrategyChange?.(e.target.value)}
              className="w-full bg-background/40 border border-border/30 rounded-lg pl-2.5 pr-6 py-1 text-[10px] text-foreground outline-none focus:ring-1 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all appearance-none cursor-pointer"
            >
              {STRATEGIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted-foreground/40 pointer-events-none" />
          </div>
        </div>

        {/* Strategy Specific Settings */}
        {strategy === "concat" && (
          <div>
            <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
              Separator
            </label>
            <input
              type="text"
              value={d.separator ?? "\\n\\n"}
              onChange={(e) => d.onSeparatorChange?.(e.target.value)}
              placeholder="e.g. \n\n"
              className="w-full bg-background/40 border border-border/30 rounded-lg px-2.5 py-1 text-[10px] text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all font-mono"
            />
          </div>
        )}

        <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-border/10 text-[9px] font-semibold tracking-wider text-muted-foreground/40 uppercase">
          <span>Inputs (Multi)</span>
          <span>Output</span>
        </div>
      </div>
    </div>
  );
};

export default memo(MergeNode);
