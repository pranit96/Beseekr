import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check, RefreshCw } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { cn } from '@/lib/utils';

export interface AgentResponse {
  agentId: string;
  agentName: string;
  content: string;
  timestamp: Date;
  status: 'pending' | 'success' | 'error';
  metadata?: any; // keep permissive to avoid TS issues across backend shape changes
}

interface AgentResponseCardProps {
  response: AgentResponse;
  index?: number;
  onForkAgent?: (agentId: string) => void;
  onRegenerate?: (response: AgentResponse) => void;
}

const SkeletonLines: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className="space-y-2 w-full">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded-md bg-muted/30 shimmer min-w-[40%] motion-reduce:opacity-90"
          style={{ animationDuration: '1.6s' }}
        />
      ))}
    </div>
  );
};

const AgentResponseCard: React.FC<AgentResponseCardProps> = ({ response, index, onForkAgent, onRegenerate }) => {
  const [copied, setCopied] = useState(false);
  const modelUsed = (response.metadata as any)?.model_used;
  const tokenCount = (response.metadata as any)?.token_count;
  const confidence = (response.metadata as any)?.confidence;
  const summary = (response.metadata as any)?.summary;
  const domain = (response.metadata as any)?.agent_domain || (response.metadata as any)?.domain;

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 1200);
      return () => clearTimeout(t);
    }
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(response.content || '');
      setCopied(true);
    } catch (e) {
      /* ignore */
    }
  };

  const handleRegenerate = () => {
    // dispatch event your ChatInterface listens for
    try {
      window.dispatchEvent(new CustomEvent('regenerate-from-response', { detail: { prompt: response.content } }));
      onRegenerate?.(response);
    } catch {
      onRegenerate?.(response);
    }
  };

  const handleFork = () => {
    onForkAgent?.(response.agentId);
  };

  return (
    <div
      className={cn(
        'w-full rounded-xl p-4 border bg-background/80 shadow-sm transition-all',
        'motion-reduce:transition-none',
        response.status === 'error' ? 'border-destructive/40 bg-destructive/10' : 'border-border/60'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground/80">
            {response.agentName ? response.agentName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <div className="font-semibold text-sm">{response.agentName}</div>
            {domain && <div className="text-xs text-muted-foreground">{domain}</div>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {response.status === 'pending' && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>

          <Button variant="ghost" size="icon" onClick={handleRegenerate} title="Prefill & regenerate" className="h-8 w-8">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div
        className={cn(
          'prose prose-sm dark:prose-invert max-w-none leading-relaxed',
          'motion-reduce:opacity-100'
        )}
      >
        {response.status === 'pending' ? (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Generating response…</div>
            <SkeletonLines lines={3} />
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-muted/40 animate-pulse" />
              <div className="w-3 h-3 rounded-full bg-muted/40 animate-pulse delay-75" />
              <div className="w-3 h-3 rounded-full bg-muted/40 animate-pulse delay-150" />
            </div>
          </div>
        ) : response.status === 'error' ? (
          <div className="text-destructive">Error generating response.</div>
        ) : (
          <div className="animate-fade-in motion-reduce:opacity-100">
            <MarkdownRenderer content={response.content || ''} />
          </div>
        )}
      </div>

      {/* metadata area */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {summary && <div className="italic border-l-2 pl-2 text-muted-foreground">{summary}</div>}
        {modelUsed && <div>Model: <span className="font-medium text-foreground">{modelUsed}</span></div>}
        {typeof tokenCount !== 'undefined' && <div>Tokens: <span className="font-medium text-foreground">{tokenCount}</span></div>}
        {typeof confidence !== 'undefined' && <div>Confidence: <span className="font-medium text-foreground">{Number(confidence).toFixed(2)}</span></div>}
      </div>
    </div>
  );
};

export default AgentResponseCard;
