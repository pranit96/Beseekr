import { useEffect, useState } from 'react';
import { tradingApi, isTradingError } from '@/api/trading';
import { AlertCircle, History, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Trade } from '@/types/trading';

export default function TradeHistory() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'WIN' | 'LOSS'>('all');

  useEffect(() => {
    loadTrades();
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredTrades(trades);
    } else {
      setFilteredTrades(trades.filter(t => t.outcome === filter));
    }
  }, [filter, trades]);

  const loadTrades = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tradingApi.getTradeHistory();
      setTrades(data);
      setFilteredTrades(data);
    } catch (err: any) {
      if (isTradingError(err, 'ZERODHA_NOT_CONNECTED')) {
        setError('Zerodha not connected. Please authenticate via Telegram.');
      } else {
        setError(err.message || 'Failed to load trade history');
      }
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: trades.length,
    wins: trades.filter(t => t.outcome === 'WIN').length,
    losses: trades.filter(t => t.outcome === 'LOSS').length,
    totalPnL: trades.reduce((sum, t) => sum + t.pnl, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading trade history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <div className="text-red-400 mb-2">Error Loading Trade History</div>
          <div className="text-slate-400 text-sm">{error}</div>
          <button
            onClick={loadTrades}
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
        <h1 className="text-3xl font-bold text-white">Trade History</h1>
        <p className="text-slate-400 mt-1">Complete journal of closed trades</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="text-sm text-slate-400 mb-1">Total Trades</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="text-sm text-slate-400 mb-1">Wins</div>
          <div className="text-2xl font-bold text-green-500">{stats.wins}</div>
        </div>
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="text-sm text-slate-400 mb-1">Losses</div>
          <div className="text-2xl font-bold text-red-500">{stats.losses}</div>
        </div>
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="text-sm text-slate-400 mb-1">Total P&L</div>
          <div className={cn(
            'text-2xl font-bold',
            stats.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'
          )}>
            ₹{stats.totalPnL.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-5 w-5 text-slate-400" />
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          )}
        >
          All ({trades.length})
        </button>
        <button
          onClick={() => setFilter('WIN')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            filter === 'WIN' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          )}
        >
          Wins ({stats.wins})
        </button>
        <button
          onClick={() => setFilter('LOSS')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            filter === 'LOSS' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          )}
        >
          Losses ({stats.losses})
        </button>
      </div>

      {/* Trade List */}
      {filteredTrades.length === 0 ? (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 text-center">
          <History className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <div className="text-slate-400 mb-2">No trades found</div>
          <div className="text-sm text-slate-500">Your closed trades will appear here</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrades.map((trade) => {
            const isWin = trade.outcome === 'WIN';
            const holdDays = Math.floor(
              (new Date(trade.exit_date).getTime() - new Date(trade.entry_date).getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div key={trade.id} className="bg-slate-900 rounded-lg border border-slate-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-lg font-bold text-white">{trade.stocks.symbol}</div>
                      <div className="text-sm text-slate-400">{trade.stocks.name}</div>
                    </div>
                    <div className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      isWin ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    )}>
                      {trade.outcome}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      'text-xl font-bold flex items-center gap-2',
                      isWin ? 'text-green-500' : 'text-red-500'
                    )}>
                      {isWin ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                      ₹{trade.pnl.toFixed(2)}
                    </div>
                    <div className={cn('text-sm', isWin ? 'text-green-400' : 'text-red-400')}>
                      {trade.pnl_percent >= 0 ? '+' : ''}{trade.pnl_percent.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div>
                    <div className="text-slate-500">Entry</div>
                    <div className="text-white font-medium">₹{trade.entry_price.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Exit</div>
                    <div className="text-white font-medium">₹{trade.exit_price.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Shares</div>
                    <div className="text-white font-medium">{trade.shares}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Hold Time</div>
                    <div className="text-white font-medium">{holdDays} days</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Exit Type</div>
                    <div className="text-white font-medium">{trade.exit_type || 'Manual'}</div>
                  </div>
                </div>

                {trade.notes && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <div className="text-xs text-slate-500 mb-1">Notes</div>
                    <div className="text-sm text-slate-300">{trade.notes}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
