// Deep Analytics Sidebar - Session History
import { Clock, Brain, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export interface SessionSummary {
  id: string;
  problem: string;
  status: string;
  created_at: string;
  tier: string;
  execution_metrics?: {
    execution_time_ms: number;
  };
}

interface DeepAnalyticsSidebarProps {
  sessions: SessionSummary[];
  currentSessionId?: string;
  onSelectSession: (session: SessionSummary) => void;
  onNewAnalysis: () => void;
  loading?: boolean;
}

export const DeepAnalyticsSidebar = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewAnalysis,
  loading = false
}: DeepAnalyticsSidebarProps) => {
  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Button
          onClick={onNewAnalysis}
          className="w-full gap-2"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          New Analysis
        </Button>
      </div>

      {/* Session List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Brain className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No previous sessions
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Start a new analysis to begin
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session)}
                className={cn(
                  'w-full text-left p-2.5 rounded-lg border transition-all block',
                  currentSessionId === session.id
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border hover:bg-muted/50 hover:border-border/80'
                )}
              >
                <div className="flex items-start gap-2.5 w-full">
                  <div className="mt-0.5 flex-shrink-0">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center',
                        session.status === 'completed'
                          ? 'bg-success/10'
                          : session.status === 'failed'
                          ? 'bg-destructive/10'
                          : 'bg-muted'
                      )}
                    >
                      <Brain
                        className={cn(
                          'w-3.5 h-3.5',
                          session.status === 'completed'
                            ? 'text-success'
                            : session.status === 'failed'
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p 
                      className="text-sm font-medium mb-1 overflow-hidden text-ellipsis whitespace-nowrap"
                      title={session.problem}
                    >
                      {session.problem}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden">
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        <span className="whitespace-nowrap">
                          {formatDistanceToNow(new Date(session.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </span>
                      {session.execution_metrics && (
                        <span className="flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                          • {Math.round(session.execution_metrics.execution_time_ms / 60000)}m
                        </span>
                      )}
                    </div>
                    {session.tier && (
                      <span 
                        className="inline-block mt-1.5 px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-full"
                        title={session.tier}
                      >
                        {session.tier}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
