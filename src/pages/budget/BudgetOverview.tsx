import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Percent,
  Calendar,
  ArrowRight,
  Layers,
  Briefcase,
} from "lucide-react";
import { useBudget, getCurrencySymbol } from "./BudgetLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { Progress } from "@/components/ui/progress";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function KPICard({
  label,
  value,
  icon: Icon,
  color,
  prefix,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  prefix?: string;
}) {
  return (
    <motion.div variants={item}>
      <Card className="bg-card/50 backdrop-blur-sm border-border/30 relative overflow-hidden group hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none group-hover:bg-primary/10 transition-colors" />
        <CardHeader className="p-4 pb-1.5">
          <CardDescription className="text-[11px] font-semibold uppercase tracking-wider flex items-center justify-between text-muted-foreground">
            {label}
            <Icon className={`w-3.5 h-3.5 ${color}`} />
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <span
            className={`text-xl font-bold tracking-tight ${color || "text-foreground"}`}
          >
            {prefix}
            {value}
          </span>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function BudgetOverview() {
  const {
    dashboard,
    loadingDashboard,
    yearlyOverview,
    preferredCurrencySymbol,
  } = useBudget();

  const fmt = (n?: number) =>
    n !== undefined
      ? n.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";

  // Chart data
  const dailySpendingChartData = dashboard?.dailySpending
    ? Object.entries(dashboard.dailySpending)
        .map(([date, amount]) => ({ date: date.substring(5), amount }))
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  const categoryBreakdownChartData = dashboard?.categoryBreakdown
    ? Object.entries(dashboard.categoryBreakdown).map(([name, val]) => ({
        name,
        value: val.total,
      }))
    : [];

  const yearlyOverviewChartData = yearlyOverview?.monthly
    ? Object.entries(yearlyOverview.monthly).map(([monthStr, data]) => ({
        month: monthStr,
        income: data.income,
        expenses: data.expenses,
        savings: data.savings,
      }))
    : [];

  if (loadingDashboard) {
    return (
      <div className="space-y-6">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          {[...Array(6)].map((_, i) => (
            <motion.div key={i} variants={item}>
              <Card className="animate-pulse bg-muted/20 border-border/30 h-[88px] rounded-xl" />
            </motion.div>
          ))}
        </motion.div>
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 animate-pulse bg-muted/20 border-border/30 h-[340px] rounded-xl" />
          <Card className="animate-pulse bg-muted/20 border-border/30 h-[340px] rounded-xl" />
        </div>
      </div>
    );
  }

  const netSavings = dashboard?.summary.netSavings ?? 0;
  const isPositive = netSavings >= 0;

  return (
    <div className="space-y-6">
      {/* ── KPI Cards ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        <KPICard
          label="Net Savings"
          value={fmt(netSavings)}
          icon={isPositive ? TrendingUp : TrendingDown}
          color={isPositive ? "text-emerald-500" : "text-rose-500"}
          prefix={preferredCurrencySymbol}
        />
        <KPICard
          label="Savings Rate"
          value={`${(dashboard?.summary.savingsRate ?? 0).toFixed(1)}%`}
          icon={Percent}
          color="text-blue-500"
        />
        <KPICard
          label="Total Income"
          value={fmt(dashboard?.summary.totalIncome)}
          icon={Plus}
          color="text-emerald-500"
          prefix={preferredCurrencySymbol}
        />
        <KPICard
          label="Total Expenses"
          value={fmt(dashboard?.summary.totalExpenses)}
          icon={TrendingDown}
          color="text-rose-500"
          prefix={preferredCurrencySymbol}
        />
        <KPICard
          label="Avg Daily"
          value={fmt(dashboard?.summary.avgDailySpend)}
          icon={Calendar}
          color="text-amber-500"
          prefix={preferredCurrencySymbol}
        />
        <KPICard
          label="Projected"
          value={fmt(dashboard?.summary.projectedMonthlySpend)}
          icon={ArrowRight}
          color="text-purple-500"
          prefix={preferredCurrencySymbol}
        />
      </motion.div>

      {/* ── Charts Row ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="grid lg:grid-cols-3 gap-4"
      >
        {/* Daily Spending */}
        <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-border/30 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none" />
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-semibold tracking-tight text-foreground flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" /> Daily Spending
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Aggregated daily expense flow for this period.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 h-[260px]">
            {dailySpendingChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border/40 rounded-xl">
                No transactions recorded for this period yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dailySpendingChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                    className="opacity-40"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${preferredCurrencySymbol}${val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
                    }}
                    labelFormatter={(label) => `Date: ${label}`}
                    formatter={(val: any) => [
                      `${preferredCurrencySymbol}${val.toFixed(2)}`,
                      "Expenses",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#spendGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-2xl flex flex-col">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-semibold tracking-tight text-foreground flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-500" /> Categories
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Spending by category this period.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 flex-1">
            {categoryBreakdownChartData.length === 0 ? (
              <div className="h-full min-h-[200px] flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border/40 rounded-xl">
                No categories data.
              </div>
            ) : (
              <div className="space-y-3.5">
                {categoryBreakdownChartData.map((cat) => {
                  const progressMax = 500;
                  const percentage = Math.min(
                    (cat.value / progressMax) * 100,
                    100,
                  );
                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          {cat.name}
                        </span>
                        <span className="text-foreground font-semibold tabular-nums">
                          {preferredCurrencySymbol}
                          {cat.value.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      </div>
                      <Progress
                        value={percentage}
                        className="h-1.5 bg-muted/40"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Bottom Row ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        className="grid md:grid-cols-2 gap-4"
      >
        {/* Top Merchants */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-2xl">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-semibold tracking-tight text-foreground flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-amber-500" /> Top Merchants
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Where you spend the most.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {!dashboard?.topMerchants || dashboard.topMerchants.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No merchants tracked.
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {dashboard.topMerchants.map((merchant, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between py-3 items-center text-sm group"
                  >
                    <span className="font-medium text-foreground flex items-center gap-2.5">
                      <span className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs text-muted-foreground font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate">
                        {merchant.name || "Unknown"}
                      </span>
                    </span>
                    <span className="font-semibold text-rose-500 tabular-nums shrink-0">
                      -{preferredCurrencySymbol}
                      {merchant.total.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Yearly Trend */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-2xl">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-semibold tracking-tight text-foreground flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-500" /> Yearly Trend
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Monthly income vs expenses year-to-date.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 h-[240px]">
            {yearlyOverviewChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border/40 rounded-xl">
                No yearly data loaded.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={yearlyOverviewChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                    className="opacity-40"
                  />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${preferredCurrencySymbol}${val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "12px",
                    }}
                    cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                    formatter={(val: any) => [
                      `${preferredCurrencySymbol}${val.toFixed(0)}`,
                    ]}
                  />
                  <Bar
                    dataKey="income"
                    fill="hsl(160 84% 39%)"
                    radius={[4, 4, 0, 0]}
                    opacity={0.85}
                    name="Income"
                  />
                  <Bar
                    dataKey="expenses"
                    fill="hsl(0 84% 60%)"
                    radius={[4, 4, 0, 0]}
                    opacity={0.85}
                    name="Expenses"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
