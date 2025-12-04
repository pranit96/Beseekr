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

    return response.json();
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

    return request<PaginatedResponse<ProblemListItem>>(
        `/api/problems?${params.toString()}`
    );
}

/**
 * Get full problem details by ID
 */
export async function getProblemDetails(id: string): Promise<Problem> {
    return request<Problem>(`/api/problems/${id}`);
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
    return request<WatchlistItem[]>('/api/problems/watchlist');
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
