import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Cell
} from "recharts";
import { Cpu, MemoryStick as Memory, HardDrive, Zap } from "lucide-react";

export function AdminMonitoring() {
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.getAdminMemoryStats();
        if (res.success) {
          const newData = res.data;
          setStats(newData);
          
          setHistory(prev => {
            const updated = [...prev, {
              time: new Date().toLocaleTimeString(),
              used: Math.round(newData.memoryUsage.heapUsed / 1024 / 1024),
              total: Math.round(newData.memoryUsage.heapTotal / 1024 / 1024),
              limit: Math.round(newData.v8HeapStats.heapSizeLimit / 1024 / 1024)
            }];
            return updated.slice(-20); // Keep last 20 points
          });
        }
      } catch (error) {
        console.error("Failed to fetch memory stats:", error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-xl" />)}
  </div>;

  const heapUsedMB = Math.round(stats.memoryUsage.heapUsed / 1024 / 1024);
  const heapLimitMB = Math.round(stats.v8HeapStats.heapSizeLimit / 1024 / 1024);
  const usagePercent = Math.round((heapUsedMB / heapLimitMB) * 100);

  const pieData = [
    { name: "Used", value: heapUsedMB },
    { name: "Free", value: heapLimitMB - heapUsedMB }
  ];

  const COLORS = ["#3b82f6", "#1e293b"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Heap Used</CardTitle>
            <Memory className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{heapUsedMB} MB</div>
            <p className="text-xs text-muted-foreground mt-1">
              {usagePercent}% of {heapLimitMB}MB limit
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">RSS Memory</CardTitle>
            <HardDrive className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.memoryUsage.rss / 1024 / 1024)} MB</div>
            <p className="text-xs text-muted-foreground mt-1">Resident Set Size</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Native Contexts</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.v8HeapStats.nativeContexts}</div>
            <p className="text-xs text-muted-foreground mt-1">Isolation units</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">GC Status</CardTitle>
            <Cpu className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Healthy</div>
            <p className="text-xs text-muted-foreground mt-1">Memory management active</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Heap Usage History</CardTitle>
            <CardDescription>Real-time memory allocation over time (MB)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" hide />
                <YAxis hide domain={[0, 'dataMax + 100']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="used" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorUsed)" 
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Memory Distribution</CardTitle>
            <CardDescription>Heap Used vs. Free Space</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
