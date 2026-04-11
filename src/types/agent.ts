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
  tools?: string[];
  created_at?: string;
  updated_at?: string;
}

// Tool definition from GET /api/tools
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  requiresApproval?: boolean;
}

// Tool execution events from socket
export interface ToolExecutionEvent {
  requestId: string;
  agent_id: string;
  tool_name: string;
  call_id: string;
  success?: boolean;
  execution_time_ms?: number;
}

export interface AgentResponse {
  agentId: string;
  agentName: string;
  content: string;
  timestamp: string | Date;
  status: "pending" | "success" | "error";
  metadata?: {
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    domain?: string;
  };
}

export type ExecutionMode = "sequential" | "parallel" | "autonomous";

export interface AgentTrace {
  agentId?: string;
  agentName: string;
  agentRole?: string;
  domain?: string;
  status: "pending" | "running" | "success" | "error";
  toolsUsed?: string[];
  tokens?: number;
  timeMs?: number;
  error?: string;
}

export interface ChatMessage {
  id: string;
  type: "user" | "agent";
  content: string;
  timestamp: Date;
  agentResponses?: AgentResponse[];
  executionMode?: ExecutionMode;
  markdownOutput?: string;
  finalOutput?: string;
  isFromCache?: boolean;
  perAgentSummary?: PerAgentSummary[];

  // New unified orchestration fields
  workflowStatus?:
    | "planning"
    | "creating_agents"
    | "executing"
    | "synthesizing"
    | "completed"
    | "error"
    | "cancelled";
  workflowMessage?: string;
  agentTraces?: AgentTrace[];
  synthesisOutput?: string;
}

// Per-agent execution summary returned in orchestration:done
export interface PerAgentSummary {
  agent_id: string;
  agent_name: string;
  success: boolean;
  aborted: boolean;
  tokens_used: number;
  execution_time_ms: number;
  response_length: number;
}

// Progress tracking for sequential orchestration
export interface OrchestrationProgress {
  requestId: string;
  step: number;
  total: number;
  agent_id?: string;
  agent_name?: string;
}

// Agent template from server
export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  icon?: string;
  color?: string;
  domain?: string;
}

// Agent usage stats
export interface AgentStats {
  agent_id: string;
  total_requests: number;
  total_tokens: number;
  avg_response_time_ms: number;
  last_used_at: string | null;
  daily_breakdown?: Array<{
    date: string;
    requests: number;
    tokens: number;
  }>;
}
