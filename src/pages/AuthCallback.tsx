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
        const handleCallback = async () => {
            try {
                // Get the session from URL hash (Supabase puts tokens there)
                const { data, error } = await supabase.auth.getSession();

                if (error) {
                    throw new Error(error.message);
                }

                if (!data.session) {
                    // Try to get session from URL params (some OAuth flows use this)
                    const hashParams = new URLSearchParams(window.location.hash.substring(1));
                    const accessToken = hashParams.get('access_token');

                    if (!accessToken) {
                        throw new Error('No session found. Please try again.');
                    }
                }

                // Get both tokens to send to backend
                const accessToken = data.session?.access_token;
                const refreshToken = data.session?.refresh_token;

                if (!accessToken) {
                    throw new Error('No access token received from Google.');
                }

                // Exchange Supabase tokens with backend to create session cookie
                const response = await apiClient.googleCallback(accessToken, refreshToken);

                if (response.success) {
                    setStatus('success');
                    // Short delay to show success message
                    setTimeout(() => {
                        navigate('/dashboard/problems', { replace: true });
                    }, 1000);
                } else {
                    throw new Error(response.error || 'Failed to authenticate with server.');
                }
            } catch (err: any) {
                console.error('OAuth callback error:', err);
                setStatus('error');
                setErrorMessage(err.message || 'Authentication failed. Please try again.');
            }
        };

        handleCallback();
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
