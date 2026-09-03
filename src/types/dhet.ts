// src/types/dhet.ts

export interface ClarifyingOption {
  id: string;
  label: string;
  description?: string;
}

export interface ClarifyingQuestion {
  id: string;
  label: string;
  question: string;
  options: ClarifyingOption[];
  default_option_id?: string;
}

export interface ClarifyingOptionsData {
  title?: string;
  questions: ClarifyingQuestion[];
}

export interface DesignDecision {
  title: string;
  rationale: string;
  principle: string;
  attribution: string;
}

export interface DesignTokens {
  colors: Record<string, string>;
  typography: {
    heading_font?: string;
    body_font?: string;
    mono_font?: string;
    scale?: Record<string, string>;
    weights?: Record<string, string>;
    [key: string]: any;
  };
  spacing: Record<string, string>;
  radius: Record<string, string>;
  grid: {
    columns?: number;
    gutter?: string;
    max_width?: string;
    [key: string]: any;
  };
}

export interface DesignProposal {
  title: string;
  summary: string;
  ascii_wireframe: string;
  design_decisions: DesignDecision[];
  design_tokens: DesignTokens;
  ai_image_prompt: string;
  plain_text_spec: string;
}

export interface DhetDesignRecord {
  id: string;
  user_id?: string;
  title: string;
  initial_prompt: string;
  clarifying_options?: ClarifyingQuestion[];
  selected_options?: Record<string, string>;
  proposal: DesignProposal;
  provider_used?: string;
  model_used?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProposalPayload {
  prompt: string;
  selections: Record<string, string>;
  clarifying_options?: ClarifyingQuestion[];
}
