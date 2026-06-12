import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Sparkles, Wrench } from "lucide-react";

interface AgentNodeData {
  agentId?: string;
  agentName?: string;
  agentDomain?: string;
  agentColor?: string;
  provider?: string;
  model?: string;
  tools?: string[];
  instruction?: string;
  onInstructionChange?: (text: string) => void;
  status?: "idle" | "running" | "done" | "error";
  [key: string]: unknown;
}

const PROVIDER_LABELS: Record<string, { label: string; color: string }> = {
  openai: { label: "OpenAI", color: "hsl(160,60%,45%)" },
  groq: { label: "Groq", color: "hsl(25,80%,55%)" },
  anthropic: { label: "Anthropic", color: "hsl(30,70%,55%)" },
};

const AgentNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as AgentNodeData;
  const color = d.agentColor || "hsl(258, 70%, 60%)";
  const initial = (d.agentName || "A").charAt(0).toUpperCase();
  const status = d.status || "idle";
  const provider = d.provider || "";
  const providerInfo = PROVIDER_LABELS[provider.toLowerCase()] || null;

  const cardClass = [
    "canvas-node-card group relative min-w-[260px] max-w-[320px]",
    selected && "canvas-node-card-selected",
    status === "running" && "canvas-node-card-running",
    status === "done" && "canvas-node-card-done",
    status === "error" && "canvas-node-card-error",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass}>
      {/* Accent strip */}
      <div
        className="canvas-node-accent"
        style={{
          background: `linear-gradient(90deg, ${color}, transparent)`,
        }}
      />

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="canvas-handle !bg-violet-500"
        style={{ "--handle-color": "hsla(250, 60%, 55%, 0.5)" } as React.CSSProperties}
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 text-white relative"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            boxShadow: `0 4px 16px ${color}40`,
          }}
        >
          {initial}
          {/* Status ring around avatar */}
          {status === "running" && (
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[hsla(230,15%,10%,1)]">
              <div className="canvas-status-ring canvas-status-ring-running w-full h-full" />
            </div>
          )}
          {status === "done" && (
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[hsla(230,15%,10%,1)]">
              <div className="canvas-status-ring canvas-status-ring-done w-full h-full" />
            </div>
          )}
          {status === "error" && (
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[hsla(230,15%,10%,1)]">
              <div className="canvas-status-ring canvas-status-ring-error w-full h-full" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white/90 truncate tracking-tight">
            {d.agentName || "Agent"}
          </p>
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] text-white/35 truncate">
              {d.agentDomain || "General"}
            </p>
            {providerInfo && (
              <span
                className="text-[8px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                style={{
                  backgroundColor: `${providerInfo.color}15`,
                  color: providerInfo.color,
                }}
              >
                {providerInfo.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tools */}
      {d.tools && d.tools.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-1 border-b border-white/5">
          {d.tools.slice(0, 3).map((tool) => (
            <span
              key={tool}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-medium bg-white/[0.04] border border-white/8 text-white/40"
            >
              <Wrench className="w-2 h-2" />
              {tool.replace(/_/g, " ").split(" ")[0]}
            </span>
          ))}
          {d.tools.length > 3 && (
            <span className="text-[9px] text-white/25 px-1">
              +{d.tools.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Instruction override */}
      <div className="px-4 py-3">
        <textarea
          value={d.instruction || ""}
          onChange={(e) => d.onInstructionChange?.(e.target.value)}
          placeholder="Override instruction (optional)…"
          rows={2}
          className="w-full bg-white/[0.03] border border-white/8 rounded-lg px-3 py-1.5 text-[11px] text-white/80 placeholder-white/20 outline-none focus:ring-1 focus:ring-violet-500/30 focus:border-violet-500/30 transition-all resize-none"
        />
      </div>

      {/* Model name */}
      {d.model && (
        <div className="px-4 pb-2.5 -mt-1">
          <p className="text-[9px] text-white/15 truncate">
            Model: {d.model}
          </p>
        </div>
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="canvas-handle !bg-violet-500"
        style={{ "--handle-color": "hsla(250, 60%, 55%, 0.5)" } as React.CSSProperties}
      />
    </div>
  );
};

export default memo(AgentNode);
