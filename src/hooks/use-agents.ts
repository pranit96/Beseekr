import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Agent } from "@/types/agent";
import { useAuth } from "@/contexts/AuthContext";
import { createLogger } from "@/services/logging";

const logger = createLogger('useAgents');

export const useAgents = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: agents = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['agents', user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // 10 minutes cache
    retry: (failureCount, error: any) => {
      const msg = error?.message || '';
      if (msg.includes('Session expired') || msg.includes('401')) return false;
      return failureCount < 3;
    },
    queryFn: async () => {
      logger.info('Fetching agents via React Query');
      const res = await apiClient.getMyAgents();
      
      let agentList: Agent[] = [];
      if (res.success && res.data) {
        if (Array.isArray(res.data)) agentList = res.data;
        else if (Array.isArray(res.data.agents)) agentList = res.data.agents;
        else if (Array.isArray(res.data.data)) agentList = res.data.data;
      }
      
      if (agentList.length > 0 || res.success) {
        return agentList;
      } else {
        throw new Error(res.error || "Failed to fetch agents");
      }
    }
  });

  const reload = useCallback(async () => {
    logger.info('Manual reload requested');
    // Invalidate react-query cache and API client cache
    await queryClient.invalidateQueries({ queryKey: ['agents', user?.id] });
    apiClient.invalidateCache('/api/agents');
    await refetch();
  }, [refetch, queryClient, user?.id]);

  return {
    agents,
    loading,
    error: error ? error.message : null,
    reload
  };
};