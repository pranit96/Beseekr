// API Client Configuration with Enhanced Error Handling
import { createLogger } from '@/services/logging';

const logger = createLogger('APIClient');
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  endpoint: string;
  options: RequestInit;
}

class ApiClient {
  private baseUrl: string;
  private onUnauthorized?: () => void;
  private requestCache: Map<string, { data: any; timestamp: number }> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds cache

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getCacheKey(endpoint: string, options: RequestInit): string {
    return `${options.method || 'GET'}-${endpoint}-${JSON.stringify(options.body || '')}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const cacheKey = this.getCacheKey(endpoint, options);
    
    // Check if there's a pending request for the same endpoint
    if (this.pendingRequests.has(cacheKey)) {
      logger.debug('Reusing pending request', { endpoint });
      return this.pendingRequests.get(cacheKey)!;
    }

    // Check cache for GET requests
    if ((options.method === 'GET' || !options.method)) {
      const cached = this.requestCache.get(cacheKey);
      if (cached && this.isCacheValid(cached.timestamp)) {
        logger.debug('Returning cached response', { endpoint });
        return cached.data;
      }
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const requestPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers,
          credentials: 'include', // CRITICAL: Send cookies with every request
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response');
        }

        const data = await response.json();

        if (!response.ok) {
          // Handle 401 Unauthorized
          if (response.status === 401) {
            logger.warn('Unauthorized response', { endpoint, status: response.status });
            if (this.onUnauthorized) {
              this.onUnauthorized();
            }
            throw new Error('Session expired. Please log in again.');
          }

          // Handle other errors
          logger.error('Request failed', { endpoint, status: response.status, error: data.error || data.message });
          throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
        }

        // Cache successful GET responses
        if ((options.method === 'GET' || !options.method) && data.success) {
          this.requestCache.set(cacheKey, {
            data,
            timestamp: Date.now(),
          });
        }

        // Clear cache for mutation requests
        if (options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)) {
          this.clearCache();
        }

        logger.info('Request successful', { endpoint, status: response.status });
        return data;
      } catch (error: any) {
        logger.error('Request failed', { endpoint, error: error.message, errorName: error.name });
        
        // Handle network errors
        if (error.name === 'AbortError') {
          throw new Error('Request timeout. Please try again.');
        }
        
        if (error.message === 'Failed to fetch') {
          throw new Error('Network error. Please check your connection.');
        }
        
        throw error;
      } finally {
        // Remove from pending requests
        this.pendingRequests.delete(cacheKey);
      }
    })();

    // Store pending request
    this.pendingRequests.set(cacheKey, requestPromise);

    return requestPromise;
  }

  private clearCache() {
    this.requestCache.clear();
  }

  public invalidateCache(pattern?: string) {
    if (!pattern) {
      this.clearCache();
      return;
    }

    // Clear specific cache entries matching pattern
    const keysToDelete: string[] = [];
    this.requestCache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.requestCache.delete(key);
    });
  }

  setUnauthorizedHandler(handler: () => void) {
    this.onUnauthorized = handler;
  }

  // Auth endpoints
  async signup(email: string, password: string, full_name: string) {
    this.clearCache();
    return this.request<any>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    });
  }

  async login(email: string, password: string) {
    this.clearCache();
    return this.request<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    this.clearCache();
    return this.request<any>('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    // Don't cache this - always fetch fresh
    const cacheKey = this.getCacheKey('/api/auth/me', { method: 'GET' });
    this.requestCache.delete(cacheKey);
    
    return this.request<any>('/api/auth/me');
  }

  async exportData() {
    return this.request<any>('/api/auth/export');
  }

  async deleteProfile(confirm_email: string) {
    this.clearCache();
    return this.request<any>('/api/auth/profile', {
      method: 'DELETE',
      body: JSON.stringify({ confirm_email }),
    });
  }

  async forgotPassword(email: string) {
    return this.request<any>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(password: string) {
    this.clearCache();
    return this.request<any>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  // Agent endpoints
  async getAgents(params?: { domain?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any>(`/api/agents?${query}`);
  }

  async getMyAgents() {
    return this.request<any>('/api/agents/my');
  }

  async createAgent(agent: any) {
    this.invalidateCache('/api/agents');
    return this.request<any>('/api/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  }

  async updateAgent(id: string, agent: any) {
    this.invalidateCache('/api/agents');
    return this.request<any>(`/api/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(agent),
    });
  }

  async deleteAgent(id: string) {
    this.invalidateCache('/api/agents');
    return this.request<any>(`/api/agents/${id}`, {
      method: 'DELETE',
    });
  }

  // Orchestration endpoints
  async executeOrchestration(payload: {
    agent_ids: string[];
    message: string;
    mode: 'sequential' | 'parallel';
    conversation_id: string;
    save_to_conversation?: boolean;
  }) {
    return this.request<{
      markdown_output: string;
      results: any[];
      final_output?: string;
      aggregated_output?: string;
      total_usage: { total_tokens: number };
    }>('/api/orchestration/execute', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getModels() {
    return this.request<any>('/api/orchestration/models');
  }

  async createOrchestrationSession(payload: {
    agent_ids: string[];
    mode: 'sequential' | 'parallel';
    title?: string;
  }) {
    return this.request<any>('/api/orchestration/session', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Usage endpoints
  async getUsageLogs(params?: { start_date?: string; end_date?: string; page?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any>(`/api/usage?${query}`);
  }

  async getUsageStats(params?: { start_date?: string; end_date?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{
      totalTokens: number;
      totalCost: number;
      totalRequests: number;
      actionBreakdown: {
        [key: string]: {
          count: number;
          tokens: number;
          cost: number;
        };
      };
    }>(`/api/usage/stats?${query}`);
  }

  // Conversation endpoints
  async getConversations(params?: { status?: 'active' | 'archived'; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return this.request<any>(`/api/conversations${query ? `?${query}` : ''}`);
  }

  async createConversation(conversation: { agent_id?: string | null; title?: string }) {
    this.invalidateCache('/api/conversations');
    return this.request<any>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(conversation),
    });
  }

  async deleteConversation(conversationId: string) {
    this.invalidateCache('/api/conversations');
    return this.request<any>(`/api/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  }

  async updateConversationStatus(conversationId: string, status: 'active' | 'archived') {
    this.invalidateCache('/api/conversations');
    return this.request<any>(`/api/conversations/${conversationId}/status?status=${status}`, {
      method: 'PATCH',
    });
  }

  // Message endpoints
  async getMessages(conversation_id: string, page?: number, limit?: number) {
    const queryParams = new URLSearchParams();
    queryParams.append('page', (page || 1).toString());
    queryParams.append('limit', (limit || 50).toString());
    
    return this.request<any>(
      `/api/messages/conversation/${conversation_id}?${queryParams.toString()}`
    );
  }

  // Deep Analytics / Thinkers endpoints
  async getSessionDetails(sessionId: string) {
    return this.request<{
      id: string;
      user_id: string;
      conversation_id: string | null;
      problem: string;
      context: string | null;
      status: 'completed' | 'failed' | 'in_progress';
      tier: 'free' | 'standard' | 'pro';
      output_format: 'markdown' | 'json';
      final_solution: string;
      files?: Array<{
        id: string;
        filename: string;
        file_size: number;
        content_type: string;
      }>;
      thinking_ideations?: Array<{
        role: string;
        domain: string;
        content: string;
        quality_score: number;
      }>;
      execution_metrics?: {
        execution_time_ms: number;
      };
      created_at?: string;
    }>(`/api/thinkers/sessions/${sessionId}`);
  }

  async getSessions(params?: { limit?: number; page?: number }) {
    const query = new URLSearchParams(params as any).toString();
    const response: any = await this.request<any>(`/api/thinkers/sessions${query ? `?${query}` : ''}`);
    
    // Backend returns sessions at root level, not nested in data
    // Transform to match expected structure
    if (response.success && response.sessions) {
      return {
        success: response.success,
        data: {
          sessions: response.sessions,
          pagination: response.pagination
        }
      };
    }
    
    return response;
  }

  async queueAnalysis(payload: {
    problem: string;
    context?: string;
    files?: string[];
    output_format: 'markdown' | 'json';
  }) {
    return this.request<{
      jobId: string;
      sessionId: string;
      tier: string;
      status: 'queued';
    }>('/api/thinkers/queue', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getJobStatus(jobId: string) {
    return this.request<{
      id: string;
      state: 'queued' | 'active' | 'completed' | 'failed' | 'cancelled';
      progress: number;
      sessionId: string;
      tier: string;
    }>(`/api/thinkers/status/${jobId}`);
  }

  async cancelJob(jobId: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/api/thinkers/cancel/${jobId}`, {
      method: 'POST',
    });
  }

  async deleteFile(fileId: string) {
    this.invalidateCache('/api/thinkers/files');
    return this.request<{
      success: boolean;
      message: string;
    }>(`/api/thinkers/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  async deleteSession(sessionId: string, erase: boolean = false) {
    this.invalidateCache('/api/thinkers/sessions');
    const query = erase ? '?erase=true' : '';
    return this.request<{
      success: boolean;
      message: string;
      session_id: string;
      complete_erasure: boolean;
      deleted_records: {
        session: number;
        ideations: number;
        audit_trail: number;
        pii_logs: number;
      };
    }>(`/api/thinkers/sessions/${sessionId}${query}`, {
      method: 'DELETE',
    });
  }

  async submitSupplementalInputs(sessionId: string, data: Record<string, any>) {
    this.invalidateCache('/api/thinkers/sessions');
    return this.request<{
      success: boolean;
      message: string;
      sessionId: string;
      jobId: string;
      reprocessing: boolean;
    }>(`/api/thinkers/sessions/${sessionId}/inputs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);