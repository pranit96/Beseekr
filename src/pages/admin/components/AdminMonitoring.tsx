import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Tooltip as UITooltip,
  TooltipContent as UITooltipContent,
  TooltipProvider as UITooltipProvider,
  TooltipTrigger as UITooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  MemoryStick as Memory,
  HardDrive,
  Zap,
  Cpu,
  Server,
  Activity,
  AlertTriangle,
  Trash2,
  Play,
  RefreshCw,
} from "lucide-react";

const StatCard = ({
  label,
  value,
  sub,
  progress,
  accent,
  tooltip,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  progress?: number;
  accent: string;
  tooltip: string;
  icon: React.ElementType;
}) => (
  <UITooltip>
    <UITooltipTrigger asChild>
      <div className="group bg-white/[0.02] border border-white/[0.07] hover:border-white/[0.12] rounded-2xl p-5 cursor-help transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            {label}
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white tracking-tight mb-2">
          {value}
        </div>
        {progress !== undefined && (
          <Progress value={progress} className="h-1 mb-2 bg-white/[0.06]" />
        )}
        {sub && <p className="text-[11px] text-zinc-600 font-medium">{sub}</p>}
      </div>
    </UITooltipTrigger>
    <UITooltipContent side="bottom" className="max-w-xs text-xs">
      {tooltip}
    </UITooltipContent>
  </UITooltip>
);

export function AdminMonitoring() {
  const { toast } = useToast();
  const [isCleaning, setIsCleaning] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // Fetch Memory Stats
  const { data: memStats } = useQuery({
    queryKey: ["admin", "monitoring", "memory"],
    queryFn: () => apiClient.getAdminMemoryStats().then((res) => res.data),
    refetchInterval: 5000,
  });

  // Fetch Queue/Worker Stats
  const { data: queueRes } = useQuery({
    queryKey: ["admin", "monitoring", "queues"],
    queryFn: () => apiClient.getAdminQueueStatus(),
    refetchInterval: 5000,
  });

  const queueStats = (queueRes as any)?.queues || null;

  const handleCleanQueues = async () => {
    try {
      setIsCleaning(true);
      await apiClient.cleanAdminQueues();
      toast({
        title: "Queues Purged",
        description: "Successfully cleaned all queue backlogs.",
      });
    } catch (error: any) {
      toast({
        title: "Purge Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCleaning(false);
    }
  };

  const handleTriggerPipeline = async () => {
    try {
      setIsTriggering(true);
      await apiClient.triggerAdminPipeline();
      toast({
        title: "Pipeline Started",
        description: "Discovery pipeline has been manually triggered.",
      });
    } catch (error: any) {
      toast({
        title: "Trigger Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTriggering(false);
    }
  };

  useEffect(() => {
    if (memStats) {
      setHistory((prev) => {
        const updated = [
          ...prev,
          {
            time: new Date().toLocaleTimeString(),
            used: Math.round(memStats.memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memStats.memoryUsage.heapTotal / 1024 / 1024),
            limit: Math.round(memStats.v8HeapStats.heapSizeLimit / 1024 / 1024),
          },
        ];
        return updated.slice(-30);
      });
    }
  }, [memStats]);

  if (!memStats || !queueStats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-white/[0.03] border border-white/[0.06] rounded-2xl"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-pulse">
          <div className="h-64 bg-white/[0.03] border border-white/[0.06] rounded-2xl" />
          <div className="h-64 bg-white/[0.03] border border-white/[0.06] rounded-2xl" />
        </div>
      </div>
    );
  }

  // Calculate Memory Metrics
  const heapUsedMB = Math.round(memStats.memoryUsage.heapUsed / 1024 / 1024);
  const heapLimitMB = Math.round(
    memStats.v8HeapStats.heapSizeLimit / 1024 / 1024,
  );
  const usagePercent = Math.round((heapUsedMB / heapLimitMB) * 100);
  const rssMB = Math.round(memStats.memoryUsage.rss / 1024 / 1024);
  const osUsedGB = (memStats.osMemory.used / 1024 / 1024 / 1024).toFixed(2);
  const osTotalGB = (memStats.osMemory.total / 1024 / 1024 / 1024).toFixed(1);

  const pieData = [
    { name: "Used", value: heapUsedMB },
    { name: "Free", value: heapLimitMB - heapUsedMB },
  ];
  const PIE_COLORS = ["#6366f1", "#1e1e2e"];

  // Calculate Queue/Worker Metrics
  const activeWorkers = Object.values(queueStats).reduce<number>(
    (acc, q: any) => acc + (q.active || 0),
    0,
  );
  const totalWaiting = Object.values(queueStats).reduce<number>(
    (acc, q: any) => acc + (q.waiting || 0),
    0,
  );
  const totalFailed = Object.values(queueStats).reduce<number>(
    (acc, q: any) => acc + (q.failed || 0),
    0,
  );

  // Overall Health status of the queues
  const hasDegradedQueues = Object.values(queueStats).some(
    (q: any) => q.health === "degraded" || q.health === "unavailable",
  );
  const isHighBacklog = totalWaiting > 50;

  return (
    <UITooltipProvider>
      <div className="space-y-8">
        {/* CORE WORKER & CACHE METRICS */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Worker Engine &
              Redis Status
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-bold uppercase tracking-wider"
                onClick={handleCleanQueues}
                disabled={isCleaning}
              >
                <Trash2
                  className={`w-3 h-3 mr-2 ${isCleaning ? "animate-pulse" : ""}`}
                />
                {isCleaning ? "Cleaning..." : "Purge Queues"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-white/[0.07] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider"
                onClick={handleTriggerPipeline}
                disabled={isTriggering}
              >
                <Play
                  className={`w-3 h-3 mr-2 ${isTriggering ? "animate-spin" : ""}`}
                />
                {isTriggering ? "Triggering..." : "Run Pipeline"}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Active Workers"
              value={activeWorkers}
              sub="Currently processing jobs"
              accent="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              icon={Cpu}
              tooltip="Total number of jobs actively being executed across all queues right now."
            />
            <StatCard
              label="Queue Backlog"
              value={totalWaiting}
              sub={
                isHighBacklog ? "High load detected" : "Healthy queue length"
              }
              accent={
                isHighBacklog
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-sky-500/10 text-sky-400"
              }
              icon={Server}
              tooltip="Jobs waiting in Redis to be picked up by an available worker."
            />
            <StatCard
              label="Failed Jobs"
              value={totalFailed}
              sub="Requires manual retry or clearing"
              accent={
                totalFailed > 0
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-zinc-500/10 text-zinc-400"
              }
              icon={AlertTriangle}
              tooltip="Total jobs that have exhausted all retry attempts and moved to the failed queue."
            />
            <StatCard
              label="Queue Health"
              value={hasDegradedQueues ? "Degraded" : "Optimal"}
              sub="Based on worker latency & failure rates"
              accent={
                hasDegradedQueues
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-emerald-500/10 text-emerald-400"
              }
              icon={Activity}
              tooltip="Computed health status tracking BullMQ queue responsiveness."
            />
          </div>
        </div>

        {/* DETAILED QUEUE BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Object.entries(queueStats).map(([key, q]: [string, any]) => (
            <div
              key={key}
              className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6 flex flex-col gap-5"
            >
              <div className="flex items-center justify-between border-b border-white/[0.05] pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white capitalize">
                    {q.name?.replace(/[-_]/g, " ")} Queue
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Redis-backed {q.type} engine
                  </p>
                </div>
                <div
                  className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                    q.health === "healthy"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : q.health === "processing"
                        ? "bg-sky-500/10 text-sky-400"
                        : q.health === "backlog"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {q.health}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-white/[0.02] rounded-xl p-3">
                  <div className="text-xl font-bold text-sky-400">
                    {q.active}
                  </div>
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                    Active
                  </div>
                </div>
                <div className="bg-white/[0.02] rounded-xl p-3">
                  <div className="text-xl font-bold text-zinc-300">
                    {q.waiting}
                  </div>
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                    Waiting
                  </div>
                </div>
                <div className="bg-white/[0.02] rounded-xl p-3">
                  <div className="text-xl font-bold text-zinc-300">
                    {q.completed}
                  </div>
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                    Done
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* MEMORY & SYSTEM */}
        <div>
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 mt-2">
            <Memory className="w-4 h-4 text-indigo-400" /> System Memory & Heap
            Analytics
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <StatCard
              label="Heap Used"
              value={`${heapUsedMB} MB`}
              sub={`${usagePercent}% of ${heapLimitMB} MB`}
              progress={usagePercent}
              accent="bg-indigo-500/10 text-indigo-400"
              icon={Memory}
              tooltip="Active memory used by Node.js. High usage triggers GC."
            />
            <StatCard
              label="System RSS"
              value={`${rssMB} MB`}
              sub="Physical footprint"
              accent="bg-sky-500/10 text-sky-400"
              icon={HardDrive}
              tooltip="Total physical RAM held by this process."
            />
            <StatCard
              label="OS Memory"
              value={`${memStats.osMemory?.percentUsed || 0}%`}
              sub={`${osUsedGB} GB / ${osTotalGB} GB`}
              progress={memStats.osMemory?.percentUsed || 0}
              accent="bg-amber-500/10 text-amber-400"
              icon={Zap}
              tooltip="Host machine total memory."
            />
            <StatCard
              label="Environments"
              value="Stable"
              sub={`${memStats.v8HeapStats.nativeContexts} isolated contexts`}
              accent="bg-emerald-500/10 text-emerald-400"
              icon={Cpu}
              tooltip="System health based on V8 contexts."
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Heap timeline */}
            <div className="lg:col-span-2 bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6">
              <div className="mb-5">
                <h3 className="text-sm font-bold text-white">
                  Heap Usage History
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Real-time memory allocation (MB)
                </p>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient
                        id="colorUsed"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#6366f1"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6366f1"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(255,255,255,0.04)"
                    />
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={[0, "dataMax + 50"]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111113",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                      itemStyle={{ color: "#818cf8" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="used"
                      stroke="#6366f1"
                      fillOpacity={1}
                      fill="url(#colorUsed)"
                      strokeWidth={2}
                      isAnimationActive={false}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie donut */}
            <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6">
              <div className="mb-5">
                <h3 className="text-sm font-bold text-white">
                  Heap Distribution
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Used vs. available space
                </p>
              </div>
              <div className="h-56 flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111113",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center -mt-2">
                  <p className="text-2xl font-bold text-white">
                    {heapUsedMB} MB
                  </p>
                  <p className="text-xs text-zinc-500">heap used</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UITooltipProvider>
  );
}
