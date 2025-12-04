import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark, BookmarkCheck, TrendingUp, ThumbsUp, FileText } from 'lucide-react';
import type { ProblemListItem, ProblemMetrics } from '@/types/problems';

interface ProblemCardProps {
    problem: ProblemListItem;
    inWatchlist?: boolean;
    onWatchlistToggle?: (problemId: string, isWatching: boolean) => void;
    showSimilarity?: number;
    showRelevance?: number;
    basePath?: string;
}

function MetricBadge({
    icon: Icon,
    value,
    label,
}: {
    icon: React.ElementType;
    value: number;
    label: string;
}) {
    return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Icon className="h-3 w-3" />
            <span>{value.toLocaleString()}</span>
            <span className="sr-only">{label}</span>
        </div>
    );
}

export function ProblemCard({
    problem,
    inWatchlist = false,
    onWatchlistToggle,
    showSimilarity,
    showRelevance,
    basePath = '/dashboard',
}: ProblemCardProps) {
    const navigate = useNavigate();
    const isWatching = inWatchlist || problem.in_watchlist;

    const handleClick = () => {
        navigate(`${basePath}/problems/${problem.id}`);
    };

    const handleWatchlistClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onWatchlistToggle?.(problem.id, !isWatching);
    };

    // Trim summary to ~100 chars
    const trimmedSummary =
        problem.summary.length > 100
            ? `${problem.summary.substring(0, 100)}...`
            : problem.summary;

    return (
        <Card
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
            onClick={handleClick}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground line-clamp-1">
                            {problem.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {trimmedSummary}
                        </p>

                        {/* Metrics */}
                        <div className="mt-3 flex items-center gap-4">
                            <MetricBadge
                                icon={TrendingUp}
                                value={problem.metrics.frequency}
                                label="frequency"
                            />
                            <MetricBadge
                                icon={ThumbsUp}
                                value={problem.metrics.upvote_score}
                                label="upvotes"
                            />
                            <MetricBadge
                                icon={FileText}
                                value={problem.metrics.source_count}
                                label="sources"
                            />
                        </div>

                        {/* Similarity/Relevance score if provided */}
                        {(showSimilarity !== undefined || showRelevance !== undefined) && (
                            <div className="mt-2">
                                {showSimilarity !== undefined && (
                                    <Badge variant="secondary" className="text-xs">
                                        Similarity: {(showSimilarity * 100).toFixed(1)}%
                                    </Badge>
                                )}
                                {showRelevance !== undefined && (
                                    <Badge variant="secondary" className="text-xs">
                                        Relevance: {(showRelevance * 100).toFixed(1)}%
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Watchlist Button */}
                    {onWatchlistToggle && (
                        <Button
                            variant={isWatching ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={handleWatchlistClick}
                            className="shrink-0"
                        >
                            {isWatching ? (
                                <>
                                    <BookmarkCheck className="h-4 w-4 mr-1" />
                                    Watching
                                </>
                            ) : (
                                <>
                                    <Bookmark className="h-4 w-4 mr-1" />
                                    + Watch
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default ProblemCard;
