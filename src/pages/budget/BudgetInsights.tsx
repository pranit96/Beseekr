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
  const { insights, setInsights, selectedMonth, selectedYear } = useBudget();
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
              {/* MoM Comparison Cards */}
              <div className="grid sm:grid-cols-2 gap-3">
                <Card className="bg-background/60 border-border/20 p-4 rounded-xl">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-1.5">Month-over-Month Income</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold tabular-nums">
                      {insights.month_over_month?.income_change_pct !== undefined
                        ? `${insights.month_over_month.income_change_pct >= 0 ? "+" : ""}${insights.month_over_month.income_change_pct.toFixed(1)}%`
                        : "0.0%"}
                    </span>
                    {insights.month_over_month?.income_change_pct !== undefined && (
                      <Badge variant="outline" className={insights.month_over_month.income_change_pct >= 0
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs rounded-md"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-xs rounded-md"
                      }>
                        {insights.month_over_month.income_change_pct >= 0 ? "Up" : "Down"}
                      </Badge>
                    )}
                  </div>
                </Card>

                <Card className="bg-background/60 border-border/20 p-4 rounded-xl">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-1.5">Month-over-Month Expenses</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold tabular-nums">
                      {insights.month_over_month?.expense_change_pct !== undefined
                        ? `${insights.month_over_month.expense_change_pct >= 0 ? "+" : ""}${insights.month_over_month.expense_change_pct.toFixed(1)}%`
                        : "0.0%"}
                    </span>
                    {insights.month_over_month?.expense_change_pct !== undefined && (
                      <Badge variant="outline" className={insights.month_over_month.expense_change_pct <= 0
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs rounded-md"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-xs rounded-md"
                      }>
                        {insights.month_over_month.expense_change_pct <= 0 ? "Reduced" : "Increased"}
                      </Badge>
                    )}
                  </div>
                </Card>
              </div>

              {/* AI Summary */}
              <Card className="bg-background/60 border-border/20 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-indigo-500 mb-2.5 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" /> AI Summary & Strategy
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {insights.ai_summary || "AI Summary text is being processed."}
                </p>
              </Card>

              {/* Tips & Anomalies Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Tips */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-500" /> Saving Tips
                  </h4>
                  {(!insights.ai_tips || insights.ai_tips.length === 0) ? (
                    <p className="text-xs text-muted-foreground italic">No tips generated.</p>
                  ) : (
                    <ul className="space-y-2">
                      {insights.ai_tips.map((tip, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1, duration: 0.3 }}
                          className="flex gap-2.5 text-sm text-muted-foreground items-start"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                          <span>{tip}</span>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Anomalies */}
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
                    <ul className="space-y-2">
                      {insights.anomalies.map((anom, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 + 0.2, duration: 0.3 }}
                          className="flex gap-2.5 text-sm text-muted-foreground items-start"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                          <span>{anom}</span>
                        </motion.li>
                      ))}
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
