// API Client Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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

interface SessionData {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];
  private refreshPromise: Promise<string> | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private tokenExpiresAt: number | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.loadTokensFromStorage();
    this.setupActivityListeners();
    this.setupVisibilityListener();
    this.startBackgroundRefresh();
  }

  private loadTokensFromStorage() {
    this.token = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    const expiresAt = localStorage.getItem('token_expires_at');
    if (expiresAt) {
      this.tokenExpiresAt = parseInt(expiresAt);
    }
    this.lastActivity = Date.now();
  }

  private saveTokensToStorage() {
    if (this.token) {
      localStorage.setItem('access_token', this.token);
    } else {
      localStorage.removeItem('access_token');
    }
    
    if (this.refreshToken) {
      localStorage.setItem('refresh_token', this.refreshToken);
    } else {
      localStorage.removeItem('refresh_token');
    }

    if (this.tokenExpiresAt) {
      localStorage.setItem('token_expires_at', this.tokenExpiresAt.toString());
    } else {
      localStorage.removeItem('token_expires_at');
    }
  }

  setTokens(tokens: SessionData | null) {
    if (tokens) {
      this.token = tokens.access_token;
      this.refreshToken = tokens.refresh_token;
      
      // Supabase tokens typically expire in 1 hour (3600 seconds)
      const expiresIn = tokens.expires_in || 3600;
      this.tokenExpiresAt = Date.now() + (expiresIn * 1000);
    } else {
      this.token = null;
      this.refreshToken = null;
      this.tokenExpiresAt = null;
    }
    this.saveTokensToStorage();
    this.lastActivity = Date.now();
    
    // Restart background refresh when tokens are updated
    this.startBackgroundRefresh();
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
    this.lastActivity = Date.now();
  }

  // Setup activity listeners to track user activity
  private setupActivityListeners() {
    // Use debouncing to prevent excessive checks
    let activityCheckTimeout: NodeJS.Timeout | null = null;
    
    const debouncedCheck = () => {
      this.lastActivity = Date.now();
      
      if (activityCheckTimeout) {
        clearTimeout(activityCheckTimeout);
      }
      
      activityCheckTimeout = setTimeout(() => {
        this.checkAndRefreshToken();
      }, 1000); // Only check once per second max
    };
    
    // Removed mousemove and scroll to reduce frequency
    const activityEvents = ['mousedown', 'keypress', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, debouncedCheck, { passive: true });
    });
  }

  // Setup visibility change listener to refresh token when user returns to tab
  private setupVisibilityListener() {
    let lastVisibilityCheck = 0;
    
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        // Prevent duplicate checks within 5 seconds
        const now = Date.now();
        if (now - lastVisibilityCheck < 5000) {
          return;
        }
        lastVisibilityCheck = now;
        
        console.log('Tab became visible, checking token status...');
        await this.checkAndRefreshToken();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Focus event is redundant with visibilitychange, removed for performance
  }

  // Check if token needs refresh and do it
  private async checkAndRefreshToken(): Promise<void> {
    if (!this.refreshToken || this.isRefreshing) {
      return;
    }

    if (this.isTokenExpired() || this.isTokenExpiringSoon()) {
      try {
        console.log('Token expired or expiring soon, refreshing...');
        await this.refreshAuthToken();
      } catch (error) {
        console.error('Failed to refresh token on check:', error);
      }
    }
  }

  // Check if token is completely expired
  private isTokenExpired(): boolean {
    if (!this.tokenExpiresAt) {
      return false;
    }
    return Date.now() >= this.tokenExpiresAt;
  }

  // Check if token will expire soon (within 5 minutes)
  private isTokenExpiringSoon(): boolean {
    if (!this.tokenExpiresAt) {
      return true; // If we don't know expiry, assume it needs refresh
    }
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
    return this.tokenExpiresAt < fiveMinutesFromNow;
  }

  // Start background token refresh
  private startBackgroundRefresh() {
    // Clear existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Only start if we have a refresh token
    if (!this.refreshToken) {
      return;
    }

    // Check every 2 minutes (balanced approach)
    this.refreshInterval = setInterval(async () => {
      if (this.refreshToken && !this.isRefreshing) {
        if (this.isTokenExpiringSoon()) {
          try {
            await this.refreshAuthToken();
            console.log('Background token refresh successful');
          } catch (error) {
            console.warn('Background token refresh failed:', error);
          }
        }
      }
    }, 2 * 60 * 1000); // 2 minutes - good balance
  }

  // Stop background refresh
  private stopBackgroundRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  private async refreshAuthToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;

    this.refreshPromise = (async () => {
      try {
        console.log('Refreshing auth token...');
        const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: this.refreshToken }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Token refresh failed');
        }

        if (data.data?.session) {
          const { access_token, refresh_token, expires_in } = data.data.session;
          this.setTokens({ access_token, refresh_token, expires_in });
          this.onRefresh(access_token);
          console.log('Token refresh successful, new expiry:', new Date(this.tokenExpiresAt!).toLocaleString());
          return access_token;
        }

        throw new Error('Invalid response format from token refresh');
      } catch (error) {
        console.error('Token refresh error:', error);
        this.setTokens(null);
        this.stopBackgroundRefresh();
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

  private onRefresh(token: string) {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.token || !this.refreshToken) {
      return;
    }

    // If token is expired or expiring soon, refresh it before making the request
    if (this.isTokenExpired() || this.isTokenExpiringSoon()) {
      if (this.isRefreshing) {
        // Wait for ongoing refresh
        await this.refreshPromise;
      } else {
        // Start refresh
        try {
          await this.refreshAuthToken();
        } catch (error) {
          console.error('Failed to ensure valid token:', error);
          throw error;
        }
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true
  ): Promise<ApiResponse<T>> {
    // CRITICAL: Ensure token is valid before making ANY request
    try {
      await this.ensureValidToken();
    } catch (error) {
      console.error('Token validation failed before request:', error);
      throw error;
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        cache: 'no-store', // CRITICAL: Disable caching to prevent stale 401 responses
      });

      // Update activity timestamp on API call
      this.lastActivity = Date.now();

      // If token is expired, try to refresh and retry the request
      if (response.status === 401 && retry && this.refreshToken) {
        console.log('Received 401, attempting token refresh...');
        
        try {
          await this.refreshAuthToken();
          
          // Retry the original request with new token
          headers['Authorization'] = `Bearer ${this.token}`;
          return this.request<T>(endpoint, { ...options, headers }, false);
        } catch (refreshError) {
          console.error('Token refresh failed after 401:', refreshError);
          throw refreshError;
        }
      }

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && this.onUnauthorized) {
          this.onUnauthorized();
        }
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  private onUnauthorized?: () => void;

  setUnauthorizedHandler(handler: () => void) {
    this.onUnauthorized = handler;
  }

  // Clean up method to call when logging out
  cleanup() {
    this.stopBackgroundRefresh();
    this.setTokens(null);
  }

  // Auth endpoints
  async signup(email: string, password: string, full_name: string) {
    const response = await this.request<any>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    });

    if (response.success && response.data?.session) {
      this.setTokens({
        access_token: response.data.session.access_token,
        refresh_token: response.data.session.refresh_token,
        expires_in: response.data.session.expires_in,
      });
    }

    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.session) {
      this.setTokens({
        access_token: response.data.session.access_token,
        refresh_token: response.data.session.refresh_token,
        expires_in: response.data.session.expires_in,
      });
    }

    return response;
  }

  async getCurrentUser() {
    return this.request<any>('/api/auth/me');
  }

  async exportData() {
    return this.request<any>('/api/auth/export');
  }

  async deleteProfile(confirm_email: string) {
    return this.request<any>('/api/auth/profile', {
      method: 'DELETE',
      body: JSON.stringify({ confirm_email }),
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
    return this.request<any>('/api/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  }

  async updateAgent(id: string, agent: any) {
    return this.request<any>(`/api/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(agent),
    });
  }

  async deleteAgent(id: string) {
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

  // Conversation endpoints
  async getConversations(params?: { status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any>(`/api/conversations?${query}`);
  }

  async getConversationHistory(conversationId: string) {
    return this.request<any>(`/api/conversations/${conversationId}/history`);
  }

  async createConversation(conversation: { agent_id: string; title?: string }) {
    return this.request<any>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(conversation),
    });
  }

  // Message endpoints
  async sendMessage(conversation_id: string, content: string) {
    return this.request<any>('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ conversation_id, content }),
    });
  }

  async getMessages(conversation_id: string, page?: number, limit?: number) {
    return this.request<any>(
      `/api/messages/conversation/${conversation_id}?page=${page || 1}&limit=${limit || 50}`
    );
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
}

export const apiClient = new ApiClient(API_BASE_URL);