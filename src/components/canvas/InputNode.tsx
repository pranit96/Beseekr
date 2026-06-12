import React, { memo, useRef, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  MessageSquareText,
  Type,
  Braces,
  Table,
  Upload,
  Loader2,
} from "lucide-react";
import { apiClient } from "@/lib/api";

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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleFileRead = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const simpleTextExtensions = [".txt", ".json", ".csv", ".md", ".xml", ".html", ".log", ".tsv"];

    if (simpleTextExtensions.includes(ext)) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        d.onInputChange?.(content);

        // Auto-detect format from extension
        const rawExt = file.name.split(".").pop()?.toLowerCase();
        if (rawExt === "json" && d.onFormatChange) d.onFormatChange("json");
        else if (rawExt === "csv" && d.onFormatChange) d.onFormatChange("csv");
      };
      reader.readAsText(file);
      setError(null);
    } else {
      setUploading(true);
      setError(null);
      try {
        const response = await apiClient.uploadChatFiles([file]);
        if (response.success && response.data?.[0]) {
          const parsedText = response.data[0].extracted_content || "";
          d.onInputChange?.(parsedText);
        } else {
          setError(response.error || "Failed to parse file");
        }
      } catch (err: any) {
        setError(err.message || "Failed to upload and parse file");
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    }
  };

  const cardClass = [
    "canvas-node-card group relative min-w-[260px] max-w-[320px]",
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
          background: "linear-gradient(90deg, hsl(145, 70%, 45%), transparent)",
        }}
      />

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="canvas-handle !bg-emerald-500"
        style={{ "--handle-color": "hsla(145, 60%, 45%, 0.5)" } as React.CSSProperties}
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5">
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
          <p className="text-xs font-bold text-white/90 tracking-tight">
            {d.label || "Input"}
          </p>
          <p className="text-[10px] text-white/35">User prompt</p>
        </div>
        {/* Char count badge */}
        {charCount > 0 && (
          <span className="text-[9px] font-medium text-white/40 bg-white/[0.04] border border-white/8 px-1.5 py-0.5 rounded-md tabular-nums">
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
                    : "bg-white/[0.02] border border-white/8 text-white/40 hover:border-emerald-500/20 hover:text-white/60"
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
              accept=".txt,.json,.csv,.md,.xml,.html,.log,.tsv,.pdf,.docx,.doc,.xlsx,.xls"
              onChange={handleFileRead}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-1.5 px-3 py-5 border-2 border-dashed border-emerald-500/20 rounded-xl bg-emerald-500/5">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-medium animate-pulse">
                  Parsing document...
                </span>
              </div>
            ) : text ? (
              <div className="space-y-1.5">
                <div className="w-full bg-white/[0.02] border border-white/8 rounded-xl px-3 py-2 text-[10px] text-white/80 max-h-[80px] overflow-y-auto custom-scrollbar font-mono leading-relaxed whitespace-pre-wrap">
                  {text.slice(0, 500)}
                  {text.length > 500 && (
                    <span className="text-white/20">
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
                className="w-full flex flex-col items-center gap-1.5 px-3 py-4 border-2 border-dashed border-white/8 rounded-xl hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer"
              >
                <Upload className="w-5 h-5 text-white/20" />
                <span className="text-[10px] text-white/30">
                  Click to upload PDF, DOCX, CSV, TXT...
                </span>
              </button>
            )}
            {error && (
              <p className="text-[9px] text-red-400 mt-1.5 font-medium text-center">
                {error}
              </p>
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
              className={`w-full bg-white/[0.03] border rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 resize-none outline-none focus:ring-1 transition-all ${
                format === "json" || format === "csv"
                  ? "font-mono text-[11px] leading-relaxed"
                  : ""
              } ${
                isJsonValid === false
                  ? "border-red-500/40 focus:ring-red-500/30 focus:border-red-500/40"
                  : "border-white/8 focus:ring-emerald-500/40 focus:border-emerald-500/40"
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
        className="canvas-handle !bg-emerald-500"
        style={{ "--handle-color": "hsla(145, 60%, 45%, 0.5)" } as React.CSSProperties}
      />
    </div>
  );
};

export default memo(InputNode);
