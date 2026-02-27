// Trading WebSocket Hook - Real-time Data Streaming
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import type { PriceUpdate, RealtimePnL, SystemHealth } from '@/types/trading';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface WebSocketState {
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
}

export function useTradingWebSocket() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  
  // State
  const [wsState, setWsState] = useState<WebSocketState>({
    connected: false,
    reconnecting: false,
    error: null,
  });
  const [prices, setPrices] = useState<Map<string, PriceUpdate>>(new Map());
  const [realtimePnL, setRealtimePnL] = useState<RealtimePnL | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [latestSignals, setLatestSignals] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Subscribe to prices
  const subscribeToPrices = useCallback((symbols: string[]) => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit('subscribe:prices', { symbols, userId: user.id });
  }, [user]);

  // Unsubscribe from prices
  const unsubscribeFromPrices = useCallback((symbols: string[]) => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit('unsubscribe:prices', { symbols, userId: user.id });
  }, [user]);

  // Subscribe to signals
  const subscribeToSignals = useCallback(() => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit('subscribe:signals', { userId: user.id });
  }, [user]);

  // Subscribe to trades
  const subscribeToTrades = useCallback(() => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit('subscribe:trades', { userId: user.id });
  }, [user]);

  // Subscribe to P&L (USER-SPECIFIC)
  const subscribeToPnL = useCallback(() => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit('subscribe:pnl', { userId: user.id });
  }, [user]);

  // Subscribe to analytics (USER-SPECIFIC)
  const subscribeToAnalytics = useCallback(() => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit('subscribe:analytics', { userId: user.id });
  }, [user]);

  // Subscribe to system health
  const subscribeToHealth = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('subscribe:health');
  }, []);

  // Request signal scan
  const requestScan = useCallback(() => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit('request:scan', { userId: user.id });
  }, [user]);

  // Request analytics (USER-SPECIFIC)
  const requestAnalytics = useCallback((type: 'strategy_performance' | 'correlation' | 'risk_attribution' | 'portfolio_metrics') => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit('request:analytics', { userId: user.id, type });
  }, [user]);

  // Event listeners
  const onPriceUpdate = useCallback((callback: (prices: PriceUpdate[]) => void) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on('prices:update', callback);
    return () => socketRef.current?.off('prices:update', callback);
  }, []);

  const onSignalUpdate = useCallback((callback: (data: any) => void) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on('signals:new', callback);
    return () => socketRef.current?.off('signals:new', callback);
  }, []);

  const onTradeExit = useCallback((callback: (data: any) => void) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on('trade:exit', callback);
    return () => socketRef.current?.off('trade:exit', callback);
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    socketRef.current = io(`${API_BASE_URL}/stock-market`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 20000,
    });

    socketRef.current.on('connect', () => {
      console.log('[Trading WS] Connected');
      setWsState({ connected: true, reconnecting: false, error: null });
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('[Trading WS] Disconnected:', reason);
      setWsState(prev => ({ ...prev, connected: false }));
    });

    socketRef.current.on('reconnecting', (attemptNumber) => {
      console.log('[Trading WS] Reconnecting...', attemptNumber);
      setWsState(prev => ({ ...prev, reconnecting: true }));
    });

    socketRef.current.on('reconnect', () => {
      console.log('[Trading WS] Reconnected');
      setWsState({ connected: true, reconnecting: false, error: null });
    });

    socketRef.current.on('reconnect_failed', () => {
      console.error('[Trading WS] Reconnection failed');
      setWsState({ connected: false, reconnecting: false, error: 'Connection failed' });
    });

    socketRef.current.on('error', (error) => {
      console.error('[Trading WS] Error:', error);
      setWsState(prev => ({ ...prev, error: error.message || 'Unknown error' }));
    });

    // Handle price updates
    socketRef.current.on('prices:update', (data: PriceUpdate[]) => {
      setPrices(prev => {
        const newPrices = new Map(prev);
        data.forEach(update => newPrices.set(update.symbol, update));
        return newPrices;
      });
    });

    // Handle new signals
    socketRef.current.on('signals:new', (data: any) => {
      setLatestSignals(data.signals || []);
    });

    // Handle P&L updates (USER-SPECIFIC)
    socketRef.current.on('pnl:update', (data: RealtimePnL) => {
      setRealtimePnL(data);
    });

    // Handle system health updates
    socketRef.current.on('health:update', (data: SystemHealth) => {
      setSystemHealth(data);
    });

    // Handle analytics data (USER-SPECIFIC)
    socketRef.current.on('analytics:data', (data: any) => {
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
    // State
    wsState,
    prices,
    realtimePnL,
    systemHealth,
    latestSignals,
    analyticsData,
    
    // Subscriptions
    subscribeToPrices,
    unsubscribeFromPrices,
    subscribeToSignals,
    subscribeToTrades,
    subscribeToPnL,
    subscribeToAnalytics,
    subscribeToHealth,
    
    // Actions
    requestScan,
    requestAnalytics,
    
    // Event listeners
    onPriceUpdate,
    onSignalUpdate,
    onTradeExit,
  };
}
