// src/hooks/useConversation.ts
import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage, AgentResponse } from '@/types/agent';

export function useConversation(initialConversationId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null);
  const [messageCache] = useState<Map<string, ChatMessage[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const { toast } = useToast();

  const loadConversationMessages = useCallback(async (convId: string) => {
    try {
      setIsLoading(true);
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

        setMessages(apiMessages);
        setHasStarted(apiMessages.length > 0);
        messageCache.set(convId, apiMessages);
      } else {
        setMessages([]);
        setHasStarted(false);
      }
    } catch (err: any) {
      toast({
        title: 'Failed to load conversation messages',
        description: err?.message || String(err),
        variant: 'destructive',
      });
      setMessages([]);
      setHasStarted(false);
    } finally {
      setIsLoading(false);
    }
  }, [toast, messageCache]);

  useEffect(() => {
    if (!conversationId) return;
    const cached = messageCache.get(conversationId);
    if (cached) {
      setMessages(cached);
      setHasStarted(cached.length > 0);
    } else {
      loadConversationMessages(conversationId);
    }
  }, [conversationId, loadConversationMessages, messageCache]);

  return {
    messages,
    setMessages,
    conversationId,
    setConversationId,
    loadConversationMessages,
    isLoading,
    hasStarted,
    setHasStarted,
  };
}
