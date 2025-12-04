import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Loader2,
    Search as SearchIcon,
    AlertCircle,
    TrendingUp,
    ThumbsUp,
    FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { problemsApi } from '@/api/problems';
import type { SearchResult } from '@/types/problems';
import { cn } from '@/lib/utils';

const MIN_QUERY_LENGTH = 2;

export function Search() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const {
        mutate: search,
        isPending,
        isError,
        error,
    } = useMutation({
        mutationFn: (searchQuery: string) => problemsApi.searchProblems(searchQuery, 20),
        onSuccess: (data) => {
            setResults(Array.isArray(data) ? data : []);
            setHasSearched(true);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim().length >= MIN_QUERY_LENGTH) {
            search(query.trim());
        }
    };

    const handleCardClick = (id: string) => {
        navigate(`/dashboard/problems/${id}`);
    };

    const isQueryValid = query.trim().length >= MIN_QUERY_LENGTH;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Search Problems
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Find problems by keyword, description, or topic
                </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSubmit}>
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Enter keywords or describe the problem..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-10 h-11"
                        />
                    </div>
                    <Button type="submit" disabled={!isQueryValid || isPending} className="h-11 px-6">
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Searching
                            </>
                        ) : (
                            'Search'
                        )}
                    </Button>
                </div>
                {query.length > 0 && query.length < MIN_QUERY_LENGTH && (
                    <p className="text-xs text-muted-foreground mt-2">
                        Enter at least {MIN_QUERY_LENGTH} characters to search
                    </p>
                )}
            </form>

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
                            {error instanceof Error ? error.message : 'Search failed. Please try again.'}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Results */}
            {!isPending && !isError && results.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Found <span className="font-medium text-foreground">{results.length}</span> result{results.length !== 1 ? 's' : ''}
                        </p>
                    </div>
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

                                        {result.similarity !== undefined && (
                                            <Badge variant="secondary" className="shrink-0">
                                                {Math.round(result.similarity * 100)}% match
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
                            <SearchIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-lg">No results found</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Try different keywords or broaden your search
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Initial State */}
            {!hasSearched && !isPending && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <SearchIcon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg">Start your search</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md">
                            Enter keywords to find problems that match your interests or validate your ideas
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default Search;
