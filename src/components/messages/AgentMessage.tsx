import { useState, useEffect } from 'react';
import { ChatMessage, AgentResponse } from '@/types/agent';
import { AgentResponseCard } from './AgentResponseCard';
import { marked } from 'marked';

// Extend AgentResponse locally to include formattedContent
interface FormattedAgentResponse extends AgentResponse {
  formattedContent?: string;
}

interface AgentMessageProps {
  message: ChatMessage;
}

export const AgentMessage = ({ message }: AgentMessageProps) => {
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
  const [allTypingComplete, setAllTypingComplete] = useState(false);
  const [formattedResponses, setFormattedResponses] = useState<FormattedAgentResponse[]>(message.agentResponses || []);

  const isSequential = message.executionMode === 'sequential';
  const isFromCache = message.isFromCache === true;

  // 🧩 Pre-format Markdown → HTML (in parallel)
  useEffect(() => {
    if (!message.agentResponses?.length) return;

    const convertMarkdown = async () => {
      const processed = await Promise.all(
        message.agentResponses.map(async (resp): Promise<FormattedAgentResponse> => ({
          ...resp,
          formattedContent: (resp as FormattedAgentResponse).formattedContent || (await marked.parse(resp.content || '')),
        }))
      );
      setFormattedResponses(processed as FormattedAgentResponse[]);
    };

    convertMarkdown();
  }, [message.agentResponses]);

  // ⚙️ Handle which agent responses to show
  useEffect(() => {
    if (isFromCache) {
      setCurrentAgentIndex(message.agentResponses?.length || 0);
      setAllTypingComplete(true);
    } else if (!isSequential) {
      // Parallel: show all at once
      setCurrentAgentIndex(message.agentResponses?.length || 0);
      setAllTypingComplete(true);
    }
    // Sequential mode typing controlled below
  }, [isSequential, message.agentResponses?.length, isFromCache]);

  const handleAgentTypingComplete = (index: number) => {
    if (isSequential && !isFromCache && message.agentResponses) {
      if (index < message.agentResponses.length - 1) {
        setCurrentAgentIndex(index + 1);
      } else {
        setAllTypingComplete(true);
      }
    }
  };

  // 🎯 Agents to render (sequentially or all)
  const agentsToShow =
    isSequential && !isFromCache
      ? formattedResponses.slice(0, currentAgentIndex + 1)
      : formattedResponses;

  return (
    <div className="flex justify-start mb-6 animate-fade-in">
      <div className="max-w-[90%] sm:max-w-[85%] md:max-w-[80%] space-y-4">
        {agentsToShow.length > 0 && (
          <div className="space-y-4">
            {agentsToShow.map((response, index) => (
              <AgentResponseCard
                key={`${response.agentId}-${index}`}
                response={{
                  ...response,
                  content: response.formattedContent || response.content,
                }}
                index={index}
                isSequential={isSequential}
                enableTypewriter={!isFromCache && isSequential && index === currentAgentIndex}
                typewriterDelay={0}
                onTypingComplete={() => handleAgentTypingComplete(index)}
              />
            ))}
          </div>
        )}

        <span className="text-xs text-muted-foreground block px-1">
          {(message.timestamp instanceof Date
            ? message.timestamp
            : new Date(message.timestamp)
          ).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
};
