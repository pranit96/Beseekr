import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Zap, ChevronDown } from "lucide-react";

interface TransformNodeData {
  label?: string;
  onLabelChange?: (val: string) => void;
  operation?: string;
  onOperationChange?: (val: string) => void;
  transformPreview?: string;
  [key: string]: unknown;
}

const OPERATIONS = [
  { value: "json_to_csv", label: "JSON array ➔ CSV" },
  { value: "csv_to_json", label: "CSV ➔ JSON array" },
  { value: "json_to_table", label: "JSON ➔ Markdown Table" },
  { value: "json_to_text", label: "JSON ➔ Proper Text List" },
  { value: "uppercase", label: "UPPERCASE" },
  { value: "lowercase", label: "lowercase" },
  { value: "titlecase", label: "Title Case" },
  { value: "extract_json", label: "Extract JSON from text" },
  { value: "trim", label: "Trim & Remove Blank Lines" },
  { value: "word_stats", label: "Word count & Stats" },
];

const TransformNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as TransformNodeData;
  const operation = d.operation || "json_to_csv";

  return (
    <div
      className={`group relative min-w-[260px] max-w-[320px] rounded-2xl border transition-all duration-300 ${
        selected
          ? "border-fuchsia-500/60 shadow-lg shadow-fuchsia-500/20 bg-fuchsia-500/[0.04]"
          : "border-border/40 hover:border-fuchsia-500/30 bg-card/60"
      } backdrop-blur-xl`}
    >
      {/* Target input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-fuchsia-500 !border-2 !border-background !rounded-full !shadow-lg !shadow-fuchsia-500/30"
      />

      {/* Source output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-fuchsia-500 !border-2 !border-background !rounded-full !shadow-lg !shadow-fuchsia-500/30"
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/20">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background:
              "linear-gradient(135deg, hsl(295,80%,50%), hsl(315,80%,45%))",
            boxShadow: "0 4px 16px hsla(295,70%,50%,0.3)",
          }}
        >
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-foreground tracking-tight">
            {d.label || "Transform / Utility"}
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            Format or transform text
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
            placeholder="e.g. Convert formatting"
            className="w-full bg-background/40 border border-border/30 rounded-lg px-2.5 py-1 text-[10px] text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-fuchsia-500/40 focus:border-fuchsia-500/40 transition-all"
          />
        </div>

        {/* Operation Selection */}
        <div>
          <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
            Transform Type
          </label>
          <div className="relative">
            <select
              value={operation}
              onChange={(e) => d.onOperationChange?.(e.target.value)}
              className="w-full bg-background/40 border border-border/30 rounded-lg pl-2.5 pr-6 py-1 text-[10px] text-foreground outline-none focus:ring-1 focus:ring-fuchsia-500/40 focus:border-fuchsia-500/40 transition-all appearance-none cursor-pointer"
            >
              {OPERATIONS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted-foreground/40 pointer-events-none" />
          </div>
        </div>

        {/* Output Preview */}
        {d.transformPreview && (
          <div className="pt-2 border-t border-border/10">
            <span className="text-[8px] font-bold text-muted-foreground/60 uppercase block mb-1">Preview</span>
            <pre className="w-full max-h-[80px] bg-background/50 border border-border/20 rounded-lg p-1.5 text-[8px] text-foreground overflow-auto font-mono whitespace-pre-wrap">
              {d.transformPreview}
            </pre>
          </div>
        )}

        <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-border/10 text-[9px] font-semibold tracking-wider text-muted-foreground/40 uppercase">
          <span>Input (Data)</span>
          <span>Output (Result)</span>
        </div>
      </div>
    </div>
  );
};

export default memo(TransformNode);
