// services/deepAnalyticsSocket.ts - Corrected for Backend Compatibility
import { io, Socket } from 'socket.io-client';
import { createLogger } from '@/services/logging';

const logger = createLogger('DeepAnalyticsSocket');

// ============================================================================
// TYPES & INTERFACES (Matching Backend)
// ============================================================================
export type SessionStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type ProgressStage =
  | 'initializing'
  | 'file_processing'
  | 'rag_indexing'
  | 'context_building'
  | 'analysis'
  | 'agent_selection'
  | 'ideation'
  | 'synthesis'
  | 'complete';

// ✅ Backend sends this structure
export interface ProgressUpdate {
  sessionId: string;
  stage: ProgressStage;
  timestamp: string;
  message?: string;
  progress?: number; // Backend sends this directly
  [key: string]: any; // Additional stage-specific data
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
  [key: string]: any;
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
  onConnected?: (data: { userId: string; tier: string; timestamp: string }) => void;
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

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================
  connect(): Socket {
    if (this.socket?.connected) {
      logger.debug('Socket already connected', { socketId: this.socket.id });
      return this.socket;
    }

    if (this.socket) {
      logger.debug('Socket instance exists, reusing');
      return this.socket;
    }

    const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    // Debug: Check if we have cookies
    const cookies = document.cookie;
    logger.info('Connecting to thinking socket', { 
      url: SOCKET_URL,
      hasCookies: cookies.length > 0,
      cookieCount: cookies.split(';').filter(c => c.trim()).length,
      cookieNames: cookies.split(';').map(c => c.split('=')[0].trim())
    });

    // ✅ Connect to /thinking namespace (NOT /thinkers or /deepAnalytics)
    // IMPORTANT: withCredentials: true will automatically send httpOnly cookies
    this.socket = io(`${SOCKET_URL}/thinking`, {
      withCredentials: true, // ✅ CRITICAL - Automatically sends httpOnly cookies
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
      upgrade: true,
      rememberUpgrade: true,
      // Don't try to manually send cookies - withCredentials handles it
      // The backend will authenticate using the httpOnly cookie
    });

    this.setupEventHandlers();
    this.startHeartbeat();

    return this.socket;
  }

  disconnect(): void {
    logger.info('Disconnecting socket');

    this.stopHeartbeat();
    this.subscribedSessions.clear();
    this.callbacks.clear();

    if (this.socket) {
      try {
        this.socket.removeAllListeners();
        this.socket.disconnect();
      } catch (error: any) {
        logger.error('Error during disconnect', { error: error.message });
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
    this.socket.on('connect', () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      logger.info('✅ Socket connected', { 
        socketId: this.socket?.id,
        hasCookies: document.cookie.length > 0,
        cookieNames: document.cookie.split(';').map(c => c.split('=')[0].trim())
      });
    });

    // ✅ Backend emits 'connected' with user info
    this.socket.on('connected', (data: { userId: string; tier: string; timestamp: string }) => {
      this.userId = data.userId;
      this.userTier = data.tier;
      this.connected = true; // Mark as fully authenticated
      logger.info('✅ Authenticated and ready', { userId: data.userId, tier: data.tier });

      // Notify global callbacks
      this.globalCallbacks.onConnected?.(data);

      // Notify all session callbacks
      this.callbacks.forEach(cb => cb.onConnected?.(data));

      // Re-subscribe to sessions after reconnect
      if (this.subscribedSessions.size > 0) {
        logger.info('Re-subscribing to sessions', { count: this.subscribedSessions.size });
        this.subscribedSessions.forEach(sessionId => {
          this.socket?.emit('subscribe:session', sessionId);
        });
      }
    });

    this.socket.on('disconnect', (reason: string) => {
      this.connected = false;
      this.stopHeartbeat();
      logger.warn('🔌 Disconnected', { reason });

      // Notify callbacks
      this.globalCallbacks.onDisconnected?.(reason);
      this.callbacks.forEach(cb => cb.onDisconnected?.(reason));

      // Handle forced disconnect (auth failure)
      if (reason === 'io server disconnect') {
        logger.error('Server forced disconnect - auth may have failed');
        this.disconnect();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      this.reconnectAttempts++;
      logger.error('❌ Connection error', {
        error: error.message,
        attempt: this.reconnectAttempts
      });

      // Notify callbacks
      this.globalCallbacks.onReconnecting?.(this.reconnectAttempts);
      this.callbacks.forEach(cb => cb.onReconnecting?.(this.reconnectAttempts));

      // Check for auth errors
      if (error.message.includes('Authentication') || error.message.includes('token')) {
        logger.error('Authentication error - stopping reconnection');
        this.globalCallbacks.onError?.({
          code: 'AUTH_FAILED',
          message: 'Authentication failed. Please log in again.',
        });
        this.disconnect();
        return;
      }

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.error('Max reconnection attempts reached');
        this.globalCallbacks.onError?.({
          code: 'CONNECTION_FAILED',
          message: 'Failed to connect after multiple attempts.',
        });
        this.disconnect();
      }
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      logger.info('✅ Reconnected', { attemptNumber });
      this.globalCallbacks.onReconnected?.();
      this.callbacks.forEach(cb => cb.onReconnected?.());
    });

    // ========== SESSION EVENTS ==========

    // ✅ Backend emits 'subscribed'
    this.socket.on('subscribed', (data: { sessionId: string; timestamp: string }) => {
      logger.info('✅ SUBSCRIBED confirmation received', {
        sessionId: data.sessionId,
        timestamp: data.timestamp,
        hasCallbacks: this.callbacks.has(data.sessionId),
        totalCallbacks: this.callbacks.size
      });
      const callbacks = this.callbacks.get(data.sessionId);
      if (callbacks) {
        callbacks.onSubscribed?.(data);
      } else {
        logger.warn('⚠️ No callbacks found for subscribed session', {
          sessionId: data.sessionId,
          registeredSessions: Array.from(this.callbacks.keys())
        });
      }
    });

    // ✅ Backend emits 'progress'
    this.socket.on('progress', (data: ProgressUpdate) => {
      logger.debug('📊 Progress', {
        sessionId: data.sessionId,
        stage: data.stage,
        progress: data.progress
      });

      const callbacks = this.callbacks.get(data.sessionId);
      callbacks?.onProgress?.(data);
    });

    // ✅ Backend emits 'complete'
    this.socket.on('complete', (data: SessionResult) => {
      logger.info('✅ Complete', { sessionId: data.sessionId });

      const callbacks = this.callbacks.get(data.sessionId);
      callbacks?.onComplete?.(data);

      // Cleanup
      this.unsubscribeFromSession(data.sessionId);
    });

    // ✅ Backend emits 'error'
    this.socket.on('error', (error: SessionError) => {
      logger.error('❌ Error', {
        sessionId: error.sessionId,
        code: error.code,
        message: error.message
      });

      if (error.sessionId) {
        const callbacks = this.callbacks.get(error.sessionId);
        callbacks?.onError?.(error);

        // Cleanup on error
        this.unsubscribeFromSession(error.sessionId);
      } else {
        // Global error
        this.globalCallbacks.onError?.(error);
        this.callbacks.forEach(cb => cb.onError?.(error));
      }
    });

    // ✅ Backend emits 'cancelled'
    this.socket.on('cancelled', (data: { sessionId: string; timestamp: string }) => {
      logger.info('🚫 Cancelled', { sessionId: data.sessionId });

      const callbacks = this.callbacks.get(data.sessionId);
      callbacks?.onCancelled?.(data);

      // Cleanup
      this.unsubscribeFromSession(data.sessionId);
    });

    // ✅ Backend emits 'unsubscribed'
    this.socket.on('unsubscribed', (data: { sessionId: string; timestamp: string }) => {
      logger.info('Unsubscribed', { sessionId: data.sessionId });
      this.subscribedSessions.delete(data.sessionId);
      this.callbacks.delete(data.sessionId);
    });

    // ✅ Backend emits 'cancel_acknowledged'
    this.socket.on('cancel_acknowledged', (data: { sessionId: string; timestamp: string }) => {
      logger.info('Cancel acknowledged', { sessionId: data.sessionId });
    });

    // ✅ Backend emits 'pong'
    this.socket.on('pong', (data: { timestamp: number }) => {
      const latency = Date.now() - data.timestamp;
      logger.debug('🏓 Pong', { latency });
    });

    // ✅ Backend emits 'stats' (pro only)
    this.socket.on('stats', (data: any) => {
      logger.info('📊 Stats', data);
    });
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================
  subscribeToSession(sessionId: string, callbacks?: DeepAnalyticsCallbacks): void {
    if (!sessionId) {
      const error = 'Session ID is required';
      logger.error(error);
      callbacks?.onError?.({
        code: 'INVALID_SESSION_ID',
        message: error,
      });
      return;
    }

    logger.info('📡 Subscribing to session', { 
      sessionId, 
      socketConnected: this.socket?.connected,
      authenticated: this.connected,
      userId: this.userId 
    });

    // Store callbacks first
    if (callbacks) {
      this.callbacks.set(sessionId, callbacks);
    }

    // Track subscription
    this.subscribedSessions.add(sessionId);

    // Wait for authentication (connected event) before subscribing
    if (!this.connected || !this.userId) {
      logger.warn('⏳ Waiting for authentication (connected event) before subscribing...', {
        socketConnected: this.socket?.connected,
        hasSocket: !!this.socket
      });

      // Set up one-time listener for 'connected' event
      const onConnectedOnce = (data: { userId: string; tier: string; timestamp: string }) => {
        logger.info('✅ Authenticated via connected event, now subscribing', { 
          sessionId, 
          userId: data.userId 
        });
        if (this.socket?.connected) {
          logger.info('📤 Emitting subscribe:session after authentication', { sessionId });
          this.socket.emit('subscribe:session', sessionId);
        } else {
          logger.error('❌ Socket not connected after authentication', { sessionId });
        }
        // Remove the listener after first call
        this.socket?.off('connected', onConnectedOnce);
      };

      // Add listener
      this.socket?.on('connected', onConnectedOnce);

      // Timeout fallback
      const timeoutId = setTimeout(() => {
        if (!this.connected || !this.userId) {
          this.socket?.off('connected', onConnectedOnce);
          logger.error('❌ Timeout waiting for authentication', {
            connected: this.connected,
            userId: this.userId,
            socketConnected: this.socket?.connected
          });
          callbacks?.onError?.({
            code: 'AUTH_TIMEOUT',
            message: 'Authentication timeout. Please refresh and try again.',
          });
        }
      }, 10000);

      return;
    }

    // ✅ Already authenticated, subscribe immediately
    logger.info('✅ Emitting subscribe:session', { sessionId, userId: this.userId });
    this.socket.emit('subscribe:session', sessionId);
  }

  unsubscribeFromSession(sessionId: string): void {
    if (!this.socket?.connected) {
      logger.warn('Cannot unsubscribe - socket not connected', { sessionId });
      return;
    }

    logger.info('Unsubscribing from session', { sessionId });

    // ✅ Emit 'unsubscribe:session' with just sessionId (string, not object)
    this.socket.emit('unsubscribe:session', sessionId);

    this.subscribedSessions.delete(sessionId);
    this.callbacks.delete(sessionId);
  }

  cancelSession(sessionId: string): void {
    if (!this.socket?.connected) {
      const error = 'Socket not connected';
      logger.error(error);
      throw new Error(error);
    }

    if (!sessionId) {
      const error = 'Session ID is required';
      logger.error(error);
      throw new Error(error);
    }

    logger.info('Cancelling session', { sessionId });

    // ✅ Emit 'cancel:session' with just sessionId (string, not object)
    this.socket.emit('cancel:session', sessionId);
  }

  // ============================================================================
  // HEARTBEAT & CONNECTION MONITORING
  // ============================================================================
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        // ✅ Emit 'ping' (no payload)
        this.socket.emit('ping');
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
      logger.warn('Cannot get stats - socket not connected');
      return;
    }

    // ✅ Emit 'stats' (no payload, pro users only)
    this.socket.emit('stats');
  }

  setGlobalCallbacks(callbacks: DeepAnalyticsCallbacks): void {
    this.globalCallbacks = callbacks;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================
export const deepAnalyticsSocket = new DeepAnalyticsSocketService();
