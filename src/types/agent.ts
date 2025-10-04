export interface Agent {
  id: string;
  name: string;
  description: string;
  color: string;
  isCustom?: boolean;
}

export interface AgentResponse {
  agentId: string;
  agentName: string;
  content: string;
  timestamp: Date;
  status: 'pending' | 'success' | 'error';
}

export type ExecutionMode = 'sequential' | 'parallel';

export interface ChatMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  agentResponses?: AgentResponse[];
  executionMode?: ExecutionMode;
}
