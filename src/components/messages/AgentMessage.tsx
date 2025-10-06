import { ChatMessage } from '@/types/agent';
import { AgentResponseCard } from './AgentResponseCard';

interface AgentMessageProps {
  message: ChatMessage;
}

export const AgentMessage = ({ message }: AgentMessageProps) => {
  // Ensure timestamp is a Date object
  const timestamp = message.timestamp instanceof Date 
    ? message.timestamp 
    : new Date(message.timestamp);

  if (!message.agentResponses || message.agentResponses.length === 0) {
    // Fallback: render as regular message if no agent responses
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="prose prose-sm max-w-none">
            {message.markdownOutput ? (
              <div 
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ 
                  __html: message.markdownOutput.replace(/\n/g, '<br />') 
                }} 
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    );
  }

  const isSequential = message.executionMode === 'sequential';

  return (
    <div className="space-y-4 animate-fade-in">
      {/* We removed the main message content here */}

      {/* Agent Responses Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">
            {isSequential ? 'Sequential' : 'Parallel'} Execution
          </span>
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {isSequential ? (
          <div className="space-y-3">
            {message.agentResponses.map((response, index) => (
              <AgentResponseCard
                key={`${response.agentId}-${index}`}
                response={{
                  ...response,
                  // Ensure agent response timestamp is a Date object
                  timestamp: response.timestamp instanceof Date 
                    ? response.timestamp 
                    : new Date(response.timestamp),
                }}
                index={index}
                isSequential={true}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {message.agentResponses.map((response, index) => (
              <AgentResponseCard
                key={`${response.agentId}-${index}`}
                response={{
                  ...response,
                  // Ensure agent response timestamp is a Date object
                  timestamp: response.timestamp instanceof Date 
                    ? response.timestamp 
                    : new Date(response.timestamp),
                }}
                index={index}
                isSequential={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};