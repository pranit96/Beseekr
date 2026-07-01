// src/components/canvas/MemoryNode.tsx
// Feature: Persistent cross-run Memory Node
// Reads/writes a named memory blob that persists across workflow executions

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Database,
} from "lucide-react";

const MEMORY_OPS = [
  { value: "read_write", label: "Read + Write (Update)" },
  { value: "read", label: "Read Only" },
  { value: "write", label: "Write Only" },
  { value: "append", label: "Append to Memory" },
  { value: "clear_write", label: "Overwrite (Clear First)" },
];

const MemoryNode = memo(({ data, selected }: NodeProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const memoryKey = (data.memoryKey as string) || "workflow_memory";
  const operation = (data.operation as string) || "read_write";
  const label = (data.label as string) || "Memory";
  const isRunning = (data.status as string) === "running";
  const isDone = (data.status as string) === "done";
  const memoryPreview = (data._memoryPreview as string) || "";
  const byteSize = (data._byteSize as number) || 0;
  const lastUpdated = (data._lastUpdated as string) || null;

  const opInfo = MEMORY_OPS.find((o) => o.value === operation) || MEMORY_OPS[0];
  const canRead = operation.includes("read") || operation === "read_write";
  const canWrite = operation !== "read";

  return (
    <div
      className={`
        relative min-w-[220px] rounded-2xl border-2 shadow-xl shadow-black/20 overflow-hidden
        transition-all duration-300
        ${selected ? "border-violet-400 shadow-violet-500/30" : "border-violet-500/30"}
        ${isRunning ? "shadow-violet-500/50 border-violet-400/80" : ""}
      `}
      style={{ background: "hsl(260 18% 9%)" }}
    >
      {/* Neural pulse animation during read/write */}
      {isRunning && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-2xl border border-violet-500/30"
              style={{
                animation: "neural-pulse 2s ease-out infinite",
                animationDelay: `${i * 0.6}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2.5 px-3.5 pt-3 pb-2.5 border-b border-violet-500/15">
        <div
          className={`
          w-8 h-8 rounded-xl flex items-center justify-center shrink-0
          bg-gradient-to-br from-violet-500 to-fuchsia-600
          shadow-lg shadow-violet-500/30
          ${isRunning ? "animate-pulse" : ""}
        `}
        >
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
            Memory
          </div>
          <div className="text-xs font-bold text-foreground truncate">
            {label}
          </div>
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="p-1 rounded-lg hover:bg-violet-500/10 text-violet-400/60 hover:text-violet-400 transition-colors"
        >
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      <div className="px-3.5 py-3 space-y-2.5">
        {/* Memory key + state */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-violet-500/8 border border-violet-500/15">
          <Database className="w-3 h-3 text-violet-400 shrink-0" />
          <code className="text-[11px] font-mono font-bold text-violet-300/90 truncate flex-1">
            {memoryKey}
          </code>
          {byteSize > 0 && (
            <span className="text-[9px] text-violet-400/60 shrink-0">
              {byteSize < 1024
                ? `${byteSize}B`
                : `${(byteSize / 1024).toFixed(1)}KB`}
            </span>
          )}
        </div>

        {/* Op badges */}
        <div className="flex items-center gap-1.5">
          {canRead && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-500/15 border border-blue-500/25 text-blue-400">
              ← READ
            </span>
          )}
          {canWrite && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-violet-500/15 border border-violet-500/25 text-violet-400">
              WRITE →
            </span>
          )}
          {isDone && (
            <span className="ml-auto px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
              ✓
            </span>
          )}
        </div>

        {/* Memory preview if populated */}
        {isDone && memoryPreview && (
          <div className="space-y-1">
            <button
              onClick={() => setShowPreview((p) => !p)}
              className="flex items-center gap-1.5 text-[10px] font-bold text-violet-400/70 hover:text-violet-400 transition-colors"
            >
              {showPreview ? (
                <EyeOff className="w-3 h-3" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
              {showPreview ? "Hide" : "Preview"} memory
            </button>
            {showPreview && (
              <div className="px-2.5 py-2 rounded-xl bg-violet-500/5 border border-violet-500/15 max-h-24 overflow-y-auto">
                <pre className="text-[10px] text-foreground/70 whitespace-pre-wrap leading-relaxed font-mono">
                  {memoryPreview.length > 400
                    ? memoryPreview.slice(0, 400) + "…"
                    : memoryPreview}
                </pre>
              </div>
            )}
            {lastUpdated && (
              <span className="text-[9px] text-muted-foreground/40">
                Updated {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
        )}

        {/* Expanded config */}
        {expanded && (
          <div className="space-y-2 pt-1 border-t border-violet-500/10">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-violet-400/50 uppercase tracking-widest">
                Memory Key
              </label>
              <input
                value={memoryKey}
                onChange={(e) =>
                  (data.onMemoryKeyChange as Function)?.(e.target.value)
                }
                placeholder="e.g. customer_facts"
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono bg-background/40 border border-violet-500/20 text-foreground placeholder:text-muted-foreground/40 focus:border-violet-400/50 focus:outline-none"
              />
              <p className="text-[9px] text-muted-foreground/40 leading-relaxed">
                Shared across all runs of this workflow. Isolated per user.
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-violet-400/50 uppercase tracking-widest">
                Operation
              </label>
              <select
                value={operation}
                onChange={(e) =>
                  (data.onOperationChange as Function)?.(e.target.value)
                }
                className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-background/40 border border-violet-500/20 text-foreground focus:border-violet-400/50 focus:outline-none"
              >
                {MEMORY_OPS.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Handles */}
      {canRead && (
        <Handle
          type="source"
          position={Position.Left}
          id="memory-context-out"
          className="!w-3 !h-3 !border-2 !border-blue-400 !bg-blue-900"
          style={{ top: "35%" }}
          title="Memory context (read)"
        />
      )}
      <Handle
        type="target"
        position={Position.Left}
        id="memory-in"
        className="!w-3 !h-3 !border-2 !border-violet-400 !bg-violet-900"
        style={{ top: "65%" }}
        title="Write input to memory"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="memory-pass"
        className="!w-3 !h-3 !border-2 !border-violet-400 !bg-violet-900"
      />

      <style>{`
        @keyframes neural-pulse {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.08); opacity: 0; }
        }
      `}</style>
    </div>
  );
});

MemoryNode.displayName = "MemoryNode";
export default MemoryNode;
