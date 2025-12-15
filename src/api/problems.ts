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

// Custom error class that includes full API response
export class ApiError extends Error {
    data: any;
    status: number;

    constructor(message: string, data: any, status: number) {
        super(message);
        this.name = 'ApiError';
        this.data = data;
        this.status = status;
    }
}

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
        // Throw ApiError with full response data for upgrade errors, etc.
        throw new ApiError(
            errorData.message || errorData.error || `Request failed: ${response.status}`,
            errorData,
            response.status
        );
    }

    const json = await response.json();

    // Backend wraps responses in {success: true, data: {...}}
    // Unwrap the data field if it exists
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
        return json.data as T;
    }

    return json;
}

// ====== LOCAL STORAGE CACHING FOR INSTANT LOADS ======
const CACHE_PREFIX = 'beseekr_cache_';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

function getCached<T>(key: string): T | null {
    try {
        const cached = localStorage.getItem(CACHE_PREFIX + key);
        if (!cached) return null;

        const entry: CacheEntry<T> = JSON.parse(cached);
        if (Date.now() - entry.timestamp > CACHE_TTL) {
            localStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }
        return entry.data;
    } catch {
        return null;
    }
}

function setCache<T>(key: string, data: T): void {
    try {
        const entry: CacheEntry<T> = { data, timestamp: Date.now() };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
        // localStorage full or disabled - ignore
    }
}

function clearProblemsCache(): void {
    try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX + 'problems'));
        keys.forEach(k => localStorage.removeItem(k));
    } catch {
        // ignore
    }
}

/**
 * Get paginated list of problems
 * Uses cache-first pattern: returns cached data instantly, fetches fresh in background
 */
export async function getProblems(
    sort: SortOption = 'hot',
    page: number = 1,
    limit: number = 20
): Promise<{
    items: ProblemListItem[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    gated?: boolean;
    total_available?: number;
    showing?: number;
    upgrade_message?: string;
    fromCache?: boolean;
}> {
    const cacheKey = `problems_${sort}_${page}_${limit}`;

    const params = new URLSearchParams({
        sort,
        page: String(page),
        limit: String(limit),
    });

    // Try to get cached data first for instant display
    const cached = getCached<any>(cacheKey);

    try {
        const response = await request<any>(
            `/api/problems?${params.toString()}`
        );

        // Robust null checks - ensure we always return valid structure
        if (!response || typeof response !== 'object') {
            // If no response, return cache if available
            if (cached) return { ...cached, fromCache: true };
            return {
                items: [],
                total: 0,
                page: 1,
                limit: 20,
                total_pages: 1,
            };
        }

        // Map backend field names to frontend expected names
        const problems = Array.isArray(response.problems) ? response.problems : [];

        const result = {
            items: problems.map((problem: any) => ({
                id: problem.id,
                title: problem.title || 'Untitled',
                summary: problem.summary || problem.description || '',
                metrics: {
                    frequency: problem.frequency || 0,
                    upvote_score: problem.upvote_score || 0,
                    source_count: problem.source_count || problem.related_posts?.length || 0,
                },
                in_watchlist: problem.in_watchlist || false,
                tags: problem.tags || [],
                hot_score: problem.hot_score,
                opportunity_score: problem.opportunity_score,
                has_brief: problem.has_brief,
                brief_approved: problem.brief_approved,
                last_updated: problem.last_updated,
                created_at: problem.created_at,
                // Rating fields (from nested feedback object)
                upvotes: problem.feedback?.upvotes ?? 0,
                downvotes: problem.feedback?.downvotes ?? 0,
                user_vote: problem.feedback?.user_vote ?? problem.user_vote ?? null,
            })),
            total: response.total || response.total_available || 0,
            page: response.page || 1,
            limit: response.limit || 20,
            total_pages: response.total_pages || response.totalPages || 1,
            gated: response.gated || false,
            total_available: response.total_available,
            showing: response.showing,
            upgrade_message: response.upgrade_message,
        };

        // Cache the result for future instant loads
        setCache(cacheKey, result);

        return result;
    } catch (error) {
        // On network error, return cached data if available
        if (cached) {
            console.log('[Problems API] Network error, using cached data');
            return { ...cached, fromCache: true };
        }
        throw error;
    }
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
        // Use description if available, fallback to summary
        summary: response.description || response.summary || '',
        metrics: {
            frequency: response.frequency || 0,
            upvote_score: response.upvote_score || response.total_upvotes || 0,
            // Calculate from actual related_posts, backend's source_count is often 0
            source_count: response.related_posts?.length || 0,
        },
        // Map trend data with enhanced fields
        trend: response.trend?.map((t: any) => ({
            snapshot_date: t.snapshot_date,
            frequency: t.frequency || 0,
            upvotes: t.total_upvotes,
            growth_7d: t.growth_7d,
            growth_30d: t.growth_30d,
            momentum: t.momentum,
        })) || [],
        pricing_signals: response.pricing_signals || [],
        // Map competitors with enriched data (backend now provides detailed competitor info)
        competitors: response.competitors?.map((comp: any) => ({
            name: comp.name,
            description: comp.strengths?.join(', ') || '',
            competitor_type: comp.competitor_type,
            mention_count: comp.mention_count,
            sentiment: comp.sentiment,
            strengths: comp.strengths || [],
            weaknesses: comp.weaknesses || [],
            common_complaints: comp.common_complaints || [],
            pricing_mention: comp.pricing_mention,
            differentiation_opportunity: comp.differentiation_opportunity,
        })) || [],
        // Use backend's market_size string if available, otherwise format from market_estimate
        market_estimate: response.market_size ? {
            size: response.market_size,
            confidence: response.feasibility_score ? response.feasibility_score / 100 : undefined,
        } : response.market_estimate ? {
            size: formatMarketSize(response.market_estimate.tam_low, response.market_estimate.tam_high),
            confidence: response.market_estimate.confidence,
        } : undefined,
        // Map top_quotes and extract from related_posts if they have body
        quotes: [
            ...(response.top_quotes?.map((q: any, idx: number) => ({
                id: q.id || `quote-${idx}`,
                text: q.text || q.body,
                source: q.source || q.source_identifier || 'Unknown',
                author: q.author,
                upvotes: q.ups || q.upvotes,
            })) || []),
            // Add quotes from related_posts that have body text
            ...(response.related_posts
                ?.filter((post: any) => post.body && post.body.trim().length > 0)
                .slice(0, 5) // Limit to 5 quotes from posts
                .map((post: any, idx: number) => ({
                    id: `post-quote-${idx}`,
                    text: post.body,
                    source: post.source_identifier || 'reddit',
                    upvotes: post.ups,
                })) || [])
        ],
        // Map related_posts to sources with proper URLs
        sources: response.related_posts?.map((post: any, idx: number) => ({
            id: post.post_id || `source-${idx}`,
            url: post.permalink || '',
            title: post.title || 'Untitled',
            type: post.source_identifier || response.subreddits?.[0] || 'reddit',
            date: post.created_at,
            ups: post.ups,
            num_comments: post.num_comments,
            body: post.body,
        })) || [],
        created_at: response.created_at,
        updated_at: response.updated_at || response.last_updated,
        // New enriched fields
        tags: response.tags || [],
        category: response.category,
        domain: response.domain,
        target_audience: response.target_audience,
        recommended_action: response.recommended_action,
        // Map brief data if available
        brief: response.brief,
        // Pass through enriched report and other data
        report: response.report,
        data_confidence: response.data_confidence,
        opportunity_score: response.opportunity_score,
        market_sizing: response.market_sizing,
        validation_strength: response.validation_strength,
        build_estimate: response.build_estimate,
        go_to_market: response.go_to_market,
        competitor_intel: response.competitor_intel,
        related_posts: response.related_posts,
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
 * Validate a problem idea (creates a new report)
 */
export async function validateProblem(text: string): Promise<any> {
    return request<any>('/api/validate', {
        method: 'POST',
        body: JSON.stringify({ problem: text }),
    });
}

/**
 * Get all validation reports (paginated)
 */
export async function getValidationReports(
    page: number = 1,
    limit: number = 20
): Promise<{ items: any[]; total: number; page: number; total_pages: number }> {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });

    const response = await request<any>(`/api/validate?${params.toString()}`);

    // Handle response structure
    if (!response || typeof response !== 'object') {
        return { items: [], total: 0, page: 1, total_pages: 1 };
    }

    return {
        items: response.reports || response.items || [],
        total: response.total || 0,
        page: response.page || 1,
        total_pages: response.total_pages || response.totalPages || 1,
    };
}

/**
 * Get a single validation report by ID
 */
export async function getValidationReport(id: string): Promise<any> {
    return request<any>(`/api/validate/${id}`);
}

/**
 * Delete a validation report
 */
export async function deleteValidationReport(id: string): Promise<void> {
    await request<void>(`/api/validate/${id}`, {
        method: 'DELETE',
    });
}

/**
 * Get premium problems (score > 70) - requires auth
 * Free tier: gets 1 preview + count
 * Standard/Pro: gets all premium problems
 */
export async function getPremiumProblems(
    page: number = 1,
    limit: number = 20
): Promise<{
    preview?: any;
    problems?: any[];
    available_count?: number;
    upgrade_message?: string;
    is_premium: boolean;
    subscription?: any;
    total?: number;
    page?: number;
    limit?: number;
    total_pages?: number;
}> {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });

    const response = await request<any>(
        `/api/problem?${params.toString()}`
    );

    return response || { is_premium: false };
}

/**
 * Rate a problem (upvote or downvote)
 * Requires authentication
 */
export async function rateProblem(
    problemId: string,
    rating: 'upvote' | 'downvote'
): Promise<{ success: boolean; upvotes: number; downvotes: number; user_vote: 'upvote' | 'downvote' | null }> {
    return request<{ success: boolean; upvotes: number; downvotes: number; user_vote: 'upvote' | 'downvote' | null }>(
        `/api/problems/${problemId}/rate`,
        {
            method: 'POST',
            body: JSON.stringify({ rating }),
        }
    );
}

/**
 * Remove rating from a problem
 * Requires authentication
 */
export async function removeRating(
    problemId: string
): Promise<{ success: boolean; upvotes: number; downvotes: number; user_vote: null }> {
    return request<{ success: boolean; upvotes: number; downvotes: number; user_vote: null }>(
        `/api/problems/${problemId}/rate`,
        {
            method: 'DELETE',
        }
    );
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
    getValidationReports,
    getValidationReport,
    deleteValidationReport,
    getPremiumProblems,
    rateProblem,
    removeRating,
};

export default problemsApi;
