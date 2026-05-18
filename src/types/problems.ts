// Types for Problems Discovery and Validation features

export interface ProblemMetrics {
  frequency: number;
  upvote_score: number;
  source_count: number;
}

export interface TrendPoint {
  snapshot_date: string;
  frequency: number;
  total_upvotes?: number;
  growth_7d?: number;
  growth_30d?: number;
  momentum?: string;
}

// ============ NEW ENRICHED API TYPES ============

export interface OpportunityScoreFactor {
  name: string;
  score: number;
  original_score?: number;
  weight: number;
  impact: "high" | "medium" | "low";
  reason: string;
}

export interface OpportunityScore {
  value: number;
  original_value?: number;
  evidence_penalty?: string;
  confidence_adjusted?: number;
  confidence_penalty?: string;
  summary?: string;
  warnings?: string[];
  factors?: OpportunityScoreFactor[];
}

export interface DataConfidenceFactor {
  value: number;
  status: "high" | "medium" | "low";
  label: string;
}

export interface DataConfidence {
  level: "high" | "medium" | "low";
  score: number;
  factors: {
    frequency?: DataConfidenceFactor;
    sources?: DataConfidenceFactor;
    evidence?: DataConfidenceFactor;
    validation_signals?: DataConfidenceFactor;
  };
  disclaimer?: string;
}

export interface ValidationStrength {
  score: number;
  max_score: number;
  verdict: string;
  breakdown: {
    discussion_volume: number;
    evidence_quality: number;
    external_validation: number;
    trend_momentum: number;
  };
  missing: string[];
  recommendation?: string;
}

export interface MarketSizingTier {
  value: number;
  display: string;
  source: string;
  raw_source?: string;
  multiplier?: string;
}

export interface MarketSizing {
  tam: MarketSizingTier;
  sam: MarketSizingTier;
  som: MarketSizingTier;
  growth_rate?: {
    value: number;
    display: string;
    source: string;
  };
  methodology_note?: string;
}

export interface GoToMarket {
  first_10_customers: string[];
  communities: string[];
  content_hooks: string[];
  competitor_strategy?: string;
  launch_platform?: string;
}

export interface BuildEstimate {
  mvp_weeks: number;
  complexity: "low" | "medium" | "high";
  suggested_stack: string[];
  key_challenge?: string;
  solo_founder_feasible: boolean;
  team_recommendation?: string;
  cost_estimate?: {
    solo: string;
    outsourced: string;
  };
}

export interface CompetitorIntelDirect {
  name: string;
  type: string;
  mentions: number;
  sentiment: string;
  pricing: string;
  weaknesses: string[];
  strengths: string[];
}

export interface CompetitorIntel {
  total_competitors: number;
  filtered_out?: number;
  direct: CompetitorIntelDirect[];
  gaps: string[];
  pain_points: string[];
  positioning?: string;
  data_quality?: {
    level: string;
    warning?: string;
  };
}

export interface RecommendedApproachBullet {
  type: "mvp" | "monetization" | "acquisition" | "timeline" | "metrics";
  text: string;
}

export interface RecommendedApproach {
  bullets: RecommendedApproachBullet[];
  full_text: string;
}

// ============ END NEW TYPES ============

export interface PricingSignal {
  id: string;
  signal: string;
  confidence: number;
  source?: string;
}

export interface Competitor {
  id?: string;
  name: string;
  description?: string;
  url?: string;
  relevance_score?: number;
  // Enriched fields
  competitor_type?: string;
  mention_count?: number;
  sentiment?: string;
  strengths?: string[];
  weaknesses?: string[];
  common_complaints?: string[];
  pricing_mention?: string;
  differentiation_opportunity?: string;
}

export interface MarketEstimate {
  size?: string;
  growth_rate?: string;
  confidence?: number;
  sources?: string[];
  tam_low?: number;
  tam_high?: number;
}

export interface Quote {
  id: string;
  text: string;
  source: string;
  author?: string;
  date?: string;
  upvotes?: number;
}

export interface Source {
  id: string;
  url: string;
  title: string;
  type: string;
  date?: string;
  ups?: number;
  num_comments?: number;
  body?: string;
}

// Brief types - rich market validation data
export interface BriefTargetAudience {
  primary: {
    role: string;
    industry: string;
    pain_level: number;
    company_size: string;
  };
  secondary: any[];
  budget_range: {
    min: number;
    max: number;
    currency: string;
    confidence: string;
  };
  key_insights: string[];
}

export interface BriefMarketValidation {
  tam: {
    size: number;
    year: number;
    source: string;
    currency: string;
    confidence: string;
  };
  trends: {
    momentum: string;
    searches: string;
  };
  competition: {
    level: string;
    gaps: string[];
    key_players: any[];
  };
  growth_rate: number;
  pricing_signals_count: number;
}

export interface BriefScoreBreakdown {
  urgency: number;
  execution: number;
  market_size: number;
  monetization: number;
  competition_gap: number;
  weights: {
    urgency: number;
    execution: number;
    market_size: number;
    monetization: number;
    competition_gap: number;
  };
}

export interface Brief {
  id: string;
  problem_id: string;
  target_audience: BriefTargetAudience;
  market_validation: BriefMarketValidation;
  evidence: any[];
  opportunity_score: number;
  score_breakdown: BriefScoreBreakdown;
  brief_markdown: string;
  recommended_approach: string;
  reviewed: boolean;
  approved: boolean;
  reviewer_notes?: string;
  generation_date: string;
  last_updated: string;
}

export interface Problem {
  id: string;
  title: string;
  summary: string;
  description?: string;
  metrics: ProblemMetrics;
  trend: TrendPoint[];
  pricing_signals: PricingSignal[];
  competitors: Competitor[];
  market_estimate?: MarketEstimate;
  quotes: Quote[];
  sources: Source[] | string[];
  created_at: string;
  updated_at: string;
  // Enriched fields
  tags?: string[];
  category?: string;
  domain?: string[];
  target_audience?: string;
  recommended_action?: string;
  brief?: Brief;
  // NEW: Structured opportunity score
  opportunity_score?: OpportunityScore;
  // NEW: Data confidence indicator
  data_confidence?: DataConfidence;
  // NEW: Validation strength
  validation_strength?: ValidationStrength;
  // NEW: Market sizing (TAM/SAM/SOM)
  market_sizing?: MarketSizing;
  // NEW: Go-to-market tactics
  go_to_market?: GoToMarket;
  // NEW: Build estimate
  build_estimate?: BuildEstimate;
  // NEW: Competitor intelligence
  competitor_intel?: CompetitorIntel;
  // NEW: Structured recommended approach
  recommended_approach?: RecommendedApproach;
  // Additional fields from API
  potential_score?: number;
  feasibility_score?: number;
  quality_score?: number;
  market_size?: string;
  competition_level?: string;
  technical_difficulty?: string;
  subreddits?: string[];
  related_posts?: any[];
  top_quotes?: any[];
  // Report data (enriched analysis)
  report?: {
    header?: {
      category?: string;
      domain?: string[];
    };
    executive_summary?: {
      verdict?: string;
      score?: number;
      original_score?: number;
      confidence?: string;
      one_liner?: string;
      warnings?: string[];
    };
    section_1_problem?: {
      title?: string;
      description?: string;
      target_audience?: string;
      pain_level?: number;
      key_insights?: string[];
    };
    section_2_market?: {
      title?: string;
      tam?: { value: number; display: string };
      sam?: { value: number; display: string };
      som?: { value: number; display: string };
      growth_rate?: { value: number; display: string };
      competition_level?: string;
    };
    section_3_validation?: {
      title?: string;
      score?: number;
      max_score?: number;
      verdict?: string;
      signals?: {
        discussions?: number;
        sources?: number;
        quotes?: number;
        external_signals?: number;
      };
      what_is_missing?: string[];
    };
    section_5_action_plan?: {
      title?: string;
      mvp_timeline?: string;
      complexity?: string;
      solo_feasible?: boolean;
      estimated_cost?: { solo?: string; outsourced?: string };
      first_10_customers?: string[];
      communities_to_target?: string[];
    };
  };
}

export interface ProblemListItem {
  id: string;
  title: string;
  summary: string;
  metrics: ProblemMetrics;
  in_watchlist?: boolean;
  tags?: string[];
  hot_score?: number;
  opportunity_score?: number;
  has_brief?: boolean;
  brief_approved?: boolean;
  last_updated?: string;
  created_at?: string;
  // Rating fields (flat)
  upvotes?: number;
  downvotes?: number;
  user_vote?: "upvote" | "downvote" | null;
  // Rating fields (nested - from API)
  feedback?: {
    upvotes: number;
    downvotes: number;
    user_vote?: "upvote" | "downvote" | null;
  };
}

export interface SearchResult {
  id: string;
  title: string;
  summary: string;
  metrics: ProblemMetrics;
  similarity?: number;
}

export interface FeedResult {
  id: string;
  title: string;
  summary: string;
  metrics: ProblemMetrics;
  relevance_score?: number;
}

export interface ValidationSignals {
  frequency_30d: number;
  trend_pct: number;
  upvote_weighted: number;
  pricing_signals: number;
  competitors: number;
  market_estimate: string;
}

export interface ValidationResult {
  match_score: number;
  nearest_problem?: {
    id: string;
    title: string;
    summary: string;
  } | null;
  signals?: ValidationSignals | null;
  validation_score: number;
  justification: string;
  quotes: Quote[];
}

export interface WatchlistItem {
  problem_id: string;
  problem: ProblemListItem;
  added_at: string;
}

export type SortOption = "hot" | "trending" | "newest" | "top";

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Gated response for anonymous users
export interface GatedProblemsResponse {
  problems: ProblemListItem[];
  total_available: number;
  showing: number;
  gated: boolean;
  upgrade_message?: string;
  page: number;
  limit: number;
}

// Full response for registered users
export interface ProblemsResponse {
  problems: ProblemListItem[];
  gated: boolean;
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// Subscription info
export interface SubscriptionInfo {
  is_premium: boolean;
  tier: "free" | "standard" | "pro";
  expires_at: string | null;
  days_remaining?: number;
}

// Premium problem brief
export interface PremiumProblemBrief {
  id: string;
  problem_id: string;
  opportunity_score: number;
  target_audience?: Record<string, unknown>;
  market_validation?: Record<string, unknown>;
  problem: ProblemListItem;
}

// Premium problems response (free tier - preview only)
export interface PremiumPreviewResponse {
  preview: PremiumProblemBrief;
  available_count: number;
  upgrade_message: string;
  is_premium: false;
  subscription: SubscriptionInfo;
}

// Premium problems response (paid tier - full access)
export interface PremiumFullResponse {
  problems: PremiumProblemBrief[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  is_premium: true;
  subscription: SubscriptionInfo;
}

export type PremiumProblemsResponse =
  | PremiumPreviewResponse
  | PremiumFullResponse;
