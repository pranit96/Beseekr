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

/**
 * AgentSelector
 * - Shows user-custom agents pinned at the top (keeps them out of domain grouping)
 * - Uses a responsive grid (1 → 4 columns) to make use of large screen space
 * - Selected agents are sorted to the top
 */

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

  // Fixed: Use the agents array directly without relying on findIndex for colors
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

  // Fixed: Simple color assignment that doesn't rely on findIndex
  const getAgentColor = (agentId: string) => {
    const colors = [
      'hsl(var(--agent-1))',
      'hsl(var(--agent-2))',
      'hsl(var(--agent-3))',
      'hsl(var(--agent-4))',
      'hsl(var(--agent-5))'
    ];
    // Simple hash-based color assignment that works consistently
    const hash = agentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
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
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <h4 className="font-medium text-sm">Select Agents</h4>
              <p className="text-xs text-muted-foreground">Pin your custom agents and then pick defaults.</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {filteredCustomAgents.map((agent) => {
                  const isSelected = selectedAgents.some((a) => a.id === agent.id);
                  return (
                    <button
                      key={agent.id}
                      onClick={() => toggleAgent(agent)}
                      className={`p-3 rounded-lg text-left border transition-smooth flex flex-col justify-between h-26 ${
                        isSelected ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: getAgentColor(agent.id) }}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{agent.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{agent.description}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary self-end mt-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Default agents (grouped visually in a responsive grid) */}
          <div>
            <h5 className="text-xs font-semibold text-muted-foreground mb-2">Default agents</h5>
            {filteredDefaultAgents.length === 0 && defaultAgents.length > 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No agents match your search</p>
                <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
              </div>
            ) : filteredDefaultAgents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No agents available</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {filteredDefaultAgents.map((agent) => {
                  const isSelected = selectedAgents.some((a) => a.id === agent.id);
                  return (
                    <button
                      key={agent.id}
                      onClick={() => toggleAgent(agent)}
                      className={`p-3 rounded-lg text-left border transition-smooth flex items-center gap-3 ${
                        isSelected ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/40'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: getAgentColor(agent.id) }}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{agent.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{agent.description}</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary ml-auto" />}
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