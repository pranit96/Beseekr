import { ExecutionMode } from '@/types/agent';
import { Button } from '@/components/ui/button';
import { ArrowRight, Grid2X2 } from 'lucide-react';

interface ExecutionModeToggleProps {
  mode: ExecutionMode;
  onModeChange: (mode: ExecutionMode) => void;
}

export const ExecutionModeToggle = ({
  mode,
  onModeChange,
}: ExecutionModeToggleProps) => {
  return (
    <div className="flex gap-1 p-1 glass rounded-full">
      <Button
        variant={mode === 'sequential' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('sequential')}
        className="gap-2 transition-smooth rounded-full"
      >
        <ArrowRight className="w-4 h-4" />
        <span className="hidden sm:inline">Sequential</span>
      </Button>
      <Button
        variant={mode === 'parallel' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('parallel')}
        className="gap-2 transition-smooth rounded-full"
      >
        <Grid2X2 className="w-4 h-4" />
        <span className="hidden sm:inline">Parallel</span>
      </Button>
    </div>
  );
};
