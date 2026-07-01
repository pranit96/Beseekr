// src/components/canvas/RetryNode.tsx
// Feature 4: Quality-Gated Retry Wrapper
// Runs an agent, checks quality, retries with exponential backoff

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Cpu,
} from "lucide-react";
import { useMyAgents } from "@/hooks/use-api-queries";

const CHECK_MODES = [
  { value: "min_length", label: "Min Character Length", placeholder: "500" },
  {
    value: "no_error_strings",
    label: "No Error Strings",
    placeholder: "(no config needed)",
  },
  {
    value: "regex_match",
    label: "Regex Match",
    placeholder: "\\d{4}-\\d{2}-\\d{2}",
  },
  {
    value: "ai_judge",
    label: "AI Quality Judge",
    placeholder: "Must be professional and include 3+ action items",
  },
];

const RetryNode = memo(({ data, selected }: NodeProps) => {
  const [expanded, setExpanded] = useState(false);
  const { data: agentsResponse } = useMyAgents();
  const agents = agentsResponse?.data || [];

  const maxRetries = (data.maxRetries as number) || 3;
  const checkMode = (data.checkMode as string) || "min_length";
  const checkValue = (data.checkValue as string) || "";
  const label = (data.label as string) || "Retry Wrapper";
  const agentName = (data.agentName as string) || "Select agent...";

  const isRunning = (data.status as string) === "running";
  const isDone = (data.status as string) === "done";
  const isError = (data.status as string) === "error";
  const attemptsUsed = (data._attemptsUsed as number) || 0;
  const passed = data._passed as boolean;

  const currentMode =
    CHECK_MODES.find((m) => m.value === checkMode) || CHECK_MODES[0];

  return (
    <div
      className={`
        relative min-w-[220px] rounded-2xl border-2 shadow-xl shadow-black/20 overflow-hidden
        transition-all duration-300
        ${selected ? "border-emerald-400 shadow-emerald-500/30" : "border-emerald-500/30"}
        ${isRunning ? "shadow-emerald-500/40 border-emerald-400/70" : ""}
        ${isError || (isDone && !passed) ? "border-rose-500/50 shadow-rose-500/20" : ""}
        ${isDone && passed ? "border-emerald-400/80 shadow-emerald-500/30" : ""}
      `}
      style={{ background: "hsl(145 18% 9%)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3.5 pt-3 pb-2.5 border-b border-emerald-500/15">
        <div
          className={`
          w-8 h-8 rounded-xl flex items-center justify-center shrink-0
          shadow-lg
          ${isDone && passed ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30" : ""}
          ${isDone && !passed ? "bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/30" : ""}
          ${isRunning ? "bg-gradient-to-br from-emerald-500/50 to-teal-600/50 shadow-emerald-500/20 animate-pulse" : ""}
          ${!isRunning && !isDone ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30" : ""}
        `}
        >
          {isDone && passed ? (
            <CheckCircle2 className="w-4 h-4 text-white" />
          ) : isDone && !passed ? (
            <XCircle className="w-4 h-4 text-white" />
          ) : isRunning ? (
            <RefreshCcw className="w-4 h-4 text-white animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
            Quality Gate
          </div>
          <div className="text-xs font-bold text-foreground truncate">
            {label}
          </div>
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="p-1 rounded-lg hover:bg-emerald-500/10 text-emerald-400/60 hover:text-emerald-400 transition-colors"
        >
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      <div className="px-3.5 py-3 space-y-2.5">
        {/* Retry attempt display */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-emerald-400/60 uppercase tracking-widest">
              Retry Budget
            </span>
            {attemptsUsed > 0 && (
              <span
                className={`text-[10px] font-black ${passed ? "text-emerald-400" : "text-rose-400"}`}
              >
                {attemptsUsed}/{maxRetries + 1} attempts
              </span>
            )}
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: maxRetries + 1 }).map((_, i) => (
              <div
                key={i}
                className={`
                  flex-1 h-2 rounded-full transition-all duration-500
                  ${isRunning && i === attemptsUsed - 1 ? "bg-amber-400 animate-pulse" : ""}
                  ${i < attemptsUsed && !(isRunning && i === attemptsUsed - 1) ? (passed && i === attemptsUsed - 1 ? "bg-emerald-500" : "bg-rose-500/60") : ""}
                  ${i >= attemptsUsed && !(isRunning && i === attemptsUsed - 1) ? "bg-emerald-900/40 border border-emerald-500/15" : ""}
                `}
              />
            ))}
          </div>
        </div>

        {/* Agent chip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
          <Cpu className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="text-[11px] font-semibold text-emerald-300/80 truncate">
            {agentName}
          </span>
        </div>

        {/* Check mode badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="text-[11px] font-semibold text-emerald-300/80 truncate">
            {currentMode.label}
          </span>
        </div>

        {/* Expanded config */}
        {expanded && (
          <div className="space-y-2 pt-1 border-t border-emerald-500/10">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-emerald-400/50 uppercase tracking-widest">
                Target Agent
              </label>
              <select
                value={(data.agentId as string) || ""}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const selectedAgent = agents.find(
                    (a: any) => a.id === selectedId,
                  );
                  (data.onAgentChange as Function)?.(
                    selectedId,
                    selectedAgent ? selectedAgent.name : "Unknown",
                  );
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-background/40 border border-emerald-500/20 text-foreground focus:border-emerald-400/50 focus:outline-none"
              >
                <option value="">-- Select Agent --</option>
                {agents.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-emerald-400/50 uppercase tracking-widest">
                Max Retries
              </label>
              <input
                type="number"
                min={0}
                max={3}
                value={maxRetries}
                onChange={(e) =>
                  (data.onMaxRetriesChange as Function)?.(
                    parseInt(e.target.value),
                  )
                }
                className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-background/40 border border-emerald-500/20 text-foreground focus:border-emerald-400/50 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-emerald-400/50 uppercase tracking-widest">
                Quality Check Mode
              </label>
              <select
                value={checkMode}
                onChange={(e) =>
                  (data.onCheckModeChange as Function)?.(e.target.value)
                }
                className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-background/40 border border-emerald-500/20 text-foreground focus:border-emerald-400/50 focus:outline-none"
              >
                {CHECK_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            {checkMode !== "no_error_strings" && (
              <div className="space-y-1">
                <label className="text-[9px] font-black text-emerald-400/50 uppercase tracking-widest">
                  {checkMode === "min_length"
                    ? "Min Characters"
                    : checkMode === "regex_match"
                      ? "Regex Pattern"
                      : "Quality Criteria"}
                </label>
                <input
                  value={checkValue}
                  onChange={(e) =>
                    (data.onCheckValueChange as Function)?.(e.target.value)
                  }
                  placeholder={currentMode.placeholder}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-background/40 border border-emerald-500/20 text-foreground placeholder:text-muted-foreground/40 focus:border-emerald-400/50 focus:outline-none"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="retry-in"
        className="!w-3 !h-3 !border-2 !border-emerald-400 !bg-emerald-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="retry-pass"
        className="!w-3 !h-3 !border-2 !border-emerald-400 !bg-emerald-900"
        style={{ top: "40%" }}
        title="Pass output"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="retry-fail"
        className="!w-3 !h-3 !border-2 !border-rose-400 !bg-rose-900"
        style={{ top: "65%" }}
        title="Final failed output"
      />
    </div>
  );
});

RetryNode.displayName = "RetryNode";
export default RetryNode;
