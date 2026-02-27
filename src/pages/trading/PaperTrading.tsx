import { useEffect, useState } from 'react';
import { tradingApi } from '@/api/trading';
import { Play, X, TrendingUp, TrendingDown, BarChart3, Target, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaperTrade, PaperTradingStats } from '@/types/trading';

export default function PaperTrading() {
  const [openTrades, setOpenTrades] = useState<PaperTrade[]>([]);
  const [closedTrades, setClosedTrades] = useState<PaperTrade[]>([]);
  const [stats, setStats] = useState<PaperTradingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'open' | 'closed' | 'stats'>('open');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [open, closed, statistics] = await Promise.all([
        tradingApi.getPaperTrades('OPEN'),
        tradingApi.getPaperTrades('CLOSED'),
        tradingApi.getPaperTradingStats(),
      ]);
      setOpenTrades(open);
      setClosedTrades(closed.slice(0, 10)); // Last 10 closed trades
      setStats(statistics);
    } catch (err: any) {
      setError(err.message || 'Failed to load paper trading data');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTrade = async (tradeId: string) => {
    if (!confirm('Close this paper trade?')) return;
    
    try {
      await tradingApi.closePaperTrade(tradeId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to close trade');
    }
  };

  if (loading && openTrades.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading paper trades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paper Trading</h1>
          <p className="text-gray-600 mt-1">Practice trading without risking real money</p>
        </div>
        <button
          onClick={() => setShowStartModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Play className="w-5 h-5" />
          Start Paper Trade
        </button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total P&L"
            value={`₹${stats.total_pnl.toFixed(2)}`}
            trend={stats.total_pnl >= 0 ? 'up' : 'down'}
            icon={<BarChart3 className="w-5 h-5" />}
          />
          <StatCard
            label="Win Rate"
            value={`${stats.win_rate.toFixed(1)}%`}
            subtitle={`${stats.winning_trades}W / ${stats.losing_trades}L`}
            icon={<Target className="w-5 h-5" />}
          />
          <StatCard
            label="Open Trades"
            value={stats.open_trades.toString()}
            subtitle={`${stats.total_trades} total`}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatCard
            label="Avg P&L"
            value={`₹${stats.avg_pnl.toFixed(2)}`}
            trend={stats.avg_pnl >= 0 ? 'up' : 'down'}
            icon={<BarChart3 className="w-5 h-5" />}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('open')}
            className={cn(
              "pb-3 px-1 border-b-2 font-medium transition-colors",
              activeTab === 'open'
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            )}
          >
            Open Trades ({openTrades.length})
          </button>
          <button
            onClick={() => setActiveTab('closed')}
            className={cn(
              "pb-3 px-1 border-b-2 font-medium transition-colors",
              activeTab === 'closed'
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            )}
          >
            Closed Trades
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={cn(
              "pb-3 px-1 border-b-2 font-medium transition-colors",
              activeTab === 'stats'
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            )}
          >
            Statistics
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'open' && (
        <OpenTradesTab trades={openTrades} onClose={handleCloseTrade} />
      )}
      {activeTab === 'closed' && (
        <ClosedTradesTab trades={closedTrades} />
      )}
      {activeTab === 'stats' && stats && (
        <StatsTab stats={stats} />
      )}

      {/* Start Trade Modal */}
      {showStartModal && (
        <StartTradeModal
          onClose={() => setShowStartModal(false)}
          onSuccess={() => {
            setShowStartModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  subtitle, 
  trend, 
  icon 
}: { 
  label: string; 
  value: string; 
  subtitle?: string; 
  trend?: 'up' | 'down';
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <div className={cn(
          "p-2 rounded-lg",
          trend === 'up' ? "bg-green-50 text-green-600" :
          trend === 'down' ? "bg-red-50 text-red-600" :
          "bg-gray-50 text-gray-600"
        )}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subtitle && <div className="text-sm text-gray-600 mt-1">{subtitle}</div>}
    </div>
  );
}

function OpenTradesTab({ 
  trades, 
  onClose 
}: { 
  trades: PaperTrade[]; 
  onClose: (id: string) => void;
}) {
  if (trades.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No open paper trades</h3>
          <p className="text-gray-600">
            Start a paper trade to practice trading without risking real money.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trades.map((trade) => (
        <PaperTradeCard key={trade.id} trade={trade} onClose={onClose} />
      ))}
    </div>
  );
}

function ClosedTradesTab({ trades }: { trades: PaperTrade[] }) {
  if (trades.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-600">No closed trades yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stock</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Entry</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Exit</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Qty</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">P&L</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">%</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {trades.map((trade) => {
            const isProfit = (trade.pnl || 0) >= 0;
            return (
              <tr key={trade.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{trade.stocks.symbol}</div>
                  <div className="text-sm text-gray-600">{trade.stocks.name}</div>
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">
                  ₹{trade.entry_price.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">
                  ₹{trade.exit_price?.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">
                  {trade.quantity}
                </td>
                <td className={cn(
                  "px-4 py-3 text-right text-sm font-medium",
                  isProfit ? "text-green-600" : "text-red-600"
                )}>
                  {isProfit ? '+' : ''}₹{trade.pnl?.toFixed(2)}
                </td>
                <td className={cn(
                  "px-4 py-3 text-right text-sm font-medium",
                  isProfit ? "text-green-600" : "text-red-600"
                )}>
                  {isProfit ? '+' : ''}{trade.pnl_percent?.toFixed(2)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatsTab({ stats }: { stats: PaperTradingStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Performance Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
        <div className="space-y-3">
          <StatRow label="Total Trades" value={stats.total_trades.toString()} />
          <StatRow label="Winning Trades" value={stats.winning_trades.toString()} />
          <StatRow label="Losing Trades" value={stats.losing_trades.toString()} />
          <StatRow label="Win Rate" value={`${stats.win_rate.toFixed(1)}%`} />
          <StatRow 
            label="Total P&L" 
            value={`₹${stats.total_pnl.toFixed(2)}`}
            valueColor={stats.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}
          />
          <StatRow 
            label="Average P&L" 
            value={`₹${stats.avg_pnl.toFixed(2)}`}
            valueColor={stats.avg_pnl >= 0 ? 'text-green-600' : 'text-red-600'}
          />
        </div>
      </div>

      {/* Best & Worst Trades */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Best & Worst Trades</h3>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-600 mb-2">Best Trade</div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="font-medium text-green-900">{stats.best_trade.symbol}</div>
              <div className="text-2xl font-bold text-green-600">
                +₹{stats.best_trade.pnl.toFixed(2)}
              </div>
              <div className="text-sm text-green-700">
                +{stats.best_trade.pnl_percent.toFixed(2)}%
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-2">Worst Trade</div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="font-medium text-red-900">{stats.worst_trade.symbol}</div>
              <div className="text-2xl font-bold text-red-600">
                ₹{stats.worst_trade.pnl.toFixed(2)}
              </div>
              <div className="text-sm text-red-700">
                {stats.worst_trade.pnl_percent.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ 
  label, 
  value, 
  valueColor = 'text-gray-900' 
}: { 
  label: string; 
  value: string; 
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={cn("font-medium", valueColor)}>{value}</span>
    </div>
  );
}

function PaperTradeCard({ 
  trade, 
  onClose 
}: { 
  trade: PaperTrade; 
  onClose: (id: string) => void;
}) {
  const currentPnL = trade.current_pnl || 0;
  const currentPnLPercent = trade.current_pnl_percent || 0;
  const isProfit = currentPnL >= 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{trade.stocks.symbol}</h3>
          <p className="text-sm text-gray-600">{trade.stocks.name}</p>
        </div>
        <button
          onClick={() => onClose(trade.id)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Close trade"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray-600">Entry Price</div>
          <div className="font-medium text-gray-900">₹{trade.entry_price.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Current Price</div>
          <div className="font-medium text-gray-900">₹{trade.current_price?.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Quantity</div>
          <div className="font-medium text-gray-900">{trade.quantity}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Investment</div>
          <div className="font-medium text-gray-900">
            ₹{(trade.entry_price * trade.quantity).toFixed(2)}
          </div>
        </div>
      </div>

      <div className={cn(
        "rounded-lg p-3",
        isProfit ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
      )}>
        <div className="flex items-center justify-between">
          <div>
            <div className={cn(
              "text-sm font-medium",
              isProfit ? "text-green-700" : "text-red-700"
            )}>
              Current P&L
            </div>
            <div className={cn(
              "text-2xl font-bold",
              isProfit ? "text-green-600" : "text-red-600"
            )}>
              {isProfit ? '+' : ''}₹{currentPnL.toFixed(2)}
            </div>
          </div>
          <div className={cn(
            "text-right",
            isProfit ? "text-green-600" : "text-red-600"
          )}>
            <div className="flex items-center gap-1">
              {isProfit ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              <span className="text-xl font-bold">
                {isProfit ? '+' : ''}{currentPnLPercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {(trade.target_price || trade.stop_loss) && (
        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
          {trade.target_price && (
            <div>
              <span className="text-gray-600">Target: </span>
              <span className="font-medium text-gray-900">₹{trade.target_price.toFixed(2)}</span>
            </div>
          )}
          {trade.stop_loss && (
            <div>
              <span className="text-gray-600">Stop Loss: </span>
              <span className="font-medium text-gray-900">₹{trade.stop_loss.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StartTradeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await tradingApi.startPaperTrade({
        symbol: symbol.toUpperCase(),
        quantity: parseInt(quantity),
        target_price: targetPrice ? parseFloat(targetPrice) : undefined,
        stop_loss: stopLoss ? parseFloat(stopLoss) : undefined,
        notes: notes || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to start paper trade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Start Paper Trade</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Symbol *
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="e.g., RELIANCE, TCS, INFY"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="10"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Price
              </label>
              <input
                type="number"
                step="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="₹ 2500"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stop Loss
              </label>
              <input
                type="number"
                step="0.01"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="₹ 2300"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this trade..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Starting...' : 'Start Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
