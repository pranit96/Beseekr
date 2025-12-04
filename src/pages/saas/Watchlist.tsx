import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Loader2,
    AlertCircle,
    Bookmark,
    Trash2,
    TrendingUp,
    ThumbsUp,
    FileText,
    RefreshCw,
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
        refetch,
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text flex items-center gap-2">
                        <Bookmark className="h-6 w-6 text-primary" />
                        Your Watchlist
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Problems you're tracking for validation
                    </p>
                </div>

                <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 self-start">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="grid gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </div>
                                    <Skeleton className="h-9 w-9" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Error State */}
            {isError && (
                <Card className="border-destructive/50">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                        <p className="text-sm text-muted-foreground">
                            {error instanceof Error ? error.message : 'Failed to load watchlist'}
                        </p>
                        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {!isLoading && !isError && (!watchlist || watchlist.length === 0) && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Bookmark className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="font-semibold text-xl">No saved problems yet</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-md">
                            Start watching problems from the Discover page to track them here for future reference
                        </p>
                        <Button className="mt-6" onClick={() => navigate('/dashboard/problems')}>
                            Discover Problems
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Watchlist Items */}
            {!isLoading && !isError && watchlist && watchlist.length > 0 && (
                <div className="grid gap-4">
                    {watchlist.map((item: WatchlistItem) => (
                        <Card
                            key={item.problem_id}
                            className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30 group"
                            onClick={() => handleClick(item.problem_id)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                            {item.problem?.title || 'Untitled Problem'}
                                        </h3>
                                        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                                            {item.problem?.summary || 'No description available'}
                                        </p>

                                        {/* Metrics */}
                                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <TrendingUp className="h-3.5 w-3.5" />
                                                <span className="font-medium">{item.problem?.metrics?.frequency || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <ThumbsUp className="h-3.5 w-3.5" />
                                                <span className="font-medium">{item.problem?.metrics?.upvote_score || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <FileText className="h-3.5 w-3.5" />
                                                <span className="font-medium">{item.problem?.metrics?.source_count || 0}</span>
                                            </div>
                                            <span className="text-muted-foreground/60">•</span>
                                            <span>Added {new Date(item.added_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Remove Button */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => handleRemove(item.problem_id, e)}
                                        disabled={removeMutation.isPending}
                                        className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    >
                                        {removeMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
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
