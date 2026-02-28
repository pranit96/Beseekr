import { useEffect, useState } from 'react';
import { tradingApi } from '@/api/trading';
import { Plus, Trash2, Bell, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataQualityBadge } from '@/components/trading/DataQualityBadge';
import type { WatchlistItem } from '@/types/trading';

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null);

  useEffect(() => {
    loadWatchlist();
    const interval = setInterval(loadWatchlist, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tradingApi.getWatchlist();
      setWatchlist(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this stock from watchlist?')) return;
    
    try {
      await tradingApi.removeFromWatchlist(id);
      setWatchlist(watchlist.filter(item => item.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to remove from watchlist');
    }
  };

  const handleSetAlert = (item: WatchlistItem) => {
    setSelectedItem(item);
    setShowAlertModal(true);
  };

  if (loading && watchlist.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading watchlist...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Watchlist</h1>
          <p className="text-gray-600 mt-1">Track your favorite stocks with price alerts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Stock
        </button>
      </div>

      {/* Watchlist Grid */}
      {watchlist.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your watchlist is empty</h3>
            <p className="text-gray-600 mb-6">
              Add stocks to track their prices and set alerts for important price movements.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Your First Stock
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlist.map((item) => (
            <WatchlistCard
              key={item.id}
              item={item}
              onRemove={handleRemove}
              onSetAlert={handleSetAlert}
            />
          ))}
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddModal && (
        <AddStockModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadWatchlist();
          }}
        />
      )}

      {/* Set Alert Modal */}
      {showAlertModal && selectedItem && (
        <SetAlertModal
          item={selectedItem}
          onClose={() => {
            setShowAlertModal(false);
            setSelectedItem(null);
          }}
          onSuccess={() => {
            setShowAlertModal(false);
            setSelectedItem(null);
            loadWatchlist();
          }}
        />
      )}
    </div>
  );
}

function WatchlistCard({ 
  item, 
  onRemove, 
  onSetAlert 
}: { 
  item: WatchlistItem; 
  onRemove: (id: string) => void;
  onSetAlert: (item: WatchlistItem) => void;
}) {
  const changePercent = item.change_percent || 0;
  const isPositive = changePercent >= 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{item.stocks.symbol}</h3>
          <p className="text-sm text-gray-600">{item.stocks.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSetAlert(item)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Set price alert"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Remove from watchlist"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Price */}
      {item.current_price && (
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900">
              ₹{item.current_price.toFixed(2)}
            </div>
            {item.data_quality_score !== undefined && (
              <DataQualityBadge 
                score={item.data_quality_score} 
                warnings={item.validation_warnings}
                size="sm"
              />
            )}
          </div>
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            isPositive ? "text-green-600" : "text-red-600"
          )}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{isPositive ? '+' : ''}{changePercent.toFixed(2)}%</span>
          </div>
        </div>
      )}

      {/* Alerts */}
      {(item.alert_price_above || item.alert_price_below) && (
        <div className="space-y-1 text-sm">
          {item.alert_price_above && (
            <div className="flex items-center gap-2 text-gray-600">
              <Bell className="w-3.5 h-3.5" />
              <span>Alert above ₹{item.alert_price_above.toFixed(2)}</span>
            </div>
          )}
          {item.alert_price_below && (
            <div className="flex items-center gap-2 text-gray-600">
              <Bell className="w-3.5 h-3.5" />
              <span>Alert below ₹{item.alert_price_below.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {item.notes && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600">{item.notes}</p>
        </div>
      )}
    </div>
  );
}

function AddStockModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [symbol, setSymbol] = useState('');
  const [alertAbove, setAlertAbove] = useState('');
  const [alertBelow, setAlertBelow] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await tradingApi.addToWatchlist({
        symbol: symbol.toUpperCase(),
        alert_price_above: alertAbove ? parseFloat(alertAbove) : undefined,
        alert_price_below: alertBelow ? parseFloat(alertBelow) : undefined,
        notes: notes || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Stock to Watchlist</h2>
        
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert Above
              </label>
              <input
                type="number"
                step="0.01"
                value={alertAbove}
                onChange={(e) => setAlertAbove(e.target.value)}
                placeholder="₹ 2500"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert Below
              </label>
              <input
                type="number"
                step="0.01"
                value={alertBelow}
                onChange={(e) => setAlertBelow(e.target.value)}
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
              placeholder="Add notes about this stock..."
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
              {loading ? 'Adding...' : 'Add Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SetAlertModal({ 
  item, 
  onClose, 
  onSuccess 
}: { 
  item: WatchlistItem; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [alertAbove, setAlertAbove] = useState(item.alert_price_above?.toString() || '');
  const [alertBelow, setAlertBelow] = useState(item.alert_price_below?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await tradingApi.updateWatchlistAlerts(item.id, {
        alert_price_above: alertAbove ? parseFloat(alertAbove) : undefined,
        alert_price_below: alertBelow ? parseFloat(alertBelow) : undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update alerts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Set Price Alerts</h2>
        <p className="text-gray-600 mb-4">{item.stocks.name} ({item.stocks.symbol})</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {item.current_price && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">Current Price</div>
              <div className="text-2xl font-bold text-blue-900">₹{item.current_price.toFixed(2)}</div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alert When Price Goes Above
            </label>
            <input
              type="number"
              step="0.01"
              value={alertAbove}
              onChange={(e) => setAlertAbove(e.target.value)}
              placeholder="₹ 2500"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alert When Price Goes Below
            </label>
            <input
              type="number"
              step="0.01"
              value={alertBelow}
              onChange={(e) => setAlertBelow(e.target.value)}
              placeholder="₹ 2300"
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
              {loading ? 'Saving...' : 'Save Alerts'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
