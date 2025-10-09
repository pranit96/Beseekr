// src/hooks/use-orchestration.ts
import { useCallback } from 'react';
import SocketService from '@/services/socketService'; // NO extension

type OrchestrationPayload = {
  agent_ids: string[];
  message: string;
  mode?: 'sequential' | 'parallel';
  conversation_id?: string | null;
  save_to_conversation?: boolean;
  requestId?: string;
};

export function useOrchestration() {
  // ensure connection (no token => rely on cookies)
  const ensureConnected = useCallback((token?: string) => {
    if (!SocketService.isConnected()) {
      SocketService.connect(token ?? null);
    }
  }, []);

  /**
   * Execute orchestration.
   * callbacks: onToken(agentId, token), onAgentDone(agentId, usage), onAgentError, onAck, onRateLimit, onWarning
   */
  const execute = useCallback(async (payload: OrchestrationPayload, callbacks: any = {}) => {
    ensureConnected();

    return new Promise((resolve, reject) => {
      try {
        const { requestId, cancel } = SocketService.executeOrchestration(payload, {
          onAck: callbacks.onAck,
          onToken: (agentId: string, token: string, raw: any) => callbacks.onToken?.(agentId, token, raw),
          onAgentDone: (agentId: string, usage: any) => callbacks.onAgentDone?.(agentId, usage),
          onAgentError: (agentId: string, error: any) => callbacks.onAgentError?.(agentId, error),
          onWarning: (warn: any) => callbacks.onWarning?.(warn),
          onRateLimit: (rl: any) => callbacks.onRateLimit?.(rl),
          onDone: (data: any) => {
            // data: { requestId, success, total_usage, final_markdown, ... }
            resolve({
              ok: true,
              data
            });
          },
          onError: (err: any) => {
            resolve({ ok: false, error: err });
          }
        });

        // Return cancel handle via callbacks if caller wants
        if (callbacks.onCancelReady) callbacks.onCancelReady(() => cancel());
      } catch (err) {
        reject(err);
      }
    });
  }, [ensureConnected]);

  return {
    execute,
    ensureConnected
  };
}

export default useOrchestration;
