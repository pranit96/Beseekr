import { ChatMessage } from '@/types/agent';

interface UserMessageProps {
  message: ChatMessage;
}

export const UserMessage = ({ message }: UserMessageProps) => {
  return (
    <div className="flex justify-end animate-fade-in">
      <div className="max-w-[80%] glass rounded-2xl rounded-tr-md p-4 shadow-medium">
        <p className="text-foreground whitespace-pre-wrap">{message.content}</p>
        <span className="text-xs text-muted-foreground mt-2 block">
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
};
