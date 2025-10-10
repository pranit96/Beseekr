import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api";
import { Agent } from "@/types/agent";
import { useAuth } from "@/contexts/AuthContext";

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
      console.log('[useAgents] Fetch already in progress, skipping');
      return;
    }

    // Don't fetch if no user
    if (!user) {
      console.log('[useAgents] No user, skipping fetch');
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
      console.log('[useAgents] Fetching agents, attempt:', retryCountRef.current + 1);
      
      const res = await apiClient.getMyAgents();
      
      if (res.success && Array.isArray(res.data)) {
        setAgents(res.data);
        setError(null);
        retryCountRef.current = 0;
        console.log('[useAgents] Successfully fetched', res.data.length, 'agents');
      } else {
        throw new Error(res.error || "Failed to fetch agents");
      }
    } catch (err: any) {
      console.error("[useAgents] Error fetching agents:", err);
      
      retryCountRef.current++;
      
      // Check if it's an auth error
      if (err.message?.includes('Session expired') || err.message?.includes('401')) {
        setError('Session expired. Please refresh.');
        setAgents([]);
      } else if (retryCountRef.current < maxRetries) {
        // Retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 5000);
        console.log(`[useAgents] Retrying in ${delay}ms...`);
        
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
    console.log('[useAgents] Manual reload requested');
    retryCountRef.current = 0;
    fetchingRef.current = false;
    
    // Invalidate cache before reloading
    apiClient.invalidateCache('/api/agents');
    
    await fetchAgents(false);
  }, [fetchAgents]);

  // Initial fetch on mount or when user changes
  useEffect(() => {
    if (user) {
      console.log('[useAgents] User detected, fetching agents');
      fetchAgents();
    } else {
      console.log('[useAgents] No user, clearing agents');
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
        console.log('[useAgents] Window focused, checking if refresh needed');
        
        // Check if agents array is empty but should have data
        if (agents.length === 0 && !loading && !error) {
          console.log('[useAgents] No agents but should have data, refreshing');
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