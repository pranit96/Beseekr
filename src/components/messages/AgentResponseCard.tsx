import { AgentResponse } from '@/types/agent';
import { CheckCircle2, AlertCircle, Copy, Repeat2, GitBranch, Flag } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useState, useEffect, useMemo, useRef } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

interface AgentResponseCardProps {
  response: AgentResponse;
  index: number;
  isSequential: boolean;
  enableTypewriter?: boolean;
  typewriterDelay?: number;
  onTypingComplete?: (index: number) => void;
  onRegenerate?: (prompt?: string) => void;
  onForkAgent?: (agentId: string) => void;
}

export const AgentResponseCard = ({
  response,
  index,
  isSequential,
  enableTypewriter = false,
  typewriterDelay = 0,
  onTypingComplete,
  onRegenerate,
  onForkAgent,
}: AgentResponseCardProps) => {
  const [shouldStartTyping, setShouldStartTyping] = useState(!enableTypewriter || typewriterDelay === 0);
  const [visibleChunks, setVisibleChunks] = useState<number>(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const startedRef = useRef(false);
  const contentChunksRef = useRef<string[]>([]);
  const revealTimersRef = useRef<number[]>([]);

  // Detect reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
      const handler = () => setReducedMotion(mq.matches);
      mq.addEventListener?.('change', handler);
      return () => mq.removeEventListener?.('change', handler);
    }
  }, []);

  // Safely derive metadata values with fallbacks
  const modelUsed = (response.metadata as any)?.model || 'model';
  const confidence =
    typeof (response.metadata as any)?.confidence !== 'undefined'
      ? (response.metadata as any).confidence
      : typeof (response.metadata as any)?.confidence_score !== 'undefined'
      ? (response.metadata as any).confidence_score
      : undefined;
  const tokenCount =
    typeof (response.metadata as any)?.token_count !== 'undefined'
      ? (response.metadata as any).token_count
      : response.metadata?.usage?.total_tokens

  // Summary: use provided summary if exists, otherwise first sentence of raw content
  const rawText = typeof response.content === 'string' ? response.content : '';
  const derivedSummary =
    (response as any).summary ||
    rawText.split('\n')[0].split('. ')[0].slice(0, 240);

  useEffect(() => {
    if (enableTypewriter && typewriterDelay > 0) {
      const timer = window.setTimeout(() => setShouldStartTyping(true), typewriterDelay);
      return () => clearTimeout(timer);
    }
    return;
  }, [enableTypewriter, typewriterDelay]);

  // Split raw text into chunks (paragraphs) and convert to sanitized HTML chunks
  useEffect(() => {
    const text = rawText || '';
    const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
    const fallback = text.length ? [text] : [];
    const parts = paragraphs.length ? paragraphs : fallback;

    const htmlChunks = parts.map((p) => {
      // convert markdown snippet to HTML safely
      const html = (marked as any).parseSync
      ? (marked as any).parseSync(p)
      : (typeof marked.parse === 'function'
          ? (marked.parse(p) as string)
          : String(p));

      // sanitize
      return DOMPurify.sanitize(html, {
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
          'h1',
          'h2',
          'h3',
        ],
        ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
      });
    });

    contentChunksRef.current = htmlChunks;
    // reset visible chunks when content changes
    setVisibleChunks(reducedMotion ? htmlChunks.length : 0);
    // clear any previous timers
    revealTimersRef.current.forEach((t) => clearTimeout(t));
    revealTimersRef.current = [];
  }, [rawText, reducedMotion]);

  // Progressive chunk reveal (Claude-like) — not per-character, but per paragraph/paragraph-chunk
  useEffect(() => {
    // If reduced-motion: show all immediately and dispatch events
    if (reducedMotion) {
      if (contentChunksRef.current.length > 0) {
        // notify start & complete immediately
        window.dispatchEvent(new CustomEvent('agent-reveal-start', { detail: { agentId: response.agentId, index } }));
        window.dispatchEvent(new CustomEvent('agent-reveal-complete', { detail: { agentId: response.agentId, index } }));
      }
      return;
    }

    const chunks = contentChunksRef.current;
    if (!shouldStartTyping || chunks.length === 0) return;

    // if already started, do nothing
    if (startedRef.current) return;
    startedRef.current = true;
    // dispatch start
    window.dispatchEvent(new CustomEvent('agent-reveal-start', { detail: { agentId: response.agentId, index } }));

    let delay = 0;
    chunks.forEach((chunk, i) => {
      // compute per-chunk delay based on chunk length but clamped
      const plainLen = chunk.replace(/<[^>]+>/g, '').length || 40;
      const chunkDuration = Math.min(1200, Math.max(300, Math.floor(plainLen * 10)));
      delay += i === 0 ? 120 : Math.floor(chunkDuration * 0.6);

      const t = window.setTimeout(() => {
        setVisibleChunks((prev) => prev + 1);
        // when last chunk revealed, dispatch complete
        if (i === chunks.length - 1) {
          window.dispatchEvent(new CustomEvent('agent-reveal-complete', { detail: { agentId: response.agentId, index } }));
          onTypingComplete?.(index);
        }
      }, delay);
      revealTimersRef.current.push(t);
      // add a small gap
      delay += 80;
    });

    return () => {
      revealTimersRef.current.forEach((t) => clearTimeout(t));
      revealTimersRef.current = [];
    };
  }, [shouldStartTyping, contentChunksRef.current.length, reducedMotion]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawText || '');
      window.dispatchEvent(new CustomEvent('ui-toast', { detail: { message: 'Copied to clipboard' } }));
    } catch {
      window.dispatchEvent(new CustomEvent('ui-toast', { detail: { message: 'Copy failed' } }));
    }
  };

  const handleRegenerate = () => {
    onRegenerate?.(rawText || '');
  };

  const handleFork = () => {
    if (response.agentId) onForkAgent?.(response.agentId);
  };

  const handleReport = () => {
    window.dispatchEvent(new CustomEvent('report-response', { detail: { responseId: response.agentId || response.agentName } }));
    window.dispatchEvent(new CustomEvent('ui-toast', { detail: { message: 'Reported — thanks!' } }));
  };

  // Render visible chunks of HTML
  const visibleHtml = contentChunksRef.current.slice(0, visibleChunks).join('');

  return (
    <div className="glass rounded-xl p-4 shadow-soft hover:shadow-medium transition-smooth animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold"
          style={{
            background: `linear-gradient(135deg, hsl(var(--agent-${(index % 5) + 1})), hsl(var(--agent-${((index+1) % 5) + 1})))`,
          }}
        >
          {response.agentName?.charAt(0) || 'A'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold truncate">{response.agentName || 'Agent'}</div>
            <div className="text-xs text-muted-foreground truncate">
              • {modelUsed} • {new Date(response.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            {typeof confidence !== 'undefined' && (
              <div className="ml-auto text-xs px-2 py-0.5 rounded-md bg-muted/20">
                Confidence: {Math.round((confidence || 0) * 100)}%
              </div>
            )}
          </div>

          <div className="mt-2 text-sm font-semibold leading-tight">
            {derivedSummary}
          </div>
        </div>

        <div className="ml-2">
          {response.status === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-destructive" />
          )}
        </div>
      </div>

      {/* Body */}
      <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
        {/* If nothing visible yet, show compact skeleton */}
        {visibleChunks === 0 ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-3 w-full bg-muted rounded" />
            <div className="h-3 w-5/6 bg-muted rounded" />
          </div>
        ) : (
          <div
            className="fade-in-content"
            // dangerouslySetInnerHTML used after sanitization of each chunk
            dangerouslySetInnerHTML={{ __html: visibleHtml || '' }}
          />
        )}
      </div>

      {/* Follow-ups */}
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          { title: 'Make this shorter', prompt: `Make this shorter: ${rawText.slice(0, 300)}` },
          { title: 'Explain like I’m 5', prompt: `Explain like I'm 5: ${rawText.slice(0, 300)}` },
          { title: 'Add citations', prompt: `Add citations: ${rawText.slice(0, 300)}` },
        ].map((f, i) => (
          <button
            key={f.title + i}
            onClick={() => {
              window.dispatchEvent(new CustomEvent('prefill-prompt', { detail: { prompt: f.prompt } }));
              window.dispatchEvent(new CustomEvent('ui-toast', { detail: { message: `Prefilled: ${f.title}` } }));
            }}
            className="px-3 py-1 text-xs rounded-md border hover:bg-muted/40 transition"
            aria-label={`Follow up: ${f.title}`}
          >
            {f.title}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button onClick={handleCopy} className="p-2 rounded-md hover:bg-muted/30 transition" title="Copy response">
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={handleRegenerate} className="p-2 rounded-md hover:bg-muted/30 transition" title="Regenerate">
            <Repeat2 className="w-4 h-4" />
          </button>
          <button onClick={handleFork} className="p-2 rounded-md hover:bg-muted/30 transition" title="Fork as agent">
            <GitBranch className="w-4 h-4" />
          </button>
          <button onClick={handleReport} className="p-2 rounded-md hover:bg-muted/30 transition" title="Report this response">
            <Flag className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-3">
          <span>{tokenCount ? `${tokenCount} tokens` : ''}</span>
          <span className="hidden sm:inline">{response.metadata?.usage ? `usage: ${JSON.stringify(response.metadata?.usage)}` : ''}</span>
        </div>
      </div>
    </div>
  );
};

export default AgentResponseCard;
