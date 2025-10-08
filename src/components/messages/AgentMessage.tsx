import { useState, useEffect } from 'react';
import { ChatMessage } from '@/types/agent';
import { AgentResponseCard } from './AgentResponseCard';
import { MarkdownRenderer } from './MarkdownRenderer';

interface AgentMessageProps {
  message: ChatMessage;
}

export const AgentMessage = ({ message }: AgentMessageProps) => {
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
  const [allTypingComplete, setAllTypingComplete] = useState(false);
  const isSequential = message.executionMode === 'sequential';
  const hasMultipleAgents = message.agentResponses && message.agentResponses.length > 1;
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
        // Move to next agent after a brief pause
        setTimeout(() => {
          setCurrentAgentIndex(index + 1);
        }, 300);
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
                typewriterDelay={isSequential ? 200 : index * 100}
                onTypingComplete={() => handleAgentTypingComplete(index)}
              />
            ))}
          </div>
        )}

        {/* Final output/markdown - only show after all agents complete */}
        {allTypingComplete && (message.markdownOutput || message.finalOutput) && (
          <div className="glass rounded-xl p-5 shadow-soft border border-primary/20 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-semibold text-sm text-primary">
                {isSequential ? 'Final Output' : 'Summary'}
              </span>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <MarkdownRenderer 
                content={message.markdownOutput || message.finalOutput || ''} 
              />
            </div>
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