// Trading System TypeScript Types

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  sector?: string;
  industry?: string;
}

export interface Signal {
  id: string;
  stock_id: string;
  stocks: Stock;
  trading_strategies: {
    id: string;
    name: string;
    description?: string;
  };
  signal_type: "BUY" | "SELL";
  entry_price: number;
  target_price: number;
  stop_loss: number;
  risk_reward: number;
  confidence_score: number;
  criteria_met: string[];
  status: "ACTIVE" | "EXPIRED" | "EXECUTED";
  created_at: string;
  expires_at: string;
}

export interface Position {
  id: string;
  user_id: string;
  signal_id: string;
  stock_id: string;
  stocks: Stock;
  strategy_signals: Signal;
  entry_date: string;
  entry_price: number;
  shares: number;
  current_price?: number;
  current_pnl?: number;
  current_pnl_percent?: number;
  status: "OPEN" | "CLOSED";
  exit_date?: string;
  exit_price?: number;
  pnl?: number;
  pnl_percent?: number;
  outcome?: "WIN" | "LOSS" | "BREAKEVEN";
  exit_type?: string;
  exit_reason?: string;
  notes?: string;
}

export interface Trade extends Position {
  // Trade is same as Position but always CLOSED
  status: "CLOSED";
  exit_date: string;
  exit_price: number;
  pnl: number;
  pnl_percent: number;
  outcome: "WIN" | "LOSS" | "BREAKEVEN";
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

export interface RealtimePnL {
  total_pnl: number;
  total_pnl_percent: number;
  total_value: number;
  total_invested: number;
  positions: {
    symbol: string;
    shares: number;
    entry_price: number;
    current_price: number;
    pnl: number;
    pnl_percent: number;
    position_value: number;
  }[];
  timestamp: string;
}

export interface StrategyPerformance {
  name: string;
  total_trades: number;
  wins: number;
  losses: number;
  win_rate: number;
  total_pnl: number;
  avg_return: number;
  best_trade: number;
  worst_trade: number;
  sharpe_ratio: number;
  avg_hold_days: number;
  profit_factor: number;
}

export interface CorrelationHeatmap {
  matrix: number[][];
  symbols: string[];
  high_correlations: {
    symbol1: string;
    symbol2: string;
    correlation: number;
    risk: string;
  }[];
  diversification_score: number;
  timestamp: string;
}

export interface RiskAttribution {
  positions: {
    symbol: string;
    shares: number;
    entry_price: number;
    current_price: number;
    stop_loss: number;
    position_value: number;
    risk_amount: number;
    current_pnl: number;
    current_pnl_percent: number;
    distance_to_stop_percent: number;
    risk_level: "Critical" | "High" | "Normal";
    risk_percent_of_portfolio: number;
    value_percent_of_portfolio: number;
  }[];
  portfolio_summary: {
    total_value: number;
    total_risk: number;
    total_pnl: number;
    total_pnl_percent: number;
    risk_percent_of_portfolio: number;
    positions_count: number;
    critical_positions: number;
  };
  timestamp: string;
}

export interface PortfolioMetrics {
  closed_trades: {
    total: number;
    wins: number;
    losses: number;
    win_rate: number;
    total_pnl: number;
    avg_win: number;
    avg_loss: number;
    profit_factor: number;
  };
  open_positions: {
    count: number;
    total_value: number;
    total_pnl: number;
    total_pnl_percent: number;
  };
  overall: {
    total_trades: number;
    realized_pnl: number;
    unrealized_pnl: number;
    total_pnl: number;
  };
  timestamp: string;
}

export interface SystemHealth {
  overall_status: "healthy" | "degraded" | "critical";
  services: {
    zerodha: {
      status: "healthy" | "degraded" | "error";
      circuit_breaker?: {
        state: string;
        failures: number;
      };
      response_time_ms?: number;
      message: string;
    };
    claude: {
      status: "healthy" | "degraded" | "error";
      circuit_breaker?: {
        state: string;
        failures: number;
      };
      accuracy?: {
        rate: string;
        total_validations: number;
      };
      message: string;
    };
    database: {
      status: "healthy" | "error";
      response_time_ms?: number;
      message: string;
    };
    memory: {
      status: "healthy" | "warning" | "critical";
      heap_used_mb: string;
      heap_total_mb: string;
      heap_percent: string;
      message: string;
    };
  };
  metrics?: {
    api_calls: number;
    api_errors: number;
    avg_response_time: number;
  };
  timestamp: string;
}

export interface MarketRegime {
  regime: string;
  confidence: number;
  description: string;
  volatility: string;
  trend: string;
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

export interface WebSocketStatus {
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
}

export interface TradingContextType {
  // Real-time data
  prices: Map<string, PriceUpdate>;
  realtimePnL: RealtimePnL | null;
  systemHealth: SystemHealth | null;

  // WebSocket status
  wsStatus: WebSocketStatus;

  // Actions
  subscribeToPrices: (symbols: string[]) => void;
  subscribeToPnL: () => void;
  subscribeToHealth: () => void;
  requestAnalytics: (type: string) => void;
}

// Watchlist Types
export interface WatchlistItem {
  id: string;
  user_id: string;
  stock_id: string;
  stocks: Stock;
  notes?: string;
  alert_price_above?: number;
  alert_price_below?: number;
  current_price?: number;
  change_percent?: number;
  data_quality_score?: number;
  validation_warnings?: string[];
  created_at: string;
}

// Paper Trading Types
export interface PaperTrade {
  id: string;
  user_id: string;
  stock_id: string;
  stocks: Stock;
  entry_price: number;
  entry_date: string;
  exit_price?: number;
  exit_date?: string;
  quantity: number;
  target_price?: number;
  stop_loss?: number;
  status: "OPEN" | "CLOSED" | "STOPPED";
  pnl?: number;
  pnl_percent?: number;
  notes?: string;
  current_price?: number;
  current_pnl?: number;
  current_pnl_percent?: number;
  data_quality_score?: number;
  validation_warnings?: string[];
  created_at: string;
  updated_at: string;
}

export interface PaperTradingStats {
  total_trades: number;
  open_trades: number;
  closed_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  total_pnl: number;
  avg_pnl: number;
  best_trade: {
    pnl: number;
    pnl_percent: number;
    symbol: string;
  };
  worst_trade: {
    pnl: number;
    pnl_percent: number;
    symbol: string;
  };
  total_investment: number;
  current_value: number;
}
