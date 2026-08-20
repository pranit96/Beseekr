import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LearnTabProps {
  content: string | null;
  isLoading: boolean;
  onGenerate: () => void;
}

export function LearnTab({ content, isLoading, onGenerate }: LearnTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="pt-6">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-4 w-full mt-4" />
          <Skeleton className="h-4 w-4/5" />
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
          Generate a comprehensive AI study guide for this topic, including summaries, key concepts, and actionable insights.
        </p>
        <Button 
          onClick={onGenerate}
          size="lg" 
          className="bg-teal-500 hover:bg-teal-600 text-white"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Generate Study Guide
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
            h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-teal-400 border-b border-border/50 pb-2 mb-6" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-foreground mt-8 mb-4" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-xl font-bold text-foreground/90 mt-6 mb-3" {...props} />,
            strong: ({node, ...props}) => <strong className="font-bold text-teal-300" {...props} />,
            a: ({node, ...props}) => <a className="text-teal-400 hover:text-teal-300 underline underline-offset-4" {...props} />,
            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-teal-500 pl-4 italic text-muted-foreground bg-teal-500/5 py-1 pr-4 rounded-r-lg my-4" {...props} />,
            code: ({node, inline, ...props}: any) => 
              inline ? (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm text-teal-200 font-mono" {...props} />
              ) : (
                <pre className="bg-muted/50 p-4 rounded-xl border border-border/50 overflow-x-auto my-4 custom-scrollbar">
                  <code className="text-sm font-mono" {...props} />
                </pre>
              ),
            ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-2 my-4 marker:text-teal-500" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal pl-6 space-y-2 my-4 marker:text-teal-500" {...props} />,
            li: ({node, ...props}) => <li className="text-foreground/90 leading-relaxed" {...props} />,
            p: ({node, ...props}) => <p className="text-foreground/90 leading-relaxed my-4" {...props} />,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
