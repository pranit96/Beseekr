import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Mail } from "lucide-react";

interface EmailNodeData {
  label?: string;
  emailTo?: string;
  onEmailToChange?: (val: string) => void;
  emailSubject?: string;
  onEmailSubjectChange?: (val: string) => void;
  emailTemplate?: string;
  onEmailTemplateChange?: (val: string) => void;
  [key: string]: unknown;
}

const EmailNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as EmailNodeData;

  return (
    <div
      className={`group relative min-w-[260px] max-w-[320px] rounded-2xl border transition-all duration-300 ${
        selected
          ? "border-rose-500/60 shadow-lg shadow-rose-500/20 bg-rose-500/[0.04]"
          : "border-border/40 hover:border-rose-500/30 bg-card/60"
      } backdrop-blur-xl`}
    >
      {/* Input handle (from parent node output) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-rose-500 !border-2 !border-background !rounded-full !shadow-lg !shadow-rose-500/30"
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/20">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background:
              "linear-gradient(135deg, hsl(340,75%,55%), hsl(355,75%,50%))",
            boxShadow: "0 4px 16px hsla(340,65%,55%,0.3)",
          }}
        >
          <Mail className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground tracking-tight">
            {d.label || "Email Delivery"}
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            Auto-converts output to a styled email
          </p>
        </div>
      </div>

      {/* Body / Configuration */}
      <div className="px-4 py-3 flex flex-col gap-2.5">
        <div>
          <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
            Recipient Email
          </label>
          <input
            type="email"
            value={d.emailTo || ""}
            onChange={(e) => d.onEmailToChange?.(e.target.value)}
            placeholder="Default: Your account email"
            className="w-full bg-background/40 border border-border/30 rounded-lg px-2.5 py-1 text-[10px] text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-rose-500/40 focus:border-rose-500/40 transition-all"
          />
        </div>

        <div>
          <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
            Subject
          </label>
          <input
            type="text"
            value={d.emailSubject || ""}
            onChange={(e) => d.onEmailSubjectChange?.(e.target.value)}
            placeholder="e.g. Daily Digest Report"
            className="w-full bg-background/40 border border-border/30 rounded-lg px-2.5 py-1 text-[10px] text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-rose-500/40 focus:border-rose-500/40 transition-all"
          />
        </div>

        <p className="text-[9px] text-muted-foreground/40 italic leading-snug">
          The agent output (markdown, text, etc.) is automatically converted to
          a styled HTML email — no template needed.
        </p>
      </div>

      {/* Output handle — allows chaining email node to downstream nodes */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-rose-500 !border-2 !border-background !rounded-full !shadow-lg !shadow-rose-500/30"
      />
    </div>
  );
};

export default memo(EmailNode);
