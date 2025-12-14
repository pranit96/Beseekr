// src/pages/AuthCallback.tsx
// Handles OAuth redirect from Supabase/Google

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { apiClient } from '@/lib/api';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AuthCallback() {
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let authListener: { data: { subscription: { unsubscribe: () => void } } } | null = null;

        const handleCallback = async () => {
            try {
                // First, check if there are tokens in the URL hash
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const hasTokensInUrl = hashParams.has('access_token');

                if (hasTokensInUrl) {
                    // Tokens are in URL - Supabase needs to process them
                    // Wait for auth state change which fires after Supabase processes the URL
                    const session = await new Promise<any>((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            reject(new Error('Authentication timed out. Please try again.'));
                        }, 10000); // 10 second timeout

                        authListener = supabase.auth.onAuthStateChange((event, session) => {
                            if (event === 'SIGNED_IN' && session) {
                                clearTimeout(timeout);
                                resolve(session);
                            } else if (event === 'TOKEN_REFRESHED' && session) {
                                clearTimeout(timeout);
                                resolve(session);
                            }
                        });

                        // Also try getting session immediately in case it's already processed
                        supabase.auth.getSession().then(({ data }) => {
                            if (data.session) {
                                clearTimeout(timeout);
                                resolve(data.session);
                            }
                        });
                    });

                    if (!session?.access_token) {
                        throw new Error('No access token received from Google.');
                    }

                    // Exchange Supabase tokens with backend to create session cookie
                    const response = await apiClient.googleCallback(
                        session.access_token,
                        session.refresh_token
                    );

                    if (response.success) {
                        setStatus('success');
                        setTimeout(() => {
                            navigate('/dashboard/problems', { replace: true });
                        }, 1000);
                    } else {
                        throw new Error(response.error || 'Failed to authenticate with server.');
                    }
                } else {
                    // No tokens in URL - try to get existing session
                    const { data, error } = await supabase.auth.getSession();

                    if (error) {
                        throw new Error(error.message);
                    }

                    if (!data.session) {
                        throw new Error('No session found. Please try again.');
                    }

                    const response = await apiClient.googleCallback(
                        data.session.access_token,
                        data.session.refresh_token
                    );

                    if (response.success) {
                        setStatus('success');
                        setTimeout(() => {
                            navigate('/dashboard/problems', { replace: true });
                        }, 1000);
                    } else {
                        throw new Error(response.error || 'Failed to authenticate with server.');
                    }
                }
            } catch (err: any) {
                console.error('OAuth callback error:', err);
                setStatus('error');
                setErrorMessage(err.message || 'Authentication failed. Please try again.');
            }
        };

        handleCallback();

        // Cleanup listener on unmount
        return () => {
            if (authListener?.data?.subscription) {
                authListener.data.subscription.unsubscribe();
            }
        };
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
            <Card className="w-full max-w-md p-8 text-center space-y-6">
                {status === 'loading' && (
                    <>
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                        <div>
                            <h2 className="text-xl font-semibold">Completing sign in...</h2>
                            <p className="text-muted-foreground mt-2">Please wait while we verify your account.</p>
                        </div>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-green-600">Welcome!</h2>
                            <p className="text-muted-foreground mt-2">Redirecting to dashboard...</p>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-destructive">Authentication Failed</h2>
                            <p className="text-muted-foreground mt-2">{errorMessage}</p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <Button variant="outline" onClick={() => navigate('/auth')}>
                                Try Again
                            </Button>
                            <Button onClick={() => navigate('/dashboard/problems')}>
                                Go to Dashboard
                            </Button>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}
