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

    // Slide-based Full Report Navigation
    const [currentSlide, setCurrentSlide] = React.useState(0);

    const slides = React.useMemo(() => {
        if (!problem) return [];
        return [
            { id: 'summary', title: 'Executive Summary', icon: '📊' },
            { id: 'problem', title: 'The Problem', icon: '🎯' },
            { id: 'market', title: 'Market Opportunity', icon: '📈' },
            { id: 'competitors', title: 'Competitor Gaps', icon: '⚔️' },
            { id: 'validation', title: 'Validation', icon: '✅' },
            { id: 'action', title: 'Action Plan', icon: '🚀' },
        ];
    }, [problem]);

    const nextSlide = React.useCallback(() => {
        setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
    }, [slides.length]);

    const prevSlide = React.useCallback(() => {
        setCurrentSlide(prev => Math.max(prev - 1, 0));
    }, []);

    // Keyboard navigation
    React.useEffect(() => {
        if (!showFullReport) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                nextSlide();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                prevSlide();
            } else if (e.key === 'Escape') {
                setShowFullReport(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showFullReport, nextSlide, prevSlide]);

    // Track slide direction for animation
    const [slideDirection, setSlideDirection] = React.useState<'left' | 'right'>('right');

    const goToSlide = React.useCallback((index: number) => {
        setSlideDirection(index > currentSlide ? 'right' : 'left');
        setCurrentSlide(index);
    }, [currentSlide]);

    const goNext = React.useCallback(() => {
        if (currentSlide < slides.length - 1) {
            setSlideDirection('right');
            setCurrentSlide(prev => prev + 1);
        }
    }, [currentSlide, slides.length]);

    const goPrev = React.useCallback(() => {
        if (currentSlide > 0) {
            setSlideDirection('left');
            setCurrentSlide(prev => prev - 1);
        }
    }, [currentSlide]);

    // Touch swipe support for mobile
    const touchStartX = React.useRef<number>(0);
    const touchEndX = React.useRef<number>(0);

    const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    }, []);

    const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    }, []);

    const handleTouchEnd = React.useCallback(() => {
        const diff = touchStartX.current - touchEndX.current;
        const threshold = 50; // minimum swipe distance

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                goNext(); // swipe left = next
            } else {
                goPrev(); // swipe right = prev
            }
        }
    }, [goNext, goPrev]);

    // Slide animation variants
    const slideVariants = {
        enter: (direction: 'left' | 'right') => ({
            x: direction === 'right' ? 100 : -100,
            opacity: 0,
            scale: 0.95,
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
        },
        exit: (direction: 'left' | 'right') => ({
            x: direction === 'right' ? -100 : 100,
            opacity: 0,
            scale: 0.95,
        }),
    };

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
            {/* FULL REPORT: Slide Deck Navigation                                */}
            {/* ════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {showFullReport && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        transition={{ duration: 0.4 }}
                        className="mt-8"
                    >
                        {/* Slide Progress Dots */}
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-6 px-2">
                            {slides.map((slide, i) => (
                                <button
                                    key={slide.id}
                                    onClick={() => goToSlide(i)}
                                    className={cn(
                                        "flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-300",
                                        i === currentSlide
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted hover:bg-muted-foreground/20"
                                    )}
                                >
                                    <span className="text-sm">{slide.icon}</span>
                                    <span className={cn(
                                        "text-xs font-medium overflow-hidden transition-all duration-300",
                                        i === currentSlide ? "max-w-20 sm:max-w-none" : "max-w-0 sm:max-w-none"
                                    )}>
                                        <span className="hidden sm:inline">{slide.title}</span>
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Slide Container */}
                        <div
                            className="relative min-h-[350px] sm:min-h-[400px] overflow-hidden rounded-xl"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            <AnimatePresence mode="wait" custom={slideDirection}>
                                {/* SLIDE 1: Executive Summary */}
                                {currentSlide === 0 && (
                                    <motion.div
                                        key="summary"
                                        custom={slideDirection}
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                                        className="space-y-4"
                                    >
                                        <div className="flex items-center gap-2 text-lg font-semibold">
                                            <span className="text-2xl">📊</span>
                                            Executive Summary
                                        </div>
                                        <Card className={cn(
                                            "border-2",
                                            summary?.score >= 70 ? "border-green-500/30 bg-gradient-to-r from-green-500/5 to-emerald-500/5" :
                                                summary?.score >= 50 ? "border-blue-500/30 bg-gradient-to-r from-blue-500/5 to-indigo-500/5" :
                                                    "border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5"
                                        )}>
                                            <CardContent className="pt-6">
                                                <div className="flex flex-col sm:flex-row gap-6 items-center">
                                                    <div className={cn(
                                                        "w-24 h-24 rounded-full flex items-center justify-center border-4 shrink-0",
                                                        summary?.score >= 70 ? "border-green-500/50 bg-green-500/10" :
                                                            summary?.score >= 50 ? "border-blue-500/50 bg-blue-500/10" :
                                                                "border-amber-500/50 bg-amber-500/10"
                                                    )}>
                                                        <div className="text-center">
                                                            <p className={cn("text-3xl font-bold", getScoreColor(summary?.score || 0))}>
                                                                {summary?.score || 0}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground">/100</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 text-center sm:text-left">
                                                        <h3 className="text-xl font-semibold mb-2">{summary?.verdict || 'Analysis Complete'}</h3>
                                                        <p className="text-muted-foreground">{summary?.one_liner}</p>
                                                        {summary?.warnings?.length > 0 && (
                                                            <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
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
                                    </motion.div>
                                )}

                                {/* SLIDE 2: The Problem */}
                                {currentSlide === 1 && (
                                    <motion.div
                                        key="problem"
                                        custom={slideDirection}
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                                        className="space-y-4"
                                    >
                                        <div className="flex items-center gap-2 text-lg font-semibold">
                                            <span className="text-2xl">🎯</span>
                                            The Problem
                                        </div>
                                        <Card>
                                            <CardContent className="pt-6 space-y-4">
                                                <p className="text-muted-foreground leading-relaxed">
                                                    {problemSection?.description || problem.summary}
                                                </p>
                                                {problemSection?.target_audience && (
                                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                                        <Users className="h-5 w-5 text-primary" />
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Target Audience</p>
                                                            <p className="font-medium">{problemSection.target_audience}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {problemSection?.key_insights && problemSection.key_insights.length > 0 && (
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-medium">Key Insights:</p>
                                                        {problemSection.key_insights.slice(0, 3).map((insight: string, i: number) => (
                                                            <div key={i} className="flex items-start gap-2 text-sm">
                                                                <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                                                <span>{insight}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}

                                {/* SLIDE 3: Market Opportunity */}
                                {currentSlide === 2 && (
                                    <motion.div
                                        key="market"
                                        custom={slideDirection}
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                                        className="space-y-4"
                                    >
                                        <div className="flex items-center gap-2 text-lg font-semibold">
                                            <span className="text-2xl">📈</span>
                                            Market Opportunity
                                        </div>
                                        <div className="grid sm:grid-cols-3 gap-3">
                                            <Card className="text-center">
                                                <CardContent className="pt-4 pb-3">
                                                    <p className="text-xs text-muted-foreground mb-1">TAM</p>
                                                    <p className="text-xl font-bold text-green-500">{marketSection?.tam?.display || 'N/A'}</p>
                                                </CardContent>
                                            </Card>
                                            <Card className="text-center">
                                                <CardContent className="pt-4 pb-3">
                                                    <p className="text-xs text-muted-foreground mb-1">SAM</p>
                                                    <p className="text-xl font-bold">{marketSection?.sam?.display || 'N/A'}</p>
                                                </CardContent>
                                            </Card>
                                            <Card className="text-center border-primary/30">
                                                <CardContent className="pt-4 pb-3">
                                                    <p className="text-xs text-muted-foreground mb-1">SOM</p>
                                                    <p className="text-xl font-bold text-primary">{marketSection?.som?.display || 'N/A'}</p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                        {/* Charts */}
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {marketSection && <MarketSizeChart tam={marketSection.tam} sam={marketSection.sam} som={marketSection.som} />}
                                            {problem.trend && problem.trend.length > 1 && <TrendSparkline data={problem.trend} />}
                                        </div>
                                    </motion.div>
                                )}

                                {/* SLIDE 4: Competitor Gaps */}
                                {currentSlide === 3 && (
                                    <motion.div
                                        key="competitors"
                                        custom={slideDirection}
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                                        className="space-y-4"
                                    >
                                        <div className="flex items-center gap-2 text-lg font-semibold">
                                            <span className="text-2xl">⚔️</span>
                                            Your Unfair Advantage
                                        </div>
                                        {problem.competitor_intel?.gaps?.length > 0 || problem.competitor_intel?.pain_points?.length > 0 ? (
                                            <Card className="border-l-4 border-l-red-500">
                                                <CardContent className="pt-5 space-y-4">
                                                    {problem.competitor_intel.gaps?.length > 0 && (
                                                        <div>
                                                            <p className="text-sm font-semibold text-red-600 mb-2">Competitor Weaknesses:</p>
                                                            <div className="space-y-2">
                                                                {problem.competitor_intel.gaps.slice(0, 4).map((gap: string, i: number) => (
                                                                    <div key={i} className="flex items-start gap-2 text-sm">
                                                                        <span className="text-red-500 font-bold">×</span>
                                                                        <span>{gap}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {problem.competitor_intel.pain_points?.length > 0 && (
                                                        <div>
                                                            <p className="text-sm font-semibold text-amber-600 mb-2">User Pain Points:</p>
                                                            <div className="space-y-2">
                                                                {problem.competitor_intel.pain_points.slice(0, 3).map((pain: string, i: number) => (
                                                                    <div key={i} className="flex items-start gap-2 text-sm">
                                                                        <span className="text-amber-500">💢</span>
                                                                        <span>{pain}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ) : (
                                            <Card><CardContent className="pt-6 text-center text-muted-foreground">No competitor data available</CardContent></Card>
                                        )}
                                    </motion.div>
                                )}

                                {/* SLIDE 5: Validation */}
                                {currentSlide === 4 && (
                                    <motion.div
                                        key="validation"
                                        custom={slideDirection}
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                                        className="space-y-4"
                                    >
                                        <div className="flex items-center gap-2 text-lg font-semibold">
                                            <span className="text-2xl">✅</span>
                                            Validation Signals
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {problem.validation_strength?.breakdown && (
                                                <ValidationBreakdownChart breakdown={problem.validation_strength.breakdown} />
                                            )}
                                            {problem.opportunity_score?.factors && (
                                                <ScoreFactorsChart factors={problem.opportunity_score.factors} />
                                            )}
                                        </div>
                                        {problem.top_quotes && problem.top_quotes.length > 0 && (
                                            <Card>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                                        <Quote className="h-4 w-4" /> User Quotes
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-2">
                                                    {problem.top_quotes.slice(0, 2).map((quote: any, i: number) => (
                                                        <div key={i} className="p-3 rounded-lg bg-muted/50 border-l-2 border-primary/50 text-sm italic">
                                                            "{quote.text || quote}"
                                                        </div>
                                                    ))}
                                                </CardContent>
                                            </Card>
                                        )}
                                    </motion.div>
                                )}

                                {/* SLIDE 6: Action Plan */}
                                {currentSlide === 5 && (
                                    <motion.div
                                        key="action"
                                        custom={slideDirection}
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                                        className="space-y-4"
                                    >
                                        <div className="flex items-center gap-2 text-lg font-semibold">
                                            <span className="text-2xl">🚀</span>
                                            Action Plan
                                        </div>
                                        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                                            <Card className="text-center">
                                                <CardContent className="pt-4 pb-3">
                                                    <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                                    <p className="text-lg font-bold">{actionSection?.mvp_timeline || '?'}</p>
                                                    <p className="text-xs text-muted-foreground">MVP Time</p>
                                                </CardContent>
                                            </Card>
                                            <Card className="text-center">
                                                <CardContent className="pt-4 pb-3">
                                                    <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                                    <p className="text-lg font-bold">{actionSection?.solo_feasible ? 'Solo' : 'Team'}</p>
                                                    <p className="text-xs text-muted-foreground">Build Style</p>
                                                </CardContent>
                                            </Card>
                                            <Card className="text-center">
                                                <CardContent className="pt-4 pb-3">
                                                    <Target className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                                    <p className="text-lg font-bold capitalize">{actionSection?.complexity || '?'}</p>
                                                    <p className="text-xs text-muted-foreground">Complexity</p>
                                                </CardContent>
                                            </Card>
                                            <Card className="text-center">
                                                <CardContent className="pt-4 pb-3">
                                                    <DollarSign className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                                    <p className="text-lg font-bold">{actionSection?.estimated_cost?.solo || '?'}</p>
                                                    <p className="text-xs text-muted-foreground">Est. Cost</p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                        {actionSection?.first_10_customers && actionSection.first_10_customers.length > 0 && (
                                            <Card>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium">First 10 Customers:</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-2">
                                                    {actionSection.first_10_customers.slice(0, 3).map((tactic: string, i: number) => (
                                                        <div key={i} className="flex items-start gap-2 text-sm">
                                                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                                            <span>{tactic}</span>
                                                        </div>
                                                    ))}
                                                </CardContent>
                                            </Card>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Navigation Controls */}
                        <div className="flex items-center justify-between mt-4 sm:mt-6 pt-4 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goPrev}
                                disabled={currentSlide === 0}
                                className="gap-1 sm:gap-2 px-2 sm:px-4"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Previous</span>
                            </Button>

                            <div className="flex flex-col items-center gap-0.5">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">{currentSlide + 1}</span>
                                    <span>of</span>
                                    <span>{slides.length}</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground sm:hidden">Swipe ← →</span>
                                <span className="text-[10px] text-muted-foreground hidden sm:inline">Use ← → keys</span>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goNext}
                                disabled={currentSlide === slides.length - 1}
                                className="gap-1 sm:gap-2 px-2 sm:px-4"
                            >
                                <span className="hidden sm:inline">Next</span>
                                <ArrowLeft className="h-4 w-4 rotate-180" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ProblemDetails;

