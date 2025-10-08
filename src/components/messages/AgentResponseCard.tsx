import React, { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AgentResponse {
  agentId: string;
  agentName: string;
  content: string;
  timestamp: Date;
  status: "pending" | "success" | "error";
  metadata?: {
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    domain?: string;
    model_used?: string;
    token_count?: number;
    confidence?: number;
    summary?: string;
  };
}

interface AgentResponseCardProps {
  response: AgentResponse;
  index: number;
  onReplaceResponse?: (oldAgentId: string, newResponse: AgentResponse) => void;
  onForkAgent?: (agentId: string) => void;
}

const AgentResponseCard: React.FC<AgentResponseCardProps> = ({
  response,
  index,
  onForkAgent,
}) => {
  const [copied, setCopied] = useState(false);
  const [sanitized, setSanitized] = useState("");

  useEffect(() => {
    const safe = DOMPurify.sanitize(response.content);
    setSanitized(safe);
  }, [response.content]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(response.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div
      className={cn(
        "w-full rounded-xl p-5 border bg-background/70 backdrop-blur-sm shadow-sm transition-all duration-300",
        "hover:shadow-md",
        response.status === "error"
          ? "border-destructive/40 bg-destructive/10"
          : "border-border/60"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base">{response.agentName}</span>
          {response.metadata?.domain && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
              {response.metadata.domain}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-8 w-8"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>

          {response.status === "pending" && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
          {response.status === "error" && (
            <span className="text-destructive text-sm font-medium">
              Error
            </span>
          )}
        </div>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none animate-fade-in">
        <MarkdownRenderer content={sanitized} />
      </div>

      {response.metadata?.summary && (
        <div className="mt-3 text-sm text-muted-foreground italic border-t pt-2">
          {response.metadata.summary}
        </div>
      )}

      {response.metadata?.model_used && (
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>Model: {response.metadata.model_used}</span>
          {response.metadata.token_count && (
            <span>Tokens: {response.metadata.token_count}</span>
          )}
          {response.metadata.confidence && (
            <span>Confidence: {response.metadata.confidence.toFixed(2)}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentResponseCard;
