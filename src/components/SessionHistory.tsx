// src/components/SessionHistory.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Clock, FileText, Brain } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { createLogger } from '@/services/logging';

const logger = createLogger('SessionHistory');
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Session summary from list endpoint (doesn't include full content)
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

// File metadata interface
export interface SessionFile {
  id: string;
  filename: string;
  content_type: string;
  file_size: number;
  created_at?: string;
}

// Full session from detail endpoint
export interface FullSession extends SessionSummary {
  final_solution: {
    content: string;
    format: string;
  };
  context?: string;
  files?: SessionFile[];
  thinking_ideations: Array<{
    role: string;
    domain: string;
    content: string;
    quality_score: number;
  }>;
}

interface SessionHistoryProps {
  onSelectSession: (session: SessionSummary) => void;
  currentSessionId?: string;
}

export const SessionHistory = ({
  onSelectSession,
  currentSessionId
}: SessionHistoryProps) => {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/thinkers/sessions?limit=10`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch sessions');

      const data = await response.json();
      const sessionList = data.data?.sessions || data.sessions || [];
      setSessions(sessionList);
    } catch (error) {
      logger.error('Failed to fetch sessions', { error });
      toast({
        title: 'Error',
        description: 'Failed to load session history',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (session: SessionSummary) => {
    if (session.status !== 'completed') {
      toast({
        title: 'Session not ready',
        description: 'This session is still processing or failed',
        variant: 'destructive'
      });
      return;
    }
    onSelectSession(session);
  };

  if (loading) {
    return (
      <Card className="p-4 shadow-lg border-border/50">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 shadow-lg border-border/50 bg-background">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Recent Sessions
        </h3>
        {sessions.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No previous sessions found
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
          {sessions.map(session => (
            <button
              key={session.id}
              className={`w-full text-left p-3 rounded-lg border transition-all ${currentSessionId === session.id
                ? 'border-primary bg-primary/10 shadow-sm'
                : 'border-border hover:bg-muted/50 hover:border-border/80'
                }`}
              onClick={() => handleSelect(session)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${session.status === 'completed'
                    ? 'bg-success/10'
                    : 'bg-muted'
                    }`}>
                    <Brain className={`w-4 h-4 ${session.status === 'completed' ? 'text-success' : 'text-muted-foreground'
                      }`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2 mb-1">
                    {session.problem}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                    </span>
                    {session.execution_metrics && (
                      <span className="flex items-center gap-1">
                        • {Math.round(session.execution_metrics.execution_time_ms / 1000)}s
                      </span>
                    )}
                  </div>
                  {session.tier && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                      {session.tier}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
};