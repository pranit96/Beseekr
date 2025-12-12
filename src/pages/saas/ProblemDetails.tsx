import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
} from 'lucide-react';
import { problemsApi } from '@/api/problems';
import { cn } from '@/lib/utils';

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
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Navigation */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/problems')}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button
                    variant={isInWatchlist ? 'default' : 'outline'}
                    size="sm"
                    onClick={handleWatchlistToggle}
                    disabled={addMutation.isPending || removeMutation.isPending}
                >
                    {isInWatchlist ? <BookmarkCheck className="h-4 w-4 mr-2" /> : <Bookmark className="h-4 w-4 mr-2" />}
                    {isInWatchlist ? 'Watching' : 'Watch'}
                </Button>
            </div>

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

                    {/* TAM/SAM/SOM Cards */}
                    <div className="grid grid-cols-3 gap-3">
                        <Card className="text-center">
                            <CardContent className="pt-4 pb-3">
                                <p className="text-xs text-muted-foreground mb-1">TAM</p>
                                <p className="text-xl md:text-2xl font-bold text-green-500">
                                    {marketSection.tam?.display || 'N/A'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="text-center">
                            <CardContent className="pt-4 pb-3">
                                <p className="text-xs text-muted-foreground mb-1">SAM</p>
                                <p className="text-xl md:text-2xl font-bold">
                                    {marketSection.sam?.display || 'N/A'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="text-center">
                            <CardContent className="pt-4 pb-3">
                                <p className="text-xs text-muted-foreground mb-1">SOM</p>
                                <p className="text-xl md:text-2xl font-bold text-primary">
                                    {marketSection.som?.display || 'N/A'}
                                </p>
                            </CardContent>
                        </Card>
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
            {/* SLIDE 4: VALIDATION STATUS                                        */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {validationSection && (
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-blue-500" />
                        {validationSection.title || 'Validation Status'}
                    </h2>

                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            {/* Validation Score Bar */}
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Validation Score</span>
                                        <span className="font-medium">{validationSection.score}/{validationSection.max_score}</span>
                                    </div>
                                    <Progress value={(validationSection.score / validationSection.max_score) * 100} className="h-2" />
                                </div>
                            </div>

                            {/* Verdict */}
                            <p className={cn(
                                "text-sm font-medium px-3 py-2 rounded-lg inline-block",
                                validationSection.score >= 70 ? "bg-green-500/10 text-green-600" :
                                    validationSection.score >= 40 ? "bg-yellow-500/10 text-yellow-600" :
                                        "bg-amber-500/10 text-amber-600"
                            )}>
                                {validationSection.verdict}
                            </p>

                            {/* Signals */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                                <div className="text-center p-3 rounded-lg bg-muted/50">
                                    <p className="text-lg font-bold">{validationSection.signals?.discussions || 0}</p>
                                    <p className="text-xs text-muted-foreground">Discussions</p>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-muted/50">
                                    <p className="text-lg font-bold">{validationSection.signals?.sources || 0}</p>
                                    <p className="text-xs text-muted-foreground">Sources</p>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-muted/50">
                                    <p className="text-lg font-bold">{validationSection.signals?.quotes || 0}</p>
                                    <p className="text-xs text-muted-foreground">Quotes</p>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-muted/50">
                                    <p className="text-lg font-bold">{validationSection.signals?.external_signals || 0}</p>
                                    <p className="text-xs text-muted-foreground">External</p>
                                </div>
                            </div>

                            {/* What's Missing */}
                            {validationSection.what_is_missing?.length > 0 && (
                                <div className="pt-4 border-t space-y-2">
                                    <p className="text-sm font-medium text-amber-600">What's Missing</p>
                                    {validationSection.what_is_missing.slice(0, 3).map((item: string, i: number) => (
                                        <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                            <XCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                            {item}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* SLIDE 5: ACTION PLAN                                              */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {actionSection && (
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-purple-500" />
                        {actionSection.title || 'Next Steps'}
                    </h2>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Card className="text-center">
                            <CardContent className="pt-4 pb-3">
                                <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                <p className="text-lg font-bold">{actionSection.mvp_timeline || '?'}</p>
                                <p className="text-xs text-muted-foreground">MVP Time</p>
                            </CardContent>
                        </Card>
                        <Card className="text-center">
                            <CardContent className="pt-4 pb-3">
                                <TrendingUp className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                <p className="text-lg font-bold capitalize">{actionSection.complexity || 'medium'}</p>
                                <p className="text-xs text-muted-foreground">Complexity</p>
                            </CardContent>
                        </Card>
                        <Card className="text-center">
                            <CardContent className="pt-4 pb-3">
                                <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                <p className="text-lg font-bold">{actionSection.solo_feasible ? 'Yes' : 'Team'}</p>
                                <p className="text-xs text-muted-foreground">Solo Founder</p>
                            </CardContent>
                        </Card>
                        <Card className="text-center">
                            <CardContent className="pt-4 pb-3">
                                <DollarSign className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                <p className="text-sm font-bold">{actionSection.estimated_cost?.solo || 'N/A'}</p>
                                <p className="text-xs text-muted-foreground">Est. Cost</p>
                            </CardContent>
                        </Card>
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
        </div>
    );
}

export default ProblemDetails;
