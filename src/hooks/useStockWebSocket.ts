// React Hook for Stock Market WebSocket
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import { createLogger } from "@/services/logging";

const logger = createLogger("StockWebSocket");

interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

interface SignalUpdate {
  signals: any[];
  count: number;
  timestamp: number;
}

interface TradeExit {
  tradeId: string;
  symbol: string;
  exitType: string;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  timestamp: number;
}

interface MarketRegime {
  regime: string;
  description: string;
  strategies: string[];
  timestamp: number;
}

export function useStockWebSocket() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [prices, setPrices] = useState<Map<string, PriceUpdate>>(new Map());
  const [latestSignals, setLatestSignals] = useState<any[]>([]);
  const [marketRegime, setMarketRegime] = useState<MarketRegime | null>(null);
  const [realtimePnL, setRealtimePnL] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Callbacks
  const onPriceUpdate = useCallback(
    (callback: (prices: PriceUpdate[]) => void) => {
      if (!socketRef.current) return;
      socketRef.current.on("prices:update", callback);
      return () => socketRef.current?.off("prices:update", callback);
    },
    [],
  );

  const onSignalUpdate = useCallback(
    (callback: (data: SignalUpdate) => void) => {
      if (!socketRef.current) return;
      socketRef.current.on("signals:new", callback);
      return () => socketRef.current?.off("signals:new", callback);
    },
    [],
  );

  const onTradeExit = useCallback((callback: (data: TradeExit) => void) => {
    if (!socketRef.current) return;
    socketRef.current.on("trade:exit", callback);
    return () => socketRef.current?.off("trade:exit", callback);
  }, []);

  const onMarketRegime = useCallback(
    (callback: (data: MarketRegime) => void) => {
      if (!socketRef.current) return;
      socketRef.current.on("market:regime", callback);
      return () => socketRef.current?.off("market:regime", callback);
    },
    [],
  );

  // Subscribe to price updates
  const subscribeToPrices = useCallback(
    (symbols: string[]) => {
      if (!socketRef.current || !user) return;
      socketRef.current.emit("subscribe:prices", { symbols, userId: user.id });
      logger.info(`Subscribed to prices for ${symbols.length} symbols`);
    },
    [user],
  );

  // Unsubscribe from prices
  const unsubscribeFromPrices = useCallback(
    (symbols: string[]) => {
      if (!socketRef.current || !user) return;
      socketRef.current.emit("unsubscribe:prices", {
        symbols,
        userId: user.id,
      });
    },
    [user],
  );

  // Subscribe to signals
  const subscribeToSignals = useCallback(() => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit("subscribe:signals", { userId: user.id });
    logger.info("Subscribed to signals");
  }, [user]);

  // Subscribe to trades
  const subscribeToTrades = useCallback(() => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit("subscribe:trades", { userId: user.id });
    logger.info("Subscribed to trade updates");
  }, [user]);

  // Subscribe to P&L updates (USER-SPECIFIC)
  const subscribeToPnL = useCallback(() => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit("subscribe:pnl", { userId: user.id });
    logger.info("Subscribed to P&L updates");
  }, [user]);

  // Subscribe to analytics (USER-SPECIFIC)
  const subscribeToAnalytics = useCallback(() => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit("subscribe:analytics", { userId: user.id });
    logger.info("Subscribed to analytics");
  }, [user]);

  // Subscribe to system health
  const subscribeToHealth = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit("subscribe:health");
    logger.info("Subscribed to system health");
  }, []);

  // Request analytics (USER-SPECIFIC)
  const requestAnalytics = useCallback(
    (
      type:
        | "strategy_performance"
        | "correlation"
        | "risk_attribution"
        | "portfolio_metrics",
    ) => {
      if (!socketRef.current || !user) return;
      socketRef.current.emit("request:analytics", { userId: user.id, type });
    },
    [user],
  );

  // Request signal scan
  const requestScan = useCallback(() => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit("request:scan", { userId: user.id });
  }, [user]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

    socketRef.current = io(`${API_BASE_URL}/stock-market`, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on("connect", () => {
      logger.info("Stock WebSocket connected");
      setConnected(true);
    });

    socketRef.current.on("disconnect", () => {
      logger.info("Stock WebSocket disconnected");
      setConnected(false);
    });

    socketRef.current.on("error", (error) => {
      logger.error("Stock WebSocket error:", error);
    });

    // Handle price updates
    socketRef.current.on("prices:update", (data: PriceUpdate[]) => {
      setPrices((prev) => {
        const newPrices = new Map(prev);
        data.forEach((update) => newPrices.set(update.symbol, update));
        return newPrices;
      });
    });

    // Handle new signals
    socketRef.current.on("signals:new", (data: SignalUpdate) => {
      setLatestSignals(data.signals);
    });

    // Handle market regime updates
    socketRef.current.on("market:regime", (data: MarketRegime) => {
      setMarketRegime(data);
    });

    // Handle P&L updates (USER-SPECIFIC)
    socketRef.current.on("pnl:update", (data: any) => {
      setRealtimePnL(data);
    });

    // Handle system health updates
    socketRef.current.on("health:update", (data: any) => {
      setSystemHealth(data);
    });

    // Handle analytics data (USER-SPECIFIC)
    socketRef.current.on("analytics:data", (data: any) => {
      setAnalyticsData(data);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  return {
    connected,
    prices,
    latestSignals,
    marketRegime,
    realtimePnL,
    systemHealth,
    analyticsData,
    subscribeToPrices,
    unsubscribeFromPrices,
    subscribeToSignals,
    subscribeToTrades,
    subscribeToPnL,
    subscribeToAnalytics,
    subscribeToHealth,
    requestScan,
    requestAnalytics,
    onPriceUpdate,
    onSignalUpdate,
    onTradeExit,
    onMarketRegime,
  };
}
