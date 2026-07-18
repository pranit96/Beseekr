import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { GlobalHeader } from "@/components/GlobalHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useDigestFeeds,
  useDigestFeedItems,
  useAddDigestFeed,
  useRemoveDigestFeed,
  useSendDigest,
} from "@/hooks/use-api-queries";
import { DiscoverPanel } from "@/components/DiscoverPanel";
import {
  Rss,
  Loader2,
  Plus,
  Send,
  ExternalLink,
  Trash2,
  Globe,
  RefreshCw,
  SlidersHorizontal,
  X,
  Clock,
  BookOpen,
  Filter,
  Compass,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const SUGGESTED_FEEDS = [
  {
    label: "Hacker News",
    url: "https://news.ycombinator.com/rss",
    color: "#f97316",
  },
  {
    label: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    color: "#22c55e",
  },
  {
    label: "The Verge",
    url: "https://www.theverge.com/rss/index.xml",
    color: "#8b5cf6",
  },
  { label: "MIT News", url: "https://news.mit.edu/rss/feed", color: "#3b82f6" },
  { label: "arXiv AI", url: "https://arxiv.org/rss/cs.AI", color: "#ec4899" },
];

const DOMAIN_COLORS: Record<string, string> = {
  ycombinator: "#f97316",
  techcrunch: "#22c55e",
  theverge: "#8b5cf6",
  "mit.edu": "#3b82f6",
  arxiv: "#ec4899",
  wired: "#a855f7",
  arstechnica: "#06b6d4",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDomainColor(label: string): string {
  const lower = label.toLowerCase();
  for (const [key, color] of Object.entries(DOMAIN_COLORS)) {
    if (lower.includes(key)) return color;
  }
  const colors = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f97316",
    "#14b8a6",
    "#3b82f6",
    "#10b981",
  ];
  let hash = 0;
  for (let i = 0; i < label.length; i++)
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface FeedItem {
  title: string;
  url: string;
  pubDate: string;
  summary: string;
  feedLabel: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Digest() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // UI state only (no fetch state needed)
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<"manage" | "discover">(
    "manage",
  );
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedLabel, setNewFeedLabel] = useState("");
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ── React Query hooks ─────────────────────────────────────────────────────
  const isAuthed = !loading && !!user;

  const { data: feeds = [], isLoading: isLoadingFeeds } =
    useDigestFeeds(isAuthed);

  const {
    data: feedItems = [],
    isLoading: isLoadingItems,
    isFetching: isFetchingItems,
    refetch: refetchItems,
  } = useDigestFeedItems(isAuthed);

  const addFeed = useAddDigestFeed();
  const removeFeed = useRemoveDigestFeed();
  const sendDigest = useSendDigest();

  // ── Derived state ─────────────────────────────────────────────────────────
  const sources = Array.from(
    new Set((feedItems as FeedItem[]).map((i) => i.feedLabel)),
  );

  const filteredItems = (feedItems as FeedItem[]).filter((item) => {
    const matchSource = !selectedSource || item.feedLabel === selectedSource;
    const matchSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSource && matchSearch;
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openSidebar = (mode: "manage" | "discover" = "manage") => {
    setSidebarMode(mode);
    setShowSidebar(true);
  };

  const handleAddFeed = (url?: string, label?: string) => {
    const feedUrl = url || newFeedUrl.trim();
    const feedLabel = label || newFeedLabel.trim();
    if (!feedUrl) return;
    addFeed.mutate(
      { feed_url: feedUrl, label: feedLabel || undefined },
      {
        onSuccess: () => {
          setNewFeedUrl("");
          setNewFeedLabel("");
        },
      },
    );
  };

  // ── Auth redirect ─────────────────────────────────────────────────────────
  if (!loading && !user) {
    navigate("/auth");
    return null;
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading || isLoadingFeeds) {
    return (
      <div className="min-h-screen flex flex-col bg-[#080a10] text-foreground">
        <GlobalHeader />
        <div className="flex-1 flex items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading your feeds...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#080a10] text-foreground overflow-x-hidden">
      {/* Ambient BG */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-500/[0.04] rounded-full blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-violet-500/[0.04] rounded-full blur-[130px]" />
      </div>

      <GlobalHeader />

      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-5">
        {/* ── Top Bar ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/5">
              <Rss className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Feed Stream
              </h1>
              <p className="text-xs text-muted-foreground">
                {feedItems.length > 0
                  ? `${feedItems.length} articles from ${sources.length} sources`
                  : "Your personalized news stream"}
                {isFetchingItems && !isLoadingItems && (
                  <span className="ml-2 text-indigo-400 animate-pulse">
                    · refreshing
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Manual refresh — only hits network if stale */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchItems()}
              disabled={isFetchingItems}
              className="h-9 w-9 p-0 rounded-xl border border-white/5 hover:bg-white/5"
              title="Refresh feed"
            >
              <RefreshCw
                className={`h-4 w-4 text-muted-foreground ${isFetchingItems ? "animate-spin" : ""}`}
              />
            </Button>

            <Button
              onClick={() => sendDigest.mutate()}
              disabled={sendDigest.isPending || !feeds.length}
              size="sm"
              className="h-9 gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold px-4"
            >
              {sendDigest.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Send digest
            </Button>

            <Button
              onClick={() => openSidebar("discover")}
              variant="outline"
              size="sm"
              className="h-9 gap-2 border border-indigo-500/20 hover:bg-white/5 rounded-xl text-xs font-semibold text-indigo-300"
            >
              <Compass className="h-3.5 w-3.5" />
              Discover
            </Button>

            <Button
              onClick={() => openSidebar("manage")}
              variant="outline"
              size="sm"
              className="h-9 gap-2 border-white/10 hover:bg-white/5 rounded-xl text-xs font-semibold"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400" />
              Manage feeds
              {feeds.length > 0 && (
                <span className="ml-1 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold px-1.5 py-0.5">
                  {feeds.length}
                </span>
              )}
            </Button>
          </div>
        </motion.div>

        {/* ── Filter Bar ──────────────────────────────────── */}
        {sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none"
          >
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="h-8 shrink-0 bg-white/5 border border-white/[0.08] rounded-xl text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 px-3 w-48"
            />

            <div className="h-4 w-px bg-white/10 shrink-0" />
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

            <button
              onClick={() => setSelectedSource(null)}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-all duration-200 ${
                selectedSource === null
                  ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                  : "bg-transparent border-white/10 text-muted-foreground hover:text-white hover:border-white/20"
              }`}
            >
              All
            </button>

            {sources.map((source) => {
              const color = getDomainColor(source);
              const isActive = selectedSource === source;
              return (
                <button
                  key={source}
                  onClick={() => setSelectedSource(isActive ? null : source)}
                  className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-all duration-200 ${
                    isActive
                      ? ""
                      : "bg-transparent border-white/10 text-muted-foreground hover:text-white hover:border-white/20"
                  }`}
                  style={
                    isActive
                      ? {
                          borderColor: `${color}60`,
                          backgroundColor: `${color}18`,
                          color,
                        }
                      : {}
                  }
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {source}
                </button>
              );
            })}
          </motion.div>
        )}

        {/* ── Feed Grid ───────────────────────────────────── */}
        {isLoadingItems ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
              </div>
              <div className="absolute -inset-3 rounded-3xl border border-indigo-500/10 animate-ping opacity-30" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">
                Fetching your feeds...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Scanning {feeds.length} sources for fresh articles
              </p>
            </div>
          </div>
        ) : feeds.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center py-24 text-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="h-20 w-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/10"
            >
              <Rss className="h-10 w-10 text-indigo-400" />
            </motion.div>
            <h2 className="text-xl font-bold text-white mb-2">
              Your feed is empty
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-8">
              Add RSS or Atom feeds to start building your personalized news
              stream.
            </p>
            <Button
              onClick={() => openSidebar("manage")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl gap-2 font-bold"
            >
              <Plus className="h-4 w-4" />
              Add your first feed
            </Button>
          </motion.div>
        ) : filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center py-20 text-center"
          >
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-semibold text-white mb-1">
              No articles found
            </p>
            <p className="text-xs text-muted-foreground">
              {searchQuery
                ? "Try a different search term"
                : "No articles from the last 7 days in this source"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredItems.map((item, i) => {
                const color = getDomainColor(item.feedLabel);
                const pub = new Date(item.pubDate);
                const domain = (() => {
                  try {
                    return new URL(item.url).hostname.replace("www.", "");
                  } catch {
                    return "";
                  }
                })();
                return (
                  <motion.article
                    key={`${item.url}-${i}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{
                      duration: 0.3,
                      delay: Math.min(i * 0.04, 0.5),
                    }}
                    className="group relative flex flex-col rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 overflow-hidden cursor-pointer"
                    onClick={() =>
                      window.open(item.url, "_blank", "noopener,noreferrer")
                    }
                  >
                    <div
                      className="h-0.5 w-full shrink-0 opacity-70"
                      style={{ backgroundColor: color }}
                    />
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                      style={{
                        background: `radial-gradient(circle at 20% 20%, ${color}08 0%, transparent 70%)`,
                      }}
                    />

                    <div className="flex flex-col flex-1 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-5 w-5 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0"
                            style={{
                              backgroundColor: `${color}30`,
                              border: `1px solid ${color}40`,
                            }}
                          >
                            <span style={{ color }}>
                              {item.feedLabel.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span
                            className="text-[11px] font-bold truncate max-w-[120px]"
                            style={{ color }}
                          >
                            {item.feedLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60 shrink-0">
                          <Clock className="h-3 w-3" />
                          {timeAgo(pub)}
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-white leading-snug mb-2 group-hover:text-indigo-100 transition-colors line-clamp-3">
                        {item.title}
                      </h3>

                      {item.summary && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                          {item.summary}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                        <span className="text-[11px] text-muted-foreground/50 font-mono truncate max-w-[60%]">
                          {domain}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground group-hover:text-indigo-400 transition-colors">
                          Read article <ExternalLink className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* ── Manage Feeds Sidebar ─────────────────────────── */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowSidebar(false)}
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-[#0d0f18] border-l border-white/[0.08] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    {sidebarMode === "discover" ? (
                      <Compass className="h-4 w-4 text-indigo-400" />
                    ) : (
                      <Rss className="h-4 w-4 text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">
                      {sidebarMode === "discover"
                        ? "Discover Feeds"
                        : "Feed Manager"}
                    </h2>
                    <p className="text-[10px] text-muted-foreground">
                      {sidebarMode === "discover"
                        ? "Browse curated RSS sources"
                        : `${feeds.length} active sources`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setSidebarMode(
                        sidebarMode === "manage" ? "discover" : "manage",
                      )
                    }
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors mr-1"
                  >
                    {sidebarMode === "manage" ? "Discover →" : "← My Feeds"}
                  </button>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Sidebar Body */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <AnimatePresence mode="wait">
                  {sidebarMode === "discover" ? (
                    <motion.div
                      key="discover"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 overflow-hidden flex flex-col"
                    >
                      <DiscoverPanel
                        existingFeedUrls={(feeds as any[]).map(
                          (f) => f.feed_url,
                        )}
                        onClose={() => setShowSidebar(false)}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="manage"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 overflow-hidden flex flex-col"
                    >
                      <div className="p-5 border-b border-white/5 space-y-3 shrink-0">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          Add New Feed
                        </p>
                        <Input
                          placeholder="https://feed.example.com/rss"
                          value={newFeedUrl}
                          onChange={(e) => setNewFeedUrl(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleAddFeed()
                          }
                          className="text-xs font-mono rounded-xl bg-white/5 border-white/10 h-9 text-white placeholder:text-muted-foreground/60"
                        />
                        <div className="flex gap-2">
                          <Input
                            placeholder="Label (optional)"
                            value={newFeedLabel}
                            onChange={(e) => setNewFeedLabel(e.target.value)}
                            className="text-xs rounded-xl bg-white/5 border-white/10 h-9 text-white"
                          />
                          <Button
                            onClick={() => handleAddFeed()}
                            disabled={addFeed.isPending || !newFeedUrl.trim()}
                            className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white gap-1.5 text-xs font-bold shrink-0"
                          >
                            {addFeed.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Plus className="h-3.5 w-3.5" />
                            )}
                            Add
                          </Button>
                        </div>

                        {/* Quick suggestions */}
                        {SUGGESTED_FEEDS.filter(
                          (s) => !feeds.some((f: any) => f.feed_url === s.url),
                        ).length > 0 && (
                          <div>
                            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mb-1.5">
                              Quick add
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {SUGGESTED_FEEDS.filter(
                                (s) =>
                                  !feeds.some((f: any) => f.feed_url === s.url),
                              ).map((s) => (
                                <button
                                  key={s.url}
                                  onClick={() => handleAddFeed(s.url, s.label)}
                                  disabled={addFeed.isPending}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-muted-foreground hover:text-white hover:border-white/20 transition-all disabled:opacity-40"
                                >
                                  <span
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ backgroundColor: s.color }}
                                  />
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Feed List */}
                      <div className="flex-1 overflow-y-auto p-5 space-y-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                          Your Sources
                        </p>
                        <AnimatePresence>
                          {feeds.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/[0.08] rounded-2xl">
                              <Globe className="h-8 w-8 text-muted-foreground/20 mb-2" />
                              <p className="text-xs text-muted-foreground">
                                No feeds added yet
                              </p>
                            </div>
                          ) : (
                            (feeds as any[]).map((feed) => {
                              const color = getDomainColor(feed.label || "");
                              return (
                                <motion.div
                                  key={feed.id}
                                  layout
                                  initial={{ opacity: 0, x: 10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 10 }}
                                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 group hover:border-white/10 hover:bg-white/[0.04] transition-all"
                                >
                                  <div
                                    className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                                    style={{
                                      backgroundColor: `${color}20`,
                                      border: `1px solid ${color}30`,
                                      color,
                                    }}
                                  >
                                    {(feed.label || "?")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white truncate">
                                      {feed.label || "Untitled"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">
                                      {feed.feed_url}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a
                                      href={feed.feed_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1 text-muted-foreground hover:text-white transition-colors"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                    <button
                                      onClick={() => removeFeed.mutate(feed.id)}
                                      disabled={
                                        removeFeed.isPending &&
                                        removeFeed.variables === feed.id
                                      }
                                      className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
                                    >
                                      {removeFeed.isPending &&
                                      removeFeed.variables === feed.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </motion.div>
                              );
                            })
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Footer Info */}
                      <div className="px-5 py-3 border-t border-white/5 shrink-0">
                        <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
                          Weekly email digest settings are in your{" "}
                          <button
                            onClick={() => navigate("/profile")}
                            className="text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-2"
                          >
                            Profile
                          </button>{" "}
                          page.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
