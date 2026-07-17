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
  ToggleLeft,
  ToggleRight,
  AlignLeft,
  BookOpen,
  Smile,
  CheckCircle2,
  ExternalLink,
  X,
} from "lucide-react";

type DigestStyle = "bullets" | "narrative" | "eli5";

const STYLE_OPTIONS: {
  key: DigestStyle;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    key: "bullets",
    label: "Bullet Points",
    description: "Tight, scannable summaries. Perfect for busy mornings.",
    icon: AlignLeft,
    color: "border-blue-500/40 bg-blue-500/5 text-blue-400",
  },
  {
    key: "narrative",
    label: "Narrative",
    description: "Flowing paragraphs — like a friend explaining the week.",
    icon: BookOpen,
    color: "border-violet-500/40 bg-violet-500/5 text-violet-400",
  },
  {
    key: "eli5",
    label: "ELI5",
    description: "Explain Like I'm Five. Simple, fun, and delightful.",
    icon: Smile,
    color: "border-amber-500/40 bg-amber-500/5 text-amber-400",
  },
];

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
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Edit state
  const [emailInput, setEmailInput] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<DigestStyle>("bullets");
  const [enabled, setEnabled] = useState(true);

  // Feed add state
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedLabel, setNewFeedLabel] = useState("");
  const [isAddingFeed, setIsAddingFeed] = useState(false);
  const [deletingFeedId, setDeletingFeedId] = useState<string | null>(null);

  // Preview state
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);

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
        setEmailInput(pRes.data.email || "");
        setSelectedStyle(pRes.data.style || "bullets");
        setEnabled(pRes.data.enabled ?? true);
      } else {
        setEmailInput(user?.email || "");
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
  }, [user, toast]);

  useEffect(() => {
    if (user) loadAll();
  }, [user, loadAll]);

  const handleSavePrefs = async () => {
    if (!emailInput.trim()) {
      return toast({ title: "Error", description: "Enter your email address", variant: "destructive" });
    }
    setIsSavingPrefs(true);
    try {
      const res = await apiClient.upsertDigestPreferences({
        email: emailInput.trim(),
        style: selectedStyle,
        enabled,
      });
      if (res.success && res.data) {
        setPrefs(res.data);
        toast({ title: "Success", description: "Preferences saved successfully" });
      } else {
        toast({ title: "Failed", description: res.error || "Failed to save preferences", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save preferences", variant: "destructive" });
    } finally {
      setIsSavingPrefs(false);
    }
  };

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
      const res = await apiClient.previewDigest(selectedStyle);
      if (res.success && res.data) {
        if (!res.data.html) {
          toast({ title: "Information", description: res.data.message || "No new articles found this week" });
        } else {
          setPreviewHtml(res.data.html);
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
    if (!prefs?.email) return toast({ title: "Error", description: "Save your email preferences first", variant: "destructive" });
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
      <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
        <GlobalHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <GlobalHeader />

      <main className="flex-1 overflow-y-auto px-4 py-8 max-w-2xl mx-auto w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <Mail className="h-5 w-5 text-indigo-400" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Weekly Digest</h1>
            {prefs?.enabled && (
              <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-400">
                <CheckCircle2 className="h-3 w-3" /> Active
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground pl-12">
            Every Sunday at 10:00 AM IST, receive a personalised AI summary of your saved RSS/Atom feeds.
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Preferences Card */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <h2 className="text-sm font-semibold text-foreground mb-4">Delivery settings</h2>

            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/40">
              <div>
                <p className="text-sm font-medium text-foreground">Enable digest</p>
                <p className="text-xs text-muted-foreground">Receive weekly emails every Sunday</p>
              </div>
              <button
                onClick={() => setEnabled((v) => !v)}
                className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
              >
                {enabled ? (
                  <ToggleRight className="h-8 w-8 text-indigo-400" />
                ) : (
                  <ToggleLeft className="h-8 w-8" />
                )}
              </button>
            </div>

            <div className="mb-4">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Delivery email
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="text-sm rounded-lg"
              />
            </div>

            <div className="mb-5">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Summary style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {STYLE_OPTIONS.map(({ key, label, description, icon: Icon, color }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedStyle(key)}
                    className={`relative rounded-xl border p-3 text-left transition-all ${
                      selectedStyle === key
                        ? `${color} border-opacity-100`
                        : "border-border bg-muted/20 hover:bg-muted/40"
                    }`}
                  >
                    <Icon className={`h-4 w-4 mb-1.5 ${selectedStyle === key ? "" : "text-muted-foreground"}`} />
                    <p className={`text-xs font-semibold ${selectedStyle === key ? "" : "text-foreground"}`}>
                      {label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{description}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
              onClick={handleSavePrefs}
              disabled={isSavingPrefs}
            >
              {isSavingPrefs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Preferences
            </Button>
          </motion.section>

          {/* Feeds Card */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <h2 className="text-sm font-semibold text-foreground mb-4">
              RSS Feeds
              {feeds.length > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">({feeds.length})</span>
              )}
            </h2>

            <div className="flex gap-2 mb-3">
              <Input
                placeholder="https://example.com/feed.xml"
                value={newFeedUrl}
                onChange={(e) => setNewFeedUrl(e.target.value)}
                className="text-sm font-mono flex-1 rounded-lg"
                onKeyDown={(e) => e.key === "Enter" && handleAddFeed()}
              />
              <Input
                placeholder="Label"
                value={newFeedLabel}
                onChange={(e) => setNewFeedLabel(e.target.value)}
                className="text-sm w-28 rounded-lg"
              />
              <Button
                onClick={() => handleAddFeed()}
                disabled={isAddingFeed || !newFeedUrl.trim()}
                size="sm"
                className="gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shrink-0"
              >
                {isAddingFeed ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </Button>
            </div>

            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Suggested feeds:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_FEEDS.filter((s) => !feeds.some((f) => f.feed_url === s.url)).map((s) => (
                  <button
                    key={s.url}
                    onClick={() => handleAddFeed(s.url, s.label)}
                    disabled={isAddingFeed}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-colors disabled:opacity-40"
                  >
                    <Rss className="h-2.5 w-2.5" />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {feeds.length === 0 ? (
                <div className="flex items-center justify-center py-6 text-center">
                  <p className="text-xs text-muted-foreground">No RSS feeds added yet.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {feeds.map((feed) => (
                    <motion.div
                      key={feed.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/10 px-3 py-2 group"
                    >
                      <Rss className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {feed.label && (
                          <p className="text-xs font-semibold text-foreground">{feed.label}</p>
                        )}
                        <p className="text-xs text-muted-foreground truncate">{feed.feed_url}</p>
                      </div>
                      <a
                        href={feed.feed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => handleRemoveFeed(feed.id)}
                        disabled={deletingFeedId === feed.id}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all focus:outline-none"
                      >
                        {deletingFeedId === feed.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Actions Card */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <h2 className="text-sm font-semibold text-foreground mb-1">Preview & Send</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Generate a live preview from your RSS articles, or trigger an immediate test send to your email.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-1.5 rounded-lg"
                onClick={handlePreview}
                disabled={isGeneratingPreview || !feeds.length}
              >
                {isGeneratingPreview ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                {isGeneratingPreview ? "Generating Preview…" : "Preview Digest"}
              </Button>
              <Button
                className="flex-1 gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                onClick={handleSendNow}
                disabled={isSending || !prefs}
              >
                {isSending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {isSending ? "Sending…" : "Send to Me Now"}
              </Button>
            </div>
          </motion.section>

          {/* HTML Preview iframe */}
          <AnimatePresence>
            {previewHtml && (
              <motion.section
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl border border-border overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-card">
                  <span className="text-xs font-semibold text-foreground">Email preview</span>
                  <button
                    onClick={() => setPreviewHtml(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <iframe
                  srcDoc={previewHtml}
                  title="Digest email preview"
                  className="w-full bg-white"
                  style={{ height: "600px", border: "none" }}
                  sandbox="allow-same-origin"
                />
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
