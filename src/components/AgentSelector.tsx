// src/components/AgentSelector.tsx
import { useState, useMemo } from 'react';
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

  const customAgents = useMemo(() => agents.filter(a => !a.is_default), [agents]);
  const defaultAgents = useMemo(() => agents.filter(a => a.is_default), [agents]);

  const filteredDefaultAgents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return defaultAgents;
    
    return defaultAgents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(q) ||
        (agent.description || '').toLowerCase().includes(q) ||
        (agent.domain || '').toLowerCase().includes(q)
    );
  }, [defaultAgents, searchQuery]);

  const filteredCustomAgents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customAgents;
    
    return customAgents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(q) ||
        (agent.description || '').toLowerCase().includes(q)
    );
  }, [customAgents, searchQuery]);

  const getAgentColor = (agentId: string) => {
    const colors = [
      'hsl(var(--agent-1))',
      'hsl(var(--agent-2))',
      'hsl(var(--agent-3))',
      'hsl(var(--agent-4))',
      'hsl(var(--agent-5))'
    ];
    const hash = agentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getSelectionOrder = (agentId: string): number | null => {
    const index = selectedAgents.findIndex(a => a.id === agentId);
    return index >= 0 ? index + 1 : null;
  };

  const toggleAgent = (agent: Agent) => {
    const isSelected = selectedAgents.some((a) => a.id === agent.id);
    if (isSelected) {
      onAgentsChange(selectedAgents.filter((a) => a.id !== agent.id));
    } else {
      onAgentsChange([...selectedAgents, agent]);
    }
  };

  const selectedCount = selectedAgents.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 glass border-border/50 hover:border-primary transition-smooth"
        >
          <Users className="w-4 h-4" />
          <span>Agents</span>
          {selectedCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-2">
              {selectedCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[680px] max-w-[95vw] p-4 glass" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <h4 className="font-medium text-sm">Select Agents</h4>
              <p className="text-xs text-muted-foreground">Choose agents and see their execution order</p>
            </div>
            <div className="w-72">
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
          </div>

          {/* Custom agents pinned to top */}
          {filteredCustomAgents.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-muted-foreground mb-2">Your agents</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {filteredCustomAgents.map((agent) => {
                  const selectionOrder = getSelectionOrder(agent.id);
                  const isSelected = selectionOrder !== null;
                  
                  return (
                    <button
                      key={agent.id}
                      onClick={() => toggleAgent(agent)}
                      className={`relative p-3 rounded-lg border transition-smooth flex items-start gap-2 min-h-[80px] w-full ${
                        isSelected 
                          ? 'bg-primary/10 border-primary/30 shadow-sm ring-2 ring-primary/20' 
                          : 'hover:bg-muted/40 border-border'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md border-2 border-background z-10">
                          {selectionOrder}
                        </div>
                      )}
                      
                      <div
                        className="w-3 h-3 rounded-full shrink-0 mt-1"
                        style={{ backgroundColor: getAgentColor(agent.id) }}
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-medium truncate">{agent.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {agent.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Default agents */}
          <div>
            <h5 className="text-xs font-semibold text-muted-foreground mb-2">Default agents</h5>
            {filteredDefaultAgents.length === 0 && searchQuery ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No agents match your search</p>
                <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
              </div>
            ) : filteredDefaultAgents.length === 0 && !searchQuery ? (
              <p className="text-sm text-muted-foreground">No default agents available</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {filteredDefaultAgents.map((agent) => {
                  const selectionOrder = getSelectionOrder(agent.id);
                  const isSelected = selectionOrder !== null;
                  
                  return (
                    <button
                      key={agent.id}
                      onClick={() => toggleAgent(agent)}
                      className={`relative p-3 rounded-lg border transition-smooth flex items-start gap-2 min-h-[80px] w-full ${
                        isSelected 
                          ? 'bg-primary/10 border-primary/30 shadow-sm ring-2 ring-primary/20' 
                          : 'hover:bg-muted/40 border-border'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md border-2 border-background z-10">
                          {selectionOrder}
                        </div>
                      )}
                      
                      <div
                        className="w-3 h-3 rounded-full shrink-0 mt-1"
                        style={{ backgroundColor: getAgentColor(agent.id) }}
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-medium truncate">{agent.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {agent.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};