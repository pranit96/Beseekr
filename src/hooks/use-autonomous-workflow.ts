// src/hooks/use-autonomous-workflow.ts
import { useCallback } from 'react';
import socketService from '@/services/socketService';
import { createLogger } from '@/services/logging';

const logger = createLogger('useAutonomousWorkflow');

interface WorkflowCallbacks {
  onAck?: (data: any) => void;
  onStatus?: (data: any) => void;
  onPlan?: (data: any) => void;
  onAgentCreated?: (data: any) => void;
  onAgentStart?: (data: any) => void;
  onAgentToken?: (data: any) => void;
  onAgentDone?: (data: any) => void;
  onToolStart?: (data: any) => void;
  onToolResult?: (data: any) => void;
  onSynthesisToken?: (data: any) => void;
  onDone?: (data: any) => void;
  onError?: (data: any) => void;
  onCancelReady?: (fn: () => void) => void;
  onCancelled?: () => void;
}

interface WorkflowPayload {
  prompt: string;
  requestId: string;
  save_to_history?: boolean;
  attached_files?: Array<{ name: string; type: string; size: number; storage_path: string; url: string | null }>;
}

const useAutonomousWorkflow = () => {
  /**
   * Execute autonomous workflow
   */
  const execute = useCallback((
    payload: WorkflowPayload,
    callbacks: WorkflowCallbacks = {}
  ) => {
    if (!socketService.isConnected()) {
      throw new Error('Socket not connected');
    }

    const { requestId } = payload;

    const cancel = () => {
      socketService.emit('autonomous_workflow:cancel', { requestId });
    };
    // Setup listeners
    const onAck = (data: any) => {
      if (data.requestId === requestId) {
        callbacks.onAck?.(data);
      }
    };

    const onStatus = (data: any) => {
      if (data.requestId === requestId) {
        callbacks.onStatus?.(data);
      }
    };

    const onPlan = (data: any) => {
      if (data.requestId === requestId) {
        callbacks.onPlan?.(data);
      }
    };

    const onAgentCreated = (data: any) => {
      if (data.requestId === requestId) {
        callbacks.onAgentCreated?.(data);
      }
    };

    const onAgentStart = (data: any) => {
      if (data.requestId === requestId) {
        callbacks.onAgentStart?.(data);
      }
    };

    const onAgentToken = (data: any) => {
      if (data.requestId === requestId) {
        callbacks.onAgentToken?.(data);
      }
    };

    const onAgentDone = (data: any) => {
      if (data.requestId === requestId) {
        callbacks.onAgentDone?.(data);
      }
    };

    const onToolStart = (data: any) => {
      if (data.requestId === requestId) {
        callbacks.onToolStart?.(data);
      }
    };

    const onToolResult = (data: any) => {
      if (data.requestId === requestId) {
        callbacks.onToolResult?.(data);
      }
    };

    const onSynthesisToken = (data: any) => {
      if (data.requestId === requestId) {
        callbacks.onSynthesisToken?.(data);
      }
    };

    const onDone = (data: any) => {
      if (data.requestId === requestId) {
        callbacks.onDone?.(data);
        cleanup();
      }
    };

    const onError = (data: any) => {
      if (data.requestId === requestId) {
        callbacks.onError?.(data);
        cleanup();
      }
    };

    const cleanup = () => {
      socketService.off('autonomous_workflow:ack', onAck);
      socketService.off('autonomous_workflow:status', onStatus);
      socketService.off('autonomous_workflow:plan', onPlan);
      socketService.off('autonomous_workflow:agent_created', onAgentCreated);
      socketService.off('autonomous_workflow:agent_start', onAgentStart);
      socketService.off('autonomous_workflow:agent_token', onAgentToken);
      socketService.off('autonomous_workflow:agent_done', onAgentDone);
      socketService.off('autonomous_workflow:tool_start', onToolStart);
      socketService.off('autonomous_workflow:tool_result', onToolResult);
      socketService.off('autonomous_workflow:synthesis_token', onSynthesisToken);
      socketService.off('autonomous_workflow:done', onDone);
      socketService.off('autonomous_workflow:error', onError);
    };

    // Register listeners
    socketService.on('autonomous_workflow:ack', onAck);
    socketService.on('autonomous_workflow:status', onStatus);
    socketService.on('autonomous_workflow:plan', onPlan);
    socketService.on('autonomous_workflow:agent_created', onAgentCreated);
    socketService.on('autonomous_workflow:agent_start', onAgentStart);
    socketService.on('autonomous_workflow:agent_token', onAgentToken);
    socketService.on('autonomous_workflow:agent_done', onAgentDone);
    socketService.on('autonomous_workflow:tool_start', onToolStart);
    socketService.on('autonomous_workflow:tool_result', onToolResult);
    socketService.on('autonomous_workflow:synthesis_token', onSynthesisToken);
    socketService.on('autonomous_workflow:done', onDone);
    socketService.on('autonomous_workflow:error', onError);

    // Emit execution request using the internal socket
    // @ts-ignore - accessing private socket property
    socketService.socket?.emit('autonomous_workflow:execute', payload);

    return { cleanup };
  }, []);

  return { execute };
};

export default useAutonomousWorkflow;
