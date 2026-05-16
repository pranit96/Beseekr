import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import {
  RefreshCw,
  AlertTriangle,
  Info,
  XCircle,
  Terminal,
  Zap,
} from "lucide-react";

const LEVEL_CONFIG = {
  error: {
    icon: XCircle,
    badge: "text-red-400 bg-red-500/10 border border-red-500/20",
    row: "bg-red-500/[0.02]",
    dot: "bg-red-500",
  },
  warn: {
    icon: AlertTriangle,
    badge: "text-amber-400 bg-amber-500/10 border border-amber-500/20",
    row: "bg-amber-500/[0.015]",
    dot: "bg-amber-500",
  },
  info: {
    icon: Info,
    badge: "text-sky-400 bg-sky-500/10 border border-sky-500/20",
    row: "",
    dot: "bg-sky-500",
  },
};

const getLevelCfg = (lvl: string) =>
  LEVEL_CONFIG[lvl?.toLowerCase() as keyof typeof LEVEL_CONFIG] ||
  LEVEL_CONFIG.info;

export function AdminLogs() {
  const [source, setSource] = useState("all");
  const [level, setLevel] = useState("all");
  const [limit, setLimit] = useState("100");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const {
    data: logsData,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ["admin", "logs", source, level, limit],
    queryFn: () => {
      const params: any = { limit: parseInt(limit) };
      if (source !== "all") params.source = source;
      if (level !== "all") params.level = level;
      return apiClient.getAdminLogs(params);
    },
    select: (res) => (res.success ? res.data : []),
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const logs = useMemo(() => logsData || [], [logsData]);

  const errorCount = logs.filter(
    (l: any) => l.level?.toLowerCase() === "error",
  ).length;
  const warnCount = logs.filter(
    (l: any) => l.level?.toLowerCase() === "warn",
  ).length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Summary pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-1.5">
            <Terminal className="w-3.5 h-3.5 text-zinc-500" />
            {logs.length} entries
          </div>
          {errorCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-1.5">
              <XCircle className="w-3.5 h-3.5" />
              {errorCount} errors
            </div>
          )}
          {warnCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {warnCount} warnings
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-[120px] h-9 bg-white/[0.03] border-white/[0.08] text-xs rounded-xl text-zinc-300">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/[0.1] text-zinc-300">
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="backend">Backend</SelectItem>
              <SelectItem value="frontend">Frontend</SelectItem>
              <SelectItem value="worker">Worker</SelectItem>
            </SelectContent>
          </Select>

          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-[110px] h-9 bg-white/[0.03] border-white/[0.08] text-xs rounded-xl text-zinc-300">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/[0.1] text-zinc-300">
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warn">Warn</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`h-9 px-3 rounded-xl text-xs font-bold gap-1.5 border transition-all ${
              autoRefresh
                ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/15"
                : "border-white/[0.08] text-zinc-500 hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {autoRefresh ? "Live" : "Live Off"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="h-9 w-9 p-0 text-zinc-500 hover:text-white border border-white/[0.08] rounded-xl"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Log table */}
      <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
        {/* Table head */}
        <div className="grid grid-cols-[160px_80px_90px_1fr_120px] gap-0 border-b border-white/[0.06] bg-white/[0.02] px-5 py-2.5">
          {["Timestamp", "Level", "Source", "Message", "Action"].map((h) => (
            <span
              key={h}
              className="text-[10px] font-black uppercase tracking-widest text-zinc-600"
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/[0.04]">
          {loading && logs.length === 0 ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-12 px-5 animate-pulse flex items-center gap-4"
              >
                <div className="h-2.5 w-32 bg-white/[0.04] rounded" />
                <div className="h-2.5 w-14 bg-white/[0.04] rounded" />
                <div className="h-2.5 w-16 bg-white/[0.04] rounded" />
                <div className="h-2.5 flex-1 bg-white/[0.04] rounded" />
              </div>
            ))
          ) : logs.length === 0 ? (
            <div className="py-20 text-center">
              <Terminal className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-600 font-medium">
                No logs found for the selected filters.
              </p>
            </div>
          ) : (
            logs.map((log: any, i: number) => {
              const cfg = getLevelCfg(log.level);
              const LevelIcon = cfg.icon;
              return (
                <div
                  key={log.id || i}
                  className={`grid grid-cols-[160px_80px_90px_1fr_120px] gap-0 px-5 py-3 hover:bg-white/[0.02] transition-colors ${cfg.row}`}
                >
                  {/* Timestamp */}
                  <span className="text-[11px] font-mono text-zinc-600 flex items-center">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>

                  {/* Level badge */}
                  <span className="flex items-center">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-lg ${cfg.badge}`}
                    >
                      <LevelIcon className="w-2.5 h-2.5" />
                      {log.level?.toUpperCase() || "INFO"}
                    </span>
                  </span>

                  {/* Source */}
                  <span className="text-[11px] text-zinc-600 font-bold uppercase tracking-wider flex items-center">
                    {log.source || "system"}
                  </span>

                  {/* Message */}
                  <div className="min-w-0 flex items-start flex-col justify-center gap-0.5 pr-4">
                    <span className="text-xs text-zinc-300 font-medium leading-snug line-clamp-1">
                      {log.message}
                    </span>
                    {log.details && (
                      <span className="text-[10px] font-mono text-zinc-600 truncate max-w-full">
                        {typeof log.details === "object"
                          ? JSON.stringify(log.details)
                          : log.details}
                      </span>
                    )}
                  </div>

                  {/* Action */}
                  <span className="text-[11px] text-zinc-600 truncate flex items-center">
                    {log.action || "—"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="text-[11px] text-zinc-700 text-center font-medium">
        Showing last {limit} entries ·{" "}
        {autoRefresh ? "Refreshing every 5s" : "Manual refresh mode"}
      </p>
    </div>
  );
}
