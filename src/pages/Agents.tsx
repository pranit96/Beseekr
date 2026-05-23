import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Sparkles,
  Loader2,
  Workflow,
  Wrench,
  FileText,
  Mail,
  Globe,
  MessageSquare,
  Database,
  FileOutput,
  FileType,
  FileSpreadsheet,
  AlignLeft,
  Languages,
  BarChart3,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AgentDialog } from "@/components/AgentDialog";
import { Agent, AgentTemplate } from "@/types/agent";
import { useToast } from "@/hooks/use-toast";
import { GlobalHeader } from "@/components/GlobalHeader";
import { apiClient } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useMyAgents,
  useCreateAgent,
  useUpdateAgent,
  useDeleteAgent,
} from "@/hooks/use-api-queries";
import { WorkflowBuilder } from "@/components/WorkflowBuilder";
import { AgentQuickChat } from "@/components/AgentQuickChat";
import { ShareAgentModal } from "@/components/ShareAgentModal";
import React from "react";

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

const Agents = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | undefined>();
  const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [workflowBuilderOpen, setWorkflowBuilderOpen] = useState(false);
  const [quickChatAgent, setQuickChatAgent] = useState<Agent | null>(null);
  const [sharingAgent, setSharingAgent] = useState<Agent | null>(null);
  const { toast } = useToast();

  const {
    data: agentsResponse,
    isLoading: loading,
    error,
    refetch,
  } = useMyAgents();
  const createAgentMutation = useCreateAgent();
  const updateAgentMutation = useUpdateAgent();
  const deleteAgentMutation = useDeleteAgent();

  const agents = useMemo(() => {
    if (!agentsResponse) return [];
    const d = agentsResponse.data as any;
    if (Array.isArray(d)) return d;
    if (d && Array.isArray(d.agents)) return d.agents;
    if (d && Array.isArray(d.data)) return d.data;
    return [];
  }, [agentsResponse]);

  useEffect(() => {
    if (error)
      toast({
        title: "Failed to load agents",
        description: (error as any).message,
        variant: "destructive",
      });
  }, [error, toast]);

  const fetchTemplates = async () => {
    if (templates.length > 0) {
      setShowTemplates((p) => !p);
      return;
    }
    setLoadingTemplates(true);
    setShowTemplates(true);
    try {
      const res = await apiClient.getAgentTemplates();
      if (res.success && res.data) {
        const resData = res.data as any;
        setTemplates(
          Array.isArray(resData) ? resData : resData.templates || [],
        );
      }
    } catch (err: any) {
      toast({
        title: "Failed to load templates",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSaveAgent = async (agent: Agent) => {
    if (editingAgent?.id)
      await updateAgentMutation.mutateAsync({ id: editingAgent.id, agent });
    else await createAgentMutation.mutateAsync(agent);
    setIsDialogOpen(false);
    setEditingAgent(undefined);
  };

  const handleDeleteAgent = async () => {
    if (!deleteAgentId) return;
    try {
      await deleteAgentMutation.mutateAsync(deleteAgentId);
      apiClient.invalidateCache("/api/agents");
      refetch();
    } catch {
      /* handled by hook */
    } finally {
      setDeleteAgentId(null);
    }
  };

  const handleCreateFromTemplate = (t: AgentTemplate) => {
    setEditingAgent({
      id: "",
      name: t.name,
      description: t.description,
      domain: t.domain || "",
      system_prompt: t.system_prompt,
      color: t.color || "hsl(var(--primary))",
      is_default: false,
    } as Agent);
    setIsDialogOpen(true);
  };

  const filtered = useMemo(() => {
    if (!searchQuery) return agents;
    const q = searchQuery.toLowerCase();
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.domain || "").toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q),
    );
  }, [agents, searchQuery]);

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) =>
        a.is_default && !b.is_default
          ? 1
          : !a.is_default && b.is_default
            ? -1
            : 0,
      ),
    [filtered],
  );

  // ── Agent Card ────────────────────────────────────────────────────────────────
  const AgentCard = ({ agent }: { agent: Agent }) => {
    const initial = agent.name?.charAt(0)?.toUpperCase() || "A";
    const domainColor = agent.color || "hsl(var(--primary))";
    return (
      <div className="border border-border/30 rounded-3xl bg-card/5 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:border-primary/20 hover:bg-card/10 transition-all duration-500 flex flex-col justify-between min-h-[340px] relative overflow-hidden group">
        {/* Top accent strip */}
        <div
          className="absolute top-0 left-0 right-0 h-[4px] opacity-75 transition-all duration-500 group-hover:h-[6px]"
          style={{
            background: `linear-gradient(90deg, ${domainColor}, transparent)`,
          }}
        />

        <div className="p-6 flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border transition-all duration-500 group-hover:scale-105 shadow-inner shrink-0"
              style={{
                background: `${domainColor}15`,
                borderColor: `${domainColor}30`,
                color: domainColor,
              }}
            >
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors duration-300 leading-snug">
                {agent.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-bold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md border border-border/20">
                  {agent.domain || "General"}
                </span>
                {agent.is_default && (
                  <span className="text-[9px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-1.5 py-0.5 rounded">
                    Default
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
            {agent.description || "No description provided."}
          </p>

          {/* Tools */}
          {agent.tools && agent.tools.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {agent.tools.slice(0, 3).map((toolName) => {
                const Icon = TOOL_ICON_MAP[toolName] || Wrench;
                return (
                  <span
                    key={toolName}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-muted/30 border border-border/20 text-muted-foreground/80"
                  >
                    <Icon className="w-2.5 h-2.5 text-muted-foreground/60" />
                    <span>{toolName.replace(/_/g, " ").split(" ")[0]}</span>
                  </span>
                );
              })}
              {agent.tools.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-muted/30 border border-border/20 text-muted-foreground/60">
                  +{agent.tools.length - 3}
                </span>
              )}
            </div>
          )}

          {/* System prompt preview */}
          {agent.system_prompt && (
            <div className="mt-auto bg-muted/20 border border-border/10 rounded-xl p-3">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground/50 block mb-1">
                System Instruction
              </span>
              <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed font-mono">
                {agent.system_prompt}
              </p>
            </div>
          )}
        </div>

        {/* Action control footer (Always Visible, Touch-Friendly, Responsive) */}
        <div className="border-t border-border/20 p-4 bg-muted/10 flex items-center justify-between mt-auto">
          <button
            onClick={() => setQuickChatAgent(agent)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            title="Quick chat"
            aria-label={`Quick chat with ${agent.name}`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setEditingAgent(agent);
                setIsDialogOpen(true);
              }}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Edit"
              aria-label={`Edit ${agent.name}`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSharingAgent(agent)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Share agent"
              aria-label={`Share ${agent.name}`}
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeleteAgentId(agent.id)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Delete"
              aria-label={`Delete ${agent.name}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden selection:bg-primary/30">
        <GlobalHeader />
        <div className="flex-1 flex items-center justify-center relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden -z-10"
          >
            <div className="ambient-blob ambient-blob-1 opacity-20" />
            <div className="ambient-blob ambient-blob-2 opacity-15" />
          </div>
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin shadow-lg" />
            <p className="text-sm font-medium text-muted-foreground/60 tracking-tight">
              Loading agents in workspace…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden selection:bg-primary/30">
      <GlobalHeader />

      {/* Main Scrollable Workspace */}
      <main className="flex-1 overflow-y-auto relative custom-scrollbar">
        {/* Ambient glow backgrounds */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden -z-10"
        >
          <div className="ambient-blob ambient-blob-1 opacity-20" />
          <div className="ambient-blob ambient-blob-2 opacity-15" />
        </div>

        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-16 md:pt-10 md:pb-24">
          {/* Page header (Typography Stack) */}
          <section className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-3 sm:mb-4 select-none">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-muted-foreground/60 uppercase flex items-center">
                Workspace <span className="mx-2 opacity-50 text-[8px]">•</span>{" "}
                Orchestrate Intelligence
              </span>
            </div>

            {/* Multi-stack Headline exactly like Chat */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] flex flex-col gap-1 text-left mb-6">
              <span className="text-foreground">AI Agents</span>
              <span className="text-muted-foreground/30 text-2xl sm:text-4xl md:text-5xl">
                Your collection of specialized assistants.
              </span>
            </h1>

            <p className="text-sm sm:text-base font-medium text-muted-foreground/70 max-w-2xl tracking-tight leading-relaxed">
              Create, customize, and orchestrate intelligent agents to perform
              specialized tasks or chain them in autonomous workflows.
            </p>
          </section>

          {/* Unified Control Deck / Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8 bg-card/5 border border-border/30 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
            {/* Search Input on the Left */}
            {agents.length > 0 && (
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                <input
                  placeholder="Search agents by name, domain, or description…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-background/40 hover:bg-background/60 focus:bg-background/80 border border-border/30 rounded-xl text-sm text-foreground placeholder-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 transition-all duration-300"
                />
              </div>
            )}

            {/* Actions on the Right */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setWorkflowBuilderOpen(true)}
                disabled={agents.length === 0}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-border/40 bg-card/10 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all disabled:opacity-35 disabled:cursor-not-allowed"
              >
                <Workflow className="w-3.5 h-3.5" />
                <span>Workflows</span>
              </button>
              <button
                onClick={fetchTemplates}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  showTemplates
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border/40 bg-card/10 hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Templates</span>
              </button>
              <button
                onClick={() => {
                  setEditingAgent(undefined);
                  setIsDialogOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-md shadow-primary/10 hover:-translate-y-0.5 active:translate-y-0 duration-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Agent</span>
              </button>
            </div>
          </div>

          {/* Starter Templates Section */}
          {showTemplates && (
            <section className="mb-10 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-primary/60" />
                <h2 className="text-sm font-semibold text-foreground/80">
                  Starter Templates
                </h2>
                <span className="text-[10px] text-muted-foreground/40 bg-muted/40 px-2 py-0.5 rounded-full">
                  {templates.length} available
                </span>
              </div>
              {loadingTemplates ? (
                <div className="flex items-center gap-2 text-muted-foreground/50 text-xs py-8 bg-card/5 border border-border/30 rounded-2xl justify-center backdrop-blur-md">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Loading template library…</span>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 bg-card/5 border border-border/30 rounded-2xl backdrop-blur-md">
                  <p className="text-xs text-muted-foreground/40">
                    No templates available at this time.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleCreateFromTemplate(t)}
                      className="group border border-border/30 rounded-2xl p-5 text-left bg-card/5 backdrop-blur-md hover:bg-primary/[0.02] hover:border-primary/30 transition-all duration-300 flex flex-col justify-between min-h-[160px] relative overflow-hidden shadow-lg shadow-black/5"
                    >
                      {/* Glow Effect */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-[35px] -mr-8 -mt-8 pointer-events-none group-hover:bg-primary/10 transition-colors duration-500" />

                      <div>
                        {t.icon && (
                          <span className="text-2xl mb-3 block">{t.icon}</span>
                        )}
                        <h4 className="text-sm font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                          {t.name}
                        </h4>
                        <p className="text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed">
                          {t.description}
                        </p>
                      </div>

                      <div className="text-[11px] font-bold text-primary flex items-center gap-1 mt-4 group-hover:translate-x-1 transition-transform">
                        <span>Use template</span>
                        <span>→</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Agent grid */}
          {sorted.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
              {sorted.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-16 bg-card/5 border border-border/30 rounded-3xl backdrop-blur-xl">
              <p className="text-sm text-muted-foreground mb-4">
                No agents match search term "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs font-semibold px-4 py-2 rounded-xl bg-muted/60 text-foreground hover:bg-muted transition-colors border border-border/30"
              >
                Clear Search
              </button>
            </div>
          ) : (
            /* Empty state */
            <div className="text-center py-20 bg-card/5 border border-border/30 rounded-3xl backdrop-blur-xl">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/5">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                No Agents Configured
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed mb-8">
                Create your first specialized AI agent to start orchestrating
                intelligent conversations.
              </p>
              <button
                onClick={() => setIsDialogOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-md shadow-primary/10 hover:-translate-y-0.5 active:translate-y-0 duration-300"
              >
                <Plus className="w-4 h-4" /> Create your first agent
              </button>
            </div>
          )}
        </div>
      </main>

      <AgentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        agent={editingAgent}
        onSave={handleSaveAgent}
      />

      <AlertDialog
        open={!!deleteAgentId}
        onOpenChange={() => setDeleteAgentId(null)}
      >
        <AlertDialogContent className="border border-border/30 rounded-3xl bg-background/95 backdrop-blur-xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-foreground">
              Delete Agent
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Are you sure? This action cannot be undone and will permanently
              delete this specialized assistant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAgent}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all shadow-md shadow-destructive/10"
            >
              Delete Agent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <WorkflowBuilder
        open={workflowBuilderOpen}
        onOpenChange={setWorkflowBuilderOpen}
        agents={agents}
        onExecute={(workflow) =>
          toast({
            title: "Workflow started",
            description: `Running "${workflow.name}"…`,
          })
        }
      />

      {quickChatAgent && (
        <AgentQuickChat
          agent={quickChatAgent}
          open={!!quickChatAgent}
          onClose={() => setQuickChatAgent(null)}
        />
      )}

      <ShareAgentModal
        open={!!sharingAgent}
        onOpenChange={(open) => !open && setSharingAgent(null)}
        agent={sharingAgent}
      />
    </div>
  );
};

export default Agents;
