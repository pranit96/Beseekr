// src/hooks/useOrchestration.ts
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { AgentResponse } from '@/types/agent';

type ExecutePayload = {
  agent_ids: string[];
  message: string;
  mode: 'sequential' | 'parallel';
  conversation_id?: string | null;
  save_to_conversation?: boolean;
};

export function useOrchestration() {
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  const execute = async (payload: ExecutePayload) => {
    setIsExecuting(true);
    try {
      // apiClient.executeOrchestration currently expects conversation_id: string (required).
      // To avoid TypeScript mismatch (and keep the hook flexible), create an explicit payload
      // for the API call that sets conversation_id to a safe default when not provided.
      const apiPayload: any = {
        agent_ids: payload.agent_ids,
        message: payload.message,
        mode: payload.mode,
        // ensure property exists (API client expects a string). Use empty string if not provided.
        conversation_id: payload.conversation_id ?? '',
        save_to_conversation: payload.save_to_conversation,
      };

      const res = await apiClient.executeOrchestration(apiPayload);

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Orchestration failed');
      }

      const mapped: AgentResponse[] = (res.data.results || []).map((r: any) => ({
        agentId: r.agent_id,
        agentName: r.agent_name,
        content: r.response,
        timestamp: new Date(),
        status: r.error ? 'error' : 'success',
        metadata: r,
      }));

      return {
        ok: true,
        data: res.data,
        agentResponses: mapped,
        markdown: res.data.markdown_output,
        final: res.data.final_output,
        aggregated: res.data.aggregated_output,
      };
    } catch (err: any) {
      toast({
        title: 'Execution error',
        description: err?.message || String(err),
        variant: 'destructive',
      });
      return { ok: false, error: err };
    } finally {
      setIsExecuting(false);
    }
  };

  return { execute, isExecuting };
}
