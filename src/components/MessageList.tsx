import React, { useEffect, useRef } from "react";
import AgentMessage from "./messages/AgentMessage";
import { ChatMessage } from "@/types/agent";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
}) => {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col gap-6 px-6 py-4 overflow-y-auto">
      {messages.map((msg, idx) => {
        if (msg.type === "user") {
          return (
            <div key={`user-${idx}`} className="flex justify-end">
              <div className="max-w-[70%] rounded-xl bg-primary text-primary-foreground px-4 py-2 shadow-sm">
                {msg.content}
              </div>
            </div>
          );
        }

        if (msg.type === "agent" && msg.agentResponses) {
          return (
            <div
              key={`agent-${idx}`}
              className="flex flex-col items-start gap-2 w-full"
            >
              <AgentMessage
                key={`agent-message-${idx}`}
                responses={msg.agentResponses}
              />
            </div>
          );
        }

        return null;
      })}

      {/* Thinking indicator */}
      {isLoading && (
        <div className="flex items-center justify-start gap-2 text-muted-foreground pl-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm animate-pulse">Thinking...</span>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
};

export default MessageList;
