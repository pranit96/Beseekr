import React, { memo } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { Split, ChevronDown, Trash2 } from "lucide-react";

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
const ConditionalNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const d = data as ConditionalNodeData;
  const ruleType = d.ruleType || "contains";

  const { setNodes } = useReactFlow();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== id));
  };

  const cardClass = [
    "canvas-node-card group relative min-w-[280px] max-w-[340px]",
    selected && "canvas-node-card-selected",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass}>
      {/* Accent strip */}
      <div
        className="canvas-node-accent"
        style={{
          background: "linear-gradient(90deg, hsl(190, 80%, 50%), transparent)",
        }}
      />

      {/* Target input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="canvas-handle !bg-cyan-500"
        style={
          {
            "--handle-color": "hsla(190, 70%, 50%, 0.5)",
          } as React.CSSProperties
        }
      />

      {/* Source output handles */}
      {/* True Handle (Top Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="canvas-handle !bg-emerald-500"
        style={
          {
            top: "28%",
            "--handle-color": "hsla(145, 60%, 45%, 0.5)",
          } as React.CSSProperties
        }
      />

      {/* False Handle (Bottom Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        className="canvas-handle !bg-rose-500"
        style={
          {
            top: "72%",
            "--handle-color": "hsla(350, 70%, 50%, 0.5)",
          } as React.CSSProperties
        }
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5">
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
          <p className="text-xs font-bold text-white/90 tracking-tight">
            {d.label || "Conditional / IF"}
          </p>
          <p className="text-[10px] text-white/35">
            Route flow based on conditions
          </p>
        </div>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 shrink-0 ml-auto cursor-pointer"
          title="Delete Node"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body / Configuration */}
      <div className="px-4 py-3 flex flex-col gap-2.5">
        {/* Node Name */}
        <div>
          <label className="text-[9px] font-bold text-white/30 uppercase tracking-wider block mb-1">
            Node Name
          </label>
          <input
            type="text"
            value={d.label || ""}
            onChange={(e) => d.onLabelChange?.(e.target.value)}
            placeholder="e.g. Filter Results"
            className="w-full bg-white/[0.02] border border-white/8 rounded-lg px-2.5 py-1 text-[10px] text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500/40 transition-all"
          />
        </div>

        {/* Rule Type */}
        <div>
          <label className="text-[9px] font-bold text-white/30 uppercase tracking-wider block mb-1">
            Condition Rule
          </label>
          <div className="relative">
            <select
              value={ruleType}
              onChange={(e) => d.onRuleTypeChange?.(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/8 rounded-lg pl-2.5 pr-6 py-1 text-[10px] text-white outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500/40 transition-all appearance-none cursor-pointer"
            >
              {RULE_TYPES.map((t) => (
                <option
                  key={t.value}
                  value={t.value}
                  className="bg-neutral-900 text-white"
                >
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-white/30 pointer-events-none" />
          </div>
        </div>

        {/* Rule Config Details */}
        {ruleType === "ai" ? (
          <div>
            <label className="text-[9px] font-bold text-white/30 uppercase tracking-wider block mb-1">
              AI Match Criteria
            </label>
            <textarea
              value={d.ruleDescription || ""}
              onChange={(e) => d.onRuleDescriptionChange?.(e.target.value)}
              placeholder="e.g. The text discusses software development or technical engineering projects."
              rows={2}
              className="w-full bg-white/[0.02] border border-white/8 rounded-lg px-2.5 py-1 text-[10px] text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500/40 transition-all resize-none font-sans"
            />
          </div>
        ) : (
          <div>
            <label className="text-[9px] font-bold text-white/30 uppercase tracking-wider block mb-1">
              {ruleType === "length"
                ? "Length Threshold (chars)"
                : "Match Pattern / Keyword"}
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
              className="w-full bg-white/[0.02] border border-white/8 rounded-lg px-2.5 py-1 text-[10px] text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500/40 transition-all"
            />
          </div>
        )}

        {/* Visual Handle Labels */}
        <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-white/5 text-[9px] font-semibold tracking-wider">
          <span className="text-white/30 uppercase">Input</span>
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
