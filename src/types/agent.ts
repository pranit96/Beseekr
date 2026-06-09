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
  user_id?: string;
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

// Canvas workflow types
export type CanvasNodeType = "input" | "agent" | "output" | "email";

export interface CanvasWorkflow {
  id: string;
  name: string;
  description: string;
  canvas_data: {
    nodes: any[];
    edges: any[];
    viewport?: { x: number; y: number; zoom: number };
  };
  agent_ids: string[];
  output_format:
    | "plain"
    | "pdf"
    | "csv"
    | "excel"
    | "docx"
    | "latex";
  status: "draft" | "active" | "archived";
  last_run_at: string | null;
  last_run_status: "success" | "failed" | "running" | null;
  created_at: string;
  updated_at: string;
}

export interface CanvasExecutionResult {
  workflow_id: string;
  workflow_name: string;
  agent_results: Array<{
    node_id: string;
    agent_id: string;
    agent_name: string;
    agent_domain?: string;
    response?: string;
    error?: string;
    tokens?: number;
    tools_used?: string[];
  }>;
  final_output: string;
  output_format: string;
  metadata: {
    total_tokens: number;
    execution_time_ms: number;
    agents_executed: number;
    agents_succeeded: number;
  };
}

export interface CanvasSchedule {
  id: string;
  user_id: string;
  workflow_id: string;
  cron_expression: string;
  timezone: string;
  label: string;
  input_text: string;
  output_format: string | null;
  email_enabled: boolean;
  email_to: string;
  email_subject: string;
  email_template: string;
  is_active: boolean;
  next_run_at: string | null;
  last_run_at: string | null;
  last_run_status: "success" | "failed" | null;
  run_count: number;
  max_runs: number | null;
  created_at: string;
  updated_at: string;
  canvas_workflows?: {
    name: string;
  };
}


