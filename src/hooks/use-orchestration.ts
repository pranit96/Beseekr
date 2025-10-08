// src/hooks/use-orchestration.ts
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
      // Pass payload as-is to apiClient — conversation_id is optional and will be omitted when undefined
      const res = await apiClient.executeOrchestration(payload as any);

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
      toast({ title: 'Execution error', description: err?.message || String(err), variant: 'destructive' });
      return { ok: false, error: err };
    } finally {
      setIsExecuting(false);
    }
  };

  return { execute, isExecuting };
}
