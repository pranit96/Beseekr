// src/components/ChatInterface.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Workflow, Lock, LockOpen, X, WifiOff, Loader2, Download, Sparkles } from 'lucide-react';
import { ToolExecutionIndicator } from '@/components/ToolExecutionIndicator';
import { ChatFileUpload } from '@/components/ChatFileUpload';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AgentSelector } from './AgentSelector';
import MessageList from './MessageList';
import { WorkflowBuilder, type WorkflowDefinition } from './WorkflowBuilder';
import { WelcomeScreen } from './WelcomeScreen';
import { ExportChatDialog } from './ExportChatDialog';
import type { ChatMessage, ExecutionMode, Agent, AgentResponse } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';
import { useConversation } from '@/hooks/use-conversation';
import useOrchestration from '@/hooks/use-orchestration';
import { useAuth } from '@/contexts/AuthContext';
import { createLogger } from '@/services/logging';
import { WorkflowModeOverlay } from './WorkflowModeOverlay';
import useAutonomousWorkflow from '@/hooks/use-autonomous-workflow';

const logger = createLogger('ChatInterface');

function generateConversationTitle(message: string, agents: Agent[]): string {
  const text = message.trim();
  if (!text) return `Chat with ${agents.map(a => a.name).join(', ')}`;
  let clean = text
    .replace(/^(hey|hi|hello|can you|could you|please|I want to|I need to|I'd like to|help me|tell me|show me|explain|write|create|make|generate)\s+/i, '')
    .replace(/[.!?,;]+$/, '').trim();
  if (!clean) clean = text;
  const title = clean.split(/\s+/).map((w, i) => {
    if (i > 0 && ['a','an','the','in','on','at','to','for','of','and','or','but','is','with'].includes(w.toLowerCase())) return w.toLowerCase();
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
  if (title.length <= 50) return title;
  const truncated = title.substring(0, 50);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 20 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

// ──────────────────────────────── Typing Dots ────────────────────────────────
const TypingDots = () => (
  <div className="typing-dots" aria-label="Processing…">
    <span /><span /><span />
  </div>
);

// ──────────────────────────────── Top Loading Bar ─────────────────────────────
const TopBar = ({ active }: { active: boolean }) => (
  <div
    className={`top-progress-bar ${active ? 'top-progress-bar-active' : ''}`}
    aria-hidden
  />
);

export const ChatInterface: React.FC<{
  agents: Agent[];
  activeConversationId?: string;
  onConversationChange?: (conversationId: string | null) => void;
  onConversationCreated?: (conversationId: string) => void;
}> = ({ agents, activeConversationId, onConversationChange, onConversationCreated }) => {
  const [input, setInput] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null);
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
  const [toolExecutions, setToolExecutions] = useState<Array<{ callId: string; toolName: string; status: 'running' | 'success' | 'error'; executionTimeMs?: number }>>([]);
  const [attachedFiles, setAttachedFiles] = useState<Array<{ id: string; name: string; type: string; size: number; size_readable: string; storage_path: string; url: string | null }>>([]);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);
  const [workflowMode, setWorkflowMode] = useState(false);
  const [workflowModeActive, setWorkflowModeActive] = useState(false);

  const cancelRef = useRef<null | (() => void)>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const retryMessageRef = useRef<string>('');
  const isCreatingConversationRef = useRef(false);
  const rateLimitTimerRef = useRef<number | null>(null);

  const { toast } = useToast();
  const { socketConnected } = useAuth();
  const { execute: executeWorkflowMode } = useAutonomousWorkflow();

  const {
    messages, setMessages, conversationId, setConversationId,
    loadConversationMessages, isLoading: convLoading,
    hasStarted, setHasStarted, isActiveOrchestrationRef, messageCache,
  } = useConversation(activeConversationId);

  const { execute, ensureConnected, getStatus } = useOrchestration();

  useEffect(() => { setConnectionStatus(socketConnected ? 'connected' : 'disconnected'); }, [socketConnected]);

  useEffect(() => {
    const id = setInterval(() => {
      const s = getStatus();
      setConnectionStatus(!socketConnected ? 'disconnected' : s.connected ? 'connected' : 'connecting');
    }, 2000);
    return () => clearInterval(id);
  }, [getStatus, socketConnected]);

  useEffect(() => {
    if (!isExecuting && !preparingMessage && textareaRef.current) textareaRef.current.focus();
  }, [isExecuting, hasStarted, preparingMessage]);

  useEffect(() => () => { if (rateLimitTimerRef.current) window.clearInterval(rateLimitTimerRef.current); }, []);

  useEffect(() => {
    if (!activeConversationId) return;
    if (activeConversationId.startsWith('temp-')) { setConversationId(activeConversationId); return; }
    setConversationId(activeConversationId);
    if (isActiveOrchestrationRef?.current) return;
    loadConversationMessages(activeConversationId);
  }, [activeConversationId]);

  const startRateLimitCountdown = (seconds: number) => {
    const until = Date.now() + seconds * 1000;
    setRateLimitedUntil(until);
    if (rateLimitTimerRef.current) window.clearInterval(rateLimitTimerRef.current);
    rateLimitTimerRef.current = window.setInterval(() => {
      if (Date.now() >= until) { setRateLimitedUntil(null); if (rateLimitTimerRef.current) { window.clearInterval(rateLimitTimerRef.current); rateLimitTimerRef.current = null; } }
    }, 500);
  };

  const handleWorkflowModeSubmit = () => {
    if (!input.trim()) return;
    
    const messageText = input;
    setInput('');
    setWorkflowModeActive(true);
    
    // Add user message to chat
    const userMessage: ChatMessage = { 
      id: `msg-${Date.now()}`, 
      type: 'user', 
      content: messageText, 
      timestamp: new Date(), 
      isFromCache: false 
    };
    setMessages(prev => [...prev, userMessage]);
  };

  const handleWorkflowModeClose = (finalAnswer?: string) => {
    setWorkflowModeActive(false);
    
    // Add workflow result to chat if available
    if (finalAnswer) {
      const agentMessage: ChatMessage = {
        id: `msg-${Date.now()}-workflow`,
        type: 'agent',
        content: finalAnswer,
        timestamp: new Date(),
        agentResponses: [{
          agentId: 'workflow',
          agentName: 'Autonomous Workflow',
          content: finalAnswer,
          timestamp: new Date(),
          status: 'success',
          metadata: { domain: 'workflow' }
        }],
        executionMode: 'sequential',
        markdownOutput: finalAnswer,
        finalOutput: finalAnswer,
        isFromCache: false
      };
      setMessages(prev => [...prev, agentMessage]);
    }
  };

  const handleSubmit = async (overrideWorkflow?: WorkflowDefinition) => {
    // Check if workflow mode is enabled
    if (workflowMode) {
      handleWorkflowModeSubmit();
      return;
    }

    const activeWorkflow = overrideWorkflow || selectedWorkflow;
    const isWorkflowExecution = !!activeWorkflow;
    const finalAgents = isWorkflowExecution 
      ? activeWorkflow.nodes.map(n => agents.find(a => a.id === n.agentId)).filter(Boolean) as Agent[]
      : selectedAgents;

    if (!input.trim() && attachedFiles.length === 0) return;
    if (finalAgents.length === 0) { toast({ title: 'No agents selected', description: 'Select at least one agent.', variant: 'destructive' }); return; }
    if (!socketConnected) { toast({ title: 'Not connected', description: 'Waiting for connection…', variant: 'destructive' }); return; }
    if (rateLimitedUntil && Date.now() < rateLimitedUntil) { toast({ title: 'Rate limited', description: 'Please wait before sending.', variant: 'destructive' }); return; }

    const messageText = input;
    setInput('');
    retryMessageRef.current = messageText;
    if (isActiveOrchestrationRef) isActiveOrchestrationRef.current = true;
    setPreparingMessage(true);
    setHasStarted(true);

    let errorHandled = false;

    try {
      let convId = conversationId;
      const isTempConversation = convId?.startsWith('temp-');

      if (isTempConversation && convId) {
        const realId = sessionStorage.getItem(`conv_mapping_${convId}`);
        if (realId) {
          convId = realId; setConversationId(realId);
          sessionStorage.removeItem(`conv_mapping_${convId}`);
          setTimeout(() => { onConversationChange?.(realId); onConversationCreated?.(realId); }, 100);
        }
      }

      if (saveToConversation && (!convId || isTempConversation) && !isCreatingConversationRef.current) {
        isCreatingConversationRef.current = true;
        try {
          const { apiClient } = await import('@/lib/api');
          const title = generateConversationTitle(messageText, finalAgents);
          const res = await apiClient.createConversation({ agent_id: finalAgents[0]?.id || null, title });
          if (res.success && res.data?.id) {
            convId = res.data.id; setConversationId(convId);
            setTimeout(() => { onConversationChange?.(convId); onConversationCreated?.(convId); }, 200);
          }
        } catch (err) { logger.error('Failed to create conversation', { error: err }); }
        finally { isCreatingConversationRef.current = false; }
      }

      await new Promise(r => setTimeout(r, 50));

      const userMessage: ChatMessage = { id: `msg-${Date.now()}`, type: 'user', content: messageText, timestamp: new Date(), isFromCache: false };
      const agentResponsesInitial: AgentResponse[] = finalAgents.map(a => ({ agentId: a.id, agentName: a.name, content: '', timestamp: new Date(), status: 'pending', metadata: { domain: a.domain } }));
      const agentMessageId = `msg-${Date.now()}-agents`;
      const agentMessage: ChatMessage = { id: agentMessageId, type: 'agent', content: '', timestamp: new Date(), agentResponses: agentResponsesInitial, executionMode: isWorkflowExecution ? 'sequential' : executionMode, markdownOutput: '', finalOutput: '', isFromCache: false };

      setMessages(prev => [...prev, userMessage, agentMessage]);
      setPreparingMessage(false);
      setIsExecuting(true);
      setIsLoadingLocal(true);

      await new Promise(r => setTimeout(r, 100));

      const payload: any = { 
        agent_ids: finalAgents.map(a => a.id), 
        workflow_nodes: isWorkflowExecution ? activeWorkflow.nodes : undefined,
        message: messageText, 
        mode: isWorkflowExecution ? 'sequential' : executionMode, 
        save_to_conversation: saveToConversation 
      };
      if (saveToConversation && convId) payload.conversation_id = convId;
      if (attachedFiles.length > 0) {
        payload.attached_files = attachedFiles.map(f => ({ name: f.name, type: f.type, size: f.size, storage_path: f.storage_path, url: f.url, extracted_content: (f as any).extracted_content || null, word_count: (f as any).word_count || 0 }));
      }

      ensureConnected();
      cancelRef.current = null;

      await execute(payload, {
        onAck: () => {},
        onToken: (agentId, token) => setMessages(prev => prev.map(m => {
          if (m.id !== agentMessageId) return m;
          return { ...m, agentResponses: m.agentResponses?.map(ar => ar.agentId !== agentId ? ar : { ...ar, content: (ar.content || '') + token, status: 'pending' }) || [] } as ChatMessage;
        })),
        onAgentDone: (agentId, usage) => setMessages(prev => prev.map(m => {
          if (m.id !== agentMessageId) return m;
          return { ...m, agentResponses: m.agentResponses?.map(ar => ar.agentId === agentId ? { ...ar, status: 'success', metadata: { ...ar.metadata, usage } } : ar) || [] } as ChatMessage;
        })),
        onAgentError: (agentId, errorMsg) => setMessages(prev => prev.map(m => {
          if (m.id !== agentMessageId) return m;
          return { ...m, agentResponses: m.agentResponses?.map(ar => ar.agentId === agentId ? { ...ar, status: 'error', content: String(errorMsg || 'Error') } : ar) || [] } as ChatMessage;
        })),
        onWarning: () => {},
        onRateLimit: (rl) => { const r = Number(rl?.retryAfter ?? 30); toast({ title: 'Rate limit', description: `Retry in ${r}s.` }); startRateLimitCountdown(r); },
        onCancelReady: (fn) => { cancelRef.current = fn; },
        onProgress: (p) => setOrchestrationProgress({ step: p.step, total: p.total, agent_name: p.agent_name }),
        onCancelled: () => { setOrchestrationProgress(null); setToolExecutions([]); },
        onToolStart: (d) => setToolExecutions(prev => [...prev, { callId: d.call_id, toolName: d.tool_name, status: 'running' }]),
        onToolResult: (d) => setToolExecutions(prev => prev.map(te => te.callId === d.call_id ? { ...te, status: d.success ? 'success' : 'error', executionTimeMs: d.execution_time_ms } : te)),
        onDone: (doneData) => {
          setOrchestrationProgress(null);
          setMessages(prev => prev.map(m => {
            if (m.id !== agentMessageId) return m;
            const updatedResponses = m.agentResponses?.map(ar => ar.status === 'pending' ? { ...ar, status: 'success' } : ar) || [];
            return { ...m, agentResponses: updatedResponses, markdownOutput: doneData.final_markdown || m.markdownOutput, finalOutput: doneData.final_markdown || m.finalOutput, content: doneData.final_markdown || m.content, perAgentSummary: doneData.per_agent_summary || undefined } as ChatMessage;
          }));
        },
        onError: (err) => {
          errorHandled = true;
          if (err?.error?.includes('rate') || err?.error?.includes('Too many')) return;
          setMessages(prev => prev.map(m => {
            if (m.id !== agentMessageId) return m;
            return { ...m, agentResponses: m.agentResponses?.map(ar => ar.status === 'pending' ? { ...ar, status: 'error', content: err?.error || 'Failed' } : ar) || [] } as ChatMessage;
          }));
          toast({ title: 'Execution failed', description: err?.error || 'Please try again.', variant: 'destructive' });
        },
      });
    } catch (err: any) {
      setPreparingMessage(false);
      if (!errorHandled && !err?.message?.includes('rate') && !err?.message?.includes('Too many')) {
        toast({ title: 'Error', description: err?.message || 'Failed to execute agents.', variant: 'destructive' });
      }
    } finally {
      setIsExecuting(false); setIsLoadingLocal(false); setPreparingMessage(false);
      setOrchestrationProgress(null); setToolExecutions([]); setAttachedFiles([]);
      cancelRef.current = null;
      if (isActiveOrchestrationRef) isActiveOrchestrationRef.current = false;
    }
  };

  const handleCancelExecution = () => {
    if (!cancelRef.current) return;
    setIsCancelling(true);
    try {
      cancelRef.current();
      setMessages(prev => prev.map(m => {
        if (m.type === 'agent' && m.agentResponses) {
          return { ...m, agentResponses: m.agentResponses.map(ar => ar.status === 'pending' ? { ...ar, status: 'error', content: ar.content ? `${ar.content}\n\n*[Cancelled]*` : 'Cancelled by user' } : ar) } as ChatMessage;
        }
        return m;
      }));
    } catch (e) { logger.error('Cancel error', { error: e }); }
    setTimeout(() => { cancelRef.current = null; setIsExecuting(false); setIsLoadingLocal(false); setPreparingMessage(false); setIsCancelling(false); if (isActiveOrchestrationRef) isActiveOrchestrationRef.current = false; }, 300);
  };

  const handleExecuteWorkflow = (workflow: WorkflowDefinition) => {
    setSelectedWorkflow(workflow);
    if (!input.trim() && attachedFiles.length === 0) {
      toast({ title: 'Message saved with workflow', description: 'Type a message and press send to run ' + workflow.name });
      return;
    }
    handleSubmit(workflow);
  };

  const handleRetryMessage = useCallback(async (messageId: string) => {
    const idx = messages.findIndex(m => m.id === messageId);
    if (idx > 0 && messages[idx - 1].type === 'user') {
      const prev = messages[idx - 1];
      const failed = messages[idx];
      const agentsToRetry = failed.agentResponses?.map(ar => selectedAgents.find(a => a.id === ar.agentId)).filter(Boolean) as Agent[] || selectedAgents;
      if (!agentsToRetry.length) { toast({ title: 'Cannot retry', description: 'No agents available.', variant: 'destructive' }); return; }
      setInput(prev.content);
      setSelectedAgents(agentsToRetry);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [messages, selectedAgents]);

  const togglePrivateChat = () => {
    const newSave = !saveToConversation;
    setSaveToConversation(newSave);
    if (!newSave) { setConversationId(null); setMessages([]); setHasStarted(false); onConversationChange?.(null); }
    else { setConversationId(null); }
  };

  const sendDisabled = isLoadingLocal || isExecuting || isCancelling || preparingMessage || (!!rateLimitedUntil && Date.now() < rateLimitedUntil) || !socketConnected;
  const isActive = isExecuting || preparingMessage;

  // ── Inline status line ───────────────────────────────────────────────────────
  let statusLineNode = null;
  if (connectionStatus === 'disconnected') {
    statusLineNode = (
      <div className="status-line status-line-error">
        <WifiOff className="w-3 h-3" />
        <span>Reconnecting…</span>
      </div>
    );
  } else if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
    statusLineNode = <div className="status-line status-line-warn">Rate limited — wait {Math.ceil((rateLimitedUntil - Date.now()) / 1000)}s</div>;
  } else if (isCancelling) {
    statusLineNode = <div className="status-line"><Loader2 className="w-3 h-3 animate-spin" /><span>Cancelling…</span></div>;
  } else if (preparingMessage) {
    statusLineNode = <div className="status-line"><Loader2 className="w-3 h-3 animate-spin" /><span>Preparing message…</span></div>;
  } else if (isExecuting) {
    statusLineNode = (
      <div className="status-line">
        <TypingDots />
        {orchestrationProgress ? (
          <span>Step {orchestrationProgress.step}/{orchestrationProgress.total}{orchestrationProgress.agent_name ? ` · ${orchestrationProgress.agent_name}` : ''}</span>
        ) : (
          <span>Running <span className="text-foreground/70">{selectedAgents.map(a => a.name).join(', ')}</span></span>
        )}
      </div>
    );
  }

  // ── Bottom input ─────────────────────────────────────────────────────────────
  const inputAreaNode = (
    <div className="input-area-root">
      {/* Agent selector & toolbar row */}
      <div className="input-toolbar">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {selectedWorkflow ? (
             <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-md">
               <Workflow className="w-4 h-4 text-primary" />
               <span className="text-sm font-medium text-primary truncate">{selectedWorkflow.name}</span>
               <button onClick={() => setSelectedWorkflow(null)} className="ml-2 hover:bg-primary/20 rounded p-0.5" title="Clear workflow">
                 <X className="w-3.5 h-3.5 text-primary" />
               </button>
             </div>
          ) : (
             <AgentSelector agents={agents} selectedAgents={selectedAgents} onAgentsChange={setSelectedAgents} />
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Workflow Mode Toggle */}
          <button
            onClick={() => setWorkflowMode(!workflowMode)}
            className={`toolbar-icon-btn ${workflowMode ? 'toolbar-icon-btn-active' : ''}`}
            title={workflowMode ? 'Disable workflow mode' : 'Enable workflow mode'}
            aria-label="Toggle workflow mode"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
          {/* Mode toggle */}
          <div className="mode-toggle">
            {(['sequential', 'parallel'] as const).map(mode => (
              <button key={mode} onClick={() => setExecutionMode(mode)} className={`mode-btn ${executionMode === mode ? 'mode-btn-active' : ''}`}>
                {mode === 'sequential' ? 'Seq' : 'Par'}
              </button>
            ))}
          </div>
          {/* Design Flow */}
          <button
            onClick={() => setWorkflowDialogOpen(true)}
            disabled={selectedAgents.length === 0}
            className="toolbar-icon-btn"
            title="Design workflow"
            aria-label="Design workflow"
          >
            <Workflow className="w-3.5 h-3.5" />
          </button>
          {/* Private mode */}
          <button
            onClick={togglePrivateChat}
            className={`toolbar-icon-btn ${!saveToConversation ? 'toolbar-icon-btn-active' : ''}`}
            title={saveToConversation ? 'Enable private mode' : 'Disable private mode'}
            aria-label="Toggle private mode"
          >
            {saveToConversation ? <LockOpen className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Textarea row */}
      <div className="input-row">
        <ChatFileUpload
          onFilesUploaded={(files) => setAttachedFiles(prev => [...prev, ...files])}
          attachedFiles={attachedFiles}
          onRemoveFile={(id) => setAttachedFiles(prev => prev.filter(f => f.id !== id))}
          disabled={sendDisabled}
        />
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          placeholder={isExecuting ? 'Agents are working…' : 'Message your agents…'}
          className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[44px] max-h-[180px] text-sm placeholder:text-muted-foreground/40 py-3"
          disabled={sendDisabled}
          rows={1}
          aria-label="Message input"
        />
        <div className="flex-shrink-0">
          {isCancelling ? (
            <button className="send-btn send-btn-cancel" disabled aria-label="Cancelling">
              <Loader2 className="h-4 w-4 animate-spin" />
            </button>
          ) : isExecuting ? (
            <button onClick={handleCancelExecution} className="send-btn send-btn-cancel" aria-label="Stop">
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => handleSubmit()}
              disabled={(!input.trim() && attachedFiles.length === 0) || sendDisabled}
              className="send-btn"
              aria-label="Send"
            >
              {preparingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Status line */}
      {statusLineNode}
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Top loader bar */}
      <TopBar active={isActive} />

      {messages.length === 0 && !isExecuting && !preparingMessage ? (
        /* ── Welcome state ───────────────────────────────────────────────────── */
        <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto">
          <WelcomeScreen onPromptSelect={(prompt) => { setInput(prompt); textareaRef.current?.focus(); }} />
          {isExecuting && toolExecutions.length > 0 && <ToolExecutionIndicator executions={toolExecutions} />}
        </div>
      ) : (
        /* ── Active chat ─────────────────────────────────────────────────────── */
        <div className="flex-1 overflow-y-auto px-2 md:px-6 py-4">
          <div className="max-w-5xl 2xl:max-w-6xl mx-auto w-full">
            <div className="flex items-center justify-end mb-3">
              <Button variant="ghost" size="sm" onClick={() => setExportDialogOpen(true)} className="gap-1.5 text-xs text-muted-foreground hover:text-foreground" disabled={messages.length === 0}>
                <Download className="w-3.5 h-3.5" /> Export
              </Button>
            </div>
            {isExecuting && toolExecutions.length > 0 && <ToolExecutionIndicator executions={toolExecutions} />}
            <MessageList messages={messages} isLoading={isLoadingLocal || isExecuting} onRetryMessage={handleRetryMessage} />
          </div>
        </div>
      )}

      {/* Bottom input area — always rendered */}
      <div className="flex-shrink-0 border-t border-border/30 bg-background/80 backdrop-blur-md">
        <div className={`max-w-${messages.length === 0 ? '2xl' : '5xl'} 2xl:max-w-${messages.length === 0 ? '3xl' : '6xl'} mx-auto w-full`}>
          {inputAreaNode}
        </div>
      </div>

      <WorkflowBuilder open={workflowDialogOpen} onOpenChange={setWorkflowDialogOpen} agents={agents} onExecute={handleExecuteWorkflow} />
      <ExportChatDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} messages={messages} conversationTitle={undefined} />
      
      {/* Workflow Mode Overlay */}
      {workflowModeActive && (
        <WorkflowModeOverlay
          prompt={messages[messages.length - 1]?.content || ''}
          onClose={handleWorkflowModeClose}
        />
      )}
    </div>
  );
};

export default ChatInterface;