// hooks/use-deep-analytics-socket.ts - React Hook for Deep Analytics Socket
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  deepAnalyticsSocket,
  DeepAnalyticsCallbacks,
  ConnectionStats,
  ProgressUpdate,
  SessionResult,
  SessionError,
  ProgressStage,
  SessionStatus
} from '@/services/deepAnalyticsSocket';
import { createLogger } from '@/services/logging';

// Re-export types for convenience
export type {
  ProgressUpdate,
  SessionResult,
  SessionError,
  ProgressStage,
  SessionStatus
} from '@/services/deepAnalyticsSocket';

const logger = createLogger('useDeepAnalyticsSocket');

// Stage labels for UI display
const STAGE_LABELS: Record<ProgressStage, string> = {
  initializing: 'Initializing analysis...',
  file_processing: 'Processing uploaded files...',
  rag_indexing: 'Building knowledge index...',
  context_building: 'Analyzing context...',
  analysis: 'Performing deep analysis...',
  agent_selection: 'Selecting specialist agents...',
  ideation: 'Generating strategic insights...',
  synthesis: 'Synthesizing final report...',
  complete: 'Analysis complete'
};

// ============================================================================
// HOOK OPTIONS
// ============================================================================
export interface UseDeepAnalyticsSocketOptions {
  sessionId?: string;
  autoConnect?: boolean;
  autoSubscribe?: boolean;
  callbacks?: DeepAnalyticsCallbacks;
}

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================
export interface UseDeepAnalyticsSocketReturn {
  // Connection state
  socketState: 'disconnected' | 'connecting' | 'connected' | 'error';
  isConnected: boolean;

  // Session state
  sessionState: SessionStatus | null;
  isProcessing: boolean;
  isCompleted: boolean;

  // Progress tracking
  progress: number;
  stage: ProgressStage | null;
  stageLabel: string;

  // Results and errors
  result: SessionResult | null;
  error: SessionError | null;

  // Actions
  subscribeToSession: (sessionId: string, jobId?: string) => void;
  unsubscribeFromSession: () => void;
  cancelSession: () => void;

  // Connection management
  subscribe: (sessionId: string, callbacks?: DeepAnalyticsCallbacks) => void;
  unsubscribe: (sessionId: string) => void;
  cancel: (sessionId: string) => void;
  connect: () => void;
  disconnect: () => void;
  getStats: () => ConnectionStats;
  requestStats: () => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================
export function useDeepAnalyticsSocket(
  options: UseDeepAnalyticsSocketOptions = {}
): UseDeepAnalyticsSocketReturn {
  const {
    sessionId,
    autoConnect = true,
    autoSubscribe = true,
    callbacks
  } = options;

  const isConnectedRef = useRef(false);
  const hasSubscribedRef = useRef(false);
  const currentSessionIdRef = useRef<string | null>(null);

  // State management
  const [socketState, setSocketState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [sessionState, setSessionState] = useState<SessionStatus | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<ProgressStage | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [error, setError] = useState<SessionError | null>(null);

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================
  const connect = useCallback(() => {
    if (!isConnectedRef.current) {
      logger.debug('Connecting socket from hook');
      deepAnalyticsSocket.connect();
      isConnectedRef.current = true;
    }
  }, []);

  const disconnect = useCallback(() => {
    logger.debug('Disconnecting socket from hook');
    deepAnalyticsSocket.disconnect();
    isConnectedRef.current = false;
    hasSubscribedRef.current = false;
  }, []);

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================
  const subscribe = useCallback((sid: string, cbs?: DeepAnalyticsCallbacks) => {
    logger.debug('Subscribing to session from hook', { sessionId: sid });
    deepAnalyticsSocket.subscribeToSession(sid, cbs || callbacks || {});
  }, [callbacks]);

  const unsubscribe = useCallback((sid: string) => {
    logger.debug('Unsubscribing from session', { sessionId: sid });
    deepAnalyticsSocket.unsubscribeFromSession(sid);
  }, []);

  const cancel = useCallback((sid: string) => {
    logger.debug('Cancelling session', { sessionId: sid });
    deepAnalyticsSocket.cancelSession(sid);
  }, []);

  const getStats = useCallback(() => {
    return deepAnalyticsSocket.getStats();
  }, []);

  const requestStats = useCallback(() => {
    deepAnalyticsSocket.requestStats();
  }, []);

  // Session-specific actions
  const subscribeToSession = useCallback((sid: string, jobId?: string) => {
    logger.info('Subscribing to session', { sessionId: sid, jobId });

    // Ensure we're connected before subscribing
    if (!deepAnalyticsSocket.isConnected()) {
      logger.info('Not connected, connecting now...');
      deepAnalyticsSocket.connect();
    }

    currentSessionIdRef.current = sid;
    setSessionState('queued');
    setProgress(0);
    setStage('initializing');
    setResult(null);
    setError(null);

    const sessionCallbacks: DeepAnalyticsCallbacks = {
      onConnected: (data) => {
        logger.debug('Connected to socket', data);
        setSocketState('connected');
      },
      onSubscribed: (data) => {
        logger.debug('Subscribed to session', data);
        setSessionState('processing');
      },
      onProgress: (data: ProgressUpdate) => {
        logger.debug('Progress update', data);
        setStage(data.stage);
        setProgress(data.progress || 0);
        setSessionState('processing');
      },
      onComplete: (data: SessionResult) => {
        logger.info('Session completed', data);
        setSessionState('completed');
        setProgress(100);
        setStage('complete');
        setResult(data);
        currentSessionIdRef.current = null;
      },
      onError: (err: SessionError) => {
        logger.error('Session error', err);
        setSessionState('failed');
        setError(err);
        currentSessionIdRef.current = null;
      },
      onCancelled: (data) => {
        logger.info('Session cancelled', data);
        setSessionState('cancelled');
        setProgress(0);
        setStage(null);
        currentSessionIdRef.current = null;
      },
      onDisconnected: (reason) => {
        logger.warn('Socket disconnected', { reason });
        setSocketState('disconnected');
      },
      onReconnecting: (attempt) => {
        logger.debug('Reconnecting', { attempt });
        setSocketState('connecting');
      },
      onReconnected: () => {
        logger.info('Reconnected');
        setSocketState('connected');
      }
    };

    deepAnalyticsSocket.subscribeToSession(sid, sessionCallbacks);
  }, []);

  const unsubscribeFromSession = useCallback(() => {
    if (currentSessionIdRef.current) {
      logger.info('Unsubscribing from session', { sessionId: currentSessionIdRef.current });
      deepAnalyticsSocket.unsubscribeFromSession(currentSessionIdRef.current);
      currentSessionIdRef.current = null;
    }
  }, []);

  const cancelSession = useCallback(() => {
    if (currentSessionIdRef.current) {
      logger.info('Cancelling session', { sessionId: currentSessionIdRef.current });
      deepAnalyticsSocket.cancelSession(currentSessionIdRef.current);
    }
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Auto-connect on mount (but only if we have a sessionId to subscribe to)
  useEffect(() => {
    if (autoConnect && sessionId) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (sessionId && hasSubscribedRef.current) {
        unsubscribe(sessionId);
      }
    };
  }, [autoConnect, connect, sessionId, unsubscribe]);

  // Auto-subscribe when sessionId is provided
  useEffect(() => {
    if (autoSubscribe && sessionId && callbacks && !hasSubscribedRef.current) {
      const isConnected = deepAnalyticsSocket.isConnected();

      if (isConnected) {
        logger.debug('Auto-subscribing to session', { sessionId });
        subscribe(sessionId, callbacks);
        hasSubscribedRef.current = true;
      } else {
        // Wait for connection before subscribing
        logger.debug('Waiting for connection before subscribing', { sessionId });
        const checkConnection = setInterval(() => {
          if (deepAnalyticsSocket.isConnected()) {
            clearInterval(checkConnection);
            subscribe(sessionId, callbacks);
            hasSubscribedRef.current = true;
          }
        }, 100);

        return () => clearInterval(checkConnection);
      }
    }
  }, [autoSubscribe, sessionId, callbacks, subscribe]);

  // Monitor connection state
  useEffect(() => {
    const checkConnection = () => {
      const connected = deepAnalyticsSocket.isConnected();
      setSocketState(connected ? 'connected' : 'disconnected');
    };

    // Check immediately
    checkConnection();

    // Check periodically
    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  // Computed values
  const isProcessing = sessionState === 'processing' || sessionState === 'queued';
  const isCompleted = sessionState === 'completed';
  const stageLabel = stage ? STAGE_LABELS[stage] : '';

  // ============================================================================
  // RETURN
  // ============================================================================
  return {
    // Connection state
    socketState,
    isConnected: deepAnalyticsSocket.isConnected(),

    // Session state
    sessionState,
    isProcessing,
    isCompleted,

    // Progress tracking
    progress,
    stage,
    stageLabel,

    // Results and errors
    result,
    error,

    // Session-specific actions
    subscribeToSession,
    unsubscribeFromSession,
    cancelSession,

    // Generic actions (for backward compatibility)
    subscribe,
    unsubscribe,
    cancel,
    connect,
    disconnect,
    getStats,
    requestStats,
  };
}
