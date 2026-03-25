// src/components/AutonomousWorkflowInterface.tsx
// Redesigned autonomous workflow with circular animation and dialog flow

import React, { useState } from 'react';
import { X, Sparkles, Loader2, CheckCircle2, AlertCircle, Send, ArrowRight, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import useAutonomousWorkflow from '@/hooks/use-autonomous-workflow';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

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

export const AutonomousWorkflowInterface: React.FC = () => {
  const [showPromptDialog, setShowPromptDialog] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [executionPlan, setExecutionPlan] = useState<string>('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [finalAnswer, setFinalAnswer] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { toast } = useToast();
  const { execute } = useAutonomousWorkflow();

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleStartWorkflow = () => {
    if (!prompt.trim()) {
      toast({ title: 'Prompt required', description: 'Please enter a prompt to start the workflow', variant: 'destructive' });
      return;
    }

    setShowPromptDialog(false);
    setIsExecuting(true);

    const requestId = `wf_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    execute(
      { prompt, requestId, save_to_history: false },
      {
        onAck: () => setStatus('Acknowledged'),
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
          setAgents(prev => prev.map(a =>
            a.name === data.agent.name ? { ...a, id: data.agent.id } : a
          ));
        },
        onAgentStart: (data) => {
          setAgents(prev => prev.map(a =>
            a.id === data.agent_id ? { ...a, status: 'running' } : a
          ));
          setStatus(`Running ${data.agent_name}...`);
        },
        onAgentToken: (data) => {
          setAgents(prev => prev.map(a =>
            a.id === data.agent_id ? { ...a, output: a.output + data.token } : a
          ));
        },
        onAgentDone: (data) => {
          setAgents(prev => prev.map(a =>
            a.id === data.agent_id ? { ...a, status: 'done' } : a
          ));
        },
        onSynthesisToken: (data) => {
          setStatus('Synthesizing final answer...');
        },
        onDone: (data) => {
          setFinalAnswer(data.final_answer);
          setStatus('Complete!');
          setIsComplete(true);
          setIsExecuting(false);
        },
        onError: (data) => {
          toast({ title: 'Workflow failed', description: data.error, variant: 'destructive' });
          setStatus('Failed');
          setHasError(true);
          setIsExecuting(false);
        },
      }
    );
  };

  const handleClose = () => {
    setShowPromptDialog(true);
    setPrompt('');
    setIsExecuting(false);
    setStatus('');
    setExecutionPlan('');
    setAgents([]);
    setFinalAnswer('');
    setIsComplete(false);
    setHasError(false);
  };

  const getAgentColor = (index: number) => {
    const colors = [
      'from-violet-500 to-purple-600',
      'from-cyan-500 to-blue-500',
      'from-amber-500 to-orange-500',
      'from-green-500 to-emerald-500',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <AnimatePresence mode="wait">
        {/* Prompt Dialog */}
        {showPromptDialog && !isExecuting && !isComplete && (
          <motion.div
            key="prompt-dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl"
            >
              <div className="bg-background border border-border/50 rounded-2xl shadow-2xl p-6 sm:p-8">
                {/* Header */}
                <div className="text-center mb-6">
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg mb-4"
                  >
                    <Sparkles className="w-8 h-8 text-white" />
                  </motion.div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">Autonomous Workflow</h2>
                  <p className="text-sm text-muted-foreground">
                    Describe your task and AI will automatically create specialized agents to solve it
                  </p>
                </div>

                {/* Prompt Input */}
                <div className="space-y-4">
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., Research the latest AI trends, analyze them, and create a comprehensive report..."
                    className="min-h-[120px] resize-none text-sm"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <Button
                      onClick={handleStartWorkflow}
                      disabled={!prompt.trim()}
                      className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 gap-2"
                      size="lg"
                    >
                      Start Workflow
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Examples */}
                <div className="mt-6 pt-6 border-t border-border/30">
                  <p className="text-xs text-muted-foreground mb-3">Try these examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Research AI trends and create a report',
                      'Analyze market data and provide insights',
                      'Write a technical blog post about React',
                    ].map((example) => (
                      <button
                        key={example}
                        onClick={() => setPrompt(example)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Circular Loading Animation */}
        {isExecuting && !isComplete && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/98 backdrop-blur-2xl p-4"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-xl bg-background/50 hover:bg-background/80 border border-border/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-full max-w-4xl">
              {/* Circular Agent Visualization */}
              <div className="relative w-full aspect-square max-w-[500px] mx-auto mb-8">
                {/* Center Status */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl mb-4"
                  >
                    <Sparkles className="w-10 h-10 text-white" />
                  </motion.div>
                  <p className="text-sm font-medium text-center px-4">{status}</p>
                  {executionPlan && (
                    <p className="text-xs text-muted-foreground text-center px-8 mt-2 max-w-md">
                      {executionPlan}
                    </p>
                  )}
                </div>

                {/* Agents in Circle */}
                {agents.map((agent, index) => {
                  const angle = (index / agents.length) * 2 * Math.PI - Math.PI / 2;
                  const radius = 180;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;

                  return (
                    <motion.div
                      key={agent.id || index}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.2 }}
                      className="absolute top-1/2 left-1/2"
                      style={{
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      }}
                    >
                      <motion.div
                        animate={agent.status === 'running' ? {
                          scale: [1, 1.2, 1],
                          boxShadow: [
                            '0 0 0 0 rgba(var(--primary), 0)',
                            '0 0 0 20px rgba(var(--primary), 0.1)',
                            '0 0 0 0 rgba(var(--primary), 0)',
                          ],
                        } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className={cn(
                          'w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg relative',
                          `bg-gradient-to-br ${getAgentColor(index)}`
                        )}
                      >
                        {agent.status === 'done' && (
                          <CheckCircle2 className="w-8 h-8 absolute inset-0 m-auto" />
                        )}
                        {agent.status === 'running' && (
                          <Loader2 className="w-8 h-8 absolute inset-0 m-auto animate-spin" />
                        )}
                        {agent.status === 'pending' && (
                          <span>{index + 1}</span>
                        )}
                        {agent.status === 'error' && (
                          <AlertCircle className="w-8 h-8 absolute inset-0 m-auto" />
                        )}
                      </motion.div>
                      <p className="text-[10px] font-medium text-center mt-2 max-w-[80px]">
                        {agent.name}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Result Screen */}
        {isComplete && finalAnswer && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-background/98 backdrop-blur-2xl p-4"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="fixed top-4 right-4 p-2 rounded-xl bg-background/50 hover:bg-background/80 border border-border/50 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="max-w-4xl mx-auto py-8">
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-background border border-green-500/30 rounded-2xl shadow-2xl p-6 sm:p-8"
              >
                {/* Success Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-green-600 dark:text-green-400">
                      Workflow Complete!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {agents.length} agents collaborated to solve your task
                    </p>
                  </div>
                </div>

                {/* Result Content */}
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
                  prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4 prose-ul:text-foreground/90
                  prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4 prose-ol:text-foreground/90
                  prose-li:mb-1 prose-li:text-foreground/90
                  prose-table:w-full prose-table:border-collapse prose-table:my-4
                  prose-thead:border-b-2 prose-thead:border-border
                  prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-foreground
                  prose-td:px-4 prose-td:py-2 prose-td:border-t prose-td:border-border/50 prose-td:text-foreground/90
                  prose-img:rounded-lg prose-img:shadow-md prose-img:my-4 prose-img:mx-auto prose-img:max-w-full
                  prose-hr:border-border/50 prose-hr:my-6
                ">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      // Custom image rendering with loading and error handling
                      img: ({ node, ...props }) => (
                        <img
                          {...props}
                          className="rounded-lg shadow-md my-4 mx-auto max-w-full"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ),
                      // Custom code block rendering with copy button
                      code: ({ node, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');
                        const inline = !match;
                        
                        return !inline ? (
                          <div className="relative group my-4">
                            {match && (
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
                                      <Check className="w-3 h-3" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      Copy
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                            <pre className={cn(
                              "bg-muted border border-border/50 p-4 overflow-x-auto",
                              match ? "rounded-b-lg" : "rounded-lg"
                            )}>
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          </div>
                        ) : (
                          <code className="text-primary bg-muted px-1.5 py-0.5 rounded text-sm" {...props}>
                            {children}
                          </code>
                        );
                      },
                      // Custom table rendering
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-4 border border-border/50 rounded-lg">
                          <table className="w-full border-collapse" {...props} />
                        </div>
                      ),
                      // Custom link rendering
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          className="text-primary hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      ),
                      // Custom blockquote rendering
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

                {/* Actions */}
                <div className="flex gap-3 pt-6 border-t border-border/30">
                  <Button
                    onClick={handleClose}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90"
                    size="lg"
                  >
                    Start New Workflow
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AutonomousWorkflowInterface;
