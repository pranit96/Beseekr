import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@/types/agent';
import { UserMessage } from './messages/UserMessage';
import { AgentMessage } from './messages/AgentMessage';

interface MessageListProps {
  messages: ChatMessage[];
}

export const MessageList = ({ messages }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  // Handle scroll behavior
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // If user scrolls up, disable auto-scroll
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsAutoScroll(isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to bottom - instant on first load, smooth thereafter
  useEffect(() => {
    if (isAutoScroll && messagesEndRef.current) {
      const isFirstLoad = messages.length <= 1;
      messagesEndRef.current.scrollIntoView({
        behavior: isFirstLoad ? 'instant' : 'smooth',
        block: 'end'
      });
    }
  }, [messages, isAutoScroll]);

  // Ensure all timestamps are Date objects before rendering
  const messagesWithProperTimestamps = messages.map(msg => ({
    ...msg,
    timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
    ...(msg.agentResponses && {
      agentResponses: msg.agentResponses.map(ar => ({
        ...ar,
        timestamp: ar.timestamp instanceof Date ? ar.timestamp : new Date(ar.timestamp),
      })),
    }),
  }));

  return (
    <div 
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
    >
      {messagesWithProperTimestamps.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-3 max-w-md">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Start a Conversation</h3>
            <p className="text-muted-foreground">
              Select agents and choose an execution mode to begin
            </p>
          </div>
        </div>
      ) : (
        <>
          {messagesWithProperTimestamps.map((message) =>
            message.type === 'user' ? (
              <UserMessage key={message.id} message={message} />
            ) : (
              <AgentMessage key={message.id} message={message} />
            )
          )}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};