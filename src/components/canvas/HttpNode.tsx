import React, { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Globe, ChevronDown, Eye, EyeOff } from "lucide-react";

interface HttpNodeData {
  label?: string;
  onLabelChange?: (val: string) => void;
  method?: string; // "GET" | "POST" | "PUT" | "DELETE"
  onMethodChange?: (val: string) => void;
  url?: string;
  onUrlChange?: (val: string) => void;
  headers?: string; // JSON string
  onHeadersChange?: (val: string) => void;
  body?: string; // Text / JSON string
  onBodyChange?: (val: string) => void;
  responsePreview?: string;
  responseStatus?: number;
  [key: string]: unknown;
}

const METHODS = ["GET", "POST", "PUT", "DELETE"];

const HttpNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as HttpNodeData;
  const method = d.method || "GET";
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div
      className={`group relative min-w-[280px] max-w-[340px] rounded-2xl border transition-all duration-300 ${
        selected
          ? "border-teal-500/60 shadow-lg shadow-teal-500/20 bg-teal-500/[0.04]"
          : "border-border/40 hover:border-teal-500/30 bg-card/60"
      } backdrop-blur-xl`}
    >
      {/* Target input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-teal-500 !border-2 !border-background !rounded-full !shadow-lg !shadow-teal-500/30"
      />

      {/* Source output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-teal-500 !border-2 !border-background !rounded-full !shadow-lg !shadow-teal-500/30"
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/20">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background:
              "linear-gradient(135deg, hsl(170,80%,45%), hsl(185,80%,40%))",
            boxShadow: "0 4px 16px hsla(170,70%,45%,0.3)",
          }}
        >
          <Globe className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-foreground tracking-tight">
            {d.label || "HTTP Request"}
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            Make external API calls
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
            placeholder="e.g. Fetch CRM data"
            className="w-full bg-background/40 border border-border/30 rounded-lg px-2.5 py-1 text-[10px] text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-teal-500/40 focus:border-teal-500/40 transition-all"
          />
        </div>

        {/* Method & URL */}
        <div className="flex gap-2">
          <div className="w-[80px] shrink-0">
            <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
              Method
            </label>
            <div className="relative">
              <select
                value={method}
                onChange={(e) => d.onMethodChange?.(e.target.value)}
                className="w-full bg-background/40 border border-border/30 rounded-lg pl-2 py-1 text-[10px] text-foreground outline-none focus:ring-1 focus:ring-teal-500/40 focus:border-teal-500/40 transition-all appearance-none cursor-pointer"
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted-foreground/40 pointer-events-none" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
              URL
            </label>
            <input
              type="text"
              value={d.url || ""}
              onChange={(e) => d.onUrlChange?.(e.target.value)}
              placeholder="https://api.example.com/data"
              className="w-full bg-background/40 border border-border/30 rounded-lg px-2.5 py-1 text-[10px] text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-teal-500/40 focus:border-teal-500/40 transition-all"
            />
          </div>
        </div>

        {/* Expandable Headers/Body */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-[9px] font-bold text-teal-400 hover:text-teal-300 transition-colors uppercase tracking-wider outline-none"
          >
            {showAdvanced ? (
              <>
                <EyeOff className="w-2.5 h-2.5" /> Hide Headers & Body
              </>
            ) : (
              <>
                <Eye className="w-2.5 h-2.5" /> Show Headers & Body
              </>
            )}
          </button>
        </div>

        {showAdvanced && (
          <div className="flex flex-col gap-2.5 animate-in fade-in-50 duration-200">
            <div>
              <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
                Headers (JSON)
              </label>
              <textarea
                value={d.headers || ""}
                onChange={(e) => d.onHeadersChange?.(e.target.value)}
                placeholder='{ "Content-Type": "application/json" }'
                rows={2}
                className="w-full bg-background/40 border border-border/30 rounded-lg px-2.5 py-1 text-[10px] text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-teal-500/40 focus:border-teal-500/40 transition-all font-mono resize-none"
              />
            </div>

            {(method === "POST" || method === "PUT") && (
              <div>
                <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
                  Request Body
                </label>
                <textarea
                  value={d.body || ""}
                  onChange={(e) => d.onBodyChange?.(e.target.value)}
                  placeholder="Request payload (e.g. JSON or text)"
                  rows={3}
                  className="w-full bg-background/40 border border-border/30 rounded-lg px-2.5 py-1 text-[10px] text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-teal-500/40 focus:border-teal-500/40 transition-all font-mono resize-y"
                />
              </div>
            )}
          </div>
        )}

        {/* Output Preview */}
        {d.responseStatus !== undefined && (
          <div className="pt-2 border-t border-border/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] font-bold text-muted-foreground/60 uppercase">Response</span>
              <span
                className={`text-[8px] font-bold px-1 py-0.5 rounded ${
                  d.responseStatus >= 200 && d.responseStatus < 300
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                Status {d.responseStatus}
              </span>
            </div>
            {d.responsePreview && (
              <pre className="w-full max-h-[80px] bg-background/50 border border-border/20 rounded-lg p-1.5 text-[8px] text-foreground overflow-auto font-mono whitespace-pre-wrap">
                {d.responsePreview}
              </pre>
            )}
          </div>
        )}

        <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-border/10 text-[9px] font-semibold tracking-wider text-muted-foreground/40 uppercase">
          <span>Input (Data)</span>
          <span>Output (JSON/Text)</span>
        </div>
      </div>
    </div>
  );
};

export default memo(HttpNode);
