import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
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
  deleteAccount: (email: string) => Promise<void>;
  socketConnected: boolean;
  refreshAuth: () => Promise<void>;
  isSessionValid: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session validation interval (check every 2 minutes)
const SESSION_CHECK_INTERVAL = 2 * 60 * 1000;
// Token refresh interval (refresh 5 minutes before expiry, assuming 15min token)
const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Refs to prevent duplicate requests
  const refreshingRef = useRef(false);
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout>();
  const tokenRefreshIntervalRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  // Track user activity
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Track various user activities
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  // Check if session is still valid
  const isSessionValid = useCallback((): boolean => {
    // Check if user exists
    if (!user) {
      return false;
    }

    // If using HttpOnly cookies, we can't access them via document.cookie
    // So we trust that if user exists, session is valid
    // The backend will return 401 if token is actually invalid
    return true;
  }, [user]);

  // Refresh authentication state
  const refreshAuth = useCallback(async (silent: boolean = false) => {
    // Prevent duplicate refresh requests
    if (refreshingRef.current) {
      console.log('[Auth] Refresh already in progress, skipping');
      return;
    }

    refreshingRef.current = true;

    try {
      console.log('[Auth] Refreshing authentication state...');
      const response = await apiClient.getCurrentUser();
      
      if (response.success && response.data) {
        setUser(response.data.user);
        console.log('[Auth] Auth refresh successful');
        
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
      console.error('[Auth] Session refresh failed:', error);
      
      // Only force logout if it's a clear auth error
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        handleAuthError();
      }
    } finally {
      refreshingRef.current = false;
    }
  }, [toast]);

  // Periodic session validation
  useEffect(() => {
    if (!user) {
      // Clear intervals if user is logged out
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
      }
      return;
    }

    // Session health check interval - less aggressive
    sessionCheckIntervalRef.current = setInterval(() => {
  
      // If user has been inactive for 30 minutes, do a silent refresh
      const inactiveTime = Date.now() - lastActivityRef.current;
      if (inactiveTime > 30 * 60 * 1000) {
        console.log('[Auth] User inactive for 30min, refreshing session...');
        refreshAuth(true);
      }
    }, SESSION_CHECK_INTERVAL);

    // Token refresh interval (proactive refresh)
    tokenRefreshIntervalRef.current = setInterval(() => {
      console.log('[Auth] Running proactive token refresh...');
      refreshAuth(true);
    }, TOKEN_REFRESH_INTERVAL);

    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
      }
    };
  }, [user, refreshAuth]);

  // Socket token refresh callback
  const handleTokensRefreshed = useCallback((tokens: { access_token: string; refresh_token: string }) => {
    console.log('[Auth] Socket tokens refreshed, updating auth state...');
    
    // Refresh user data after token refresh
    refreshAuth(true);
  }, [refreshAuth]);

  // Initialize socket connection when user is logged in
  useEffect(() => {
    if (!user) {
      // User not logged in, disconnect socket if connected
      if (socketService.isConnected()) {
        console.log('[Auth] User logged out, disconnecting socket');
        socketService.disconnect();
        setSocketConnected(false);
      }
      return;
    }

    // User is logged in, initialize socket
    const initializeSocket = async () => {
      try {
        console.log('[Auth] Initializing socket connection...');
        
        // Setup token refresh callback BEFORE connecting
        socketService.setTokenRefreshCallback(handleTokensRefreshed);

        // Setup connection status listener
        socketService.on('connection_status', (data: any) => {
          setSocketConnected(data.connected);
          
          if (data.connected) {
            console.log('[Auth] Socket connected:', data.socketId);
          } else {
            console.log('[Auth] Socket disconnected:', data.reason);
          }
        });

        // Setup auth error listener
        socketService.on('auth_error', (data: any) => {
          console.error('[Auth] Socket authentication failed:', data.error);
          // toast({
          //   title: 'Authentication Error',
          //   description: 'Session expired. Please log in again.',
          //   variant: 'destructive',
          // });
          
          handleAuthError();
        });

        // Setup forced disconnect listener
        socketService.on('forced_disconnect', (data: any) => {
          console.warn('[Auth] Socket force disconnected:', data.message);
          toast({
            title: 'Connection Lost',
            description: data.message || 'Please refresh and log in again.',
            variant: 'destructive',
          });
          handleAuthError();
        });

        // Setup connection error listener
        socketService.on('connection_error', (data: any) => {
          console.error('[Auth] Socket connection error:', data.error);
          
          // Only show toast if multiple attempts have failed
          if (data.attempts >= 3) {
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
            description: data.message || 'Please check your internet connection.',
            variant: 'destructive',
          });
        });

        // Connect to socket
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
  }, [user, handleTokensRefreshed, toast]);

  // Initial auth check on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('[Auth] Checking initial authentication state...');
        await fetchCurrentUser();
      } catch (error) {
        console.error('[Auth] Initial auth check failed:', error);
      }
    };

    initAuth();

    // Set up unauthorized handler for token expiration
    apiClient.setUnauthorizedHandler(() => {
      console.warn('[Auth] Unauthorized response received');
      handleAuthError();
    });

    // Listen for storage events (for multi-tab logout)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_logout' && e.newValue) {
        console.log('[Auth] Logout detected in another tab');
        handleAuthError();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await apiClient.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data.user);
        console.log('[Auth] User fetched successfully:', response.data.user.email);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('[Auth] Failed to fetch user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = useCallback(() => {
    console.log('[Auth] Handling auth error - clearing session');
    
    // Disconnect socket
    if (socketService.isConnected()) {
      socketService.disconnect();
    }
    
    // Clear intervals
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
    }
    if (tokenRefreshIntervalRef.current) {
      clearInterval(tokenRefreshIntervalRef.current);
    }
    
    // Clear user state
    setUser(null);
    setSocketConnected(false);
    refreshingRef.current = false;
    
    // Notify other tabs
    localStorage.setItem('auth_logout', Date.now().toString());
    setTimeout(() => localStorage.removeItem('auth_logout'), 1000);
    
    // Navigate to auth page
    navigate('/auth');
    
    // Show notification
    toast({
      title: 'Session expired',
      description: 'Please log in again.',
      variant: 'destructive',
    });
  }, [navigate, toast]);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      if (response.success && response.data) {
        setUser(response.data.user);
        lastActivityRef.current = Date.now();
        
        toast({
          title: 'Welcome back!',
          description: 'Successfully logged in.',
        });
        
        navigate('/');
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
        setUser(response.data.user);
        lastActivityRef.current = Date.now();
        
        toast({
          title: 'Account created!',
          description: 'Welcome to CreatuAI.',
        });
        
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: 'Signup failed',
        description: error.message || 'Could not create account',
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
      
      // Clear intervals
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
      }
      
      // Call backend logout to clear cookies
      await apiClient.logout();
      
      setUser(null);
      refreshingRef.current = false;
      
      // Notify other tabs
      localStorage.setItem('auth_logout', Date.now().toString());
      setTimeout(() => localStorage.removeItem('auth_logout'), 1000);
      
      navigate('/auth');
      
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      
      // Still clear local user state even if API call fails
      setUser(null);
      setSocketConnected(false);
      refreshingRef.current = false;
      navigate('/auth');
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
      // Disconnect socket
      if (socketService.isConnected()) {
        socketService.disconnect();
        setSocketConnected(false);
      }
      
      // Clear intervals
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
      }
      
      const response = await apiClient.deleteProfile(email);
      
      if (response.success) {
        setUser(null);
        refreshingRef.current = false;
        
        // Notify other tabs
        localStorage.setItem('auth_logout', Date.now().toString());
        setTimeout(() => localStorage.removeItem('auth_logout'), 1000);
        
        navigate('/auth');
        
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