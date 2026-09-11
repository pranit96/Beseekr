import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Agent } from "@/types/agent";
import { useAuth } from "@/contexts/AuthContext";
import { createLogger } from "@/services/logging";

import guestSessionService, { DEFAULT_AGENT_TEMPLATES } from "@/services/guestSessionService";

const logger = createLogger("useAgents");

export const useAgents = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: agents = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["agents", user?.id || "guest"],
    enabled: true,
    staleTime: 1000 * 60 * 10, // 10 minutes cache
    retry: (failureCount, error: any) => {
      const msg = error?.message || "";
      if (msg.includes("Session expired") || msg.includes("401")) return false;
      return failureCount < 3;
    },
    queryFn: async () => {
      if (user) {
        logger.info("Fetching user agents via React Query");
        const res = await apiClient.getMyAgents();

        let agentList: Agent[] = [];
        if (res.success && res.data) {
          const d = res.data as any;
          if (Array.isArray(d)) agentList = d;
          else if (Array.isArray(d.agents)) agentList = d.agents;
          else if (Array.isArray(d.data)) agentList = d.data;
        }

        return agentList;
      }

      // Guest flow: load templates + custom guest agents
      logger.info("Fetching guest agents (templates + local)");
      const guestAgents = guestSessionService.getGuestAgents();
      let templateAgents: Agent[] = DEFAULT_AGENT_TEMPLATES;

      try {
        const tRes = await apiClient.getAgentTemplates();
        if (tRes.success && Array.isArray(tRes.data) && tRes.data.length > 0) {
          templateAgents = tRes.data.map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            domain: t.domain,
            system_prompt: t.system_prompt,
            temperature: t.temperature ?? 0.7,
            max_tokens: t.max_tokens ?? 2000,
            is_active: true,
            is_public: true,
            is_default: true,
            is_template: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: { icon: t.icon },
          } as Agent));
        }
      } catch (tErr) {
        logger.warn("Failed to load live templates for guest, using defaults:", tErr);
      }

      return [...guestAgents, ...templateAgents];
    },
  });

  const reload = useCallback(async () => {
    logger.info("Manual reload requested");
    // Invalidate react-query cache and API client cache
    await queryClient.invalidateQueries({ queryKey: ["agents", user?.id] });
    apiClient.invalidateCache("/api/agents");
    await refetch();
  }, [refetch, queryClient, user?.id]);

  return {
    agents,
    loading,
    error: error ? error.message : null,
    reload,
  };
};
