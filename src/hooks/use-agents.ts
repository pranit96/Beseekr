import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { Agent } from "@/types/agent";

export const useAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getAgents();
      if (res.success && Array.isArray(res.data)) {
        setAgents(res.data);
      } else {
        setError(res.error || "Failed to fetch agents");
      }
    } catch (err: any) {
      console.error("Error fetching agents:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return { agents, loading, error, reload: fetchAgents }; // ✅ renamed to `reload`
};
