import React, { useEffect, useRef } from 'react';
import AgentResponseCard from './messages/AgentResponseCard';
import { ChatMessage } from '@/types/agent';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const endRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevLengthRef = useRef<number>(messages.length);

  // Smooth autoscroll when new messages arrive, avoid jumping during streaming
  useEffect(() => {
    const container = containerRef.current;
    // If increasing length, scroll to bottom smoothly
    if (!container) return;
    const prevLength = prevLengthRef.current;
    if (messages.length > prevLength) {
      // use a small timeout to let layout settle
      setTimeout(() => {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }, 60);
    }
    prevLengthRef.current = messages.length;
  }, [messages]);

  return (
    <div ref={containerRef} className="flex flex-col gap-6 px-4 md:px-6 max-w-5xl mx-auto w-full py-6 overflow-y-visible">
      {messages.map((msg, idx) => {
        if (msg.type === 'user') {
          return (
            <div key={msg.id || `user-${idx}`} className="flex justify-end w-full">
              <div className="max-w-[80%] bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-br-none shadow-sm whitespace-pre-wrap">
                {msg.content}
              </div>
            </div>
          );
        }

        if (msg.type === 'agent') {
          const execMode = msg.executionMode || 'sequential';
          return (
            <div key={msg.id || `agent-${idx}`} className="flex justify-start w-full">
              <div className="flex flex-col w-full space-y-4">
                {execMode === 'parallel' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {msg.agentResponses?.map((res: any, i: number) => (
                      <AgentResponseCard key={`${res.agentId}-${i}`} response={res} index={i} />
                    ))}
                  </div>
                ) : (
                  msg.agentResponses?.map((res: any, i: number) => (
                    <AgentResponseCard key={`${res.agentId}-${i}`} response={res} index={i} />
                  ))
                )}
              </div>
            </div>
          );
        }

        return null;
      })}

      {isLoading && (
        <div className="flex justify-center py-6 text-sm text-muted-foreground animate-pulse">
          Thinking...
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
};

export default MessageList;
