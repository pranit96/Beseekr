import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Agent } from '@/types/agent';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import useOrchestration from '@/hooks/use-orchestration';
import { Sparkles, Play, Square, Loader2 } from 'lucide-react';

interface AgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent | null;
  onSave: (agent: Agent) => void;
}

export const AgentDialog = ({
  open,
  onOpenChange,
  agent,
  onSave,
}: AgentDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  // Enhance prompt state
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Test agent state
  const [testMessage, setTestMessage] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const testCancelRef = useRef<(() => void) | null>(null);

  const { toast } = useToast();
  const { testAgent, isConnected } = useOrchestration();

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setDescription(agent.description);
      setDomain(agent.domain || '');
      setSystemPrompt(agent.system_prompt || '');
    } else {
      setName('');
      setDescription('');
      setDomain('');
      setSystemPrompt('');
    }
    // Reset test state when switching agents
    setTestOutput('');
    setIsTesting(false);
    setShowTestPanel(false);
    testCancelRef.current = null;
  }, [agent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: agent?.id || `agent-custom-${Date.now()}`,
      name,
      description,
      domain,
      system_prompt: systemPrompt,
      color: agent?.color || 'hsl(var(--primary))',
      is_default: false,
    });
  };

  const handleEnhancePrompt = async () => {
    if (!systemPrompt.trim()) {
      toast({ title: 'No prompt to enhance', description: 'Write a system prompt first.', variant: 'destructive' });
      return;
    }
    if (!agent?.id) {
      toast({ title: 'Save agent first', description: 'Create the agent before enhancing the prompt.', variant: 'destructive' });
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await apiClient.enhanceAgentPrompt(agent.id, {
        current_prompt: systemPrompt,
        description: description || undefined,
      });
      if (response.success && response.data?.enhanced_prompt) {
        setSystemPrompt(response.data.enhanced_prompt);
        toast({ title: 'Prompt enhanced!', description: 'AI has improved your system prompt.' });
      } else {
        throw new Error(response.error || 'Enhancement failed');
      }
    } catch (err: any) {
      toast({ title: 'Enhancement failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleTestAgent = () => {
    if (!agent?.id || !testMessage.trim()) return;
    if (!isConnected()) {
      toast({ title: 'Not connected', description: 'Waiting for socket connection.', variant: 'destructive' });
      return;
    }

    setIsTesting(true);
    setTestOutput('');

    try {
      const control = testAgent(agent.id, testMessage, {
        onToken: (token) => {
          setTestOutput(prev => prev + token);
        },
        onDone: () => {
          setIsTesting(false);
          testCancelRef.current = null;
        },
        onError: (err) => {
          setTestOutput(prev => prev + '\n\n[Error: ' + (err?.error || 'Test failed') + ']');
          setIsTesting(false);
          testCancelRef.current = null;
        },
      });
      testCancelRef.current = control.cancel;
    } catch (err: any) {
      toast({ title: 'Test failed', description: err.message, variant: 'destructive' });
      setIsTesting(false);
    }
  };

  const handleStopTest = () => {
    testCancelRef.current?.();
    setIsTesting(false);
    testCancelRef.current = null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl w-full glass max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">
            {agent ? 'Edit Agent' : 'Create New Agent'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4 px-4 md:px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Agent Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Research Agent"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">
                Domain <span className="text-destructive">*</span>
              </Label>
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g., legal, medical, technical, marketing"
                required
              />
              <p className="text-xs text-muted-foreground">
                Specify the area of expertise for this agent
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="system_prompt">
                Role <span className="text-destructive">*</span>
              </Label>
              {agent?.id && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancing || !systemPrompt.trim()}
                  className="text-xs gap-1.5 h-7 text-primary hover:text-primary"
                >
                  {isEnhancing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
                </Button>
              )}
            </div>
            <Textarea
              id="system_prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Define the agent's behavior, expertise, and how it should respond to users..."
              rows={6}
              required
            />
            <p className="text-xs text-muted-foreground">
              This defines how the agent will behave and respond to queries
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this agent does..."
              rows={3}
            />
          </div>

          {/* Test Agent Panel */}
          {agent?.id && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTestPanel(!showTestPanel)}
                className="text-xs gap-1.5"
              >
                <Play className="w-3 h-3" />
                {showTestPanel ? 'Hide Test Panel' : 'Test Agent'}
              </Button>

              {showTestPanel && (
                <div className="border border-border rounded-lg p-3 space-y-3 bg-muted/30">
                  <div className="flex gap-2">
                    <Input
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      placeholder="Type a test message..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleTestAgent();
                        }
                      }}
                      disabled={isTesting}
                    />
                    {isTesting ? (
                      <Button type="button" variant="destructive" size="icon" onClick={handleStopTest} className="shrink-0">
                        <Square className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="icon"
                        onClick={handleTestAgent}
                        disabled={!testMessage.trim()}
                        className="shrink-0"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {(testOutput || isTesting) && (
                    <div className="bg-background rounded-md p-3 text-sm max-h-[200px] overflow-y-auto font-mono whitespace-pre-wrap">
                      {testOutput || (
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" /> Generating...
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {agent ? 'Update Agent' : 'Create Agent'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};