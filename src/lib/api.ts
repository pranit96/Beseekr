// src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://wizme.netlify.app';

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

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshSubscribers: (() => void)[] = [];
  private refreshPromise: Promise<void> | null = null;
  private onUnauthorized?: () => void;

  constructor(baseUrl: string) {
    // 🆕 FIX: Ensure baseUrl doesn't have trailing slash and is properly formatted
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    console.log('🔧 API Client initialized with base URL:', this.baseUrl);
    
    // Set up unauthorized handler
    this.setUnauthorizedHandler(() => {
      console.warn('🚨 User unauthorized, redirecting to login');
      this.cleanup();
      window.location.href = '/auth';
    });
  }

  // 🆕 FIX: Proper URL construction
  private buildUrl(endpoint: string): string {
    // Ensure endpoint starts with a slash
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Construct the full URL
    const fullUrl = `${this.baseUrl}${normalizedEndpoint}`;
    
    console.log('🔗 Building URL:', { baseUrl: this.baseUrl, endpoint, fullUrl });
    return fullUrl;
  }

  // 🆕 Get CSRF token from cookie
  private getCSRFToken(): string {
    try {
      const name = 'csrf_token=';
      const decodedCookie = decodeURIComponent(document.cookie);
      const ca = decodedCookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(name) === 0) {
          return c.substring(name.length, c.length);
        }
      }
      return '';
    } catch (error) {
      console.error('Error reading CSRF token from cookie:', error);
      return '';
    }
  }

  // 🆕 Set CSRF token in cookie
  private setCSRFToken(token: string): void {
    try {
      const isProduction = import.meta.env.PROD;
      const cookieOptions = [
        `csrf_token=${token}`,
        'path=/',
        `max-age=${24 * 60 * 60}`,
        isProduction ? 'samesite=none; secure' : 'samesite=lax'
      ].join('; ');
      
      document.cookie = cookieOptions;
    } catch (error) {
      console.error('Error setting CSRF token:', error);
    }
  }

  private async refreshAuthToken(): Promise<void> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;

    this.refreshPromise = (async () => {
      try {
        console.log('🔄 Refreshing auth token...');
        
        // 🆕 FIX: Use buildUrl method
        const response = await fetch(this.buildUrl('/api/auth/refresh'), {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const csrfToken = response.headers.get('X-CSRF-Token');
        if (csrfToken) {
          this.setCSRFToken(csrfToken);
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Token refresh failed');
        }

        console.log('✅ Token refresh successful');
        this.onRefresh();
      } catch (error) {
        console.error('❌ Token refresh error:', error);
        this.cleanup();
        if (this.onUnauthorized) {
          this.onUnauthorized();
        }
        throw error;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private onRefresh(): void {
    this.refreshSubscribers.forEach(callback => callback());
    this.refreshSubscribers = [];
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add CSRF token for state-changing methods
    const method = options.method?.toUpperCase() || 'GET';
    const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    
    if (stateChangingMethods.includes(method)) {
      const csrfToken = this.getCSRFToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      } else {
        console.warn('⚠️ CSRF token not found for state-changing request:', method, endpoint);
      }
    }

    try {
      // 🆕 FIX: Use buildUrl method instead of string concatenation
      const url = this.buildUrl(endpoint);
      console.log('🚀 Making request to:', url);
      
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
        cache: 'no-store',
      });

      // Extract CSRF token from response headers
      const csrfToken = response.headers.get('X-CSRF-Token');
      if (csrfToken) {
        this.setCSRFToken(csrfToken);
      }

      // If token is expired, try to refresh and retry the request
      if (response.status === 401 && retry && !endpoint.includes('/auth/refresh')) {
        console.log('🔄 Received 401, attempting token refresh...');
        
        try {
          await this.refreshAuthToken();
          
          // Retry with updated CSRF token if needed
          if (stateChangingMethods.includes(method)) {
            const newCsrfToken = this.getCSRFToken();
            if (newCsrfToken) {
              headers['X-CSRF-Token'] = newCsrfToken;
            }
          }

          return this.request<T>(endpoint, { ...options, headers }, false);
        } catch (refreshError) {
          console.error('❌ Token refresh failed after 401:', refreshError);
          throw refreshError;
        }
      }

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && this.onUnauthorized) {
          this.onUnauthorized();
        }
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  }

  setUnauthorizedHandler(handler: () => void) {
    this.onUnauthorized = handler;
  }

  cleanup() {
    console.log('🧹 API client cleanup completed');
  }

  // Auth endpoints
  async signup(email: string, password: string, full_name: string): Promise<ApiResponse<any>> {
    return this.request<any>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    });
  }

  async login(email: string, password: string): Promise<ApiResponse<any>> {
    return this.request<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/auth/me');
  }

  async exportData(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/auth/export');
  }

  async deleteProfile(confirm_email: string): Promise<ApiResponse<any>> {
    return this.request<any>('/api/auth/profile', {
      method: 'DELETE',
      body: JSON.stringify({ confirm_email }),
    });
  }

  // 🆕 Get CSRF token explicitly
  async getCSRFTokenFromServer(): Promise<string> {
    const response = await this.request<{ csrf_token: string }>('/api/auth/csrf-token');
    if (response.success && response.data?.csrf_token) {
      this.setCSRFToken(response.data.csrf_token);
      return response.data.csrf_token;
    }
    throw new Error('Failed to get CSRF token from server');
  }

  // Agent endpoints
  async getAgents(params?: { domain?: string; page?: number; limit?: number }): Promise<ApiResponse<any>> {
    const query = new URLSearchParams();
    if (params?.domain) query.append('domain', params.domain);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    
    return this.request<any>(`/api/agents?${query.toString()}`);
  }

  async getMyAgents(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/agents/my');
  }

  async createAgent(agent: any): Promise<ApiResponse<any>> {
    return this.request<any>('/api/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  }

  async updateAgent(id: string, agent: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(agent),
    });
  }

  async deleteAgent(id: string): Promise<ApiResponse<any>> {
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
  }): Promise<ApiResponse<{
    markdown_output: string;
    results: any[];
    final_output?: string;
    aggregated_output?: string;
    total_usage: { total_tokens: number };
  }>> {
    return this.request<any>('/api/orchestration/execute', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getModels(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/orchestration/models');
  }

  async createOrchestrationSession(payload: {
    agent_ids: string[];
    mode: 'sequential' | 'parallel';
    title?: string;
  }): Promise<ApiResponse<any>> {
    return this.request<any>('/api/orchestration/session', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Usage endpoints
  async getUsageLogs(params?: { start_date?: string; end_date?: string; page?: number }): Promise<ApiResponse<any>> {
    const query = new URLSearchParams();
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    if (params?.page) query.append('page', params.page.toString());
    
    return this.request<any>(`/api/usage?${query.toString()}`);
  }

  async getUsageStats(params?: { start_date?: string; end_date?: string }): Promise<ApiResponse<{
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
  }>> {
    const query = new URLSearchParams();
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    
    return this.request<any>(`/api/usage/stats?${query.toString()}`);
  }

  // Conversation endpoints
  async getConversations(params?: { status?: 'active' | 'archived'; page?: number; limit?: number }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return this.request<any>(`/api/conversations${query ? `?${query}` : ''}`);
  }

  async createConversation(conversation: { agent_id?: string | null; title?: string }): Promise<ApiResponse<any>> {
    return this.request<any>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(conversation),
    });
  }

  async deleteConversation(conversationId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  }

  async updateConversationStatus(conversationId: string, status: 'active' | 'archived'): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/conversations/${conversationId}/status?status=${status}`, {
      method: 'PATCH',
    });
  }

  // Message endpoints
  async getMessages(conversation_id: string, page?: number, limit?: number): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', (page || 1).toString());
    queryParams.append('limit', (limit || 50).toString());
    
    return this.request<any>(
      `/api/messages/conversation/${conversation_id}?${queryParams.toString()}`
    );
  }

  // 🆕 Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request<any>('/health');
  }
}

// Create and export the API client instance
export const apiClient = new ApiClient(API_BASE_URL);