import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Briefcase,
  Play,
  RefreshCw,
  Trash2,
  Database,
  ArrowDownToLine,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  Filter,
  Search,
  Building2,
  Calendar,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

interface ScraperRunRecord {
  id: string;
  timestamp: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  trigger: string;
  status: "success" | "partial" | "failed";
  errorMessage?: string | null;
  fetched: {
    greenhouse: number;
    lever: number;
    ashby: number;
    workable: number;
    remoteok: number;
    jsearch: number;
    total: number;
  };
  afterFreshnessFilter: number;
  afterRegionFilter: number;
  afterDedup: number;
  storedInDb: number;
  batchErrors: number;
  clearedFromDb: number;
  totalInDb: number;
  jsearchQueryUsed?: string | null;
}

export function AdminJobStats() {
  const queryClient = useQueryClient();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [forceJSearch, setForceJSearch] = useState(false);
  const [triggerFilter, setTriggerFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRun, setSelectedRun] = useState<ScraperRunRecord | null>(null);

  // Fetch Job Scraper Telemetry
  const {
    data: responseData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["admin", "jobScraperStats"],
    queryFn: async () => {
      const res = await apiClient.getJobScraperStats();
      return res.data;
    },
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const stats = responseData?.summary;
  const sources = responseData?.sources;
  const freshness = responseData?.freshness;
  const runs = responseData?.runs || [];

  // Mutation: Trigger Scraper Manually
  const triggerMutation = useMutation({
    mutationFn: async () => {
      return apiClient.triggerJobScraper({ forceJSearch });
    },
    onSuccess: (data) => {
      toast({
        title: "Scraper Cycle Completed",
        description: data?.data?.run
          ? `Fetched ${data.data.run.fetched?.total || 0} jobs, stored ${data.data.run.storedInDb || 0}, cleaned up ${data.data.run.clearedFromDb || 0}.`
          : "Job scraper executed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "jobScraperStats"] });
    },
    onError: (err: any) => {
      toast({
        title: "Scraper Trigger Failed",
        description: err.message || "Failed to execute scraper cycle.",
        variant: "destructive",
      });
    },
  });

  // Mutation: Clean Expired Jobs (>3d)
  const cleanupMutation = useMutation({
    mutationFn: async (days: number = 3) => {
      return apiClient.cleanupJobScraperExpired(days);
    },
    onSuccess: (data) => {
      toast({
        title: "Expired Jobs Purged",
        description: `Successfully deleted ${data?.data?.clearedCount || 0} jobs older than 3 days.`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "jobScraperStats"] });
    },
    onError: (err: any) => {
      toast({
        title: "Cleanup Failed",
        description: err.message || "Failed to purge expired jobs.",
        variant: "destructive",
      });
    },
  });

  // Mutation: Clear Run History
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      return apiClient.clearJobScraperHistory();
    },
    onSuccess: () => {
      toast({
        title: "History Cleared",
        description: "Scraper execution log history has been reset.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "jobScraperStats"] });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to Clear History",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Filtered runs list
  const filteredRuns = useMemo(() => {
    return runs.filter((r) => {
      if (triggerFilter !== "all" && r.trigger !== triggerFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = r.id.toLowerCase().includes(q);
        const matchesTrigger = r.trigger.toLowerCase().includes(q);
        const matchesJSearch = (r.jsearchQueryUsed || "").toLowerCase().includes(q);
        if (!matchesId && !matchesTrigger && !matchesJSearch) return false;
      }
      return true;
    });
  }, [runs, triggerFilter, statusFilter, searchQuery]);

  const latestRun = stats?.latestRun;

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* ── TOP CONTROL BAR ─────────────────────────────────────────── */}
        <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Briefcase className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Job Scraper & Ingestion Telemetry
              </h2>
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] uppercase font-black tracking-widest px-2 py-0.5">
                Live Ingestion
              </Badge>
            </div>
            <p className="text-xs text-zinc-400">
              Observability into hourly cron scraping cycles, ATS source ingestion, deduplication, DB persistence, and expiration pruning.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Auto-refresh Switch */}
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
              <span className="text-[11px] font-bold text-zinc-400">Auto (10s)</span>
              <Switch
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
                className="scale-75"
              />
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-xs font-semibold text-zinc-300"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? "animate-spin" : ""}`}
              />
              Reload
            </Button>

            {/* Clean Expired (>3d) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => cleanupMutation.mutate(3)}
              disabled={cleanupMutation.isPending}
              className="border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold"
            >
              <Trash2
                className={`w-3.5 h-3.5 mr-1.5 ${cleanupMutation.isPending ? "animate-pulse" : ""}`}
              />
              Purge Expired (&gt;3d)
            </Button>

            {/* Trigger Scraper Button */}
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-zinc-400 bg-white/[0.02] border border-white/[0.06] px-2.5 py-1.5 rounded-lg hover:border-white/[0.15]">
                    <input
                      type="checkbox"
                      checked={forceJSearch}
                      onChange={(e) => setForceJSearch(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-sky-500 w-3.5 h-3.5 focus:ring-0"
                    />
                    <span>Force JSearch</span>
                  </label>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-xs">
                  Bypass the 4-hour quota throttle and execute JSearch RapidAPI query in this cycle.
                </TooltipContent>
              </Tooltip>

              <Button
                size="sm"
                onClick={() => triggerMutation.mutate()}
                disabled={triggerMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20"
              >
                <Play
                  className={`w-3.5 h-3.5 mr-1.5 ${triggerMutation.isPending ? "animate-spin" : ""}`}
                />
                {triggerMutation.isPending ? "Scraping..." : "Run Scraper Now"}
              </Button>
            </div>
          </div>
        </div>

        {/* ── METRIC STAT CARDS (TOP ROW) ─────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total in DB */}
          <div className="bg-white/[0.02] border border-white/[0.07] hover:border-white/[0.12] rounded-2xl p-5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Total in Database
              </span>
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white tracking-tight">
              {stats?.totalInDb?.toLocaleString() ?? 0}
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">
                {freshness?.last24h ?? 0}
              </span>
              posted in last 24h
            </p>
          </div>

          {/* Latest Run Fetched */}
          <div className="bg-white/[0.02] border border-white/[0.07] hover:border-white/[0.12] rounded-2xl p-5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Latest Run Fetched
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <ArrowDownToLine className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-indigo-400 tracking-tight">
              {latestRun?.fetched?.total?.toLocaleString() ?? 0}
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              Deduped to{" "}
              <span className="text-white font-bold">
                {latestRun?.afterDedup ?? 0}
              </span>{" "}
              unique postings
            </p>
          </div>

          {/* Stored in DB (Latest Run) */}
          <div className="bg-white/[0.02] border border-white/[0.07] hover:border-white/[0.12] rounded-2xl p-5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Stored in DB (Latest)
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-400 tracking-tight">
              +{latestRun?.storedInDb?.toLocaleString() ?? 0}
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              Lifetime new stored:{" "}
              <span className="text-white font-bold">
                {stats?.lifetime?.totalStored?.toLocaleString() ?? 0}
              </span>
            </p>
          </div>

          {/* Cleared / Expired (Latest Run) */}
          <div className="bg-white/[0.02] border border-white/[0.07] hover:border-white/[0.12] rounded-2xl p-5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Cleared Expired (Latest)
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Trash2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-amber-400 tracking-tight">
              {latestRun?.clearedFromDb?.toLocaleString() ?? 0}
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              Lifetime cleared:{" "}
              <span className="text-white font-bold">
                {stats?.lifetime?.totalCleared?.toLocaleString() ?? 0}
              </span>
            </p>
          </div>
        </div>

        {/* ── SOURCE-WISE BREAKDOWN (COLUMN-WISE GRID) ────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                Source Breakdown & ATS Coverage
              </h3>
            </div>
            <span className="text-xs text-zinc-500 font-medium">
              Schedule: {stats?.cronSchedule || "Hourly"}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Greenhouse Card */}
            <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">Greenhouse</span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                  ATS API
                </Badge>
              </div>
              <div>
                <div className="text-2xl font-black text-white">
                  {sources?.inDb?.greenhouse?.toLocaleString() ?? 0}
                </div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mt-0.5">
                  In Database
                </span>
              </div>
              <div className="pt-2 border-t border-white/[0.05] text-[11px] space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Last Fetched:</span>
                  <span className="text-white font-bold">
                    {sources?.lastRunFetched?.greenhouse ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Targets:</span>
                  <span className="text-zinc-300">
                    {sources?.targets?.greenhouseCompaniesCount ?? 0} cos
                  </span>
                </div>
              </div>
            </div>

            {/* Lever Card */}
            <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400">Lever</span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-blue-500/30 text-blue-400 bg-blue-500/10">
                  ATS API
                </Badge>
              </div>
              <div>
                <div className="text-2xl font-black text-white">
                  {sources?.inDb?.lever?.toLocaleString() ?? 0}
                </div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mt-0.5">
                  In Database
                </span>
              </div>
              <div className="pt-2 border-t border-white/[0.05] text-[11px] space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Last Fetched:</span>
                  <span className="text-white font-bold">
                    {sources?.lastRunFetched?.lever ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Targets:</span>
                  <span className="text-zinc-300">
                    {sources?.targets?.leverCompaniesCount ?? 0} cos
                  </span>
                </div>
              </div>
            </div>

            {/* Ashby Card */}
            <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400">Ashby</span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-purple-500/30 text-purple-400 bg-purple-500/10">
                  Public API
                </Badge>
              </div>
              <div>
                <div className="text-2xl font-black text-white">
                  {sources?.inDb?.ashby?.toLocaleString() ?? 0}
                </div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mt-0.5">
                  In Database
                </span>
              </div>
              <div className="pt-2 border-t border-white/[0.05] text-[11px] space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Last Fetched:</span>
                  <span className="text-white font-bold">
                    {sources?.lastRunFetched?.ashby ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Targets:</span>
                  <span className="text-zinc-300">
                    {sources?.targets?.ashbyCompaniesCount ?? 0} cos
                  </span>
                </div>
              </div>
            </div>

            {/* Workable Card */}
            <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">Workable</span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/30 text-amber-400 bg-amber-500/10">
                  Widget API
                </Badge>
              </div>
              <div>
                <div className="text-2xl font-black text-white">
                  {sources?.inDb?.workable?.toLocaleString() ?? 0}
                </div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mt-0.5">
                  In Database
                </span>
              </div>
              <div className="pt-2 border-t border-white/[0.05] text-[11px] space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Last Fetched:</span>
                  <span className="text-white font-bold">
                    {sources?.lastRunFetched?.workable ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Targets:</span>
                  <span className="text-zinc-300">
                    {sources?.targets?.workableCompaniesCount ?? 0} cos
                  </span>
                </div>
              </div>
            </div>

            {/* RemoteOK Card */}
            <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400">RemoteOK</span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-rose-500/30 text-rose-400 bg-rose-500/10">
                  Board API
                </Badge>
              </div>
              <div>
                <div className="text-2xl font-black text-white">
                  {sources?.inDb?.remoteok?.toLocaleString() ?? 0}
                </div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mt-0.5">
                  In Database
                </span>
              </div>
              <div className="pt-2 border-t border-white/[0.05] text-[11px] space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Last Fetched:</span>
                  <span className="text-white font-bold">
                    {sources?.lastRunFetched?.remoteok ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Coverage:</span>
                  <span className="text-zinc-300">Global Tech</span>
                </div>
              </div>
            </div>

            {/* JSearch Card */}
            <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400">JSearch</span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
                  RapidAPI
                </Badge>
              </div>
              <div>
                <div className="text-2xl font-black text-white">
                  {sources?.inDb?.jsearch?.toLocaleString() ?? 0}
                </div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mt-0.5">
                  In Database
                </span>
              </div>
              <div className="pt-2 border-t border-white/[0.05] text-[11px] space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Last Fetched:</span>
                  <span className="text-white font-bold">
                    {sources?.lastRunFetched?.jsearch ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Schedule:</span>
                  <span className="text-cyan-400 font-semibold">Every 4h</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FRESHNESS METRICS PROGRESS ─────────────────────────────── */}
        <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" /> Job Age & Freshness Distribution
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Jobs strictly kept within the 3-day retention horizon
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                &lt;24h: {freshness?.last24h ?? 0}
              </span>
              <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                24-48h: {freshness?.last48h ?? 0}
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                48-72h: {freshness?.last72h ?? 0}
              </span>
              <span className="flex items-center gap-1.5 text-zinc-500 font-semibold">
                <span className="w-2 h-2 rounded-full bg-zinc-600" />
                &gt;72h (Expiring): {freshness?.older ?? 0}
              </span>
            </div>
          </div>

          <div className="w-full h-2.5 bg-white/[0.04] rounded-full overflow-hidden flex">
            {stats?.totalInDb ? (
              <>
                <div
                  style={{
                    width: `${Math.round(((freshness?.last24h || 0) / stats.totalInDb) * 100)}%`,
                  }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                  title="<24h"
                />
                <div
                  style={{
                    width: `${Math.round(((freshness?.last48h || 0) / stats.totalInDb) * 100)}%`,
                  }}
                  className="bg-sky-500 h-full transition-all duration-500"
                  title="24-48h"
                />
                <div
                  style={{
                    width: `${Math.round(((freshness?.last72h || 0) / stats.totalInDb) * 100)}%`,
                  }}
                  className="bg-amber-500 h-full transition-all duration-500"
                  title="48-72h"
                />
                <div
                  style={{
                    width: `${Math.round(((freshness?.older || 0) / stats.totalInDb) * 100)}%`,
                  }}
                  className="bg-zinc-600 h-full transition-all duration-500"
                  title=">72h"
                />
              </>
            ) : (
              <div className="w-full bg-white/[0.04] h-full" />
            )}
          </div>
        </div>

        {/* ── EXECUTION HISTORY TABLE (COLUMN-WISE LOGS) ──────────────── */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" /> Cron Execution History
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Column-wise telemetry breakdown for every cron & manual scraper run ({filteredRuns.length} runs shown)
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search runs / query..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 w-44"
                />
              </div>

              {/* Trigger Filter */}
              <select
                value={triggerFilter}
                onChange={(e) => setTriggerFilter(e.target.value)}
                className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none"
              >
                <option value="all" className="bg-zinc-900">All Triggers</option>
                <option value="cron" className="bg-zinc-900">Cron (Hourly)</option>
                <option value="manual" className="bg-zinc-900">Manual</option>
                <option value="startup" className="bg-zinc-900">Startup</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none"
              >
                <option value="all" className="bg-zinc-900">All Statuses</option>
                <option value="success" className="bg-zinc-900">Success</option>
                <option value="partial" className="bg-zinc-900">Partial</option>
                <option value="failed" className="bg-zinc-900">Failed</option>
              </select>

              {/* Clear History */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearHistoryMutation.mutate()}
                disabled={clearHistoryMutation.isPending || runs.length === 0}
                className="text-zinc-500 hover:text-red-400 text-xs h-8 px-2"
                title="Clear run logs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white/[0.03] border-b border-white/[0.06] text-zinc-400 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10 backdrop-blur-md">
                    <th className="py-3 px-4">Run Time</th>
                    <th className="py-3 px-3">Trigger</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-2 text-center text-emerald-400">GH</th>
                    <th className="py-3 px-2 text-center text-blue-400">Lever</th>
                    <th className="py-3 px-2 text-center text-purple-400">Ashby</th>
                    <th className="py-3 px-2 text-center text-amber-400">Workable</th>
                    <th className="py-3 px-2 text-center text-rose-400">RemoteOK</th>
                    <th className="py-3 px-2 text-center text-cyan-400">JSearch</th>
                    <th className="py-3 px-3 text-right font-black text-white">Fetched</th>
                    <th className="py-3 px-3 text-right text-emerald-400 font-black">Stored in DB</th>
                    <th className="py-3 px-3 text-right text-amber-400 font-black">Cleared</th>
                    <th className="py-3 px-4 text-right font-black text-sky-400">Total in DB</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-zinc-300">
                  {filteredRuns.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-12 text-center text-zinc-500">
                        <Briefcase className="w-8 h-8 mx-auto text-zinc-600 mb-2 opacity-50" />
                        <p className="font-semibold text-sm">No scraper execution logs yet</p>
                        <p className="text-[11px] text-zinc-600 mt-1">
                          Click "Run Scraper Now" above or wait for the next scheduled hourly cron cycle.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRuns.map((r) => {
                      const runDate = new Date(r.timestamp);
                      const isRecent = Date.now() - runDate.getTime() < 3600000;
                      return (
                        <tr
                          key={r.id}
                          className="hover:bg-white/[0.02] transition-colors font-medium group cursor-pointer"
                          onClick={() => setSelectedRun(r)}
                        >
                          {/* Run Time */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-white font-bold">
                                {runDate.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}
                              </span>
                              <span className="text-[10px] text-zinc-500">
                                {runDate.toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </td>

                          {/* Trigger */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-2 py-0.5 uppercase tracking-wider font-bold ${
                                r.trigger === "cron"
                                  ? "border-sky-500/30 text-sky-400 bg-sky-500/10"
                                  : r.trigger === "manual"
                                    ? "border-indigo-500/30 text-indigo-400 bg-indigo-500/10"
                                    : "border-purple-500/30 text-purple-400 bg-purple-500/10"
                              }`}
                            >
                              {r.trigger}
                            </Badge>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {r.status === "success" ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : r.status === "partial" ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-red-400" />
                              )}
                              <span className="text-[11px] text-zinc-400 font-mono">
                                {(r.durationMs / 1000).toFixed(1)}s
                              </span>
                            </div>
                          </td>

                          {/* Greenhouse */}
                          <td className="py-3 px-2 text-center font-mono text-zinc-300">
                            {r.fetched?.greenhouse || 0}
                          </td>

                          {/* Lever */}
                          <td className="py-3 px-2 text-center font-mono text-zinc-300">
                            {r.fetched?.lever || 0}
                          </td>

                          {/* Ashby */}
                          <td className="py-3 px-2 text-center font-mono text-zinc-300">
                            {r.fetched?.ashby || 0}
                          </td>

                          {/* Workable */}
                          <td className="py-3 px-2 text-center font-mono text-zinc-300">
                            {r.fetched?.workable || 0}
                          </td>

                          {/* RemoteOK */}
                          <td className="py-3 px-2 text-center font-mono text-zinc-300">
                            {r.fetched?.remoteok || 0}
                          </td>

                          {/* JSearch */}
                          <td className="py-3 px-2 text-center font-mono">
                            {r.fetched?.jsearch > 0 ? (
                              <span className="text-cyan-400 font-bold">
                                {r.fetched.jsearch}
                              </span>
                            ) : (
                              <span className="text-zinc-600">0</span>
                            )}
                          </td>

                          {/* Total Fetched */}
                          <td className="py-3 px-3 text-right font-black text-white font-mono">
                            {r.fetched?.total || 0}
                          </td>

                          {/* Stored in DB */}
                          <td className="py-3 px-3 text-right font-black text-emerald-400 font-mono">
                            +{r.storedInDb || 0}
                          </td>

                          {/* Cleared from DB */}
                          <td className="py-3 px-3 text-right font-bold text-amber-400 font-mono">
                            {r.clearedFromDb || 0}
                          </td>

                          {/* Total in DB */}
                          <td className="py-3 px-4 text-right font-black text-sky-400 font-mono">
                            {r.totalInDb?.toLocaleString() || "-"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── RUN DETAIL DIALOG / DRAWER ──────────────────────────────── */}
        {selectedRun && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#111113] border border-white/[0.1] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-sky-400" /> Run Telemetry Inspector
                  </h4>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">
                    {selectedRun.id}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRun(null)}
                  className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl">
                  <span className="text-zinc-500 font-bold uppercase text-[10px] block">Trigger Type</span>
                  <span className="text-white font-bold capitalize">{selectedRun.trigger}</span>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl">
                  <span className="text-zinc-500 font-bold uppercase text-[10px] block">Duration</span>
                  <span className="text-white font-bold">{selectedRun.durationMs} ms ({(selectedRun.durationMs / 1000).toFixed(2)}s)</span>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl">
                  <span className="text-zinc-500 font-bold uppercase text-[10px] block">After 24h Filter</span>
                  <span className="text-emerald-400 font-bold">{selectedRun.afterFreshnessFilter} jobs</span>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl">
                  <span className="text-zinc-500 font-bold uppercase text-[10px] block">After Dedup</span>
                  <span className="text-sky-400 font-bold">{selectedRun.afterDedup} jobs</span>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl space-y-2 text-xs">
                <span className="text-zinc-400 font-bold block">Source Breakdown (Fetched in this cycle):</span>
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
                  <div className="text-emerald-400">GH: {selectedRun.fetched.greenhouse}</div>
                  <div className="text-blue-400">Lever: {selectedRun.fetched.lever}</div>
                  <div className="text-purple-400">Ashby: {selectedRun.fetched.ashby}</div>
                  <div className="text-amber-400">Workable: {selectedRun.fetched.workable}</div>
                  <div className="text-rose-400">RemoteOK: {selectedRun.fetched.remoteok}</div>
                  <div className="text-cyan-400">JSearch: {selectedRun.fetched.jsearch}</div>
                </div>
                {selectedRun.jsearchQueryUsed && (
                  <div className="pt-2 text-[11px] text-zinc-400">
                    JSearch Query: <span className="text-cyan-400 font-semibold">"{selectedRun.jsearchQueryUsed}"</span>
                  </div>
                )}
              </div>

              {selectedRun.errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                  {selectedRun.errorMessage}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  onClick={() => setSelectedRun(null)}
                  className="bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
