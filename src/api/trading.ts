// Complete Trading API Client - Production Ready
import type {
  Signal,
  Position,
  Trade,
  RealtimePnL,
  StrategyPerformance,
  CorrelationHeatmap,
  RiskAttribution,
  PortfolioMetrics,
  SystemHealth,
  MarketRegime,
  PerformanceStats,
  WatchlistItem,
  PaperTrade,
  PaperTradingStats,
} from '@/types/trading';

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Base request helper with error handling
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle specific error cases
      if (response.status === 503 && errorData.action_required === 'zerodha_login') {
        throw new Error('ZERODHA_NOT_CONNECTED');
      }

      throw new Error(errorData.error || errorData.message || `Request failed: ${response.status}`);
    }

    const json = await response.json();

    // Backend wraps responses in {success: true, data: {...}}
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return json.data as T;
    }

    return json;
  } catch (error: any) {
    // Re-throw with more context
    if (error.message === 'ZERODHA_NOT_CONNECTED') {
      throw error;
    }
    throw new Error(error.message || 'Network request failed');
  }
}

export const tradingApi = {
  // ==================== SIGNALS ====================

  async getSignals(params?: { strategy?: string; min_confidence?: number }): Promise<Signal[]> {
    const queryParams = new URLSearchParams();
    if (params?.strategy) queryParams.append('strategy', params.strategy);
    if (params?.min_confidence) queryParams.append('min_confidence', String(params.min_confidence));

    const endpoint = `/api/stock-strategy/signals${queryParams.toString() ? `?${queryParams}` : ''}`;
    return request<Signal[]>(endpoint);
  },

  async getSignalDetails(signalId: string): Promise<Signal> {
    return request<Signal>(`/api/stock-strategy/signals/${signalId}`);
  },

  async triggerScan(): Promise<{ message: string }> {
    return request<{ message: string }>('/api/stock-strategy/signals/scan', { method: 'POST' });
  },

  // ==================== WATCHLIST ====================

  async getWatchlist(): Promise<WatchlistItem[]> {
    return request<WatchlistItem[]>('/api/stock-strategy/watchlist');
  },

  async addToWatchlist(data: {
    symbol: string;
    alert_price_above?: number;
    alert_price_below?: number;
    notes?: string;
  }): Promise<WatchlistItem> {
    return request<WatchlistItem>('/api/stock-strategy/watchlist', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async removeFromWatchlist(watchlistId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/stock-strategy/watchlist/${watchlistId}`, {
      method: 'DELETE',
    });
  },

  async updateWatchlistAlerts(watchlistId: string, data: {
    alert_price_above?: number;
    alert_price_below?: number;
  }): Promise<WatchlistItem> {
    return request<WatchlistItem>(`/api/stock-strategy/watchlist/${watchlistId}/alerts`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // ==================== PAPER TRADING ====================

  async getPaperTrades(status?: 'OPEN' | 'CLOSED'): Promise<PaperTrade[]> {
    const endpoint = status ? `/api/stock-strategy/paper-trades?status=${status}` : '/api/stock-strategy/paper-trades';
    return request<PaperTrade[]>(endpoint);
  },

  async startPaperTrade(data: {
    symbol: string;
    quantity: number;
    target_price?: number;
    stop_loss?: number;
    notes?: string;
  }): Promise<PaperTrade> {
    return request<PaperTrade>('/api/stock-strategy/paper-trades', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async closePaperTrade(tradeId: string): Promise<PaperTrade> {
    return request<PaperTrade>(`/api/stock-strategy/paper-trades/${tradeId}/close`, {
      method: 'PUT',
    });
  },

  async getPaperTradingStats(): Promise<PaperTradingStats> {
    return request<PaperTradingStats>('/api/stock-strategy/paper-trades/stats');
  },

  // ==================== POSITIONS ====================

  async getPositions(status: 'OPEN' | 'CLOSED' | 'all' = 'OPEN'): Promise<Position[]> {
    const endpoint = `/api/stock-strategy/trades${status !== 'all' ? `?status=${status}` : ''}`;
    return request<Position[]>(endpoint);
  },

  async getOpenPositions(): Promise<Position[]> {
    return this.getPositions('OPEN');
  },

  async getTradeHistory(): Promise<Trade[]> {
    return this.getPositions('CLOSED') as Promise<Trade[]>;
  },

  // ==================== TRADES ====================

  async recordTrade(tradeData: {
    signal_id: string;
    entry_price: number;
    shares: number;
    notes?: string;
  }): Promise<Position> {
    return request<Position>('/api/stock-strategy/trades', {
      method: 'POST',
      body: JSON.stringify(tradeData),
    });
  },

  async closeTrade(tradeId: string, closeData: {
    exit_price: number;
    notes?: string;
  }): Promise<Position> {
    return request<Position>(`/api/stock-strategy/trades/${tradeId}/close`, {
      method: 'POST',
      body: JSON.stringify(closeData),
    });
  },

  // ==================== ANALYTICS ====================

  async getRealtimePnL(): Promise<RealtimePnL> {
    return request<RealtimePnL>('/api/stock-strategy/analytics/realtime-pnl');
  },

  async getStrategyPerformance(): Promise<{ strategies: StrategyPerformance[]; total_strategies: number }> {
    return request('/api/stock-strategy/analytics/strategy-performance');
  },

  async getCorrelationHeatmap(): Promise<CorrelationHeatmap> {
    return request<CorrelationHeatmap>('/api/stock-strategy/analytics/correlation-heatmap');
  },

  async getRiskAttribution(): Promise<RiskAttribution> {
    return request<RiskAttribution>('/api/stock-strategy/analytics/risk-attribution');
  },

  async getPortfolioMetrics(): Promise<PortfolioMetrics> {
    return request<PortfolioMetrics>('/api/stock-strategy/analytics/portfolio-metrics');
  },

  // ==================== PERFORMANCE ====================

  async getPerformanceStats(): Promise<PerformanceStats> {
    return request<PerformanceStats>('/api/stock-strategy/portfolio/performance');
  },

  // ==================== MARKET ====================

  async getMarketRegime(): Promise<{ regime: MarketRegime; recommendedStrategies: string[] }> {
    return request('/api/stock-strategy/market/regime');
  },

  async getDrawdownStatus(): Promise<any> {
    return request('/api/stock-strategy/market/drawdown');
  },

  // ==================== SYSTEM ====================

  async getSystemHealth(): Promise<SystemHealth> {
    return request<SystemHealth>('/api/stock-strategy/system/health');
  },

  // ==================== NEWS ====================

  async getStockNews(symbol: string, limit: number = 10): Promise<any> {
    return request(`/api/stock-strategy/news/stock/${symbol}?limit=${limit}`);
  },

  async getMarketSentiment(): Promise<any> {
    return request('/api/stock-strategy/news/market-sentiment');
  },

  async getTrendingNews(limit: number = 10): Promise<any> {
    return request(`/api/stock-strategy/news/trending?limit=${limit}`);
  },

  async searchNews(query: string, limit: number = 20): Promise<any> {
    return request(`/api/stock-strategy/news/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  },

  // ==================== ANALYSIS ====================

  async analyzeStock(symbol: string): Promise<any> {
    return request(`/api/stock-strategy/analysis/stock/${symbol}`, { method: 'POST' });
  },

  async getAdvancedTechnicalAnalysis(symbol: string): Promise<any> {
    return request(`/api/stock-strategy/analysis/technical/${symbol}`);
  },

  // ==================== STRATEGIES ====================

  async getStrategies(): Promise<any[]> {
    return request('/api/stock-strategy/strategies');
  },

  // ==================== POSITION SIZING ====================

  async calculatePosition(data: {
    account_size: number;
    risk_percent: number;
    entry_price: number;
    stop_loss: number;
  }): Promise<any> {
    return request('/api/stock-strategy/portfolio/position', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ==================== DATA VALIDATION ====================

  async getValidationMetrics(days: number = 7): Promise<{
    summary: {
      total_validations: number;
      total_failures: number;
      failure_rate: string;
      avg_quality_score: string;
    };
    daily_metrics: any[];
    recent_failures: any[];
    period_days: number;
  }> {
    return request(`/api/stock-strategy/validation/metrics?days=${days}`);
  },

  async getMarketStatus(): Promise<{
    market: {
      is_open: boolean;
      current_time: string;
      market_hours: string;
      status: string;
    };
    validation: {
      canTrade: boolean;
      reason?: string;
      warning?: string;
      optimal?: boolean;
    };
    circuit_breaker: {
      state: string;
      failures: number;
      lastFailureTime: string | null;
      timeSinceFailure: number | null;
    };
    timestamp: string;
  }> {
    return request('/api/stock-strategy/market/status');
  },

  // ==================== DAILY PICKS ====================

  async generateDailyPicks(data: {
    budget: number;
    risk_profile: 'conservative' | 'moderate' | 'aggressive';
    timeframe: 'day' | 'week' | 'month' | 'year';
  }): Promise<any> {
    return request('/api/stock-strategy/budget-portfolio/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Export error types for handling
export const TradingErrors = {
  ZERODHA_NOT_CONNECTED: 'ZERODHA_NOT_CONNECTED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
} as const;

// Helper to check error type
export function isTradingError(error: any, type: keyof typeof TradingErrors): boolean {
  return error?.message === TradingErrors[type];
}
