import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Loader2,
    AlertCircle,
    ArrowLeft,
    Bookmark,
    BookmarkCheck,
    TrendingUp,
    ThumbsUp,
    FileText,
} from 'lucide-react';
import { TrendChart } from '@/components/saas/TrendChart';
import { PricingSignals } from '@/components/saas/PricingSignals';
import { CompetitorList } from '@/components/saas/CompetitorList';
import { MarketEstimateBox } from '@/components/saas/MarketEstimateBox';
import { QuoteList } from '@/components/saas/QuoteList';
import { SourceList } from '@/components/saas/SourceList';
import { problemsApi } from '@/api/problems';

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

    const isInWatchlist = watchlistData?.some((item) => item.problem_id === id);

    // Add to watchlist mutation
    const addMutation = useMutation({
        mutationFn: problemsApi.addToWatchlist,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watchlist'] });
        },
    });

    // Remove from watchlist mutation
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isError || !problem) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                <p className="text-sm text-muted-foreground">
                    {error instanceof Error ? error.message : 'Problem not found'}
                </p>
                <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
            </Button>

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">{problem.title}</h1>
                    <p className="mt-2 text-muted-foreground">{problem.summary}</p>
                </div>
                <Button
                    variant={isInWatchlist ? 'secondary' : 'default'}
                    onClick={handleWatchlistToggle}
                    disabled={addMutation.isPending || removeMutation.isPending}
                >
                    {isInWatchlist ? (
                        <>
                            <BookmarkCheck className="h-4 w-4 mr-2" />
                            Remove from Watchlist
                        </>
                    ) : (
                        <>
                            <Bookmark className="h-4 w-4 mr-2" />
                            Add to Watchlist
                        </>
                    )}
                </Button>
            </div>

            {/* Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Key Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-6">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-2xl font-bold">{problem.metrics.frequency}</p>
                                <p className="text-xs text-muted-foreground">Frequency</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <ThumbsUp className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-2xl font-bold">{problem.metrics.upvote_score}</p>
                                <p className="text-xs text-muted-foreground">Upvote Score</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-2xl font-bold">{problem.metrics.source_count}</p>
                                <p className="text-xs text-muted-foreground">Sources</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Trend Chart */}
            <TrendChart data={problem.trend} />

            {/* Two Column Layout */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-6">
                    <PricingSignals signals={problem.pricing_signals} />
                    <CompetitorList competitors={problem.competitors} />
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <MarketEstimateBox estimate={problem.market_estimate} />
                    <QuoteList quotes={problem.quotes} maxItems={5} />
                </div>
            </div>

            {/* Sources */}
            <SourceList sources={problem.sources} />
        </div>
    );
}

export default ProblemDetails;
