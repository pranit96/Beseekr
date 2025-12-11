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
                <div className="flex items-center gap-2 mb-2">
                    {problem.tags?.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                    {brief?.approved && (
                        <Badge variant="default" className="text-xs">Brief Available</Badge>
                    )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">{problem.title}</h1>
                <p className="mt-3 text-muted-foreground leading-relaxed">{problem.summary}</p>
            </div>

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
                                    <CardContent>
                                        <div className="h-[220px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                                                    <PolarGrid stroke="hsl(var(--border))" />
                                                    <PolarAngleAxis
                                                        dataKey="metric"
                                                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                                    />
                                                    <PolarRadiusAxis
                                                        angle={90}
                                                        domain={[0, 100]}
                                                        tick={{ fontSize: 10 }}
                                                        tickCount={5}
                                                    />
                                                    <Radar
                                                        name="Score"
                                                        dataKey="value"
                                                        stroke="hsl(var(--primary))"
                                                        fill="hsl(var(--primary))"
                                                        fillOpacity={0.3}
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
                <TabsContent value="details" className="space-y-6">
                    {/* Trend Chart */}
                    {chartData.length > 0 && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Frequency Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <RechartsTooltip />
                                            <Line type="monotone" dataKey="frequency" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Market Estimate from original data */}
                    {problem.market_estimate?.size && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" /> Market Estimate
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold text-primary">{problem.market_estimate.size}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Competitors */}
                    {problem.competitors && problem.competitors.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Users className="h-4 w-4" /> Competitors ({problem.competitors.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {problem.competitors.map((comp, idx) => (
                                    <div key={comp.name || idx} className="border rounded-lg p-4 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{comp.name}</span>
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
                                            <div className="text-sm">
                                                <span className="text-green-600 dark:text-green-400 font-medium">Strengths: </span>
                                                <span className="text-muted-foreground">{comp.strengths.join(', ')}</span>
                                            </div>
                                        )}
                                        {comp.weaknesses && comp.weaknesses.length > 0 && (
                                            <div className="text-sm">
                                                <span className="text-orange-600 dark:text-orange-400 font-medium">Weaknesses: </span>
                                                <span className="text-muted-foreground">{comp.weaknesses.join(', ')}</span>
                                            </div>
                                        )}
                                        {comp.differentiation_opportunity && (
                                            <div className="bg-primary/5 border border-primary/20 rounded p-2 text-sm">
                                                <span className="text-primary font-medium">💡 Opportunity: </span>
                                                <span>{comp.differentiation_opportunity}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Quotes */}
                    {problem.quotes && problem.quotes.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Quote className="h-4 w-4" /> User Quotes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
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
                            </CardContent>
                        </Card>
                    )}
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
