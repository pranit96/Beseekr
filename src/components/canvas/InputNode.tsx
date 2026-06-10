import React, { memo, useRef } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  MessageSquareText,
  Type,
  Braces,
  Table,
  Upload,
} from "lucide-react";

interface InputNodeData {
  label?: string;
  inputText?: string;
  onInputChange?: (text: string) => void;
  inputFormat?: string;
  onFormatChange?: (format: string) => void;
  [key: string]: unknown;
}

const INPUT_FORMATS = [
  { value: "text", label: "Text", icon: Type },
  { value: "json", label: "JSON", icon: Braces },
  { value: "csv", label: "CSV", icon: Table },
  { value: "file", label: "File", icon: Upload },
];

const InputNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as InputNodeData;
  const format = d.inputFormat || "text";
  const text = d.inputText || "";
  const fileRef = useRef<HTMLInputElement>(null);

  const charCount = text.length;
  const isJsonValid =
    format === "json" && text.trim().length > 0
      ? (() => {
          try {
            JSON.parse(text);
            return true;
          } catch {
            return false;
          }
        })()
      : null;

  const handleFileRead = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      d.onInputChange?.(content);

      // Auto-detect format from extension
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "json" && d.onFormatChange) d.onFormatChange("json");
      else if (ext === "csv" && d.onFormatChange) d.onFormatChange("csv");
    };
    reader.readAsText(file);
  };

  return (
    <div
      className={`group relative min-w-[260px] max-w-[320px] rounded-2xl border transition-all duration-300 ${
        selected
          ? "border-emerald-500/60 shadow-lg shadow-emerald-500/20 bg-emerald-500/[0.04]"
          : "border-border/40 hover:border-emerald-500/30 bg-card/60"
      } backdrop-blur-xl`}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/20">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background:
              "linear-gradient(135deg, hsl(145,70%,45%), hsl(160,70%,40%))",
            boxShadow: "0 4px 16px hsla(145,60%,45%,0.3)",
          }}
        >
          <MessageSquareText className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground tracking-tight">
            {d.label || "Input"}
          </p>
          <p className="text-[10px] text-muted-foreground/60">User prompt</p>
        </div>
        {/* Char count badge */}
        {charCount > 0 && (
          <span className="text-[9px] font-medium text-muted-foreground/40 bg-muted/20 px-1.5 py-0.5 rounded-md tabular-nums">
            {charCount > 999
              ? `${(charCount / 1000).toFixed(1)}k`
              : charCount}
          </span>
        )}
      </div>

      {/* Format selector */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex gap-1">
          {INPUT_FORMATS.map((f) => {
            const Icon = f.icon;
            const active = format === f.value;
            return (
              <button
                key={f.value}
                onClick={() => d.onFormatChange?.(f.value)}
                className={`flex-1 flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg text-[9px] font-semibold transition-all ${
                  active
                    ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400"
                    : "bg-muted/15 border border-border/15 text-muted-foreground/50 hover:border-emerald-500/20 hover:text-muted-foreground/70"
                }`}
              >
                <Icon className="w-3 h-3" />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-2 pb-3">
        {format === "file" ? (
          <div className="relative">
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.json,.csv,.md,.xml,.html,.log,.tsv"
              onChange={handleFileRead}
              className="hidden"
            />
            {text ? (
              <div className="space-y-1.5">
                <div className="w-full bg-background/40 border border-border/30 rounded-xl px-3 py-2 text-[10px] text-foreground max-h-[80px] overflow-y-auto custom-scrollbar font-mono leading-relaxed whitespace-pre-wrap">
                  {text.slice(0, 500)}
                  {text.length > 500 && (
                    <span className="text-muted-foreground/40">
                      …({text.length - 500} more chars)
                    </span>
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full text-[9px] font-semibold text-emerald-400/70 hover:text-emerald-400 transition-colors"
                >
                  Replace file
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center gap-1.5 px-3 py-4 border-2 border-dashed border-border/30 rounded-xl hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer"
              >
                <Upload className="w-5 h-5 text-muted-foreground/30" />
                <span className="text-[10px] text-muted-foreground/40">
                  Click to upload .txt, .json, .csv, …
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => d.onInputChange?.(e.target.value)}
              placeholder={
                format === "json"
                  ? '{"key": "value", ...}'
                  : format === "csv"
                    ? "name,email,role\nJohn,john@test.com,admin"
                    : "Type your prompt here…"
              }
              rows={4}
              className={`w-full bg-background/40 border rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted-foreground/50 resize-none outline-none focus:ring-1 transition-all ${
                format === "json" || format === "csv"
                  ? "font-mono text-[11px] leading-relaxed"
                  : ""
              } ${
                isJsonValid === false
                  ? "border-red-500/40 focus:ring-red-500/30 focus:border-red-500/40"
                  : "border-border/30 focus:ring-emerald-500/40 focus:border-emerald-500/40"
              }`}
            />
            {/* JSON validation badge */}
            {format === "json" && text.trim().length > 0 && (
              <span
                className={`absolute bottom-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded ${
                  isJsonValid
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {isJsonValid ? "VALID" : "INVALID"}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-emerald-500 !border-2 !border-background !rounded-full !shadow-lg !shadow-emerald-500/30"
      />
    </div>
  );
};

export default memo(InputNode);
