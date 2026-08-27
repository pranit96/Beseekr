// src/hooks/use-orchestration.ts
import { useCallback } from "react";
import socketService from "@/services/socketService";
import { createLogger } from "@/services/logging";

const logger = createLogger("useOrchestration");

interface OrchestrationPayload {
  agent_ids: string[];
  message: string;
  mode?: "sequential" | "parallel";
  conversation_id?: string | null;
  save_to_conversation?: boolean;
  [key: string]: any;
}

interface OrchestrationCallbacks {
  onAck?: (data: any) => void;
  onToken?: (agentId: string, token: string) => void;
  onAgentStart?: (agentId: string, agentName: string) => void;
  onAgentToken?: (agentId: string, token: string) => void;
  onAgentDone?: (agentId: string, usage: any) => void;
  onAgentError?: (agentId: string, error: any) => void;
  onDone?: (data: any) => void;
  onError?: (error: any) => void;
  onWarning?: (data: any) => void;
  onRateLimit?: (data: any) => void;
  onCancelReady?: (cancelFn: () => void) => void;
  onProgress?: (data: {
    step: number;
    total: number;
    agent_id?: string;
    agent_name?: string;
  }) => void;
  onCancelled?: (data: any) => void;
  onToolStart?: (data: {
    call_id: string;
    tool_name: string;
    agent_id: string;
  }) => void;
  onToolResult?: (data: {
    call_id: string;
    tool_name: string;
    agent_id: string;
    success: boolean;
    execution_time_ms?: number;
  }) => void;
}

const useOrchestration = () => {
  /**
   * Ensure socket is connected (Connection lifecycle is managed by AuthContext)
   */
  const ensureConnected = useCallback(() => {
    if (!socketService.isConnected()) {
      logger.warn("Socket not connected when executing orchestration");
      throw new Error(
        "Connection to server not established. Please wait a moment or log in again.",
      );
    }
  }, []);

  /**
   * Execute orchestration
   */
  const execute = useCallback(
    (
      payload: OrchestrationPayload,
      callbacks: OrchestrationCallbacks = {},
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
            onAgentStart: (agentId, agentName, raw) => {
              callbacks.onAgentStart?.(agentId, agentName);
            },
            onAgentToken: (agentId, token, raw) => {
              callbacks.onAgentToken?.(agentId, token);
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
            onProgress: (data) => {
              callbacks.onProgress?.(data);
            },
            onCancelled: (data) => {
              callbacks.onCancelled?.(data);
            },
            onToolStart: (data) => {
              callbacks.onToolStart?.(data);
            },
            onToolResult: (data) => {
              callbacks.onToolResult?.(data);
            },
          });

          // Provide cancel function to callback
          if (callbacks.onCancelReady) {
            callbacks.onCancelReady(control.cancel);
          }
        } catch (error: any) {
          logger.error("Execute error", { error: error.message });
          callbacks.onError?.(error);
          reject(error);
        }
      });
    },
    [ensureConnected],
  );

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

  /**
   * Test an agent with one-shot streaming (no conversation save)
   */
  const testAgent = useCallback(
    (
      agentId: string,
      message: string,
      callbacks: {
        onToken?: (token: string) => void;
        onDone?: (data: any) => void;
        onError?: (error: any) => void;
      } = {},
    ) => {
      ensureConnected();
      return socketService.testAgent(agentId, message, callbacks);
    },
    [ensureConnected],
  );

  return {
    execute,
    ensureConnected,
    getStatus,
    getActiveRequestCount,
    isConnected,
    testAgent,
  };
};

export default useOrchestration;
