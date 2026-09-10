import { Agent, ChatMessage } from "@/types/agent";

export const GUEST_DAILY_MESSAGE_LIMIT = 5;
export const GUEST_MAX_CUSTOM_AGENTS = 3;

const GUEST_ID_KEY = "pw_guest_id";
const GUEST_CONVERSATIONS_KEY = "pw_guest_conversations";
const GUEST_AGENTS_KEY = "pw_guest_agents";
const GUEST_DAILY_MESSAGES_KEY = "pw_guest_daily_messages";
const LAST_ACTIVE_CONV_KEY = "pw_guest_active_conversation";

export interface GuestMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  agent_id?: string;
  agent_name?: string;
  created_at: string;
  metadata?: any;
}

export interface GuestConversation {
  id: string;
  title: string;
  agent_id?: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
  last_message?: string;
  messages: GuestMessage[];
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

class GuestSessionService {
  /**
   * Get or generate a persistent unique ID for this guest browser
   */
  getGuestId(): string {
    let guestId = localStorage.getItem(GUEST_ID_KEY);
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem(GUEST_ID_KEY, guestId);
    }
    return guestId;
  }

  /**
   * Get daily message count used today
   */
  getDailyMessageCount(): number {
    try {
      const raw = localStorage.getItem(GUEST_DAILY_MESSAGES_KEY);
      if (!raw) return 0;
      const data = JSON.parse(raw);
      if (data.date === getTodayString()) {
        return Number(data.count) || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Increment daily message count
   */
  incrementDailyMessageCount(): number {
    const today = getTodayString();
    const current = this.getDailyMessageCount();
    const next = current + 1;
    localStorage.setItem(
      GUEST_DAILY_MESSAGES_KEY,
      JSON.stringify({ date: today, count: next }),
    );
    return next;
  }

  /**
   * Set specific message count (e.g. from server response)
   */
  setDailyMessageCount(count: number): void {
    const today = getTodayString();
    localStorage.setItem(
      GUEST_DAILY_MESSAGES_KEY,
      JSON.stringify({ date: today, count }),
    );
  }

  /**
   * Check if guest has exhausted their 5 free messages for today
   */
  isDailyMessageLimitReached(): boolean {
    return this.getDailyMessageCount() >= GUEST_DAILY_MESSAGE_LIMIT;
  }

  /**
   * Get remaining free messages for today
   */
  getRemainingMessages(): number {
    return Math.max(0, GUEST_DAILY_MESSAGE_LIMIT - this.getDailyMessageCount());
  }

  // ─────────────────── Guest Custom Agents ───────────────────

  /**
   * Retrieve all custom agents created in guest mode
   */
  getGuestAgents(): Agent[] {
    try {
      const raw = localStorage.getItem(GUEST_AGENTS_KEY);
      if (!raw) return [];
      const agents = JSON.parse(raw);
      return Array.isArray(agents) ? agents : [];
    } catch {
      return [];
    }
  }

  /**
   * Save a newly created guest agent
   */
  saveGuestAgent(agentData: Partial<Agent>): Agent {
    const existing = this.getGuestAgents();
    if (existing.length >= GUEST_MAX_CUSTOM_AGENTS) {
      throw new Error("Guest custom agent limit reached (max 3). Please sign in.");
    }

    const newAgent: Agent = {
      id: `guest_agent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: agentData.name || "Custom Agent",
      description: agentData.description || "",
      domain: agentData.domain || "General",
      system_prompt: agentData.system_prompt || "",
      temperature: agentData.temperature ?? 0.7,
      max_tokens: agentData.max_tokens ?? 2000,
      is_active: true,
      is_public: false,
      is_guest: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        ...(agentData.metadata || {}),
        is_guest: true,
      },
    } as Agent;

    const updated = [newAgent, ...existing];
    localStorage.setItem(GUEST_AGENTS_KEY, JSON.stringify(updated));
    return newAgent;
  }

  /**
   * Check if guest has reached the max of 3 custom agents
   */
  isGuestAgentLimitReached(): boolean {
    return this.getGuestAgents().length >= GUEST_MAX_CUSTOM_AGENTS;
  }

  // ─────────────────── Guest Conversations ───────────────────

  /**
   * Retrieve all guest conversations
   */
  getGuestConversations(): GuestConversation[] {
    try {
      const raw = localStorage.getItem(GUEST_CONVERSATIONS_KEY);
      if (!raw) return [];
      const convs = JSON.parse(raw);
      return Array.isArray(convs) ? convs : [];
    } catch {
      return [];
    }
  }

  /**
   * Get single guest conversation
   */
  getGuestConversation(id: string): GuestConversation | undefined {
    return this.getGuestConversations().find((c) => c.id === id);
  }

  /**
   * Create or return a guest conversation
   */
  createGuestConversation(title = "New Chat", agentId?: string): GuestConversation {
    const existing = this.getGuestConversations();
    const newConv: GuestConversation = {
      id: `guest_conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      agent_id: agentId,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [],
    };

    const updated = [newConv, ...existing];
    localStorage.setItem(GUEST_CONVERSATIONS_KEY, JSON.stringify(updated));
    this.setActiveConversationId(newConv.id);
    return newConv;
  }

  /**
   * Add message to a guest conversation
   */
  addGuestMessage(
    conversationId: string,
    message: {
      role: "user" | "assistant" | "system";
      content: string;
      agent_id?: string;
      agent_name?: string;
      metadata?: any;
    },
  ): GuestMessage {
    const convs = this.getGuestConversations();
    let conv = convs.find((c) => c.id === conversationId);

    if (!conv) {
      conv = this.createGuestConversation("New Chat", message.agent_id);
      convs.unshift(conv);
    }

    const newMsg: GuestMessage = {
      id: `guest_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      role: message.role,
      content: message.content,
      agent_id: message.agent_id,
      agent_name: message.agent_name,
      created_at: new Date().toISOString(),
      metadata: message.metadata,
    };

    conv.messages.push(newMsg);
    conv.updated_at = new Date().toISOString();
    conv.last_message = message.content.slice(0, 100);

    // Auto update title from first user message if still default
    if (conv.title === "New Chat" && message.role === "user") {
      conv.title = message.content.slice(0, 40) + (message.content.length > 40 ? "..." : "");
    }

    localStorage.setItem(GUEST_CONVERSATIONS_KEY, JSON.stringify(convs));
    return newMsg;
  }

  /**
   * Convert stored guest messages into ChatMessage format for UI
   */
  getGuestChatMessages(conversationId: string): ChatMessage[] {
    const conv = this.getGuestConversation(conversationId);
    if (!conv || !conv.messages) return [];

    return conv.messages.map((m) => {
      if (m.role === "user") {
        return {
          id: m.id,
          type: "user",
          content: m.content,
          timestamp: new Date(m.created_at),
          isFromCache: true,
        } as ChatMessage;
      }

      return {
        id: m.id,
        type: "agent",
        content: m.content,
        timestamp: new Date(m.created_at),
        agentResponses: m.metadata?.agent_results || [],
        agentTraces: m.metadata?.agent_traces || [],
        workflowStatus: "completed",
        executionMode: m.metadata?.orchestration_mode || "sequential",
        markdownOutput: m.metadata?.markdown_output || m.content,
        finalOutput: m.metadata?.final_output || m.content,
        isFromCache: true,
      } as ChatMessage;
    });
  }

  /**
   * Sync complete ChatMessage array back into guest storage
   */
  saveGuestChatMessages(conversationId: string, chatMessages: ChatMessage[]): void {
    const convs = this.getGuestConversations();
    const conv = convs.find((c) => c.id === conversationId);
    if (!conv) return;

    conv.messages = chatMessages.map((cm) => {
      const isUser = cm.type === "user";
      return {
        id: cm.id,
        role: isUser ? "user" : "assistant",
        content: cm.content || cm.finalOutput || "",
        created_at: cm.timestamp ? new Date(cm.timestamp).toISOString() : new Date().toISOString(),
        metadata: isUser
          ? undefined
          : {
              agent_results: cm.agentResponses || [],
              agent_traces: cm.agentTraces || [],
              orchestration_mode: cm.executionMode,
              markdown_output: cm.markdownOutput,
              final_output: cm.finalOutput,
            },
      };
    });

    const lastMsg = chatMessages[chatMessages.length - 1];
    if (lastMsg) {
      conv.last_message = (lastMsg.content || lastMsg.finalOutput || "").slice(0, 100);
      conv.updated_at = new Date().toISOString();
    }

    localStorage.setItem(GUEST_CONVERSATIONS_KEY, JSON.stringify(convs));
  }

  getActiveConversationId(): string | null {
    return localStorage.getItem(LAST_ACTIVE_CONV_KEY);
  }

  setActiveConversationId(id: string): void {
    localStorage.setItem(LAST_ACTIVE_CONV_KEY, id);
  }

  // ─────────────────── Sync Payload & Cleanup ───────────────────

  /**
   * Checks if there is any guest session data that needs syncing to user account
   */
  hasPendingSyncData(): boolean {
    const agents = this.getGuestAgents();
    const convs = this.getGuestConversations();
    const hasMessages = convs.some((c) => c.messages && c.messages.length > 0);
    return agents.length > 0 || hasMessages;
  }

  /**
   * Returns formatted payload ready for /api/auth/sync-guest-session
   */
  getSyncPayload() {
    return {
      guestId: this.getGuestId(),
      agents: this.getGuestAgents(),
      conversations: this.getGuestConversations(),
    };
  }

  private isSyncing = false;

  getIsSyncing(): boolean {
    return this.isSyncing;
  }

  setIsSyncing(val: boolean): void {
    this.isSyncing = val;
  }

  /**
   * Cleans up all guest session data after successful synchronization
   */
  clearGuestSession(): void {
    localStorage.removeItem(GUEST_CONVERSATIONS_KEY);
    localStorage.removeItem(GUEST_AGENTS_KEY);
    localStorage.removeItem(LAST_ACTIVE_CONV_KEY);
    // Note: we intentionally keep GUEST_ID_KEY and GUEST_DAILY_MESSAGES_KEY so daily rate limits cannot be reset by logging out
  }
}

export const guestSessionService = new GuestSessionService();
export default guestSessionService;
