import { useState, useEffect } from 'react';
import { ChatMessage, AgentResponse } from '@/types/agent';
import { AgentResponseCard } from './AgentResponseCard';
import { marked } from 'marked';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
  const [showChain, setShowChain] = useState(false);

  const isSequential = message.executionMode === 'sequential';
  const isFromCache = message.isFromCache === true;

  // Pre-format Markdown → HTML (in parallel)
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

  // Handle sequential logic: start with first, reveal next as each completes
  useEffect(() => {
    if (isFromCache) {
      setCurrentAgentIndex(message.agentResponses?.length || 0);
      setAllTypingComplete(true);
    } else if (!isSequential) {
      // Parallel: show all at once
      setCurrentAgentIndex(message.agentResponses?.length || 0);
      setAllTypingComplete(true);
    } else {
      // sequential and live: start at first (if exists)
      setCurrentAgentIndex(0);
      setAllTypingComplete(false);
    }
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

  // Allow user to reveal all chain-of-thought (intermediate outputs)
  const toggleChain = () => setShowChain((s) => !s);

  return (
    <div className="flex justify-start mb-6 animate-fade-in">
      <div className="max-w-[90%] sm:max-w-[85%] md:max-w-[80%] space-y-4">
        {/* Controls for sequential mode */}
        {isSequential && message.agentResponses?.length > 1 && (
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={toggleChain} className="gap-2">
              {showChain ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showChain ? 'Hide reasoning' : 'Show reasoning'}
            </Button>
            <div className="text-xs text-muted-foreground">
              Showing {Math.min(currentAgentIndex + 1, message.agentResponses?.length || 0)} of {message.agentResponses?.length}
            </div>
          </div>
        )}

        {/* Render agent responses */}
        <div className="space-y-4">
          {(isSequential && !showChain
            ? formattedResponses.slice(0, currentAgentIndex + 1)
            : formattedResponses
          ).map((response, index) => (
            <AgentResponseCard
              key={`${response.agentId}-${index}`}
              response={{
                ...response,
                content: response.formattedContent || response.content,
              }}
              index={index}
              isSequential={isSequential}
              enableTypewriter={!isFromCache && isSequential && index === currentAgentIndex}
              typewriterDelay={index === 0 ? 0 : index * 250}
              onTypingComplete={() => handleAgentTypingComplete(index)}
              onRegenerate={(prompt) => {
                // emit event to allow UI to regenerate using this response
                window.dispatchEvent(new CustomEvent('regenerate-from-response', { detail: { prompt } }));
              }}
              onForkAgent={(agentId) => {
                window.dispatchEvent(new CustomEvent('fork-agent', { detail: { agentId } }));
              }}
            />
          ))}
        </div>

        <span className="text-xs text-muted-foreground block px-1">
          {(message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
};

export default AgentMessage;