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

  const loadConversationMessages = useCallback(async (convId: string, force: boolean = false) => {
    // Don't load messages if we're in the middle of an orchestration
    if (isActiveOrchestrationRef.current && !force) {
      logger.debug('Skipping load - active orchestration in progress', { conversationId: convId });
      return;
    }

    try {
      setIsLoading(true);
      logger.info('Loading messages for conversation', { conversationId: convId });
      
      const res = await apiClient.getMessages(convId, 1, 50);
      
      if (res.success && res.data) {
        // BACKEND RETURNS: Array of message objects with role: 'user' | 'assistant'
        const apiMessages: ChatMessage[] = res.data.map((msg: any) => {
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

        // Only set messages if we got actual data OR if forced
        if (apiMessages.length > 0 || force) {
          logger.info('Loaded messages', { conversationId: convId, messageCount: apiMessages.length });
          setMessages(apiMessages);
          setHasStarted(apiMessages.length > 0);
          messageCache.set(convId, apiMessages);
        } else {
          logger.debug('No messages loaded, keeping current state', { conversationId: convId });
        }
      } else {
        logger.debug('Load failed or no data, keeping current messages', { conversationId: convId });
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

  useEffect(() => {
    if (!conversationId) return;
    
    // Skip loading for temporary conversations (optimistic UI)
    const isTempConversation = conversationId.startsWith('temp-');
    if (isTempConversation) {
      logger.debug('Skipping load for temporary conversation', { conversationId });
      return;
    }
    
    const cached = messageCache.get(conversationId);
    if (cached && cached.length > 0) {
      logger.debug('Using cached messages', { conversationId, messageCount: cached.length });
      setMessages(cached);
      setHasStarted(cached.length > 0);
    } else if (messages.length === 0) {
      // Only load if we don't have messages
      logger.debug('No cached messages, loading', { conversationId });
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
    isActiveOrchestrationRef,
    messageCache,
  };
}