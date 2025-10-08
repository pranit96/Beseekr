import React from "react";
import AgentResponseCard from "./messages/AgentResponseCard";
import { ChatMessage } from "@/types/agent";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
}) => {
  return (
    <div className="flex flex-col space-y-8 px-4 md:px-10 max-w-5xl mx-auto w-full py-6">
      {messages.map((msg) => {
        if (msg.type === "user") {
          return (
            <div key={msg.id} className="flex justify-end w-full">
              <div className="max-w-[80%] bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-br-none shadow-sm whitespace-pre-wrap">
                {msg.content}
              </div>
            </div>
          );
        }

        if (msg.type === "agent") {
          return (
            <div key={msg.id} className="flex justify-start w-full">
              <div className="flex flex-col space-y-4 w-full">
                {msg.executionMode === "parallel" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {msg.agentResponses.map((res, i) => (
                      <AgentResponseCard key={i} response={res} index={i} />
                    ))}
                  </div>
                ) : (
                  msg.agentResponses.map((res, i) => (
                    <AgentResponseCard key={i} response={res} index={i} />
                  ))
                )}
              </div>
            </div>
          );
        }

        return null;
      })}

      {isLoading && (
        <div className="flex justify-center text-sm text-muted-foreground animate-pulse py-4">
          Thinking…
        </div>
      )}
    </div>
  );
};
