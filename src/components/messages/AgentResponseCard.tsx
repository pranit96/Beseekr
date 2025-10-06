import { AgentResponse } from '@/types/agent';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface AgentResponseCardProps {
  response: AgentResponse;
  index: number;
  isSequential: boolean;
}

export const AgentResponseCard = ({
  response,
  index,
  isSequential,
}: AgentResponseCardProps) => {
  // Ensure timestamp is a Date object - FIX for the timestamp error
  const timestamp = response.timestamp instanceof Date 
    ? response.timestamp 
    : new Date(response.timestamp);

  return (
    <div
      className="glass rounded-xl p-4 shadow-soft hover:shadow-medium transition-smooth"
      style={{
        animationDelay: isSequential ? `${index * 0.15}s` : `${index * 0.05}s`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: `hsl(var(--agent-${(index % 5) + 1}))` }}
        />
        <span className="font-medium text-sm">{response.agentName}</span>
        {response.status === 'success' ? (
          <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
        ) : (
          <AlertCircle className="w-4 h-4 text-destructive ml-auto" />
        )}
      </div>
      <div className="text-sm">
        <MarkdownRenderer content={response.content} />
      </div>
      <span className="text-xs text-muted-foreground mt-2 block">
        {/* Use the properly converted timestamp */}
        {timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  );
};