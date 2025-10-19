// frontend src/services/socketService.ts
import { io, Socket } from 'socket.io-client';
import { createLogger } from '@/services/logging';

const logger = createLogger('SocketService');

interface ConnectionStatusData {
  connected: boolean;
  socketId?: string;
  reason?: string;
}

interface OrchestrationCallbacks {
  onAck?: (data: any) => void;
  onToken?: (agentId: string, token: string, raw: any) => void;
  onAgentDone?: (agentId: string, usage: any, raw: any) => void;
  onAgentError?: (agentId: string, error: any, raw: any) => void;
  onDone?: (data: any) => void;
  onError?: (data: any) => void;
  onWarning?: (data: any) => void;
  onRateLimit?: (data: any) => void;
}

interface OrchestrationPayload {
  agent_ids?: string[];
  message?: string;
  mode?: 'sequential' | 'parallel';
  conversation_id?: string | null;
  save_to_conversation?: boolean;
  requestId?: string;
  [key: string]: any;
}

interface OrchestrationControl {
  requestId: string;
  cancel: () => void;
}

class SocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private activeRequests: Map<string, OrchestrationControl> = new Map();
  private heartbeatInterval: number | null = null;
  private connectionTimeout: number | null = null;
  private autoConnect : false;
  withCredentials: true;
  private onTokensRefreshed: ((tokens: { access_token: string; refresh_token: string }) => void) | null = null;

  /**
   * Set callback for when tokens are refreshed
   */
  setTokenRefreshCallback(callback: (tokens: { access_token: string; refresh_token: string }) => void): void {
    this.onTokensRefreshed = callback;
  }

  /**
   * Connect to socket server with enhanced security
   */
connect(): Socket {
  if (this.socket?.connected) return this.socket;

  const SOCKET_URL = import.meta.env.VITE_API_BASE_URL;

  if (!SOCKET_URL || !this.isValidUrl(SOCKET_URL)) {
    throw new Error('Invalid socket URL configuration');
  }

  const opts: any = {
    withCredentials: true, // ✅ this sends HttpOnly cookies automatically
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: this.maxReconnectAttempts,
    timeout: 10000,
    upgrade: true,
    rememberUpgrade: true,
    secure: SOCKET_URL.startsWith('https'),
    rejectUnauthorized: true,
  };

  this.socket = io(SOCKET_URL, opts);
  this.setupEventHandlers();
  this.startHeartbeat();

  return this.socket;
}


  /**
   * Setup all socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      this.clearConnectionTimeout();
      
      this._emitLocal('connection_status', { 
        connected: true, 
        socketId: this.socket?.id 
      });
    });

    // Handle token refresh from server
    this.socket.on('auth:tokens_refreshed', (data: { access_token: string; refresh_token: string }) => {
      logger.info('Received refreshed tokens from server');
      
      // Update cookies via callback (e.g., auth context)
      if (this.onTokensRefreshed) {
        this.onTokensRefreshed(data);
      }
      
      // Emit event for other listeners
      this._emitLocal('tokens_refreshed', data);
    });

    this.socket.on('disconnect', (reason: string) => {
      this.connected = false;
      this.stopHeartbeat();
      
      this._emitLocal('connection_status', { connected: false, reason });
      
      // Handle abnormal disconnects
      if (reason === 'io server disconnect') {
        this.handleForcedDisconnect();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      this.reconnectAttempts++;
      
      // Check if it's an auth error
      if (error.message === 'Unauthorized' || error.message.includes('token')) {
        logger.error('Authentication error', { error: error.message });
        this._emitLocal('auth_error', { error: error.message });
        
        // Stop reconnecting on auth errors
        this.disconnect();
        return;
      }
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.handleMaxReconnectAttempts();
      }
      
      this._emitLocal('connection_error', { 
        error: error?.message || error,
        attempts: this.reconnectAttempts 
      });
    });

    this.socket.on('error', (error: any) => {
      logger.error('Socket error', { error });
      this._emitLocal('socket_error', { error });
    });

    this.socket.on('rate_limit_exceeded', (data: any) => {
      this._emitLocal('rate_limit_exceeded', data);
    });

    // Heartbeat response
    this.socket.on('pong', () => {
      this.resetConnectionTimeout();
    });
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Validate token format (basic check)
   */
  private isValidToken(token: string): boolean {
    if (!token || token.length < 10 || token.length > 1000) return false;
    if (/<script|javascript:|on\w+=/i.test(token)) return false;
    return true;
  }

  /**
   * Start heartbeat to detect stale connections
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = window.setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
        this.setConnectionTimeout();
      }
    }, 25000);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      window.clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.clearConnectionTimeout();
  }

  /**
   * Set connection timeout
   */
  private setConnectionTimeout(): void {
    this.clearConnectionTimeout();
    this.connectionTimeout = window.setTimeout(() => {
      if (this.socket?.connected) {
        logger.warn('Heartbeat timeout - reconnecting');
        this.socket.disconnect();
        this.socket.connect();
      }
    }, 10000);
  }

  /**
   * Clear connection timeout
   */
  private clearConnectionTimeout(): void {
    if (this.connectionTimeout) {
      window.clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  /**
   * Reset connection timeout
   */
  private resetConnectionTimeout(): void {
    this.clearConnectionTimeout();
  }

  /**
   * Handle forced disconnect
   */
  private handleForcedDisconnect(): void {
    this.cancelAllRequests();
    this._emitLocal('forced_disconnect', { 
      message: 'Server disconnected the connection. Please refresh and login again.' 
    });
  }

  /**
   * Handle max reconnect attempts
   */
  private handleMaxReconnectAttempts(): void {
    this.disconnect();
    this._emitLocal('max_reconnect_attempts', { 
      message: 'Failed to connect after multiple attempts. Please check your connection.' 
    });
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    this.stopHeartbeat();
    this.cancelAllRequests();
    
    if (this.socket) {
      try { 
        this.socket.removeAllListeners();
        this.socket.disconnect(); 
      } catch (e) {
        logger.error('Error during disconnect', { error: e });
      }
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
    }
  }

  /**
   * Cancel all active requests
   */
  private cancelAllRequests(): void {
    this.activeRequests.forEach(control => {
      try {
        control.cancel();
      } catch (e) {
        logger.error('Error cancelling request', { error: e, requestId: control.requestId });
      }
    });
    this.activeRequests.clear();
  }

  /**
   * Sanitize payload to prevent injection attacks
   */
  private sanitizePayload(payload: any): any {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(payload)) {
      if (value === null || value === undefined) {
        sanitized[key] = value;
        continue;
      }
      
      if (typeof value === 'string') {
        sanitized[key] = value.replace(/<script[^>]*>.*?<\/script>/gi, '')
                              .replace(/javascript:/gi, '')
                              .replace(/on\w+\s*=/gi, '');
      } 
      else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? this.sanitizePayload({ item }).item : item
        );
      }
      else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      }
      else if (typeof value === 'object') {
        sanitized[key] = this.sanitizePayload(value);
      }
    }
    
    return sanitized;
  }

  /**
   * Execute orchestration with enhanced error handling and security
   */
  executeOrchestration(
    payload: OrchestrationPayload, 
    callbacks: OrchestrationCallbacks = {}
  ): OrchestrationControl {
    if (!this.socket) {
      throw new Error('Socket not connected. Call connect() first.');
    }

    if (!this.socket.connected) {
      throw new Error('Socket is not in connected state. Please wait for connection.');
    }

    const sanitizedPayload = this.sanitizePayload(payload);
    
    const requestId = sanitizedPayload.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullPayload = { ...sanitizedPayload, requestId };

    if (!fullPayload.agent_ids || fullPayload.agent_ids.length === 0) {
      throw new Error('At least one agent_id is required');
    }

    if (!fullPayload.message || fullPayload.message.trim() === '') {
      throw new Error('Message cannot be empty');
    }

    // Setup per-request listeners
    const onAck = (data: any) => { 
      if (data.requestId === requestId) {
        callbacks.onAck?.(data); 
      }
    };
    
    const onToken = (data: any) => { 
      if (data.requestId === requestId) {
        if (data.agent_id && typeof data.token === 'string') {
          callbacks.onToken?.(data.agent_id, data.token, data);
        }
      }
    };
    
    const onAgentDone = (data: any) => { 
      if (data.requestId === requestId) {
        callbacks.onAgentDone?.(data.agent_id, data.usage, data); 
      }
    };
    
    const onAgentError = (data: any) => { 
      if (data.requestId === requestId) {
        callbacks.onAgentError?.(data.agent_id, data.error, data); 
      }
    };
    
    const onDone = (data: any) => { 
      if (data.requestId === requestId) { 
        callbacks.onDone?.(data); 
        cleanup(); 
      } 
    };
    
    const onError = (data: any) => { 
      if (data.requestId === requestId) { 
        callbacks.onError?.(data); 
        cleanup(); 
      } 
    };
    
    const onWarning = (data: any) => { 
      if (data.requestId === requestId) {
        callbacks.onWarning?.(data); 
      }
    };
    
    const onRateLimit = (data: any) => {
      // Only trigger when server explicitly says you're blocked
      if (
        (!data.requestId || data.requestId === requestId) &&
        (data.reason === 'rate_limit_exceeded' || data.reason === 'temporarily_blocked')
      ) {
        callbacks.onRateLimit?.(data);
      }
    };

    const cleanup = () => {
      this.socket?.off('orchestration:ack', onAck);
      this.socket?.off('orchestration:token', onToken);
      this.socket?.off('orchestration:agent_done', onAgentDone);
      this.socket?.off('orchestration:agent_error', onAgentError);
      this.socket?.off('orchestration:done', onDone);
      this.socket?.off('orchestration:error', onError);
      this.socket?.off('orchestration:warning', onWarning);
      this.socket?.off('orchestration:rate_limit', onRateLimit);
      this.activeRequests.delete(requestId);
    };

    // Attach listeners
    this.socket.on('orchestration:ack', onAck);
    this.socket.on('orchestration:token', onToken);
    this.socket.on('orchestration:agent_done', onAgentDone);
    this.socket.on('orchestration:agent_error', onAgentError);
    this.socket.on('orchestration:done', onDone);
    this.socket.on('orchestration:error', onError);
    this.socket.on('orchestration:warning', onWarning);
    this.socket.on('orchestration:rate_limit', onRateLimit);

    // Emit request with timeout
    const emitTimeout = setTimeout(() => {
      callbacks.onError?.({ 
        error: 'Request timeout - no response from server',
        requestId 
      });
      cleanup();
    }, 120000); // 2 minute timeout

    this.socket.emit('orchestration:execute', fullPayload, (ack: any) => {
      clearTimeout(emitTimeout);
      if (ack?.error) {
        callbacks.onError?.(ack);
        cleanup();
      }
    });

    const control: OrchestrationControl = { 
      requestId, 
      cancel: () => {
        try {
          this.socket?.emit('orchestration:cancel', { requestId });
          cleanup();
        } catch (e) {
          logger.error('Error cancelling orchestration', { error: e, requestId });
        }
      }
    };

    this.activeRequests.set(requestId, control);
    return control;
  }

  /**
   * Register event listener
   */
  on(event: string, cb: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(cb);
    
    if (this.socket) {
      this.socket.on(event, cb as any);
    }
  }

  /**
   * Unregister event listener
   */
  off(event: string, cb: Function): void {
    const arr = this.listeners.get(event) || [];
    const idx = arr.indexOf(cb);
    if (idx > -1) arr.splice(idx, 1);
    
    if (this.socket) {
      this.socket.off(event, cb as any);
    }
  }

  /**
   * Emit local event to registered listeners
   */
  private _emitLocal(event: string, data: any): void {
    const arr = this.listeners.get(event) || [];
    arr.forEach(cb => {
      try { 
        cb(data); 
      } catch (e) {
        logger.error('Error in event listener', { event, error: e });
      }
    });
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.connected && !!this.socket?.connected;
  }

  /**
   * Get connection status
   */
  getStatus(): ConnectionStatusData {
    return {
      connected: this.isConnected(),
      socketId: this.socket?.id,
    };
  }

  /**
   * Get active request count
   */
  getActiveRequestCount(): number {
    return this.activeRequests.size;
  }
}

export default new SocketService();