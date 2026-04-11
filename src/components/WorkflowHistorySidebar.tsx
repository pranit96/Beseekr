// src/components/WorkflowHistorySidebar.tsx
// Collapsible sidebar listing past autonomous‑workflow runs with React‑Query caching,
// client‑side search, paginated "Load More", and optimistic delete.

import { useState, useMemo, useCallback } from "react";
import {
  useQuery,
  useQueryClient,
  useMutation,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  History,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  Cpu,
  AlertCircle,
  Loader2,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkflowExecution {
  id: string;
  prompt: string;
  status: "running" | "completed" | "failed";
  agent_results?: any[];
  planned_agents?: any[];
  final_answer?: string;
  total_tokens?: number;
  execution_time_ms?: number;
  model_used?: string;
  execution_plan?: string;
  created_at: string;
  completed_at?: string;
}

interface WorkflowHistorySidebarProps {
  selectedId: string | null;
  onSelect: (execution: WorkflowExecution) => void;
  onNewWorkflow: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatDuration(ms?: number): string {
  if (!ms) return "";
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

const STATUS_STYLES: Record<string, string> = {
  completed: "text-emerald-500 bg-emerald-500/10",
  failed: "text-destructive bg-destructive/10",
  running: "text-primary bg-primary/10",
};

const PAGE_SIZE = 15;

// ─── History Item Row ─────────────────────────────────────────────────────────

const HistoryRow = ({
  item,
  isActive,
  onSelect,
  onDelete,
}: {
  item: WorkflowExecution;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) => {
  const agentCount =
    item.agent_results?.length ?? item.planned_agents?.length ?? 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8, height: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-selected={isActive}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        className={cn(
          "group relative flex flex-col gap-1.5 px-3 py-2.5 rounded-xl cursor-pointer",
          "border transition-all duration-150 select-none",
          isActive
            ? "bg-primary/8 border-primary/20 shadow-sm"
            : "border-transparent hover:bg-muted/50 hover:border-border/40",
        )}
      >
        {/* Active accent */}
        {isActive && (
          <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-primary rounded-full" />
        )}

        {/* Prompt preview */}
        <p className="text-[12.5px] font-medium text-foreground/85 leading-snug line-clamp-2 pr-6">
          {item.prompt}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "text-[10px] font-semibold px-1.5 py-0.5 rounded-md",
              STATUS_STYLES[item.status] ?? "text-muted-foreground bg-muted",
            )}
          >
            {item.status}
          </span>

          {agentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60">
              <Cpu className="w-2.5 h-2.5" />
              {agentCount} agent{agentCount !== 1 ? "s" : ""}
            </span>
          )}

          {item.execution_time_ms && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60">
              <Clock className="w-2.5 h-2.5" />
              {formatDuration(item.execution_time_ms)}
            </span>
          )}

          <span className="ml-auto text-[10px] text-muted-foreground/40">
            {relativeTime(item.created_at)}
          </span>
        </div>

        {/* Delete button — appears on hover */}
        <button
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground/50"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete workflow"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
};

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export function WorkflowHistorySidebar({
  selectedId,
  onSelect,
  onNewWorkflow,
  collapsed,
  onToggleCollapse,
}: WorkflowHistorySidebarProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Fetch history ──────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ["workflow-history", page],
    queryFn: async () => {
      const res = await apiClient.getWorkflowHistory({
        page,
        limit: PAGE_SIZE,
      });
      return res;
    },
    staleTime: 60_000,        // 60 s — sidebar doesn't need to be real-time
    gcTime: 5 * 60_000,      // 5 min garbage collection
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,  // keep old data while next page loads
  });

  const allItems: WorkflowExecution[] = data?.data ?? [];
  const totalPages: number = data?.pagination?.totalPages ?? 1;

  // ── Client-side search filter ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.trim().toLowerCase();
    return allItems.filter((item) =>
      item.prompt.toLowerCase().includes(q),
    );
  }, [allItems, query]);

  // ── Delete mutation ────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteWorkflowExecution(id),
    onMutate: async (id: string) => {
      // Optimistic update — remove from cache immediately
      await queryClient.cancelQueries({ queryKey: ["workflow-history"] });
      const previous = queryClient.getQueryData(["workflow-history", page]);
      queryClient.setQueryData(["workflow-history", page], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.filter((item: WorkflowExecution) => item.id !== id),
        };
      });
      return { previous };
    },
    onError: (_err, _id, context: any) => {
      queryClient.setQueryData(["workflow-history", page], context?.previous);
      toast({
        title: "Failed to delete",
        description: "Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-history"] });
      toast({ title: "Deleted", duration: 2000 });
    },
  });

  // ── Collapse state ─────────────────────────────────────────────────────────

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-4 px-2 h-full gap-3 border-r border-border/30">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div
          className="writing-vertical text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/30 mt-2"
          style={{ writingMode: "vertical-rl" }}
        >
          History
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-r border-border/30 bg-background/50 backdrop-blur-sm">
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40 select-none">
              Workflow History
            </span>
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground/40 hover:text-foreground"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* New workflow button */}
        <button
          id="workflow-history-new-btn"
          onClick={onNewWorkflow}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl
            bg-primary/10 hover:bg-primary/15 text-primary text-[12px] font-semibold
            border border-primary/20 hover:border-primary/35 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          New Workflow
        </button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/30" />
          <input
            id="workflow-history-search"
            aria-label="Search workflow history"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search history..."
            className="w-full pl-7 pr-3 py-1.5 text-[12px] bg-muted/40 border border-border/30 rounded-lg
              placeholder:text-muted-foreground/30 text-foreground focus:outline-none focus:ring-1
              focus:ring-primary/30 transition-all"
          />
        </div>
      </div>

      {/* ── List ── */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-4 space-y-1">
          {isLoading ? (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-3 py-2.5 space-y-2">
                  <Skeleton className="h-3.5 w-full rounded-md" />
                  <Skeleton className="h-3 w-2/3 rounded-md" />
                </div>
              ))}
            </>
          ) : isError ? (
            <div className="px-3 py-8 text-center">
              <AlertCircle className="w-8 h-8 text-destructive/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground/50">
                Failed to load history
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <Sparkles className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-xs text-muted-foreground/40 mb-1">
                {query ? "No matches found" : "No workflows yet"}
              </p>
              {!query && (
                <p className="text-[10px] text-muted-foreground/30">
                  Run your first workflow above
                </p>
              )}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((item) => (
                <HistoryRow
                  key={item.id}
                  item={item}
                  isActive={selectedId === item.id}
                  onSelect={() => onSelect(item)}
                  onDelete={() => deleteMutation.mutate(item.id)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>

      {/* ── Pagination ── */}
      {!isLoading && !isError && totalPages > 1 && (
        <div className="px-4 py-3 border-t border-border/20 flex items-center justify-between">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="text-[11px] text-muted-foreground/50 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <ChevronLeft className="w-3 h-3" /> Prev
          </button>
          <span className="text-[10px] text-muted-foreground/40 tabular-nums">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="text-[11px] text-muted-foreground/50 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            Next <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
