// src/components/AgentSelector.tsx - OPTIMIZED WITH ACCESSIBILITY
import { useState, useMemo } from "react";
import { Agent } from "@/types/agent";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Users, Search, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgents: Agent[];
  onAgentsChange: (agents: Agent[]) => void;
  compactMode?: boolean;
}

export const AgentSelector = ({
  agents,
  selectedAgents,
  onAgentsChange,
  compactMode = false,
}: AgentSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const customAgents = useMemo(
    () => agents.filter((a) => !a.is_default),
    [agents],
  );
  const defaultAgents = useMemo(
    () => agents.filter((a) => a.is_default),
    [agents],
  );

  const filteredDefaultAgents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return defaultAgents;

    return defaultAgents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(q) ||
        (agent.description || "").toLowerCase().includes(q) ||
        (agent.domain || "").toLowerCase().includes(q),
    );
  }, [defaultAgents, searchQuery]);

  const filteredCustomAgents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customAgents;

    return customAgents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(q) ||
        (agent.description || "").toLowerCase().includes(q),
    );
  }, [customAgents, searchQuery]);

  const getAgentColor = (agentId: string) => {
    const colors = [
      "hsl(var(--agent-1))",
      "hsl(var(--agent-2))",
      "hsl(var(--agent-3))",
      "hsl(var(--agent-4))",
      "hsl(var(--agent-5))",
    ];
    const hash = agentId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getSelectionOrder = (agentId: string): number | null => {
    const index = selectedAgents.findIndex((a) => a.id === agentId);
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
        {compactMode ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 shrink-0"
            aria-label="Select more agents"
          >
            <Plus className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            className="gap-2 glass border-border/50 hover:border-primary transition-smooth"
            aria-label={`Select agents. ${selectedCount} agent${selectedCount !== 1 ? "s" : ""} selected`}
            aria-haspopup="dialog"
          >
            <Users className="w-4 h-4" aria-hidden="true" />
            {selectedCount === 0 ? (
              <span>Select Agents</span>
            ) : selectedCount === 1 ? (
              <span className="truncate max-w-[120px]">
                {selectedAgents[0].name}
              </span>
            ) : (
              <span>{selectedCount} Agents</span>
            )}
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent
        className="w-[680px] max-w-[95vw] p-5 bg-[#0d0d10]/95 border-white/[0.06] shadow-2xl shadow-black/40 rounded-2xl backdrop-blur-2xl overflow-y-auto max-h-[80vh] custom-scrollbar"
        align="start"
        role="dialog"
        aria-label="Agent selection dialog"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <h4 className="font-medium text-sm" id="agent-selector-title">
                Select Agents
              </h4>
              <p
                className="text-xs text-muted-foreground"
                id="agent-selector-description"
              >
                Choose agents and see their execution order
              </p>
            </div>
            <div className="w-72">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                  aria-label="Search agents by name, description, or domain"
                />
              </div>
            </div>
          </div>

          {/* Custom agents pinned to top */}
          {filteredCustomAgents.length > 0 && (
            <div role="group" aria-labelledby="custom-agents-heading">
              <h5
                id="custom-agents-heading"
                className="text-xs font-semibold text-muted-foreground mb-2"
              >
                Your agents
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {filteredCustomAgents.map((agent) => {
                  const selectionOrder = getSelectionOrder(agent.id);
                  const isSelected = selectionOrder !== null;

                  return (
                    <button
                      key={agent.id}
                      onClick={() => toggleAgent(agent)}
                      className={`relative p-3 rounded-xl border transition-all duration-300 flex items-start gap-2.5 min-h-[84px] w-full group/agent hover:-translate-y-0.5 ${
                        isSelected
                          ? "bg-primary/[0.08] border-primary/40 shadow-lg shadow-primary/5"
                          : "bg-white/[0.01] hover:bg-white/[0.04] border-white/[0.05] hover:border-white/[0.1] hover:shadow-md"
                      }`}
                      aria-label={`${isSelected ? "Deselect" : "Select"} ${agent.name}. ${agent.description}. ${isSelected ? `Position ${selectionOrder} in execution order` : ""}`}
                      aria-pressed={isSelected}
                      role="checkbox"
                      aria-checked={isSelected}
                    >
                      {isSelected && (
                        <div
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md border-2 border-background z-10 animate-scale-in"
                          aria-label={`Execution order: ${selectionOrder}`}
                        >
                          {selectionOrder}
                        </div>
                      )}

                      <div
                        className="w-3 h-3 rounded-full shrink-0 mt-1"
                        style={{ backgroundColor: getAgentColor(agent.id) }}
                        aria-hidden="true"
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-medium truncate">
                          {agent.name}
                        </div>
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
          <div role="group" aria-labelledby="default-agents-heading">
            <h5
              id="default-agents-heading"
              className="text-xs font-semibold text-muted-foreground mb-2"
            >
              Default agents
            </h5>
            {filteredDefaultAgents.length === 0 && searchQuery ? (
              <div className="text-center py-4" role="status">
                <p className="text-sm text-muted-foreground">
                  No agents match your search
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try a different search term
                </p>
              </div>
            ) : filteredDefaultAgents.length === 0 && !searchQuery ? (
              <p className="text-sm text-muted-foreground" role="status">
                No default agents available
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {filteredDefaultAgents.map((agent) => {
                  const selectionOrder = getSelectionOrder(agent.id);
                  const isSelected = selectionOrder !== null;

                  return (
                    <button
                      key={agent.id}
                      onClick={() => toggleAgent(agent)}
                      className={`relative p-3 rounded-xl border transition-all duration-300 flex items-start gap-2.5 min-h-[84px] w-full group/agent hover:-translate-y-0.5 ${
                        isSelected
                          ? "bg-primary/[0.08] border-primary/40 shadow-lg shadow-primary/5"
                          : "bg-white/[0.01] hover:bg-white/[0.04] border-white/[0.05] hover:border-white/[0.1] hover:shadow-md"
                      }`}
                      aria-label={`${isSelected ? "Deselect" : "Select"} ${agent.name}. ${agent.description}. ${isSelected ? `Position ${selectionOrder} in execution order` : ""}`}
                      aria-pressed={isSelected}
                      role="checkbox"
                      aria-checked={isSelected}
                    >
                      {isSelected && (
                        <div
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md border-2 border-background z-10 animate-scale-in"
                          aria-label={`Execution order: ${selectionOrder}`}
                        >
                          {selectionOrder}
                        </div>
                      )}

                      <div
                        className="w-3 h-3 rounded-full shrink-0 mt-1"
                        style={{ backgroundColor: getAgentColor(agent.id) }}
                        aria-hidden="true"
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-medium truncate">
                          {agent.name}
                        </div>
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
