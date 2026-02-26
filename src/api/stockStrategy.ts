import { apiClient } from '@/lib/api';

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
  action: 'BUY' | 'SELL';
  entry_price: number;
  target_price: number;
  stop_loss: number;
  risk_reward: number;
  confidence_score: number;
  confidence: number;
  criteria_met: Record<string, boolean>;
  status: 'ACTIVE' | 'EXPIRED' | 'TRIGGERED';
  created_at: string;
  expires_at: string;
  stocks: Stock;
  trading_strategies: TradingStrategy;
  strategy: string;
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

export interface MarketRegime {
  regime: string;
  confidence: number;
  description: string;
  volatility: string;
  trend: string;
  recommendedStrategies?: string[];
}

export interface DrawdownStatus {
  canTrade: boolean;
  dailyDrawdown: number;
  weeklyDrawdown: number;
  monthlyDrawdown: number;
  consecutiveLosses: number;
  positionSizeMultiplier: number;
  status: string;
  reason?: string;
}

export interface CorrelationMatrix {
  positions: number;
  matrix: any;
  avgCorrelation: number;
  diversificationScore: number;
  analysis: {
    rating: string;
    message: string;
    recommendation?: string;
  };
}

export interface BudgetPortfolio {
  success: boolean;
  portfolio?: {
    stocks: any[];
    summary: {
      total_stocks: number;
      total_allocated: number;
      remaining_budget: number;
      avg_risk_reward: number;
      portfolio_risk: string;
    };
  };
  message?: string;
}

export interface AdvancedAnalysis {
  symbol: string;
  timestamp: string;
  technical?: any;
  fundamental?: any;
  aiValidation?: any;
  finalRecommendation?: any;
  analysis?: any;
}

export const stockStrategyApi = {
  // ========== SIGNALS ==========
  
  // Get active signals
  getSignals: async (filters?: { strategy?: string; min_confidence?: number }) => {
    const response = await apiClient.getStockSignals(filters);
    return response.data;
  },

  // Get signal details
  getSignalDetails: async (signalId: string) => {
    const response = await apiClient.getStockSignalDetails(signalId);
    return response.data as StrategySignal & { current_price: number; price_change: number };
  },

  // Get signals with events
  getSignalsWithEvents: async (filters?: { has_event?: boolean; days?: number }) => {
    const response = await apiClient.getStockSignalsWithEvents(filters);
    return response.data;
  },

  // ========== ANALYSIS ==========
  
  // Analyze specific stock
  analyzeStock: async (symbol: string) => {
    const response = await apiClient.analyzeStock(symbol);
    return response.data;
  },

  // Get advanced technical analysis
  getAdvancedTechnicalAnalysis: async (symbol: string) => {
    const response = await apiClient.getAdvancedTechnicalAnalysis(symbol);
    return response.data as AdvancedAnalysis;
  },

  // Get advanced fundamental analysis
  getAdvancedFundamentalAnalysis: async (symbol: string) => {
    const response = await apiClient.getAdvancedFundamentalAnalysis(symbol);
    return response.data as AdvancedAnalysis;
  },

  // Get comprehensive analysis
  getComprehensiveAnalysis: async (symbol: string) => {
    const response = await apiClient.getComprehensiveAnalysis(symbol);
    return response.data as AdvancedAnalysis;
  },

  // ========== STRATEGIES ==========
  
  // Get trading strategies
  getStrategies: async () => {
    const response = await apiClient.getStockStrategies();
    return response.data as TradingStrategy[];
  },

  // Trigger manual scan
  triggerScan: async () => {
    const response = await apiClient.triggerStockScan();
    return response.data;
  },

  // ========== TRADES ==========
  
  // Record trade
  recordTrade: async (data: {
    signal_id: string;
    entry_price: number;
    shares: number;
    notes?: string;
  }) => {
    const response = await apiClient.recordStockTrade(data);
    return response.data as Trade;
  },

  // Close trade
  closeTrade: async (tradeId: string, data: { exit_price: number; notes?: string }) => {
    const response = await apiClient.closeStockTrade(tradeId, data);
    return response.data as Trade;
  },

  // Get user trades
  getUserTrades: async (filters?: { status?: string; page?: number; limit?: number }) => {
    const response = await apiClient.getStockTrades(filters);
    return response.data as { data: Trade[]; pagination: { page: number; limit: number; total: number } };
  },

  // ========== PORTFOLIO ==========
  
  // Get performance stats
  getPerformanceStats: async () => {
    const response = await apiClient.getStockPerformanceStats();
    return response.data as PerformanceStats;
  },

  // Get portfolio correlation
  getPortfolioCorrelation: async () => {
    const response = await apiClient.getPortfolioCorrelation();
    return response.data as CorrelationMatrix;
  },

  // Calculate position size
  calculatePosition: async (data: {
    account_size: number;
    risk_percent?: number;
    entry_price: number;
    stop_loss: number;
  }) => {
    const response = await apiClient.calculatePositionSize(data);
    return response.data;
  },

  // ========== MARKET ==========
  
  // Get market regime
  getMarketRegime: async () => {
    const response = await apiClient.getMarketRegime();
    return response.data as { regime: MarketRegime; recommendedStrategies: string[]; marketContext: any };
  },

  // Get upcoming events
  getUpcomingEvents: async (filters?: { days?: number; type?: string }) => {
    const response = await apiClient.getUpcomingEvents(filters);
    return response.data;
  },

  // Get drawdown status
  getDrawdownStatus: async () => {
    const response = await apiClient.getDrawdownStatus();
    return response.data as DrawdownStatus;
  },

  // ========== BUDGET PORTFOLIO ==========
  
  // Generate budget portfolio
  generateBudgetPortfolio: async (data: {
    budget: number;
    risk_profile: 'conservative' | 'moderate' | 'aggressive';
    timeframe: 'day' | 'week' | 'month' | 'year';
  }) => {
    const response = await apiClient.generateBudgetPortfolio(data);
    return response.data as BudgetPortfolio;
  },

  // ========== VALIDATION ==========
  
  // Validate signal with Claude
  validateSignalWithClaude: async (signalId: string) => {
    const response = await apiClient.validateSignalWithClaude(signalId);
    return response.data;
  },

  // ========== CONFIG ==========
  
  // Get LLM configuration
  getLLMConfig: async () => {
    const response = await apiClient.getStockLLMConfig();
    return response.data;
  },
};
