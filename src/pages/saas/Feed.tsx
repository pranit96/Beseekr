import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Loader2,
    AlertCircle,
    Sparkles,
    TrendingUp,
    ThumbsUp,
    FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { problemsApi } from '@/api/problems';
import type { FeedResult } from '@/types/problems';
import { cn } from '@/lib/utils';

const INTEREST_OPTIONS = [
    { id: 'fintech', label: 'Fintech', emoji: '💰' },
    { id: 'saas', label: 'SaaS', emoji: '☁️' },
    { id: 'devtools', label: 'DevTools', emoji: '🛠️' },
    { id: 'open-source', label: 'Open Source', emoji: '🌐' },
    { id: 'AI', label: 'AI/ML', emoji: '🤖' },
    { id: 'marketplace', label: 'Marketplace', emoji: '🛒' },
    { id: 'healthcare', label: 'Healthcare', emoji: '🏥' },
    { id: 'education', label: 'Education', emoji: '📚' },
    { id: 'ecommerce', label: 'E-commerce', emoji: '🛍️' },
    { id: 'productivity', label: 'Productivity', emoji: '⚡' },
];

export function Feed() {
    const navigate = useNavigate();
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [results, setResults] = useState<FeedResult[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const {
        mutate: fetchFeed,
        isPending,
        isError,
        error,
    } = useMutation({
        mutationFn: (interests: string[]) => problemsApi.getUserFeed(interests, 20),
        onSuccess: (data) => {
            setResults(data);
            setHasSearched(true);
        },
    });

    const toggleInterest = (interest: string) => {
        setSelectedInterests((prev) =>
            prev.includes(interest)
                ? prev.filter((i) => i !== interest)
                : [...prev, interest]
        );
    };

    const handleSubmit = () => {
        if (selectedInterests.length > 0) {
            fetchFeed(selectedInterests);
        }
    };

    const handleCardClick = (id: string) => {
        navigate(`/dashboard/problems/${id}`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    Personalized Feed
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Select your interests to get personalized problem recommendations
                </p>
            </div>

            {/* Interest Selection */}
            <Card>
                <CardContent className="p-4">
                    <p className="text-sm font-medium mb-3">Select your interests:</p>
                    <div className="flex flex-wrap gap-2">
                        {INTEREST_OPTIONS.map((interest) => (
                            <Badge
                                key={interest.id}
                                variant={selectedInterests.includes(interest.id) ? 'default' : 'outline'}
                                className={cn(
                                    'cursor-pointer transition-all duration-200 px-3 py-1.5 text-sm',
                                    selectedInterests.includes(interest.id)
                                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                        : 'hover:bg-accent'
                                )}
                                onClick={() => toggleInterest(interest.id)}
                            >
                                <span className="mr-1.5">{interest.emoji}</span>
                                {interest.label}
                            </Badge>
                        ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
                        </p>
                        <Button
                            onClick={handleSubmit}
                            disabled={selectedInterests.length === 0 || isPending}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Get Recommendations
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Loading State */}
            {isPending && (
                <div className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-4 space-y-3">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
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
                            {error instanceof Error ? error.message : 'Failed to load feed. Please try again.'}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Results */}
            {!isPending && !isError && results.length > 0 && (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Found <span className="font-medium text-foreground">{results.length}</span> recommendation{results.length !== 1 ? 's' : ''}
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                        {results.map((result) => (
                            <Card
                                key={result.id}
                                className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30 group"
                                onClick={() => handleCardClick(result.id)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                {result.title}
                                            </h3>
                                            <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                                                {result.summary}
                                            </p>

                                            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <TrendingUp className="h-3.5 w-3.5" />
                                                    <span>{result.metrics?.frequency || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <ThumbsUp className="h-3.5 w-3.5" />
                                                    <span>{result.metrics?.upvote_score || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <FileText className="h-3.5 w-3.5" />
                                                    <span>{result.metrics?.source_count || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {result.relevance_score !== undefined && (
                                            <Badge variant="secondary" className="shrink-0">
                                                {Math.round(result.relevance_score * 100)}% relevant
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty Results */}
            {!isPending && !isError && hasSearched && results.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Sparkles className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-lg">No recommendations found</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Try selecting different interests
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default Feed;
