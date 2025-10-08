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

  // Prefill events
  useEffect(() => {
    const prefill = (e: any) => {
      const prompt = e.detail?.prompt;
      if (prompt) {
        setInput(prompt);
        document.querySelector<HTMLTextAreaElement>('textarea[placeholder*="Message"]')?.focus();
      }
    };
    window.addEventListener('prefill-prompt', prefill);
    window.addEventListener('regenerate-from-response', prefill);
    return () => {
      window.removeEventListener('prefill-prompt', prefill);
      window.removeEventListener('regenerate-from-response', prefill);
    };
  }, []);

  // Load cached or previous conversation
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

  // Cache messages per conversation
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      setMessageCache(prev => {
        const copy = new Map(prev);
        copy.set(conversationId, messages);
        return copy;
      });
    }
  }, [messages, conversationId]);

  const loadConversationMessages = useCallback(async (convId: string) => {
    try {
      const { apiClient } = await import('@/lib/api');
      const res = await apiClient.getMessages(convId, 1, 50);
      if (res.success && res.data) {
        const parsed: ChatMessage[] = res.data.map((msg: any) => {
          const base = {
            id: msg.id,
            content: msg.content,
            timestamp: new Date(msg.created_at),
            isFromCache: true,
          };
          if (msg.role === 'user') return { ...base, type: 'user' as const };
          if (msg.role === 'assistant') {
            const agentResponses: AgentResponse[] =
              (msg.metadata?.agent_results || []).map((r: any) => ({
                agentId: r.agent_id,
                agentName: r.agent_name,
                content: r.response,
                timestamp: new Date(msg.created_at),
                status: r.error ? 'error' : 'success',
                metadata: r,
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
        setMessages(parsed);
        setHasStarted(parsed.length > 0);
      }
    } catch (err) {
      console.error(err);
      setMessages([]);
      setHasStarted(false);
    }
  }, []);

  // Submit message
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

    const msgText = input;
    setInput('');
    setHasStarted(true);
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: msgText,
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
          title: msgText.slice(0, 50),
        });
        if (createRes.success && createRes.data?.id) {
          convId = createRes.data.id;
          setConversationId(convId);
          onConversationChange?.(convId);
          onConversationCreated?.(convId);
        }
      }

      const payload = {
        agent_ids: selectedAgents.map(a => a.id),
        message: msgText,
        mode: executionMode,
        save_to_conversation: saveToConversation,
        conversation_id: convId,
      };

      const res = await apiClient.executeOrchestration(payload);
      if (res.success && res.data) {
        const agentResponses: AgentResponse[] = res.data.results.map((r: any) => ({
          agentId: r.agent_id,
          agentName: r.agent_name,
          content: r.response,
          timestamp: new Date(),
          status: r.error ? 'error' : 'success',
          metadata: r,
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

        setTimeout(() => setMessages(prev => [...prev, agentMessage]), 0);
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to execute agents.',
        variant: 'destructive',
      });
    } finally {
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
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm">
      {/* Chat area */}
      {hasStarted || messages.length > 0 ? (
        <>
          <div className="flex-1 overflow-y-auto px-3 sm:px-8 py-4">
            <div className="max-w-5xl 2xl:max-w-6xl mx-auto w-full">
              <MessageList messages={messages} isLoading={isLoading} />
            </div>
          </div>

          {/* Bottom input bar */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-xl border-t border-border/50 px-3 sm:px-8 py-4">
            <div className="flex flex-col gap-3 max-w-5xl mx-auto w-full">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <AgentSelector
                  agents={agents}
                  selectedAgents={selectedAgents}
                  onAgentsChange={setSelectedAgents}
                />
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <Button
                    onClick={() => setWorkflowDialogOpen(true)}
                    disabled={selectedAgents.length === 0}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Workflow className="w-4 h-4" /> Flow
                  </Button>

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
                        ? 'bg-background hover:bg-muted/50 text-muted-foreground'
                        : 'bg-primary text-primary-foreground shadow-sm'
                    }`}
                  >
                    {saveToConversation ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    <span>Private</span>
                  </button>
                </div>
              </div>

              <div className="relative flex items-center gap-3 rounded-xl bg-muted/50 border border-border/50 focus-within:border-primary px-4 py-3">
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
          </div>
        </>
      ) : (
        // Empty state
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          <div className="text-center space-y-3 max-w-2xl px-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              How can I help you today?
            </h1>
            <p className="text-muted-foreground text-lg">
              Select your agents, design the workflow, and start the chat.
            </p>
          </div>
        </div>
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
