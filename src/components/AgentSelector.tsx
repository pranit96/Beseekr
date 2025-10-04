import { Agent } from '@/types/agent';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Users, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgents: Agent[];
  onAgentsChange: (agents: Agent[]) => void;
}

export const AgentSelector = ({
  agents,
  selectedAgents,
  onAgentsChange,
}: AgentSelectorProps) => {
  const toggleAgent = (agent: Agent) => {
    const isSelected = selectedAgents.some((a) => a.id === agent.id);
    if (isSelected) {
      onAgentsChange(selectedAgents.filter((a) => a.id !== agent.id));
    } else {
      onAgentsChange([...selectedAgents, agent]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 glass border-border/50 hover:border-primary transition-smooth"
        >
          <Users className="w-4 h-4" />
          <span>Agents</span>
          {selectedAgents.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-2">
              {selectedAgents.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3 glass" align="start">
        <div className="space-y-1">
          <h4 className="font-medium text-sm mb-2">Select Agents</h4>
          {agents.map((agent, index) => {
            const isSelected = selectedAgents.some((a) => a.id === agent.id);
            return (
              <button
                key={agent.id}
                onClick={() => toggleAgent(agent)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-smooth text-left group"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: `hsl(var(--agent-${(index % 5) + 1}))` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{agent.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {agent.description}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
