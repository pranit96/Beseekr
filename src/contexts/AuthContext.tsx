// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  full_name?: string;
  user_metadata?: {
    full_name?: string;
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
  refreshCSRFToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize auth state
    checkAuthStatus();

    // Set up unauthorized handler for token expiration
    apiClient.setUnauthorizedHandler(() => {
      console.warn('🚨 Unauthorized access detected');
      toast({
        title: 'Session expired',
        description: 'Please log in again.',
        variant: 'destructive',
      });
      handleLogout();
    });

    // Cleanup on unmount
    return () => {
      // Any cleanup if needed
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Checking authentication status...');
      const response = await apiClient.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data.user);
        console.log('✅ User authenticated:', response.data.user.email);
        
        // Refresh CSRF token after successful auth check
        await refreshCSRFToken();
      } else {
        console.log('❌ No active session found');
      }
    } catch (error: any) {
      console.log('🔐 Authentication check failed:', error.message);
      // This is normal for unauthenticated users
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Refresh CSRF token
  const refreshCSRFToken = async () => {
    try {
      if (user) {
        await apiClient.getCSRFTokenFromServer();
        console.log('✅ CSRF token refreshed');
      }
    } catch (error) {
      console.warn('⚠️ Failed to refresh CSRF token:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔐 Attempting login...');
      
      const response = await apiClient.login(email, password);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        
        // Refresh CSRF token after login
        await refreshCSRFToken();
        
        toast({
          title: 'Welcome back!',
          description: 'Successfully logged in.',
        });
        
        console.log('✅ Login successful');
        navigate('/');
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, full_name: string) => {
    try {
      setLoading(true);
      console.log('📝 Attempting signup...');
      
      const response = await apiClient.signup(email, password, full_name);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        
        // Refresh CSRF token after signup
        await refreshCSRFToken();
        
        toast({
          title: 'Account created!',
          description: response.data.message || 'Welcome to AgentFlow.',
        });
        
        console.log('✅ Signup successful');
        navigate('/');
      } else {
        throw new Error(response.error || 'Signup failed');
      }
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      toast({
        title: 'Signup failed',
        description: error.message || 'Could not create account',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out...');
      await apiClient.logout();
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Continue with logout even if API call fails
    } finally {
      setUser(null);
      navigate('/auth');
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    }
  };

  const logout = async () => {
    await handleLogout();
  };

  const exportData = async () => {
    try {
      console.log('📦 Exporting user data...');
      const response = await apiClient.exportData();
      if (response.success) {
        return response.data;
      }
      throw new Error('Export failed');
    } catch (error: any) {
      console.error('❌ Export error:', error);
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
      console.log('🗑️ Deleting account...');
      const response = await apiClient.deleteProfile(email);
      if (response.success) {
        setUser(null);
        navigate('/auth');
        toast({
          title: 'Account deleted',
          description: 'Your account and all data have been permanently deleted.',
        });
      } else {
        throw new Error(response.error || 'Deletion failed');
      }
    } catch (error: any) {
      console.error('❌ Account deletion error:', error);
      toast({
        title: 'Deletion failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    exportData,
    deleteAccount,
    refreshCSRFToken,
  };

  return (
    <AuthContext.Provider value={value}>
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