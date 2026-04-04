// src/components/messages/AgentMessage.tsx
import React from "react";
import AgentResponseCard from "./AgentResponseCard";
import type { AgentResponse } from "@/types/agent";

interface Props {
  responses: AgentResponse[];
  executionMode?: "sequential" | "parallel";
  onForkAgent?: (agentId: string) => void;
  onRegenerate?: (response: AgentResponse) => void;
}

const AgentMessage: React.FC<Props> = ({
  responses,
  executionMode = "sequential",
  onForkAgent,
  onRegenerate,
}) => {
  if (!responses || responses.length === 0) return null;
  if (executionMode === "parallel") {
    return (
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {responses.map((r, i) => (
          <AgentResponseCard
            key={`${r.agentId}-${i}`}
            response={r as any}
            index={i}
            onForkAgent={onForkAgent}
            onRegenerate={onRegenerate}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 w-full">
      {responses.map((r, i) => (
        <AgentResponseCard
          key={`${r.agentId}-${i}`}
          response={r as any}
          index={i}
          onForkAgent={onForkAgent}
          onRegenerate={onRegenerate}
        />
      ))}
    </div>
  );
};

export default AgentMessage;
