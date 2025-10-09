// src/services/socketService.ts
import { io, Socket } from 'socket.io-client';

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
  socket: Socket | null = null;
  connected: boolean = false;
  listeners: Map<string, Function[]> = new Map();

  /**
   * Connect to socket server.
   * If token is provided it will be sent via handshake auth; otherwise rely on browser cookies.
   */
  connect(token: string | null = null): Socket {
    if (this.socket?.connected) return this.socket;

    const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const opts: any = {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    };

    if (token) opts.auth = { token };

    this.socket = io(SOCKET_URL, opts);

    this.socket.on('connect', () => {
      this.connected = true;
      this._emitLocal('connection_status', { 
        connected: true, 
        socketId: this.socket?.id 
      });
    });

    this.socket.on('disconnect', (reason: string) => {
      this.connected = false;
      this._emitLocal('connection_status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error: Error) => {
      this._emitLocal('connection_error', { 
        error: error?.message || error 
      });
    });

    this.socket.on('rate_limit_exceeded', (data: any) => {
      this._emitLocal('rate_limit_exceeded', data);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      try { 
        this.socket.disconnect(); 
      } catch (e) {
        // ignore
      }
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
    }
  }

  /**
   * Execute orchestration and stream. Returns control object { requestId, cancel }.
   * Callbacks are passed to register per-request behaviour.
   */
  executeOrchestration(
    payload: OrchestrationPayload, 
    callbacks: OrchestrationCallbacks = {}
  ): OrchestrationControl {
    if (!this.socket) throw new Error('Socket not connected');

    const requestId = payload.requestId || `req_${Date.now()}`;
    const fullPayload = { ...payload, requestId };

    // setup per-request listeners
    const onAck = (data: any) => { 
      if (data.requestId === requestId) callbacks.onAck?.(data); 
    };
    
    const onToken = (data: any) => { 
      if (data.requestId === requestId) {
        callbacks.onToken?.(data.agent_id, data.token, data); 
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
      if (data.requestId === requestId) callbacks.onWarning?.(data); 
    };
    
    const onRateLimit = (data: any) => { 
      callbacks.onRateLimit?.(data); 
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
    };

    // attach listeners
    this.socket.on('orchestration:ack', onAck);
    this.socket.on('orchestration:token', onToken);
    this.socket.on('orchestration:agent_done', onAgentDone);
    this.socket.on('orchestration:agent_error', onAgentError);
    this.socket.on('orchestration:done', onDone);
    this.socket.on('orchestration:error', onError);
    this.socket.on('orchestration:warning', onWarning);
    this.socket.on('orchestration:rate_limit', onRateLimit);

    // emit request
    this.socket.emit('orchestration:execute', fullPayload);

    return { requestId, cancel: cleanup };
  }

  // Minimal local event registry for UI use
  on(event: string, cb: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(cb);
    if (this.socket) {
      this.socket.on(event, cb as any);
    }
  }

  off(event: string, cb: Function): void {
    const arr = this.listeners.get(event) || [];
    const idx = arr.indexOf(cb);
    if (idx > -1) arr.splice(idx, 1);
    if (this.socket) {
      this.socket.off(event, cb as any);
    }
  }

  private _emitLocal(event: string, data: any): void {
    const arr = this.listeners.get(event) || [];
    arr.forEach(cb => {
      try { 
        cb(data); 
      } catch (e) {
        // ignore
      }
    });
  }

  isConnected(): boolean {
    return this.connected && !!this.socket?.connected;
  }
}

export default new SocketService();