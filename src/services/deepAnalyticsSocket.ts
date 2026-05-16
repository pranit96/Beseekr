// services/deepAnalyticsSocket.ts - Corrected for Backend Compatibility
import { io, Socket } from "socket.io-client";
import { createLogger } from "@/services/logging";

const logger = createLogger("DeepAnalyticsSocket");

// ============================================================================
// TYPES & INTERFACES (Matching Backend)
// ============================================================================
export type SessionStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type ProgressStage =
  | "initializing"
  | "file_processing"
  | "rag_indexing"
  | "context_building"
  | "analysis"
  | "agent_selection"
  | "ideation"
  | "synthesis"
  | "complete"
  | "stage1"
  | "low_confidence_detected";

// ✅ Backend sends this structure
export interface ProgressUpdate {
  sessionId: string;
  stage: ProgressStage;
  timestamp: string;
  message?: string;
  progress?: number; // Backend sends this directly
  [key: string]: unknown; // Additional stage-specific data
}

// ✅ Backend sends this structure
export interface SessionResult {
  sessionId: string;
  timestamp: string;
  success?: boolean;
  tier?: string;
  final_solution?: {
    content: string;
    format: string;
    confidence: number;
    word_count: number;
    validated: boolean;
  };
  execution_metrics?: {
    execution_time_ms: number;
    tokens_consumed: number;
    avg_specialist_quality: string;
  };
  [key: string]: unknown;
}

// ✅ Backend sends this structure
export interface SessionError {
  sessionId?: string;
  timestamp?: string;
  message: string;
  code: string;
  details?: string;
  retryAfter?: number; // seconds
}

export interface ConnectionStats {
  connected: boolean;
  socketId?: string;
  userId?: string;
  tier?: string;
  activeSubscriptions: string[];
}

// ============================================================================
// CALLBACKS
// ============================================================================
export interface DeepAnalyticsCallbacks {
  onConnected?: (data: {
    userId: string;
    tier: string;
    timestamp: string;
  }) => void;
  onSubscribed?: (data: { sessionId: string; timestamp: string }) => void;
  onProgress?: (data: ProgressUpdate) => void;
  onComplete?: (data: SessionResult) => void;
  onError?: (error: SessionError) => void;
  onCancelled?: (data: { sessionId: string; timestamp: string }) => void;
  onDisconnected?: (reason: string) => void;
  onReconnecting?: (attempt: number) => void;
  onReconnected?: () => void;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================
class DeepAnalyticsSocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;
  private subscribedSessions: Set<string> = new Set();
  private callbacks: Map<string, DeepAnalyticsCallbacks> = new Map();
  private globalCallbacks: DeepAnalyticsCallbacks = {};
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private userTier: string | null = null;
  private userInteractionDetected: boolean = false;
  private pendingSubscriptions: Array<{
    sessionId: string;
    callbacks?: DeepAnalyticsCallbacks;
  }> = [];

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Initialize user interaction listener to connect socket on first click
   */
  initUserInteractionListener(): void {
    if (this.userInteractionDetected) return;

    const handleInteraction = () => {
      if (!this.userInteractionDetected) {
        this.userInteractionDetected = true;
        logger.debug("👆 User interaction detected, pre-connecting socket");
        this.connect();

        // Remove listeners after first interaction
        document.removeEventListener("click", handleInteraction);
        document.removeEventListener("keydown", handleInteraction);
        document.removeEventListener("touchstart", handleInteraction);
      }
    };

    document.addEventListener("click", handleInteraction, {
      once: true,
      passive: true,
    });
    document.addEventListener("keydown", handleInteraction, {
      once: true,
      passive: true,
    });
    document.addEventListener("touchstart", handleInteraction, {
      once: true,
      passive: true,
    });
  }

  connect(): Socket {
    if (this.socket?.connected) {
      logger.debug("Socket already connected", { socketId: this.socket.id });
      return this.socket;
    }

    if (this.socket) {
      logger.debug("Socket instance exists, reusing");
      return this.socket;
    }

    const SOCKET_URL =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

    // Debug: Check if we have cookies
    const cookies = document.cookie;
    const hasAuthCookie =
      cookies.includes("connect.sid") || cookies.includes("session");

    logger.info("Connecting to thinking socket", {
      url: SOCKET_URL,
      hasCookies: cookies.length > 0,
      hasAuthCookie,
      cookieCount: cookies.split(";").filter((c) => c.trim()).length,
      cookieNames: cookies.split(";").map((c) => c.split("=")[0].trim()),
    });

    if (!hasAuthCookie) {
      logger.warn("⚠️ No authentication cookie found - connection may fail");
    }

    // ✅ Connect to /thinking namespace (NOT /thinkers or /deepAnalytics)
    // IMPORTANT: withCredentials: true will automatically send httpOnly cookies
    this.socket = io(`${SOCKET_URL}/thinking`, {
      withCredentials: true, // ✅ CRITICAL - Automatically sends httpOnly cookies
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
      upgrade: true,
      rememberUpgrade: true,
      secure: SOCKET_URL.startsWith("https"),
      rejectUnauthorized: true,
      // Backend will authenticate using the httpOnly cookie
      // If backend requires token in query, it should read from cookie
    });

    this.setupEventHandlers();
    this.startHeartbeat();

    return this.socket;
  }

  disconnect(): void {
    logger.info("Disconnecting socket");

    this.stopHeartbeat();
    this.subscribedSessions.clear();
    this.callbacks.clear();

    if (this.socket) {
      try {
        this.socket.removeAllListeners();
        this.socket.disconnect();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error("Error during disconnect", { error: errorMessage });
      }
      this.socket = null;
    }

    this.connected = false;
    this.userId = null;
    this.userTier = null;
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // ========== CONNECTION EVENTS ==========
    this.socket.on("connect", () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      logger.info("✅ Socket connected", {
        socketId: this.socket?.id,
        hasCookies: document.cookie.length > 0,
        cookieNames: document.cookie
          .split(";")
          .map((c) => c.split("=")[0].trim()),
      });
    });

    // ✅ Backend emits 'connected' with user info
    this.socket.on(
      "connected",
      (data: { userId: string; tier: string; timestamp: string }) => {
        this.userId = data.userId;
        this.userTier = data.tier;
        this.connected = true; // Mark as fully authenticated
        logger.info("✅ Authenticated and ready", {
          userId: data.userId,
          tier: data.tier,
        });

        // Notify global callbacks
        this.globalCallbacks.onConnected?.(data);

        // Notify all session callbacks
        this.callbacks.forEach((cb) => cb.onConnected?.(data));

        // Process pending subscriptions
        if (this.pendingSubscriptions.length > 0) {
          logger.info("📤 Processing pending subscriptions", {
            count: this.pendingSubscriptions.length,
          });
          this.pendingSubscriptions.forEach(({ sessionId, callbacks }) => {
            logger.info("📤 Emitting pending subscribe:session", { sessionId });
            this.socket?.emit("subscribe:session", sessionId);
          });
          this.pendingSubscriptions = [];
        }

        // Re-subscribe to sessions after reconnect
        if (this.subscribedSessions.size > 0) {
          logger.info("Re-subscribing to sessions", {
            count: this.subscribedSessions.size,
          });
          this.subscribedSessions.forEach((sessionId) => {
            this.socket?.emit("subscribe:session", sessionId);
          });
        }
      },
    );

    this.socket.on("disconnect", (reason: string) => {
      this.connected = false;
      this.stopHeartbeat();
      logger.warn("🔌 Disconnected", { reason });

      // Notify callbacks
      this.globalCallbacks.onDisconnected?.(reason);
      this.callbacks.forEach((cb) => cb.onDisconnected?.(reason));

      // Handle forced disconnect (auth failure)
      if (reason === "io server disconnect") {
        logger.error("Server forced disconnect - auth may have failed");
        this.disconnect();
      }
    });

    this.socket.on("connect_error", (error: Error) => {
      this.reconnectAttempts++;
      logger.error("❌ Connection error", {
        error: error.message,
        attempt: this.reconnectAttempts,
      });

      // Notify callbacks
      this.globalCallbacks.onReconnecting?.(this.reconnectAttempts);
      this.callbacks.forEach((cb) =>
        cb.onReconnecting?.(this.reconnectAttempts),
      );

      // Check for auth errors
      if (
        error.message.includes("Authentication") ||
        error.message.includes("token") ||
        error.message.includes("access token")
      ) {
        logger.error(
          "❌ Authentication error - backend requires authentication",
          {
            error: error.message,
            hasCookies: document.cookie.length > 0,
            cookieNames: document.cookie
              .split(";")
              .map((c) => c.split("=")[0].trim()),
          },
        );

        // Don't show error to user - fail silently as per requirement
        logger.warn(
          "⚠️ Backend /thinking namespace may not be configured for cookie auth",
        );
        logger.warn("⚠️ Check backend middleware for /thinking namespace");

        this.globalCallbacks.onError?.({
          code: "AUTH_FAILED",
          message: "Authentication failed. Please ensure you are logged in.",
        });
        this.disconnect();
        return;
      }

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.error("Max reconnection attempts reached");
        this.globalCallbacks.onError?.({
          code: "CONNECTION_FAILED",
          message: "Failed to connect after multiple attempts.",
        });
        this.disconnect();
      }
    });

    this.socket.on("reconnect", (attemptNumber: number) => {
      logger.info("✅ Reconnected", { attemptNumber });
      this.globalCallbacks.onReconnected?.();
      this.callbacks.forEach((cb) => cb.onReconnected?.());
    });

    // ========== SESSION EVENTS ==========

    // ✅ Backend emits 'subscribed'
    this.socket.on(
      "subscribed",
      (data: { sessionId: string; timestamp: string }) => {
        logger.info("✅ [BACKEND] SUBSCRIBED confirmation received", {
          sessionId: data.sessionId,
          timestamp: data.timestamp,
          hasCallbacks: this.callbacks.has(data.sessionId),
          totalCallbacks: this.callbacks.size,
          registeredSessions: Array.from(this.callbacks.keys()),
          socketId: this.socket?.id,
        });
        const callbacks = this.callbacks.get(data.sessionId);
        if (callbacks) {
          callbacks.onSubscribed?.(data);
        } else {
          logger.warn(
            "⚠️ [BACKEND] No callbacks found for subscribed session",
            {
              sessionId: data.sessionId,
              registeredSessions: Array.from(this.callbacks.keys()),
            },
          );
        }
      },
    );

    // ✅ Backend emits 'progress'
    this.socket.on("progress", (data: ProgressUpdate) => {
      logger.debug("📊 [BACKEND] Progress update received", {
        sessionId: data.sessionId,
        stage: data.stage,
        progress: data.progress,
        hasCallbacks: this.callbacks.has(data.sessionId),
        socketId: this.socket?.id,
      });

      const callbacks = this.callbacks.get(data.sessionId);
      if (callbacks) {
        callbacks.onProgress?.(data);
      } else {
        logger.warn(
          "⚠️ [BACKEND] Progress received but no callbacks registered",
          {
            sessionId: data.sessionId,
            registeredSessions: Array.from(this.callbacks.keys()),
          },
        );
      }
    });

    // ✅ Backend emits 'complete'
    this.socket.on("complete", (data: SessionResult) => {
      logger.info("✅ Complete", { sessionId: data.sessionId });

      const callbacks = this.callbacks.get(data.sessionId);
      callbacks?.onComplete?.(data);

      // Cleanup
      this.unsubscribeFromSession(data.sessionId);
    });

    // ✅ Backend emits 'error'
    this.socket.on("error", (error: SessionError) => {
      logger.error("❌ Error", {
        sessionId: error.sessionId,
        code: error.code,
        message: error.message,
      });

      if (error.sessionId) {
        const callbacks = this.callbacks.get(error.sessionId);
        callbacks?.onError?.(error);

        // Cleanup on error
        this.unsubscribeFromSession(error.sessionId);
      } else {
        // Global error
        this.globalCallbacks.onError?.(error);
        this.callbacks.forEach((cb) => cb.onError?.(error));
      }
    });

    // ✅ Backend emits 'cancelled'
    this.socket.on(
      "cancelled",
      (data: { sessionId: string; timestamp: string }) => {
        logger.info("🚫 Cancelled", { sessionId: data.sessionId });

        const callbacks = this.callbacks.get(data.sessionId);
        callbacks?.onCancelled?.(data);

        // Cleanup
        this.unsubscribeFromSession(data.sessionId);
      },
    );

    // ✅ Backend emits 'unsubscribed'
    this.socket.on(
      "unsubscribed",
      (data: { sessionId: string; timestamp: string }) => {
        logger.info("Unsubscribed", { sessionId: data.sessionId });
        this.subscribedSessions.delete(data.sessionId);
        this.callbacks.delete(data.sessionId);
      },
    );

    // ✅ Backend emits 'cancel_acknowledged'
    this.socket.on(
      "cancel_acknowledged",
      (data: { sessionId: string; timestamp: string }) => {
        logger.info("Cancel acknowledged", { sessionId: data.sessionId });
      },
    );

    // ✅ Backend emits 'pong'
    this.socket.on("pong", (data: { timestamp: number }) => {
      const latency = Date.now() - data.timestamp;
      logger.debug("🏓 Pong", { latency });
    });

    // ✅ Backend emits 'stats' (pro only)
    this.socket.on("stats", (data: unknown) => {
      logger.info("📊 Stats", data);
    });
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================
  /**
   * Subscribe to a session with automatic connection and authentication handling
   * Silently waits for connection/auth, no errors thrown to user
   */
  subscribeToSession(
    sessionId: string,
    callbacks?: DeepAnalyticsCallbacks,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!sessionId) {
        const error = "Session ID is required";
        logger.error(error);
        callbacks?.onError?.({
          code: "INVALID_SESSION_ID",
          message: error,
        });
        reject(new Error(error));
        return;
      }

      logger.info("📡 [SUBSCRIBE] Attempting to subscribe to session", {
        sessionId,
        socketConnected: this.socket?.connected,
        authenticated: this.connected,
        userId: this.userId,
        socketId: this.socket?.id,
      });

      // Store callbacks first
      if (callbacks) {
        this.callbacks.set(sessionId, callbacks);
        logger.debug("📝 [SUBSCRIBE] Callbacks registered", { sessionId });
      }

      // Track subscription
      this.subscribedSessions.add(sessionId);

      // Ensure socket is connected
      if (!this.socket) {
        logger.info("🔌 [SUBSCRIBE] No socket, connecting now...");
        this.connect();
      }

      // Wait for authentication (connected event) before subscribing
      if (!this.connected || !this.userId) {
        logger.info(
          "⏳ [SUBSCRIBE] Waiting for authentication before subscribing...",
          {
            socketConnected: this.socket?.connected,
            hasSocket: !!this.socket,
            sessionId,
          },
        );

        // Add to pending subscriptions
        this.pendingSubscriptions.push({ sessionId, callbacks });

        // Set up one-time listener for 'connected' event
        const onConnectedOnce = (data: {
          userId: string;
          tier: string;
          timestamp: string;
        }) => {
          logger.info("✅ [SUBSCRIBE] Authenticated via connected event", {
            sessionId,
            userId: data.userId,
            socketId: this.socket?.id,
          });

          // Remove the listener after first call
          this.socket?.off("connected", onConnectedOnce);

          // Resolve the promise
          resolve();
        };

        // Set up error listener
        const onErrorOnce = (error: SessionError) => {
          if (error.sessionId === sessionId) {
            logger.error("❌ [SUBSCRIBE] Error during subscription", {
              sessionId,
              error,
            });
            this.socket?.off("connected", onConnectedOnce);
            this.socket?.off("error", onErrorOnce);
            reject(new Error(error.message));
          }
        };

        // Add listeners
        this.socket?.on("connected", onConnectedOnce);
        this.socket?.on("error", onErrorOnce);

        // Timeout fallback (30 seconds) - but don't show error to user
        const timeoutId = setTimeout(() => {
          if (!this.connected || !this.userId) {
            this.socket?.off("connected", onConnectedOnce);
            this.socket?.off("error", onErrorOnce);
            logger.warn(
              "⏰ [SUBSCRIBE] Timeout waiting for authentication (silent)",
              {
                connected: this.connected,
                userId: this.userId,
                socketConnected: this.socket?.connected,
                sessionId,
              },
            );
            // Don't call callbacks.onError - fail silently
            // The subscription will happen when connection is established
            resolve(); // Resolve anyway to not block the flow
          }
        }, 30000); // 30 seconds

        return;
      }

      // ✅ Already authenticated, subscribe immediately
      logger.info(
        "✅ [SUBSCRIBE] Emitting subscribe:session (already authenticated)",
        {
          sessionId,
          userId: this.userId,
          socketId: this.socket?.id,
        },
      );
      this.socket.emit("subscribe:session", sessionId);
      resolve();
    });
  }

  unsubscribeFromSession(sessionId: string): void {
    if (!this.socket?.connected) {
      logger.warn("Cannot unsubscribe - socket not connected", { sessionId });
      return;
    }

    logger.info("Unsubscribing from session", { sessionId });

    // ✅ Emit 'unsubscribe:session' with just sessionId (string, not object)
    this.socket.emit("unsubscribe:session", sessionId);

    this.subscribedSessions.delete(sessionId);
    this.callbacks.delete(sessionId);
  }

  cancelSession(sessionId: string): void {
    if (!this.socket?.connected) {
      const error = "Socket not connected";
      logger.error(error);
      throw new Error(error);
    }

    if (!sessionId) {
      const error = "Session ID is required";
      logger.error(error);
      throw new Error(error);
    }

    logger.info("Cancelling session", { sessionId });

    // ✅ Emit 'cancel:session' with just sessionId (string, not object)
    this.socket.emit("cancel:session", sessionId);
  }

  // ============================================================================
  // HEARTBEAT & CONNECTION MONITORING
  // ============================================================================
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        // ✅ Emit 'ping' (no payload)
        this.socket.emit("ping");
      }
    }, 25000); // Every 25 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  isConnected(): boolean {
    return this.connected && !!this.socket?.connected;
  }

  getStats(): ConnectionStats {
    return {
      connected: this.isConnected(),
      socketId: this.socket?.id,
      userId: this.userId || undefined,
      tier: this.userTier || undefined,
      activeSubscriptions: Array.from(this.subscribedSessions),
    };
  }

  requestStats(): void {
    if (!this.socket?.connected) {
      logger.warn("Cannot get stats - socket not connected");
      return;
    }

    // ✅ Emit 'stats' (no payload, pro users only)
    this.socket.emit("stats");
  }

  setGlobalCallbacks(callbacks: DeepAnalyticsCallbacks): void {
    this.globalCallbacks = callbacks;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================
export const deepAnalyticsSocket = new DeepAnalyticsSocketService();
