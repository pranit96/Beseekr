import { api } from '@/lib/apiWrapper';

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  market_cap: number;
}

export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  criteria: Record<string, any>;
  active: boolean;
}

export interface StrategySignal {
  id: string;
  stock_id: string;
  strategy_id: string;
  signal_type: 'BUY' | 'SELL';
  entry_price: number;
  target_price: number;
  stop_loss: number;
  risk_reward: number;
  confidence_score: number;
  criteria_met: Record<string, boolean>;
  status: 'ACTIVE' | 'EXPIRED' | 'TRIGGERED';
  created_at: string;
  expires_at: string;
  stocks: Stock;
  trading_strategies: TradingStrategy;
}

export interface Trade {
  id: string;
  signal_id: string;
  stock_id: string;
  entry_date: string;
  entry_price: number;
  shares: number;
  exit_date?: string;
  exit_price?: number;
  pnl?: number;
  pnl_percent?: number;
  outcome?: 'WIN' | 'LOSS' | 'BREAKEVEN';
  status: 'OPEN' | 'CLOSED';
  notes?: string;
  stocks: Stock;
  strategy_signals?: StrategySignal;
}

export interface PerformanceStats {
  total_trades: number;
  wins: number;
  losses: number;
  win_rate: number;
  total_pnl: number;
  avg_win: number;
  avg_loss: number;
  best_trade: number;
  worst_trade: number;
  avg_hold_time: number;
}

export const stockStrategyApi = {
  // Get active signals
  getSignals: async (filters?: { strategy?: string; min_confidence?: number }) => {
    const params = new URLSearchParams();
    if (filters?.strategy) params.append('strategy', filters.strategy);
    if (filters?.min_confidence) params.append('min_confidence', filters.min_confidence.toString());
    
    const response = await api.get(`/stock-strategy/signals?${params}`);
    return response.data as StrategySignal[];
  },

  // Get signal details
  getSignalDetails: async (signalId: string) => {
    const response = await api.get(`/stock-strategy/signals/${signalId}`);
    return response.data as StrategySignal & { current_price: number; price_change: number };
  },

  // Analyze specific stock
  analyzeStock: async (symbol: string) => {
    const response = await api.get(`/stock-strategy/analyze/${symbol}`);
    return response.data;
  },

  // Get trading strategies
  getStrategies: async () => {
    const response = await api.get('/stock-strategy/strategies');
    return response.data as TradingStrategy[];
  },

  // Trigger manual scan
  triggerScan: async () => {
    const response = await api.post('/stock-strategy/scan');
    return response.data;
  },

  // Record trade
  recordTrade: async (data: {
    signal_id: string;
    entry_price: number;
    shares: number;
    notes?: string;
  }) => {
    const response = await api.post('/stock-strategy/trades', data);
    return response.data as Trade;
  },

  // Close trade
  closeTrade: async (tradeId: string, data: { exit_price: number; notes?: string }) => {
    const response = await api.put(`/stock-strategy/trades/${tradeId}/close`, data);
    return response.data as Trade;
  },

  // Get user trades
  getUserTrades: async (filters?: { status?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await api.get(`/stock-strategy/trades?${params}`);
    return response.data as { data: Trade[]; pagination: { page: number; limit: number; total: number } };
  },

  // Get performance stats
  getPerformanceStats: async () => {
    const response = await api.get('/stock-strategy/performance');
    return response.data as PerformanceStats;
  },
};
