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

  // For sequential mode, show agents one by one
  useEffect(() => {
    if (isSequential && hasMultipleAgents && !allTypingComplete) {
      // This will be controlled by typewriter completion callbacks
      return;
    } else if (!isSequential) {
      // Show all at once for parallel mode
      setCurrentAgentIndex(message.agentResponses?.length || 0);
      setAllTypingComplete(true);
    }
  }, [isSequential, hasMultipleAgents, allTypingComplete, message.agentResponses?.length]);

  const handleAgentTypingComplete = (index: number) => {
    if (isSequential && message.agentResponses) {
      if (index < message.agentResponses.length - 1) {
        // Move to next agent after a brief pause
        setTimeout(() => {
          setCurrentAgentIndex(index + 1);
        }, 100);
      } else {
        setAllTypingComplete(true);
      }
    }
  };

  // Determine which agents to show
  const agentsToShow = isSequential 
    ? message.agentResponses?.slice(0, currentAgentIndex + 1) || []
    : message.agentResponses || [];

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-3">
        {/* Agent responses */}
        {agentsToShow.length > 0 && (
          <div className="space-y-3">
            {agentsToShow.map((response, index) => (
              <AgentResponseCard
                key={response.agentId}
                response={response}
                index={index}
                isSequential={isSequential}
                enableTypewriter={index === currentAgentIndex}
                typewriterDelay={isSequential ? 200 : index * 100}
              />
            ))}
          </div>
        )}

        {/* Final output/markdown - only show after all agents complete */}
        {allTypingComplete && (message.markdownOutput || message.finalOutput) && (
          <div className="glass rounded-xl p-4 shadow-soft border border-primary/20 mt-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="font-medium text-sm text-primary">
                {isSequential ? 'Final Output' : 'Summary'}
              </span>
            </div>
            <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
              <MarkdownRenderer 
                content={message.markdownOutput || message.finalOutput || ''} 
              />
            </div>
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground block">
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