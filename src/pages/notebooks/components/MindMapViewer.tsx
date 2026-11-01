// src/pages/notebooks/components/MindMapViewer.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Interactive, beautifully balanced Mind Map viewer using @xyflow/react.
// Supports bilateral (center-outward) layout, horizontal tree mode, branch
// collapse/expand, concept search highlighting, and full-screen canvas mode.
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
  Handle,
  Position,
  NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Maximize2,
  Minimize2,
  Sparkles,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  ChevronsDownUp,
  ChevronsUpDown,
  GitFork,
  Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface MindMapNode {
  id: string;
  label: string;
  color?: string;
  description?: string;
  children?: MindMapNode[];
}

export interface MindMapData {
  title: string;
  summary: string;
  root: MindMapNode;
}

interface Props {
  data: MindMapData;
}

export type LayoutMode = "bilateral" | "horizontal";

// Distinct color palette for primary branches
const BRANCH_PALETTE = [
  "#6366f1", // Indigo
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#3b82f6", // Blue
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#e11d48", // Rose
];

// Custom node component with handle placement based on branch direction
function MindMapNodeComponent({ data }: NodeProps) {
  const {
    label,
    description,
    color = "#6366f1",
    direction = "right",
    depth = 0,
    isRoot = false,
    hasChildren = false,
    isCollapsed = false,
    childCount = 0,
    matchesSearch = true,
    isSearching = false,
    totalBranches = 0,
    totalConcepts = 0,
    onToggleCollapse,
  } = data as any;

  // 1. Root Node (Central Topic)
  if (isRoot) {
    return (
      <div
        className={cn(
          "rounded-2xl px-5 py-4 shadow-xl text-center border-2 transition-all duration-200 select-none",
          "bg-gradient-to-br from-card via-card/95 to-card/70 backdrop-blur-md",
          "border-indigo-500/70 shadow-indigo-500/20 min-w-[220px] max-w-[300px]",
          isSearching && !matchesSearch && "opacity-30",
          isSearching && matchesSearch && "ring-2 ring-indigo-500 shadow-indigo-500/40"
        )}
      >
        <Handle
          id="left"
          type="source"
          position={Position.Left}
          className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-background"
        />
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-indigo-500 uppercase tracking-wider mb-1">
          <Sparkles className="h-3 w-3" />
          <span>Central Topic</span>
        </div>
        <h4 className="font-bold text-sm leading-snug text-foreground">
          {label}
        </h4>
        {description && (
          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-tight">
            {description}
          </p>
        )}
        <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground font-medium">
          <span>{totalBranches} branches</span>
          <span>·</span>
          <span>{totalConcepts} concepts</span>
        </div>
        <Handle
          id="right"
          type="source"
          position={Position.Right}
          className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-background"
        />
      </div>
    );
  }

  // 2. Primary Branch Node (Depth 1)
  if (depth === 1) {
    const isRight = direction === "right";
    return (
      <div
        className={cn(
          "rounded-xl px-4 py-3 shadow-md border-2 transition-all duration-200 select-none min-w-[180px] max-w-[260px]",
          "bg-card/90 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02]",
          isSearching && !matchesSearch && "opacity-25 grayscale",
          isSearching && matchesSearch && "ring-2 ring-indigo-500 shadow-indigo-500/30"
        )}
        style={{
          borderColor: color || "#6366f1",
          boxShadow: `0 4px 14px -3px ${color}25`,
        }}
      >
        <Handle
          id={isRight ? "left" : "right"}
          type="target"
          position={isRight ? Position.Left : Position.Right}
          className="!w-2 !h-2 !border !border-background"
          style={{ backgroundColor: color }}
        />

        <div className="flex items-center justify-between gap-1 mb-1">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ backgroundColor: color + "1a", color }}
          >
            Topic
          </span>
          {hasChildren && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">
              {childCount} {childCount === 1 ? "item" : "items"}
            </Badge>
          )}
        </div>

        <p className="text-xs font-bold leading-snug" style={{ color }}>
          {label}
        </p>

        {description && (
          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-tight">
            {description}
          </p>
        )}

        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse?.();
            }}
            className="mt-2 flex items-center justify-center gap-1 w-full py-1 px-2 rounded-md text-[10px] font-medium border bg-muted/40 hover:bg-muted transition-colors"
            style={{ borderColor: color + "33" }}
          >
            {isCollapsed ? (
              <>
                <ChevronRight className="h-2.5 w-2.5" />
                <span>Show {childCount} sub-topics</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-2.5 w-2.5" />
                <span>Hide sub-topics</span>
              </>
            )}
          </button>
        )}

        {hasChildren && !isCollapsed && (
          <Handle
            id={isRight ? "right" : "left"}
            type="source"
            position={isRight ? Position.Right : Position.Left}
            className="!w-2 !h-2 !border !border-background"
            style={{ backgroundColor: color }}
          />
        )}
      </div>
    );
  }

  // 3. Leaf / Sub-topic Node (Depth 2+)
  const isRight = direction === "right";
  return (
    <div
      className={cn(
        "rounded-lg px-3 py-2 shadow-sm border transition-all duration-150 select-none min-w-[150px] max-w-[220px]",
        "bg-card/85 backdrop-blur-sm hover:shadow-md hover:scale-[1.02]",
        isSearching && !matchesSearch && "opacity-25 grayscale",
        isSearching && matchesSearch && "ring-2 ring-indigo-500 shadow-indigo-500/30"
      )}
      style={{
        borderColor: color + "60",
        background: color + "0c",
      }}
    >
      <Handle
        id={isRight ? "left" : "right"}
        type="target"
        position={isRight ? Position.Left : Position.Right}
        className="!w-1.5 !h-1.5 !border !border-background"
        style={{ backgroundColor: color }}
      />
      <p className="text-xs font-semibold leading-snug" style={{ color }}>
        {label}
      </p>
      {description && (
        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-tight">
          {description}
        </p>
      )}
      {hasChildren && !isCollapsed && (
        <Handle
          id={isRight ? "right" : "left"}
          type="source"
          position={isRight ? Position.Right : Position.Left}
          className="!w-1.5 !h-1.5 !border !border-background"
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
}

const nodeTypes = { mindmap: MindMapNodeComponent };

// Helper: Count total nodes in graph
function countTotalNodes(node: MindMapNode): number {
  if (!node.children?.length) return 1;
  return 1 + node.children.reduce((acc, c) => acc + countTotalNodes(c), 0);
}

// Helper: Count visible leaves considering collapsed state
function getVisibleLeafCount(node: MindMapNode, collapsedIds: Set<string>): number {
  if (collapsedIds.has(node.id) || !node.children?.length) return 1;
  return node.children.reduce((acc, c) => acc + getVisibleLeafCount(c, collapsedIds), 0);
}

// Helper: Collect all branch IDs with children (for Expand/Collapse all)
function getAllParentIds(node: MindMapNode): string[] {
  const ids: string[] = [];
  if (node.children?.length) {
    ids.push(node.id);
    node.children.forEach((c) => {
      ids.push(...getAllParentIds(c));
    });
  }
  return ids;
}

// Helper: Build graph layout
function buildBalancedMindMap(
  root: MindMapNode,
  mode: LayoutMode,
  collapsedIds: Set<string>,
  searchQuery: string,
  onToggleCollapse: (id: string) => void
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const q = searchQuery.trim().toLowerCase();

  const isMatch = (label: string, desc?: string) => {
    if (!q) return true;
    return label.toLowerCase().includes(q) || (desc?.toLowerCase().includes(q) ?? false);
  };

  const totalBranches = root.children?.length ?? 0;
  const totalConcepts = Math.max(0, countTotalNodes(root) - 1);

  // 1. Add Root Node at (0, 0)
  nodes.push({
    id: root.id,
    type: "mindmap",
    position: { x: 0, y: 0 },
    data: {
      label: root.label,
      description: root.description,
      isRoot: true,
      depth: 0,
      totalBranches,
      totalConcepts,
      matchesSearch: isMatch(root.label, root.description),
      isSearching: q.length > 0,
    },
  });

  const children = root.children || [];
  if (children.length === 0) return { nodes, edges };

  const HORIZONTAL_STEP = 330;
  const LEAF_HEIGHT = 74;
  const BRANCH_GAP = 28;

  // Recursive placement for descendant sub-trees
  const layoutDescendants = (
    parentNode: MindMapNode,
    direction: "left" | "right",
    depth: number,
    startY: number,
    totalSliceHeight: number,
    branchColor: string
  ) => {
    if (collapsedIds.has(parentNode.id) || !parentNode.children?.length) return;

    const totalSubLeaves = getVisibleLeafCount(parentNode, collapsedIds);
    let currentY = startY;
    const x = direction === "right" ? depth * HORIZONTAL_STEP : -depth * HORIZONTAL_STEP;

    parentNode.children.forEach((child) => {
      const childLeaves = getVisibleLeafCount(child, collapsedIds);
      const childSliceHeight = (childLeaves / Math.max(1, totalSubLeaves)) * totalSliceHeight;
      const centerY = currentY + childSliceHeight / 2;

      nodes.push({
        id: child.id,
        type: "mindmap",
        position: { x, y: centerY },
        data: {
          label: child.label,
          description: child.description,
          color: branchColor,
          direction,
          depth,
          isRoot: false,
          hasChildren: (child.children?.length ?? 0) > 0,
          isCollapsed: collapsedIds.has(child.id),
          childCount: child.children?.length ?? 0,
          matchesSearch: isMatch(child.label, child.description),
          isSearching: q.length > 0,
          onToggleCollapse: () => onToggleCollapse(child.id),
        },
      });

      edges.push({
        id: `e-${parentNode.id}-${child.id}`,
        source: parentNode.id,
        target: child.id,
        sourceHandle: direction === "right" ? "right" : "left",
        targetHandle: direction === "right" ? "left" : "right",
        type: "bezier",
        style: {
          stroke: branchColor,
          strokeWidth: 1.5,
          opacity: 0.75,
        },
      });

      layoutDescendants(child, direction, depth + 1, currentY, childSliceHeight, branchColor);
      currentY += childSliceHeight;
    });
  };

  // Branch layout generator for a given direction
  const layoutSideBranches = (
    branches: MindMapNode[],
    direction: "left" | "right",
    startIndexOffset: number
  ) => {
    const totalSideHeight =
      branches.reduce((acc, b) => acc + getVisibleLeafCount(b, collapsedIds) * LEAF_HEIGHT + BRANCH_GAP, 0) -
      BRANCH_GAP;

    let startY = -totalSideHeight / 2;
    const x = direction === "right" ? HORIZONTAL_STEP : -HORIZONTAL_STEP;

    branches.forEach((branch, idx) => {
      const color =
        branch.color || BRANCH_PALETTE[(startIndexOffset + idx) % BRANCH_PALETTE.length];
      const count = getVisibleLeafCount(branch, collapsedIds);
      const branchHeight = count * LEAF_HEIGHT;
      const centerY = startY + branchHeight / 2;

      nodes.push({
        id: branch.id,
        type: "mindmap",
        position: { x, y: centerY },
        data: {
          label: branch.label,
          description: branch.description,
          color,
          direction,
          depth: 1,
          isRoot: false,
          hasChildren: (branch.children?.length ?? 0) > 0,
          isCollapsed: collapsedIds.has(branch.id),
          childCount: branch.children?.length ?? 0,
          matchesSearch: isMatch(branch.label, branch.description),
          isSearching: q.length > 0,
          onToggleCollapse: () => onToggleCollapse(branch.id),
        },
      });

      edges.push({
        id: `e-${root.id}-${branch.id}`,
        source: root.id,
        target: branch.id,
        sourceHandle: direction === "right" ? "right" : "left",
        targetHandle: direction === "right" ? "left" : "right",
        type: "bezier",
        animated: true,
        style: {
          stroke: color,
          strokeWidth: 2.2,
          opacity: 0.85,
        },
      });

      layoutDescendants(branch, direction, 2, startY, branchHeight, color);
      startY += branchHeight + BRANCH_GAP;
    });
  };

  if (mode === "bilateral") {
    // Bilateral Mind Map: partition branches left and right to balance vertical height
    const rightBranches: MindMapNode[] = [];
    const leftBranches: MindMapNode[] = [];
    let rightLeaves = 0;
    let leftLeaves = 0;

    children.forEach((child) => {
      const count = getVisibleLeafCount(child, collapsedIds);
      if (rightLeaves <= leftLeaves) {
        rightBranches.push(child);
        rightLeaves += count;
      } else {
        leftBranches.push(child);
        leftLeaves += count;
      }
    });

    layoutSideBranches(rightBranches, "right", 0);
    layoutSideBranches(leftBranches, "left", rightBranches.length);
  } else {
    // Horizontal Tree: all branches flow to the right
    layoutSideBranches(children, "right", 0);
  }

  return { nodes, edges };
}

export function MindMapViewer({ data }: Props) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("bilateral");
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => {
    if (!data?.root) return;
    const allIds = getAllParentIds(data.root).filter((id) => id !== data.root.id);
    setCollapsedIds(new Set(allIds));
  }, [data]);

  const expandAll = useCallback(() => {
    setCollapsedIds(new Set());
  }, []);

  // Compute graph based on layout mode, collapsed set, and search query
  const { nodes: graphNodes, edges: graphEdges } = useMemo(() => {
    if (!data?.root) return { nodes: [], edges: [] };
    return buildBalancedMindMap(data.root, layoutMode, collapsedIds, searchQuery, toggleCollapse);
  }, [data, layoutMode, collapsedIds, searchQuery, toggleCollapse]);

  const [nodes, setNodes, onNodesChange] = useNodesState(graphNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphEdges);

  // Sync internal React Flow state when layout recomputes
  useEffect(() => {
    setNodes(graphNodes);
    setEdges(graphEdges);
  }, [graphNodes, graphEdges, setNodes, setEdges]);

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

  // Smooth fit view when graph changes or fullscreen toggles
  const handleFitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.25, duration: 400 });
    }
  }, [reactFlowInstance]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitView();
    }, 150);
    return () => clearTimeout(timer);
  }, [isFullScreen, layoutMode, collapsedIds.size, handleFitView]);

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
      {/* Mind map header & toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
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
          <p className="text-xs text-muted-foreground line-clamp-1">{data.summary}</p>
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {/* Concept Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts..."
              className="h-8 pl-8 pr-7 text-xs w-36 sm:w-48 bg-background/80"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <TooltipProvider>
            {/* Layout Mode Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setLayoutMode((m) => (m === "bilateral" ? "horizontal" : "bilateral"))
                  }
                  className="h-8 px-2.5 text-xs gap-1.5"
                >
                  {layoutMode === "bilateral" ? (
                    <>
                      <GitFork className="h-3.5 w-3.5 text-indigo-500" />
                      <span className="hidden md:inline">Bilateral</span>
                    </>
                  ) : (
                    <>
                      <Network className="h-3.5 w-3.5 text-indigo-500" />
                      <span className="hidden md:inline">Horizontal</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Switch between balanced Bilateral Mind Map and Left-to-Right Tree
              </TooltipContent>
            </Tooltip>

            {/* Expand / Collapse All */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={collapsedIds.size > 0 ? expandAll : collapseAll}
                  className="h-8 px-2 text-xs gap-1"
                >
                  {collapsedIds.size > 0 ? (
                    <>
                      <ChevronsUpDown className="h-3.5 w-3.5" />
                      <span className="hidden md:inline">Expand All</span>
                    </>
                  ) : (
                    <>
                      <ChevronsDownUp className="h-3.5 w-3.5" />
                      <span className="hidden md:inline">Collapse All</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {collapsedIds.size > 0 ? "Expand all sub-topics" : "Collapse all sub-topics"}
              </TooltipContent>
            </Tooltip>

            {/* Reset / Fit View */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFitView}
                  className="h-8 w-8 p-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Center and Fit View</TooltipContent>
            </Tooltip>

            {/* Full Screen Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isFullScreen ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsFullScreen((v) => !v)}
                  className="gap-1.5 text-xs h-8 shadow-sm font-medium"
                >
                  {isFullScreen ? (
                    <>
                      <Minimize2 className="h-3.5 w-3.5" />
                      <span>Exit Full Screen</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-3.5 w-3.5" />
                      <span>Full Screen</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isFullScreen ? "Exit full screen (Esc)" : "Expand to immersive full-screen canvas"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="opacity-35" />
          <Controls className="!bg-card/90 !border !border-border !rounded-lg !shadow-sm" />
          <MiniMap
            nodeColor={(n) => (n.data as any)?.color || "#6366f1"}
            maskColor="rgba(0,0,0,0.06)"
            className="!rounded-lg !border !border-border overflow-hidden !bg-card/90"
          />
        </ReactFlow>
      </div>

      {/* Footer controls hint */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <span className="hidden sm:inline">
          Drag to pan · Scroll to zoom · Click topic buttons to collapse/expand
        </span>
        <span className="text-[11px]">
          {isFullScreen
            ? "Press Esc or click Exit Full Screen to return"
            : "Click 'Full Screen' for maximum workspace"}
        </span>
      </div>
    </div>
  );
}
