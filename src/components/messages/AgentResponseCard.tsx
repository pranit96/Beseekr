// src/components/messages/AgentResponseCard.tsx
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check, RefreshCw, X } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { cn } from '@/lib/utils';
import { createLogger } from '@/services/logging';

const logger = createLogger('AgentResponseCard');

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
  onCancel?: (agentId: string) => void;
}

const AgentResponseCard: React.FC<Props> = ({ response, index, onForkAgent, onRegenerate, onCancel }) => {
  const [copied, setCopied] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const modelUsed = response.metadata?.model_used;
  const tokenCount = response.metadata?.usage?.total_tokens || response.metadata?.token_count;
  const confidence = response.metadata?.confidence;
  const domain = response.metadata?.agent_domain || response.metadata?.domain;

  // Detect when streaming starts/stops
  useEffect(() => {
    if (response.status === 'pending' && response.content) {
      setIsStreaming(true);
    } else if (response.status !== 'pending') {
      setIsStreaming(false);
    }
  }, [response.status, response.content]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1200);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(response.content || '');
      setCopied(true);
      logger.debug('Response copied to clipboard', { agentId: response.agentId });
    } catch (err) {
      logger.error('Failed to copy response', { error: err, agentId: response.agentId });
    }
  };

  const handleRegenerate = () => {
    try {
      window.dispatchEvent(new CustomEvent('regenerate-from-response', {
        detail: { prompt: response.content }
      }));
      logger.info('Regenerate triggered', { agentId: response.agentId });
    } catch (err) {
      logger.error('Failed to trigger regenerate', { error: err, agentId: response.agentId });
    }
    onRegenerate?.(response);
  };

  const handleFork = () => onForkAgent?.(response.agentId);

  const handleCancel = () => onCancel?.(response.agentId);

  // Get agent color based on ID
  const getAgentColor = (agentId: string) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-amber-500',
      'bg-green-500',
      'bg-cyan-500',
      'bg-rose-500',
      'bg-indigo-500'
    ];
    const hash = agentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const agentColor = getAgentColor(response.agentId);

  return (
    <div className={cn(
      'w-full rounded-xl p-4 border shadow-sm transition-all',
      response.status === 'error'
        ? 'border-destructive/40 bg-destructive/5'
        : 'border-border/60 bg-background/80'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-9 w-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm',
            agentColor
          )}>
            {response.agentName?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div>
            <div className="font-semibold text-sm text-foreground">
              {response.agentName}
            </div>
            {domain && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {domain}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {response.status === 'pending' && isStreaming && (
            <div className="flex items-center gap-2 mr-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Streaming...</span>
            </div>
          )}

          {response.content && response.status !== 'pending' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-8 w-8 hover:bg-muted"
              title="Copy response"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          )}

          {response.status === 'success' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRegenerate}
              className="h-8 w-8 hover:bg-muted"
              title="Regenerate"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}

          {response.status === 'pending' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="h-8 w-8 hover:bg-destructive/10 text-destructive"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[40px]">
        {response.status === 'pending' ? (
          <div className="space-y-2">
            {response.content ? (
              // Streaming content — render markdown incrementally for premium feel
              <div className="relative">
                <div className="text-sm">
                  <MarkdownRenderer
                    content={response.content}
                    className="leading-relaxed"
                    showToc={false}
                    enableCopy={false}
                    maxHeight="none"
                  />
                </div>
                <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary rounded-sm animate-pulse align-text-bottom" />
              </div>
            ) : (
              // Waiting for first token
              <div className="flex items-center gap-2 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Waiting for response...
                </span>
              </div>
            )}
          </div>
        ) : response.status === 'error' ? (
          <div className="py-2">
            <div className="flex items-center gap-2 mb-2">
              <X className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                Error generating response
              </span>
            </div>
            <p className="text-sm text-destructive/80">
              {response.content || 'An error occurred while processing your request.'}
            </p>
          </div>
        ) : (
          // Success — full markdown render
          <div className="rounded-lg text-sm">
            <MarkdownRenderer
              content={response.content || ''}
              className="leading-relaxed"
              showToc={false}
              enableCopy={true}
              maxHeight="none"
            />
          </div>
        )}
      </div>

      {/* Metadata footer */}
      {(modelUsed || tokenCount || confidence) && response.status === 'success' && (
        <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {modelUsed && (
            <div className="flex items-center gap-1.5">
              <span className="opacity-60">Model:</span>
              <span className="font-medium text-foreground/80">
                {String(modelUsed)}
              </span>
            </div>
          )}
          {typeof tokenCount !== 'undefined' && (
            <div className="flex items-center gap-1.5">
              <span className="opacity-60">Tokens:</span>
              <span className="font-medium text-foreground/80">
                {String(tokenCount)}
              </span>
            </div>
          )}
          {typeof confidence !== 'undefined' && (
            <div className="flex items-center gap-1.5">
              <span className="opacity-60">Confidence:</span>
              <span className="font-medium text-foreground/80">
                {Number(confidence).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentResponseCard;