import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { ConversationHistory } from '@/components/ConversationHistory';
import { TopBar } from '@/components/TopBar';
import { apiClient } from '@/lib/api';
import { useAgents } from '@/hooks/use-agents';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Agent } from '@/types/agent';

interface Conversation {
  id: string;
  title: string;
  last_message_at: string;
  status: 'active' | 'archived';
  last_message?: string;
}

const Chat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [key, setKey] = useState(0);
  const [authError, setAuthError] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const { agents, loading: loadingAgents, reload } = useAgents();
  const { user, refreshAuth } = useAuth();
  const { toast } = useToast();

  const fetchAttemptRef = useRef(0);
  const maxRetries = 3;

  // Load sidebar and conversation preferences
  useEffect(() => {
    const savedSidebarState = sessionStorage.getItem('sidebarOpen');
    setSidebarOpen(savedSidebarState !== 'false');

    const lastConversationId = sessionStorage.getItem('lastActiveConversation');
    if (lastConversationId) setCurrentConversationId(lastConversationId);

    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    sessionStorage.setItem('sidebarOpen', sidebarOpen.toString());
  }, [sidebarOpen]);

  // Fetch conversation history with retry logic
  const fetchConversations = useCallback(async (isRetry: boolean = false) => {
    if (!user) {
      setLoadingConversations(false);
      return;
    }

    if (!isRetry) {
      fetchAttemptRef.current = 0;
    }

    try {
      console.log('[Chat] Fetching conversations, attempt:', fetchAttemptRef.current + 1);
      
      const response = await apiClient.getConversations({
        status: 'active',
        page: 1,
        limit: 30,
      });
      
      if (response.success && response.data) {
        // Fetch last messages for each conversation
        const conversationsWithMessages = await Promise.all(
          response.data.map(async (conv: any) => {
            try {
              // Fetch more messages (up to 5) to ensure we get a user message
              const messagesRes = await apiClient.getMessages(conv.id, 1, 5);
              
              console.log(`[Chat] Messages for ${conv.title || conv.id}:`, messagesRes.data?.length || 0, 'messages');
              
              if (messagesRes.data && messagesRes.data.length > 0) {
                // Sort messages by created_at (most recent first)
                const sortedMessages = [...messagesRes.data].sort((a: any, b: any) => {
                  const dateA = new Date(a.created_at).getTime();
                  const dateB = new Date(b.created_at).getTime();
                  return dateB - dateA;
                });
                
                // Find the most recent user message
                const lastUserMsg = sortedMessages.find((m: any) => m.role === 'user');
                
                if (lastUserMsg?.content) {
                  return {
                    ...conv,
                    last_message: lastUserMsg.content.substring(0, 100)
                  };
                }
                
                // If no user message, try to find any message with content
                const anyMessageWithContent = sortedMessages.find((m: any) => m.content && m.content.trim());
                
                if (anyMessageWithContent?.content) {
                  const rolePrefix = anyMessageWithContent.role === 'assistant' ? '🤖 ' : '';
                  return {
                    ...conv,
                    last_message: `${rolePrefix}${anyMessageWithContent.content.substring(0, 100)}`
                  };
                }
              }
              
              return conv;
            } catch (err) {
              console.error('[Chat] Failed to fetch messages for', conv.id, err);
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
      } else if (fetchAttemptRef.current < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, fetchAttemptRef.current), 10000);
        console.log(`[Chat] Retrying in ${delay}ms...`);
        setTimeout(() => fetchConversations(true), delay);
      }
    } finally {
      setLoadingConversations(false);
    }
  }, [user]);

  // Handle auth recovery
  const handleRetryAuth = useCallback(async () => {
    setRetrying(true);
    setAuthError(false);
    
    try {
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
    if (!user) return;

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
      } else {
        toast({
          title: 'Failed to create new session',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  }, [fetchConversations, toast, user]);

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
    const deletedConvId = deletedId || currentConversationId;
    
    if (deletedConvId) {
      console.log('[Chat] Clearing cache for deleted conversation:', deletedConvId);
      
      if (currentConversationId === deletedConvId) {
        setCurrentConversationId(undefined);
        sessionStorage.removeItem('lastActiveConversation');
        setKey(prev => prev + 1);
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
          Your session has expired. Please refresh to continue.
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

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <TopBar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        showSidebarToggle
      />

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
          {/* Subtle background pattern */}
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