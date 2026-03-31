// src/hooks/use-conversation.ts - Refactored to React Query
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage, AgentResponse } from '@/types/agent';
import { createLogger } from '@/services/logging';

const logger = createLogger('useConversation');

interface UseConversationReturn {
  messages: ChatMessage[];
  setMessages: (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  conversationId: string | null;
  setConversationId: React.Dispatch<React.SetStateAction<string | null>>;
  loadConversationMessages: (convId: string, force?: boolean) => Promise<void>;
  isLoading: boolean;
  hasStarted: boolean;
  setHasStarted: React.Dispatch<React.SetStateAction<boolean>>;
  isActiveOrchestrationRef: React.MutableRefObject<boolean>;
  messageCache: Map<string, ChatMessage[]>; // Deprecated conceptually, but kept for interface compatibility
}

export function useConversation(initialConversationId?: string): UseConversationReturn {
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null);
  const [hasStarted, setHasStarted] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Track if we're currently in an active orchestration
  const isActiveOrchestrationRef = useRef(false);

  const {
    data: messages = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['messages', conversationId],
    enabled: !!conversationId && !conversationId.startsWith('temp-'),
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    queryFn: async () => {
      if (!conversationId) return [];
      
      logger.info('Loading messages for conversation via React Query', { conversationId });
      const res = await apiClient.getMessages(conversationId, 1, 50);

      let rawMessages: any[] = [];
      if (res.success && res.data) {
        if (Array.isArray(res.data)) rawMessages = res.data;
        else if (Array.isArray(res.data.data)) rawMessages = res.data.data;
        else if (Array.isArray(res.data.messages)) rawMessages = res.data.messages;
      }

      const apiMessages: ChatMessage[] = rawMessages.map((msg: any) => {
        const base = {
          id: msg.id,
          content: msg.content || '',
          timestamp: new Date(msg.created_at),
          isFromCache: true,
        } as Partial<ChatMessage>;

        if (msg.role === 'user') {
          return { ...base, type: 'user' } as ChatMessage;
        }

        if (msg.role === 'assistant') {
          let metadata = msg.metadata;
          if (typeof metadata === 'string') {
            try { metadata = JSON.parse(metadata); } catch (e) { metadata = {}; }
          }

          const agentResults = metadata?.agent_results || [];
          const agentResponses: AgentResponse[] = agentResults.map((r: any) => ({
            agentId: r.agent_id || r.agentId || 'unknown',
            agentName: r.agent_name || r.agentName || 'Assistant',
            content: r.response || r.content || '',
            timestamp: new Date(msg.created_at),
            status: r.error ? 'error' : 'success',
            metadata: {
              usage: r.usage || {
                total_tokens: msg.tokens_used || 0,
                prompt_tokens: r.usage?.prompt_tokens || 0,
                completion_tokens: r.usage?.completion_tokens || 0
              },
              domain: r.agent_domain || r.domain,
              model_used: metadata?.model || r.model,
              execution_time_ms: r.execution_time_ms
            },
          }));

          if (agentResponses.length === 0 && msg.content) {
            agentResponses.push({
              agentId: metadata?.agent_id || 'default',
              agentName: metadata?.agent_name || 'Assistant',
              content: msg.content,
              timestamp: new Date(msg.created_at),
              status: 'success',
              metadata: {
                usage: { total_tokens: msg.tokens_used || 0, prompt_tokens: 0, completion_tokens: msg.tokens_used || 0 }
              }
            });
          }

          return {
            ...base,
            type: 'agent',
            agentResponses,
            executionMode: metadata?.orchestration_mode || 'sequential',
            markdownOutput: metadata?.markdown_output || msg.content,
            finalOutput: metadata?.final_output || msg.content,
          } as ChatMessage;
        }

        return { ...base, type: 'user' } as ChatMessage;
      });

      setHasStarted(apiMessages.length > 0);
      return apiMessages;
    }
  });

  // Provide a setter that mutates the React Query cache so streaming agents can append logic
  const setMessages = useCallback((updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    queryClient.setQueryData(['messages', conversationId], (old: ChatMessage[] = []) => {
      const newMessages = typeof updater === 'function' ? updater(old) : updater;
      if (newMessages.length > 0) setHasStarted(true);
      return newMessages;
    });
  }, [queryClient, conversationId]);

  const loadConversationMessages = useCallback(async (convId: string, force: boolean = false) => {
    if (!force) isActiveOrchestrationRef.current = false;
    
    // Changing the conversation ID instantly triggers the useQuery above, 
    // retrieving cached versions immediately or fetching automatically.
    setConversationId(convId);
    
    if (force && convId === conversationId) {
      await refetch();
    }
  }, [conversationId, refetch]);

  // Backward compatibility mock for messageCache
  const messageCache = new Map<string, ChatMessage[]>();
  if (conversationId) messageCache.set(conversationId, messages);

  return {
    messages,
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