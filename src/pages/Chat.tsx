import React, { useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { useAgents } from "@/hooks/use-agents";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

const ChatPage: React.FC = () => {
  const { agents, loading: isLoading, error } = useAgents();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null
  );

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );

  return (
    <ScrollArea className="h-full">
      <ChatInterface
        agents={agents}
        activeConversationId={activeConversationId || undefined}
        onConversationChange={setActiveConversationId}
        onConversationCreated={setActiveConversationId}
      />
    </ScrollArea>
  );
};

export default ChatPage;
