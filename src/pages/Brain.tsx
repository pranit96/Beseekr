import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { ReactFlow, Background, Controls, Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type SaveTab = "url" | "text" | "note";
type ViewTab = "chat" | "library" | "map" | "insights";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: { id: string; title: string; url: string | null }[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const TypeBadge = ({ type }: { type: string }) => {
  const cfg: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    url: { icon: <Globe className="h-3 w-3" />, color: "#6366f1", bg: "#6366f120" },
    text: { icon: <FileText className="h-3 w-3" />, color: "#8b5cf6", bg: "#8b5cf620" },
    note: { icon: <StickyNote className="h-3 w-3" />, color: "#a78bfa", bg: "#a78bfa20" },
  };
  const c = cfg[type] || cfg["note"];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ color: c.color, backgroundColor: c.bg, border: `1px solid ${c.color}30` }}
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
        className="h-2 w-2 rounded-full bg-violet-400"
        animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
      />
    ))}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Brain() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
  } = useBrainMindMap(false); // don't auto-fetch — user navigates to map tab

  const {
    data: insightsData,
    isLoading: isLoadingInsights,
    isFetching: isFetchingInsights,
    refetch: refetchInsights,
  } = useBrainInsights(false); // same — user navigates to insights tab

  const saveContent = useSaveBrainContent();
  const deleteItem = useDeleteBrainItem();

  // ── Local UI state ────────────────────────────────────────────────────────
  const [viewTab, setViewTab] = useState<ViewTab>("chat");
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [saveTab, setSaveTab] = useState<SaveTab>("url");
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [titleInput, setTitleInput] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  // Track whether the user has ever triggered map/insights (to know when to enable the query)
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
    if (viewTab === "chat") setTimeout(() => inputRef.current?.focus(), 80);
  }, [viewTab]);

  // When switching to map/insights tabs, enable those queries if not already
  useEffect(() => {
    if (viewTab === "map" && !mapEnabled) setMapEnabled(true);
    if (viewTab === "insights" && !insightsEnabled) setInsightsEnabled(true);
  }, [viewTab, mapEnabled, insightsEnabled]);

  // ── Derived ReactFlow state ───────────────────────────────────────────────
  const { nodes, edges } = React.useMemo(() => {
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
          ? { background: "#7c3aed", color: "white", borderRadius: "12px", padding: "10px 16px", fontWeight: "700", fontSize: "13px", border: "1px solid #8b5cf640" }
          : { background: "#13141f", color: "#c4b5fd", border: "1px solid #3730a340", borderRadius: "8px", padding: "8px 12px", fontSize: "11px" },
      };
    });
    const formattedEdges: Edge[] = (mindMapData.edges || []).map((e: any, i: number) => ({
      id: `e${i}`, source: e.source, target: e.target, animated: true, style: { stroke: "#6366f1" },
    }));
    return { nodes: positionedNodes, edges: formattedEdges };
  }, [mindMapData]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (saveTab === "url" && !urlInput.trim()) return;
    if (saveTab !== "url" && !textInput.trim()) return;

    const payload =
      saveTab === "url"
        ? { type: "url" as const, url: urlInput.trim(), title: titleInput.trim() || undefined }
        : { type: saveTab as "text" | "note", text: textInput.trim(), title: titleInput.trim() || undefined };

    saveContent.mutate(payload, {
      onSuccess: () => {
        setUrlInput(""); setTextInput(""); setTitleInput("");
        setShowAddPanel(false);
      },
    });
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
        setMessages((prev) => [...prev, { role: "assistant", content: res.data!.answer, sources: res.data!.sources }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${res.error || "Unknown error"}` }]);
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Sorry, something went wrong: ${err.message}` }]);
    } finally {
      setIsQuerying(false);
    }
  };

  const filteredItems = items.filter(
    (i: any) =>
      !searchQuery ||
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.source_url || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const TAB_CONFIG = [
    { id: "chat" as ViewTab, icon: <MessageSquare className="h-3.5 w-3.5" />, label: "Ask AI" },
    { id: "library" as ViewTab, icon: <Library className="h-3.5 w-3.5" />, label: "Library" },
    { id: "map" as ViewTab, icon: <MapIcon className="h-3.5 w-3.5" />, label: "Mind Map" },
    { id: "insights" as ViewTab, icon: <Lightbulb className="h-3.5 w-3.5" />, label: "Insights" },
  ];

  if (loading) return null;

  return (
    <div className="h-screen flex flex-col bg-[#090b12] text-foreground overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-violet-700/[0.06] blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-indigo-700/[0.06] blur-[140px]" />
      </div>

      <GlobalHeader />

      <div className="flex-1 flex overflow-hidden relative z-10">

        {/* ── Left Sidebar ──────────────────────────────── */}
        <aside className="w-56 shrink-0 flex flex-col border-r border-white/[0.05] bg-[#0c0e18]/80 backdrop-blur-sm p-3 gap-1">
          <div className="flex items-center gap-2.5 px-2 pt-1 pb-4 mb-1 border-b border-white/[0.05]">
            <div className="h-8 w-8 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shadow-lg shadow-violet-500/10">
              <BrainIcon className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-tight">Second Brain</p>
              <p className="text-[10px] text-muted-foreground">
                {isLoadingItems ? "Loading…" : `${items.length} items saved`}
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-0.5">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewTab(tab.id)}
                className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 text-left ${
                  viewTab === tab.id
                    ? "bg-violet-500/12 text-violet-300 border border-violet-500/20"
                    : "text-muted-foreground hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <span className={`transition-colors ${viewTab === tab.id ? "text-violet-400" : "text-muted-foreground group-hover:text-white"}`}>
                  {tab.icon}
                </span>
                {tab.label}
                {viewTab === tab.id && (
                  <motion.div layoutId="nav-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-violet-400 rounded-full" />
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-3 border-t border-white/[0.05]">
            <button
              onClick={() => setShowAddPanel(true)}
              className="group w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-white bg-violet-600/20 border border-violet-500/25 hover:bg-violet-600/30 hover:border-violet-500/40 transition-all duration-200"
            >
              <div className="h-5 w-5 rounded-lg bg-violet-500/30 flex items-center justify-center group-hover:bg-violet-500/50 transition-colors">
                <Plus className="h-3 w-3 text-violet-300" />
              </div>
              Add Context
              <Zap className="h-3 w-3 text-violet-400 ml-auto" />
            </button>

            {items.length > 0 && (
              <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                  <span>Knowledge base</span>
                  <span className="text-violet-400 font-bold">{items.length}</span>
                </div>
                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((items.length / 50) * 100, 100)}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main Content ──────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AnimatePresence mode="wait">

            {/* ── CHAT ──────────────────────────────────── */}
            {viewTab === "chat" && (
              <motion.div key="chat" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                  {messages.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="flex flex-col items-center justify-center h-full text-center pb-10">
                      <div className="relative mb-8">
                        <motion.div animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-0 rounded-full bg-violet-500/20 blur-xl" />
                        <div className="relative h-20 w-20 rounded-3xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center shadow-2xl shadow-violet-500/10">
                          <BrainIcon className="h-10 w-10 text-violet-400" />
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Query your Second Brain</h2>
                      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-8">
                        Ask anything. I'll search through all your saved notes, URLs, and articles to find answers.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                        {["Summarise my recent notes", "What startup ideas did I save?", "Key takeaways from my articles", "What am I currently learning?"].map((q) => (
                          <motion.button key={q} whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }} onClick={() => setQuestion(q)} className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-xs text-muted-foreground hover:text-white hover:border-violet-500/30 hover:bg-violet-500/5 transition-all duration-200">
                            <Sparkles className="h-3 w-3 text-violet-400/60" />{q}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      <AnimatePresence initial={false}>
                        {messages.map((msg, i) => (
                          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            {msg.role === "assistant" && (
                              <div className="h-7 w-7 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0 mt-1">
                                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                              </div>
                            )}
                            <div className="max-w-[75%] flex flex-col gap-2">
                              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-violet-600 text-white rounded-br-md shadow-lg shadow-violet-500/20" : "bg-white/[0.04] border border-white/[0.06] text-foreground rounded-bl-md"}`}>
                                {msg.content}
                              </div>
                              {msg.sources && msg.sources.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {msg.sources.map((src) => (
                                    <a key={src.id} href={src.url || "#"} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/5 px-2.5 py-0.5 text-[11px] text-violet-400 hover:bg-violet-500/10 transition-colors">
                                      <BookOpen className="h-2.5 w-2.5" />{src.title}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {isQuerying && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                          <div className="h-7 w-7 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0">
                            <Sparkles className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
                          </div>
                          <div className="rounded-2xl rounded-bl-md bg-white/[0.04] border border-white/[0.06] px-4 py-3"><ThinkingDots /></div>
                        </motion.div>
                      )}
                      <div ref={chatEndRef} />
                    </>
                  )}
                </div>

                <div className="border-t border-white/[0.05] bg-[#0c0e18]/60 backdrop-blur-sm p-4">
                  <form onSubmit={handleQuery}>
                    <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 focus-within:border-violet-500/40 transition-colors">
                      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                      <input ref={inputRef} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask anything about your saved knowledge…" className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/60" disabled={isQuerying} />
                      {question.trim() && (
                        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} type="submit" disabled={isQuerying} className="h-8 w-8 rounded-xl bg-violet-600 hover:bg-violet-500 flex items-center justify-center text-white transition-colors disabled:opacity-50 shrink-0">
                          <Send className="h-3.5 w-3.5" />
                        </motion.button>
                      )}
                    </div>
                    {messages.length > 0 && <button type="button" onClick={() => setMessages([])} className="mt-2 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors mx-auto block">Clear conversation</button>}
                  </form>
                </div>
              </motion.div>
            )}

            {/* ── LIBRARY ───────────────────────────────── */}
            {viewTab === "library" && (
              <motion.div key="library" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
                  <div>
                    <h2 className="text-base font-bold text-white">Knowledge Library</h2>
                    <p className="text-xs text-muted-foreground">{items.length} items indexed</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2">
                      <Search className="h-3.5 w-3.5 text-muted-foreground" />
                      <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search library…" className="bg-transparent text-xs text-foreground focus:outline-none placeholder:text-muted-foreground/60 w-40" />
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => refetchItems()} disabled={isLoadingItems} className="h-9 w-9 p-0 rounded-xl border border-white/5 hover:bg-white/5">
                      <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isLoadingItems ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {isLoadingItems ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-violet-400" /></div>
                  ) : filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }} className="h-14 w-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                        <Library className="h-7 w-7 text-muted-foreground/30" />
                      </motion.div>
                      <p className="text-sm font-semibold text-white mb-1">{searchQuery ? "No results found" : "Library is empty"}</p>
                      <p className="text-xs text-muted-foreground max-w-xs">{searchQuery ? "Try a different search term" : "Add URLs, text, or notes to start building your knowledge base."}</p>
                      {!searchQuery && <Button onClick={() => setShowAddPanel(true)} size="sm" className="mt-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Add first item</Button>}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <AnimatePresence>
                        {filteredItems.map((item: any, i: number) => (
                          <motion.div key={item.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8, scale: 0.98 }} transition={{ duration: 0.2, delay: i * 0.03 }} className="group flex items-center gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-4 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200">
                            <div className="shrink-0"><TypeBadge type={item.source_type} /></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                              {item.source_url && <p className="text-[11px] text-muted-foreground truncate mt-0.5 font-mono">{item.source_url}</p>}
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1"><Hash className="h-2.5 w-2.5" /> {item.chunk_count} chunks</span>
                                <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.source_url && <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/[0.06] transition-colors"><ExternalLink className="h-3.5 w-3.5" /></a>}
                              <button
                                onClick={() => deleteItem.mutate(item.id)}
                                disabled={deleteItem.isPending && deleteItem.variables === item.id}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                {deleteItem.isPending && deleteItem.variables === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── MAP ───────────────────────────────────── */}
            {viewTab === "map" && (
              <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex-1 relative overflow-hidden">
                <div className="absolute top-4 left-4 z-10">
                  <div className="px-3 py-1.5 rounded-xl bg-[#0d0f1a]/80 border border-white/[0.06] backdrop-blur-sm">
                    <p className="text-xs font-bold text-white">Knowledge Map</p>
                    <p className="text-[10px] text-muted-foreground">{nodes.length} nodes · {edges.length} connections</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => refetchMap()} disabled={isFetchingMap} className="absolute top-4 right-4 z-10 h-8 gap-1.5 bg-[#0d0f1a]/80 border-white/[0.08] backdrop-blur-sm rounded-xl text-xs font-semibold hover:bg-white/[0.05]">
                  <RefreshCw className={`h-3.5 w-3.5 ${isFetchingMap ? "animate-spin" : ""}`} />
                  Regenerate
                </Button>

                {(isLoadingMap || isFetchingMap) && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#090b12]/80 backdrop-blur-sm">
                    <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }} className="h-16 w-16 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center mb-4">
                      <BrainIcon className="h-8 w-8 text-violet-400" />
                    </motion.div>
                    <p className="text-sm font-bold text-white mb-1">Mapping your knowledge…</p>
                    <p className="text-xs text-muted-foreground">AI is clustering your saved items</p>
                  </div>
                )}

                {nodes.length > 0 ? (
                  <ReactFlow nodes={nodes} edges={edges} fitView className="w-full h-full" proOptions={{ hideAttribution: true }}>
                    <Background color="#1e2035" gap={24} size={1} />
                    <Controls className="!bg-[#0d0f1a]/80 !border-white/[0.06] !rounded-xl !shadow-xl" />
                  </ReactFlow>
                ) : !isLoadingMap && !isFetchingMap && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MapIcon className="h-12 w-12 text-muted-foreground/20 mb-4" />
                    <p className="text-sm font-semibold text-white mb-1">No map generated</p>
                    <p className="text-xs text-muted-foreground mb-4">Click Regenerate to build a visual map of your brain</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── INSIGHTS ──────────────────────────────── */}
            {viewTab === "insights" && (
              <motion.div key="insights" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="flex-1 overflow-y-auto px-6 py-6">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-xl font-bold text-white">Knowledge Insights</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">AI-powered analysis of your Second Brain</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => refetchInsights()} disabled={isFetchingInsights} className="h-8 gap-1.5 border-white/[0.08] rounded-xl text-xs font-semibold hover:bg-white/[0.05] bg-transparent">
                      <RefreshCw className={`h-3.5 w-3.5 ${isFetchingInsights ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>

                  {isLoadingInsights || isFetchingInsights ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.8, repeat: Infinity }} className="h-14 w-14 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center mb-4">
                        <Sparkles className="h-7 w-7 text-violet-400" />
                      </motion.div>
                      <p className="text-sm font-bold text-white mb-1">Analyzing your brain…</p>
                      <p className="text-xs text-muted-foreground">This takes a few seconds</p>
                    </div>
                  ) : insightsData ? (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: "Total Items", value: insightsData.stats?.total || 0, icon: <Library className="h-4 w-4" />, color: "#8b5cf6" },
                          { label: "Web URLs", value: insightsData.stats?.urls || 0, icon: <Globe className="h-4 w-4" />, color: "#6366f1" },
                          { label: "Notes", value: insightsData.stats?.notes || 0, icon: <StickyNote className="h-4 w-4" />, color: "#a78bfa" },
                          { label: "Data Chunks", value: insightsData.stats?.chunks || 0, icon: <Activity className="h-4 w-4" />, color: "#818cf8" },
                        ].map((stat, i) => (
                          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col gap-2">
                            <div className="flex items-center gap-2"><span style={{ color: stat.color }}>{stat.icon}</span><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span></div>
                            <span className="text-3xl font-black text-white">{stat.value}</span>
                          </motion.div>
                        ))}
                      </div>

                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-6 overflow-hidden">
                        <div className="absolute top-0 right-0 opacity-[0.04] pointer-events-none"><BrainIcon className="h-40 w-40 text-violet-400" /></div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-6 w-6 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center"><Sparkles className="h-3.5 w-3.5 text-violet-400" /></div>
                          <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">AI Assessment</span>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground/90 relative z-10">{insightsData.summary}</p>
                      </motion.div>

                      {insightsData.themes?.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Prominent Themes</p>
                          <div className="flex flex-wrap gap-2">
                            {insightsData.themes.map((theme: string, i: number) => (
                              <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.06 }} className="px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] text-sm font-semibold text-white hover:border-violet-500/30 hover:bg-violet-500/5 transition-all cursor-default">
                                {theme}
                              </motion.span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity }} className="h-14 w-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                        <Lightbulb className="h-7 w-7 text-muted-foreground/30" />
                      </motion.div>
                      <p className="text-sm font-semibold text-white mb-1">No insights yet</p>
                      <p className="text-xs text-muted-foreground mb-4 max-w-xs">Click Refresh to let AI analyze your knowledge base</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ── Add Context Modal ─────────────────────────── */}
      <AnimatePresence>
        {showAddPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md" onClick={() => setShowAddPanel(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-[#0f1120] border border-white/[0.08] rounded-3xl shadow-2xl shadow-black/50 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center"><Plus className="h-4 w-4 text-violet-400" /></div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Add Context to Brain</h3>
                      <p className="text-[11px] text-muted-foreground">Save URLs, text or notes to your knowledge base</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddPanel(false)} className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/[0.06] transition-colors"><X className="h-4 w-4" /></button>
                </div>

                <div className="px-6 pt-5">
                  <div className="flex gap-1 bg-white/[0.03] border border-white/[0.05] rounded-2xl p-1">
                    {([{ id: "url" as SaveTab, icon: <Link2 className="h-3.5 w-3.5" />, label: "URL" }, { id: "text" as SaveTab, icon: <FileText className="h-3.5 w-3.5" />, label: "Text" }, { id: "note" as SaveTab, icon: <StickyNote className="h-3.5 w-3.5" />, label: "Note" }]).map((t) => (
                      <button key={t.id} onClick={() => setSaveTab(t.id)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${saveTab === t.id ? "bg-violet-600/25 text-violet-300 border border-violet-500/30" : "text-muted-foreground hover:text-white"}`}>
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-6 py-5 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Title <span className="opacity-50">(optional)</span></label>
                    <input value={titleInput} onChange={(e) => setTitleInput(e.target.value)} placeholder="Give it a name…" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-violet-500/50 transition-colors" />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">{saveTab === "url" ? "URL" : "Content"}</label>
                    <AnimatePresence mode="wait">
                      {saveTab === "url" ? (
                        <motion.div key="url" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 focus-within:border-violet-500/50 transition-colors">
                            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                            <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSave()} placeholder="https://example.com/article" className="flex-1 bg-transparent text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none font-mono" autoFocus />
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="text" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                          <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder={saveTab === "note" ? "Write a note or thought…" : "Paste article text or content…"} rows={5} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-violet-500/50 transition-colors resize-none" autoFocus />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Button onClick={handleSave} disabled={saveContent.isPending} className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl h-11 font-bold gap-2 mt-1 shadow-lg shadow-violet-500/20">
                    {saveContent.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Indexing…</> : <><BrainIcon className="h-4 w-4" /> Save to Brain</>}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
