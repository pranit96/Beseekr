import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { defaultAgents } from '@/lib/mockAgents';
import { Agent } from '@/types/agent';
import { AgentDialog } from '@/components/AgentDialog';
import { useToast } from '@/hooks/use-toast';

const Agents = () => {
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const { toast } = useToast();

  const handleSaveAgent = (agent: Agent) => {
    if (editingAgent) {
      setAgents(agents.map((a) => (a.id === agent.id ? agent : a)));
      toast({ title: 'Agent updated successfully' });
    } else {
      setAgents([...agents, { ...agent, isCustom: true }]);
      toast({ title: 'Agent created successfully' });
    }
    setIsDialogOpen(false);
    setEditingAgent(null);
  };

  const handleDeleteAgent = (agentId: string) => {
    setAgents(agents.filter((a) => a.id !== agentId));
    toast({ title: 'Agent deleted' });
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manage Agents</h1>
            <p className="text-muted-foreground mt-1">
              Create and customize your AI agents
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingAgent(null);
              setIsDialogOpen(true);
            }}
            className="gap-2 shadow-medium hover:shadow-glow transition-smooth"
          >
            <Plus className="w-4 h-4" />
            Create Agent
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent, index) => (
            <div
              key={agent.id}
              className="glass rounded-xl p-6 shadow-soft hover:shadow-medium transition-smooth group"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `hsl(var(--agent-${(index % 5) + 1}) / 0.15)`,
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: `hsl(var(--agent-${(index % 5) + 1}))` }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {agent.description}
                  </p>
                  {agent.isCustom && (
                    <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      Custom
                    </span>
                  )}
                </div>
              </div>

              {agent.isCustom && (
                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-smooth">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditAgent(agent)}
                    className="flex-1 gap-2"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAgent(agent.id)}
                    className="flex-1 gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <AgentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        agent={editingAgent}
        onSave={handleSaveAgent}
      />
    </div>
  );
};

export default Agents;
