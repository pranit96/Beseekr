// e2e/fixtures/test-data.ts
// Mock data and test constants

export const TEST_PROBLEMS = {
    free: {
        id: 'test-problem-free-1',
        title: 'Test Free Problem',
        category: 'developer_tools',
        score: 65,
    },
    premium: {
        id: 'test-problem-premium-1',
        title: 'Test Premium Problem',
        category: 'saas',
        score: 85,
    },
};

export const ROUTES = {
    home: '/',
    auth: '/auth',
    authCallback: '/auth/callback',
    resetPassword: '/reset-password',
    pricing: '/pricing',

    // Dashboard routes
    dashboard: '/dashboard',
    problems: '/dashboard/problems',
    problemDetails: (id: string) => `/dashboard/problems/${id}`,
    watchlist: '/dashboard/watchlist',
    search: '/dashboard/search',
    feed: '/dashboard/feed',
    validate: '/dashboard/validate',

    // Profile routes
    profile: '/dashboard/profile',
};

export const API_ENDPOINTS = {
    auth: {
        me: '**/api/auth/me',
        login: '**/api/auth/login',
        logout: '**/api/auth/logout',
        googleCallback: '**/api/auth/google-callback',
    },
    problems: {
        list: '**/api/problems',
        details: '**/api/problems/*',
        watchlist: '**/api/problems/watchlist',
    },
    payments: {
        plans: '**/api/payments/plans',
        createLink: '**/api/payments/create-link',
    },
};

export const TIMEOUTS = {
    short: 5000,
    medium: 10000,
    long: 30000,
    pageLoad: 15000,
};

export const PERFORMANCE_THRESHOLDS = {
    pageLoad: 3000,       // Max 3 seconds for page load
    apiResponse: 1000,    // Max 1 second for API response
    tti: 5000,            // Max 5 seconds for Time to Interactive
    lcp: 2500,            // Max 2.5 seconds for Largest Contentful Paint
};

// User tiers for testing access control
export const USER_TIERS = {
    guest: null,
    free: 'free',
    standard: 'standard',
    pro: 'pro',
};
