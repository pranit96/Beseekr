import { useState, useEffect } from 'react';
import { Send, Workflow, MessageSquare, MessageSquareOff } from 'lucide-react';
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
}

export const ChatInterface = ({ agents, activeConversationId, onConversationChange }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('sequential');
  const [isLoading, setIsLoading] = useState(false);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [saveToConversation, setSaveToConversation] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(activeConversationId || null);
  const { toast } = useToast();

  // Sync local conversation with parent
  useEffect(() => {
    setConversationId(activeConversationId || null);
  }, [activeConversationId]);

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
    setMessages((prev) => [...prev, userMessage]);

    const messageContent = input;
    setInput('');
    setIsLoading(true);

    try {
      const { apiClient } = await import('@/lib/api');
      let convId = conversationId;

      // Create session if saving is ON and no session exists
      if (saveToConversation && !convId) {
        const sessionResponse = await apiClient.createOrchestrationSession({
          agent_ids: selectedAgents.map(a => a.id),
          mode: executionMode,
          title: 'Agent Orchestration Chat',
        });

        if (sessionResponse.success && sessionResponse.data?.conversation?.id) {
          convId = sessionResponse.data.conversation.id;
          setConversationId(convId);
          onConversationChange?.(convId);
        } else {
          throw new Error('Failed to create conversation session');
        }
      }

      const response = await apiClient.executeOrchestration({
        agent_ids: selectedAgents.map(a => a.id),
        message: messageContent,
        mode: executionMode,
        conversation_id: convId,
        save_to_conversation: saveToConversation,
      });

      if (response.success && response.data) {
        const agentResponses: AgentResponse[] = response.data.results.map((result: any) => ({
          agentId: result.agent_id,
          agentName: result.agent_name,
          content: result.response,
          timestamp: new Date(),
          status: 'success',
          metadata: {
            usage: result.usage,
            domain: result.agent_domain,
          },
        }));

        const agentMessage: ChatMessage = {
          id: `msg-${Date.now()}-agents`,
          type: 'agent',
          content: response.data.markdown_output || '',
          timestamp: new Date(),
          agentResponses,
          executionMode,
          markdownOutput: response.data.markdown_output,
          finalOutput: executionMode === 'sequential'
            ? response.data.final_output
            : response.data.aggregated_output,
        };

        setMessages((prev) => [...prev, agentMessage]);
      }
    } catch (error: any) {
      toast({
        title: 'Orchestration failed',
        description: error.message || 'Failed to execute agents',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkflowConfirm = (orderedAgents: Agent[]) => {
    setSelectedAgents(orderedAgents);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full relative">
      {/* --- TEMPORARY CHAT TOGGLE --- */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => {
            setSaveToConversation(!saveToConversation);
            if (saveToConversation) {
              // Turning OFF saving => reset conversation
              setConversationId(null);
              onConversationChange?.(null);
            }
          }}
          className={`
            relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300
            ${saveToConversation
              ? 'bg-background/80 border-border hover:bg-background'
              : 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90'}
          `}
          title={saveToConversation ? 'Currently saving to conversation history' : 'Temporary chat mode enabled (not saved)'}
        >
          <div
            className={`
              flex items-center justify-center w-5 h-5 rounded-full transition-all duration-300
              ${saveToConversation ? 'bg-primary/10' : 'bg-white/20'}
            `}
          >
            {saveToConversation ? (
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
            ) : (
              <MessageSquareOff className="w-3.5 h-3.5 text-primary-foreground" />
            )}
          </div>
          <span
            className={`text-xs font-medium transition-colors duration-300 ${
              saveToConversation ? 'text-muted-foreground' : 'text-primary-foreground'
            }`}
          >
            {saveToConversation ? 'Normal Chat' : 'Temporary Chat'}
          </span>

          <span
            className={`
              absolute inset-0 rounded-full transition-all duration-500 ease-in-out
              ${saveToConversation ? 'bg-transparent' : 'bg-primary/30'}
            `}
          />
        </button>
      </div>

      {!hasStarted ? (
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
              <div className="relative flex items-center gap-2 rounded-full bg-muted/50 border border-border/50 focus-within:border-primary transition-smooth px-5 py-3">
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
                  className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-[120px] p-0"
                  disabled={isLoading}
                  rows={1}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 shrink-0 disabled:opacity-50"
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
            </div>
          </div>
        </div>
      ) : (
        <>
          <MessageList messages={messages} />
          
          <div className="sticky bottom-0 bg-background p-6 space-y-4">
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
            </div>

            <div className="w-full">
              <div className="relative flex items-center gap-2 rounded-full bg-muted/50 border border-border/50 focus-within:border-primary transition-smooth px-5 py-3">
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
                  className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-[120px] p-0"
                  disabled={isLoading}
                  rows={1}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 shrink-0 disabled:opacity-50"
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
