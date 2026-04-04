import { useEffect, useState } from "react";
import { tradingApi, isTradingError } from "@/api/trading";
import { useTradingWebSocket } from "@/hooks/useTradingWebSocket";
import { AlertCircle, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Signal, PriceUpdate } from "@/types/trading";

export default function LiveTrading() {
  const { prices, subscribeToPrices, wsState } = useTradingWebSocket();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSignals();
  }, []);

  useEffect(() => {
    // Subscribe to prices for all signals
    if (signals.length > 0) {
      const symbols = signals.map((s) => s.stocks.symbol);
      subscribeToPrices(symbols);
    }
  }, [signals, subscribeToPrices]);

  const loadSignals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tradingApi.getSignals({ min_confidence: 60 });
      setSignals(data);
    } catch (err: any) {
      if (isTradingError(err, "ZERODHA_NOT_CONNECTED")) {
        setError("Zerodha not connected. Please authenticate via Telegram.");
      } else {
        setError(err.message || "Failed to load signals");
      }
    } finally {
      setLoading(false);
    }
  };

  const getPriceData = (symbol: string): PriceUpdate | null => {
    return prices.get(symbol) || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading live trading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <div className="text-red-400 mb-2">Error Loading Data</div>
          <div className="text-slate-400 text-sm">{error}</div>
          <button
            onClick={loadSignals}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Live Trading</h1>
          <p className="text-slate-400 mt-1">
            Real-time signals with live price updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Activity
            className={cn(
              "h-5 w-5",
              wsState.connected ? "text-green-500" : "text-red-500",
            )}
          />
          <span
            className={cn(
              "text-sm",
              wsState.connected ? "text-green-500" : "text-red-500",
            )}
          >
            {wsState.connected ? "Live" : "Disconnected"}
          </span>
        </div>
      </div>

      {signals.length === 0 ? (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 text-center">
          <div className="text-slate-400 mb-4">No active signals</div>
          <button
            onClick={loadSignals}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Signals
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {signals.map((signal) => {
            const priceData = getPriceData(signal.stocks.symbol);
            const currentPrice = priceData?.price || signal.entry_price;
            const priceChange = priceData
              ? ((currentPrice - signal.entry_price) / signal.entry_price) * 100
              : 0;
            const isPositive = priceChange >= 0;

            return (
              <div
                key={signal.id}
                className="bg-slate-900 rounded-lg border border-slate-800 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xl font-bold text-white">
                      {signal.stocks.symbol}
                    </div>
                    <div className="text-sm text-slate-400">
                      {signal.stocks.name}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "px-3 py-1 rounded text-sm font-medium",
                      signal.signal_type === "BUY"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400",
                    )}
                  >
                    {signal.signal_type}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">
                      Current Price
                    </div>
                    <div className="text-lg font-bold text-white">
                      ₹{currentPrice.toFixed(2)}
                    </div>
                    {priceData && (
                      <div
                        className={cn(
                          "text-sm flex items-center gap-1",
                          isPositive ? "text-green-500" : "text-red-500",
                        )}
                      >
                        {isPositive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {priceChange >= 0 ? "+" : ""}
                        {priceChange.toFixed(2)}%
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">
                      Entry Price
                    </div>
                    <div className="text-lg font-bold text-white">
                      ₹{signal.entry_price.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                  <div>
                    <div className="text-slate-500">Target</div>
                    <div className="text-green-400 font-medium">
                      ₹{signal.target_price.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Stop Loss</div>
                    <div className="text-red-400 font-medium">
                      ₹{signal.stop_loss.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">R:R</div>
                    <div className="text-white font-medium">
                      {signal.risk_reward.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <div className="text-sm">
                    <span className="text-slate-500">Confidence: </span>
                    <span className="text-white font-medium">
                      {signal.confidence_score}%
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500">Strategy: </span>
                    <span className="text-white font-medium">
                      {signal.trading_strategies.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
