import { useEffect, useState } from "react";
import { tradingApi, isTradingError } from "@/api/trading";
import { useTradingWebSocket } from "@/hooks/useTradingWebSocket";
import { AlertCircle, Briefcase, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Position } from "@/types/trading";

export default function Positions() {
  const { realtimePnL, subscribeToPnL } = useTradingWebSocket();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    subscribeToPnL();
    loadPositions();
  }, [subscribeToPnL]);

  const loadPositions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tradingApi.getOpenPositions();
      setPositions(data);
    } catch (err: any) {
      if (isTradingError(err, "ZERODHA_NOT_CONNECTED")) {
        setError("Zerodha not connected. Please authenticate via Telegram.");
      } else {
        setError(err.message || "Failed to load positions");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading positions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <div className="text-red-400 mb-2">Error Loading Positions</div>
          <div className="text-muted-foreground text-sm">{error}</div>
          <button
            onClick={loadPositions}
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
          <h1 className="text-3xl font-bold text-white">Open Positions</h1>
          <p className="text-muted-foreground mt-1">
            Manage your active trades
          </p>
        </div>
        <div className="flex items-center gap-4">
          {realtimePnL && (
            <>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Total P&L</div>
                <div
                  className={cn(
                    "text-xl font-bold",
                    realtimePnL.total_pnl >= 0
                      ? "text-green-500"
                      : "text-red-500",
                  )}
                >
                  ₹{realtimePnL.total_pnl.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  Portfolio Value
                </div>
                <div className="text-xl font-bold text-white">
                  ₹{realtimePnL.total_value.toFixed(2)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="bg-background rounded-lg border border-border p-12 text-center">
          <Briefcase className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <div className="text-muted-foreground mb-2">No open positions</div>
          <div className="text-sm text-slate-500">
            Your active trades will appear here
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {positions.map((position) => {
            const pnl = position.current_pnl || 0;
            const pnlPercent = position.current_pnl_percent || 0;
            const isProfit = pnl >= 0;

            return (
              <div
                key={position.id}
                className="bg-background rounded-lg border border-border p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {position.stocks.symbol}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {position.stocks.name}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "text-right",
                      isProfit ? "text-green-500" : "text-red-500",
                    )}
                  >
                    <div className="flex items-center gap-2 text-2xl font-bold">
                      {isProfit ? (
                        <TrendingUp className="h-6 w-6" />
                      ) : (
                        <TrendingDown className="h-6 w-6" />
                      )}
                      ₹{pnl.toFixed(2)}
                    </div>
                    <div className="text-lg font-medium">
                      {pnlPercent >= 0 ? "+" : ""}
                      {pnlPercent.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Entry Price
                    </div>
                    <div className="text-lg font-bold text-white">
                      ₹{position.entry_price?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Current Price
                    </div>
                    <div className="text-lg font-bold text-white">
                      ₹
                      {(
                        position.current_price || position.entry_price
                      )?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Shares
                    </div>
                    <div className="text-lg font-bold text-white">
                      {position.shares || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Position Value
                    </div>
                    <div className="text-lg font-bold text-white">
                      ₹
                      {(
                        (position.current_price || position.entry_price || 0) *
                        (position.shares || 0)
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
                  <div>
                    <div className="text-xs text-slate-500">Target</div>
                    <div className="text-sm text-green-400 font-medium">
                      ₹{position.strategy_signals.target_price.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Stop Loss</div>
                    <div className="text-sm text-red-400 font-medium">
                      ₹{position.strategy_signals.stop_loss.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Entry Date</div>
                    <div className="text-sm text-white font-medium">
                      {new Date(position.entry_date).toLocaleDateString()}
                    </div>
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
