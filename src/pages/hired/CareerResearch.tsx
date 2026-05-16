import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  ExternalLink,
  MessageSquare,
  TrendingUp,
  Globe,
  Sparkles,
  Zap,
  ArrowUpRight,
  ChevronUp,
  Hash,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { resumeApi, ResearchSummary } from "@/api/resume";
import { toast } from "@/hooks/use-toast";
import HiredShell from "@/pages/hired/HiredShell";

const QUICK_SEARCHES = [
  "Google L4 Software Engineer",
  "Accenture interview",
  "Amazon SDE2 culture",
  "Microsoft senior PM salary",
];

export default function CareerResearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [summary, setSummary] = useState<ResearchSummary | null>(null);
  const [searchedQuery, setSearchedQuery] = useState("");

  const handleSearch = async (q?: string) => {
    const finalQuery = q || query;
    if (!finalQuery.trim()) return;
    if (q) setQuery(q);

    setIsLoading(true);
    setResults(null);
    setSummary(null);
    setSearchedQuery(finalQuery);

    try {
      const data = await resumeApi.performCareerResearch(finalQuery);
      setResults(data.data);
      if (
        data.data &&
        (data.data.reddit?.posts?.length > 0 || data.data.web?.length > 0)
      ) {
        const sumData = await resumeApi.summarizeResearch({
          reddit: data.data.reddit,
          web: data.data.web,
        });
        setSummary(sumData);
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Research failed",
        description: "Could not fetch market intelligence. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasResults =
    results && (results.reddit?.posts?.length > 0 || results.web?.length > 0);

  return (
    <HiredShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        {/* ── HERO SEARCH ─────────────────────────────────────────── */}
        <div
          className={`transition-all duration-500 ${hasResults || isLoading ? "pt-6 pb-8" : "pt-16 pb-12"}`}
        >
          <div
            className={`text-center transition-all duration-500 ${hasResults || isLoading ? "mb-6" : "mb-8"}`}
          >
            {!hasResults && !isLoading && (
              <>
                <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-300">
                    AI-powered · Reddit + HN + Web
                  </span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-3">
                  Deep{" "}
                  <span className="text-indigo-400">Company Research.</span>
                </h1>
                <p className="text-zinc-500 text-sm font-medium max-w-md mx-auto leading-relaxed">
                  Real interview experiences, salary data, and culture signals —
                  sourced from Reddit, HN, and the web.
                </p>
              </>
            )}

            {/* Search bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="relative group max-w-2xl mx-auto"
            >
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. 'Google Software Engineer Interview' or 'Stripe culture'"
                className="w-full h-14 pl-14 pr-36 bg-white/[0.03] border-white/[0.08] focus:border-indigo-500/40 rounded-2xl text-base font-medium placeholder:text-zinc-600 transition-all"
              />
              <Button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 font-bold text-xs tracking-wider transition-all active:scale-95"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Analyze"
                )}
              </Button>
            </form>

            {/* Quick searches */}
            {!hasResults && !isLoading && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                  Try:
                </span>
                {QUICK_SEARCHES.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSearch(q)}
                    className="text-xs text-zinc-500 hover:text-zinc-200 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] rounded-full px-3 py-1 transition-all font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── LOADING SKELETON ─────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* AI summary skeleton */}
              <div className="h-48 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-28 bg-white/[0.02] border border-white/[0.06] rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── RESULTS ──────────────────────────────────────────────── */}
          {!isLoading && results && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 pb-8"
            >
              {/* Result header */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.05]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                  Results for "{searchedQuery}"
                </span>
                <div className="h-px flex-1 bg-white/[0.05]" />
              </div>

              {/* ── AI SUMMARY ───────────────────────────────────────── */}
              {summary && (
                <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent p-6">
                  {/* BG decoration */}
                  <div className="absolute -right-8 -top-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative space-y-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <h2 className="text-sm font-black uppercase tracking-widest text-indigo-300">
                        AI Executive Summary
                      </h2>
                    </div>

                    <p className="text-zinc-200 leading-relaxed font-medium text-sm">
                      {summary.key_insight}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-black/20 rounded-xl p-4 space-y-2.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                          Interview Themes
                        </span>
                        <ul className="space-y-1.5">
                          {summary.interview_themes.map((theme, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-xs text-zinc-300 font-medium"
                            >
                              <span className="text-indigo-500 mt-0.5 shrink-0">
                                ▸
                              </span>
                              {theme}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-black/20 rounded-xl p-4 space-y-2.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                          Culture Signals
                        </span>
                        <ul className="space-y-1.5">
                          {summary.culture_signals.map((signal, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-xs text-zinc-300 font-medium"
                            >
                              <span className="text-indigo-500 mt-0.5 shrink-0">
                                ▸
                              </span>
                              {signal}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2 border-t border-indigo-500/15">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-xs font-medium text-zinc-400">
                          Difficulty:{" "}
                          <span className="text-white font-bold">
                            {summary.difficulty_rating}
                          </span>
                        </span>
                      </div>
                      {summary.salary_range && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-xs font-medium text-zinc-400">
                            Salary:{" "}
                            <span className="text-white font-bold">
                              {summary.salary_range}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── REDDIT ────────────────────────────────────────────── */}
              {results.reddit?.posts?.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
                    </div>
                    <h2 className="text-sm font-bold text-white">
                      Reddit Discussions
                    </h2>
                    <span className="text-[10px] font-bold text-zinc-600 bg-white/[0.03] border border-white/[0.07] rounded-full px-2 py-0.5">
                      {results.reddit.totalPosts} threads
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {results.reddit.posts
                      .slice(0, 6)
                      .map((post: any, i: number) => (
                        <motion.a
                          key={post.id}
                          href={post.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="group flex flex-col justify-between bg-white/[0.02] border border-white/[0.07] hover:border-orange-500/25 hover:bg-orange-500/[0.02] rounded-2xl p-4 transition-all duration-200"
                        >
                          <div className="space-y-2 mb-3">
                            <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
                              r/{post.subreddit}
                            </p>
                            <h3 className="text-sm font-semibold text-zinc-200 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                              {post.title}
                            </h3>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-600">
                              <span className="flex items-center gap-1">
                                <ChevronUp className="w-3 h-3 text-emerald-600" />
                                {post.ups?.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                {post.num_comments}
                              </span>
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-orange-400 transition-colors" />
                          </div>
                        </motion.a>
                      ))}
                  </div>
                </div>
              )}

              {/* ── WEB ───────────────────────────────────────────────── */}
              {results.web?.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                      <Globe className="w-3.5 h-3.5 text-sky-400" />
                    </div>
                    <h2 className="text-sm font-bold text-white">
                      Web Intelligence
                    </h2>
                    <span className="text-[10px] font-bold text-zinc-600 bg-white/[0.03] border border-white/[0.07] rounded-full px-2 py-0.5">
                      {results.web.length} sources
                    </span>
                  </div>

                  <div className="space-y-2">
                    {results.web.map((res: any, idx: number) => (
                      <motion.a
                        key={idx}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="group flex items-start gap-4 bg-white/[0.02] border border-white/[0.07] hover:border-sky-500/25 hover:bg-sky-500/[0.02] rounded-2xl p-4 transition-all duration-200"
                      >
                        <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:border-sky-500/25 transition-colors">
                          <Globe className="w-4 h-4 text-zinc-600 group-hover:text-sky-400 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-sky-500/70">
                              {res.source}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors leading-tight line-clamp-1 mb-1">
                            {res.title}
                          </h3>
                          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                            {res.snippet}
                          </p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-zinc-700 group-hover:text-sky-400 transition-colors shrink-0 mt-0.5" />
                      </motion.a>
                    ))}
                  </div>
                </div>
              )}

              {/* ── EMPTY ─────────────────────────────────────────────── */}
              {!hasResults && (
                <div className="py-20 text-center space-y-3">
                  <Zap className="w-10 h-10 text-zinc-800 mx-auto" />
                  <p className="text-zinc-600 font-medium text-sm">
                    No results for "{searchedQuery}". Try a more specific query.
                  </p>
                  <button
                    onClick={() => {
                      setResults(null);
                      setQuery("");
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                  >
                    Clear & search again →
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </HiredShell>
  );
}
