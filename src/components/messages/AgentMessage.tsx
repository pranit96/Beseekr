import React from "react";
import AgentResponseCard, { AgentResponse } from "./AgentResponseCard";

interface AgentMessageProps {
  responses: AgentResponse[];
  onForkAgent?: (agentId: string) => void;
  onReplaceResponse?: (oldAgentId: string, newResponse: AgentResponse) => void;
}

export const AgentMessage: React.FC<AgentMessageProps> = ({
  responses,
  onForkAgent,
  onReplaceResponse,
}) => {
  if (!responses || responses.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 w-full">
      {responses.map((res, i) => (
        <AgentResponseCard
          key={`${res.agentId}-${i}`}
          response={res}
          index={i}
          onForkAgent={onForkAgent}
          onReplaceResponse={onReplaceResponse}
        />
      ))}
    </div>
  );
};

export default AgentMessage;
