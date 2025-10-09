// src/hooks/use-orchestration.ts
import { useCallback } from 'react';
import socketService from '@/services/socketService';

interface OrchestrationPayload {
  agent_ids: string[];
  message: string;
  mode?: 'sequential' | 'parallel';
  conversation_id?: string | null;
  save_to_conversation?: boolean;
  [key: string]: any;
}

interface OrchestrationCallbacks {
  onAck?: (data: any) => void;
  onToken?: (agentId: string, token: string) => void;
  onAgentDone?: (agentId: string, usage: any) => void;
  onAgentError?: (agentId: string, error: any) => void;
  onDone?: (data: any) => void;
  onError?: (error: any) => void;
  onWarning?: (data: any) => void;
  onRateLimit?: (data: any) => void;
  onCancelReady?: (cancelFn: () => void) => void;
}

const useOrchestration = () => {
  /**
   * Ensure socket is connected
   */
  const ensureConnected = useCallback(() => {
    if (!socketService.isConnected()) {
      console.warn('[useOrchestration] Socket not connected, attempting to reconnect...');
      
      // Try to get token from cookies
      const getAccessToken = (): string | null => {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'access_token') {
            return decodeURIComponent(value);
          }
        }
        return null;
      };

      const token = getAccessToken();
      if (token) {
        try {
          socketService.connect(token);
        } catch (error) {
          console.error('[useOrchestration] Failed to reconnect socket:', error);
          throw new Error('Failed to establish connection. Please refresh the page.');
        }
      } else {
        throw new Error('Authentication required. Please log in again.');
      }
    }
  }, []);

  /**
   * Execute orchestration
   */
  const execute = useCallback((
    payload: OrchestrationPayload,
    callbacks: OrchestrationCallbacks = {}
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      try {
        // Ensure connection before execution
        ensureConnected();

        const control = socketService.executeOrchestration(payload, {
          onAck: (data) => {
            callbacks.onAck?.(data);
          },
          onToken: (agentId, token, raw) => {
            callbacks.onToken?.(agentId, token);
          },
          onAgentDone: (agentId, usage, raw) => {
            callbacks.onAgentDone?.(agentId, usage);
          },
          onAgentError: (agentId, error, raw) => {
            callbacks.onAgentError?.(agentId, error);
          },
          onWarning: (data) => {
            callbacks.onWarning?.(data);
          },
          onRateLimit: (data) => {
            callbacks.onRateLimit?.(data);
          },
          onDone: (data) => {
            callbacks.onDone?.(data);
            resolve(data);
          },
          onError: (error) => {
            callbacks.onError?.(error);
            reject(error);
          },
        });

        // Provide cancel function to callback
        if (callbacks.onCancelReady) {
          callbacks.onCancelReady(control.cancel);
        }

      } catch (error: any) {
        console.error('[useOrchestration] Execute error:', error);
        callbacks.onError?.(error);
        reject(error);
      }
    });
  }, [ensureConnected]);

  /**
   * Get connection status
   */
  const getStatus = useCallback(() => {
    return socketService.getStatus();
  }, []);

  /**
   * Get active request count
   */
  const getActiveRequestCount = useCallback(() => {
    return socketService.getActiveRequestCount();
  }, []);

  /**
   * Check if connected
   */
  const isConnected = useCallback(() => {
    return socketService.isConnected();
  }, []);

  return {
    execute,
    ensureConnected,
    getStatus,
    getActiveRequestCount,
    isConnected,
  };
};

export default useOrchestration;