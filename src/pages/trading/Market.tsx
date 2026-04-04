import { useEffect, useState } from "react";
import { tradingApi, isTradingError } from "@/api/trading";
import { AlertCircle, Globe, TrendingUp, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Market() {
  const [marketData, setMarketData] = useState<any>(null);
  const [drawdownData, setDrawdownData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [regime, drawdown] = await Promise.all([
        tradingApi.getMarketRegime(),
        tradingApi.getDrawdownStatus(),
      ]);

      setMarketData(regime);
      setDrawdownData(drawdown);
    } catch (err: any) {
      if (isTradingError(err, "ZERODHA_NOT_CONNECTED")) {
        setError(
          "Zerodha not connected. Please authenticate via Telegram to access market data.",
        );
      } else {
        setError(err.message || "Failed to load market data");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading market data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <div className="text-red-400 mb-2">Error Loading Market Data</div>
          <div className="text-slate-400 text-sm">{error}</div>
          <button
            onClick={loadMarketData}
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
        <h1 className="text-3xl font-bold text-white">Market Overview</h1>
        <p className="text-slate-400 mt-1">
          Current market conditions and regime analysis
        </p>
      </div>

      {/* Market Regime */}
      {marketData && (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-bold text-white">Market Regime</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">Current Regime</div>
              <div className="text-2xl font-bold text-white mb-1">
                {marketData.regime?.regime || "Unknown"}
              </div>
              <div className="text-sm text-slate-400">
                {marketData.regime?.description || "No description available"}
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">Confidence</div>
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {marketData.regime?.confidence || 0}%
              </div>
              <div className="text-sm text-slate-400">
                Regime detection confidence
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">Volatility</div>
              <div className="text-2xl font-bold text-orange-400 mb-1">
                {marketData.regime?.volatility || "Unknown"}
              </div>
              <div className="text-sm text-slate-400">
                Current market volatility
              </div>
            </div>
          </div>

          {marketData.recommendedStrategies &&
            marketData.recommendedStrategies.length > 0 && (
              <div>
                <div className="text-sm font-medium text-slate-300 mb-3">
                  Recommended Strategies
                </div>
                <div className="flex flex-wrap gap-2">
                  {marketData.recommendedStrategies.map(
                    (strategy: string, i: number) => (
                      <div
                        key={i}
                        className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium"
                      >
                        {strategy}
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Drawdown Protection */}
      {drawdownData && (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="h-6 w-6 text-red-500" />
            <h2 className="text-xl font-bold text-white">
              Drawdown Protection
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">Status</div>
              <div
                className={cn(
                  "text-2xl font-bold mb-1",
                  drawdownData.protection_active
                    ? "text-red-400"
                    : "text-green-400",
                )}
              >
                {drawdownData.protection_active ? "ACTIVE" : "NORMAL"}
              </div>
              <div className="text-sm text-slate-400">
                {drawdownData.protection_active
                  ? "Trading restrictions in effect"
                  : "No restrictions"}
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">
                Current Drawdown
              </div>
              <div
                className={cn(
                  "text-2xl font-bold mb-1",
                  (drawdownData.current_drawdown || 0) > 10
                    ? "text-red-400"
                    : "text-yellow-400",
                )}
              >
                {(drawdownData.current_drawdown || 0).toFixed(2)}%
              </div>
              <div className="text-sm text-slate-400">
                Max allowed: {drawdownData.max_drawdown || 20}%
              </div>
            </div>
          </div>

          {drawdownData.protection_active && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="text-sm text-red-400 font-medium mb-1">
                ⚠️ Trading Restrictions Active
              </div>
              <div className="text-sm text-slate-400">
                New positions are restricted due to portfolio drawdown exceeding
                threshold. Focus on risk management and existing positions.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Market Indicators */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="h-6 w-6 text-green-500" />
          <h2 className="text-xl font-bold text-white">Market Indicators</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">Trend</div>
            <div className="text-lg font-bold text-white">
              {marketData?.regime?.trend || "Neutral"}
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">Market Phase</div>
            <div className="text-lg font-bold text-white">
              {marketData?.regime?.regime || "Unknown"}
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">Risk Level</div>
            <div
              className={cn(
                "text-lg font-bold",
                marketData?.regime?.volatility === "High"
                  ? "text-red-400"
                  : marketData?.regime?.volatility === "Medium"
                    ? "text-yellow-400"
                    : "text-green-400",
              )}
            >
              {marketData?.regime?.volatility || "Unknown"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
