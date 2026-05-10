// src/components/AgentSelector.tsx - OPTIMIZED WITH ACCESSIBILITY
import { useState, useMemo } from "react";
import { Agent } from "@/types/agent";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Search, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

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
  const [isNewUI, setIsNewUI] = useState(false);

  useEffect(() => {
    const cookieValue = document.cookie
      .split("; ")
      .find((row) => row.startsWith("IsNewChatPage="))
      ?.split("=")[1];
    setIsNewUI(cookieValue === "true");
  }, []);

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

  const trigger = compactMode ? (
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
        <span className="truncate max-w-[120px]">{selectedAgents[0].name}</span>
      ) : (
        <span>{selectedCount} Agents</span>
      )}
    </Button>
  );

  const renderContent = () => (
    <div className="space-y-5">
      <div
        className={cn(
          "flex items-center justify-between gap-3 pb-2",
          isNewUI && "border-b border-white/[0.04]",
        )}
      >
        <div className="flex-1">
          <h4
            className={cn(
              "font-bold tracking-tight",
              isNewUI ? "text-lg text-foreground" : "text-sm",
            )}
            id="agent-selector-title"
          >
            Select Agents
          </h4>
          <p
            className="text-xs text-muted-foreground/60"
            id="agent-selector-description"
          >
            Choose agents and dictate their execution order
          </p>
        </div>
        <div className={cn("relative group", isNewUI ? "w-80" : "w-72")}>
          {isNewUI && (
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-accent/50 rounded-xl opacity-20 group-hover:opacity-40 blur-sm transition-opacity duration-500" />
          )}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder="Search available agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-9 h-10 bg-muted/30 focus-visible:ring-primary/50",
                isNewUI
                  ? "rounded-xl border-white/[0.08] bg-black/20 backdrop-blur-md"
                  : "h-9",
              )}
            />
          </div>
        </div>
      </div>

      <div className="custom-scrollbar max-h-[60vh] overflow-y-auto pr-1 space-y-6">
        {/* Custom agents */}
        {filteredCustomAgents.length > 0 && (
          <div role="group" aria-labelledby="custom-agents-heading">
            <div className="flex items-center gap-2 mb-3">
              <h5
                id="custom-agents-heading"
                className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80"
              >
                Custom Agents
              </h5>
              <div className="h-px flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {filteredCustomAgents.map((agent) => {
                const selectionOrder = getSelectionOrder(agent.id);
                const isSelected = selectionOrder !== null;
                return (
                  <button
                    key={agent.id}
                    onClick={() => toggleAgent(agent)}
                    className={cn(
                      "relative p-3.5 rounded-xl border transition-all duration-500 flex flex-col items-start text-left gap-2 min-h-[96px] w-full hover:-translate-y-1",
                      isSelected
                        ? "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/40 shadow-xl shadow-primary/5"
                        : "bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.05] hover:border-primary/30",
                    )}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center shadow-lg border-2 border-background animate-in zoom-in-50 duration-300">
                        {selectionOrder}
                      </div>
                    )}
                    <div
                      className="w-2.5 h-2.5 rounded-full ring-4 ring-white/[0.03]"
                      style={{ backgroundColor: getAgentColor(agent.id) }}
                    />
                    <div className="flex-1 flex flex-col gap-0.5 w-full">
                      <span className="text-[13px] font-bold text-foreground/90 truncate w-full">
                        {agent.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70 line-clamp-2 leading-snug">
                        {agent.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Default agents */}
        <div role="group" aria-labelledby="default-agents-heading">
          <div className="flex items-center gap-2 mb-3">
            <h5
              id="default-agents-heading"
              className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80"
            >
              Available Agents
            </h5>
            <div className="h-px flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
          </div>

          {filteredDefaultAgents.length === 0 && searchQuery ? (
            <div
              className="text-center py-8 bg-white/[0.01] rounded-xl border border-white/[0.04]"
              role="status"
            >
              <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No results found for "{searchQuery}"
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {filteredDefaultAgents.map((agent) => {
                const selectionOrder = getSelectionOrder(agent.id);
                const isSelected = selectionOrder !== null;
                return (
                  <button
                    key={agent.id}
                    onClick={() => toggleAgent(agent)}
                    className={cn(
                      "relative p-3.5 rounded-xl border transition-all duration-500 flex flex-col items-start text-left gap-2 min-h-[96px] w-full hover:-translate-y-1",
                      isSelected
                        ? "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/40 shadow-xl shadow-primary/5"
                        : "bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.05] hover:border-primary/30",
                    )}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center shadow-lg border-2 border-background animate-in zoom-in-50 duration-300">
                        {selectionOrder}
                      </div>
                    )}
                    <div
                      className="w-2.5 h-2.5 rounded-full ring-4 ring-white/[0.03]"
                      style={{ backgroundColor: getAgentColor(agent.id) }}
                    />
                    <div className="flex-1 flex flex-col gap-0.5 w-full">
                      <span className="text-[13px] font-bold text-foreground/90 truncate w-full">
                        {agent.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70 line-clamp-2 leading-snug">
                        {agent.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isNewUI) {
    return (
      <Dialog>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="w-full max-w-4xl p-6 bg-[#09090b]/95 border-white/[0.08] shadow-[0_0_50px_-12px_rgba(0,0,0,0.7)] rounded-2xl backdrop-blur-3xl outline-none">
          <DialogHeader className="hidden">
            <DialogTitle>Select Agents</DialogTitle>
            <DialogDescription>Choose agents.</DialogDescription>
          </DialogHeader>
          {renderContent()}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-[680px] max-w-[95vw] p-5 bg-[#0d0d10]/95 border-white/[0.06] shadow-2xl shadow-black/40 rounded-2xl backdrop-blur-2xl overflow-y-auto max-h-[80vh] custom-scrollbar"
        align="start"
        role="dialog"
        aria-label="Agent selection dialog"
      >
        {renderContent()}
      </PopoverContent>
    </Popover>
  );
};
