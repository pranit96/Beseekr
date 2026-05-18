import { useEffect, useState } from "react";
import { tradingApi, isTradingError } from "@/api/trading";
import { useTradingWebSocket } from "@/hooks/useTradingWebSocket";
import { AlertCircle, TrendingUp, Target, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  StrategyPerformance,
  CorrelationHeatmap,
  RiskAttribution,
} from "@/types/trading";

export default function Analytics() {
  const { requestAnalytics, analyticsData } = useTradingWebSocket();
  const [strategies, setStrategies] = useState<StrategyPerformance[]>([]);
  const [correlation, setCorrelation] = useState<CorrelationHeatmap | null>(
    null,
  );
  const [riskData, setRiskData] = useState<RiskAttribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    if (analyticsData) {
      if (analyticsData.type === "strategy_performance") {
        setStrategies(analyticsData.data.strategies || []);
      } else if (analyticsData.type === "correlation") {
        setCorrelation(analyticsData.data);
      } else if (analyticsData.type === "risk_attribution") {
        setRiskData(analyticsData.data);
      }
    }
  }, [analyticsData]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [strategyData, correlationData, riskAttrData] = await Promise.all([
        tradingApi.getStrategyPerformance(),
        tradingApi.getCorrelationHeatmap(),
        tradingApi.getRiskAttribution(),
      ]);

      setStrategies(strategyData.strategies);
      setCorrelation(correlationData);
      setRiskData(riskAttrData);
    } catch (err: any) {
      if (isTradingError(err, "ZERODHA_NOT_CONNECTED")) {
        setError(
          "Zerodha not connected. Please authenticate via Telegram to access analytics.",
        );
      } else {
        setError(err.message || "Failed to load analytics");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <div className="text-red-400 mb-2">Error Loading Analytics</div>
          <div className="text-muted-foreground text-sm">{error}</div>
          <button
            onClick={loadAnalytics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Advanced Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Strategy performance, correlation analysis, and risk attribution
        </p>
      </div>

      {/* Strategy Performance */}
      <div className="bg-background rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Strategy Performance</h2>
          <TrendingUp className="h-5 w-5 text-blue-500" />
        </div>

        {strategies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No strategy data available
          </div>
        ) : (
          <div className="space-y-4">
            {strategies.map((strategy, i) => (
              <div key={i} className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-white">{strategy.name}</div>
                  <div
                    className={cn(
                      "text-sm font-bold",
                      strategy.total_pnl >= 0
                        ? "text-green-500"
                        : "text-red-500",
                    )}
                  >
                    ₹{strategy.total_pnl.toFixed(2)}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Total Trades</div>
                    <div className="text-white font-medium">
                      {strategy.total_trades}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Win Rate</div>
                    <div className="text-white font-medium">
                      {strategy.win_rate.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Avg Return</div>
                    <div
                      className={cn(
                        "font-medium",
                        strategy.avg_return >= 0
                          ? "text-green-500"
                          : "text-red-500",
                      )}
                    >
                      {strategy.avg_return.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Sharpe Ratio</div>
                    <div className="text-white font-medium">
                      {strategy.sharpe_ratio.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Best Trade</div>
                    <div className="text-green-500 font-medium">
                      ₹{strategy.best_trade.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Worst Trade</div>
                    <div className="text-red-500 font-medium">
                      ₹{strategy.worst_trade.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Profit Factor</div>
                    <div className="text-white font-medium">
                      {strategy.profit_factor.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Avg Hold</div>
                    <div className="text-white font-medium">
                      {strategy.avg_hold_days.toFixed(1)} days
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Correlation Heatmap */}
      {correlation && (
        <div className="bg-background rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              Correlation Analysis
            </h2>
            <Target className="h-5 w-5 text-purple-500" />
          </div>

          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-2">
              Diversification Score
            </div>
            <div className="text-3xl font-bold text-white">
              {correlation.diversification_score.toFixed(1)}%
            </div>
          </div>

          {correlation.high_correlations.length > 0 && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-3">
                High Correlations (Risk Alert)
              </div>
              <div className="space-y-2">
                {correlation.high_correlations.map((corr, i) => (
                  <div
                    key={i}
                    className="bg-muted rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="text-sm text-white">
                      {corr.symbol1} ↔ {corr.symbol2}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-bold text-orange-500">
                        {(corr.correlation * 100).toFixed(0)}%
                      </div>
                      <div
                        className={cn(
                          "text-xs px-2 py-1 rounded",
                          corr.risk === "High"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400",
                        )}
                      >
                        {corr.risk}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Risk Attribution */}
      {riskData && (
        <div className="bg-background rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Risk Attribution</h2>
            <Activity className="h-5 w-5 text-red-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">
                Total Portfolio Risk
              </div>
              <div className="text-2xl font-bold text-red-400">
                ₹{riskData.portfolio_summary.total_risk.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {riskData.portfolio_summary.risk_percent_of_portfolio.toFixed(
                  2,
                )}
                % of portfolio
              </div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">
                Portfolio Value
              </div>
              <div className="text-2xl font-bold text-white">
                ₹{riskData.portfolio_summary.total_value.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {riskData.portfolio_summary.positions_count} positions
              </div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">
                Critical Positions
              </div>
              <div className="text-2xl font-bold text-orange-400">
                {riskData.portfolio_summary.critical_positions}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Require attention
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {riskData.positions.map((pos, i) => (
              <div key={i} className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-white">{pos.symbol}</div>
                  <div
                    className={cn(
                      "text-xs px-2 py-1 rounded font-medium",
                      pos.risk_level === "Critical"
                        ? "bg-red-500/20 text-red-400"
                        : pos.risk_level === "High"
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-green-500/20 text-green-400",
                    )}
                  >
                    {pos.risk_level}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Position Value</div>
                    <div className="text-white font-medium">
                      ₹{pos.position_value.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Risk Amount</div>
                    <div className="text-red-400 font-medium">
                      ₹{pos.risk_amount.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Current P&L</div>
                    <div
                      className={cn(
                        "font-medium",
                        pos.current_pnl >= 0
                          ? "text-green-500"
                          : "text-red-500",
                      )}
                    >
                      ₹{pos.current_pnl.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">
                      Distance to Stop
                    </div>
                    <div className="text-white font-medium">
                      {pos.distance_to_stop_percent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
