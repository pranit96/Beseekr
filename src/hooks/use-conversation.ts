// src/hooks/use-conversation.ts - FIXED TO MATCH YOUR BACKEND
import { useCallback, useEffect, useState, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage, AgentResponse } from '@/types/agent';
import { createLogger } from '@/services/logging';

const logger = createLogger('useConversation');

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

  // Abort controller to cancel in-flight message fetches when switching conversations
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadConversationMessages = useCallback(async (convId: string, force: boolean = false) => {
    // Cancel any in-flight message fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Reset stale orchestration ref when explicitly loading a conversation
    // This prevents a stuck ref from blocking loads permanently
    if (!force) {
      isActiveOrchestrationRef.current = false;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setIsLoading(true);
      // Clear messages immediately when switching conversations
      setMessages([]);
      setHasStarted(false);

      logger.info('Loading messages for conversation', { conversationId: convId });

      const res = await apiClient.getMessages(convId, 1, 50);

      console.log('[useConversation] getMessages raw response:', JSON.stringify(res).substring(0, 500));

      // Handle different response shapes:
      // Backend might return { success, data: [...] } or { success, data: { data: [...], pagination: {...} } }
      let rawMessages: any[] = [];
      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          rawMessages = res.data;
        } else if (Array.isArray(res.data.data)) {
          rawMessages = res.data.data;
        } else if (Array.isArray(res.data.messages)) {
          rawMessages = res.data.messages;
        }
      }

      console.log('[useConversation] Parsed messages count:', rawMessages.length);

      // Check if this load was cancelled (user switched to another conversation)
      if (controller.signal.aborted) {
        logger.debug('Load cancelled - conversation switched', { conversationId: convId });
        return;
      }

      if (res.success) {
        // BACKEND RETURNS: Array of message objects with role: 'user' | 'assistant'
        const apiMessages: ChatMessage[] = rawMessages.map((msg: any) => {
          const base = {
            id: msg.id,
            content: msg.content || '', // Backend already decrypted this
            timestamp: new Date(msg.created_at),
            isFromCache: true,
          } as Partial<ChatMessage>;

          // USER MESSAGE
          if (msg.role === 'user') {
            return {
              ...base,
              type: 'user'
            } as ChatMessage;
          }

          // AGENT/ASSISTANT MESSAGE
          if (msg.role === 'assistant') {
            // Parse metadata if it's a string
            let metadata = msg.metadata;
            if (typeof metadata === 'string') {
              try {
                metadata = JSON.parse(metadata);
              } catch (e) {
                logger.warn('Failed to parse metadata', { error: e });
                metadata = {};
              }
            }

            // Extract agent responses from metadata.agent_results
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

            // If no agent_results in metadata, create a single response from content
            if (agentResponses.length === 0 && msg.content) {
              agentResponses.push({
                agentId: metadata?.agent_id || 'default',
                agentName: metadata?.agent_name || 'Assistant',
                content: msg.content,
                timestamp: new Date(msg.created_at),
                status: 'success',
                metadata: {
                  usage: {
                    total_tokens: msg.tokens_used || 0,
                    prompt_tokens: 0,
                    completion_tokens: msg.tokens_used || 0
                  }
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

          // Fallback to user message
          return { ...base, type: 'user' } as ChatMessage;
        });

        // Always set messages (even empty for new conversations)
        logger.info('Loaded messages', { conversationId: convId, messageCount: apiMessages.length });
        setMessages(apiMessages);
        setHasStarted(apiMessages.length > 0);
        messageCache.set(convId, apiMessages);
      } else {
        logger.warn('Load failed, API returned unsuccessful', { conversationId: convId, error: res.error });
      }
    } catch (err: any) {
      logger.error('Error loading messages', { conversationId: convId, error: err.message });

      // If conversation not found (404), emit event to remove it from list
      if (err.message?.includes('not found') || err.message?.includes('404') || err.message?.includes('unauthorized')) {
        logger.warn('Conversation not found or unauthorized, emitting removal event', { conversationId: convId });
        window.dispatchEvent(new CustomEvent('conversation-not-found', { detail: { conversationId: convId } }));
      } else {
        // Only show toast for non-404 errors
        toast({
          title: 'Failed to load conversation messages',
          description: err?.message || String(err),
          variant: 'destructive',
        });
      }
      // Don't clear messages on error
    } finally {
      setIsLoading(false);
    }
  }, [toast, messageCache]);

  // NOTE: We intentionally do NOT auto-load messages on conversationId change here.
  // ChatInterface.tsx is the single source of truth for triggering loads.
  // This avoids the double-loading race condition that was causing messages to disappear.

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