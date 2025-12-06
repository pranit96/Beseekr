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
    metrics: ProblemMetrics;
    trend: TrendPoint[];
    pricing_signals: PricingSignal[];
    competitors: Competitor[];
    market_estimate?: MarketEstimate;
    quotes: Quote[];
    sources: Source[];
    created_at: string;
    updated_at: string;
    // New enriched fields
    tags?: string[];
    category?: string;
    domain?: string[];
    target_audience?: string;
    recommended_action?: string;
    brief?: Brief;
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

export type SortOption = 'hot' | 'trending' | 'newest' | 'top';

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
