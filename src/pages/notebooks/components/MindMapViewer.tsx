// src/pages/notebooks/components/MindMapViewer.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Interactive mind map viewer using @xyflow/react (already installed).
// Converts the hierarchical JSON into xyflow nodes and edges.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useCallback } from "react";
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
      className="min-w-[120px] max-w-[200px] rounded-xl px-3 py-2 shadow-md text-center border-2 transition-shadow hover:shadow-lg"
      style={{
        background: nodeData.color + "22",
        borderColor: nodeData.color || "#6366f1",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <p className="text-xs font-semibold leading-tight" style={{ color: nodeData.color || "#6366f1" }}>
        {nodeData.label}
      </p>
      {nodeData.description && (
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight line-clamp-2">
          {nodeData.description}
        </p>
      )}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

const nodeTypes = { mindmap: MindMapNodeComponent };

// Convert hierarchical JSON to flat nodes + edges for xyflow
function buildGraph(
  node: MindMapNode,
  parentId: string | null = null,
  depth = 0,
  siblingIndex = 0,
  totalSiblings = 1,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const HORIZONTAL_SPACING = 280;
  const VERTICAL_SPACING = 90;

  // Y-position: center root, spread children symmetrically
  const yOffset = depth === 0
    ? 0
    : (siblingIndex - (totalSiblings - 1) / 2) * VERTICAL_SPACING;

  const xPos = depth * HORIZONTAL_SPACING;

  nodes.push({
    id: node.id,
    type: "mindmap",
    position: { x: xPos, y: yOffset },
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
      style: { stroke: node.color || "#6366f1", strokeWidth: depth === 1 ? 2 : 1.5, opacity: 0.8 },
      markerEnd: { type: MarkerType.ArrowClosed, color: node.color || "#6366f1", width: 15, height: 15 },
    });
  }

  if (node.children?.length) {
    // Calculate cumulative y-offset for children based on subtree sizes
    let currentYOffset = -(getSubtreeHeight(node) * VERTICAL_SPACING) / 2;

    node.children.forEach((child, i) => {
      const childHeight = getSubtreeHeight(child);
      const childY = yOffset + currentYOffset + (childHeight * VERTICAL_SPACING) / 2;
      currentYOffset += childHeight * VERTICAL_SPACING;

      const { nodes: childNodes, edges: childEdges } = buildGraphWithAbsoluteY(
        child,
        node.id,
        depth + 1,
        childY,
      );
      nodes.push(...childNodes);
      edges.push(...childEdges);
    });
  }

  return { nodes, edges };
}

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
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!data?.root) return { nodes: [], edges: [] };
    return buildGraphWithAbsoluteY(data.root, null, 0, 0);
  }, [data]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  if (!data?.root) {
    return <p className="text-center text-muted-foreground py-10">No mind map generated.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-semibold text-lg">{data.title}</h3>
        <p className="text-sm text-muted-foreground">{data.summary}</p>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ height: 520 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
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

      <p className="text-xs text-center text-muted-foreground">
        Drag to pan · Scroll to zoom · Click nodes to explore
      </p>
    </div>
  );
}

