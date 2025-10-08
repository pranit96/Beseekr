import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@/types/agent';
import { UserMessage } from './messages/UserMessage';
import { AgentMessage } from './messages/AgentMessage';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export const MessageList = ({ messages, isLoading = false }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const previousMessageCountRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle scroll behavior
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Clear any pending scroll timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set timeout to determine if user has stopped scrolling
      scrollTimeoutRef.current = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
        setIsAutoScroll(isNearBottom);
      }, 100);
    };

    // Improve touch/scroll stability on large screens: prevent overscroll "shaky" feel
    container.style.overscrollBehavior = 'contain';
    container.style.touchAction = 'pan-y';

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      // reset styles on unmount
      if (container) {
        container.style.overscrollBehavior = '';
        container.style.touchAction = '';
      }
    };
  }, []);

  // Smooth scroll to bottom with IntersectionObserver for better performance
  useEffect(() => {
    if (!isAutoScroll || !messagesEndRef.current) return;

    const isNewMessage = messages.length > previousMessageCountRef.current;
    const isFirstLoad = previousMessageCountRef.current === 0;

    previousMessageCountRef.current = messages.length;

    // Use IntersectionObserver for smoother scrolling
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && isAutoScroll) {
            messagesEndRef.current?.scrollIntoView({
              behavior: isFirstLoad ? 'instant' : 'smooth',
              block: 'end',
            });
          }
        });
      },
      {
        root: messagesContainerRef.current,
        threshold: 0.1,
      }
    );

    if (messagesEndRef.current) {
      observer.observe(messagesEndRef.current);
    }

    // Also scroll immediately for new messages
    if (isNewMessage || isLoading) {
      messagesEndRef.current?.scrollIntoView({
        behavior: isFirstLoad ? 'instant' : 'smooth',
        block: 'end',
      });
    }

    return () => observer.disconnect();
  }, [messages, isAutoScroll, isLoading]);

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
      style={{
        scrollBehavior: 'smooth',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
      }}
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

          {isLoading && (
            <div className="flex justify-start mb-6 animate-fade-in">
              <div className="max-w-[90%] sm:max-w-[85%] md:max-w-[80%]">
                <div className="glass rounded-xl p-4 shadow-soft">
                  <div className="flex items-center gap-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-muted-foreground">Processing your request...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </>
      )}
    </div>
  );
};