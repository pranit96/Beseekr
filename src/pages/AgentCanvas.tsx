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
} from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { CanvasSidebar } from "@/components/canvas/CanvasSidebar";
import { CanvasResultPanel } from "@/components/canvas/CanvasResultPanel";
import InputNode from "@/components/canvas/InputNode";
import AgentNode from "@/components/canvas/AgentNode";
import OutputNode from "@/components/canvas/OutputNode";
import EmailNode from "@/components/canvas/EmailNode";
import ScheduleNode from "@/components/canvas/ScheduleNode";
import ConditionalNode from "@/components/canvas/ConditionalNode";
import MergeNode from "@/components/canvas/MergeNode";
import NoteNode from "@/components/canvas/NoteNode";
import HttpNode from "@/components/canvas/HttpNode";
import TransformNode from "@/components/canvas/TransformNode";
import TelegramNode from "@/components/canvas/TelegramNode";
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
  scheduleNode: ScheduleNode,
  conditionalNode: ConditionalNode,
  mergeNode: MergeNode,
  noteNode: NoteNode,
  httpNode: HttpNode,
  transformNode: TransformNode,
  telegramNode: TelegramNode,
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
  const handleExecuteRef = useRef<(() => Promise<void>) | null>(null);

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
            onFormatChange: (format: string) =>
              updateNodeData(n.id, "inputFormat", format),
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
          },
        };
      }
      if (n.type === "telegramNode") {
        return {
          ...n,
          data: {
            ...n.data,
            onBotTokenChange: (val: string) =>
              updateNodeData(n.id, "botToken", val),
            onChatIdChange: (val: string) =>
              updateNodeData(n.id, "chatId", val),
            onMessageTemplateChange: (val: string) =>
              updateNodeData(n.id, "messageTemplate", val),
          },
        };
      }
      if (n.type === "scheduleNode") {
        return {
          ...n,
          data: {
            ...n.data,
            onLabelChange: (val: string) =>
              updateNodeData(n.id, "label", val),
            onCronPresetChange: (val: string) =>
              updateNodeData(n.id, "cronPreset", val),
            onCustomCronChange: (val: string) =>
              updateNodeData(n.id, "customCron", val),
            onTimezoneChange: (val: string) =>
              updateNodeData(n.id, "timezone", val),
            onMaxRunsChange: (val: string) =>
              updateNodeData(n.id, "maxRuns", val),
            onActiveToggle: (val: boolean) =>
              updateNodeData(n.id, "isActive", val),
            onInputTextChange: (val: string) =>
              updateNodeData(n.id, "inputText", val),
            onExecute: () => handleExecuteRef.current?.(),
          },
        };
      }
      if (n.type === "conditionalNode") {
        return {
          ...n,
          data: {
            ...n.data,
            onLabelChange: (val: string) => updateNodeData(n.id, "label", val),
            onRuleTypeChange: (val: string) => updateNodeData(n.id, "ruleType", val),
            onRuleValueChange: (val: string) => updateNodeData(n.id, "ruleValue", val),
            onRuleDescriptionChange: (val: string) => updateNodeData(n.id, "ruleDescription", val),
          },
        };
      }
      if (n.type === "mergeNode") {
        return {
          ...n,
          data: {
            ...n.data,
            onLabelChange: (val: string) => updateNodeData(n.id, "label", val),
            onStrategyChange: (val: string) => updateNodeData(n.id, "strategy", val),
            onSeparatorChange: (val: string) => updateNodeData(n.id, "separator", val),
          },
        };
      }
      if (n.type === "noteNode") {
        return {
          ...n,
          data: {
            ...n.data,
            onLabelChange: (val: string) => updateNodeData(n.id, "label", val),
            onNoteTextChange: (val: string) => updateNodeData(n.id, "noteText", val),
            onNoteColorChange: (val: string) => updateNodeData(n.id, "noteColor", val),
          },
        };
      }
      if (n.type === "httpNode") {
        return {
          ...n,
          data: {
            ...n.data,
            onLabelChange: (val: string) => updateNodeData(n.id, "label", val),
            onMethodChange: (val: string) => updateNodeData(n.id, "method", val),
            onUrlChange: (val: string) => updateNodeData(n.id, "url", val),
            onHeadersChange: (val: string) => updateNodeData(n.id, "headers", val),
            onBodyChange: (val: string) => updateNodeData(n.id, "body", val),
          },
        };
      }
      if (n.type === "transformNode") {
        return {
          ...n,
          data: {
            ...n.data,
            onLabelChange: (val: string) => updateNodeData(n.id, "label", val),
            onOperationChange: (val: string) => updateNodeData(n.id, "operation", val),
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

  // Connection validation
  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const { source, target } = connection;
      if (!source || !target || source === target) return false;

      const sourceNode = nodes.find((n) => n.id === source);
      const targetNode = nodes.find((n) => n.id === target);
      if (!sourceNode || !targetNode) return false;

      // Note nodes cannot have connections (purely annotation)
      if (sourceNode.type === "noteNode" || targetNode.type === "noteNode") return false;

      // Input nodes should not receive connections (they are entry points)
      if (targetNode.type === "inputNode") return false;

      // Prevent duplicate edges, taking handle IDs into account
      const exists = edges.some(
        (e) =>
          e.source === source &&
          e.target === target &&
          e.sourceHandle === (connection as any).sourceHandle &&
          e.targetHandle === (connection as any).targetHandle,
      );
      if (exists) return false;

      return true;
    },
    [nodes, edges],
  );

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
        inputFormat: "text",
        onInputChange: (text: string) =>
          updateNodeData(id, "inputText", text),
        onFormatChange: (format: string) =>
          updateNodeData(id, "inputFormat", format),
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
        onEmailToChange: (val: string) =>
          updateNodeData(id, "emailTo", val),
        onEmailSubjectChange: (val: string) =>
          updateNodeData(id, "emailSubject", val),
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, updateNodeData]);

  // Add telegram node
  const addTelegramNode = useCallback(() => {
    const id = getNodeId("telegram");
    const newNode: Node = {
      id,
      type: "telegramNode",
      position: { x: 800, y: 380 + Math.random() * 100 },
      data: {
        label: "Telegram Notification",
        botToken: "",
        chatId: "",
        messageTemplate: "",
        onBotTokenChange: (val: string) =>
          updateNodeData(id, "botToken", val),
        onChatIdChange: (val: string) =>
          updateNodeData(id, "chatId", val),
        onMessageTemplateChange: (val: string) =>
          updateNodeData(id, "messageTemplate", val),
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, updateNodeData]);

  // Add agent node programmatically via click
  const addAgentNode = useCallback(
    (agent: Agent) => {
      const id = getNodeId("agent");
      let position = { x: 400 + Math.random() * 100, y: 300 + Math.random() * 100 };
      if (reactFlowInstance) {
        position = reactFlowInstance.screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
      }
      const newNode: Node = {
        id,
        type: "agentNode",
        position,
        data: {
          agentId: agent.id,
          agentName: agent.name,
          agentDomain: agent.domain || "General",
          agentColor: agent.color || "hsl(258, 70%, 60%)",
          provider: (agent as any).provider || "",
          model: (agent as any).model || "",
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

  // Add schedule node
  const addScheduleNode = useCallback(() => {
    const id = getNodeId("schedule");
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const newNode: Node = {
      id,
      type: "scheduleNode",
      position: { x: 800, y: 500 + Math.random() * 100 },
      data: {
        label: "Schedule",
        cronPreset: "0 0 * * *",
        customCron: "*/5 * * * *",
        timezone: localTz,
        maxRuns: "",
        isActive: true,
        inputText: "",
        onLabelChange: (val: string) =>
          updateNodeData(id, "label", val),
        onCronPresetChange: (val: string) =>
          updateNodeData(id, "cronPreset", val),
        onCustomCronChange: (val: string) =>
          updateNodeData(id, "customCron", val),
        onTimezoneChange: (val: string) =>
          updateNodeData(id, "timezone", val),
        onMaxRunsChange: (val: string) =>
          updateNodeData(id, "maxRuns", val),
        onActiveToggle: (val: boolean) =>
          updateNodeData(id, "isActive", val),
        onInputTextChange: (val: string) =>
          updateNodeData(id, "inputText", val),
        onExecute: () => handleExecuteRef.current?.(),
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, updateNodeData]);

  // Add conditional node
  const addConditionalNode = useCallback(() => {
    const id = getNodeId("conditional");
    const newNode: Node = {
      id,
      type: "conditionalNode",
      position: { x: 450, y: 250 + Math.random() * 100 },
      data: {
        label: "Conditional / IF",
        ruleType: "contains",
        ruleValue: "",
        ruleDescription: "",
        onLabelChange: (val: string) => updateNodeData(id, "label", val),
        onRuleTypeChange: (val: string) => updateNodeData(id, "ruleType", val),
        onRuleValueChange: (val: string) => updateNodeData(id, "ruleValue", val),
        onRuleDescriptionChange: (val: string) => updateNodeData(id, "ruleDescription", val),
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, updateNodeData]);

  // Add merge node
  const addMergeNode = useCallback(() => {
    const id = getNodeId("merge");
    const newNode: Node = {
      id,
      type: "mergeNode",
      position: { x: 600, y: 300 + Math.random() * 100 },
      data: {
        label: "Merge / Combiner",
        strategy: "concat",
        separator: "\\n\\n",
        onLabelChange: (val: string) => updateNodeData(id, "label", val),
        onStrategyChange: (val: string) => updateNodeData(id, "strategy", val),
        onSeparatorChange: (val: string) => updateNodeData(id, "separator", val),
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, updateNodeData]);

  // Add note node
  const addNoteNode = useCallback(() => {
    const id = getNodeId("note");
    const newNode: Node = {
      id,
      type: "noteNode",
      position: { x: 300, y: 100 + Math.random() * 50 },
      data: {
        label: "Sticky Note",
        noteText: "Double-click to edit this note...",
        noteColor: "yellow",
        onLabelChange: (val: string) => updateNodeData(id, "label", val),
        onNoteTextChange: (val: string) => updateNodeData(id, "noteText", val),
        onNoteColorChange: (val: string) => updateNodeData(id, "noteColor", val),
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, updateNodeData]);

  // Add HTTP request node
  const addHttpNode = useCallback(() => {
    const id = getNodeId("http");
    const newNode: Node = {
      id,
      type: "httpNode",
      position: { x: 300, y: 250 + Math.random() * 100 },
      data: {
        label: "HTTP Request",
        method: "GET",
        url: "",
        headers: "",
        body: "",
        onLabelChange: (val: string) => updateNodeData(id, "label", val),
        onMethodChange: (val: string) => updateNodeData(id, "method", val),
        onUrlChange: (val: string) => updateNodeData(id, "url", val),
        onHeadersChange: (val: string) => updateNodeData(id, "headers", val),
        onBodyChange: (val: string) => updateNodeData(id, "body", val),
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, updateNodeData]);

  // Add transform node
  const addTransformNode = useCallback(() => {
    const id = getNodeId("transform");
    const newNode: Node = {
      id,
      type: "transformNode",
      position: { x: 600, y: 200 + Math.random() * 100 },
      data: {
        label: "Transform / Utility",
        operation: "json_to_csv",
        onLabelChange: (val: string) => updateNodeData(id, "label", val),
        onOperationChange: (val: string) => updateNodeData(id, "operation", val),
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
          provider: (agent as any).provider || "",
          model: (agent as any).model || "",
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

    // Initialize all execution nodes as running
    setNodes((nds) =>
      nds.map((n) => {
        if (["noteNode", "inputNode", "scheduleNode"].includes(n.type)) return n;
        return {
          ...n,
          data: {
            ...n.data,
            status: "running",
            responseStatus: undefined,
            responsePreview: undefined,
            transformPreview: undefined,
          },
        };
      })
    );

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
        
        // Staggered node animation based on agent_results
        const results = result.data.agent_results || [];
        results.forEach((res: any, idx: number) => {
          setTimeout(() => {
            setNodes((nds) =>
              nds.map((n) => {
                if (n.id !== res.node_id) return n;
                
                const hasError = !!res.error;
                
                let updatedData = {
                  ...n.data,
                  status: (hasError ? "error" : "done") as any,
                };
                
                if (n.type === "httpNode") {
                  updatedData.responseStatus = hasError ? 500 : 200;
                  updatedData.responsePreview = hasError ? res.error : res.response;
                } else if (n.type === "transformNode") {
                  updatedData.transformPreview = hasError ? res.error : res.response;
                }
                
                return {
                  ...n,
                  data: updatedData,
                };
              })
            );
          }, (idx + 1) * 600); // 600ms stagger delay per node execution step
        });
      }
    } catch {
      // Error handled by hook
      // Reset statuses to error/idle on failure
      setNodes((nds) =>
        nds.map((n) => {
          if (["noteNode", "inputNode", "scheduleNode"].includes(n.type)) return n;
          return {
            ...n,
            data: {
              ...n.data,
              status: "error",
            },
          };
        })
      );
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

  handleExecuteRef.current = handleExecute;

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

  const handleDownload = useCallback(
    (format: string) => {
      if (!executionResult?.final_output) return;
      const content = executionResult.final_output;

      if (format === "pdf") {
        const urlMatch = content.match(/\[Download PDF\]\((https?:\/\/[^\s)]+)\)/i) ||
                         content.match(/(https?:\/\/[^\s)]+\/api\/files\/[^\s)]+)/i) ||
                         content.match(/(https?:\/\/[^\s)]+\.pdf[^\s)]*)/i);
        if (urlMatch && urlMatch[1]) {
          window.open(urlMatch[1], "_blank");
          return;
        }
      }

      let mimeType = "text/plain";
      let extension = "txt";

      switch (format) {
        case "csv":
        case "excel":
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
          onAddAgentNode={addAgentNode}
          onAddInputNode={addInputNode}
          onAddOutputNode={addOutputNode}
          onAddEmailNode={addEmailNode}
          onAddScheduleNode={addScheduleNode}
          onAddTelegramNode={addTelegramNode}
          onAddConditionalNode={addConditionalNode}
          onAddMergeNode={addMergeNode}
          onAddNoteNode={addNoteNode}
          onAddHttpNode={addHttpNode}
          onAddTransformNode={addTransformNode}
          onLoadWorkflow={handleLoadWorkflow}
          onDeleteWorkflow={handleDeleteWorkflow}
          loadingWorkflows={loadingWorkflows}
          nodeCount={nodes.length}
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
            isValidConnection={isValidConnection}
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
                if (node.type === "telegramNode") return "hsl(200, 85%, 45%)";
                if (node.type === "scheduleNode") return "hsl(35, 80%, 55%)";
                if (node.type === "conditionalNode") return "hsl(190, 80%, 50%)";
                if (node.type === "mergeNode") return "hsl(235, 80%, 60%)";
                if (node.type === "noteNode") return "hsl(45, 80%, 55%)";
                if (node.type === "httpNode") return "hsl(170, 80%, 45%)";
                if (node.type === "transformNode") return "hsl(295, 80%, 50%)";
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
                    Drag agents from the sidebar, add Input &amp; Output
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
    </div>
  );
};

export default AgentCanvas;
