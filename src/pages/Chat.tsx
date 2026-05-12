import { useState, useEffect, useCallback, useRef } from "react";
import { getIsNewMode } from "@/utils/envFlags";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatInterface } from "@/components/ChatInterface";
import { ConversationHistory } from "@/components/ConversationHistory";
import { WorkflowHistoryViewer } from "@/components/WorkflowHistoryViewer";
import { GlobalHeader } from "@/components/GlobalHeader";
import { apiClient } from "@/lib/api";
import { useAgents } from "@/hooks/use-agents";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  RefreshCw,
  PanelLeftClose,
  History,
  Workflow as WorkflowIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { createLogger } from "@/services/logging";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

const logger = createLogger("Chat");

const ChatSkeleton = ({ isNewMode = false }: { isNewMode?: boolean }) => {
  if (isNewMode) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-[#09090b]">
        {/* Header mockup skeleton */}
        <div className="flex-shrink-0 px-4 pt-3 pb-2">
          <div className="max-w-7xl mx-auto h-14 rounded-2xl border border-white/[0.03] bg-white/[0.02] backdrop-blur-xl flex items-center justify-between px-5 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-6 w-24 rounded-md bg-white/[0.05]" />
            </div>
            <div className="hidden md:flex h-8 w-80 rounded-xl bg-white/[0.03]" />
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-full bg-white/[0.05]" />
            </div>
          </div>
        </div>

        {/* Hero & Workspace Skeleton */}
        <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-6 pt-12 md:pt-20 gap-12 animate-pulse">
          <div className="flex flex-col gap-4 max-w-2xl">
            <div className="h-3 w-32 rounded bg-primary/20" />
            <div className="h-12 w-full md:w-3/4 rounded-lg bg-white/[0.05]" />
            <div className="h-8 w-2/3 rounded-md bg-white/[0.03]" />
          </div>

          {/* The Central Rounded Framed Container */}
          <div className="flex-1 min-h-[500px] rounded-3xl border border-white/[0.05] bg-white/[0.01] backdrop-blur-sm p-8 flex flex-col justify-between">
            <div className="flex flex-col gap-6">
              <div className="flex gap-3 justify-center md:justify-start flex-wrap">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-24 rounded-full bg-white/[0.03] border border-white/[0.05]"
                  />
                ))}
              </div>
            </div>

            {/* Bottom input tracker */}
            <div className="h-32 w-full rounded-2xl bg-white/[0.02] border border-white/[0.05] border-b-0 mt-auto flex flex-col p-4 gap-3">
              <div className="h-4 w-full rounded-md bg-white/[0.03]" />
              <div className="h-4 w-3/4 rounded-md bg-white/[0.03]" />
              <div className="flex justify-between mt-auto">
                <div className="h-6 w-6 rounded-full bg-white/[0.05]" />
                <div className="h-8 w-16 rounded-lg bg-primary/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header skeleton */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24 rounded-md hidden md:block" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar skeleton (visible on desktop) */}
        <div className="hidden md:flex w-80 border-r border-border bg-muted/10 flex-col p-4 gap-4 flex-shrink-0">
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-16 rounded-md" />
          </div>
          <Skeleton className="h-9 w-full rounded-md" />
          <div className="space-y-2 mt-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2 p-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-2 w-1/4" />
              </div>
            ))}
          </div>
        </div>

        {/* Main content skeleton */}
        <div className="flex-1 flex flex-col relative bg-background">
          {/* Messages Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
            <Skeleton className="h-16 w-16 rounded-full opacity-60" />
            <div className="flex flex-col items-center gap-2 w-full max-w-md">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mt-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-24 rounded-xl border border-border/50"
                />
              ))}
            </div>
          </div>

          {/* Input area skeleton */}
          <div className="border-t border-border/30 p-4 flex justify-center bg-background">
            <div className="w-full max-w-3xl flex flex-col gap-3">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          </div>
        </div>
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
  const [viewingWorkflowId, setViewingWorkflowId] = useState<string | null>(
    null,
  );
  const isNewMode = getIsNewMode();
  const [isChatActive, setIsChatActive] = useState(false);

  const { agents, loading: loadingAgents, reload } = useAgents();
  const { user, refreshAuth } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Load sidebar and conversation preferences
  useEffect(() => {
    const savedSidebarState = sessionStorage.getItem("sidebarOpen");
    setSidebarOpen(savedSidebarState === "true");

    // Scope this key to current user ID to prevent accidental crosstalk between logins
    if (user?.id) {
      const lastConversationId = sessionStorage.getItem(
        `lastActiveConversation_${user.id}`,
      );
      if (lastConversationId) setCurrentConversationId(lastConversationId);
    }
  }, [user?.id]);

  useEffect(() => {
    sessionStorage.setItem("sidebarOpen", sidebarOpen.toString());
  }, [sidebarOpen]);

  // Focus empty conversation if possible
  const getEmptyCurrentConversation = (convs: Conversation[]) => {
    if (!currentConversationId) return false;
    const currentConv = convs.find((c) => c.id === currentConversationId);
    // 1. If explicit last_message exists, it's NOT empty
    if (currentConv?.last_message && currentConv.last_message.trim() !== "")
      return false;
    // 2. Check the cached message list for this ID to cover the window BEFORE backend list update
    const cachedMsgs = queryClient.getQueryData<any[]>([
      "messages",
      currentConversationId,
    ]);
    if (cachedMsgs && cachedMsgs.length > 0) return false;

    // If neither, consider empty
    return true;
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
        title: t("chat.sessionRefreshed", "Session refreshed"),
        description: t(
          "chat.sessionRefreshedDesc",
          "You can continue using the app",
        ),
      });
    } catch {
      toast({
        title: t("chat.refreshFailed", "Refresh failed"),
        description: t("chat.refreshFailedDesc", "Please try logging in again"),
        variant: "destructive",
      });
    } finally {
      setRetrying(false);
    }
  }, [refreshAuth, reload, fetchConversations, toast, t]);

  // Handlers
  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      setCurrentConversationId(conversationId);
      if (user?.id) {
        sessionStorage.setItem(
          `lastActiveConversation_${user.id}`,
          conversationId,
        );
      }
    },
    [user?.id],
  );

  const handleSelectWorkflow = useCallback((id: string) => {
    setViewingWorkflowId(id);
    setSidebarOpen(false); // close sidebar so the overlay has full focus
  }, []);

  const handleNewSession = useCallback(async () => {
    if (!user) return;

    if (getEmptyCurrentConversation(conversations)) {
      setCurrentConversationId(currentConversationId);
      if (user?.id) {
        sessionStorage.setItem(
          `lastActiveConversation_${user.id}`,
          currentConversationId!,
        );
      }
      setKey((prev) => prev + 1);
      setIsChatActive(false);
      toast({
        title: t("chat.readyToChat"),
        description: t("chat.readyToChatDesc"),
      });
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const tempConversation: Conversation = {
      id: tempId,
      title: t("chat.newConversation"),
      last_message_at: new Date().toISOString(),
      status: "active",
    };

    queryClient.setQueryData(
      ["conversations", user?.id],
      (old: Conversation[] = []) => [tempConversation, ...old],
    );
    setCurrentConversationId(tempId);
    if (user?.id) {
      sessionStorage.setItem(`lastActiveConversation_${user.id}`, tempId);
    }
    setKey((prev) => prev + 1);
    setIsChatActive(false);
    toast({
      title: t("chat.newChatStarted"),
      description: t("chat.newChatStartedDesc"),
    });

    try {
      const response = await apiClient.createConversation({
        agent_id: null,
        title: t("chat.newConversation"),
      });
      if (response.success && response.data?.id) {
        const realId = response.data.id;
        sessionStorage.setItem(`conv_mapping_${tempId}`, realId);

        // Pre-seed the messages cache for the real ID before updating
        // currentConversationId. The prop change triggers ChatInterface's
        // useEffect → loadConversationMessages → React Query fetch.
        // Without cached data the query fires immediately and may return []
        // (messages not yet saved), overwriting any in-progress stream.
        if (!queryClient.getQueryData(["messages", realId])) {
          queryClient.setQueryData(["messages", realId], []);
        }

        queryClient.setQueryData(
          ["conversations", user?.id],
          (prev: Conversation[] = []) =>
            prev.map((conv) =>
              conv.id === tempId ? { ...conv, id: realId } : conv,
            ),
        );

        setCurrentConversationId((prevId) => {
          if (prevId === tempId) {
            if (user?.id) {
              sessionStorage.setItem(
                `lastActiveConversation_${user.id}`,
                realId,
              );
            }
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
      // Pre-seed messages cache before updating currentConversationId so the
      // prop change doesn't trigger an immediate empty API fetch that wipes
      // any messages already in the cache from the current streaming session.
      if (!queryClient.getQueryData(["messages", conversationId])) {
        queryClient.setQueryData(["messages", conversationId], []);
      }

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
              title: t("chat.newConversation"),
              last_message_at: new Date().toISOString(),
              status: "active",
            },
            ...prev,
          ];
        },
      );

      setCurrentConversationId(conversationId);
      if (user?.id) {
        sessionStorage.setItem(
          `lastActiveConversation_${user.id}`,
          conversationId,
        );
      }
    },
    [queryClient, user?.id],
  );

  const handleConversationChange = useCallback(
    (conversationId: string | null) => {
      if (conversationId) {
        setCurrentConversationId(conversationId);
        if (user?.id) {
          sessionStorage.setItem(
            `lastActiveConversation_${user.id}`,
            conversationId,
          );
        }
      } else {
        setCurrentConversationId(undefined);
        if (user?.id) {
          sessionStorage.removeItem(`lastActiveConversation_${user.id}`);
        }
      }
    },
    [user?.id],
  );

  const handleConversationDeleted = useCallback(
    (deletedId?: string) => {
      const deletedConvId = deletedId || currentConversationId;
      if (deletedConvId === currentConversationId) {
        setCurrentConversationId(undefined);
        if (user?.id) {
          sessionStorage.removeItem(`lastActiveConversation_${user.id}`);
        }
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
        title: t("chat.convDeleted"),
        description: t("chat.convDeletedDesc"),
      });
    },
    [
      currentConversationId,
      fetchConversations,
      queryClient,
      toast,
      user?.id,
      t,
    ],
  );

  const handleConversationArchived = useCallback(() => {
    fetchConversations();
    setCurrentConversationId(undefined);
    if (user?.id) {
      sessionStorage.removeItem(`lastActiveConversation_${user.id}`);
    }
    toast({
      title: t("chat.convArchived"),
      description: t("chat.convArchivedDesc"),
    });
  }, [fetchConversations, toast, user?.id, t]);

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
        if (user?.id) {
          sessionStorage.removeItem(`lastActiveConversation_${user.id}`);
        }
        setKey((prev) => prev + 1);
        toast({
          title: t("chat.convNotFound"),
          description: t("chat.convNotFoundDesc"),
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
    return <ChatSkeleton isNewMode={isNewMode} />;
  }

  if (authError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background p-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold">{t("chat.sessionExpired")}</h2>
        <p className="text-muted-foreground text-center max-w-md">
          {t("chat.sessionExpiredDesc")}
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
                {t("chat.refreshing")}
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                {t("chat.refreshSession")}
              </>
            )}
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            {t("chat.reloadPage")}
          </Button>
        </div>
      </div>
    );
  }

  if (isNewMode) {
    return (
      <div className="h-screen bg-[#09090b] flex flex-col overflow-hidden selection:bg-primary/30">
        <GlobalHeader />

        <div
          className={`flex-1 flex flex-col mx-auto w-full overflow-hidden relative custom-scrollbar transition-all duration-700 ease-in-out ${isChatActive ? "max-w-full px-0 pt-0 pb-0" : "max-w-6xl px-4 sm:px-6 lg:px-8 pt-8 pb-10 overflow-y-auto"}`}
        >
          {/* Hero Header Outside Box - Autohides when active */}
          <div
            className={`text-left shrink-0 transition-all duration-700 ease-in-out ${isChatActive ? "h-0 opacity-0 overflow-hidden mb-0" : "mb-8 md:mb-10 opacity-100"}`}
          >
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-muted-foreground/60 uppercase flex items-center">
                {t("chat.aiChat")}{" "}
                <span className="mx-2 opacity-50 text-[8px]">•</span>{" "}
                {t("chat.orchestrator")}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] flex flex-col gap-1">
              <span className="text-foreground">{t("chat.heroTitle")}</span>
              <span className="text-muted-foreground/40">
                {t("chat.heroSubtitle")}
              </span>
            </h1>
          </div>

          {/* Main Container Framed Box - Containing the ChatInterface */}
          <div
            className={`flex-1 flex flex-col transition-all duration-700 ease-in-out ${isChatActive ? "border-0 rounded-none bg-background h-full" : "border border-border/30 rounded-2xl bg-card/5 backdrop-blur-xl shadow-2xl min-h-[500px]"} overflow-hidden relative group`}
          >
            {/* Inner Box Sidebar Drawer Trigger */}
            {/* Chat Interface filling inner box */}
            <div className="flex-1 h-full overflow-hidden relative bg-background/30">
              <ChatInterface
                key={key}
                agents={agents}
                activeConversationId={currentConversationId}
                onNewSession={handleNewSession}
                onConversationChange={handleConversationChange}
                onConversationCreated={handleConversationCreated}
                isCompactMode={true}
                onChatStartedChange={setIsChatActive}
                renderHistoryButton={
                  <Sheet>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SheetTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 rounded-full bg-white/[0.05] border border-white/[0.1] text-foreground hover:bg-white/[0.1] hover:text-primary transition-all shrink-0"
                            title={t("chat.history")}
                          >
                            <History className="w-3.5 h-3.5" />
                          </Button>
                        </SheetTrigger>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="text-xs font-medium"
                      >
                        {t("chat.history")}
                      </TooltipContent>
                    </Tooltip>
                    <SheetContent
                      side="left"
                      className="w-80 p-0 border-r border-border bg-background/95 backdrop-blur-md shadow-xl"
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
                    </SheetContent>
                  </Sheet>
                }
              />
            </div>
          </div>
        </div>

        {/* ── Workflow History Viewer Overlay ── */}
        {viewingWorkflowId && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-hidden">
            <WorkflowHistoryViewer
              executionId={viewingWorkflowId}
              onBack={() => setViewingWorkflowId(null)}
              onNewWorkflow={() => setViewingWorkflowId(null)}
            />
          </div>
        )}
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
            aria-label={
              sidebarOpen
                ? t("chat.hideConversations")
                : t("chat.showConversations")
            }
            title={
              sidebarOpen
                ? t("chat.hideConversations")
                : t("chat.showConversations")
            }
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
              onNewSession={handleNewSession}
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
