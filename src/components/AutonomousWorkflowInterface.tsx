// src/components/AutonomousWorkflowInterface.tsx
// Autonomous workflow UI - shows agents running in circle with real-time updates

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, CheckCircle2, AlertCircle, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import useAutonomousWorkflow from '@/hooks/use-autonomous-workflow';
import { createLogger } from '@/services/logging';
import ReactMarkdown from 'react-markdown';

const logger = createLogger('AutonomousWorkflow');

interface Agent {
  id: string;
  name: string;
  role: string;
  domain: string;
  tools: string[];
  status: 'pending' | 'running' | 'done' | 'error';
  output: string;
}

interface ToolExecution {
  agent_id: string;
  tool_name: string;
  call_id: string;
  status: 'running' | 'success' | 'error';
}

export const AutonomousWorkflowInterface: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [executionPlan, setExecutionPlan] = useState<string>('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [toolExecutions, setToolExecutions] = useState<ToolExecution[]>([]);
  const [finalAnswer, setFinalAnswer] = useState<string>('');
  const [synthesisOutput, setSynthesisOutput] = useState<string>('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const requestIdRef = useRef<string>('');
  const { toast } = useToast();
  const { execute } = useAutonomousWorkflow();

  useEffect(() => {
    if (!isExecuting && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExecuting]);

  const handleExecute = () => {
    if (!prompt.trim() || isExecuting) return;

    const requestId = `auto_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    requestIdRef.current = requestId;

    // Reset state
    setIsExecuting(true);
    setStatus('Initializing...');
    setExecutionPlan('');
    setAgents([]);
    setToolExecutions([]);
    setFinalAnswer('');
    setSynthesisOutput('');
    setIsSynthesizing(false);

    // Setup listeners
    const onAck = (data: any) => {
      if (data.requestId === requestId) {
        logger.info('Workflow acknowledged');
      }
    };

    const onStatus = (data: any) => {
      if (data.requestId === requestId) {
        setStatus(data.message || data.status);
      }
    };

    const onPlan = (data: any) => {
      if (data.requestId === requestId) {
        setExecutionPlan(data.plan);
        const agentList: Agent[] = data.agents.map((a: any) => ({
          id: '',
          name: a.name,
          role: a.role,
          domain: a.domain,
          tools: a.tools || [],
          status: 'pending',
          output: '',
        }));
        setAgents(agentList);
      }
    };

    const onAgentCreated = (data: any) => {
      if (data.requestId === requestId) {
        setAgents(prev => prev.map(a => 
          a.name === data.agent.name ? { ...a, id: data.agent.id } : a
        ));
      }
    };

    const onAgentStart = (data: any) => {
      if (data.requestId === requestId) {
        setAgents(prev => prev.map(a =>
          a.id === data.agent_id ? { ...a, status: 'running' } : a
        ));
        setStatus(`Running ${data.agent_name}... (${data.step}/${data.total})`);
      }
    };

    const onAgentToken = (data: any) => {
      if (data.requestId === requestId) {
        setAgents(prev => prev.map(a =>
          a.id === data.agent_id ? { ...a, output: a.output + data.token } : a
        ));
      }
    };

    const onAgentDone = (data: any) => {
      if (data.requestId === requestId) {
        setAgents(prev => prev.map(a =>
          a.id === data.agent_id ? { ...a, status: 'done' } : a
        ));
      }
    };

    const onToolStart = (data: any) => {
      if (data.requestId === requestId) {
        setToolExecutions(prev => [...prev, {
          agent_id: data.agent_id,
          tool_name: data.tool_name,
          call_id: data.call_id,
          status: 'running',
        }]);
      }
    };

    const onToolResult = (data: any) => {
      if (data.requestId === requestId) {
        setToolExecutions(prev => prev.map(t =>
          t.call_id === data.call_id ? { ...t, status: data.success ? 'success' : 'error' } : t
        ));
      }
    };

    const onSynthesisToken = (data: any) => {
      if (data.requestId === requestId) {
        setIsSynthesizing(true);
        setSynthesisOutput(prev => prev + data.token);
      }
    };

    const onDone = (data: any) => {
      if (data.requestId === requestId) {
        setFinalAnswer(data.final_answer);
        setStatus('Complete!');
        setIsExecuting(false);
        setIsSynthesizing(false);
      }
    };

    const onError = (data: any) => {
      if (data.requestId === requestId) {
        toast({ title: 'Workflow failed', description: data.error, variant: 'destructive' });
        setStatus('Failed');
        setIsExecuting(false);
        setIsSynthesizing(false);
      }
    };

    // Execute workflow
    execute(
      {
        prompt,
        requestId,
        save_to_history: true,
      },
      {
        onAck,
        onStatus,
        onPlan,
        onAgentCreated,
        onAgentStart,
        onAgentToken,
        onAgentDone,
        onToolStart,
        onToolResult,
        onSynthesisToken,
        onDone,
        onError,
      }
    );
  };

  const getAgentColor = (index: number) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-amber-500 to-orange-500',
      'from-green-500 to-emerald-500',
      'from-rose-500 to-red-500',
      'from-indigo-500 to-violet-500',
    ];
    return colors[index % colors.length];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'done':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-muted" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Input Area */}
      <div className="flex-shrink-0 border-b border-border/30 bg-background/80 backdrop-blur-md p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Autonomous Workflow</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Describe your task and AI will automatically create specialized agents to solve it
          </p>
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleExecute();
                }
              }}
              placeholder="E.g., Research the latest AI trends, analyze them, and create a comprehensive report..."
              className="flex-1 min-h-[80px]"
              disabled={isExecuting}
            />
            <Button
              onClick={handleExecute}
              disabled={!prompt.trim() || isExecuting}
              className="self-end"
            >
              {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          {status && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              {isExecuting && <Loader2 className="w-3 h-3 animate-spin" />}
              {status}
            </div>
          )}
        </div>
      </div>

      {/* Workflow Visualization */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Execution Plan */}
          {executionPlan && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Execution Plan
              </h3>
              <p className="text-sm text-muted-foreground">{executionPlan}</p>
            </div>
          )}

          {/* Agents Circle */}
          {agents.length > 0 && (
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent, index) => (
                  <div
                    key={agent.id || index}
                    className={`relative border rounded-lg p-4 transition-all ${
                      agent.status === 'running'
                        ? 'border-primary shadow-lg scale-105'
                        : agent.status === 'done'
                        ? 'border-green-500/50'
                        : 'border-border'
                    }`}
                  >
                    {/* Agent Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAgentColor(index)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm truncate">{agent.name}</h4>
                          {getStatusIcon(agent.status)}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{agent.role}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {agent.domain}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tools */}
                    {agent.tools.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {agent.tools.map((tool) => (
                          <span key={tool} className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary flex items-center gap-1">
                            <Wrench className="w-2.5 h-2.5" />
                            {tool.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Output */}
                    {agent.output && (
                      <div className="bg-muted/30 rounded p-2 text-xs max-h-32 overflow-y-auto">
                        <ReactMarkdown className="prose prose-sm max-w-none">
                          {agent.output}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* Tool Executions for this agent */}
                    {toolExecutions.filter(t => t.agent_id === agent.id).length > 0 && (
                      <div className="mt-2 space-y-1">
                        {toolExecutions.filter(t => t.agent_id === agent.id).map((tool) => (
                          <div key={tool.call_id} className="text-[10px] flex items-center gap-1 text-muted-foreground">
                            {tool.status === 'running' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                            {tool.status === 'success' && <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />}
                            {tool.status === 'error' && <AlertCircle className="w-2.5 h-2.5 text-destructive" />}
                            {tool.tool_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Synthesis Phase */}
          {isSynthesizing && (
            <div className="border border-primary/30 rounded-lg p-4 bg-primary/5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                Synthesizing Final Answer...
              </h3>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{synthesisOutput}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Final Answer */}
          {finalAnswer && !isExecuting && (
            <div className="border border-green-500/30 rounded-lg p-6 bg-green-500/5">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Final Answer
              </h3>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{finalAnswer}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
