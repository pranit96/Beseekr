// API client for Payments and Subscription features

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

// Types for payment API responses
export interface Plan {
    key: string;
    tier: 'standard' | 'pro';
    plan_type: 'monthly' | 'yearly';
    amount: number;
    amount_display: string;
    currency: string;
    currency_symbol: string;
    amount_usd: number;
    amount_usd_display: string;
    per_month: string | null; // Shows monthly equivalent for yearly plans
    description: string;
    duration_days: number;
    features: string[];
}

// User subscription info returned with plans
export interface UserSubscription {
    is_premium: boolean;
    tier: 'free' | 'standard' | 'pro';
    validity: string | null;
    days_remaining: number | null;
}

// Full response from getPlans endpoint
export interface PlansResponse {
    plans: Plan[];
    user: UserSubscription | null;
}

export interface PaymentLink {
    id: string;
    short_url: string;
    amount: number;
    currency: string;
    tier: string;
    plan_type: string;
}

export interface SubscriptionStatus {
    is_premium: boolean;
    tier: 'free' | 'standard' | 'pro';
    expires_at: string | null;
    days_remaining?: number;
}

// Base request helper - returns raw response without unwrapping
async function requestRaw<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        credentials: 'include', // Send cookies for auth
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed: ${response.status}`);
    }

    return response.json();
}

// Base request helper - unwraps data from response
async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const json = await requestRaw<any>(endpoint, options);

    // Backend wraps responses in {success: true, data: {...}}
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
        return json.data as T;
    }

    return json;
}

/**
 * Get available subscription plans + user subscription status
 */
export async function getPlans(): Promise<PlansResponse> {
    const json = await requestRaw<any>('/api/payments/plans');

    // Response structure: { success: true, data: [...plans], user: {...} }
    return {
        plans: json.data || [],
        user: json.user || null,
    };
}

/**
 * Create a Razorpay payment link for a plan
 * Requires authentication (cookie)
 */
export async function createPaymentLink(plan: string = 'standard_monthly'): Promise<PaymentLink> {
    return request<PaymentLink>('/api/payments/create-link', {
        method: 'POST',
        body: JSON.stringify({ plan }),
    });
}

/**
 * Get current user's subscription status
 * Requires authentication (cookie)
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
    return request<SubscriptionStatus>('/api/payments/status');
}

// Export all functions as a namespace for convenience
export const paymentsApi = {
    getPlans,
    createPaymentLink,
    getSubscriptionStatus,
};

export default paymentsApi;
