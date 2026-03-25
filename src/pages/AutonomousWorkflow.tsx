// src/pages/AutonomousWorkflow.tsx
import { GlobalHeader } from '@/components/GlobalHeader';
import { AutonomousWorkflowInterface } from '@/components/AutonomousWorkflowInterface';

export default function AutonomousWorkflow() {
  return (
    <div className="flex flex-col h-screen">
      <GlobalHeader />
      <div className="flex-1 overflow-hidden">
        <AutonomousWorkflowInterface />
      </div>
    </div>
  );
}
