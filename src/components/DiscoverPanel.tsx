import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAddDigestFeed } from "@/hooks/use-api-queries";
import {
  Compass,
  Search,
  Loader2,
  Plus,
  Check,
  ChevronLeft,
  Globe,
  AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CatalogEntry {
  id: string;
  label: string;
  icon?: string;
  color: string;
}

interface DiscoverFeed {
  name: string;
  url: string;
  category?: string;
}

interface Props {
  /** Already-added feed URLs so we can show "Added" state */
  existingFeedUrls: string[];
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DiscoverPanel({ existingFeedUrls, onClose }: Props) {
  const [view, setView] = useState<"catalog" | "feeds">("catalog");
  const [activeTab, setActiveTab] = useState<"categories" | "countries">(
    "categories",
  );
  const [selected, setSelected] = useState<{
    type: "category" | "country";
    entry: CatalogEntry;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [added, setAdded] = useState<Set<string>>(new Set());

  const addFeed = useAddDigestFeed();

  // ── Catalog (static, cached forever during the session) ───────────────────
  const { data: catalog, isLoading: isLoadingCatalog } = useQuery({
    queryKey: ["digest", "discover", "catalog"],
    queryFn: () => apiClient.digestDiscoverCatalog(),
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    select: (res) => res.data,
  });

  // ── Feeds for selected category/country ──────────────────────────────────
  const {
    data: feedsRaw,
    isLoading: isLoadingFeeds,
    isError,
  } = useQuery({
    queryKey: [
      "digest",
      "discover",
      "feeds",
      selected?.type,
      selected?.entry.id,
    ],
    queryFn: () =>
      apiClient.digestDiscoverFeeds(selected!.type, selected!.entry.id),
    enabled: !!selected,
    staleTime: 30 * 60 * 1000, // 30 min — GitHub rarely changes
    gcTime: 60 * 60 * 1000,
    select: (res) => res.data ?? [],
  });

  const feeds: DiscoverFeed[] = feedsRaw ?? [];

  const handleSelect = (type: "category" | "country", entry: CatalogEntry) => {
    setSelected({ type, entry });
    setSearch("");
    setView("feeds");
  };

  const handleAdd = (feed: DiscoverFeed) => {
    if (added.has(feed.url) || existingFeedUrls.includes(feed.url)) return;
    addFeed.mutate(
      { feed_url: feed.url, label: feed.name },
      {
        onSuccess: () => {
          setAdded((prev) => new Set([...prev, feed.url]));
        },
      },
    );
  };

  const handleAddAll = () => {
    const toAdd = feeds.filter(
      (f) => !added.has(f.url) && !existingFeedUrls.includes(f.url),
    );
    toAdd.forEach((f) => handleAdd(f));
  };

  const filteredFeeds = feeds.filter(
    (f) =>
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.category || "").toLowerCase().includes(search.toLowerCase()),
  );

  const allAdded =
    feeds.length > 0 &&
    feeds.every((f) => added.has(f.url) || existingFeedUrls.includes(f.url));

  const newlyAddedCount = feeds.filter(
    (f) => added.has(f.url) && !existingFeedUrls.includes(f.url),
  ).length;

  // Group feeds by category for display
  const groupedFeeds = filteredFeeds.reduce<Record<string, DiscoverFeed[]>>(
    (acc, feed) => {
      const key = feed.category || "General";
      if (!acc[key]) acc[key] = [];
      acc[key].push(feed);
      return acc;
    },
    {},
  );

  return (
    <div className="flex flex-col h-full bg-[#0a0c16]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          {view === "feeds" && (
            <button
              onClick={() => {
                setView("catalog");
                setSelected(null);
              }}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/[0.06] transition-colors mr-1"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: selected
                ? `${selected.entry.color}20`
                : "#6366f120",
              border: `1px solid ${selected?.entry.color ?? "#6366f1"}30`,
            }}
          >
            {view === "feeds" && selected?.entry.icon ? (
              <span className="text-base">{selected.entry.icon}</span>
            ) : (
              <Compass className="h-4 w-4 text-indigo-400" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">
              {view === "feeds" && selected
                ? selected.entry.label
                : "Discover Feeds"}
            </h2>
            <p className="text-[10px] text-muted-foreground">
              {view === "feeds"
                ? isLoadingFeeds
                  ? "Loading…"
                  : `${feeds.length} feeds available`
                : "Browse curated RSS sources"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[10px] font-bold text-muted-foreground hover:text-white transition-colors"
        >
          ✕ Close
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* ── CATALOG VIEW ─────────────────────────────── */}
        {view === "catalog" && (
          <motion.div
            key="catalog"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto"
          >
            {/* Tab switcher */}
            <div className="px-5 pt-4 pb-3">
              <div className="flex gap-1 bg-white/[0.03] border border-white/[0.05] rounded-xl p-1">
                {(["categories", "countries"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all duration-200 ${
                      activeTab === tab
                        ? "bg-indigo-600/25 text-indigo-300 border border-indigo-500/30"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {isLoadingCatalog ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
              </div>
            ) : (
              <div className="px-5 pb-5">
                {activeTab === "categories" && (
                  <div className="grid grid-cols-2 gap-2">
                    {(catalog?.categories ?? []).map((cat, i) => (
                      <motion.button
                        key={cat.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.025 }}
                        onClick={() => handleSelect("category", cat)}
                        className="group flex items-center gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-3 hover:border-white/[0.1] hover:bg-white/[0.05] transition-all text-left"
                      >
                        <span
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-base shrink-0"
                          style={{
                            backgroundColor: `${cat.color}18`,
                            border: `1px solid ${cat.color}25`,
                          }}
                        >
                          {cat.icon}
                        </span>
                        <span className="text-xs font-semibold text-white truncate">
                          {cat.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                )}

                {activeTab === "countries" && (
                  <div className="flex flex-col gap-1.5">
                    {(catalog?.countries ?? []).map((country, i) => (
                      <motion.button
                        key={country.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => handleSelect("country", country)}
                        className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 hover:border-white/[0.1] hover:bg-white/[0.05] transition-all text-left"
                      >
                        <span className="text-lg">
                          {country.label.split(" ")[0]}
                        </span>
                        <span className="text-xs font-semibold text-white">
                          {country.label.split(" ").slice(1).join(" ")}
                        </span>
                        <span className="ml-auto text-[10px] text-muted-foreground">
                          Local news →
                        </span>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ── FEEDS VIEW ───────────────────────────────── */}
        {view === "feeds" && (
          <motion.div
            key="feeds"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Search + Add All bar */}
            <div className="px-5 pt-4 pb-3 space-y-2.5 border-b border-white/[0.05]">
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2">
                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter feeds…"
                  className="flex-1 bg-transparent text-xs text-white placeholder:text-muted-foreground/60 focus:outline-none"
                />
              </div>

              {!isLoadingFeeds && feeds.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    {newlyAddedCount > 0 && (
                      <span className="text-indigo-400 font-bold">
                        {newlyAddedCount} added ·{" "}
                      </span>
                    )}
                    {
                      feeds.filter(
                        (f) =>
                          !existingFeedUrls.includes(f.url) &&
                          !added.has(f.url),
                      ).length
                    }{" "}
                    available
                  </span>
                  <button
                    onClick={handleAddAll}
                    disabled={allAdded || addFeed.isPending}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 disabled:opacity-40 transition-colors"
                  >
                    {allAdded ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    {allAdded ? "All added" : "Add all"}
                  </button>
                </div>
              )}
            </div>

            {/* Feed list */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {isLoadingFeeds ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center"
                  >
                    <Globe className="h-6 w-6 text-indigo-400" />
                  </motion.div>
                  <p className="text-xs text-muted-foreground">
                    Fetching feeds from GitHub…
                  </p>
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <AlertCircle className="h-8 w-8 text-red-400/60" />
                  <p className="text-xs font-semibold text-white">
                    Failed to load feeds
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    This category may not have an OPML file yet
                  </p>
                </div>
              ) : Object.keys(groupedFeeds).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-xs font-semibold text-white mb-1">
                    No feeds found
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Try a different search
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedFeeds).map(([category, catFeeds]) => (
                    <div key={category}>
                      {/* Category label — only show if more than one group */}
                      {Object.keys(groupedFeeds).length > 1 && (
                        <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1.5">
                          {category}
                        </p>
                      )}
                      <div className="space-y-1">
                        <AnimatePresence>
                          {catFeeds.map((feed, i) => {
                            const isExisting = existingFeedUrls.includes(
                              feed.url,
                            );
                            const isJustAdded = added.has(feed.url);
                            const isAdded = isExisting || isJustAdded;

                            return (
                              <motion.div
                                key={feed.url}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.02 }}
                                className="group flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-3.5 py-2.5 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-white truncate">
                                    {feed.name}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground/60 font-mono truncate mt-0.5">
                                    {feed.url}
                                  </p>
                                </div>

                                <button
                                  onClick={() => handleAdd(feed)}
                                  disabled={isAdded || addFeed.isPending}
                                  className={`shrink-0 h-7 rounded-lg flex items-center gap-1.5 px-2.5 text-[10px] font-bold transition-all duration-200 ${
                                    isAdded
                                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 cursor-default"
                                      : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/25 hover:text-indigo-300"
                                  }`}
                                >
                                  {isAdded ? (
                                    <>
                                      <Check className="h-3 w-3" /> Added
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-3 w-3" /> Add
                                    </>
                                  )}
                                </button>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
