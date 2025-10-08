import { AgentResponse } from '@/types/agent';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { TypewriterText } from './TypewriterText';
import { useState, useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';

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
  const [shouldStartTyping, setShouldStartTyping] = useState(!enableTypewriter || typewriterDelay === 0);

  // ✅ Sanitize Markdown + safe inline HTML
  const sanitizedContent = useMemo(() => {
    if (typeof window !== 'undefined') {
      return DOMPurify.sanitize(response.content, {
        ALLOWED_TAGS: [
          'b',
          'i',
          'em',
          'strong',
          'a',
          'code',
          'pre',
          'br',
          'p',
          'ul',
          'ol',
          'li',
          'blockquote',
        ],
        ALLOWED_ATTR: ['href', 'title'],
      });
    }
    return response.content;
  }, [response.content]);

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
        {enableTypewriter ? (
          shouldStartTyping && (
            <TypewriterText
              text={sanitizedContent}
              speed={30}
              onComplete={handleTypewriterComplete}
            >
              {(typedText) => <MarkdownRenderer content={typedText} />}
            </TypewriterText>
          )
        ) : (
          <MarkdownRenderer content={sanitizedContent} />
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
