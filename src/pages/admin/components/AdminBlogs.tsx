import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import {
  Sparkles,
  Calendar,
  Heart,
  RefreshCw,
  Search,
  Loader2,
  AlertTriangle,
  User,
  Image as ImageIcon,
  BookOpen,
  CheckCircle2,
  Trash2,
  ExternalLink,
  ChevronRight,
  Clock,
  LayoutGrid
} from "lucide-react";

interface BlogConfig {
  id: string;
  day_index: number;
  day_name: string;
  topic: string;
  keyword: string;
  mood: string;
  narrator: string;
  narrator_extended: boolean;
  unsplash_query?: string;
  author_name?: string;
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  topic?: string;
  publish_date?: string;
  read_time?: string;
  word_count?: number;
  likes_count: number;
  author?: string;
  image_url?: string | null;
  image_alt?: string;
}

const DAYS_OF_WEEK = [
  { index: 0, name: "Sunday" },
  { index: 1, name: "Monday" },
  { index: 2, name: "Tuesday" },
  { index: 3, name: "Wednesday" },
  { index: 4, name: "Thursday" },
  { index: 5, name: "Friday" },
  { index: 6, name: "Saturday" },
];

export function AdminBlogs() {
  const queryClient = useQueryClient();
  const [selectedDayIndex, setSelectedDayIndex] = useState<string>("0");
  const [customTopic, setCustomTopic] = useState("");
  const [customKeyword, setCustomKeyword] = useState("");
  const [customMood, setCustomMood] = useState("");
  const [customNarrator, setCustomNarrator] = useState("");
  const [customAuthorName, setCustomAuthorName] = useState("");
  const [customUnsplashQuery, setCustomUnsplashQuery] = useState("");
  const [forceGenerate, setForceGenerate] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStage, setGenStage] = useState<string>("");
  const [genElapsedTime, setGenElapsedTime] = useState(0);
  
  const [sortBy, setSortBy] = useState<"date" | "likes">("likes");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch standard configurations from the backend
  const { data: configs = [], isLoading: loadingConfigs } = useQuery<BlogConfig[]>({
    queryKey: ["admin", "blogConfigs"],
    queryFn: async () => {
      const response = await apiClient.getBlogConfigs();
      return response.data || [];
    },
  });

  // Fetch blogs list for analytics with likes count
  const { data: blogsResponse, isLoading: loadingBlogs, refetch: refetchBlogs } = useQuery({
    queryKey: ["admin", "blogsList", sortBy, searchQuery],
    queryFn: async () => {
      const response = await apiClient.get<any>("/api/blogs", {
        params: {
          sort: sortBy,
          search: searchQuery || undefined,
          limit: 100,
        },
      });
      return response;
    },
  });

  const blogs: BlogPost[] = blogsResponse?.data || [];
  const source = blogsResponse?.source || "db"; // 'cache' or 'db'

  // Load selected config details into custom overrides when day changes
  const handleDaySelect = (indexStr: string) => {
    setSelectedDayIndex(indexStr);
    const index = parseInt(indexStr);
    const matched = configs.find((c) => c.day_index === index);
    if (matched) {
      setCustomTopic(matched.topic || "");
      setCustomKeyword(matched.keyword || "");
      setCustomMood(matched.mood || "");
      setCustomNarrator(matched.narrator || "");
      setCustomAuthorName(matched.author_name || "");
      setCustomUnsplashQuery(matched.unsplash_query || "");
    }
  };

  // Generate Blog Post Mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      setGenStage("Initializing generation pipeline...");
      setGenElapsedTime(0);

      // Start elapsed timer
      const interval = setInterval(() => {
        setGenElapsedTime((prev) => prev + 1);
      }, 1000);

      // Simulated state transitions for user feedback during the long LLM generation
      const stages = [
        { time: 5, stage: "Stage 1/4: Analyzing topic & generating content outline..." },
        { time: 25, stage: "Stage 2/4: Expanding sections & drafting 2000+ words..." },
        { time: 70, stage: "Stage 3/4: Polishing draft & applying SEO meta optimization..." },
        { time: 105, stage: "Stage 4/4: Fetching stock cover photo & scheduling newsletter campaign..." },
      ];

      const stageTracker = setInterval(() => {
        const timePassed = genElapsedTime;
        const current = stages.find((s) => timePassed >= s.time);
        if (current) {
          setGenStage(current.stage);
        }
      }, 1000);

      try {
        const res = await apiClient.triggerBlogGeneration({
          day: selectedDayIndex ? parseInt(selectedDayIndex) : undefined,
          customTopic: customTopic.trim() || undefined,
          customKeyword: customKeyword.trim() || undefined,
          customMood: customMood.trim() || undefined,
          customNarrator: customNarrator.trim() || undefined,
          customAuthorName: customAuthorName.trim() || undefined,
          customUnsplashQuery: customUnsplashQuery.trim() || undefined,
          force: forceGenerate,
        });
        
        clearInterval(interval);
        clearInterval(stageTracker);
        return res;
      } catch (err) {
        clearInterval(interval);
        clearInterval(stageTracker);
        throw err;
      }
    },
    onSuccess: (data) => {
      setIsGenerating(false);
      setGenStage("");
      queryClient.invalidateQueries({ queryKey: ["admin", "blogsList"] });
      
      if (data?.success && data?.data) {
        toast({
          title: "Blog Post Published!",
          description: `"${data.data.title}" was successfully generated and distributed via newsletter.`,
        });
        // Reset form custom overrides
        setCustomTopic("");
        setCustomKeyword("");
        setCustomMood("");
        setCustomNarrator("");
        setCustomAuthorName("");
        setCustomUnsplashQuery("");
      } else {
        toast({
          title: "Skipped / Warning",
          description: data?.message || "Generation was skipped.",
          variant: "default",
        });
      }
    },
    onError: (error: any) => {
      setIsGenerating(false);
      setGenStage("");
      toast({
        title: "Generation Failed",
        description: error.message || "An error occurred during blog post generation.",
        variant: "destructive",
      });
    },
  });

  // Clear Cache Mutation
  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      return apiClient.clearBlogCache();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blogsList"] });
      refetchBlogs();
      toast({
        title: "Cache Cleared",
        description: "Blog list and post caches have been successfully purged from Redis.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Purge Failed",
        description: error.message || "Failed to clear blog cache.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
      {/* ── LEFT PANEL: BLOG GENERATION FORM ──────────────────────────────── */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="bg-[#18181b]/30 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl flex flex-col gap-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-2 text-red-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">AI Content Suite</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Manual Blog Creator</h2>
            <p className="text-zinc-500 text-xs mt-1">
              Configure parameters to manually trigger the blog post pipeline. The system writes 2000+ words, integrates images, optimizes SEO, and schedules email blasts.
            </p>
          </div>

          <hr className="border-white/[0.06]" />

          {/* Form Fields */}
          <div className="flex flex-col gap-4">
            {/* Scheduled Day selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Select Base Day Template
              </label>
              {loadingConfigs ? (
                <div className="h-9 bg-white/[0.03] rounded-lg animate-pulse" />
              ) : (
                <select
                  value={selectedDayIndex}
                  onChange={(e) => handleDaySelect(e.target.value)}
                  className="h-9 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-1 text-xs text-white outline-none focus:border-red-500/50"
                >
                  <option value="">-- Direct Generation (No Day Template) --</option>
                  {configs && configs.length > 0 ? (
                    configs.map((config) => (
                      <option key={config.id} value={config.day_index}>
                        Day {config.day_index} ({config.day_name}) — {config.topic.slice(0, 45)}...
                      </option>
                    ))
                  ) : (
                    DAYS_OF_WEEK.map((day) => (
                      <option key={day.index} value={day.index}>
                        Day {day.index} ({day.name})
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

            {/* Custom overrides expander header */}
            <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-bold mt-2">
              <LayoutGrid className="w-3.5 h-3.5 text-red-400/80" />
              <span>Customize Configuration Overrides</span>
            </div>

            {/* Topic Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Custom Topic (Recommended)
              </label>
              <Input
                placeholder="e.g. AI Agents in Healthcare Systems"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="h-9 bg-zinc-950/60 border-white/10 text-xs text-white placeholder:text-zinc-600 focus-visible:ring-red-500/30"
              />
            </div>

            {/* Keyword Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Primary SEO Keyword
              </label>
              <Input
                placeholder="e.g. ai healthcare"
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                className="h-9 bg-zinc-950/60 border-white/10 text-xs text-white placeholder:text-zinc-600 focus-visible:ring-red-500/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Mood Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Tone / Mood
                </label>
                <Input
                  placeholder="e.g. informative, bold"
                  value={customMood}
                  onChange={(e) => setCustomMood(e.target.value)}
                  className="h-9 bg-zinc-950/60 border-white/10 text-xs text-white placeholder:text-zinc-600 focus-visible:ring-red-500/30"
                />
              </div>

              {/* Author name Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Author Pen Name
                </label>
                <Input
                  placeholder="e.g. John Doe"
                  value={customAuthorName}
                  onChange={(e) => setCustomAuthorName(e.target.value)}
                  className="h-9 bg-zinc-950/60 border-white/10 text-xs text-white placeholder:text-zinc-600 focus-visible:ring-red-500/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Unsplash query */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Unsplash Query
                </label>
                <Input
                  placeholder="e.g. stethoscope computer"
                  value={customUnsplashQuery}
                  onChange={(e) => setCustomUnsplashQuery(e.target.value)}
                  className="h-9 bg-zinc-950/60 border-white/10 text-xs text-white placeholder:text-zinc-600 focus-visible:ring-red-500/30"
                />
              </div>

              {/* Duplicate override force toggle */}
              <div className="flex items-center justify-between border border-white/[0.06] bg-zinc-950/40 rounded-xl px-3 py-1.5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Force Generate
                  </span>
                  <span className="text-[9px] text-zinc-600">Bypass duplicate guard</span>
                </div>
                <Switch
                  checked={forceGenerate}
                  onCheckedChange={setForceGenerate}
                  className="scale-75 data-[state=checked]:bg-red-500"
                />
              </div>
            </div>

            {/* AI Cliché Alert block */}
            <div className="mt-2 bg-red-500/[0.04] border border-red-500/10 rounded-xl p-3 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="text-[10px] text-zinc-500 leading-normal">
                <strong className="text-red-400">SEO Safeguard Enabled:</strong> Every manual pass automatically executes an AI cliché filtering parser. Terms like <em>delve, tapestry, landscape, holistic,</em> and <em>game-changing</em> are deleted or heavily rewritten.
              </div>
            </div>

            {/* Action Trigger Button */}
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={isGenerating}
              className="w-full h-10 mt-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/20 transition-all flex items-center justify-center gap-2 border border-red-500/30 group"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Generating Post ({genElapsedTime}s)...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                  Trigger Blog Generation
                </>
              )}
            </Button>
          </div>

          {/* Loader status log */}
          {isGenerating && (
            <div className="border border-white/[0.06] bg-zinc-950/80 rounded-xl p-4 flex flex-col gap-2.5 animate-pulse mt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">
                  Live Log Tracker
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {Math.floor(genElapsedTime / 60)}m {genElapsedTime % 60}s elapsed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500 shrink-0" />
                <span className="text-xs text-white font-semibold font-mono tracking-tight">
                  {genStage}
                </span>
              </div>
              <div className="w-full bg-white/[0.04] h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-red-500 h-full transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (genElapsedTime / 130) * 100)}%` }} 
                />
              </div>
              <span className="text-[9px] text-zinc-600">
                Note: Generation utilizes multiple recursive LLM verification loops (usually takes ~90-120 seconds).
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: ANALYTICS & CACHED POSTS ──────────────────────────── */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="bg-[#18181b]/30 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl flex flex-col gap-5">
          {/* Header & Cache Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Blog Analytics</h2>
                <Badge 
                  variant="outline" 
                  className={`text-[9px] font-mono font-bold tracking-tight rounded-md px-1.5 py-0.5 border ${
                    source === "cache" 
                      ? "text-purple-400 bg-purple-500/10 border-purple-500/20" 
                      : "text-zinc-400 bg-zinc-500/10 border-zinc-500/20"
                  }`}
                >
                  {source === "cache" ? "RE-ROUTED: REDIS CACHED" : "SOURCE: DB LIVE"}
                </Badge>
              </div>
              <p className="text-zinc-500 text-xs mt-1">
                Overview of published posts, word counts, and cumulative reader reactions (Likes).
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => clearCacheMutation.mutate()}
                disabled={clearCacheMutation.isPending}
                className="h-8 border-white/10 bg-zinc-950/60 text-[10px] text-zinc-400 hover:text-white hover:bg-white/[0.04] rounded-lg gap-1.5"
              >
                {clearCacheMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Flush Cache
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchBlogs()}
                className="h-8 w-8 p-0 border border-white/5 bg-zinc-950/20 text-zinc-500 hover:text-white hover:bg-white/[0.05] rounded-lg"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <hr className="border-white/[0.06]" />

          {/* Filtering & Sorting Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" />
              <Input
                placeholder="Filter posts by title or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 bg-zinc-950/60 border-white/10 text-xs text-white placeholder:text-zinc-600 focus-visible:ring-red-500/30"
              />
            </div>

            {/* Sorting Toggles */}
            <div className="flex items-center bg-zinc-950/80 border border-white/10 rounded-lg p-0.5 shrink-0 self-stretch sm:self-auto justify-center">
              <button
                onClick={() => setSortBy("likes")}
                className={`flex items-center gap-1.5 px-3 h-7 rounded-md text-[10px] font-bold tracking-tight uppercase transition-all duration-200 ${
                  sortBy === "likes"
                    ? "bg-white/[0.08] text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                Most Liked
              </button>
              <button
                onClick={() => setSortBy("date")}
                className={`flex items-center gap-1.5 px-3 h-7 rounded-md text-[10px] font-bold tracking-tight uppercase transition-all duration-200 ${
                  sortBy === "date"
                    ? "bg-white/[0.08] text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Calendar className="w-3 h-3 text-sky-400" />
                Newest Date
              </button>
            </div>
          </div>

          {/* Blog Posts list */}
          {loadingBlogs ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              <span className="text-xs text-zinc-500 font-medium">Reloading analytics stream...</span>
            </div>
          ) : blogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/5 rounded-2xl bg-zinc-950/10">
              <BookOpen className="w-8 h-8 text-zinc-700 mb-2" />
              <span className="text-xs text-zinc-400 font-bold">No published blogs found</span>
              <span className="text-[10px] text-zinc-600 mt-1">Try resetting search filter or triggering new generation.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
              {blogs.map((post) => (
                <div 
                  key={post.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Cover Photo Preview */}
                    <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-white/10 overflow-hidden shrink-0 relative flex items-center justify-center">
                      {post.image_url ? (
                        <img 
                          src={post.image_url} 
                          alt={post.image_alt || post.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-zinc-700" />
                      )}
                    </div>

                    {/* Metadata & Title */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        {post.topic && (
                          <Badge 
                            variant="outline" 
                            className="text-[9px] font-extrabold tracking-wider bg-white/[0.04] text-zinc-300 border-white/10 rounded px-1.5 py-0"
                          >
                            {post.topic}
                          </Badge>
                        )}
                        <span className="text-[10px] text-zinc-500 font-medium">
                          {post.publish_date}
                        </span>
                        {post.read_time && (
                          <span className="text-[10px] text-zinc-600 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {post.read_time}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs font-bold text-white tracking-tight truncate group-hover:text-red-400 transition-colors">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-1">
                        <User className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{post.author || "Beseekr Editorial"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Reaction Count & External Actions */}
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {/* Likes badge */}
                    <div className="flex items-center gap-1.5 bg-red-500/[0.04] border border-red-500/10 rounded-lg px-2.5 py-1.5">
                      <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
                      <span className="text-xs font-black text-red-400 font-mono">
                        {post.likes_count}
                      </span>
                    </div>

                    {/* Link out button */}
                    <a 
                      href={`/blogs/${post.slug}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg border border-white/5 hover:border-white/20 bg-zinc-950 text-zinc-500 hover:text-white transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Aggregate Stats Summary row */}
          {!loadingBlogs && blogs.length > 0 && (
            <div className="flex items-center justify-between border-t border-white/[0.06] pt-4 mt-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Analytics Summary
              </span>
              <div className="flex gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span className="text-white font-bold">{blogs.length}</span> Published Posts
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                  <span className="text-red-400 font-extrabold font-mono">
                    {blogs.reduce((acc, b) => acc + (b.likes_count || 0), 0)}
                  </span> Likes Cumulative
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
