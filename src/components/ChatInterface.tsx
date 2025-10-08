import { useState, useEffect, useCallback } from 'react';
import { Send, Workflow, Lock, LockOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AgentSelector } from './AgentSelector';
import { MessageList } from './MessageList';
import { AgentWorkflowDialog } from './AgentWorkflowDialog';
import { ChatMessage, ExecutionMode, Agent, AgentResponse } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';

export const ChatInterface = ({
  agents,
  activeConversationId,
  onConversationChange,
  onConversationCreated,
}: {
  agents: Agent[];
  activeConversationId?: string;
  onConversationChange?: (conversationId: string | null) => void;
  onConversationCreated?: (conversationId: string) => void;
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('sequential');
  const [isLoading, setIsLoading] = useState(false);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [saveToConversation, setSaveToConversation] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(activeConversationId || null);
  const [messageCache, setMessageCache] = useState<Map<string, ChatMessage[]>>(new Map());
  const { toast } = useToast();

  // Load cached or historical messages
  useEffect(() => {
    setConversationId(activeConversationId || null);
    if (activeConversationId) {
      const cached = messageCache.get(activeConversationId);
      if (cached) {
        setMessages(cached);
        setHasStarted(cached.length > 0);
      } else {
        loadConversationMessages(activeConversationId);
      }
    } else {
      setMessages([]);
      setHasStarted(false);
    }
  }, [activeConversationId]);

  // Cache conversation messages in memory
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      setMessageCache(prev => {
        const newCache = new Map(prev);
        newCache.set(conversationId, messages);
        return newCache;
      });
    }
  }, [messages, conversationId]);

  // Load conversation messages from API
  const loadConversationMessages = useCallback(async (convId: string) => {
    try {
      const { apiClient } = await import('@/lib/api');
      const response = await apiClient.getMessages(convId, 1, 50);

      if (response.success && response.data) {
        const apiMessages: ChatMessage[] = response.data.map((msg: any) => {
          const base = {
            id: msg.id,
            content: msg.content,
            timestamp: new Date(msg.created_at),
            isFromCache: true,
          };
          if (msg.role === 'user') return { ...base, type: 'user' as const };

          if (msg.role === 'assistant') {
            const agentResponses: AgentResponse[] = (msg.metadata?.agent_results || []).map((r: any) => ({
              agentId: r.agent_id,
              agentName: r.agent_name,
              content: r.response,
              timestamp: new Date(msg.created_at),
              status: r.error ? 'error' : 'success',
              metadata: {
                usage: r.usage,
                domain: r.agent_domain,
                model_used: r.model_used,
                order: r.order,
                fallback_used: r.fallback_used,
              },
            }));

            return {
              ...base,
              type: 'agent' as const,
              agentResponses,
              executionMode: msg.metadata?.orchestration_mode || 'sequential',
            };
          }
          return { ...base, type: 'user' as const };
        });

        setMessages(apiMessages);
        setHasStarted(apiMessages.length > 0);
      } else {
        setMessages([]);
        setHasStarted(false);
      }
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
      setMessages([]);
      setHasStarted(false);
    }
  }, []);

  // Handle message send
  const handleSubmit = async () => {
    if (!input.trim()) return;
    if (selectedAgents.length === 0) {
      toast({
        title: 'No agents selected',
        description: 'Please select at least one agent before sending a message.',
        variant: 'destructive',
      });
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
    setIsLoading(true);

    try {
      const { apiClient } = await import('@/lib/api');
      let convId = conversationId;

      if (saveToConversation && !convId) {
        const createRes = await apiClient.createConversation({
          agent_id: selectedAgents[0]?.id || null,
          title: messageText.slice(0, 50) + (messageText.length > 50 ? '...' : ''),
        });
        if (createRes.success && createRes.data?.id) {
          convId = createRes.data.id;
          setConversationId(convId);
          onConversationChange?.(convId);
          onConversationCreated?.(convId);
        } else throw new Error('Failed to create conversation');
      }

      const payload: any = {
        agent_ids: selectedAgents.map(a => a.id),
        message: messageText,
        mode: executionMode,
        save_to_conversation: saveToConversation,
      };
      if (saveToConversation && convId) payload.conversation_id = convId;

      const res = await apiClient.executeOrchestration(payload);
      if (res.success && res.data) {
        const agentResponses: AgentResponse[] = res.data.results.map((r: any) => ({
          agentId: r.agent_id,
          agentName: r.agent_name,
          content: r.response,
          timestamp: new Date(),
          status: 'success',
          metadata: {
            usage: r.usage,
            domain: r.agent_domain,
            model_used: r.model_used,
            order: r.order,
            fallback_used: r.fallback_used,
          },
        }));

        const agentMessage: ChatMessage = {
          id: `msg-${Date.now()}-agents`,
          type: 'agent',
          content: res.data.markdown_output || res.data.final_output || '',
          timestamp: new Date(),
          agentResponses,
          executionMode,
          markdownOutput: res.data.markdown_output,
          finalOutput:
            executionMode === 'sequential'
              ? res.data.final_output
              : res.data.aggregated_output,
          isFromCache: false,
        };

        setIsLoading(false);
        setTimeout(() => setMessages(prev => [...prev, agentMessage]), 0);
      } else {
        throw new Error('No orchestration data returned');
      }
    } catch (err: any) {
      console.error('Orchestration failed:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to execute agents.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleWorkflowConfirm = (ordered: Agent[]) => setSelectedAgents(ordered);

  const togglePrivateChat = () => {
    const newState = !saveToConversation;
    setSaveToConversation(newState);
    if (!newState) {
      setConversationId(null);
      onConversationChange?.(null);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-[1800px] 2xl:max-w-[2200px] mx-auto w-full overflow-hidden">
      {!hasStarted && messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          <div className="text-center space-y-3 max-w-2xl px-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              How can I help you today?
            </h1>
            <p className="text-muted-foreground text-lg">
              Select your agents, design the workflow, and let's get started.
            </p>
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
                  disabled={isLoading}
                  rows={1}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-10 w-10 rounded-lg bg-primary hover:bg-primary/90 transition"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <AgentSelector
                agents={agents}
                selectedAgents={selectedAgents}
                onAgentsChange={setSelectedAgents}
              />
              <Button
                onClick={() => setWorkflowDialogOpen(true)}
                disabled={selectedAgents.length === 0}
                variant="outline"
                className="gap-2"
              >
                <Workflow className="w-4 h-4" />
                Design Flow
              </Button>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg border bg-muted/30">
                  {(['sequential', 'parallel'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setExecutionMode(mode)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                        executionMode === mode
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>

                <button
                  onClick={togglePrivateChat}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition ${
                    saveToConversation
                      ? 'bg-background border-border hover:bg-muted/50 text-muted-foreground'
                      : 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90'
                  }`}
                >
                  {saveToConversation ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  <span>Private</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            <MessageList messages={messages} isLoading={isLoading} />
          </div>
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm p-4 border-t border-border/50 space-y-3">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <AgentSelector
                agents={agents}
                selectedAgents={selectedAgents}
                onAgentsChange={setSelectedAgents}
              />
              <Button
                onClick={() => setWorkflowDialogOpen(true)}
                disabled={selectedAgents.length === 0}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Workflow className="w-4 h-4" />
                Design Flow
              </Button>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg border bg-muted/30">
                  {(['sequential', 'parallel'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setExecutionMode(mode)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                        executionMode === mode
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>

                <button
                  onClick={togglePrivateChat}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition ${
                    saveToConversation
                      ? 'bg-background border-border hover:bg-muted/50 text-muted-foreground'
                      : 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90'
                  }`}
                >
                  {saveToConversation ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  <span>Private</span>
                </button>
              </div>
            </div>

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
                placeholder="Message CreatuAI..."
                className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isLoading}
                rows={1}
              />
              <Button
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-10 w-10 rounded-lg bg-primary hover:bg-primary/90 transition"
              >
                <Send className="h-4 w-4" />
              </Button>
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
    </div>
  );
};