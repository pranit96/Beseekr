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

  return (
    <div className="space-y-6 pb-4">
      {messages.map((message) => (
        <div key={message.id}>
          {/* User Message */}
          {message.type === 'user' && (
            <div className="flex gap-4 justify-end mb-6">
              <div className="flex flex-col gap-2 max-w-[85%] items-end">
                {/* Message bubble */}
                <div className="rounded-2xl px-4 py-3 bg-primary text-primary-foreground shadow-sm">
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {message.content}
                  </p>
                </div>

                {/* Message metadata and actions */}
                <div className="flex items-center gap-2 px-2">
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(message.timestamp)}
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-muted"
                      onClick={() => handleCopy(message.content, message.id)}
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-5 h-5 text-foreground" />
                </div>
              </div>
            </div>
          )}

          {/* Agent Responses - Each in separate bubble */}
          {message.type === 'agent' && message.agentResponses && message.agentResponses.length > 0 && (
            <div className="space-y-5">
              {message.agentResponses.map((response, idx) => (
                <div key={`${message.id}-agent-${idx}`} className="flex gap-4 justify-start">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${getAgentColor(response.agentId)}`}>
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 max-w-[85%] items-start flex-1">
                    {/* Agent name and status header */}
                    <div className="flex items-center gap-2 px-2">
                      <span className="text-xs font-semibold text-foreground">
                        {response.agentName}
                      </span>
                      {getStatusIcon(response.status)}
                      {response.metadata?.usage && (
                        <span className="text-xs text-muted-foreground">
                          {response.metadata.usage.total_tokens || 0} tokens
                        </span>
                      )}
                    </div>

                    {/* Message bubble */}
                    <div className="rounded-2xl px-4 py-3 bg-muted border border-border shadow-sm w-full">
                      {response.content ? (
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
                      ) : response.status === 'pending' ? (
                        <div className="flex items-center gap-2 py-2">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Generating response...</span>
                        </div>
                      ) : response.status === 'error' ? (
                        <div className="text-sm text-destructive">
                          Error generating response
                        </div>
                      ) : null}
                    </div>

                    {/* Message metadata and actions */}
                    <div className="flex items-center gap-2 px-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(response.timestamp)}
                      </span>

                      {message.isFromCache && idx === 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          Cached
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        {response.content && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-muted"
                            onClick={() => handleCopy(response.content, `${message.id}-${idx}`)}
                          >
                            {copiedId === `${message.id}-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        )}

                        {idx === message.agentResponses.length - 1 && onRetryMessage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-muted"
                            onClick={() => handleRetry(message.id)}
                            disabled={isLoading}
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
            <div className="rounded-2xl px-4 py-3 bg-muted border border-border shadow-sm">
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