// src/components/AutonomousWorkflowInterface.tsx
// Redesigned autonomous workflow — single phase state, futuristic orbital agent ring

import React, { useState, useEffect, useRef } from 'react';
import {
  X, Sparkles, Loader2, CheckCircle2, AlertCircle,
  ArrowRight, Copy, Check, Zap, Brain, Search, FileText, Code2, Database,
} from 'lucide-react';
import { motion, AnimatePresence, useAnimationFrame } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import useAutonomousWorkflow from '@/hooks/use-autonomous-workflow';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Agent {
  id: string;
  name: string;
  role: string;
  domain: string;
  tools: string[];
  status: 'pending' | 'running' | 'done' | 'error';
  output: string;
  reasoning?: string;
}

type Phase = 'prompt' | 'executing' | 'complete' | 'error';

interface AutonomousWorkflowInterfaceProps {
  onClose?: () => void;
}

// ─── Agent Icon Map ────────────────────────────────────────────────────────────

const AGENT_ICONS = [Brain, Search, Code2, Database, FileText, Zap];

const AGENT_PALETTES = [
  { from: '#6366f1', to: '#8b5cf6', glow: 'rgba(99,102,241,0.6)' },
  { from: '#06b6d4', to: '#0ea5e9', glow: 'rgba(6,182,212,0.6)' },
  { from: '#f59e0b', to: '#ef4444', glow: 'rgba(245,158,11,0.6)' },
  { from: '#10b981', to: '#059669', glow: 'rgba(16,185,129,0.6)' },
  { from: '#ec4899', to: '#f43f5e', glow: 'rgba(236,72,153,0.6)' },
  { from: '#8b5cf6', to: '#6366f1', glow: 'rgba(139,92,246,0.6)' },
];

// ─── Orbital Ring SVG ─────────────────────────────────────────────────────────

const OrbitalRing: React.FC<{ radius: number; opacity?: number; spin?: number }> = ({
  radius, opacity = 0.15, spin = 20,
}) => (
  <motion.circle
    cx="50%"
    cy="50%"
    r={radius}
    fill="none"
    stroke="url(#ringGrad)"
    strokeWidth="1"
    strokeDasharray="6 10"
    style={{ opacity }}
    animate={{ rotate: 360 }}
    transition={{ duration: spin, repeat: Infinity, ease: 'linear' }}
  />
);

// ─── Particle field ────────────────────────────────────────────────────────────

const ParticleField: React.FC = () => {
  const particles = Array.from({ length: 40 }, (_, i) => ({
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
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1, 0.5], y: [0, -30, 0] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
};

// ─── Agent Orbital Node ───────────────────────────────────────────────────────

interface AgentNodeProps {
  agent: Agent;
  index: number;
  total: number;
  orbitRadius: number;
  orbitAngleOffset: number; // live rotating offset in radians
}

const AgentNode: React.FC<AgentNodeProps> = ({ agent, index, total, orbitRadius, orbitAngleOffset }) => {
  const baseAngle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const angle = baseAngle + orbitAngleOffset;
  const x = Math.cos(angle) * orbitRadius;
  const y = Math.sin(angle) * orbitRadius;
  const palette = AGENT_PALETTES[index % AGENT_PALETTES.length];
  const Icon = AGENT_ICONS[index % AGENT_ICONS.length];
  const isRunning = agent.status === 'running';
  const isDone = agent.status === 'done';
  const isError = agent.status === 'error';

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.15, type: 'spring', stiffness: 200 }}
      className="absolute"
      style={{
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
        zIndex: isRunning ? 10 : 5,
      }}
    >
      {/* Glow pulse when running */}
      {isRunning && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: palette.glow, filter: 'blur(12px)', zIndex: -1 }}
          animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      )}

      {/* Connector line to center */}
      <svg
        className="absolute pointer-events-none"
        style={{
          left: '50%',
          top: '50%',
          width: orbitRadius,
          height: 2,
          transform: `rotate(${angle * (180 / Math.PI)}deg)`,
          transformOrigin: '0 50%',
          opacity: isRunning ? 0.6 : 0.18,
        }}
      >
        <line
          x1="0" y1="1"
          x2={orbitRadius} y2="1"
          stroke={palette.from}
          strokeWidth="1"
          strokeDasharray="4 6"
        />
      </svg>

      {/* Node circle */}
      <motion.div
        animate={isRunning ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
        className="relative flex items-center justify-center rounded-full text-white shadow-xl"
        style={{
          width: 56,
          height: 56,
          background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
          boxShadow: isRunning ? `0 0 24px ${palette.glow}` : `0 4px 16px ${palette.glow}40`,
        }}
      >
        {isDone && <CheckCircle2 className="w-6 h-6" />}
        {isError && <AlertCircle className="w-6 h-6" />}
        {isRunning && <Loader2 className="w-6 h-6 animate-spin" />}
        {agent.status === 'pending' && <Icon className="w-5 h-5 opacity-80" />}
      </motion.div>

      {/* Label */}
      <div
        className="mt-2 text-center"
        style={{ width: 80, marginLeft: -12 }}
      >
        <p className="text-[10px] font-semibold leading-tight text-foreground/80 truncate">
          {agent.name}
        </p>
        <p
          className="text-[9px] leading-tight mt-0.5 font-medium"
          style={{ color: isRunning ? palette.from : isDone ? '#10b981' : 'var(--muted-foreground)' }}
        >
          {agent.status === 'running' ? 'Running' : agent.status === 'done' ? 'Done' : agent.status === 'error' ? 'Error' : 'Waiting'}
        </p>
      </div>
    </motion.div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export const AutonomousWorkflowInterface: React.FC<AutonomousWorkflowInterfaceProps> = ({ onClose }) => {
  const [phase, setPhase] = useState<Phase>('prompt');
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<string>('Initializing…');
  const [executionPlan, setExecutionPlan] = useState<string>('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [finalAnswer, setFinalAnswer] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // slow orbit rotation
  const [orbitAngle, setOrbitAngle] = useState(0);
  useAnimationFrame((_, delta) => {
    if (phase === 'executing') {
      setOrbitAngle((a) => a + (delta / 1000) * 0.08); // ~0.08 rad/s
    }
  });

  const { toast } = useToast();
  const { execute } = useAutonomousWorkflow();

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const resetState = () => {
    setPrompt('');
    setStatus('Initializing…');
    setExecutionPlan('');
    setAgents([]);
    setFinalAnswer('');
    setOrbitAngle(0);
  };

  const handleStartWorkflow = () => {
    if (!prompt.trim()) {
      toast({ title: 'Prompt required', description: 'Please enter a prompt to start the workflow', variant: 'destructive' });
      return;
    }

    setPhase('executing');
    const requestId = `wf_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    execute(
      { prompt, requestId, save_to_history: false },
      {
        onAck: () => setStatus('Acknowledged — planning your workflow…'),
        onStatus: (data) => setStatus(data.message || data.status),
        onPlan: (data) => {
          setExecutionPlan(data.plan);
          const agentList: Agent[] = data.agents.map((a: any) => ({
            id: '',
            name: a.name,
            role: a.role,
            domain: a.domain,
            tools: a.tools || [],
            status: 'pending',
            output: '',
            reasoning: a.reasoning,
          }));
          setAgents(agentList);
        },
        onAgentCreated: (data) => {
          setAgents((prev) =>
            prev.map((a) => (a.name === data.agent.name ? { ...a, id: data.agent.id } : a))
          );
        },
        onAgentStart: (data) => {
          setAgents((prev) =>
            prev.map((a) => (a.id === data.agent_id ? { ...a, status: 'running' } : a))
          );
          setStatus(`Running agent: ${data.agent_name}`);
        },
        onAgentToken: (data) => {
          setAgents((prev) =>
            prev.map((a) => (a.id === data.agent_id ? { ...a, output: a.output + data.token } : a))
          );
        },
        onAgentDone: (data) => {
          setAgents((prev) =>
            prev.map((a) => (a.id === data.agent_id ? { ...a, status: 'done' } : a))
          );
        },
        onSynthesisToken: () => {
          setStatus('Synthesizing final answer…');
        },
        onDone: (data) => {
          setFinalAnswer(data.final_answer);
          // Single atomic phase change — no overlap
          setPhase('complete');
        },
        onError: (data) => {
          toast({ title: 'Workflow failed', description: data.error, variant: 'destructive' });
          setPhase('error');
        },
      }
    );
  };

  const handleClose = () => {
    resetState();
    setPhase('prompt');
    if (onClose) onClose();
  };

  // Orbit radius responsive to agent count
  const ORBIT_RADIUS = agents.length > 4 ? 200 : 170;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <AnimatePresence mode="wait">

        {/* ── PHASE: prompt ─────────────────────────────────────────────────── */}
        {phase === 'prompt' && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4"
          >
            <ParticleField />

            <motion.div
              initial={{ scale: 0.92, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              className="w-full max-w-xl relative z-10"
            >
              {/* Ambient glow behind card */}
              <div
                className="absolute -inset-8 rounded-3xl pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at 50% 60%, hsl(var(--primary)/0.12), transparent 70%)',
                }}
              />

              <div className="relative bg-background/80 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl p-7 sm:p-9">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.06, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}
                  >
                    <Sparkles className="w-8 h-8 text-white" />
                  </motion.div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-center mb-1 tracking-tight">
                  Autonomous Workflow
                </h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Describe your task — AI spawns specialized agents to solve it in parallel
                </p>

                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleStartWorkflow();
                  }}
                  placeholder="E.g., Research the latest AI trends, analyze them, and write a comprehensive report…"
                  className="min-h-[110px] resize-none text-sm mb-4"
                  autoFocus
                />

                <Button
                  onClick={handleStartWorkflow}
                  disabled={!prompt.trim()}
                  size="lg"
                  className="w-full gap-2 font-semibold"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}
                >
                  Launch Workflow
                  <ArrowRight className="w-4 h-4" />
                </Button>

                {/* Examples */}
                <div className="mt-6 pt-5 border-t border-border/30">
                  <p className="text-xs text-muted-foreground mb-2.5 font-medium">Quick examples</p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      'Research AI trends and create a detailed report',
                      'Analyze competitor pricing and provide strategic insights',
                      'Write a technical blog post about WebSockets with code examples',
                    ].map((ex) => (
                      <button
                        key={ex}
                        onClick={() => setPrompt(ex)}
                        className="text-xs text-left px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border/40"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── PHASE: executing ──────────────────────────────────────────────── */}
        {phase === 'executing' && (
          <motion.div
            key="executing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden"
          >
            <ParticleField />

            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-xl bg-background/60 hover:bg-background/90 border border-border/40 transition-colors z-20"
            >
              <X className="w-4 h-4" />
            </button>

            {/* ── Orbital Visualization ── */}
            <div className="relative flex items-center justify-center" style={{ width: 480, height: 480 }}>

              {/* SVG rings & gradients */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 480 480"
                style={{ overflow: 'visible' }}
              >
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.2" />
                  </linearGradient>
                  <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Soft glow under center */}
                <circle cx="240" cy="240" r="100" fill="url(#coreGlow)" />

                {/* Three orbital rings at different speeds */}
                <motion.g
                  style={{ transformOrigin: '240px 240px' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                >
                  <circle cx="240" cy="240" r={ORBIT_RADIUS} fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5" strokeOpacity="0.2" strokeDasharray="8 14" />
                </motion.g>
                <motion.g
                  style={{ transformOrigin: '240px 240px' }}
                  animate={{ rotate: -360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                >
                  <circle cx="240" cy="240" r={ORBIT_RADIUS - 30} fill="none" stroke="hsl(var(--accent))" strokeWidth="0.5" strokeOpacity="0.15" strokeDasharray="4 8" />
                </motion.g>
                <motion.g
                  style={{ transformOrigin: '240px 240px' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                >
                  <circle cx="240" cy="240" r={ORBIT_RADIUS + 24} fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5" strokeOpacity="0.08" strokeDasharray="2 12" />
                </motion.g>
              </svg>

              {/* Center core */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center px-10">
                {/* Spinning outer ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{
                    background: 'conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))',
                    padding: 2,
                  }}
                >
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                    <Sparkles className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} />
                  </div>
                </motion.div>

                <motion.p
                  key={status}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm font-semibold text-foreground leading-tight max-w-[180px]"
                >
                  {status}
                </motion.p>

                {executionPlan && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] text-muted-foreground mt-1.5 max-w-[160px] leading-snug"
                  >
                    {executionPlan.length > 80 ? executionPlan.slice(0, 80) + '…' : executionPlan}
                  </motion.p>
                )}
              </div>

              {/* Agent nodes orbiting */}
              {agents.map((agent, i) => (
                <AgentNode
                  key={agent.id || `agent-${i}`}
                  agent={agent}
                  index={i}
                  total={agents.length}
                  orbitRadius={ORBIT_RADIUS}
                  orbitAngleOffset={orbitAngle}
                />
              ))}
            </div>

            {/* Agent progress pills below orbit */}
            {agents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-4 flex flex-wrap gap-2 justify-center max-w-md px-4"
              >
                {agents.map((agent, i) => {
                  const palette = AGENT_PALETTES[i % AGENT_PALETTES.length];
                  return (
                    <div
                      key={agent.id || i}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border"
                      style={{
                        borderColor: agent.status === 'running' ? palette.from : 'var(--border)',
                        color: agent.status === 'running' ? palette.from : agent.status === 'done' ? '#10b981' : 'var(--muted-foreground)',
                        background: agent.status === 'running' ? `${palette.glow}18` : 'transparent',
                      }}
                    >
                      {agent.status === 'running' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                      {agent.status === 'done' && <CheckCircle2 className="w-2.5 h-2.5" />}
                      {agent.status === 'pending' && <span className="w-2.5 h-2.5 rounded-full border border-current opacity-40" />}
                      {agent.name}
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* Running agent output preview */}
            {agents.some((a) => a.status === 'running' && a.output) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 mx-4 max-w-lg w-full rounded-xl border border-border/40 bg-muted/40 backdrop-blur px-4 py-3"
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 font-semibold">Live output</p>
                <p className="text-xs text-foreground/70 font-mono leading-relaxed line-clamp-3">
                  {agents.find((a) => a.status === 'running')?.output || ''}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── PHASE: complete ───────────────────────────────────────────────── */}
        {phase === 'complete' && finalAnswer && (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-background/98 backdrop-blur-2xl p-4"
          >
            {/* Close */}
            <button
              onClick={handleClose}
              className="fixed top-4 right-4 p-2 rounded-xl bg-background/60 hover:bg-background/90 border border-border/40 transition-colors z-20"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="max-w-4xl mx-auto py-8">
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="bg-background border border-emerald-500/25 rounded-2xl shadow-2xl p-6 sm:p-8"
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border/30">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shrink-0"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                  >
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-emerald-500">Workflow Complete</h3>
                    <p className="text-sm text-muted-foreground">
                      {agents.length} agent{agents.length !== 1 ? 's' : ''} collaborated · All tasks finished
                    </p>
                  </div>

                  {/* Agent summary chips */}
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

                {/* Result markdown */}
                <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert mb-6
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
                ">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      img: ({ node, ...props }) => (
                        <img
                          {...props}
                          className="rounded-lg shadow-md my-4 mx-auto max-w-full"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ),
                      code: ({ node, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');
                        const inline = !match;
                        return !inline ? (
                          <div className="relative group my-4">
                            {match && (
                              <div className="flex items-center justify-between bg-muted/50 border-b border-border/50 px-4 py-2 rounded-t-lg">
                                <span className="text-xs font-medium text-muted-foreground">{match[1]}</span>
                                <button
                                  onClick={() => handleCopyCode(codeString)}
                                  className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {copiedCode === codeString
                                    ? <><Check className="w-3 h-3" /> Copied</>
                                    : <><Copy className="w-3 h-3" /> Copy</>}
                                </button>
                              </div>
                            )}
                            <pre className={cn('bg-muted border border-border/50 p-4 overflow-x-auto', match ? 'rounded-b-lg' : 'rounded-lg')}>
                              <code className={className} {...props}>{children}</code>
                            </pre>
                          </div>
                        ) : (
                          <code className="text-primary bg-muted px-1.5 py-0.5 rounded text-sm" {...props}>{children}</code>
                        );
                      },
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-4 border border-border/50 rounded-lg">
                          <table className="w-full border-collapse" {...props} />
                        </div>
                      ),
                      a: ({ node, ...props }) => (
                        <a {...props} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" />
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-primary/30 pl-4 py-2 my-4 italic text-foreground/80 bg-muted/30 rounded-r-lg" {...props} />
                      ),
                    }}
                  >
                    {finalAnswer}
                  </ReactMarkdown>
                </div>

                {/* Action */}
                <div className="pt-5 border-t border-border/30">
                  <Button
                    onClick={handleClose}
                    size="lg"
                    className="w-full font-semibold gap-2"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Start New Workflow
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ── PHASE: error ──────────────────────────────────────────────────── */}
        {phase === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4"
          >
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-xl font-bold mb-2">Workflow Failed</h3>
              <p className="text-sm text-muted-foreground mb-6">Something went wrong during execution.</p>
              <Button onClick={handleClose} variant="outline" className="gap-2">
                <ArrowRight className="w-4 h-4" /> Try Again
              </Button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default AutonomousWorkflowInterface;