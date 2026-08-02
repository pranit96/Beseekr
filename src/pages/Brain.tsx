import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { GlobalHeader } from "@/components/GlobalHeader";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  useBrainItems,
  useBrainMindMap,
  useBrainInsights,
  useSaveBrainContent,
  useDeleteBrainItem,
} from "@/hooks/use-api-queries";
import {
  Brain as BrainIcon,
  Globe,
  FileText,
  StickyNote,
  Trash2,
  Search,
  Loader2,
  Send,
  BookOpen,
  X,
  ExternalLink,
  Sparkles,
  Map as MapIcon,
  Lightbulb,
  Activity,
  RefreshCw,
  MessageSquare,
  Library,
  Clock,
  Hash,
  FolderOpen,
  Layers,
  PenLine,
  HelpCircle,
  Command,
  CornerDownLeft,
} from "lucide-react";
import { ReactFlow, Background, Controls, Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type DetectedIntent = "url" | "note" | "text" | "query";
type SidebarView = "all" | "url" | "note" | "text" | "map" | "insights";

interface SessionQuery {
  id: string;
  question: string;
  answer: string;
  sources: { id: string; title: string; url: string | null }[];
  timestamp: Date;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function isValidUrl(str: string): boolean {
  try {
    const trimmed = str.trim();
    if (
      !trimmed.startsWith("http://") &&
      !trimmed.startsWith("https://") &&
      !trimmed.startsWith("www.")
    )
      return false;
    new URL(trimmed.startsWith("www.") ? `https://${trimmed}` : trimmed);
    return true;
  } catch {
    return false;
  }
}

function detectIntent(input: string): DetectedIntent | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (isValidUrl(trimmed)) return "url";
  // Questions: ends with ? and has at least a few words
  if (trimmed.endsWith("?") && trimmed.split(/\s+/).length >= 3) return "query";
  // Long text (>500 chars) → "text", otherwise "note"
  if (trimmed.length > 500) return "text";
  return "note";
}

function relativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

let _queryIdCounter = 0;
function nextQueryId(): string {
  return `q-${Date.now()}-${++_queryIdCounter}`;
}

// ─── Type-specific accent config ──────────────────────────────────────────────

const TYPE_ACCENTS: Record<
  string,
  { gradient: string; icon: React.ReactNode; label: string; textClass: string; bgClass: string }
> = {
  url: {
    gradient: "from-blue-500 to-indigo-500",
    icon: <Globe className="h-3.5 w-3.5" />,
    label: "URL",
    textClass: "text-blue-500 dark:text-blue-400",
    bgClass: "bg-blue-500/10",
  },
  note: {
    gradient: "from-amber-500 to-orange-500",
    icon: <PenLine className="h-3.5 w-3.5" />,
    label: "Note",
    textClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10",
  },
  text: {
    gradient: "from-teal-500 to-cyan-500",
    icon: <FileText className="h-3.5 w-3.5" />,
    label: "Text",
    textClass: "text-teal-600 dark:text-teal-400",
    bgClass: "bg-teal-500/10",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Live intent indicator below the smart input with manual override controls */
const IntentIndicator = ({
  intent,
  isProcessing,
  onOverride,
}: {
  intent: DetectedIntent | null;
  isProcessing: boolean;
  onOverride?: (newIntent: DetectedIntent) => void;
}) => {
  if (isProcessing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-[11px] font-semibold text-primary"
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        Processing…
      </motion.div>
    );
  }
  if (!intent) return null;

  const options: { id: DetectedIntent; icon: React.ReactNode; label: string; activeColor: string }[] = [
    { id: "note", icon: <PenLine className="h-3 w-3" />, label: "Note", activeColor: "text-amber-600 bg-amber-500/10 border-amber-500/30" },
    { id: "url", icon: <Globe className="h-3 w-3" />, label: "URL", activeColor: "text-blue-500 bg-blue-500/10 border-blue-500/30" },
    { id: "text", icon: <FileText className="h-3 w-3" />, label: "Text", activeColor: "text-teal-600 bg-teal-500/10 border-teal-500/30" },
    { id: "query", icon: <Search className="h-3 w-3" />, label: "Query Brain", activeColor: "text-primary bg-primary/10 border-primary/30" },
  ];

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] text-muted-foreground/60 font-medium mr-1">Intent:</span>
      {options.map((opt) => {
        const isActive = intent === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onOverride?.(opt.id)}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all duration-200 ${
              isActive
                ? opt.activeColor
                : "text-muted-foreground/60 border-transparent hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

/** Thinking dots animation */
const ThinkingDots = () => (
  <div className="flex gap-1 px-1 py-0.5">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="h-2 w-2 rounded-full bg-primary/70"
        animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
      />
    ))}
  </div>
);

/** A single item card in the timeline */
const ItemCard = ({
  item,
  isNew,
  onDelete,
  isDeleting,
}: {
  item: any;
  isNew: boolean;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) => {
  const accent = TYPE_ACCENTS[item.source_type] || TYPE_ACCENTS.note;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={`group relative flex gap-0 rounded-2xl border bg-card/70 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-0.5 ${
        isNew
          ? "border-primary/40 shadow-md shadow-primary/10"
          : "border-border hover:border-border/80"
      }`}
    >
      {/* Accent strip */}
      <div
        className={`w-1 shrink-0 bg-gradient-to-b ${accent.gradient} transition-all duration-300 group-hover:w-1.5`}
      />

      {/* Content */}
      <div className="flex-1 flex items-center gap-4 px-4 py-3.5 min-w-0">
        {/* Type icon */}
        <div
          className={`h-9 w-9 rounded-xl ${accent.bgClass} flex items-center justify-center shrink-0 ${accent.textClass}`}
        >
          {accent.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-snug">
            {item.title}
          </p>
          {item.source_url && (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5 font-mono opacity-70">
              {extractDomain(item.source_url)}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
              <Hash className="h-2.5 w-2.5" /> {item.chunk_count} chunks
            </span>
            <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {relativeTime(item.created_at)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
          {item.source_url && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            onClick={() => onDelete(item.id)}
            disabled={isDeleting}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Just-saved glow overlay */}
      {isNew && (
        <motion.div
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute inset-0 pointer-events-none rounded-2xl ring-2 ring-primary/30"
        />
      )}
    </motion.div>
  );
};

/** Query response card in the timeline */
const QueryResponseCard = ({
  query,
  onDismiss,
}: {
  query: SessionQuery;
  onDismiss: (id: string) => void;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 16, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ type: "spring", damping: 25, stiffness: 300 }}
    className="relative rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/[0.03] to-accent/[0.03] backdrop-blur-sm overflow-hidden"
  >
    {/* Gradient top accent */}
    <div className="h-0.5 bg-gradient-to-r from-primary via-accent to-primary" />

    <div className="p-5">
      {/* Question */}
      <div className="flex items-start gap-3 mb-4">
        <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
          <Search className="h-3.5 w-3.5 text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground leading-relaxed">
          {query.question}
        </p>
        <button
          onClick={() => onDismiss(query.id)}
          className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors shrink-0 ml-auto"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Answer */}
      <div className="flex items-start gap-3">
        <div className="h-7 w-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {query.answer}
          </p>
          {/* Sources */}
          {query.sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {query.sources.map((src) => (
                <a
                  key={src.id}
                  href={src.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  <BookOpen className="h-2.5 w-2.5" />
                  {src.title}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <p className="text-[10px] text-muted-foreground/40 mt-3 text-right">
        {relativeTime(query.timestamp)}
      </p>
    </div>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Brain() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timelineEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const isAuthed = !loading && !!user;

  // ── React Query hooks ─────────────────────────────────────────────────────
  const {
    data: items = [],
    isLoading: isLoadingItems,
  } = useBrainItems(isAuthed);

  const {
    data: mindMapData,
    isLoading: isLoadingMap,
    isFetching: isFetchingMap,
    refetch: refetchMap,
  } = useBrainMindMap(false);

  const {
    data: insightsData,
    isLoading: isLoadingInsights,
    isFetching: isFetchingInsights,
    refetch: refetchInsights,
  } = useBrainInsights(false);

  const saveContent = useSaveBrainContent();
  const deleteItem = useDeleteBrainItem();

  const [manualIntent, setManualIntent] = useState<DetectedIntent | null>(null);
  const [sidebarView, setSidebarView] = useState<SidebarView>("all");
  const [inputValue, setInputValue] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [showTitle, setShowTitle] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  // Session queries (query responses from this session)
  const [sessionQueries, setSessionQueries] = useState<SessionQuery[]>([]);

  const [mapEnabled, setMapEnabled] = useState(false);
  const [insightsEnabled, setInsightsEnabled] = useState(false);

  // ── Derived state ─────────────────────────────────────────────────────────
  const autoIntent = useMemo(() => detectIntent(inputValue), [inputValue]);
  const intent = manualIntent ?? autoIntent;
  const isLibraryView = ["all", "url", "note", "text"].includes(sidebarView);

  // Reset manual override when input is emptied
  useEffect(() => {
    if (!inputValue.trim()) {
      setManualIntent(null);
    }
  }, [inputValue]);

  const typeCounts = useMemo(
    () => ({
      all: items.length,
      url: items.filter((i: any) => i.source_type === "url").length,
      note: items.filter((i: any) => i.source_type === "note").length,
      text: items.filter((i: any) => i.source_type === "text").length,
    }),
    [items],
  );

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (sidebarView === "url")
      filtered = filtered.filter((i: any) => i.source_type === "url");
    else if (sidebarView === "note")
      filtered = filtered.filter((i: any) => i.source_type === "note");
    else if (sidebarView === "text")
      filtered = filtered.filter((i: any) => i.source_type === "text");

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i: any) =>
          i.title.toLowerCase().includes(q) ||
          (i.source_url || "").toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [items, sidebarView, searchQuery]);

  // ── Unified timeline: merge items + session queries ────────────────────────
  const timeline = useMemo(() => {
    const entries: Array<
      | { kind: "item"; data: any; ts: number }
      | { kind: "query"; data: SessionQuery; ts: number }
    > = [];

    filteredItems.forEach((item: any) =>
      entries.push({
        kind: "item",
        data: item,
        ts: new Date(item.created_at).getTime(),
      }),
    );
    sessionQueries.forEach((q) =>
      entries.push({ kind: "query", data: q, ts: q.timestamp.getTime() }),
    );

    return entries.sort((a, b) => b.ts - a.ts);
  }, [filteredItems, sessionQueries]);

  // ── ReactFlow nodes/edges ─────────────────────────────────────────────────
  const { nodes, edges } = useMemo(() => {
    if (!mindMapData?.nodes?.length) return { nodes: [], edges: [] };
    const rawNodes = mindMapData.nodes;
    const categories = rawNodes.filter((n: any) => n.type === "category");
    const positionedNodes: Node[] = rawNodes.map((n: any, i: number) => {
      const isCategory = n.type === "category";
      const angle = (i * 2 * Math.PI) / (categories.length || 1);
      return {
        id: n.id,
        position: {
          x: isCategory ? 350 * Math.cos(angle) : (Math.random() - 0.5) * 900,
          y: isCategory ? 350 * Math.sin(angle) : (Math.random() - 0.5) * 900,
        },
        data: { label: n.label },
        style: isCategory
          ? {
              background: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
              borderRadius: "12px",
              padding: "10px 16px",
              fontWeight: "700",
              fontSize: "13px",
              border: "1px solid hsl(var(--primary) / 0.4)",
            }
          : {
              background: "hsl(var(--card))",
              color: "hsl(var(--muted-foreground))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "11px",
            },
      };
    });
    const formattedEdges: Edge[] = (mindMapData.edges || []).map(
      (e: any, i: number) => ({
        id: `e${i}`,
        source: e.source,
        target: e.target,
        animated: true,
        style: { stroke: "hsl(var(--primary))" },
      }),
    );
    return { nodes: positionedNodes, edges: formattedEdges };
  }, [mindMapData]);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (isLibraryView) setTimeout(() => inputRef.current?.focus(), 80);
  }, [sidebarView, isLibraryView]);

  useEffect(() => {
    if (sidebarView === "map" && !mapEnabled) setMapEnabled(true);
    if (sidebarView === "insights" && !insightsEnabled)
      setInsightsEnabled(true);
  }, [sidebarView, mapEnabled, insightsEnabled]);

  // Clear "just saved" highlight after 3s
  useEffect(() => {
    if (!lastSavedId) return;
    const timer = setTimeout(() => setLastSavedId(null), 3000);
    return () => clearTimeout(timer);
  }, [lastSavedId]);

  // ── Unified submit handler ────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || saveContent.isPending || isQuerying) return;

    const currentIntent = manualIntent ?? detectIntent(content);
    if (!currentIntent) return;

    if (currentIntent === "query") {
      // ── Query mode ──
      setIsQuerying(true);
      setInputValue("");
      setManualIntent(null);
      try {
        const res = await apiClient.brainQuery(content);
        if (res.success && res.data) {
          setSessionQueries((prev) => [
            ...prev,
            {
              id: nextQueryId(),
              question: content,
              answer: res.data!.answer,
              sources: res.data!.sources,
              timestamp: new Date(),
            },
          ]);
        } else {
          toast({
            title: "Query failed",
            description: res.error || "Unknown error",
            variant: "destructive",
          });
        }
      } catch (err: any) {
        toast({
          title: "Something went wrong",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setIsQuerying(false);
      }
    } else {
      // ── Save mode (url, note, text) ──
      const payload =
        currentIntent === "url"
          ? {
              type: "url" as const,
              url: content.startsWith("www.") ? `https://${content}` : content,
              title: titleInput.trim() || undefined,
            }
          : {
              type: currentIntent as "note" | "text",
              text: content,
              title: titleInput.trim() || undefined,
            };

      saveContent.mutate(payload, {
        onSuccess: (data: any) => {
          setInputValue("");
          setTitleInput("");
          setShowTitle(false);
          setManualIntent(null);
          if (data?.data?.id) setLastSavedId(data.data.id);
        },
      });
    }
  }, [inputValue, titleInput, manualIntent, saveContent, isQuerying, toast]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  // ── Sidebar config ────────────────────────────────────────────────────────

  const FOLDERS = [
    { id: "all" as const, icon: <Layers className="h-3.5 w-3.5" />, label: "All Items", count: typeCounts.all },
    { id: "url" as const, icon: <Globe className="h-3.5 w-3.5" />, label: "URLs", count: typeCounts.url },
    { id: "note" as const, icon: <PenLine className="h-3.5 w-3.5" />, label: "Notes", count: typeCounts.note },
    { id: "text" as const, icon: <FileText className="h-3.5 w-3.5" />, label: "Text", count: typeCounts.text },
  ];

  const VIEWS = [
    { id: "map" as const, icon: <MapIcon className="h-3.5 w-3.5" />, label: "Mind Map" },
    { id: "insights" as const, icon: <Lightbulb className="h-3.5 w-3.5" />, label: "Insights" },
  ];

  if (loading) return null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-primary/[0.04] blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-accent/[0.04] blur-[140px]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <GlobalHeader />

      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* ═══════════ SIDEBAR ═══════════ */}
        <aside className="w-60 shrink-0 flex flex-col border-r border-border bg-card/80 backdrop-blur-sm">
          {/* Brain identity */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-xl bg-primary/20 blur-md"
              />
              <div className="relative h-10 w-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center">
                <BrainIcon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground tracking-tight">
                Second Brain
              </p>
              <p className="text-[11px] text-muted-foreground">
                {isLoadingItems ? "Loading…" : `${items.length} items indexed`}
              </p>
            </div>
          </div>

          {/* Folder structure */}
          <div className="px-3 pt-3">
            <p className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <FolderOpen className="h-3 w-3" />
              Library
            </p>
            <nav className="flex flex-col gap-0.5">
              {FOLDERS.map((f) => {
                const active = sidebarView === f.id && isLibraryView;
                return (
                  <button
                    key={f.id}
                    onClick={() => setSidebarView(f.id)}
                    className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 text-left ${
                      active
                        ? "bg-primary/10 text-primary border border-primary/15"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    <span className={active ? "text-primary" : "text-muted-foreground group-hover:text-foreground transition-colors"}>
                      {f.icon}
                    </span>
                    {f.label}
                    <span className={`ml-auto text-[10px] font-bold tabular-nums ${active ? "text-primary" : "text-muted-foreground/40"}`}>
                      {f.count}
                    </span>
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-border mx-3 my-2" />

          {/* Views */}
          <div className="px-3">
            <p className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Views
            </p>
            <nav className="flex flex-col gap-0.5">
              {VIEWS.map((v) => {
                const active = sidebarView === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSidebarView(v.id)}
                    className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 text-left ${
                      active
                        ? "bg-primary/10 text-primary border border-primary/15"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    <span className={active ? "text-primary" : "text-muted-foreground group-hover:text-foreground transition-colors"}>
                      {v.icon}
                    </span>
                    {v.label}
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Stats */}
          <div className="mt-auto px-3 pb-3 pt-2 border-t border-border">
            {items.length > 0 ? (
              <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="font-medium">Knowledge base</span>
                  <span className="text-primary font-bold tabular-nums">
                    {items.length} items
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min((items.length / 50) * 100, 100)}%`,
                    }}
                    transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                  />
                </div>
                {/* Mini breakdown */}
                <div className="flex gap-3 text-[10px] text-muted-foreground/60">
                  {typeCounts.url > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      {typeCounts.url} URLs
                    </span>
                  )}
                  {typeCounts.note > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      {typeCounts.note} Notes
                    </span>
                  )}
                  {typeCounts.text > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                      {typeCounts.text} Text
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground/40 text-center py-2">
                Your brain is empty. Start feeding it!
              </p>
            )}
          </div>
        </aside>

        {/* ═══════════ MAIN CONTENT ═══════════ */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* ── LIBRARY / FEED VIEW ─────────── */}
            {isLibraryView && (
              <motion.div
                key="feed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Search bar */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/40 backdrop-blur-sm">
                  <h2 className="text-sm font-bold text-foreground">
                    {sidebarView === "all"
                      ? "All Items"
                      : sidebarView === "url"
                        ? "Saved URLs"
                        : sidebarView === "note"
                          ? "Notes"
                          : "Saved Text"}
                  </h2>
                  <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-xl px-3 py-1.5">
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search…"
                      className="bg-transparent text-xs text-foreground focus:outline-none placeholder:text-muted-foreground/50 w-32"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {timeline.length === 0 && !isLoadingItems && !isQuerying ? (
                    /* ── Empty state ── */
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="flex flex-col items-center justify-center h-full text-center pb-16"
                    >
                      <div className="relative mb-8">
                        <motion.div
                          animate={{
                            scale: [1, 1.08, 1],
                            opacity: [0.3, 0.7, 0.3],
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="absolute inset-0 rounded-full bg-primary/15 blur-2xl"
                        />
                        <motion.div
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                          className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 flex items-center justify-center shadow-2xl shadow-primary/10"
                        >
                          <BrainIcon className="h-12 w-12 text-primary" />
                        </motion.div>
                      </div>
                      <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
                        Your second brain awaits
                      </h2>
                      <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-10">
                        Drop a thought, paste a URL, or ask a question. <br />
                        The input below is smart — it figures out what you mean.
                      </p>

                      {/* Quick action cards */}
                      <div className="flex flex-wrap justify-center gap-3 max-w-lg">
                        {[
                          {
                            emoji: "📝",
                            label: "Capture a thought",
                            example: "I should look into vector databases for the app...",
                          },
                          {
                            emoji: "🌐",
                            label: "Save a URL",
                            example: "https://example.com/article",
                          },
                          {
                            emoji: "❓",
                            label: "Ask your brain",
                            example: "What startup ideas have I saved?",
                          },
                        ].map((action) => (
                          <motion.button
                            key={action.label}
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              setInputValue(action.example);
                              inputRef.current?.focus();
                            }}
                            className="flex flex-col items-start gap-1.5 rounded-2xl border border-border bg-card/60 backdrop-blur-sm px-5 py-4 text-left hover:border-primary/30 hover:bg-primary/[0.03] transition-all duration-200 w-[190px]"
                          >
                            <span className="text-2xl">{action.emoji}</span>
                            <span className="text-xs font-bold text-foreground">
                              {action.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60 leading-tight line-clamp-2">
                              {action.example}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ) : isLoadingItems ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-w-3xl mx-auto">
                      {/* Querying indicator at top */}
                      {isQuerying && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-4 flex items-center gap-3"
                        >
                          <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">
                              Searching your brain…
                            </p>
                            <ThinkingDots />
                          </div>
                        </motion.div>
                      )}

                      <AnimatePresence>
                        {timeline.map((entry) =>
                          entry.kind === "query" ? (
                            <QueryResponseCard
                              key={entry.data.id}
                              query={entry.data}
                              onDismiss={(id) =>
                                setSessionQueries((prev) =>
                                  prev.filter((q) => q.id !== id),
                                )
                              }
                            />
                          ) : (
                            <ItemCard
                              key={entry.data.id}
                              item={entry.data}
                              isNew={entry.data.id === lastSavedId}
                              onDelete={(id) => deleteItem.mutate(id)}
                              isDeleting={
                                deleteItem.isPending &&
                                deleteItem.variables === entry.data.id
                              }
                            />
                          ),
                        )}
                      </AnimatePresence>
                      <div ref={timelineEndRef} />
                    </div>
                  )}
                </div>

                {/* ── Smart Input ── */}
                <div className="border-t border-border bg-card/60 backdrop-blur-sm px-6 py-4">
                  <div className="max-w-3xl mx-auto">
                    {/* Optional title */}
                    <AnimatePresence>
                      {showTitle && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                          animate={{ height: "auto", opacity: 1, marginBottom: 8 }}
                          exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <input
                            value={titleInput}
                            onChange={(e) => setTitleInput(e.target.value)}
                            placeholder="Title (optional)…"
                            className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Main input container */}
                    <div
                      className={`relative flex items-end gap-3 rounded-2xl border bg-card/80 backdrop-blur-sm px-4 py-3 transition-all duration-300 ${
                        intent === "query"
                          ? "border-primary/40 shadow-sm shadow-primary/5"
                          : intent === "url"
                            ? "border-blue-500/30 shadow-sm shadow-blue-500/5"
                            : "border-border focus-within:border-primary/30"
                      }`}
                    >
                      <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Think, paste, or ask…"
                        rows={intent === "url" ? 1 : 2}
                        className={`flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/40 resize-none leading-relaxed ${
                          intent === "url" ? "font-mono" : ""
                        }`}
                        disabled={saveContent.isPending || isQuerying}
                      />
                      <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
                        {(saveContent.isPending || isQuerying) ? (
                          <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          </div>
                        ) : inputValue.trim() ? (
                          <motion.button
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                            transition={{ type: "spring", damping: 15, stiffness: 300 }}
                            onClick={handleSubmit}
                            className={`h-9 w-9 rounded-xl flex items-center justify-center text-white transition-colors shadow-sm ${
                              intent === "query"
                                ? "bg-primary hover:bg-primary/90"
                                : intent === "url"
                                  ? "bg-blue-500 hover:bg-blue-600"
                                  : "bg-primary hover:bg-primary/90"
                            }`}
                          >
                            {intent === "query" ? (
                              <Search className="h-4 w-4" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </motion.button>
                        ) : null}
                      </div>
                    </div>

                    {/* Bottom info row */}
                    <div className="flex items-center justify-between mt-2 px-1">
                      <IntentIndicator
                        intent={intent}
                        isProcessing={saveContent.isPending || isQuerying}
                        onOverride={(newIntent) => setManualIntent(newIntent)}
                      />
                      <div className="flex items-center gap-3">
                        {intent && intent !== "query" && (
                          <button
                            onClick={() => setShowTitle(!showTitle)}
                            className={`text-[10px] font-bold transition-colors ${
                              showTitle
                                ? "text-primary"
                                : "text-muted-foreground/40 hover:text-muted-foreground"
                            }`}
                          >
                            + Title
                          </button>
                        )}
                        <span className="text-[10px] text-muted-foreground/30 flex items-center gap-1">
                          <Command className="h-2.5 w-2.5" />
                          <CornerDownLeft className="h-2.5 w-2.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── MAP VIEW ─────────────────────── */}
            {sidebarView === "map" && (
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex-1 relative overflow-hidden"
              >
                <div className="absolute top-4 left-4 z-10">
                  <div className="px-3 py-1.5 rounded-xl bg-card/80 border border-border backdrop-blur-sm">
                    <p className="text-xs font-bold text-foreground">
                      Knowledge Map
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {nodes.length} nodes · {edges.length} connections
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetchMap()}
                  disabled={isFetchingMap}
                  className="absolute top-4 right-4 z-10 h-8 gap-1.5 bg-card/80 border-border backdrop-blur-sm rounded-xl text-xs font-semibold hover:bg-muted"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isFetchingMap ? "animate-spin" : ""}`} />
                  Regenerate
                </Button>

                {(isLoadingMap || isFetchingMap) && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="h-16 w-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mb-4"
                    >
                      <BrainIcon className="h-8 w-8 text-primary" />
                    </motion.div>
                    <p className="text-sm font-bold text-foreground mb-1">
                      Mapping your knowledge…
                    </p>
                    <p className="text-xs text-muted-foreground">
                      AI is clustering your saved items
                    </p>
                  </div>
                )}

                {nodes.length > 0 ? (
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    fitView
                    className="w-full h-full"
                    proOptions={{ hideAttribution: true }}
                  >
                    <Background color="hsl(var(--muted-foreground) / 0.15)" gap={24} size={1} />
                    <Controls className="!bg-card/80 !border-border !rounded-xl !shadow-xl" />
                  </ReactFlow>
                ) : (
                  !isLoadingMap &&
                  !isFetchingMap && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MapIcon className="h-12 w-12 text-muted-foreground/20 mb-4" />
                      <p className="text-sm font-semibold text-foreground mb-1">
                        No map generated
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Click Regenerate to build a visual map of your brain
                      </p>
                    </div>
                  )
                )}
              </motion.div>
            )}

            {/* ── INSIGHTS VIEW ────────────────── */}
            {sidebarView === "insights" && (
              <motion.div
                key="insights"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex-1 overflow-y-auto px-6 py-6"
              >
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        Knowledge Insights
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        AI-powered analysis of your Second Brain
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => refetchInsights()}
                      disabled={isFetchingInsights}
                      className="h-8 gap-1.5 border-border rounded-xl text-xs font-semibold hover:bg-muted bg-transparent"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isFetchingInsights ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>

                  {isLoadingInsights || isFetchingInsights ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <motion.div
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                        className="h-14 w-14 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mb-4"
                      >
                        <Sparkles className="h-7 w-7 text-primary" />
                      </motion.div>
                      <p className="text-sm font-bold text-foreground mb-1">
                        Analyzing your brain…
                      </p>
                      <p className="text-xs text-muted-foreground">
                        This takes a few seconds
                      </p>
                    </div>
                  ) : insightsData ? (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: "Total Items", value: insightsData.stats?.total || 0, icon: <Library className="h-4 w-4" /> },
                          { label: "Web URLs", value: insightsData.stats?.urls || 0, icon: <Globe className="h-4 w-4" /> },
                          { label: "Notes", value: insightsData.stats?.notes || 0, icon: <StickyNote className="h-4 w-4" /> },
                          { label: "Data Chunks", value: insightsData.stats?.chunks || 0, icon: <Activity className="h-4 w-4" /> },
                        ].map((stat, i) => (
                          <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="rounded-2xl border border-border bg-card/60 p-4 flex flex-col gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-primary">{stat.icon}</span>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {stat.label}
                              </span>
                            </div>
                            <span className="text-3xl font-black text-foreground tabular-nums">
                              {stat.value}
                            </span>
                          </motion.div>
                        ))}
                      </div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative rounded-2xl border border-primary/20 bg-primary/[0.04] p-6 overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 opacity-[0.04] pointer-events-none">
                          <BrainIcon className="h-40 w-40 text-primary" />
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-6 w-6 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="text-xs font-bold text-primary uppercase tracking-wider">
                            AI Assessment
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground/90 relative z-10">
                          {insightsData.summary}
                        </p>
                      </motion.div>

                      {insightsData.themes?.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                            Prominent Themes
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {insightsData.themes.map(
                              (theme: string, i: number) => (
                                <motion.span
                                  key={i}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.5 + i * 0.06 }}
                                  className="px-4 py-2 rounded-full border border-border bg-muted/30 text-sm font-semibold text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all cursor-default"
                                >
                                  {theme}
                                </motion.span>
                              ),
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3.5, repeat: Infinity }}
                        className="h-14 w-14 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-4"
                      >
                        <Lightbulb className="h-7 w-7 text-muted-foreground/30" />
                      </motion.div>
                      <p className="text-sm font-semibold text-foreground mb-1">
                        No insights yet
                      </p>
                      <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                        Click Refresh to let AI analyze your knowledge base
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
