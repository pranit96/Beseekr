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
import { createLogger } from '@/services/logging';

const logger = createLogger('Chat');

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
  const [loadingConversations, setLoadingConversations] = useState(false); // Start as false to prevent flash
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [key, setKey] = useState(0);
  const [authError, setAuthError] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const { agents, loading: loadingAgents, reload } = useAgents();
  const { user, refreshAuth } = useAuth();
  const { toast } = useToast();

  const fetchAttemptRef = useRef(0);
  const maxRetries = 3;
  const hasFetchedRef = useRef(false); // Track if we've already fetched

  // Load sidebar and conversation preferences
  useEffect(() => {
    const savedSidebarState = sessionStorage.getItem('sidebarOpen');
    setSidebarOpen(savedSidebarState !== 'false');

    const lastConversationId = sessionStorage.getItem('lastActiveConversation');
    if (lastConversationId) setCurrentConversationId(lastConversationId);

    // Only fetch if we haven't already and user is available
    if (user && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      // Only show loading if this is truly the first load
      if (!initialLoadComplete) {
        setLoadingConversations(true);
      }
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
      setInitialLoadComplete(true);
      return;
    }

    if (!isRetry) {
      fetchAttemptRef.current = 0;
    }

    try {
      logger.info('Fetching conversations', { attempt: fetchAttemptRef.current + 1 });
      
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
              
              logger.debug('Messages fetched for conversation', { 
                conversationId: conv.id, 
                title: conv.title, 
                messageCount: messagesRes.data?.length || 0 
              });
              
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
              logger.error('Failed to fetch messages for conversation', { conversationId: conv.id, error: err });
              return conv;
            }
          })
        );
        
        setConversations(conversationsWithMessages);
        setAuthError(false);
        fetchAttemptRef.current = 0;
        setInitialLoadComplete(true);
      } else {
        throw new Error(response.error || 'Failed to fetch conversations');
      }
    } catch (error: any) {
      logger.error('Failed to fetch conversations', { error: error.message, attempt: fetchAttemptRef.current });
      
      fetchAttemptRef.current++;
      
      if (error.message?.includes('Session expired') || error.message?.includes('401')) {
        setAuthError(true);
      } else if (fetchAttemptRef.current < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, fetchAttemptRef.current), 10000);
        logger.info('Retrying conversation fetch', { delay, attempt: fetchAttemptRef.current });
        setTimeout(() => fetchConversations(true), delay);
      }
    } finally {
      setLoadingConversations(false);
      setInitialLoadComplete(true);
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
      logger.error('Auth refresh failed', { error: error.message });
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

    // Check if current conversation is empty - if so, just focus on it instead of creating new
    if (currentConversationId) {
      const currentConv = conversations.find(c => c.id === currentConversationId);
      const isCurrentEmpty = !currentConv?.last_message || currentConv.last_message.trim() === '';
      
      if (isCurrentEmpty) {
        logger.info('Current conversation is empty, focusing on it instead of creating new', { 
          conversationId: currentConversationId 
        });
        
        // Just ensure it's selected and show a subtle message
        setCurrentConversationId(currentConversationId);
        sessionStorage.setItem('lastActiveConversation', currentConversationId);
        setKey(prev => prev + 1);
        
        toast({
          title: 'Ready to chat',
          description: 'Start typing your message below.',
        });
        
        return; // Don't create a new conversation
      }
    }

    // Generate a temporary ID for optimistic UI
    const tempId = `temp-${Date.now()}`;
    const tempConversation: Conversation = {
      id: tempId,
      title: 'New Conversation',
      last_message_at: new Date().toISOString(),
      status: 'active',
      last_message: undefined,
    };

    // Optimistically update UI immediately
    setConversations(prev => [tempConversation, ...prev]);
    setCurrentConversationId(tempId);
    sessionStorage.setItem('lastActiveConversation', tempId);
    setKey(prev => prev + 1);

    // Show immediate feedback
    toast({
      title: 'New chat started',
      description: 'You can now start messaging your agents.',
    });

    // Create conversation in background with retry logic
    let attempts = 0;
    const maxAttempts = 3;
    
    const createWithRetry = async (): Promise<void> => {
      attempts++;
      
      try {
        logger.info('Creating new conversation in background', { attempt: attempts, tempId });
        
        const response = await apiClient.createConversation({
          agent_id: null,
          title: 'New Conversation',
        });

        if (response.success && response.data?.id) {
          const realId = response.data.id;
          
          logger.info('Background conversation created successfully', { 
            tempId, 
            realId,
            attempt: attempts 
          });
          
          // Store the mapping in sessionStorage so ChatInterface can use it
          sessionStorage.setItem(`conv_mapping_${tempId}`, realId);
          
          // Replace temp conversation with real one
          setConversations(prev => 
            prev.map(conv => 
              conv.id === tempId 
                ? { ...conv, id: realId }
                : conv
            )
          );
          
          // Update current conversation ID if it's still the temp one
          setCurrentConversationId(prevId => {
            if (prevId === tempId) {
              sessionStorage.setItem('lastActiveConversation', realId);
              return realId;
            }
            return prevId;
          });
          
          // Refresh conversation list in background
          setTimeout(() => fetchConversations(), 1000);
        } else {
          throw new Error('Could not create a new session');
        }
      } catch (error: any) {
        logger.error('Failed to create conversation in background', { 
          attempt: attempts, 
          error: error.message,
          tempId
        });
        
        // Check for auth errors
        if (error.message?.includes('Session expired') || error.message?.includes('401')) {
          setAuthError(true);
          // Remove temp conversation
          setConversations(prev => prev.filter(conv => conv.id !== tempId));
          setCurrentConversationId(prevId => {
            if (prevId === tempId) {
              sessionStorage.removeItem('lastActiveConversation');
              return undefined;
            }
            return prevId;
          });
          return;
        }
        
        // Retry logic
        if (attempts < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(2, attempts), 5000);
          logger.info('Retrying background conversation creation', { 
            delay, 
            attempt: attempts,
            nextAttempt: attempts + 1,
            tempId
          });
          
          setTimeout(() => createWithRetry(), delay);
        } else {
          // All retries failed - ChatInterface will create it when user sends first message
          logger.warn('Background conversation creation failed, will be created on first message', { tempId });
        }
      }
    };

    // Start the background creation process
    createWithRetry();
  }, [fetchConversations, toast, user, currentConversationId, conversations]);

  const handleConversationCreated = useCallback(
    async (conversationId: string) => {
      logger.info('Conversation created callback', { conversationId, currentId: currentConversationId });
      
      // Replace temporary conversation with real one, or add if not exists
      setConversations(prev => {
        // Check if we have a temp conversation to replace
        const tempIndex = prev.findIndex(conv => conv.id.startsWith('temp-'));
        
        if (tempIndex >= 0) {
          // Replace temp conversation with real one
          logger.info('Replacing temp conversation with real one', { 
            tempId: prev[tempIndex].id, 
            realId: conversationId 
          });
          
          const updated = [...prev];
          updated[tempIndex] = {
            ...updated[tempIndex],
            id: conversationId,
          };
          return updated;
        }
        
        // Check if conversation already exists
        const exists = prev.some(conv => conv.id === conversationId);
        if (exists) {
          logger.debug('Conversation already exists in list', { conversationId });
          return prev;
        }
        
        // Add new conversation to the list
        logger.info('Adding new conversation to list', { conversationId });
        return [{
          id: conversationId,
          title: 'New Conversation',
          last_message_at: new Date().toISOString(),
          status: 'active',
          last_message: undefined,
        }, ...prev];
      });
      
      setCurrentConversationId(conversationId);
      sessionStorage.setItem('lastActiveConversation', conversationId);
      
      // Fetch full conversation list in background to get updated data
      setTimeout(() => {
        fetchConversations();
      }, 500);
    },
    [fetchConversations, currentConversationId]
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
      logger.info('Clearing cache for deleted conversation', { conversationId: deletedConvId });
      
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

  // Only show loading on initial load, not on subsequent navigations
  const isLoading = (loadingAgents || loadingConversations) && !initialLoadComplete;

  // Handle conversation not found errors
  useEffect(() => {
    const handleConversationNotFound = (event: CustomEvent) => {
      const { conversationId: notFoundId } = event.detail;
      logger.warn('Removing conversation that was not found', { conversationId: notFoundId });
      
      // Remove from conversation list
      setConversations(prev => prev.filter(conv => conv.id !== notFoundId));
      
      // If it was the current conversation, clear it
      if (currentConversationId === notFoundId) {
        setCurrentConversationId(undefined);
        sessionStorage.removeItem('lastActiveConversation');
        setKey(prev => prev + 1);
        
        toast({
          title: 'Conversation not found',
          description: 'This conversation may have been deleted. Starting fresh.',
          variant: 'default',
        });
      }
    };

    window.addEventListener('conversation-not-found', handleConversationNotFound as EventListener);
    return () => window.removeEventListener('conversation-not-found', handleConversationNotFound as EventListener);
  }, [currentConversationId, toast]);

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

  // Loading skeleton - only show on true initial load
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