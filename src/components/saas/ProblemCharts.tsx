import React from "react";
import {
  RadialBarChart,
  RadialBar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ============================================================================
// OPPORTUNITY SCORE RADIAL CHART
// ============================================================================
interface OpportunityScoreChartProps {
  score: number;
  maxScore?: number;
  className?: string;
}

export function OpportunityScoreChart({
  score,
  maxScore = 100,
  className,
}: OpportunityScoreChartProps) {
  const data = [{ name: "Score", value: score, fill: getScoreColor(score) }];

  function getScoreColor(s: number) {
    if (s >= 70) return "hsl(142, 76%, 36%)"; // green
    if (s >= 50) return "hsl(217, 91%, 60%)"; // blue
    if (s >= 30) return "hsl(38, 92%, 50%)"; // amber
    return "hsl(0, 84%, 60%)"; // red
  }

  return (
    <div className={cn("h-[120px] sm:h-[150px]", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="100%"
          barSize={12}
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <RadialBar
            background={{ fill: "hsl(var(--muted))" }}
            dataKey="value"
            cornerRadius={10}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// MARKET SIZE COMPARISON CHART (TAM/SAM/SOM)
// ============================================================================
interface MarketSizeChartProps {
  tam?: { value: number; display: string };
  sam?: { value: number; display: string };
  som?: { value: number; display: string };
  className?: string;
}

export function MarketSizeChart({
  tam,
  sam,
  som,
  className,
}: MarketSizeChartProps) {
  const data = [
    {
      name: "TAM",
      value: tam?.value || 0,
      display: tam?.display || "N/A",
      fill: "#22c55e",
    },
    {
      name: "SAM",
      value: sam?.value || 0,
      display: sam?.display || "N/A",
      fill: "#3b82f6",
    },
    {
      name: "SOM",
      value: som?.value || 0,
      display: som?.display || "N/A",
      fill: "#8b5cf6",
    },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return null;

  // Normalize values for visual display (log scale for large differences)
  const maxVal = Math.max(...data.map((d) => d.value));
  const normalizedData = data.map((d) => ({
    ...d,
    normalized: (Math.log10(d.value + 1) / Math.log10(maxVal + 1)) * 100,
  }));

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Market Size Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[100px] sm:h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={normalizedData}
              layout="vertical"
              margin={{ left: 0, right: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={40}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(_, name, props) => [props.payload.display, name]}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="normalized" radius={[0, 4, 4, 0]}>
                {normalizedData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground mt-2">
          {data.map((d) => (
            <div key={d.name} className="text-center">
              <span className="font-medium" style={{ color: d.fill }}>
                {d.name}
              </span>
              <span className="block">{d.display}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// VALIDATION BREAKDOWN CHART
// ============================================================================
interface ValidationBreakdownChartProps {
  breakdown?: {
    discussion_volume: number;
    evidence_quality: number;
    external_validation: number;
    trend_momentum: number;
  };
  className?: string;
}

export function ValidationBreakdownChart({
  breakdown,
  className,
}: ValidationBreakdownChartProps) {
  if (!breakdown) return null;

  const data = [
    { name: "Discussions", value: breakdown.discussion_volume, max: 30 },
    { name: "Evidence", value: breakdown.evidence_quality, max: 25 },
    { name: "External", value: breakdown.external_validation, max: 25 },
    { name: "Momentum", value: breakdown.trend_momentum, max: 20 },
  ];

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const maxTotal = data.reduce((sum, d) => sum + d.max, 0);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Validation Breakdown</span>
          <span className="text-primary font-bold">
            {total}/{maxTotal}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {data.map((item) => (
          <div key={item.name} className="space-y-1">
            <div className="flex justify-between text-[10px] sm:text-xs">
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-medium">
                {item.value}/{item.max}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(item.value / item.max) * 100}%`,
                  backgroundColor:
                    item.value / item.max >= 0.6
                      ? "#22c55e"
                      : item.value / item.max >= 0.3
                        ? "#f59e0b"
                        : "#ef4444",
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// TREND MINI CHART (Sparkline)
// ============================================================================
interface TrendSparklineProps {
  data: { snapshot_date: string; frequency: number }[];
  className?: string;
}

export function TrendSparkline({ data, className }: TrendSparklineProps) {
  if (!data || data.length < 2) return null;

  const isGrowing =
    data.length >= 2 && data[data.length - 1].frequency > data[0].frequency;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Discussion Trend</span>
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              isGrowing
                ? "bg-green-500/10 text-green-600"
                : "bg-amber-500/10 text-amber-600",
            )}
          >
            {isGrowing ? "📈 Growing" : "📉 Declining"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[80px] sm:h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isGrowing ? "#22c55e" : "#f59e0b"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={isGrowing ? "#22c55e" : "#f59e0b"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="frequency"
                stroke={isGrowing ? "#22c55e" : "#f59e0b"}
                strokeWidth={2}
                fill="url(#trendGradient)"
              />
              <Tooltip
                formatter={(value: number) => [value, "Discussions"]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "11px",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SCORE FACTORS CHART
// ============================================================================
interface ScoreFactorsChartProps {
  factors?: Array<{
    name: string;
    score: number;
    weight: number;
    impact: "high" | "medium" | "low";
  }>;
  className?: string;
}

export function ScoreFactorsChart({
  factors,
  className,
}: ScoreFactorsChartProps) {
  if (!factors || factors.length === 0) return null;

  const data = factors.map((f) => ({
    name: f.name.length > 12 ? f.name.slice(0, 12) + "..." : f.name,
    fullName: f.name,
    value: f.score,
    weight: f.weight,
    fill:
      f.impact === "high"
        ? "#22c55e"
        : f.impact === "medium"
          ? "#3b82f6"
          : "#94a3b8",
  }));

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Score Factors</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[140px] sm:h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 0, right: 10 }}
            >
              <XAxis type="number" hide domain={[0, 100]} />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                formatter={(value: number, _, props) => [
                  `${value}/100 (weight: ${props.payload.weight})`,
                  props.payload.fullName,
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "11px",
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default {
  OpportunityScoreChart,
  MarketSizeChart,
  ValidationBreakdownChart,
  TrendSparkline,
  ScoreFactorsChart,
};
