import { io, Socket } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type TailorProgressPayload = {
  jobId?: string;
  progress?: number;
  message?: string;
  stage?: string;
};

export type TailorCompletePayload = {
  jobId?: string;
  success?: boolean;
  data?: unknown;
};

export function connectResumeSocket(): Socket {
  const base = (API_BASE_URL || "").replace(/\/$/, "");
  return io(`${base}/resume`, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
}

/** Subscribe to a tailor/parse job room; returns cleanup. */
export function subscribeTailorJob(
  jobId: string,
  handlers: {
    onProgress?: (data: TailorProgressPayload) => void;
    onComplete?: (data: TailorCompletePayload) => void;
    onError?: (data: {
      message?: string;
      error?: string;
      details?: string;
    }) => void;
    onCancelled?: () => void;
  },
): () => void {
  const socket = connectResumeSocket();

  const subscribe = () => {
    socket.emit("subscribe:tailor", jobId);
  };

  socket.on("connect", subscribe);
  if (socket.connected) subscribe();

  socket.on("progress", (data: TailorProgressPayload) => {
    if (data?.jobId && data.jobId !== jobId) return;
    handlers.onProgress?.(data);
  });

  socket.on("complete", (data: TailorCompletePayload) => {
    if (data?.jobId && data.jobId !== jobId) return;
    handlers.onComplete?.(data);
    cleanup();
  });

  socket.on("error", (err) => {
    if (
      (err as { jobId?: string })?.jobId &&
      (err as { jobId?: string }).jobId !== jobId
    )
      return;
    handlers.onError?.(err);
    cleanup();
  });

  socket.on("cancelled", (data: { jobId?: string }) => {
    if (data?.jobId && data.jobId !== jobId) return;
    handlers.onCancelled?.();
    cleanup();
  });

  const cleanup = () => {
    try {
      socket.removeAllListeners();
      socket.disconnect();
    } catch {
      /* ignore */
    }
  };

  return cleanup;
}
