import React, { memo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Clock, Play, Pause, ChevronDown, Globe, Loader2, Zap } from "lucide-react";
import { useCanvasSchedules } from "@/hooks/use-api-queries";

interface ScheduleNodeData {
  label?: string;
  onLabelChange?: (val: string) => void;
  cronPreset?: string;
  onCronPresetChange?: (val: string) => void;
  customCron?: string;
  onCustomCronChange?: (val: string) => void;
  timezone?: string;
  onTimezoneChange?: (val: string) => void;
  maxRuns?: string;
  onMaxRunsChange?: (val: string) => void;
  isActive?: boolean;
  onActiveToggle?: (val: boolean) => void;
  nextRunAt?: string;
  scheduleId?: string;
  runCount?: number;
  lastRunStatus?: string;
  inputText?: string;
  onInputTextChange?: (val: string) => void;
  onExecute?: () => Promise<void>;
  adaptiveCron?: boolean;
  onAdaptiveCronToggle?: (val: boolean) => void;
  dependsOnScheduleId?: string;
  onDependsOnScheduleIdChange?: (val: string) => void;
  [key: string]: unknown;
}

const CRON_PRESETS = [
  { label: "Every 5 min", value: "*/5 * * * *" },
  { label: "Every Hour", value: "0 * * * *" },
  { label: "Daily (Midnight)", value: "0 0 * * *" },
  { label: "Daily (9 AM)", value: "0 9 * * *" },
  { label: "Weekly (Mon)", value: "0 0 * * 1" },
  { label: "Monthly (1st)", value: "0 0 1 * *" },
  { label: "Custom", value: "custom" },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "US Eastern" },
  { value: "America/Chicago", label: "US Central" },
  { value: "America/Los_Angeles", label: "US Pacific" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Australia/Sydney", label: "Sydney" },
];

function humanizeCron(cronStr: string): string {
  if (!cronStr) return "Invalid cron expression";
  const parts = cronStr.trim().split(/\s+/);
  if (parts.length !== 5) return "Custom cron expression";
  const [min, hour, dom, month, dow] = parts;

  // Presets mapping
  if (min === "*/5" && hour === "*" && dom === "*" && month === "*" && dow === "*") {
    return "Runs every 5 minutes";
  }
  if (min === "0" && hour === "*" && dom === "*" && month === "*" && dow === "*") {
    return "Runs every hour";
  }
  if (min === "0" && hour === "0" && dom === "*" && month === "*" && dow === "*") {
    return "Runs daily at midnight";
  }
  if (min === "0" && hour === "9" && dom === "*" && month === "*" && dow === "*") {
    return "Runs daily at 9:00 AM";
  }
  if (min === "0" && hour === "0" && dom === "*" && month === "*" && dow === "1") {
    return "Runs weekly on Mondays at midnight";
  }
  if (min === "0" && hour === "0" && dom === "1" && month === "*" && dow === "*") {
    return "Runs monthly on the 1st at midnight";
  }

  try {
    let timeStr = "";
    if (hour !== "*" && min !== "*") {
      const h = parseInt(hour, 10);
      const m = parseInt(min, 10);
      if (!isNaN(h) && !isNaN(m)) {
        const ampm = h >= 12 ? "PM" : "AM";
        const displayHour = h % 12 === 0 ? 12 : h % 12;
        const displayMin = m < 10 ? `0${m}` : m;
        timeStr = `at ${displayHour}:${displayMin} ${ampm}`;
      } else {
        timeStr = `at hour ${hour} and minute ${min}`;
      }
    } else if (min !== "*") {
      timeStr = `at minute ${min} of every hour`;
    } else {
      timeStr = "every minute";
    }

    let dayStr = "";
    if (dow !== "*") {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const activeDays = dow.split(",").map(d => {
        const val = parseInt(d, 10);
        return days[val] || d;
      });
      dayStr = ` on ${activeDays.join(", ")}`;
    } else if (dom !== "*") {
      dayStr = ` on day ${dom} of the month`;
    }

    let monthStr = "";
    if (month !== "*") {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const activeMonths = month.split(",").map(m => {
        const val = parseInt(m, 10) - 1;
        return months[val] || m;
      });
      monthStr = ` in ${activeMonths.join(", ")}`;
    }

    return `Runs ${timeStr}${dayStr}${monthStr}`;
  } catch (err) {
    return "Custom cron expression";
  }
}

const ScheduleNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as ScheduleNodeData;
  const { id: workflowId } = useParams<{ id?: string }>();
  const { data: schedulesResponse } = useCanvasSchedules(
    workflowId ? { workflow_id: workflowId } : undefined
  );
  const otherSchedules = (schedulesResponse?.data || []).filter(
    (s: any) => s.id !== d.scheduleId
  );

  const preset = d.cronPreset || "0 0 * * *";
  const isCustom = preset === "custom";
  const isActive = d.isActive ?? false;
  const [isExecuting, setIsExecuting] = useState(false);
  const [localTz] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );

  // Auto-set timezone on mount if not set
  useEffect(() => {
    if (!d.timezone && d.onTimezoneChange) {
      d.onTimezoneChange(localTz);
    }
  }, []);

  // Build timezone list with local timezone at top
  const tzOptions = [...TIMEZONES];
  if (!TIMEZONES.some((t) => t.value === localTz)) {
    tzOptions.unshift({ value: localTz, label: `Local (${localTz.split("/").pop()})` });
  }

  const activeCron = isCustom ? d.customCron || "*/5 * * * *" : preset;
  const presetLabel = CRON_PRESETS.find((p) => p.value === preset)?.label || "Custom";

  return (
    <div
      className={`group relative min-w-[270px] max-w-[320px] rounded-2xl border transition-all duration-300 ${
        selected
          ? "border-amber-500/60 shadow-lg shadow-amber-500/20 bg-amber-500/[0.04]"
          : "border-border/40 hover:border-amber-500/30 bg-card/60"
      } backdrop-blur-xl`}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-amber-500 !border-2 !border-background !rounded-full !shadow-lg !shadow-amber-500/30"
      />

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-amber-500 !border-2 !border-background !rounded-full !shadow-lg !shadow-amber-500/30"
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/20">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background:
              "linear-gradient(135deg, hsl(35,80%,55%), hsl(25,80%,50%))",
            boxShadow: "0 4px 16px hsla(35,70%,55%,0.3)",
          }}
        >
          <Clock className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground tracking-tight">
            {d.label || "Schedule"}
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            {isActive ? `Active · ${presetLabel}` : "Paused"}
          </p>
        </div>
        {/* Active toggle */}
        <button
          onClick={() => d.onActiveToggle?.(!isActive)}
          className={`p-1.5 rounded-lg transition-all ${
            isActive
              ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
              : "bg-muted/30 text-muted-foreground/40 hover:bg-muted/50 hover:text-muted-foreground"
          }`}
          title={isActive ? "Pause schedule" : "Activate schedule"}
        >
          {isActive ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 flex flex-col gap-2.5">
        {/* Label */}
        <div>
          <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
            Name
          </label>
          <input
            type="text"
            value={d.label || ""}
            onChange={(e) => d.onLabelChange?.(e.target.value)}
            placeholder="e.g. Daily Digest"
            className="w-full bg-background/40 border border-border/30 rounded-lg px-2.5 py-1 text-[10px] text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all"
          />
        </div>

        {/* Startup Message Payload */}
        <div>
          <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
            Startup Message (Input Payload)
          </label>
          <textarea
            value={d.inputText || ""}
            onChange={(e) => d.onInputTextChange?.(e.target.value)}
            placeholder="e.g. Run daily research report..."
            rows={2}
            className="w-full bg-background/40 border border-border/30 rounded-lg px-2.5 py-1.5 text-[10px] text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all resize-none font-sans"
          />
        </div>

        {/* Frequency + Timezone row */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
              Frequency
            </label>
            <div className="relative">
              <select
                value={preset}
                onChange={(e) => d.onCronPresetChange?.(e.target.value)}
                className="w-full bg-background/40 border border-border/30 rounded-lg pl-2.5 pr-6 py-1 text-[10px] text-foreground outline-none focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all appearance-none cursor-pointer"
              >
                {CRON_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted-foreground/40 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
              <Globe className="w-2.5 h-2.5 inline mr-0.5 -mt-0.5" />
              Timezone
            </label>
            <div className="relative">
              <select
                value={d.timezone || localTz}
                onChange={(e) => d.onTimezoneChange?.(e.target.value)}
                className="w-full bg-background/40 border border-border/30 rounded-lg pl-2.5 pr-6 py-1 text-[10px] text-foreground outline-none focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all appearance-none cursor-pointer"
              >
                {tzOptions.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted-foreground/40 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Custom cron expression */}
        {isCustom && (
          <div>
            <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
              Cron Expression
            </label>
            <input
              type="text"
              value={d.customCron || "*/5 * * * *"}
              onChange={(e) => d.onCustomCronChange?.(e.target.value)}
              placeholder="*/5 * * * *"
              className="w-full bg-background/40 border border-border/30 rounded-lg px-2.5 py-1 text-[10px] text-foreground font-mono placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all"
            />
            <p className="text-[8px] text-muted-foreground/35 mt-0.5">
              min hour day month weekday
            </p>
          </div>
        )}

        {/* Max runs */}
        <div>
          <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
            Max Runs (optional)
          </label>
          <input
            type="number"
            min="1"
            value={d.maxRuns || ""}
            onChange={(e) => d.onMaxRunsChange?.(e.target.value)}
            placeholder="Unlimited"
            className="w-full bg-background/40 border border-border/30 rounded-lg px-2.5 py-1 text-[10px] text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all"
          />
        </div>

        {/* Adaptive Cadence Toggle */}
        <div className="flex items-center justify-between py-1.5 px-2.5 bg-amber-500/5 rounded-lg border border-amber-500/10 mt-1">
          <div>
            <span className="text-[10px] font-bold text-amber-400 block">Smart Cadence</span>
            <span className="text-[8px] text-muted-foreground/50 block leading-tight">Backs off cadence if output novelty is low</span>
          </div>
          <input
            type="checkbox"
            checked={d.adaptiveCron ?? false}
            onChange={(e) => d.onAdaptiveCronToggle?.(e.target.checked)}
            className="w-4 h-4 rounded border-border text-amber-500 focus:ring-amber-500 bg-background/40 cursor-pointer"
          />
        </div>

        {/* Schedule Dependency Chain */}
        <div>
          <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
            Run After (Dependency)
          </label>
          <div className="relative">
            <select
              value={d.dependsOnScheduleId || ""}
              onChange={(e) => d.onDependsOnScheduleIdChange?.(e.target.value || "")}
              className="w-full bg-background/40 border border-border/30 rounded-lg pl-2.5 pr-6 py-1 text-[10px] text-foreground outline-none focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all appearance-none cursor-pointer"
            >
              <option value="">-- No Dependency --</option>
              {otherSchedules.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.label || `Schedule ${s.id.slice(0, 6)}`}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted-foreground/40 pointer-events-none" />
          </div>
          <p className="text-[8px] text-muted-foreground/35 mt-0.5">
            Only execute if this upstream schedule ran successfully today
          </p>
        </div>

        {/* Cron explainer */}
        <div className="bg-amber-500/5 rounded-lg px-2.5 py-1.5 border border-amber-500/10 mt-1">
          <p className="text-[9px] text-amber-400 font-medium leading-relaxed">
            {humanizeCron(activeCron)}
          </p>
        </div>

        {/* Trigger Now Button */}
        {d.onExecute && (
          <button
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              if (isExecuting) return;
              setIsExecuting(true);
              try {
                await d.onExecute();
              } catch (err) {
                console.error(err);
              } finally {
                setIsExecuting(false);
              }
            }}
            disabled={isExecuting}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 active:scale-95 disabled:opacity-50 transition-all cursor-pointer mt-1"
          >
            {isExecuting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            )}
            Trigger Workflow Now
          </button>
        )}

        {/* Status footer */}
        {(d.scheduleId || d.runCount !== undefined) && (
          <div className="flex items-center gap-2 pt-1 border-t border-border/10">
            {d.lastRunStatus && (
              <span
                className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md ${
                  d.lastRunStatus === "success"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {d.lastRunStatus}
              </span>
            )}
            {d.runCount !== undefined && d.runCount > 0 && (
              <span className="text-[9px] text-muted-foreground/40">
                {d.runCount} runs
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ScheduleNode);
