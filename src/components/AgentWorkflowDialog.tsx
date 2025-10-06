import { useState, useEffect } from 'react';
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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    setOrderedAgents(selectedAgents);
  }, [selectedAgents]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...orderedAgents];
    const draggedAgent = newOrder[draggedIndex];
    
    // Remove from old position
    newOrder.splice(draggedIndex, 1);
    // Insert at new position
    newOrder.splice(dropIndex, 0, draggedAgent);
    
    setOrderedAgents(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Design Agent Workflow</DialogTitle>
          <DialogDescription>
            Drag and drop to arrange the order in which agents will be executed
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 py-4 overflow-y-auto flex-1">
          {orderedAgents.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No agents selected
            </p>
          ) : (
            orderedAgents.map((agent, index) => (
              <div
                key={agent.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-4 rounded-lg border bg-card transition-all cursor-move
                  ${draggedIndex === index ? 'opacity-50 border-primary' : 'border-border'}
                  ${dragOverIndex === index ? 'border-primary border-2 scale-[1.02]' : ''}
                  hover:border-primary/50 hover:shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground mb-1 truncate">
                    {agent.name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {agent.description || 'No description available'}
                  </p>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveAgent(index, 'up')}
                    disabled={index === 0}
                    className="h-8 w-8 p-0"
                    title="Move up"
                  >
                    ▲
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveAgent(index, 'down')}
                    disabled={index === orderedAgents.length - 1}
                    className="h-8 w-8 p-0"
                    title="Move down"
                  >
                    ▼
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAgent(index)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Remove agent"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {orderedAgents.length} {orderedAgents.length === 1 ? 'agent' : 'agents'} in workflow
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={orderedAgents.length === 0}>
              Confirm Workflow
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};