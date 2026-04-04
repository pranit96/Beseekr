import { ExecutionMode } from "@/types/agent";
import { Button } from "@/components/ui/button";
import { ArrowRight, Grid2X2 } from "lucide-react";

interface ExecutionModeToggleProps {
  mode: ExecutionMode;
  onModeChange: (mode: ExecutionMode) => void;
}

export const ExecutionModeToggle = ({
  mode,
  onModeChange,
}: ExecutionModeToggleProps) => {
  return (
    <div
      className="flex gap-1 p-1 glass rounded-full"
      role="group"
      aria-label="Execution mode selection"
    >
      <Button
        variant={mode === "sequential" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange("sequential")}
        className="gap-2 transition-smooth rounded-full px-3"
        aria-label="Sequential execution mode - agents run one after another"
        aria-pressed={mode === "sequential"}
        title="Sequential: Agents run one after another"
      >
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">Sequential</span>
      </Button>
      <Button
        variant={mode === "parallel" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange("parallel")}
        className="gap-2 transition-smooth rounded-full px-3"
        aria-label="Parallel execution mode - agents run simultaneously"
        aria-pressed={mode === "parallel"}
        title="Parallel: Agents run simultaneously"
      >
        <Grid2X2 className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">Parallel</span>
      </Button>
    </div>
  );
};
