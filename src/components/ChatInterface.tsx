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
    setInput('');
    setIsLoading(true);

    // Simulate agent responses (placeholder for backend integration)
    setTimeout(() => {
      const agentResponses: AgentResponse[] = selectedAgents.map((agent, index) => ({
        agentId: agent.id,
        agentName: agent.name,
        content: `Response from ${agent.name}: Processing "${input}"... [This is a placeholder response]`,
        timestamp: new Date(Date.now() + (executionMode === 'sequential' ? index * 1000 : 0)),
        status: 'success',
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
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      
      <div className="sticky bottom-0 border-t bg-background/80 backdrop-blur-xl p-4 space-y-4">
        <div className="flex items-center gap-3">
          <ExecutionModeToggle mode={executionMode} onModeChange={setExecutionMode} />
          <AgentSelector
            agents={agents}
            selectedAgents={selectedAgents}
            onAgentsChange={setSelectedAgents}
          />
        </div>

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
            placeholder="Ask something..."
            className="min-h-[60px] max-h-[200px] resize-none bg-card/50 border-border/50 focus:border-primary transition-smooth"
            disabled={isLoading}
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || selectedAgents.length === 0 || isLoading}
            size="icon"
            className="h-[60px] w-[60px] rounded-xl shadow-medium hover:shadow-glow transition-smooth"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
