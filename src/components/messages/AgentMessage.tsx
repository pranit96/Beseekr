import { useState, useEffect } from 'react';
import { ChatMessage } from '@/types/agent';
import { AgentResponseCard } from './AgentResponseCard';

interface AgentMessageProps {
  message: ChatMessage;
}

export const AgentMessage = ({ message }: AgentMessageProps) => {
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
  const [allTypingComplete, setAllTypingComplete] = useState(false);
  const isSequential = message.executionMode === 'sequential';
  const isFromCache = message.isFromCache === true;

  // For cached messages, show everything immediately
  // For new messages, use typewriter effect
  useEffect(() => {
    if (isFromCache) {
      setCurrentAgentIndex(message.agentResponses?.length || 0);
      setAllTypingComplete(true);
    } else if (!isSequential) {
      // Show all at once for parallel mode
      setCurrentAgentIndex(message.agentResponses?.length || 0);
      setAllTypingComplete(true);
    }
    // For sequential new messages, controlled by typewriter
  }, [isSequential, message.agentResponses?.length, isFromCache]);

  const handleAgentTypingComplete = (index: number) => {
    if (isSequential && message.agentResponses && !isFromCache) {
      if (index < message.agentResponses.length - 1) {
        // Move to next agent immediately
        setCurrentAgentIndex(index + 1);
      } else {
        setAllTypingComplete(true);
      }
    }
  };

  // Determine which agents to show
  const agentsToShow = isSequential && !isFromCache
    ? message.agentResponses?.slice(0, currentAgentIndex + 1) || []
    : message.agentResponses || [];

  return (
    <div className="flex justify-start mb-6 animate-fade-in">
      <div className="max-w-[90%] sm:max-w-[85%] md:max-w-[80%] space-y-4">
        {/* Agent responses */}
        {agentsToShow.length > 0 && (
          <div className="space-y-4">
            {agentsToShow.map((response, index) => (
              <AgentResponseCard
                key={`${response.agentId}-${index}`}
                response={response}
                index={index}
                isSequential={isSequential}
                enableTypewriter={!isFromCache && index === currentAgentIndex}
                typewriterDelay={0}
                onTypingComplete={() => handleAgentTypingComplete(index)}
              />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground block px-1">
          {(message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp))
            .toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
        </span>
      </div>
    </div>
  );
};