import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search as SearchIcon, AlertCircle } from 'lucide-react';
import { ProblemCard } from '@/components/saas/ProblemCard';
import { problemsApi } from '@/api/problems';
import type { SearchResult } from '@/types/problems';

const MIN_QUERY_LENGTH = 2;

export function Search() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);

    const {
        mutate: search,
        isPending,
        isError,
        error,
    } = useMutation({
        mutationFn: (searchQuery: string) => problemsApi.searchProblems(searchQuery, 20),
        onSuccess: (data) => {
            setResults(data);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim().length >= MIN_QUERY_LENGTH) {
            search(query.trim());
        }
    };

    const isQueryValid = query.trim().length >= MIN_QUERY_LENGTH;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Search Problems</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Find problems by keyword or description
                </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search for problems..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button type="submit" disabled={!isQueryValid || isPending}>
                    {isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Searching
                        </>
                    ) : (
                        'Search'
                    )}
                </Button>
            </form>

            {/* Validation Message */}
            {query.length > 0 && query.length < MIN_QUERY_LENGTH && (
                <p className="text-sm text-muted-foreground">
                    Enter at least {MIN_QUERY_LENGTH} characters to search
                </p>
            )}

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
                        {error instanceof Error ? error.message : 'Search failed'}
                    </p>
                </div>
            )}

            {/* Results */}
            {!isPending && results.length > 0 && (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Found {results.length} result{results.length !== 1 ? 's' : ''}
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
                                showSimilarity={result.similarity}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty Results */}
            {!isPending && !isError && query.length >= MIN_QUERY_LENGTH && results.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm text-muted-foreground">No problems found for "{query}"</p>
                </div>
            )}
        </div>
    );
}

export default Search;
