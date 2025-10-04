import { useState } from 'react';
import { Agent } from '@/types/agent';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Users, Check, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <PopoverContent className="w-96 p-4 glass" align="start">
        <div className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Select Agents</h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {filteredAgents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No agents found
              </p>
            ) : (
              filteredAgents.map((agent, index) => {
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
            })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
