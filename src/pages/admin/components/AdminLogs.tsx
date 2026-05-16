import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import {
  Search,
  Filter,
  ArrowDown,
  ArrowUp,
  Terminal,
  AlertTriangle,
  Info,
  XCircle,
  RefreshCw,
} from "lucide-react";

export function AdminLogs() {
  const [source, setSource] = useState("all");
  const [level, setLevel] = useState("all");
  const [limit, setLimit] = useState("100");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const {
    data: logsData,
    isLoading: loading,
    refetch: fetchLogs,
  } = useQuery({
    queryKey: ["admin", "logs", source, level, limit],
    queryFn: () => {
      const params: any = { limit: parseInt(limit) };
      if (source !== "all") params.source = source;
      if (level !== "all") params.level = level;
      return apiClient.getAdminLogs(params);
    },
    select: (res) => (res.success ? res.data : []),
    refetchInterval: autoRefresh ? 5000 : false, // Poll every 5s if auto-refresh is on
  });

  const logs = useMemo(() => logsData || [], [logsData]);

  const getLevelBadge = (lvl: string) => {
    switch (lvl?.toLowerCase()) {
      case "error":
        return (
          <Badge
            variant="destructive"
            className="bg-red-500/20 text-red-500 border-none px-2 py-0.5"
          >
            <XCircle className="h-3 w-3 mr-1" /> Error
          </Badge>
        );
      case "warn":
        return (
          <Badge
            variant="secondary"
            className="bg-amber-500/20 text-amber-500 border-none px-2 py-0.5"
          >
            <AlertTriangle className="h-3 w-3 mr-1" /> Warn
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-500 border-none px-2 py-0.5"
          >
            <Info className="h-3 w-3 mr-1" /> Info
          </Badge>
        );
    }
  };

  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">System Audit Logs</CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="w-[130px] h-9 text-xs bg-background">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="backend">Backend</SelectItem>
                <SelectItem value="frontend">Frontend</SelectItem>
                <SelectItem value="worker">Worker</SelectItem>
              </SelectContent>
            </Select>

            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-[110px] h-9 text-xs bg-background">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warn</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={autoRefresh ? "secondary" : "outline"}
              size="sm"
              className={`h-9 px-3 ${autoRefresh ? "bg-primary/20 text-primary border-primary/20" : ""}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw
                className={`h-3 w-3 mr-2 ${autoRefresh ? "animate-spin" : ""}`}
              />
              {autoRefresh ? "Live Stream On" : "Auto Refresh Off"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead className="w-[100px]">Level</TableHead>
                <TableHead className="w-[100px]">Source</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="w-[150px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && logs.length === 0 ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell
                      colSpan={5}
                      className="h-12 animate-pulse bg-muted/20"
                    />
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-40 text-center text-muted-foreground"
                  >
                    No logs found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, i) => (
                  <TableRow
                    key={log.id || i}
                    className="hover:bg-muted/10 border-muted/20"
                  >
                    <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{getLevelBadge(log.level)}</TableCell>
                    <TableCell className="text-xs font-medium uppercase text-muted-foreground">
                      {log.source || "system"}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {log.message}
                      {log.details && (
                        <div className="text-[10px] text-muted-foreground/60 mt-1 truncate max-w-lg font-mono">
                          {typeof log.details === "object"
                            ? JSON.stringify(log.details)
                            : log.details}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate">
                      {log.action || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
