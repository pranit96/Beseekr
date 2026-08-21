import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, AlertCircle, Loader2, Clock, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MermaidDiagram } from "@/components/ui/MermaidDiagram";

interface LearnTabProps {
  content: string | null;
  isLoading: boolean;
  onGenerate: () => void;
  jobStatus?: string | null;
  elapsedSeconds?: number;
}

export function LearnTab({
  content,
  isLoading,
  onGenerate,
  jobStatus,
  elapsedSeconds = 0,
}: LearnTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        {/* Active Generation Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-card/20 border border-teal-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-teal-500/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
            </div>
            <div>
              <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>AI Study Guide Generation in Progress</span>
                {elapsedSeconds > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">
                    <Clock className="w-3 h-3" /> {elapsedSeconds}s
                  </span>
                )}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                {jobStatus === "pending"
                  ? "Queued in priority worker queue · Synthesizing topic outline..."
                  : jobStatus === "processing"
                    ? "Writing in-depth study summary, key concepts, and actionable insights..."
                    : "Structuring lessons, syntax highlights, and architecture diagrams..."}
              </p>
            </div>
          </div>

          <Button disabled className="bg-teal-500/30 text-teal-300 border border-teal-500/40 cursor-not-allowed shrink-0">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Generating...
          </Button>
        </div>

        {/* Skeleton Preview */}
        <div className="space-y-4 pt-2">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="pt-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-full mt-4" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
        <div className="w-16 h-16 bg-teal-500/10 text-teal-500 rounded-full flex items-center justify-center mb-6">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold mb-2">No study materials yet</h3>
        <p className="text-muted-foreground mb-8 max-w-md">
          Generate a comprehensive AI study guide for this topic, including
          summaries, key concepts, and actionable insights.
        </p>
        <Button
          onClick={onGenerate}
          disabled={isLoading}
          size="lg"
          className="bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/20"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Queuing Generation...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Study Guide
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-card/5 rounded-3xl border border-border/30">
      <div className="prose prose-invert prose-teal max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ node, ...props }) => (
              <h1
                className="text-3xl font-bold text-teal-400 border-b border-border/50 pb-2 mb-6"
                {...props}
              />
            ),
            h2: ({ node, ...props }) => (
              <h2
                className="text-2xl font-bold text-foreground mt-8 mb-4"
                {...props}
              />
            ),
            h3: ({ node, ...props }) => (
              <h3
                className="text-xl font-bold text-foreground/90 mt-6 mb-3"
                {...props}
              />
            ),
            strong: ({ node, ...props }) => (
              <strong className="font-bold text-teal-300" {...props} />
            ),
            a: ({ node, ...props }) => (
              <a
                className="text-teal-400 hover:text-teal-300 underline underline-offset-4"
                {...props}
              />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-4 border-teal-500 pl-4 italic text-muted-foreground bg-teal-500/5 py-1 pr-4 rounded-r-lg my-4"
                {...props}
              />
            ),
            code: ({ node, inline, className, children, ...props }: any) => {
              const codeContent = String(children || "").replace(/\n$/, "");
              const match = /language-(\w+)/.exec(className || "");
              const language = match ? match[1] : "";
              const isMermaid =
                language === "mermaid" ||
                className?.includes("mermaid") ||
                /^(flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph|journey|graph\s+(TD|TB|BT|RL|LR))/im.test(
                  codeContent.trim(),
                );

              if (!inline && isMermaid) {
                return <MermaidDiagram chart={codeContent} />;
              }

              return inline ? (
                <code
                  className="bg-muted px-1.5 py-0.5 rounded text-sm text-teal-200 font-mono"
                  {...props}
                >
                  {children}
                </code>
              ) : (
                <pre className="bg-muted/50 p-4 rounded-xl border border-border/50 overflow-x-auto my-4 custom-scrollbar">
                  <code className={className || "text-sm font-mono"} {...props}>
                    {children}
                  </code>
                </pre>
              );
            },
            ul: ({ node, ...props }) => (
              <ul
                className="list-disc pl-6 space-y-2 my-4 marker:text-teal-500"
                {...props}
              />
            ),
            ol: ({ node, ...props }) => (
              <ol
                className="list-decimal pl-6 space-y-2 my-4 marker:text-teal-500"
                {...props}
              />
            ),
            li: ({ node, ...props }) => (
              <li className="text-foreground/90 leading-relaxed" {...props} />
            ),
            p: ({ node, ...props }) => (
              <p
                className="text-foreground/90 leading-relaxed my-4"
                {...props}
              />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
