import { AgentResponse } from '@/types/agent';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useState, useEffect, useMemo, useRef } from 'react';
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
  const [revealProgress, setRevealProgress] = useState(0);
  const revealRef = useRef<HTMLDivElement | null>(null);

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

  // New: Stream-like reveal (mask) — smoother and less "typewriter-y"
  useEffect(() => {
    if (!enableTypewriter || !shouldStartTyping || !revealRef.current) {
      if (!enableTypewriter) {
        setRevealProgress(100);
      }
      return;
    }

    let raf = 0;
    const el = revealRef.current;
    const textLength = sanitizedContent.length || 100;
    // duration proportional to content length but clamped
    const duration = Math.min(3500, Math.max(600, textLength * 18));
    const start = performance.now();

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      setRevealProgress(Math.round(progress * 100));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        onTypingComplete?.(index);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [enableTypewriter, shouldStartTyping, sanitizedContent, index, onTypingComplete]);

  const clipStyle = {
    clipPath: `polygon(0 0, ${revealProgress}% 0, ${revealProgress}% 100%, 0% 100%)`,
    WebkitClipPath: `polygon(0 0, ${revealProgress}% 0, ${revealProgress}% 100%, 0% 100%)`,
    transition: 'clip-path 120ms linear',
  } as React.CSSProperties;

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
        {/* We render the full sanitized HTML but reveal it using a clip-path mask for a smooth streaming feel */}
        <div ref={revealRef} style={enableTypewriter ? clipStyle : undefined}>
          <MarkdownRenderer content={sanitizedContent} />
        </div>
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