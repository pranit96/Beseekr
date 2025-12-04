import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Loader2,
    AlertCircle,
    Bookmark,
    Trash2,
    TrendingUp,
    ThumbsUp,
    FileText,
} from 'lucide-react';
import { problemsApi } from '@/api/problems';
import type { WatchlistItem } from '@/types/problems';

export function Watchlist() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {
        data: watchlist,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['watchlist'],
        queryFn: () => problemsApi.getWatchlist(),
    });

    const removeMutation = useMutation({
        mutationFn: problemsApi.removeFromWatchlist,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watchlist'] });
        },
    });

    const handleRemove = (problemId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        removeMutation.mutate(problemId);
    };

    const handleClick = (problemId: string) => {
        navigate(`/dashboard/problems/${problemId}`);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                <p className="text-sm text-muted-foreground">
                    {error instanceof Error ? error.message : 'Failed to load watchlist'}
                </p>
                <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['watchlist'] })}
                >
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Bookmark className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Your Watchlist</h1>
            </div>

            {/* Empty State */}
            {(!watchlist || watchlist.length === 0) && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No saved problems</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Start watching problems from the Discover page to track them here
                    </p>
                    <Button
                        className="mt-4"
                        onClick={() => navigate('/dashboard/problems')}
                    >
                        Discover Problems
                    </Button>
                </div>
            )}

            {/* Watchlist Items */}
            {watchlist && watchlist.length > 0 && (
                <div className="grid gap-4">
                    {watchlist.map((item: WatchlistItem) => (
                        <Card
                            key={item.problem_id}
                            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                            onClick={() => handleClick(item.problem_id)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-foreground line-clamp-1">
                                            {item.problem.title}
                                        </h3>
                                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                            {item.problem.summary}
                                        </p>

                                        {/* Metrics */}
                                        <div className="mt-3 flex items-center gap-4">
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <TrendingUp className="h-3 w-3" />
                                                <span>{item.problem.metrics.frequency}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <ThumbsUp className="h-3 w-3" />
                                                <span>{item.problem.metrics.upvote_score}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <FileText className="h-3 w-3" />
                                                <span>{item.problem.metrics.source_count}</span>
                                            </div>
                                        </div>

                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Added {new Date(item.added_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {/* Remove Button */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => handleRemove(item.problem_id, e)}
                                        disabled={removeMutation.isPending}
                                        className="shrink-0 text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Watchlist;
