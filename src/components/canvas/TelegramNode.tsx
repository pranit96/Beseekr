import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Send, Key, MessageSquare } from "lucide-react";

interface TelegramNodeData {
  label?: string;
  botToken?: string;
  onBotTokenChange?: (val: string) => void;
  chatId?: string;
  onChatIdChange?: (val: string) => void;
  messageTemplate?: string;
  onMessageTemplateChange?: (val: string) => void;
  [key: string]: unknown;
}

const TelegramNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as TelegramNodeData;

  return (
    <div
      className={`group relative min-w-[260px] max-w-[320px] rounded-2xl border transition-all duration-300 ${
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
            background: "linear-gradient(135deg, #0088cc, #006699)",
            boxShadow: "0 4px 16px rgba(0, 136, 204, 0.3)",
          }}
        >
          <Send className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground tracking-tight">
            {d.label || "Telegram Notification"}
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            Sends message to custom Telegram bot
          </p>
        </div>
      </div>

      {/* Body / Configuration */}
      <div className="px-4 py-3 flex flex-col gap-2.5">
        <div>
          <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
            <Key className="w-2.5 h-2.5 inline mr-0.5 -mt-0.5" />
            Bot Token (Bot ID)
          </label>
          <input
            type="password"
            value={d.botToken || ""}
            onChange={(e) => d.onBotTokenChange?.(e.target.value)}
            placeholder="e.g. 5827394872:AAEl..."
            className="w-full bg-background/40 border border-border/30 rounded-lg px-2.5 py-1 text-[10px] text-foreground font-mono placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all"
          />
        </div>

        <div>
          <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
            <MessageSquare className="w-2.5 h-2.5 inline mr-0.5 -mt-0.5" />
            Chat ID
          </label>
          <input
            type="text"
            value={d.chatId || ""}
            onChange={(e) => d.onChatIdChange?.(e.target.value)}
            placeholder="e.g. 123456789 or @channel"
            className="w-full bg-background/40 border border-border/30 rounded-lg px-2.5 py-1 text-[10px] text-foreground font-mono placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all"
          />
        </div>

        <div>
          <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
            Message Template (optional)
          </label>
          <textarea
            value={d.messageTemplate || ""}
            onChange={(e) => d.onMessageTemplateChange?.(e.target.value)}
            placeholder="Default: Parent output. Use {{input}} as placeholder."
            rows={2}
            className="w-full bg-background/40 border border-border/30 rounded-lg px-2.5 py-1.5 text-[10px] text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all resize-none font-sans"
          />
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-sky-500 !border-2 !border-background !rounded-full !shadow-lg !shadow-sky-500/30"
      />
    </div>
  );
};

export default memo(TelegramNode);
