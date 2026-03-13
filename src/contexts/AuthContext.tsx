// src/contexts/AuthContext.tsx - COMPLETE FILE WITH FIXES
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { useToast, toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import socketService from '@/services/socketService';
import { createLogger } from '@/services/logging';

const logger = createLogger('AuthContext');

interface User {
  id: string;
  email: string;
  full_name?: string;
  name?: string; // Google OAuth returns name instead of full_name
  tier?: string;
  trial?: {
    active: boolean;
    ends_at: string;
    days_remaining: number;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, full_name: string) => Promise<void>;
  logout: () => Promise<void>;
  exportData: () => Promise<any>;
  deleteAccount: (email: string) => Promise<void>;
  socketConnected: boolean;
  refreshAuth: (silent?: boolean) => Promise<void>;
  isSessionValid: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// OPTIMIZED SESSION INTERVALS
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const TOKEN_REFRESH_INTERVAL = 8 * 60 * 1000; // 8 minutes (refresh before 15min expiry)
const ACTIVITY_TIMEOUT = 25 * 60 * 1000; // 25 minutes inactivity

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  // toast is imported directly to ensure stable reference
  const navigate = useNavigate();

  const refreshingRef = useRef(false);
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout>();
  const tokenRefreshIntervalRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());
  const authErrorShownRef = useRef(false);

  // ENHANCED: Track user activity with debouncing
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;

    const updateActivity = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        lastActivityRef.current = Date.now();
        authErrorShownRef.current = false; // Reset error flag on activity
      }, 500);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      clearTimeout(debounceTimer);
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  // DEFINE handleAuthError FIRST (before it's used in other callbacks)
  const handleAuthError = useCallback(() => {
    logger.info('Handling auth error - clearing all state and caches');

    // Clear API client cache and state
    apiClient.clearAllState();

    // Disconnect socket
    if (socketService.isConnected()) socketService.disconnect();

    // Clear intervals
    if (sessionCheckIntervalRef.current) clearInterval(sessionCheckIntervalRef.current);
    if (tokenRefreshIntervalRef.current) clearInterval(tokenRefreshIntervalRef.current);

    // Clear local state
    setUser(null);
    setSocketConnected(false);
    refreshingRef.current = false;

    // Clear localStorage
    localStorage.setItem('auth_logout', Date.now().toString());
    setTimeout(() => localStorage.removeItem('auth_logout'), 1000);

    // Dashboard routes are PUBLIC - don't redirect to auth
    // Only redirect for truly protected routes like /chat, /profile, etc.
    const currentPath = window.location.pathname;
    const isPublicPath =
      currentPath === '/' ||
      currentPath === '/auth' ||
      currentPath.startsWith('/auth/') || // OAuth callbacks like /auth/callback
      currentPath === '/privacy' ||
      currentPath === '/contact' ||
      currentPath.startsWith('/dashboard') ||
      currentPath.startsWith('/pricing') ||
      currentPath.startsWith('/payment') ||
      currentPath.startsWith('/blog');

    // Only redirect to auth for protected routes
    if (!isPublicPath) {
      window.location.href = '/auth';

      if (!authErrorShownRef.current) {
        authErrorShownRef.current = true;
        toast({
          title: 'Session expired',
          description: 'Please log in again.',
          variant: 'destructive',
        });
      }
    }
  }, []);

  // Check if session is still valid
  const isSessionValid = useCallback((): boolean => {
    if (!user) return false;
    const inactiveTime = Date.now() - lastActivityRef.current;
    return inactiveTime < ACTIVITY_TIMEOUT;
  }, [user]);

  // ENHANCED: Refresh authentication state with retry logic
  const refreshAuth = useCallback(async (silent: boolean = false, retries: number = 3) => {
    if (refreshingRef.current) {
      logger.debug('Refresh already in progress, skipping');
      return;
    }

    refreshingRef.current = true;

    try {
      logger.info('Refreshing authentication state', { silent, retries });
      const response = await apiClient.getCurrentUser();

      if (response.success && response.data) {
        setUser(response.data.user);
        setCachedUser(response.data.user); // SAFARI FIX: Update cache so dashboard sees logged-in state
        lastActivityRef.current = Date.now();
        authErrorShownRef.current = false;
        logger.info('Auth refresh successful', { userId: response.data.user.id });

        if (!silent) {
          toast({
            title: 'Session refreshed',
            description: 'Your session has been updated.',
            duration: 2000,
          });
        }
      } else {
        throw new Error('Failed to refresh session');
      }
    } catch (error: any) {
      logger.error('Session refresh failed', { error: error.message, retries });

      // Retry logic for network errors
      if (retries > 0 && !error.message?.includes('401') && !error.message?.includes('Unauthorized')) {
        logger.info('Retrying refresh', { retriesLeft: retries });
        await new Promise(resolve => setTimeout(resolve, 2000));
        refreshingRef.current = false;
        return refreshAuth(silent, retries - 1);
      }

      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        handleAuthError();
      }
    } finally {
      refreshingRef.current = false;
    }
  }, [handleAuthError]);

  // ENHANCED: Proactive session maintenance
  useEffect(() => {
    if (!user) {
      if (sessionCheckIntervalRef.current) clearInterval(sessionCheckIntervalRef.current);
      if (tokenRefreshIntervalRef.current) clearInterval(tokenRefreshIntervalRef.current);
      return;
    }

    // Check for inactivity and refresh if needed
    sessionCheckIntervalRef.current = setInterval(() => {
      const inactiveTime = Date.now() - lastActivityRef.current;

      if (inactiveTime > ACTIVITY_TIMEOUT) {
        logger.warn('Session expired due to inactivity', { inactiveTime });
        if (!authErrorShownRef.current) {
          authErrorShownRef.current = true;
          handleAuthError();
        }
      } else if (inactiveTime > SESSION_CHECK_INTERVAL) {
        logger.debug('Proactive session check after inactivity', { inactiveTime });
        refreshAuth(true);
      }
    }, SESSION_CHECK_INTERVAL);

    // Proactive token refresh
    tokenRefreshIntervalRef.current = setInterval(() => {
      if (isSessionValid()) {
        logger.debug('Proactive token refresh');
        refreshAuth(true);
      }
    }, TOKEN_REFRESH_INTERVAL);

    return () => {
      if (sessionCheckIntervalRef.current) clearInterval(sessionCheckIntervalRef.current);
      if (tokenRefreshIntervalRef.current) clearInterval(tokenRefreshIntervalRef.current);
    };
  }, [user, refreshAuth, isSessionValid]);

  // Socket token refresh callback
  const handleTokensRefreshed = useCallback((tokens: { access_token: string; refresh_token: string }) => {
    logger.info('Socket tokens refreshed, updating auth state');
    lastActivityRef.current = Date.now();
    refreshAuth(true);
  }, [refreshAuth]);

  // ENHANCED: Socket initialization with better error handling
  useEffect(() => {
    if (!user) {
      if (socketService.isConnected()) {
        logger.info('User logged out, disconnecting socket');
        socketService.disconnect();
        setSocketConnected(false);
      }
      return;
    }

    const initializeSocket = async () => {
      try {
        logger.info('Initializing socket connection', { userId: user.id });

        socketService.setTokenRefreshCallback(handleTokensRefreshed);

        socketService.on('connection_status', (data: any) => {
          setSocketConnected(data.connected);

          if (data.connected) {
            logger.info('Socket connected', { socketId: data.socketId });
            lastActivityRef.current = Date.now();
          } else {
            logger.warn('Socket disconnected', { reason: data.reason });
          }
        });

        socketService.on('auth_error', (data: any) => {
          logger.error('Socket authentication failed', { error: data.error });
          if (!authErrorShownRef.current) {
            authErrorShownRef.current = true;
            handleAuthError();
          }
        });

        socketService.on('forced_disconnect', (data: any) => {
          logger.warn('Socket force disconnected', { message: data.message });
          toast({
            title: 'Connection Lost',
            description: data.message || 'Please refresh and log in again.',
            variant: 'destructive',
          });
          handleAuthError();
        });

        socketService.connect();
        logger.info('Socket connection initiated');

      } catch (error) {
        logger.error('Socket initialization error', { error });
      }
    };

    initializeSocket();

    return () => {
      if (socketService.isConnected()) {
        socketService.disconnect();
        setSocketConnected(false);
      }
    };
  }, [user, handleTokensRefreshed]);

  // Initial auth check with retry
  // OPTIMISTIC AUTH: Cache user in localStorage for instant page loads
  const CACHED_USER_KEY = 'beseekr_cached_user';
  const CACHE_EXPIRY_KEY = 'beseekr_cache_expiry';
  const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  const getCachedUser = (): User | null => {
    try {
      const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
      if (expiry && Date.now() > parseInt(expiry)) {
        localStorage.removeItem(CACHED_USER_KEY);
        localStorage.removeItem(CACHE_EXPIRY_KEY);
        return null;
      }
      const cached = localStorage.getItem(CACHED_USER_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const setCachedUser = (user: User | null) => {
    try {
      if (user) {
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
        localStorage.setItem(CACHE_EXPIRY_KEY, String(Date.now() + CACHE_TTL));
      } else {
        localStorage.removeItem(CACHED_USER_KEY);
        localStorage.removeItem(CACHE_EXPIRY_KEY);
      }
    } catch {
      // localStorage might be full or disabled
    }
  };

  // ENHANCED: Initial auth check with optimistic loading
  useEffect(() => {
    const initAuth = async () => {
      try {
        logger.info('Checking initial authentication state');

        // 1. OPTIMISTIC: Immediately show cached user (instant UI)
        const cachedUser = getCachedUser();
        if (cachedUser) {
          logger.info('Using cached user for instant load', { userId: cachedUser.id });
          setUser(cachedUser);
          setLoading(false); // Show content immediately
        }

        // Set up API client unauthorized handler
        apiClient.setUnauthorizedHandler(() => {
          logger.warn('API client detected unauthorized request');
          if (!authErrorShownRef.current) {
            authErrorShownRef.current = true;
            handleAuthError();
            setCachedUser(null); // Clear cache on auth error
          }
        });

        // 2. VERIFY: API check in background (updates if different)
        await fetchCurrentUser();
      } catch (error) {
        logger.error('Initial auth check failed', { error });
        setLoading(false);
      }
    };

    initAuth();

    // Multi-tab logout sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_logout' && e.newValue) {
        logger.info('Logout detected in another tab');
        handleAuthError();
        setCachedUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [handleAuthError]);

  const fetchCurrentUser = async () => {
    try {
      const response = await apiClient.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data.user);
        setCachedUser(response.data.user); // Update cache
        lastActivityRef.current = Date.now();
      } else {
        setUser(null);
        setCachedUser(null);
      }
    } catch (error) {
      logger.error('Failed to fetch user', { error });
      setUser(null);
      setCachedUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      if (response.success && response.data) {
        setUser(response.data.user);
        lastActivityRef.current = Date.now();
        authErrorShownRef.current = false;

        toast({
          title: 'Welcome back!',
          description: 'Successfully logged in.',
        });

        // Redirect to intended page or default to home
        const redirectUrl = sessionStorage.getItem('auth-redirect') || '/';
        sessionStorage.removeItem('auth-redirect');
        navigate(redirectUrl);
      }
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signup = async (email: string, password: string, full_name: string) => {
    try {
      const response = await apiClient.signup(email, password, full_name);
      if (response.success && response.data) {
        // Check if user needs email confirmation
        if (response.data.user && !response.data.user.email_confirmed_at) {
          // Email confirmation required - throw special error WITHOUT toast
          // Auth.tsx will catch this and show verification pending screen
          const error: any = new Error('Please verify your email to continue. Check your inbox for the verification link.');
          error.isEmailVerificationRequired = true;
          throw error;
        }

        setUser(response.data.user);
        lastActivityRef.current = Date.now();

        toast({
          title: 'Account created!',
          description: 'Welcome to beseekr.',
        });

        // Redirect to intended page or default to home
        const redirectUrl = sessionStorage.getItem('auth-redirect') || '/';
        sessionStorage.removeItem('auth-redirect');
        navigate(redirectUrl);
      }
    } catch (error: any) {
      // Only show toast for ACTUAL errors, not email verification pending
      if (!error.isEmailVerificationRequired) {
        toast({
          title: 'Signup failed',
          description: error.message || 'Could not create account',
          variant: 'destructive',
        });
      }
      // Always re-throw so Auth.tsx can handle it
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (socketService.isConnected()) {
        socketService.disconnect();
        setSocketConnected(false);
      }

      if (sessionCheckIntervalRef.current) clearInterval(sessionCheckIntervalRef.current);
      if (tokenRefreshIntervalRef.current) clearInterval(tokenRefreshIntervalRef.current);

      await apiClient.logout();

      setUser(null);
      refreshingRef.current = false;

      localStorage.setItem('auth_logout', Date.now().toString());
      setTimeout(() => localStorage.removeItem('auth_logout'), 1000);

      navigate('/');

      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      logger.error('Logout error', { error });
      setUser(null);
      setSocketConnected(false);
      navigate('/');
    }
  };

  const exportData = async () => {
    try {
      const response = await apiClient.exportData();
      if (response.success) {
        return response.data;
      }
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteAccount = async (email: string) => {
    try {
      if (socketService.isConnected()) {
        socketService.disconnect();
        setSocketConnected(false);
      }

      if (sessionCheckIntervalRef.current) clearInterval(sessionCheckIntervalRef.current);
      if (tokenRefreshIntervalRef.current) clearInterval(tokenRefreshIntervalRef.current);

      const response = await apiClient.deleteProfile(email);

      if (response.success) {
        setUser(null);
        refreshingRef.current = false;

        localStorage.setItem('auth_logout', Date.now().toString());
        setTimeout(() => localStorage.removeItem('auth_logout'), 1000);

        navigate('/');

        toast({
          title: 'Account deleted',
          description: 'Your account and all data have been permanently deleted.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Deletion failed',
        description: error.message,
        variant: 'destructive',
      });
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
        refreshAuth,
        isSessionValid,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};