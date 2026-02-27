// Stock Strategy API Client
const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

export interface Signal {
  id: string;
  stocks: { symbol: string; name: string };
  trading_strategies: { name: string };
  entry_price: number;
  target_price: number;
  stop_loss: number;
  risk_reward: number;
  confidence_score: number;
  status: string;
  created_at: string;
}

export interface BudgetPortfolioRequest {
  budget: number;
  risk_profile: 'conservative' | 'moderate' | 'aggressive';
  timeframe: 'day' | 'week' | 'month' | 'year';
}

// Base request helper
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
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
    throw new Error(errorData.error || errorData.message || `Request failed: ${response.status}`);
  }

  const json = await response.json();
  
  // Backend wraps responses in {success: true, data: {...}}
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data as T;
  }

  return json;
}

export const stockStrategyApi = {
  // Signals
  async getSignals(params?: { strategy?: string; min_confidence?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.strategy) queryParams.append('strategy', params.strategy);
    if (params?.min_confidence) queryParams.append('min_confidence', String(params.min_confidence));
    
    const endpoint = `/api/stock-strategy/signals${queryParams.toString() ? `?${queryParams}` : ''}`;
    return request<Signal[]>(endpoint);
  },

  async getSignalDetails(signalId: string) {
    return request<any>(`/api/stock-strategy/signals/${signalId}`);
  },

  async getSignalsWithEvents() {
    return request<any[]>('/api/stock-strategy/signals/with-events');
  },

  async triggerScan() {
    return request<any>('/api/stock-strategy/signals/scan', { method: 'POST' });
  },

  // Trades
  async recordTrade(tradeData: any) {
    return request<any>('/api/stock-strategy/trades', { 
      method: 'POST',
      body: JSON.stringify(tradeData)
    });
  },

  async getUserTrades() {
    return request<any[]>('/api/stock-strategy/trades');
  },

  async closeTrade(tradeId: string, closeData: any) {
    return request<any>(`/api/stock-strategy/trades/${tradeId}/close`, {
      method: 'POST',
      body: JSON.stringify(closeData)
    });
  },

  // Portfolio
  async getPerformanceStats() {
    return request<any>('/api/stock-strategy/portfolio/performance');
  },

  async getPortfolioCorrelation() {
    return request<any>('/api/stock-strategy/portfolio/correlation');
  },

  async calculatePosition(positionData: any) {
    return request<any>('/api/stock-strategy/portfolio/position', {
      method: 'POST',
      body: JSON.stringify(positionData)
    });
  },

  // Market
  async getMarketRegime() {
    return request<any>('/api/stock-strategy/market/regime');
  },

  async getUpcomingEvents() {
    return request<any[]>('/api/stock-strategy/market/events');
  },

  async getDrawdownStatus() {
    return request<any>('/api/stock-strategy/market/drawdown');
  },

  // Analysis
  async analyzeStock(symbol: string) {
    return request<any>(`/api/stock-strategy/analysis/stock/${symbol}`, { method: 'POST' });
  },

  async getAdvancedTechnicalAnalysis(symbol: string) {
    return request<any>(`/api/stock-strategy/analysis/technical/${symbol}`);
  },

  async getAdvancedFundamentalAnalysis(symbol: string) {
    return request<any>(`/api/stock-strategy/analysis/fundamental/${symbol}`);
  },

  async getComprehensiveAnalysis(symbol: string) {
    return request<any>(`/api/stock-strategy/analysis/comprehensive/${symbol}`);
  },

  // Validation
  async validateSignalWithClaude(signalData: any) {
    return request<any>('/api/stock-strategy/validate/claude', {
      method: 'POST',
      body: JSON.stringify(signalData)
    });
  },

  // Budget Portfolio
  async generateBudgetPortfolio(requestData: BudgetPortfolioRequest) {
    return request<any>('/api/stock-strategy/budget-portfolio/generate', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
  },

  // Strategies
  async getStrategies() {
    return request<any[]>('/api/stock-strategy/strategies');
  },

  // LLM Config
  async getLLMConfig() {
    return request<any>('/api/stock-strategy/llm/config');
  },

  // Backtesting
  async runBacktest(backtestData: { strategy: string; symbols: string[]; start_date: string; end_date: string }) {
    return request<any>('/api/stock-strategy/backtest/run', {
      method: 'POST',
      body: JSON.stringify(backtestData)
    });
  },

  async getBacktestResults(strategy: string) {
    return request<any>(`/api/stock-strategy/backtest/results/${strategy}`);
  },

  // Trade Validation
  async validateTradeViability(tradeData: { entry_price: number; target_price: number; stop_loss: number; quantity: number; trade_type?: string }) {
    return request<any>('/api/stock-strategy/validate/trade-viability', {
      method: 'POST',
      body: JSON.stringify(tradeData)
    });
  },

  // Advanced Analytics (USER-SPECIFIC)
  async getStrategyPerformance() {
    return request<any>('/api/stock-strategy/analytics/strategy-performance');
  },

  async getCorrelationHeatmap() {
    return request<any>('/api/stock-strategy/analytics/correlation-heatmap');
  },

  async getRiskAttribution() {
    return request<any>('/api/stock-strategy/analytics/risk-attribution');
  },

  async getRealtimePnL() {
    return request<any>('/api/stock-strategy/analytics/realtime-pnl');
  },

  async getPortfolioMetrics() {
    return request<any>('/api/stock-strategy/analytics/portfolio-metrics');
  },

  // System Health
  async getSystemHealth() {
    return request<any>('/api/stock-strategy/system/health');
  },

  // Legacy monitoring endpoints (keeping for backward compatibility)
  async getSystemMetrics() {
    return request<any>('/api/monitoring/metrics');
  },

  async getSystemAlerts() {
    return request<any[]>('/api/monitoring/alerts');
  },

  async testAlerts() {
    return request<any>('/api/monitoring/alerts/test', { method: 'POST' });
  },

  async resetMetrics() {
    return request<any>('/api/monitoring/metrics/reset', { method: 'POST' });
  },
};
