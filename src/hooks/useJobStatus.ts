/**
 * useJobStatus.ts
 *
 * Polls GET /api/education/jobs/:jobId every 5 seconds until the job
 * is completed or failed. Stops polling after `timeoutMs` (default 10 min).
 *
 * Usage:
 *   const { status, result, error, isLoading } = useJobStatus(jobId);
 */

import { useState, useEffect, useRef, useCallback } from "react";
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
  /** Elapsed seconds since polling started */
  elapsed: number;
}

const POLL_INTERVAL_MS = 5_000;
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export function useJobStatus(
  jobId: string | null | undefined,
  {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    onComplete,
  }: {
    timeoutMs?: number;
    onComplete?: (result: Record<string, unknown>) => void;
  } = {},
): AiJobState {
  const [state, setState] = useState<AiJobState>({
    status: jobId ? "pending" : null,
    result: null,
    error: null,
    isLoading: !!jobId,
    elapsed: 0,
  });

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const startedAt = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (elapsedRef.current) {
      clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  useEffect(() => {
    if (!jobId) {
      stopPolling();
      setState({
        status: null,
        result: null,
        error: null,
        isLoading: false,
        elapsed: 0,
      });
      return;
    }

    startedAt.current = Date.now();
    setState({
      status: "pending",
      result: null,
      error: null,
      isLoading: true,
      elapsed: 0,
    });

    // Elapsed counter
    elapsedRef.current = setInterval(() => {
      if (isMounted.current && startedAt.current) {
        setState((s) => ({
          ...s,
          elapsed: Math.floor((Date.now() - startedAt.current!) / 1000),
        }));
      }
    }, 1000);

    const poll = async () => {
      // Timeout guard
      if (startedAt.current && Date.now() - startedAt.current > timeoutMs) {
        stopPolling();
        if (isMounted.current) {
          setState((s) => ({
            ...s,
            status: "failed",
            error: "Job timed out. Please try again.",
            isLoading: false,
          }));
        }
        return;
      }

      try {
        const res = await apiClient.get(`/education/jobs/${jobId}`);
        const job = res.data?.data;

        if (!job || !isMounted.current) return;

        if (job.status === "completed") {
          stopPolling();
          setState((s) => ({
            ...s,
            status: "completed",
            result: job.result ?? null,
            isLoading: false,
          }));
          onCompleteRef.current?.(job.result ?? {});
        } else if (job.status === "failed") {
          stopPolling();
          setState((s) => ({
            ...s,
            status: "failed",
            error: job.error_msg || "AI generation failed. Please try again.",
            isLoading: false,
          }));
        } else {
          // pending or processing — keep polling
          setState((s) => ({ ...s, status: job.status as AiJobStatus }));
        }
      } catch (err: unknown) {
        // Network error — don't stop, retry on next tick
        console.warn("[useJobStatus] Poll error:", err);
      }
    };

    // Poll immediately, then every POLL_INTERVAL_MS
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      stopPolling();
    };
  }, [jobId, timeoutMs, stopPolling]);

  return state;
}

export default useJobStatus;
