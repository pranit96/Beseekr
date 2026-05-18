// src/components/WorkflowExecutionPage.tsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  Play,
  ArrowLeft,
  Wrench,
  ChevronDown,
  Download,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ChatFileUpload } from "@/components/ChatFileUpload";
import type { WorkflowDefinition } from "@/components/WorkflowBuilder";
import type { Agent } from "@/types/agent";
import useOrchestration from "@/hooks/use-orchestration";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  size_readable: string;
  storage_path: string;
  url: string | null;
  extracted_content?: string;
  word_count?: number;
}

interface AgentSlotState {
  id: string;
  name: string;
  status: "pending" | "running" | "done" | "error";
  content: string;
  domain: string;
  hue: number;
  toolsRunning: string[];
  expanded: boolean;
}

interface WorkflowExecutionPageProps {
  workflow: WorkflowDefinition;
  agents: Agent[];
  open: boolean;
  onClose: () => void;
  socketConnected?: boolean;
}

// Palette of rich hues — each agent gets one
const HUES = [258, 199, 38, 158, 330, 220];
function getHue(i: number) {
  return HUES[i % HUES.length];
}
function hueGradient(h: number) {
  return `linear-gradient(135deg, hsl(${h},80%,56%), hsl(${h + 30},80%,48%))`;
}
function hueShadow(h: number) {
  return `0 12px 40px -8px hsla(${h},70%,50%,0.45)`;
}
function formatTool(t: string) {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Live typing cursor ────────────────────────────────────────────────────────
const Cursor = () => (
  <motion.span
    animate={{ opacity: [1, 0] }}
    transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
    className="inline-block w-0.5 h-4 bg-current align-middle ml-0.5"
  />
);

// ── Central animated orb shown while running ─────────────────────────────────
const RunningOrb: React.FC<{
  hue: number;
  name: string;
  step: number;
  total: number;
}> = ({ hue, name, step, total }) => (
  <div className="flex flex-col items-center gap-8 py-12">
    {/* Orb container — fixed size so nothing bleeds into text */}
    <div
      className="relative flex items-center justify-center"
      style={{ width: 200, height: 200 }}
    >
      {/* Aurora background — large soft bloom */}
      <motion.div
        animate={{ scale: [1, 1.18, 1], opacity: [0.18, 0.32, 0.18] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute rounded-full"
        style={{
          width: 200,
          height: 200,
          background: `radial-gradient(circle, hsl(${hue},80%,60%) 0%, transparent 70%)`,
          filter: "blur(28px)",
        }}
      />

      {/* Outer pulse ring */}
      <motion.div
        animate={{ scale: [1, 1.22, 1], opacity: [0.08, 0, 0.08] }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.6,
        }}
        className="absolute rounded-full border"
        style={{
          width: 178,
          height: 178,
          borderColor: `hsla(${hue},70%,60%,0.4)`,
        }}
      />

      {/* Mid ring */}
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.12, 0, 0.12] }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2,
        }}
        className="absolute rounded-full border"
        style={{
          width: 152,
          height: 152,
          borderColor: `hsla(${hue},70%,65%,0.35)`,
        }}
      />

      {/* Outer arc track (faint) */}
      <div
        className="absolute rounded-full"
        style={{
          width: 136,
          height: 136,
          border: `1.5px solid hsla(${hue},60%,60%,0.12)`,
        }}
      />

      {/* Spinning arc — primary */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
        className="absolute rounded-full"
        style={{
          width: 136,
          height: 136,
          border: "2px solid transparent",
          borderTopColor: `hsl(${hue},80%,65%)`,
          borderRightColor: `hsla(${hue},80%,65%,0.3)`,
          filter: `drop-shadow(0 0 6px hsl(${hue},80%,60%))`,
        }}
      />

      {/* Counter-spinning arc — secondary */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}
        className="absolute rounded-full"
        style={{
          width: 112,
          height: 112,
          border: "1.5px solid transparent",
          borderBottomColor: `hsla(${hue + 30},75%,65%,0.6)`,
          borderLeftColor: `hsla(${hue + 30},75%,65%,0.2)`,
        }}
      />

      {/* Glassmorphic orb — center */}
      <motion.div
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: 88,
          height: 88,
          background: `linear-gradient(135deg, hsla(${hue},70%,60%,0.9) 0%, hsla(${hue + 28},75%,45%,0.95) 100%)`,
          boxShadow: `0 0 0 1px hsla(${hue},60%,70%,0.25), 0 8px 32px hsla(${hue},70%,50%,0.5), inset 0 1px 0 rgba(255,255,255,0.25)`,
        }}
      >
        {/* Inner gloss */}
        <div
          className="absolute top-2 left-3 w-8 h-4 rounded-full opacity-30"
          style={{ background: "linear-gradient(135deg, white, transparent)" }}
        />
        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="w-9 h-9 text-white drop-shadow-lg" />
        </motion.div>
      </motion.div>
    </div>

    {/* Label block — fully outside the orb container */}
    <div className="text-center space-y-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={name}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-1"
        >
          <p
            className="text-sm font-medium tracking-widest uppercase"
            style={{ color: `hsl(${hue},65%,62%)` }}
          >
            Running
          </p>
          <p className="text-xl font-bold tracking-tight text-foreground">
            {name}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Step progress dots */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <motion.div
            key={i}
            animate={
              i + 1 === step
                ? { scale: [1, 1.4, 1], opacity: [0.9, 1, 0.9] }
                : {}
            }
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            className="rounded-full transition-all duration-500"
            style={{
              width: i + 1 === step ? 20 : 6,
              height: 6,
              background:
                i + 1 < step
                  ? `hsl(${hue},60%,55%)`
                  : i + 1 === step
                    ? `hsl(${hue},75%,62%)`
                    : `hsla(${hue},30%,60%,0.2)`,
              boxShadow:
                i + 1 === step ? `0 0 8px hsla(${hue},70%,60%,0.7)` : undefined,
            }}
          />
        ))}
      </div>

      <p
        className="text-xs font-medium"
        style={{ color: `hsla(${hue},50%,65%,0.6)` }}
      >
        Step {step} of {total}
      </p>
    </div>
  </div>
);

// ── Step progress track ───────────────────────────────────────────────────────
const StepTrack: React.FC<{ slots: AgentSlotState[] }> = ({ slots }) => (
  <div className="flex items-center justify-center gap-0">
    {slots.map((s, i) => {
      const isDone = s.status === "done";
      const isRunning = s.status === "running";
      const isError = s.status === "error";
      return (
        <React.Fragment key={s.id}>
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: isRunning ? 1.15 : 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: i * 0.06,
            }}
            className="relative flex flex-col items-center"
          >
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500",
                isRunning && "text-white shadow-lg ring-2 ring-white/30",
                isDone && "text-white",
                isError &&
                  "bg-red-500/20 text-red-400 border border-red-500/40",
                s.status === "pending" &&
                  "bg-white/5 text-muted-foreground border border-white/10",
              )}
              style={
                isRunning || isDone
                  ? {
                      background: hueGradient(s.hue),
                      boxShadow: isRunning ? hueShadow(s.hue) : undefined,
                    }
                  : undefined
              }
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : isError ? (
                "!"
              ) : (
                i + 1
              )}
            </div>
            <span
              className={cn(
                "mt-1.5 text-[9px] font-medium tracking-wide max-w-[64px] text-center truncate",
                isRunning ? "text-foreground" : "text-muted-foreground/50",
              )}
            >
              {s.name}
            </span>
          </motion.div>
          {i < slots.length - 1 && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: isDone ? 1 : 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mx-1.5 h-px w-8 origin-left"
              style={{
                background: isDone ? `hsl(${s.hue},70%,55%)` : undefined,
              }}
            >
              <div className="w-full h-px bg-white/10" />
            </motion.div>
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
export const WorkflowExecutionPage: React.FC<WorkflowExecutionPageProps> = ({
  workflow,
  agents,
  open,
  onClose,
  socketConnected = true,
}) => {
  const [prompt, setPrompt] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [agentSlots, setAgentSlots] = useState<AgentSlotState[]>([]);
  const [isCancelling, setIsCancelling] = useState(false);
  const [finalMarkdown, setFinalMarkdown] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedFinal, setExpandedFinal] = useState(true);
  // Activity log: rich timestamped feed of events
  const [activityLog, setActivityLog] = useState<
    Array<{
      id: string;
      type:
        | "agent_start"
        | "tool_start"
        | "tool_done"
        | "agent_done"
        | "agent_error"
        | "info";
      agentName?: string;
      agentHue?: number;
      toolName?: string;
      message: string;
      ts: Date;
    }>
  >([]);

  const cancelRef = useRef<(() => void) | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const actLogRef = useRef<HTMLDivElement>(null);
  const { execute, ensureConnected } = useOrchestration();
  const { toast } = useToast();

  const runLockRef = useRef(false);

  const pushActivity = useCallback(
    (entry: {
      type:
        | "agent_start"
        | "tool_start"
        | "tool_done"
        | "agent_done"
        | "agent_error"
        | "info";
      agentName?: string;
      agentHue?: number;
      toolName?: string;
      message: string;
    }) => {
      setActivityLog((prev) => [
        ...prev,
        { ...entry, id: `${Date.now()}-${Math.random()}`, ts: new Date() },
      ]);
      setTimeout(
        () =>
          actLogRef.current?.scrollTo({
            top: actLogRef.current.scrollHeight,
            behavior: "smooth",
          }),
        60,
      );
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    setAgentSlots(
      workflow.nodes.map((node, i) => {
        const ag = agents.find((a) => a.id === node.agentId);
        return {
          id: node.agentId,
          name: node.agentName,
          domain: ag?.domain || "",
          hue: getHue(i),
          status: "pending",
          content: "",
          toolsRunning: [],
          expanded: true,
        };
      }),
    );
    setPrompt("");
    setAttachedFiles([]);
    setIsRunning(false);
    setHasRun(false);
    setFinalMarkdown("");
    setIsDone(false);
    setErrorMsg("");
    setActivityLog([]);
    cancelRef.current = null;
    runLockRef.current = false;
    setTimeout(() => textareaRef.current?.focus(), 200);
  }, [open, workflow, agents]);

  // Auto-scroll to bottom as content streams in
  useEffect(() => {
    if (isRunning)
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [agentSlots, isRunning]);

  const handleRun = useCallback(async () => {
    if (runLockRef.current || isCancelling) return;
    if (!prompt.trim() && attachedFiles.length === 0) {
      toast({ title: "Type a message first", variant: "destructive" });
      return;
    }
    if (!socketConnected) {
      toast({
        title: "Not connected",
        description: "Waiting for connection…",
        variant: "destructive",
      });
      return;
    }

    runLockRef.current = true;
    setAgentSlots((prev) =>
      prev.map((s) => ({
        ...s,
        status: "pending",
        content: "",
        toolsRunning: [],
      })),
    );
    setFinalMarkdown("");
    setIsDone(false);
    setErrorMsg("");
    setActivityLog([]);
    setIsRunning(true);
    setHasRun(true);
    setExpandedFinal(true);
    pushActivity({
      type: "info",
      message: `Starting workflow with ${workflow.nodes.length} agents…`,
    });

    const payload: any = {
      agent_ids: workflow.nodes.map((n) => n.agentId),
      workflow_nodes: workflow.nodes,
      message: prompt,
      mode: "sequential",
      save_to_conversation: false,
    };
    if (attachedFiles.length > 0) {
      payload.attached_files = attachedFiles.map((f) => ({
        name: f.name,
        type: f.type,
        size: f.size,
        storage_path: f.storage_path,
        url: f.url,
        extracted_content: (f as any).extracted_content || null,
        word_count: (f as any).word_count || 0,
      }));
    }

    ensureConnected();
    try {
      await execute(payload, {
        onAck: () => {},
        onProgress: (p) => {
          const slot = agentSlots.find((_s, i) => i + 1 === p.step);
          const hue = slot ? slot.hue : getHue(p.step - 1);
          pushActivity({
            type: "agent_start",
            agentName: p.agent_name || slot?.name,
            agentHue: hue,
            message: `Starting ${p.agent_name || slot?.name || "agent"}…`,
          });
          setAgentSlots((prev) =>
            prev.map((s, i) => {
              if (i + 1 === p.step) return { ...s, status: "running" };
              if (i + 1 < p.step) return { ...s, status: "done" };
              return s;
            }),
          );
        },
        onToken: (agentId, token) =>
          setAgentSlots((prev) =>
            prev.map((s) =>
              s.id === agentId
                ? { ...s, content: s.content + token, status: "running" }
                : s,
            ),
          ),
        onAgentDone: (agentId) => {
          const slot = agentSlots.find((s) => s.id === agentId);
          if (slot)
            pushActivity({
              type: "agent_done",
              agentName: slot.name,
              agentHue: slot.hue,
              message: `${slot.name} completed`,
            });
          setAgentSlots((prev) =>
            prev.map((s) => (s.id === agentId ? { ...s, status: "done" } : s)),
          );
        },
        onAgentError: (agentId, err) => {
          const slot = agentSlots.find((s) => s.id === agentId);
          if (slot)
            pushActivity({
              type: "agent_error",
              agentName: slot.name,
              agentHue: slot.hue,
              message: `${slot.name} failed: ${String(err || "error")}`,
            });
          setAgentSlots((prev) =>
            prev.map((s) =>
              s.id === agentId
                ? {
                    ...s,
                    status: "error",
                    content: String(err || "Agent failed"),
                  }
                : s,
            ),
          );
        },
        onToolStart: (d) => {
          const slot = agentSlots.find((s) => s.id === d.agent_id);
          pushActivity({
            type: "tool_start",
            agentName: slot?.name,
            agentHue: slot?.hue,
            toolName: d.tool_name,
            message: `Using ${formatTool(d.tool_name)}`,
          });
          setAgentSlots((prev) =>
            prev.map((s) =>
              s.id === d.agent_id
                ? { ...s, toolsRunning: [...s.toolsRunning, d.tool_name] }
                : s,
            ),
          );
        },
        onToolResult: (d) => {
          const slot = agentSlots.find((s) => s.id === d.agent_id);
          pushActivity({
            type: "tool_done",
            agentName: slot?.name,
            agentHue: slot?.hue,
            toolName: d.tool_name,
            message: `${formatTool(d.tool_name)} ${d.success ? "succeeded" : "failed"}`,
          });
          setAgentSlots((prev) =>
            prev.map((s) =>
              s.id === d.agent_id
                ? {
                    ...s,
                    toolsRunning: s.toolsRunning.filter((_, i) => i !== 0),
                  }
                : s,
            ),
          );
        },
        onDone: (data) => {
          setFinalMarkdown(data.final_markdown || "");
          setIsDone(true);
          setIsRunning(false);
          runLockRef.current = false;
          setAgentSlots((prev) =>
            prev.map((s) => ({
              ...s,
              status: s.status === "error" ? "error" : "done",
            })),
          );
        },
        onError: (err) => {
          setErrorMsg(err?.error || "Workflow execution failed");
          setIsRunning(false);
          runLockRef.current = false;
          toast({
            title: "Workflow failed",
            description: err?.error,
            variant: "destructive",
          });
        },
        onCancelReady: (fn) => {
          cancelRef.current = fn;
        },
        onRateLimit: (rl) => {
          toast({
            title: "Rate limited",
            description: `Retry in ${rl?.retryAfter ?? 30}s`,
          });
          setIsRunning(false);
          runLockRef.current = false;
        },
        onWarning: () => {},
        onCancelled: () => {
          setIsRunning(false);
          setIsCancelling(false);
          cancelRef.current = null;
          runLockRef.current = false;
        },
      });
    } catch (e: any) {
      setErrorMsg(e.message || "Unexpected error");
      setIsRunning(false);
      runLockRef.current = false;
    }
  }, [
    prompt,
    attachedFiles,
    workflow,
    socketConnected,
    execute,
    ensureConnected,
    toast,
    isCancelling,
  ]);

  const handleCancel = () => {
    if (!cancelRef.current) return;
    setIsCancelling(true);
    cancelRef.current();
    setTimeout(() => {
      setIsRunning(false);
      setIsCancelling(false);
      runLockRef.current = false;
    }, 800);
  };

  if (!open) return null;

  const runningSlot = agentSlots.find((s) => s.status === "running");
  const runningIndex = agentSlots.findIndex((s) => s.status === "running");

  // Export handler — downloads the final markdown as a .md file
  const handleExport = () => {
    if (!finalMarkdown) return;
    const blob = new Blob([finalMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflow.name.replace(/\s+/g, "_")}_result.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="wf-exec"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="fixed inset-0 z-[200] flex flex-col"
        style={{
          backgroundColor: "hsl(var(--background, 222 84% 5%))",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Ambient gradient blobs — stay within container, not fixed */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-[0.05] blur-3xl"
            style={{
              background:
                "linear-gradient(180deg, hsl(258,80%,65%), transparent)",
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-[500px] h-[300px] rounded-full opacity-[0.04] blur-3xl"
            style={{
              background:
                "linear-gradient(135deg, hsl(199,80%,55%), transparent)",
            }}
          />
        </div>

        {/* ── Top bar ────────────────────────────────────────────────────────── */}
        <header className="relative z-10 shrink-0 flex items-center gap-3 px-4 h-14 border-b border-border bg-card">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>

          {/* Workflow identity */}
          <div className="flex-1 min-w-0 flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center"
              style={{
                background: hueGradient(getHue(0)),
                boxShadow: hueShadow(getHue(0)),
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-foreground truncate leading-tight">
                {workflow.name}
              </h1>
              <p className="text-[10px] text-muted-foreground/50 font-medium tracking-wide uppercase">
                {workflow.nodes.length} Agents · Sequential
              </p>
            </div>
          </div>

          {/* Right side: status + actions */}
          <div className="flex items-center gap-2 shrink-0">
            <AnimatePresence mode="wait">
              {isRunning ? (
                <motion.div
                  key="running"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="flex items-center gap-2"
                >
                  <div
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: "hsla(258,70%,60%,0.12)",
                      color: "hsl(258,70%,70%)",
                      border: "1px solid hsla(258,70%,60%,0.2)",
                    }}
                  >
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Running</span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancel}
                    disabled={isCancelling}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                    style={{
                      background: "hsla(0,70%,55%,0.12)",
                      color: "hsl(0,70%,65%)",
                      border: "1px solid hsla(0,70%,55%,0.2)",
                    }}
                  >
                    {isCancelling ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                    Stop
                  </motion.button>
                </motion.div>
              ) : isDone ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <div
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: "hsla(158,60%,45%,0.12)",
                      color: "hsl(158,60%,55%)",
                      border: "1px solid hsla(158,60%,45%,0.2)",
                    }}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Complete</span>
                  </div>
                  {finalMarkdown && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleExport}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                      style={{
                        background: "hsla(258,70%,60%,0.10)",
                        color: "hsl(258,70%,70%)",
                        border: "1px solid hsla(258,70%,60%,0.2)",
                      }}
                    >
                      <Download className="w-3 h-3" />
                      Export
                    </motion.button>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </header>

        {/* ── Scrollable body ─────────────────────────────────────────────────── */}
        <div className="relative z-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="max-w-2xl mx-auto w-full px-5 py-8 space-y-8">
            {/* Pre-run: workflow chain overview — hidden once hasRun or isRunning */}
            <AnimatePresence mode="wait">
              {!hasRun && !isRunning && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-6"
                >
                  {/* Hero */}
                  <div className="text-center space-y-2 pt-4">
                    <div
                      className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
                      style={{
                        background: hueGradient(getHue(0)),
                        boxShadow: hueShadow(getHue(0)),
                      }}
                    >
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">
                      {workflow.name}
                    </h2>
                    {workflow.description && (
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        {workflow.description}
                      </p>
                    )}
                  </div>

                  {/* Agent chain */}
                  <div
                    className="rounded-2xl overflow-hidden border border-white/[0.06]"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    {workflow.nodes.map((node, i) => {
                      const h = getHue(i);
                      const ag = agents.find((a) => a.id === node.agentId);
                      return (
                        <React.Fragment key={node.id}>
                          <div className="flex items-center gap-4 px-5 py-4">
                            <div
                              className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-white text-sm font-bold"
                              style={{ background: hueGradient(h) }}
                            >
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold leading-tight">
                                {node.agentName}
                              </p>
                              {ag?.domain && (
                                <p className="text-xs text-muted-foreground/50 mt-0.5 font-medium tracking-wide uppercase">
                                  {ag.domain}
                                </p>
                              )}
                              {node.instruction && (
                                <p className="text-xs text-muted-foreground/60 mt-1 italic">
                                  "{node.instruction}"
                                </p>
                              )}
                            </div>
                            <div className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center border border-white/10 text-muted-foreground/30">
                              <span className="text-[10px]">{i + 1}</span>
                            </div>
                          </div>
                          {i < workflow.nodes.length - 1 && (
                            <div className="flex items-center ml-[52px] pl-0.5">
                              <div className="w-px h-4 bg-white/[0.06]" />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Running: Orb + Activity Feed side by side */}
            {(isRunning || (hasRun && !isDone)) && (
              <motion.div
                key="running-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Step progress track */}
                <StepTrack slots={agentSlots} />

                {/* Two-column: Orb + Activity Log */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Left: Animated orb */}
                  {runningSlot && (
                    <div className="flex flex-col items-center">
                      <RunningOrb
                        hue={runningSlot.hue}
                        name={runningSlot.name}
                        step={runningIndex + 1}
                        total={workflow.nodes.length}
                      />

                      {/* Cancel button under orb */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCancel}
                        disabled={isCancelling}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
                        style={{
                          background: "hsla(0,70%,55%,0.12)",
                          color: "hsl(0,70%,65%)",
                          border: "1px solid hsla(0,70%,55%,0.25)",
                        }}
                      >
                        {isCancelling ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />{" "}
                            Cancelling…
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4" /> Stop Workflow
                          </>
                        )}
                      </motion.button>
                    </div>
                  )}

                  {/* Right: Live activity feed */}
                  <div className="rounded-2xl border border-border overflow-hidden bg-card">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                      <motion.div
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-green-500"
                      />
                      <span className="text-xs font-semibold text-foreground tracking-wide">
                        Live Activity
                      </span>
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {activityLog.length} events
                      </span>
                    </div>
                    <div
                      ref={actLogRef}
                      className="overflow-y-auto px-3 py-3 space-y-1.5"
                      style={{ maxHeight: 340, minHeight: 200 }}
                    >
                      {activityLog.length === 0 && (
                        <p className="text-xs text-muted-foreground/50 text-center py-8">
                          Waiting for events…
                        </p>
                      )}
                      {activityLog.map((ev) => (
                        <motion.div
                          key={ev.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-start gap-2.5 px-2 py-1.5 rounded-lg"
                          style={{
                            background:
                              ev.type === "agent_error"
                                ? "hsla(0,70%,55%,0.07)"
                                : ev.type === "agent_done"
                                  ? "hsla(158,60%,45%,0.06)"
                                  : ev.type === "agent_start"
                                    ? `hsla(${ev.agentHue ?? 258},60%,55%,0.07)`
                                    : "transparent",
                          }}
                        >
                          {/* Icon */}
                          <div className="mt-0.5 shrink-0">
                            {ev.type === "agent_start" && (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                                className="w-3.5 h-3.5"
                              >
                                <Loader2
                                  style={{
                                    color: `hsl(${ev.agentHue ?? 258},70%,62%)`,
                                  }}
                                  className="w-3.5 h-3.5"
                                />
                              </motion.div>
                            )}
                            {ev.type === "agent_done" && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            )}
                            {ev.type === "agent_error" && (
                              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                            )}
                            {ev.type === "tool_start" && (
                              <Wrench className="w-3 h-3 text-amber-400" />
                            )}
                            {ev.type === "tool_done" && (
                              <CheckCircle2 className="w-3 h-3 text-muted-foreground/50" />
                            )}
                            {ev.type === "info" && (
                              <Sparkles className="w-3 h-3 text-muted-foreground/50" />
                            )}
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-xs leading-tight"
                              style={{
                                color:
                                  ev.type === "agent_error"
                                    ? "hsl(0,70%,65%)"
                                    : ev.type === "agent_done"
                                      ? "hsl(158,60%,55%)"
                                      : ev.type === "agent_start"
                                        ? `hsl(${ev.agentHue ?? 258},65%,68%)`
                                        : ev.type === "tool_start"
                                          ? "hsl(38,90%,62%)"
                                          : undefined,
                              }}
                            >
                              {ev.message}
                            </p>
                            {ev.agentName &&
                              ev.type !== "agent_start" &&
                              ev.type !== "agent_done" && (
                                <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                                  {ev.agentName}
                                </p>
                              )}
                          </div>
                          {/* Timestamp */}
                          <span className="shrink-0 text-[9px] text-muted-foreground/25 mt-0.5">
                            {ev.ts.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Live output preview for current agent */}
                    {runningSlot?.content && (
                      <div className="border-t border-border px-3 py-2">
                        <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-1">
                          Live Output Preview
                        </p>
                        <p className="text-[11px] text-foreground/60 font-mono leading-relaxed line-clamp-3">
                          {runningSlot.content.slice(-300)}
                          <Cursor />
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Results: per-agent expandable cards */}

            {hasRun && !isRunning && agentSlots.some((s) => s.content) && (
              <div className="space-y-3">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/40 px-1">
                  Agent Responses
                </p>
                {agentSlots
                  .filter((s) => s.content)
                  .map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: i * 0.06,
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                      className="rounded-2xl border overflow-hidden"
                      style={{
                        borderColor:
                          s.status === "error"
                            ? "hsla(0,70%,55%,0.25)"
                            : "rgba(255,255,255,0.06)",
                        background:
                          s.status === "error"
                            ? "hsla(0,70%,55%,0.05)"
                            : "rgba(255,255,255,0.02)",
                      }}
                    >
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors text-left"
                        onClick={() =>
                          setAgentSlots((prev) =>
                            prev.map((slot, idx) =>
                              idx === agentSlots.indexOf(s)
                                ? { ...slot, expanded: !slot.expanded }
                                : slot,
                            ),
                          )
                        }
                      >
                        {/* Avatar */}
                        <div
                          className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white"
                          style={
                            s.status === "error"
                              ? {}
                              : { background: hueGradient(s.hue) }
                          }
                        >
                          {s.status === "done" ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : s.status === "error" ? (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          ) : (
                            <span className="text-xs font-bold">{i + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold">
                            {s.name}
                          </span>
                          {s.domain && (
                            <span
                              className="text-[10px] font-medium ml-2 tracking-wide uppercase"
                              style={{ color: `hsl(${s.hue},60%,55%)` }}
                            >
                              {s.domain}
                            </span>
                          )}
                        </div>
                        <motion.div
                          animate={{ rotate: s.expanded ? 0 : -90 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
                        </motion.div>
                      </button>

                      <AnimatePresence initial={false}>
                        {s.expanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 pt-1 border-t border-white/[0.04]">
                              <div className="prose prose-sm max-w-none dark:prose-invert [&_code]:text-[12px] [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-white/10 [&_table]:border-collapse [&_table]:w-full [&_table]:my-4 [&_td]:border [&_td]:border-white/10 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-white/10 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-white/5 [&_th]:text-left">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {s.content}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
              </div>
            )}

            {/* Final synthesized result */}
            {isDone && finalMarkdown && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.1,
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }}
                className="rounded-2xl border overflow-hidden"
                style={{
                  borderColor: "hsla(158,60%,45%,0.25)",
                  background: "hsla(158,60%,45%,0.04)",
                }}
              >
                {/* Card header */}
                <div className="flex items-center gap-3 px-4 py-4">
                  <button
                    className="flex-1 flex items-center gap-3 text-left"
                    onClick={() => setExpandedFinal((v) => !v)}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg,hsl(158,60%,45%),hsl(187,60%,40%))",
                      }}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-bold"
                        style={{ color: "hsl(158,60%,55%)" }}
                      >
                        Workflow Complete
                      </p>
                      <p className="text-xs text-muted-foreground/50 mt-0.5">
                        {workflow.nodes.length} agents collaborated · tap to{" "}
                        {expandedFinal ? "collapse" : "expand"}
                      </p>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedFinal ? 0 : -90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
                    </motion.div>
                  </button>
                  {/* Export inline */}
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={handleExport}
                    title="Export as Markdown"
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                    style={{
                      background: "hsla(258,70%,60%,0.10)",
                      color: "hsl(258,70%,70%)",
                      border: "1px solid hsla(258,70%,60%,0.2)",
                    }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Export</span>
                  </motion.button>
                </div>

                <AnimatePresence initial={false}>
                  {expandedFinal && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div
                        className="px-5 pb-6 pt-2 border-t"
                        style={{ borderColor: "hsla(158,60%,45%,0.12)" }}
                      >
                        <div className="prose prose-sm max-w-none dark:prose-invert [&_code]:text-[12px] [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-white/10 [&_table]:border-collapse [&_table]:w-full [&_table]:my-4 [&_td]:border [&_td]:border-white/10 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-white/10 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-white/5 [&_th]:text-left">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {finalMarkdown}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Error */}
            {errorMsg && !isRunning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3 p-4 rounded-2xl"
                style={{
                  background: "hsla(0,70%,55%,0.08)",
                  border: "1px solid hsla(0,70%,55%,0.2)",
                }}
              >
                <AlertCircle
                  className="w-5 h-5 shrink-0 mt-0.5"
                  style={{ color: "hsl(0,70%,65%)" }}
                />
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "hsl(0,70%,65%)" }}
                  >
                    Workflow Failed
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "hsl(0,60%,60%)" }}
                  >
                    {errorMsg}
                  </p>
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── Bottom input ──────────────────────────────────────────────────────── */}
        <div
          className="shrink-0 border-t border-white/[0.06] px-4 py-3"
          style={{
            background: "rgba(var(--background-raw,0,0,0),0.9)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="max-w-2xl mx-auto space-y-2">
            {/* Attached file chips */}
            {attachedFiles.length > 0 && (
              <ChatFileUpload
                onFilesUploaded={(files) =>
                  setAttachedFiles((prev) => [...prev, ...files])
                }
                attachedFiles={attachedFiles}
                onRemoveFile={(id) =>
                  setAttachedFiles((prev) => prev.filter((f) => f.id !== id))
                }
                disabled={isRunning}
              />
            )}

            {/* Composer row */}
            <div
              className={cn(
                "flex items-end gap-2 rounded-2xl px-3 py-2 transition-all duration-200",
                "border bg-white/[0.03]",
                isRunning
                  ? "border-white/[0.04] opacity-60"
                  : "border-white/10 focus-within:border-white/20",
              )}
            >
              {/* File attach */}
              <div className="shrink-0 mb-0.5">
                <ChatFileUpload
                  onFilesUploaded={(files) =>
                    setAttachedFiles((prev) => [...prev, ...files])
                  }
                  attachedFiles={[]}
                  onRemoveFile={() => {}}
                  disabled={isRunning}
                />
              </div>

              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleRun();
                  }
                }}
                placeholder={
                  isRunning ? "Agents are working…" : `Ask ${workflow.name}…`
                }
                className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-[140px] text-sm placeholder:text-muted-foreground/25 py-1.5"
                disabled={isRunning}
                rows={1}
              />

              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={isRunning ? handleCancel : handleRun}
                disabled={
                  isCancelling ||
                  (!isRunning && !prompt.trim() && attachedFiles.length === 0)
                }
                className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-opacity disabled:opacity-30 disabled:cursor-not-allowed mb-0.5"
                style={
                  isRunning
                    ? {
                        background: "hsla(0,70%,55%,0.15)",
                        color: "hsl(0,70%,65%)",
                      }
                    : {
                        background: hueGradient(getHue(0)),
                        boxShadow: hueShadow(getHue(0)),
                        color: "white",
                      }
                }
              >
                {isCancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isRunning ? (
                  <X className="w-4 h-4" />
                ) : hasRun ? (
                  <Play className="w-4 h-4 ml-0.5" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </motion.button>
            </div>

            <p className="text-[10px] text-center font-medium tracking-wide text-muted-foreground/25">
              {workflow.nodes.length} agents · sequential · ↵ to run
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WorkflowExecutionPage;
