import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { GlobalHeader } from "@/components/GlobalHeader";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  RefreshCw
} from "lucide-react";
import { ReactFlow, Background, Controls, Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

type SaveTab = "url" | "text" | "note";
type ViewTab = "chat" | "library" | "map" | "insights";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: { id: string; title: string; url: string | null }[];
}

export default function Brain() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // View state
  const [viewTab, setViewTab] = useState<ViewTab>("chat");
  const [saveTab, setSaveTab] = useState<SaveTab>("url");

  // Save form state
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSavePanel, setShowSavePanel] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);

  // Library state
  const [items, setItems] = useState<any[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Map state
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);

  // Insights state
  const [insights, setInsights] = useState<{ summary: string; themes: string[]; stats: any } | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  // Auth check
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Load items when switching to library
  useEffect(() => {
    if (viewTab === "library") loadItems();
  }, [viewTab]);

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadItems = useCallback(async () => {
    setIsLoadingItems(true);
    try {
      const res = await apiClient.brainListItems();
      if (res.success && res.data) {
        setItems(res.data);
      } else {
        toast({
          title: "Error",
          description: res.error || "Failed to load items",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load items",
        variant: "destructive",
      });
    } finally {
      setIsLoadingItems(false);
    }
  }, [toast]);

  const generateMap = async () => {
    setIsGeneratingMap(true);
    try {
      const res = await apiClient.brainGetMindMap();
      if (res.success && res.data) {
        // Position nodes slightly so they don't all stack at (0,0)
        // We can do a rudimentary circle layout for categories, and star layout for items
        const rawNodes = res.data.nodes || [];
        const rawEdges = res.data.edges || [];
        
        let categories = rawNodes.filter((n: any) => n.type === 'category');
        let itemsNodes = rawNodes.filter((n: any) => n.type === 'item');
        
        // If LLM returned types differently, just do random placement
        if (categories.length === 0 && itemsNodes.length === 0) {
           categories = rawNodes;
        }

        const positionedNodes = rawNodes.map((n: any, i: number) => {
          const isCategory = n.type === 'category';
          return {
            id: n.id,
            position: { 
              x: isCategory ? 250 * Math.cos((i * 2 * Math.PI) / categories.length || 1) : (Math.random() - 0.5) * 800, 
              y: isCategory ? 250 * Math.sin((i * 2 * Math.PI) / categories.length || 1) : (Math.random() - 0.5) * 800 
            },
            data: { label: n.label },
            style: isCategory 
              ? { background: '#8b5cf6', color: 'white', borderRadius: '8px', padding: '10px', fontWeight: 'bold' }
              : { background: '#1e1e2f', color: '#cbd5e1', border: '1px solid #334155', borderRadius: '4px', padding: '8px', fontSize: '12px' }
          };
        });

        const formattedEdges = rawEdges.map((e: any, i: number) => ({
          id: `e${i}`,
          source: e.source,
          target: e.target,
          animated: true,
          style: { stroke: '#6366f1' }
        }));

        setNodes(positionedNodes);
        setEdges(formattedEdges);
      } else {
        toast({ title: "Failed to generate map", description: res.error || "Unknown error", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsGeneratingMap(false);
    }
  };

  const generateInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      const res = await apiClient.brainGetInsights();
      if (res.success && res.data) {
        setInsights(res.data);
      } else {
        toast({ title: "Failed to generate insights", description: res.error || "Unknown error", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleSave = async () => {
    if (saveTab === "url" && !urlInput.trim()) {
      return toast({ title: "Error", description: "Enter a URL first", variant: "destructive" });
    }
    if (saveTab !== "url" && !textInput.trim()) {
      return toast({ title: "Error", description: "Enter some content first", variant: "destructive" });
    }

    setIsSaving(true);
    try {
      let res;
      if (saveTab === "url") {
        res = await apiClient.brainSaveUrl(urlInput.trim(), titleInput.trim() || undefined);
      } else {
        res = await apiClient.brainSaveText(textInput.trim(), titleInput.trim() || undefined, saveTab);
      }

      if (res.success && res.data) {
        toast({
          title: "Success",
          description: `Saved "${res.data.title}" — ${res.data.chunk_count} chunks indexed`,
        });
        setUrlInput("");
        setTextInput("");
        setTitleInput("");
        setShowSavePanel(false);
        if (viewTab === "library") loadItems();
      } else {
        toast({ title: "Failed to save", description: res.error || "Something went wrong", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save", variant: "destructive" });
    } finally {
      setIsSaving(false);
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
          { role: "assistant", content: res.data!.answer, sources: res.data!.sources },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Failed to query: ${res.error || "Unknown error"}` },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, something went wrong: ${err.message}` },
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await apiClient.brainDeleteItem(id);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        toast({ title: "Deleted", description: "Item deleted successfully" });
      } else {
        toast({ title: "Failed", description: res.error || "Failed to delete item", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = items.filter(
    (i) =>
      !searchQuery ||
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.source_url || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return null;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <GlobalHeader />

      <main className="flex-1 flex flex-col min-h-0 relative max-w-5xl mx-auto w-full px-4 py-6">
        {/* Sub Header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-border/40 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20">
              <BrainIcon className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Second Brain</h1>
              <p className="text-xs text-muted-foreground">
                Your personal context RAG database
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border/40 bg-muted/20 p-0.5">
              {(["chat", "library", "map", "insights"] as ViewTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setViewTab(tab);
                    if (tab === "map" && nodes.length === 0) generateMap();
                    if (tab === "insights" && !insights) generateInsights();
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    viewTab === tab
                      ? "bg-secondary text-secondary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "chat" ? <><BrainIcon className="h-3.5 w-3.5" /> Chat</> :
                   tab === "library" ? <><BookOpen className="h-3.5 w-3.5" /> Library</> :
                   tab === "map" ? <><MapIcon className="h-3.5 w-3.5" /> Mind Map</> :
                   <><Lightbulb className="h-3.5 w-3.5" /> Insights</>}
                </button>
              ))}
            </div>

            <Button
              onClick={() => setShowSavePanel(true)}
              size="sm"
              className="bg-violet-600 hover:bg-violet-500 text-white gap-1.5 rounded-lg"
            >
              <Plus className="h-4 w-4" /> Save Context
            </Button>
          </div>
        </div>

        {/* ── Save Form Panel (overlay modal) ────────────────────────── */}
        <AnimatePresence>
          {showSavePanel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
              onClick={(e) => e.target === e.currentTarget && setShowSavePanel(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-foreground">Save Context to Brain</h2>
                  <button
                    onClick={() => setShowSavePanel(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex rounded-lg border border-border/40 bg-muted/20 p-0.5 mb-4">
                  {(["url", "text", "note"] as SaveTab[]).map((tab) => {
                    const Icon = tab === "url" ? Globe : tab === "text" ? FileText : StickyNote;
                    return (
                      <button
                        key={tab}
                        onClick={() => setSaveTab(tab)}
                        className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          saveTab === tab
                            ? "bg-secondary text-secondary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {tab.toUpperCase()}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  <Input
                    placeholder="Title (optional)"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className="rounded-lg"
                  />
                  {saveTab === "url" ? (
                    <Input
                      placeholder="https://example.com/article"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      type="url"
                      className="rounded-lg font-mono text-sm"
                      onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    />
                  ) : (
                    <textarea
                      placeholder={saveTab === "note" ? "Write down your note/thought..." : "Paste full article text..."}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      rows={6}
                      className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  )}
                  <Button
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-lg"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Indexing Context…
                      </>
                    ) : (
                      <>
                        <BrainIcon className="mr-2 h-4 w-4" />
                        Save to Brain
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main content view ────────────────────────────────────────── */}
        {viewTab === "chat" && (
          <div className="flex-1 flex flex-col min-h-0 border border-border/40 rounded-2xl bg-card/10 backdrop-blur-md overflow-hidden">
            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 mb-4 border border-violet-500/20">
                    <BrainIcon className="h-8 w-8 text-violet-400 animate-pulse" />
                  </div>
                  <h3 className="text-base font-bold mb-1">Query your Second Brain</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-6">
                    Ask questions grounded in the context of your saved notes and scraped URLs.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                    {[
                      "What startup concepts did I save?",
                      "Summarise my recent notes",
                      "Key takeaways from my saved URLs",
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => setQuestion(q)}
                        className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-violet-500/40 hover:bg-violet-500/5 transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/10 border border-violet-500/20 mt-1">
                        <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                      </div>
                    )}
                    <div className="max-w-[80%]">
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-violet-600 text-white rounded-br-sm shadow-md"
                            : "bg-muted text-foreground rounded-bl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>

                      {/* Cited Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {msg.sources.map((src) => (
                            <a
                              key={src.id}
                              href={src.url || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/5 px-2.5 py-0.5 text-[11px] text-violet-400 hover:bg-violet-500/10 transition-colors"
                            >
                              <BookOpen className="h-3 w-3" />
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
                <div className="flex justify-start">
                  <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/10 border border-violet-500/20 mt-1">
                    <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                  </div>
                  <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleQuery} className="border-t border-border/40 p-3 bg-background/50">
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/10 px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask anything about your saved knowledge…"
                  className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground"
                  disabled={isQuerying}
                />
                <button
                  type="submit"
                  disabled={!question.trim() || isQuerying}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {viewTab === "library" && (
          <div className="flex-1 flex flex-col min-h-0 border border-border/40 rounded-2xl bg-card/10 backdrop-blur-md overflow-hidden">
            <div className="p-3 border-b border-border/40 bg-background/30">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/10 px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search saved items by title or URL…"
                  className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingItems ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "No matches found" : "Your library is empty. Save context to get started."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-2">
                  <AnimatePresence>
                    {filteredItems.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center gap-4 rounded-xl border border-border/30 bg-card/40 p-4 hover:bg-card/70 transition-all group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/5 px-2 py-0.5 text-[10px] font-semibold text-violet-400 uppercase">
                              {item.source_type}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {item.chunk_count} chunks
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                          {item.source_url && (
                            <p className="text-xs text-muted-foreground truncate">{item.source_url}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.source_url && (
                            <a
                              href={item.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        <time className="text-xs text-muted-foreground select-none">
                          {new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </time>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Map Tab ────────────────────────────────────────────── */}
        {viewTab === "map" && (
          <div className="flex-1 flex flex-col min-h-0 border border-border/40 rounded-2xl bg-card/10 backdrop-blur-md overflow-hidden relative">
            {isGeneratingMap && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-4" />
                <p className="text-sm font-medium">Generating Mind Map...</p>
                <p className="text-xs text-muted-foreground mt-2 max-w-sm text-center">
                  Our AI is clustering your saved items to find connections. This might take a few moments.
                </p>
              </div>
            )}
            
            <div className="absolute top-4 right-4 z-10">
              <Button size="sm" variant="outline" onClick={generateMap} disabled={isGeneratingMap} className="bg-background/50 backdrop-blur-md border-border/40 shadow-sm rounded-xl">
                <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isGeneratingMap ? 'animate-spin' : ''}`} />
                Regenerate Map
              </Button>
            </div>

            {nodes.length > 0 ? (
              <ReactFlow 
                nodes={nodes} 
                edges={edges}
                fitView
                className="w-full h-full bg-transparent"
                proOptions={{ hideAttribution: true }}
              >
                <Background color="#cbd5e1" gap={20} size={1} />
                <Controls className="bg-background/80 border border-border/40 rounded-lg shadow-sm" />
              </ReactFlow>
            ) : !isGeneratingMap && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MapIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground max-w-md">
                  Click 'Regenerate Map' to visualize the connections between your saved items.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Insights Tab ────────────────────────────────────────────── */}
        {viewTab === "insights" && (
          <div className="flex-1 flex flex-col min-h-0 border border-border/40 rounded-2xl bg-card/10 backdrop-blur-md overflow-hidden overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-1">Knowledge Insights</h2>
                <p className="text-sm text-muted-foreground">AI-generated summary of your Second Brain</p>
              </div>
              <Button size="sm" variant="outline" onClick={generateInsights} disabled={isGeneratingInsights} className="bg-background/50 border-border/40 rounded-xl">
                <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isGeneratingInsights ? 'animate-spin' : ''}`} />
                Refresh Insights
              </Button>
            </div>

            {isGeneratingInsights ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-4" />
                <p className="text-sm">Analyzing your knowledge base...</p>
              </div>
            ) : insights ? (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-border/40 bg-card/40 flex flex-col">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><BookOpen className="h-3 w-3" /> Total Items</span>
                    <span className="text-3xl font-bold text-foreground">{insights.stats?.total || 0}</span>
                  </div>
                  <div className="p-4 rounded-xl border border-border/40 bg-card/40 flex flex-col">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Globe className="h-3 w-3" /> URLs</span>
                    <span className="text-3xl font-bold text-violet-500">{insights.stats?.urls || 0}</span>
                  </div>
                  <div className="p-4 rounded-xl border border-border/40 bg-card/40 flex flex-col">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><StickyNote className="h-3 w-3" /> Notes</span>
                    <span className="text-3xl font-bold text-amber-500">{insights.stats?.notes || 0}</span>
                  </div>
                  <div className="p-4 rounded-xl border border-border/40 bg-card/40 flex flex-col">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Activity className="h-3 w-3" /> Data Chunks</span>
                    <span className="text-3xl font-bold text-blue-500">{insights.stats?.chunks || 0}</span>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="p-6 rounded-xl border border-violet-500/20 bg-violet-500/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Sparkles className="h-32 w-32" />
                  </div>
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <BrainIcon className="h-4 w-4 text-violet-400" />
                    Overall Assessment
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground/90 max-w-3xl relative z-10">
                    {insights.summary}
                  </p>
                </div>

                {/* Themes */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Prominent Themes</h3>
                  <div className="flex flex-wrap gap-2">
                    {insights.themes?.map((theme, i) => (
                      <span key={i} className="px-4 py-2 rounded-full border border-border/60 bg-muted/30 text-sm font-medium">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                <Lightbulb className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground max-w-md">
                  Click 'Refresh Insights' to let AI analyze your saved content and generate a summary of your knowledge.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
