// src/components/WorkflowModeOverlay.tsx
// Full-screen immersive workflow mode with animations - matches app design system

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Zap,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useAutonomousWorkflow from "@/hooks/use-autonomous-workflow";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface Agent {
  id: string;
  name: string;
  role: string;
  domain: string;
  tools: string[];
  status: "pending" | "running" | "done" | "error";
  output: string;
  reasoning?: string;
}

interface ToolExecution {
  agent_id: string;
  tool_name: string;
  call_id: string;
  status: "running" | "success" | "error";
}

interface WorkflowModeOverlayProps {
  prompt: string;
  onClose: (finalAnswer?: string) => void;
}

export const WorkflowModeOverlay: React.FC<WorkflowModeOverlayProps> = ({
  prompt,
  onClose,
}) => {
  const [status, setStatus] = useState<string>("Initializing...");
  const [executionPlan, setExecutionPlan] = useState<string>("");
  const [expectedOutcome, setExpectedOutcome] = useState<string>("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [toolExecutions, setToolExecutions] = useState<ToolExecution[]>([]);
  const [finalAnswer, setFinalAnswer] = useState<string>("");
  const [synthesisOutput, setSynthesisOutput] = useState<string>("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);

  const { toast } = useToast();
  const { execute } = useAutonomousWorkflow();

  useEffect(() => {
    if (!prompt) return;

    const requestId = `wf_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    execute(
      {
        prompt,
        requestId,
        save_to_history: false,
      },
      {
        onAck: () => setStatus("Acknowledged"),
        onStatus: (data) => setStatus(data.message || data.status),
        onPlan: (data) => {
          setExecutionPlan(data.plan);
          setExpectedOutcome(data.expected_outcome || "");
          const agentList: Agent[] = data.agents.map((a: any) => ({
            id: "",
            name: a.name,
            role: a.role,
            domain: a.domain,
            tools: a.tools || [],
            status: "pending",
            output: "",
            reasoning: a.reasoning,
          }));
          setAgents(agentList);
        },
        onAgentCreated: (data) => {
          setAgents((prev) =>
            prev.map((a) =>
              a.name === data.agent.name ? { ...a, id: data.agent.id } : a,
            ),
          );
        },
        onAgentStart: (data) => {
          setAgents((prev) =>
            prev.map((a) =>
              a.id === data.agent_id ? { ...a, status: "running" } : a,
            ),
          );
          setStatus(
            `Running ${data.agent_name}... (${data.step}/${data.total})`,
          );
        },
        onAgentToken: (data) => {
          setAgents((prev) =>
            prev.map((a) =>
              a.id === data.agent_id
                ? { ...a, output: a.output + data.token }
                : a,
            ),
          );
        },
        onAgentDone: (data) => {
          setAgents((prev) =>
            prev.map((a) =>
              a.id === data.agent_id ? { ...a, status: "done" } : a,
            ),
          );
        },
        onToolStart: (data) => {
          setToolExecutions((prev) => [
            ...prev,
            {
              agent_id: data.agent_id,
              tool_name: data.tool_name,
              call_id: data.call_id,
              status: "running",
            },
          ]);
        },
        onToolResult: (data) => {
          setToolExecutions((prev) =>
            prev.map((t) =>
              t.call_id === data.call_id
                ? { ...t, status: data.success ? "success" : "error" }
                : t,
            ),
          );
        },
        onSynthesisToken: (data) => {
          setIsSynthesizing(true);
          setSynthesisOutput((prev) => prev + data.token);
        },
        onDone: (data) => {
          setFinalAnswer(data.final_answer);
          setStatus("Complete!");
          setIsComplete(true);
          setIsSynthesizing(false);
        },
        onError: (data) => {
          toast({
            title: "Workflow failed",
            description: data.error,
            variant: "destructive",
          });
          setStatus("Failed");
          setHasError(true);
        },
      },
    );
  }, [prompt, execute, toast]);

  const handleClose = () => {
    onClose(finalAnswer || undefined);
  };

  const getAgentColor = (index: number) => {
    const colors = [
      "from-violet-500 to-purple-600",
      "from-cyan-500 to-blue-500",
      "from-amber-500 to-orange-500",
      "from-green-500 to-emerald-500",
      "from-pink-500 to-rose-500",
      "from-indigo-500 to-violet-500",
    ];
    return colors[index % colors.length];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />;
      case "done":
        return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
      case "error":
        return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
      default:
        return (
          <div className="w-3.5 h-3.5 rounded-full border-2 border-muted animate-pulse" />
        );
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 bg-background/98 backdrop-blur-2xl"
      >
        {/* Ambient background blobs */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 overflow-hidden"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-primary/10 blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-accent/10 blur-3xl"
          />
        </div>

        {/* Close button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-xl h-9 w-9 sm:h-10 sm:w-10 bg-background/50 hover:bg-background/80 border border-border/50 shadow-lg"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Content */}
        <div className="h-full overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
          <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-3 sm:space-y-4"
            >
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 3, -3, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg"
              >
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent px-4">
                Autonomous Workflow
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto px-4 leading-relaxed">
                {prompt}
              </p>
            </motion.div>

            {/* Status */}
            {status && !isComplete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground"
              >
                {!hasError && (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-primary" />
                )}
                <span>{status}</span>
              </motion.div>
            )}

            {/* Execution Plan */}
            {executionPlan && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-primary/5 border border-primary/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 backdrop-blur-sm"
              >
                <h3 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-foreground">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Execution Plan
                </h3>
                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                  {executionPlan}
                </p>
                {expectedOutcome && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-primary/10">
                    <p className="text-[10px] sm:text-xs text-foreground/70 leading-relaxed">
                      <span className="font-semibold text-primary">
                        Expected outcome:
                      </span>{" "}
                      {expectedOutcome}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Agents Grid */}
            {agents.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
              >
                {agents.map((agent, index) => (
                  <motion.div
                    key={agent.id || index}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      delay: 0.4 + index * 0.08,
                      type: "spring",
                      bounce: 0.3,
                    }}
                    className={cn(
                      "relative border rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-500 bg-background/50 backdrop-blur-sm",
                      agent.status === "running" &&
                        "border-primary shadow-lg shadow-primary/10 scale-[1.02]",
                      agent.status === "done" &&
                        "border-green-500/50 shadow-md",
                      agent.status === "pending" && "border-border/50",
                      agent.status === "error" && "border-destructive/50",
                    )}
                  >
                    {/* Agent Header */}
                    <div className="flex items-start gap-2 sm:gap-3 mb-3">
                      <motion.div
                        animate={
                          agent.status === "running"
                            ? {
                                scale: [1, 1.08, 1],
                              }
                            : {}
                        }
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className={cn(
                          "w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md",
                          `bg-gradient-to-br ${getAgentColor(index)}`,
                        )}
                      >
                        {index + 1}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                          <h4 className="font-semibold text-xs sm:text-sm truncate text-foreground">
                            {agent.name}
                          </h4>
                          {getStatusIcon(agent.status)}
                        </div>
                        <p className="text-[10px] sm:text-xs text-foreground/70 line-clamp-2 leading-relaxed">
                          {agent.role}
                        </p>
                        <div className="flex items-center gap-1 mt-1 sm:mt-1.5">
                          <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            {agent.domain}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reasoning */}
                    {agent.reasoning && (
                      <div className="mb-2 sm:mb-3 p-2 sm:p-2.5 bg-muted/30 rounded-lg border-l-2 border-primary/30">
                        <p className="text-[10px] sm:text-xs text-foreground/70 italic leading-relaxed">
                          "{agent.reasoning}"
                        </p>
                      </div>
                    )}

                    {/* Tools */}
                    {agent.tools.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
                        {agent.tools.slice(0, 3).map((tool) => (
                          <span
                            key={tool}
                            className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-primary/10 text-primary flex items-center gap-0.5 sm:gap-1"
                          >
                            <Wrench className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                            {tool.replace(/_/g, " ")}
                          </span>
                        ))}
                        {agent.tools.length > 3 && (
                          <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            +{agent.tools.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Output */}
                    {agent.output && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.3 }}
                        className="bg-muted/40 border border-border/30 rounded-lg p-2 sm:p-3 text-[10px] sm:text-xs max-h-32 sm:max-h-40 overflow-y-auto"
                      >
                        <ReactMarkdown className="prose prose-xs max-w-none dark:prose-invert [&>*]:text-[10px] sm:[&>*]:text-xs [&>*]:leading-relaxed [&>*]:text-foreground/80">
                          {agent.output}
                        </ReactMarkdown>
                      </motion.div>
                    )}

                    {/* Tool Executions */}
                    {toolExecutions.filter((t) => t.agent_id === agent.id)
                      .length > 0 && (
                      <div className="mt-2 p-2 bg-muted/20 rounded-lg border border-border/20 space-y-0.5 sm:space-y-1">
                        {toolExecutions
                          .filter((t) => t.agent_id === agent.id)
                          .map((tool) => (
                            <motion.div
                              key={tool.call_id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="text-[9px] sm:text-[10px] flex items-center gap-1.5 text-foreground/70"
                            >
                              {tool.status === "running" && (
                                <Loader2 className="w-2 h-2 sm:w-2.5 sm:h-2.5 animate-spin text-primary" />
                              )}
                              {tool.status === "success" && (
                                <CheckCircle2 className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-green-500" />
                              )}
                              {tool.status === "error" && (
                                <AlertCircle className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-destructive" />
                              )}
                              <span className="truncate font-medium">
                                {tool.tool_name.replace(/_/g, " ")}
                              </span>
                            </motion.div>
                          ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Synthesis Phase */}
            {isSynthesizing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-primary/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 bg-primary/5 backdrop-blur-sm"
              >
                <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-foreground">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </motion.div>
                  Synthesizing Final Answer...
                </h3>
                <div className="prose prose-xs sm:prose-sm max-w-none dark:prose-invert [&>*]:text-xs sm:[&>*]:text-sm [&>*]:text-foreground/80">
                  <ReactMarkdown>{synthesisOutput}</ReactMarkdown>
                </div>
              </motion.div>
            )}

            {/* Final Answer */}
            {finalAnswer && isComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
                className="border border-green-500/30 rounded-xl sm:rounded-2xl p-5 sm:p-6 bg-green-500/5"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                  className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                    Workflow Complete!
                  </h3>
                </motion.div>
                <div className="prose prose-xs sm:prose-sm max-w-none dark:prose-invert mb-5 sm:mb-6 [&>*]:text-xs sm:[&>*]:text-sm [&>*]:text-foreground/90">
                  <ReactMarkdown>{finalAnswer}</ReactMarkdown>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleClose}
                      size="lg"
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 rounded-xl shadow-lg gap-2 text-sm sm:text-base"
                    >
                      Return to Chat
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
