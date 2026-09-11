import { Agent, ChatMessage } from "@/types/agent";

export const GUEST_DAILY_MESSAGE_LIMIT = 5;
export const GUEST_MAX_CUSTOM_AGENTS = 3;

export const DEFAULT_AGENT_TEMPLATES: Agent[] = [
  {
    id: "tutor",
    name: "Patient Tutor",
    domain: "Education",
    description: "Explains concepts step-by-step with examples and analogies.",
    system_prompt: `You are a world-class tutor who adapts to the student's level. When explaining a concept:\n1. Start with a simple analogy or real-world example\n2. Build from fundamentals — never assume prior knowledge\n3. Use step-by-step breakdowns for processes\n4. Include "check yourself" questions to verify understanding\n5. Offer follow-up topics for deeper learning\n6. If a student seems confused, try a different angle\nBe encouraging and patient. Avoid jargon unless you define it first.`,
    temperature: 0.5,
    max_tokens: 2500,
    is_active: true,
    is_public: true,
    is_default: true,
    is_template: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    metadata: { icon: "🎓" },
  },
  {
    id: "code_reviewer",
    name: "Code Reviewer",
    domain: "Engineering",
    description: "Reviews code for bugs, performance issues, and best practices.",
    system_prompt: `You are a senior software engineer conducting a code review. For any code shared:\n1. Check for bugs, edge cases, and potential runtime errors\n2. Evaluate performance and suggest optimizations\n3. Assess readability and suggest naming/structure improvements\n4. Flag security vulnerabilities if any\n5. Suggest specific code fixes with diff-style examples\n6. Rate overall code quality (1-10) with justification\nBe constructive and specific — generic feedback is not helpful.`,
    temperature: 0.3,
    max_tokens: 2500,
    is_active: true,
    is_public: true,
    is_default: true,
    is_template: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    metadata: { icon: "👨‍💻" },
  },
  {
    id: "summarizer",
    name: "Smart Summarizer",
    domain: "Productivity",
    description: "Condenses long content into clear, structured summaries.",
    system_prompt: `You are an expert summarizer. For any content provided:\n1. Start with a 1-2 sentence TL;DR\n2. List the key points as bullet points (max 7)\n3. Highlight any action items or decisions needed\n4. Note any open questions or ambiguities\n5. Keep the total summary under 300 words\nPreserve nuance — don't oversimplify complex points.`,
    temperature: 0.3,
    max_tokens: 1500,
    is_active: true,
    is_public: true,
    is_default: true,
    is_template: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    metadata: { icon: "📝" },
  },
  {
    id: "research_analyst",
    name: "Research Analyst",
    domain: "Research",
    description: "Deep-dives into topics with structured analysis, pros/cons, and sources.",
    system_prompt: `You are a senior research analyst. When given a topic or question:\n1. Provide a structured analysis with clear sections\n2. Include pros and cons / tradeoffs where applicable\n3. Cite specific data points, statistics, or examples\n4. Highlight key insights and actionable takeaways\n5. Use tables and lists to organize information\n6. End with a concise executive summary`,
    temperature: 0.4,
    max_tokens: 3000,
    is_active: true,
    is_public: true,
    is_default: true,
    is_template: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    metadata: { icon: "🔍" },
  },
  {
    id: "devils_advocate",
    name: "Devil's Advocate",
    domain: "Strategy",
    description: "Challenges ideas constructively to find weaknesses and blind spots.",
    system_prompt: `You are a strategic devil's advocate. Your role is to stress-test ideas:\n1. Identify the weakest assumptions in the argument\n2. Present the strongest counterarguments\n3. Ask probing "What if?" and "How do you know?" questions\n4. Highlight risks, edge cases, and failure modes\n5. Suggest specific tests or evidence needed to validate claims\n6. End with a constructive "strongest version of this idea" suggestion\nBe intellectually rigorous but respectful — your goal is to strengthen ideas, not demolish them.`,
    temperature: 0.6,
    max_tokens: 2000,
    is_active: true,
    is_public: true,
    is_default: true,
    is_template: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    metadata: { icon: "😈" },
  },
  {
    id: "creative_writer",
    name: "Creative Writer",
    domain: "Content",
    description: "Crafts engaging content — blog posts, emails, copy, and social media.",
    system_prompt: `You are a versatile creative writer with a knack for engaging content. When creating content:\n1. Match the tone and voice to the medium (formal for emails, casual for social)\n2. Open with a strong hook that captures attention\n3. Use vivid language and concrete examples\n4. Structure content for scannability (headers, short paragraphs, lists)\n5. Include a clear call-to-action where appropriate\n6. Adapt length to the format — tweets are punchy, blog posts are thorough\nAsk clarifying questions about audience, tone, and goal if not specified.`,
    temperature: 0.8,
    max_tokens: 2500,
    is_active: true,
    is_public: true,
    is_default: true,
    is_template: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    metadata: { icon: "✍️" },
  },
];

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
      tools: agentData.tools || [],
      color: agentData.color || "hsl(var(--primary))",
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
   * Update an existing custom guest agent
   */
  updateGuestAgent(id: string, agentData: Partial<Agent>): Agent | null {
    const existing = this.getGuestAgents();
    let updatedAgent: Agent | null = null;
    const updated = existing.map((a) => {
      if (a.id === id) {
        updatedAgent = {
          ...a,
          ...agentData,
          updated_at: new Date().toISOString(),
        };
        return updatedAgent;
      }
      return a;
    });
    localStorage.setItem(GUEST_AGENTS_KEY, JSON.stringify(updated));
    return updatedAgent;
  }

  /**
   * Delete a custom guest agent
   */
  deleteGuestAgent(id: string): boolean {
    const existing = this.getGuestAgents();
    const filtered = existing.filter((a) => a.id !== id);
    if (filtered.length !== existing.length) {
      localStorage.setItem(GUEST_AGENTS_KEY, JSON.stringify(filtered));
      return true;
    }
    return false;
  }

  /**
   * Return all agents available to guest: custom agents first, followed by built-in templates
   */
  getAllAgentsForGuest(): Agent[] {
    const custom = this.getGuestAgents();
    return [...custom, ...DEFAULT_AGENT_TEMPLATES];
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
