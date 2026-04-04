// src/components/WorkflowBuilder.tsx
import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Plus,
  X,
  GripVertical,
  Play,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Workflow,
} from "lucide-react";
import type { Agent } from "@/types/agent";
import { useToast } from "@/hooks/use-toast";

export interface WorkflowNode {
  id: string;
  agentId: string;
  agentName: string;
  agentColor: string;
  instruction?: string; // Optional override instruction for this step
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  created_at: string;
}

interface WorkflowBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: Agent[];
  onExecute?: (workflow: WorkflowDefinition) => void;
  onSave?: (workflow: WorkflowDefinition) => void;
}

const AGENT_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-amber-500",
  "bg-green-500",
  "bg-cyan-500",
  "bg-rose-500",
  "bg-indigo-500",
];

function getAgentColor(agentId: string): string {
  const hash = agentId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AGENT_COLORS[hash % AGENT_COLORS.length];
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  open,
  onOpenChange,
  agents,
  onExecute,
  onSave,
}) => {
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const { toast } = useToast();
  const dropTargetRef = useRef<number | null>(null);

  const addNode = (agent: Agent) => {
    const node: WorkflowNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      agentId: agent.id,
      agentName: agent.name,
      agentColor: getAgentColor(agent.id),
      instruction: "",
    };
    setNodes((prev) => [...prev, node]);
  };

  const removeNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
  };

  const updateNodeInstruction = (nodeId: string, instruction: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, instruction } : n)),
    );
  };

  const moveNode = (fromIndex: number, toIndex: number) => {
    setNodes((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dropTargetRef.current = index;
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      moveNode(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
    dropTargetRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    dropTargetRef.current = null;
  };

  const buildWorkflow = useCallback(
    (): WorkflowDefinition => ({
      id: `wf-${Date.now()}`,
      name: workflowName || `Workflow with ${nodes.length} agents`,
      description: workflowDescription,
      nodes,
      created_at: new Date().toISOString(),
    }),
    [workflowName, workflowDescription, nodes],
  );

  const handleSave = () => {
    if (nodes.length < 2) {
      toast({
        title: "Need at least 2 agents",
        description: "Add more agents to create a workflow.",
        variant: "destructive",
      });
      return;
    }

    if (!workflowName.trim()) {
      toast({
        title: "Workflow name required",
        description: "Please enter a name for your workflow.",
        variant: "destructive",
      });
      return;
    }

    const workflow = buildWorkflow();

    // Save to localStorage
    const stored = JSON.parse(
      localStorage.getItem("beseekr-workflows") || "[]",
    );
    stored.push(workflow);
    localStorage.setItem("beseekr-workflows", JSON.stringify(stored));

    toast({
      title: "Workflow saved",
      description: `"${workflow.name}" saved successfully.`,
    });

    // Call parent callback
    onSave?.(workflow);

    // Reset and close
    handleReset();
    onOpenChange(false);
  };

  const handleExecute = () => {
    if (nodes.length < 2) {
      toast({
        title: "Need at least 2 agents",
        description: "Add more agents to create a workflow.",
        variant: "destructive",
      });
      return;
    }
    const workflow = buildWorkflow();
    onExecute?.(workflow);
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setNodes([]);
    setWorkflowName("");
    setWorkflowDescription("");
  };

  // Agents not yet in the workflow
  const availableAgents = agents.filter(
    (a) => !nodes.some((n) => n.agentId === a.id),
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={() => onOpenChange(false)}
      />

      {/* Centered content */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg border bg-background p-6 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>

          {/* Header */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Workflow className="w-5 h-5 text-primary" />
              Workflow Builder
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Chain agents together — each agent's output becomes the next
              agent's input.
            </p>
          </div>

          <div className="space-y-5 pt-2">
            {/* Workflow Name & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="wf-name" className="text-xs">
                  Workflow Name
                </Label>
                <Input
                  id="wf-name"
                  placeholder="e.g. Content Pipeline"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wf-desc" className="text-xs">
                  Description (optional)
                </Label>
                <Input
                  id="wf-desc"
                  placeholder="What does this workflow do?"
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Available Agents */}
            <div className="space-y-2">
              <Label className="text-xs">Add Agents to Chain</Label>
              <div className="flex flex-wrap gap-2">
                {availableAgents.length > 0 ? (
                  availableAgents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => addNode(agent)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-muted/30 hover:bg-primary/10 hover:border-primary/40 transition-all text-xs font-medium group"
                    >
                      <Plus className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      <div
                        className={`w-2 h-2 rounded-full ${getAgentColor(agent.id)}`}
                      />
                      {agent.name}
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">
                    All agents added to workflow
                  </p>
                )}
              </div>
            </div>

            {/* Workflow Chain */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">
                  Execution Chain ({nodes.length} steps)
                </Label>
                {nodes.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={handleReset}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>

              {nodes.length === 0 ? (
                <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center">
                  <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Click agents above to add them to the chain
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Drag to reorder · Click to expand instructions
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {nodes.map((node, index) => (
                    <React.Fragment key={node.id}>
                      {/* Node */}
                      <div
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`group relative flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                          draggedIndex === index
                            ? "opacity-50 border-primary/50 bg-primary/5"
                            : "border-border/50 bg-background hover:border-border hover:shadow-sm"
                        }`}
                      >
                        {/* Drag handle */}
                        <GripVertical className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />

                        {/* Step number */}
                        <div
                          className={`w-7 h-7 rounded-full ${node.agentColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                        >
                          {index + 1}
                        </div>

                        {/* Agent info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold truncate">
                              {node.agentName}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              Step {index + 1}
                            </Badge>
                          </div>

                          {/* Expanded instruction area */}
                          {expandedNode === node.id && (
                            <div className="mt-2">
                              <Input
                                placeholder="Optional: Override instructions for this step..."
                                value={node.instruction || ""}
                                onChange={(e) =>
                                  updateNodeInstruction(node.id, e.target.value)
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() =>
                              setExpandedNode(
                                expandedNode === node.id ? null : node.id,
                              )
                            }
                            className="p-1 rounded hover:bg-muted transition-colors"
                          >
                            {expandedNode === node.id ? (
                              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </button>
                          <button
                            onClick={() => removeNode(node.id)}
                            className="p-1 rounded hover:bg-destructive/10 transition-colors"
                          >
                            <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      </div>

                      {/* Arrow connector */}
                      {index < nodes.length - 1 && (
                        <div className="flex items-center justify-center py-1">
                          <div className="flex flex-col items-center">
                            <div className="w-px h-2 bg-border" />
                            <ArrowRight className="w-4 h-4 text-primary/60 rotate-90" />
                            <div className="w-px h-2 bg-border" />
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-sm"
              >
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={nodes.length < 2}
                  className="gap-1.5 text-sm"
                >
                  <Save className="w-4 h-4" />
                  Save
                </Button>
                <Button
                  onClick={handleExecute}
                  disabled={nodes.length < 2}
                  className="gap-1.5 text-sm bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  <Play className="w-4 h-4" />
                  Run Workflow
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilder;
