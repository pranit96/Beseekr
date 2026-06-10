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

  return (
    <div
      className={`group relative min-w-[260px] max-w-[320px] rounded-2xl border transition-all duration-300 ${
        selected
          ? "border-primary/60 shadow-lg shadow-primary/20 bg-primary/[0.04]"
          : status === "running"
            ? "border-amber-500/50 shadow-lg shadow-amber-500/15 bg-amber-500/[0.03]"
            : status === "done"
              ? "border-emerald-500/50 bg-emerald-500/[0.03]"
              : status === "error"
                ? "border-red-500/50 bg-red-500/[0.03]"
                : "border-border/40 hover:border-primary/30 bg-card/60"
      } backdrop-blur-xl`}
    >
      {/* Accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl opacity-70"
        style={{
          background: `linear-gradient(90deg, ${color}, transparent)`,
        }}
      />

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-violet-500 !border-2 !border-background !rounded-full !shadow-lg !shadow-violet-500/30"
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/20">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 text-white"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            boxShadow: `0 4px 16px ${color}40`,
          }}
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground truncate tracking-tight">
            {d.agentName || "Agent"}
          </p>
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] text-muted-foreground/60 truncate">
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
        {status === "running" && (
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        )}
        {status === "done" && (
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
        )}
        {status === "error" && (
          <div className="w-2 h-2 rounded-full bg-red-500" />
        )}
      </div>

      {/* Tools */}
      {d.tools && d.tools.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-1 border-b border-border/10">
          {d.tools.slice(0, 3).map((tool) => (
            <span
              key={tool}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-medium bg-muted/40 border border-border/20 text-muted-foreground/70"
            >
              <Wrench className="w-2 h-2" />
              {tool.replace(/_/g, " ").split(" ")[0]}
            </span>
          ))}
          {d.tools.length > 3 && (
            <span className="text-[9px] text-muted-foreground/50 px-1">
              +{d.tools.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Instruction override — now a textarea for multi-line */}
      <div className="px-4 py-3">
        <textarea
          value={d.instruction || ""}
          onChange={(e) => d.onInstructionChange?.(e.target.value)}
          placeholder="Override instruction (optional)…"
          rows={2}
          className="w-full bg-background/40 border border-border/30 rounded-lg px-3 py-1.5 text-[11px] text-foreground placeholder-muted-foreground/40 outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all resize-none"
        />
      </div>

      {/* Model name */}
      {d.model && (
        <div className="px-4 pb-2.5 -mt-1">
          <p className="text-[9px] text-muted-foreground/30 truncate">
            Model: {d.model}
          </p>
        </div>
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-violet-500 !border-2 !border-background !rounded-full !shadow-lg !shadow-violet-500/30"
      />
    </div>
  );
};

export default memo(AgentNode);
