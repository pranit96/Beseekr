import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { ConversationHistory } from '@/components/ConversationHistory';
import { apiClient } from '@/lib/api';
import { Agent } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';

const Chat = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string>();
  const [key, setKey] = useState(0);
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
    setKey(prev => prev + 1); // Force re-render of ChatInterface
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-primary text-primary-foreground p-2 rounded-r-lg shadow-medium hover:shadow-glow transition-smooth"
        style={{ left: sidebarOpen ? '320px' : '0' }}
      >
        {sidebarOpen ? '←' : '→'}
      </button>

      <div className="flex-1 flex flex-col">
        <ChatInterface key={key} agents={agents} />
      </div>
    </div>
  );
};

export default Chat;
