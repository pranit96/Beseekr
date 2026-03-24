import { useState, useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Folder, User, Copy, Sparkles, BarChart3, ChevronDown, ChevronRight, Loader2, Workflow, Wrench, FileText, Mail, Globe, MessageSquare, Database, FileOutput, FileType, FileSpreadsheet, AlignLeft, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AgentDialog } from '@/components/AgentDialog';
import { Agent, AgentTemplate } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';
import { GlobalHeader } from '@/components/GlobalHeader';
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
import { AgentQuickChat } from '@/components/AgentQuickChat';

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

  // Quick Chat state
  const [quickChatAgent, setQuickChatAgent] = useState<Agent | null>(null);

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
    try {
      await deleteAgentMutation.mutateAsync(deleteAgentId);
      // Force clear apiClient internal cache and refetch
      apiClient.invalidateCache('/api/agents');
      refetch();
    } catch (err) {
      // Error toast is handled by useDeleteAgent onError
    } finally {
      setDeleteAgentId(null);
    }
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

  const AgentCard = ({ agent, index }: { agent: Agent; index: number }) => {
    const initial = agent.name?.charAt(0)?.toUpperCase() || 'A';

    return (
      <Card className="group relative overflow-hidden border-border/40 bg-background/40 hover:bg-muted/40 backdrop-blur-sm transition-all duration-300 hover:border-border/80 hover:shadow-soft">
        <div className="p-5">
          {/* Header: Avatar + Name + Actions */}
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar with initial */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-muted/50 border border-border/40 text-muted-foreground/80 font-semibold text-lg shadow-sm flex-shrink-0 transition-colors duration-300 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20">
              {initial}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[16px] text-foreground/90 group-hover:text-foreground transition-colors truncate leading-tight">{agent.name}</h3>
              <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                <Badge
                  variant="secondary"
                  className="px-2 py-0 bg-muted/40 text-muted-foreground border border-border/40 font-medium hover:bg-muted/60"
                >
                  {agent.domain || 'General'}
                </Badge>
                {agent.is_default && (
                  <Badge variant="outline" className="px-1.5 py-0 text-muted-foreground/70 border-border/40 font-medium">
                    Default
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick action dots — visible on hover */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
              <button
                onClick={() => setQuickChatAgent(agent)}
                className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                title="Chat with agent"
              >
                <MessageSquare className="w-3.5 h-3.5 text-primary/70 hover:text-primary" />
              </button>
              <button
                onClick={() => handleEditAgent(agent)}
                className="p-1.5 rounded-lg hover:bg-muted/80 transition-colors"
                title="Edit agent"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </button>
              <button
                onClick={() => handleDuplicate(agent.id)}
                disabled={duplicating === agent.id}
                className="p-1.5 rounded-lg hover:bg-muted/80 transition-colors"
                title="Duplicate agent"
              >
                {duplicating === agent.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
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
          <p className="text-[13px] text-muted-foreground/80 leading-relaxed line-clamp-2 mb-4">
            {agent.description || 'No description provided.'}
          </p>

          {/* Tool badges */}
          {agent.tools && agent.tools.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-3.5 h-3.5 text-muted-foreground/60" />
              <div className="flex flex-wrap gap-1.5">
                {agent.tools.map((toolName) => {
                  const TOOL_ICON_MAP: Record<string, React.ElementType> = {
                    parse_document: FileText,
                    generate_pdf: FileOutput,
                    send_email: Mail,
                    web_search: Globe,
                    search_reddit: MessageSquare,
                    search_knowledge: Database,
                    generate_docx: FileType,
                    generate_spreadsheet: FileSpreadsheet,
                    scrape_url: Globe,
                    analyze_data: BarChart3,
                    summarize_text: AlignLeft,
                    translate_text: Languages,
                  };
                  const Icon = TOOL_ICON_MAP[toolName] || Wrench;
                  const label = toolName.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                  return (
                    <span
                      key={toolName}
                      title={label}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/40 border border-border/40 text-[10px] font-medium text-muted-foreground/80 transition-colors duration-300 group-hover:bg-muted/60 group-hover:text-muted-foreground group-hover:border-border/60"
                    >
                      <Icon className="w-3 h-3 text-muted-foreground/60" />
                      {label.split(' ')[0]}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* System prompt preview */}
          {agent.system_prompt && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border/40 transition-colors duration-300 group-hover:border-border/60 group-hover:bg-muted/40">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-1.5 flex items-center gap-1.5"><Sparkles className="w-3 h-3 opacity-50"/> System Prompt</p>
              <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed font-sans">
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
        <GlobalHeader />
        <div className="h-full flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading agents...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalHeader />
      <div className="mx-auto p-4 sm:p-6 md:p-8 max-w-[2200px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              AI Agents
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
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

      {/* Quick Chat Drawer */}
      {quickChatAgent && (
        <AgentQuickChat
          agent={quickChatAgent}
          open={!!quickChatAgent}
          onClose={() => setQuickChatAgent(null)}
        />
      )}
    </>
  );
};

export default Agents;