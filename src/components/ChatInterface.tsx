// src/components/ChatInterface.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Workflow, Lock, LockOpen, X, Sparkles, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AgentSelector } from './AgentSelector';
import MessageList from './MessageList';
import { AgentWorkflowDialog } from './AgentWorkflowDialog';
import type { ChatMessage, ExecutionMode, Agent, AgentResponse } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';
import { useConversation } from '@/hooks/use-conversation';
import useOrchestration from '@/hooks/use-orchestration';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { useLogging } from '@/hooks/use-logging';

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
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  
  const cancelRef = useRef<null | (() => void)>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const retryMessageRef = useRef<string>('');
  const isCreatingConversationRef = useRef(false);

  // rate-limit UI
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);
  const rateLimitTimerRef = useRef<number | null>(null);

  const { toast } = useToast();
  const { socketConnected } = useAuth();
  const { debug, info, warn, error: logError } = useLogging('ChatInterface');

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
  } = useConversation(activeConversationId);

  // orchestration helper
  const { execute, ensureConnected, getStatus } = useOrchestration();

  // Monitor connection status from auth context
  useEffect(() => {
    debug('Connection status changed', { socketConnected });
    setConnectionStatus(socketConnected ? 'connected' : 'disconnected');
  }, [socketConnected, debug]);

  // Also monitor from orchestration hook
  useEffect(() => {
    debug('Starting connection status monitoring');
    
    const checkConnection = setInterval(() => {
      const status = getStatus();
      if (!socketConnected) {
        setConnectionStatus('disconnected');
      } else {
        setConnectionStatus(status.connected ? 'connected' : 'connecting');
      }
    }, 2000);

    return () => {
      debug('Cleaning up connection monitoring');
      clearInterval(checkConnection);
    };
  }, [getStatus, socketConnected, debug]);

  // Auto-focus textarea
  useEffect(() => {
    if (!isExecuting && textareaRef.current) {
      textareaRef.current.focus();
      debug('Textarea auto-focused', { isExecuting, hasStarted });
    }
  }, [isExecuting, hasStarted, debug]);

  // cleanup rate-limit timer
  useEffect(() => {
    return () => {
      if (rateLimitTimerRef.current) {
        debug('Cleaning up rate limit timer');
        window.clearInterval(rateLimitTimerRef.current);
        rateLimitTimerRef.current = null;
      }
    };
  }, [debug]);

  // sync prop -> internal conversationId
  useEffect(() => {
    debug('Syncing conversation ID', { activeConversationId });
    setConversationId(activeConversationId ?? null);
    if (activeConversationId) {
      debug('Loading conversation messages', { conversationId: activeConversationId });
      loadConversationMessages(activeConversationId);
    }
  }, [activeConversationId, loadConversationMessages, setConversationId, debug]);

  const startRateLimitCountdown = (retryAfterSeconds: number) => {
    debug('Starting rate limit countdown', { retryAfterSeconds });
    const until = Date.now() + retryAfterSeconds * 1000;
    setRateLimitedUntil(until);
    if (rateLimitTimerRef.current) {
      window.clearInterval(rateLimitTimerRef.current);
      rateLimitTimerRef.current = null;
    }
    rateLimitTimerRef.current = window.setInterval(() => {
      if (Date.now() >= until) {
        debug('Rate limit expired');
        setRateLimitedUntil(null);
        if (rateLimitTimerRef.current) {
          window.clearInterval(rateLimitTimerRef.current);
          rateLimitTimerRef.current = null;
        }
      }
    }, 500);
  };

  const handleSubmit = async () => {
    if (!input.trim()) {
      debug('Submit attempted with empty input');
      return;
    }
    
    if (selectedAgents.length === 0) {
      warn('No agents selected for message submission');
      toast({ 
        title: 'No agents selected', 
        description: 'Please select at least one agent before sending a message.', 
        variant: 'destructive' 
      });
      return;
    }

    if (!socketConnected) {
      warn('Message submission attempted without socket connection');
      toast({
        title: 'Not connected',
        description: 'Please wait for connection to establish.',
        variant: 'destructive'
      });
      return;
    }

    if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
      warn('Rate limited submission attempted', { rateLimitedUntil });
      toast({ 
        title: 'Rate limited', 
        description: 'Please wait before sending another orchestration.', 
        variant: 'destructive' 
      });
      return;
    }

    // Start execution immediately
    debug('Starting message execution', { 
      messageLength: input.length, 
      selectedAgents: selectedAgents.map(a => a.name),
      executionMode 
    });
    
    setIsExecuting(true);
    setHasStarted(true);
    
    const messageText = input;
    setInput('');
    retryMessageRef.current = messageText;

    // Create user message immediately
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: messageText,
      timestamp: new Date(),
      isFromCache: false,
    };
    
    // Create agent message with pending responses immediately
    const agentResponsesInitial: AgentResponse[] = selectedAgents.map(a => ({
      agentId: a.id,
      agentName: a.name,
      content: '', // corresponds to 'response' in your previous code
      timestamp: new Date(),
      status: 'pending',
      metadata: {
        domain: a.domain // maps 'agent_domain' correctly
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

    // Add both messages immediately to show UI
    debug('Adding user and agent messages to UI', { 
      userMessageId: userMessage.id, 
      agentMessageId 
    });
    
    setMessages(prev => [...prev, userMessage, agentMessage]);
    setIsLoadingLocal(true);

    try {
      let convId = conversationId;

      // Create conversation if needed (only once)
      if (saveToConversation && !convId && !isCreatingConversationRef.current) {
        debug('Creating new conversation for message');
        isCreatingConversationRef.current = true;
        
        try {
          const { apiClient } = await import('@/lib/api');

          let title = messageText.trim();
          if (!title) {
            title = `Chat with ${selectedAgents.map(a => a.name).join(', ')}`;
          }
          if (title.length > 50) {
            title = title.substring(0, 47) + '...';
          }
          
          debug('Calling API to create conversation', { title });
          const createRes = await apiClient.createConversation({
            agent_id: selectedAgents[0]?.id || null,
            title: title, 
          });

          if (createRes.success && createRes.data?.id) {
            convId = createRes.data.id;
            debug('Conversation created successfully', { conversationId: convId });
            setConversationId(convId);
            onConversationChange?.(convId);
            onConversationCreated?.(convId);
          } else {
            warn('Failed to create conversation', { response: createRes });
          }
        } catch (err) {
          logError('Failed to create conversation', err as Error);
          // Continue without conversation saving
        } finally {
          isCreatingConversationRef.current = false;
        }
      }

      const payload: any = {
        agent_ids: selectedAgents.map(a => a.id),
        message: messageText,
        mode: executionMode,
        save_to_conversation: saveToConversation,
      };

      if (saveToConversation && convId) {
        payload.conversation_id = convId;
        debug('Including conversation ID in payload', { conversationId: convId });
      }

      ensureConnected();
      cancelRef.current = null;

      debug('Executing orchestration with payload', { 
        agentCount: selectedAgents.length,
        executionMode,
        saveToConversation 
      });

      // Execute orchestration
      await execute(payload, {
        onAck: (d: any) => { 
          info('Orchestration acknowledged', d);
        },
        onToken: (agentId: string, token: string) => {
          debug('Received token for agent', { agentId, tokenLength: token.length });
          // Update immediately for smooth streaming
          setMessages(prev => prev.map(m => {
            if (m.id !== agentMessageId) return m;
            return {
              ...m,
              agentResponses: m.agentResponses?.map(ar => {
                if (ar.agentId !== agentId) return ar;
                return { 
                  ...ar, 
                  content: (ar.content || '') + token,
                  status: 'pending' // Keep pending while streaming
                };
              }) || []
            } as ChatMessage;
          }));
        },
        onAgentDone: (agentId: string, usage: any) => {
          info('Agent execution completed', { agentId, usage });
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
          logError('Agent execution failed', new Error(`Agent ${agentId}: ${errorMsg}`));
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
          warn('Orchestration warning received', warn);
        },
        onRateLimit: (rl: any) => {
          const retry = Number(rl?.retryAfter ?? rl?.retry_after ?? rl?.retry ?? 10);
          warn('Rate limit encountered', { retryAfter: retry, details: rl });
          startRateLimitCountdown(retry);
          toast({ 
            title: 'Rate limit', 
            description: `Too many requests. Retry in ${retry} seconds.`, 
            variant: 'default' 
          });
        },
        onCancelReady: (cancelFn: () => void) => {
          debug('Cancel function ready');
          cancelRef.current = cancelFn;
        },
        onDone: (doneData: any) => {
          info('Orchestration completed successfully', { 
            agentCount: selectedAgents.length,
            hasFinalOutput: !!doneData.final_markdown 
          });
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
              content: doneData.final_markdown || m.content
            } as ChatMessage;
          }));
        },
        onError: (err: any) => {
          // Don't show rate limit errors as execution failures
          if (err?.error?.includes('rate') || err?.error?.includes('Too many')) {
            debug('Rate limit error in orchestration', { error: err.error });
            return;
          }
          
          logError('Orchestration execution failed', err);
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
      logError('Message submission failed', err);
      
      // Don't show rate limit errors
      if (!err?.message?.includes('rate') && !err?.message?.includes('Too many')) {
        toast({ 
          title: 'Error', 
          description: err?.message || 'Failed to execute agents. Please check your connection.', 
          variant: 'destructive' 
        });
      }
    } finally {
      debug('Message execution completed', { isExecuting: false });
      setIsExecuting(false);
      setIsLoadingLocal(false);
      cancelRef.current = null;
    }
  };

  const handleCancelExecution = () => {
    if (cancelRef.current) {
      debug('User requested execution cancellation');
      try {
        cancelRef.current();
        info('Orchestration cancelled by user');
        toast({ 
          title: 'Cancelled', 
          description: 'Orchestration cancelled by user', 
          variant: 'default' 
        });
      } catch (e) { 
        logError('Failed to cancel execution', e as Error);
      }
      cancelRef.current = null;
      setIsExecuting(false);
    } else {
      debug('Cancel requested but no cancel function available');
    }
  };

  const handleWorkflowConfirm = (ordered: Agent[]) => {
    debug('Workflow confirmed', { agents: ordered.map(a => a.name) });
    setSelectedAgents(ordered);
  };

  const handleRetryMessage = useCallback(async (messageId: string) => {
    debug('Retrying message', { messageId });
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex > 0) {
      const previousMessage = messages[messageIndex - 1];
      if (previousMessage.type === 'user') {
        setInput(previousMessage.content);
        info('Previous message loaded for retry', { messageId });
        toast({
          title: 'Message loaded',
          description: 'You can edit and resend the message',
        });
      } else {
        debug('No user message found before the specified message');
      }
    } else {
      debug('Message not found or no previous message available', { messageIndex });
    }
  }, [messages, toast, debug, info]);

  const togglePrivateChat = () => {
    const newSave = !saveToConversation;
    debug('Toggling private chat mode', { newSave });
    setSaveToConversation(newSave);

    if (!newSave) {
      setConversationId(null);
      setMessages([]);
      setHasStarted(false);
      onConversationChange?.(null);
      info('Private mode enabled');
      toast({
        title: 'Private mode enabled',
        description: 'Your messages will not be saved to conversation history.',
      });
    } else {
      setConversationId(null);
      info('Private mode disabled');
      toast({
        title: 'Private mode disabled',
        description: 'Messages will now be saved to your conversation history.',
      });
    }
  };

  const sendDisabled = isLoadingLocal || isExecuting || (!!rateLimitedUntil && Date.now() < rateLimitedUntil) || !socketConnected;

  const quickPrompts = [
    "Explain this concept simply",
    "Write a creative story",
    "Help me debug this code",
    "Analyze this data"
  ];

  // Connection Status Banner Component
  const ConnectionBanner = () => {
    if (connectionStatus === 'connected') return null;

    debug('Rendering connection banner', { connectionStatus });

    return (
      <div className={`mb-4 p-3 rounded-lg border flex items-center gap-3 ${
        connectionStatus === 'connecting' 
          ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400'
          : 'bg-destructive/10 border-destructive/20 text-destructive'
      }`}>
        {connectionStatus === 'connecting' ? (
          <>
            <Wifi className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">Connecting to server...</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <div className="flex-1">
              <p className="text-sm font-medium">Disconnected from server</p>
              <p className="text-xs opacity-80">Attempting to reconnect. Please wait...</p>
            </div>
          </>
        )}
      </div>
    );
  };

  // Selected Agents Display Component
  const SelectedAgentsDisplay = () => {
    if (selectedAgents.length === 0) {
      debug('No selected agents to display');
      return null;
    }

    debug('Rendering selected agents display', { agentCount: selectedAgents.length });

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

  debug('Rendering ChatInterface', { 
    messageCount: messages.length, 
    selectedAgentCount: selectedAgents.length,
    isExecuting,
    connectionStatus 
  });

  return (
    <div className="flex flex-col h-full max-w-[1800px] 2xl:max-w-[2200px] mx-auto w-full overflow-hidden">
      {!hasStarted && messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          <ConnectionBanner />
          
          <div className="text-center space-y-3 max-w-2xl px-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Multi-Agent Orchestration
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              How can I help you today?
            </h1>
            <p className="text-muted-foreground text-lg">
              Select your agents, design the workflow, and let's get started.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center max-w-2xl px-4">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  debug('Quick prompt selected', { prompt, index: idx });
                  setInput(prompt);
                }}
                disabled={sendDisabled}
                className="px-4 py-2 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 hover:border-primary/50 text-sm text-muted-foreground hover:text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {prompt}
              </button>
            ))}
          </div>

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
                      debug('Enter key pressed for message submission');
                      handleSubmit();
                    }
                  }}
                  placeholder="Type your message here..."
                  className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-[200px]"
                  disabled={sendDisabled}
                  rows={1}
                />
                <Button 
                  onClick={() => {
                    debug('Send button clicked');
                    handleSubmit();
                  }}
                  disabled={!input.trim() || sendDisabled} 
                  size="icon" 
                  className="h-10 w-10 rounded-lg bg-primary hover:bg-primary/90 transition flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="w-full flex items-center gap-3">
              <div className="flex-1">
                <AgentSelector 
                  agents={agents} 
                  selectedAgents={selectedAgents} 
                  onAgentsChange={(newAgents) => {
                    debug('Agents selection changed', { 
                      previousCount: selectedAgents.length, 
                      newCount: newAgents.length 
                    });
                    setSelectedAgents(newAgents);
                  }} 
                />
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button 
                  onClick={() => {
                    debug('Opening workflow dialog');
                    setWorkflowDialogOpen(true);
                  }}
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
                      onClick={() => {
                        debug('Execution mode changed', { mode });
                        setExecutionMode(mode);
                      }}
                      className={`px-2 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
                        executionMode === mode 
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
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition whitespace-nowrap ${
                    saveToConversation 
                      ? 'bg-background border-border hover:bg-muted/50 text-muted-foreground' 
                      : 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90'
                  }`}
                >
                  {saveToConversation ? <LockOpen className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
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
              <ConnectionBanner />
              
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
                      debug('Enter key pressed in chat input');
                      handleSubmit(); 
                    } 
                  }} 
                  placeholder="Message CreatuAI..." 
                  className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-[200px] text-sm sm:text-base" 
                  disabled={sendDisabled} 
                  rows={1} 
                />
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isExecuting ? (
                    <Button 
                      variant="destructive" 
                      onClick={handleCancelExecution} 
                      size="icon" 
                      className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => {
                        debug('Send button clicked in chat view');
                        handleSubmit();
                      }}
                      disabled={!input.trim() || sendDisabled} 
                      size="icon" 
                      className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-primary hover:bg-primary/90 transition"
                      title={!socketConnected ? 'Waiting for connection...' : undefined}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <AgentSelector 
                    agents={agents} 
                    selectedAgents={selectedAgents} 
                    onAgentsChange={(newAgents) => {
                      debug('Agents selection changed in chat view', { 
                        previousCount: selectedAgents.length, 
                        newCount: newAgents.length 
                      });
                      setSelectedAgents(newAgents);
                    }} 
                  />
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button 
                    onClick={() => {
                      debug('Opening workflow dialog from chat view');
                      setWorkflowDialogOpen(true);
                    }}
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
                        onClick={() => {
                          debug('Execution mode changed in chat view', { mode });
                          setExecutionMode(mode);
                        }}
                        className={`px-2 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
                          executionMode === mode 
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
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition whitespace-nowrap ${
                      saveToConversation 
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
                ) : isExecuting ? (
                  <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span>Processing with</span>
                    <span className="text-primary font-medium">
                      {selectedAgents.map(a => a.name).join(', ')}
                    </span>
                  </div>
                ) : connectionStatus === 'connected' ? (
                  <div className="text-xs text-green-600 dark:text-green-400 text-center flex items-center justify-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400" />
                    <span>Connected & Ready</span>
                  </div>
                ) : connectionStatus === 'connecting' ? (
                  <div className="text-xs text-yellow-600 dark:text-yellow-400 text-center flex items-center justify-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-600 dark:bg-yellow-400 animate-pulse" />
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <div className="text-xs text-destructive text-center flex items-center justify-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                    <span>Disconnected</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <AgentWorkflowDialog 
        open={workflowDialogOpen} 
        onOpenChange={(open) => {
          debug('Workflow dialog open state changed', { open });
          setWorkflowDialogOpen(open);
        }} 
        agents={agents} 
        selectedAgents={selectedAgents} 
        onConfirm={handleWorkflowConfirm} 
      />
    </div>
  );
};

export default ChatInterface;