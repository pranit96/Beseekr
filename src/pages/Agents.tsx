import { useState, useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Folder, User, Copy, Sparkles, BarChart3, ChevronDown, ChevronRight, Loader2, Workflow, Wrench, FileText, Mail, Globe, MessageSquare, Database, FileOutput } from 'lucide-react';
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
import { WorkflowBuilder } from '@/components/WorkflowBuilder';

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

  // Workflow Builder state
  const [workflowBuilderOpen, setWorkflowBuilderOpen] = useState(false);

  // React Query hooks
  const { data: agentsResponse, isLoading: loading, error, refetch } = useMyAgents();
  const createAgentMutation = useCreateAgent();
  const updateAgentMutation = useUpdateAgent();
  const deleteAgentMutation = useDeleteAgent();

  // Extract agents from various possible response shapes
  const agents = useMemo(() => {
    if (!agentsResponse) return [];
    const d = agentsResponse.data;
    if (Array.isArray(d)) return d;
    if (d && Array.isArray(d.agents)) return d.agents;
    if (d && Array.isArray(d.data)) return d.data;
    return [];
  }, [agentsResponse]);

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

  // Agent card color schemes — Using inline styles because Tailwind purges dynamic class names
  const CARD_COLORS = [
    { gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', bg: 'rgba(139,92,246,0.1)', text: '#8b5cf6', border: 'rgba(139,92,246,0.2)' },
    { gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)', bg: 'rgba(59,130,246,0.1)', text: '#3b82f6', border: 'rgba(59,130,246,0.2)' },
    { gradient: 'linear-gradient(135deg, #10b981, #14b8a6)', bg: 'rgba(16,185,129,0.1)', text: '#10b981', border: 'rgba(16,185,129,0.2)' },
    { gradient: 'linear-gradient(135deg, #f59e0b, #f97316)', bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
    { gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)', bg: 'rgba(236,72,153,0.1)', text: '#ec4899', border: 'rgba(236,72,153,0.2)' },
    { gradient: 'linear-gradient(135deg, #6366f1, #2563eb)', bg: 'rgba(99,102,241,0.1)', text: '#6366f1', border: 'rgba(99,102,241,0.2)' },
    { gradient: 'linear-gradient(135deg, #14b8a6, #22c55e)', bg: 'rgba(20,184,166,0.1)', text: '#14b8a6', border: 'rgba(20,184,166,0.2)' },
    { gradient: 'linear-gradient(135deg, #ef4444, #ec4899)', bg: 'rgba(239,68,68,0.1)', text: '#ef4444', border: 'rgba(239,68,68,0.2)' },
  ];

  const getCardColor = (index: number) => CARD_COLORS[index % CARD_COLORS.length];

  const AgentCard = ({ agent, index }: { agent: Agent; index: number }) => {
    const color = getCardColor(index);
    const initial = agent.name?.charAt(0)?.toUpperCase() || 'A';

    return (
      <Card className="group relative overflow-hidden border-border/40 hover:border-border/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
        {/* Gradient accent bar */}
        <div className="h-1.5" style={{ background: color.gradient }} />

        <div className="p-5">
          {/* Header: Avatar + Name + Actions */}
          <div className="flex items-start gap-3.5 mb-4">
            {/* Avatar with initial */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-sm flex-shrink-0"
              style={{ background: color.gradient }}
            >
              {initial}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[15px] truncate leading-tight">{agent.name}</h3>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge
                  variant="secondary"
                  className="text-[10px] px-2 py-0"
                  style={{ backgroundColor: color.bg, color: color.text, borderColor: color.border, borderWidth: '1px' }}
                >
                  {agent.domain || 'General'}
                </Badge>
                {agent.is_default && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                    Default
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick action dots — visible on hover */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
              <button
                onClick={() => handleEditAgent(agent)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                title="Edit agent"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button
                onClick={() => handleDuplicate(agent.id)}
                disabled={duplicating === agent.id}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                title="Duplicate agent"
              >
                {duplicating === agent.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>
              <button
                onClick={() => setDeleteAgentId(agent.id)}
                className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                title="Delete agent"
              >
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          </div>

          {/* Description */}
          <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2 mb-3">
            {agent.description || 'No description provided.'}
          </p>

          {/* Tool badges */}
          {agent.tools && agent.tools.length > 0 && (
            <div className="flex items-center gap-1.5 mb-3">
              <Wrench className="w-3 h-3 text-muted-foreground" />
              <div className="flex flex-wrap gap-1">
                {agent.tools.map((toolName) => {
                  const TOOL_ICON_MAP: Record<string, React.ElementType> = {
                    parse_document: FileText,
                    generate_pdf: FileOutput,
                    send_email: Mail,
                    web_search: Globe,
                    search_reddit: MessageSquare,
                    search_knowledge: Database,
                  };
                  const TOOL_COLOR_MAP: Record<string, string> = {
                    parse_document: '#3b82f6',
                    generate_pdf: '#ef4444',
                    send_email: '#22c55e',
                    web_search: '#a855f7',
                    search_reddit: '#f97316',
                    search_knowledge: '#06b6d4',
                  };
                  const Icon = TOOL_ICON_MAP[toolName] || Wrench;
                  const iconColor = TOOL_COLOR_MAP[toolName] || '#888';
                  const label = toolName.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                  return (
                    <span
                      key={toolName}
                      title={label}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/50 border border-border/50"
                    >
                      <Icon className="w-3 h-3" style={{ color: iconColor }} />
                      <span className="text-[10px] text-muted-foreground">{label.split(' ')[0]}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* System prompt preview */}
          {agent.system_prompt && (
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: color.bg, borderColor: color.border, borderWidth: '1px', borderStyle: 'solid' }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">System Prompt</p>
              <p className="text-[12px] text-foreground/70 line-clamp-2 leading-relaxed font-mono">
                {agent.system_prompt}
              </p>
            </div>
          )}
        </div>
      </Card>
    );
  };

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              AI Agents
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {agents.length} agent{agents.length !== 1 ? 's' : ''} ready to work for you
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setWorkflowBuilderOpen(true)}
              variant="outline"
              className="gap-2 flex-1 sm:flex-initial"
              disabled={agents.length === 0}
            >
              <Workflow className="w-4 h-4" />
              Workflows
            </Button>
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
          <div className="mb-8">
            <div className="relative max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents by name, domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl bg-muted/30 border-border/50 focus:border-primary/50"
              />
            </div>
          </div>
        )}

        <div>
          {/* All agents in a single flat grid */}
          {(() => {
            const filtered = agents.filter((agent) => {
              if (!searchQuery) return true;
              const q = searchQuery.toLowerCase();
              return (
                agent.name.toLowerCase().includes(q) ||
                (agent.domain && agent.domain.toLowerCase().includes(q)) ||
                agent.description.toLowerCase().includes(q)
              );
            });

            // Sort: custom agents first, then default agents
            const sorted = [...filtered].sort((a, b) => {
              if (a.is_default && !b.is_default) return 1;
              if (!a.is_default && b.is_default) return -1;
              return 0;
            });

            if (sorted.length === 0 && searchQuery) {
              return (
                <div className="text-center py-16">
                  <p className="text-muted-foreground mb-4">
                    No agents found matching "{searchQuery}"
                  </p>
                  <Button onClick={() => setSearchQuery('')} variant="outline">
                    Clear Search
                  </Button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sorted.map((agent, index) => (
                  <AgentCard key={agent.id} agent={agent} index={index} />
                ))}
              </div>
            );
          })()}
        </div>

        {agents.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Create your first AI agent to start having intelligent conversations.
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
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

        <WorkflowBuilder
          open={workflowBuilderOpen}
          onOpenChange={setWorkflowBuilderOpen}
          agents={agents}
          onExecute={(workflow) => {
            toast({
              title: 'Workflow started',
              description: `Running "${workflow.name}" with ${workflow.nodes.length} agents...`,
            });
          }}
        />
      </div>
    </>
  );
};

export default Agents;