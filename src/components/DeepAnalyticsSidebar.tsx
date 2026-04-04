// Deep Analytics Sidebar - Session History
import React from "react";
import {
  Clock,
  Brain,
  Plus,
  Loader2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export interface SessionSummary {
  id: string;
  problem?: string | null;
  status: string;
  created_at: string;
  tier: string;
  execution_metrics?: {
    execution_time_ms: number;
  };
}

// Helper to extract a readable session name from problem text
const getSessionName = (problem: string | undefined | null): string => {
  if (!problem || typeof problem !== "string") return "Untitled Session";

  const trimmed = problem.trim();
  if (!trimmed) return "Untitled Session";

  // Try to extract first meaningful line (skip flowchart syntax)
  const lines = trimmed.split("\n").filter((line) => {
    const lineTrimmed = line.trim();
    return (
      lineTrimmed &&
      !lineTrimmed.startsWith("flowchart") &&
      !lineTrimmed.startsWith("%%") &&
      !lineTrimmed.startsWith("subgraph") &&
      !lineTrimmed.startsWith("classDef") &&
      !lineTrimmed.startsWith("class ") &&
      !lineTrimmed.includes("-->") &&
      !lineTrimmed.includes("==>") &&
      !lineTrimmed.match(/^\w+\[/) && // Skip node definitions like "A[text]"
      lineTrimmed.length > 10
    );
  });

  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // Remove any remaining markdown or special chars
    const cleaned = firstLine.replace(/[#*`]/g, "").trim();
    return cleaned.substring(0, 60);
  }

  // Fallback: use first 60 chars, clean up
  const cleaned = trimmed.replace(/[#*`]/g, "").substring(0, 60).trim();
  return cleaned || "Untitled Session";
};

interface DeepAnalyticsSidebarProps {
  sessions: SessionSummary[];
  currentSessionId?: string;
  onSelectSession: (session: SessionSummary) => void;
  onNewAnalysis: () => void;
  onDeleteSession?: (sessionId: string, erase: boolean) => void;
  loading?: boolean;
}

export const DeepAnalyticsSidebar = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewAnalysis,
  onDeleteSession,
  loading = false,
}: DeepAnalyticsSidebarProps) => {
  const [showDeleteMenu, setShowDeleteMenu] = React.useState<string | null>(
    null,
  );

  const handleDelete = (
    sessionId: string,
    erase: boolean,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (onDeleteSession) {
      onDeleteSession(sessionId, erase);
    }
    setShowDeleteMenu(null);
  };

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Button onClick={onNewAnalysis} className="w-full gap-2" size="sm">
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
              <div key={session.id} className="relative group">
                <button
                  onClick={() => onSelectSession(session)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-lg border transition-all block",
                    currentSessionId === session.id
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:bg-muted/50 hover:border-border/80",
                  )}
                >
                  <div className="flex items-start gap-2.5 w-full">
                    <div className="mt-0.5 flex-shrink-0">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center",
                          session.status === "completed"
                            ? "bg-success/10"
                            : session.status === "failed"
                              ? "bg-destructive/10"
                              : "bg-muted",
                        )}
                      >
                        <Brain
                          className={cn(
                            "w-3.5 h-3.5",
                            session.status === "completed"
                              ? "text-success"
                              : session.status === "failed"
                                ? "text-destructive"
                                : "text-muted-foreground",
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden pr-8">
                      <p
                        className="text-sm font-medium mb-1 overflow-hidden text-ellipsis whitespace-nowrap"
                        title={getSessionName(session.problem)}
                      >
                        {getSessionName(session.problem)}
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
                            •{" "}
                            {Math.round(
                              session.execution_metrics.execution_time_ms /
                                60000,
                            )}
                            m
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

                {/* Delete button - shows on hover */}
                {onDeleteSession && (
                  <div className="absolute top-2 right-2">
                    {showDeleteMenu === session.id ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteMenu(null);
                        }}
                      >
                        <span className="text-sm">×</span>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteMenu(session.id);
                        }}
                      >
                        <span className="text-sm">⋮</span>
                      </Button>
                    )}

                    {/* Delete menu */}
                    {showDeleteMenu === session.id && (
                      <div
                        className="absolute right-0 top-8 z-50 w-56 bg-background border rounded-lg shadow-lg p-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-xs text-muted-foreground mb-2 px-2">
                          Delete this session?
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs h-8 mb-1"
                          onClick={(e) => handleDelete(session.id, false, e)}
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Standard Delete
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs h-8 text-destructive hover:text-destructive"
                          onClick={(e) => handleDelete(session.id, true, e)}
                        >
                          <AlertTriangle className="w-3 h-3 mr-2" />
                          Complete Erasure (GDPR)
                        </Button>
                        <div className="text-xs text-muted-foreground/70 mt-2 px-2 pt-2 border-t">
                          Standard keeps audit trail. Erasure removes all data.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
