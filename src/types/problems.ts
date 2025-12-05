// Types for Problems Discovery and Validation features

export interface ProblemMetrics {
    frequency: number;
    upvote_score: number;
    source_count: number;
}

export interface TrendPoint {
    snapshot_date: string;
    frequency: number;
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
    // New enriched fields
    competitor_type?: string; // 'established' | 'startup' | etc
    mention_count?: number;
    sentiment?: string; // 'positive' | 'negative' | 'mixed'
    strengths?: string[];
    weaknesses?: string[];
    common_complaints?: string[];
    pricing_mention?: string;
    differentiation_opportunity?: string;
}

export interface MarketEstimate {
    size: string;
    growth_rate?: string;
    confidence?: number;
    sources?: string[];
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
    type: string; // 'reddit' | 'hackernews' | 'twitter' | 'linkedin'
    date?: string;
}

export interface Problem {
    id: string;
    title: string;
    summary: string;
    metrics: ProblemMetrics;
    trend: TrendPoint[];
    pricing_signals: PricingSignal[];
    competitors: Competitor[];
    market_estimate: MarketEstimate;
    quotes: Quote[];
    sources: Source[];
    created_at: string;
    updated_at: string;
}

export interface ProblemListItem {
    id: string;
    title: string;
    summary: string;
    metrics: ProblemMetrics;
    in_watchlist?: boolean;
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
    nearest_problem: {
        id: string;
        title: string;
        summary: string;
    };
    signals: ValidationSignals;
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
