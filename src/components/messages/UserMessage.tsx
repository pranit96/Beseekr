// In UserMessage.tsx - Add timestamp validation
import { ChatMessage } from '@/types/agent';

interface UserMessageProps {
  message: ChatMessage;
}

export const UserMessage = ({ message }: UserMessageProps) => {
  // Ensure timestamp is a Date object
  const timestamp = message.timestamp instanceof Date 
    ? message.timestamp 
    : new Date(message.timestamp);

  return (
    <div className="flex justify-end mb-6 animate-fade-in">
      <div className="max-w-[85%] sm:max-w-[75%] md:max-w-[70%]">
        <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-5 py-3.5 shadow-medium">
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 text-right px-1">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};