import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    TrendingUp,
    ThumbsUp,
    FileText,
    Bookmark,
    BookmarkCheck,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Flame,
    Clock,
    ArrowUpRight,
    Zap,
    Search,
    LayoutGrid,
    List,
    X,
} from 'lucide-react';
import { problemsApi } from '@/api/problems';
import type { SortOption, ProblemListItem } from '@/types/problems';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 12;

// Skeleton loading card
function ProblemCardSkeleton({ isListView }: { isListView: boolean }) {
    if (isListView) {
        return (
            <Card>
                <CardContent className="p-4 flex items-center gap-4">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                    <div className="ml-auto flex gap-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardContent className="p-5">
                <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex gap-2 pt-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Problem card component - Grid view
function ProblemCardGrid({
    problem,
    isWatching,
    onWatchlistToggle,
}: {
    problem: ProblemListItem;
    isWatching: boolean;
    onWatchlistToggle: (id: string, add: boolean) => void;
}) {
    const navigate = useNavigate();

    const handleClick = () => navigate(`/dashboard/problems/${problem.id}`);

    const handleWatchlistClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onWatchlistToggle(problem.id, !isWatching);
    };

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-green-500 bg-green-500/10';
        if (score >= 50) return 'text-yellow-500 bg-yellow-500/10';
        return 'text-red-500 bg-red-500/10';
    };

    return (
        <Card
            className={cn(
                "h-full cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/40 group",
                problem.has_brief && problem.brief_approved && "border-l-4 border-l-primary"
            )}
            onClick={handleClick}
        >
            <CardContent className="p-5 h-full flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            {problem.tags?.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs px-2 py-0 font-normal">
                                    {tag}
                                </Badge>
                            ))}
                            {problem.has_brief && problem.brief_approved && (
                                <Badge variant="default" className="text-xs px-2 py-0">
                                    📊 Brief
                                </Badge>
                            )}
                        </div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                            {problem.title}
                        </h3>
                    </div>
                    <button
                        onClick={handleWatchlistClick}
                        className={cn(
                            "shrink-0 p-2 rounded-md transition-all",
                            isWatching
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {isWatching ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    </button>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 flex-grow mb-4">
                    {problem.summary || 'No description available'}
                </p>

                <div className="flex items-center gap-3 text-xs pt-3 border-t">
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span className="font-medium">{problem.metrics?.frequency || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span className="font-medium">{problem.metrics?.upvote_score?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        <span className="font-medium">{problem.metrics?.source_count || 0}</span>
                    </div>
                    {problem.opportunity_score && problem.opportunity_score > 0 && (
                        <div className={cn(
                            "ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold",
                            getScoreColor(problem.opportunity_score)
                        )}>
                            <Zap className="h-3 w-3" />
                            <span>{problem.opportunity_score}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// Problem card component - List view
function ProblemCardList({
    problem,
    isWatching,
    onWatchlistToggle,
}: {
    problem: ProblemListItem;
    isWatching: boolean;
    onWatchlistToggle: (id: string, add: boolean) => void;
}) {
    const navigate = useNavigate();

    const handleClick = () => navigate(`/dashboard/problems/${problem.id}`);

    const handleWatchlistClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onWatchlistToggle(problem.id, !isWatching);
    };

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-green-500 bg-green-500/10';
        if (score >= 50) return 'text-yellow-500 bg-yellow-500/10';
        return 'text-red-500 bg-red-500/10';
    };

    return (
        <Card
            className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/40 group",
                problem.has_brief && problem.brief_approved && "border-l-4 border-l-primary"
            )}
            onClick={handleClick}
        >
            <CardContent className="p-4">
                <div className="flex items-center gap-4">
                    {/* Title & Tags */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                {problem.title}
                            </h3>
                            {problem.tags?.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs px-2 py-0 font-normal hidden sm:inline-flex">
                                    {tag}
                                </Badge>
                            ))}
                            {problem.has_brief && problem.brief_approved && (
                                <Badge variant="default" className="text-xs px-2 py-0 hidden sm:inline-flex">
                                    📊 Brief
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                        <div className="flex items-center gap-1 hidden md:flex">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span className="font-medium">{problem.metrics?.frequency || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <ThumbsUp className="h-3.5 w-3.5" />
                            <span className="font-medium">{problem.metrics?.upvote_score?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 hidden md:flex">
                            <FileText className="h-3.5 w-3.5" />
                            <span className="font-medium">{problem.metrics?.source_count || 0}</span>
                        </div>
                        {problem.opportunity_score && problem.opportunity_score > 0 && (
                            <div className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold",
                                getScoreColor(problem.opportunity_score)
                            )}>
                                <Zap className="h-3 w-3" />
                                <span>{problem.opportunity_score}</span>
                            </div>
                        )}
                    </div>

                    {/* Watchlist Button */}
                    <button
                        onClick={handleWatchlistClick}
                        className={cn(
                            "shrink-0 p-2 rounded-md transition-all",
                            isWatching
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {isWatching ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}

export function ProblemsList() {
    const queryClient = useQueryClient();
    const [sort, setSort] = useState<SortOption>('hot');
    const [page, setPage] = useState(1);
    const [watchingIds, setWatchingIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('problemsViewMode') as 'grid' | 'list') || 'grid';
        }
        return 'grid';
    });

    // Save view mode preference
    useEffect(() => {
        localStorage.setItem('problemsViewMode', viewMode);
    }, [viewMode]);

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

    const problemItems = data?.items || [];

    // Filter problems based on search query
    const filteredProblems = useMemo(() => {
        if (!searchQuery.trim()) return problemItems;

        const query = searchQuery.toLowerCase();
        return problemItems.filter(problem =>
            problem.title.toLowerCase().includes(query) ||
            problem.summary?.toLowerCase().includes(query) ||
            problem.tags?.some(tag => tag.toLowerCase().includes(query))
        );
    }, [problemItems, searchQuery]);

    const { data: watchlistData } = useQuery({
        queryKey: ['watchlist'],
        queryFn: () => problemsApi.getWatchlist(),
        staleTime: 60000,
    });

    const watchlistItems = Array.isArray(watchlistData) ? watchlistData : [];

    useEffect(() => {
        if (watchlistItems.length > 0) {
            const ids = new Set(watchlistItems.map((item) => item.problem_id));
            setWatchingIds(ids);
        }
    }, [watchlistItems]);

    const addMutation = useMutation({
        mutationFn: problemsApi.addToWatchlist,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
    });

    const removeMutation = useMutation({
        mutationFn: problemsApi.removeFromWatchlist,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
    });

    const handleWatchlistToggle = (id: string, add: boolean) => {
        if (add) {
            addMutation.mutate(id);
            setWatchingIds((prev) => new Set([...prev, id]));
        } else {
            removeMutation.mutate(id);
            setWatchingIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }
    };

    const totalPages = data?.total_pages || 1;

    const sortOptions = [
        { value: 'hot', label: 'Trending', icon: Flame },
        { value: 'trending', label: 'Rising', icon: TrendingUp },
        { value: 'newest', label: 'Newest', icon: Clock },
        { value: 'top', label: 'Top', icon: ArrowUpRight },
    ] as const;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Discover Problems</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            {data?.total || 0} validated startup problems
                            {searchQuery && ` • ${filteredProblems.length} matching`}
                        </p>
                    </div>

                    {/* View Toggle & Sort */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center border rounded-md">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    "p-2 transition-colors",
                                    viewMode === 'grid'
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted text-muted-foreground"
                                )}
                                title="Grid view"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "p-2 transition-colors",
                                    viewMode === 'list'
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted text-muted-foreground"
                                )}
                                title="List view"
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>

                        <Select value={sort} onValueChange={(v) => { setSort(v as SortOption); setPage(1); }}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {sortOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        <div className="flex items-center gap-2">
                                            <option.icon className="h-4 w-4" />
                                            {option.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by title, summary, or tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-9"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className={viewMode === 'grid' ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <ProblemCardSkeleton key={i} isListView={viewMode === 'list'} />
                    ))}
                </div>
            )}

            {/* Error State */}
            {isError && (
                <Card className="border-destructive/50">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
                        <h3 className="font-semibold text-lg">Failed to load problems</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md">
                            {error instanceof Error ? error.message : 'Please try again later'}
                        </p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => queryClient.invalidateQueries({ queryKey: ['problems'] })}
                        >
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Empty/No Results State */}
            {!isLoading && !isError && filteredProblems.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            {searchQuery ? (
                                <Search className="h-8 w-8 text-muted-foreground" />
                            ) : (
                                <FileText className="h-8 w-8 text-muted-foreground" />
                            )}
                        </div>
                        <h3 className="font-semibold text-lg">
                            {searchQuery ? 'No matching problems' : 'No problems found'}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {searchQuery
                                ? `Try a different search term or clear the filter`
                                : 'Check back later for new validated problems'
                            }
                        </p>
                        {searchQuery && (
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => setSearchQuery('')}
                            >
                                Clear Search
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Problems Grid/List */}
            {!isLoading && !isError && filteredProblems.length > 0 && (
                viewMode === 'grid' ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredProblems.map((problem) => (
                            <ProblemCardGrid
                                key={problem.id}
                                problem={problem}
                                isWatching={watchingIds.has(problem.id)}
                                onWatchlistToggle={handleWatchlistToggle}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredProblems.map((problem) => (
                            <ProblemCardList
                                key={problem.id}
                                problem={problem}
                                isWatching={watchingIds.has(problem.id)}
                                onWatchlistToggle={handleWatchlistToggle}
                            />
                        ))}
                    </div>
                )
            )}

            {/* Pagination */}
            {!isLoading && totalPages > 1 && !searchQuery && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (page <= 3) {
                                pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = page - 2 + i;
                            }

                            return (
                                <Button
                                    key={pageNum}
                                    variant={page === pageNum ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setPage(pageNum)}
                                    className="w-9"
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}

export default ProblemsList;
