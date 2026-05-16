// src/hooks/use-autonomous-workflow.ts
import { useCallback } from "react";
import socketService from "@/services/socketService";
import { createLogger } from "@/services/logging";

const logger = createLogger("useAutonomousWorkflow");

interface WorkflowEvent {
  requestId: string;
  [key: string]: any;
}

interface WorkflowCallbacks {
  onAck?: (data: WorkflowEvent) => void;
  onPhase?: (data: WorkflowEvent & { phase: string }) => void;
  onStatus?: (data: WorkflowEvent & { status: string }) => void;
  onPlan?: (data: WorkflowEvent & { plan: any }) => void;
  onAgentCreated?: (data: WorkflowEvent & { agent_id: string; agent_name: string }) => void;
  onAgentStart?: (data: WorkflowEvent & { agent_id: string; agent_name: string }) => void;
  onAgentToken?: (data: WorkflowEvent & { agent_id: string; token: string }) => void;
  onAgentProgress?: (data: WorkflowEvent & { progress: number }) => void;
  onAgentDone?: (data: WorkflowEvent & { agent_id: string; usage: any }) => void;
  onToolStart?: (data: WorkflowEvent & { tool_name: string }) => void;
  onToolResult?: (data: WorkflowEvent & { tool_name: string; success: boolean }) => void;
  onAdversarialStart?: (data: WorkflowEvent) => void;
  onAdversarialToken?: (data: WorkflowEvent & { token: string }) => void;
  onAdversarialDone?: (data: WorkflowEvent) => void;
  onSynthesisToken?: (data: WorkflowEvent & { token: string }) => void;
  onDone?: (data: WorkflowEvent & { output: string }) => void;
  onError?: (data: WorkflowEvent & { error: string }) => void;
  onCancelReady?: (fn: () => void) => void;
  onCancelled?: () => void;
}

interface WorkflowPayload {
  prompt: string;
  requestId: string;
  save_to_history?: boolean;
  attached_files?: Array<{
    name: string;
    type: string;
    size: number;
    storage_path: string;
    url: string | null;
  }>;
  continue_from?: string;
}

const useAutonomousWorkflow = () => {
  const execute = useCallback(
    (payload: WorkflowPayload, callbacks: WorkflowCallbacks = {}) => {
      if (!socketService.isConnected()) {
        throw new Error("Socket not connected");
      }

      const { requestId } = payload;

      // Build cancel fn up front so it can be exposed immediately
      let cleanupCalled = false;
      const cleanup = () => {
        if (cleanupCalled) return;
        cleanupCalled = true;
        socketService.off("autonomous_workflow:ack", onAck);
        socketService.off("autonomous_workflow:phase", onPhase);
        socketService.off("autonomous_workflow:status", onStatus);
        socketService.off("autonomous_workflow:plan", onPlan);
        socketService.off("autonomous_workflow:agent_created", onAgentCreated);
        socketService.off("autonomous_workflow:agent_start", onAgentStart);
        socketService.off("autonomous_workflow:agent_token", onAgentToken);
        socketService.off(
          "autonomous_workflow:agent_progress",
          onAgentProgress,
        );
        socketService.off("autonomous_workflow:agent_done", onAgentDone);
        socketService.off("autonomous_workflow:tool_start", onToolStart);
        socketService.off("autonomous_workflow:tool_result", onToolResult);
        socketService.off(
          "autonomous_workflow:adversarial_start",
          onAdversarialStart,
        );
        socketService.off(
          "autonomous_workflow:adversarial_token",
          onAdversarialToken,
        );
        socketService.off(
          "autonomous_workflow:adversarial_done",
          onAdversarialDone,
        );
        socketService.off(
          "autonomous_workflow:synthesis_token",
          onSynthesisToken,
        );
        socketService.off("autonomous_workflow:done", onDone);
        socketService.off("autonomous_workflow:error", onError);
        socketService.off("autonomous_workflow:cancelled", onCancelled);
      };

      const cancel = () => {
        try {
          // @ts-expect-error - accessing private socket property
          socketService.socket?.emit("autonomous_workflow:cancel", {
            requestId,
          });
        } catch (e) {
          logger.error("Cancel emit failed", { error: e });
        }
        cleanup();
      };

      const onAck = (data: WorkflowEvent) => {
        if (data.requestId === requestId) callbacks.onAck?.(data);
      };
      const onPhase = (data: WorkflowEvent & { phase: string }) => {
        if (data.requestId === requestId) callbacks.onPhase?.(data);
      };
      const onStatus = (data: WorkflowEvent & { status: string }) => {
        if (data.requestId === requestId) callbacks.onStatus?.(data);
      };
      const onPlan = (data: WorkflowEvent & { plan: any }) => {
        if (data.requestId === requestId) callbacks.onPlan?.(data);
      };
      const onAgentCreated = (data: WorkflowEvent & { agent_id: string; agent_name: string }) => {
        if (data.requestId === requestId) callbacks.onAgentCreated?.(data);
      };
      const onAgentStart = (data: WorkflowEvent & { agent_id: string; agent_name: string }) => {
        if (data.requestId === requestId) callbacks.onAgentStart?.(data);
      };
      const onAgentToken = (data: WorkflowEvent & { agent_id: string; token: string }) => {
        if (data.requestId === requestId) callbacks.onAgentToken?.(data);
      };
      const onAgentProgress = (data: WorkflowEvent & { progress: number }) => {
        if (data.requestId === requestId) callbacks.onAgentProgress?.(data);
      };
      const onAgentDone = (data: WorkflowEvent & { agent_id: string; usage: any }) => {
        if (data.requestId === requestId) callbacks.onAgentDone?.(data);
      };
      const onToolStart = (data: WorkflowEvent & { tool_name: string }) => {
        if (data.requestId === requestId) callbacks.onToolStart?.(data);
      };
      const onToolResult = (data: WorkflowEvent & { tool_name: string; success: boolean }) => {
        if (data.requestId === requestId) callbacks.onToolResult?.(data);
      };
      const onAdversarialStart = (data: WorkflowEvent) => {
        if (data.requestId === requestId) callbacks.onAdversarialStart?.(data);
      };
      const onAdversarialToken = (data: WorkflowEvent & { token: string }) => {
        if (data.requestId === requestId) callbacks.onAdversarialToken?.(data);
      };
      const onAdversarialDone = (data: WorkflowEvent) => {
        if (data.requestId === requestId) callbacks.onAdversarialDone?.(data);
      };
      const onSynthesisToken = (data: WorkflowEvent & { token: string }) => {
        if (data.requestId === requestId) callbacks.onSynthesisToken?.(data);
      };
      const onDone = (data: WorkflowEvent & { output: string }) => {
        if (data.requestId === requestId) {
          callbacks.onDone?.(data);
          cleanup();
        }
      };
      const onError = (data: WorkflowEvent & { error: string }) => {
        if (data.requestId === requestId) {
          callbacks.onError?.(data);
          cleanup();
        }
      };
      const onCancelled = (data: WorkflowEvent) => {
        // Some backends don't send requestId on cancel ACK — accept both
        if (!data?.requestId || data.requestId === requestId) {
          callbacks.onCancelled?.();
          cleanup();
        }
      };

      // Register all listeners first
      socketService.on("autonomous_workflow:ack", onAck);
      socketService.on("autonomous_workflow:phase", onPhase);
      socketService.on("autonomous_workflow:status", onStatus);
      socketService.on("autonomous_workflow:plan", onPlan);
      socketService.on("autonomous_workflow:agent_created", onAgentCreated);
      socketService.on("autonomous_workflow:agent_start", onAgentStart);
      socketService.on("autonomous_workflow:agent_token", onAgentToken);
      socketService.on("autonomous_workflow:agent_progress", onAgentProgress);
      socketService.on("autonomous_workflow:agent_done", onAgentDone);
      socketService.on("autonomous_workflow:tool_start", onToolStart);
      socketService.on("autonomous_workflow:tool_result", onToolResult);
      socketService.on(
        "autonomous_workflow:adversarial_start",
        onAdversarialStart,
      );
      socketService.on(
        "autonomous_workflow:adversarial_token",
        onAdversarialToken,
      );
      socketService.on(
        "autonomous_workflow:adversarial_done",
        onAdversarialDone,
      );
      socketService.on("autonomous_workflow:synthesis_token", onSynthesisToken);
      socketService.on("autonomous_workflow:done", onDone);
      socketService.on("autonomous_workflow:error", onError);
      socketService.on("autonomous_workflow:cancelled", onCancelled);

      // Immediately expose the cancel function to the UI — no waiting for server ACK
      callbacks.onCancelReady?.(cancel);

      // Emit execute request
      // @ts-expect-error - accessing private socket property
      socketService.socket?.emit("autonomous_workflow:execute", payload);

      return { cleanup, cancel };
    },
    [],
  );

  return { execute };
};

export default useAutonomousWorkflow;
