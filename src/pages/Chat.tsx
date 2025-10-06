import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { ConversationHistory } from '@/components/ConversationHistory';
import { apiClient } from '@/lib/api';
import { Agent } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';
import { Menu } from 'lucide-react';

const Chat = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string>();
  const [key, setKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAgents();
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
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    // TODO: Load conversation messages
  };

  const handleNewSession = () => {
    setCurrentConversationId(undefined);
    setKey(prev => prev + 1);
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
          onSelectConversation={handleSelectConversation}
          onNewSession={handleNewSession}
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

        <ChatInterface key={key} agents={agents} />
      </div>
    </div>
  );
};

export default Chat;