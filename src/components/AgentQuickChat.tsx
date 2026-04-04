// src/components/AgentQuickChat.tsx
// Inline quick-chat drawer for testing/chatting with a single agent from the Agents page
import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Loader2, WifiOff, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import MarkdownRenderer from "@/components/messages/MarkdownRenderer";
import { useAuth } from "@/contexts/AuthContext";
import useOrchestration from "@/hooks/use-orchestration";
import { Agent } from "@/types/agent";
import { cn } from "@/lib/utils";
import { createLogger } from "@/services/logging";

const logger = createLogger("AgentQuickChat");

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "pending" | "streaming" | "success" | "error";
  timestamp: Date;
}

interface AgentQuickChatProps {
  agent: Agent;
  open: boolean;
  onClose: () => void;
}

export const AgentQuickChat: React.FC<AgentQuickChatProps> = ({
  agent,
  open,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cancelRef = useRef<null | (() => void)>(null);

  const { socketConnected } = useAuth();
  const { execute, ensureConnected } = useOrchestration();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus textarea when opened
  useEffect(() => {
    if (open && !isExecuting) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [open, isExecuting]);

  // Elapsed time counter
  useEffect(() => {
    if (isExecuting) {
      setElapsedTime(0);
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isExecuting]);

  // Reset state when agent changes
  useEffect(() => {
    setMessages([]);
    setInput("");
    setIsExecuting(false);
    setElapsedTime(0);
  }, [agent.id]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isExecuting || !socketConnected) return;

    const messageText = input.trim();
    setInput("");

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: messageText,
      status: "success",
      timestamp: new Date(),
    };

    const assistantMsgId = `msg-${Date.now()}-assistant`;
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      status: "pending",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsExecuting(true);

    try {
      ensureConnected();

      await execute(
        {
          agent_ids: [agent.id],
          message: messageText,
          mode: "sequential",
          save_to_conversation: false,
        },
        {
          onToken: (_agentId: string, token: string) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: m.content + token, status: "streaming" }
                  : m,
              ),
            );
          },
          onAgentDone: () => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, status: "success" } : m,
              ),
            );
          },
          onAgentError: (_agentId: string, error: any) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: String(error || "Error generating response"),
                      status: "error",
                    }
                  : m,
              ),
            );
          },
          onDone: () => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId && m.status === "pending"
                  ? { ...m, status: "success" }
                  : m,
              ),
            );
          },
          onError: (err: any) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: err?.error || "Request failed",
                      status: "error",
                    }
                  : m,
              ),
            );
          },
          onCancelReady: (cancelFn: () => void) => {
            cancelRef.current = cancelFn;
          },
        },
      );
    } catch (err: any) {
      logger.error("Quick chat error", { error: err.message });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: err?.message || "Failed to send message",
                status: "error",
              }
            : m,
        ),
      );
    } finally {
      setIsExecuting(false);
      cancelRef.current = null;
    }
  }, [input, isExecuting, socketConnected, agent.id, execute, ensureConnected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-md">
              {agent.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{agent.name}</h3>
              <p className="text-xs text-muted-foreground">
                {agent.domain || "General"} · Quick Chat
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!socketConnected && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-destructive/10 text-destructive text-xs">
                <WifiOff className="w-3 h-3" />
                Offline
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">
                  Chat with {agent.name}
                </h4>
                <p className="text-xs text-muted-foreground max-w-[280px]">
                  Send a message to test this agent. Messages are not saved to
                  history.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-4 py-3",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 border border-border/50",
                )}
              >
                {msg.role === "assistant" &&
                msg.status === "pending" &&
                !msg.content ? (
                  // Thinking indicator
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex gap-1">
                      <span
                        className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground ml-1">
                      Thinking... {elapsedTime > 0 && `${elapsedTime}s`}
                    </span>
                  </div>
                ) : msg.role === "assistant" && msg.status === "error" ? (
                  <p className="text-sm text-destructive">{msg.content}</p>
                ) : msg.role === "assistant" ? (
                  <div className="text-sm relative">
                    <MarkdownRenderer
                      content={msg.content}
                      className="leading-relaxed"
                      showToc={false}
                      enableCopy={msg.status === "success"}
                      maxHeight="none"
                    />
                    {msg.status === "streaming" && (
                      <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary rounded-sm animate-pulse align-text-bottom" />
                    )}
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border/60 bg-background/95">
          <div className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border/50 focus-within:border-primary transition px-3 py-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Message ${agent.name}...`}
              className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[36px] max-h-[120px] text-sm"
              disabled={isExecuting || !socketConnected}
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isExecuting || !socketConnected}
              size="icon"
              className="h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 transition flex-shrink-0"
            >
              {isExecuting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          {isExecuting && (
            <div className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Processing with{" "}
              <span className="text-primary font-medium">{agent.name}</span>
              {elapsedTime > 0 && (
                <span className="text-muted-foreground/60">
                  · {elapsedTime}s
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentQuickChat;
