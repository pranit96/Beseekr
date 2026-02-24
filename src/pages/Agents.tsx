import { useState, useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Folder, User, Copy, Sparkles, BarChart3, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AgentDialog } from '@/components/AgentDialog';
import { Agent, AgentTemplate } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';
import { TopBar } from '@/components/TopBar';
import { apiClient } from '@/lib/api';
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
import { useMyAgents, useCreateAgent, useUpdateAgent, useDeleteAgent } from '@/hooks/use-api-queries';

const Agents = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | undefined>();
  const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['My Agents']));
  const { toast } = useToast();

  // Templates state
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Duplicate state
  const [duplicating, setDuplicating] = useState<string | null>(null);

  // React Query hooks
  const { data: agentsResponse, isLoading: loading, error, refetch } = useMyAgents();
  const createAgentMutation = useCreateAgent();
  const updateAgentMutation = useUpdateAgent();
  const deleteAgentMutation = useDeleteAgent();

  const agents = agentsResponse?.data || [];

  // Show error toast if query fails (only once)
  useEffect(() => {
    if (error) {
      toast({
        title: 'Failed to load agents',
        description: (error as any).message,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Fetch templates
  const fetchTemplates = async () => {
    if (templates.length > 0) {
      setShowTemplates(!showTemplates);
      return;
    }
    setLoadingTemplates(true);
    setShowTemplates(true);
    try {
      const response = await apiClient.getAgentTemplates();
      if (response.success && response.data) {
        setTemplates(Array.isArray(response.data) ? response.data : response.data.templates || []);
      }
    } catch (err: any) {
      toast({ title: 'Failed to load templates', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const categorizedAgents = useMemo(() => {
    const filtered = agents.filter((agent) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        agent.name.toLowerCase().includes(searchLower) ||
        (agent.domain && agent.domain.toLowerCase().includes(searchLower)) ||
        agent.description.toLowerCase().includes(searchLower)
      );
    });

    // Separate custom agents from default agents
    const customAgents = filtered.filter(agent => !agent.is_default);
    const defaultAgents = filtered.filter(agent => agent.is_default);

    // Group default agents by domain
    const domainGroups: Record<string, Agent[]> = {};
    defaultAgents.forEach(agent => {
      const domain = agent.domain || 'General';
      if (!domainGroups[domain]) {
        domainGroups[domain] = [];
      }
      domainGroups[domain].push(agent);
    });

    return {
      custom: customAgents,
      domains: domainGroups,
    };
  }, [agents, searchQuery]);

  const handleSaveAgent = async (agent: Agent) => {
    if (agent.id && editingAgent) {
      await updateAgentMutation.mutateAsync({ id: agent.id, agent });
    } else {
      await createAgentMutation.mutateAsync(agent);
    }
    setIsDialogOpen(false);
    setEditingAgent(undefined);
  };

  const handleDeleteAgent = async () => {
    if (!deleteAgentId) return;
    await deleteAgentMutation.mutateAsync(deleteAgentId);
    setDeleteAgentId(null);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setIsDialogOpen(true);
  };

  const handleDuplicate = async (agentId: string) => {
    setDuplicating(agentId);
    try {
      const response = await apiClient.duplicateAgent(agentId);
      if (response.success) {
        toast({ title: 'Agent duplicated', description: 'A copy has been created.' });
        refetch();
      } else {
        throw new Error(response.error || 'Duplicate failed');
      }
    } catch (err: any) {
      toast({ title: 'Duplicate failed', description: err.message, variant: 'destructive' });
    } finally {
      setDuplicating(null);
    }
  };

  const handleCreateFromTemplate = (template: AgentTemplate) => {
    setEditingAgent({
      id: '',
      name: template.name,
      description: template.description,
      domain: template.domain || '',
      system_prompt: template.system_prompt,
      color: template.color || 'hsl(var(--primary))',
      is_default: false,
    } as Agent);
    setIsDialogOpen(true);
  };

  const AgentCard = ({ agent, index }: { agent: Agent; index: number }) => (
    <Card className="p-5 glass hover:shadow-glow transition-smooth group relative">
      <div className="flex items-start gap-3 mb-3">
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
          <h3 className="font-semibold text-base truncate">{agent.name}</h3>
          <Badge variant="secondary" className="mt-1 text-xs">
            {agent.domain || 'General'}
          </Badge>
        </div>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
        {agent.description}
      </p>

      {agent.system_prompt && (
        <div className="mb-3 p-2.5 bg-muted/50 rounded-md">
          <p className="text-xs font-medium text-muted-foreground mb-1">Role:</p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {agent.system_prompt}
          </p>
        </div>
      )}

      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-smooth">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleEditAgent(agent)}
          className="flex-1 text-xs"
        >
          <Pencil className="w-3 h-3 mr-1" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleDuplicate(agent.id)}
          disabled={duplicating === agent.id}
          className="text-xs"
          title="Duplicate agent"
        >
          {duplicating === agent.id ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setDeleteAgentId(agent.id)}
          className="text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <>
        <TopBar />
        <div className="h-full flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading agents...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <div className="mx-auto p-4 sm:p-6 md:p-8 max-w-[2200px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              My Agents
            </h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
              Create and manage your AI agents
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={fetchTemplates}
              variant="outline"
              className="gap-2 flex-1 sm:flex-initial"
            >
              <Sparkles className="w-4 h-4" />
              Templates
            </Button>
            <Button
              onClick={() => {
                setEditingAgent(undefined);
                setIsDialogOpen(true);
              }}
              className="gap-2 shadow-medium hover:shadow-glow transition-smooth flex-1 sm:flex-initial"
            >
              <Plus className="w-4 h-4" />
              Create Agent
            </Button>
          </div>
        </div>

        {/* Templates Gallery */}
        {showTemplates && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Starter Templates</h2>
              <Badge variant="secondary" className="text-xs">{templates.length}</Badge>
            </div>
            {loadingTemplates ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading templates...
              </div>
            ) : templates.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No templates available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="p-4 glass hover:shadow-glow transition-smooth cursor-pointer border-dashed border-primary/30 hover:border-primary/60"
                    onClick={() => handleCreateFromTemplate(template)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {template.icon && <span className="text-lg">{template.icon}</span>}
                      <h3 className="font-semibold text-sm">{template.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                    <p className="text-xs text-primary mt-2 font-medium">Click to use →</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {agents.length > 0 && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Custom Agents Section */}
          {categorizedAgents.custom.length > 0 && (
            <div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <User className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold flex-1 text-left">
                  My Custom Agents
                </h2>
                <Badge variant="secondary">{categorizedAgents.custom.length}</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
                {categorizedAgents.custom.map((agent, index) => (
                  <AgentCard key={agent.id} agent={agent} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* Domain-based Agent Categories */}
          {Object.entries(categorizedAgents.domains).map(([domain, domainAgents]) => (
            <div key={domain}>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <Folder className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-semibold flex-1 text-left">{domain}</h2>
                <Badge variant="secondary">{domainAgents.length}</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
                {domainAgents.map((agent, index) => (
                  <AgentCard key={agent.id} agent={agent} index={index} />
                ))}
              </div>
            </div>
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

        {agents.length > 0 && categorizedAgents.custom.length === 0 && Object.keys(categorizedAgents.domains).length === 0 && searchQuery && (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">
              No agents found matching "{searchQuery}"
            </p>
            <Button
              onClick={() => setSearchQuery('')}
              variant="outline"
            >
              Clear Search
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
    </>
  );
};

export default Agents;