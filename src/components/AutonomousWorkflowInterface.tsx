// src/components/AutonomousWorkflowInterface.tsx
// Futuristic orbital workflow UI — single Phase state, proper cancel support

import React, { useState, useRef } from "react";
import {
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Copy,
  Check,
  Zap,
  Brain,
  Search,
  FileText,
  Code2,
  Database,
  Square,
} from "lucide-react";
import { motion, AnimatePresence, useAnimationFrame } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ChatFileUpload } from "@/components/ChatFileUpload";
import { LiveGraphVisualizer, GraphAgent } from "./LiveGraphVisualizer";
import useAutonomousWorkflow from "@/hooks/use-autonomous-workflow";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Agent extends GraphAgent {
  reasoning?: string;
}

/**
 * Single source of truth for which screen is shown.
 * One enum = AnimatePresence always has exactly one keyed child.
 * No intermediate frame where two conditions are simultaneously true.
 */
type Phase = "prompt" | "executing" | "cancelling" | "complete" | "error";

interface AutonomousWorkflowInterfaceProps {
  onClose?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AGENT_ICONS = [Brain, Search, Code2, Database, FileText, Zap];

const AGENT_PALETTES = [
  { from: "#6366f1", to: "#8b5cf6", glow: "rgba(99,102,241,0.6)" },
  { from: "#06b6d4", to: "#0ea5e9", glow: "rgba(6,182,212,0.6)" },
  { from: "#f59e0b", to: "#ef4444", glow: "rgba(245,158,11,0.6)" },
  { from: "#10b981", to: "#059669", glow: "rgba(16,185,129,0.6)" },
  { from: "#ec4899", to: "#f43f5e", glow: "rgba(236,72,153,0.6)" },
  { from: "#8b5cf6", to: "#6366f1", glow: "rgba(139,92,246,0.6)" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const ParticleField: React.FC = () => {
  const particles = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    dur: Math.random() * 6 + 4,
    delay: Math.random() * 4,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0.5, 1, 0.5],
            y: [0, -30, 0],
          }}
          transition={{
            duration: p.dur,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

interface AgentNodeProps {
  agent: Agent;
  index: number;
  total: number;
  orbitRadius: number;
  orbitAngleOffset: number;
  dimmed?: boolean;
}

const AgentNode: React.FC<AgentNodeProps> = ({
  agent,
  index,
  total,
  orbitRadius,
  orbitAngleOffset,
  dimmed = false,
}) => {
  const baseAngle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const angle = baseAngle + orbitAngleOffset;
  const x = Math.cos(angle) * orbitRadius;
  const y = Math.sin(angle) * orbitRadius;
  const palette = AGENT_PALETTES[index % AGENT_PALETTES.length];
  const Icon = AGENT_ICONS[index % AGENT_ICONS.length];
  const isRunning = agent.status === "running";
  const isDone = agent.status === "done";
  const isError = agent.status === "error";

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: dimmed ? 0.35 : 1 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
      className="absolute"
      style={{
        left: "50%",
        top: "50%",
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
        zIndex: isRunning ? 10 : 5,
      }}
    >
      {/* Glow pulse when running */}
      {isRunning && !dimmed && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: palette.glow, filter: "blur(12px)", zIndex: -1 }}
          animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      )}

      {/* Connector line to center */}
      <svg
        className="absolute pointer-events-none"
        style={{
          left: "50%",
          top: "50%",
          width: orbitRadius,
          height: 2,
          transform: `rotate(${angle * (180 / Math.PI)}deg)`,
          transformOrigin: "0 50%",
          opacity: isRunning && !dimmed ? 0.5 : 0.1,
        }}
      >
        <line
          x1="0"
          y1="1"
          x2={orbitRadius}
          y2="1"
          stroke={palette.from}
          strokeWidth="1"
          strokeDasharray="4 6"
        />
      </svg>

      {/* Node circle */}
      <motion.div
        animate={isRunning && !dimmed ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
        className="relative flex items-center justify-center rounded-full text-white shadow-xl"
        style={{
          width: 56,
          height: 56,
          background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
          boxShadow:
            isRunning && !dimmed
              ? `0 0 24px ${palette.glow}`
              : `0 4px 16px ${palette.glow}40`,
        }}
      >
        {isDone && <CheckCircle2 className="w-6 h-6" />}
        {isError && <AlertCircle className="w-6 h-6" />}
        {isRunning && <Loader2 className="w-6 h-6 animate-spin" />}
        {agent.status === "pending" && <Icon className="w-5 h-5 opacity-80" />}
      </motion.div>

      {/* Label — hidden to keep UI clean */}
      {false && (
        <div
          className="mt-2 text-center"
          style={{ width: 80, marginLeft: -12 }}
        >
          <p className="text-[10px] font-semibold leading-tight text-foreground/80 truncate">
            {agent.name}
          </p>
          <p
            className="text-[9px] leading-tight mt-0.5 font-medium"
            style={{
              color: isRunning
                ? palette.from
                : isDone
                  ? "#10b981"
                  : "var(--muted-foreground)",
            }}
          >
            {isRunning
              ? "Running"
              : isDone
                ? "Done"
                : isError
                  ? "Error"
                  : "Waiting"}
          </p>
        </div>
      )}
    </motion.div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export const AutonomousWorkflowInterface: React.FC<
  AutonomousWorkflowInterfaceProps
> = ({ onClose }) => {
  const [phase, setPhase] = useState<Phase>("prompt");
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<string>("Initializing…");
  const [executionPlan, setExecutionPlan] = useState<string>("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [finalAnswer, setFinalAnswer] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<
    Array<{
      id: string;
      name: string;
      type: string;
      size: number;
      size_readable: string;
      storage_path: string;
      url: string | null;
      extracted_content?: string | null;
    }>
  >([]);

  // ── Extended Workflow State ──
  const [workflowPhase, setWorkflowPhase] = useState<string>("queued");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisOutput, setSynthesisOutput] = useState("");

  /**
   * cancelRef holds the cancel fn provided by the workflow hook via onCancelReady.
   */
  const cancelRef = useRef<(() => void) | null>(null);

  // Slow orbit rotation, only ticks during executing phase
  const [orbitAngle, setOrbitAngle] = useState(0);
  useAnimationFrame((_, delta) => {
    if (phase === "executing") setOrbitAngle((a) => a + (delta / 1000) * 0.08);
  });

  const { toast } = useToast();
  const { execute } = useAutonomousWorkflow();

  // ── Helpers ──────────────────────────────────────────────────────────────

  const resetState = () => {
    setStatus("Initializing…");
    setExecutionPlan("");
    setAgents([]);
    setFinalAnswer("");
    setOrbitAngle(0);
    setAttachedFiles([]);
    setWorkflowPhase("queued");
    setIsSynthesizing(false);
    setSynthesisOutput("");
    cancelRef.current = null;
  };

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // ── Cancel ───────────────────────────────────────────────────────────────

  /**
   * Stop the in-flight workflow.
   * Moves to 'cancelling' immediately (freezes orbit, dims nodes, shows feedback),
   * then back to 'prompt' once server ACKs or after a safety timeout.
   */
  const handleCancel = () => {
    setPhase("cancelling");
    if (cancelRef.current) {
      try {
        cancelRef.current();
      } catch (_) {
        /* socket may already be closed */
      }
    }
    // Safety fallback: reset after 1.5 s even without a server ACK
    setTimeout(() => {
      resetState();
      setPhase("prompt");
    }, 1500);
  };

  /**
   * The X (dismiss) button.
   * During execution: cancels in-flight work, then closes the modal.
   * All other phases: closes immediately.
   */
  const handleDismiss = () => {
    if (phase === "executing" || phase === "cancelling") {
      if (cancelRef.current) {
        try {
          cancelRef.current();
        } catch (_) {
          /* ignore */
        }
      }
    }
    resetState();
    setPhase("prompt");
    onClose?.();
  };

  // ── Start ────────────────────────────────────────────────────────────────

  const handleStartWorkflow = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a prompt to start the workflow",
        variant: "destructive",
      });
      return;
    }

    const currentPrompt = prompt; // capture before resetState clears nothing (prompt kept)
    resetState();
    setPhase("executing");

    const requestId = `wf_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const filesPayload =
      attachedFiles.length > 0
        ? attachedFiles.map((f) => ({
            name: f.name,
            type: f.type,
            size: f.size,
            storage_path: f.storage_path,
            url: f.url,
            extracted_content: f.extracted_content || null,
          }))
        : undefined;

    execute(
      {
        prompt: currentPrompt,
        requestId,
        save_to_history: false,
        attached_files: filesPayload,
      },
      {
        // The hook calls this once the socket is wired up and cancellation is possible
        onCancelReady: (fn) => {
          cancelRef.current = fn;
        },

        onAck: () => {
          setStatus("Acknowledged — planning your workflow…");
          setWorkflowPhase("planning");
        },
        onStatus: (data) => {
          setStatus(data.message || data.status);
          if (data.status) setWorkflowPhase(data.status);
        },

        onPlan: (data) => {
          setExecutionPlan(data.plan);
          setAgents(
            data.agents.map((a: any) => ({
              id: "",
              name: a.name,
              role: a.role,
              domain: a.domain,
              tools: [], // We start empty, we'll populate it via ToolStart/Result events
              status: "pending",
              output: "",
              reasoning: a.reasoning,
            })),
          );
          setWorkflowPhase("agents_planned");
        },

        onAgentCreated: (data) => {
          setAgents((prev) =>
            prev.map((a) =>
              a.name === data.agent.name ? { ...a, id: data.agent.id } : a,
            ),
          );
          setWorkflowPhase("agents_created");
        },

        onAgentStart: (data) => {
          setAgents((prev) =>
            prev.map((a) =>
              a.id === data.agent_id ? { ...a, status: "running" } : a,
            ),
          );
          setStatus(`Running agent: ${data.agent_name}`);
          setWorkflowPhase("running");
        },

        onAgentToken: (data) =>
          setAgents((prev) =>
            prev.map((a) =>
              a.id === data.agent_id
                ? { ...a, output: a.output + data.token }
                : a,
            ),
          ),

        onAgentDone: (data) =>
          setAgents((prev) =>
            prev.map((a) =>
              a.id === data.agent_id ? { ...a, status: "done" } : a,
            ),
          ),

        onToolStart: (data) => {
          setAgents((prev) =>
            prev.map((a) => {
              if (a.id !== data.agent_id) return a;
              const newTools = [...a.tools, { call_id: data.call_id, name: data.tool_name, status: "running" as const }];
              return { ...a, tools: newTools };
            })
          );
        },

        onToolResult: (data) => {
          setAgents((prev) =>
            prev.map((a) => {
              if (a.id !== data.agent_id) return a;
              const newTools = a.tools.map(t => 
                t.call_id === data.call_id 
                  ? { ...t, status: (data.success ? "success" : "error") as const, time_ms: data.execution_time_ms }
                  : t
              );
              return { ...a, tools: newTools };
            })
          );
        },

        onSynthesisToken: (data) => {
          setStatus("Synthesizing final answer…");
          setWorkflowPhase("synthesizing");
          setIsSynthesizing(true);
          setSynthesisOutput((prev) => prev + (data.token || ""));
        },

        // Server confirmed cancellation — go straight to prompt without waiting for timeout
        onCancelled: () => {
          resetState();
          setPhase("prompt");
        },

        onDone: (data) => {
          setFinalAnswer(data.final_answer);
          cancelRef.current = null;
          setPhase("complete"); // single atomic phase change — no overlap possible
        },

        onError: (data) => {
          // Suppress errors that are just a side-effect of an intentional cancel
          if (phase === "cancelling") return;
          toast({
            title: "Workflow failed",
            description: data.error,
            variant: "destructive",
          });
          cancelRef.current = null;
          setPhase("error");
        },
      },
    );
  };

  // ── Derived ──────────────────────────────────────────────────────────────

  const ORBIT_RADIUS = agents.length > 4 ? 200 : 170;
  const runningAgent = agents.find((a) => a.status === "running");
  const isCancelling = phase === "cancelling";

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <AnimatePresence mode="wait">
        {/* ════════════════════════ PHASE: prompt ════════════════════════ */}
        {phase === "prompt" && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <ParticleField />

            <motion.div
              initial={{ scale: 0.92, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className="w-full max-w-xl relative z-10"
            >
              <div
                className="absolute -inset-8 rounded-3xl pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 60%, hsl(var(--primary)/0.12), transparent 70%)",
                }}
              />

              <div className="relative bg-background border border-border/60 rounded-2xl shadow-2xl p-7 sm:p-9">
                {/* Dismiss entire modal */}
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-20"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.06, 1] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                    }}
                  >
                    <Sparkles className="w-8 h-8 text-white" />
                  </motion.div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-center mb-1 tracking-tight">
                  Autonomous Workflow
                </h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Describe your task — AI spawns specialized agents to solve it
                </p>

                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                      handleStartWorkflow();
                  }}
                  placeholder="E.g., Research the latest AI trends, analyze them, and write a comprehensive report…"
                  className="min-h-[110px] resize-none text-sm mb-4"
                  autoFocus
                />

                <div className="mb-4">
                  <ChatFileUpload
                    onFilesUploaded={(files) =>
                      setAttachedFiles((prev) => [...prev, ...files])
                    }
                    attachedFiles={attachedFiles}
                    onRemoveFile={(id) =>
                      setAttachedFiles((prev) =>
                        prev.filter((f) => f.id !== id),
                      )
                    }
                    disabled={false}
                  />
                </div>

                <Button
                  onClick={handleStartWorkflow}
                  disabled={!prompt.trim()}
                  size="lg"
                  className="w-full gap-2 font-semibold"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                  }}
                >
                  <Sparkles className="w-4 h-4" /> Start Workflow
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ════════════════ PHASE: executing / cancelling ════════════════ */}
        {(phase === "executing" || phase === "cancelling") && (
          <motion.div
            key="executing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm overflow-hidden p-4"
          >
            <button
              onClick={handleDismiss}
              className="fixed top-4 right-4 p-2 rounded-xl bg-background/60 hover:bg-background/90 border border-border/40 transition-colors z-50 cursor-pointer"
              aria-label="Close workflow"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-full max-w-2xl relative flex flex-col items-center mt-12">
              {/* ── Sleek Central Hub ── */}
              <div className="flex flex-col items-center justify-center w-full mx-auto mb-8 relative z-10 px-4 mt-8">
                {/* ── Before Plan Arrives (Queue/Planning) ────────────── */}
                {agents.length === 0 && !isCancelling ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center pt-8 pb-12 w-full max-w-sm"
                  >
                    <div className="relative mb-8 w-24 h-24 flex items-center justify-center">
                       {/* Spinner rings */}
                       <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-t-2 border-primary border-opacity-30" />
                       <motion.div animate={{ rotate: -360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-2 rounded-full border-t-2 border-accent border-opacity-60" />
                       <div className="relative z-10 w-14 h-14 rounded-full bg-background border border-border flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary-glow),0.2)]">
                         <Brain className="w-6 h-6 text-primary animate-pulse" />
                       </div>
                    </div>
                    
                    {/* Animated Step Tracker */}
                    <div className="w-full space-y-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span className="text-sm font-medium text-foreground">Request queued</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {workflowPhase === "planning" || workflowPhase === "creating_agents" ? (
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        ) : workflowPhase === "queued" ? (
                          <div className="w-5 h-5 rounded-full border-2 border-border" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        )}
                        <span className={cn("text-sm font-medium", ["planning", "creating_agents"].includes(workflowPhase) ? "text-foreground" : "text-muted-foreground")}>
                          Architecting multi-agent workflow
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {workflowPhase === "creating_agents" ? (
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-border" />
                        )}
                        <span className={cn("text-sm font-medium", workflowPhase === "creating_agents" ? "text-foreground" : "text-muted-foreground")}>
                          Spawning specialized agents
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* ── After Plan Arrives (Orbital System) ────────────── */
                  <div className="w-full flex justify-center w-[600px] mt-4 mb-4">
                    <LiveGraphVisualizer 
                      workflowPhase={workflowPhase} 
                      agents={agents} 
                      isSynthesizing={isSynthesizing} 
                    />
                  </div>
                )}

                <div className="mt-6">
                  <p
                    className={cn(
                      "text-lg font-semibold text-center mb-2 transition-colors duration-300",
                      isCancelling
                        ? "text-muted-foreground"
                        : "text-foreground",
                    )}
                  >
                    {isCancelling ? "Stopping workflow…" : status}
                  </p>

                  {executionPlan && !isCancelling && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-muted-foreground text-center max-w-[400px]"
                    >
                      {executionPlan.length > 100
                        ? executionPlan.slice(0, 100) + "…"
                        : executionPlan}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Live output preview removed because it is now natively rendered inside each block of the LiveGraphVisualizer. */}

              {/* Stop Workflow Button */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 w-full max-w-lg mx-auto flex justify-center"
              >
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all select-none",
                    isCancelling
                      ? "border-border/30 text-muted-foreground bg-muted/20 cursor-not-allowed"
                      : "border-destructive/40 text-destructive bg-destructive/5 hover:bg-destructive/12 hover:border-destructive/70 active:scale-95",
                  )}
                  aria-label="Stop workflow"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Stopping…
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" /> Stop
                      Workflow
                    </>
                  )}
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════ PHASE: complete ════════════════════════ */}
        {phase === "complete" && finalAnswer && (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-background/98 backdrop-blur-2xl p-4"
          >
            <button
              onClick={handleDismiss}
              className="fixed top-4 right-4 p-2 rounded-xl bg-background/60 hover:bg-background/90 border border-border/40 transition-colors z-20"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="max-w-4xl mx-auto py-8">
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="bg-background border border-emerald-500/25 rounded-2xl shadow-2xl p-6 sm:p-8"
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border/30">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #10b981, #059669)",
                    }}
                  >
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-emerald-500">
                      Workflow Complete
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {agents.length} agent{agents.length !== 1 ? "s" : ""}{" "}
                      collaborated · All tasks finished
                    </p>
                  </div>

                  {/* Agent chips */}
                  <div className="ml-auto hidden sm:flex flex-wrap gap-1.5 justify-end max-w-xs">
                    {agents.map((a, i) => (
                      <span
                        key={a.id || i}
                        className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: `${AGENT_PALETTES[i % AGENT_PALETTES.length].glow}22`,
                          color: AGENT_PALETTES[i % AGENT_PALETTES.length].from,
                          border: `1px solid ${AGENT_PALETTES[i % AGENT_PALETTES.length].from}44`,
                        }}
                      >
                        {a.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Markdown result */}
                <div
                  className="prose prose-sm sm:prose-base max-w-none dark:prose-invert mb-6
                  prose-headings:font-bold prose-headings:text-foreground
                  prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-6
                  prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-5
                  prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4
                  prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:mb-4
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-foreground prose-strong:font-semibold
                  prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-muted prose-pre:border prose-pre:border-border/50 prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto
                  prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-foreground/80
                  prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
                  prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4
                  prose-li:mb-1 prose-li:text-foreground/90
                  prose-table:w-full prose-table:border-collapse prose-table:my-4
                  prose-thead:border-b-2 prose-thead:border-border
                  prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold
                  prose-td:px-4 prose-td:py-2 prose-td:border-t prose-td:border-border/50 prose-td:text-foreground/90
                  prose-img:rounded-lg prose-img:shadow-md prose-img:my-4 prose-img:mx-auto prose-img:max-w-full
                  prose-hr:border-border/50 prose-hr:my-6
                "
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      img: ({ node, ...props }) => (
                        <img
                          {...props}
                          className="rounded-lg shadow-md my-4 mx-auto max-w-full"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ),
                      code: ({ node, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || "");
                        const codeString = String(children).replace(/\n$/, "");
                        return match ? (
                          <div className="relative my-4">
                            <div className="flex items-center justify-between bg-muted/50 border-b border-border/50 px-4 py-2 rounded-t-lg">
                              <span className="text-xs font-medium text-muted-foreground">
                                {match[1]}
                              </span>
                              <button
                                onClick={() => handleCopyCode(codeString)}
                                className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {copiedCode === codeString ? (
                                  <>
                                    <Check className="w-3 h-3" /> Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" /> Copy
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="bg-muted border border-border/50 rounded-b-lg p-4 overflow-x-auto">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          </div>
                        ) : (
                          <code
                            className="text-primary bg-muted px-1.5 py-0.5 rounded text-sm"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-4 border border-border/50 rounded-lg">
                          <table
                            className="w-full border-collapse"
                            {...props}
                          />
                        </div>
                      ),
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          className="text-primary hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote
                          className="border-l-4 border-primary/30 pl-4 py-2 my-4 italic text-foreground/80 bg-muted/30 rounded-r-lg"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {finalAnswer}
                  </ReactMarkdown>
                </div>

                <div className="pt-5 border-t border-border/30">
                  <Button
                    onClick={() => {
                      resetState();
                      setPhase("prompt");
                    }}
                    size="lg"
                    className="w-full font-semibold gap-2"
                    style={{
                      background: "linear-gradient(135deg, #10b981, #059669)",
                    }}
                  >
                    <Sparkles className="w-4 h-4" /> Start New Workflow
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════ PHASE: error ════════════════════════ */}
        {phase === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center relative bg-background p-4"
          >
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-xl font-bold mb-2">Workflow Failed</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Something went wrong during execution.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => {
                    resetState();
                    setPhase("prompt");
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  <ArrowRight className="w-4 h-4" /> Try Again
                </Button>
                <Button onClick={handleDismiss} variant="ghost">
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AutonomousWorkflowInterface;
