import { useEffect, useState } from 'react';
import { tradingApi, isTradingError } from '@/api/trading';
import { AlertCircle, Signal as SignalIcon, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Signal } from '@/types/trading';

export default function Signals() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minConfidence, setMinConfidence] = useState(60);

  useEffect(() => {
    loadSignals();
  }, [minConfidence]);

  const loadSignals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tradingApi.getSignals({ min_confidence: minConfidence });
      setSignals(data);
    } catch (err: any) {
      if (isTradingError(err, 'ZERODHA_NOT_CONNECTED')) {
        setError('Zerodha not connected. Please authenticate via Telegram.');
      } else {
        setError(err.message || 'Failed to load signals');
      }
    } finally {
      setLoading(false);
    }
  };

  const triggerScan = async () => {
    try {
      setScanning(true);
      await tradingApi.triggerScan();
      setTimeout(loadSignals, 2000); // Reload after 2 seconds
    } catch (err: any) {
      setError(err.message || 'Failed to trigger scan');
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading signals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <div className="text-red-400 mb-2">Error Loading Signals</div>
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
          <h1 className="text-3xl font-bold text-white">Active Signals</h1>
          <p className="text-slate-400 mt-1">Trading opportunities identified by strategies</p>
        </div>
        <button
          onClick={triggerScan}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', scanning && 'animate-spin')} />
          {scanning ? 'Scanning...' : 'Scan Now'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-slate-400">Min Confidence:</label>
        <select
          value={minConfidence}
          onChange={(e) => setMinConfidence(Number(e.target.value))}
          className="px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700"
        >
          <option value={50}>50%</option>
          <option value={60}>60%</option>
          <option value={70}>70%</option>
          <option value={80}>80%</option>
        </select>
        <div className="text-sm text-slate-400">
          Showing {signals.length} signal{signals.length !== 1 ? 's' : ''}
        </div>
      </div>

      {signals.length === 0 ? (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 text-center">
          <SignalIcon className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <div className="text-slate-400 mb-2">No active signals</div>
          <div className="text-sm text-slate-500">Try lowering the confidence threshold or trigger a new scan</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {signals.map((signal) => (
            <div key={signal.id} className="bg-slate-900 rounded-lg border border-slate-800 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xl font-bold text-white">{signal.stocks.symbol}</div>
                  <div className="text-sm text-slate-400">{signal.stocks.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{signal.stocks.sector}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className={cn(
                    'px-3 py-1 rounded text-sm font-medium',
                    signal.signal_type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  )}>
                    {signal.signal_type}
                  </div>
                  <div className="text-xs text-slate-400">
                    {signal.status}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Entry</div>
                  <div className="text-lg font-bold text-white">₹{signal.entry_price.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Target</div>
                  <div className="text-lg font-bold text-green-400">₹{signal.target_price.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Stop Loss</div>
                  <div className="text-lg font-bold text-red-400">₹{signal.stop_loss.toFixed(2)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div>
                  <div className="text-slate-500">Risk:Reward</div>
                  <div className="text-white font-medium">{signal.risk_reward.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-slate-500">Confidence</div>
                  <div className="text-white font-medium">{signal.confidence_score}%</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <div className="text-xs text-slate-500 mb-2">Strategy</div>
                <div className="text-sm text-white font-medium">{signal.trading_strategies.name}</div>
                {signal.trading_strategies.description && (
                  <div className="text-xs text-slate-400 mt-1">{signal.trading_strategies.description}</div>
                )}
              </div>

              {signal.criteria_met && signal.criteria_met.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="text-xs text-slate-500 mb-2">Criteria Met</div>
                  <div className="flex flex-wrap gap-2">
                    {signal.criteria_met.map((criteria, i) => (
                      <div key={i} className="text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded">
                        {criteria}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 text-xs text-slate-500">
                Created: {new Date(signal.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
