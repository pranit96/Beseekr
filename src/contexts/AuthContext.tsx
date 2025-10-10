import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Helper to get access token from cookies
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

  // Helper to update cookies when tokens are refreshed
  const handleTokensRefreshed = (tokens: { access_token: string; refresh_token: string }) => {
    console.log('[Auth] Socket tokens refreshed successfully');
    // Optionally show a subtle notification
    toast({
      title: 'Session refreshed',
      description: 'Your session has been automatically renewed.',
      duration: 2000,
    });
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
            // Tokens are handled by HttpOnly cookies, so no need to read them
            socketService.connect();
          
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
          
          // Only show toast if it's not a reconnection attempt
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
  }, [user]);

  useEffect(() => {
    // On mount, try to fetch current user (cookies will be sent automatically)
    fetchCurrentUser();

    // Set up unauthorized handler for token expiration
    apiClient.setUnauthorizedHandler(() => {
      handleAuthError();
    });
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await apiClient.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
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
    
    // Show notification
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
        
        toast({
          title: 'Account created!',
          description: 'Welcome to CreatuAI.',
        });
        
        navigate('/');
        
        // Socket will be initialized by the useEffect when user state changes
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
      
      // Call backend logout to clear cookies
      await apiClient.logout();
      
      setUser(null);
      navigate('/auth');
      
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('Logout error:', error);
      
      // Still clear local user state even if API call fails
      setUser(null);
      setSocketConnected(false);
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
      
      const response = await apiClient.deleteProfile(email);
      
      if (response.success) {
        setUser(null);
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
        socketConnected 
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