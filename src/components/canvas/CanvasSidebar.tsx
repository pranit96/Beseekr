import React, { useState } from "react";
import {
  Search,
  Plus,
  MessageSquareText,
  FileOutput,
  Clock,
  Trash2,
  FolderOpen,
  Sparkles,
  Mail,
  Split,
  Merge,
  Zap,
  Globe,
  StickyNote,
  Send,
  RefreshCw,
  GitFork,
  ShieldCheck,
  Brain,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Agent, CanvasWorkflow } from "@/types/agent";

interface CanvasSidebarProps {
  agents: Agent[];
  savedWorkflows: CanvasWorkflow[];
  onDragAgentStart: (
    e: React.DragEvent,
    agent: Agent,
  ) => void;
  onAddAgentNode?: (agent: Agent) => void;
  onAddInputNode: () => void;
  onAddOutputNode: () => void;
  onAddEmailNode: () => void;
  onAddScheduleNode: () => void;
  onAddTelegramNode: () => void;
  onAddConditionalNode: () => void;
  onAddMergeNode: () => void;
  onAddNoteNode: () => void;
  onAddHttpNode: () => void;
  onAddTransformNode: () => void;
  onLoadWorkflow: (workflow: CanvasWorkflow) => void;
  onDeleteWorkflow: (id: string) => void;
  loadingWorkflows?: boolean;
  nodeCount?: number;
  // ── Crazy feature nodes ────────────────────────────────────────────
  onAddLoopNode?: () => void;
  onAddSplitNode?: () => void;
  onAddRetryNode?: () => void;
  onAddMemoryNode?: () => void;
}

/* ── Node definition for the grid ────────────────────────────────── */
interface NodeDef {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  color: string;
  colorFg: string;
}

export const CanvasSidebar: React.FC<CanvasSidebarProps> = ({
  agents,
  savedWorkflows,
  onDragAgentStart,
  onAddAgentNode,
  onAddInputNode,
  onAddOutputNode,
  onAddEmailNode,
  onAddScheduleNode,
  onAddTelegramNode,
  onAddConditionalNode,
  onAddMergeNode,
  onAddNoteNode,
  onAddHttpNode,
  onAddTransformNode,
  onLoadWorkflow,
  onDeleteWorkflow,
  loadingWorkflows,
  nodeCount = 0,
  onAddLoopNode,
  onAddSplitNode,
  onAddRetryNode,
  onAddMemoryNode,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"nodes" | "saved">("nodes");
  const [collapsed, setCollapsed] = useState(false);

  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.domain || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  /* ── Node categories ───────────────────────────────── */
  const coreNodes: NodeDef[] = [
    { label: "Input", icon: MessageSquareText, onClick: onAddInputNode, color: "hsla(145, 55%, 42%, 0.15)", colorFg: "hsl(145, 60%, 55%)" },
    { label: "Output", icon: FileOutput, onClick: onAddOutputNode, color: "hsla(200, 70%, 50%, 0.15)", colorFg: "hsl(200, 75%, 60%)" },
    { label: "Email", icon: Mail, onClick: onAddEmailNode, color: "hsla(340, 65%, 52%, 0.15)", colorFg: "hsl(340, 70%, 62%)" },
    { label: "Schedule", icon: Clock, onClick: onAddScheduleNode, color: "hsla(35, 75%, 52%, 0.15)", colorFg: "hsl(35, 80%, 62%)" },
    { label: "Telegram", icon: Send, onClick: onAddTelegramNode, color: "hsla(200, 80%, 48%, 0.15)", colorFg: "hsl(200, 80%, 58%)" },
    { label: "HTTP", icon: Globe, onClick: onAddHttpNode, color: "hsla(170, 70%, 42%, 0.15)", colorFg: "hsl(170, 75%, 52%)" },
  ];

  const logicNodes: NodeDef[] = [
    { label: "IF / Cond", icon: Split, onClick: onAddConditionalNode, color: "hsla(190, 70%, 48%, 0.15)", colorFg: "hsl(190, 75%, 58%)" },
    { label: "Merge", icon: Merge, onClick: onAddMergeNode, color: "hsla(235, 65%, 55%, 0.15)", colorFg: "hsl(235, 70%, 65%)" },
    { label: "Transform", icon: Zap, onClick: onAddTransformNode, color: "hsla(295, 65%, 50%, 0.15)", colorFg: "hsl(295, 70%, 62%)" },
    { label: "Note", icon: StickyNote, onClick: onAddNoteNode, color: "hsla(45, 70%, 50%, 0.15)", colorFg: "hsl(45, 75%, 60%)" },
  ];

  const advancedNodes: NodeDef[] = [
    { label: "Loop", icon: RefreshCw, onClick: () => onAddLoopNode?.(), color: "hsla(25, 80%, 50%, 0.15)", colorFg: "hsl(25, 80%, 60%)" },
    { label: "Split", icon: GitFork, onClick: () => onAddSplitNode?.(), color: "hsla(150, 65%, 48%, 0.15)", colorFg: "hsl(150, 70%, 55%)" },
    { label: "Retry", icon: ShieldCheck, onClick: () => onAddRetryNode?.(), color: "hsla(350, 70%, 52%, 0.15)", colorFg: "hsl(350, 70%, 62%)" },
    { label: "Memory", icon: Brain, onClick: () => onAddMemoryNode?.(), color: "hsla(280, 60%, 55%, 0.15)", colorFg: "hsl(280, 65%, 65%)" },
  ];

  const renderNodeBtn = (n: NodeDef) => (
    <button
      key={n.label}
      onClick={n.onClick}
      className="canvas-node-btn"
      style={{ "--node-color": n.color, "--node-color-fg": n.colorFg } as React.CSSProperties}
      title={n.label}
    >
      <div className="canvas-node-btn-icon">
        <n.icon className="w-3.5 h-3.5" />
      </div>
      {!collapsed && <span>{n.label}</span>}
    </button>
  );

  /* ── Collapsed icon strip ─────────────────────────── */
  if (collapsed) {
    return (
      <aside
        className="canvas-sidebar canvas-sidebar-collapsed"
        role="complementary"
        aria-label="Canvas sidebar collapsed"
      >
        <button
          onClick={() => setCollapsed(false)}
          className="canvas-sidebar-toggle"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <div className="flex flex-col items-center gap-1 py-3 overflow-y-auto custom-scrollbar">
          {[...coreNodes, ...logicNodes, ...advancedNodes].map((n) => (
            <button
              key={n.label}
              onClick={n.onClick}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              style={{ background: n.color, color: n.colorFg }}
              title={n.label}
            >
              <n.icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </aside>
    );
  }

  /* ── Expanded panel ───────────────────────────────── */
  return (
    <aside
      className="canvas-sidebar canvas-sidebar-expanded"
      role="complementary"
      aria-label="Canvas sidebar"
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(true)}
        className="canvas-sidebar-toggle"
        aria-label="Collapse sidebar"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      {/* Tab header */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setActiveTab("nodes")}
          className={`flex-1 px-4 py-3 text-xs font-semibold tracking-wide transition-all ${
            activeTab === "nodes"
              ? "text-violet-400 border-b-2 border-violet-500 bg-violet-500/5"
              : "text-white/35 hover:text-white/60"
          }`}
        >
          Nodes
          {nodeCount > 0 && (
            <span className="ml-1.5 text-[9px] font-bold bg-violet-500/15 text-violet-400/70 px-1.5 py-0.5 rounded-md">
              {nodeCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex-1 px-4 py-3 text-xs font-semibold tracking-wide transition-all ${
            activeTab === "saved"
              ? "text-violet-400 border-b-2 border-violet-500 bg-violet-500/5"
              : "text-white/35 hover:text-white/60"
          }`}
        >
          Saved ({savedWorkflows.length})
        </button>
      </div>

      {activeTab === "nodes" ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* ── Core Flow ───────────────────────────── */}
          <div className="px-3 pt-3 pb-2">
            <p className="canvas-section-label">Core Flow</p>
            <div className="grid grid-cols-3 gap-1.5">
              {coreNodes.map(renderNodeBtn)}
            </div>
          </div>

          {/* ── Logic & Control ─────────────────────── */}
          <div className="px-3 pb-2">
            <p className="canvas-section-label">Logic & Control</p>
            <div className="grid grid-cols-4 gap-1.5">
              {logicNodes.map(renderNodeBtn)}
            </div>
          </div>

          {/* ── Advanced ────────────────────────────── */}
          <div className="px-3 pb-3 border-b border-white/5">
            <p className="canvas-section-label">Advanced</p>
            <div className="grid grid-cols-4 gap-1.5">
              {advancedNodes.map(renderNodeBtn)}
            </div>
          </div>

          {/* ── Agent Search ────────────────────────── */}
          <div className="px-3 pt-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
              <input
                placeholder="Search agents…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/[0.03] border border-white/8 rounded-lg text-xs text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-violet-500/30 focus:border-violet-500/30 transition-all"
                aria-label="Search agents"
              />
            </div>
          </div>

          {/* ── Agent list ──────────────────────────── */}
          <div className="px-3 pb-3">
            <p className="canvas-section-label">Agents ({filteredAgents.length})</p>
            <div className="space-y-1">
              {filteredAgents.length === 0 ? (
                <p className="text-xs text-white/25 text-center py-6">
                  No agents found
                </p>
              ) : (
                filteredAgents.map((agent) => {
                  const color = agent.color || "hsl(250, 70%, 60%)";
                  const initial = agent.name.charAt(0).toUpperCase();
                  return (
                    <div
                      key={agent.id}
                      draggable
                      onDragStart={(e) => onDragAgentStart(e, agent)}
                      className="canvas-agent-card"
                    >
                      <div
                        className="canvas-agent-avatar"
                        style={{
                          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                        }}
                      >
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white/85 truncate">
                          {agent.name}
                        </p>
                        <p className="text-[10px] text-white/35 truncate">
                          {agent.domain || "General"}
                          {agent.tools && agent.tools.length > 0 &&
                            ` · ${agent.tools.length} tools`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddAgentNode?.(agent);
                        }}
                        className="p-1 rounded-lg hover:bg-violet-500/15 transition-all shrink-0 cursor-pointer"
                        title={`Add ${agent.name} to canvas`}
                      >
                        <Plus className="w-3.5 h-3.5 text-white/25 hover:text-violet-400 transition-colors" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-3 pt-3 pb-3 space-y-1.5">
            {loadingWorkflows ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
              </div>
            ) : savedWorkflows.length === 0 ? (
              <div className="text-center py-10">
                <FolderOpen className="w-8 h-8 text-white/15 mx-auto mb-3" />
                <p className="text-xs text-white/35">
                  No saved workflows yet
                </p>
                <p className="text-[10px] text-white/20 mt-1">
                  Build and save your first canvas
                </p>
              </div>
            ) : (
              savedWorkflows.map((wf) => (
                <div
                  key={wf.id}
                  className="canvas-wf-row group"
                  onClick={() => onLoadWorkflow(wf)}
                >
                  <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/15 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white/80 truncate">
                      {wf.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-white/30">
                        {wf.agent_ids?.length || 0} agents
                      </span>
                      {wf.last_run_status && (
                        <span
                          className={`text-[10px] font-medium ${
                            wf.last_run_status === "success"
                              ? "text-emerald-400"
                              : wf.last_run_status === "failed"
                                ? "text-red-400"
                                : "text-amber-400"
                          }`}
                        >
                          {wf.last_run_status}
                        </span>
                      )}
                    </div>
                    {wf.last_run_at && (
                      <p className="text-[9px] text-white/20 mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(wf.last_run_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteWorkflow(wf.id);
                    }}
                    className="p-1.5 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    aria-label={`Delete ${wf.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default CanvasSidebar;
