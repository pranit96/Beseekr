/**
 * useJobStatus.ts
 *
 * Uses TanStack React Query for reliable, leak-free polling of
 * GET /api/education/jobs/:jobId until the job completes or fails.
 *
 * Usage:
 *   const { status, result, error, isLoading, elapsed } = useJobStatus(jobId, { onComplete });
 */

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export type AiJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | null;

export interface AiJobState {
  status: AiJobStatus;
  result: Record<string, unknown> | null;
  error: string | null;
  isLoading: boolean;
  elapsed: number;
}

export function useJobStatus(
  jobId: string | null | undefined,
  {
    onComplete,
  }: {
    timeoutMs?: number;
    onComplete?: (result: Record<string, unknown>) => void;
  } = {},
): AiJobState {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number | null>(null);

  // Track elapsed seconds
  useEffect(() => {
    if (!jobId) {
      startedAtRef.current = null;
      setElapsed(0);
      return;
    }

    startedAtRef.current = Date.now();
    const interval = setInterval(() => {
      if (startedAtRef.current) {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [jobId]);

  // React Query with dynamic refetchInterval
  const { data: job, isPending, error: queryError } = useQuery({
    queryKey: ["education-ai-job", jobId],
    queryFn: async () => {
      const res = await apiClient.get(`/education/jobs/${jobId}`);
      return res.data?.data;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const currentJob = query.state.data;
      if (!currentJob) return 3000;
      // Stop polling once finished
      if (currentJob.status === "completed" || currentJob.status === "failed") {
        return false;
      }
      return 3000; // Poll every 3s while pending/processing
    },
    refetchIntervalInBackground: false,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });

  const completedJobIdRef = useRef<string | null>(null);

  // Call onComplete callback when job status becomes 'completed' (strictly once per job)
  useEffect(() => {
    if (
      job?.status === "completed" &&
      jobId &&
      completedJobIdRef.current !== jobId
    ) {
      completedJobIdRef.current = jobId;
      onCompleteRef.current?.(job.result ?? {});
    }
  }, [job?.status, job?.result, jobId]);

  const status: AiJobStatus = job?.status || (jobId && isPending ? "pending" : null);
  const isLoading = !!jobId && (isPending || status === "pending" || status === "processing");

  return {
    status,
    result: job?.result ?? null,
    error: job?.error_msg || (queryError ? "Failed to check generation status" : null),
    isLoading,
    elapsed,
  };
}

export default useJobStatus;
