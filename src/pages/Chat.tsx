import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { ConversationHistory } from '@/components/ConversationHistory';
import { TopBar } from '@/components/TopBar';
import { apiClient } from '@/lib/api';
import { useAgents } from '@/hooks/use-agents';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Agent } from '@/types/agent';

interface Conversation {
  id: string;
  title: string;
  last_message_at: string;
  status: 'active' | 'archived';
  last_message?: string; // Add this for preview
}

const Chat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [key, setKey] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const { agents, loading: loadingAgents, reload } = useAgents();
  const { user, socketConnected, refreshAuth } = useAuth();
  const { toast } = useToast();

  const fetchAttemptRef = useRef(0);
  const maxRetries = 3;
  // Remove the chatInterfaceRef - not needed

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineBanner(false);
      setAuthError(false);
      
      if (user) {
        handleRetryAuth();
      }
      
      toast({
        title: 'Back online',
        description: 'Connection restored',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineBanner(true);
      toast({
        title: 'No internet connection',
        description: 'You are currently offline',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast, user]);

  // Load sidebar and conversation preferences
  useEffect(() => {
    const savedSidebarState = sessionStorage.getItem('sidebarOpen');
    setSidebarOpen(savedSidebarState !== 'false');

    const lastConversationId = sessionStorage.getItem('lastActiveConversation');
    if (lastConversationId) setCurrentConversationId(lastConversationId);

    if (user && isOnline) {
      fetchConversations();
    }
  }, [user, isOnline]);

  useEffect(() => {
    sessionStorage.setItem('sidebarOpen', sidebarOpen.toString());
  }, [sidebarOpen]);

  // Auto-save scroll position
  useEffect(() => {
    const handleBeforeUnload = () => {
      const scrollPos = window.scrollY;
      sessionStorage.setItem('chatScrollPosition', scrollPos.toString());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Restore scroll position
  useEffect(() => {
    const savedScrollPos = sessionStorage.getItem('chatScrollPosition');
    if (savedScrollPos) {
      window.scrollTo(0, parseInt(savedScrollPos));
      sessionStorage.removeItem('chatScrollPosition');
    }
  }, []);

  // Fetch conversation history with retry logic
  const fetchConversations = useCallback(async (isRetry: boolean = false) => {
    if (!isOnline || !user) {
      setLoadingConversations(false);
      return;
    }

    if (!isRetry) {
      fetchAttemptRef.current = 0;
    }

    try {
     
      const response = await apiClient.getConversations({
        status: 'active',
        page: 1,
        limit: 30,
      });
      
      if (response.success && response.data) {
        // Fetch last message for each conversation
        const conversationsWithMessages = await Promise.all(
          response.data.map(async (conv: any) => {
            try {
              const messagesRes = await apiClient.getMessages(conv.id, 1, 1);
              const lastMessage = messagesRes.data?.[0];
              
              return {
                ...conv,
                last_message: lastMessage?.content 
                  ? lastMessage.content.substring(0, 100) 
                  : undefined
              };
            } catch (err) {
              console.error('[Chat] Failed to fetch last message for', conv.id, err);
              return conv;
            }
          })
        );
        
        setConversations(conversationsWithMessages);
        setAuthError(false);
        fetchAttemptRef.current = 0;
      } else {
        throw new Error(response.error || 'Failed to fetch conversations');
      }
    } catch (error: any) {
      console.error('[Chat] Failed to fetch conversations:', error);
      
      fetchAttemptRef.current++;
      
      if (error.message?.includes('Session expired') || error.message?.includes('401')) {
        setAuthError(true);
        toast({
          title: 'Session expired',
          description: 'Please refresh to continue',
          variant: 'destructive',
        });
      } else if (fetchAttemptRef.current < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, fetchAttemptRef.current), 10000);
        console.log(`[Chat] Retrying in ${delay}ms...`);
        
        setTimeout(() => fetchConversations(true), delay);
      } else {
        toast({
          title: 'Failed to load conversations',
          description: 'Please try refreshing the page',
          variant: 'destructive',
        });
      }
    } finally {
      setLoadingConversations(false);
    }
  }, [toast, isOnline, user]);

  // Handle auth recovery
  const handleRetryAuth = useCallback(async () => {
    setRetrying(true);
    setAuthError(false);
    
    try {
      console.log('[Chat] Attempting to refresh auth...');
      await refreshAuth();
      
      await reload();
      await fetchConversations();
      
      apiClient.invalidateCache();
      
      toast({
        title: 'Session refreshed',
        description: 'You can continue using the app',
      });
    } catch (error: any) {
      console.error('[Chat] Auth refresh failed:', error);
      toast({
        title: 'Refresh failed',
        description: 'Please try logging in again',
        variant: 'destructive',
      });
      setAuthError(true);
    } finally {
      setRetrying(false);
    }
  }, [refreshAuth, reload, fetchConversations, toast]);

  // Handlers
  const handleSelectConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
    sessionStorage.setItem('lastActiveConversation', conversationId);
  }, []);

  const handleNewSession = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: 'Offline',
        description: 'Cannot create new session while offline',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please log in to create a new session',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await apiClient.createConversation({
        agent_id: null,
        title: 'New Conversation',
      });

      if (response.success && response.data?.id) {
        const newId = response.data.id;
        setCurrentConversationId(newId);
        sessionStorage.setItem('lastActiveConversation', newId);
        await fetchConversations();
        setKey(prev => prev + 1);

        toast({
          title: 'New chat started',
          description: 'You can now start messaging your agents.',
        });
      } else throw new Error('Could not create a new session');
    } catch (error: any) {
      if (error.message?.includes('Session expired') || error.message?.includes('401')) {
        setAuthError(true);
        toast({
          title: 'Session expired',
          description: 'Please refresh to continue',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to create new session',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  }, [fetchConversations, toast, isOnline, user]);

  const handleConversationCreated = useCallback(
    async (conversationId: string) => {
      await fetchConversations();
      setCurrentConversationId(conversationId);
      sessionStorage.setItem('lastActiveConversation', conversationId);
    },
    [fetchConversations]
  );

  const handleConversationChange = useCallback((conversationId: string | null) => {
    if (conversationId) {
      setCurrentConversationId(conversationId);
      sessionStorage.setItem('lastActiveConversation', conversationId);
    } else {
      setCurrentConversationId(undefined);
      sessionStorage.removeItem('lastActiveConversation');
    }
  }, []);

  const handleConversationDeleted = useCallback((deletedId?: string) => {
    // Clear from cache if ChatInterface has the messageCache
    const deletedConvId = deletedId || currentConversationId;
    
    if (deletedConvId) {
      
      // If the deleted conversation is the current one, clear it
      if (currentConversationId === deletedConvId) {
        setCurrentConversationId(undefined);
        sessionStorage.removeItem('lastActiveConversation');
        setKey(prev => prev + 1); // Force remount ChatInterface
      }
    }
    
    fetchConversations();
    
    toast({
      title: 'Conversation deleted',
      description: 'The conversation has been removed.',
    });
  }, [fetchConversations, toast, currentConversationId]);

  const handleConversationArchived = useCallback(() => {
    fetchConversations();
    setCurrentConversationId(undefined);
    sessionStorage.removeItem('lastActiveConversation');
    toast({
      title: 'Conversation archived',
      description: 'The conversation has been archived.',
    });
  }, [fetchConversations, toast]);

  const isLoading = loadingAgents || loadingConversations;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewSession();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'r' && authError) {
        e.preventDefault();
        handleRetryAuth();
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [handleNewSession, authError, handleRetryAuth]);

  // Loading skeleton
  if (isLoading && !authError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="animate-pulse text-muted-foreground mt-4">
          Loading chat environment...
        </div>
      </div>
    );
  }

  // Auth error state
  if (authError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background p-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold">Session Expired</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Your session has expired or become invalid. Please refresh to continue.
        </p>
        <div className="flex gap-3 mt-4">
          <Button
            onClick={handleRetryAuth}
            disabled={retrying}
            className="gap-2"
          >
            {retrying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Refresh Session
              </>
            )}
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  // Offline state
  if (!isOnline && conversations.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background p-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold">You're offline</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Please check your internet connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <TopBar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        showSidebarToggle
      />

      {/* Offline banner */}
      {showOfflineBanner && (
        <div className="bg-destructive text-destructive-foreground px-4 py-2 text-sm flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>You are currently offline. Some features may be limited.</span>
          <button
            onClick={() => setShowOfflineBanner(false)}
            className="ml-4 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Session warning banner */}
      {!socketConnected && isOnline && user && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-4 py-2 text-sm flex items-center justify-center gap-2">
          <Button
            onClick={handleRetryAuth}
            variant="ghost"
            size="sm"
            className="ml-2 h-6 text-xs"
          >
            Retry
          </Button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`transition-all duration-300 ease-in-out border-r border-border bg-muted/30 flex-shrink-0 ${
            sidebarOpen ? 'w-80 2xl:w-96 opacity-100' : 'w-0 opacity-0'
          } overflow-hidden`}
        >
          <ConversationHistory
            conversations={conversations}
            onSelectConversation={handleSelectConversation}
            onNewSession={handleNewSession}
            onConversationDeleted={handleConversationDeleted}
            onConversationArchived={handleConversationArchived}
            currentConversationId={currentConversationId}
          />
        </aside>

        {/* Chat Interface */}
        <main className="flex-1 flex justify-center overflow-hidden relative">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }} />
          </div>

          <div className="w-full max-w-[1400px] 2xl:max-w-[1800px] relative z-10">
            <ChatInterface
              key={key}
              agents={agents}
              activeConversationId={currentConversationId}
              onConversationChange={handleConversationChange}
              onConversationCreated={handleConversationCreated}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Chat;