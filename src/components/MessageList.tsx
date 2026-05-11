// src/components/MessageList.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  RotateCw,
  Check,
  User,
  Bot,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/types/agent";
import { useToast } from "@/hooks/use-toast";
import AgentResponseCard from "./messages/AgentResponseCard";
import MarkdownRenderer from "./messages/MarkdownRenderer";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onRetryMessage?: (messageId: string) => void;
  isCompactMode?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
  onRetryMessage,
  isCompactMode = false,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      toast({
        title: "Copied to clipboard",
        description: "Message content copied successfully",
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleRetry = (messageId: string) => {
    if (onRetryMessage) {
      onRetryMessage(messageId);
      toast({
        title: "Retrying message",
        description: "Resending your request to the agents",
      });
    }
  };

  const formatTimestamp = (date: Date | string) =>
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(date));

  return (
    <div className="space-y-1 pb-6">
      {messages.map((message) => (
        <div key={message.id}>
          {/* ─── User Message ─── */}
          {message.type === "user" && (
            <div className="flex justify-end mb-5 px-2 animate-fade-in">
              <div className="flex flex-col items-end gap-1.5 max-w-[80%] sm:max-w-[70%] md:max-w-[65%]">
                <div
                  className={
                    isCompactMode
                      ? "rounded-2xl px-5 py-3 bg-gradient-to-br from-foreground/10 via-foreground/[0.08] to-transparent border border-white/[0.06] backdrop-blur-sm shadow-lg"
                      : "rounded-2xl rounded-br-lg px-5 py-3.5 bg-primary text-primary-foreground shadow-sm"
                  }
                >
                  <p
                    className={`text-[15px] leading-relaxed whitespace-pre-wrap break-words ${
                      isCompactMode ? "text-foreground font-medium" : ""
                    }`}
                  >
                    {message.content}
                  </p>
                </div>
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[11px] text-muted-foreground/70">
                    {formatTimestamp(message.timestamp)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-muted/50 transition-opacity"
                    onClick={() => handleCopy(message.content, message.id)}
                  >
                    {copiedId === message.id ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Unified Agent Trace & Synthesis (New Architecture) ─── */}
          {message.type === "agent" &&
            message.agentTraces &&
            message.agentTraces.length > 0 && (
              <div className="mb-6 px-2 animate-fade-in flex flex-col gap-3 max-w-[90%] sm:max-w-[85%] md:max-w-[80%]">
                {/* Agent Progress Trace */}
                {/* Agent Progress Trace - Conditional render based on compactMode */}
                {isCompactMode ? (
                  /* Minimal Micro-Trace for New UI */
                  message.workflowStatus !== "completed" && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative overflow-hidden inline-flex items-center gap-3 py-2 px-4 self-start rounded-full bg-white/[0.02] border border-white/[0.06] backdrop-blur-md shadow-lg"
                    >
                      {/* Smooth persistent running shimmer beam behind text */}
                      <motion.div
                        className="absolute inset-0 w-[100px] h-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -skew-x-[30deg]"
                        animate={{ x: ["-150%", "400%"] }}
                        transition={{
                          repeat: Infinity,
                          duration: 2.5,
                          ease: "easeInOut",
                          repeatDelay: 1,
                        }}
                      />

                      {/* High-End Aesthetic Technical Orbital Loader */}
                      <div className="relative flex items-center justify-center w-3 h-3 flex-shrink-0 z-10">
                        <motion.div
                          className="absolute inset-0 border border-primary/20 rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        <motion.div
                          className="absolute inset-0 border-t-[1.5px] border-primary/70 rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                        <motion.div
                          className="w-1 h-1 bg-primary rounded-full shadow-[0_0_6px_var(--primary)]"
                          animate={{
                            opacity: [0.5, 1, 0.5],
                            scale: [0.8, 1.1, 0.8],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      </div>

                      <span className="relative z-10 text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                        {message.workflowStatus === "synthesizing" ? (
                          <>Synthesizing intelligence...</>
                        ) : (
                          <>
                            Processing with{" "}
                            <span className="text-foreground font-bold">
                              {message.agentTraces?.find(
                                (t) => t.status === "running",
                              )?.agentName || "Agents"}
                            </span>
                          </>
                        )}
                      </span>
                    </motion.div>
                  )
                ) : (
                  /* Classic Fully Expanded Execution Trace */
                  <div className="flex flex-col gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md shadow-xl shadow-black/10 group">
                    <div className="flex items-center gap-2 font-bold text-[11px] tracking-widest uppercase text-primary/80 pb-2 border-b border-white/[0.03]">
                      <Sparkles className="w-3 h-3" />
                      Execution Trace
                    </div>

                    <div className="flex flex-col gap-2.5 pl-1 mt-1">
                      {message.agentTraces.map((trace, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 text-[13px]"
                        >
                          <div className="relative flex items-center justify-center w-4">
                            {trace.status === "pending" ? (
                              <div className="w-2 h-2 rounded-full bg-white/10" />
                            ) : trace.status === "running" ? (
                              <div className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                              </div>
                            ) : trace.status === "success" ? (
                              <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-destructive/20 flex items-center justify-center border border-destructive/30">
                                <X className="w-2.5 h-2.5 text-destructive-foreground" />
                              </div>
                            )}
                            {/* Vertical line connecting traces */}
                            {idx < message.agentTraces!.length - 1 && (
                              <div className="absolute top-4 bottom-[-10px] left-1/2 w-px bg-white/[0.04] -translate-x-1/2" />
                            )}
                          </div>
                          <span
                            className={
                              trace.status === "running" ||
                              trace.status === "success"
                                ? "text-foreground/90 font-semibold"
                                : trace.status === "error"
                                  ? "text-destructive/80"
                                  : "text-muted-foreground/60"
                            }
                          >
                            {trace.agentName}
                          </span>
                          <span className="text-muted-foreground/50 text-xs font-light">
                            {trace.status === "running"
                              ? "working..."
                              : trace.status === "success"
                                ? `Done (${trace.tokens || 0} t)`
                                : trace.error
                                  ? "failed"
                                  : "queued"}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Synthesizer Indicator */}
                    {message.workflowStatus === "synthesizing" && (
                      <div className="flex items-center gap-3 text-[13px] pt-2 mt-1 border-t border-white/[0.03]">
                        <div className="w-4 flex justify-center">
                          <Loader2 className="w-3 h-3 animate-spin text-primary" />
                        </div>
                        <span className="text-foreground font-semibold animate-pulse">
                          Synthesizing intelligence...
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Synthesized Output */}
                {(message.content || message.workflowStatus === "completed") &&
                  (isCompactMode ? (
                    <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      {/* Themed Brand Avatar Indicator from user photo */}
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 text-primary mt-1 shadow-lg shadow-primary/5">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="flex-1 rounded-2xl border border-border/30 bg-muted/10 backdrop-blur-sm px-5 py-4 text-[15px] leading-relaxed shadow-sm group/res">
                        <MarkdownRenderer
                          content={message.content || ""}
                          className="leading-relaxed prose-invert prose-p:leading-relaxed prose-pre:bg-zinc-900/50"
                        />

                        {/* Retry button for last message */}
                        {onRetryMessage &&
                          message.workflowStatus === "completed" && (
                            <div className="mt-4 pt-3 border-t border-border/40 flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                                onClick={() => handleRetry(message.id)}
                                disabled={isLoading}
                              >
                                <RotateCw className="w-3 h-3" />
                                Retry
                              </Button>
                            </div>
                          )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border/50 bg-background shadow-sm p-4 text-sm mt-2">
                      <MarkdownRenderer
                        content={message.content || ""}
                        className="leading-relaxed"
                      />
                      {/* Retry button for last message */}
                      {onRetryMessage &&
                        message.workflowStatus === "completed" && (
                          <div className="mt-4 pt-3 border-t border-border/40 flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                              onClick={() => handleRetry(message.id)}
                              disabled={isLoading}
                            >
                              <RotateCw className="w-3 h-3" />
                              Retry
                            </Button>
                          </div>
                        )}
                    </div>
                  ))}
              </div>
            )}

          {/* ─── Legacy Agent Responses ─── */}
          {message.type === "agent" &&
            message.agentResponses &&
            message.agentResponses.length > 0 &&
            (!message.agentTraces || message.agentTraces.length === 0) && (
              <div className="mb-6 px-2 animate-fade-in">
                {/* Parallel mode: side-by-side grid */}
                {message.executionMode === "parallel" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {message.agentResponses.map((response, idx) => (
                      <AgentResponseCard
                        key={`${message.id}-agent-${idx}`}
                        response={response as any}
                        index={idx}
                        isCompactMode={isCompactMode}
                      />
                    ))}
                  </div>
                ) : (
                  /* Sequential mode: stacked full-width */
                  <div className="flex flex-col gap-4 max-w-[90%] sm:max-w-[85%] md:max-w-[80%]">
                    {message.agentResponses.map((response, idx) => (
                      <AgentResponseCard
                        key={`${message.id}-agent-${idx}`}
                        response={response as any}
                        index={idx}
                        isCompactMode={isCompactMode}
                      />
                    ))}
                  </div>
                )}

                {/* Per-agent execution summary */}
                {(!message.agentTraces || message.agentTraces.length === 0) &&
                  message.perAgentSummary &&
                  message.perAgentSummary.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.perAgentSummary.map((summary) => (
                        <div
                          key={summary.agent_id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 border border-border/40 text-[11px] text-muted-foreground"
                        >
                          <span className="font-medium text-foreground/80">
                            {summary.agent_name}
                          </span>
                          <span>·</span>
                          <span>{summary.tokens_used} tokens</span>
                          <span>·</span>
                          <span>
                            {(summary.execution_time_ms / 1000).toFixed(1)}s
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                {/* Retry button for last message */}
                {onRetryMessage &&
                  message.agentResponses.every(
                    (r) => r.status !== "pending",
                  ) && (
                    <div className="mt-2 ml-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                        onClick={() => handleRetry(message.id)}
                        disabled={isLoading}
                      >
                        <RotateCw className="w-3 h-3" />
                        Retry
                      </Button>
                    </div>
                  )}
              </div>
            )}
        </div>
      ))}
    </div>
  );
};

export default MessageList;
