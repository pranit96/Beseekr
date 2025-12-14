import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Loader2,
    AlertCircle,
    ArrowLeft,
    Bookmark,
    BookmarkCheck,
    ExternalLink,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Users,
    TrendingUp,
    Target,
    Clock,
    DollarSign,
    Rocket,
    MessageSquare,
    Info,
    Lightbulb,
    Quote,
    Sparkles,
} from 'lucide-react';
import { problemsApi } from '@/api/problems';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import {
    MarketSizeChart,
    ValidationBreakdownChart,
    TrendSparkline,
    ScoreFactorsChart
} from '@/components/saas/ProblemCharts';

// ============================================================================
// STORY-DRIVEN PROBLEM DETAILS PAGE
// Presents data like a PowerPoint: Hero → Problem → Market → Validation → Action
// ============================================================================

export function ProblemDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: problem, isLoading, isError, error } = useQuery({
        queryKey: ['problem', id],
        queryFn: () => problemsApi.getProblemDetails(id!),
        enabled: !!id,
        staleTime: 24 * 60 * 60 * 1000,
        gcTime: 48 * 60 * 60 * 1000,
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

    // Extract report data OR fallback to raw problem data
    const report = problem?.report;
    const hasReport = !!report?.executive_summary;

    // Fallback data from raw problem when report is missing
    const header = report?.header || {
        category: problem?.category,
        domain: problem?.domain,
    };

    const summary = report?.executive_summary || {
        verdict: problem?.data_confidence?.level === 'low' ? 'Early Signal' :
            problem?.opportunity_score?.value >= 70 ? 'Worth Exploring' : 'Needs Validation',
        score: problem?.opportunity_score?.value || problem?.brief?.opportunity_score || 0,
        original_score: problem?.opportunity_score?.original_value,
        confidence: problem?.data_confidence?.level || 'low',
        one_liner: problem?.summary || problem?.description,
        warnings: problem?.opportunity_score?.warnings || [],
    };

    const problemSection = report?.section_1_problem || {
        title: 'The Problem',
        description: problem?.summary || problem?.description,
        target_audience: problem?.brief?.target_audience?.primary?.role
            ? `${problem.brief.target_audience.primary.role} at ${problem.brief.target_audience.primary.company_size} companies`
            : problem?.target_audience,
        pain_level: problem?.brief?.target_audience?.primary?.pain_level || 5,
        key_insights: problem?.brief?.target_audience?.key_insights || [],
    };

    const marketSection = report?.section_2_market || (problem?.market_sizing ? {
        title: 'Market Opportunity',
        tam: problem.market_sizing.tam,
        sam: problem.market_sizing.sam,
        som: problem.market_sizing.som,
        growth_rate: problem.market_sizing.growth_rate,
        competition_level: problem.competition_level,
    } : null);

    const validationSection = report?.section_3_validation || (problem?.validation_strength ? {
        title: 'Validation Status',
        score: problem.validation_strength.score,
        max_score: problem.validation_strength.max_score,
        verdict: problem.validation_strength.verdict,
        signals: {
            discussions: problem.metrics?.frequency || 0,
            sources: problem.metrics?.source_count || 0,
            quotes: problem.top_quotes?.length || 0,
            external_signals: 0,
        },
        what_is_missing: problem.validation_strength.missing || [],
    } : null);

    const actionSection = report?.section_5_action_plan || (problem?.build_estimate ? {
        title: 'Next Steps',
        mvp_timeline: `${problem.build_estimate.mvp_weeks} weeks`,
        complexity: problem.build_estimate.complexity,
        solo_feasible: problem.build_estimate.solo_founder_feasible,
        estimated_cost: problem.build_estimate.cost_estimate,
        first_10_customers: problem.go_to_market?.first_10_customers || [],
        communities_to_target: problem.go_to_market?.communities || [],
    } : null);

    // PPT-Style: Toggle between Hook Slide and Full Report
    const [showFullReport, setShowFullReport] = React.useState(false);

    // Generate 5 key decision points for Hook Slide
    const keyPoints = React.useMemo(() => {
        if (!problem) return [];
        const points: { icon: string; text: string; type: 'positive' | 'warning' | 'neutral' }[] = [];

        // Market size
        if (marketSection?.som?.display) {
            points.push({ icon: '💰', text: `${marketSection.som.display} addressable market opportunity`, type: 'positive' });
        }

        // Competition
        if (problem.competition_level) {
            const isLow = problem.competition_level === 'low' || problem.competition_level === 'emerging';
            points.push({
                icon: isLow ? '🎯' : '⚔️',
                text: isLow ? 'Low competition - first mover advantage' : `${problem.competition_level} competition - differentiation needed`,
                type: isLow ? 'positive' : 'warning'
            });
        }

        // Build feasibility
        if (actionSection?.solo_feasible !== undefined && actionSection?.mvp_timeline) {
            points.push({
                icon: actionSection.solo_feasible ? '👤' : '👥',
                text: actionSection.solo_feasible
                    ? `Solo founder feasible in ${actionSection.mvp_timeline}`
                    : `Needs team - ${actionSection.mvp_timeline} to MVP`,
                type: actionSection.solo_feasible ? 'positive' : 'neutral'
            });
        }

        // Validation status
        if (validationSection?.score !== undefined) {
            const pct = (validationSection.score / validationSection.max_score) * 100;
            points.push({
                icon: pct >= 60 ? '✅' : '⚠️',
                text: pct >= 60 ? 'Strong user validation signals' : 'Needs more user validation research',
                type: pct >= 60 ? 'positive' : 'warning'
            });
        }

        // Competitor gaps
        if (problem.competitor_intel?.gaps?.length) {
            points.push({
                icon: '💡',
                text: `${problem.competitor_intel.gaps.length} competitor gaps to exploit`,
                type: 'positive'
            });
        }

        // Quotes
        if (problem.top_quotes?.length) {
            points.push({
                icon: '💬',
                text: `${problem.top_quotes.length} real user pain quotes collected`,
                type: 'positive'
            });
        }

        return points.slice(0, 5);
    }, [problem, marketSection, actionSection, validationSection]);

    // Helpers
    const getConfidenceColor = (confidence: string) => {
        if (confidence === 'high') return 'text-green-500 bg-green-500/10';
        if (confidence === 'medium') return 'text-yellow-500 bg-yellow-500/10';
        return 'text-amber-500 bg-amber-500/10';
    };

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-green-500';
        if (score >= 50) return 'text-yellow-500';
        return 'text-amber-500';
    };

    // Loading State
    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-8 p-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
        );
    }

    // Error State
    if (isError || !problem) {
        return (
            <div className="max-w-4xl mx-auto p-4">
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="pt-6 text-center">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Problem not found</h2>
                        <p className="text-muted-foreground mb-4">
                            {error instanceof Error ? error.message : 'Unable to load problem details'}
                        </p>
                        <Button onClick={() => navigate('/dashboard/problems')}>
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Problems
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-12 px-4">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/problems')}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <div className="flex items-center gap-2">
                    {showFullReport && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFullReport(false)}
                        >
                            <EyeOff className="h-4 w-4 mr-2" /> Hide Details
                        </Button>
                    )}
                    <Button
                        variant={isInWatchlist ? 'default' : 'outline'}
                        size="sm"
                        onClick={handleWatchlistToggle}
                        disabled={addMutation.isPending || removeMutation.isPending}
                    >
                        {isInWatchlist ? <BookmarkCheck className="h-4 w-4 mr-2" /> : <Bookmark className="h-4 w-4 mr-2" />}
                        {isInWatchlist ? 'Saved' : 'Save'}
                    </Button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* ════════════════════════════════════════════════════════════════ */}
                {/* HOOK SLIDE: The One-Glance Decision View                         */}
                {/* ════════════════════════════════════════════════════════════════ */}
                <motion.div
                    key="hook-slide"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6 md:space-y-8"
                >
                    {/* Title */}
                    <div className="text-center space-y-2">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            {header?.category && (
                                <Badge variant="default" className="text-xs capitalize">
                                    {header.category.replace(/_/g, ' ')}
                                </Badge>
                            )}
                            {header?.domain?.map((d: string) => (
                                <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
                            ))}
                        </div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold px-2 leading-tight">{problem.title}</h1>
                    </div>

                    {/* Big Score Circle */}
                    <div className="flex flex-col items-center space-y-4">
                        <motion.div
                            className="relative"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        >
                            <div className={cn(
                                "w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center border-[6px] sm:border-8 shadow-2xl",
                                summary?.score >= 70 ? "border-green-500/50 bg-gradient-to-br from-green-500/20 to-emerald-500/10" :
                                    summary?.score >= 50 ? "border-blue-500/50 bg-gradient-to-br from-blue-500/20 to-indigo-500/10" :
                                        summary?.score >= 30 ? "border-amber-500/50 bg-gradient-to-br from-amber-500/20 to-orange-500/10" :
                                            "border-red-500/50 bg-gradient-to-br from-red-500/20 to-pink-500/10"
                            )}>
                                <div className="text-center">
                                    <motion.p
                                        className={cn("text-4xl sm:text-5xl font-bold", getScoreColor(summary?.score || 0))}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        {summary?.score || 0}
                                    </motion.p>
                                    <p className="text-sm text-muted-foreground">/100</p>
                                </div>
                            </div>

                            {/* Verdict Badge */}
                            <motion.div
                                className="absolute -bottom-3 left-1/2 -translate-x-1/2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                            >
                                <Badge className={cn(
                                    "text-xs sm:text-sm px-3 sm:px-4 py-1 shadow-lg whitespace-nowrap",
                                    summary?.score >= 70 ? "bg-green-500 text-white" :
                                        summary?.score >= 50 ? "bg-blue-500 text-white" :
                                            summary?.score >= 30 ? "bg-amber-500 text-white" :
                                                "bg-red-500 text-white"
                                )}>
                                    {summary?.verdict || 'Analyzing...'}
                                </Badge>
                            </motion.div>
                        </motion.div>

                        {/* One-liner */}
                        <motion.p
                            className="text-center text-muted-foreground text-sm sm:text-base max-w-2xl px-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            {summary?.one_liner}
                        </motion.p>
                    </div>

                    {/* Key Decision Points */}
                    <motion.div
                        className="max-w-xl mx-auto space-y-2 sm:space-y-3 px-0 sm:px-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                    >
                        {keyPoints.map((point, i) => (
                            <motion.div
                                key={i}
                                className={cn(
                                    "flex items-start sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border transition-all active:scale-[0.98] sm:hover:scale-[1.02]",
                                    point.type === 'positive' ? "bg-green-500/5 border-green-500/20 sm:hover:border-green-500/40" :
                                        point.type === 'warning' ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40" :
                                            "bg-muted/30 border-muted hover:border-muted-foreground/20"
                                )}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1 + i * 0.1 }}
                            >
                                <span className="text-lg sm:text-xl shrink-0">{point.icon}</span>
                                <span className="text-xs sm:text-sm font-medium leading-snug">{point.text}</span>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* CTA Button */}
                    <motion.div
                        className="flex flex-col items-center gap-4 pt-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 }}
                    >
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-xl hover:shadow-2xl transition-all px-6 sm:px-8 w-full sm:w-auto max-w-xs"
                            onClick={() => setShowFullReport(true)}
                        >
                            <Eye className="h-5 w-5 mr-2" />
                            View Full Report
                            <ChevronDown className="h-5 w-5 ml-2" />
                        </Button>
                        <p className="text-[10px] sm:text-xs text-muted-foreground text-center px-4">
                            Market analysis • Competitor gaps • User quotes • Action plan
                        </p>
                    </motion.div>
                </motion.div>
            </AnimatePresence>

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* FULL REPORT: Detailed Analysis (shown on expand)                 */}
            {/* ════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {showFullReport && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                        className="space-y-8 mt-8 overflow-hidden"
                    >

                        {/* ════════════════════════════════════════════════════════════════ */}
                        {/* SLIDE 1: HERO - Executive Summary                                 */}
                        {/* ════════════════════════════════════════════════════════════════ */}
                        <section className="space-y-4">
                            {/* Title + Category */}
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    {header?.category && (
                                        <Badge variant="default" className="text-xs capitalize">
                                            {header.category.replace(/_/g, ' ')}
                                        </Badge>
                                    )}
                                    {header?.domain?.map((d: string) => (
                                        <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
                                    ))}
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold">{problem.title}</h1>
                            </div>

                            {/* Verdict Card */}
                            <Card className={cn(
                                "border-2 overflow-hidden",
                                summary?.confidence === 'low' ? "border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5" :
                                    summary?.score >= 70 ? "border-green-500/30 bg-gradient-to-r from-green-500/5 to-emerald-500/5" :
                                        "border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-amber-500/5"
                            )}>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                        {/* Score Circle */}
                                        <div className="relative">
                                            <div className={cn(
                                                "w-24 h-24 rounded-full flex items-center justify-center border-4",
                                                summary?.score >= 70 ? "border-green-500/50 bg-green-500/10" :
                                                    summary?.score >= 50 ? "border-yellow-500/50 bg-yellow-500/10" :
                                                        "border-amber-500/50 bg-amber-500/10"
                                            )}>
                                                <div className="text-center">
                                                    <p className={cn("text-3xl font-bold", getScoreColor(summary?.score || 0))}>
                                                        {summary?.score || 0}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">/100</p>
                                                </div>
                                            </div>
                                            {summary?.original_score && summary.original_score !== summary.score && (
                                                <Badge variant="outline" className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-amber-600 bg-background">
                                                    was {summary.original_score}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Verdict + One-liner */}
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h2 className="text-xl font-semibold">{summary?.verdict || 'Analysis Complete'}</h2>
                                                <Badge className={cn("text-xs", getConfidenceColor(summary?.confidence || 'low'))}>
                                                    {summary?.confidence || 'low'} confidence
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground">{summary?.one_liner}</p>

                                            {/* Warnings */}
                                            {summary?.warnings?.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {summary.warnings.slice(0, 2).map((w: string, i: number) => (
                                                        <span key={i} className="text-xs text-amber-600 flex items-center gap-1">
                                                            <AlertTriangle className="h-3 w-3" /> {w}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* ════════════════════════════════════════════════════════════════ */}
                        {/* SLIDE 2: THE PROBLEM                                              */}
                        {/* ════════════════════════════════════════════════════════════════ */}
                        {problemSection && (
                            <section className="space-y-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Target className="h-5 w-5 text-primary" />
                                    {problemSection.title || 'The Problem'}
                                </h2>

                                <Card>
                                    <CardContent className="pt-6 space-y-4">
                                        {/* Description */}
                                        <p className="text-muted-foreground leading-relaxed">
                                            {problemSection.description}
                                        </p>

                                        {/* Target + Pain Level */}
                                        <div className="flex flex-wrap items-center gap-4 pt-2">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">{problemSection.target_audience}</span>
                                            </div>
                                            {problemSection.pain_level && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground">Pain Level:</span>
                                                    <div className="flex items-center gap-1">
                                                        <Progress value={problemSection.pain_level * 10} className="w-20 h-2" />
                                                        <span className="text-sm font-medium">{problemSection.pain_level}/10</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Key Insights */}
                                        {problemSection.key_insights?.length > 0 && (
                                            <div className="pt-4 border-t space-y-2">
                                                <p className="text-sm font-medium">Key Insights</p>
                                                {problemSection.key_insights.map((insight: string, i: number) => (
                                                    <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                                        {insight}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </section>
                        )}

                        {/* ════════════════════════════════════════════════════════════════ */}
                        {/* SLIDE 3: MARKET OPPORTUNITY                                       */}
                        {/* ════════════════════════════════════════════════════════════════ */}
                        {marketSection && (
                            <section className="space-y-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                    {marketSection.title || 'Market Opportunity'}
                                </h2>

                                {/* TAM/SAM/SOM Cards with hover effects */}
                                <div className="grid grid-cols-3 gap-3">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1 }}
                                                    whileHover={{ scale: 1.03 }}
                                                >
                                                    <Card className="text-center cursor-help hover:bg-muted/30 transition-colors">
                                                        <CardContent className="pt-4 pb-3">
                                                            <p className="text-xs text-muted-foreground mb-1">TAM</p>
                                                            <p className="text-xl md:text-2xl font-bold text-green-500">
                                                                {marketSection.tam?.display || 'N/A'}
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-xs font-medium">Total Addressable Market</p>
                                                <p className="text-xs text-muted-foreground">The entire market demand for this solution</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.2 }}
                                                    whileHover={{ scale: 1.03 }}
                                                >
                                                    <Card className="text-center cursor-help hover:bg-muted/30 transition-colors">
                                                        <CardContent className="pt-4 pb-3">
                                                            <p className="text-xs text-muted-foreground mb-1">SAM</p>
                                                            <p className="text-xl md:text-2xl font-bold">
                                                                {marketSection.sam?.display || 'N/A'}
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-xs font-medium">Serviceable Addressable Market</p>
                                                <p className="text-xs text-muted-foreground">Realistic market you can target</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.3 }}
                                                    whileHover={{ scale: 1.03 }}
                                                >
                                                    <Card className="text-center cursor-help hover:bg-muted/30 transition-colors border-primary/20">
                                                        <CardContent className="pt-4 pb-3">
                                                            <p className="text-xs text-muted-foreground mb-1">SOM</p>
                                                            <p className="text-xl md:text-2xl font-bold text-primary">
                                                                {marketSection.som?.display || 'N/A'}
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-xs font-medium">Serviceable Obtainable Market</p>
                                                <p className="text-xs text-muted-foreground">Your realistic initial market share goal</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>

                                {/* Growth + Competition */}
                                <div className="flex flex-wrap gap-4">
                                    {marketSection.growth_rate && (
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                            <span className="text-sm">{marketSection.growth_rate.display} growth</span>
                                        </div>
                                    )}
                                    {marketSection.competition_level && (
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                                            <span className="text-sm">Competition: <span className="font-medium capitalize">{marketSection.competition_level}</span></span>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* ════════════════════════════════════════════════════════════════ */}
                        {/* DATA INSIGHTS - Visual Charts                                    */}
                        {/* ════════════════════════════════════════════════════════════════ */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-blue-500" />
                                Data Insights
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Market Size Chart */}
                                {marketSection && (
                                    <MarketSizeChart
                                        tam={marketSection.tam}
                                        sam={marketSection.sam}
                                        som={marketSection.som}
                                    />
                                )}

                                {/* Trend Sparkline */}
                                {problem.trend && problem.trend.length > 1 && (
                                    <TrendSparkline data={problem.trend} />
                                )}

                                {/* Validation Breakdown */}
                                {problem.validation_strength?.breakdown && (
                                    <ValidationBreakdownChart
                                        breakdown={problem.validation_strength.breakdown}
                                    />
                                )}

                                {/* Score Factors */}
                                {problem.opportunity_score?.factors && problem.opportunity_score.factors.length > 0 && (
                                    <ScoreFactorsChart
                                        factors={problem.opportunity_score.factors}
                                    />
                                )}
                            </div>
                        </section>

                        {/* ════════════════════════════════════════════════════════════════ */}
                        {/* YOUR UNFAIR ADVANTAGE - Competitor Gaps                          */}
                        {/* ════════════════════════════════════════════════════════════════ */}
                        {problem.competitor_intel && (problem.competitor_intel.gaps?.length > 0 || problem.competitor_intel.pain_points?.length > 0) && (
                            <section className="space-y-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Target className="h-5 w-5 text-red-500" />
                                    <span>Your Unfair Advantage</span>
                                    <Badge variant="outline" className="ml-2 text-xs bg-red-500/10 text-red-600 border-red-500/30">
                                        💡 Exploit These Gaps
                                    </Badge>
                                </h2>

                                <Card className="border-l-4 border-l-red-500 bg-gradient-to-r from-red-500/5 to-transparent">
                                    <CardContent className="pt-5 pb-5">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {/* Competitor Weaknesses */}
                                            {problem.competitor_intel.gaps?.length > 0 && (
                                                <motion.div
                                                    className="space-y-3"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.2 }}
                                                >
                                                    <p className="text-sm font-semibold text-red-600 flex items-center gap-2">
                                                        <AlertTriangle className="h-4 w-4" />
                                                        Existing Solutions Are Weak At:
                                                    </p>
                                                    <div className="space-y-2">
                                                        {problem.competitor_intel.gaps.slice(0, 3).map((gap: string, i: number) => (
                                                            <motion.div
                                                                key={i}
                                                                className="flex items-start gap-2 p-2 rounded-lg bg-background hover:bg-muted/50 transition-colors"
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: 0.3 + i * 0.1 }}
                                                            >
                                                                <span className="text-red-500 font-bold">×</span>
                                                                <span className="text-sm">{gap}</span>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* User Pain Points */}
                                            {problem.competitor_intel.pain_points?.length > 0 && (
                                                <motion.div
                                                    className="space-y-3"
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.4 }}
                                                >
                                                    <p className="text-sm font-semibold text-amber-600 flex items-center gap-2">
                                                        <MessageSquare className="h-4 w-4" />
                                                        Users Are Complaining About:
                                                    </p>
                                                    <div className="space-y-2">
                                                        {problem.competitor_intel.pain_points.slice(0, 3).map((pain: string, i: number) => (
                                                            <motion.div
                                                                key={i}
                                                                className="flex items-start gap-2 p-2 rounded-lg bg-background hover:bg-muted/50 transition-colors"
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: 0.5 + i * 0.1 }}
                                                            >
                                                                <span className="text-amber-500">💢</span>
                                                                <span className="text-sm">{pain}</span>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>

                                        {/* CTA */}
                                        <motion.div
                                            className="mt-5 pt-4 border-t flex items-center justify-between"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.8 }}
                                        >
                                            <p className="text-sm text-muted-foreground">
                                                <span className="text-foreground font-medium">→ Build THIS</span> and you win.
                                            </p>
                                            {problem.competitor_intel.total_competitors > 0 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {problem.competitor_intel.total_competitors} competitors analyzed
                                                </Badge>
                                            )}
                                        </motion.div>
                                    </CardContent>
                                </Card>
                            </section>
                        )}

                        {/* ════════════════════════════════════════════════════════════════ */}
                        {/* SLIDE 4: VALIDATION STATUS                                        */}
                        {/* ════════════════════════════════════════════════════════════════ */}
                        {validationSection && (
                            <section className="space-y-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                                    {validationSection.title || 'Validation Status'}
                                </h2>

                                <Card className="overflow-hidden">
                                    <CardContent className="pt-6 space-y-4">
                                        {/* Validation Score Bar with Tooltip */}
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger className="flex items-center gap-1.5 cursor-help">
                                                                <span>Validation Score</span>
                                                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-xs">
                                                                <p>Based on discussion volume, source diversity, user quotes, and external signals. Higher scores = more validated pain point.</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <span className="font-medium">{validationSection.score}/{validationSection.max_score}</span>
                                                </div>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: '100%' }}
                                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                                >
                                                    <Progress value={(validationSection.score / validationSection.max_score) * 100} className="h-2" />
                                                </motion.div>
                                            </div>
                                        </div>

                                        {/* Positive Verdict Framing */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            <div className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-lg inline-flex",
                                                validationSection.score >= 70 ? "bg-green-500/10" :
                                                    validationSection.score >= 40 ? "bg-blue-500/10" :
                                                        "bg-purple-500/10"
                                            )}>
                                                {validationSection.score < 40 ? (
                                                    <>
                                                        <Rocket className="h-4 w-4 text-purple-500" />
                                                        <span className="text-sm font-medium text-purple-600">Early Stage Opportunity</span>
                                                        <span className="text-xs text-purple-500/70 ml-1">• Less competition</span>
                                                    </>
                                                ) : validationSection.score < 70 ? (
                                                    <>
                                                        <TrendingUp className="h-4 w-4 text-blue-500" />
                                                        <span className="text-sm font-medium text-blue-600">Emerging Validation</span>
                                                        <span className="text-xs text-blue-500/70 ml-1">• Building momentum</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                        <span className="text-sm font-medium text-green-600">Strong Validation</span>
                                                        <span className="text-xs text-green-500/70 ml-1">• High confidence</span>
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>

                                        {/* Signals with hover effects */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                                            {[
                                                { value: validationSection.signals?.discussions || 0, label: 'Discussions', tip: 'Total Reddit/forum discussions mentioning this pain' },
                                                { value: validationSection.signals?.sources || 0, label: 'Sources', tip: 'Unique platforms where this problem appeared' },
                                                { value: validationSection.signals?.quotes || 0, label: 'Quotes', tip: 'Direct user quotes expressing frustration' },
                                                { value: validationSection.signals?.external_signals || 0, label: 'External', tip: 'HackerNews, Twitter, LinkedIn mentions' },
                                            ].map((signal, i) => (
                                                <TooltipProvider key={i}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <motion.div
                                                                className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-help hover:scale-105 transform"
                                                                initial={{ opacity: 0, y: 20 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: 0.2 + i * 0.1 }}
                                                                whileHover={{ scale: 1.05 }}
                                                            >
                                                                <p className="text-lg font-bold">{signal.value}</p>
                                                                <p className="text-xs text-muted-foreground">{signal.label}</p>
                                                            </motion.div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="text-xs">{signal.tip}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ))}
                                        </div>

                                        {/* Strengthen This Idea (formerly "What's Missing") */}
                                        {validationSection.what_is_missing?.length > 0 && (
                                            <motion.div
                                                className="pt-4 border-t space-y-2"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.6 }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Lightbulb className="h-4 w-4 text-amber-500" />
                                                    <p className="text-sm font-medium text-foreground">Strengthen This Idea</p>
                                                </div>
                                                {validationSection.what_is_missing.slice(0, 3).map((item: string, i: number) => (
                                                    <motion.p
                                                        key={i}
                                                        className="text-sm text-muted-foreground flex items-start gap-2 pl-6"
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.7 + i * 0.1 }}
                                                    >
                                                        <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                                                        <span><span className="text-amber-600 font-medium">Research tip:</span> {item}</span>
                                                    </motion.p>
                                                ))}
                                            </motion.div>
                                        )}
                                    </CardContent>
                                </Card>
                            </section>
                        )}

                        {/* ════════════════════════════════════════════════════════════════ */}
                        {/* SLIDE 5: ACTION PLAN                                              */}
                        {/* ════════════════════════════════════════════════════════════════ */}
                        {actionSection && (
                            <section id="action-section" className="space-y-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Rocket className="h-5 w-5 text-purple-500" />
                                    {actionSection.title || 'Next Steps'}
                                </h2>

                                {/* Quick Stats with hover effects and tooltips */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <motion.div whileHover={{ scale: 1.03 }} transition={{ type: 'spring', stiffness: 300 }}>
                                                    <Card className="text-center cursor-help hover:bg-muted/30 transition-colors">
                                                        <CardContent className="pt-4 pb-3">
                                                            <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                                            <p className="text-lg font-bold">{actionSection.mvp_timeline || '?'}</p>
                                                            <p className="text-xs text-muted-foreground">MVP Time</p>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-xs">Estimated time to build a minimal viable product</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <motion.div whileHover={{ scale: 1.03 }} transition={{ type: 'spring', stiffness: 300 }}>
                                                    <Card className="text-center cursor-help hover:bg-muted/30 transition-colors">
                                                        <CardContent className="pt-4 pb-3">
                                                            <TrendingUp className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                                            <p className="text-lg font-bold capitalize">{actionSection.complexity || 'medium'}</p>
                                                            <p className="text-xs text-muted-foreground">Complexity</p>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-xs">Technical difficulty: Low = templates exist, High = custom development</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <motion.div whileHover={{ scale: 1.03 }} transition={{ type: 'spring', stiffness: 300 }}>
                                                    <Card className="text-center cursor-help hover:bg-muted/30 transition-colors">
                                                        <CardContent className="pt-4 pb-3">
                                                            <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                                            <p className="text-lg font-bold">{actionSection.solo_feasible ? 'Yes' : 'Team'}</p>
                                                            <p className="text-xs text-muted-foreground">Solo Founder</p>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-xs">Can one person build and launch this MVP?</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <motion.div whileHover={{ scale: 1.03 }} transition={{ type: 'spring', stiffness: 300 }}>
                                                    <Card className="text-center cursor-help hover:bg-muted/30 transition-colors border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent">
                                                        <CardContent className="pt-4 pb-3">
                                                            <DollarSign className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                                                            <p className="text-sm font-bold text-amber-600">{actionSection.estimated_cost?.solo || 'N/A'}</p>
                                                            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                                                Opportunity Cost
                                                                <Info className="h-3 w-3 text-muted-foreground/60" />
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <p className="text-xs font-medium mb-1">💡 What this means:</p>
                                                <p className="text-xs">The cost someone would pay to have this problem solved. This represents potential revenue opportunity if you build a solution.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>

                                {/* First 10 Customers */}
                                {actionSection.first_10_customers?.length > 0 && (
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium">How to Get First 10 Customers</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            {actionSection.first_10_customers.map((tactic: string, i: number) => (
                                                <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                                                        {i + 1}
                                                    </span>
                                                    {tactic}
                                                </p>
                                            ))}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Communities */}
                                {actionSection.communities_to_target?.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-sm text-muted-foreground">Communities:</span>
                                        {actionSection.communities_to_target.map((community: string, i: number) => (
                                            <Badge key={i} variant="outline" className="text-xs">{community}</Badge>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* ════════════════════════════════════════════════════════════════ */}
                        {/* REAL USER PAIN (Quotes)                                           */}
                        {/* ════════════════════════════════════════════════════════════════ */}
                        <section className="space-y-4 pt-4 border-t">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Quote className="h-5 w-5 text-primary" />
                                Real User Pain
                            </h2>

                            {problem.top_quotes?.length > 0 ? (
                                <div className="space-y-3">
                                    {problem.top_quotes.slice(0, 3).map((quote: any, i: number) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.15 }}
                                        >
                                            <Card className="border-l-4 border-l-primary/50 hover:border-l-primary transition-colors hover:bg-muted/30">
                                                <CardContent className="pt-4 pb-4">
                                                    <div className="flex gap-3">
                                                        <Quote className="h-5 w-5 text-primary/40 shrink-0 mt-1" />
                                                        <div className="space-y-2">
                                                            <p className="text-sm italic text-foreground/90 leading-relaxed">
                                                                "{typeof quote === 'string' ? quote : quote.text || quote.quote}"
                                                            </p>
                                                            {(quote.source || quote.author) && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    — {quote.author || quote.source || 'Anonymous user'}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <Card className="bg-muted/30 border-dashed">
                                    <CardContent className="pt-4 pb-4">
                                        <div className="text-center space-y-2">
                                            <Quote className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                                            <p className="text-sm text-muted-foreground">
                                                User quotes help validate real pain. Check the source posts below for direct user feedback.
                                            </p>
                                            <p className="text-xs text-muted-foreground/60">
                                                Look for phrases like "I wish...", "It's frustrating that...", "I'd pay for..."
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </section>

                        {/* ════════════════════════════════════════════════════════════════ */}
                        {/* RELATED POSTS (if available)                                      */}
                        {/* ════════════════════════════════════════════════════════════════ */}
                        {problem.related_posts?.length > 0 && (
                            <section className="space-y-4 pt-4 border-t">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                                    Source Posts
                                </h2>
                                <div className="space-y-3">
                                    {problem.related_posts.slice(0, 3).map((post: any) => (
                                        <Card key={post.post_id} className="hover:bg-muted/50 transition-colors">
                                            <CardContent className="pt-4 pb-4">
                                                <a
                                                    href={post.permalink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group"
                                                >
                                                    <p className="font-medium group-hover:text-primary transition-colors line-clamp-1">
                                                        {post.title}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                        {post.body?.substring(0, 150)}...
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                        <span>👍 {post.ups}</span>
                                                        <span>💬 {post.num_comments}</span>
                                                        <span className="flex items-center gap-1 text-primary">
                                                            <ExternalLink className="h-3 w-3" /> View
                                                        </span>
                                                    </div>
                                                </a>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ════════════════════════════════════════════════════════════════ */}
                        {/* STICKY ACTION BAR - Always visible at bottom                     */}
                        {/* ════════════════════════════════════════════════════════════════ */}
                        {actionSection && (
                            <motion.div
                                className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t shadow-2xl z-50 p-4"
                                initial={{ y: 100 }}
                                animate={{ y: 0 }}
                                transition={{ delay: 1, type: 'spring', damping: 20 }}
                            >
                                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                                    {/* First 10 Customers Preview */}
                                    <div className="flex items-center gap-3 text-sm">
                                        {actionSection.first_10_customers?.length > 0 && (
                                            <div className="hidden sm:flex items-center gap-2">
                                                <span className="text-muted-foreground">First 10 customers:</span>
                                                <div className="flex items-center gap-1">
                                                    {actionSection.first_10_customers.slice(0, 2).map((tactic: string, i: number) => (
                                                        <Badge key={i} variant="secondary" className="text-xs truncate max-w-[120px]">
                                                            {tactic.split(' ').slice(0, 3).join(' ')}...
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {actionSection.communities_to_target?.length > 0 && (
                                            <div className="flex items-center gap-1 sm:border-l sm:pl-3">
                                                {actionSection.communities_to_target.slice(0, 3).map((community: string, i: number) => (
                                                    <Badge key={i} variant="outline" className="text-xs">
                                                        {community}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* CTA Buttons */}
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleWatchlistToggle}
                                            disabled={addMutation.isPending || removeMutation.isPending}
                                        >
                                            {isInWatchlist ? <BookmarkCheck className="h-4 w-4 mr-1" /> : <Bookmark className="h-4 w-4 mr-1" />}
                                            {isInWatchlist ? 'Saved' : 'Save'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-lg"
                                        >
                                            <Rocket className="h-4 w-4 mr-2" />
                                            Validate This Idea
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Spacer for sticky bar */}
                        <div className="h-20" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ProblemDetails;
