import { useState, useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Copy, Sparkles, Loader2, Workflow, Wrench, FileText, Mail, Globe, MessageSquare, Database, FileOutput, FileType, FileSpreadsheet, AlignLeft, Languages, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AgentDialog } from '@/components/AgentDialog';
import { Agent, AgentTemplate } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';
import { GlobalHeader } from '@/components/GlobalHeader';
import { apiClient } from '@/lib/api';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMyAgents, useCreateAgent, useUpdateAgent, useDeleteAgent } from '@/hooks/use-api-queries';
import { WorkflowBuilder } from '@/components/WorkflowBuilder';
import { AgentQuickChat } from '@/components/AgentQuickChat';
import React from 'react';

const TOOL_ICON_MAP: Record<string, React.ElementType> = {
  parse_document: FileText, generate_pdf: FileOutput, send_email: Mail,
  web_search: Globe, search_reddit: MessageSquare, search_knowledge: Database,
  generate_docx: FileType, generate_spreadsheet: FileSpreadsheet, scrape_url: Globe,
  analyze_data: BarChart3, summarize_text: AlignLeft, translate_text: Languages,
};

const Agents = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | undefined>();
  const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [workflowBuilderOpen, setWorkflowBuilderOpen] = useState(false);
  const [quickChatAgent, setQuickChatAgent] = useState<Agent | null>(null);
  const { toast } = useToast();

  const { data: agentsResponse, isLoading: loading, error, refetch } = useMyAgents();
  const createAgentMutation = useCreateAgent();
  const updateAgentMutation = useUpdateAgent();
  const deleteAgentMutation = useDeleteAgent();

  const agents = useMemo(() => {
    if (!agentsResponse) return [];
    const d = agentsResponse.data;
    if (Array.isArray(d)) return d;
    if (d && Array.isArray(d.agents)) return d.agents;
    if (d && Array.isArray(d.data)) return d.data;
    return [];
  }, [agentsResponse]);

  useEffect(() => { if (error) toast({ title: 'Failed to load agents', description: (error as any).message, variant: 'destructive' }); }, [error, toast]);

  const fetchTemplates = async () => {
    if (templates.length > 0) { setShowTemplates(p => !p); return; }
    setLoadingTemplates(true); setShowTemplates(true);
    try {
      const res = await apiClient.getAgentTemplates();
      if (res.success && res.data) setTemplates(Array.isArray(res.data) ? res.data : res.data.templates || []);
    } catch (err: any) { toast({ title: 'Failed to load templates', description: err.message, variant: 'destructive' }); }
    finally { setLoadingTemplates(false); }
  };

  const handleSaveAgent = async (agent: Agent) => {
    if (editingAgent?.id) await updateAgentMutation.mutateAsync({ id: editingAgent.id, agent });
    else await createAgentMutation.mutateAsync(agent);
    setIsDialogOpen(false); setEditingAgent(undefined);
  };

  const handleDeleteAgent = async () => {
    if (!deleteAgentId) return;
    try { await deleteAgentMutation.mutateAsync(deleteAgentId); apiClient.invalidateCache('/api/agents'); refetch(); }
    catch { /* handled by hook */ } finally { setDeleteAgentId(null); }
  };

  const handleDuplicate = async (agentId: string) => {
    setDuplicating(agentId);
    try {
      const res = await apiClient.duplicateAgent(agentId);
      if (res.success) { toast({ title: 'Agent duplicated' }); refetch(); }
      else throw new Error(res.error || 'Failed');
    } catch (err: any) { toast({ title: 'Duplicate failed', description: err.message, variant: 'destructive' }); }
    finally { setDuplicating(null); }
  };

  const handleCreateFromTemplate = (t: AgentTemplate) => {
    setEditingAgent({ id: '', name: t.name, description: t.description, domain: t.domain || '', system_prompt: t.system_prompt, color: t.color || 'hsl(var(--primary))', is_default: false } as Agent);
    setIsDialogOpen(true);
  };

  const filtered = useMemo(() => {
    if (!searchQuery) return agents;
    const q = searchQuery.toLowerCase();
    return agents.filter(a => a.name.toLowerCase().includes(q) || (a.domain || '').toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
  }, [agents, searchQuery]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => (a.is_default && !b.is_default ? 1 : !a.is_default && b.is_default ? -1 : 0)), [filtered]);

  // ── Agent Card ────────────────────────────────────────────────────────────────
  const AgentCard = ({ agent }: { agent: Agent }) => {
    const initial = agent.name?.charAt(0)?.toUpperCase() || 'A';
    const domainColor = agent.color || 'hsl(var(--primary))';
    return (
      <div className="agent-card group">
        {/* Top accent strip */}
        <div className="agent-card-accent" style={{ background: `linear-gradient(90deg, ${domainColor}22, transparent)`, borderTopColor: `${domainColor}44` }} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div
              className="agent-avatar"
              style={{ background: `${domainColor}18`, borderColor: `${domainColor}30`, color: domainColor }}
            >
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-semibold text-foreground/90 truncate leading-snug group-hover:text-foreground transition-colors">
                {agent.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-medium text-muted-foreground/50 bg-muted/40 px-2 py-0.5 rounded-full border border-border/30">
                  {agent.domain || 'General'}
                </span>
                {agent.is_default && (
                  <span className="text-[9px] font-medium text-muted-foreground/35 uppercase tracking-wider">default</span>
                )}
              </div>
            </div>
            {/* Hover actions */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setQuickChatAgent(agent)} className="agent-action-btn" title="Quick chat">
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setEditingAgent(agent); setIsDialogOpen(true); }} className="agent-action-btn" title="Edit">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handleDuplicate(agent.id)} disabled={duplicating === agent.id} className="agent-action-btn" title="Duplicate">
                {duplicating === agent.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setDeleteAgentId(agent.id)} className="agent-action-btn agent-action-btn-danger" title="Delete">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Description */}
          <p className="text-[12px] text-muted-foreground/60 leading-relaxed line-clamp-2 mb-3">
            {agent.description || 'No description.'}
          </p>

          {/* Tools */}
          {agent.tools && agent.tools.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {agent.tools.slice(0, 4).map((toolName) => {
                const Icon = TOOL_ICON_MAP[toolName] || Wrench;
                return (
                  <span key={toolName} className="tool-pill">
                    <Icon className="w-2.5 h-2.5" />
                    {toolName.replace(/_/g, ' ').split(' ')[0]}
                  </span>
                );
              })}
              {agent.tools.length > 4 && (
                <span className="tool-pill">+{agent.tools.length - 4}</span>
              )}
            </div>
          )}

          {/* System prompt preview */}
          {agent.system_prompt && (
            <div className="system-prompt-preview">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/35 mb-1">System Prompt</p>
              <p className="text-[11px] text-muted-foreground/50 line-clamp-2 leading-relaxed">
                {agent.system_prompt}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <GlobalHeader />
        <div className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <p className="text-xs text-muted-foreground/50">Loading agents…</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalHeader />

      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="ambient-blob ambient-blob-1" style={{ opacity: 0.04 }} />
        <div className="ambient-blob ambient-blob-2" style={{ opacity: 0.03 }} />
      </div>

      <div className="mx-auto px-4 sm:px-6 md:px-8 py-8 max-w-[2200px] animate-fade-in">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-2 select-none">
              Workspace
            </p>
            <h1 className="text-[2rem] font-semibold tracking-[-0.03em] text-foreground">
              AI Agents
            </h1>
            <p className="text-sm text-muted-foreground/50 mt-1">
              {agents.length} agent{agents.length !== 1 ? 's' : ''} in your workspace
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setWorkflowBuilderOpen(true)} disabled={agents.length === 0} className="agents-toolbar-btn">
              <Workflow className="w-3.5 h-3.5" /> Workflows
            </button>
            <button onClick={fetchTemplates} className="agents-toolbar-btn">
              <Sparkles className="w-3.5 h-3.5" /> Templates
            </button>
            <button onClick={() => { setEditingAgent(undefined); setIsDialogOpen(true); }} className="agents-cta-btn">
              <Plus className="w-3.5 h-3.5" /> New Agent
            </button>
          </div>
        </div>

        {/* Templates section */}
        {showTemplates && (
          <div className="mb-10 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary/60" />
              <h2 className="text-sm font-semibold text-foreground/80">Starter Templates</h2>
              <span className="text-[10px] text-muted-foreground/40">({templates.length})</span>
            </div>
            {loadingTemplates ? (
              <div className="flex items-center gap-2 text-muted-foreground/50 text-xs py-4">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
              </div>
            ) : templates.length === 0 ? (
              <p className="text-xs text-muted-foreground/40 py-4">No templates available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleCreateFromTemplate(t)}
                    className="template-card text-left"
                  >
                    {t.icon && <span className="text-lg mb-2 block">{t.icon}</span>}
                    <p className="text-[13px] font-semibold text-foreground/80 mb-1">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground/50 line-clamp-2 leading-relaxed">{t.description}</p>
                    <p className="text-[10px] text-primary/50 mt-2 font-medium">Use template →</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search */}
        {agents.length > 0 && (
          <div className="mb-6 max-w-xs">
            <div className="relative">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
              <input
                placeholder="Search agents…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="agents-search"
              />
            </div>
          </div>
        )}

        {/* Agent grid */}
        {sorted.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sorted.map((agent) => <AgentCard key={agent.id} agent={agent} />)}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground/50 mb-3">No agents match "{searchQuery}"</p>
            <button onClick={() => setSearchQuery('')} className="text-xs text-primary/60 hover:text-primary transition-colors">Clear search</button>
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-24">
            <div className="w-14 h-14 rounded-2xl bg-primary/8 border border-primary/10 flex items-center justify-center mx-auto mb-5">
              <Sparkles className="w-6 h-6 text-primary/40" />
            </div>
            <h3 className="text-base font-semibold text-foreground/70 mb-2">No agents yet</h3>
            <p className="text-sm text-muted-foreground/40 mb-6 max-w-xs mx-auto leading-relaxed">
              Create your first AI agent to start orchestrating intelligent conversations.
            </p>
            <button onClick={() => setIsDialogOpen(true)} className="agents-cta-btn">
              <Plus className="w-3.5 h-3.5" /> Create your first agent
            </button>
          </div>
        )}
      </div>

      <AgentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} agent={editingAgent} onSave={handleSaveAgent} />

      <AlertDialog open={!!deleteAgentId} onOpenChange={() => setDeleteAgentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAgent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <WorkflowBuilder open={workflowBuilderOpen} onOpenChange={setWorkflowBuilderOpen} agents={agents} onExecute={(workflow) => toast({ title: 'Workflow started', description: `Running "${workflow.name}"…` })} />

      {quickChatAgent && <AgentQuickChat agent={quickChatAgent} open={!!quickChatAgent} onClose={() => setQuickChatAgent(null)} />}
    </>
  );
};

export default Agents;