// API client for Problems Discovery and Validation features

import type {
    Problem,
    ProblemListItem,
    SearchResult,
    FeedResult,
    ValidationResult,
    WatchlistItem,
    SortOption,
    PaginatedResponse,
} from '@/types/problems';

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

// Get user ID from localStorage
const getUserId = (): string => {
    return localStorage.getItem('user_id') || '';
};

// Standard headers for authenticated calls
const getAuthHeaders = (): HeadersInit => ({
    'Content-Type': 'application/json',
    'x-user-id': getUserId(),
});

// Base request helper
async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            ...getAuthHeaders(),
            ...options.headers,
        },
        credentials: 'include',
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed: ${response.status}`);
    }

    const json = await response.json();

    // Backend wraps responses in {success: true, data: {...}}
    // Unwrap the data field if it exists
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
        return json.data as T;
    }

    return json;
}

/**
 * Get paginated list of problems
 */
export async function getProblems(
    sort: SortOption = 'hot',
    page: number = 1,
    limit: number = 20
): Promise<PaginatedResponse<ProblemListItem>> {
    const params = new URLSearchParams({
        sort,
        page: String(page),
        limit: String(limit),
    });

    const response = await request<any>(
        `/api/problems?${params.toString()}`
    );

    // Map backend field names to frontend expected names
    return {
        items: response.problems || [],
        total: response.total || 0,
        page: response.page || 1,
        limit: response.limit || 20,
        total_pages: response.totalPages || 1,
    };
}

/**
 * Get full problem details by ID
 */
export async function getProblemDetails(id: string): Promise<Problem> {
    const response = await request<any>(`/api/problems/${id}`);

    // Transform backend response to frontend Problem type
    return {
        id: response.id,
        title: response.title,
        summary: response.summary,
        metrics: response.metrics || {
            frequency: response.frequency || 0,
            upvote_score: response.upvote_score || 0,
            source_count: response.source_count || 0,
        },
        trend: response.trend || [],
        pricing_signals: response.pricing_signals || [],
        competitors: response.similar_problems?.map((sp: any) => ({
            id: sp.id || sp.problem_id,
            name: sp.title,
            description: sp.summary,
            relevance_score: sp.similarity_score,
        })) || [],
        market_estimate: response.market_estimate ? {
            size: formatMarketSize(response.market_estimate.tam_low, response.market_estimate.tam_high),
            confidence: response.market_estimate.confidence,
        } : undefined,
        quotes: response.top_quotes?.map((q: any, idx: number) => ({
            id: q.id || `quote-${idx}`,
            text: q.text || q.body,
            source: q.source || q.subreddit || 'Unknown',
            author: q.author,
            upvotes: q.ups || q.upvotes,
        })) || [],
        sources: response.related_posts?.map((post: any, idx: number) => ({
            id: post.post_id || `source-${idx}`,
            url: post.permalink || post.url || '',
            title: post.title || 'Untitled',
            type: post.subreddit || response.sources?.[0] || 'unknown',
        })) || [],
        created_at: response.created_at,
        updated_at: response.last_updated || response.updated_at,
    } as Problem;
}

// Helper to format market size
function formatMarketSize(low?: number, high?: number): string {
    if (!low && !high) return 'N/A';

    const formatNumber = (num: number) => {
        if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1)}B`;
        if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
        return `$${num}`;
    };

    if (low && high) {
        return `${formatNumber(low)} - ${formatNumber(high)}`;
    }
    return formatNumber(low || high || 0);
}

/**
 * Search problems by query
 */
export async function searchProblems(
    query: string,
    limit: number = 20
): Promise<SearchResult[]> {
    return request<SearchResult[]>('/api/problems/search', {
        method: 'POST',
        body: JSON.stringify({ query, limit }),
    });
}

/**
 * Get personalized feed based on interests
 */
export async function getUserFeed(
    interests: string[],
    limit: number = 20
): Promise<FeedResult[]> {
    return request<FeedResult[]>('/api/problems/user-feed', {
        method: 'POST',
        body: JSON.stringify({ interests, limit }),
    });
}

/**
 * Get user's watchlist
 */
export async function getWatchlist(): Promise<WatchlistItem[]> {
    const response = await request<any>('/api/problems/watchlist');

    // Transform backend response to frontend WatchlistItem format
    const items = response.items || [];

    return items.map((item: any) => ({
        problem_id: item.id,
        added_at: item.added_at,
        problem: {
            id: item.id,
            title: item.title,
            summary: item.summary || '',
            metrics: {
                frequency: item.frequency || 0,
                upvote_score: item.upvote_score || 0,
                source_count: item.source_count || 0,
            },
            in_watchlist: true,
        },
    }));
}

/**
 * Check if a problem is in watchlist
 */
export async function checkWatchlistStatus(problemId: string): Promise<boolean> {
    const watchlist = await getWatchlist();
    return watchlist.some(item => item.problem_id === problemId);
}

/**
 * Add problem to watchlist
 */
export async function addToWatchlist(problemId: string): Promise<void> {
    await request<void>('/api/problems/watchlist', {
        method: 'POST',
        body: JSON.stringify({ problem_id: problemId }),
    });
}

/**
 * Remove problem from watchlist
 */
export async function removeFromWatchlist(problemId: string): Promise<void> {
    await request<void>(`/api/problems/watchlist/${problemId}`, {
        method: 'DELETE',
    });
}

/**
 * Validate a problem idea
 */
export async function validateProblem(text: string): Promise<ValidationResult> {
    return request<ValidationResult>('/api/validate-problem', {
        method: 'POST',
        body: JSON.stringify({ problem: text }),
    });
}

// Export all functions as a namespace for convenience
export const problemsApi = {
    getProblems,
    getProblemDetails,
    searchProblems,
    getUserFeed,
    getWatchlist,
    checkWatchlistStatus,
    addToWatchlist,
    removeFromWatchlist,
    validateProblem,
};

export default problemsApi;
