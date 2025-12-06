// Types for the comprehensive Validation Report API response

export interface ReportMetadata {
    idea_submitted: string;
    research_completed: string;
    confidence_grade: string;
    evidence_strength: string;
    sources_analyzed: {
        reddit_discussions: number;
        hn_threads: number;
        pricing_datapoints: number;
        unique_voices: number;
    };
    execution_time_ms: number;
    execution_time_seconds: number;
    phases_completed: number;
    api_version: string;
}

export interface ExecutiveVerdict {
    recommendation: string;
    one_liner: string;
    confidence_score: number;
    key_insight: string;
}

export interface PainQuote {
    quote: string;
    source: string;
    upvotes: number;
    url: string;
    relevanceScore: number;
}

export interface ProblemValidation {
    problem_exists: boolean;
    severity_score: number;
    evidence: {
        pain_quotes: PainQuote[];
        frequency_signals: string[];
        urgency_indicators: string[];
    };
}

export interface SeekingQuote {
    type: string;
    quote: string;
    fullText: string;
    source: string;
    upvotes: number;
    comments: number;
    url: string;
}

export interface WorkaroundDescription {
    method: string;
    mentions: number;
}

export interface DemandSignals {
    active_seekers: number;
    workaround_users: number;
    evidence: {
        seeking_quotes: SeekingQuote[];
        workaround_descriptions: WorkaroundDescription[];
    };
}

export interface CompetitorEvidence {
    text: string;
    url: string;
}

export interface Competitor {
    name: string;
    description: string;
    pricing: string;
    strength: string;
    weakness: string;
    sentiment: string;
    mentions: number;
    evidence: CompetitorEvidence[];
}

export interface CompetitiveLandscape {
    direct_competitors: Competitor[];
    indirect_competitors: Competitor[];
    diy_alternatives: string[];
    market_gaps: string[];
    total_competitors_found: number;
    evidence_urls: string[];
}

export interface PricingQuote {
    quote: string;
    amount: string;
    context: string;
    source: string;
    url: string;
}

export interface PricingStrategy {
    recommended_model: string;
    entry_price: number;
    standard_price: number;
    premium_price: number;
    rationale: string;
}

export interface PricingIntelligence {
    willingness_to_pay: {
        low_anchor: string;
        median: string;
        high_anchor: string;
        enterprise_mentions: string;
    };
    data_points: number;
    raw_quotes: PricingQuote[];
    competitor_pricing: any[];
    value_drivers: string[];
    pricing_strategy: PricingStrategy;
    objections: string[];
    evidence_strength: string;
}

export interface PrimaryPersona {
    title: string;
    company_stage: string;
    company_size: string;
    key_responsibilities: string[];
    pain_points: string[];
    current_workflow: string[];
    success_metrics: string[];
    budget_authority: string;
}

export interface SecondaryPersona {
    title: string;
    relationship_to_problem: string;
}

export interface RoleDistribution {
    [key: string]: {
        count: number;
        percentage: number;
    };
}

export interface CustomerProfile {
    primary_persona: PrimaryPersona;
    secondary_personas: SecondaryPersona[];
    role_distribution: RoleDistribution;
    behavioral_patterns: {
        research_methods: WorkaroundDescription[];
        pain_frequency: string;
        solution_attempts: string[];
        decision_factors: string[];
    };
    buying_triggers: string[];
    common_objections: string[];
    evidence_count: number;
}

export interface MarketSize {
    value: string;
    low?: number;
    high?: number;
    confidence?: string;
    assumptions?: string[];
    notes?: string;
}

export interface MarketSizing {
    methodology: string;
    TAM: MarketSize;
    SAM: MarketSize;
    SOM: MarketSize;
}

export interface MVPFeature {
    feature: string;
    evidence: string;
}

export interface DistributionChannel {
    channel: string;
    tactic: string;
    why: string;
}

export interface GoToMarket {
    positioning: {
        tagline: string;
        unique_value_prop: string;
        avoid_saying: string;
    };
    mvp_features: MVPFeature[];
    distribution_channels: DistributionChannel[];
    pricing_recommendation: PricingStrategy & { rationale: string };
    first_30_days: string[];
}

export interface RiskAssessment {
    major_risks: string[];
    mitigations: string[];
    confidence_level: string;
    recommendation: string;
}

export interface HighQualitySource {
    title: string;
    source: string;
    url: string;
    relevance: string;
    engagement: number;
}

export interface EvidenceAppendix {
    total_sources: number;
    high_quality_sources: HighQualitySource[];
}

export interface ValidationReport {
    report_metadata: ReportMetadata;
    executive_verdict: ExecutiveVerdict;
    problem_validation: ProblemValidation;
    demand_signals: DemandSignals;
    competitive_landscape: CompetitiveLandscape;
    pricing_intelligence: PricingIntelligence;
    customer_profile: CustomerProfile;
    market_sizing: MarketSizing;
    go_to_market: GoToMarket;
    risk_assessment: RiskAssessment;
    evidence_appendix: EvidenceAppendix;
}
