// src/hooks/use-conversation.ts
import { useCallback, useEffect, useState, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage, AgentResponse } from '@/types/agent';

interface UseConversationReturn {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  conversationId: string | null;
  setConversationId: React.Dispatch<React.SetStateAction<string | null>>;
  loadConversationMessages: (convId: string, force?: boolean) => Promise<void>;
  isLoading: boolean;
  hasStarted: boolean;
  setHasStarted: React.Dispatch<React.SetStateAction<boolean>>;
  isActiveOrchestrationRef: React.MutableRefObject<boolean>;
  messageCache: Map<string, ChatMessage[]>;
}

export function useConversation(initialConversationId?: string): UseConversationReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null);
  const [messageCache] = useState<Map<string, ChatMessage[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const { toast } = useToast();
  
  // Track if we're currently in an active orchestration
  const isActiveOrchestrationRef = useRef(false);

  const loadConversationMessages = useCallback(async (convId: string, force: boolean = false) => {
    // Don't load messages if we're in the middle of an orchestration
    // This prevents clearing messages that were just added
    if (isActiveOrchestrationRef.current && !force) {
      console.log('[useConversation] Skipping load - active orchestration in progress');
      return;
    }

    try {
      setIsLoading(true);
      console.log('[useConversation] Loading messages for conversation:', convId);
      
      const res = await apiClient.getMessages(convId, 1, 50);
      if (res.success && res.data) {
        const apiMessages: ChatMessage[] = res.data.map((msg: any) => {
          const base = {
            id: msg.id,
            content: msg.content,
            timestamp: new Date(msg.created_at),
            isFromCache: true,
          } as Partial<ChatMessage>;

          if (msg.role === 'user') return { ...base, type: 'user' } as ChatMessage;

          if (msg.role === 'assistant') {
            const agentResponses: AgentResponse[] = (msg.metadata?.agent_results || []).map((r: any) => ({
              agentId: r.agent_id,
              agentName: r.agent_name,
              content: r.response,
              timestamp: new Date(msg.created_at),
              status: r.error ? 'error' : 'success',
              metadata: r,
            }));
            return {
              ...base,
              type: 'agent',
              agentResponses,
              executionMode: msg.metadata?.orchestration_mode || 'sequential',
            } as ChatMessage;
          }

          return { ...base, type: 'user' } as ChatMessage;
        });

        // Only set messages if we got actual data OR if forced
        if (apiMessages.length > 0 || force) {
          console.log('[useConversation] Loaded', apiMessages.length, 'messages');
          setMessages(apiMessages);
          setHasStarted(apiMessages.length > 0);
          messageCache.set(convId, apiMessages);
        } else {
          console.log('[useConversation] No messages loaded, keeping current state');
        }
      } else {
        // Don't clear messages on load failure
        console.log('[useConversation] Load failed or no data, keeping current messages');
      }
    } catch (err: any) {
      console.error('[useConversation] Error loading messages:', err);
      toast({
        title: 'Failed to load conversation messages',
        description: err?.message || String(err),
        variant: 'destructive',
      });
      // Don't clear messages on error
    } finally {
      setIsLoading(false);
    }
  }, [toast, messageCache]);

  useEffect(() => {
    if (!conversationId) return;
    
    const cached = messageCache.get(conversationId);
    if (cached && cached.length > 0) {
      console.log('[useConversation] Using cached messages:', cached.length);
      setMessages(cached);
      setHasStarted(cached.length > 0);
    } else if (messages.length === 0) {
      // Only load if we don't have messages
      console.log('[useConversation] No cached messages, loading...');
      loadConversationMessages(conversationId);
    }
  }, [conversationId]);

  return {
    messages,
    setMessages,
    conversationId,
    setConversationId,
    loadConversationMessages,
    isLoading,
    hasStarted,
    setHasStarted,
    isActiveOrchestrationRef, // Export this so ChatInterface can set it
    messageCache, // Export cache for deletion
  };
}