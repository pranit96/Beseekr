import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { GlobalHeader } from "@/components/GlobalHeader";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail,
  Rss,
  Loader2,
  Plus,
  Eye,
  Send,
  ExternalLink,
  X,
  Trash2,
  Inbox,
  Settings2,
  Globe,
} from "lucide-react";

const SUGGESTED_FEEDS = [
  { label: "Hacker News", url: "https://news.ycombinator.com/rss" },
  { label: "TechCrunch", url: "https://techcrunch.com/feed/" },
  { label: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
  { label: "MIT News", url: "https://news.mit.edu/rss/feed" },
  { label: "arXiv AI", url: "https://arxiv.org/rss/cs.AI" },
];

export default function Digest() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [prefs, setPrefs] = useState<any | null>(null);
  const [feeds, setFeeds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Feed add state
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedLabel, setNewFeedLabel] = useState("");
  const [isAddingFeed, setIsAddingFeed] = useState(false);
  const [deletingFeedId, setDeletingFeedId] = useState<string | null>(null);

  // Preview state
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Layout state
  const [activeMobileTab, setActiveMobileTab] = useState<"configure" | "preview">("configure");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pRes, fRes] = await Promise.all([
        apiClient.getDigestPreferences(),
        apiClient.listDigestFeeds(),
      ]);

      if (pRes.success && pRes.data) {
        setPrefs(pRes.data);
      }

      if (fRes.success && fRes.data) {
        setFeeds(fRes.data);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load digest settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) loadAll();
  }, [user, loadAll]);

  const handleAddFeed = async (url?: string, label?: string) => {
    const feedUrl = url || newFeedUrl.trim();
    const feedLabel = label || newFeedLabel.trim();
    if (!feedUrl) return toast({ title: "Error", description: "Enter a feed URL", variant: "destructive" });

    setIsAddingFeed(true);
    try {
      const res = await apiClient.addDigestFeed(feedUrl, feedLabel || undefined);
      if (res.success && res.data) {
        setFeeds((prev) => [res.data, ...prev]);
        setNewFeedUrl("");
        setNewFeedLabel("");
        toast({ title: "Success", description: `Feed added: ${feedLabel || feedUrl}` });
      } else {
        toast({ title: "Failed", description: res.error || "Failed to add feed", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to add feed", variant: "destructive" });
    } finally {
      setIsAddingFeed(false);
    }
  };

  const handleRemoveFeed = async (id: string) => {
    setDeletingFeedId(id);
    try {
      const res = await apiClient.removeDigestFeed(id);
      if (res.success) {
        setFeeds((prev) => prev.filter((f) => f.id !== id));
        toast({ title: "Removed", description: "Feed removed successfully" });
      } else {
        toast({ title: "Failed", description: res.error || "Failed to remove feed", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to remove feed", variant: "destructive" });
    } finally {
      setDeletingFeedId(null);
    }
  };

  const handlePreview = async () => {
    if (!feeds.length) return toast({ title: "Error", description: "Add at least one feed first", variant: "destructive" });
    setIsGeneratingPreview(true);
    setPreviewHtml(null);
    try {
      const res = await apiClient.previewDigest(prefs?.style || "bullets");
      if (res.success && res.data) {
        if (!res.data.html) {
          toast({ title: "Information", description: res.data.message || "No new articles found this week" });
        } else {
          setPreviewHtml(res.data.html);
          setActiveMobileTab("preview"); // Switch to preview tab on mobile
          toast({
            title: "Success",
            description: `Preview ready — ${res.data.itemCount} articles from ${res.data.sectionCount} topics`,
          });
        }
      } else {
        toast({ title: "Failed", description: res.error || "Preview generation failed", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Preview failed", variant: "destructive" });
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleSendNow = async () => {
    if (!prefs?.email) return toast({ title: "Error", description: "Save your email preferences in Profile settings first", variant: "destructive" });
    setIsSending(true);
    try {
      const res = await apiClient.sendMeDigest();
      if (res.success && res.data) {
        if (res.data.sent) {
          toast({ title: "Success", description: `Digest sent to ${prefs.email} — ${res.data.itemCount} articles` });
        } else {
          toast({ title: "Information", description: res.data.reason || "Nothing to send right now" });
        }
      } else {
        toast({ title: "Failed", description: res.error || "Failed to send digest", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Send failed", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0b0c10] text-[#c5c6c7] overflow-hidden">
        <GlobalHeader />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading weekly digest streams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#08090d] text-foreground overflow-x-hidden relative">
      {/* Background Decorative Blur Nodes */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/10 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[160px] pointer-events-none" />

      <GlobalHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 relative z-10">
        
        {/* Main Title Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6"
        >
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/5">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                  Weekly Personal Digest
                  {prefs?.enabled && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-0.5 text-[10px] font-bold text-green-400 uppercase tracking-widest">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /> Active
                    </span>
                  )}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Synthesize your customized news feeds into a beautiful weekly brief generated directly on Sundays.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={loadAll}
              className="border-white/10 hover:bg-white/5 text-xs rounded-xl h-9"
            >
              Refresh Feeds
            </Button>
          </div>
        </motion.div>

        {/* Mobile Tab Selectors (hides on desktop) */}
        <div className="flex lg:hidden bg-muted/20 border border-white/5 p-1 rounded-xl">
          <button
            onClick={() => setActiveMobileTab("configure")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeMobileTab === "configure"
                ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <Rss className="w-4 h-4" />
            Manage Feeds
          </button>
          <button
            onClick={() => setActiveMobileTab("preview")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeMobileTab === "preview"
                ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <Eye className="w-4 h-4" />
            Live Preview
          </button>
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: RSS Feed Management */}
          <div className={`lg:col-span-5 space-y-6 ${activeMobileTab === "configure" ? "block" : "hidden lg:block"}`}>
            <motion.section
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl border border-white/5 bg-slate-950/40 backdrop-blur-md p-6 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Rss className="w-4 h-4 text-indigo-400" />
                  Feed Streams
                </span>
                {feeds.length > 0 && (
                  <span className="rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-bold">
                    {feeds.length} Streams
                  </span>
                )}
              </h2>

              <div className="space-y-4">
                {/* Inputs for adding feeds */}
                <div className="space-y-2 border-b border-white/5 pb-4">
                  <Input
                    placeholder="Feed URL (RSS or Atom link)"
                    value={newFeedUrl}
                    onChange={(e) => setNewFeedUrl(e.target.value)}
                    className="text-xs font-mono rounded-xl bg-white/5 border-white/10 text-white h-10 placeholder:text-muted-foreground/60"
                    onKeyDown={(e) => e.key === "Enter" && handleAddFeed()}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Stream Name (e.g. HN)"
                      value={newFeedLabel}
                      onChange={(e) => setNewFeedLabel(e.target.value)}
                      className="text-xs rounded-xl bg-white/5 border-white/10 text-white h-10"
                    />
                    <Button
                      onClick={() => handleAddFeed()}
                      disabled={isAddingFeed || !newFeedUrl.trim()}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-10 px-4 flex items-center gap-1.5 text-xs font-bold"
                    >
                      {isAddingFeed ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Add Stream
                    </Button>
                  </div>
                </div>

                {/* Suggested feeds helper */}
                {SUGGESTED_FEEDS.filter((s) => !feeds.some((f) => f.feed_url === s.url)).length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2">Recommended feeds:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_FEEDS.filter((s) => !feeds.some((f) => f.feed_url === s.url)).map((s) => (
                        <button
                          key={s.url}
                          onClick={() => handleAddFeed(s.url, s.label)}
                          disabled={isAddingFeed}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-[11px] text-muted-foreground bg-white/[0.01] hover:text-white hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all duration-300 disabled:opacity-40"
                        >
                          <Rss className="h-3 w-3" />
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feed item list */}
                <div className="max-h-96 overflow-y-auto pr-1 space-y-2">
                  <AnimatePresence>
                    {feeds.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                        <Rss className="w-8 h-8 text-muted-foreground/30 mb-2" />
                        <p className="text-xs text-muted-foreground">Add RSS/Atom feeds to start compiling your digest.</p>
                      </div>
                    ) : (
                      feeds.map((feed) => (
                        <motion.div
                          key={feed.id}
                          layout
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 group hover:border-indigo-500/20 hover:bg-indigo-500/[0.01] transition-all duration-300"
                        >
                          <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                            <Globe className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {feed.label || "Untitled Stream"}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">{feed.feed_url}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={feed.feed_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-white transition-colors p-1"
                              title="Open original feed"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <button
                              onClick={() => handleRemoveFeed(feed.id)}
                              disabled={deletingFeedId === feed.id}
                              className="text-muted-foreground hover:text-red-400 transition-colors p-1 focus:outline-none"
                              title="Delete stream"
                            >
                              {deletingFeedId === feed.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.section>
          </div>

          {/* RIGHT PANEL: LIVE PREVIEW & INTERACTIVE MOCK INBOX */}
          <div className={`lg:col-span-7 space-y-6 ${activeMobileTab === "preview" ? "block" : "hidden lg:block"}`}>
            
            {/* Quick Actions Panel */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-white/5 bg-slate-950/40 backdrop-blur-md p-5 shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between"
            >
              <div>
                <h2 className="text-sm font-bold text-white">Compile & Dispatch</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">Generate a preview instantly or test delivery to your inbox.</p>
              </div>
              <div className="flex gap-2.5 w-full sm:w-auto shrink-0">
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-initial gap-2 border-white/10 hover:bg-white/5 rounded-xl h-10 text-xs font-semibold"
                  onClick={handlePreview}
                  disabled={isGeneratingPreview || !feeds.length}
                >
                  {isGeneratingPreview ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 text-indigo-400" />
                  )}
                  Preview
                </Button>
                <Button
                  className="flex-1 sm:flex-initial gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-10 text-xs font-bold transition-all"
                  onClick={handleSendNow}
                  disabled={isSending || !prefs}
                >
                  {isSending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Send test email
                </Button>
              </div>
            </motion.section>

            {/* High-Fidelity Mock Inbox Container */}
            <motion.section
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl border border-white/5 bg-slate-950/60 shadow-2xl relative overflow-hidden"
            >
              {/* Browser mockup controls */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-[#0f1118]">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500/70" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
                  <span className="h-3 w-3 rounded-full bg-green-500/70" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest font-mono">
                  Weekly Brief Viewer
                </span>
                <div className="w-12" /> {/* alignment spacer */}
              </div>

              {/* Email Client Metadata Header */}
              {previewHtml && (
                <div className="px-6 py-4 bg-[#11131c] border-b border-white/5 flex flex-col gap-1.5 text-xs text-muted-foreground">
                  <p><span className="font-semibold text-white/50">From:</span> Beseekr AI Digest &lt;noreply@support.beseekr.com&gt;</p>
                  <p><span className="font-semibold text-white/50">To:</span> {prefs?.email || "you@example.com"}</p>
                  <p><span className="font-semibold text-white/50">Subject:</span> 🧠 Your Weekly Digest — {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}</p>
                </div>
              )}

              {/* Live Preview Display Box */}
              <div className="p-1 min-h-[460px] bg-slate-900/10 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {previewHtml ? (
                    <motion.div
                      key="preview-content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full flex flex-col"
                    >
                      <iframe
                        srcDoc={previewHtml}
                        title="Digest email preview"
                        className="w-full rounded-2xl bg-white"
                        style={{ height: "550px", border: "none" }}
                        sandbox="allow-same-origin"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center text-center p-8 py-14"
                    >
                      {/* Premium Asset Illustration */}
                      <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="relative w-56 h-56 rounded-3xl overflow-hidden mb-8 shadow-2xl border border-white/5 shadow-indigo-500/5 group"
                      >
                        <img 
                          src="/images/weekly_digest_illustration.png" 
                          alt="Futuristic Digest Illustration" 
                          className="object-cover w-full h-full transform scale-105 group-hover:scale-110 transition-transform duration-1000"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                      </motion.div>

                      <div className="max-w-sm">
                        <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                          <Inbox className="w-5 h-5 text-indigo-400" />
                          No digest generated
                        </h3>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          Once you add your feed streams above, click <strong>"Preview"</strong> to see how your weekly synthesized newsletter compiles.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Close Button / Bottom control if preview active */}
              {previewHtml && (
                <div className="flex justify-end p-3 border-t border-white/5 bg-[#0f1118]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewHtml(null)}
                    className="text-xs font-semibold text-muted-foreground hover:text-white gap-1.5"
                  >
                    Clear Preview
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </motion.section>
          </div>

        </div>
      </main>
    </div>
  );
}
