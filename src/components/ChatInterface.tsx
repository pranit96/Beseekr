import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AgentSelector } from './AgentSelector';
import { MessageList } from './MessageList';
import { ExecutionModeToggle } from './ExecutionModeToggle';
import { ChatMessage, ExecutionMode, Agent, AgentResponse } from '@/types/agent';

interface ChatInterfaceProps {
  agents: Agent[];
}

export const ChatInterface = ({ agents }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('sequential');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim() || selectedAgents.length === 0) return;

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
      const response = await apiClient.executeOrchestration({
        agent_ids: selectedAgents.map(a => a.id),
        message: messageContent,
        mode: executionMode,
        save_to_conversation: false,
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
          content: '',
          timestamp: new Date(),
          agentResponses,
          executionMode,
        };

        setMessages((prev) => [...prev, agentMessage]);
      }
    } catch (error: any) {
      const { useToast } = await import('@/hooks/use-toast');
      const { toast } = useToast();
      toast({
        title: 'Orchestration failed',
        description: error.message || 'Failed to execute agents',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      <MessageList messages={messages} />
      
      <div className="sticky bottom-0 bg-background p-6 space-y-4">
        <div className="flex gap-3 items-end">
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
            className="min-h-[56px] max-h-[200px] resize-none rounded-3xl bg-muted/50 border-border/50 focus:border-primary transition-smooth px-5 py-4"
            disabled={isLoading}
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || selectedAgents.length === 0 || isLoading}
            size="icon"
            className="h-[56px] w-[56px] rounded-full shadow-medium hover:shadow-glow transition-smooth shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <AgentSelector
            agents={agents}
            selectedAgents={selectedAgents}
            onAgentsChange={setSelectedAgents}
          />
          <ExecutionModeToggle mode={executionMode} onModeChange={setExecutionMode} />
        </div>
      </div>
    </div>
  );
};
