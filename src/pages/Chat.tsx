import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { ConversationHistory } from '@/components/ConversationHistory';
import { TopBar } from '@/components/TopBar';
import { apiClient } from '@/lib/api';
import { Agent } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  title: string;
  last_message_at: string;
  status: 'active' | 'archived';
}

const Chat = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string>();
  const [key, setKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAgents();
    fetchConversations();
    
    // Load sidebar state from memory
    const savedSidebarState = sessionStorage.getItem('sidebarOpen');
    if (savedSidebarState !== null) {
      setSidebarOpen(savedSidebarState === 'true');
    }
    
    // Load last active conversation
    const lastConversationId = sessionStorage.getItem('lastActiveConversation');
    if (lastConversationId) {
      setCurrentConversationId(lastConversationId);
    }
  }, []);

  // Save sidebar state to session storage
  useEffect(() => {
    sessionStorage.setItem('sidebarOpen', sidebarOpen.toString());
  }, [sidebarOpen]);

  const fetchAgents = async () => {
    try {
      const response = await apiClient.getMyAgents();
      if (response.success && response.data) {
        setAgents(response.data);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to load agents',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await apiClient.getConversations({ 
        status: 'active',
        page: 1,
        limit: 20 
      });
      
      if (response.success && response.data) {
        setConversations(response.data);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to load conversations',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    sessionStorage.setItem('lastActiveConversation', conversationId);
  };

  const handleNewSession = async () => {
    try {
      const response = await apiClient.createConversation({
        agent_id: null,
        title: 'New Conversation'
      });

      if (response.success && response.data?.id) {
        const newConversationId = response.data.id;
        setCurrentConversationId(newConversationId);
        sessionStorage.setItem('lastActiveConversation', newConversationId);
        
        await fetchConversations();
        setKey(prev => prev + 1);
        
        toast({
          title: 'New session created',
          description: 'Ready to start chatting',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Failed to create new session',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleConversationCreated = async (conversationId: string) => {
    await fetchConversations();
    setCurrentConversationId(conversationId);
    sessionStorage.setItem('lastActiveConversation', conversationId);
  };

  const handleConversationChange = (conversationId: string | null) => {
    if (conversationId) {
      setCurrentConversationId(conversationId);
      sessionStorage.setItem('lastActiveConversation', conversationId);
    } else {
      setCurrentConversationId(undefined);
      sessionStorage.removeItem('lastActiveConversation');
    }
  };

  const handleConversationDeleted = () => {
    fetchConversations();
    sessionStorage.removeItem('lastActiveConversation');
    setCurrentConversationId(undefined);
  };

  const handleConversationArchived = () => {
    fetchConversations();
    setCurrentConversationId(undefined);
    sessionStorage.removeItem('lastActiveConversation');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading agents...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar 
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        showSidebarToggle={true}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar with smooth transition */}
        <div
          className={`transition-all duration-300 ease-in-out border-r border-border bg-muted/30 ${
            sidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0'
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
        </div>

        {/* Main chat area */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface 
            key={key} 
            agents={agents} 
            activeConversationId={currentConversationId}
            onConversationChange={handleConversationChange}
            onConversationCreated={handleConversationCreated}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;