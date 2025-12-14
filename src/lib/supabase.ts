// src/lib/supabase.ts
// Supabase client for OAuth flows only
// Session management is handled by backend

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured. Google OAuth will not work.');
}

// Create Supabase client for OAuth only
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
        auth: {
            autoRefreshToken: false, // Backend handles tokens
            persistSession: false,   // Backend handles session
            detectSessionInUrl: true, // Required for OAuth callback
        },
    }
);

// Check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
    return !!(supabaseUrl && supabaseAnonKey);
};
