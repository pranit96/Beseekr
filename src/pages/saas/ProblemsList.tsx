import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProblemCard } from '@/components/saas/ProblemCard';
import { problemsApi } from '@/api/problems';
import type { SortOption, ProblemListItem } from '@/types/problems';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'hot', label: 'Hot' },
    { value: 'trending', label: 'Trending' },
    { value: 'newest', label: 'Newest' },
    { value: 'top', label: 'Top' },
];

const ITEMS_PER_PAGE = 20;

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
    } = useQuery({
        queryKey: ['problems', sort, page],
        queryFn: () => problemsApi.getProblems(sort, page, ITEMS_PER_PAGE),
        staleTime: 30000,
    });

    // Fetch watchlist to track which problems are watched
    const { data: watchlistData } = useQuery({
        queryKey: ['watchlist'],
        queryFn: () => problemsApi.getWatchlist(),
        staleTime: 60000,
    });

    // Update watchlist set when data changes
    useEffect(() => {
        if (watchlistData) {
            setWatchlistSet(new Set(watchlistData.map((item) => item.problem_id)));
        }
    }, [watchlistData]);

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
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Discover Problems</h1>
            </div>

            {/* Sorting Tabs */}
            <Tabs value={sort} onValueChange={handleSortChange}>
                <TabsList>
                    {SORT_OPTIONS.map((option) => (
                        <TabsTrigger key={option.value} value={option.value}>
                            {option.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Error State */}
            {isError && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                    <p className="text-sm text-muted-foreground">
                        {error instanceof Error ? error.message : 'Failed to load problems'}
                    </p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['problems'] })}
                    >
                        Try Again
                    </Button>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && (!data?.items || data.items.length === 0) && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm text-muted-foreground">No problems found</p>
                </div>
            )}

            {/* Problem Cards */}
            {!isLoading && !isError && data?.items && data.items.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    {data.items.map((problem: ProblemListItem) => (
                        <ProblemCard
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
                <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            )}
        </div>
    );
}

export default ProblemsList;
