import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Plus,
  X,
  ExternalLink,
  Sparkles,
  Map as MapIcon,
  Lightbulb,
  Activity,
  RefreshCw,
  Link2,
  MessageSquare,
  Library,
  Zap,
  Clock,
  Hash,
  FolderOpen,
  Layers,
  PenLine,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { ReactFlow, Background, Controls, Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type BrainMode = "feed" | "query";
type SaveTab = "url" | "text" | "note";
type SidebarView = "all" | "url" | "note" | "text" | "map" | "insights";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: { id: string; title: string; url: string | null }[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const TypeBadge = ({ type }: { type: string }) => {
  const cfg: Record<
    string,
    { icon: React.ReactNode; color: string; bg: string; darkBg: string }
  > = {
    url: {
      icon: <Globe className="h-3 w-3" />,
      color: "hsl(var(--primary))",
      bg: "hsl(var(--primary) / 0.1)",
      darkBg: "hsl(var(--primary) / 0.15)",
    },
    text: {
      icon: <FileText className="h-3 w-3" />,
      color: "hsl(270, 70%, 60%)",
      bg: "hsl(270, 70%, 60%, 0.1)",
      darkBg: "hsl(270, 70%, 60%, 0.15)",
    },
    note: {
      icon: <StickyNote className="h-3 w-3" />,
      color: "hsl(280, 60%, 65%)",
      bg: "hsl(280, 60%, 65%, 0.1)",
      darkBg: "hsl(280, 60%, 65%, 0.15)",
    },
  };
  const c = cfg[type] || cfg["note"];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{
        color: c.color,
        backgroundColor: c.bg,
        border: `1px solid ${c.color}30`,
      }}
    >
      {c.icon} {type}
    </span>
  );
};

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

/** Detects if a string is a valid URL */
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Brain() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const feedEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const queryInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isAuthed = !loading && !!user;

  // ── React Query hooks ─────────────────────────────────────────────────────
  const {
    data: items = [],
    isLoading: isLoadingItems,
    refetch: refetchItems,
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

  // ── Local UI state ────────────────────────────────────────────────────────
  const [brainMode, setBrainMode] = useState<BrainMode>("feed");
  const [sidebarView, setSidebarView] = useState<SidebarView>("all");
  const [saveTab, setSaveTab] = useState<SaveTab>("note");
  const [feedInput, setFeedInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [showTitleField, setShowTitleField] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const [mapEnabled, setMapEnabled] = useState(false);
  const [insightsEnabled, setInsightsEnabled] = useState(false);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (brainMode === "feed")
      setTimeout(() => inputRef.current?.focus(), 80);
    if (brainMode === "query")
      setTimeout(() => queryInputRef.current?.focus(), 80);
  }, [brainMode]);

  useEffect(() => {
    if (sidebarView === "map" && !mapEnabled) setMapEnabled(true);
    if (sidebarView === "insights" && !insightsEnabled)
      setInsightsEnabled(true);
  }, [sidebarView, mapEnabled, insightsEnabled]);

  // Auto-detect URL pasting in feed mode
  useEffect(() => {
    if (feedInput && isValidUrl(feedInput.trim())) {
      setSaveTab("url");
    }
  }, [feedInput]);

  // ── Derived ReactFlow state ───────────────────────────────────────────────
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

  // ── Filtered items ────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    let filtered = items;
    // Filter by sidebar folder
    if (sidebarView === "url")
      filtered = filtered.filter((i: any) => i.source_type === "url");
    else if (sidebarView === "note")
      filtered = filtered.filter((i: any) => i.source_type === "note");
    else if (sidebarView === "text")
      filtered = filtered.filter((i: any) => i.source_type === "text");

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(
        (i: any) =>
          i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (i.source_url || "").toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    return filtered;
  }, [items, sidebarView, searchQuery]);

  // ── Counts per type ───────────────────────────────────────────────────────
  const typeCounts = useMemo(() => {
    return {
      all: items.length,
      url: items.filter((i: any) => i.source_type === "url").length,
      note: items.filter((i: any) => i.source_type === "note").length,
      text: items.filter((i: any) => i.source_type === "text").length,
    };
  }, [items]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFeedSave = () => {
    const content = feedInput.trim();
    if (!content) return;

    if (saveTab === "url") {
      const url = content.startsWith("www.") ? `https://${content}` : content;
      saveContent.mutate(
        { type: "url", url, title: titleInput.trim() || undefined },
        {
          onSuccess: () => {
            setFeedInput("");
            setTitleInput("");
            setShowTitleField(false);
            setSaveTab("note");
          },
        },
      );
    } else {
      saveContent.mutate(
        {
          type: saveTab,
          text: content,
          title: titleInput.trim() || undefined,
        },
        {
          onSuccess: () => {
            setFeedInput("");
            setTitleInput("");
            setShowTitleField(false);
          },
        },
      );
    }
  };

  const handleFeedKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleFeedSave();
    }
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isQuerying) return;
    const q = question.trim();
    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setIsQuerying(true);
    try {
      const res = await apiClient.brainQuery(q);
      if (res.success && res.data) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: res.data!.answer,
            sources: res.data!.sources,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${res.error || "Unknown error"}`,
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, something went wrong: ${err.message}`,
        },
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  // ── Sidebar Folder Config ─────────────────────────────────────────────────
  const FOLDER_CONFIG = [
    {
      id: "all" as SidebarView,
      icon: <Layers className="h-3.5 w-3.5" />,
      label: "All Items",
      count: typeCounts.all,
    },
    {
      id: "url" as SidebarView,
      icon: <Globe className="h-3.5 w-3.5" />,
      label: "URLs",
      count: typeCounts.url,
    },
    {
      id: "note" as SidebarView,
      icon: <StickyNote className="h-3.5 w-3.5" />,
      label: "Notes",
      count: typeCounts.note,
    },
    {
      id: "text" as SidebarView,
      icon: <FileText className="h-3.5 w-3.5" />,
      label: "Text",
      count: typeCounts.text,
    },
  ];

  const VIEW_CONFIG = [
    {
      id: "map" as SidebarView,
      icon: <MapIcon className="h-3.5 w-3.5" />,
      label: "Mind Map",
    },
    {
      id: "insights" as SidebarView,
      icon: <Lightbulb className="h-3.5 w-3.5" />,
      label: "Insights",
    },
  ];

  const isLibraryView = ["all", "url", "note", "text"].includes(sidebarView);

  if (loading) return null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Ambient background — theme-aware */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-primary/[0.04] blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-accent/[0.04] blur-[140px]" />
      </div>

      <GlobalHeader />

      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* ── Left Sidebar ──────────────────────────────── */}
        <aside className="w-60 shrink-0 flex flex-col border-r border-border bg-card/80 backdrop-blur-sm p-3 gap-1">
          {/* Brain Identity */}
          <div className="flex items-center gap-2.5 px-2 pt-1 pb-4 mb-1 border-b border-border">
            <div className="h-8 w-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shadow-lg shadow-primary/10">
              <BrainIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground tracking-tight">
                Second Brain
              </p>
              <p className="text-[10px] text-muted-foreground">
                {isLoadingItems ? "Loading…" : `${items.length} items saved`}
              </p>
            </div>
          </div>

          {/* Folder Structure */}
          <div className="mb-1">
            <p className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
              <FolderOpen className="h-3 w-3 inline-block mr-1 -mt-px" />
              Library
            </p>
            <nav className="flex flex-col gap-0.5">
              {FOLDER_CONFIG.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => {
                    setSidebarView(folder.id);
                    setBrainMode("feed");
                  }}
                  className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 text-left ${
                    sidebarView === folder.id && isLibraryView
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span
                    className={`transition-colors ${sidebarView === folder.id && isLibraryView ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                  >
                    {folder.icon}
                  </span>
                  {folder.label}
                  <span
                    className={`ml-auto text-[10px] font-bold ${
                      sidebarView === folder.id && isLibraryView
                        ? "text-primary"
                        : "text-muted-foreground/60"
                    }`}
                  >
                    {folder.count}
                  </span>
                  {sidebarView === folder.id && isLibraryView && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-full"
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Divider */}
          <div className="border-t border-border my-1" />

          {/* Views */}
          <div>
            <p className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
              <Sparkles className="h-3 w-3 inline-block mr-1 -mt-px" />
              Views
            </p>
            <nav className="flex flex-col gap-0.5">
              {VIEW_CONFIG.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setSidebarView(view.id)}
                  className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 text-left ${
                    sidebarView === view.id
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span
                    className={`transition-colors ${sidebarView === view.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                  >
                    {view.icon}
                  </span>
                  {view.label}
                  {sidebarView === view.id && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-full"
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Knowledge base stats */}
          <div className="mt-auto pt-3 border-t border-border">
            {items.length > 0 && (
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                  <span>Knowledge base</span>
                  <span className="text-primary font-bold">{items.length}</span>
                </div>
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min((items.length / 50) * 100, 100)}%`,
                    }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main Content ──────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mode Toggle — only show when in library views */}
          {isLibraryView && (
            <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/60 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border">
                <button
                  onClick={() => setBrainMode("feed")}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                    brainMode === "feed"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {brainMode === "feed" && (
                    <motion.div
                      layoutId="mode-toggle"
                      className="absolute inset-0 bg-background rounded-lg shadow-sm border border-border"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.5,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <BrainIcon className="h-3.5 w-3.5" />
                    Feed
                  </span>
                </button>
                <button
                  onClick={() => setBrainMode("query")}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                    brainMode === "query"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {brainMode === "query" && (
                    <motion.div
                      layoutId="mode-toggle"
                      className="absolute inset-0 bg-background rounded-lg shadow-sm border border-border"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.5,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Query
                  </span>
                </button>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl px-3 py-2">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search…"
                  className="bg-transparent text-xs text-foreground focus:outline-none placeholder:text-muted-foreground/60 w-36"
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
          )}

          <AnimatePresence mode="wait">
            {/* ── FEED MODE ───────────────────────────────── */}
            {isLibraryView && brainMode === "feed" && (
              <motion.div
                key="feed"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Feed Timeline */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  {filteredItems.length === 0 && !isLoadingItems ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className="flex flex-col items-center justify-center h-full text-center pb-10"
                    >
                      <div className="relative mb-8">
                        <motion.div
                          animate={{
                            scale: [1, 1.05, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="absolute inset-0 rounded-full bg-primary/15 blur-xl"
                        />
                        <div className="relative h-20 w-20 rounded-3xl bg-primary/10 border border-primary/25 flex items-center justify-center shadow-2xl shadow-primary/10">
                          <BrainIcon className="h-10 w-10 text-primary" />
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
                        Feed your brain some thoughts
                      </h2>
                      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-8">
                        Drop URLs, notes, article text — anything you want to
                        remember. Your brain indexes it all.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                        {[
                          {
                            label: "Paste a URL",
                            icon: <Link2 className="h-3 w-3" />,
                            tab: "url" as SaveTab,
                          },
                          {
                            label: "Write a quick note",
                            icon: <PenLine className="h-3 w-3" />,
                            tab: "note" as SaveTab,
                          },
                          {
                            label: "Save article text",
                            icon: <FileText className="h-3 w-3" />,
                            tab: "text" as SaveTab,
                          },
                        ].map((chip) => (
                          <motion.button
                            key={chip.label}
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setSaveTab(chip.tab);
                              inputRef.current?.focus();
                            }}
                            className="flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                          >
                            <span className="text-primary/60">{chip.icon}</span>
                            {chip.label}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ) : isLoadingItems ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-2 max-w-3xl mx-auto">
                      <AnimatePresence>
                        {filteredItems.map((item: any, i: number) => (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 8, scale: 0.98 }}
                            transition={{ duration: 0.2, delay: i * 0.02 }}
                            className="group flex items-center gap-4 rounded-2xl border border-border bg-card/60 px-4 py-4 hover:bg-card hover:border-border/80 transition-all duration-200"
                          >
                            <div className="shrink-0">
                              <TypeBadge type={item.source_type} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {item.title}
                              </p>
                              {item.source_url && (
                                <p className="text-[11px] text-muted-foreground truncate mt-0.5 font-mono">
                                  {item.source_url}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                                  <Hash className="h-2.5 w-2.5" />{" "}
                                  {item.chunk_count} chunks
                                </span>
                                <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" />
                                  {new Date(item.created_at).toLocaleDateString(
                                    undefined,
                                    { month: "short", day: "numeric" },
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                onClick={() => deleteItem.mutate(item.id)}
                                disabled={
                                  deleteItem.isPending &&
                                  deleteItem.variables === item.id
                                }
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                {deleteItem.isPending &&
                                deleteItem.variables === item.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <div ref={feedEndRef} />
                    </div>
                  )}
                </div>

                {/* Feed Input Area */}
                <div className="border-t border-border bg-card/60 backdrop-blur-sm p-4">
                  <div className="max-w-3xl mx-auto">
                    {/* Inline type tabs */}
                    <div className="flex items-center gap-1 mb-3">
                      {[
                        {
                          id: "note" as SaveTab,
                          icon: <PenLine className="h-3 w-3" />,
                          label: "Note",
                        },
                        {
                          id: "url" as SaveTab,
                          icon: <Link2 className="h-3 w-3" />,
                          label: "URL",
                        },
                        {
                          id: "text" as SaveTab,
                          icon: <FileText className="h-3 w-3" />,
                          label: "Text",
                        },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSaveTab(t.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                            saveTab === t.id
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        >
                          {t.icon} {t.label}
                        </button>
                      ))}
                      <button
                        onClick={() => setShowTitleField(!showTitleField)}
                        className={`ml-auto flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          showTitleField
                            ? "text-primary bg-primary/5"
                            : "text-muted-foreground/50 hover:text-muted-foreground"
                        }`}
                      >
                        + Title
                      </button>
                    </div>

                    {/* Optional title field */}
                    <AnimatePresence>
                      {showTitleField && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden mb-2"
                        >
                          <input
                            value={titleInput}
                            onChange={(e) => setTitleInput(e.target.value)}
                            placeholder="Give it a title…"
                            className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Main input */}
                    <div className="flex items-end gap-3 bg-muted/30 border border-border rounded-2xl px-4 py-3 focus-within:border-primary/40 transition-colors">
                      {saveTab === "url" ? (
                        <div className="flex-1 flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                          <textarea
                            ref={inputRef}
                            value={feedInput}
                            onChange={(e) => setFeedInput(e.target.value)}
                            onKeyDown={handleFeedKeyDown}
                            placeholder="Paste a URL…  https://example.com/article"
                            rows={1}
                            className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/50 resize-none font-mono"
                            disabled={saveContent.isPending}
                          />
                        </div>
                      ) : (
                        <textarea
                          ref={inputRef}
                          value={feedInput}
                          onChange={(e) => setFeedInput(e.target.value)}
                          onKeyDown={handleFeedKeyDown}
                          placeholder={
                            saveTab === "note"
                              ? "Write a thought, idea, or note…"
                              : "Paste article text or content…"
                          }
                          rows={2}
                          className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/50 resize-none"
                          disabled={saveContent.isPending}
                        />
                      )}
                      <div className="flex items-center gap-2 shrink-0">
                        {saveContent.isPending ? (
                          <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          </div>
                        ) : feedInput.trim() ? (
                          <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            onClick={handleFeedSave}
                            className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center text-primary-foreground transition-colors shadow-sm"
                          >
                            <Send className="h-4 w-4" />
                          </motion.button>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground/40 mt-1.5 text-center">
                      Press{" "}
                      <kbd className="px-1 py-0.5 rounded bg-muted text-[9px] font-mono border border-border">
                        ⌘ Enter
                      </kbd>{" "}
                      to save
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── QUERY MODE ──────────────────────────────── */}
            {isLibraryView && brainMode === "query" && (
              <motion.div
                key="query"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                  {messages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className="flex flex-col items-center justify-center h-full text-center pb-10"
                    >
                      <div className="relative mb-8">
                        <motion.div
                          animate={{
                            scale: [1, 1.05, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="absolute inset-0 rounded-full bg-primary/15 blur-xl"
                        />
                        <div className="relative h-20 w-20 rounded-3xl bg-primary/10 border border-primary/25 flex items-center justify-center shadow-2xl shadow-primary/10">
                          <MessageSquare className="h-10 w-10 text-primary" />
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
                        Chat with your context
                      </h2>
                      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-8">
                        Ask anything. I'll search through all your saved notes,
                        URLs, and articles to find answers.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                        {[
                          "Summarise my recent notes",
                          "What startup ideas did I save?",
                          "Key takeaways from my articles",
                          "What am I currently learning?",
                        ].map((q) => (
                          <motion.button
                            key={q}
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setQuestion(q)}
                            className="flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                          >
                            <Sparkles className="h-3 w-3 text-primary/60" />
                            {q}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      <AnimatePresence initial={false}>
                        {messages.map((msg, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            {msg.role === "assistant" && (
                              <div className="h-7 w-7 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 mt-1">
                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                              </div>
                            )}
                            <div className="max-w-[75%] flex flex-col gap-2">
                              <div
                                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md shadow-lg shadow-primary/20" : "bg-card border border-border text-foreground rounded-bl-md"}`}
                              >
                                {msg.content}
                              </div>
                              {msg.sources && msg.sources.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {msg.sources.map((src) => (
                                    <a
                                      key={src.id}
                                      href={src.url || "#"}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] text-primary hover:bg-primary/10 transition-colors"
                                    >
                                      <BookOpen className="h-2.5 w-2.5" />
                                      {src.title}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {isQuerying && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-3"
                        >
                          <div className="h-7 w-7 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                          </div>
                          <div className="rounded-2xl rounded-bl-md bg-card border border-border px-4 py-3">
                            <ThinkingDots />
                          </div>
                        </motion.div>
                      )}
                      <div ref={chatEndRef} />
                    </>
                  )}
                </div>

                <div className="border-t border-border bg-card/60 backdrop-blur-sm p-4">
                  <form onSubmit={handleQuery}>
                    <div className="flex items-center gap-3 bg-muted/30 border border-border rounded-2xl px-4 py-3 focus-within:border-primary/40 transition-colors">
                      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                      <input
                        ref={queryInputRef}
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ask anything about your saved knowledge…"
                        className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/60"
                        disabled={isQuerying}
                      />
                      {question.trim() && (
                        <motion.button
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          type="submit"
                          disabled={isQuerying}
                          className="h-8 w-8 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center text-primary-foreground transition-colors disabled:opacity-50 shrink-0"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </motion.button>
                      )}
                    </div>
                    {messages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setMessages([])}
                        className="mt-2 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors mx-auto block"
                      >
                        Clear conversation
                      </button>
                    )}
                  </form>
                </div>
              </motion.div>
            )}

            {/* ── MAP ───────────────────────────────────── */}
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
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${isFetchingMap ? "animate-spin" : ""}`}
                  />
                  Regenerate
                </Button>

                {(isLoadingMap || isFetchingMap) && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.7, 1, 0.7],
                      }}
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
                    <Background
                      color="hsl(var(--muted-foreground) / 0.15)"
                      gap={24}
                      size={1}
                    />
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

            {/* ── INSIGHTS ──────────────────────────────── */}
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
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${isFetchingInsights ? "animate-spin" : ""}`}
                      />
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
                          {
                            label: "Total Items",
                            value: insightsData.stats?.total || 0,
                            icon: <Library className="h-4 w-4" />,
                          },
                          {
                            label: "Web URLs",
                            value: insightsData.stats?.urls || 0,
                            icon: <Globe className="h-4 w-4" />,
                          },
                          {
                            label: "Notes",
                            value: insightsData.stats?.notes || 0,
                            icon: <StickyNote className="h-4 w-4" />,
                          },
                          {
                            label: "Data Chunks",
                            value: insightsData.stats?.chunks || 0,
                            icon: <Activity className="h-4 w-4" />,
                          },
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
                            <span className="text-3xl font-black text-foreground">
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
