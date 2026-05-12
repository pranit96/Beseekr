// src/components/ChatInterface.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Workflow,
  Lock,
  LockOpen,
  X,
  WifiOff,
  Loader2,
  Download,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Plus,
} from "lucide-react";
import { ChatFileUpload } from "@/components/ChatFileUpload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AgentSelector } from "./AgentSelector";
import MessageList from "./MessageList";
import { AutonomousWorkflowInterface } from "./AutonomousWorkflowInterface";
import { WelcomeScreen } from "./WelcomeScreen";
import { ExportChatDialog } from "./ExportChatDialog";
import type {
  ChatMessage,
  ExecutionMode,
  Agent,
  AgentResponse,
} from "@/types/agent";
import { useToast } from "@/hooks/use-toast";
import { useConversation } from "@/hooks/use-conversation";
import useOrchestration from "@/hooks/use-orchestration";
import { useAuth } from "@/contexts/AuthContext";
import { createLogger } from "@/services/logging";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const logger = createLogger("ChatInterface");

function generateConversationTitle(message: string, agents: Agent[]): string {
  const text = message.trim();
  if (!text) return `Chat with ${agents.map((a) => a.name).join(", ")}`;
  let clean = text
    .replace(
      /^(hey|hi|hello|can you|could you|please|I want to|I need to|I'd like to|help me|tell me|show me|explain|write|create|make|generate)\s+/i,
      "",
    )
    .replace(/[.!?,;]+$/, "")
    .trim();
  if (!clean) clean = text;
  const title = clean
    .split(/\s+/)
    .map((w, i) => {
      if (
        i > 0 &&
        [
          "a",
          "an",
          "the",
          "in",
          "on",
          "at",
          "to",
          "for",
          "of",
          "and",
          "or",
          "but",
          "is",
          "with",
        ].includes(w.toLowerCase())
      )
        return w.toLowerCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
  if (title.length <= 50) return title;
  const truncated = title.substring(0, 50);
  const lastSpace = truncated.lastIndexOf(" ");
  return (
    (lastSpace > 20 ? truncated.substring(0, lastSpace) : truncated) + "..."
  );
}

// ──────────────────────────────── Top Loading Bar ─────────────────────────────
const TopBar = ({ active }: { active: boolean }) => (
  <div
    className={`top-progress-bar ${active ? "top-progress-bar-active" : ""}`}
    aria-hidden
  />
);

// ──────────────────────────────── Agent Loading Indicator (in-chat) ─────────
const AgentLoadingCard = ({
  step,
  total,
  agentName,
  agentNames,
  isCompactMode = false,
}: {
  step?: number;
  total?: number;
  agentName?: string;
  agentNames: string[];
  isCompactMode?: boolean;
}) => {
  const label = agentName || agentNames[0] || "Agent";
  const pct = step && total ? Math.round((step / total) * 100) : null;

  return (
    <div
      className={`mb-6 px-2 animate-in fade-in duration-700 ${isCompactMode ? "flex items-start gap-3" : ""}`}
    >
      {isCompactMode && (
        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 text-primary mt-1 shadow-lg shadow-primary/5 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        </div>
      )}

      <div
        className={cn(
          "relative overflow-hidden transition-all duration-500 ease-in-out",
          isCompactMode
            ? "flex-1 rounded-2xl border border-primary/20 bg-primary/[0.02] backdrop-blur-sm px-5 py-4 shadow-sm"
            : "w-full rounded-xl border border-border/50 bg-muted/10 p-4",
        )}
        style={{
          animation: "pulse-subtle 3s ease-in-out infinite",
        }}
      >
        <style>{`
          @keyframes pulse-subtle {
            0%, 100% { border-color: hsl(var(--primary) / 0.2); opacity: 0.9; }
            50% { border-color: hsl(var(--primary) / 0.4); opacity: 1; }
          }
        `}</style>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {!isCompactMode && (
              <Loader2 className="w-4 h-4 animate-spin text-primary/70" />
            )}
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-foreground/90 flex items-center gap-2">
                {label} is working...
              </span>
              {step && total ? (
                <span className="text-[11px] text-muted-foreground/60 font-medium">
                  Phase {step} of {total} completed
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground/60 font-medium">
                  Thinking and synthesizing data...
                </span>
              )}
            </div>
          </div>

          {pct !== null && (
            <span className="text-[11px] font-black tracking-wider text-primary/80">
              {pct}%
            </span>
          )}
        </div>

        {/* High fidelity Progress Track */}
        <div className="mt-3 w-full h-1 bg-muted/50 rounded-full overflow-hidden relative">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"
            style={{
              backgroundSize: "200% 100%",
              animation: "shimmer-slide 1.5s infinite linear",
            }}
          />
          <div
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full shadow-glow"
            style={{
              width: `${pct !== null ? pct : 30}%`,
              animation:
                pct === null
                  ? "indeterminate-slide 2s infinite ease-in-out"
                  : "none",
            }}
          />
        </div>
        <style>{`
          @keyframes indeterminate-slide {
            0% { transform: translateX(-100%) scaleX(0.2); }
            50% { transform: translateX(0%) scaleX(0.5); }
            100% { transform: translateX(100%) scaleX(0.2); }
          }
        `}</style>
      </div>
    </div>
  );
};

export const ChatInterface: React.FC<{
  agents: Agent[];
  activeConversationId?: string;
  onConversationChange?: (conversationId: string | null) => void;
  onConversationCreated?: (conversationId: string) => void;
  isCompactMode?: boolean;
  onChatStartedChange?: (started: boolean) => void;
  onNewSession?: () => void;
  renderHistoryButton?: React.ReactNode;
}> = ({
  agents,
  activeConversationId,
  onConversationChange,
  onConversationCreated,
  isCompactMode = false,
  onChatStartedChange,
  onNewSession,
  renderHistoryButton,
}) => {
  const [input, setInput] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [executionMode, setExecutionMode] =
    useState<ExecutionMode>("sequential");
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [saveToConversation, setSaveToConversation] = useState(true);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [agentsToolbarExpanded, setAgentsToolbarExpanded] = useState(false);
  const [cyclingAgentIndex, setCyclingAgentIndex] = useState(0);

  useEffect(() => {
    // Rotate recommended agent every 4 seconds when not fully expanded
    if (agentsToolbarExpanded) return;
    const cycleTimer = setInterval(() => {
      setCyclingAgentIndex((prev) => prev + 1);
    }, 4000);
    return () => clearInterval(cycleTimer);
  }, [agentsToolbarExpanded]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "connecting"
  >("connecting");
  const [preparingMessage, setPreparingMessage] = useState(false);
  const [orchestrationProgress, setOrchestrationProgress] = useState<{
    step: number;
    total: number;
    agent_name?: string;
  } | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [toolExecutions, setToolExecutions] = useState<
    Array<{
      callId: string;
      toolName: string;
      status: "running" | "success" | "error";
      executionTimeMs?: number;
    }>
  >([]);
  const [attachedFiles, setAttachedFiles] = useState<
    Array<{
      id: string;
      name: string;
      type: string;
      size: number;
      size_readable: string;
      storage_path: string;
      url: string | null;
    }>
  >([]);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);

  const cancelRef = useRef<null | (() => void)>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const retryMessageRef = useRef<string>("");
  const isCreatingConversationRef = useRef(false);
  const rateLimitTimerRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const { socketConnected } = useAuth();
  const queryClient = useQueryClient();

  const {
    messages,
    setMessages,
    conversationId,
    setConversationId,
    loadConversationMessages,
    isLoading: convLoading,
    hasStarted,
    setHasStarted,
    isActiveOrchestrationRef,
    messageCache,
  } = useConversation(activeConversationId);

  const { execute, ensureConnected, getStatus } = useOrchestration();

  useEffect(() => {
    setConnectionStatus(socketConnected ? "connected" : "disconnected");
  }, [socketConnected]);

  useEffect(() => {
    const id = setInterval(() => {
      const s = getStatus();
      setConnectionStatus(
        !socketConnected
          ? "disconnected"
          : s.connected
            ? "connected"
            : "connecting",
      );
    }, 2000);
    return () => clearInterval(id);
  }, [getStatus, socketConnected]);

  useEffect(() => {
    if (!isExecuting && !preparingMessage && textareaRef.current)
      textareaRef.current.focus();
  }, [isExecuting, hasStarted, preparingMessage]);

  // Auto-scroll to bottom whenever messages change or execution state changes
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (isNearBottom || isExecuting || preparingMessage) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      });
    }
  }, [messages, isExecuting, preparingMessage]);

  useEffect(
    () => () => {
      if (rateLimitTimerRef.current)
        window.clearInterval(rateLimitTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!activeConversationId) return;
    if (activeConversationId.startsWith("temp-")) {
      setConversationId(activeConversationId);
      return;
    }
    setConversationId(activeConversationId);
    if (isActiveOrchestrationRef?.current) return;
    loadConversationMessages(activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    onChatStartedChange?.(hasStarted);
  }, [hasStarted, onChatStartedChange]);

  const startRateLimitCountdown = (seconds: number) => {
    const until = Date.now() + seconds * 1000;
    setRateLimitedUntil(until);
    if (rateLimitTimerRef.current)
      window.clearInterval(rateLimitTimerRef.current);
    rateLimitTimerRef.current = window.setInterval(() => {
      if (Date.now() >= until) {
        setRateLimitedUntil(null);
        if (rateLimitTimerRef.current) {
          window.clearInterval(rateLimitTimerRef.current);
          rateLimitTimerRef.current = null;
        }
      }
    }, 500);
  };

  const handleSubmit = async () => {
    const finalAgents = selectedAgents;

    if (!input.trim() && attachedFiles.length === 0) return;
    if (finalAgents.length === 0) {
      toast({
        title: "No agents selected",
        description: "Select at least one agent.",
        variant: "destructive",
      });
      return;
    }
    if (!socketConnected) {
      toast({
        title: "Not connected",
        description: "Waiting for connection…",
        variant: "destructive",
      });
      return;
    }
    if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
      toast({
        title: "Rate limited",
        description: "Please wait before sending.",
        variant: "destructive",
      });
      return;
    }

    const messageText = input;
    setInput("");
    retryMessageRef.current = messageText;
    if (isActiveOrchestrationRef) isActiveOrchestrationRef.current = true;
    setPreparingMessage(true);
    setHasStarted(true);

    let errorHandled = false;

    try {
      let convId = conversationId;
      const isTempConversation = convId?.startsWith("temp-");

      if (isTempConversation && convId) {
        const realId = sessionStorage.getItem(`conv_mapping_${convId}`);
        if (realId) {
          const tempKey = convId; // capture before overwrite
          convId = realId;
          // Pre-seed cache before activating the query key, same reason as the
          // new-conversation path: prevents an immediate empty API fetch.
          if (!queryClient.getQueryData(["messages", convId])) {
            queryClient.setQueryData(["messages", convId], []);
          }
          setConversationId(realId);
          sessionStorage.removeItem(`conv_mapping_${tempKey}`); // remove the temp key, not the real one
          setTimeout(() => {
            onConversationChange?.(realId);
            onConversationCreated?.(realId);
          }, 100);
        }
      }

      if (
        saveToConversation &&
        (!convId || isTempConversation) &&
        !isCreatingConversationRef.current
      ) {
        isCreatingConversationRef.current = true;
        try {
          const { apiClient } = await import("@/lib/api");
          const title = generateConversationTitle(messageText, finalAgents);
          const res = await apiClient.createConversation({
            agent_id: finalAgents[0]?.id || null,
            title,
          });
          if (res.success && res.data?.id) {
            convId = res.data.id;
            // Pre-seed the cache with an empty array BEFORE activating the query.
            // Without this, React Query sees no cached data for the new key and
            // immediately fires an API fetch that returns [] (messages not saved yet),
            // overwriting the in-progress streaming messages.
            queryClient.setQueryData(["messages", convId], []);
            setConversationId(convId);
            setTimeout(() => {
              onConversationChange?.(convId);
              onConversationCreated?.(convId);
              queryClient.invalidateQueries({ queryKey: ["conversations"] });
            }, 200);
          }
        } catch (err) {
          logger.error("Failed to create conversation", { error: err });
        } finally {
          isCreatingConversationRef.current = false;
        }
      }

      await new Promise((r) => setTimeout(r, 50));

      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        type: "user",
        content: messageText,
        timestamp: new Date(),
        isFromCache: false,
      };
      const agentMessageId = `msg-${Date.now()}-agents`;
      const agentMessage: ChatMessage = {
        id: agentMessageId,
        type: "agent",
        content: "",
        timestamp: new Date(),
        agentResponses: [],
        agentTraces: finalAgents.map((a) => ({
          agentId: a.id,
          agentName: a.name,
          domain: a.domain,
          status: "pending",
        })),
        executionMode,
        markdownOutput: "",
        finalOutput: "",
        workflowStatus: "executing",
        isFromCache: false,
      };

      // Ensure hasStarted is true before injecting messages into the cache.
      // This closes the window between setConversationId and setMessages where
      // a stale effect could reset hasStarted to false and blank the screen.
      setHasStarted(true);
      setMessages((prev) => [...prev, userMessage, agentMessage]);
      setPreparingMessage(false);
      setIsExecuting(true);
      setIsLoadingLocal(true);

      await new Promise((r) => setTimeout(r, 100));

      const payload: any = {
        agent_ids: finalAgents.map((a) => a.id),
        message: messageText,
        mode: executionMode,
        save_to_conversation: saveToConversation,
      };
      if (saveToConversation && convId) payload.conversation_id = convId;
      if (attachedFiles.length > 0) {
        payload.attached_files = attachedFiles.map((f) => ({
          name: f.name,
          type: f.type,
          size: f.size,
          storage_path: f.storage_path,
          url: f.url,
          extracted_content: (f as any).extracted_content || null,
          word_count: (f as any).word_count || 0,
        }));
      }

      ensureConnected();
      cancelRef.current = null;

      await execute(payload, {
        onAck: () => {},
        onAgentToken: (agentId, token) => {
          if (finalAgents.length === 1) {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== agentMessageId) return m;
                return {
                  ...m,
                  content: (m.content || "") + token,
                  workflowStatus: "executing",
                } as ChatMessage;
              }),
            );
          }
        },
        onToken: (agentId, token) => {
          if (agentId === "synthesis") {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== agentMessageId) return m;
                // Ignore the huge synthesis token for single agents, since we streamed it via onAgentToken
                if (finalAgents.length === 1) return m;
                return {
                  ...m,
                  content: (m.content || "") + token,
                  workflowStatus: "synthesizing",
                } as ChatMessage;
              }),
            );
          }
        },
        onAgentStart: (agentId, agentName) => {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== agentMessageId) return m;
              return {
                ...m,
                agentTraces:
                  m.agentTraces?.map((at) =>
                    at.agentId === agentId ? { ...at, status: "running" } : at,
                  ) || [],
              } as ChatMessage;
            }),
          );
        },
        onAgentDone: (agentId, usage) =>
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== agentMessageId) return m;
              return {
                ...m,
                agentTraces:
                  m.agentTraces?.map((at) =>
                    at.agentId === agentId
                      ? {
                          ...at,
                          status: "success",
                          tokens: usage?.total_tokens || 0,
                        }
                      : at,
                  ) || [],
              } as ChatMessage;
            }),
          ),
        onAgentError: (agentId, errorMsg) =>
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== agentMessageId) return m;
              return {
                ...m,
                agentTraces:
                  m.agentTraces?.map((at) =>
                    at.agentId === agentId
                      ? {
                          ...at,
                          status: "error",
                          error: String(errorMsg || "Error"),
                        }
                      : at,
                  ) || [],
              } as ChatMessage;
            }),
          ),
        onWarning: () => {},
        onRateLimit: (rl) => {
          const r = Number(rl?.retryAfter ?? 30);
          toast({ title: "Rate limit", description: `Retry in ${r}s.` });
          startRateLimitCountdown(r);
        },
        onCancelReady: (fn) => {
          cancelRef.current = fn;
        },
        onProgress: (p) =>
          setOrchestrationProgress({
            step: p.step,
            total: p.total,
            agent_name: p.agent_name,
          }),
        onCancelled: () => {
          setOrchestrationProgress(null);
          setToolExecutions([]);
        },
        onToolStart: (d) =>
          setToolExecutions((prev) => [
            ...prev,
            { callId: d.call_id, toolName: d.tool_name, status: "running" },
          ]),
        onToolResult: (d) =>
          setToolExecutions((prev) =>
            prev.map((te) =>
              te.callId === d.call_id
                ? {
                    ...te,
                    status: d.success ? "success" : "error",
                    executionTimeMs: d.execution_time_ms,
                  }
                : te,
            ),
          ),
        onDone: (doneData) => {
          setOrchestrationProgress(null);
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== agentMessageId) return m;
              return {
                ...m,
                workflowStatus: "completed",
                agentTraces: m.agentTraces?.map((at) =>
                  at.status === "pending" || at.status === "running"
                    ? { ...at, status: "success" }
                    : at,
                ),
                markdownOutput: doneData.final_markdown || m.markdownOutput,
                finalOutput: doneData.final_markdown || m.finalOutput,
                content:
                  doneData.final_markdown || m.content || "Response completed.",
                perAgentSummary: doneData.per_agent_summary || undefined,
              } as ChatMessage;
            }),
          );
          // Force scroll to reveal content after completion
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "end",
            });
          }, 100);
          // Mark hasStarted so the welcome screen never re-appears after a response
          setHasStarted(true);
        },
        onError: (err) => {
          errorHandled = true;
          if (err?.error?.includes("rate") || err?.error?.includes("Too many"))
            return;
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== agentMessageId) return m;
              return {
                ...m,
                workflowStatus: "error",
                agentTraces:
                  m.agentTraces?.map((at) =>
                    at.status === "pending" || at.status === "running"
                      ? {
                          ...at,
                          status: "error",
                          error: err?.error || "Failed",
                        }
                      : at,
                  ) || [],
              } as ChatMessage;
            }),
          );
          toast({
            title: "Execution failed",
            description: err?.error || "Please try again.",
            variant: "destructive",
          });
        },
      });
    } catch (err: any) {
      setPreparingMessage(false);
      if (
        !errorHandled &&
        !err?.message?.includes("rate") &&
        !err?.message?.includes("Too many")
      ) {
        toast({
          title: "Error",
          description: err?.message || "Failed to execute agents.",
          variant: "destructive",
        });
      }
    } finally {
      setIsExecuting(false);
      setIsLoadingLocal(false);
      setPreparingMessage(false);
      setOrchestrationProgress(null);
      setToolExecutions([]);
      setAttachedFiles([]);
      cancelRef.current = null;
      if (isActiveOrchestrationRef) isActiveOrchestrationRef.current = false;
    }
  };

  const handleCancelExecution = () => {
    if (!cancelRef.current) return;
    setIsCancelling(true);
    try {
      cancelRef.current();
      setMessages((prev) =>
        prev.map((m) => {
          if (m.type === "agent" && m.agentResponses) {
            return {
              ...m,
              agentResponses: m.agentResponses.map((ar) =>
                ar.status === "pending"
                  ? {
                      ...ar,
                      status: "error",
                      content: ar.content
                        ? `${ar.content}\n\n*[Cancelled]*`
                        : "Cancelled by user",
                    }
                  : ar,
              ),
            } as ChatMessage;
          }
          return m;
        }),
      );
    } catch (e) {
      logger.error("Cancel error", { error: e });
    }
    setTimeout(() => {
      cancelRef.current = null;
      setIsExecuting(false);
      setIsLoadingLocal(false);
      setPreparingMessage(false);
      setIsCancelling(false);
      if (isActiveOrchestrationRef) isActiveOrchestrationRef.current = false;
    }, 300);
  };

  const handleRetryMessage = useCallback(
    async (messageId: string) => {
      const idx = messages.findIndex((m) => m.id === messageId);
      if (idx > 0 && messages[idx - 1].type === "user") {
        const prev = messages[idx - 1];
        const failed = messages[idx];
        const agentsToRetry =
          (failed.agentResponses
            ?.map((ar) => selectedAgents.find((a) => a.id === ar.agentId))
            .filter(Boolean) as Agent[]) || selectedAgents;
        if (!agentsToRetry.length) {
          toast({
            title: "Cannot retry",
            description: "No agents available.",
            variant: "destructive",
          });
          return;
        }
        setInput(prev.content);
        setSelectedAgents(agentsToRetry);
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
    },
    [messages, selectedAgents],
  );

  const togglePrivateChat = () => {
    const newSave = !saveToConversation;
    setSaveToConversation(newSave);
    if (!newSave) {
      setConversationId(null);
      setMessages([]);
      setHasStarted(false);
      onConversationChange?.(null);
    } else {
      setConversationId(null);
    }
  };

  const sendDisabled =
    isLoadingLocal ||
    isExecuting ||
    isCancelling ||
    preparingMessage ||
    (!!rateLimitedUntil && Date.now() < rateLimitedUntil) ||
    !socketConnected;
  const isActive = isExecuting || preparingMessage;

  // ── Inline status line — only system-level states, not execution progress ───
  let statusLineNode = null;
  if (connectionStatus === "disconnected") {
    statusLineNode = (
      <div className="status-line status-line-error">
        <WifiOff className="w-3 h-3" />
        <span>Reconnecting…</span>
      </div>
    );
  } else if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
    statusLineNode = (
      <div className="status-line status-line-warn">
        Rate limited — wait {Math.ceil((rateLimitedUntil - Date.now()) / 1000)}s
      </div>
    );
  } else if (isCancelling) {
    statusLineNode = (
      <div className="status-line">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Cancelling…</span>
      </div>
    );
  }

  // ── Bottom input ─────────────────────────────────────────────────────────────
  const inputAreaNode = (
    <div className="input-area-root">
      {/* Agent selector & toolbar row - hidden in compact mode as it lives at top */}
      {!isCompactMode && (
        <div className="input-toolbar flex-wrap md:flex-nowrap">
          <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
            <AgentSelector
              agents={agents}
              selectedAgents={selectedAgents}
              onAgentsChange={setSelectedAgents}
            />
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Execution Mode Toggle */}
            <div className="flex bg-muted/50 p-0.5 rounded-lg border border-border/50">
              <button
                onClick={() => setExecutionMode("sequential")}
                className={`flex px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  executionMode === "sequential"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Sequential Mode"
              >
                Sequential
              </button>
              <button
                onClick={() => setExecutionMode("parallel")}
                className={`flex px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  executionMode === "parallel"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Parallel Mode"
              >
                Parallel
              </button>
            </div>
            {/* Autonomous Workflow Button — opens intelligent workflow agent modal */}
            <button
              onClick={() => setWorkflowDialogOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 text-primary hover:bg-primary/20"
              title="Open Autonomous Workflow"
              aria-label="Open autonomous workflow"
            >
              <Workflow className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Workflow</span>
            </button>
            {/* Private mode */}
            <button
              onClick={togglePrivateChat}
              className={`toolbar-icon-btn ${!saveToConversation ? "toolbar-icon-btn-active" : ""}`}
              title={
                saveToConversation
                  ? "Enable private mode"
                  : "Disable private mode"
              }
              aria-label="Toggle private mode"
            >
              {saveToConversation ? (
                <LockOpen className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Textarea row */}
      <div className="input-row">
        <ChatFileUpload
          onFilesUploaded={(files) =>
            setAttachedFiles((prev) => [...prev, ...files])
          }
          attachedFiles={attachedFiles}
          onRemoveFile={(id) =>
            setAttachedFiles((prev) => prev.filter((f) => f.id !== id))
          }
          disabled={sendDisabled}
        />
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={
            isExecuting ? "Agents are working…" : "Message your agents…"
          }
          className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[44px] max-h-[180px] text-sm placeholder:text-muted-foreground/40 py-3"
          disabled={sendDisabled}
          rows={1}
          aria-label="Message input"
        />
        <div className="flex-shrink-0">
          {isCancelling ? (
            <button
              className="send-btn send-btn-cancel"
              disabled
              aria-label="Cancelling"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
            </button>
          ) : isExecuting ? (
            <button
              onClick={handleCancelExecution}
              className="send-btn send-btn-cancel"
              aria-label="Stop"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => handleSubmit()}
              disabled={
                (!input.trim() && attachedFiles.length === 0) || sendDisabled
              }
              className="send-btn"
              aria-label="Send"
            >
              {preparingMessage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Status line */}
      {statusLineNode}
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Top loader bar */}
      <TopBar active={isActive} />

      {/* Compact Mode Header (Top Agents & Tooling Bar) */}
      {isCompactMode && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 bg-muted/5 shrink-0 relative">
          {/* Dynamic Real Agents Mapping */}
          <div className="flex items-center gap-2.5 overflow-x-auto hide-scrollbar scroll-smooth flex-1 min-w-0 pr-4">
            {/* New Chat Action Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 rounded-full bg-white/[0.05] border border-white/[0.1] text-foreground hover:bg-white/[0.1] hover:text-primary transition-all shrink-0"
                  aria-label="Start new chat"
                  onClick={onNewSession}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-medium">
                New Chat
              </TooltipContent>
            </Tooltip>

            {/* Render Injected History Sidebar Button */}
            {renderHistoryButton}

            {/* Workflow Action Button - Repositioned to left side cluster */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 rounded-full bg-white/[0.05] border border-white/[0.1] text-foreground hover:bg-white/[0.1] hover:text-primary transition-all shrink-0"
                  aria-label="Open autonomous workflow"
                  onClick={() => setWorkflowDialogOpen(true)}
                >
                  <Workflow className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-medium">
                Workflows
              </TooltipContent>
            </Tooltip>

            {/* Micro Selector for adding & exploring deeper choice queue */}
            <AgentSelector
              agents={agents}
              selectedAgents={selectedAgents}
              onAgentsChange={setSelectedAgents}
              compactMode={true}
            />

            <div className="h-4 w-px bg-border/40 mx-0.5 shrink-0" />

            {/* 1. Always show Selected Agents first (in selection order) */}
            {selectedAgents.map((agent) => {
              const selectionIndex = selectedAgents.findIndex(
                (a) => a.id === agent.id,
              );
              return (
                <button
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgents((prev) =>
                      prev.filter((a) => a.id !== agent.id),
                    );
                  }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all text-[11px] font-bold bg-primary/10 border-primary/30 text-foreground shadow-sm animate-in fade-in slide-in-from-left-1 duration-300"
                >
                  <span className="w-3.5 h-3.5 flex items-center justify-center bg-primary text-primary-foreground text-[9px] font-black rounded-full">
                    {selectionIndex + 1}
                  </span>
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: agent.color || "#d1d5db" }}
                  />
                  {agent.name}
                </button>
              );
            })}

            {/* New Integrated Chevron & Dynamic Expansion Flow */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAgentsToolbarExpanded(!agentsToolbarExpanded)}
                className={cn(
                  "h-6 w-6 flex items-center justify-center rounded-full transition-all duration-300",
                  "hover:bg-primary/20 border border-border/50 text-muted-foreground hover:text-primary shadow-sm",
                  agentsToolbarExpanded
                    ? "bg-primary/10 text-primary rotate-180 border-primary/30"
                    : "bg-muted/20 hover:scale-110",
                )}
                title={
                  agentsToolbarExpanded
                    ? "Collapse available agents"
                    : "Expand available agents"
                }
              >
                {agentsToolbarExpanded ? (
                  <ChevronLeft className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Conditionally render based on user requirement */}
              {(() => {
                const available = agents.filter(
                  (a) => !selectedAgents.some((sa) => sa.id === a.id),
                );
                if (available.length === 0) return null;

                if (agentsToolbarExpanded) {
                  // Render FULL row if expanded
                  return (
                    <div className="flex items-center gap-2 animate-in slide-in-from-left-2 fade-in duration-300">
                      {available.map((agent) => (
                        <button
                          key={agent.id}
                          onClick={() =>
                            setSelectedAgents((prev) => [...prev, agent])
                          }
                          className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full border border-transparent bg-transparent opacity-60 hover:opacity-100 hover:bg-muted/30 text-muted-foreground transition-all text-[11px] font-medium"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor: agent.color || "#d1d5db",
                            }}
                          />
                          {agent.name}
                        </button>
                      ))}
                    </div>
                  );
                } else {
                  // COLLAPSED: show EXACTLY ONE dynamic cycling agent
                  const cyclingAgent =
                    available[cyclingAgentIndex % available.length];
                  return (
                    <button
                      key={`cycle-${cyclingAgent.id}`}
                      onClick={() =>
                        setSelectedAgents((prev) => [...prev, cyclingAgent])
                      }
                      className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full border border-transparent bg-transparent opacity-50 hover:opacity-100 hover:bg-muted/30 text-muted-foreground transition-all duration-700 text-[11px] font-medium animate-in fade-in zoom-in-95"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{
                          backgroundColor: cyclingAgent.color || "#d1d5db",
                        }}
                      />
                      <span className="text-red-500 font-bold">
                        {cyclingAgent.name}
                      </span>
                    </button>
                  );
                }
              })()}
            </div>
          </div>

          {/* Functional Tooling */}
          <div className="flex items-center gap-3 ml-auto flex-shrink-0">
            <div className="flex items-center gap-2 border-r border-border/40 pr-3 mr-1.5">
              {/* Mini Execution Mode Toggle */}
              <div className="hidden sm:flex bg-muted/50 p-0.5 rounded-md border border-border/30">
                <button
                  onClick={() => setExecutionMode("sequential")}
                  className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded transition-all ${executionMode === "sequential" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground/60 hover:text-foreground"}`}
                >
                  Seq
                </button>
                <button
                  onClick={() => setExecutionMode("parallel")}
                  className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded transition-all ${executionMode === "parallel" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground/60 hover:text-foreground"}`}
                >
                  Par
                </button>
              </div>

              {/* Private Mode */}
              <button
                onClick={togglePrivateChat}
                className={`h-6 w-6 flex items-center justify-center rounded border transition-colors ${!saveToConversation ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-transparent border-border/30 text-muted-foreground hover:text-foreground"}`}
                title={
                  saveToConversation
                    ? "Enable private mode"
                    : "Disable private mode"
                }
              >
                {saveToConversation ? (
                  <LockOpen className="w-3 h-3" />
                ) : (
                  <Lock className="w-3 h-3" />
                )}
              </button>
            </div>

            {/* Actual Dynamic Socket Streaming Status */}
            <div
              className={`flex items-center gap-1.5 text-[10px] tracking-wider uppercase font-bold select-none transition-colors ${
                connectionStatus === "connected"
                  ? "text-primary/80"
                  : connectionStatus === "connecting"
                    ? "text-amber-500/80"
                    : "text-destructive/80"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-primary"
                    : connectionStatus === "connecting"
                      ? "bg-amber-500"
                      : "bg-destructive"
                } ${isExecuting || connectionStatus === "connecting" ? "animate-pulse" : ""}`}
              />
              {connectionStatus === "connected"
                ? isExecuting
                  ? "STREAMING"
                  : "READY"
                : connectionStatus.toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {messages.length === 0 &&
      !isExecuting &&
      !preparingMessage &&
      !hasStarted &&
      !convLoading ? (
        /* ── Welcome state ───────────────────────────────────────────────────── */
        <div className="flex-1 flex flex-col overflow-y-auto">
          <WelcomeScreen
            onPromptSelect={(prompt) => {
              setInput(prompt);
              textareaRef.current?.focus();
            }}
            hideHeader={isCompactMode}
          />
        </div>
      ) : (
        /* ── Active chat ─────────────────────────────────────────────────────── */
        <div
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto px-2 md:px-6 py-4"
        >
          <div className="max-w-5xl 2xl:max-w-6xl mx-auto w-full">
            <div className="flex items-center justify-end mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExportDialogOpen(true)}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                disabled={messages.length === 0}
              >
                <Download className="w-3.5 h-3.5" /> Export
              </Button>
            </div>
            <MessageList
              messages={messages}
              isLoading={isLoadingLocal || isExecuting}
              onRetryMessage={handleRetryMessage}
              isCompactMode={isCompactMode}
              activeAgentName={orchestrationProgress?.agent_name}
            />
            {/* In-chat agent loading card — only shown in classic mode while executing */}
            {isExecuting && !isCompactMode && (
              <AgentLoadingCard
                step={orchestrationProgress?.step}
                total={orchestrationProgress?.total}
                agentName={orchestrationProgress?.agent_name}
                agentNames={selectedAgents.map((a) => a.name)}
                isCompactMode={isCompactMode}
              />
            )}
            {/* Scroll anchor — always kept at bottom to enable auto-scroll */}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        </div>
      )}

      {/* Bottom input area — always rendered */}
      <div className="flex-shrink-0 border-t border-border/30 bg-background/80 backdrop-blur-md pb-4">
        <div
          className={`max-w-${messages.length === 0 ? "2xl" : "5xl"} 2xl:max-w-${messages.length === 0 ? "3xl" : "6xl"} mx-auto w-full`}
        >
          {inputAreaNode}
        </div>
      </div>

      <ExportChatDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        messages={messages}
        conversationTitle={undefined}
      />

      {/* Full-screen Autonomous Workflow Modal */}
      {workflowDialogOpen && (
        <AutonomousWorkflowInterface
          onClose={() => setWorkflowDialogOpen(false)}
          onWorkflowComplete={() => {
            // Refresh the sidebar's Workflows section automatically
            queryClient.invalidateQueries({ queryKey: ["workflow-history"] });
          }}
        />
      )}
    </div>
  );
};

export default ChatInterface;
