export interface Conversation {
  id: string;
  user_id: string;
  agent_id: string | null;
  title: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: any;
  tokens_used?: number;
  created_at: string;
}

export interface ConversationResponse {
  success: boolean;
  data: {
    conversations: Conversation[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}

export interface MessageResponse {
  success: boolean;
  data: {
    messages: Message[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}
