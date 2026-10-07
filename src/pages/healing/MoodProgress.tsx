// src/pages/healing/MoodProgress.tsx
// Weekly progress charts — emotion intensity trends and thinking trap frequency

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, TrendingDown, TrendingUp, Minus, Loader2, Sparkles } from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import healingApi from "@/api/healing";

const TRAP_LABELS: Record<string, string> = {
  catastrophizing: "Catastrophizing",
  mind_reading: "Mind Reading",
  fortune_telling: "Fortune Telling",
  all_or_nothing: "All-or-Nothing",
  overgeneralizing: "Overgeneralizing",
  emotional_reasoning: "Emotional Reasoning",
  should_statements: "Should Statements",
  personalization: "Personalization",
};

export default function MoodProgress() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["healing-progress"],
    queryFn: () => healingApi.getProgress(8),
  });

  const weekly = data?.data?.weekly ?? [];
  const totalCompleted = data?.data?.total_completed ?? 0;

  // Prepare chart data
  const chartData = weekly.map((w) => ({
    week: format(parseISO(w.week), "MMM d"),
    Before: w.avg_intensity_before,
    After: w.avg_intensity_after,
    records: w.count,
  }));

  // Trap frequency across all weeks
  const trapCounts: Record<string, number> = {};
  weekly.forEach((w) => {
    w.top_traps.forEach(({ trap, count }) => {
      trapCounts[trap] = (trapCounts[trap] ?? 0) + count;
    });
  });
  const trapData = Object.entries(trapCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([trap, count]) => ({ trap: TRAP_LABELS[trap] ?? trap, count }));

  // Trend indicator (requires at least 2 sessions)
  const latestBefore = weekly[weekly.length - 1]?.avg_intensity_before;
  const firstBefore = weekly[0]?.avg_intensity_before;
  const trend =
    weekly.length < 2 || latestBefore == null || firstBefore == null
      ? null
      : latestBefore < firstBefore
        ? "down"
        : latestBefore > firstBefore
          ? "up"
          : "flat";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-emerald-500/20">
      <GlobalHeader />

      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Breadcrumb & Sub Navigation Bar */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/healing")}
              className="gap-2 text-muted-foreground hover:text-foreground -ml-2 h-9 px-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Healing</span>
            </Button>
            <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Healing / <strong className="text-foreground">My Progress</strong>
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("healing.progress.title", "My Progress & Mood Trends")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t(
              "healing.disclaimer_short",
              "Emotional intensity shifts and cognitive distortion patterns over time",
            )}
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm p-6 text-center shadow-sm">
                <p className="text-4xl font-extrabold text-foreground">
                  {totalCompleted}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 font-medium">
                  {t(
                    "healing.progress.exercises_completed",
                    "Exercises completed",
                  )}
                </p>
              </div>
              <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm p-6 text-center shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  {trend === "down" && (
                    <TrendingDown
                      className="h-6 w-6 text-emerald-500"
                      aria-hidden="true"
                    />
                  )}
                  {trend === "up" && (
                    <TrendingUp
                      className="h-6 w-6 text-orange-400"
                      aria-hidden="true"
                    />
                  )}
                  {trend === "flat" && (
                    <Minus
                      className="h-6 w-6 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                  {trend === null && (
                    <Sparkles
                      className="h-6 w-6 text-indigo-400"
                      aria-hidden="true"
                    />
                  )}
                  <span className="text-2xl font-bold text-foreground">
                    {trend === "down"
                      ? "Improving"
                      : trend === "up"
                        ? "Increasing"
                        : trend === "flat"
                          ? "Stable"
                          : "1st Session"}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {trend === "down"
                    ? t(
                        "healing.progress.improving",
                        "Emotional intensity trending down post-reframe",
                      )
                    : trend === "up"
                      ? t(
                          "healing.progress.increasing",
                          "Intensity trending up — consider grounding exercises",
                        )
                      : trend === "flat"
                        ? t(
                            "healing.progress.stable",
                            "Consistent intensity baseline across sessions",
                          )
                        : t(
                            "healing.progress.initial_session",
                            "Initial baseline established. Complete another session to view your progress trend.",
                          )}
                </p>
              </div>
            </div>

            {/* Intensity area chart */}
            {chartData.length > 0 ? (
              <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm p-6 sm:p-7 shadow-sm">
                <h2 className="text-base font-semibold text-foreground mb-1">
                  {t(
                    "healing.progress.intensity_over_time",
                    "Average Intensity: Before vs After Reframe",
                  )}
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  {t(
                    "healing.progress.chart_hint",
                    "Comparing average distress (0–10) before and after completing thought records.",
                  )}
                </p>

                {weekly.length === 1 && (
                  <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-3 mb-4 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>
                      <strong>1 session on record:</strong> Continuous curves appear once you log sessions across 2+ weeks.
                      {weekly[0]?.avg_intensity_after == null && " (Note: Emotion re-rating in Step 7 was skipped for this record, so only initial intensity is shown.)"}
                    </span>
                  </div>
                )}
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart
                    data={chartData}
                    margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="gradBefore"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#f97316"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f97316"
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="gradAfter"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      domain={[0, 10]}
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                    <Area
                      type="monotone"
                      dataKey="Before"
                      stroke="#f97316"
                      strokeWidth={2}
                      fill="url(#gradBefore)"
                      dot={{ r: 5, fill: "#f97316", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 7 }}
                      name={t("healing.progress.legend_before", "Before (0–10)")}
                    />
                    <Area
                      type="monotone"
                      dataKey="After"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#gradAfter)"
                      dot={{ r: 5, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 7 }}
                      connectNulls={false}
                      name={t("healing.progress.legend_after", "After (0–10)")}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
                <p className="text-sm">
                  {t(
                    "healing.progress.no_data",
                    "Complete a few thought records to visualize your emotional progress.",
                  )}
                </p>
                <Button
                  onClick={() => navigate("/healing/thought-record")}
                  className="mt-4"
                  size="sm"
                >
                  Start First Exercise
                </Button>
              </div>
            )}

            {/* Top thinking traps bar chart */}
            {trapData.length > 0 && (
              <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm p-6 sm:p-7 shadow-sm">
                <h2 className="text-base font-semibold text-foreground mb-1">
                  {t(
                    "healing.progress.top_traps",
                    "Most Frequent Thinking Traps",
                  )}
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  {t(
                    "healing.progress.traps_hint",
                    "Patterns you spot most often — awareness is the first step toward balanced thinking.",
                  )}
                </p>
                <ResponsiveContainer width="100%" height={Math.max(90, trapData.length * 52)}>
                  <BarChart data={trapData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax))]}
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      type="category"
                      dataKey="trap"
                      width={140}
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#8b5cf6"
                      radius={[0, 8, 8, 0]}
                      maxBarSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </main>

      <GlobalFooter />
    </div>
  );
}
