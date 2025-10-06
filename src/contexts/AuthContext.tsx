import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  logout: () => void;
  exportData: () => Promise<any>;
  deleteAccount: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (token && refreshToken) {
      apiClient.setTokens({ access_token: token, refresh_token: refreshToken });
      fetchCurrentUser();
    } else {
      setLoading(false);
    }

    // Set up unauthorized handler for token expiration
    apiClient.setUnauthorizedHandler(() => {
      toast({
        title: 'Session expired',
        description: 'Please log in again.',
        variant: 'destructive',
      });
      logout();
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
      apiClient.setTokens(null);
    } finally {
      setLoading(false);
    }
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
          description: 'Welcome to AgentFlow.',
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

  const logout = () => {
    apiClient.setTokens(null);
    setUser(null);
    navigate('/auth');
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
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
      const response = await apiClient.deleteProfile(email);
      if (response.success) {
        apiClient.setTokens(null);
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
    <AuthContext.Provider value={{ user, loading, login, signup, logout, exportData, deleteAccount }}>
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