import React, { useState } from "react";
import {
  X,
  Clock,
  Play,
  Pause,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Mail,
  Calendar,
  Layers,
  Globe,
} from "lucide-react";
import {
  useCanvasSchedules,
  useCreateCanvasSchedule,
  useUpdateCanvasSchedule,
  useDeleteCanvasSchedule,
  useToggleCanvasSchedule,
} from "@/hooks/use-api-queries";
import { CanvasSchedule } from "@/types/agent";

interface SchedulePanelProps {
  workflowId: string;
  workflowName: string;
  isOpen: boolean;
  onClose: () => void;
}

const CRON_PRESETS = [
  { label: "Every Hour", value: "0 * * * *" },
  { label: "Daily (Midnight)", value: "0 0 * * *" },
  { label: "Weekly (Mon Midnight)", value: "0 0 * * 1" },
  { label: "Monthly (1st Midnight)", value: "0 0 1 * *" },
  { label: "Custom Expression", value: "custom" },
];

const COMMON_TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "US Eastern Time (New York)" },
  { value: "America/Chicago", label: "US Central Time (Chicago)" },
  { value: "America/Denver", label: "US Mountain Time (Denver)" },
  { value: "America/Los_Angeles", label: "US Pacific Time (Los Angeles)" },
  { value: "Europe/London", label: "UK Time (London)" },
  { value: "Europe/Paris", label: "Central European Time (Paris)" },
  { value: "Asia/Kolkata", label: "India Time (Kolkata)" },
  { value: "Asia/Tokyo", label: "Japan Time (Tokyo)" },
  { value: "Asia/Singapore", label: "Singapore Time (Singapore)" },
  { value: "Australia/Sydney", label: "Australia Eastern Time (Sydney)" },
];

export const SchedulePanel: React.FC<SchedulePanelProps> = ({
  workflowId,
  workflowName,
  isOpen,
  onClose,
}) => {
  const { data: schedulesResponse, isLoading } = useCanvasSchedules({
    workflow_id: workflowId,
  });
  const createScheduleMutation = useCreateCanvasSchedule();
  const deleteScheduleMutation = useDeleteCanvasSchedule();
  const toggleScheduleMutation = useToggleCanvasSchedule();

  const schedules: CanvasSchedule[] = schedulesResponse?.data || [];

  // Form states
  const [label, setLabel] = useState("");
  const [preset, setPreset] = useState("0 0 * * *"); // Default daily
  const [customCron, setCustomCron] = useState("*/5 * * * *"); // default custom to 5 min
  const [inputText, setInputText] = useState("");
  const [outputFormat, setOutputFormat] = useState<string>("plain");
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailTemplate, setEmailTemplate] = useState("");
  const [maxRuns, setMaxRuns] = useState<string>("");

  // Timezone auto-detection
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const [timezone, setTimezone] = useState(localTz);

  if (!isOpen) return null;

  // Build timezone select list
  const timezoneOptions = [...COMMON_TIMEZONES];
  if (!COMMON_TIMEZONES.some((t) => t.value === localTz)) {
    timezoneOptions.unshift({ value: localTz, label: `Local (${localTz})` });
  }

  const getActiveCron = () => (preset === "custom" ? customCron : preset);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const cronExpr = getActiveCron();

    createScheduleMutation.mutate(
      {
        workflow_id: workflowId,
        cron_expression: cronExpr,
        timezone: timezone,
        label: label.trim() || `Scheduled run for ${workflowName}`,
        input_text: inputText.trim(),
        output_format: outputFormat || null,
        email_enabled: emailEnabled,
        email_to: emailTo.trim(),
        email_subject: emailSubject.trim(),
        email_template: emailTemplate.trim(),
        max_runs: maxRuns ? parseInt(maxRuns, 10) : null,
        is_active: true,
      },
      {
        onSuccess: () => {
          // Reset form
          setLabel("");
          setInputText("");
          setEmailEnabled(false);
          setEmailTo("");
          setEmailSubject("");
          setEmailTemplate("");
          setMaxRuns("");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/40 backdrop-blur-sm">
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-over Content */}
      <div className="w-[480px] h-full bg-card/90 border-l border-border/30 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="p-4 border-b border-border/20 flex items-center justify-between bg-card/40">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-sm font-bold text-foreground">Schedules</h2>
              <p className="text-[10px] text-muted-foreground/60 truncate max-w-[340px]">
                Manage automated runs for &ldquo;{workflowName}&rdquo;
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form and List Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
          {/* Create New Schedule */}
          <div className="bg-background/25 border border-border/20 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              Add Execution Schedule
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
                  Schedule Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Daily Sync"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full bg-background/50 border border-border/30 rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted-foreground/40 outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                />
              </div>

              {/* Grid 2x2 layout */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
                    Frequency Preset
                  </label>
                  <select
                    value={preset}
                    onChange={(e) => setPreset(e.target.value)}
                    className="w-full bg-background/50 border border-border/30 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                  >
                    {CRON_PRESETS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-background/50 border border-border/30 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                  >
                    {timezoneOptions.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
                    Output Format
                  </label>
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    className="w-full bg-background/50 border border-border/30 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                  >
                    <option value="plain">Plain Text</option>
                    <option value="pdf">PDF</option>
                    <option value="csv">CSV</option>
                    <option value="excel">Excel</option>
                    <option value="docx">DOCX</option>
                    <option value="latex">LaTeX</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
                    Max Total Runs (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={maxRuns}
                    onChange={(e) => setMaxRuns(e.target.value)}
                    className="w-full bg-background/50 border border-border/30 rounded-xl px-3 py-1.5 text-xs text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                  />
                </div>
              </div>

              {preset === "custom" && (
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
                    Custom Cron Expression
                  </label>
                  <input
                    type="text"
                    value={customCron}
                    onChange={(e) => setCustomCron(e.target.value)}
                    placeholder="e.g. */15 * * * * (Every 15 mins)"
                    className="w-full bg-background/50 border border-border/30 rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                  />
                  <p className="text-[9px] text-muted-foreground/40 mt-1">
                    Standard 5-field cron syntax: min hour day-of-month month day-of-week
                  </p>
                </div>
              )}

              <div>
                <label className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider block mb-1">
                  Trigger Input Prompt
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Text input to feed into the workflow start nodes..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full bg-background/50 border border-border/30 rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 resize-none transition-all"
                />
              </div>

              {/* Email Delivery Options */}
              <div className="border-t border-border/10 pt-3">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-border/40 text-primary focus:ring-primary/30"
                  />
                  <span className="text-[10px] font-bold text-foreground">
                    Email Result Copy to Destination
                  </span>
                </label>

                {emailEnabled && (
                  <div className="space-y-2.5 mt-2 bg-muted/10 p-3 rounded-xl border border-border/10">
                    <div>
                      <input
                        type="email"
                        placeholder="Recipient Email (Default: Your account email)"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        className="w-full bg-background/50 border border-border/30 rounded-lg px-2.5 py-1.5 text-[10px] text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Email Subject Override (Optional)"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full bg-background/50 border border-border/30 rounded-lg px-2.5 py-1.5 text-[10px] text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </div>
                    <div>
                      <textarea
                        placeholder="HTML email template. Use {{output}} placeholder for results."
                        value={emailTemplate}
                        onChange={(e) => setEmailTemplate(e.target.value)}
                        rows={2}
                        className="w-full bg-background/50 border border-border/30 rounded-lg px-2.5 py-1.5 text-[10px] text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-primary/40 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t border-border/10 pt-3">
                <button
                  type="submit"
                  disabled={createScheduleMutation.isPending || !inputText.trim()}
                  className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-xl transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {createScheduleMutation.isPending ? "Creating..." : "Add Schedule"}
                </button>
              </div>
            </form>
          </div>

          {/* Active Schedules List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Active Schedules ({schedules.length})
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border/20 rounded-2xl">
                <Clock className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground/50">No schedules configured</p>
                <p className="text-[10px] text-muted-foreground/30 mt-0.5">Define one above to start automating</p>
              </div>
            ) : (
              <div className="space-y-3">
                {schedules.map((schedule) => {
                  const isPending =
                    deleteScheduleMutation.isPending ||
                    toggleScheduleMutation.isPending;

                  return (
                    <div
                      key={schedule.id}
                      className={`rounded-2xl border bg-background/10 backdrop-blur-md px-4 py-3 flex flex-col gap-2 transition-all ${
                        schedule.is_active
                          ? "border-primary/20 hover:border-primary/40"
                          : "border-border/15 opacity-60"
                      }`}
                    >
                      {/* Name / Action Toolbar */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">
                            {schedule.label}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[9px] font-mono text-muted-foreground/70 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 shrink-0" />
                              {schedule.cron_expression}
                            </p>
                            <p className="text-[9px] font-medium text-primary/70 bg-primary/5 border border-primary/10 rounded px-1.5 py-0.25 flex items-center gap-0.5">
                              <Globe className="w-2.5 h-2.5 shrink-0" />
                              {schedule.timezone}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => toggleScheduleMutation.mutate(schedule.id)}
                            disabled={isPending}
                            className={`p-1.5 rounded-lg border transition-all ${
                              schedule.is_active
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                            }`}
                            title={schedule.is_active ? "Pause schedule" : "Activate schedule"}
                          >
                            {schedule.is_active ? (
                              <Pause className="w-3 h-3" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                            disabled={isPending}
                            className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                            title="Delete schedule"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Input Text Preview */}
                      <div className="bg-background/25 rounded-lg p-2 border border-border/10">
                        <p className="text-[10px] text-muted-foreground line-clamp-2 italic">
                          &ldquo;{schedule.input_text}&rdquo;
                        </p>
                      </div>

                      {/* Status / History Details */}
                      <div className="flex items-center justify-between text-[9px] text-muted-foreground/60 pt-1 border-t border-border/5">
                        <div className="flex items-center gap-3">
                          <span>Runs: {schedule.run_count}</span>
                          {schedule.email_enabled && (
                            <span className="flex items-center gap-0.5 text-sky-400 max-w-[130px] truncate" title={schedule.email_to || "Your email"}>
                              <Mail className="w-2.5 h-2.5 shrink-0" /> {schedule.email_to || "Me"}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {schedule.last_run_status && (
                            <span className="flex items-center gap-0.5">
                              {schedule.last_run_status === "success" ? (
                                <span className="flex items-center gap-0.5 text-emerald-400 font-medium">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Success
                                </span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-rose-400 font-medium">
                                  <AlertCircle className="w-2.5 h-2.5" /> Failed
                                </span>
                              )}
                            </span>
                          )}

                          {schedule.is_active && schedule.next_run_at && (
                            <span className="text-muted-foreground/40">
                              Next: {new Date(schedule.next_run_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
