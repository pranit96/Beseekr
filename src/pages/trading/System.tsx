import { useEffect } from "react";
import { useTradingWebSocket } from "@/hooks/useTradingWebSocket";
import {
  Activity,
  Database,
  Cpu,
  Zap,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function System() {
  const { systemHealth, subscribeToHealth } = useTradingWebSocket();

  useEffect(() => {
    subscribeToHealth();
  }, [subscribeToHealth]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-500";
      case "degraded":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
      case "warning":
        return "text-orange-500";
      case "critical":
        return "text-red-600";
      default:
        return "text-slate-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return CheckCircle;
      case "degraded":
      case "warning":
        return AlertCircle;
      case "error":
      case "critical":
        return AlertCircle;
      default:
        return Activity;
    }
  };

  if (!systemHealth) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading system health...</div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(systemHealth.overall_status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">System Health</h1>
        <p className="text-slate-400 mt-1">
          Monitor system status and performance
        </p>
      </div>

      {/* Overall Status */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
        <div className="flex items-center gap-4">
          <StatusIcon
            className={cn(
              "h-12 w-12",
              getStatusColor(systemHealth.overall_status),
            )}
          />
          <div>
            <div className="text-sm text-slate-400">Overall System Status</div>
            <div
              className={cn(
                "text-3xl font-bold uppercase",
                getStatusColor(systemHealth.overall_status),
              )}
            >
              {systemHealth.overall_status}
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Zerodha Service */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap
              className={cn(
                "h-6 w-6",
                getStatusColor(systemHealth.services.zerodha.status),
              )}
            />
            <div>
              <div className="text-lg font-bold text-white">Zerodha API</div>
              <div
                className={cn(
                  "text-sm font-medium",
                  getStatusColor(systemHealth.services.zerodha.status),
                )}
              >
                {systemHealth.services.zerodha.status.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-slate-400">
              {systemHealth.services.zerodha.message}
            </div>

            {systemHealth.services.zerodha.circuit_breaker && (
              <div className="bg-slate-800 rounded p-3">
                <div className="text-xs text-slate-500 mb-1">
                  Circuit Breaker
                </div>
                <div className="text-sm text-white">
                  State:{" "}
                  <span className="font-medium">
                    {systemHealth.services.zerodha.circuit_breaker.state}
                  </span>
                </div>
                <div className="text-sm text-white">
                  Failures:{" "}
                  <span className="font-medium">
                    {systemHealth.services.zerodha.circuit_breaker.failures}
                  </span>
                </div>
              </div>
            )}

            {systemHealth.services.zerodha.response_time_ms !== undefined && (
              <div className="text-sm text-slate-400">
                Response Time:{" "}
                <span className="text-white font-medium">
                  {systemHealth.services.zerodha.response_time_ms}ms
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Claude Service */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Cpu
              className={cn(
                "h-6 w-6",
                getStatusColor(systemHealth.services.claude.status),
              )}
            />
            <div>
              <div className="text-lg font-bold text-white">Claude AI</div>
              <div
                className={cn(
                  "text-sm font-medium",
                  getStatusColor(systemHealth.services.claude.status),
                )}
              >
                {systemHealth.services.claude.status.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-slate-400">
              {systemHealth.services.claude.message}
            </div>

            {systemHealth.services.claude.circuit_breaker && (
              <div className="bg-slate-800 rounded p-3">
                <div className="text-xs text-slate-500 mb-1">
                  Circuit Breaker
                </div>
                <div className="text-sm text-white">
                  State:{" "}
                  <span className="font-medium">
                    {systemHealth.services.claude.circuit_breaker.state}
                  </span>
                </div>
                <div className="text-sm text-white">
                  Failures:{" "}
                  <span className="font-medium">
                    {systemHealth.services.claude.circuit_breaker.failures}
                  </span>
                </div>
              </div>
            )}

            {systemHealth.services.claude.accuracy && (
              <div className="bg-slate-800 rounded p-3">
                <div className="text-xs text-slate-500 mb-1">
                  Validation Accuracy
                </div>
                <div className="text-sm text-white">
                  Rate:{" "}
                  <span className="text-green-400 font-medium">
                    {systemHealth.services.claude.accuracy.rate}
                  </span>
                </div>
                <div className="text-sm text-white">
                  Total:{" "}
                  <span className="font-medium">
                    {systemHealth.services.claude.accuracy.total_validations}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Database Service */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database
              className={cn(
                "h-6 w-6",
                getStatusColor(systemHealth.services.database.status),
              )}
            />
            <div>
              <div className="text-lg font-bold text-white">Database</div>
              <div
                className={cn(
                  "text-sm font-medium",
                  getStatusColor(systemHealth.services.database.status),
                )}
              >
                {systemHealth.services.database.status.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-slate-400">
              {systemHealth.services.database.message}
            </div>

            {systemHealth.services.database.response_time_ms !== undefined && (
              <div className="text-sm text-slate-400">
                Response Time:{" "}
                <span className="text-white font-medium">
                  {systemHealth.services.database.response_time_ms}ms
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Memory Service */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity
              className={cn(
                "h-6 w-6",
                getStatusColor(systemHealth.services.memory.status),
              )}
            />
            <div>
              <div className="text-lg font-bold text-white">Memory</div>
              <div
                className={cn(
                  "text-sm font-medium",
                  getStatusColor(systemHealth.services.memory.status),
                )}
              >
                {systemHealth.services.memory.status.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-slate-400">
              {systemHealth.services.memory.message}
            </div>

            <div className="bg-slate-800 rounded p-3 space-y-2">
              <div className="text-sm text-white">
                Heap Used:{" "}
                <span className="font-medium">
                  {systemHealth.services.memory.heap_used_mb}
                </span>
              </div>
              <div className="text-sm text-white">
                Heap Total:{" "}
                <span className="font-medium">
                  {systemHealth.services.memory.heap_total_mb}
                </span>
              </div>
              <div className="text-sm text-white">
                Usage:{" "}
                <span
                  className={cn(
                    "font-medium",
                    parseFloat(systemHealth.services.memory.heap_percent) > 80
                      ? "text-red-400"
                      : parseFloat(systemHealth.services.memory.heap_percent) >
                          60
                        ? "text-yellow-400"
                        : "text-green-400",
                  )}
                >
                  {systemHealth.services.memory.heap_percent}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      {systemHealth.metrics && (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Performance Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">API Calls</div>
              <div className="text-2xl font-bold text-white">
                {systemHealth.metrics.api_calls}
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">API Errors</div>
              <div className="text-2xl font-bold text-red-400">
                {systemHealth.metrics.api_errors}
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">
                Avg Response Time
              </div>
              <div className="text-2xl font-bold text-white">
                {systemHealth.metrics.avg_response_time}ms
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-sm text-slate-500 text-center">
        Last updated: {new Date(systemHealth.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
