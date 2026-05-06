// src/hooks/use-conversation.ts - Refactored to React Query
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { ChatMessage, AgentResponse } from "@/types/agent";
import { createLogger } from "@/services/logging";

const logger = createLogger("useConversation");

interface UseConversationReturn {
  messages: ChatMessage[];
  setMessages: (
    updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[]),
  ) => void;
  conversationId: string | null;
  setConversationId: React.Dispatch<React.SetStateAction<string | null>>;
  loadConversationMessages: (convId: string, force?: boolean) => Promise<void>;
  isLoading: boolean;
  hasStarted: boolean;
  setHasStarted: React.Dispatch<React.SetStateAction<boolean>>;
  isActiveOrchestrationRef: React.MutableRefObject<boolean>;
  messageCache: Map<string, ChatMessage[]>; // Deprecated conceptually, but kept for interface compatibility
}

export function useConversation(
  initialConversationId?: string,
): UseConversationReturn {
  const [conversationId, _setConversationId] = useState<string | null>(
    initialConversationId || null,
  );
  const activeConvIdRef = useRef<string | null>(initialConversationId || null);
  const [hasStarted, setHasStarted] = useState(false);
  // Fallback local messages when no conversationId is available yet
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const localMessagesRef = useRef<ChatMessage[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const setConversationId = useCallback(
    (id: string | null | ((prev: string | null) => string | null)) => {
      _setConversationId((prev) => {
        const nextId = typeof id === "function" ? id(prev) : id;
        activeConvIdRef.current = nextId;
        return nextId;
      });
    },
    [],
  );

  // Track if we're currently in an active orchestration
  const isActiveOrchestrationRef = useRef(false);

  const {
    data: messages = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["messages", conversationId],
    enabled: !!conversationId && !conversationId.startsWith("temp-"),
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    queryFn: async () => {
      if (!conversationId) return [];

      logger.info("Loading messages for conversation via React Query", {
        conversationId,
      });
      const res = await apiClient.getMessages(conversationId, 1, 50);

      let rawMessages: any[] = [];
      if (res.success && res.data) {
        if (Array.isArray(res.data)) rawMessages = res.data;
        else if (Array.isArray(res.data.data)) rawMessages = res.data.data;
        else if (Array.isArray(res.data.messages))
          rawMessages = res.data.messages;
      }

      const apiMessages: ChatMessage[] = rawMessages.map((msg: any) => {
        const base = {
          id: msg.id,
          content: msg.content || "",
          timestamp: new Date(msg.created_at),
          isFromCache: true,
        } as Partial<ChatMessage>;

        if (msg.role === "user") {
          return { ...base, type: "user" } as ChatMessage;
        }

        if (msg.role === "assistant") {
          let metadata = msg.metadata;
          if (typeof metadata === "string") {
            try {
              metadata = JSON.parse(metadata);
            } catch (e) {
              metadata = {};
            }
          }

          const agentResults = metadata?.agent_results || [];
          const agentResponses: AgentResponse[] = agentResults.map(
            (r: any) => ({
              agentId: r.agent_id || r.agentId || "unknown",
              agentName: r.agent_name || r.agentName || "Assistant",
              content: r.response || r.content || "",
              timestamp: new Date(msg.created_at),
              status: r.error ? "error" : "success",
              metadata: {
                usage: r.usage || {
                  total_tokens: msg.tokens_used || 0,
                  prompt_tokens: r.usage?.prompt_tokens || 0,
                  completion_tokens: r.usage?.completion_tokens || 0,
                },
                domain: r.agent_domain || r.domain,
                model_used: metadata?.model || r.model,
                execution_time_ms: r.execution_time_ms,
              },
            }),
          );

          if (agentResponses.length === 0 && msg.content) {
            agentResponses.push({
              agentId: metadata?.agent_id || "default",
              agentName: metadata?.agent_name || "Assistant",
              content: msg.content,
              timestamp: new Date(msg.created_at),
              status: "success",
              metadata: {
                usage: {
                  total_tokens: msg.tokens_used || 0,
                  prompt_tokens: 0,
                  completion_tokens: msg.tokens_used || 0,
                },
              },
            });
          }

          return {
            ...base,
            type: "agent",
            agentResponses,
            agentTraces: agentResponses.map((ar) => ({
              agentId: ar.agentId,
              agentName: ar.agentName || "Agent",
              status: ar.status as any,
              tokens: ar.metadata?.usage?.total_tokens || 0,
              timeMs: (ar.metadata as any)?.execution_time_ms || 0,
            })),
            workflowStatus: "completed",
            executionMode: metadata?.orchestration_mode || "sequential",
            markdownOutput: metadata?.markdown_output || msg.content,
            finalOutput: metadata?.final_output || msg.content,
          } as ChatMessage;
        }

        return { ...base, type: "user" } as ChatMessage;
      });

      // Only ever set hasStarted → true from the queryFn.
      // Never set it to false here — the user may be actively streaming a response
      // while this query fires for a brand-new conversation (which returns [] from
      // the API). Setting false would overwrite the true set in handleSubmit and
      // collapse the UI back to the welcome screen once isExecuting clears.
      if (apiMessages.length > 0) setHasStarted(true);
      return apiMessages;
    },
  });

  // Provide a setter that mutates the React Query cache so streaming agents can append logic.
  // Falls back to local state when no conversationId exists yet (e.g. during conversation creation).
  const setMessages = useCallback(
    (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      const targetId = activeConvIdRef.current;

      if (targetId) {
        // Normal path — update React Query cache
        queryClient.setQueryData(
          ["messages", targetId],
          (old: ChatMessage[] = []) => {
            const newMessages =
              typeof updater === "function" ? updater(old) : updater;
            if (newMessages.length > 0) setHasStarted(true);
            localMessagesRef.current = newMessages;
            return newMessages;
          },
        );
      } else {
        // Fallback path — no conversationId yet, keep in local state
        setLocalMessages((prev) => {
          const newMessages =
            typeof updater === "function" ? updater(prev) : updater;
          if (newMessages.length > 0) setHasStarted(true);
          localMessagesRef.current = newMessages;
          return newMessages;
        });
      }
    },
    [queryClient],
  );

  const loadConversationMessages = useCallback(
    async (convId: string, force: boolean = false) => {
      if (!force) isActiveOrchestrationRef.current = false;

      // Changing the conversation ID instantly triggers the useQuery above,
      // retrieving cached versions immediately or fetching automatically.
      setConversationId(convId);

      if (force && convId === conversationId) {
        await refetch();
      }
    },
    [conversationId, refetch],
  );

  // Reset hasStarted when the user switches to a DIFFERENT conversation.
  // Guard: skip during active orchestration so we don't reset the flag mid-stream.
  // This ensures the welcome screen and loading state behave correctly when the
  // sidebar is used to open a different conversation.
  useEffect(() => {
    if (!isActiveOrchestrationRef.current) {
      setHasStarted(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // When a conversationId first becomes available, migrate any locally-buffered
  // messages into the React Query cache so the chat doesn't go blank.
  const prevConvIdRef = useRef<string | null>(null);
  useEffect(() => {
    const prevId = prevConvIdRef.current;
    prevConvIdRef.current = conversationId;

    // Migrate buffered messages when switching from null OR a temp-* ID to a real ID.
    // This prevents a blank flash when the real conversation ID is assigned after creation.
    const prevWasEmpty = !prevId || prevId.startsWith("temp-");
    const nowIsReal = conversationId && !conversationId.startsWith("temp-");

    if (prevWasEmpty && nowIsReal) {
      // Pull messages buffered under the temp key (if any) from the cache
      const tempCached: ChatMessage[] = prevId?.startsWith("temp-")
        ? queryClient.getQueryData<ChatMessage[]>(["messages", prevId]) ?? []
        : [];
      const buffered = tempCached.length > 0 ? tempCached : localMessagesRef.current;

      if (buffered.length > 0) {
        queryClient.setQueryData(
          ["messages", conversationId],
          (old: ChatMessage[] = []) => (old.length > 0 ? old : buffered),
        );
        // Clean up temp cache key
        if (prevId?.startsWith("temp-")) {
          queryClient.removeQueries({ queryKey: ["messages", prevId] });
        }
        setLocalMessages([]);
        localMessagesRef.current = [];
      }
    }
  }, [conversationId, queryClient]);

  // Effective messages: prefer React Query cache, fall back to localMessages
  const effectiveMessages = conversationId ? messages : localMessages;

  // Backward compatibility mock for messageCache
  const messageCache = new Map<string, ChatMessage[]>();
  if (conversationId) messageCache.set(conversationId, messages);
  else if (localMessages.length > 0) messageCache.set("local", localMessages);

  return {
    messages: effectiveMessages,
    setMessages,
    conversationId,
    setConversationId,
    loadConversationMessages,
    isLoading,
    hasStarted,
    setHasStarted,
    isActiveOrchestrationRef,
    messageCache,
  };
}
