// src/components/MessageList.tsx
import React, { useState } from 'react';
import { Copy, RotateCw, Check, User, Bot, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onRetryMessage?: (messageId: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  isLoading = false,
  onRetryMessage 
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      toast({
        title: 'Copied to clipboard',
        description: 'Message content copied successfully',
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleRetry = (messageId: string) => {
    if (onRetryMessage) {
      onRetryMessage(messageId);
      toast({
        title: 'Retrying message',
        description: 'Resending your request to the agents',
      });
    }
  };

  const formatTimestamp = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(date));
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'pending':
        return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 pb-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-4 ${
            message.type === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          {message.type === 'agent' && (
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
            </div>
          )}

          <div
            className={`flex flex-col gap-2 max-w-[85%] ${
              message.type === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            {/* Message bubble */}
            <div
              className={`rounded-2xl px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted border border-border'
              }`}
            >
              {message.type === 'user' ? (
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              ) : (
                <div className="space-y-4">
                  {/* FIXED: Only show agent responses, avoid duplication */}
                  {message.agentResponses && message.agentResponses.length > 0 ? (
                    message.agentResponses.map((response, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {response.agentName}
                          </span>
                          {getStatusIcon(response.status)}
                          {response.metadata?.usage && (
                            <span className="text-xs">
                              ({response.metadata.usage.total_tokens || 0} tokens)
                            </span>
                          )}
                        </div>

                        {response.content && (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({
                                  node,
                                  inline,
                                  className,
                                  children,
                                  ...props
                                }: {
                                  node: any;
                                  inline?: boolean;
                                  className?: string;
                                  children: React.ReactNode;
                                  [key: string]: any;
                                }) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  return !inline && match ? (
                                    <SyntaxHighlighter
                                      style={vscDarkPlus}
                                      language={match[1]}
                                      PreTag="div"
                                      {...props}
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                              }}
                            >
                              {response.content}
                            </ReactMarkdown>
                          </div>
                        )}

                        {response.status === 'pending' && !response.content && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Processing...</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : null}

                  {/* FIXED: Only show finalOutput if it exists and is different from agent responses */}
                  {message.finalOutput && 
                   (!message.agentResponses || 
                    message.agentResponses.length === 0 || 
                    !message.agentResponses.some(r => r.content === message.finalOutput)) && (
                    <div className="prose prose-sm dark:prose-invert max-w-none pt-2 border-t">
                      <div className="text-xs font-semibold text-muted-foreground mb-2">Final Summary</div>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({
                            node,
                            inline,
                            className,
                            children,
                            ...props
                          }: {
                            node: any;
                            inline?: boolean;
                            className?: string;
                            children: React.ReactNode;
                            [key: string]: any;
                          }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {message.finalOutput}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Message metadata and actions */}
            <div className="flex items-center gap-2 px-2">
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(message.timestamp)}
              </span>

              {message.isFromCache && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  Cached
                </span>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                {message.type === 'agent' && (message.content || message.agentResponses) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      const contentToCopy = message.agentResponses
                        ?.map(r => `**${r.agentName}:**\n${r.content}`)
                        .join('\n\n') || message.content;
                      handleCopy(contentToCopy, message.id);
                    }}
                  >
                    {copiedId === message.id ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                )}

                {message.type === 'agent' && onRetryMessage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleRetry(message.id)}
                    disabled={isLoading}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </Button>
                )}

                {message.type === 'user' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleCopy(message.content, message.id)}
                  >
                    {copiedId === message.id ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {message.type === 'user' && (
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <User className="w-5 h-5 text-foreground" />
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex gap-4 justify-start">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="rounded-2xl px-4 py-3 bg-muted border border-border">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Agents are thinking...
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;