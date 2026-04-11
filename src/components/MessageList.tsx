// src/components/MessageList.tsx
import React, { useState } from "react";
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
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
  onRetryMessage,
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
                <div className="rounded-2xl rounded-br-lg px-5 py-3.5 bg-primary text-primary-foreground shadow-sm">
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
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
                <div className="flex flex-col gap-2 p-3 rounded-lg border border-border/40 bg-muted/30">
                  <div className="flex items-center gap-1.5 font-medium text-[13px] text-foreground/80 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Agent Workflow
                  </div>

                  {message.agentTraces.map((trace, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      {trace.status === "pending" ? (
                        <div className="w-1.5 h-1.5 ml-1 rounded-full bg-muted-foreground/30" />
                      ) : trace.status === "running" ? (
                        <Loader2 className="w-3 h-3 animate-spin text-primary ml-0.5" />
                      ) : trace.status === "success" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-destructive" />
                      )}
                      <span
                        className={
                          trace.status === "running" ||
                          trace.status === "success"
                            ? "text-foreground font-medium"
                            : trace.status === "error"
                              ? "text-destructive"
                              : "text-muted-foreground"
                        }
                      >
                        {trace.agentName}
                      </span>
                      <span className="text-muted-foreground/70">
                        {trace.status === "running"
                          ? "is processing..."
                          : trace.status === "success"
                            ? `completed (${trace.tokens || 0} tokens)`
                            : trace.error
                              ? `failed: ${trace.error}`
                              : "waiting..."}
                      </span>
                    </div>
                  ))}

                  {/* Synthesizer Indicator */}
                  {message.workflowStatus === "synthesizing" && (
                    <div className="flex items-center gap-2 text-xs mt-1 pt-2 border-t border-border/40">
                      <Loader2 className="w-3 h-3 animate-spin text-primary ml-0.5" />
                      <span className="text-foreground font-medium">
                        Synthesizing final response...
                      </span>
                    </div>
                  )}
                </div>

                {/* Synthesized Output */}
                {(message.content ||
                  message.workflowStatus === "completed") && (
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
                )}
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
