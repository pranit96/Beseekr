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
  onAddConditionalNode: () => void;
  onAddMergeNode: () => void;
  onAddNoteNode: () => void;
  onAddHttpNode: () => void;
  onAddTransformNode: () => void;
  onLoadWorkflow: (workflow: CanvasWorkflow) => void;
  onDeleteWorkflow: (id: string) => void;
  loadingWorkflows?: boolean;
  nodeCount?: number;
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
  onAddConditionalNode,
  onAddMergeNode,
  onAddNoteNode,
  onAddHttpNode,
  onAddTransformNode,
  onLoadWorkflow,
  onDeleteWorkflow,
  loadingWorkflows,
  nodeCount = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"nodes" | "saved">("nodes");

  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.domain || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <aside className="w-[280px] shrink-0 h-full border-r border-border/30 bg-card/30 backdrop-blur-xl flex flex-col overflow-hidden">
      {/* Tab header */}
      <div className="flex border-b border-border/20">
        <button
          onClick={() => setActiveTab("nodes")}
          className={`flex-1 px-4 py-3 text-xs font-semibold tracking-wide transition-all ${
            activeTab === "nodes"
              ? "text-primary border-b-2 border-primary bg-primary/5"
              : "text-muted-foreground/60 hover:text-muted-foreground"
          }`}
        >
          Nodes
          {nodeCount > 0 && (
            <span className="ml-1.5 text-[9px] font-bold bg-primary/15 text-primary/70 px-1.5 py-0.5 rounded-md">
              {nodeCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex-1 px-4 py-3 text-xs font-semibold tracking-wide transition-all ${
            activeTab === "saved"
              ? "text-primary border-b-2 border-primary bg-primary/5"
              : "text-muted-foreground/60 hover:text-muted-foreground"
          }`}
        >
          Saved ({savedWorkflows.length})
        </button>
      </div>

      {activeTab === "nodes" ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Special nodes */}
          <div className="px-3 pt-3 pb-2">
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2 px-1">
              Flow Nodes
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={onAddInputNode}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all text-[11px] font-semibold text-emerald-400"
              >
                <MessageSquareText className="w-3.5 h-3.5" />
                Input
              </button>
              <button
                onClick={onAddOutputNode}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/10 hover:border-sky-500/40 transition-all text-[11px] font-semibold text-sky-400"
              >
                <FileOutput className="w-3.5 h-3.5" />
                Output
              </button>
              <button
                onClick={onAddEmailNode}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/40 transition-all text-[11px] font-semibold text-rose-400"
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </button>
              <button
                onClick={onAddScheduleNode}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all text-[11px] font-semibold text-amber-400"
              >
                <Clock className="w-3.5 h-3.5" />
                Schedule
              </button>
            </div>
          </div>

          {/* Logic nodes */}
          <div className="px-3 pb-3 border-b border-border/10">
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2 px-1">
              Logic & Utility Nodes
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={onAddConditionalNode}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all text-[11px] font-semibold text-cyan-400"
              >
                <Split className="w-3.5 h-3.5" />
                IF / Cond
              </button>
              <button
                onClick={onAddMergeNode}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/40 transition-all text-[11px] font-semibold text-indigo-400"
              >
                <Merge className="w-3.5 h-3.5" />
                Merge
              </button>
              <button
                onClick={onAddTransformNode}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 hover:bg-fuchsia-500/10 hover:border-fuchsia-500/40 transition-all text-[11px] font-semibold text-fuchsia-400"
              >
                <Zap className="w-3.5 h-3.5" />
                Transform
              </button>
              <button
                onClick={onAddHttpNode}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-teal-500/20 bg-teal-500/5 hover:bg-teal-500/10 hover:border-teal-500/40 transition-all text-[11px] font-semibold text-teal-400"
              >
                <Globe className="w-3.5 h-3.5" />
                HTTP Req
              </button>
              <button
                onClick={onAddNoteNode}
                className="col-span-2 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all text-[11px] font-semibold text-amber-400"
              >
                <StickyNote className="w-3.5 h-3.5" />
                Sticky Note
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
              <input
                placeholder="Search agents…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-background/40 border border-border/30 rounded-xl text-xs text-foreground placeholder-muted-foreground/40 outline-none focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Agent list */}
          <div className="px-3 pb-3">
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2 px-1">
              Agents ({filteredAgents.length})
            </p>
            <div className="space-y-1.5">
              {filteredAgents.length === 0 ? (
                <p className="text-xs text-muted-foreground/40 text-center py-6">
                  No agents found
                </p>
              ) : (
                filteredAgents.map((agent) => {
                  const color = agent.color || "hsl(var(--primary))";
                  const initial = agent.name.charAt(0).toUpperCase();
                  return (
                    <div
                      key={agent.id}
                      draggable
                      onDragStart={(e) => onDragAgentStart(e, agent)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border/20 bg-background/30 hover:bg-primary/5 hover:border-primary/20 cursor-grab active:cursor-grabbing transition-all group"
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0 transition-transform group-hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                        }}
                      >
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {agent.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50 truncate">
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
                        className="p-1 rounded-lg hover:bg-primary/10 transition-all shrink-0 cursor-pointer"
                        title={`Add ${agent.name} to canvas`}
                      >
                        <Plus className="w-3.5 h-3.5 text-muted-foreground/35 group-hover:text-primary transition-colors" />
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
                <div className="w-5 h-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : savedWorkflows.length === 0 ? (
              <div className="text-center py-10">
                <FolderOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-xs text-muted-foreground/50">
                  No saved workflows yet
                </p>
                <p className="text-[10px] text-muted-foreground/30 mt-1">
                  Build and save your first canvas
                </p>
              </div>
            ) : (
              savedWorkflows.map((wf) => (
                <div
                  key={wf.id}
                  className="flex items-start gap-2.5 px-3 py-3 rounded-xl border border-border/20 bg-background/30 hover:bg-primary/5 hover:border-primary/20 transition-all group cursor-pointer"
                  onClick={() => onLoadWorkflow(wf)}
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {wf.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground/50">
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
                      <p className="text-[9px] text-muted-foreground/30 mt-0.5 flex items-center gap-1">
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
                    className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
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
