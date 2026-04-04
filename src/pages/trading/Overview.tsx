import { useEffect, useState } from "react";
import { tradingApi, isTradingError } from "@/api/trading";
import { useTradingWebSocket } from "@/hooks/useTradingWebSocket";
import {
  TrendingUp,
  TrendingDown,
  Briefcase,
  Target,
  AlertCircle,
  Newspaper,
  Shield,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NewsCard } from "@/components/trading/NewsCard";
import { MarketStatusIndicator } from "@/components/trading/DataQualityBadge";
import type { PortfolioMetrics, Position } from "@/types/trading";

export default function Overview() {
  const { realtimePnL, subscribeToPnL } = useTradingWebSocket();
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [trendingNews, setTrendingNews] = useState<any[]>([]);
  const [marketSentiment, setMarketSentiment] = useState<any>(null);
  const [marketStatus, setMarketStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    subscribeToPnL();
    loadData();

    // Refresh market status every 30 seconds
    const interval = setInterval(loadMarketStatus, 30000);
    return () => clearInterval(interval);
  }, [subscribeToPnL]);

  const loadMarketStatus = async () => {
    try {
      const status = await tradingApi.getMarketStatus();
      setMarketStatus(status);
    } catch (err) {
      console.error("Failed to load market status:", err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsData, positionsData, newsData, sentimentData, statusData] =
        await Promise.all([
          tradingApi.getPortfolioMetrics(),
          tradingApi.getOpenPositions(),
          tradingApi.getTrendingNews(5).catch(() => ({ data: [] })),
          tradingApi.getMarketSentiment().catch(() => null),
          tradingApi.getMarketStatus().catch(() => null),
        ]);

      setMetrics(metricsData);
      setPositions(positionsData);
      setTrendingNews(newsData?.data || []);
      setMarketSentiment(sentimentData?.data || null);
      setMarketStatus(statusData);
    } catch (err: any) {
      if (isTradingError(err, "ZERODHA_NOT_CONNECTED")) {
        setError(
          "Zerodha not connected. Please authenticate via Telegram to access live data.",
        );
      } else {
        setError(err.message || "Failed to load portfolio data");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading portfolio...</div>
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
            onClick={loadData}
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
          <h1 className="text-3xl font-bold text-white">Portfolio Overview</h1>
          <p className="text-slate-400 mt-1">
            Real-time portfolio performance and metrics
          </p>
        </div>
        {marketStatus && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-400">Market:</span>
              <MarketStatusIndicator
                isOpen={marketStatus.market.is_open}
                canTrade={marketStatus.validation.canTrade}
                reason={marketStatus.validation.reason}
                warning={marketStatus.validation.warning}
              />
            </div>
            {marketStatus.circuit_breaker.state !== "CLOSED" && (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-500">
                  Circuit Breaker: {marketStatus.circuit_breaker.state}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Real-time P&L Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total P&L"
          value={realtimePnL ? `₹${realtimePnL.total_pnl.toFixed(2)}` : "₹0.00"}
          change={realtimePnL?.total_pnl_percent}
          icon={
            realtimePnL && realtimePnL.total_pnl >= 0
              ? TrendingUp
              : TrendingDown
          }
          positive={realtimePnL ? realtimePnL.total_pnl >= 0 : true}
        />
        <StatCard
          title="Portfolio Value"
          value={
            realtimePnL ? `₹${realtimePnL.total_value.toFixed(2)}` : "₹0.00"
          }
          subtitle="Current"
          icon={Briefcase}
        />
        <StatCard
          title="Total Invested"
          value={
            realtimePnL ? `₹${realtimePnL.total_invested.toFixed(2)}` : "₹0.00"
          }
          subtitle="Capital"
          icon={Target}
        />
        <StatCard
          title="Open Positions"
          value={positions.length.toString()}
          subtitle={`${realtimePnL?.positions.length || 0} active`}
          icon={Briefcase}
        />
      </div>

      {/* Performance Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Closed Trades"
            stats={[
              { label: "Total", value: metrics.closed_trades.total },
              {
                label: "Wins",
                value: metrics.closed_trades.wins,
                color: "text-green-500",
              },
              {
                label: "Losses",
                value: metrics.closed_trades.losses,
                color: "text-red-500",
              },
              {
                label: "Win Rate",
                value: `${metrics.closed_trades.win_rate.toFixed(1)}%`,
              },
            ]}
          />
          <MetricCard
            title="P&L Summary"
            stats={[
              {
                label: "Total P&L",
                value: `₹${metrics.closed_trades.total_pnl.toFixed(2)}`,
                color:
                  metrics.closed_trades.total_pnl >= 0
                    ? "text-green-500"
                    : "text-red-500",
              },
              {
                label: "Avg Win",
                value: `₹${metrics.closed_trades.avg_win.toFixed(2)}`,
                color: "text-green-500",
              },
              {
                label: "Avg Loss",
                value: `₹${metrics.closed_trades.avg_loss.toFixed(2)}`,
                color: "text-red-500",
              },
              {
                label: "Profit Factor",
                value: metrics.closed_trades.profit_factor.toFixed(2),
              },
            ]}
          />
          <MetricCard
            title="Overall"
            stats={[
              { label: "Total Trades", value: metrics.overall.total_trades },
              {
                label: "Realized P&L",
                value: `₹${metrics.overall.realized_pnl.toFixed(2)}`,
              },
              {
                label: "Unrealized P&L",
                value: `₹${metrics.overall.unrealized_pnl.toFixed(2)}`,
              },
              {
                label: "Combined P&L",
                value: `₹${metrics.overall.total_pnl.toFixed(2)}`,
                color:
                  metrics.overall.total_pnl >= 0
                    ? "text-green-500"
                    : "text-red-500",
              },
            ]}
          />
        </div>
      )}

      {/* Open Positions */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Open Positions</h2>
        {positions.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No open positions
          </div>
        ) : (
          <div className="space-y-3">
            {positions.map((position) => (
              <div
                key={position.id}
                className="bg-slate-800 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white">
                    {position.stocks.symbol}
                  </div>
                  <div className="text-sm text-slate-400">
                    {position.stocks.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400">
                    {position.shares} shares @ ₹
                    {position.entry_price.toFixed(2)}
                  </div>
                  {position.current_pnl !== undefined && (
                    <div
                      className={cn(
                        "font-bold",
                        position.current_pnl >= 0
                          ? "text-green-500"
                          : "text-red-500",
                      )}
                    >
                      ₹{position.current_pnl.toFixed(2)} (
                      {position.current_pnl_percent?.toFixed(2)}%)
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Market News & Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Market Sentiment */}
        {marketSentiment && (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              Market Sentiment
            </h3>
            <div className="text-center">
              <div
                className={cn(
                  "text-4xl font-bold mb-2",
                  marketSentiment.label === "positive"
                    ? "text-green-500"
                    : marketSentiment.label === "negative"
                      ? "text-red-500"
                      : "text-slate-400",
                )}
              >
                {marketSentiment.label === "positive"
                  ? "😊"
                  : marketSentiment.label === "negative"
                    ? "😟"
                    : "😐"}
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {marketSentiment.label.toUpperCase()}
              </div>
              <div className="text-sm text-slate-400 mb-4">
                Based on {marketSentiment.count} news articles
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-green-500 font-bold">
                    {marketSentiment.positive || 0}
                  </div>
                  <div className="text-slate-500">Positive</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold">
                    {marketSentiment.neutral || 0}
                  </div>
                  <div className="text-slate-500">Neutral</div>
                </div>
                <div>
                  <div className="text-red-500 font-bold">
                    {marketSentiment.negative || 0}
                  </div>
                  <div className="text-slate-500">Negative</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trending News */}
        <div className="lg:col-span-2 bg-slate-900 rounded-lg border border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Latest Market News</h3>
          </div>
          {trendingNews.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No news available
            </div>
          ) : (
            <div className="space-y-3">
              {trendingNews.map((news) => (
                <NewsCard
                  key={news.id}
                  news={news}
                  onClick={() => window.open(news.url, "_blank")}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  subtitle,
  icon: Icon,
  positive = true,
}: {
  title: string;
  value: string;
  change?: number;
  subtitle?: string;
  icon: any;
  positive?: boolean;
}) {
  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-400">{title}</div>
        <Icon
          className={cn(
            "h-5 w-5",
            positive ? "text-green-500" : "text-red-500",
          )}
        />
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      {change !== undefined && change !== null && !isNaN(change) && (
        <div
          className={cn(
            "text-sm font-medium",
            positive ? "text-green-500" : "text-red-500",
          )}
        >
          {change >= 0 ? "+" : ""}
          {change.toFixed(2)}%
        </div>
      )}
      {subtitle && <div className="text-sm text-slate-400">{subtitle}</div>}
    </div>
  );
}

function MetricCard({
  title,
  stats,
}: {
  title: string;
  stats: Array<{ label: string; value: string | number; color?: string }>;
}) {
  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {stats.map((stat, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="text-sm text-slate-400">{stat.label}</span>
            <span
              className={cn("text-sm font-bold", stat.color || "text-white")}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
