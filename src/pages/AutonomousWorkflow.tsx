// src/pages/AutonomousWorkflow.tsx
// Standalone URL entry point for the autonomous workflow.
// The primary launch path is via the "Workflow" button inside ChatInterface.

import { useQueryClient } from "@tanstack/react-query";
import { GlobalHeader } from "@/components/GlobalHeader";
import { AutonomousWorkflowInterface } from "@/components/AutonomousWorkflowInterface";

export default function AutonomousWorkflow() {
  const queryClient = useQueryClient();

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <GlobalHeader />
      <div className="flex-1 relative overflow-hidden">
        <AutonomousWorkflowInterface
          onWorkflowComplete={() => {
            // Invalidate history cache so the Chat sidebar reflects the new run
            queryClient.invalidateQueries({ queryKey: ["workflow-history"] });
          }}
        />
      </div>
    </div>
  );
}
