// Updated ChatInterface with improved message handling and no localStorage
import { useState, useEffect, useCallback } from 'react';
import { Send, Workflow, Lock, LockOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AgentSelector } from './AgentSelector';
import { MessageList } from './MessageList';
import { AgentWorkflowDialog } from './AgentWorkflowDialog';
import { ChatMessage, ExecutionMode, Agent, AgentResponse } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';

interface ChatInterfaceProps {
  agents: Agent[];
  activeConversationId?: string;
  onConversationChange?: (conversationId: string | null) => void;
  onConversationCreated?: (conversationId: string) => void;
}

export const ChatInterface = ({ 
  agents, 
  activeConversationId, 
  onConversationChange, 
  onConversationCreated 
}: ChatInterfaceProps) => {
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

  // Load cached messages from memory when conversation changes
  useEffect(() => {
    console.log('Active conversation changed:', activeConversationId);
    setConversationId(activeConversationId || null);
    
    if (activeConversationId) {
      // Check if we have cached messages in memory
      const cached = messageCache.get(activeConversationId);
      if (cached) {
        setMessages(cached);
        setHasStarted(cached.length > 0);
      } else {
        // Load from API
        loadConversationMessages(activeConversationId);
      }
    } else {
      setMessages([]);
      setHasStarted(false);
    }
  }, [activeConversationId]);

  // Cache messages in memory whenever they change
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      setMessageCache(prev => {
        const newCache = new Map(prev);
        newCache.set(conversationId, messages);
        return newCache;
      });
    }
  }, [messages, conversationId]);

  const loadConversationMessages = useCallback(async (convId: string) => {
    if (!convId) {
      setMessages([]);
      setHasStarted(false);
      return;
    }

    try {
      console.log('Loading messages for conversation:', convId);
      
      const { apiClient } = await import('@/lib/api');
      const response = await apiClient.getMessages(convId, 1, 50);
      
      if (response.success && response.data) {
        console.log('API response data:', response.data);
        
        const apiMessages: ChatMessage[] = response.data.map((msg: any) => {
          const baseMessage = {
            id: msg.id,
            content: msg.content,
            timestamp: new Date(msg.created_at),
          };

          if (msg.role === 'user') {
            return {
              ...baseMessage,
              type: 'user' as const,
            };
          }
          
          if (msg.role === 'assistant') {
            const agentResponses: AgentResponse[] = (msg.metadata?.agent_results || []).map((result: any) => ({
              agentId: result.agent_id,
              agentName: result.agent_name,
              content: result.response,
              timestamp: new Date(msg.created_at),
              status: result.error ? 'error' : 'success',
              metadata: {
                usage: result.usage,
                domain: result.agent_domain,
                model_used: result.model_used,
                order: result.order,
                fallback_used: result.fallback_used,
              },
            }));

            return {
              ...baseMessage,
              type: 'agent' as const,
              agentResponses,
              executionMode: msg.metadata?.orchestration_mode || 'sequential',
            };
          }

          console.warn('Unknown message role:', msg.role);
          return {
            ...baseMessage,
            type: 'user' as const,
          };
        });

        console.log('Transformed messages:', apiMessages);
        setMessages(apiMessages);
        setHasStarted(apiMessages.length > 0);
      } else {
        console.log('No messages found in API response');
        setMessages([]);
        setHasStarted(false);
      }
    } catch (error: any) {
      console.error('Failed to load conversation messages:', error);
      setMessages([]);
      setHasStarted(false);
    }
  }, []);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    if (selectedAgents.length === 0) {
      toast({
        title: 'No agents selected',
        description: 'Please select at least one agent before sending a message',
        variant: 'destructive',
      });
      return;
    }

    setHasStarted(true);
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    const messageContent = input;
    setInput('');
    setIsLoading(true);

    try {
      const { apiClient } = await import('@/lib/api');
      let convId = conversationId;

      if (saveToConversation && !convId) {
        const response = await apiClient.createConversation({
          agent_id: selectedAgents.length > 0 ? selectedAgents[0].id : null,
          title: messageContent.slice(0, 50) + (messageContent.length > 50 ? '...' : ''),
        });

        if (response.success && response.data?.id) {
          convId = response.data.id;
          setConversationId(convId);
          onConversationChange?.(convId);
          onConversationCreated?.(convId);
        } else {
          throw new Error('Failed to create conversation');
        }
      }

      const payload: any = {
        agent_ids: selectedAgents.map(a => a.id),
        message: messageContent,
        mode: executionMode,
        save_to_conversation: saveToConversation,
      };

      if (saveToConversation && convId) {
        payload.conversation_id = convId;
      }

      console.log('Sending orchestration payload:', payload);
      const response = await apiClient.executeOrchestration(payload);

      if (response.success && response.data) {
        console.log('Orchestration response:', response.data);
        
        const agentResponses: AgentResponse[] = response.data.results.map((result: any) => ({
          agentId: result.agent_id,
          agentName: result.agent_name,
          content: result.response,
          timestamp: new Date(),
          status: 'success',
          metadata: {
            usage: result.usage,
            domain: result.agent_domain,
            model_used: result.model_used,
            order: result.order,
            fallback_used: result.fallback_used,
          },
        }));

        const agentMessage: ChatMessage = {
          id: `msg-${Date.now()}-agents`,
          type: 'agent',
          content: response.data.markdown_output || response.data.final_output || '',
          timestamp: new Date(),
          agentResponses,
          executionMode,
          markdownOutput: response.data.markdown_output,
          finalOutput: executionMode === 'sequential'
            ? response.data.final_output
            : response.data.aggregated_output,
        };

        const updatedMessages = [...newMessages, agentMessage];
        setMessages(updatedMessages);
      }
    } catch (error: any) {
      console.error('Orchestration error:', error);
      toast({
        title: 'Orchestration failed',
        description: error.message || 'Failed to execute agents',
        variant: 'destructive',
      });
      
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkflowConfirm = (orderedAgents: Agent[]) => {
    setSelectedAgents(orderedAgents);
  };

  const togglePrivateChat = () => {
    const newSaveToConversation = !saveToConversation;
    setSaveToConversation(newSaveToConversation);
    
    if (!newSaveToConversation) {
      setConversationId(null);
      onConversationChange?.(null);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      {!hasStarted && messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
          <div className="text-center space-y-3 max-w-2xl">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              How can I help you today?
            </h1>
            <p className="text-muted-foreground text-lg">
              Select your agents, design the workflow, and let's get started
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
            <div className="w-full">
              <div className="relative flex items-center gap-2 rounded-lg bg-muted/50 border border-border/50 focus-within:border-primary transition-smooth px-4 py-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Type your message here..."
                  className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-[120px] p-0 pl-2"
                  disabled={isLoading}
                  rows={1}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-10 w-10 rounded-lg bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 shrink-0 disabled:opacity-50"
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
                  <button
                    onClick={() => setExecutionMode('sequential')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      executionMode === 'sequential'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Sequential
                  </button>
                  <button
                    onClick={() => setExecutionMode('parallel')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      executionMode === 'parallel'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Parallel
                  </button>
                </div>

                <button
                  onClick={togglePrivateChat}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 text-sm font-medium
                    ${saveToConversation
                      ? 'bg-background border-border hover:bg-muted/50 text-muted-foreground'
                      : 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90'}
                  `}
                  title={saveToConversation ? 'Click to enable private chat' : 'Private chat enabled - not saved to history'}
                >
                  {saveToConversation ? (
                    <LockOpen className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  <span>Private</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <MessageList messages={messages} />
          
          {isLoading && (
            <div className="flex items-center justify-center py-4 space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              <span className="ml-2 text-sm text-muted-foreground">Processing your request...</span>
            </div>
          )}
          
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm p-6 space-y-4 border-t border-border/50">
            <div className="flex items-center justify-center gap-3 flex-wrap mb-3">
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
                  <button
                    onClick={() => setExecutionMode('sequential')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      executionMode === 'sequential'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Sequential
                  </button>
                  <button
                    onClick={() => setExecutionMode('parallel')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      executionMode === 'parallel'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Parallel
                  </button>
                </div>

                <button
                  onClick={togglePrivateChat}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 text-sm font-medium
                    ${saveToConversation
                      ? 'bg-background border-border hover:bg-muted/50 text-muted-foreground'
                      : 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90'}
                  `}
                  title={saveToConversation ? 'Click to enable private chat' : 'Private chat enabled - not saved to history'}
                >
                  {saveToConversation ? (
                    <LockOpen className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  <span>Private</span>
                </button>
              </div>
            </div>

            <div className="w-full">
              <div className="relative flex items-center gap-2 rounded-lg bg-muted/50 border border-border/50 focus-within:border-primary transition-smooth px-4 py-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Message AgentFlow..."
                  className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-[120px] p-0 pl-2"
                  disabled={isLoading}
                  rows={1}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-10 w-10 rounded-lg bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 shrink-0 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </Button>
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
    </div>
  );
};