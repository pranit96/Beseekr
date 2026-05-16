import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  ExternalLink,
  MessageSquare,
  TrendingUp,
  Globe,
  ArrowLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { resumeApi } from "@/api/resume";
import { toast } from "@/hooks/use-toast";

import { GlobalFooter } from "@/components/GlobalFooter";

export default function CareerResearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const data = await resumeApi.performCareerResearch(query);
      setResults(data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Research failed",
        description: "Could not fetch market intelligence. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#09090b] text-zinc-100 overflow-hidden">
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-12 py-12 px-4 sm:px-6 lg:px-8">
          {/* TOP NAV */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard/hired")}
              className="text-zinc-500 hover:text-white hover:bg-white/5 rounded-2xl gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Portal
            </Button>
            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              Market Intelligence v1.0
            </Badge>
          </div>

          {/* HEADER & SEARCH */}
          <div className="space-y-8 text-center max-w-2xl mx-auto">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter">
                Deep <span className="text-indigo-400">Company Research.</span>
              </h1>
              <p className="text-zinc-500 font-medium">
                Search for interview experiences, salary discussions, and
                company culture across Reddit, HN, and the web.
              </p>
            </div>

            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search e.g. 'Google Software Engineer Interview'..."
                className="w-full h-16 pl-14 pr-32 bg-white/[0.03] border-white/[0.08] focus:border-indigo-500/50 rounded-[24px] text-lg font-medium placeholder:text-zinc-600 transition-all shadow-2xl"
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="absolute right-2 top-2 bottom-2 bg-white text-black hover:bg-zinc-200 rounded-[18px] px-6 font-black uppercase text-xs tracking-widest transition-all active:scale-95"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Analyze"
                )}
              </Button>
            </form>
          </div>

          {/* RESULTS SECTION */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 animate-pulse"
              >
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-64 bg-white/[0.02] border border-white/[0.08] rounded-[32px]"
                  />
                ))}
              </motion.div>
            ) : results ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12 pt-8 pb-12"
              >
                {/* REDDIT SECTION */}
                {results.reddit && results.reddit.posts?.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FF4500]/10 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-[#FF4500]" />
                      </div>
                      <h2 className="text-xl font-bold tracking-tight">
                        Reddit Discussions
                      </h2>
                      <Badge
                        variant="outline"
                        className="text-[10px] opacity-60 uppercase"
                      >
                        {results.reddit.totalPosts} threads
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.reddit.posts.slice(0, 4).map((post: any) => (
                        <Card
                          key={post.id}
                          className="p-6 bg-white/[0.02] border-white/[0.08] rounded-[24px] hover:border-white/20 transition-all group"
                        >
                          <div className="space-y-4">
                            <div className="flex justify-between items-start gap-4">
                              <h3 className="font-bold text-sm leading-tight line-clamp-2 group-hover:text-indigo-400 transition-colors">
                                {post.title}
                              </h3>
                              <a
                                href={post.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-zinc-600 hover:text-white"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-emerald-500" />{" "}
                                {post.ups} upvotes
                              </span>
                              <span>r/{post.subreddit}</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* WEB SECTION */}
                {results.web && results.web.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-sky-400" />
                      </div>
                      <h2 className="text-xl font-bold tracking-tight">
                        Web Intelligence
                      </h2>
                    </div>
                    <div className="space-y-4">
                      {results.web.map((res: any, idx: number) => (
                        <a
                          key={idx}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group"
                        >
                          <Card className="p-6 bg-white/[0.02] border-white/[0.08] rounded-[24px] group-hover:border-sky-500/30 group-hover:bg-sky-500/[0.02] transition-all">
                            <div className="flex items-start justify-between gap-6">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-sky-500">
                                    {res.source}
                                  </span>
                                  <ChevronRight className="w-3 h-3 text-zinc-700" />
                                </div>
                                <h3 className="font-bold text-lg leading-tight text-zinc-200 group-hover:text-white transition-colors">
                                  {res.title}
                                </h3>
                                <p className="text-zinc-500 text-sm line-clamp-2 leading-relaxed">
                                  {res.snippet}
                                </p>
                              </div>
                              <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center group-hover:bg-sky-500/10 transition-all">
                                <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-sky-400" />
                              </div>
                            </div>
                          </Card>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* EMPTY STATE */}
                {!results.reddit?.posts?.length && !results.web?.length && (
                  <div className="py-24 text-center space-y-4">
                    <Zap className="w-12 h-12 text-zinc-800 mx-auto" />
                    <p className="text-zinc-600 font-medium italic">
                      No deep insights found for this query. Try adjusting your
                      keywords.
                    </p>
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </main>

      <div className="flex-shrink-0">
        <GlobalFooter>
          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <Zap className="w-3 h-3 text-indigo-400" />
            AI Intelligence Engine Ready
          </div>
        </GlobalFooter>
      </div>
    </div>
  );
}
