import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { problemsApi } from '@/api/problems';
import { cn } from '@/lib/utils';

export function ProblemDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Fetch problem details
    const {
        data: problem,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['problem', id],
        queryFn: () => problemsApi.getProblemDetails(id!),
        enabled: !!id,
    });

    // Check watchlist status
    const { data: watchlistData } = useQuery({
        queryKey: ['watchlist'],
        queryFn: () => problemsApi.getWatchlist(),
    });

    const isInWatchlist = Array.isArray(watchlistData) && watchlistData.some((item) => item.problem_id === id);

    // Mutations
    const addMutation = useMutation({
        mutationFn: problemsApi.addToWatchlist,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watchlist'] });
        },
    });

    const removeMutation = useMutation({
        mutationFn: problemsApi.removeFromWatchlist,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watchlist'] });
        },
    });

    const handleWatchlistToggle = () => {
        if (!id) return;
        if (isInWatchlist) {
            removeMutation.mutate(id);
        } else {
            addMutation.mutate(id);
        }
    };

    // Format trend data for chart
    const chartData = problem?.trend?.map((point) => ({
        date: new Date(point.snapshot_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        }),
        frequency: point.frequency,
    })) || [];

    const sourceTypeColors: Record<string, string> = {
        reddit: 'bg-orange-500',
        hackernews: 'bg-amber-500',
        twitter: 'bg-sky-500',
        linkedin: 'bg-blue-600',
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                </div>
                <Skeleton className="h-64" />
            </div>
        );
    }

    if (isError || !problem) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
                <Card className="border-destructive/50">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                        <h3 className="font-semibold text-lg">Problem not found</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {error instanceof Error ? error.message : 'This problem may have been removed'}
                        </p>
                        <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/problems')}>
                            Back to Problems
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 -ml-2">
                <ArrowLeft className="h-4 w-4" />
                Back
            </Button>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold">{problem.title}</h1>
                    <p className="mt-3 text-muted-foreground leading-relaxed">{problem.summary}</p>
                </div>
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
                    {isInWatchlist ? 'Watching' : 'Add to Watchlist'}
                </Button>
            </div>

            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{problem.metrics?.frequency?.toLocaleString() || 0}</p>
                                <p className="text-xs text-muted-foreground">Frequency</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <ThumbsUp className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{problem.metrics?.upvote_score?.toLocaleString() || 0}</p>
                                <p className="text-xs text-muted-foreground">Upvote Score</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{problem.metrics?.source_count || 0}</p>
                                <p className="text-xs text-muted-foreground">Sources</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Trend Chart */}
            {chartData.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Frequency Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                                    <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="frequency"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Two Column Layout */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Pricing Signals */}
                {problem.pricing_signals && problem.pricing_signals.length > 0 && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Pricing Signals
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2">
                            {problem.pricing_signals.map((signal) => (
                                <div key={signal.id} className="flex items-start gap-2">
                                    <Badge
                                        variant={signal.confidence >= 0.7 ? 'default' : 'secondary'}
                                        className="shrink-0 text-xs"
                                    >
                                        {Math.round(signal.confidence * 100)}%
                                    </Badge>
                                    <span className="text-sm">{signal.signal}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Competitors */}
                {problem.competitors && problem.competitors.length > 0 && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Competitors ({problem.competitors.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                            {problem.competitors.map((comp) => (
                                <div key={comp.id} className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{comp.name}</span>
                                            {comp.url && (
                                                <a
                                                    href={comp.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-muted-foreground hover:text-primary"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                        </div>
                                        {comp.description && (
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                {comp.description}
                                            </p>
                                        )}
                                    </div>
                                    {comp.relevance_score !== undefined && (
                                        <Badge variant="outline" className="shrink-0 text-xs">
                                            {Math.round(comp.relevance_score * 100)}%
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Market Estimate */}
                {problem.market_estimate && problem.market_estimate.size && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Market Estimate
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <p className="text-2xl font-bold text-primary">{problem.market_estimate.size}</p>
                            <p className="text-xs text-muted-foreground">Total Addressable Market</p>
                            {problem.market_estimate.growth_rate && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-green-500">
                                    <TrendingUp className="h-4 w-4" />
                                    {problem.market_estimate.growth_rate} growth
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Quotes */}
                {problem.quotes && problem.quotes.length > 0 && (
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Quote className="h-4 w-4" />
                                Top Quotes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-4">
                            {problem.quotes.slice(0, 5).map((quote) => (
                                <div key={quote.id} className="border-l-2 border-primary/30 pl-3">
                                    <p className="text-sm italic">"{quote.text}"</p>
                                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                        <span>{quote.source}</span>
                                        {quote.author && <span>— {quote.author}</span>}
                                        {quote.upvotes !== undefined && (
                                            <span className="flex items-center gap-1">
                                                <ThumbsUp className="h-3 w-3" />
                                                {quote.upvotes}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Sources */}
            {problem.sources && problem.sources.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                            Sources ({problem.sources.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid gap-2 sm:grid-cols-2">
                            {problem.sources.map((source) => (
                                <div key={source.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                    <Badge
                                        className={cn('shrink-0 text-xs text-white', sourceTypeColors[source.type] || 'bg-gray-500')}
                                    >
                                        {source.type}
                                    </Badge>
                                    <a
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary hover:underline truncate flex items-center gap-1"
                                    >
                                        <span className="truncate">{source.title}</span>
                                        <ExternalLink className="h-3 w-3 shrink-0" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default ProblemDetails;
