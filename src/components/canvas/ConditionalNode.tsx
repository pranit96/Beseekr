import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Split, ChevronDown } from "lucide-react";

interface ConditionalNodeData {
  label?: string;
  onLabelChange?: (val: string) => void;
  ruleType?: string;
  onRuleTypeChange?: (val: string) => void;
  ruleValue?: string;
  onRuleValueChange?: (val: string) => void;
  ruleDescription?: string;
  onRuleDescriptionChange?: (val: string) => void;
  [key: string]: unknown;
}

const RULE_TYPES = [
  { value: "contains", label: "Contains Keyword" },
  { value: "regex", label: "Regex Match" },
  { value: "length", label: "Length Exceeds" },
  { value: "ai", label: "AI Classify (LLM)" },
];

const ConditionalNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as ConditionalNodeData;
  const ruleType = d.ruleType || "contains";

  return (
    <div
      className={`group relative min-w-[280px] max-w-[340px] rounded-2xl border transition-all duration-300 ${
        selected
          ? "border-cyan-500/60 shadow-lg shadow-cyan-500/20 bg-cyan-500/[0.04]"
          : "border-border/40 hover:border-cyan-500/30 bg-card/60"
      } backdrop-blur-xl`}
    >
      {/* Target input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-cyan-500 !border-2 !border-background !rounded-full !shadow-lg !shadow-cyan-500/30"
      />

      {/* Source output handles */}
      {/* True Handle (Top Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ top: "28%" }}
        className="!w-3.5 !h-3.5 !bg-emerald-500 !border-2 !border-background !rounded-full !shadow-lg !shadow-emerald-500/30"
      />

      {/* False Handle (Bottom Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ top: "72%" }}
        className="!w-3.5 !h-3.5 !bg-rose-500 !border-2 !border-background !rounded-full !shadow-lg !shadow-rose-500/30"
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/20">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background:
              "linear-gradient(135deg, hsl(190,80%,50%), hsl(205,80%,45%))",
            boxShadow: "0 4px 16px hsla(190,70%,50%,0.3)",
          }}
        >
          <Split className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-foreground tracking-tight">
            {d.label || "Conditional / IF"}
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            Route flow based on conditions
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
            placeholder="e.g. Filter Results"
            className="w-full bg-background/40 border border-border/30 rounded-lg px-2.5 py-1 text-[10px] text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500/40 transition-all"
          />
        </div>

        {/* Rule Type */}
        <div>
          <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
            Condition Rule
          </label>
          <div className="relative">
            <select
              value={ruleType}
              onChange={(e) => d.onRuleTypeChange?.(e.target.value)}
              className="w-full bg-background/40 border border-border/30 rounded-lg pl-2.5 pr-6 py-1 text-[10px] text-foreground outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500/40 transition-all appearance-none cursor-pointer"
            >
              {RULE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted-foreground/40 pointer-events-none" />
          </div>
        </div>

        {/* Rule Config Details */}
        {ruleType === "ai" ? (
          <div>
            <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
              AI Match Criteria
            </label>
            <textarea
              value={d.ruleDescription || ""}
              onChange={(e) => d.onRuleDescriptionChange?.(e.target.value)}
              placeholder="e.g. The text discusses software development or technical engineering projects."
              rows={2}
              className="w-full bg-background/40 border border-border/30 rounded-lg px-2.5 py-1 text-[10px] text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500/40 transition-all resize-none font-sans"
            />
          </div>
        ) : (
          <div>
            <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
              {ruleType === "length" ? "Length Threshold (chars)" : "Match Pattern / Keyword"}
            </label>
            <input
              type={ruleType === "length" ? "number" : "text"}
              value={d.ruleValue || ""}
              onChange={(e) => d.onRuleValueChange?.(e.target.value)}
              placeholder={
                ruleType === "length"
                  ? "e.g. 500"
                  : ruleType === "regex"
                  ? "e.g. \\b(error|failed)\\b"
                  : "e.g. successful"
              }
              className="w-full bg-background/40 border border-border/30 rounded-lg px-2.5 py-1 text-[10px] text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500/40 transition-all"
            />
          </div>
        )}

        {/* Visual Handle Labels */}
        <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-border/10 text-[9px] font-semibold tracking-wider">
          <span className="text-muted-foreground/40 uppercase">Input</span>
          <div className="flex flex-col items-end gap-3.5 mr-1 text-right">
            <span className="text-emerald-400 uppercase flex items-center gap-1">
              True <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-rose-400 uppercase flex items-center gap-1">
              False <span className="w-1 h-1 rounded-full bg-rose-500"></span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ConditionalNode);
