// src/components/ChatInterface.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Send, Workflow, Lock, LockOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AgentSelector } from './AgentSelector';
import MessageList from './MessageList';
import { AgentWorkflowDialog } from './AgentWorkflowDialog';
import type { ChatMessage, ExecutionMode, Agent, AgentResponse } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';
import { useConversation } from '@/hooks/use-conversation';
import useOrchestration from '@/hooks/use-orchestration';

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
  const cancelRef = useRef<null | (() => void)>(null);

  // rate-limit UI
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);
  const rateLimitTimerRef = useRef<number | null>(null);

  const { toast } = useToast();

  // conversation hook (handles caching/loading)
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

  // orchestration helper (socket-based)
  const { execute, ensureConnected } = useOrchestration();

  // cleanup rate-limit timer on unmount
  useEffect(() => {
    return () => {
      if (rateLimitTimerRef.current) {
        window.clearInterval(rateLimitTimerRef.current);
        rateLimitTimerRef.current = null;
      }
    };
  }, []);

  // sync prop -> internal conversationId
  useEffect(() => {
    setConversationId(activeConversationId ?? null);
    if (activeConversationId) loadConversationMessages(activeConversationId);
  }, [activeConversationId, loadConversationMessages, setConversationId]);

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
      toast({ title: 'No agents selected', description: 'Please select at least one agent before sending a message.', variant: 'destructive' });
      return;
    }

    if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
      toast({ title: 'Rate limited', description: 'Please wait before sending another orchestration.', variant: 'destructive' });
      return;
    }

    setHasStarted(true);
    const messageText = input;
    setInput('');

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: messageText,
      timestamp: new Date(),
      isFromCache: false,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoadingLocal(true);

    try {
      let convId = conversationId;

      // create conversation only when saving to conversation (not private)
      if (saveToConversation && !convId) {
        const { apiClient } = await import('@/lib/api');
        const createRes = await apiClient.createConversation({
          agent_id: selectedAgents[0]?.id || null,
          title: messageText.slice(0, 50) + (messageText.length > 50 ? '...' : ''),
        });
        if (createRes.success && createRes.data?.id) {
          convId = createRes.data.id;
          setConversationId(convId);
          onConversationChange?.(convId);
          onConversationCreated?.(convId);
        } else {
          throw new Error('Failed to create conversation');
        }
      }

      // Build payload (omit conversation_id when private)
      const payload: any = {
        agent_ids: selectedAgents.map(a => a.id),
        message: messageText,
        mode: executionMode,
        save_to_conversation: saveToConversation,
      };

      if (saveToConversation && convId) payload.conversation_id = convId;

      // placeholders
      const agentResponsesInitial: AgentResponse[] = selectedAgents.map(a => ({
        agentId: a.id,
        agentName: a.name,
        content: '',
        timestamp: new Date(),
        status: 'pending',
        metadata: {}
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

      // append placeholder
      setMessages(prev => [...prev, agentMessage]);

      // connect socket if needed
      ensureConnected();

      setIsExecuting(true);
      cancelRef.current = null;

      // Execute orch and get a promise back. We ensure execute returns a Promise (see use-orchestration)
      const orchestrationPromise: Promise<any> = execute(payload, {
        onAck: (d: any) => { /* optional ack UI */ },
        onToken: (agentId: string, token: string) => {
          setMessages(prev => prev.map(m => {
            if (m.id !== agentMessageId) return m;
            return {
              ...m,
              agentResponses: m.agentResponses.map(ar => {
                if (ar.agentId !== agentId) return ar;
                return { ...ar, content: (ar.content || '') + token };
              })
            } as ChatMessage;
          }));
        },
        onAgentDone: (agentId: string, usage: any) => {
          setMessages(prev => prev.map(m => {
            if (m.id !== agentMessageId) return m;
            return {
              ...m,
              agentResponses: m.agentResponses.map(ar => (ar.agentId === agentId ? { ...ar, status: 'success', metadata: { ...ar.metadata, usage } } : ar))
            } as ChatMessage;
          }));
        },
        onAgentError: (agentId: string, errorMsg: any) => {
          setMessages(prev => prev.map(m => {
            if (m.id !== agentMessageId) return m;
            return {
              ...m,
              agentResponses: m.agentResponses.map(ar => (ar.agentId === agentId ? { ...ar, status: 'error', content: String(errorMsg || 'Error') } : ar))
            } as ChatMessage;
          }));
        },
        onWarning: (warn: any) => {
          toast({ title: 'Warning', description: warn?.detail || warn?.warning || 'Warning from server', variant: 'default' });
        },
        onRateLimit: (rl: any) => {
          // rl may contain { remaining, limit, retryAfter }
          const retry = Number(rl?.retryAfter ?? rl?.retry_after ?? rl?.retry ?? 10);
          startRateLimitCountdown(retry);
          toast({ title: 'Rate limit', description: `Too many requests. Retry in ${retry} seconds.`, variant: 'default' });
        },
        onCancelReady: (cancelFn: () => void) => {
          cancelRef.current = cancelFn;
        },
        onDone: (doneData: any) => {
          setMessages(prev => prev.map(m => {
            if (m.id !== agentMessageId) return m;
            const updatedResponses = m.agentResponses.map(ar => (ar.status === 'pending' ? { ...ar, status: 'success' } : ar));
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
          setMessages(prev => prev.map(m => {
            if (m.id !== agentMessageId) return m;
            return {
              ...m,
              agentResponses: m.agentResponses.map(ar => (ar.status === 'pending' ? { ...ar, status: 'error', content: err?.error || 'Orchestration failed' } : ar))
            } as ChatMessage;
          }));
          toast({ title: 'Execution failed', description: err?.error || 'Orchestration failed', variant: 'destructive' });
        }
      });

      // wait for orchestration to finish (final result)
      const finalResult: any = await orchestrationPromise;
      if (!finalResult?.ok) {
        // finalResult.error might already be handled in callbacks
      }
      setIsLoadingLocal(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to execute agents.', variant: 'destructive' });
      setIsLoadingLocal(false);
    } finally {
      setIsExecuting(false);
      cancelRef.current = null;
    }
  };

  const handleCancelExecution = () => {
    if (cancelRef.current) {
      try {
        cancelRef.current();
      } catch (e) { /* ignore */ }
      cancelRef.current = null;
      setIsExecuting(false);
      toast({ title: 'Cancelled', description: 'Orchestration cancelled by user', variant: 'default' });
    }
  };

  const handleWorkflowConfirm = (ordered: Agent[]) => setSelectedAgents(ordered);

  const togglePrivateChat = () => {
    const newSave = !saveToConversation;
    setSaveToConversation(newSave);

    if (!newSave) {
      // entering private mode: start a clean UI session
      setConversationId(null); // internal can be null/undefined
      setMessages([]);
      setHasStarted(false);
      onConversationChange?.(null);
    } else {
      // leaving private mode: nothing forced
      setConversationId(null);
    }
  };

  const sendDisabled = isLoadingLocal || isExecuting || (!!rateLimitedUntil && Date.now() < rateLimitedUntil);

  return (
    <div className="flex flex-col h-full max-w-[1800px] 2xl:max-w-[2200px] mx-auto w-full overflow-hidden">
      {!hasStarted && messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          <div className="text-center space-y-3 max-w-2xl px-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              How can I help you today?
            </h1>
            <p className="text-muted-foreground text-lg">Select your agents, design the workflow, and let's get started.</p>
          </div>

          <div className="flex flex-col items-center gap-4 w-full max-w-3xl px-4">
            <div className="w-full">
              <div className="relative flex items-center gap-3 rounded-xl bg-muted/50 border border-border/50 focus-within:border-primary transition px-4 py-3">
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Type your message here..."
                  className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  disabled={sendDisabled}
                  rows={1}
                />
                <Button onClick={handleSubmit} disabled={!input.trim() || sendDisabled} size="icon" className="h-10 w-10 rounded-lg bg-primary hover:bg-primary/90 transition">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="w-full max-w-3xl">
                <div className="flex items-center gap-3">
                  <AgentSelector agents={agents} selectedAgents={selectedAgents} onAgentsChange={setSelectedAgents} />
                  <Button onClick={() => setWorkflowDialogOpen(true)} disabled={selectedAgents.length === 0} variant="outline" className="gap-2">
                    <Workflow className="w-4 h-4" /> Design Flow
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg border bg-muted/30">
                  {(['sequential', 'parallel'] as const).map(mode => (
                    <button key={mode} onClick={() => setExecutionMode(mode)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${executionMode === mode ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>

                <button onClick={togglePrivateChat} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition ${saveToConversation ? 'bg-background border-border hover:bg-muted/50 text-muted-foreground' : 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90'}`}>
                  {saveToConversation ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
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
              <MessageList messages={messages} isLoading={isLoadingLocal || isExecuting} />
            </div>
          </div>

          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm p-4 border-t border-border/50 space-y-3">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <AgentSelector agents={agents} selectedAgents={selectedAgents} onAgentsChange={setSelectedAgents} />
              <Button onClick={() => setWorkflowDialogOpen(true)} disabled={selectedAgents.length === 0} variant="outline" size="sm" className="gap-2">
                <Workflow className="w-4 h-4" /> Design Flow
              </Button>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg border bg-muted/30">
                  {(['sequential', 'parallel'] as const).map(mode => (
                    <button key={mode} onClick={() => setExecutionMode(mode)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${executionMode === mode ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>

                <button onClick={togglePrivateChat} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition ${saveToConversation ? 'bg-background border-border hover:bg-muted/50 text-muted-foreground' : 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90'}`}>
                  {saveToConversation ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  <span>Private</span>
                </button>
              </div>
            </div>

            <div className="relative flex items-center gap-3 rounded-xl bg-muted/50 border border-border/50 focus-within:border-primary transition px-4 py-3">
              <Textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }} placeholder="Message CreatuAI..." className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" disabled={sendDisabled} rows={1} />
              <div className="flex items-center gap-2">
                {/* Cancel button (visible when executing) */}
                {isExecuting ? (
                  <Button variant="destructive" onClick={handleCancelExecution} size="icon" className="h-10 w-10 rounded-lg">
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={!input.trim() || sendDisabled} size="icon" className="h-10 w-10 rounded-lg bg-primary hover:bg-primary/90 transition">
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Rate limit indicator */}
            {rateLimitedUntil && Date.now() < rateLimitedUntil && (
              <div className="text-xs text-destructive mt-2 text-center">
                Rate limit active — please wait {Math.ceil((rateLimitedUntil - Date.now()) / 1000)}s
              </div>
            )}
          </div>
        </>
      )}

      <AgentWorkflowDialog open={workflowDialogOpen} onOpenChange={setWorkflowDialogOpen} agents={agents} selectedAgents={selectedAgents} onConfirm={handleWorkflowConfirm} />
    </div>
  );
};

export default ChatInterface;
