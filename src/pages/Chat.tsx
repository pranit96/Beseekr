import { useState } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { defaultAgents } from '@/lib/mockAgents';
import { Agent } from '@/types/agent';

const Chat = () => {
  const [agents] = useState<Agent[]>(defaultAgents);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background to-muted/20">
      <ChatInterface agents={agents} />
    </div>
  );
};

export default Chat;
