import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Loader2,
    AlertCircle,
    CheckCircle2,
    XCircle,
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
    AlertTriangle,
    ArrowLeft,
    Trash2,
    Plus,
    FileText,
    ChevronRight,
    Lock,
} from 'lucide-react';
import { problemsApi } from '@/api/problems';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to normalize report data - handles both list items and full report
function normalizeReport(rawReport: any) {
    // For list view items, data is at top level + full_report
    // For detail view, same structure
    const fullReport = rawReport.full_report || rawReport;

    return {
        id: rawReport.id,
        idea_input: rawReport.idea_input || fullReport.report_metadata?.idea_submitted || '',
        recommendation: rawReport.recommendation || fullReport.executive_verdict?.recommendation || '',
        confidence_grade: rawReport.confidence_grade || fullReport.report_metadata?.confidence_grade || '?',
        validation_score: rawReport.validation_score || fullReport.executive_verdict?.confidence_score || 0,
        one_liner: rawReport.one_liner || fullReport.executive_verdict?.one_liner || '',
        key_insight: rawReport.key_insight || fullReport.executive_verdict?.key_insight || '',
        evidence_count: rawReport.evidence_count || fullReport.evidence_appendix?.total_sources || 0,
        created_at: rawReport.created_at || fullReport.report_metadata?.research_completed || '',
        // Full nested report data
        report_metadata: fullReport.report_metadata || {},
        executive_verdict: fullReport.executive_verdict || {},
        problem_validation: fullReport.problem_validation || {},
        demand_signals: fullReport.demand_signals || {},
        competitive_landscape: fullReport.competitive_landscape || {},
        pricing_intelligence: fullReport.pricing_intelligence || {},
        customer_profile: fullReport.customer_profile || {},
        market_sizing: fullReport.market_sizing || {},
        go_to_market: fullReport.go_to_market || {},
        risk_assessment: fullReport.risk_assessment || {},
        evidence_appendix: fullReport.evidence_appendix || {},
    };
}

// Report Card for the list view
function ReportCard({ report: rawReport, onDelete }: { report: any; onDelete: (id: string) => void }) {
    const navigate = useNavigate();
    const report = normalizeReport(rawReport);

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'A': return 'text-green-500 bg-green-500/10';
            case 'B': return 'text-blue-500 bg-blue-500/10';
            case 'C': return 'text-yellow-500 bg-yellow-500/10';
            case 'D': return 'text-orange-500 bg-orange-500/10';
            case 'F': return 'text-red-500 bg-red-500/10';
            default: return 'text-muted-foreground bg-muted';
        }
    };

    const getRecommendationColor = (rec: string) => {
        switch (rec?.toUpperCase()) {
            case 'PURSUE': return 'default';
            case 'EXPLORE': return 'secondary';
            case 'CAUTION': return 'outline';
            case 'AVOID': return 'destructive';
            default: return 'secondary';
        }
    };

    const handleClick = () => navigate(`/dashboard/validate/${report.id}`);
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this validation report?')) {
            onDelete(report.id);
        }
    };

    const sourcesAnalyzed = report.report_metadata?.sources_analyzed || {};

    return (
        <Card
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group"
            onClick={handleClick}
        >
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    {/* Grade Badge */}
                    <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold shrink-0",
                        getGradeColor(report.confidence_grade)
                    )}>
                        {report.confidence_grade}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getRecommendationColor(report.recommendation) as any} className="text-xs">
                                {report.recommendation || 'Pending'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                Score: {report.validation_score}%
                            </span>
                        </div>
                        <p className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                            {report.idea_input || 'Untitled Report'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {report.one_liner}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{sourcesAnalyzed.reddit_discussions || 0} Reddit</span>
                            <span>{sourcesAnalyzed.hn_threads || 0} HN</span>
                            <span>{new Date(report.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Full Report Display Component
function ReportDisplay({ report: rawReport }: { report: any }) {
    const report = normalizeReport(rawReport);

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'A': return 'text-green-500 bg-green-500/10 border-green-500/30';
            case 'B': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
            case 'C': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
            case 'D': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
            case 'F': return 'text-red-500 bg-red-500/10 border-red-500/30';
            default: return 'text-muted-foreground bg-muted border-muted';
        }
    };

    const getRecommendationStyle = (rec: string) => {
        switch (rec?.toUpperCase()) {
            case 'PURSUE': return { color: 'text-green-500', icon: CheckCircle2, bg: 'bg-green-500/10' };
            case 'EXPLORE': return { color: 'text-blue-500', icon: Lightbulb, bg: 'bg-blue-500/10' };
            case 'CAUTION': return { color: 'text-yellow-500', icon: AlertTriangle, bg: 'bg-yellow-500/10' };
            case 'AVOID': return { color: 'text-red-500', icon: XCircle, bg: 'bg-red-500/10' };
            default: return { color: 'text-muted-foreground', icon: AlertCircle, bg: 'bg-muted' };
        }
    };

    const metadata = report.report_metadata || {};
    const verdict = report.executive_verdict || {};
    const problemValidation = report.problem_validation || {};
    const demandSignals = report.demand_signals || {};
    const competitiveLandscape = report.competitive_landscape || {};
    const pricingIntelligence = report.pricing_intelligence || {};
    const customerProfile = report.customer_profile || {};
    const marketSizing = report.market_sizing || {};
    const goToMarket = report.go_to_market || {};
    const riskAssessment = report.risk_assessment || {};
    const evidenceAppendix = report.evidence_appendix || {};

    const sourcesAnalyzed = metadata.sources_analyzed || {};

    return (
        <div className="space-y-6">
            {/* Idea Submitted */}
            <Card className="bg-muted/30">
                <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Idea Validated</p>
                    <p className="font-medium">{report.idea_input}</p>
                </CardContent>
            </Card>

            {/* Executive Summary */}
            <Card className={cn("border-2", getGradeColor(report.confidence_grade))}>
                <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-bold border-2",
                                getGradeColor(report.confidence_grade)
                            )}>
                                {report.confidence_grade}
                            </div>
                            <div>
                                {(() => {
                                    const style = getRecommendationStyle(report.recommendation);
                                    const Icon = style.icon;
                                    return (
                                        <Badge className={cn("text-sm px-3 py-1", style.bg, style.color)}>
                                            <Icon className="h-4 w-4 mr-1" />
                                            {report.recommendation}
                                        </Badge>
                                    );
                                })()}
                                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>Score: {report.validation_score}%</span>
                                    <span>•</span>
                                    <span>{metadata.evidence_strength || 'Unknown'} Evidence</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold">{report.one_liner}</h2>
                            <p className="text-sm text-muted-foreground mt-2">
                                💡 {report.key_insight}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                        <div className="text-center">
                            <p className="text-2xl font-bold">{sourcesAnalyzed.reddit_discussions || 0}</p>
                            <p className="text-xs text-muted-foreground">Reddit Discussions</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">{sourcesAnalyzed.hn_threads || 0}</p>
                            <p className="text-xs text-muted-foreground">HN Threads</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">{sourcesAnalyzed.pricing_datapoints || 0}</p>
                            <p className="text-xs text-muted-foreground">Pricing Data</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">{metadata.execution_time_seconds || 0}s</p>
                            <p className="text-xs text-muted-foreground">Analysis Time</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Detailed Tabs */}
            <Tabs defaultValue="validation" className="space-y-4">
                <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
                    <TabsTrigger value="validation">🎯 Validation</TabsTrigger>
                    <TabsTrigger value="market">📊 Market</TabsTrigger>
                    <TabsTrigger value="pricing">💰 Pricing</TabsTrigger>
                    <TabsTrigger value="customers">👥 Customers</TabsTrigger>
                    <TabsTrigger value="gtm">🚀 Go-to-Market</TabsTrigger>
                </TabsList>

                {/* Validation Tab */}
                <TabsContent value="validation" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    {problemValidation.problem_exists ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                    Problem Validation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Problem Exists</span>
                                    <Badge variant={problemValidation.problem_exists ? "default" : "destructive"}>
                                        {problemValidation.problem_exists ? "Yes" : "No"}
                                    </Badge>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span>Severity Score</span>
                                        <span className="font-medium">{problemValidation.severity_score || 0}/10</span>
                                    </div>
                                    <Progress value={(problemValidation.severity_score || 0) * 10} className="h-2" />
                                </div>
                                {problemValidation.evidence?.frequency_signals && (
                                    <div className="space-y-1 pt-2">
                                        {problemValidation.evidence.frequency_signals.map((signal: string, i: number) => (
                                            <p key={i} className="text-xs text-muted-foreground">• {signal}</p>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Demand Signals
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                        <p className="text-2xl font-bold">{demandSignals.active_seekers || 0}</p>
                                        <p className="text-xs text-muted-foreground">Active Seekers</p>
                                    </div>
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                        <p className="text-2xl font-bold">{demandSignals.workaround_users || 0}</p>
                                        <p className="text-xs text-muted-foreground">Using Workarounds</p>
                                    </div>
                                </div>
                                {demandSignals.evidence?.workaround_descriptions && (
                                    <div className="pt-2">
                                        <p className="text-xs font-medium mb-2">Current Workarounds:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {demandSignals.evidence.workaround_descriptions.map((w: any, i: number) => (
                                                <Badge key={i} variant="outline" className="text-xs">
                                                    {w.method} ({w.mentions})
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {problemValidation.evidence?.pain_quotes?.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Quote className="h-4 w-4" />
                                    Pain Quotes from Real Users
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {problemValidation.evidence.pain_quotes.slice(0, 4).map((quote: any, i: number) => (
                                    <div key={i} className="border-l-2 border-primary/30 pl-3">
                                        <p className="text-sm italic">"{quote.quote}"</p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                            <Badge variant="outline" className="text-xs">{quote.source}</Badge>
                                            <span className="flex items-center gap-1">
                                                <ThumbsUp className="h-3 w-3" /> {quote.upvotes}
                                            </span>
                                            <a href={quote.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Market Tab */}
                <TabsContent value="market" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>TAM</CardDescription>
                                <CardTitle className="text-2xl text-green-500">{marketSizing.TAM?.value || 'N/A'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Badge variant="outline">{marketSizing.TAM?.confidence || 'Unknown'} Confidence</Badge>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>SAM</CardDescription>
                                <CardTitle className="text-2xl">{marketSizing.SAM?.value || 'N/A'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">{marketSizing.SAM?.notes || ''}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>SOM (3-Year Target)</CardDescription>
                                <CardTitle className="text-2xl text-primary">{marketSizing.SOM?.value || 'N/A'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">{marketSizing.SOM?.notes || ''}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Competitive Landscape ({competitiveLandscape.total_competitors_found || 0} found)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {competitiveLandscape.direct_competitors?.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Direct Competitors</p>
                                    <div className="grid gap-2">
                                        {competitiveLandscape.direct_competitors.map((comp: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                                                <span className="font-medium">{comp.name}</span>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>{comp.mentions} mentions</span>
                                                    <Badge variant="outline" className="capitalize">{comp.sentiment}</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {competitiveLandscape.diy_alternatives?.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2">DIY Alternatives</p>
                                    <div className="flex flex-wrap gap-1">
                                        {competitiveLandscape.diy_alternatives.map((alt: string, i: number) => (
                                            <Badge key={i} variant="secondary">{alt}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {competitiveLandscape.market_gaps?.length > 0 && (
                                <div className="bg-primary/5 border border-primary/20 rounded p-3">
                                    <p className="text-xs font-medium text-primary mb-1">💡 Market Gaps</p>
                                    <ul className="text-sm space-y-1">
                                        {competitiveLandscape.market_gaps.map((gap: string, i: number) => (
                                            <li key={i}>• {gap}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Pricing Tab */}
                <TabsContent value="pricing" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-4">
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <p className="text-xs text-muted-foreground">Low Anchor</p>
                                <p className="text-2xl font-bold">{pricingIntelligence.willingness_to_pay?.low_anchor || 'N/A'}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-primary">
                            <CardContent className="pt-6 text-center">
                                <p className="text-xs text-muted-foreground">Median WTP</p>
                                <p className="text-2xl font-bold text-primary">{pricingIntelligence.willingness_to_pay?.median || 'N/A'}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <p className="text-xs text-muted-foreground">High Anchor</p>
                                <p className="text-2xl font-bold">{pricingIntelligence.willingness_to_pay?.high_anchor || 'N/A'}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <p className="text-xs text-muted-foreground">Data Points</p>
                                <p className="text-2xl font-bold">{pricingIntelligence.data_points || 0}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {pricingIntelligence.pricing_strategy && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    Recommended Pricing Strategy
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Badge>{pricingIntelligence.pricing_strategy.recommended_model}</Badge>
                                    <span className="text-sm text-muted-foreground">model recommended</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-4 border rounded-lg">
                                        <p className="text-xs text-muted-foreground">Entry</p>
                                        <p className="text-xl font-bold">${pricingIntelligence.pricing_strategy.entry_price}/mo</p>
                                    </div>
                                    <div className="text-center p-4 border-2 border-primary rounded-lg bg-primary/5">
                                        <p className="text-xs text-muted-foreground">Standard</p>
                                        <p className="text-xl font-bold text-primary">${pricingIntelligence.pricing_strategy.standard_price}/mo</p>
                                    </div>
                                    <div className="text-center p-4 border rounded-lg">
                                        <p className="text-xs text-muted-foreground">Premium</p>
                                        <p className="text-xl font-bold">${pricingIntelligence.pricing_strategy.premium_price}/mo</p>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">{pricingIntelligence.pricing_strategy.rationale}</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Customers Tab */}
                <TabsContent value="customers" className="space-y-4">
                    {customerProfile.primary_persona && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Primary Persona
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Users className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{customerProfile.primary_persona.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {customerProfile.primary_persona.company_stage} • {customerProfile.primary_persona.company_size} employees
                                        </p>
                                    </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {customerProfile.primary_persona.key_responsibilities?.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium mb-2">Key Responsibilities</p>
                                            <ul className="text-sm text-muted-foreground space-y-1">
                                                {customerProfile.primary_persona.key_responsibilities.map((r: string, i: number) => (
                                                    <li key={i}>• {r}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {customerProfile.primary_persona.pain_points?.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium mb-2">Pain Points</p>
                                            <ul className="text-sm text-muted-foreground space-y-1">
                                                {customerProfile.primary_persona.pain_points.map((p: string, i: number) => (
                                                    <li key={i}>• {p}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {customerProfile.role_distribution && Object.keys(customerProfile.role_distribution).length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4" />
                                    Role Distribution
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {Object.entries(customerProfile.role_distribution).map(([role, data]: [string, any]) => (
                                    <div key={role} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span>{role}</span>
                                            <span className="text-muted-foreground">{data.percentage}%</span>
                                        </div>
                                        <Progress value={data.percentage} className="h-2" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* GTM Tab */}
                <TabsContent value="gtm" className="space-y-4">
                    {goToMarket.positioning && (
                        <Card className="border-primary/30">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Rocket className="h-4 w-4 text-primary" />
                                    Positioning
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">Tagline</p>
                                    <p className="text-lg font-semibold">{goToMarket.positioning.tagline}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Value Proposition</p>
                                    <p className="text-sm">{goToMarket.positioning.unique_value_prop}</p>
                                </div>
                                {goToMarket.positioning.avoid_saying && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
                                        <p className="text-xs text-red-500">⚠️ Avoid: {goToMarket.positioning.avoid_saying}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid gap-4 lg:grid-cols-2">
                        {goToMarket.mvp_features?.length > 0 && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium">MVP Features</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {goToMarket.mvp_features.map((feature: any, i: number) => (
                                        <div key={i} className="p-3 bg-muted rounded">
                                            <p className="font-medium text-sm">{feature.feature}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{feature.evidence}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {goToMarket.distribution_channels?.length > 0 && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium">Distribution Channels</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {goToMarket.distribution_channels.map((channel: any, i: number) => (
                                        <div key={i} className="p-3 border rounded">
                                            <p className="font-medium text-sm">{channel.channel}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{channel.tactic}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {goToMarket.first_30_days?.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    First 30 Days
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ol className="space-y-2">
                                    {goToMarket.first_30_days.map((step: string, i: number) => (
                                        <li key={i} className="flex gap-3 text-sm">
                                            <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                                                {i + 1}
                                            </span>
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* Risk Assessment */}
            {(riskAssessment.major_risks?.length > 0 || riskAssessment.mitigations?.length > 0) && (
                <Card className="border-orange-500/30 bg-orange-500/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Shield className="h-4 w-4 text-orange-500" />
                            Risk Assessment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid gap-4 md:grid-cols-2">
                            {riskAssessment.major_risks?.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-orange-500 mb-2">Major Risks</p>
                                    <ul className="text-sm space-y-1">
                                        {riskAssessment.major_risks.map((risk: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                                                {risk}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {riskAssessment.mitigations?.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-green-500 mb-2">Mitigations</p>
                                    <ul className="text-sm space-y-1">
                                        {riskAssessment.mitigations.map((mit: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                                {mit}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        {riskAssessment.recommendation && (
                            <div className="pt-2 border-t">
                                <p className="text-sm">
                                    <strong>Recommendation:</strong> {riskAssessment.recommendation}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Evidence Sources */}
            {evidenceAppendix.high_quality_sources?.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Top Sources ({evidenceAppendix.total_sources || 0})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {evidenceAppendix.high_quality_sources.slice(0, 5).map((source: any, i: number) => (
                                <a
                                    key={i}
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 border rounded hover:border-primary/30 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{source.title}</p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                            <Badge variant="outline">{source.source}</Badge>
                                            <span>{source.engagement} engagement</span>
                                            <span>{source.relevance} relevant</span>
                                        </div>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                                </a>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Main Validate Page Component
export function Validate() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [problemText, setProblemText] = useState('');
    const [showForm, setShowForm] = useState(false);

    // Fetch reports list (only if authenticated)
    const { data: reportsData, isLoading: isLoadingReports } = useQuery({
        queryKey: ['validation-reports'],
        queryFn: () => problemsApi.getValidationReports(),
        enabled: !id && !!user,
    });

    // Fetch single report (only if authenticated)
    const { data: singleReport, isLoading: isLoadingReport } = useQuery({
        queryKey: ['validation-report', id],
        queryFn: () => problemsApi.getValidationReport(id!),
        enabled: !!id && !!user,
    });

    // Create new report
    const createMutation = useMutation({
        mutationFn: (text: string) => problemsApi.validateProblem(text),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['validation-reports'] });
            setShowForm(false);
            setProblemText('');
            // Navigate to the new report if it has an ID
            if (data?.id) {
                navigate(`/dashboard/validate/${data.id}`);
            }
        },
    });

    // Delete report
    const deleteMutation = useMutation({
        mutationFn: problemsApi.deleteValidationReport,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['validation-reports'] });
        },
    });

    // Auth check - show sign-in prompt for unauthenticated users
    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-20 max-w-md mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                >
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                        <Lock className="h-10 w-10 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
                        <p className="text-muted-foreground">
                            Create an account to research your startup ideas with AI-powered market validation.
                        </p>
                    </div>
                    <Button
                        onClick={() => navigate('/auth')}
                        className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-90 transition-opacity"
                    >
                        Sign In to Continue
                    </Button>
                </motion.div>
            </div>
        );
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (problemText.trim()) {
            createMutation.mutate(problemText.trim());
        }
    };

    const reports = reportsData?.items || [];

    // Single report detail view
    if (id) {
        if (isLoadingReport) {
            return (
                <div className="space-y-6 max-w-5xl mx-auto">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-20" />
                    </div>
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Skeleton className="h-40" />
                        <Skeleton className="h-40" />
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6 max-w-5xl mx-auto">
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/validate')} className="gap-2 -ml-2">
                    <ArrowLeft className="h-4 w-4" /> All Reports
                </Button>

                {singleReport ? (
                    <ReportDisplay report={singleReport} />
                ) : (
                    <Card className="border-destructive/50">
                        <CardContent className="py-8 text-center">
                            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
                            <h3 className="font-semibold">Report Not Found</h3>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    }

    // Reports list view
    return (
        <div className="space-y-8">
            {/* Hero Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-2xl mx-auto"
            >
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    Research{' '}
                    <span className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                        Your Ideas
                    </span>
                </h1>
                <p className="text-lg text-muted-foreground">
                    Test your startup ideas with AI-powered market research. {reports.length > 0 && `${reports.length} report${reports.length !== 1 ? 's' : ''} analyzed.`}
                </p>
            </motion.div>

            {/* New Validation Button */}
            {!showForm && !createMutation.isPending && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="flex justify-center"
                >
                    <Button
                        size="lg"
                        onClick={() => setShowForm(true)}
                        className="rounded-xl gap-2 shadow-lg shadow-primary/20"
                    >
                        <Zap className="h-5 w-5" />
                        Validate New Idea
                    </Button>
                </motion.div>
            )}

            {/* New Validation Form */}
            <AnimatePresence>
                {(showForm || createMutation.isPending) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-3xl mx-auto"
                    >
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-background to-muted/30 border border-border/50">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Textarea
                                    placeholder="Describe your startup idea, problem, or concept..."
                                    value={problemText}
                                    onChange={(e) => setProblemText(e.target.value)}
                                    className="min-h-[140px] resize-none rounded-xl bg-background border-border/50"
                                    disabled={createMutation.isPending}
                                    autoFocus
                                />
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">
                                        Be specific about the problem and target audience
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setShowForm(false)}
                                            disabled={createMutation.isPending}
                                            className="rounded-xl"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={!problemText.trim() || createMutation.isPending}
                                            className="rounded-xl gap-2"
                                        >
                                            {createMutation.isPending ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Analyzing...
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="h-4 w-4" />
                                                    Validate
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading State */}
            {createMutation.isPending && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-3xl mx-auto p-8 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border border-emerald-500/20 text-center"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                        <Loader2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                    </motion.div>
                    <h3 className="font-semibold text-lg">Analyzing Your Idea</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        Researching Reddit, Hacker News, and pricing data...
                    </p>
                    <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
                        <span>📊 Market Research</span>
                        <span>👥 Customer Analysis</span>
                        <span>💰 Pricing Intel</span>
                    </div>
                </motion.div>
            )}

            {/* Reports List */}
            {isLoadingReports ? (
                <div className="space-y-4 max-w-4xl mx-auto">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-6 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                            <div className="flex gap-4">
                                <Skeleton className="h-14 w-14 rounded-xl" />
                                <div className="flex-1">
                                    <Skeleton className="h-5 w-1/4 mb-3" />
                                    <Skeleton className="h-4 w-full mb-2" />
                                    <Skeleton className="h-4 w-2/3" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : reports.length > 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4 max-w-4xl mx-auto"
                >
                    <AnimatePresence>
                        {reports.map((report: any, index: number) => (
                            <motion.div
                                key={report.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <ReportCard
                                    report={report}
                                    onDelete={(id) => deleteMutation.mutate(id)}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            ) : !showForm && !createMutation.isPending && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16"
                >
                    <motion.div
                        initial={{ y: 10 }}
                        animate={{ y: [10, -10, 10] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 flex items-center justify-center mx-auto mb-8 border border-emerald-500/20"
                    >
                        <Zap className="h-12 w-12 text-emerald-500" />
                    </motion.div>
                    <h3 className="text-2xl font-semibold mb-3">No validation reports yet</h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                        Validate your first startup idea and get comprehensive market research, pricing intel, and go-to-market strategies.
                    </p>
                    <Button
                        size="lg"
                        onClick={() => setShowForm(true)}
                        className="rounded-xl gap-2"
                    >
                        <Zap className="h-5 w-5" />
                        Validate an Idea
                    </Button>
                </motion.div>
            )}
        </div>
    );
}

export default Validate;
