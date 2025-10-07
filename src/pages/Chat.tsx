import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { ConversationHistory } from '@/components/ConversationHistory';
import { apiClient } from '@/lib/api';
import { Agent } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';
import { Menu } from 'lucide-react';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAgents();
    fetchConversations();
    // Load last active conversation from localStorage
    const lastConversationId = localStorage.getItem('lastActiveConversation');
    if (lastConversationId) {
      setCurrentConversationId(lastConversationId);
    }
  }, []);

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
    localStorage.setItem('lastActiveConversation', conversationId);
  };

  const handleNewSession = async () => {
    try {
      // Create new conversation immediately when new session is clicked
      const response = await apiClient.createConversation({
        agent_id: null,
        title: 'New Conversation'
      });

      if (response.success && response.data?.id) {
        const newConversationId = response.data.id;
        setCurrentConversationId(newConversationId);
        localStorage.setItem('lastActiveConversation', newConversationId);
        
        // Refresh conversations list to include the new one
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
    // Refresh conversations list when a new one is created from ChatInterface
    await fetchConversations();
    setCurrentConversationId(conversationId);
    localStorage.setItem('lastActiveConversation', conversationId);
  };

  const handleConversationChange = (conversationId: string | null) => {
    if (conversationId) {
      setCurrentConversationId(conversationId);
      localStorage.setItem('lastActiveConversation', conversationId);
    } else {
      setCurrentConversationId(undefined);
      localStorage.removeItem('lastActiveConversation');
    }
  };

  const handleConversationDeleted = () => {
    // Refresh conversations list when one is deleted
    fetchConversations();
    
    // Clear localStorage
    localStorage.removeItem('lastActiveConversation');
    
    setCurrentConversationId(undefined);
  };

  const handleConversationArchived = () => {
    // Refresh conversations list when one is archived
    fetchConversations();
    setCurrentConversationId(undefined);
    localStorage.removeItem('lastActiveConversation');
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading agents...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex relative">
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? 'w-80' : 'w-0'
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

      <div className="flex-1 flex flex-col">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-4 top-4 z-10 bg-primary text-primary-foreground p-2 rounded-lg shadow-medium hover:shadow-glow transition-smooth"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <ChatInterface 
          key={key} 
          agents={agents} 
          activeConversationId={currentConversationId}
          onConversationChange={handleConversationChange}
          onConversationCreated={handleConversationCreated}
        />
      </div>
    </div>
  );
};

export default Chat;