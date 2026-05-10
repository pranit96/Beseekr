// Research Report - Complete Validation Report Display
// Maps all nodes from the validation API response

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Lightbulb,
  ExternalLink,
  ThumbsUp,
  Quote,
  Zap,
  Shield,
  BarChart3,
  Rocket,
  Clock,
  MessageSquare,
  AlertCircle,
  Building,
  Briefcase,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPE DEFINITIONS - Complete node mapping
// ============================================================================

export interface ReportMetadata {
  api_version: string;
  idea_submitted: string;
  confidence_grade: string;
  phases_completed: number;
  sources_analyzed: {
    hn_threads: number;
    unique_voices: number;
    pricing_datapoints: number;
    reddit_discussions: number;
  };
  evidence_strength: string;
  execution_time_ms: number;
  research_completed: string;
  execution_time_seconds: number;
}

export interface ExecutiveVerdict {
  one_liner: string;
  key_insight: string;
  recommendation: "PURSUE" | "EXPLORE" | "CAUTION" | "AVOID" | string;
  confidence_score: number;
}

export interface PainQuote {
  url: string;
  quote: string;
  source: string;
  upvotes: number;
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
  url: string;
  type: string;
  quote: string;
  source: string;
  upvotes: number;
  comments: number;
  fullText: string;
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
  url: string;
  text: string;
}

export interface Competitor {
  name: string;
  pricing: string;
  evidence: CompetitorEvidence[];
  mentions: number;
  strength: string;
  weakness: string;
  sentiment: "positive" | "neutral" | "negative" | string;
  description: string;
}

export interface CompetitiveLandscape {
  market_gaps: string[];
  evidence_urls: string[];
  diy_alternatives: string[];
  direct_competitors: Competitor[];
  indirect_competitors: Competitor[];
  total_competitors_found: number;
}

export interface PricingQuote {
  url: string;
  quote: string;
  amount: string;
  source: string;
  context: string;
}

export interface PricingStrategy {
  model?: string;
  rationale: string;
  entry_price: number;
  premium_price: number;
  standard_price: number;
  recommended_model?: string;
}

export interface PricingIntelligence {
  objections: string[];
  raw_quotes: PricingQuote[];
  data_points: number;
  value_drivers: string[];
  pricing_strategy: PricingStrategy;
  evidence_strength: string;
  competitor_pricing: any[];
  willingness_to_pay: {
    median: string;
    low_anchor: string;
    high_anchor: string;
    enterprise_mentions: string;
  };
}

export interface PrimaryPersona {
  title: string;
  pain_points: string[];
  company_size: string;
  company_stage: string;
  success_metrics: string[];
  budget_authority: string;
  current_workflow: string[];
  key_responsibilities: string[];
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
  evidence_count: number;
  buying_triggers: string[];
  primary_persona: PrimaryPersona;
  common_objections: string[];
  role_distribution: RoleDistribution;
  secondary_personas: SecondaryPersona[];
  behavioral_patterns: {
    pain_frequency: string;
    decision_factors: string[];
    research_methods: WorkaroundDescription[];
    solution_attempts: string[];
  };
}

export interface MarketSizeData {
  notes?: string;
  value: string;
  source?: string;
  calculation?: string;
  low?: number;
  high?: number;
  warning?: string;
  confidence?: string;
  assumptions?: string[];
}

export interface MarketSizing {
  TAM: MarketSizeData;
  SAM: MarketSizeData;
  SOM: MarketSizeData;
  methodology: string;
  data_quality?: string;
}

export interface MVPFeature {
  feature: string;
  evidence: string;
}

export interface DistributionChannel {
  why: string;
  tactic: string;
  channel: string;
}

export interface GoToMarket {
  positioning: {
    tagline: string;
    avoid_saying: string;
    unique_value_prop: string;
  };
  mvp_features: MVPFeature[];
  first_30_days: string[];
  distribution_channels: DistributionChannel[];
  pricing_recommendation: PricingStrategy;
}

export interface RiskAssessment {
  major_risks: string[];
  mitigations: string[];
  recommendation: string;
  confidence_level: string;
}

export interface HighQualitySource {
  url: string;
  title: string;
  source: string;
  relevance: string;
  engagement: number;
}

export interface EvidenceAppendix {
  total_sources: number;
  high_quality_sources: HighQualitySource[];
}

export interface FullReport {
  go_to_market: GoToMarket;
  market_sizing: MarketSizing;
  demand_signals: DemandSignals;
  report_metadata: ReportMetadata;
  risk_assessment: RiskAssessment;
  customer_profile: CustomerProfile;
  evidence_appendix: EvidenceAppendix;
  executive_verdict: ExecutiveVerdict;
  problem_validation: ProblemValidation;
  pricing_intelligence: PricingIntelligence;
  competitive_landscape: CompetitiveLandscape;
}

export interface ValidationReportData {
  id: string;
  idea_input: string;
  recommendation: string;
  confidence_grade: string;
  validation_score: number;
  one_liner: string;
  key_insight: string;
  evidence_count: number;
  created_at: string;
  full_report: FullReport;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getGradeColor = (grade: string) => {
  switch (grade) {
    case "A":
      return "text-green-500 bg-green-500/10 border-green-500/30";
    case "B":
      return "text-blue-500 bg-blue-500/10 border-blue-500/30";
    case "C":
      return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
    case "D":
      return "text-orange-500 bg-orange-500/10 border-orange-500/30";
    case "F":
      return "text-red-500 bg-red-500/10 border-red-500/30";
    default:
      return "text-muted-foreground bg-muted border-muted";
  }
};

const getRecommendationStyle = (rec: string) => {
  switch (rec?.toUpperCase()) {
    case "PURSUE":
      return {
        color: "text-green-500",
        icon: CheckCircle2,
        bg: "bg-green-500/10",
      };
    case "EXPLORE":
      return { color: "text-blue-500", icon: Lightbulb, bg: "bg-blue-500/10" };
    case "CAUTION":
      return {
        color: "text-yellow-500",
        icon: AlertTriangle,
        bg: "bg-yellow-500/10",
      };
    case "AVOID":
      return { color: "text-red-500", icon: XCircle, bg: "bg-red-500/10" };
    default:
      return {
        color: "text-muted-foreground",
        icon: AlertCircle,
        bg: "bg-muted",
      };
  }
};

const getSentimentColor = (sentiment: string) => {
  switch (sentiment?.toLowerCase()) {
    case "positive":
      return "text-green-500";
    case "negative":
      return "text-red-500";
    default:
      return "text-muted-foreground";
  }
};

// ============================================================================
// SECTION COMPONENTS
// ============================================================================

// Data Quality Banner Component
function DataQualityBanner({
  dataQuality,
  tamConfidence,
  uniqueVoices,
}: {
  dataQuality?: string;
  tamConfidence?: string;
  uniqueVoices: number;
}) {
  const isLowDataQuality = dataQuality === "low";
  const isTAMLowConfidence = tamConfidence === "Low";

  if (!isLowDataQuality && !isTAMLowConfidence) return null;

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-medium text-amber-600 dark:text-amber-400">
          {isLowDataQuality
            ? "Low Data Reliability"
            : "Market Estimates Uncertain"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          ⚠️ <strong>Insights are provisional.</strong> Based on {uniqueVoices}{" "}
          validated discussion{uniqueVoices !== 1 ? "s" : ""}.
          {isTAMLowConfidence &&
            " TAM estimates have wide confidence intervals."}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Recommendations may change as more signals appear. Verify with
          independent research.
        </p>
      </div>
    </div>
  );
}

// Executive Verdict Section
function ExecutiveVerdictSection({
  data,
  metadata,
  grade,
  score,
}: {
  data: ExecutiveVerdict;
  metadata: ReportMetadata;
  grade: string;
  score: number;
}) {
  const style = getRecommendationStyle(data.recommendation);
  const Icon = style.icon;
  const sourcesAnalyzed = metadata.sources_analyzed || {};

  const [isNewMode, setIsNewMode] = React.useState(false);
  React.useEffect(() => {
    const cookieValue = document.cookie
      .split("; ")
      .find((row) => row.startsWith("IsNewChatPage="))
      ?.split("=")[1];
    if (cookieValue === "true") {
      setIsNewMode(true);
    }
  }, []);

  return (
    <Card
      className={cn(
        "transition-all duration-500",
        isNewMode
          ? "bg-white/[0.01] backdrop-blur-2xl border-white/[0.08] rounded-2xl shadow-2xl shadow-black/20 ring-1 ring-white/[0.05] ring-offset-0"
          : cn("border-2", getGradeColor(grade)),
      )}
    >
      <CardContent className="pt-4 sm:pt-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className={cn(
                "w-14 h-14 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-bold border-2",
                getGradeColor(grade),
              )}
            >
              {grade}
            </div>
            <div>
              <Badge
                className={cn(
                  "text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1",
                  style.bg,
                  style.color,
                )}
              >
                <Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {data.recommendation}
              </Badge>
              <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                <span>Score: {score}%</span>
                <span>•</span>
                <span className="hidden sm:inline">
                  {metadata.evidence_strength || "Unknown"} Evidence
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-base sm:text-lg font-semibold">
              {data.one_liner}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2">
              💡 {data.key_insight}
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
          <div className="text-center">
            <p className="text-lg sm:text-2xl font-bold">
              {sourcesAnalyzed.unique_voices || 0}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Sources
            </p>
          </div>
          <div className="text-center">
            <p className="text-lg sm:text-2xl font-bold">
              {sourcesAnalyzed.reddit_discussions || 0}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Reddit
            </p>
          </div>
          <div className="text-center">
            <p className="text-lg sm:text-2xl font-bold">
              {sourcesAnalyzed.hn_threads || 0}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">HN</p>
          </div>
          <div className="text-center">
            <p className="text-lg sm:text-2xl font-bold">
              {sourcesAnalyzed.pricing_datapoints || 0}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Pricing
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Problem Validation Section
function ProblemValidationSection({ data }: { data: ProblemValidation }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {data.problem_exists ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          Problem Validation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Problem Exists</span>
          <Badge variant={data.problem_exists ? "default" : "destructive"}>
            {data.problem_exists ? "Yes" : "No"}
          </Badge>
        </div>
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span>Severity Score</span>
            <span className="font-medium">{data.severity_score || 0}/10</span>
          </div>
          <Progress value={(data.severity_score || 0) * 10} className="h-2" />
        </div>

        {/* Frequency Signals */}
        {data.evidence?.frequency_signals?.length > 0 && (
          <div className="space-y-1 pt-2">
            <p className="text-xs font-medium text-muted-foreground">
              Frequency Signals:
            </p>
            {data.evidence.frequency_signals.map((signal, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                • {signal}
              </p>
            ))}
          </div>
        )}

        {/* Urgency Indicators */}
        {data.evidence?.urgency_indicators?.length > 0 && (
          <div className="space-y-1 pt-2">
            <p className="text-xs font-medium text-muted-foreground">
              Urgency Indicators:
            </p>
            {data.evidence.urgency_indicators.map((indicator, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                • {indicator}
              </p>
            ))}
          </div>
        )}

        {/* Pain Quotes */}
        {data.evidence?.pain_quotes?.length > 0 && (
          <div className="space-y-3 pt-3 border-t">
            <p className="text-xs font-medium flex items-center gap-2">
              <Quote className="h-3 w-3" /> Pain Quotes
            </p>
            {data.evidence.pain_quotes.slice(0, 5).map((quote, i) => (
              <div key={i} className="border-l-2 border-primary/30 pl-3 group">
                <p className="text-xs italic">"{quote.quote}"</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px]">
                    {quote.source}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" /> {quote.upvotes}
                  </span>
                  <a
                    href={quote.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Demand Signals Section
function DemandSignalsSection({ data }: { data: DemandSignals }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Demand Signals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{data.active_seekers || 0}</p>
            <p className="text-xs text-muted-foreground">Active Seekers</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{data.workaround_users || 0}</p>
            <p className="text-xs text-muted-foreground">Using Workarounds</p>
          </div>
        </div>

        {/* Workaround Descriptions */}
        {data.evidence?.workaround_descriptions?.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-medium mb-2">Current Workarounds:</p>
            <div className="flex flex-wrap gap-1">
              {data.evidence.workaround_descriptions.map((w, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {w.method} ({w.mentions})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Seeking Quotes */}
        {data.evidence?.seeking_quotes?.length > 0 && (
          <div className="space-y-3 pt-3 border-t">
            <p className="text-xs font-medium flex items-center gap-2">
              <MessageSquare className="h-3 w-3" /> People Seeking Solutions
            </p>
            {data.evidence.seeking_quotes.slice(0, 3).map((quote, i) => (
              <div key={i} className="border-l-2 border-blue-500/30 pl-3">
                <p className="text-xs font-medium line-clamp-2">
                  {quote.quote}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px]">
                    {quote.source}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" /> {quote.upvotes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> {quote.comments}
                  </span>
                  <a
                    href={quote.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Market Sizing Section
function MarketSizingSection({ data }: { data: MarketSizing }) {
  const isLowQuality = data.data_quality === "low";
  const isTAMLowConfidence = data.TAM?.confidence === "Low";

  return (
    <Card className={cn(isLowQuality && "border-amber-500/30")}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Market Sizing
          {isLowQuality && (
            <Badge
              variant="outline"
              className="text-amber-500 border-amber-500/50"
            >
              Low Reliability
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-xs">
          Methodology: {data.methodology || "AI-estimated"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {/* TAM */}
          <div
            className={cn(
              "p-3 rounded-lg",
              isTAMLowConfidence ? "bg-amber-500/10" : "bg-green-500/10",
            )}
          >
            <p className="text-xs text-muted-foreground mb-1">TAM</p>
            {isTAMLowConfidence && data.TAM?.low && data.TAM?.high ? (
              <>
                <p className="text-sm font-bold text-amber-500">
                  ${(data.TAM.low / 1e9).toFixed(1)}B - $
                  {(data.TAM.high / 1e9).toFixed(1)}B
                </p>
                <p className="text-[10px] text-amber-600">Wide range</p>
              </>
            ) : (
              <p className="text-lg font-bold text-green-500">
                {data.TAM?.value || "N/A"}
              </p>
            )}
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] mt-1",
                isTAMLowConfidence && "border-amber-500/50 text-amber-600",
              )}
            >
              {data.TAM?.confidence || "Unknown"}
            </Badge>
          </div>

          {/* SAM */}
          <div className="p-3 rounded-lg bg-blue-500/10">
            <p className="text-xs text-muted-foreground mb-1">SAM</p>
            <p className="text-lg font-bold text-blue-500">
              {data.SAM?.value || "N/A"}
            </p>
            {data.SAM?.notes && (
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                {data.SAM.notes}
              </p>
            )}
          </div>

          {/* SOM */}
          <div className="p-3 rounded-lg bg-purple-500/10">
            <p className="text-xs text-muted-foreground mb-1">SOM</p>
            <p className="text-lg font-bold text-purple-500">
              {data.SOM?.value || "N/A"}
            </p>
            {data.SOM?.notes && (
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                {data.SOM.notes}
              </p>
            )}
            {data.SOM?.calculation && (
              <p className="text-[10px] text-muted-foreground mt-1">
                {data.SOM.calculation}
              </p>
            )}
          </div>
        </div>

        {/* TAM Assumptions */}
        {data.TAM?.assumptions?.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium mb-1">Assumptions:</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {data.TAM.assumptions.map((assumption, i) => (
                <li key={i}>• {assumption}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Customer Profile Section
function CustomerProfileSection({ data }: { data: CustomerProfile }) {
  const persona = data.primary_persona;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Customer Profile
          <Badge variant="outline" className="text-xs">
            {data.evidence_count} signals
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Persona */}
        {persona && (
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <span className="font-medium">{persona.title}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                {persona.company_stage}
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {persona.company_size} employees
              </div>
            </div>

            {/* Pain Points */}
            {persona.pain_points?.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-medium mb-1">Pain Points:</p>
                <div className="flex flex-wrap gap-1">
                  {persona.pain_points.map((pain, i) => (
                    <Badge
                      key={i}
                      variant="destructive"
                      className="text-[10px]"
                    >
                      {pain}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Success Metrics */}
            {persona.success_metrics?.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-medium mb-1">Success Metrics:</p>
                <div className="flex flex-wrap gap-1">
                  {persona.success_metrics.map((metric, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-[10px] border-green-500/50 text-green-600"
                    >
                      {metric}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Role Distribution */}
        {data.role_distribution &&
          Object.keys(data.role_distribution).length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs font-medium mb-2">Role Distribution:</p>
              <div className="space-y-1">
                {Object.entries(data.role_distribution)
                  .sort((a, b) => b[1].percentage - a[1].percentage)
                  .slice(0, 5)
                  .map(([role, stats]) => (
                    <div key={role} className="flex items-center gap-2">
                      <span className="text-xs w-24 truncate">{role}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${stats.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {stats.percentage}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {/* Buying Triggers */}
        {data.buying_triggers?.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium mb-1">Buying Triggers:</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {data.buying_triggers.map((trigger, i) => (
                <li key={i} className="flex items-start gap-1">
                  <Zap className="h-3 w-3 text-yellow-500 shrink-0 mt-0.5" />
                  {trigger}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Common Objections */}
        {data.common_objections?.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium mb-1">Common Objections:</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {data.common_objections.map((objection, i) => (
                <li key={i} className="flex items-start gap-1">
                  <AlertCircle className="h-3 w-3 text-orange-500 shrink-0 mt-0.5" />
                  {objection}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Pricing Intelligence Section
function PricingIntelligenceSection({ data }: { data: PricingIntelligence }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Pricing Intelligence
          <Badge variant="outline" className="text-xs">
            {data.evidence_strength} Evidence
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Willingness to Pay */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-muted text-center">
            <p className="text-xs text-muted-foreground">Low</p>
            <p className="text-lg font-bold">
              {data.willingness_to_pay?.low_anchor || "N/A"}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <p className="text-xs text-muted-foreground">Median</p>
            <p className="text-lg font-bold text-green-500">
              {data.willingness_to_pay?.median || "N/A"}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted text-center">
            <p className="text-xs text-muted-foreground">High</p>
            <p className="text-lg font-bold">
              {data.willingness_to_pay?.high_anchor || "N/A"}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Based on {data.data_points} data points • Enterprise:{" "}
          {data.willingness_to_pay?.enterprise_mentions || "Not mentioned"}
        </p>

        {/* Pricing Strategy */}
        {data.pricing_strategy && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs font-medium mb-2 flex items-center gap-1">
              <Target className="h-3 w-3" />
              Recommended Strategy:{" "}
              {data.pricing_strategy.recommended_model ||
                data.pricing_strategy.model}
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Entry</p>
                <p className="font-bold">
                  ${data.pricing_strategy.entry_price}/mo
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Standard</p>
                <p className="font-bold">
                  ${data.pricing_strategy.standard_price}/mo
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Premium</p>
                <p className="font-bold">
                  ${data.pricing_strategy.premium_price}/mo
                </p>
              </div>
            </div>
            {data.pricing_strategy.rationale && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                {data.pricing_strategy.rationale}
              </p>
            )}
          </div>
        )}

        {/* Value Drivers */}
        {data.value_drivers?.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium mb-1">Value Drivers:</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {data.value_drivers.map((driver, i) => (
                <li key={i}>• {driver}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Objections */}
        {data.objections?.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium mb-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              Potential Objections:
            </p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {data.objections.map((objection, i) => (
                <li key={i}>• {objection}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Competitive Landscape Section
function CompetitiveLandscapeSection({ data }: { data: CompetitiveLandscape }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Competitive Landscape
          <Badge variant="outline" className="text-xs">
            {data.total_competitors_found} found
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Direct Competitors */}
        {data.direct_competitors?.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2">Direct Competitors:</p>
            <div className="space-y-2">
              {data.direct_competitors.slice(0, 5).map((comp, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-muted/50 flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{comp.name}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          getSentimentColor(comp.sentiment),
                        )}
                      >
                        {comp.sentiment}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {comp.mentions} mentions
                    </p>
                    {comp.strength && comp.strength !== "Unknown" && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ {comp.strength}
                      </p>
                    )}
                    {comp.weakness && comp.weakness !== "Unknown" && (
                      <p className="text-xs text-red-500">✗ {comp.weakness}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Market Gaps */}
        {data.market_gaps?.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium mb-2 flex items-center gap-1">
              <Lightbulb className="h-3 w-3 text-yellow-500" />
              Market Gaps (Opportunities):
            </p>
            <ul className="space-y-1">
              {data.market_gaps.map((gap, i) => (
                <li
                  key={i}
                  className="text-xs p-2 rounded bg-yellow-500/10 border border-yellow-500/20"
                >
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* DIY Alternatives */}
        {data.diy_alternatives?.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium mb-1">DIY Alternatives:</p>
            <div className="flex flex-wrap gap-1">
              {data.diy_alternatives.map((alt, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {alt}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Go-to-Market Section
function GoToMarketSection({ data }: { data: GoToMarket }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Rocket className="h-4 w-4" />
          Go-to-Market Strategy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Positioning */}
        {data.positioning && (
          <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
            <p className="text-lg font-semibold text-primary">
              "{data.positioning.tagline}"
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {data.positioning.unique_value_prop}
            </p>
            {data.positioning.avoid_saying && (
              <div className="mt-2 flex items-start gap-1 text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                <span>Avoid: {data.positioning.avoid_saying}</span>
              </div>
            )}
          </div>
        )}

        {/* MVP Features */}
        {data.mvp_features?.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2">MVP Features:</p>
            <div className="space-y-2">
              {data.mvp_features.map((feature, i) => (
                <div key={i} className="p-2 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">{feature.feature}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {feature.evidence}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Distribution Channels */}
        {data.distribution_channels?.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium mb-2">Distribution Channels:</p>
            <div className="space-y-2">
              {data.distribution_channels.map((channel, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/20"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-xs border-blue-500/50 text-blue-600"
                    >
                      {channel.channel}
                    </Badge>
                  </div>
                  <p className="text-xs mt-1">{channel.tactic}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 italic">
                    Why: {channel.why}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* First 30 Days */}
        {data.first_30_days?.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium mb-2 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              First 30 Days:
            </p>
            <ol className="space-y-1">
              {data.first_30_days.map((step, i) => (
                <li key={i} className="text-xs flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Risk Assessment Section
function RiskAssessmentSection({ data }: { data: RiskAssessment }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Risk Assessment
          <Badge variant="outline" className="text-xs">
            {data.confidence_level}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Major Risks */}
        {data.major_risks?.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2 text-red-500">
              Major Risks:
            </p>
            <ul className="space-y-1">
              {data.major_risks.map((risk, i) => (
                <li
                  key={i}
                  className="text-xs p-2 rounded bg-red-500/10 border border-red-500/20 flex items-start gap-2"
                >
                  <XCircle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Mitigations */}
        {data.mitigations?.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium mb-2 text-green-500">
              Mitigations:
            </p>
            <ul className="space-y-1">
              {data.mitigations.map((mitigation, i) => (
                <li
                  key={i}
                  className="text-xs p-2 rounded bg-green-500/10 border border-green-500/20 flex items-start gap-2"
                >
                  <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                  {mitigation}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendation */}
        {data.recommendation && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium mb-1">Recommendation:</p>
            <p className="text-sm p-2 rounded bg-primary/10 border border-primary/20">
              {data.recommendation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Evidence Appendix Section
function EvidenceAppendixSection({ data }: { data: EvidenceAppendix }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ExternalLink className="h-4 w-4" />
          Evidence Sources
          <Badge variant="outline" className="text-xs">
            {data.total_sources} total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.high_quality_sources?.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {data.high_quality_sources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                      {source.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">
                        {source.source}
                      </Badge>
                      <span>{source.relevance} relevant</span>
                      <span>{source.engagement} engagement</span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No high-quality sources available
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface ResearchReportProps {
  data: ValidationReportData;
}

export function ResearchReport({ data }: { data: ValidationReportData }) {
  const [isNewMode, setIsNewMode] = React.useState(false);
  React.useEffect(() => {
    const cookieValue = document.cookie
      .split("; ")
      .find((row) => row.startsWith("IsNewChatPage="))
      ?.split("=")[1];
    if (cookieValue === "true") {
      setIsNewMode(true);
    }
  }, []);

  if (!data || !data.full_report) return null;
  const fullReport = data.full_report;
  const metadata = fullReport.report_metadata;
  const uniqueVoices = metadata.sources_analyzed?.unique_voices || 0;

  return (
    <div
      className={cn(
        "space-y-4 sm:space-y-6",
        isNewMode && "selection:bg-emerald-500/20",
      )}
    >
      {/* Idea Submitted */}
      <Card
        className={cn(
          "transition-all duration-300",
          isNewMode
            ? "bg-white/[0.02] backdrop-blur-md border-white/[0.06] rounded-xl sm:rounded-2xl shadow-xl shadow-black/10"
            : "bg-muted/30",
        )}
      >
        <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">
            Idea Validated
          </p>
          <p className="font-medium text-sm sm:text-base">{data.idea_input}</p>
        </CardContent>
      </Card>

      {/* Data Quality Banner */}
      <DataQualityBanner
        dataQuality={fullReport.market_sizing?.data_quality}
        tamConfidence={fullReport.market_sizing?.TAM?.confidence}
        uniqueVoices={uniqueVoices}
      />

      {/* Executive Verdict */}
      <ExecutiveVerdictSection
        data={fullReport.executive_verdict}
        metadata={metadata}
        grade={data.confidence_grade}
        score={data.validation_score}
      />

      {/* Two Column Layout for Main Sections */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ProblemValidationSection data={fullReport.problem_validation} />
        <DemandSignalsSection data={fullReport.demand_signals} />
      </div>

      {/* Market Sizing - Full Width */}
      <MarketSizingSection data={fullReport.market_sizing} />

      {/* Two Column Layout */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CustomerProfileSection data={fullReport.customer_profile} />
        <PricingIntelligenceSection data={fullReport.pricing_intelligence} />
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CompetitiveLandscapeSection data={fullReport.competitive_landscape} />
        <GoToMarketSection data={fullReport.go_to_market} />
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RiskAssessmentSection data={fullReport.risk_assessment} />
        <EvidenceAppendixSection data={fullReport.evidence_appendix} />
      </div>

      {/* Report Metadata Footer */}
      <Card
        className={cn(
          "transition-all duration-300",
          isNewMode
            ? "bg-white/[0.02] backdrop-blur-md border-white/[0.06] rounded-xl sm:rounded-2xl"
            : "bg-muted/30",
        )}
      >
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>API v{metadata.api_version}</span>
              <span>{metadata.phases_completed} phases</span>
              <span>{metadata.execution_time_seconds}s analysis</span>
            </div>
            <span>
              Generated: {new Date(data.created_at).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ResearchReport;
