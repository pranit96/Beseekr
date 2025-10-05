import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AgentDialog } from '@/components/AgentDialog';
import { Agent } from '@/types/agent';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Agents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | undefined>();
  const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await apiClient.getMyAgents();
      if (response.success && response.data) {
        setAgents(response.data);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to load agents',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAgent = async (agent: Agent) => {
    try {
      if (agent.id && editingAgent) {
        const response = await apiClient.updateAgent(agent.id, agent);
        if (response.success) {
          setAgents(agents.map((a) => (a.id === agent.id ? agent : a)));
          toast({
            title: 'Agent updated',
            description: `${agent.name} has been updated successfully.`,
          });
        }
      } else {
        const response = await apiClient.createAgent(agent);
        if (response.success && response.data) {
          setAgents([...agents, response.data]);
          toast({
            title: 'Agent created',
            description: `${agent.name} has been created successfully.`,
          });
        }
      }
      setIsDialogOpen(false);
      setEditingAgent(undefined);
    } catch (error: any) {
      toast({
        title: 'Failed to save agent',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAgent = async () => {
    if (!deleteAgentId) return;

    try {
      const response = await apiClient.deleteAgent(deleteAgentId);
      if (response.success) {
        setAgents(agents.filter((a) => a.id !== deleteAgentId));
        toast({
          title: 'Agent deleted',
          description: 'The agent has been permanently deleted.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Failed to delete agent',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleteAgentId(null);
    }
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading agents...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            My Agents
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your AI agents
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingAgent(undefined);
            setIsDialogOpen(true);
          }}
          className="gap-2 shadow-medium hover:shadow-glow transition-smooth"
        >
          <Plus className="w-4 h-4" />
          Create Agent
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent, index) => (
          <Card
            key={agent.id}
            className="p-6 glass hover:shadow-glow transition-smooth group relative"
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
                style={{
                  backgroundColor: `hsl(var(--agent-${(index % 5) + 1}) / 0.2)`,
                }}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: `hsl(var(--agent-${(index % 5) + 1}))` }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{agent.name}</h3>
                <Badge variant="secondary" className="mt-1">
                  {agent.domain || 'General'}
                </Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {agent.description}
            </p>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-smooth">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEditAgent(agent)}
                className="flex-1"
              >
                <Pencil className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleteAgentId(agent.id)}
                className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {agents.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">No agents yet. Create your first agent to get started!</p>
          <Button
            onClick={() => setIsDialogOpen(true)}
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Your First Agent
          </Button>
        </div>
      )}

      <AgentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        agent={editingAgent}
        onSave={handleSaveAgent}
      />

      <AlertDialog open={!!deleteAgentId} onOpenChange={() => setDeleteAgentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this agent? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAgent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Agents;
