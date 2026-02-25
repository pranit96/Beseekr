// src/components/ChatInterface.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Workflow, Lock, LockOpen, X, Sparkles, WifiOff, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AgentSelector } from './AgentSelector';
import MessageList from './MessageList';
import { AgentWorkflowDialog } from './AgentWorkflowDialog';
import { WelcomeScreen } from './WelcomeScreen';
import { ExportChatDialog } from './ExportChatDialog';
import type { ChatMessage, ExecutionMode, Agent, AgentResponse, PerAgentSummary } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';
import { useConversation } from '@/hooks/use-conversation';
import useOrchestration from '@/hooks/use-orchestration';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { createLogger } from '@/services/logging';

const logger = createLogger('ChatInterface');

/**
 * Generate a ChatGPT-style conversation title from the user's first message.
 * Strips filler phrases, capitalizes, and truncates at word boundary.
 */
function generateConversationTitle(message: string, agents: Agent[]): string {
  const text = message.trim();
  if (!text) {
    return `Chat with ${agents.map(a => a.name).join(', ')}`;
  }

  // Strip common filler phrases
  let clean = text
    .replace(/^(hey|hi|hello|can you|could you|please|I want to|I need to|I'd like to|help me|tell me|show me|explain|write|create|make|generate)\s+/i, '')
    .replace(/[.!?,;]+$/, '')
    .trim();

  if (!clean) clean = text;

  // Capitalize first letter of each significant word
  const title = clean
    .split(/\s+/)
    .map((w, i) => {
      // Don't capitalize small words in the middle
      if (i > 0 && ['a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but', 'is', 'with'].includes(w.toLowerCase())) {
        return w.toLowerCase();
      }
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');

  // Truncate at word boundary, max 50 chars
  if (title.length <= 50) return title;

  const truncated = title.substring(0, 50);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 20 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

export const ChatInterface: React.FC<{
  agents: Agent[];
  activeConversationId?: string;
  onConversationChange?: (conversationId: string | null) => void;
  onConversationCreated?: (conversationId: string) => void;
}> = ({ agents, activeConversationId, onConversationChange, onConversationCreated }) => {
  const [input, setInput] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('sequential');
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [saveToConversation, setSaveToConversation] = useState(true);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [preparingMessage, setPreparingMessage] = useState(false);
  const [orchestrationProgress, setOrchestrationProgress] = useState<{ step: number; total: number; agent_name?: string } | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const cancelRef = useRef<null | (() => void)>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const retryMessageRef = useRef<string>('');
  const isCreatingConversationRef = useRef(false);

  // rate-limit UI
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);
  const rateLimitTimerRef = useRef<number | null>(null);

  const { toast } = useToast();
  const { socketConnected } = useAuth();

  // conversation hook
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

  // orchestration helper
  const { execute, ensureConnected, getStatus } = useOrchestration();

  // Monitor connection status from auth context
  useEffect(() => {
    setConnectionStatus(socketConnected ? 'connected' : 'disconnected');
  }, [socketConnected]);

  // Also monitor from orchestration hook
  useEffect(() => {
    const checkConnection = setInterval(() => {
      const status = getStatus();
      if (!socketConnected) {
        setConnectionStatus('disconnected');
      } else {
        setConnectionStatus(status.connected ? 'connected' : 'connecting');
      }
    }, 2000);

    return () => clearInterval(checkConnection);
  }, [getStatus, socketConnected]);

  // Auto-focus textarea
  useEffect(() => {
    if (!isExecuting && !preparingMessage && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExecuting, hasStarted, preparingMessage]);

  // cleanup rate-limit timer
  useEffect(() => {
    return () => {
      if (rateLimitTimerRef.current) {
        window.clearInterval(rateLimitTimerRef.current);
        rateLimitTimerRef.current = null;
      }
    };
  }, []);

  // Debug: Monitor render state
  useEffect(() => {
    logger.debug('Render state changed', {
      messagesCount: messages.length,
      isExecuting,
      preparingMessage,
      hasStarted,
      shouldShowWelcome: messages.length === 0 && !isExecuting && !preparingMessage
    });
  }, [messages.length, isExecuting, preparingMessage, hasStarted]);

  // sync prop -> internal conversationId (SINGLE source of truth for loading)
  useEffect(() => {
    if (!activeConversationId) return;

    // Skip loading for temporary conversations (optimistic UI)
    const isTempConversation = activeConversationId.startsWith('temp-');

    if (isTempConversation) {
      logger.debug('Skipping message load for temporary conversation', { conversationId: activeConversationId });
      setConversationId(activeConversationId);
      return;
    }

    // Always update the internal conversation ID
    setConversationId(activeConversationId);

    // Load messages for this conversation
    // This is the ONLY place that triggers loadConversationMessages on conversation switch.
    // The useConversation hook no longer auto-loads on conversationId change.
    logger.info('Loading messages for conversation', { conversationId: activeConversationId });
    loadConversationMessages(activeConversationId);
  }, [activeConversationId]);

  const startRateLimitCountdown = (retryAfterSeconds: number) => {
    const until = Date.now() + retryAfterSeconds * 1000;
    setRateLimitedUntil(until);
    if (rateLimitTimerRef.current) {
      window.clearInterval(rateLimitTimerRef.current);
      rateLimitTimerRef.current = null;
    }
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
    if (!input.trim()) return;

    if (selectedAgents.length === 0) {
      toast({
        title: 'No agents selected',
        description: 'Please select at least one agent before sending a message.',
        variant: 'destructive'
      });
      return;
    }

    if (!socketConnected) {
      toast({
        title: 'Not connected',
        description: 'Please wait for connection to establish.',
        variant: 'destructive'
      });
      return;
    }

    if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
      toast({
        title: 'Rate limited',
        description: 'Please wait before sending another orchestration.',
        variant: 'destructive'
      });
      return;
    }

    const messageText = input;
    setInput('');
    retryMessageRef.current = messageText;

    // Mark that we're starting an orchestration
    if (isActiveOrchestrationRef) {
      isActiveOrchestrationRef.current = true;
    }

    // Show preparing state
    setPreparingMessage(true);
    setHasStarted(true);

    try {
      let convId = conversationId;

      // Check if we have a temporary conversation ID that needs to be replaced
      const isTempConversation = convId?.startsWith('temp-');

      // STEP 1: Check if background conversation creation already succeeded
      if (isTempConversation && convId) {
        // Check sessionStorage for the real conversation ID
        const realId = sessionStorage.getItem(`conv_mapping_${convId}`);
        if (realId) {
          logger.info('Using background-created conversation', { tempId: convId, realId });
          convId = realId;
          setConversationId(realId);

          // Clean up the mapping
          sessionStorage.removeItem(`conv_mapping_${convId}`);

          // Notify parent components
          setTimeout(() => {
            onConversationChange?.(realId);
            onConversationCreated?.(realId);
          }, 100);
        }
      }

      // STEP 2: Create conversation if needed (no valid conversation ID exists)
      if (saveToConversation && (!convId || isTempConversation) && !isCreatingConversationRef.current) {
        isCreatingConversationRef.current = true;

        try {
          const { apiClient } = await import('@/lib/api');

          let title = generateConversationTitle(messageText, selectedAgents);


          logger.info('Creating new conversation (background creation may have failed)', {
            title,
            replacingTemp: isTempConversation,
            tempId: isTempConversation ? convId : undefined
          });

          const createRes = await apiClient.createConversation({
            agent_id: selectedAgents[0]?.id || null,
            title: title,
          });

          if (createRes.success && createRes.data?.id) {
            convId = createRes.data.id;
            setConversationId(convId);

            // Important: Call these callbacks AFTER we've added messages to UI
            // to prevent race conditions with message loading
            setTimeout(() => {
              onConversationChange?.(convId);
              onConversationCreated?.(convId);
            }, 200);

            logger.info('Conversation created successfully', {
              conversationId: convId,
              wasTemp: isTempConversation
            });
          }
        } catch (err) {
          logger.error('Failed to create conversation', { error: err });
          // Continue without conversation saving
        } finally {
          isCreatingConversationRef.current = false;
        }
      }

      // Small delay to ensure state is fully updated
      await new Promise(resolve => setTimeout(resolve, 50));

      // STEP 2: NOW create UI messages with proper conversation context
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        type: 'user',
        content: messageText,
        timestamp: new Date(),
        isFromCache: false,
      };

      const agentResponsesInitial: AgentResponse[] = selectedAgents.map(a => ({
        agentId: a.id,
        agentName: a.name,
        content: '',
        timestamp: new Date(),
        status: 'pending',
        metadata: {
          domain: a.domain
        }
      }));

      const agentMessageId = `msg-${Date.now()}-agents`;
      const agentMessage: ChatMessage = {
        id: agentMessageId,
        type: 'agent',
        content: '',
        timestamp: new Date(),
        agentResponses: agentResponsesInitial,
        executionMode,
        markdownOutput: '',
        finalOutput: '',
        isFromCache: false,
      };

      // Add messages to UI - Force immediate state update
      setMessages(prev => {
        const newMessages = [...prev, userMessage, agentMessage];
        logger.debug('Messages added to state', {
          totalMessages: newMessages.length,
          userMessageId: userMessage.id,
          agentMessageId: agentMessage.id
        });
        return newMessages;
      });

      // Ensure UI updates before starting orchestration
      setPreparingMessage(false);
      setIsExecuting(true);
      setIsLoadingLocal(true);

      logger.debug('State updated for orchestration', { isExecuting: true, preparingMessage: false });

      // Force React to process state updates
      await new Promise(resolve => setTimeout(resolve, 100));

      logger.info('Starting orchestration', {
        agentCount: selectedAgents.length,
        mode: executionMode,
        conversationId: convId
      });

      // STEP 3: Execute orchestration with fully initialized state
      const payload: any = {
        agent_ids: selectedAgents.map(a => a.id),
        message: messageText,
        mode: executionMode,
        save_to_conversation: saveToConversation,
      };

      if (saveToConversation && convId) payload.conversation_id = convId;

      ensureConnected();
      cancelRef.current = null;

      await execute(payload, {
        onAck: (d: any) => {
          logger.debug('Orchestration acknowledged', { data: d });
        },
        onToken: (agentId: string, token: string) => {
          // Update immediately for smooth streaming
          logger.debug('Token received', { agentId, tokenLength: token.length });
          setMessages(prev => prev.map(m => {
            if (m.id !== agentMessageId) return m;
            return {
              ...m,
              agentResponses: m.agentResponses?.map(ar => {
                if (ar.agentId !== agentId) return ar;
                return {
                  ...ar,
                  content: (ar.content || '') + token,
                  status: 'pending'
                };
              }) || []
            } as ChatMessage;
          }));
        },
        onAgentDone: (agentId: string, usage: any) => {
          logger.info('Agent completed', { agentId, usage });
          setMessages(prev => prev.map(m => {
            if (m.id !== agentMessageId) return m;
            return {
              ...m,
              agentResponses: m.agentResponses?.map(ar =>
                ar.agentId === agentId
                  ? { ...ar, status: 'success', metadata: { ...ar.metadata, usage } }
                  : ar
              ) || []
            } as ChatMessage;
          }));
        },
        onAgentError: (agentId: string, errorMsg: any) => {
          logger.error('Agent error', { agentId, error: errorMsg });
          setMessages(prev => prev.map(m => {
            if (m.id !== agentMessageId) return m;
            return {
              ...m,
              agentResponses: m.agentResponses?.map(ar =>
                ar.agentId === agentId
                  ? { ...ar, status: 'error', content: String(errorMsg || 'Error generating response') }
                  : ar
              ) || []
            } as ChatMessage;
          }));
        },
        onWarning: (warn: any) => {
          logger.warn('Orchestration warning', { warning: warn });
        },
        onRateLimit: (rl) => {
          const retry = Number(rl?.retryAfter ?? 30);
          toast({
            title: 'Rate Limit',
            description: `Too many requests. Retry in ${retry} seconds.`,
            variant: 'default',
          });
          startRateLimitCountdown(retry);
        },

        onCancelReady: (cancelFn: () => void) => {
          cancelRef.current = cancelFn;
        },
        onProgress: (progressData) => {
          logger.debug('Orchestration progress', progressData);
          setOrchestrationProgress({
            step: progressData.step,
            total: progressData.total,
            agent_name: progressData.agent_name,
          });
        },
        onCancelled: (data) => {
          logger.info('Orchestration cancelled confirmed', data);
          setOrchestrationProgress(null);
        },
        onDone: (doneData: any) => {
          logger.info('Orchestration completed', { data: doneData });
          setOrchestrationProgress(null);
          setMessages(prev => prev.map(m => {
            if (m.id !== agentMessageId) return m;
            const updatedResponses = m.agentResponses?.map(ar =>
              ar.status === 'pending' ? { ...ar, status: 'success' } : ar
            ) || [];
            return {
              ...m,
              agentResponses: updatedResponses,
              markdownOutput: doneData.final_markdown || m.markdownOutput,
              finalOutput: doneData.final_markdown || m.finalOutput,
              content: doneData.final_markdown || m.content,
              perAgentSummary: doneData.per_agent_summary || undefined,
            } as ChatMessage;
          }));
        },
        onError: (err: any) => {
          logger.error('Orchestration error', { error: err });

          if (err?.error?.includes('rate') || err?.error?.includes('Too many')) {
            return;
          }

          setMessages(prev => prev.map(m => {
            if (m.id !== agentMessageId) return m;
            return {
              ...m,
              agentResponses: m.agentResponses?.map(ar =>
                ar.status === 'pending'
                  ? { ...ar, status: 'error', content: err?.error || 'Orchestration failed' }
                  : ar
              ) || []
            } as ChatMessage;
          }));

          toast({
            title: 'Execution failed',
            description: err?.error || 'Orchestration failed. Please try again.',
            variant: 'destructive'
          });
        }
      });

    } catch (err: any) {
      logger.error('Submit error', { error: err.message });
      setPreparingMessage(false);

      if (!err?.message?.includes('rate') && !err?.message?.includes('Too many')) {
        toast({
          title: 'Error',
          description: err?.message || 'Failed to execute agents. Please check your connection.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsExecuting(false);
      setIsLoadingLocal(false);
      setPreparingMessage(false);
      setOrchestrationProgress(null);
      cancelRef.current = null;

      // Mark orchestration as complete
      if (isActiveOrchestrationRef) {
        isActiveOrchestrationRef.current = false;
      }
    }
  };

  const handleCancelExecution = () => {
    if (cancelRef.current) {
      // Show cancelling state
      setIsCancelling(true);

      try {
        cancelRef.current();

        // Update all pending agent responses to show cancelled status
        setMessages(prev => prev.map(m => {
          if (m.type === 'agent' && m.agentResponses) {
            return {
              ...m,
              agentResponses: m.agentResponses.map(ar =>
                ar.status === 'pending'
                  ? {
                    ...ar,
                    status: 'error',
                    content: ar.content
                      ? `${ar.content}\n\n*[Cancelled by user]*`
                      : 'Cancelled by user'
                  }
                  : ar
              )
            } as ChatMessage;
          }
          return m;
        }));

        toast({
          title: 'Cancelled',
          description: 'Request cancelled successfully',
          variant: 'default'
        });
      } catch (e) {
        logger.error('Cancel error', { error: e });
      }

      // Clean up states with a slight delay for visual feedback
      setTimeout(() => {
        cancelRef.current = null;
        setIsExecuting(false);
        setIsLoadingLocal(false);
        setPreparingMessage(false);
        setIsCancelling(false);

        // Mark orchestration as complete
        if (isActiveOrchestrationRef) {
          isActiveOrchestrationRef.current = false;
        }
      }, 300);
    }
  };

  const handleWorkflowConfirm = (ordered: Agent[]) => setSelectedAgents(ordered);

  const handleRetryMessage = useCallback(async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex > 0) {
      const previousMessage = messages[messageIndex - 1];
      if (previousMessage.type === 'user') {
        // Get the failed agent message
        const failedAgentMessage = messages[messageIndex];

        // Store the message text
        const messageText = previousMessage.content;

        // Get agents that were used (or use currently selected agents)
        const agentsToRetry = failedAgentMessage.agentResponses?.map(ar =>
          selectedAgents.find(a => a.id === ar.agentId)
        ).filter(Boolean) as Agent[] || selectedAgents;

        if (agentsToRetry.length === 0) {
          toast({
            title: 'Cannot retry',
            description: 'No agents available for retry. Please select agents first.',
            variant: 'destructive'
          });
          return;
        }

        // Set up for retry
        setInput(messageText);
        setSelectedAgents(agentsToRetry);

        toast({
          title: 'Ready to retry',
          description: 'Message loaded. Click Send to retry or edit first.',
        });

        // Auto-focus textarea
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
      }
    }
  }, [messages, toast, selectedAgents, setInput]);

  const togglePrivateChat = () => {
    const newSave = !saveToConversation;
    setSaveToConversation(newSave);

    if (!newSave) {
      setConversationId(null);
      setMessages([]);
      setHasStarted(false);
      onConversationChange?.(null);
      toast({
        title: 'Private mode enabled',
        description: 'Your messages will not be saved to conversation history.',
      });
    } else {
      setConversationId(null);
      toast({
        title: 'Private mode disabled',
        description: 'Messages will now be saved to your conversation history.',
      });
    }
  };

  const sendDisabled = isLoadingLocal || isExecuting || isCancelling || preparingMessage || (!!rateLimitedUntil && Date.now() < rateLimitedUntil) || !socketConnected;

  // Connection Status Banner Component - Only show on error
  const ConnectionBanner = () => {
    if (connectionStatus !== 'disconnected') return null;

    return (
      <div className="mb-4 p-3 rounded-lg border bg-destructive/10 border-destructive/20 text-destructive flex items-center gap-3">
        <WifiOff className="w-4 h-4" />
        <div className="flex-1">
          <p className="text-sm font-medium">Connection lost</p>
          <p className="text-xs opacity-80">Attempting to reconnect...</p>
        </div>
      </div>
    );
  };

  // Preparing Message Banner
  const PreparingBanner = () => {
    if (!preparingMessage) return null;

    return (
      <div className="mb-4 p-3 rounded-lg border bg-primary/10 border-primary/20 flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium text-primary">Preparing your message...</p>
          <p className="text-xs text-primary/80">Setting up conversation and initializing agents</p>
        </div>
      </div>
    );
  };

  // Cancelling Banner
  const CancellingBanner = () => {
    if (!isCancelling) return null;

    return (
      <div className="mb-4 p-3 rounded-lg border bg-orange-500/10 border-orange-500/20 flex items-center gap-3 animate-pulse">
        <Loader2 className="w-4 h-4 animate-spin text-orange-600 dark:text-orange-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Cancelling request...</p>
          <p className="text-xs text-orange-600/80 dark:text-orange-400/80">Stopping all agent operations</p>
        </div>
      </div>
    );
  };

  // Progress Banner for sequential orchestration
  const ProgressBanner = () => {
    if (!orchestrationProgress || !isExecuting) return null;

    const percentage = Math.round((orchestrationProgress.step / orchestrationProgress.total) * 100);

    return (
      <div className="mb-4 p-3 rounded-lg border bg-blue-500/10 border-blue-500/20 flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Step {orchestrationProgress.step} of {orchestrationProgress.total}
              {orchestrationProgress.agent_name && (
                <span className="ml-1 font-normal opacity-80">— {orchestrationProgress.agent_name}</span>
              )}
            </p>
            <span className="text-xs text-blue-600/70 dark:text-blue-400/70">{percentage}%</span>
          </div>
          <div className="w-full bg-blue-500/20 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  // Selected Agents Display Component
  const SelectedAgentsDisplay = () => {
    if (selectedAgents.length === 0) return null;

    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-lg border border-primary/20">
        <span className="text-xs font-medium text-primary whitespace-nowrap">Selected:</span>
        <div className="flex flex-wrap gap-1">
          {selectedAgents.map((agent, index) => (
            <Badge
              key={agent.id}
              variant="secondary"
              className="text-xs font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
            >
              {agent.name}
              {selectedAgents.length > 1 && index < selectedAgents.length - 1 && ','}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full max-w-[1800px] 2xl:max-w-[2200px] mx-auto w-full overflow-hidden">
      {messages.length === 0 && !isExecuting && !preparingMessage ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          <ConnectionBanner />
          <PreparingBanner />
          <CancellingBanner />
          <ProgressBanner />

          <WelcomeScreen
            onPromptSelect={(prompt) => {
              setInput(prompt);
              textareaRef.current?.focus();
            }}
          />

          <div className="flex flex-col items-center gap-4 w-full max-w-4xl px-4">
            <SelectedAgentsDisplay />

            <div className="w-full">
              <div className="relative flex items-center gap-3 rounded-xl bg-muted/50 border border-border/50 focus-within:border-primary transition px-4 py-3">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Type your message here..."
                  className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-[200px]"
                  disabled={sendDisabled}
                  rows={1}
                  aria-label="Message input"
                  aria-describedby="message-input-help"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!input.trim() || sendDisabled}
                  size="icon"
                  className="h-10 w-10 rounded-lg bg-primary hover:bg-primary/90 transition flex-shrink-0"
                  aria-label={preparingMessage ? "Preparing message" : "Send message"}
                  title={preparingMessage ? "Preparing..." : "Send message (Enter)"}
                >
                  {preparingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>

            <div className="w-full flex items-center gap-3">
              <div className="flex-1">
                <AgentSelector
                  agents={agents}
                  selectedAgents={selectedAgents}
                  onAgentsChange={setSelectedAgents}
                />
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  onClick={() => setWorkflowDialogOpen(true)}
                  disabled={selectedAgents.length === 0}
                  variant="outline"
                  size="sm"
                  className="gap-2 whitespace-nowrap"
                  aria-label="Design agent workflow"
                  title="Design custom agent execution workflow"
                >
                  <Workflow className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Design Flow</span>
                  <span className="sm:hidden">Flow</span>
                </Button>

                <div className="flex items-center gap-1 px-2 py-1 rounded-lg border bg-muted/30">
                  {(['sequential', 'parallel'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setExecutionMode(mode)}
                      className={`px-2 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${executionMode === mode
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      {mode === 'sequential' ? 'Seq' : 'Par'}
                    </button>
                  ))}
                </div>

                <button
                  onClick={togglePrivateChat}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition whitespace-nowrap ${saveToConversation
                    ? 'bg-background border-border hover:bg-muted/50 text-muted-foreground'
                    : 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90'
                    }`}
                  aria-label={saveToConversation ? "Private mode off - messages will be saved" : "Private mode on - messages will not be saved"}
                  aria-pressed={!saveToConversation}
                  role="switch"
                  aria-checked={!saveToConversation}
                  title={saveToConversation ? "Enable private mode" : "Disable private mode"}
                >
                  {saveToConversation ? <LockOpen className="w-3 h-3" aria-hidden="true" /> : <Lock className="w-3 h-3" aria-hidden="true" />}
                  <span>Private</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-2 md:px-6 py-4">
            <div className="max-w-5xl 2xl:max-w-6xl mx-auto w-full">
              {/* Chat header with export */}
              <div className="flex items-center justify-end mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExportDialogOpen(true)}
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  disabled={messages.length === 0}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </Button>
              </div>

              <ConnectionBanner />
              <PreparingBanner />
              <CancellingBanner />
              <ProgressBanner />

              <MessageList
                messages={messages}
                isLoading={isLoadingLocal || isExecuting}
                onRetryMessage={handleRetryMessage}
              />
            </div>
          </div>

          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm p-3 sm:p-4 border-t border-border/50 space-y-3">
            <div className="max-w-5xl 2xl:max-w-6xl mx-auto w-full space-y-3">
              <SelectedAgentsDisplay />

              <div className="relative flex items-center gap-2 sm:gap-3 rounded-xl bg-muted/50 border border-border/50 focus-within:border-primary transition px-3 sm:px-4 py-2 sm:py-3">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Message beseekr..."
                  className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-[200px] text-sm sm:text-base"
                  disabled={sendDisabled}
                  rows={1}
                />
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isCancelling ? (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg"
                      disabled
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </Button>
                  ) : isExecuting ? (
                    <Button
                      variant="destructive"
                      onClick={handleCancelExecution}
                      size="icon"
                      className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg hover:bg-destructive/90 transition"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={!input.trim() || sendDisabled}
                      size="icon"
                      className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-primary hover:bg-primary/90 transition"
                      title={!socketConnected ? 'Waiting for connection...' : preparingMessage ? 'Preparing message...' : undefined}
                    >
                      {preparingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <AgentSelector
                    agents={agents}
                    selectedAgents={selectedAgents}
                    onAgentsChange={setSelectedAgents}
                  />
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    onClick={() => setWorkflowDialogOpen(true)}
                    disabled={selectedAgents.length === 0}
                    variant="outline"
                    size="sm"
                    className="gap-2 whitespace-nowrap"
                  >
                    <Workflow className="w-4 h-4" />
                    <span className="hidden sm:inline">Design Flow</span>
                    <span className="sm:hidden">Flow</span>
                  </Button>

                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg border bg-muted/30">
                    {(['sequential', 'parallel'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setExecutionMode(mode)}
                        className={`px-2 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${executionMode === mode
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        {mode === 'sequential' ? 'Seq' : 'Par'}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={togglePrivateChat}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition whitespace-nowrap ${saveToConversation
                      ? 'bg-background border-border hover:bg-muted/50 text-muted-foreground'
                      : 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90'
                      }`}
                  >
                    {saveToConversation ? <LockOpen className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    <span>Private</span>
                  </button>
                </div>
              </div>

              <div className="min-h-[20px]">
                {rateLimitedUntil && Date.now() < rateLimitedUntil ? (
                  <div className="text-xs text-destructive text-center animate-pulse">
                    Rate limit active — please wait {Math.ceil((rateLimitedUntil - Date.now()) / 1000)}s
                  </div>
                ) : isCancelling ? (
                  <div className="text-xs text-orange-600 dark:text-orange-400 text-center flex items-center justify-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Cancelling request...</span>
                  </div>
                ) : preparingMessage ? (
                  <div className="text-xs text-primary text-center flex items-center justify-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Preparing your message...</span>
                  </div>
                ) : isExecuting ? (
                  <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span>Processing with</span>
                    <span className="text-primary font-medium">
                      {selectedAgents.map(a => a.name).join(', ')}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}

      <AgentWorkflowDialog
        open={workflowDialogOpen}
        onOpenChange={setWorkflowDialogOpen}
        agents={agents}
        selectedAgents={selectedAgents}
        onConfirm={handleWorkflowConfirm}
      />

      <ExportChatDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        messages={messages}
        conversationTitle={undefined}
      />
    </div>
  );
};

export default ChatInterface;