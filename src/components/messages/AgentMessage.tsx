import { ChatMessage } from '@/types/agent';
import { AgentResponseCard } from './AgentResponseCard';

interface AgentMessageProps {
  message: ChatMessage;
}

export const AgentMessage = ({ message }: AgentMessageProps) => {
  if (!message.agentResponses) return null;

  const isSequential = message.executionMode === 'sequential';

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium">
          {isSequential ? 'Sequential' : 'Parallel'} Execution
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {isSequential ? (
        <div className="space-y-2">
          {message.agentResponses.map((response, index) => (
            <AgentResponseCard
              key={response.agentId}
              response={response}
              index={index}
              isSequential
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {message.agentResponses.map((response, index) => (
            <AgentResponseCard
              key={response.agentId}
              response={response}
              index={index}
              isSequential={false}
            />
          ))}
        </div>
      )}
    </div>
  );
};
