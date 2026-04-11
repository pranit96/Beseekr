import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatInterface } from "@/components/ChatInterface";
import { ConversationHistory } from "@/components/ConversationHistory";
import { WorkflowHistoryViewer } from "@/components/WorkflowHistoryViewer";
import { GlobalHeader } from "@/components/GlobalHeader";
import { apiClient } from "@/lib/api";
import { useAgents } from "@/hooks/use-agents";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, RefreshCw, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createLogger } from "@/services/logging";

const logger = createLogger("Chat");

// ─── Epic Loading Screen ─────────────────────────────────────────────────────
const FALLBACK_STEPS = [
  {
    label: "Research Analyst",
    subtitle: "Scouring knowledge bases",
    color: "#7c3aed",
    glow: "rgba(124,58,237,0.5)",
  },
  {
    label: "Creative Catalyst",
    subtitle: "Igniting creative pathways",
    color: "#0ea5e9",
    glow: "rgba(14,165,233,0.5)",
  },
  {
    label: "Logic Verifier",
    subtitle: "Validating reasoning chains",
    color: "#10b981",
    glow: "rgba(16,185,129,0.5)",
  },
  {
    label: "Synthesizer",
    subtitle: "Weaving final insights",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.5)",
  },
];

const STEP_COLORS = [
  { color: "#7c3aed", glow: "rgba(124,58,237,0.5)" },
  { color: "#0ea5e9", glow: "rgba(14,165,233,0.5)" },
  { color: "#10b981", glow: "rgba(16,185,129,0.5)" },
  { color: "#f59e0b", glow: "rgba(245,158,11,0.5)" },
  { color: "#ec4899", glow: "rgba(236,72,153,0.5)" },
  { color: "#6366f1", glow: "rgba(99,102,241,0.5)" },
];

interface LoadingAgent {
  name: string;
  domain?: string;
}

const ChatLoadingScreen = ({ agents = [] }: { agents?: LoadingAgent[] }) => {
  // Build steps from real agents when available, else use fallback
  const AGENT_STEPS =
    agents.length > 0
      ? agents.map((a, i) => ({
          label: a.name,
          subtitle: a.domain ? `${a.domain} specialist` : "AI specialist",
          ...STEP_COLORS[i % STEP_COLORS.length],
        }))
      : FALLBACK_STEPS;
  const [step, setStep] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const tick = () => {
      setFadingOut(true);
      setTimeout(() => {
        setStep((prev) => (prev + 1) % AGENT_STEPS.length);
        setFadingOut(false);
      }, 350);
    };
    const id = window.setInterval(tick, 1800);
    return () => clearInterval(id);
  }, []);

  const current = AGENT_STEPS[step];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "hsl(var(--background))",
        overflow: "hidden",
        gap: "0px",
      }}
    >
      {/* ── Ambient blobs ── */}
      <div className="loading-blob loading-blob-1" />
      <div className="loading-blob loading-blob-2" />
      <div className="loading-blob loading-blob-3" />

      {/* ── Orbital system container ── */}
      <div
        style={{ position: "relative", width: 280, height: 280, flexShrink: 0 }}
      >
        {/* Outermost halo ring */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "1px solid",
            borderColor: `color-mix(in srgb, ${current.color} 18%, transparent)`,
            boxShadow: `0 0 40px 4px ${current.glow}`,
            animation: "yy-spin-cw 8s linear infinite",
            transition: "border-color 0.6s ease, box-shadow 0.6s ease",
          }}
        />

        {/* Outer spinning ring */}
        <div
          style={{
            position: "absolute",
            inset: "16px",
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: current.color,
            borderRightColor: `color-mix(in srgb, ${current.color} 40%, transparent)`,
            animation: "yy-spin-cw 3s linear infinite",
            transition: "border-color 0.5s ease",
          }}
        />

        {/* Middle ring spinning opposite */}
        <div
          style={{
            position: "absolute",
            inset: "40px",
            borderRadius: "50%",
            border: "2px solid transparent",
            borderBottomColor: current.color,
            borderLeftColor: `color-mix(in srgb, ${current.color} 30%, transparent)`,
            animation: "yy-spin-ccw 2s linear infinite",
            transition: "border-color 0.5s ease",
          }}
        />

        {/* Inner ring */}
        <div
          style={{
            position: "absolute",
            inset: "64px",
            borderRadius: "50%",
            border: "1.5px solid",
            borderColor: `color-mix(in srgb, ${current.color} 25%, transparent)`,
            animation: "yy-spin-cw 5s linear infinite",
            transition: "border-color 0.5s ease",
          }}
        />

        {/* ── Yin-Yang core ── */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 100,
            height: 100,
            marginLeft: -50,
            marginTop: -50,
            borderRadius: "50%",
            overflow: "hidden",
            animation: "yy-core-spin 4s linear infinite",
            boxShadow: `0 0 0 2px hsl(var(--border) / 0.6), 0 0 32px ${current.glow}, 0 0 64px color-mix(in srgb, ${current.color} 20%, transparent)`,
            transition: "box-shadow 0.6s ease",
            willChange: "transform",
          }}
        >
          {/* Yin (dark) half */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "50%",
              background: "hsl(var(--foreground))",
              borderRadius: "50px 50px 0 0",
            }}
          />
          {/* Yang (light) half */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: "50%",
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border)/0.4)",
              borderRadius: "0 0 50px 50px",
            }}
          />
          {/* Top small dot */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 24,
              height: 24,
              marginLeft: -12,
              marginTop: -24,
              borderRadius: "50%",
              background: "hsl(var(--background))",
              boxShadow: `inset 0 0 0 3px hsl(var(--foreground)/0.15), 0 0 8px ${current.glow}`,
              transition: "box-shadow 0.5s ease",
            }}
          />
          {/* Bottom small dot */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 24,
              height: 24,
              marginLeft: -12,
              marginTop: 0,
              borderRadius: "50%",
              background: "hsl(var(--foreground))",
              boxShadow: `inset 0 0 0 3px hsl(var(--background)/0.35), 0 0 8px ${current.glow}`,
              transition: "box-shadow 0.5s ease",
            }}
          />
        </div>

        {/* ── Orbiting agent dots ── */}
        {AGENT_STEPS.map((agent, i) => {
          const isActive = i === step;
          const angle = (i / AGENT_STEPS.length) * 360;
          return (
            <div
              key={agent.label}
              style={
                {
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 0,
                  height: 0,
                  transform: `rotate(${angle}deg) translateX(118px) rotate(-${angle}deg)`,
                  animation: `yy-orbit 6s linear infinite`,
                  animationDelay: `${(i / AGENT_STEPS.length) * -6}s`,
                  willChange: "transform",
                } as React.CSSProperties
              }
            >
              <div
                style={{
                  position: "absolute",
                  transform: "translate(-50%, -50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: isActive ? 16 : 10,
                    height: isActive ? 16 : 10,
                    borderRadius: "50%",
                    background: agent.color,
                    boxShadow: isActive
                      ? `0 0 20px ${agent.glow}, 0 0 40px ${agent.glow}`
                      : `0 0 8px color-mix(in srgb, ${agent.color} 50%, transparent)`,
                    transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    color: isActive
                      ? agent.color
                      : "hsl(var(--muted-foreground)/0.45)",
                    letterSpacing: "0.04em",
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? "translateY(0)" : "translateY(-4px)",
                    transition: "all 0.35s ease",
                    pointerEvents: "none",
                    textShadow: isActive ? `0 0 12px ${agent.glow}` : "none",
                  }}
                >
                  {agent.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Step indicator dots ── */}
      <div style={{ display: "flex", gap: 8, marginTop: 28 }}>
        {AGENT_STEPS.map((agent, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 24 : 7,
              height: 7,
              borderRadius: 999,
              background:
                i === step ? current.color : "hsl(var(--muted-foreground)/0.2)",
              boxShadow: i === step ? `0 0 10px ${current.glow}` : "none",
              transition: "all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />
        ))}
      </div>

      {/* ── Status badge + tagline ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          marginTop: 28,
          opacity: fadingOut ? 0 : 1,
          transform: fadingOut ? "translateY(6px)" : "translateY(0)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 20px",
            borderRadius: 999,
            border: `1px solid ${current.color}`,
            background: `color-mix(in srgb, ${current.color} 12%, transparent)`,
            color: current.color,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            boxShadow: `0 0 20px ${current.glow}`,
            animation: "badge-pulse 1.6s ease-in-out infinite",
            transition:
              "border-color 0.4s, color 0.4s, background 0.4s, box-shadow 0.4s",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: current.color,
              boxShadow: `0 0 10px ${current.glow}`,
              display: "block",
              animation: "dots-fade 1s ease-in-out infinite",
              transition: "background 0.4s, box-shadow 0.4s",
            }}
          />
          {current.label}
        </div>
        <p
          style={{
            fontSize: 12,
            color: "hsl(var(--muted-foreground)/0.55)",
            fontWeight: 500,
            letterSpacing: "0.03em",
            margin: 0,
          }}
        >
          {current.subtitle}
        </p>
        {/* Step counter */}
        <p
          style={{
            fontSize: 11,
            color: "hsl(var(--muted-foreground)/0.35)",
            fontWeight: 400,
            margin: 0,
          }}
        >
          Step {step + 1} of {AGENT_STEPS.length} · Assembling your AI workspace
        </p>
      </div>
    </div>
  );
};

interface Conversation {
  id: string;
  title: string;
  last_message_at: string;
  status: "active" | "archived";
  last_message?: string;
}

const Chat = () => {
  const queryClient = useQueryClient();
  const [currentConversationId, setCurrentConversationId] = useState<string>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [key, setKey] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [viewingWorkflowId, setViewingWorkflowId] = useState<string | null>(null);

  const { agents, loading: loadingAgents, reload } = useAgents();
  const { user, refreshAuth } = useAuth();
  const { toast } = useToast();

  // Load sidebar and conversation preferences
  useEffect(() => {
    const savedSidebarState = sessionStorage.getItem("sidebarOpen");
    setSidebarOpen(savedSidebarState === "true");

    const lastConversationId = sessionStorage.getItem("lastActiveConversation");
    if (lastConversationId) setCurrentConversationId(lastConversationId);
  }, []);

  useEffect(() => {
    sessionStorage.setItem("sidebarOpen", sidebarOpen.toString());
  }, [sidebarOpen]);

  // Focus empty conversation if possible
  const getEmptyCurrentConversation = (convs: Conversation[]) => {
    if (!currentConversationId) return false;
    const currentConv = convs.find((c) => c.id === currentConversationId);
    return !currentConv?.last_message || currentConv.last_message.trim() === "";
  };

  // Main Query for Conversations
  const {
    data: conversations = [],
    isLoading: loadingConversations,
    isError: authError,
    refetch: fetchConversations,
  } = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
    retry: (failureCount, error: any) => {
      const msg = error?.message || "";
      if (msg.includes("Session expired") || msg.includes("401")) return false;
      return failureCount < 3;
    },
    queryFn: async () => {
      logger.info("Fetching conversations via React Query");
      const response = await apiClient.getConversations({
        status: "active",
        page: 1,
        limit: 30,
      });

      let rawConversations: Conversation[] = [];
      if (response.success && response.data) {
        if (Array.isArray(response.data)) rawConversations = response.data;
        else if (Array.isArray(response.data.conversations))
          rawConversations = response.data.conversations;
        else if (Array.isArray(response.data.data))
          rawConversations = response.data.data;
      } else {
        throw new Error(response.error || "Failed to fetch conversations");
      }

      // Fetch last_message in background without blocking render
      setTimeout(() => fetchLastMessagesPreviews(rawConversations), 100);
      return rawConversations;
    },
  });

  const fetchLastMessagesPreviews = async (convs: Conversation[]) => {
    for (const conv of convs) {
      const currentData = queryClient.getQueryData<Conversation[]>([
        "conversations",
        user?.id,
      ]);
      const cachedConv = currentData?.find((c) => c.id === conv.id);
      if (cachedConv?.last_message) continue; // Skip if we already cached the message preview!

      try {
        await new Promise((r) => setTimeout(r, 200));
        const messagesRes = await apiClient.getMessages(conv.id, 1, 5);
        let messagesArray: any[] = [];
        if (messagesRes.data) {
          if (Array.isArray(messagesRes.data)) messagesArray = messagesRes.data;
          else if (Array.isArray(messagesRes.data.messages))
            messagesArray = messagesRes.data.messages;
          else if (Array.isArray(messagesRes.data.data))
            messagesArray = messagesRes.data.data;
        }

        if (messagesArray.length > 0) {
          const sorted = [...messagesArray].sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
          const lastUserMsg = sorted.find((m: any) => m.role === "user");
          let lastMsgText = undefined;

          if (lastUserMsg?.content)
            lastMsgText = lastUserMsg.content.substring(0, 100);
          else {
            const anyMsg = sorted.find(
              (m: any) => m.content && m.content.trim(),
            );
            if (anyMsg?.content) {
              const prefix = anyMsg.role === "assistant" ? "🤖 " : "";
              lastMsgText = `${prefix}${anyMsg.content.substring(0, 100)}`;
            }
          }

          if (lastMsgText) {
            queryClient.setQueryData(
              ["conversations", user?.id],
              (old: Conversation[] | undefined) => {
                if (!old) return old;
                return old.map((c) =>
                  c.id === conv.id ? { ...c, last_message: lastMsgText } : c,
                );
              },
            );
          }
        }
      } catch (err: any) {
        if (err?.message?.includes("429") || err?.message?.includes("Too many"))
          break;
      }
    }
  };

  const handleRetryAuth = useCallback(async () => {
    setRetrying(true);
    try {
      await refreshAuth();
      await reload();
      apiClient.invalidateCache();
      await fetchConversations();
      toast({
        title: "Session refreshed",
        description: "You can continue using the app",
      });
    } catch {
      toast({
        title: "Refresh failed",
        description: "Please try logging in again",
        variant: "destructive",
      });
    } finally {
      setRetrying(false);
    }
  }, [refreshAuth, reload, fetchConversations, toast]);

  // Handlers
  const handleSelectConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
    sessionStorage.setItem("lastActiveConversation", conversationId);
  }, []);

  const handleSelectWorkflow = useCallback((id: string) => {
    setViewingWorkflowId(id);
    setSidebarOpen(false); // close sidebar so the overlay has full focus
  }, []);

  const handleNewSession = useCallback(async () => {
    if (!user) return;

    if (getEmptyCurrentConversation(conversations)) {
      setCurrentConversationId(currentConversationId);
      sessionStorage.setItem("lastActiveConversation", currentConversationId!);
      setKey((prev) => prev + 1);
      toast({
        title: "Ready to chat",
        description: "Start typing your message below.",
      });
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const tempConversation: Conversation = {
      id: tempId,
      title: "New Conversation",
      last_message_at: new Date().toISOString(),
      status: "active",
    };

    queryClient.setQueryData(
      ["conversations", user?.id],
      (old: Conversation[] = []) => [tempConversation, ...old],
    );
    setCurrentConversationId(tempId);
    sessionStorage.setItem("lastActiveConversation", tempId);
    setKey((prev) => prev + 1);

    toast({
      title: "New chat started",
      description: "You can now start messaging your agents.",
    });

    try {
      const response = await apiClient.createConversation({
        agent_id: null,
        title: "New Conversation",
      });
      if (response.success && response.data?.id) {
        const realId = response.data.id;
        sessionStorage.setItem(`conv_mapping_${tempId}`, realId);

        queryClient.setQueryData(
          ["conversations", user?.id],
          (prev: Conversation[] = []) =>
            prev.map((conv) =>
              conv.id === tempId ? { ...conv, id: realId } : conv,
            ),
        );

        setCurrentConversationId((prevId) => {
          if (prevId === tempId) {
            sessionStorage.setItem("lastActiveConversation", realId);
            return realId;
          }
          return prevId;
        });
      } else {
        throw new Error("Could not create a new session");
      }
    } catch (error: any) {
      if (
        error.message?.includes("Session expired") ||
        error.message?.includes("401")
      ) {
        queryClient.setQueryData(
          ["conversations", user?.id],
          (prev: Conversation[] = []) => prev.filter((c) => c.id !== tempId),
        );
        setCurrentConversationId((prev) =>
          prev === tempId ? undefined : prev,
        );
      }
    }
  }, [user, conversations, currentConversationId, queryClient, toast]);

  const handleConversationCreated = useCallback(
    async (conversationId: string) => {
      queryClient.setQueryData(
        ["conversations", user?.id],
        (prev: Conversation[] = []) => {
          const tempIndex = prev.findIndex((conv) =>
            conv.id.startsWith("temp-"),
          );
          if (tempIndex >= 0) {
            const updated = [...prev];
            updated[tempIndex] = { ...updated[tempIndex], id: conversationId };
            return updated;
          }
          if (prev.some((conv) => conv.id === conversationId)) return prev;
          return [
            {
              id: conversationId,
              title: "New Conversation",
              last_message_at: new Date().toISOString(),
              status: "active",
            },
            ...prev,
          ];
        },
      );

      setCurrentConversationId(conversationId);
      sessionStorage.setItem("lastActiveConversation", conversationId);
    },
    [queryClient, user?.id],
  );

  const handleConversationChange = useCallback(
    (conversationId: string | null) => {
      if (conversationId) {
        setCurrentConversationId(conversationId);
        sessionStorage.setItem("lastActiveConversation", conversationId);
      } else {
        setCurrentConversationId(undefined);
        sessionStorage.removeItem("lastActiveConversation");
      }
    },
    [],
  );

  const handleConversationDeleted = useCallback(
    (deletedId?: string) => {
      const deletedConvId = deletedId || currentConversationId;
      if (deletedConvId === currentConversationId) {
        setCurrentConversationId(undefined);
        sessionStorage.removeItem("lastActiveConversation");
        setKey((prev) => prev + 1);
      }

      // Optimistically remove from cache
      queryClient.setQueryData(
        ["conversations", user?.id],
        (prev: Conversation[] = []) =>
          prev.filter((c) => c.id !== deletedConvId),
      );

      fetchConversations();
      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed.",
      });
    },
    [currentConversationId, fetchConversations, queryClient, toast, user?.id],
  );

  const handleConversationArchived = useCallback(() => {
    fetchConversations();
    setCurrentConversationId(undefined);
    sessionStorage.removeItem("lastActiveConversation");
    toast({
      title: "Conversation archived",
      description: "The conversation has been archived.",
    });
  }, [fetchConversations, toast]);

  const isLoading = loadingAgents || loadingConversations;

  useEffect(() => {
    const handleConversationNotFound = (event: CustomEvent) => {
      const { conversationId: notFoundId } = event.detail;
      queryClient.setQueryData(
        ["conversations", user?.id],
        (prev: Conversation[] = []) => prev.filter((c) => c.id !== notFoundId),
      );

      if (currentConversationId === notFoundId) {
        setCurrentConversationId(undefined);
        sessionStorage.removeItem("lastActiveConversation");
        setKey((prev) => prev + 1);
        toast({
          title: "Conversation not found",
          description: "This conversation may have been deleted.",
        });
      }
    };

    window.addEventListener(
      "conversation-not-found",
      handleConversationNotFound as EventListener,
    );
    return () =>
      window.removeEventListener(
        "conversation-not-found",
        handleConversationNotFound as EventListener,
      );
  }, [currentConversationId, queryClient, toast, user?.id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        handleNewSession();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "r" && authError) {
        e.preventDefault();
        handleRetryAuth();
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [handleNewSession, authError, handleRetryAuth]);

  if (isLoading && !authError && conversations.length === 0) {
    return <ChatLoadingScreen agents={agents} />;
  }

  if (authError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background p-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold">Session Expired</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Your session has expired. Please refresh to continue.
        </p>
        <div className="flex gap-3 mt-4">
          <Button
            onClick={handleRetryAuth}
            disabled={retrying}
            className="gap-2"
          >
            {retrying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Refresh Session
              </>
            )}
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <GlobalHeader />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`transition-all duration-300 ease-in-out border-r border-border bg-muted/30 flex-shrink-0 absolute md:relative z-40 md:z-20 h-full ${
            sidebarOpen
              ? "w-[85vw] max-w-[320px] md:w-80 2xl:w-96 opacity-100 translate-x-0"
              : "w-0 md:w-0 opacity-0 -translate-x-full md:translate-x-0"
          } overflow-hidden`}
        >
          <ConversationHistory
            conversations={conversations}
            onSelectConversation={handleSelectConversation}
            onNewSession={handleNewSession}
            onConversationDeleted={handleConversationDeleted}
            onConversationArchived={handleConversationArchived}
            currentConversationId={currentConversationId}
            onSelectWorkflow={handleSelectWorkflow}
          />
        </aside>

        {/* Sidebar toggle button — positioned vertically centered for a unique, sleek handle feel */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 z-50 pointer-events-none transition-all duration-300 ${
            sidebarOpen
              ? "left-[calc(min(85vw,320px))] md:left-80 2xl:left-96 ml-0 -translate-x-1/2"
              : "left-0"
          }`}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className={`pointer-events-auto flex items-center justify-center transition-all duration-300 shadow-xl border bg-background/80 backdrop-blur-md group
              ${
                sidebarOpen
                  ? "h-10 w-10 rounded-full border-border hover:bg-muted"
                  : "h-24 w-6 rounded-r-xl rounded-l-none border-border border-l-0 hover:w-8 hover:bg-muted/50 bg-gradient-to-b from-background via-muted/30 to-background hover:from-primary/10 hover:to-primary/5 hover:border-primary/30"
              }`}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            title={sidebarOpen ? "Hide conversations" : "Show conversations"}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                <div className="w-1 h-1 rounded-full bg-foreground/60 group-hover:bg-primary transition-colors" />
                <div className="w-1 h-1 rounded-full bg-foreground/60 group-hover:bg-primary transition-colors" />
                <div className="w-1 h-1 rounded-full bg-foreground/60 group-hover:bg-primary transition-colors" />
              </div>
            )}
          </Button>
        </div>

        {/* Chat Interface */}
        <main className="flex-1 flex justify-center overflow-hidden relative">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          <div className="w-full h-full max-w-[1400px] 2xl:max-w-[1800px] relative z-10">
            <ChatInterface
              key={key}
              agents={agents}
              activeConversationId={currentConversationId}
              onConversationChange={handleConversationChange}
              onConversationCreated={handleConversationCreated}
            />
          </div>
        </main>
      </div>

      {/* ── Workflow History Viewer Overlay ── */}
      {viewingWorkflowId && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-hidden">
          <WorkflowHistoryViewer
            executionId={viewingWorkflowId}
            onBack={() => setViewingWorkflowId(null)}
            onNewWorkflow={() => {
              setViewingWorkflowId(null);
              // The Workflow button in ChatInterface handles opening the modal
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Chat;
