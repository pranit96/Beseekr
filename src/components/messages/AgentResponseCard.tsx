// src/components/messages/AgentResponseCard.tsx
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check, RefreshCw, X } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { cn } from '@/lib/utils';

export interface AgentResponse {
  agentId: string;
  agentName: string;
  content: string;
  timestamp: Date | string;
  status: 'pending' | 'success' | 'error';
  metadata?: any;
}

interface Props {
  response: AgentResponse;
  index?: number;
  onForkAgent?: (agentId: string) => void;
  onRegenerate?: (response: AgentResponse) => void;
  onCancel?: (agentId: string) => void; // optional cancel callback for UI
}

const AgentResponseCard: React.FC<Props> = ({ response, index, onForkAgent, onRegenerate, onCancel }) => {
  const [copied, setCopied] = useState(false);
  const modelUsed = response.metadata?.model_used;
  const tokenCount = response.metadata?.token_count;
  const confidence = response.metadata?.confidence;
  const domain = response.metadata?.agent_domain || response.metadata?.domain;

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1200);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(response.content || '');
      setCopied(true);
    } catch {}
  };

  const handleRegenerate = () => {
    try {
      window.dispatchEvent(new CustomEvent('regenerate-from-response', { detail: { prompt: response.content } }));
    } catch {}
    onRegenerate?.(response);
  };

  const handleFork = () => onForkAgent?.(response.agentId);

  const handleCancel = () => onCancel?.(response.agentId);

  return (
    <div className={cn('w-full rounded-xl p-4 border bg-background/80 shadow-sm transition-all', response.status === 'error' ? 'border-destructive/40 bg-destructive/10' : 'border-border/60')}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground/80">
            {response.agentName?.charAt(0)?.toUpperCase() || 'A'}
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
          <Button variant="ghost" size="icon" onClick={handleRegenerate} className="h-8 w-8">
            <RefreshCw className="w-4 h-4" />
          </Button>
          {/* Cancel button: visible when pending */}
          {response.status === 'pending' && (
            <Button variant="ghost" size="icon" onClick={handleCancel} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
        {response.status === 'pending' ? (
          // STREAMING: show plain-text tokens as they arrive (DOM-only, no innerHTML)
          <div className="whitespace-pre-wrap text-sm text-foreground">
            {response.content || <span className="text-muted-foreground">Generating response…</span>}
          </div>
        ) : response.status === 'error' ? (
          <div className="text-destructive">{response.content || 'Error generating response.'}</div>
        ) : (
          // FINAL: sanitized markdown -> HTML (safe)
          <MarkdownRenderer content={response.content || ''} />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {modelUsed && <div>Model: <span className="font-medium text-foreground">{String(modelUsed)}</span></div>}
        {typeof tokenCount !== 'undefined' && <div>Tokens: <span className="font-medium text-foreground">{String(tokenCount)}</span></div>}
        {typeof confidence !== 'undefined' && <div>Confidence: <span className="font-medium text-foreground">{Number(confidence).toFixed(2)}</span></div>}
      </div>
    </div>
  );
};

export default AgentResponseCard;
