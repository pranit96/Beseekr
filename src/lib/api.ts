// API Client Configuration with Enhanced Error Handling
import { createLogger } from "@/services/logging";

const logger = createLogger("APIClient");
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
  private requestCache: Map<string, { data: any; timestamp: number }> =
    new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds cache
  private isRefreshingSession = false;
  private refreshPromise: Promise<void> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // NEW: Attempt to refresh session before calling unauthorized handler
  private async handleSessionExpired(): Promise<boolean> {
    if (this.isRefreshingSession && this.refreshPromise) {
      logger.info("Session refresh already in progress, waiting...");
      try {
        await this.refreshPromise;
        return true;
      } catch {
        return false;
      }
    }

    this.isRefreshingSession = true;
    this.refreshPromise = (async () => {
      try {
        logger.info("Attempting to refresh expired session");
        const response = await fetch(`${this.baseUrl}/api/auth/me`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          logger.info("Session refresh successful");
          this.clearCache(); // Clear cache after refresh
          return;
        }

        throw new Error("Session refresh failed");
      } catch (error) {
        logger.error("Session refresh failed", { error });
        throw error;
      } finally {
        this.isRefreshingSession = false;
        this.refreshPromise = null;
      }
    })();

    try {
      await this.refreshPromise;
      return true;
    } catch {
      return false;
    }
  }

  private getCacheKey(endpoint: string, options: RequestInit): string {
    return `${options.method || "GET"}-${endpoint}-${JSON.stringify(options.body || "")}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0,
  ): Promise<ApiResponse<T>> {
    const cacheKey = this.getCacheKey(endpoint, options);

    // Check if there's a pending request for the same endpoint (only for first attempt)
    if (retryCount === 0 && this.pendingRequests.has(cacheKey)) {
      logger.debug("Reusing pending request", { endpoint });
      return this.pendingRequests.get(cacheKey)!;
    }

    // Check cache for GET requests (only for first attempt)
    if (retryCount === 0 && (options.method === "GET" || !options.method)) {
      const cached = this.requestCache.get(cacheKey);
      if (cached && this.isCacheValid(cached.timestamp)) {
        logger.debug("Returning cached response", { endpoint });
        return cached.data;
      }
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const requestPromise = (async () => {
      try {
        const controller = new AbortController();
        // Increased from 30s to 120s to support slow LLM generations (like Health Plan or Financial Models)
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers,
          credentials: "include", // CRITICAL: Send cookies with every request
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned non-JSON response");
        }

        const data = await response.json();

        if (!response.ok) {
          // Handle 401 Unauthorized with automatic retry
          if (response.status === 401) {
            logger.warn("Unauthorized response", {
              endpoint,
              status: response.status,
              retryCount,
            });

            // Try to refresh session and retry once
            if (retryCount === 0) {
              logger.info("Attempting session refresh before retry", {
                endpoint,
              });
              const refreshed = await this.handleSessionExpired();

              if (refreshed) {
                logger.info("Session refreshed, retrying request", {
                  endpoint,
                });
                // Remove from pending requests before retry
                this.pendingRequests.delete(cacheKey);
                // Retry the request
                return this.request<T>(endpoint, options, retryCount + 1);
              }
            }

            // If refresh failed or this is already a retry, call unauthorized handler
            if (this.onUnauthorized) {
              this.onUnauthorized();
            }
            throw new Error("Session expired. Please log in again.");
          }

          // Handle other errors
          logger.error("Request failed", {
            endpoint,
            status: response.status,
            error: data.error || data.message,
          });
          throw new Error(
            data.error ||
              data.message ||
              `Request failed with status ${response.status}`,
          );
        }

        // Cache successful GET responses
        if ((options.method === "GET" || !options.method) && data.success) {
          this.requestCache.set(cacheKey, {
            data,
            timestamp: Date.now(),
          });
        }

        // Clear cache for mutation requests
        if (
          options.method &&
          ["POST", "PUT", "PATCH", "DELETE"].includes(options.method)
        ) {
          this.clearCache();
        }

        logger.info("Request successful", {
          endpoint,
          status: response.status,
          retryCount,
        });
        return data;
      } catch (error: any) {
        logger.error("Request failed", {
          endpoint,
          error: error.message,
          errorName: error.name,
          retryCount,
        });

        // Handle network errors
        if (error.name === "AbortError") {
          throw new Error("Request timeout. Please try again.");
        }

        if (error.message === "Failed to fetch") {
          throw new Error("Network error. Please check your connection.");
        }

        throw error;
      } finally {
        // Remove from pending requests
        this.pendingRequests.delete(cacheKey);
      }
    })();

    // Store pending request (only for first attempt)
    if (retryCount === 0) {
      this.pendingRequests.set(cacheKey, requestPromise);
    }

    return requestPromise;
  }

  private clearCache() {
    this.requestCache.clear();
  }

  public clearAllState() {
    logger.info("Clearing all API client state");
    this.clearCache();
    this.pendingRequests.clear();
    this.isRefreshingSession = false;
    this.refreshPromise = null;
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

    keysToDelete.forEach((key) => {
      this.requestCache.delete(key);
    });
  }

  setUnauthorizedHandler(handler: () => void) {
    this.onUnauthorized = handler;
  }

  // Auth endpoints
  async signup(email: string, password: string, full_name: string) {
    this.clearCache();
    return this.request<any>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name }),
    });
  }

  async login(email: string, password: string) {
    this.clearCache();
    return this.request<any>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    this.clearCache();
    return this.request<any>("/api/auth/logout", {
      method: "POST",
    });
  }

  async getCurrentUser() {
    // Don't cache this - always fetch fresh
    const cacheKey = this.getCacheKey("/api/auth/me", { method: "GET" });
    this.requestCache.delete(cacheKey);

    return this.request<any>("/api/auth/me");
  }

  async exportData() {
    return this.request<any>("/api/auth/export");
  }

  async deleteProfile(confirm_email: string) {
    this.clearCache();
    return this.request<any>("/api/auth/profile", {
      method: "DELETE",
      body: JSON.stringify({ confirm_email }),
    });
  }

  async forgotPassword(email: string) {
    return this.request<any>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(password: string) {
    this.clearCache();
    return this.request<any>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  }

  async resendVerificationEmail(email: string) {
    return this.request<any>("/api/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  // Google OAuth - exchange Supabase token for backend session
  async googleCallback(accessToken: string, refreshToken?: string) {
    this.clearCache();
    return this.request<any>("/api/auth/google-callback", {
      method: "POST",
      body: JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
      }),
    });
  }

  // Agent endpoints
  async getAgents(params?: { domain?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any>(`/api/agents?${query}`);
  }

  async getMyAgents() {
    return this.request<any>("/api/agents/my");
  }

  async createAgent(agent: any) {
    this.invalidateCache("/api/agents");
    return this.request<any>("/api/agents", {
      method: "POST",
      body: JSON.stringify(agent),
    });
  }

  async generateAgent(description: string) {
    return this.request<any>("/api/agents/generate", {
      method: "POST",
      body: JSON.stringify({ description }),
    });
  }

  async updateAgent(id: string, agent: any) {
    this.invalidateCache("/api/agents");
    return this.request<any>(`/api/agents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(agent),
    });
  }

  async deleteAgent(id: string) {
    this.invalidateCache("/api/agents");
    return this.request<any>(`/api/agents/${id}`, {
      method: "DELETE",
    });
  }

  async duplicateAgent(id: string) {
    this.invalidateCache("/api/agents");
    return this.request<any>(`/api/agents/${id}/duplicate`, {
      method: "POST",
    });
  }

  async bulkAgentAction(payload: {
    action: "activate" | "deactivate" | "delete";
    agent_ids: string[];
  }) {
    this.invalidateCache("/api/agents");
    return this.request<any>("/api/agents/bulk", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async testAgent(
    id: string,
    payload: { message: string; system_prompt_override?: string },
  ) {
    return this.request<any>(`/api/agents/${id}/test`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getAgentTemplates() {
    return this.request<any>("/api/agents/templates");
  }

  async getAgentStats(id: string) {
    return this.request<any>(`/api/agents/${id}/stats`);
  }

  async enhanceAgentPrompt(
    id: string,
    payload: { current_prompt: string; description?: string },
  ) {
    return this.request<any>(`/api/agents/${id}/enhance-prompt`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Tools endpoints
  async getTools() {
    return this.request<any>("/api/tools");
  }

  // Chat file upload
  async uploadChatFiles(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await fetch(`${this.baseUrl}/api/chat/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Upload failed: ${response.status}`);
    }

    return response.json();
  }

  // Orchestration endpoints
  async executeOrchestration(payload: {
    agent_ids: string[];
    message: string;
    mode: "sequential" | "parallel";
    conversation_id: string;
    save_to_conversation?: boolean;
  }) {
    return this.request<{
      markdown_output: string;
      results: any[];
      final_output?: string;
      aggregated_output?: string;
      total_usage: { total_tokens: number };
    }>("/api/orchestration/execute", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getModels() {
    return this.request<any>("/api/orchestration/models");
  }

  async createOrchestrationSession(payload: {
    agent_ids: string[];
    mode: "sequential" | "parallel";
    title?: string;
  }) {
    return this.request<any>("/api/orchestration/session", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Usage endpoints
  async getUsageLogs(params?: {
    start_date?: string;
    end_date?: string;
    page?: number;
  }) {
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
  async getConversations(params?: {
    status?: "active" | "archived";
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const query = queryParams.toString();
    return this.request<any>(`/api/conversations${query ? `?${query}` : ""}`);
  }

  async createConversation(conversation: {
    agent_id?: string | null;
    title?: string;
  }) {
    this.invalidateCache("/api/conversations");
    return this.request<any>("/api/conversations", {
      method: "POST",
      body: JSON.stringify(conversation),
    });
  }

  async deleteConversation(conversationId: string) {
    this.invalidateCache("/api/conversations");
    return this.request<any>(`/api/conversations/${conversationId}`, {
      method: "DELETE",
    });
  }

  async updateConversationStatus(
    conversationId: string,
    status: "active" | "archived",
  ) {
    this.invalidateCache("/api/conversations");
    return this.request<any>(`/api/conversations/${conversationId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  // Message endpoints
  async getMessages(conversation_id: string, page?: number, limit?: number) {
    const queryParams = new URLSearchParams();
    queryParams.append("page", (page || 1).toString());
    queryParams.append("limit", (limit || 50).toString());

    // Always invalidate messages cache to ensure fresh data when switching conversations
    this.invalidateCache(`/api/messages/conversation/${conversation_id}`);

    return this.request<any>(
      `/api/messages/conversation/${conversation_id}?${queryParams.toString()}`,
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
      status: "completed" | "failed" | "in_progress";
      tier: "free" | "standard" | "pro";
      output_format: "markdown" | "json";
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
    const response: any = await this.request<any>(
      `/api/thinkers/sessions${query ? `?${query}` : ""}`,
    );

    // Backend returns sessions at root level, not nested in data
    // Transform to match expected structure
    if (response.success && response.sessions) {
      return {
        success: response.success,
        data: {
          sessions: response.sessions,
          pagination: response.pagination,
        },
      };
    }

    return response;
  }

  async queueAnalysis(payload: {
    problem: string;
    context?: string;
    files?: string[];
    output_format: "markdown" | "json";
  }) {
    return this.request<{
      jobId: string;
      sessionId: string;
      tier: string;
      status: "queued";
    }>("/api/thinkers/queue", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getJobStatus(jobId: string) {
    return this.request<{
      id: string;
      state: "queued" | "active" | "completed" | "failed" | "cancelled";
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
      method: "POST",
    });
  }

  async deleteFile(fileId: string) {
    this.invalidateCache("/api/thinkers/files");
    return this.request<{
      success: boolean;
      message: string;
    }>(`/api/thinkers/files/${fileId}`, {
      method: "DELETE",
    });
  }

  async deleteSession(sessionId: string, erase: boolean = false) {
    this.invalidateCache("/api/thinkers/sessions");
    const query = erase ? "?erase=true" : "";
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
      method: "DELETE",
    });
  }

  async submitSupplementalInputs(sessionId: string, data: Record<string, any>) {
    this.invalidateCache("/api/thinkers/sessions");
    return this.request<{
      success: boolean;
      message: string;
      sessionId: string;
      jobId: string;
      reprocessing: boolean;
    }>(`/api/thinkers/sessions/${sessionId}/inputs`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Deck-to-Model endpoints
  async uploadDeck(formData: FormData) {
    this.invalidateCache("/api/deck-to-model");

    // Don't set Content-Type for FormData - browser will set it with boundary
    const response = await fetch(`${this.baseUrl}/api/deck-to-model/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned non-JSON response");
    }

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        if (this.onUnauthorized) {
          this.onUnauthorized();
        }
        throw new Error("Session expired. Please log in again.");
      }
      throw new Error(data.error || data.message || "Upload failed");
    }

    return data;
  }

  async getDeckOrders(params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any>(
      `/api/deck-to-model/orders${query ? `?${query}` : ""}`,
    );
  }

  async getDeckOrder(orderId: string) {
    return this.request<any>(`/api/deck-to-model/orders/${orderId}`);
  }

  async downloadDeckModel(orderId: string): Promise<Blob> {
    const response = await fetch(
      `${this.baseUrl}/api/deck-to-model/orders/${orderId}/download`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || data.message || "Download failed");
      }
      throw new Error(`Download failed with status ${response.status}`);
    }

    return response.blob();
  }

  async deleteDeckOrder(orderId: string) {
    this.invalidateCache("/api/deck-to-model");
    return this.request<any>(`/api/deck-to-model/orders/${orderId}`, {
      method: "DELETE",
    });
  }

  async getDeckMetrics() {
    return this.request<any>("/api/deck-to-model/metrics");
  }

  // ========== STOCK STRATEGY ENDPOINTS ==========

  // Signals
  async getStockSignals(filters?: {
    strategy?: string;
    min_confidence?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.strategy) params.append("strategy", filters.strategy);
    if (filters?.min_confidence)
      params.append("min_confidence", filters.min_confidence.toString());

    return this.request<any>(`/api/stock-strategy/signals?${params}`);
  }

  async getStockSignalDetails(signalId: string) {
    return this.request<any>(`/api/stock-strategy/signals/${signalId}`);
  }

  async getStockSignalsWithEvents(filters?: {
    has_event?: boolean;
    days?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.has_event !== undefined)
      params.append("has_event", filters.has_event.toString());
    if (filters?.days) params.append("days", filters.days.toString());

    return this.request<any>(
      `/api/stock-strategy/signals/with-events?${params}`,
    );
  }

  async triggerStockScan() {
    this.invalidateCache("/api/stock-strategy/signals");
    return this.request<any>("/api/stock-strategy/signals/scan", {
      method: "POST",
    });
  }

  // Analysis
  async analyzeStock(symbol: string) {
    return this.request<any>(`/api/stock-strategy/analysis/stock/${symbol}`, {
      method: "POST",
    });
  }

  async getAdvancedTechnicalAnalysis(symbol: string) {
    return this.request<any>(
      `/api/stock-strategy/analysis/technical/${symbol}`,
    );
  }

  async getAdvancedFundamentalAnalysis(symbol: string) {
    return this.request<any>(
      `/api/stock-strategy/analysis/fundamental/${symbol}`,
    );
  }

  async getComprehensiveAnalysis(symbol: string) {
    return this.request<any>(
      `/api/stock-strategy/analysis/comprehensive/${symbol}`,
    );
  }

  // Strategies
  async getStockStrategies() {
    return this.request<any>("/api/stock-strategy/strategies");
  }

  // Trades
  async recordStockTrade(data: {
    signal_id: string;
    entry_price: number;
    shares: number;
    notes?: string;
  }) {
    this.invalidateCache("/api/stock-strategy/trades");
    return this.request<any>("/api/stock-strategy/trades", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async closeStockTrade(
    tradeId: string,
    data: { exit_price: number; notes?: string },
  ) {
    this.invalidateCache("/api/stock-strategy/trades");
    return this.request<any>(`/api/stock-strategy/trades/${tradeId}/close`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getStockTrades(filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    return this.request<any>(`/api/stock-strategy/trades?${params}`);
  }

  // Portfolio
  async getStockPerformanceStats() {
    return this.request<any>("/api/stock-strategy/portfolio/performance");
  }

  async getPortfolioCorrelation() {
    return this.request<any>("/api/stock-strategy/portfolio/correlation");
  }

  async calculatePositionSize(data: {
    account_size: number;
    risk_percent?: number;
    entry_price: number;
    stop_loss: number;
  }) {
    return this.request<any>("/api/stock-strategy/portfolio/position", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Market
  async getMarketRegime() {
    return this.request<any>("/api/stock-strategy/market/regime");
  }

  async getUpcomingEvents(filters?: { days?: number; type?: string }) {
    const params = new URLSearchParams();
    if (filters?.days) params.append("days", filters.days.toString());
    if (filters?.type) params.append("type", filters.type);

    return this.request<any>(`/api/stock-strategy/market/events?${params}`);
  }

  async getDrawdownStatus() {
    return this.request<any>("/api/stock-strategy/market/drawdown");
  }

  // Budget Portfolio
  async generateBudgetPortfolio(data: {
    budget: number;
    risk_profile: "conservative" | "moderate" | "aggressive";
    timeframe: "day" | "week" | "month" | "year";
  }) {
    return this.request<any>("/api/stock-strategy/budget-portfolio/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Validation
  async validateSignalWithClaude(signalId: string) {
    return this.request<any>("/api/stock-strategy/validate/claude", {
      method: "POST",
      body: JSON.stringify({ signalId }),
    });
  }

  // Config
  async getStockLLMConfig() {
    return this.request<any>("/api/stock-strategy/llm/config");
  }

  // ========== END STOCK STRATEGY ENDPOINTS ==========

  // ========== AUTONOMOUS WORKFLOW ENDPOINTS ==========

  async getWorkflowHistory(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any>(
      `/api/autonomous-workflow/history${query ? `?${query}` : ""}`,
    );
  }

  async getWorkflowExecution(id: string) {
    return this.request<any>(`/api/autonomous-workflow/executions/${id}`);
  }

  async deleteWorkflowExecution(id: string) {
    this.invalidateCache("/api/autonomous-workflow");
    return this.request<any>(`/api/autonomous-workflow/executions/${id}`, {
      method: "DELETE",
    });
  }

  // ========== END AUTONOMOUS WORKFLOW ENDPOINTS ==========

  // Notification preferences endpoints
  async getNotificationPreferences() {
    return this.request<{
      email_weekly_digest: boolean;
      email_problem_alerts: boolean;
      email_product_updates: boolean;
      email_marketing: boolean;
    }>("/api/user/notifications");
  }

  async updateNotificationPreferences(preferences: {
    email_weekly_digest?: boolean;
    email_problem_alerts?: boolean;
    email_product_updates?: boolean;
    email_marketing?: boolean;
  }) {
    this.clearCache();
    return this.request<{
      email_weekly_digest: boolean;
      email_problem_alerts: boolean;
      email_product_updates: boolean;
      email_marketing: boolean;
    }>("/api/user/notifications", {
      method: "PUT",
      body: JSON.stringify(preferences),
    });
  }
  async updateProfile(profile: {
    full_name?: string;
    avatar_url?: string;
    language?: string;
    timezone?: string;
  }) {
    this.clearCache();
    return this.request<{
      id: string;
      email: string;
      full_name: string;
      avatar_url?: string;
      language?: string;
      timezone?: string;
    }>("/api/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(profile),
    });
  }

  async changePassword(
    current_password: string | undefined,
    new_password: string,
  ) {
    this.clearCache();
    return this.request<{ message: string }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ current_password, new_password }),
    });
  }

  // Sessions
  async getAuthSessions() {
    return this.request<
      Array<{
        id: string;
        created_at: string;
        last_used_at: string;
        user_agent: string | null;
        ip: string | null;
        is_current: boolean;
      }>
    >("/api/user/sessions");
  }

  async revokeSession(sessionId: string) {
    this.invalidateCache("/api/user/sessions");
    return this.request<{ message: string }>(
      `/api/user/sessions/${sessionId}`,
      {
        method: "DELETE",
      },
    );
  }

  // 2FA
  async get2FAStatus() {
    return this.request<{
      enabled: boolean;
      factors: Array<{ id: string; friendly_name: string; created_at: string }>;
    }>("/api/user/2fa/status");
  }

  async enroll2FA() {
    this.invalidateCache("/api/user/2fa");
    return this.request<{
      id: string;
      totp: { qr_code: string; secret: string; uri: string };
    }>("/api/user/2fa/enroll", { method: "POST" });
  }

  async verify2FA(factor_id: string, code: string) {
    this.invalidateCache("/api/user/2fa");
    return this.request<{ message: string }>("/api/user/2fa/verify", {
      method: "POST",
      body: JSON.stringify({ factor_id, code }),
    });
  }

  async unenroll2FA() {
    this.invalidateCache("/api/user/2fa");
    return this.request<{ message: string }>("/api/user/2fa", {
      method: "DELETE",
    });
  }

  // Generic HTTP methods to support modular API files
  public async get<T = any>(
    endpoint: string,
    options?: { params?: Record<string, any>; headers?: HeadersInit },
  ) {
    let url = endpoint;
    if (options?.params) {
      const cleanParams = Object.fromEntries(
        Object.entries(options.params).filter(
          ([_, v]) => v !== undefined && v !== null,
        ),
      );
      const query = new URLSearchParams(
        cleanParams as Record<string, string>,
      ).toString();
      if (query) {
        url += `${url.includes("?") ? "&" : "?"}${query}`;
      }
    }
    return this.request<T>(url, { method: "GET", headers: options?.headers });
  }

  public async post<T = any>(
    endpoint: string,
    body?: any,
    options?: { headers?: HeadersInit },
  ) {
    return this.request<T>(endpoint, {
      method: "POST",
      headers: options?.headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async put<T = any>(
    endpoint: string,
    body?: any,
    options?: { headers?: HeadersInit },
  ) {
    return this.request<T>(endpoint, {
      method: "PUT",
      headers: options?.headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async delete<T = any>(
    endpoint: string,
    options?: { headers?: HeadersInit },
  ) {
    return this.request<T>(endpoint, {
      method: "DELETE",
      headers: options?.headers,
    });
  }

  public async patch<T = any>(
    endpoint: string,
    body?: any,
    options?: { headers?: HeadersInit },
  ) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      headers: options?.headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
