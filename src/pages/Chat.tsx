import { useState } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { defaultAgents } from '@/lib/mockAgents';
import { Agent } from '@/types/agent';

const Chat = () => {
  const [agents] = useState<Agent[]>(defaultAgents);

  return (
    <div className="h-full flex flex-col">
      <ChatInterface agents={agents} />
    </div>
  );
};

export default Chat;
