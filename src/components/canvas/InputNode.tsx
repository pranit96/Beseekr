import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { MessageSquareText } from "lucide-react";

interface InputNodeData {
  label?: string;
  inputText?: string;
  onInputChange?: (text: string) => void;
  [key: string]: unknown;
}

const InputNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as InputNodeData;
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
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground tracking-tight">
            {d.label || "Input"}
          </p>
          <p className="text-[10px] text-muted-foreground/60">User prompt</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <textarea
          value={d.inputText || ""}
          onChange={(e) => d.onInputChange?.(e.target.value)}
          placeholder="Type your prompt here…"
          rows={3}
          className="w-full bg-background/40 border border-border/30 rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted-foreground/50 resize-none outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
        />
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
