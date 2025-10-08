import { AgentResponse } from '@/types/agent';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { TypewriterText } from './TypewriterText';
import { useState, useEffect } from 'react';

interface AgentResponseCardProps {
  response: AgentResponse;
  index: number;
  isSequential: boolean;
  enableTypewriter?: boolean;
  typewriterDelay?: number;
  onTypingComplete?: (index: number) => void;
}

export const AgentResponseCard = ({
  response,
  index,
  isSequential,
  enableTypewriter = false,
  typewriterDelay = 0,
  onTypingComplete,
}: AgentResponseCardProps) => {
  const [shouldStartTyping, setShouldStartTyping] = useState(!enableTypewriter);
  const [isTypingComplete, setIsTypingComplete] = useState(!enableTypewriter);
  
  const timestamp = response.timestamp instanceof Date 
    ? response.timestamp 
    : new Date(response.timestamp);

  useEffect(() => {
    if (enableTypewriter) {
      if (typewriterDelay > 0) {
        const timer = setTimeout(() => {
          setShouldStartTyping(true);
        }, typewriterDelay);
        return () => clearTimeout(timer);
      } else {
        setShouldStartTyping(true);
      }
    } else {
      setShouldStartTyping(true);
      setIsTypingComplete(true);
    }
  }, [enableTypewriter, typewriterDelay]);

  const handleTypewriterComplete = () => {
    setIsTypingComplete(true);
    onTypingComplete?.(index);
  };

  return (
    <div
      className="glass rounded-xl p-4 shadow-soft hover:shadow-medium transition-smooth animate-fade-in"
    >
      <div className="flex items-center gap-2 mb-3">
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
      
      <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
        {enableTypewriter && shouldStartTyping && !isTypingComplete ? (
          <div className="relative">
            <TypewriterText 
              text={response.content} 
              speed={500}
              onComplete={handleTypewriterComplete}
            />
          </div>
        ) : (
          <MarkdownRenderer content={response.content} />
        )}
      </div>
      
      <span className="text-xs text-muted-foreground mt-2 block">
        {timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  );
};