// src/hooks/use-orchestration.ts
import { useEffect, useRef, useCallback } from 'react';
import socketService from '@/services/socketService';
import { useToast } from '@/hooks/use-toast';

interface OrchestrationCallbacks {
  onAck?: (data: any) => void;
  onToken?: (agentId: string, token: string, raw?: any) => void;
  onAgentDone?: (agentId: string, usage: any, raw?: any) => void;
  onAgentError?: (agentId: string, error: any, raw?: any) => void;
  onDone?: (data: any) => void;
  onError?: (data: any) => void;
  onWarning?: (data: any) => void;
  onRateLimit?: (data: any) => void;
  onCancelReady?: (cancelFn: () => void) => void;
}

interface OrchestrationPayload {
  agent_ids: string[];
  message: string;
  mode?: 'sequential' | 'parallel';
  conversation_id?: string | null;
  save_to_conversation?: boolean;
  [key: string]: any;
}

const useOrchestration = () => {
  const { toast } = useToast();
  const isConnectedRef = useRef(false);
  const reconnectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Setup connection status listeners
    const handleConnectionStatus = (status: any) => {
      isConnectedRef.current = status.connected;
      
      if (status.connected) {
        console.log('[useOrchestration] Socket connected:', status.socketId);
      } else {
        console.warn('[useOrchestration] Socket disconnected:', status.reason);
      }
    };

    const handleConnectionError = (error: any) => {
      console.error('[useOrchestration] Connection error:', error);
      toast({
        title: 'Connection issue',
        description: 'Having trouble connecting to the server. Retrying...',
        variant: 'default',
      });
    };

    const handleForcedDisconnect = (data: any) => {
      toast({
        title: 'Disconnected',
        description: data.message || 'You have been disconnected from the server.',
        variant: 'destructive',
      });
    };

    const handleMaxReconnectAttempts = (data: any) => {
      toast({
        title: 'Connection failed',
        description: data.message || 'Could not establish connection after multiple attempts.',
        variant: 'destructive',
      });
    };

    socketService.on('connection_status', handleConnectionStatus);
    socketService.on('connection_error', handleConnectionError);
    socketService.on('forced_disconnect', handleForcedDisconnect);
    socketService.on('max_reconnect_attempts', handleMaxReconnectAttempts);

    return () => {
      socketService.off('connection_status', handleConnectionStatus);
      socketService.off('connection_error', handleConnectionError);
      socketService.off('forced_disconnect', handleForcedDisconnect);
      socketService.off('max_reconnect_attempts', handleMaxReconnectAttempts);
      
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [toast]);

  /**
   * Ensure socket is connected before executing
   */
  const ensureConnected = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (socketService.isConnected()) {
        resolve(true);
        return;
      }

      try {
        // Try to get token from storage for authentication
        const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
        socketService.connect(token);

        // Wait for connection with timeout
        const timeout = setTimeout(() => {
          resolve(false);
        }, 5000);

        const checkConnection = setInterval(() => {
          if (socketService.isConnected()) {
            clearInterval(checkConnection);
            clearTimeout(timeout);
            resolve(true);
          }
        }, 100);
      } catch (error) {
        console.error('[useOrchestration] Failed to connect:', error);
        resolve(false);
      }
    });
  }, []);

  /**
   * Execute orchestration with promise-based API
   */
  const execute = useCallback(
    (
      payload: OrchestrationPayload,
      callbacks: OrchestrationCallbacks = {}
    ): Promise<{ ok: boolean; data?: any; error?: string }> => {
      return new Promise((resolve, reject) => {
        if (!socketService.isConnected()) {
          const error = 'Socket not connected';
          reject(new Error(error));
          return;
        }

        try {
          const control = socketService.executeOrchestration(payload, {
            onAck: (data) => {
              callbacks.onAck?.(data);
            },
            onToken: (agentId, token, raw) => {
              callbacks.onToken?.(agentId, token, raw);
            },
            onAgentDone: (agentId, usage, raw) => {
              callbacks.onAgentDone?.(agentId, usage, raw);
            },
            onAgentError: (agentId, error, raw) => {
              callbacks.onAgentError?.(agentId, error, raw);
            },
            onWarning: (data) => {
              callbacks.onWarning?.(data);
            },
            onRateLimit: (data) => {
              callbacks.onRateLimit?.(data);
            },
            onDone: (data) => {
              callbacks.onDone?.(data);
              resolve({ ok: true, data });
            },
            onError: (data) => {
              callbacks.onError?.(data);
              resolve({ ok: false, error: data?.error || 'Orchestration failed' });
            },
          });

          // Provide cancel function to caller
          if (callbacks.onCancelReady) {
            callbacks.onCancelReady(control.cancel);
          }
        } catch (error: any) {
          console.error('[useOrchestration] Execute error:', error);
          reject(error);
        }
      });
    },
    []
  );

  /**
   * Cancel all active orchestrations
   */
  const cancelAll = useCallback(() => {
    // The socket service will handle cancellation of all active requests
    socketService.disconnect();
    socketService.connect();
  }, []);

  /**
   * Get connection status
   */
  const getStatus = useCallback(() => {
    return socketService.getStatus();
  }, []);

  /**
   * Get active request count
   */
  const getActiveCount = useCallback(() => {
    return socketService.getActiveRequestCount();
  }, []);

  return {
    execute,
    ensureConnected,
    cancelAll,
    getStatus,
    getActiveCount,
    isConnected: isConnectedRef.current,
  };
};

export default useOrchestration;