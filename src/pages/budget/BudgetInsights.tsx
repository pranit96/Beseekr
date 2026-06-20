import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  Sparkle,
} from "lucide-react";
import { useBudget } from "./BudgetLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { budgetApi } from "@/api/budget";

export default function BudgetInsights() {
  const { insights, setInsights, selectedMonth, selectedYear, preferredCurrencySymbol } = useBudget();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await budgetApi.generateInsights({ month: selectedMonth, year: selectedYear });
      if (response.success) {
        if (response.data) {
          setInsights(response.data);
          toast({ title: "Insights Updated", description: "AI financial diagnostics refreshed." });
        } else {
          toast({
            title: "No Data Available",
            description: "No transactions found for the selected month. Please add or import transactions first.",
          });
        }
      }
    } catch (e: any) {
      toast({ title: "Failed to Generate", description: e.message || "AI model returned an error.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm border-border/30 rounded-2xl relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-gradient-to-br from-indigo-500/8 via-primary/5 to-transparent rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 border-b border-border/20">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" /> Financial Insights
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              AI-generated highlights, anomaly detection, and actionable recommendations.
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            size="sm"
            className="gap-2 rounded-xl h-9 bg-gradient-to-r from-indigo-500 via-primary to-purple-600 text-white font-medium shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity text-sm shrink-0"
          >
            {generating ? (
              <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Analyzing…</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5" /> Generate Insights</>
            )}
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm">Fetching diagnostics…</p>
            </div>
          ) : !insights ? (
            <div className="py-16 text-center border border-dashed border-border/40 rounded-2xl flex flex-col items-center justify-center bg-muted/5">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkle className="w-12 h-12 text-indigo-400/30 mb-3" />
              </motion.div>
              <h4 className="text-base font-semibold text-foreground mb-1">No Insights Yet</h4>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Click the button above to run AI diagnostics over your spending history.
              </p>
              <Button onClick={handleGenerate} variant="outline" size="sm" className="gap-1.5 rounded-xl border-indigo-500/20 text-indigo-500 hover:bg-indigo-500/10">
                <Sparkles className="w-3.5 h-3.5" /> Run Diagnostics
              </Button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 relative z-10"
            >
              {/* ─── Top Grid: Health Score, MoM cards, and Quick stats ─── */}
              <div className="grid md:grid-cols-3 gap-4">
                
                {/* 1. Health Score Ring */}
                <Card className="bg-background/60 border-border/20 p-5 rounded-xl flex items-center justify-between relative overflow-hidden group hover:border-primary/20 transition-all">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Health Score</p>
                    <div className="text-2xl font-bold tracking-tight">
                      {insights.financial_health_score ?? 50}
                      <span className="text-xs text-muted-foreground font-normal">/100</span>
                    </div>
                    <p className="text-xs font-medium text-emerald-500">
                      {(() => {
                        const score = insights.financial_health_score ?? 50;
                        if (score >= 80) return "Excellent Standing";
                        if (score >= 60) return "Healthy Position";
                        if (score >= 50) return "Fair Standing";
                        return "Requires Attention";
                      })()}
                    </p>
                  </div>
                  
                  {/* Circular progress */}
                  <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="26" stroke="hsl(var(--muted)/0.2)" strokeWidth="4.5" fill="transparent" />
                      <circle
                        cx="32" cy="32" r="26"
                        stroke={(() => {
                          const score = insights.financial_health_score ?? 50;
                          if (score >= 80) return "hsl(var(--primary))";
                          if (score >= 50) return "#f59e0b"; // amber-500
                          return "#f43f5e"; // rose-500
                        })()}
                        strokeWidth="4.5" fill="transparent"
                        strokeDasharray={2 * Math.PI * 26}
                        strokeDashoffset={2 * Math.PI * 26 - ((insights.financial_health_score ?? 50) / 100) * 2 * Math.PI * 26}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <span className="absolute text-sm font-bold">{insights.financial_health_score ?? 50}</span>
                  </div>
                </Card>

                {/* 2. MoM Changes */}
                <Card className="bg-background/60 border-border/20 p-5 rounded-xl flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-2">Month-over-Month Changes</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Income Change:</span>
                        <div className="flex items-center gap-1.5 font-bold tabular-nums">
                          {insights.month_over_month?.income_change_pct !== undefined
                            ? `${insights.month_over_month.income_change_pct >= 0 ? "+" : ""}${insights.month_over_month.income_change_pct}%`
                            : "0%"}
                          {insights.month_over_month?.income_change_pct !== undefined && (
                            <Badge className={insights.month_over_month.income_change_pct >= 0
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] h-4 rounded-md font-medium"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[10px] h-4 rounded-md font-medium"
                            }>
                              {insights.month_over_month.income_change_pct >= 0 ? "Up" : "Down"}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Expense Change:</span>
                        <div className="flex items-center gap-1.5 font-bold tabular-nums">
                          {insights.month_over_month?.expense_change_pct !== undefined
                            ? `${insights.month_over_month.expense_change_pct >= 0 ? "+" : ""}${insights.month_over_month.expense_change_pct}%`
                            : "0%"}
                          {insights.month_over_month?.expense_change_pct !== undefined && (
                            <Badge className={insights.month_over_month.expense_change_pct <= 0
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] h-4 rounded-md font-medium"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[10px] h-4 rounded-md font-medium"
                            }>
                              {insights.month_over_month.expense_change_pct <= 0 ? "Reduced" : "Increased"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 3. Base Metrics Card */}
                <Card className="bg-background/60 border-border/20 p-5 rounded-xl flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-2">Metrics Summary</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Total Income:</span>
                        <span className="font-semibold text-foreground">{preferredCurrencySymbol}{(insights.total_income ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Total Expenses:</span>
                        <span className="font-semibold text-foreground">{preferredCurrencySymbol}{(insights.total_expenses ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs border-t border-border/20 pt-1">
                        <span className="text-muted-foreground font-medium">Savings Rate:</span>
                        <span className="font-bold text-emerald-500">{insights.savings_rate ?? 0}%</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* AI Summary (Full Width) */}
              <Card className="bg-background/60 border-border/20 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                <h4 className="text-sm font-semibold text-indigo-500 mb-2.5 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" /> AI Summary & Strategy
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {insights.ai_summary || "AI Summary text is being processed."}
                </p>
              </Card>

              {/* ─── Detailed Lists (Tips, Patterns, Anomalies) ─── */}
              <div className="grid md:grid-cols-3 gap-4">
                
                {/* 1. Saving Tips */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-500" /> Saving Tips
                  </h4>
                  {(!insights.ai_tips || insights.ai_tips.length === 0) ? (
                    <p className="text-xs text-muted-foreground italic">No tips generated.</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {insights.ai_tips.map((tip, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.08, duration: 0.3 }}
                          className="flex gap-2 text-sm text-muted-foreground items-start leading-relaxed bg-muted/10 p-2.5 rounded-lg border border-border/10"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                          <span>{tip}</span>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 2. Spending Patterns */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-500" /> Spending Patterns
                  </h4>
                  {(!insights.spending_patterns || insights.spending_patterns.length === 0) ? (
                    <p className="text-xs text-muted-foreground italic">No patterns detected.</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {insights.spending_patterns.map((pattern, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.08 + 0.1, duration: 0.3 }}
                          className="flex gap-2 text-sm text-muted-foreground items-start leading-relaxed bg-muted/10 p-2.5 rounded-lg border border-border/10"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                          <span>{pattern}</span>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 3. Anomalies */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500" /> Anomaly Warnings
                  </h4>
                  {(!insights.anomalies || insights.anomalies.length === 0) ? (
                    <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <Sparkle className="w-4 h-4 fill-current shrink-0" />
                      No major spending anomalies detected. Keep it up!
                    </div>
                  ) : (
                    <ul className="space-y-2.5">
                      {insights.anomalies.map((anom, idx) => {
                        const formattedText = typeof anom === "object" && anom !== null
                          ? `${anom.category} ${anom.direction || "changed"} by ${Math.abs(anom.changePercent || 0)}% (${preferredCurrencySymbol}${anom.previousAmount.toLocaleString()} → ${preferredCurrencySymbol}${anom.currentAmount.toLocaleString()})`
                          : String(anom);
                        return (
                          <motion.li
                            key={idx}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.08 + 0.2, duration: 0.3 }}
                            className="flex gap-2 text-sm text-muted-foreground items-start leading-relaxed bg-muted/10 p-2.5 rounded-lg border border-border/10"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                            <span>{formattedText}</span>
                          </motion.li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
