import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    Loader2,
    AlertCircle,
    ArrowLeft,
    Bookmark,
    BookmarkCheck,
    TrendingUp,
    ThumbsUp,
    FileText,
    DollarSign,
    Users,
    BarChart3,
    ExternalLink,
    Quote,
    Target,
    Lightbulb,
    MessageSquare,
    Calendar,
    Zap,
    Info,
    CheckCircle2,
    AlertTriangle,
    Sparkles,
    Clock,
    Rocket,
    Shield,
    Code,
    Wrench,
    Copy,
    Check,
    XCircle,
    ArrowRight,
    ChevronRight,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from 'recharts';
import { problemsApi } from '@/api/problems';
import { cn } from '@/lib/utils';

export function ProblemDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {
        data: problem,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['problem', id],
        queryFn: () => problemsApi.getProblemDetails(id!),
        enabled: !!id,
        staleTime: 24 * 60 * 60 * 1000, // 24 hours - data won't refetch
        gcTime: 48 * 60 * 60 * 1000, // 48 hours - keep in cache
    });

    const { data: watchlistData } = useQuery({
        queryKey: ['watchlist'],
        queryFn: () => problemsApi.getWatchlist(),
    });

    const isInWatchlist = Array.isArray(watchlistData) && watchlistData.some((item) => item.problem_id === id);

    const addMutation = useMutation({
        mutationFn: problemsApi.addToWatchlist,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
    });

    const removeMutation = useMutation({
        mutationFn: problemsApi.removeFromWatchlist,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
    });

    const handleWatchlistToggle = () => {
        if (!id) return;
        isInWatchlist ? removeMutation.mutate(id) : addMutation.mutate(id);
    };

    const chartData = problem?.trend?.map((point) => ({
        date: new Date(point.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        frequency: point.frequency,
    })) || [];

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
        return `$${amount}`;
    };

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-green-500';
        if (score >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 70) return 'bg-green-500/10 border-green-500/20';
        if (score >= 50) return 'bg-yellow-500/10 border-yellow-500/20';
        return 'bg-red-500/10 border-red-500/20';
    };

    const getScoreLabel = (score: number): { label: string; color: string } => {
        if (score >= 80) return { label: 'Excellent', color: 'text-green-600 bg-green-500/10' };
        if (score >= 70) return { label: 'High', color: 'text-green-500 bg-green-500/10' };
        if (score >= 50) return { label: 'Moderate', color: 'text-yellow-500 bg-yellow-500/10' };
        if (score >= 30) return { label: 'Low', color: 'text-orange-500 bg-orange-500/10' };
        return { label: 'Critical', color: 'text-red-500 bg-red-500/10' };
    };

    const getUrgencyInsight = (frequency: number, sources: number) => {
        if (frequency >= 50 && sources >= 10) return 'High urgency - many users reporting this frequently';
        if (frequency >= 20 || sources >= 5) return 'Moderate urgency - recurring pain point';
        if (frequency >= 5) return 'Low urgency - occasional mentions';
        return 'Very low urgency - only a few mentions found';
    };

    // Determine overall verdict
    const getVerdict = () => {
        const brief = problem?.brief;
        if (!brief) {
            const metrics = problem?.metrics;
            const frequency = metrics?.frequency || 0;
            const sources = metrics?.source_count || 0;
            if (frequency >= 30 && sources >= 5) return { level: 'promising', label: 'Worth Exploring', color: 'green' };
            if (frequency >= 10) return { level: 'moderate', label: 'Moderate Potential', color: 'yellow' };
            return { level: 'low', label: 'Low Priority', color: 'orange' };
        }
        const score = brief.opportunity_score;
        if (score >= 75) return { level: 'strong', label: 'Strong Opportunity', color: 'green' };
        if (score >= 60) return { level: 'good', label: 'Good Potential', color: 'emerald' };
        if (score >= 45) return { level: 'moderate', label: 'Moderate Opportunity', color: 'yellow' };
        return { level: 'weak', label: 'Low Priority', color: 'orange' };
    };

    // Radar chart data for opportunity fingerprint
    const radarData = problem?.brief?.score_breakdown ? [
        { metric: 'Market', value: problem.brief.score_breakdown.market_size, fullMark: 100 },
        { metric: 'Gap', value: problem.brief.score_breakdown.competition_gap, fullMark: 100 },
        { metric: 'Urgency', value: problem.brief.score_breakdown.urgency, fullMark: 100 },
        { metric: 'Revenue', value: problem.brief.score_breakdown.monetization, fullMark: 100 },
        { metric: 'Execution', value: problem.brief.score_breakdown.execution, fullMark: 100 },
    ] : [];

    const metricDescriptions = {
        frequency: 'How often this problem is mentioned across platforms. Higher = more widespread pain.',
        upvotes: 'Community validation score. Higher upvotes = stronger resonance with users.',
        sources: 'Number of unique sources (posts, threads) mentioning this problem.',
        opportunity: 'AI-calculated score based on market size, competition, and urgency.',
        marketSize: 'Total Addressable Market (TAM) - estimated from industry reports.',
        competitionGap: 'How underserved this problem is by existing solutions.',
        urgency: 'Frequency + severity of complaints. High urgency = users actively seeking solutions.',
        monetization: 'Willingness to pay signals and pricing potential.',
        execution: 'How feasible it is to build a solution.'
    };

    const verdict = getVerdict();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <div className="grid gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
                </div>
            </div>
        );
    }

    if (isError || !problem) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Card className="border-destructive/50">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                        <h3 className="font-semibold text-lg">Problem not found</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {error instanceof Error ? error.message : 'This problem may have been removed'}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const brief = problem.brief;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 -ml-2">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                    variant={isInWatchlist ? 'secondary' : 'default'}
                    onClick={handleWatchlistToggle}
                    disabled={addMutation.isPending || removeMutation.isPending}
                    className="shrink-0 gap-2"
                >
                    {addMutation.isPending || removeMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isInWatchlist ? (
                        <BookmarkCheck className="h-4 w-4" />
                    ) : (
                        <Bookmark className="h-4 w-4" />
                    )}
                    {isInWatchlist ? 'Watching' : 'Watch'}
                </Button>
            </div>

            {/* Title Section */}
            <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    {problem.category && (
                        <Badge variant="default" className="text-xs capitalize">{problem.category}</Badge>
                    )}
                    {problem.domain?.map((d) => (
                        <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
                    ))}
                    {problem.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">{problem.title}</h1>
                <p className="mt-3 text-muted-foreground leading-relaxed">{problem.summary || problem.description}</p>
            </div>

            {/* ⚠️ DATA CONFIDENCE WARNING - Show if low confidence */}
            {problem.data_confidence && problem.data_confidence.level === 'low' && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-medium text-amber-600 dark:text-amber-400">Low Data Confidence</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {problem.data_confidence.disclaimer || 'Limited data volume - insights may be less reliable. More research recommended.'}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2">
                            {Object.entries(problem.data_confidence.factors).map(([key, factor]) => (
                                factor && (
                                    <span key={key} className="text-xs text-muted-foreground">
                                        {factor.label}: <span className={cn(
                                            factor.status === 'low' ? 'text-amber-500' :
                                                factor.status === 'medium' ? 'text-yellow-500' : 'text-green-500'
                                        )}>{factor.value}</span>
                                    </span>
                                )
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ✨ OPPORTUNITY INSIGHT SUMMARY - Decision Tool */}
            <Card className={cn(
                "border-2 relative overflow-hidden",
                verdict.color === 'green' ? "border-green-500/30 bg-gradient-to-r from-green-500/5 to-emerald-500/5" :
                    verdict.color === 'emerald' ? "border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-teal-500/5" :
                        verdict.color === 'yellow' ? "border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-amber-500/5" :
                            "border-orange-500/30 bg-gradient-to-r from-orange-500/5 to-red-500/5"
            )}>
                <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-4">
                        <div className={cn(
                            "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                            verdict.color === 'green' || verdict.color === 'emerald' ? "bg-green-500/20" :
                                verdict.color === 'yellow' ? "bg-yellow-500/20" : "bg-orange-500/20"
                        )}>
                            {verdict.level === 'strong' || verdict.level === 'good' ? (
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            ) : verdict.level === 'moderate' || verdict.level === 'promising' ? (
                                <Sparkles className="h-6 w-6 text-yellow-500" />
                            ) : (
                                <AlertTriangle className="h-6 w-6 text-orange-500" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-muted-foreground">Opportunity Insight</span>
                                <Badge className={cn(
                                    "text-xs font-semibold",
                                    verdict.color === 'green' || verdict.color === 'emerald' ? "bg-green-500 hover:bg-green-600" :
                                        verdict.color === 'yellow' ? "bg-yellow-500 text-black hover:bg-yellow-600" :
                                            "bg-orange-500 hover:bg-orange-600"
                                )}>
                                    {verdict.label}
                                </Badge>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">
                                {problem.tags?.[0] && `${problem.tags[0]} teams `}
                                {problem.metrics?.frequency && problem.metrics.frequency >= 20
                                    ? 'frequently struggle with'
                                    : 'occasionally face challenges with'} this problem.
                                {brief?.score_breakdown && (
                                    <span className="block mt-1">
                                        Pain level is {getScoreLabel(brief.score_breakdown.urgency).label.toLowerCase()},
                                        urgency is {getScoreLabel(brief.score_breakdown.urgency).label.toLowerCase()},
                                        {brief.score_breakdown.competition_gap >= 60 ? ' but competition gap is high.' : ' and competition gap is moderate.'}
                                    </span>
                                )}
                            </p>
                            {brief?.opportunity_score && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    <strong>Potential outcome:</strong> {
                                        brief.opportunity_score >= 70
                                            ? `High-value opportunity for ${brief.target_audience?.primary?.company_size || 'mid-size'} ${problem.tags?.[0] || 'companies'}`
                                            : brief.opportunity_score >= 50
                                                ? `Niche opportunity worth exploring for specialized teams`
                                                : `Consider only if you have domain expertise in ${problem.tags?.[0] || 'this space'}`
                                    }
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Key Metrics with Tooltips */}
            <div className="grid gap-3 md:grid-cols-4">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Card className="cursor-help hover:border-blue-500/30 transition-colors">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-blue-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-2xl font-bold">{problem.metrics?.frequency || 0}</p>
                                        <Badge variant="outline" className={cn(
                                            "text-[10px]",
                                            (problem.metrics?.frequency || 0) >= 30 ? "border-green-500/50 text-green-500" :
                                                (problem.metrics?.frequency || 0) >= 10 ? "border-yellow-500/50 text-yellow-500" :
                                                    "border-orange-500/50 text-orange-500"
                                        )}>
                                            {(problem.metrics?.frequency || 0) >= 30 ? 'High' : (problem.metrics?.frequency || 0) >= 10 ? 'Moderate' : 'Low'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        Frequency <Info className="h-3 w-3" />
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-sm">{metricDescriptions.frequency}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {(problem.metrics?.frequency || 0) >= 30 ? '✓ High frequency = widespread pain point' :
                                (problem.metrics?.frequency || 0) >= 10 ? '~ Moderate = recurring issue' :
                                    '⚠ Low = only occasional mentions'}
                        </p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Card className="cursor-help hover:border-purple-500/30 transition-colors">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <ThumbsUp className="h-5 w-5 text-purple-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-2xl font-bold">{problem.metrics?.upvote_score || 0}</p>
                                        <Badge variant="outline" className={cn(
                                            "text-[10px]",
                                            (problem.metrics?.upvote_score || 0) >= 100 ? "border-green-500/50 text-green-500" :
                                                (problem.metrics?.upvote_score || 0) >= 20 ? "border-yellow-500/50 text-yellow-500" :
                                                    "border-muted-foreground/50 text-muted-foreground"
                                        )}>
                                            {(problem.metrics?.upvote_score || 0) >= 100 ? 'Strong' : (problem.metrics?.upvote_score || 0) >= 20 ? 'Good' : 'Limited'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        Upvotes <Info className="h-3 w-3" />
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-sm">{metricDescriptions.upvotes}</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Card className="cursor-help hover:border-green-500/30 transition-colors">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-green-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-2xl font-bold">{problem.metrics?.source_count || 0}</p>
                                        <Badge variant="outline" className={cn(
                                            "text-[10px]",
                                            (problem.metrics?.source_count || 0) >= 10 ? "border-green-500/50 text-green-500" :
                                                (problem.metrics?.source_count || 0) >= 3 ? "border-yellow-500/50 text-yellow-500" :
                                                    "border-muted-foreground/50 text-muted-foreground"
                                        )}>
                                            {(problem.metrics?.source_count || 0) >= 10 ? 'Many' : (problem.metrics?.source_count || 0) >= 3 ? 'Some' : 'Few'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        Sources <Info className="h-3 w-3" />
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-sm">{metricDescriptions.sources}</p>
                    </TooltipContent>
                </Tooltip>

                {brief && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Card className={cn("cursor-help border-primary/30", getScoreBgColor(brief.opportunity_score))}>
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                        <Zap className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className={cn("text-2xl font-bold", getScoreColor(brief.opportunity_score))}>
                                                {brief.opportunity_score}
                                            </p>
                                            <Badge variant="outline" className={cn("text-[10px]", getScoreLabel(brief.opportunity_score).color)}>
                                                {getScoreLabel(brief.opportunity_score).label}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            Opportunity Score <Info className="h-3 w-3" />
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                            <p className="text-sm">{metricDescriptions.opportunity}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Score combines market size, urgency, competition gap, and monetization potential.
                            </p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>

            {/* 📊 NEW: MARKET SIZING + BUILD ESTIMATE + GO-TO-MARKET */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Market Sizing Funnel */}
                {problem.market_sizing && (
                    <Card className="border-green-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-500" />
                                Market Opportunity
                                {problem.market_sizing.growth_rate && (
                                    <Badge variant="outline" className="ml-auto text-xs text-green-600">
                                        {problem.market_sizing.growth_rate.display} growth
                                    </Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* TAM */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                                <div>
                                    <p className="text-xs text-muted-foreground">TAM (Total Market)</p>
                                    <p className="text-xl font-bold text-green-600">{problem.market_sizing.tam.display}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                            {/* SAM */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 ml-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">SAM (Serviceable)</p>
                                    <p className="text-lg font-bold text-emerald-600">{problem.market_sizing.sam.display}</p>
                                    {problem.market_sizing.sam.multiplier && (
                                        <p className="text-[10px] text-muted-foreground">{problem.market_sizing.sam.multiplier}</p>
                                    )}
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                            {/* SOM */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-teal-500/5 border border-teal-500/20 ml-8">
                                <div>
                                    <p className="text-xs text-muted-foreground">SOM (Obtainable)</p>
                                    <p className="text-lg font-bold text-teal-600">{problem.market_sizing.som.display}</p>
                                    <p className="text-[10px] text-muted-foreground">Your realistic target</p>
                                </div>
                                <Target className="h-4 w-4 text-teal-500" />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Build Estimate */}
                {problem.build_estimate && (
                    <Card className="border-blue-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Wrench className="h-4 w-4 text-blue-500" />
                                Build Estimate
                                <Badge variant="outline" className={cn(
                                    "ml-auto text-xs",
                                    problem.build_estimate.complexity === 'low' ? 'text-green-600' :
                                        problem.build_estimate.complexity === 'medium' ? 'text-yellow-600' : 'text-red-600'
                                )}>
                                    {problem.build_estimate.complexity} complexity
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-blue-500/5">
                                    <div className="flex items-center gap-2 text-blue-500">
                                        <Clock className="h-4 w-4" />
                                        <span className="text-xs font-medium">MVP Time</span>
                                    </div>
                                    <p className="text-xl font-bold mt-1">{problem.build_estimate.mvp_weeks} weeks</p>
                                </div>
                                <div className="p-3 rounded-lg bg-blue-500/5">
                                    <div className="flex items-center gap-2 text-blue-500">
                                        <Users className="h-4 w-4" />
                                        <span className="text-xs font-medium">Solo Founder?</span>
                                    </div>
                                    <p className="text-lg font-bold mt-1 flex items-center gap-1">
                                        {problem.build_estimate.solo_founder_feasible ? (
                                            <><CheckCircle2 className="h-4 w-4 text-green-500" /> Yes</>
                                        ) : (
                                            <><XCircle className="h-4 w-4 text-red-500" /> No</>
                                        )}
                                    </p>
                                </div>
                            </div>
                            {problem.build_estimate.cost_estimate && (
                                <div className="p-3 rounded-lg border">
                                    <p className="text-xs text-muted-foreground mb-2">Estimated Cost</p>
                                    <div className="flex gap-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Solo</p>
                                            <p className="text-sm font-medium">{problem.build_estimate.cost_estimate.solo}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Outsourced</p>
                                            <p className="text-sm font-medium">{problem.build_estimate.cost_estimate.outsourced}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {problem.build_estimate.suggested_stack && (
                                <div className="flex flex-wrap gap-1">
                                    {problem.build_estimate.suggested_stack.map((tech) => (
                                        <Badge key={tech} variant="secondary" className="text-xs">
                                            <Code className="h-3 w-3 mr-1" />{tech}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            {!problem.build_estimate.solo_founder_feasible && problem.build_estimate.team_recommendation && (
                                <p className="text-xs text-amber-600">💡 {problem.build_estimate.team_recommendation}</p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* 🚀 GO-TO-MARKET TACTICS */}
            {problem.go_to_market && (
                <Card className="border-purple-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Rocket className="h-4 w-4 text-purple-500" />
                            Go-to-Market Tactics
                            {problem.go_to_market.launch_platform && (
                                <Badge variant="outline" className="ml-auto text-xs text-purple-600">
                                    Launch via {problem.go_to_market.launch_platform}
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="multiple" defaultValue={['customers']} className="space-y-2">
                            {problem.go_to_market.first_10_customers?.length > 0 && (
                                <AccordionItem value="customers" className="border rounded-lg px-4">
                                    <AccordionTrigger className="text-sm font-medium py-3">
                                        <div className="flex items-center gap-2">
                                            <Target className="h-4 w-4 text-green-500" />
                                            First 10 Customers
                                            <Badge variant="outline" className="ml-2 text-xs">{problem.go_to_market.first_10_customers.length}</Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-4 space-y-2">
                                        {problem.go_to_market.first_10_customers.map((tactic, idx) => (
                                            <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-green-500/5">
                                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                                <p className="text-sm">{tactic}</p>
                                            </div>
                                        ))}
                                    </AccordionContent>
                                </AccordionItem>
                            )}
                            {problem.go_to_market.communities?.length > 0 && (
                                <AccordionItem value="communities" className="border rounded-lg px-4">
                                    <AccordionTrigger className="text-sm font-medium py-3">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-blue-500" />
                                            Target Communities
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-4">
                                        <div className="flex flex-wrap gap-2">
                                            {problem.go_to_market.communities.map((community) => (
                                                <Badge key={community} variant="secondary" className="text-xs">{community}</Badge>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )}
                            {problem.go_to_market.content_hooks?.length > 0 && (
                                <AccordionItem value="content" className="border rounded-lg px-4">
                                    <AccordionTrigger className="text-sm font-medium py-3">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-amber-500" />
                                            Content Hooks
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-4 space-y-2">
                                        {problem.go_to_market.content_hooks.map((hook, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg border group">
                                                <p className="text-sm flex-1">{hook}</p>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs opacity-60 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(hook);
                                                        // Show temporary feedback
                                                        const btn = document.activeElement as HTMLButtonElement;
                                                        if (btn) {
                                                            const originalText = btn.innerHTML;
                                                            btn.innerHTML = '<span class="text-green-500">✓ Copied!</span>';
                                                            setTimeout(() => { btn.innerHTML = originalText; }, 1500);
                                                        }
                                                    }}
                                                >
                                                    <Copy className="h-3 w-3 mr-1" /> Copy
                                                </Button>
                                            </div>
                                        ))}
                                    </AccordionContent>
                                </AccordionItem>
                            )}
                        </Accordion>
                        {problem.go_to_market.competitor_strategy && (
                            <p className="text-xs text-muted-foreground mt-3 p-2 bg-muted/50 rounded">
                                💡 {problem.go_to_market.competitor_strategy}
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ✅ VALIDATION STRENGTH */}
            {problem.validation_strength && (
                <Card className="border-amber-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Shield className="h-4 w-4 text-amber-500" />
                            Validation Strength
                            <Badge variant="outline" className={cn(
                                "ml-auto text-xs",
                                problem.validation_strength.score >= 60 ? 'text-green-600' :
                                    problem.validation_strength.score >= 40 ? 'text-yellow-600' : 'text-red-600'
                            )}>
                                {problem.validation_strength.score}/{problem.validation_strength.max_score}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Verdict */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5">
                            {problem.validation_strength.score >= 60 ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : problem.validation_strength.score >= 40 ? (
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <div>
                                <p className="font-medium">{problem.validation_strength.verdict}</p>
                                {problem.validation_strength.recommendation && (
                                    <p className="text-xs text-muted-foreground">{problem.validation_strength.recommendation}</p>
                                )}
                            </div>
                        </div>

                        {/* Breakdown Bars */}
                        <div className="space-y-2">
                            {Object.entries(problem.validation_strength.breakdown).map(([key, value]) => (
                                <div key={key} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="capitalize text-muted-foreground">{key.replace('_', ' ')}</span>
                                        <span className="font-medium">{value}</span>
                                    </div>
                                    <Progress value={value} className="h-1.5" />
                                </div>
                            ))}
                        </div>

                        {/* Missing Items Checklist */}
                        {problem.validation_strength.missing && problem.validation_strength.missing.length > 0 && (
                            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                                <p className="text-xs font-medium text-red-600 mb-2">⚠️ Missing Validation</p>
                                <ul className="space-y-1">
                                    {problem.validation_strength.missing.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                                            <XCircle className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* 🏢 COMPETITOR INTELLIGENCE */}
            {problem.competitor_intel && (
                <Card className="border-violet-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-4 w-4 text-violet-500" />
                            Competitor Intelligence
                            <Badge variant="outline" className="ml-auto text-xs">
                                {problem.competitor_intel.total_competitors} competitors
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Direct Competitors Grid */}
                        {problem.competitor_intel.direct && problem.competitor_intel.direct.length > 0 && (
                            <div className="grid gap-3 md:grid-cols-2">
                                {problem.competitor_intel.direct.map((comp, idx) => (
                                    <div key={comp.name || idx} className="p-3 rounded-lg border space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-sm">{comp.name}</span>
                                            <Badge variant="outline" className={cn(
                                                "text-[10px]",
                                                comp.sentiment === 'positive' ? 'text-green-600' :
                                                    comp.sentiment === 'negative' ? 'text-red-600' : 'text-yellow-600'
                                            )}>
                                                {comp.sentiment}
                                            </Badge>
                                        </div>
                                        {comp.strengths && comp.strengths.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {comp.strengths.slice(0, 2).map((s) => (
                                                    <Badge key={s} variant="secondary" className="text-[10px] bg-green-500/10 text-green-600">
                                                        + {s}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        {comp.weaknesses && comp.weaknesses.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {comp.weaknesses.slice(0, 2).map((w) => (
                                                    <Badge key={w} variant="secondary" className="text-[10px] bg-red-500/10 text-red-600">
                                                        - {w}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Market Gaps */}
                        {problem.competitor_intel.gaps && problem.competitor_intel.gaps.length > 0 && (
                            <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                                <p className="text-xs font-medium text-green-600 mb-2">🎯 Market Gaps to Exploit</p>
                                <ul className="space-y-1">
                                    {problem.competitor_intel.gaps.map((gap, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-xs">
                                            <ArrowRight className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                                            {gap}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Pain Points */}
                        {problem.competitor_intel.pain_points && problem.competitor_intel.pain_points.length > 0 && (
                            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                                <p className="text-xs font-medium text-amber-600 mb-2">😤 User Pain Points</p>
                                <div className="flex flex-wrap gap-2">
                                    {problem.competitor_intel.pain_points.map((pain) => (
                                        <Badge key={pain} variant="outline" className="text-xs">
                                            {pain}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Positioning */}
                        {problem.competitor_intel.positioning && (
                            <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                                💡 <strong>Positioning:</strong> {problem.competitor_intel.positioning}
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Main Content Tabs */}
            <Tabs defaultValue={brief ? "brief" : "details"} className="space-y-4">
                <TabsList>
                    {brief && <TabsTrigger value="brief">📊 Brief</TabsTrigger>}
                    <TabsTrigger value="details">📝 Details</TabsTrigger>
                    <TabsTrigger value="sources">💬 Sources ({problem.sources?.length || 0})</TabsTrigger>
                </TabsList>

                {/* Brief Tab */}
                {brief && (
                    <TabsContent value="brief" className="space-y-6">
                        {/* Score Breakdown + Radar Chart */}
                        <div className="grid gap-4 lg:grid-cols-2">
                            {/* Score Breakdown with Labels */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4" /> Score Breakdown
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {brief.score_breakdown && Object.entries({
                                        'Market Size': { score: brief.score_breakdown.market_size, desc: metricDescriptions.marketSize },
                                        'Competition Gap': { score: brief.score_breakdown.competition_gap, desc: metricDescriptions.competitionGap },
                                        'Urgency': { score: brief.score_breakdown.urgency, desc: metricDescriptions.urgency },
                                        'Monetization': { score: brief.score_breakdown.monetization, desc: metricDescriptions.monetization },
                                        'Execution': { score: brief.score_breakdown.execution, desc: metricDescriptions.execution },
                                    }).map(([label, { score, desc }]) => {
                                        const scoreInfo = getScoreLabel(score);
                                        return (
                                            <Tooltip key={label}>
                                                <TooltipTrigger asChild>
                                                    <div className="space-y-1 cursor-help">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="flex items-center gap-1">
                                                                {label} <Info className="h-3 w-3 text-muted-foreground" />
                                                            </span>
                                                            <span className="flex items-center gap-2">
                                                                <Badge variant="outline" className={cn("text-[10px] px-1.5", scoreInfo.color)}>
                                                                    {scoreInfo.label}
                                                                </Badge>
                                                                <span className={getScoreColor(score)}>{score}/100</span>
                                                            </span>
                                                        </div>
                                                        <Progress value={score} className={cn(
                                                            "h-2",
                                                            score >= 70 ? "[&>div]:bg-green-500" :
                                                                score >= 50 ? "[&>div]:bg-yellow-500" :
                                                                    "[&>div]:bg-orange-500"
                                                        )} />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="left" className="max-w-xs">
                                                    <p className="text-sm">{desc}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    })}
                                </CardContent>
                            </Card>

                            {/* Opportunity Fingerprint - Radar Chart */}
                            {radarData.length > 0 && (
                                <Card className="border-primary/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-primary" /> Opportunity Fingerprint
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground">Visual signature of this opportunity</p>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="h-[200px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart data={radarData} margin={{ top: 5, right: 25, bottom: 5, left: 25 }}>
                                                    <PolarGrid stroke="hsl(var(--border))" />
                                                    <PolarAngleAxis
                                                        dataKey="metric"
                                                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                                        tickLine={false}
                                                    />
                                                    <PolarRadiusAxis
                                                        angle={90}
                                                        domain={[0, 100]}
                                                        tick={{ fontSize: 9 }}
                                                        tickCount={4}
                                                        axisLine={false}
                                                    />
                                                    <Radar
                                                        name="Score"
                                                        dataKey="value"
                                                        stroke="hsl(var(--primary))"
                                                        fill="hsl(var(--primary))"
                                                        fillOpacity={0.25}
                                                        strokeWidth={2}
                                                    />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Target Audience & Market Validation */}
                        <div className="grid gap-4 lg:grid-cols-2">
                            {/* Target Audience */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <Target className="h-4 w-4" /> Target Audience
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-muted-foreground text-xs">Role</p>
                                            <p className="font-medium">{brief.target_audience?.primary?.role || 'Unknown'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs">Company Size</p>
                                            <p className="font-medium">{brief.target_audience?.primary?.company_size || 'Unknown'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs">Industry</p>
                                            <p className="font-medium">{brief.target_audience?.primary?.industry || 'Unknown'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs">Pain Level</p>
                                            <p className="font-medium">{brief.target_audience?.primary?.pain_level || 0}/10</p>
                                        </div>
                                    </div>
                                    {brief.target_audience?.budget_range && (
                                        <div className="pt-2 border-t">
                                            <p className="text-muted-foreground text-xs">Budget Range</p>
                                            <p className="font-medium">
                                                {formatCurrency(brief.target_audience.budget_range.min)} - {formatCurrency(brief.target_audience.budget_range.max)}/mo
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Market Validation */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" /> Market Validation
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {brief.market_validation?.tam && (
                                        <div>
                                            <p className="text-muted-foreground text-xs">Total Addressable Market</p>
                                            <p className="text-2xl font-bold text-primary">
                                                {formatCurrency(brief.market_validation.tam.size)}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {brief.market_validation.tam.source}
                                            </p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t">
                                        <div>
                                            <p className="text-muted-foreground text-xs">Competition</p>
                                            <Badge variant="outline" className="capitalize">
                                                {brief.market_validation?.competition?.level || 'Unknown'}
                                            </Badge>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs">Momentum</p>
                                            <p className="font-medium capitalize">{brief.market_validation?.trends?.momentum || 'Stable'}</p>
                                        </div>
                                    </div>
                                    {brief.market_validation?.competition?.gaps?.length > 0 && (
                                        <div className="pt-2 border-t">
                                            <p className="text-muted-foreground text-xs mb-1">Market Gaps</p>
                                            <ul className="text-sm space-y-1">
                                                {brief.market_validation.competition.gaps.map((gap, i) => (
                                                    <li key={i} className="text-muted-foreground">• {gap}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recommended Approach */}
                        {brief.recommended_approach && (
                            <Card className="border-primary/30">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <Lightbulb className="h-4 w-4 text-primary" /> Recommended Approach
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        {brief.recommended_approach.split('\n\n').map((para, i) => (
                                            <p key={i} className="text-sm text-muted-foreground mb-3 last:mb-0">
                                                {para}
                                            </p>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                )}

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-4">
                    {/* Trend Chart - Always visible */}
                    {chartData.length > 0 && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Frequency Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[180px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <RechartsTooltip />
                                            <Line type="monotone" dataKey="frequency" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Collapsible Sections - Scan & Expand */}
                    <Accordion type="multiple" defaultValue={['market']} className="space-y-2">
                        {/* Market Estimate */}
                        {problem.market_estimate?.size && (
                            <AccordionItem value="market" className="border rounded-lg px-4">
                                <AccordionTrigger className="text-sm font-medium py-3">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-green-500" />
                                        Market Estimate
                                        <Badge variant="outline" className="ml-2 text-xs text-green-600">{problem.market_estimate.size}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                    <p className="text-2xl font-bold text-green-600">{problem.market_estimate.size}</p>
                                    {problem.market_estimate.sources && problem.market_estimate.sources.length > 0 && (
                                        <p className="text-xs text-muted-foreground mt-1">Source: {problem.market_estimate.sources[0]}</p>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        )}

                        {/* Competitors */}
                        {problem.competitors && problem.competitors.length > 0 && (
                            <AccordionItem value="competitors" className="border rounded-lg px-4">
                                <AccordionTrigger className="text-sm font-medium py-3">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-blue-500" />
                                        Competitors
                                        <Badge variant="outline" className="ml-2 text-xs">{problem.competitors.length}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4 space-y-3">
                                    {problem.competitors.map((comp, idx) => (
                                        <div key={comp.name || idx} className="border rounded-lg p-3 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm">{comp.name}</span>
                                                {comp.competitor_type && (
                                                    <Badge variant="outline" className="text-xs capitalize">{comp.competitor_type}</Badge>
                                                )}
                                                {comp.sentiment && (
                                                    <Badge
                                                        variant={comp.sentiment === 'positive' ? 'default' : comp.sentiment === 'negative' ? 'destructive' : 'secondary'}
                                                        className="text-xs"
                                                    >
                                                        {comp.sentiment}
                                                    </Badge>
                                                )}
                                            </div>
                                            {comp.strengths && comp.strengths.length > 0 && (
                                                <p className="text-xs">
                                                    <span className="text-green-600 font-medium">Strengths: </span>
                                                    <span className="text-muted-foreground">{comp.strengths.join(', ')}</span>
                                                </p>
                                            )}
                                            {comp.weaknesses && comp.weaknesses.length > 0 && (
                                                <p className="text-xs">
                                                    <span className="text-orange-600 font-medium">Weaknesses: </span>
                                                    <span className="text-muted-foreground">{comp.weaknesses.join(', ')}</span>
                                                </p>
                                            )}
                                            {comp.differentiation_opportunity && (
                                                <div className="bg-primary/5 border border-primary/20 rounded p-2 text-xs">
                                                    <span className="text-primary font-medium">💡 Opportunity: </span>
                                                    <span>{comp.differentiation_opportunity}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </AccordionContent>
                            </AccordionItem>
                        )}

                        {/* User Quotes */}
                        {problem.quotes && problem.quotes.length > 0 && (
                            <AccordionItem value="quotes" className="border rounded-lg px-4">
                                <AccordionTrigger className="text-sm font-medium py-3">
                                    <div className="flex items-center gap-2">
                                        <Quote className="h-4 w-4 text-purple-500" />
                                        User Quotes
                                        <Badge variant="outline" className="ml-2 text-xs">{problem.quotes.length}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4 space-y-3">
                                    {problem.quotes.map((quote) => (
                                        <div key={quote.id} className="border-l-2 border-primary/30 pl-3">
                                            <p className="text-sm italic">"{quote.text}"</p>
                                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{quote.source}</span>
                                                {quote.upvotes && (
                                                    <span className="flex items-center gap-1">
                                                        <ThumbsUp className="h-3 w-3" /> {quote.upvotes}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </AccordionContent>
                            </AccordionItem>
                        )}
                    </Accordion>
                </TabsContent>

                {/* Sources Tab */}
                <TabsContent value="sources" className="space-y-4">
                    {problem.sources && problem.sources.length > 0 ? (
                        problem.sources.map((source) => (
                            <Card key={source.id} className="hover:border-primary/30 transition-colors">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-xs capitalize">{source.type}</Badge>
                                                {source.date && (
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(source.date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            <a
                                                href={source.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium hover:text-primary transition-colors line-clamp-2"
                                            >
                                                {source.title}
                                            </a>
                                            {source.body && (
                                                <p className="mt-2 text-sm text-muted-foreground line-clamp-3 italic">
                                                    "{source.body}"
                                                </p>
                                            )}
                                            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                                                {source.ups !== undefined && (
                                                    <span className="flex items-center gap-1">
                                                        <ThumbsUp className="h-3 w-3" /> {source.ups}
                                                    </span>
                                                )}
                                                {source.num_comments !== undefined && (
                                                    <span className="flex items-center gap-1">
                                                        <MessageSquare className="h-3 w-3" /> {source.num_comments}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <a
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="shrink-0 p-2 hover:bg-muted rounded-md transition-colors"
                                        >
                                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                        </a>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                No sources available
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div >
    );
}

export default ProblemDetails;
