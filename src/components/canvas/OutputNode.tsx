import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  FileOutput,
  FileText,
  FileSpreadsheet,
  FileType,
  AlignLeft,
} from "lucide-react";

interface OutputNodeData {
  label?: string;
  outputFormat?: string;
  onFormatChange?: (format: string) => void;
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
  { value: "latex", label: "LaTeX", icon: FileText },
];

const OutputNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as OutputNodeData;
  const format = d.outputFormat || "plain";

  return (
    <div
      className={`group relative min-w-[240px] max-w-[300px] rounded-2xl border transition-all duration-300 ${
        selected
          ? "border-sky-500/60 shadow-lg shadow-sky-500/20 bg-sky-500/[0.04]"
          : "border-border/40 hover:border-sky-500/30 bg-card/60"
      } backdrop-blur-xl`}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-sky-500 !border-2 !border-background !rounded-full !shadow-lg !shadow-sky-500/30"
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/20">
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
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground tracking-tight">
            {d.label || "Output"}
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            Final result format
          </p>
        </div>
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
                    : "bg-muted/20 border border-border/20 text-muted-foreground/60 hover:border-sky-500/20 hover:text-muted-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Email toggle & fields */}
      <div className="border-t border-border/10 px-4 py-3 bg-muted/5 flex flex-col gap-2 rounded-b-2xl">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!d.emailEnabled}
            onChange={(e) => d.onEmailToggleChange?.(e.target.checked)}
            className="w-3 h-3 rounded border-border/40 text-sky-500 focus:ring-sky-500/30"
          />
          <span className="text-[10px] font-medium text-muted-foreground select-none">
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
              className="w-full bg-background/40 border border-border/30 rounded-lg px-2.5 py-1 text-[10px] text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40"
            />
            <input
              type="text"
              value={d.emailSubject || ""}
              onChange={(e) => d.onEmailSubjectChange?.(e.target.value)}
              placeholder="Email Subject"
              className="w-full bg-background/40 border border-border/30 rounded-lg px-2.5 py-1 text-[10px] text-foreground placeholder-muted-foreground/40 outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40"
            />
          </div>
        )}
      </div>

      {/* Output handle — allows connecting to downstream nodes like Email */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-sky-500 !border-2 !border-background !rounded-full !shadow-lg !shadow-sky-500/30"
      />
    </div>
  );
};

export default memo(OutputNode);
