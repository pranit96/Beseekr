import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import socketService from '@/services/socketService';

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, full_name: string) => Promise<void>;
  logout: () => Promise<void>;
  exportData: () => Promise<any>;
  deleteAccount: (email: string) => Promise<any>;
  socketConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Helper to get access token from cookies (not used for cookie-auth flow, but kept)
  const getAccessToken = (): string | null => {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'access_token') {
        return decodeURIComponent(value);
      }
    }
    return null;
  };

  // Called when tokens are refreshed via the socket (or other mechanism)
  const handleTokensRefreshed = (tokens?: { access_token?: string; refresh_token?: string }) => {
    console.log('[Auth] Socket tokens refreshed successfully');
    toast({
      title: 'Session refreshed',
      description: 'Your session has been automatically renewed.',
      duration: 2000,
    });

    // Notify the rest of the app that tokens were refreshed so hooks can refetch.
    try {
      window.dispatchEvent(new CustomEvent('tokens_refreshed', { detail: tokens || {} }));
    } catch (err) {
      window.dispatchEvent(new Event('tokens_refreshed'));
    }
  };

  // Initialize socket connection when user is logged in
  useEffect(() => {
    if (!user) {
      // User not logged in, disconnect socket if connected
      if (socketService.isConnected()) {
        socketService.disconnect();
        setSocketConnected(false);
      }
      return;
    }

    // User is logged in, initialize socket
    const initializeSocket = async () => {
      try {
        // Register token refresh callback BEFORE connecting to ensure we don't miss events
        socketService.setTokenRefreshCallback(handleTokensRefreshed);

        // Setup connection status listener
        socketService.on('connection_status', (data: any) => {
          setSocketConnected(Boolean(data?.connected));
          if (data?.connected) {
            console.log('[Auth] Socket connected:', data.socketId ?? 'unknown');
          } else {
            console.log('[Auth] Socket disconnected:', data?.reason ?? 'unknown');
          }
        });

        // Setup auth error listener
        socketService.on('auth_error', (data: any) => {
          console.error('[Auth] Socket authentication failed:', data?.error);
          toast({
            title: 'Authentication Error',
            description: 'Session expired. Please log in again.',
            variant: 'destructive',
          });

          // Force logout on auth error
          handleAuthError();
        });

        // Setup forced disconnect listener
        socketService.on('forced_disconnect', (data: any) => {
          console.warn('[Auth] Socket force disconnected:', data?.message);
          toast({
            title: 'Connection Lost',
            description: data?.message || 'Please refresh and log in again.',
            variant: 'destructive',
          });
          handleAuthError();
        });

        // Setup connection error listener
        socketService.on('connection_error', (data: any) => {
          console.error('[Auth] Socket connection error:', data?.error);
          if ((data?.attempts ?? 0) >= 3) {
            toast({
              title: 'Connection Issues',
              description: 'Having trouble connecting. Retrying...',
              variant: 'default',
            });
          }
        });

        // Setup max reconnect attempts listener
        socketService.on('max_reconnect_attempts', (data: any) => {
          toast({
            title: 'Connection Failed',
            description: data?.message || 'Please check your internet connection.',
            variant: 'destructive',
          });
        });

        // Now connect once
        socketService.connect();
        console.log('[Auth] Socket connection initiated');
      } catch (error) {
        console.error('[Auth] Socket initialization error:', error);
        toast({
          title: 'Connection Error',
          description: 'Failed to establish real-time connection.',
          variant: 'destructive',
        });
      }
    };

    initializeSocket();

    // Cleanup on unmount or user change
    return () => {
      if (socketService.isConnected()) {
        socketService.disconnect();
        setSocketConnected(false);
      }
    };
    // Intentionally only depend on user so we re-run when login/logout happens
  }, [user, toast]);

  useEffect(() => {
    // On mount, try to fetch current user (cookies will be sent automatically)
    fetchCurrentUser();

    // Set up unauthorized handler for token expiration. Rather than immediately logging the user out,
    // attempt a silent revalidation first; if that fails, fall back to full logout.
    apiClient.setUnauthorizedHandler(async () => {
      console.warn('[Auth] 401 detected — attempting silent revalidation');
      try {
        // Try to re-fetch the current user. If the backend can refresh using refresh cookie,
        // fetchCurrentUser() should succeed and update `user`.
        await fetchCurrentUser();
        // If revalidation succeeded, notify app to refetch critical data
        try {
          window.dispatchEvent(new Event('tokens_refreshed'));
        } catch (err) {
          // ignore
        }
        console.info('[Auth] Silent revalidation succeeded');
      } catch (err) {
        console.warn('[Auth] Silent revalidation failed — logging out', err);
        handleAuthError();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await apiClient.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data.user);
        return response.data.user;
      } else {
        setUser(null);
        throw new Error(response?.message || 'Failed to fetch user');
      }
    } catch (error) {
      console.error('[Auth] Failed to fetch user:', error);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = () => {
    // Disconnect socket
    if (socketService.isConnected()) {
      socketService.disconnect();
    }

    // Clear user state
    setUser(null);
    setSocketConnected(false);

    // Navigate to auth page
    navigate('/auth');

    // Show notification (explicit)
    toast({
      title: 'Session expired',
      description: 'Please log in again.',
      variant: 'destructive',
    });
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      if (response.success && response.data) {
        setUser(response.data.user);

        toast({
          title: 'Welcome back!',
          description: 'Successfully logged in.',
        });

        navigate('/');

        // Socket will be initialized by the useEffect when user state changes
      } else {
        throw new Error(response?.message || 'Login failed');
      }
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error?.message || 'Invalid credentials',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signup = async (email: string, password: string, full_name: string) => {
    try {
      const response = await apiClient.signup(email, password, full_name);
      if (response.success && response.data) {
        setUser(response.data.user);

        toast({
          title: 'Account created!',
          description: 'Welcome.',
        });

        navigate('/');
      } else {
        throw new Error(response?.message || 'Signup failed');
      }
    } catch (error: any) {
      toast({
        title: 'Signup failed',
        description: error?.message || 'Could not create account',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Disconnect socket first
      if (socketService.isConnected()) {
        socketService.disconnect();
        setSocketConnected(false);
      }

      // Call backend logout to clear cookies
      await apiClient.logout();

      setUser(null);
      navigate('/auth');

      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    } catch (error: any) {
      console.error('[Auth] Logout error:', error);
      toast({
        title: 'Logout failed',
        description: error?.message || 'Could not log out',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const exportData = async () => {
    try {
      const response = await apiClient.exportData();
      return response;
    } catch (error) {
      console.error('[Auth] Export error:', error);
      throw error;
    }
  };

  // Defensive deleteAccount — some ApiClient implementations may not include deleteAccount.
  const deleteAccount = async (email: string) => {
    try {
      const clientAny = apiClient as any;
      if (typeof clientAny.deleteAccount === 'function') {
        return await clientAny.deleteAccount(email);
      }

      // Try a generic fallback (best-effort) if request method exists.
      if (typeof clientAny.request === 'function') {
        // Best-effort: attempt endpoint commonly used; backend may differ.
        try {
          return await clientAny.request('/account/delete', {
            method: 'POST',
            body: { email },
          });
        } catch (innerErr) {
          console.warn('[Auth] fallback deleteAccount request failed', innerErr);
          throw innerErr;
        }
      }

      throw new Error('deleteAccount not implemented on apiClient');
    } catch (error) {
      console.error('[Auth] Delete account error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        exportData,
        deleteAccount,
        socketConnected,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
