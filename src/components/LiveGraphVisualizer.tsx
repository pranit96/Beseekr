import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Code2,
  Database,
  Search,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import socketService from "@/services/socketService";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Advanced DAG visualization for Agent thought processes.
 */
interface ToolCall {
  call_id: string;
  name: string;
  status: "running" | "success" | "error";
  time_ms?: number;
}

export interface GraphAgent {
  id: string;
  name: string;
  role: string;
  status: "pending" | "running" | "done" | "error";
  tools: ToolCall[]; // We inject this manually in the parent by keeping state
  output?: string;
  domain?: string;
}

interface LiveGraphVisualizerProps {
  workflowPhase: string;
  agents: GraphAgent[];
  isSynthesizing: boolean;
  redTeamCritique?: string;
}

const AGENT_ICONS: Record<string, React.ElementType> = {
  Search,
  Code2,
  Database,
  FileText,
};

export const LiveGraphVisualizer: React.FC<LiveGraphVisualizerProps> = ({
  workflowPhase,
  agents,
  isSynthesizing,
  redTeamCritique,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [orchestratorAgents, setOrchestratorAgents] = useState<GraphAgent[]>(
    [],
  );

  useEffect(() => {
    const handleTaskStarted = (data: any) => {
      setOrchestratorAgents((prev) => {
        const id = data.task_id || data.id || "unknown";
        const name = typeof id === "string" ? id.replace(/_/g, " ") : "Task";
        const existing = prev.find((t) => t.id === id);
        if (existing) {
          return prev.map((t) =>
            t.id === id ? { ...t, status: "running" } : t,
          );
        }
        return [
          ...prev,
          {
            id,
            name,
            role: "Task Orchestrator",
            status: "running",
            tools: [],
            domain: "Brain",
          },
        ];
      });
    };

    const handleTaskCompleted = (data: any) => {
      setOrchestratorAgents((prev) =>
        prev.map((t) =>
          t.id === (data.task_id || data.id)
            ? { ...t, status: "done", output: `Duration: ${data.duration}ms` }
            : t,
        ),
      );
    };

    const handleTaskFailed = (data: any) => {
      setOrchestratorAgents((prev) =>
        prev.map((t) =>
          t.id === (data.task_id || data.id)
            ? { ...t, status: "error", output: String(data.error) }
            : t,
        ),
      );
    };

    socketService.on("orchestrator:task_started", handleTaskStarted);
    socketService.on("orchestrator:task_completed", handleTaskCompleted);
    socketService.on("orchestrator:task_failed", handleTaskFailed);

    return () => {
      socketService.off("orchestrator:task_started", handleTaskStarted);
      socketService.off("orchestrator:task_completed", handleTaskCompleted);
      socketService.off("orchestrator:task_failed", handleTaskFailed);
    };
  }, []);

  const allAgents = [...agents, ...orchestratorAgents];

  // Auto-scroll to bottom of graph to follow execution
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [allAgents, isSynthesizing]);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-[500px] overflow-x-auto bg-background/50 rounded-2xl border border-border/50 p-6 smooth-scroll"
      style={{
        background:
          "radial-gradient(ellipse at 50% -20%, hsl(var(--primary)/0.03), transparent 70%)",
      }}
    >
      {/* Root Node Wrapper for Safe Horizontal Scrolling */}
      <div className="flex flex-col items-center justify-start min-w-max mx-auto px-12 pb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/40 border border-primary/20 shadow-[0_0_20px_rgba(var(--primary-glow),0.1)] backdrop-blur">
            <Brain className="w-6 h-6 text-primary mb-2 animate-pulse" />
            <span className="text-sm font-semibold tracking-wide uppercase text-foreground/80">
              Swarm Orchestrator
            </span>
            <span className="text-xs text-muted-foreground mt-1 capitalize">
              {workflowPhase.replace("_", " ")}
            </span>
          </div>
        </motion.div>

        {/* Path down from root */}
        {allAgents.length > 0 && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 40 }}
            className="w-px bg-gradient-to-b from-primary/30 to-border"
          />
        )}

        {/* Agents Row (Parallel or Sequential) */}
        <div className="relative flex flex-row items-start justify-center gap-6 mt-0 pt-4">
          {/* Connector horizontal line for parallel agents */}
          {allAgents.length > 1 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              className="absolute top-0 bg-border h-px"
              style={{
                left: `calc(50% / ${allAgents.length})`,
                width: `calc(100% - 100% / ${allAgents.length})`,
              }}
            />
          )}

          <AnimatePresence>
            {allAgents.map((agent, index) => {
              const Icon = AGENT_ICONS[agent.domain || ""] || Brain;
              const isRunning = agent.status === "running";
              const isDone = agent.status === "done";
              const isError = agent.status === "error";

              return (
                <motion.div
                  key={agent.id || index}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center relative z-10 w-[180px] flex-shrink-0"
                >
                  {/* Drop down line from horizontal connector */}
                  {allAgents.length > 1 && (
                    <div className="absolute -top-4 w-px h-4 bg-border" />
                  )}

                  {/* Agent Node */}
                  <div
                    className={cn(
                      "relative flex flex-col items-center justify-center p-4 rounded-xl border border-border/80 bg-background shadow-lg transition-all",
                      isRunning &&
                        "border-primary shadow-[0_0_20px_rgba(var(--primary),0.2)]",
                      isDone && "border-emerald-500/50",
                      isError && "border-rose-500/50",
                    )}
                  >
                    {isRunning && (
                      <motion.div
                        className="absolute -inset-1 rounded-xl bg-primary/20 blur-md -z-10"
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}

                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted mb-3">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : isError ? (
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                      ) : isRunning ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      ) : (
                        <Icon className="w-5 h-5 text-foreground/50" />
                      )}
                    </div>

                    <span className="text-sm font-semibold text-center mb-1 line-clamp-1">
                      {agent.name}
                    </span>
                    <span className="text-[10px] uppercase text-muted-foreground font-medium">
                      {agent.role}
                    </span>
                  </div>

                  {/* Tool Invocations for this agent */}
                  {agent.tools && agent.tools.length > 0 && (
                    <div className="flex flex-col items-center w-full mt-4 space-y-3 relative z-0">
                      {/* Line feeding into tools */}
                      <div className="absolute -top-4 h-full w-px bg-border/60 -z-10" />

                      <AnimatePresence>
                        {agent.tools.map((tool) => (
                          <motion.div
                            key={tool.call_id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-muted/30 border border-border/50 rounded-lg p-2.5 flex items-center gap-3 w-full max-w-[200px] shadow-sm backdrop-blur-sm"
                          >
                            <div className="bg-background rounded p-1.5 shadow-sm">
                              {tool.status === "running" ? (
                                <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
                              ) : tool.status === "success" ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                              )}
                            </div>
                            <div className="flex flex-col flex-1 overflow-hidden">
                              <span className="text-xs font-medium truncate">
                                {tool.name}
                              </span>
                              {tool.time_ms && (
                                <span className="text-[9px] text-muted-foreground">
                                  {tool.time_ms}ms
                                </span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Agent Output Terminal */}
                  {agent.output && (
                    <motion.div className="mt-6 p-3 rounded-lg bg-background/80 border border-white/10 w-full max-w-[280px] text-white/80 overflow-hidden relative shadow-inner">
                      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[9px] font-mono tracking-widest uppercase text-white/50">
                          stdout
                        </span>
                      </div>
                      <div className="text-[11px] leading-relaxed max-h-[140px] overflow-y-auto custom-scrollbar pr-2 prose prose-invert prose-p:my-1 prose-headings:my-2 prose-headings:text-white prose-strong:text-white prose-ul:my-1 prose-ul:pl-4 prose-li:my-0">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {agent.output}
                        </ReactMarkdown>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Red Team Node */}
        {allAgents.length > 0 &&
          (redTeamCritique || workflowPhase === "red_team") && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center mt-12 w-full max-w-lg"
            >
              <div className="h-12 w-px bg-gradient-to-b from-border to-rose-500/50" />
              <div className="p-4 bg-background/80 backdrop-blur-sm border border-rose-500/30 rounded-xl shadow-[0_0_30px_rgba(243,63,94,0.05)] w-full text-center flex flex-col items-center overflow-hidden">
                <div className="flex items-center gap-2 mb-3 text-rose-500">
                  {workflowPhase === "red_team" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  <span className="text-sm font-bold tracking-wider uppercase">
                    Adversarial Red-Team
                  </span>
                </div>
                <div className="text-left w-full text-[11px] leading-relaxed max-h-[140px] overflow-y-auto custom-scrollbar pr-2 prose prose-invert prose-p:my-1 text-muted-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {redTeamCritique || "Initializing critique engine..."}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          )}

        {/* Synthesizing Node at Bottom */}
        {allAgents.length > 0 && isSynthesizing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center mt-12 w-full max-w-sm"
          >
            <div className="h-12 w-px bg-gradient-to-b from-border to-amber-500/50" />
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.1)] w-full text-center flex flex-col items-center">
              <Loader2 className="w-6 h-6 text-amber-500 animate-spin mb-3" />
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                Synthesizing Final Output
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                Merging agent knowledge...
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
