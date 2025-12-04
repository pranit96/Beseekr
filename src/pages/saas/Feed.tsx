import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { ProblemCard } from '@/components/saas/ProblemCard';
import { problemsApi } from '@/api/problems';
import type { FeedResult } from '@/types/problems';
import { cn } from '@/lib/utils';

const INTEREST_OPTIONS = [
    'fintech',
    'saas',
    'devtools',
    'open-source',
    'AI',
    'marketplace',
    'healthcare',
    'education',
    'ecommerce',
    'productivity',
];

export function Feed() {
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [results, setResults] = useState<FeedResult[]>([]);

    const {
        mutate: fetchFeed,
        isPending,
        isError,
        error,
    } = useMutation({
        mutationFn: (interests: string[]) => problemsApi.getUserFeed(interests, 20),
        onSuccess: (data) => {
            setResults(data);
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="h-6 w-6" />
                    Personalized Feed
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Select your interests to get personalized problem recommendations
                </p>
            </div>

            {/* Interest Selection */}
            <div className="space-y-3">
                <p className="text-sm font-medium">Select your interests:</p>
                <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map((interest) => (
                        <Badge
                            key={interest}
                            variant={selectedInterests.includes(interest) ? 'default' : 'outline'}
                            className={cn(
                                'cursor-pointer transition-colors',
                                selectedInterests.includes(interest)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-accent'
                            )}
                            onClick={() => toggleInterest(interest)}
                        >
                            {interest}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Submit Button */}
            <Button
                onClick={handleSubmit}
                disabled={selectedInterests.length === 0 || isPending}
            >
                {isPending ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading Feed
                    </>
                ) : (
                    `Get Recommendations (${selectedInterests.length} selected)`
                )}
            </Button>

            {/* Loading State */}
            {isPending && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Error State */}
            {isError && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                    <p className="text-sm text-muted-foreground">
                        {error instanceof Error ? error.message : 'Failed to load feed'}
                    </p>
                </div>
            )}

            {/* Results */}
            {!isPending && results.length > 0 && (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Found {results.length} recommendation{results.length !== 1 ? 's' : ''}
                    </p>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                        {results.map((result) => (
                            <ProblemCard
                                key={result.id}
                                problem={{
                                    id: result.id,
                                    title: result.title,
                                    summary: result.summary,
                                    metrics: result.metrics,
                                }}
                                showRelevance={result.relevance_score}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty Results */}
            {!isPending && !isError && results.length === 0 && selectedInterests.length > 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                        No recommendations found for your interests. Try selecting different topics.
                    </p>
                </div>
            )}
        </div>
    );
}

export default Feed;
