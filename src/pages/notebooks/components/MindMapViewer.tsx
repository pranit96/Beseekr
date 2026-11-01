// src/pages/notebooks/components/MindMapViewer.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Interactive mind map viewer using @xyflow/react.
// Supports standard embed view and true immersive full-screen canvas mode.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Maximize2, Minimize2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MindMapNode {
  id: string;
  label: string;
  color?: string;
  description?: string;
  children?: MindMapNode[];
}

interface MindMapData {
  title: string;
  summary: string;
  root: MindMapNode;
}

interface Props {
  data: MindMapData;
}

// Custom node component
function MindMapNodeComponent({ data }: NodeProps) {
  const nodeData = data as any;
  return (
    <div
      className="min-w-[130px] max-w-[220px] rounded-xl px-3.5 py-2.5 shadow-md text-center border-2 transition-all hover:shadow-xl hover:scale-105"
      style={{
        background: nodeData.color + "1f",
        borderColor: nodeData.color || "#6366f1",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <p className="text-xs font-semibold leading-snug" style={{ color: nodeData.color || "#6366f1" }}>
        {nodeData.label}
      </p>
      {nodeData.description && (
        <p className="text-[10px] text-muted-foreground mt-1 leading-tight line-clamp-2">
          {nodeData.description}
        </p>
      )}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

const nodeTypes = { mindmap: MindMapNodeComponent };

function getSubtreeHeight(node: MindMapNode): number {
  if (!node.children?.length) return 1;
  return node.children.reduce((acc, child) => acc + getSubtreeHeight(child), 0);
}

function buildGraphWithAbsoluteY(
  node: MindMapNode,
  parentId: string | null,
  depth: number,
  absoluteY: number,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const HORIZONTAL_SPACING = 280;
  const VERTICAL_SPACING = 90;

  nodes.push({
    id: node.id,
    type: "mindmap",
    position: { x: depth * HORIZONTAL_SPACING, y: absoluteY },
    data: {
      label: node.label,
      color: node.color || "#6366f1",
      description: node.description,
    },
  });

  if (parentId) {
    edges.push({
      id: `e-${parentId}-${node.id}`,
      source: parentId,
      target: node.id,
      type: "smoothstep",
      animated: depth === 1,
      style: { stroke: node.color || "#6366f1", strokeWidth: depth <= 2 ? 2 : 1.5, opacity: 0.8 },
      markerEnd: { type: MarkerType.ArrowClosed, color: node.color || "#6366f1", width: 12, height: 12 },
    });
  }

  if (node.children?.length) {
    let currentY = absoluteY - (getSubtreeHeight(node) * VERTICAL_SPACING) / 2;
    node.children.forEach((child) => {
      const childHeight = getSubtreeHeight(child);
      const childY = currentY + (childHeight * VERTICAL_SPACING) / 2;
      currentY += childHeight * VERTICAL_SPACING;
      const { nodes: cn, edges: ce } = buildGraphWithAbsoluteY(child, node.id, depth + 1, childY);
      nodes.push(...cn);
      edges.push(...ce);
    });
  }

  return { nodes, edges };
}

export function MindMapViewer({ data }: Props) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!data?.root) return { nodes: [], edges: [] };
    return buildGraphWithAbsoluteY(data.root, null, 0, 0);
  }, [data]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Esc key listener to exit full screen
  useEffect(() => {
    if (!isFullScreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullScreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullScreen]);

  // Lock body scroll in full screen
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullScreen]);

  // Auto re-fit view when toggling full-screen mode
  useEffect(() => {
    if (reactFlowInstance) {
      const timer = setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.25, duration: 400 });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isFullScreen, reactFlowInstance]);

  const toggleFullScreen = useCallback(() => {
    setIsFullScreen((prev) => !prev);
  }, []);

  if (!data?.root) {
    return <p className="text-center text-muted-foreground py-10">No mind map generated.</p>;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 transition-all duration-300",
        isFullScreen &&
          "fixed inset-0 z-50 bg-background/95 backdrop-blur-md p-4 sm:p-6 overflow-hidden flex flex-col justify-between"
      )}
    >
      {/* Mind map header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{data.title}</h3>
            {isFullScreen && (
              <Badge variant="secondary" className="text-[11px] gap-1">
                <Sparkles className="h-3 w-3 text-indigo-500" />
                Full Screen Canvas
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">{data.summary}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant={isFullScreen ? "default" : "outline"}
            size="sm"
            onClick={toggleFullScreen}
            className="gap-1.5 text-xs h-8 shadow-sm font-medium"
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                <span>Exit Full Screen (Esc)</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Full Screen</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        className={cn(
          "rounded-xl border overflow-hidden relative shadow-inner bg-card/60 transition-all duration-300",
          isFullScreen ? "flex-1 w-full min-h-0" : "h-[620px]"
        )}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1} className="opacity-30" />
          <Controls />
          <MiniMap
            nodeColor={(n) => (n.data as any)?.color || "#6366f1"}
            maskColor="rgba(0,0,0,0.05)"
          />
        </ReactFlow>
      </div>

      {/* Footer controls hint */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <span>Drag to pan · Scroll to zoom · Click nodes to inspect</span>
        <span>
          {isFullScreen
            ? "Press Esc or click Exit Full Screen to return to notebook"
            : "Click 'Full Screen' for an immersive canvas"}
        </span>
      </div>
    </div>
  );
}
