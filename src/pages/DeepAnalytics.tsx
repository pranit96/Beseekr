import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, FileText, X, Brain, Check, Loader2, FileDown, Target,
  Globe, Database, Eye, Wifi, WifiOff, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { TopBar } from '@/components/TopBar';
import { useToast } from '@/hooks/use-toast';
import MarkdownRenderer from '@/components/messages/MarkdownRenderer';
import { useDownload } from '@/hooks/use-download';
import { SessionSummary, FullSession } from '@/components/SessionHistory';
import { DeepAnalyticsSidebar } from '@/components/DeepAnalyticsSidebar';
import { createLogger } from '@/services/logging';
import { apiClient } from '@/lib/api';
import { useSessionDetails, useSessions } from '@/hooks/use-api-queries';
import { useQueryClient } from '@tanstack/react-query';
import { useDeepAnalyticsSocket } from '@/hooks/use-deep-analytics-socket';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const logger = createLogger('DeepAnalytics');
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface SessionFile {
  id: string;
  filename: string;
  file_size: number;
  content_type: string;
}

// 🔥 REAL STAGE LABELS — matches your backend stages exactly
const STAGE_LABELS: Record<string, string> = {
  initializing: 'Initializing analysis...',
  file_processing: 'Processing uploaded files...',
  rag_indexing: 'Building knowledge index...',
  context_building: 'Analyzing context...',
  analysis: 'Performing deep analysis...',
  agent_selection: 'Selecting specialist agents...',
  ideation: 'Generating strategic insights...',
  synthesis: 'Synthesizing final report...',
  complete: 'Analysis complete'
};

const DeepAnalytics = () => {
  // Auth check
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([]);
  const [problem, setProblem] = useState('');
  const [context, setContext] = useState('');
  const [uploading, setUploading] = useState(false);

  // UI state
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [fileContent, setFileContent] = useState<{ [fileId: string]: string }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { downloadFile, isConverting } = useDownload();
  const queryClient = useQueryClient();

  // Socket integration (don't auto-connect, only connect when needed)
  const {
    socketState,
    isConnected,
    sessionState,
    isProcessing,
    isCompleted,
    progress,
    stage,
    stageLabel,
    result: socketResult,
    error: socketError,
    subscribeToSession,
    unsubscribeFromSession,
    cancelSession,
  } = useDeepAnalyticsSocket({ autoConnect: false });

  // Fetch session details for preview
  const { data: sessionData, isLoading: isLoadingSession, error: sessionError } = useSessionDetails(currentSessionId || '');

  // Fetch sessions list for sidebar
  const { data: sessionsResponse, isLoading: loadingSessions } = useSessions({ limit: 20 });
  const sessions = sessionsResponse?.data?.sessions || [];

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      logger.warn('User not authenticated, redirecting to auth', {
        hasCookies: document.cookie.length > 0,
        cookieNames: document.cookie.split(';').map(c => c.split('=')[0].trim())
      });
      toast({
        title: 'Authentication Required',
        description: 'Please log in to use Deep Analytics',
        variant: 'destructive',
      });
      navigate('/auth');
    } else if (user) {
      logger.info('User authenticated', {
        userId: user.id,
        email: user.email,
        hasCookies: document.cookie.length > 0
      });
    }
  }, [user, authLoading, navigate, toast]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  const result: FullSession | null = sessionData?.success && sessionData.data ? {
    id: sessionData.data.id,
    problem: sessionData.data.problem,
    status: sessionData.data.status,
    created_at: sessionData.data.created_at || new Date().toISOString(),
    tier: sessionData.data.tier,
    context: sessionData.data.context || undefined,
    final_solution: {
      content: sessionData.data.final_solution || '',
      format: sessionData.data.output_format || 'markdown'
    },
    files: sessionData.data.files || [],
    thinking_ideations: sessionData.data.thinking_ideations || [],
    execution_metrics: sessionData.data.execution_metrics
  } : null;

  const showResult = (!!result && !isProcessing) || (isCompleted && socketResult);

  // Load sidebar state from sessionStorage
  useEffect(() => {
    const savedSidebarState = sessionStorage.getItem('deepAnalyticsSidebarOpen');
    if (savedSidebarState !== null) {
      setSidebarOpen(savedSidebarState === 'true');
    }
  }, []);

  // Save sidebar state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('deepAnalyticsSidebarOpen', sidebarOpen.toString());
  }, [sidebarOpen]);

  // Keyboard shortcut for sidebar toggle (Ctrl/Cmd + B)
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, []);

  // Load persisted session on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem('deepAnalytics_lastSessionId');
    const savedProblem = localStorage.getItem('deepAnalytics_lastProblem');
    const savedContext = localStorage.getItem('deepAnalytics_lastContext');
    const savedFiles = localStorage.getItem('deepAnalytics_lastFiles');

    if (savedSessionId) {
      setCurrentSessionId(savedSessionId);
      setIsPreviewing(true);
      logger.info('Restored previous session for preview', { sessionId: savedSessionId });
    }

    if (savedProblem) setProblem(savedProblem);
    if (savedContext) setContext(savedContext);
    if (savedFiles) {
      try {
        const parsedFiles = JSON.parse(savedFiles);
        setFiles(parsedFiles.files || []);
        setUploadedFileIds(parsedFiles.ids || []);
      } catch (error) {
        logger.error('Failed to restore files', { error });
      }
    }
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Send notification when complete
  useEffect(() => {
    if (isCompleted && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Deep Analysis Complete', {
        body: 'Your strategic report is ready to view',
        icon: '/favicon.svg',
        tag: 'deep-analytics-complete'
      });
    }
  }, [isCompleted]);

  // Handle socket errors
  useEffect(() => {
    if (socketError) {
      logger.error('Socket error received', { code: socketError.code, message: socketError.message });

      if (socketError.code === 'AUTH_FAILED') {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to use Deep Analytics',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Analysis Error',
        description: socketError.message,
        variant: 'destructive',
      });

      if (socketError.code === 'RATE_LIMIT_EXCEEDED' && socketError.retryAfter) {
        toast({
          title: 'Rate Limit Exceeded',
          description: `Please wait ${socketError.retryAfter} seconds before trying again`,
          variant: 'destructive',
        });
      }
    }
  }, [socketError, toast]);

  // Handle session fetch errors
  useEffect(() => {
    if (sessionError) {
      const errorMessage = (sessionError as any)?.message || 'Unknown error';
      if (errorMessage.includes('coerce') || errorMessage.includes('Cannot coerce')) {
        logger.error('Backend database error fetching session', {
          sessionId: currentSessionId,
          error: errorMessage
        });
        logger.warn('⚠️ Backend needs to fix database query - see BACKEND_AUTH_FIX.md');
      } else {
        logger.error('Failed to fetch session details', { error: errorMessage });
        toast({
          title: 'Could not load session',
          description: 'Unable to fetch session details. The analysis may still be running.',
          variant: 'default',
        });
      }
    }
  }, [sessionError, currentSessionId, toast]);

  // FILE HANDLING
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const existingNames = new Set(files.map(f => f.name));
    const newFiles = selectedFiles.filter(file => !existingNames.has(file.name));

    if (newFiles.length === 0) {
      toast({ title: 'Duplicate files', description: 'All selected files are already uploaded.', variant: 'destructive' });
      return;
    }

    if (files.length + newFiles.length > 50) {
      toast({ title: 'Limit reached', description: 'Max 50 files allowed', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      newFiles.forEach(file => formData.append('files', file));

      const response = await fetch(`${API_BASE_URL}/api/thinkers/files/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      const uploadedFiles = data.data?.uploaded || [];

      if (uploadedFiles.length > 0) {
        const frontendFiles = uploadedFiles.map((file: any, index: number) => ({
          id: file.id,
          name: file.filename || file.existing_filename || newFiles[index]?.name || 'unknown',
          size: file.file_size || newFiles[index]?.size || 0,
          type: file.content_type || newFiles[index]?.type || 'unknown'
        }));

        setFiles(prev => [...prev, ...frontendFiles]);
        setUploadedFileIds(prev => [...prev, ...uploadedFiles.map((f: any) => f.id)]);
        toast({
          title: 'Files uploaded',
          description: `${uploadedFiles.length} file(s) uploaded successfully`,
        });
      } else {
        throw new Error('No files returned from server');
      }
    } catch (error: any) {
      logger.error('File upload failed', { error: error.message, fileCount: newFiles.length });
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setUploadedFileIds(prev => prev.filter(fid => fid !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // EXECUTION
  const handleExecute = async () => {
    if (!problem.trim() || problem.length < 20) {
      toast({ title: 'Add more detail', description: 'At least 20 characters required', variant: 'destructive' });
      return;
    }

    setCurrentSessionId(null);
    setIsPreviewing(false);
    setFileContent({});

    try {
      logger.info('Queueing analysis', { problemLength: problem.length, filesCount: uploadedFileIds.length });

      const response = await apiClient.queueAnalysis({
        problem: problem.trim(),
        context: context.trim() || undefined,
        files: uploadedFileIds.length > 0 ? uploadedFileIds : undefined,
        output_format: 'markdown',
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to queue analysis');
      }

      const data = response.data || (response as any);
      const sessionId = data.sessionId || data.id;

      if (!sessionId) {
        throw new Error('Backend returned success but no sessionId.');
      }

      logger.info('Analysis queued successfully', { sessionId });

      setCurrentSessionId(sessionId);

      localStorage.setItem('deepAnalytics_lastSessionId', sessionId);
      localStorage.setItem('deepAnalytics_lastProblem', problem);
      localStorage.setItem('deepAnalytics_lastContext', context);
      localStorage.setItem('deepAnalytics_lastFiles', JSON.stringify({
        files,
        ids: uploadedFileIds
      }));

      // ✅ FIXED: Only pass sessionId — no jobId!
      await subscribeToSession(sessionId);

      queryClient.invalidateQueries({ queryKey: ['sessions'] });

      toast({
        title: 'Analysis started',
        description: 'Your analysis has been queued and will begin shortly',
      });
    } catch (error: any) {
      logger.error('Failed to queue analysis', { error: error.message });
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    }
  };

  // CANCEL EXECUTION
  const handleCancel = () => {
    logger.info('Cancelling analysis');
    cancelSession();
    unsubscribeFromSession();

    toast({
      title: 'Cancelled',
      description: 'Analysis has been cancelled',
    });
  };

  // FETCH FILE CONTENT
  const fetchFileContent = async (sessionId: string, fileId: string) => {
    if (fileContent[fileId]) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/thinkers/sessions/${sessionId}/files/${fileId}/content`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch file');

      const data = await response.json();
      if (data.success) {
        setFileContent(prev => ({
          ...prev,
          [fileId]: data.data.content
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch file');
      }
    } catch (error) {
      logger.error('Failed to fetch file content', { sessionId, fileId, error });
      toast({
        title: 'Error',
        description: 'Failed to load file content',
        variant: 'destructive'
      });
    }
  };

  // SESSION HISTORY HANDLING
  const handleSelectSession = async (sessionSummary: SessionSummary) => {
    if (sessionSummary.status !== 'completed') {
      toast({
        title: 'Session not ready',
        description: 'This session is still processing or failed',
        variant: 'destructive'
      });
      return;
    }

    setCurrentSessionId(sessionSummary.id);
    setIsPreviewing(true);
    setFileContent({});
    localStorage.setItem('deepAnalytics_lastSessionId', sessionSummary.id);

    toast({
      title: 'Session loaded',
      description: 'Historical session loaded successfully',
    });
  };

  // NEW ANALYSIS HANDLER
  const handleNewAnalysis = () => {
    setCurrentSessionId(null);
    setProblem('');
    setContext('');
    setFiles([]);
    setUploadedFileIds([]);
    setIsPreviewing(false);
    setFileContent({});
    loadedSessionRef.current = null;
    unsubscribeFromSession();

    localStorage.removeItem('deepAnalytics_lastSessionId');
    localStorage.removeItem('deepAnalytics_lastProblem');
    localStorage.removeItem('deepAnalytics_lastContext');
    localStorage.removeItem('deepAnalytics_lastFiles');

    toast({
      title: 'New analysis',
      description: 'Ready to start a new analysis',
    });
  };

  const loadedSessionRef = useRef<string | null>(null);

  useEffect(() => {
    if (result && isPreviewing && currentSessionId && result.id !== loadedSessionRef.current) {
      loadedSessionRef.current = result.id;
      setProblem(result.problem || '');
      setContext(result.context || '');
      if (result.files && Array.isArray(result.files)) {
        const sessionFiles: UploadedFile[] = result.files.map((f: SessionFile) => ({
          id: f.id,
          name: f.filename,
          size: f.file_size,
          type: f.content_type
        }));
        setFiles(sessionFiles);
        setUploadedFileIds(result.files.map(f => f.id));
      } else {
        setFiles([]);
        setUploadedFileIds([]);
      }
    }
    if (!isPreviewing) {
      loadedSessionRef.current = null;
    }
  }, [result, isPreviewing, currentSessionId]);

  // DOWNLOAD HANDLING
  const handleDownload = (format?: 'markdown' | 'pdf' | 'html' | 'json' | 'text') => {
    const content = result?.final_solution?.content || socketResult?.final_solution?.content;
    if (!content) {
      toast({ title: 'No content', description: 'Nothing to download', variant: 'destructive' });
      return;
    }

    const originalFormat = result?.final_solution?.format || socketResult?.final_solution?.format || 'markdown';
    const filename = `deep-analysis-${new Date().toISOString().slice(0, 10)}`;

    downloadFile(content, originalFormat, {
      filename,
      format
    });
  };

  const renderResultContent = () => {
    const content = result?.final_solution?.content || socketResult?.final_solution?.content;
    const format = result?.final_solution?.format || socketResult?.final_solution?.format || 'markdown';

    if (!content) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No content was generated.</p>
        </div>
      );
    }

    const renderContent = () => {
      if (format === 'markdown') {
        return (
          <div className="max-w-3xl mx-auto">
            <MarkdownRenderer
              content={content}
              showToc={false}
              enableCopy={true}
            />
          </div>
        );
      }

      if (format === 'json') {
        try {
          const parsed = typeof content === 'string' ? JSON.parse(content) : content;
          return (
            <div className="max-w-3xl mx-auto">
              <pre className="whitespace-pre-wrap font-mono text-xs p-6 bg-muted rounded-lg overflow-auto">
                {JSON.stringify(parsed, null, 2)}
              </pre>
            </div>
          );
        } catch {
          return (
            <pre className="whitespace-pre-wrap font-mono text-xs p-6 bg-muted rounded-lg max-w-3xl mx-auto overflow-auto">
              {content}
            </pre>
          );
        }
      }

      return (
        <pre className="whitespace-pre-wrap font-sans text-sm p-6 bg-muted rounded-lg max-w-3xl mx-auto overflow-auto">
          {content}
        </pre>
      );
    };

    return (
      <div className="space-y-8">
        {renderContent()}

        {result?.files && result.files.length > 0 && (
          <div className="max-w-3xl mx-auto border-t pt-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Supporting Files
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.files.map((file: SessionFile) => (
                <Card key={file.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium truncate">{file.filename}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchFileContent(result.id, file.id)}
                      disabled={!!fileContent[file.id]}
                      className="h-8 w-8 p-0"
                    >
                      {fileContent[file.id] ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {fileContent[file.id] && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs max-h-32 overflow-auto font-mono">
                      {fileContent[file.id].substring(0, 200)}...
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ✅ REAL-TIME PROCESSING VIEW — NO FAKE PROGRESS
  if (isProcessing) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-background">
        <TopBar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          showSidebarToggle
        />

        <div className="flex-1 flex overflow-hidden">
          <aside
            className={`transition-all duration-300 ease-in-out border-r border-border bg-muted/30 flex-shrink-0 ${sidebarOpen ? 'w-80 2xl:w-96 opacity-100' : 'w-0 opacity-0'
              } overflow-hidden`}
          >
            <DeepAnalyticsSidebar
              sessions={sessions}
              currentSessionId={currentSessionId || undefined}
              onSelectSession={handleSelectSession}
              onNewAnalysis={handleNewAnalysis}
              loading={loadingSessions}
            />
          </aside>

          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
            <div className="w-full max-w-md text-center relative">
              {/* Connection indicator */}
              <div className="absolute top-0 right-0 flex items-center gap-2 text-xs">
                {isConnected ? (
                  <>
                    <Wifi className="w-3 h-3 text-success" />
                    <span className="text-success">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-destructive" />
                    <span className="text-destructive">Disconnected</span>
                  </>
                )}
              </div>

              <div className="relative mb-8">
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-muted to-background flex items-center justify-center mx-auto mb-6 shadow-sm animate-float-slow">
                  <Brain className="w-8 h-8 text-foreground" />
                </div>
              </div>

              <h1 className="text-2xl font-medium text-foreground mb-2 animate-fade-in">
                Deep Analysis in Progress
              </h1>

              {/* ✅ REAL STAGE LABEL */}
              <p className="text-muted-foreground mb-2 transition-opacity duration-300 animate-fade-in">
                {stageLabel || "Processing your request"}
              </p>

              {/* ✅ REAL PROGRESS BAR */}
              <div className="space-y-4 mb-8">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground font-medium animate-fade-in">
                  {Math.round(progress)}% complete
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="flex justify-center items-center gap-2 text-xs text-muted-foreground/70 animate-fade-in">
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse"></div>
                  <span>This typically takes 3–5 minutes</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="w-4 h-4" />
                  Cancel Analysis
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RESULTS VIEW
  if (showResult) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-background">
        <TopBar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          showSidebarToggle
        />

        <div className="flex-1 flex overflow-hidden">
          <aside
            className={`transition-all duration-300 ease-in-out border-r border-border bg-muted/30 flex-shrink-0 ${sidebarOpen ? 'w-80 2xl:w-96 opacity-100' : 'w-0 opacity-0'
              } overflow-hidden`}
          >
            <DeepAnalyticsSidebar
              sessions={sessions}
              currentSessionId={currentSessionId || undefined}
              onSelectSession={handleSelectSession}
              onNewAnalysis={handleNewAnalysis}
              loading={loadingSessions}
            />
          </aside>

          <div className="flex-1 flex flex-col w-full px-4 sm:px-6 py-6 overflow-auto">
            <div className="max-w-5xl mx-auto w-full">
              <div className="flex items-center justify-between mb-6 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <Check className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold">
                      {isPreviewing ? 'Session Preview' : 'Analysis Complete'}
                    </h1>
                    {result?.execution_metrics && (
                      <p className="text-sm text-muted-foreground">
                        Completed in {(result.execution_metrics.execution_time_ms / 1000).toFixed(1)}s
                      </p>
                    )}
                    {isPreviewing && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Viewing historical session from {new Date(result?.created_at || '').toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="relative group">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isConverting}
                      className="gap-1.5"
                    >
                      <FileDown className="w-4 h-4" />
                      {isConverting ? 'Converting...' : 'Export'}
                    </Button>
                    <div className="absolute right-0 mt-2 z-50 w-48 bg-background border rounded-lg shadow-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                      {(['markdown', 'pdf', 'html', 'json', 'text'] as const).map(fmt => (
                        <Button
                          key={fmt}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => handleDownload(fmt)}
                        >
                          {fmt.charAt(0).toUpperCase() + fmt.slice(1)} ({fmt === 'text' ? '.txt' : `.${fmt}`})
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleNewAnalysis}
                  >
                    New Analysis
                  </Button>
                </div>
              </div>

              <Card className="border bg-card overflow-hidden rounded-xl animate-fade-in-up">
                <div className="overflow-auto p-8 sm:p-10 lg:p-12">
                  {renderResultContent()}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // INPUT VIEW
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <TopBar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        showSidebarToggle
      />

      {!isConnected && (isProcessing || currentSessionId) && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2">
          <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>Not connected to server. Reconnecting...</span>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <aside
          className={`transition-all duration-300 ease-in-out border-r border-border bg-muted/30 flex-shrink-0 ${sidebarOpen ? 'w-80 2xl:w-96 opacity-100' : 'w-0 opacity-0'
            } overflow-hidden`}
        >
          <DeepAnalyticsSidebar
            sessions={sessions}
            currentSessionId={currentSessionId || undefined}
            onSelectSession={handleSelectSession}
            onNewAnalysis={handleNewAnalysis}
            loading={loadingSessions}
          />
        </aside>

        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 overflow-auto">
          <div className="text-center mb-6 animate-fade-in">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-foreground">Deep Analytics</h1>
              {isConnected && (
                <div className="flex items-center gap-1 text-xs text-success">
                  <Wifi className="w-3 h-3" />
                  <span>Live</span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Describe a complex challenge. Our AI will deliver a strategic, actionable report.
            </p>
            {isPreviewing && currentSessionId && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <p className="text-xs text-amber-500">
                  Viewing previous session
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewAnalysis}
                  className="h-6 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear & Start Fresh
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-5 animate-fade-in-up">
            {/* Problem */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary flex-shrink-0" />
                <h2 className="text-sm font-medium text-foreground">Your Challenge</h2>
              </div>
              <Textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="What strategic, operational, or analytical problem are you facing? Be specific about goals, constraints, and context..."
                className="min-h-[120px] text-sm resize-none"
                maxLength={10000}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{problem.length}/10,000 characters</span>
                {problem.length >= 20 ? (
                  <span className="text-success flex items-center gap-1">
                    <Check className="w-3 h-3" /> Ready
                  </span>
                ) : (
                  <span className="text-amber-500">{20 - problem.length} more needed</span>
                )}
              </div>
            </div>

            {/* Context */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <h2 className="text-sm font-medium text-foreground">Additional Context (Optional)</h2>
              </div>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Industry, timeline, success metrics, existing solutions, or other relevant details..."
                className="min-h-[80px] text-sm resize-none"
                maxLength={20000}
              />
              <p className="text-xs text-muted-foreground text-right">{context.length}/20,000</p>
            </div>

            {/* Files */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <h2 className="text-sm font-medium text-foreground">Supporting Files (Optional)</h2>
              </div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:bg-muted/30 transition-colors"
              >
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary mb-1.5" />
                    <span className="text-xs font-medium">Uploading...</span>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1.5" />
                    <p className="text-xs font-medium text-foreground">Add files for deeper analysis</p>
                    <p className="text-xs text-muted-foreground mt-0.5">PDF, DOCX, CSV, JSON • Max 5 files</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.csv,.json,.md"
                onChange={handleFileSelect}
                className="hidden"
              />

              {files.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {files.map(file => (
                    <div key={file.id} className="flex items-center gap-2 p-2.5 bg-muted/30 rounded-lg">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Execute */}
            <div className="pt-2 sticky bottom-0 bg-background pb-4">
              <Button
                onClick={handleExecute}
                disabled={!problem.trim() || problem.length < 20 || isProcessing}
                className="w-full h-11 text-sm font-medium shadow-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Generate Strategic Report
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Your report will include actionable steps, risk analysis, and implementation roadmap
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeepAnalytics;