export interface Agent {
  id: string;
  name: string;
  description: string;
  color?: string;
  is_default?: boolean;
  domain?: string;
  system_prompt?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  is_active?: boolean;
  is_public?: boolean;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

export interface AgentResponse {
  agentId: string;
  agentName: string;
  content: string;
  timestamp: Date;
  status: 'pending' | 'success' | 'error';
  metadata?: {
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    domain?: string;
  };
}

export type ExecutionMode = 'sequential' | 'parallel';

export interface ChatMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  agentResponses?: AgentResponse[];
  executionMode?: ExecutionMode;
  markdownOutput?: string;
  finalOutput?: string;
  isFromCache?:boolean;
}
