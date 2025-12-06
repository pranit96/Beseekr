import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { problemsApi } from '@/api/problems';
import type { ValidationReport } from '@/types/validation';
import { cn } from '@/lib/utils';

// Report Card for the list view
function ReportCard({ report, onDelete }: { report: any; onDelete: (id: string) => void }) {
    const navigate = useNavigate();

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

    const handleClick = () => navigate(`/dashboard/validate/${report.id}`);
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this validation report?')) {
            onDelete(report.id);
        }
    };

    const metadata = report.report_metadata || {};
    const verdict = report.executive_verdict || {};

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
                        getGradeColor(metadata.confidence_grade)
                    )}>
                        {metadata.confidence_grade || '?'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant={verdict.recommendation === 'PURSUE' ? 'default' : 'secondary'} className="text-xs">
                                {verdict.recommendation || 'Pending'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                {metadata.evidence_strength} Evidence
                            </span>
                        </div>
                        <p className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                            {metadata.idea_submitted || 'Untitled Report'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {verdict.one_liner}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{metadata.sources_analyzed?.reddit_discussions || 0} Reddit</span>
                            <span>{metadata.sources_analyzed?.hn_threads || 0} HN</span>
                            <span>{new Date(metadata.research_completed).toLocaleDateString()}</span>
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
function ReportDisplay({ report }: { report: ValidationReport }) {
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

    return (
        <div className="space-y-6">
            {/* Executive Summary */}
            <Card className={cn("border-2", getGradeColor(report.report_metadata.confidence_grade))}>
                <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-bold border-2",
                                getGradeColor(report.report_metadata.confidence_grade)
                            )}>
                                {report.report_metadata.confidence_grade}
                            </div>
                            <div>
                                {(() => {
                                    const style = getRecommendationStyle(report.executive_verdict.recommendation);
                                    const Icon = style.icon;
                                    return (
                                        <Badge className={cn("text-sm px-3 py-1", style.bg, style.color)}>
                                            <Icon className="h-4 w-4 mr-1" />
                                            {report.executive_verdict.recommendation}
                                        </Badge>
                                    );
                                })()}
                                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>Confidence: {report.executive_verdict.confidence_score}%</span>
                                    <span>•</span>
                                    <span>{report.report_metadata.evidence_strength} Evidence</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold">{report.executive_verdict.one_liner}</h2>
                            <p className="text-sm text-muted-foreground mt-2">
                                💡 {report.executive_verdict.key_insight}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                        <div className="text-center">
                            <p className="text-2xl font-bold">{report.report_metadata.sources_analyzed.reddit_discussions}</p>
                            <p className="text-xs text-muted-foreground">Reddit Discussions</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">{report.report_metadata.sources_analyzed.hn_threads}</p>
                            <p className="text-xs text-muted-foreground">HN Threads</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">{report.report_metadata.sources_analyzed.pricing_datapoints}</p>
                            <p className="text-xs text-muted-foreground">Pricing Data</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">{report.report_metadata.execution_time_seconds}s</p>
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
                                    {report.problem_validation.problem_exists ? (
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
                                    <Badge variant={report.problem_validation.problem_exists ? "default" : "destructive"}>
                                        {report.problem_validation.problem_exists ? "Yes" : "No"}
                                    </Badge>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span>Severity Score</span>
                                        <span className="font-medium">{report.problem_validation.severity_score}/10</span>
                                    </div>
                                    <Progress value={report.problem_validation.severity_score * 10} className="h-2" />
                                </div>
                                <div className="space-y-1 pt-2">
                                    {report.problem_validation.evidence.frequency_signals.map((signal, i) => (
                                        <p key={i} className="text-xs text-muted-foreground">• {signal}</p>
                                    ))}
                                </div>
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
                                        <p className="text-2xl font-bold">{report.demand_signals.active_seekers}</p>
                                        <p className="text-xs text-muted-foreground">Active Seekers</p>
                                    </div>
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                        <p className="text-2xl font-bold">{report.demand_signals.workaround_users}</p>
                                        <p className="text-xs text-muted-foreground">Using Workarounds</p>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <p className="text-xs font-medium mb-2">Current Workarounds:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {report.demand_signals.evidence.workaround_descriptions.map((w, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">
                                                {w.method} ({w.mentions})
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {report.problem_validation.evidence.pain_quotes.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Quote className="h-4 w-4" />
                                    Pain Quotes from Real Users
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {report.problem_validation.evidence.pain_quotes.slice(0, 4).map((quote, i) => (
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
                                <CardTitle className="text-2xl text-green-500">{report.market_sizing.TAM.value}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Badge variant="outline">{report.market_sizing.TAM.confidence} Confidence</Badge>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>SAM</CardDescription>
                                <CardTitle className="text-2xl">{report.market_sizing.SAM.value}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">{report.market_sizing.SAM.notes}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>SOM (3-Year Target)</CardDescription>
                                <CardTitle className="text-2xl text-primary">{report.market_sizing.SOM.value}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">{report.market_sizing.SOM.notes}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Competitive Landscape ({report.competitive_landscape.total_competitors_found} found)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {report.competitive_landscape.direct_competitors.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Direct Competitors</p>
                                    <div className="grid gap-2">
                                        {report.competitive_landscape.direct_competitors.map((comp, i) => (
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
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">DIY Alternatives</p>
                                <div className="flex flex-wrap gap-1">
                                    {report.competitive_landscape.diy_alternatives.map((alt, i) => (
                                        <Badge key={i} variant="secondary">{alt}</Badge>
                                    ))}
                                </div>
                            </div>
                            {report.competitive_landscape.market_gaps.length > 0 && (
                                <div className="bg-primary/5 border border-primary/20 rounded p-3">
                                    <p className="text-xs font-medium text-primary mb-1">💡 Market Gaps</p>
                                    <ul className="text-sm space-y-1">
                                        {report.competitive_landscape.market_gaps.map((gap, i) => (
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
                                <p className="text-2xl font-bold">{report.pricing_intelligence.willingness_to_pay.low_anchor}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-primary">
                            <CardContent className="pt-6 text-center">
                                <p className="text-xs text-muted-foreground">Median WTP</p>
                                <p className="text-2xl font-bold text-primary">{report.pricing_intelligence.willingness_to_pay.median}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <p className="text-xs text-muted-foreground">High Anchor</p>
                                <p className="text-2xl font-bold">{report.pricing_intelligence.willingness_to_pay.high_anchor}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <p className="text-xs text-muted-foreground">Data Points</p>
                                <p className="text-2xl font-bold">{report.pricing_intelligence.data_points}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Recommended Pricing Strategy
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Badge>{report.pricing_intelligence.pricing_strategy.recommended_model}</Badge>
                                <span className="text-sm text-muted-foreground">model recommended</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 border rounded-lg">
                                    <p className="text-xs text-muted-foreground">Entry</p>
                                    <p className="text-xl font-bold">${report.pricing_intelligence.pricing_strategy.entry_price}/mo</p>
                                </div>
                                <div className="text-center p-4 border-2 border-primary rounded-lg bg-primary/5">
                                    <p className="text-xs text-muted-foreground">Standard</p>
                                    <p className="text-xl font-bold text-primary">${report.pricing_intelligence.pricing_strategy.standard_price}/mo</p>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                    <p className="text-xs text-muted-foreground">Premium</p>
                                    <p className="text-xl font-bold">${report.pricing_intelligence.pricing_strategy.premium_price}/mo</p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{report.pricing_intelligence.pricing_strategy.rationale}</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Customers Tab */}
                <TabsContent value="customers" className="space-y-4">
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
                                    <p className="font-semibold">{report.customer_profile.primary_persona.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {report.customer_profile.primary_persona.company_stage} • {report.customer_profile.primary_persona.company_size} employees
                                    </p>
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <p className="text-xs font-medium mb-2">Key Responsibilities</p>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        {report.customer_profile.primary_persona.key_responsibilities.map((r, i) => (
                                            <li key={i}>• {r}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <p className="text-xs font-medium mb-2">Pain Points</p>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        {report.customer_profile.primary_persona.pain_points.map((p, i) => (
                                            <li key={i}>• {p}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Role Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {Object.entries(report.customer_profile.role_distribution).map(([role, data]) => (
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
                </TabsContent>

                {/* GTM Tab */}
                <TabsContent value="gtm" className="space-y-4">
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
                                <p className="text-lg font-semibold">{report.go_to_market.positioning.tagline}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Value Proposition</p>
                                <p className="text-sm">{report.go_to_market.positioning.unique_value_prop}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">MVP Features</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {report.go_to_market.mvp_features.map((feature, i) => (
                                    <div key={i} className="p-3 bg-muted rounded">
                                        <p className="font-medium text-sm">{feature.feature}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{feature.evidence}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Distribution Channels</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {report.go_to_market.distribution_channels.map((channel, i) => (
                                    <div key={i} className="p-3 border rounded">
                                        <p className="font-medium text-sm">{channel.channel}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{channel.tactic}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                First 30 Days
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ol className="space-y-2">
                                {report.go_to_market.first_30_days.map((step, i) => (
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
                </TabsContent>
            </Tabs>

            {/* Risk Assessment */}
            <Card className="border-orange-500/30 bg-orange-500/5">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4 text-orange-500" />
                        Risk Assessment
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-xs font-medium text-orange-500 mb-2">Major Risks</p>
                            <ul className="text-sm space-y-1">
                                {report.risk_assessment.major_risks.map((risk, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                                        {risk}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-green-500 mb-2">Mitigations</p>
                            <ul className="text-sm space-y-1">
                                {report.risk_assessment.mitigations.map((mit, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                        {mit}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="pt-2 border-t">
                        <p className="text-sm">
                            <strong>Recommendation:</strong> {report.risk_assessment.recommendation}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Evidence Sources */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Top Sources ({report.evidence_appendix.total_sources})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {report.evidence_appendix.high_quality_sources.slice(0, 5).map((source, i) => (
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
                                    </div>
                                </div>
                                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                            </a>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Main Validate Page Component
export function Validate() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [problemText, setProblemText] = useState('');
    const [showForm, setShowForm] = useState(false);

    // Fetch reports list
    const { data: reportsData, isLoading: isLoadingReports } = useQuery({
        queryKey: ['validation-reports'],
        queryFn: () => problemsApi.getValidationReports(),
        enabled: !id,
    });

    // Fetch single report
    const { data: singleReport, isLoading: isLoadingReport } = useQuery({
        queryKey: ['validation-report', id],
        queryFn: () => problemsApi.getValidationReport(id!),
        enabled: !!id,
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
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Idea Validation</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {reports.length} report{reports.length !== 1 ? 's' : ''} • Validate new ideas with AI research
                    </p>
                </div>
                <Button onClick={() => setShowForm(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Validation
                </Button>
            </div>

            {/* New Validation Form */}
            {(showForm || createMutation.isPending) && (
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Textarea
                                placeholder="Describe your startup idea, problem, or concept..."
                                value={problemText}
                                onChange={(e) => setProblemText(e.target.value)}
                                className="min-h-[120px] resize-none"
                                disabled={createMutation.isPending}
                                autoFocus
                            />
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                    Be specific about the problem and target audience
                                </p>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={createMutation.isPending}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={!problemText.trim() || createMutation.isPending}>
                                        {createMutation.isPending ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="h-4 w-4 mr-2" />
                                                Validate
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Loading State */}
            {createMutation.isPending && (
                <Card className="border-primary/30">
                    <CardContent className="py-12 text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                        <h3 className="font-semibold text-lg">Analyzing Your Idea</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            Researching Reddit, Hacker News, and pricing data...
                        </p>
                        <div className="flex justify-center gap-2 mt-4 text-xs text-muted-foreground">
                            <span>📊 Market Research</span>
                            <span>•</span>
                            <span>👥 Customer Analysis</span>
                            <span>•</span>
                            <span>💰 Pricing Intel</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Reports List */}
            {isLoadingReports ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardContent className="p-4">
                                <div className="flex gap-4">
                                    <Skeleton className="h-12 w-12 rounded-lg" />
                                    <div className="flex-1">
                                        <Skeleton className="h-4 w-1/4 mb-2" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : reports.length > 0 ? (
                <div className="space-y-3">
                    {reports.map((report: any) => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            onDelete={(id) => deleteMutation.mutate(id)}
                        />
                    ))}
                </div>
            ) : !showForm && (
                <Card>
                    <CardContent className="py-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-lg">No validation reports yet</h3>
                        <p className="text-sm text-muted-foreground mt-1 mb-4">
                            Validate your first startup idea to get comprehensive market research
                        </p>
                        <Button onClick={() => setShowForm(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Validate an Idea
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default Validate;
