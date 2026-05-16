import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Tooltip as UITooltip,
  TooltipContent as UITooltipContent,
  TooltipProvider as UITooltipProvider,
  TooltipTrigger as UITooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
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
import { MemoryStick as Memory, HardDrive, Zap, Cpu } from "lucide-react";

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
  value: string;
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
  const [history, setHistory] = useState<any[]>([]);

  const { data: stats } = useQuery({
    queryKey: ["admin", "monitoring", "memory"],
    queryFn: () => apiClient.getAdminMemoryStats().then((res) => res.data),
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (stats) {
      setHistory((prev) => {
        const updated = [
          ...prev,
          {
            time: new Date().toLocaleTimeString(),
            used: Math.round(stats.memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(stats.memoryUsage.heapTotal / 1024 / 1024),
            limit: Math.round(stats.v8HeapStats.heapSizeLimit / 1024 / 1024),
          },
        ];
        return updated.slice(-30);
      });
    }
  }, [stats]);

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-white/[0.03] border border-white/[0.06] rounded-2xl"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-pulse">
          <div className="lg:col-span-2 h-72 bg-white/[0.03] border border-white/[0.06] rounded-2xl" />
          <div className="h-72 bg-white/[0.03] border border-white/[0.06] rounded-2xl" />
        </div>
      </div>
    );
  }

  const heapUsedMB = Math.round(stats.memoryUsage.heapUsed / 1024 / 1024);
  const heapLimitMB = Math.round(stats.v8HeapStats.heapSizeLimit / 1024 / 1024);
  const usagePercent = Math.round((heapUsedMB / heapLimitMB) * 100);
  const rssMB = Math.round(stats.memoryUsage.rss / 1024 / 1024);
  const osUsedGB = (stats.osMemory.used / 1024 / 1024 / 1024).toFixed(2);
  const osTotalGB = (stats.osMemory.total / 1024 / 1024 / 1024).toFixed(1);

  const pieData = [
    { name: "Used", value: heapUsedMB },
    { name: "Free", value: heapLimitMB - heapUsedMB },
  ];
  const PIE_COLORS = ["#6366f1", "#1e1e2e"];

  return (
    <UITooltipProvider>
      <div className="space-y-5">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Heap Used"
            value={`${heapUsedMB} MB`}
            sub={`${usagePercent}% of ${heapLimitMB} MB limit`}
            progress={usagePercent}
            accent="bg-indigo-500/10 text-indigo-400"
            icon={Memory}
            tooltip="Active memory used by JS objects. Approaching the V8 limit triggers aggressive GC."
          />
          <StatCard
            label="System RSS"
            value={`${rssMB} MB`}
            sub="Physical footprint"
            accent="bg-sky-500/10 text-sky-400"
            icon={HardDrive}
            tooltip="Resident Set Size — total physical RAM held by this process."
          />
          <StatCard
            label="OS Memory"
            value={`${stats.osMemory.percentUsed}%`}
            sub={`${osUsedGB} GB / ${osTotalGB} GB`}
            progress={stats.osMemory.percentUsed}
            accent="bg-amber-500/10 text-amber-400"
            icon={Zap}
            tooltip="Host machine or container memory pressure. High values may throttle the server."
          />
          <StatCard
            label="Environment"
            value="Stable"
            sub={`${stats.v8HeapStats.nativeContexts} isolated contexts`}
            accent="bg-emerald-500/10 text-emerald-400"
            icon={Cpu}
            tooltip="System health based on GC cycles and isolated V8 execution contexts."
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Heap timeline */}
          <div className="lg:col-span-2 bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6">
            <div className="mb-5">
              <h3 className="text-sm font-bold text-white">
                Heap Usage History
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Real-time memory allocation (MB) — last 30 samples
              </p>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#6366f1"
                        stopOpacity={0.25}
                      />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                <p className="text-2xl font-bold text-white">{heapUsedMB} MB</p>
                <p className="text-xs text-zinc-500">heap used</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UITooltipProvider>
  );
}
