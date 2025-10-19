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
      // ✅ FIX: Handle the correct response structure
      setSessions(data.sessions || []);
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
      <Card className="p-4">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-medium mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Recent Sessions
      </h3>
      
      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No previous sessions found
        </p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {sessions.map(session => (
            <div
              key={session.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                currentSessionId === session.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
              onClick={() => handleSelect(session)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Brain className={`w-4 h-4 ${
                    session.status === 'completed' ? 'text-success' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session.problem.substring(0, 60)}...
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>
                      {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                    </span>
                    {session.execution_metrics && (
                      <span>• {Math.round(session.execution_metrics.execution_time_ms / 1000)}s</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};