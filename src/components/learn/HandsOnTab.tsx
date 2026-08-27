import React, { useState } from "react";
import { HandsOnExercise } from "@/types/education";
import { Button } from "@/components/ui/button";
import {
  Code2,
  Terminal,
  HelpCircle,
  Eye,
  Sparkles,
  Lightbulb,
  Loader2,
  Clock,
  Moon,
  Crown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidDiagram } from "@/components/ui/MermaidDiagram";

interface HandsOnTabProps {
  exercises: HandsOnExercise[] | null;
  isLoading: boolean;
  onGenerate: () => void;
  jobStatus?: string | null;
  elapsedSeconds?: number;
  isQueuedForOffPeak?: boolean;
  onUpgradeClick?: () => void;
}

export function HandsOnTab({
  exercises,
  isLoading,
  onGenerate,
  jobStatus,
  elapsedSeconds = 0,
  isQueuedForOffPeak = false,
  onUpgradeClick,
}: HandsOnTabProps) {
  const [activeSolution, setActiveSolution] = useState<string | null>(null);
  const [visibleHints, setVisibleHints] = useState<Record<string, number>>({});

  // Off-Peak Scheduled Queue State for Free Tier
  if (isQueuedForOffPeak && (!exercises || exercises.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 text-center min-h-[420px]">
        <div className="p-8 max-w-xl w-full rounded-3xl bg-gradient-to-b from-teal-500/10 via-card/40 to-card/20 border border-teal-500/30 shadow-2xl backdrop-blur-sm space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto border border-teal-500/30 shadow-lg shadow-teal-500/10">
            <Moon className="w-8 h-8 text-teal-300" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-xs font-semibold text-teal-300">
              <Clock className="w-3.5 h-3.5" />
              Off-Peak Batch Queued
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground">
              Queued for Off-Peak Generation at 4:00 AM IST
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your interactive coding exercises, debugging scenarios, and architecture challenges are scheduled in our nightly batch. They will be ready tomorrow morning!
            </p>
          </div>

          <div className="pt-2 border-t border-border/40 space-y-3">
            <p className="text-xs text-amber-400/90 font-medium">
              Want instant code challenges right now with Claude Sonnet?
            </p>
            <Button
              onClick={onUpgradeClick}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/20 h-11 rounded-xl gap-2"
            >
              <Crown className="w-4 h-4 text-amber-200" />
              Upgrade to Ultra for Instant Generation
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        {/* Active Generation Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-500/10 via-amber-500/10 to-card/20 border border-teal-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-teal-500/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
            </div>
            <div>
              <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Building Exercises & Code Challenges</span>
                {elapsedSeconds > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">
                    <Clock className="w-3 h-3" /> {elapsedSeconds}s
                  </span>
                )}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                {jobStatus === "pending"
                  ? "Queued in priority worker queue · Designing problem statements..."
                  : jobStatus === "processing"
                    ? "Generating code starter templates, debugging scenarios, and architecture tasks..."
                    : "Finalizing solution blueprints, hints, and test cases..."}
              </p>
            </div>
          </div>

          <Button disabled className="bg-teal-500/30 text-teal-300 border border-teal-500/40 cursor-not-allowed shrink-0">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Building...
          </Button>
        </div>

        {/* Skeleton Preview */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-border/50 p-6 rounded-3xl">
            <Skeleton className="h-6 w-1/3 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-6" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (!exercises || exercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
        <div className="w-16 h-16 bg-teal-500/10 text-teal-500 rounded-full flex items-center justify-center mb-6">
          <Terminal className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold mb-2">No Exercises Generated</h3>
        <p className="text-muted-foreground mb-8 max-w-md">
          Generate interactive code challenges, distributed architecture design
          problems, and debugging tasks.
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
              Queuing Exercises...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Hands-On Tasks
            </>
          )}
        </Button>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "code_sandbox":
        return <Code2 className="w-5 h-5 text-teal-400" />;
      case "debugging":
        return <Terminal className="w-5 h-5 text-amber-400" />;
      case "architecture_design":
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
      default:
        return <Code2 className="w-5 h-5 text-teal-400" />;
    }
  };

  const toggleHint = (exId: string, maxHints: number) => {
    setVisibleHints((prev) => {
      const current = prev[exId] || 0;
      return {
        ...prev,
        [exId]: current < maxHints ? current + 1 : current,
      };
    });
  };

  return (
    <div className="space-y-8">
      {exercises.map((ex, idx) => (
        <div
          key={ex.title || idx}
          className="bg-card/5 border border-border/30 rounded-3xl overflow-hidden backdrop-blur-xl"
        >
          {/* Exercise Header */}
          <div className="p-6 border-b border-border/30 flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 rounded-lg bg-card/20 border border-border/40">
                  {getIcon(ex.type)}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {ex.type.replace("_", " ")} • {ex.difficulty} • ~
                  {ex.estimated_minutes}m
                </span>
              </div>
              <h3 className="text-xl font-bold">{ex.title}</h3>
            </div>
            <div className="text-4xl font-bold text-muted/20">{idx + 1}</div>
          </div>

          {/* Description */}
          <div className="p-6 prose prose-invert prose-teal max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({
                  node,
                  inline,
                  className,
                  children,
                  ...props
                }: any) => {
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
                      <code
                        className={className || "text-sm font-mono"}
                        {...props}
                      >
                        {children}
                      </code>
                    </pre>
                  );
                },
              }}
            >
              {ex.description
                ? ex.description
                    .replace(/\\r\\n/g, "\n")
                    .replace(/\\n/g, "\n")
                    .replace(/\\t/g, "  ")
                : ""}
            </ReactMarkdown>
          </div>

          {/* Starter Code */}
          {ex.starter_code && (
            <div className="px-6 pb-6">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4" /> Starter Code
              </h4>
              <div className="bg-[#1e1e1e] rounded-xl p-4 overflow-x-auto text-sm font-mono custom-scrollbar text-[#d4d4d4]">
                <pre>{ex.starter_code}</pre>
              </div>
            </div>
          )}

          {/* Action Bar (Hints / Solution) */}
          <div className="px-6 py-4 bg-muted/20 border-t border-border/30 flex justify-between items-center flex-wrap gap-4">
            <div className="space-y-2 flex-1">
              {ex.hints && ex.hints.length > 0 && (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: visibleHints[ex.title] || 0 }).map(
                    (_, i) => (
                      <div
                        key={i}
                        className="flex gap-2 text-sm text-amber-500/90 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20"
                      >
                        <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>{ex.hints[i]}</p>
                      </div>
                    ),
                  )}

                  {(visibleHints[ex.title] || 0) < ex.hints.length && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleHint(ex.title, ex.hints.length)}
                      className="w-fit border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Show Hint {(visibleHints[ex.title] || 0) + 1} of{" "}
                      {ex.hints.length}
                    </Button>
                  )}
                </div>
              )}
            </div>

            <Button
              variant="default"
              onClick={() =>
                setActiveSolution(activeSolution === ex.title ? null : ex.title)
              }
              className={
                activeSolution === ex.title
                  ? "bg-muted text-foreground hover:bg-muted/80"
                  : "bg-teal-500 text-white hover:bg-teal-600"
              }
            >
              <Eye className="w-4 h-4 mr-2" />
              {activeSolution === ex.title ? "Hide Solution" : "View Solution"}
            </Button>
          </div>

          {/* Solution Area */}
          {activeSolution === ex.title && (
            <div className="p-6 bg-teal-500/[0.02] border-t border-teal-500/20">
              <h4 className="text-teal-500 font-semibold mb-4">Solution</h4>
              <div className="bg-[#1e1e1e] rounded-xl p-4 overflow-x-auto text-sm font-mono custom-scrollbar text-[#d4d4d4] mb-6 border border-teal-500/20">
                <pre>{ex.solution}</pre>
              </div>

              {ex.key_learning && (
                <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4">
                  <h5 className="font-bold text-teal-400 mb-1 text-sm uppercase tracking-wider">
                    Key Takeaway
                  </h5>
                  <p className="text-sm text-foreground/90">
                    {ex.key_learning}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
