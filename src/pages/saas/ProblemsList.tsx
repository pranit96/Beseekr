import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Loader2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    ThumbsUp,
    FileText,
    Bookmark,
    BookmarkCheck,
    RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { problemsApi } from '@/api/problems';
import type { SortOption, ProblemListItem } from '@/types/problems';
import { cn } from '@/lib/utils';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'hot', label: 'Hot' },
    { value: 'trending', label: 'Trending' },
    { value: 'newest', label: 'Newest' },
    { value: 'top', label: 'Top' },
];

const ITEMS_PER_PAGE = 20;

function ProblemCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="flex gap-4 pt-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    </div>
                    <Skeleton className="h-9 w-24" />
                </div>
            </CardContent>
        </Card>
    );
}

function ProblemListCard({
    problem,
    inWatchlist,
    onWatchlistToggle,
}: {
    problem: ProblemListItem;
    inWatchlist: boolean;
    onWatchlistToggle: (id: string, watch: boolean) => void;
}) {
    const navigate = useNavigate();
    const isWatching = inWatchlist || problem.in_watchlist;

    const handleClick = () => {
        navigate(`/dashboard/problems/${problem.id}`);
    };

    const handleWatchlistClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onWatchlistToggle(problem.id, !isWatching);
    };

    // Trim summary
    const trimmedSummary =
        problem.summary?.length > 120
            ? `${problem.summary.substring(0, 120)}...`
            : problem.summary;

    return (
        <Card
            className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30 group"
            onClick={handleClick}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {problem.title}
                        </h3>
                        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                            {trimmedSummary}
                        </p>

                        {/* Metrics */}
                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <TrendingUp className="h-3.5 w-3.5" />
                                <span className="font-medium">{problem.metrics?.frequency?.toLocaleString() || 0}</span>
                                <span>frequency</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <ThumbsUp className="h-3.5 w-3.5" />
                                <span className="font-medium">{problem.metrics?.upvote_score?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5" />
                                <span className="font-medium">{problem.metrics?.source_count || 0}</span>
                                <span>sources</span>
                            </div>
                        </div>
                    </div>

                    {/* Watchlist Button */}
                    <Button
                        variant={isWatching ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={handleWatchlistClick}
                        className="shrink-0 gap-1.5"
                    >
                        {isWatching ? (
                            <>
                                <BookmarkCheck className="h-4 w-4" />
                                <span className="hidden sm:inline">Watching</span>
                            </>
                        ) : (
                            <>
                                <Bookmark className="h-4 w-4" />
                                <span className="hidden sm:inline">Watch</span>
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function ProblemsList() {
    const queryClient = useQueryClient();
    const [sort, setSort] = useState<SortOption>('hot');
    const [page, setPage] = useState(1);
    const [watchlistSet, setWatchlistSet] = useState<Set<string>>(new Set());

    // Fetch problems
    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ['problems', sort, page],
        queryFn: () => problemsApi.getProblems(sort, page, ITEMS_PER_PAGE),
        staleTime: 30000,
    });

    // Fetch watchlist
    const { data: watchlistData } = useQuery({
        queryKey: ['watchlist'],
        queryFn: () => problemsApi.getWatchlist(),
        staleTime: 60000,
    });

    useEffect(() => {
        if (watchlistData) {
            setWatchlistSet(new Set(watchlistData.map((item) => item.problem_id)));
        }
    }, [watchlistData]);

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

    const handleWatchlistToggle = (problemId: string, shouldWatch: boolean) => {
        if (shouldWatch) {
            addMutation.mutate(problemId);
            setWatchlistSet((prev) => new Set(prev).add(problemId));
        } else {
            removeMutation.mutate(problemId);
            setWatchlistSet((prev) => {
                const next = new Set(prev);
                next.delete(problemId);
                return next;
            });
        }
    };

    const handleSortChange = (value: string) => {
        setSort(value as SortOption);
        setPage(1);
    };

    const totalPages = data?.total_pages || 1;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        Discover Problems
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Find validated problems with real market demand
                    </p>
                </div>

                <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 self-start">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Sorting Tabs */}
            <Tabs value={sort} onValueChange={handleSortChange} className="w-full">
                <TabsList className="w-full sm:w-auto">
                    {SORT_OPTIONS.map((option) => (
                        <TabsTrigger key={option.value} value={option.value} className="flex-1 sm:flex-none">
                            {option.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {/* Loading State */}
            {isLoading && (
                <div className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <ProblemCardSkeleton key={i} />
                    ))}
                </div>
            )}

            {/* Error State */}
            {isError && (
                <Card className="border-destructive/50">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                            <AlertCircle className="h-6 w-6 text-destructive" />
                        </div>
                        <h3 className="font-semibold text-lg">Failed to load problems</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md">
                            {error instanceof Error ? error.message : 'Something went wrong. Please try again.'}
                        </p>
                        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {!isLoading && !isError && (!data?.items || data.items.length === 0) && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                            <TrendingUp className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-lg">No problems found</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Try a different sort order or check back later
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Problem Cards */}
            {!isLoading && !isError && data?.items && data.items.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    {data.items.map((problem: ProblemListItem) => (
                        <ProblemListCard
                            key={problem.id}
                            problem={problem}
                            inWatchlist={watchlistSet.has(problem.id)}
                            onWatchlistToggle={handleWatchlistToggle}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!isLoading && !isError && data && totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="gap-1"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="gap-1"
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}

export default ProblemsList;
