import React, { memo } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import {
  FileOutput,
  FileText,
  FileSpreadsheet,
  FileType,
  AlignLeft,
  Trash2,
} from "lucide-react";

interface OutputNodeData {
  label?: string;
  outputFormat?: string;
  onFormatChange?: (format: string) => void;
  jsonMode?: "table" | "text";
  onJsonModeChange?: (mode: "table" | "text") => void;
  emailEnabled?: boolean;
  onEmailToggleChange?: (enabled: boolean) => void;
  emailTo?: string;
  onEmailToChange?: (val: string) => void;
  emailSubject?: string;
  onEmailSubjectChange?: (val: string) => void;
  [key: string]: unknown;
}

const FORMAT_OPTIONS = [
  { value: "plain", label: "Plain Text", icon: AlignLeft },
  { value: "pdf", label: "PDF", icon: FileOutput },
  { value: "csv", label: "CSV", icon: FileText },
  { value: "excel", label: "Excel", icon: FileSpreadsheet },
  { value: "docx", label: "DOCX", icon: FileType },
];

const OutputNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const d = data as OutputNodeData;
  const format = d.outputFormat || "plain";

  const { setNodes } = useReactFlow();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== id));
  };

  const cardClass = [
    "canvas-node-card group relative min-w-[240px] max-w-[300px]",
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
          background: "linear-gradient(90deg, hsl(200, 80%, 50%), transparent)",
        }}
      />

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="canvas-handle !bg-sky-500"
        style={
          {
            "--handle-color": "hsla(200, 70%, 50%, 0.5)",
          } as React.CSSProperties
        }
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background:
              "linear-gradient(135deg, hsl(200,80%,50%), hsl(220,80%,45%))",
            boxShadow: "0 4px 16px hsla(200,70%,50%,0.3)",
          }}
        >
          <FileOutput className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white/90 tracking-tight">
            {d.label || "Output"}
          </p>
          <p className="text-[10px] text-white/35">Final result format</p>
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

      {/* Format selector */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-3 gap-1.5">
          {FORMAT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = format === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => d.onFormatChange?.(opt.value)}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[10px] font-medium transition-all ${
                  isActive
                    ? "bg-sky-500/15 border border-sky-500/40 text-sky-400"
                    : "bg-white/[0.02] border border-white/8 text-white/40 hover:border-sky-500/20 hover:text-white/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* JSON Conversion Mode selector */}
      {(format === "pdf" ||
        format === "latex" ||
        format === "plain" ||
        format === "docx") && (
        <div className="px-4 py-2.5 border-t border-white/5">
          <label className="text-[9px] font-bold text-white/30 uppercase tracking-wider block mb-1">
            JSON Conversion Mode
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => d.onJsonModeChange?.("table")}
              className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all ${
                (d.jsonMode || "table") === "table"
                  ? "bg-sky-500/15 border border-sky-500/40 text-sky-400"
                  : "bg-white/[0.02] border border-white/8 text-white/40 hover:border-sky-500/20 hover:text-white/60"
              }`}
            >
              Table Format
            </button>
            <button
              onClick={() => d.onJsonModeChange?.("text")}
              className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all ${
                d.jsonMode === "text"
                  ? "bg-sky-500/15 border border-sky-500/40 text-sky-400"
                  : "bg-white/[0.02] border border-white/8 text-white/40 hover:border-sky-500/20 hover:text-white/60"
              }`}
            >
              Text List Format
            </button>
          </div>
        </div>
      )}

      {/* Email toggle & fields */}
      <div className="border-t border-white/5 px-4 py-3 bg-white/[0.01] flex flex-col gap-2 rounded-b-2xl">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!d.emailEnabled}
            onChange={(e) => d.onEmailToggleChange?.(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-white/10 text-sky-500 bg-white/[0.02] focus:ring-sky-500/30"
          />
          <span className="text-[10px] font-medium text-white/40 select-none">
            Send output copy to my email
          </span>
        </label>
        {d.emailEnabled && (
          <div className="flex flex-col gap-2 mt-1">
            <input
              type="email"
              value={d.emailTo || ""}
              onChange={(e) => d.onEmailToChange?.(e.target.value)}
              placeholder="Recipient Email (Default: Me)"
              className="w-full bg-white/[0.02] border border-white/8 rounded-lg px-2.5 py-1 text-[10px] text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40"
            />
            <input
              type="text"
              value={d.emailSubject || ""}
              onChange={(e) => d.onEmailSubjectChange?.(e.target.value)}
              placeholder="Email Subject"
              className="w-full bg-white/[0.02] border border-white/8 rounded-lg px-2.5 py-1 text-[10px] text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40"
            />
          </div>
        )}
      </div>

      {/* Output handle — allows connecting to downstream nodes like Email */}
      <Handle
        type="source"
        position={Position.Right}
        className="canvas-handle !bg-sky-500"
        style={
          {
            "--handle-color": "hsla(200, 70%, 50%, 0.5)",
          } as React.CSSProperties
        }
      />
    </div>
  );
};

export default memo(OutputNode);
