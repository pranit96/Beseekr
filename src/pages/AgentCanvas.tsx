// src/pages/AgentCanvas.tsx
import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type ReactFlowInstance,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Play,
  Loader2,
  Trash2,
  Sparkles,
  LayoutGrid,
  Mail,
  Clock,
} from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { CanvasSidebar } from "@/components/canvas/CanvasSidebar";
import { CanvasResultPanel } from "@/components/canvas/CanvasResultPanel";
import InputNode from "@/components/canvas/InputNode";
import AgentNode from "@/components/canvas/AgentNode";
import OutputNode from "@/components/canvas/OutputNode";
import EmailNode from "@/components/canvas/EmailNode";
import { SchedulePanel } from "@/components/canvas/SchedulePanel";
import {
  useMyAgents,
  useCanvasWorkflows,
  useCanvasWorkflow,
  useCreateCanvasWorkflow,
  useUpdateCanvasWorkflow,
  useDeleteCanvasWorkflow,
  useExecuteCanvasWorkflow,
} from "@/hooks/use-api-queries";
import { useToast } from "@/hooks/use-toast";
import type { Agent, CanvasWorkflow, CanvasExecutionResult } from "@/types/agent";

// Register custom node types
const nodeTypes = {
  inputNode: InputNode,
  agentNode: AgentNode,
  outputNode: OutputNode,
  emailNode: EmailNode,
};

// Default edge style
const defaultEdgeOptions = {
  style: {
    stroke: "hsl(258, 60%, 55%)",
    strokeWidth: 2,
  },
  animated: true,
  type: "smoothstep" as const,
};

let nodeIdCounter = 0;
function getNodeId(prefix: string) {
  nodeIdCounter += 1;
  return `${prefix}_${Date.now()}_${nodeIdCounter}`;
}

const AgentCanvas: React.FC = () => {
  const { id: workflowId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance<any, any> | null>(null);

  // Canvas metadata
  const [workflowName, setWorkflowName] = useState("Untitled Canvas");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [outputFormat, setOutputFormat] = useState("plain");
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(
    workflowId || null,
  );
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Execution state
  const [executionResult, setExecutionResult] =
    useState<CanvasExecutionResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Data fetching
  const { data: agentsResponse, isLoading: loadingAgents } = useMyAgents();
  const { data: workflowsResponse, isLoading: loadingWorkflows } =
    useCanvasWorkflows();
  const { data: loadedWorkflow } = useCanvasWorkflow(workflowId || "");

  const createMutation = useCreateCanvasWorkflow();
  const updateMutation = useUpdateCanvasWorkflow();
  const deleteMutation = useDeleteCanvasWorkflow();
  const executeMutation = useExecuteCanvasWorkflow();

  const agents: Agent[] = useMemo(() => {
    if (!agentsResponse) return [];
    const d = agentsResponse.data as any;
    if (Array.isArray(d)) return d;
    if (d && Array.isArray(d.agents)) return d.agents;
    if (d && Array.isArray(d.data)) return d.data;
    return [];
  }, [agentsResponse]);

  const savedWorkflows: CanvasWorkflow[] = useMemo(() => {
    if (!workflowsResponse) return [];
    const d = workflowsResponse.data as any;
    return Array.isArray(d) ? d : [];
  }, [workflowsResponse]);

  const [schedulePanelOpen, setSchedulePanelOpen] = useState(false);

  // Update node data helper
  const updateNodeData = useCallback(
    (nodeId: string, key: string, value: any) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, [key]: value } } : n,
        ),
      );
    },
    [setNodes],
  );

  // Restore node callbacks helper
  const restoreNodesWithCallbacks = useCallback((nodesList: any[]) => {
    return nodesList.map((n: any) => {
      if (n.type === "inputNode") {
        return {
          ...n,
          data: {
            ...n.data,
            onInputChange: (text: string) =>
              updateNodeData(n.id, "inputText", text),
          },
        };
      }
      if (n.type === "agentNode") {
        return {
          ...n,
          data: {
            ...n.data,
            onInstructionChange: (text: string) =>
              updateNodeData(n.id, "instruction", text),
          },
        };
      }
      if (n.type === "outputNode") {
        return {
          ...n,
          data: {
            ...n.data,
            onFormatChange: (format: string) => {
              setOutputFormat(format);
              updateNodeData(n.id, "outputFormat", format);
            },
            onEmailToggleChange: (enabled: boolean) =>
              updateNodeData(n.id, "emailEnabled", enabled),
            onEmailToChange: (val: string) =>
              updateNodeData(n.id, "emailTo", val),
            onEmailSubjectChange: (val: string) =>
              updateNodeData(n.id, "emailSubject", val),
            onEmailTemplateChange: (val: string) =>
              updateNodeData(n.id, "emailTemplate", val),
          },
        };
      }
      if (n.type === "emailNode") {
        return {
          ...n,
          data: {
            ...n.data,
            onEmailToChange: (val: string) =>
              updateNodeData(n.id, "emailTo", val),
            onEmailSubjectChange: (val: string) =>
              updateNodeData(n.id, "emailSubject", val),
            onEmailTemplateChange: (val: string) =>
              updateNodeData(n.id, "emailTemplate", val),
          },
        };
      }
      return n;
    });
  }, [updateNodeData]);

  // Load workflow from URL param
  useEffect(() => {
    if (loadedWorkflow?.data) {
      const wf = loadedWorkflow.data;
      setWorkflowName(wf.name);
      setWorkflowDescription(wf.description || "");
      setOutputFormat(wf.output_format || "plain");
      setCurrentWorkflowId(wf.id);
      if (wf.canvas_data?.nodes) {
        setNodes(restoreNodesWithCallbacks(wf.canvas_data.nodes));
      }
      if (wf.canvas_data?.edges) {
        setEdges(wf.canvas_data.edges);
      }
    }
  }, [loadedWorkflow, restoreNodesWithCallbacks, setNodes, setEdges]);

  // Connect nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: "hsl(258, 60%, 55%)", strokeWidth: 2 },
            type: "smoothstep",
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  // Add input node
  const addInputNode = useCallback(() => {
    const id = getNodeId("input");
    const newNode: Node = {
      id,
      type: "inputNode",
      position: { x: 50, y: 200 + Math.random() * 100 },
      data: {
        label: "Input",
        inputText: "",
        onInputChange: (text: string) =>
          updateNodeData(id, "inputText", text),
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, updateNodeData]);

  // Add output node
  const addOutputNode = useCallback(() => {
    const id = getNodeId("output");
    const newNode: Node = {
      id,
      type: "outputNode",
      position: { x: 800, y: 200 + Math.random() * 100 },
      data: {
        label: "Output",
        outputFormat,
        onFormatChange: (format: string) => {
          setOutputFormat(format);
          updateNodeData(id, "outputFormat", format);
        },
        onEmailToggleChange: (enabled: boolean) =>
          updateNodeData(id, "emailEnabled", enabled),
        onEmailToChange: (val: string) =>
          updateNodeData(id, "emailTo", val),
        onEmailSubjectChange: (val: string) =>
          updateNodeData(id, "emailSubject", val),
        onEmailTemplateChange: (val: string) =>
          updateNodeData(id, "emailTemplate", val),
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, updateNodeData, outputFormat]);

  // Add email node
  const addEmailNode = useCallback(() => {
    const id = getNodeId("email");
    const newNode: Node = {
      id,
      type: "emailNode",
      position: { x: 800, y: 350 + Math.random() * 100 },
      data: {
        label: "Email Delivery",
        emailTo: "",
        emailSubject: "",
        emailTemplate: "",
        onEmailToChange: (val: string) =>
          updateNodeData(id, "emailTo", val),
        onEmailSubjectChange: (val: string) =>
          updateNodeData(id, "emailSubject", val),
        onEmailTemplateChange: (val: string) =>
          updateNodeData(id, "emailTemplate", val),
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, updateNodeData]);

  // Drag and drop agent from sidebar
  const onDragAgentStart = useCallback(
    (e: React.DragEvent, agent: Agent) => {
      e.dataTransfer.setData(
        "application/agentcanvas",
        JSON.stringify(agent),
      );
      e.dataTransfer.effectAllowed = "move";
    },
    [],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const agentJson = e.dataTransfer.getData("application/agentcanvas");
      if (!agentJson) return;

      const agent: Agent = JSON.parse(agentJson);
      if (!reactFlowInstance || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });

      const id = getNodeId("agent");
      const newNode: Node = {
        id,
        type: "agentNode",
        position,
        data: {
          agentId: agent.id,
          agentName: agent.name,
          agentDomain: agent.domain || "General",
          agentColor: agent.color || "hsl(258, 70%, 60%)",
          tools: agent.tools || [],
          instruction: "",
          onInstructionChange: (text: string) =>
            updateNodeData(id, "instruction", text),
          status: "idle",
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, setNodes, updateNodeData],
  );

  // Build canvas_data from current state
  const buildCanvasData = useCallback(() => {
    const agentIds = nodes
      .filter((n) => n.type === "agentNode")
      .map((n) => n.data?.agentId as string)
      .filter(Boolean);

    // Strip callback functions from node data for serialization
    const serializableNodes = nodes.map((n) => ({
      ...n,
      data: Object.fromEntries(
        Object.entries(n.data || {}).filter(
          ([_, v]) => typeof v !== "function",
        ),
      ),
    }));

    return {
      canvas_data: {
        nodes: serializableNodes,
        edges,
        viewport: reactFlowInstance?.getViewport() || null,
      },
      agent_ids: agentIds,
    };
  }, [nodes, edges, reactFlowInstance]);

  // Save workflow
  const handleSave = useCallback(async () => {
    if (!workflowName.trim()) {
      toast({
        title: "Name required",
        description: "Give your canvas workflow a name.",
        variant: "destructive",
      });
      return;
    }

    const agentNodes = nodes.filter((n) => n.type === "agentNode");
    if (agentNodes.length === 0) {
      toast({
        title: "Add agents",
        description: "Drag at least one agent onto the canvas.",
        variant: "destructive",
      });
      return;
    }

    const { canvas_data, agent_ids } = buildCanvasData();

    if (currentWorkflowId) {
      await updateMutation.mutateAsync({
        id: currentWorkflowId,
        data: {
          name: workflowName,
          description: workflowDescription,
          canvas_data,
          agent_ids,
          output_format: outputFormat,
        },
      });
    } else {
      const result = await createMutation.mutateAsync({
        name: workflowName,
        description: workflowDescription,
        canvas_data,
        agent_ids,
        output_format: outputFormat,
      });
      if (result?.data?.id) {
        setCurrentWorkflowId(result.data.id);
        navigate(`/canvas/${result.data.id}`, { replace: true });
      }
    }
  }, [
    workflowName,
    workflowDescription,
    outputFormat,
    currentWorkflowId,
    nodes,
    buildCanvasData,
    createMutation,
    updateMutation,
    navigate,
    toast,
  ]);

  // Execute workflow
  const handleExecute = useCallback(async () => {
    // Need at least one agent
    const agentNodes = nodes.filter((n) => n.type === "agentNode");
    if (agentNodes.length === 0) {
      toast({
        title: "Add agents",
        description: "Add at least one agent to the canvas before running.",
        variant: "destructive",
      });
      return;
    }

    // Gather input text from input nodes
    const inputNodes = nodes.filter((n) => n.type === "inputNode");
    const inputTexts = inputNodes
      .map((n) => (n.data?.inputText as string) || "")
      .filter((t) => t.trim());

    if (inputTexts.length === 0) {
      toast({
        title: "Input required",
        description:
          "Add an Input node and type your prompt before running.",
        variant: "destructive",
      });
      return;
    }

    // Save first if not saved
    let execId = currentWorkflowId;
    if (!execId) {
      const { canvas_data, agent_ids } = buildCanvasData();
      const result = await createMutation.mutateAsync({
        name: workflowName || "Untitled Canvas",
        description: workflowDescription,
        canvas_data,
        agent_ids,
        output_format: outputFormat,
      });
      if (result?.data?.id) {
        execId = result.data.id;
        setCurrentWorkflowId(execId);
        navigate(`/canvas/${execId}`, { replace: true });
      }
    } else {
      // Update canvas_data before executing
      const { canvas_data, agent_ids } = buildCanvasData();
      await updateMutation.mutateAsync({
        id: execId,
        data: { canvas_data, agent_ids, output_format: outputFormat },
      });
    }

    if (!execId) {
      toast({
        title: "Save failed",
        description: "Could not save canvas before execution.",
        variant: "destructive",
      });
      return;
    }

    setShowResults(true);
    setExecutionResult(null);

    try {
      const result = await executeMutation.mutateAsync({
        id: execId,
        payload: {
          input_text: inputTexts.join("\n\n"),
          output_format: outputFormat,
        },
      });

      if (result?.data) {
        setExecutionResult(result.data);
      }
    } catch {
      // Error handled by hook
    }
  }, [
    nodes,
    currentWorkflowId,
    workflowName,
    workflowDescription,
    outputFormat,
    buildCanvasData,
    createMutation,
    updateMutation,
    executeMutation,
    navigate,
    toast,
  ]);

  // Load saved workflow
  const handleLoadWorkflow = useCallback(
    (wf: CanvasWorkflow) => {
      setWorkflowName(wf.name);
      setWorkflowDescription(wf.description || "");
      setOutputFormat(wf.output_format || "plain");
      setCurrentWorkflowId(wf.id);

      if (wf.canvas_data?.nodes) {
        setNodes(restoreNodesWithCallbacks(wf.canvas_data.nodes));
      }
      if (wf.canvas_data?.edges) {
        setEdges(wf.canvas_data.edges);
      }

      navigate(`/canvas/${wf.id}`, { replace: true });
    },
    [navigate, setNodes, setEdges, restoreNodesWithCallbacks],
  );

  // Delete workflow
  const handleDeleteWorkflow = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
      if (id === currentWorkflowId) {
        setCurrentWorkflowId(null);
        setNodes([]);
        setEdges([]);
        setWorkflowName("Untitled Canvas");
        navigate("/canvas", { replace: true });
      }
    },
    [currentWorkflowId, deleteMutation, navigate, setNodes, setEdges],
  );

  // Clear canvas
  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setCurrentWorkflowId(null);
    setWorkflowName("Untitled Canvas");
    setWorkflowDescription("");
    setOutputFormat("plain");
    setExecutionResult(null);
    setShowResults(false);
    navigate("/canvas", { replace: true });
  }, [navigate, setNodes, setEdges]);

  // Download result
  const handleDownload = useCallback(
    (format: string) => {
      if (!executionResult?.final_output) return;
      const content = executionResult.final_output;
      let mimeType = "text/plain";
      let extension = "txt";

      switch (format) {
        case "csv":
          mimeType = "text/csv";
          extension = "csv";
          break;
        case "latex":
          mimeType = "application/x-latex";
          extension = "tex";
          break;
        default:
          mimeType = "text/markdown";
          extension = "md";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${workflowName.replace(/\s+/g, "_")}_result.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [executionResult, workflowName],
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isExecuting = executeMutation.isPending;

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden selection:bg-primary/30">
      <GlobalHeader />

      {/* Top Toolbar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-card/30 backdrop-blur-xl z-10">
        {/* Left: Back + Name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/agents")}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/20">
              <LayoutGrid className="w-3.5 h-3.5 text-white" />
            </div>
            {isEditingName ? (
              <input
                ref={nameInputRef}
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setIsEditingName(false);
                }}
                autoFocus
                className="text-sm font-bold text-foreground bg-transparent border-b border-primary/50 outline-none px-1 py-0.5 min-w-[200px]"
              />
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="text-sm font-bold text-foreground hover:text-primary transition-colors"
              >
                {workflowName}
              </button>
            )}
            {currentWorkflowId && (
              <span className="text-[9px] font-medium text-muted-foreground/40 bg-muted/30 px-2 py-0.5 rounded-md">
                Saved
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-border/40 bg-card/10 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
          {currentWorkflowId && (
            <button
              onClick={() => setSchedulePanelOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all"
            >
              <Clock className="w-3.5 h-3.5" />
              Schedule
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save
          </button>
          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 transition-all shadow-md shadow-violet-500/20 disabled:opacity-50"
          >
            {isExecuting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Run
          </button>
        </div>
      </div>

      {/* Main layout: Sidebar + Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        <CanvasSidebar
          agents={agents}
          savedWorkflows={savedWorkflows}
          onDragAgentStart={onDragAgentStart}
          onAddInputNode={addInputNode}
          onAddOutputNode={addOutputNode}
          onAddEmailNode={addEmailNode}
          onLoadWorkflow={handleLoadWorkflow}
          onDeleteWorkflow={handleDeleteWorkflow}
          loadingWorkflows={loadingWorkflows}
        />

        {/* React Flow Canvas */}
        <div
          ref={reactFlowWrapper}
          className="flex-1 relative"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={(instance) => setReactFlowInstance(instance)}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            minZoom={0.2}
            maxZoom={2}
            deleteKeyCode={["Backspace", "Delete"]}
            className="bg-background/25"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={12}
              size={1}
            />
            <Controls
              className="!bg-card/60 !border-border/20 !rounded-xl !shadow-xl !backdrop-blur-xl"
              position="bottom-right"
            />
            <MiniMap
              className="!bg-card/60 !border-border/20 !rounded-xl !shadow-xl !backdrop-blur-xl"
              nodeColor={(node) => {
                if (node.type === "inputNode") return "hsl(145, 70%, 45%)";
                if (node.type === "outputNode") return "hsl(200, 80%, 50%)";
                if (node.type === "emailNode") return "hsl(340, 75%, 55%)";
                return (
                  (node.data?.agentColor as string) || "hsl(258, 70%, 60%)"
                );
              }}
              maskColor="hsla(0, 0%, 0%, 0.7)"
              position="top-right"
            />
          </ReactFlow>

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
              <div className="flex flex-col items-center gap-4 text-center max-w-xs">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground/80 mb-1">
                    Build Your Agent Canvas
                  </h3>
                  <p className="text-xs text-muted-foreground/50 leading-relaxed">
                    Drag agents from the sidebar, add Input & Output
                    nodes, then wire them together to create powerful
                    multi-agent workflows.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Results panel */}
          {showResults && (
            <CanvasResultPanel
              result={executionResult}
              isRunning={isExecuting}
              onClose={() => setShowResults(false)}
              onDownload={handleDownload}
            />
          )}
        </div>
      </div>

      {/* Schedule Management Panel */}
      {currentWorkflowId && (
        <SchedulePanel
          workflowId={currentWorkflowId}
          workflowName={workflowName}
          isOpen={schedulePanelOpen}
          onClose={() => setSchedulePanelOpen(false)}
        />
      )}
    </div>
  );
};

export default AgentCanvas;
