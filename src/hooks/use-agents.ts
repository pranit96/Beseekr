import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api";
import { Agent } from "@/types/agent";
import { useAuth } from "@/contexts/AuthContext";
import { createLogger } from "@/services/logging";

const logger = createLogger('useAgents');

export const useAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const fetchingRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const fetchAgents = useCallback(async (isRetry: boolean = false) => {
    // Don't fetch if already fetching
    if (fetchingRef.current) {
      logger.debug('Fetch already in progress, skipping');
      return;
    }

    // Don't fetch if no user
    if (!user) {
      logger.debug('No user, skipping fetch');
      setAgents([]);
      setLoading(false);
      return;
    }

    fetchingRef.current = true;

    if (!isRetry) {
      setLoading(true);
      retryCountRef.current = 0;
    }

    setError(null);

    try {

      const res = await apiClient.getMyAgents();

      console.log('[useAgents] getMyAgents raw response:', JSON.stringify(res).substring(0, 500));

      // Handle different response shapes:
      // Backend might return { success, data: [...] } or { success, data: { agents: [...] } }
      let agentList: Agent[] = [];
      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          agentList = res.data;
        } else if (Array.isArray(res.data.agents)) {
          agentList = res.data.agents;
        } else if (Array.isArray(res.data.data)) {
          agentList = res.data.data;
        }
      }

      console.log('[useAgents] Parsed agents count:', agentList.length);

      if (agentList.length > 0 || res.success) {
        setAgents(agentList);
        setError(null);
        retryCountRef.current = 0;
      } else {
        throw new Error(res.error || "Failed to fetch agents");
      }
    } catch (err: any) {
      logger.error("Error fetching agents", { error: err.message, attempt: retryCountRef.current });

      retryCountRef.current++;

      // Check if it's an auth error
      if (err.message?.includes('Session expired') || err.message?.includes('401')) {
        setError('Session expired. Please refresh.');
        setAgents([]);
      } else if (retryCountRef.current < maxRetries) {
        // Retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 5000);
        logger.info('Retrying agent fetch', { delay, attempt: retryCountRef.current });

        setTimeout(() => {
          fetchingRef.current = false;
          fetchAgents(true);
        }, delay);
        return; // Don't set loading to false yet
      } else {
        setError(err.message || 'Failed to load agents');
      }
    } finally {
      if (retryCountRef.current >= maxRetries || retryCountRef.current === 0) {
        setLoading(false);
        fetchingRef.current = false;
      }
    }
  }, [user]);

  // Manual reload function
  const reload = useCallback(async () => {
    logger.info('Manual reload requested');
    retryCountRef.current = 0;
    fetchingRef.current = false;

    // Invalidate cache before reloading
    apiClient.invalidateCache('/api/agents');

    await fetchAgents(false);
  }, [fetchAgents]);

  // Initial fetch on mount or when user changes
  useEffect(() => {
    if (user) {
      fetchAgents();
    } else {
      logger.debug('No user, clearing agents');
      setAgents([]);
      setLoading(false);
      setError(null);
    }

    // Cleanup
    return () => {
      fetchingRef.current = false;
      retryCountRef.current = 0;
    };
  }, [user]);

  // Listen for focus events to refresh stale data
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        // Check if agents array is empty but should have data
        if (agents.length === 0 && !loading && !error) {
          reload();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, agents.length, loading, error, reload]);

  return {
    agents,
    loading,
    error,
    reload
  };
};