// API Client Configuration
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

class ApiClient {
  private baseUrl: string;
  private onUnauthorized?: () => void;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // CRITICAL: Send cookies with every request
      });

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

  setUnauthorizedHandler(handler: () => void) {
    this.onUnauthorized = handler;
  }

  // Auth endpoints
  async signup(email: string, password: string, full_name: string) {
    return this.request<any>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    });
  }

  async login(email: string, password: string) {
    return this.request<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request<any>('/api/auth/logout', {
      method: 'POST',
    });
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
    return this.request<any>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(conversation),
    });
  }

  async deleteConversation(conversationId: string) {
    return this.request<any>(`/api/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  }

  async updateConversationStatus(conversationId: string, status: 'active' | 'archived') {
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
}

export const apiClient = new ApiClient(API_BASE_URL);
