// src/lib/supabase.ts
// Supabase client for OAuth flows only
// Session management is handled by backend

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured. Google OAuth will not work.');
}

// Detect Safari browser (especially mobile Safari)
const isSafari = (): boolean => {
    const ua = navigator.userAgent;
    return /^((?!chrome|android).)*safari/i.test(ua);
};

// Create custom storage adapter that works better with Safari
const createSafariCompatibleStorage = () => {
    if (typeof window === 'undefined') return undefined;

    // Safari mobile works better with explicit localStorage
    return {
        getItem: (key: string) => {
            try {
                return window.localStorage.getItem(key);
            } catch (e) {
                console.error('Safari storage getItem error:', e);
                return null;
            }
        },
        setItem: (key: string, value: string) => {
            try {
                window.localStorage.setItem(key, value);
            } catch (e) {
                console.error('Safari storage setItem error:', e);
            }
        },
        removeItem: (key: string) => {
            try {
                window.localStorage.removeItem(key);
            } catch (e) {
                console.error('Safari storage removeItem error:', e);
            }
        },
    };
};

// Create Supabase client for OAuth only
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
        auth: {
            autoRefreshToken: false, // Backend handles tokens
            persistSession: true,   // Changed to true with custom storage for Safari
            detectSessionInUrl: true, // Required for OAuth callback
            storage: createSafariCompatibleStorage(), // Custom storage for Safari
            storageKey: 'beseekr-auth-token', // Unique key
            flowType: 'pkce', // PKCE flow is more secure and works better with Safari
            debug: import.meta.env.DEV, // Enable debug logging in dev mode
        },
    }
);

// Check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
    const isConfigured = !!(supabaseUrl && supabaseAnonKey);
    if (!isConfigured && import.meta.env.DEV) {
        console.error('Supabase not configured. Missing env vars:', {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseAnonKey,
        });
    }
    return isConfigured;
};

// Export Safari detection for use in other components
export const isSafariBrowser = isSafari;
