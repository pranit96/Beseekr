// src/pages/healing/MoodProgress.tsx
// Weekly progress charts — emotion intensity trends and thinking trap frequency

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, TrendingDown, TrendingUp, Minus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import healingApi from "@/api/healing";
import { cn } from "@/lib/utils";

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
    "Before": w.avg_intensity_before ?? 0,
    "After": w.avg_intensity_after ?? 0,
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

  // Trend indicator
  const latestBefore = weekly[weekly.length - 1]?.avg_intensity_before;
  const firstBefore = weekly[0]?.avg_intensity_before;
  const trend = latestBefore == null || firstBefore == null ? null
    : latestBefore < firstBefore ? "down"
    : latestBefore > firstBefore ? "up"
    : "flat";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-10">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/healing")} aria-label={t("common.back", "Back")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-base font-semibold text-foreground">{t("healing.progress.title", "My Progress")}</h1>
            <p className="text-xs text-muted-foreground">{t("healing.disclaimer_short", "Self-help tool — not medical advice")}</p>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-2xl border border-border bg-card p-4 text-center">
                <p className="text-3xl font-bold text-foreground">{totalCompleted}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("healing.progress.exercises_completed", "Exercises completed")}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {trend === "down" && <TrendingDown className="h-5 w-5 text-green-500" aria-hidden="true" />}
                  {trend === "up"   && <TrendingUp   className="h-5 w-5 text-orange-400" aria-hidden="true" />}
                  {trend === "flat" && <Minus         className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
                  {trend === null   && <Minus         className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  {trend === "down" ? t("healing.progress.improving", "Intensity trending down") :
                   trend === "up"   ? t("healing.progress.increasing", "Intensity trending up") :
                                     t("healing.progress.stable", "Stable over 8 weeks")}
                </p>
              </div>
            </div>

            {/* Intensity area chart */}
            {chartData.length > 0 ? (
              <div className="rounded-2xl border border-border bg-card p-5 mb-6">
                <h2 className="text-sm font-semibold text-foreground mb-1">
                  {t("healing.progress.intensity_chart", "Emotion intensity — before vs after")}
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  {t("healing.progress.intensity_hint", "Lower 'after' means the exercise is working.")}
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorBefore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorAfter" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }} />
                    <Area type="monotone" dataKey="Before" stroke="hsl(var(--primary))" fill="url(#colorBefore)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="After"  stroke="hsl(var(--accent))"  fill="url(#colorAfter)"  strokeWidth={2} dot={false} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground mb-6">
                {t("healing.progress.no_data", "Complete a few thought records to see your progress here.")}
              </div>
            )}

            {/* Trap frequency bar chart */}
            {trapData.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold text-foreground mb-1">
                  {t("healing.progress.traps_chart", "Most common thinking patterns")}
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  {t("healing.progress.traps_hint", "Patterns you're spotting most often — awareness is the first step.")}
                </p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={trapData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis type="category" dataKey="trap" width={110} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
