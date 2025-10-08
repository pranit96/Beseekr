import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { ConversationHistory } from '@/components/ConversationHistory';
import { TopBar } from '@/components/TopBar';
import { apiClient } from '@/lib/api';
import { Agent } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Conversation {
  id: string;
  title: string;
  last_message_at: string;
  status: 'active' | 'archived';
}

const Chat = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [key, setKey] = useState(0);

  const { toast } = useToast();

  useEffect(() => {
    const savedSidebarState = sessionStorage.getItem('sidebarOpen');
    setSidebarOpen(savedSidebarState !== 'false');

    const lastConversationId = sessionStorage.getItem('lastActiveConversation');
    if (lastConversationId) {
      setCurrentConversationId(lastConversationId);
    }

    fetchAgents();
    fetchConversations();
  }, []);

  useEffect(() => {
    sessionStorage.setItem('sidebarOpen', sidebarOpen.toString());
  }, [sidebarOpen]);

  const fetchAgents = useCallback(async () => {
    try {
      const response = await apiClient.getMyAgents();
      if (response.success && response.data) {
        setAgents(response.data);
      } else {
        throw new Error('Unexpected API response');
      }
    } catch (error: any) {
      toast({
        title: 'Failed to load agents',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoadingAgents(false);
    }
  }, [toast]);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await apiClient.getConversations({
        status: 'active',
        page: 1,
        limit: 30,
      });
      if (response.success && response.data) {
        setConversations(response.data);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to load conversations',
        description: error.message || 'Could not fetch history.',
        variant: 'destructive',
      });
    } finally {
      setLoadingConversations(false);
    }
  }, [toast]);

  const handleSelectConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
    sessionStorage.setItem('lastActiveConversation', conversationId);
  }, []);

  const handleNewSession = useCallback(async () => {
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
      } else {
        throw new Error('Could not create a new session');
      }
    } catch (error: any) {
      toast({
        title: 'Failed to create new session',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [fetchConversations, toast]);

  const handleConversationCreated = useCallback(async (conversationId: string) => {
    await fetchConversations();
    setCurrentConversationId(conversationId);
    sessionStorage.setItem('lastActiveConversation', conversationId);
  }, [fetchConversations]);

  const handleConversationChange = useCallback((conversationId: string | null) => {
    if (conversationId) {
      setCurrentConversationId(conversationId);
      sessionStorage.setItem('lastActiveConversation', conversationId);
    } else {
      setCurrentConversationId(undefined);
      sessionStorage.removeItem('lastActiveConversation');
    }
  }, []);

  const handleConversationDeleted = useCallback(() => {
    fetchConversations();
    setCurrentConversationId(undefined);
    sessionStorage.removeItem('lastActiveConversation');
  }, [fetchConversations]);

  const handleConversationArchived = useCallback(() => {
    fetchConversations();
    setCurrentConversationId(undefined);
    sessionStorage.removeItem('lastActiveConversation');
  }, [fetchConversations]);

  const isLoading = loadingAgents || loadingConversations;

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-4 w-64" />
        <div className="animate-pulse text-muted-foreground mt-4">
          Loading chat environment...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        showSidebarToggle
      />

      <div className="flex-1 flex overflow-hidden bg-background">
        {/* Sidebar - Fixed width for better 4K display support */}
        <aside
          className={`transition-all duration-300 ease-in-out border-r border-border bg-muted/30 flex-shrink-0 ${
            sidebarOpen ? 'w-80 2xl:w-96 opacity-100' : 'w-0 opacity-0'
          } overflow-hidden md:block`}
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

        {/* Main Chat Interface - Constrained max width for better readability on 4K */}
        <main className="flex-1 flex justify-center overflow-hidden">
          <div className="w-full max-w-[1400px] 2xl:max-w-[1800px]">
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