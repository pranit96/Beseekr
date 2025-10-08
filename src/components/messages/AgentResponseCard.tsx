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
  // FIX: Simplified state. We only need to know when to start typing.
  const [shouldStartTyping, setShouldStartTyping] = useState(!enableTypewriter || typewriterDelay === 0);

  const timestamp =
    response.timestamp instanceof Date
      ? response.timestamp
      : new Date(response.timestamp);

  useEffect(() => {
    if (enableTypewriter && typewriterDelay > 0) {
      const timer = setTimeout(() => setShouldStartTyping(true), typewriterDelay);
      return () => clearTimeout(timer);
    }
  }, [enableTypewriter, typewriterDelay]);

  const handleTypewriterComplete = () => {
    // onTypingComplete is now called directly from the TypewriterText component's onComplete prop
    onTypingComplete?.(index);
  };

  return (
    <div className="glass rounded-xl p-4 shadow-soft hover:shadow-medium transition-smooth animate-fade-in">
      {/* Header */}
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

      {/* Body */}
      <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
        {/* FIX: Use conditional rendering to avoid duplication. */}
        {/* We choose one path: either typewriter or immediate display. */}
        {enableTypewriter ? (
          // Path 1: Typewriter is enabled.
          // We wait for the delay to finish before rendering the component.
          shouldStartTyping && (
            <TypewriterText
              text={response.content}
              speed={30} // Note: 300 was very slow, changed to 30ms for a better feel.
              onComplete={handleTypewriterComplete}
            >
              {(typedText) => <MarkdownRenderer content={typedText} />}
            </TypewriterText>
          )
        ) : (
          // Path 2: Typewriter is disabled. Render markdown directly.
          <MarkdownRenderer content={response.content} />
        )}
      </div>

      {/* Footer */}
      <span className="text-xs text-muted-foreground mt-2 block">
        {timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  );
};