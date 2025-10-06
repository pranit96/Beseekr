import { useState } from 'react';
import { GripVertical, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Agent } from '@/types/agent';

interface AgentWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: Agent[];
  selectedAgents: Agent[];
  onConfirm: (orderedAgents: Agent[]) => void;
}

export const AgentWorkflowDialog = ({
  open,
  onOpenChange,
  agents,
  selectedAgents,
  onConfirm,
}: AgentWorkflowDialogProps) => {
  const [orderedAgents, setOrderedAgents] = useState<Agent[]>(selectedAgents);

  const moveAgent = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...orderedAgents];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
      setOrderedAgents(newOrder);
    }
  };

  const removeAgent = (index: number) => {
    setOrderedAgents(orderedAgents.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    onConfirm(orderedAgents);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Design Agent Workflow</DialogTitle>
          <DialogDescription>
            Arrange the order in which agents will be executed
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          {orderedAgents.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No agents selected
            </p>
          ) : (
            orderedAgents.map((agent, index) => (
              <div
                key={agent.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
              >
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveAgent(index, 'up')}
                    disabled={index === 0}
                    className="h-4 w-6 p-0"
                  >
                    ▲
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveAgent(index, 'down')}
                    disabled={index === orderedAgents.length - 1}
                    className="h-4 w-6 p-0"
                  >
                    ▼
                  </Button>
                </div>
                
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <p className="text-sm font-medium truncate">{agent.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {agent.description}
                  </p>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAgent(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={orderedAgents.length === 0}>
            Confirm Workflow
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
