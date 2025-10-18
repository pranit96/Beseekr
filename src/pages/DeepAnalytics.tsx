import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, FileText, X, Brain, Check, 
  Loader2, FileDown, Target, Globe, Database, History, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { TopBar } from '@/components/TopBar';
import { useToast } from '@/hooks/use-toast';
import MarkdownRenderer from '@/components/messages/MarkdownRenderer';
import { useDownload } from '@/hooks/use-download';
import { SessionHistory, SessionSummary, FullSession } from '@/components/SessionHistory';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

// Extend FullSession files to include frontend-friendly fields
interface SessionFile {
  id: string;
  filename: string;
  file_size: number;
  content_type: string;
}

const DeepAnalytics = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([]);
  const [problem, setProblem] = useState('');
  const [context, setContext] = useState('');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<FullSession | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [fileContent, setFileContent] = useState<{ [fileId: string]: string }>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { downloadFile, isConverting } = useDownload();
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // === FILE HANDLING ===
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    // Prevent duplicates by name
    const existingNames = new Set(files.map(f => f.name));
    const newFiles = selectedFiles.filter(file => !existingNames.has(file.name));

    if (newFiles.length === 0) {
      toast({ title: 'Duplicate files', description: 'All selected files are already uploaded.', variant: 'destructive' });
      return;
    }

    if (files.length + newFiles.length > 5) {
      toast({ title: 'Limit reached', description: 'Max 5 files allowed', variant: 'destructive' });
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
      console.error('Upload error:', error);
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

  // === PROGRESS LOGIC ===
  const simulateProgress = useCallback(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    let current = 0;
    progressIntervalRef.current = setInterval(() => {
      const increment = 0.2 + Math.random() * 0.3;
      current = Math.min(95, current + increment);
      setProgress(current);
    }, 100);
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);

  const accelerateToComplete = useCallback(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    const start = progress;
    const duration = 2500;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - t, 3);
      const newProgress = start + (100 - start) * easeOut;
      setProgress(newProgress);
      if (t < 1) requestAnimationFrame(animate);
      else {
        setShowResult(true);
        setProcessing(false);
      }
    };
    requestAnimationFrame(animate);
  }, [progress]);

  // === EXECUTION ===
  const handleExecute = async () => {
    if (!problem.trim() || problem.length < 20) {
      toast({ title: 'Add more detail', description: 'At least 20 characters required', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    setProgress(0);
    setResult(null);
    setShowResult(false);
    setIsPreviewing(false);
    setFileContent({});

    const cleanup = simulateProgress();

    try {
      const res = await fetch(`${API_BASE_URL}/api/thinkers/execute`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: problem.trim(),
          context: context.trim() || undefined,
          files: uploadedFileIds.length > 0 ? uploadedFileIds : undefined,
          output_format: 'markdown',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Analysis failed (${res.status})`);
      }

      const data = await res.json();
      if (data.success) {
        setResult(data);
        cleanup();
        setTimeout(accelerateToComplete, 300);
      } else {
        throw new Error(data.message || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Execution error:', error);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setProcessing(false);
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    }
  };

  // === FETCH FILE CONTENT ===
  const fetchFileContent = async (sessionId: string, fileId: string) => {
    if (fileContent[fileId]) return; // Already loaded
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
      console.error('Error fetching file content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load file content',
        variant: 'destructive'
      });
    }
  };

  // === SESSION HISTORY HANDLING ===
  const handleSelectSession = async (sessionSummary: SessionSummary) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/thinkers/sessions/${sessionSummary.id}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch session');
      
      const fullSession: FullSession = await response.json();
      setResult(fullSession);
      setShowResult(true);
      setIsPreviewing(true);
      setFileContent({});
      
      setProblem(fullSession.problem || '');
      setContext(fullSession.context || '');
      
      if (fullSession.files && Array.isArray(fullSession.files)) {
        // Map to UploadedFile format for UI
        const sessionFiles: UploadedFile[] = fullSession.files.map((f: SessionFile) => ({
          id: f.id,
          name: f.filename,
          size: f.file_size,
          type: f.content_type
        }));
        setFiles(sessionFiles);
        setUploadedFileIds(fullSession.files.map(f => f.id));
      } else {
        setFiles([]);
        setUploadedFileIds([]);
      }
    } catch (error) {
      console.error('Error loading session:', error);
      toast({
        title: 'Error',
        description: 'Failed to load session details',
        variant: 'destructive'
      });
    }
  };

  // === DOWNLOAD HANDLING ===
  const handleDownload = (format?: 'markdown' | 'pdf' | 'html' | 'json' | 'text') => {
    if (!result?.final_solution?.content) {
      toast({ title: 'No content', description: 'Nothing to download', variant: 'destructive' });
      return;
    }

    const content = result.final_solution.content;
    const originalFormat = result.final_solution.format || 'markdown';
    const filename = `deep-analysis-${new Date().toISOString().slice(0, 10)}`;
    
    downloadFile(content, originalFormat, { 
      filename, 
      format 
    });
  };

  // === RENDERING ===

  const renderResultContent = () => {
  if (!result?.final_solution?.content) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No content was generated.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Content - Wider, No TOC */}
      {result.final_solution.format === 'markdown' ? (
        <div className="prose prose-invert max-w-none">
          <MarkdownRenderer 
            content={result.final_solution.content} 
            showToc={false} // 👈 REMOVED TOC
            enableCopy={true} 
          />
        </div>
      ) : (
        <pre className="whitespace-pre-wrap font-sans text-sm p-4 bg-muted rounded-lg">
          {result.final_solution.content}
        </pre>
      )}

      {/* Files Section */}
      {result.files && result.files.length > 0 && (
        <div className="border-t pt-6">
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

  // === PROCESSING VIEW ===
  if (processing) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar />
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
          <div className="w-full max-w-md text-center relative">
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute w-64 h-64 animate-rotate-slow opacity-20">
                  <div className="absolute top-0 left-1/2 w-2 h-2 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                </div>
                <div className="absolute w-80 h-80 animate-rotate-slow opacity-10" style={{ animationDirection: 'reverse', animationDuration: '25s' }}>
                  <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-accent rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                </div>
              </div>
              <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-muted to-background flex items-center justify-center mx-auto mb-6 shadow-sm animate-float-slow">
                <Brain className="w-8 h-8 text-foreground" />
              </div>
            </div>

            <h1 className="text-2xl font-medium text-foreground mb-2 animate-fade-in">
              Deep Analysis in Progress
            </h1>
            <p className="text-muted-foreground mb-8 transition-opacity duration-500 animate-fade-in">
              {progress < 95 
                ? "Our AI specialists are analyzing your request" 
                : "Finalizing your comprehensive report"}
            </p>

            <div className="space-y-4 mb-8">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground font-medium animate-fade-in">
                {Math.round(progress)}% complete
              </p>
            </div>

            <div className="flex justify-center items-center gap-2 text-xs text-muted-foreground/70 animate-fade-in">
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse"></div>
              <span>This typically takes 3–5 minutes</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === RESULTS VIEW ===
  if (showResult) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar />
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
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
              <div className="relative">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowHistory(!showHistory)}
                  className="gap-1.5"
                >
                  <History className="w-4 h-4" />
                  History
                </Button>
                {showHistory && (
                  <div className="absolute right-0 mt-2 z-50 w-80">
                    <SessionHistory 
                      onSelectSession={handleSelectSession}
                      currentSessionId={result?.id}
                    />
                  </div>
                )}
              </div>
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
                onClick={() => {
                  setShowResult(false);
                  setResult(null);
                  setProblem('');
                  setContext('');
                  setFiles([]);
                  setUploadedFileIds([]);
                  setShowHistory(false);
                  setIsPreviewing(false);
                  setFileContent({});
                }}
              >
                New Analysis
              </Button>
            </div>
          </div>

          <Card className="flex-1 border bg-card overflow-hidden rounded-xl animate-fade-in-up">
            <div className="h-full overflow-auto p-6 sm:p-8"> {/* 👈 Increased padding on larger screens */}
              {renderResultContent()}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // === INPUT VIEW ===
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-3">Deep Analytics</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Describe a complex challenge. Our AI will deliver a strategic, actionable report.
          </p>
        </div>

        <div className="space-y-8 animate-fade-in-up">
          {/* Problem */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Target className="w-5 h-5 text-primary flex-shrink-0" />
              <h2 className="font-medium text-foreground">Your Challenge</h2>
            </div>
            <Textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="What strategic, operational, or analytical problem are you facing? Be specific about goals, constraints, and context..."
              className="min-h-[140px] text-base resize-none"
              maxLength={10000}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{problem.length}/10,000 characters</span>
              {problem.length >= 20 ? (
                <span className="text-success flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Ready for analysis
                </span>
              ) : (
                <span className="text-amber-500">{20 - problem.length} more characters needed</span>
              )}
            </div>
          </div>

          {/* Context */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Globe className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <h2 className="font-medium text-foreground">Additional Context (Optional)</h2>
            </div>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Industry, timeline, success metrics, existing solutions, or other relevant details..."
              className="min-h-[100px] text-base resize-none"
              maxLength={20000}
            />
            <p className="text-xs text-muted-foreground text-right">{context.length}/20,000</p>
          </div>

          {/* Files */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <h2 className="font-medium text-foreground">Supporting Files (Optional)</h2>
            </div>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
            >
              {uploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                  <span className="text-sm font-medium">Uploading...</span>
                </div>
              ) : (
                <div>
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">Add files for deeper analysis</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, CSV, JSON • Max 5 files</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {files.map(file => (
                  <div key={file.id} className="flex items-center gap-2.5 p-3 bg-muted/30 rounded-lg">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Session History Toggle */}
          <div className="flex justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowHistory(!showHistory)}
              className="gap-1.5"
            >
              <History className="w-4 h-4" />
              {showHistory ? 'Hide History' : 'View History'}
            </Button>
          </div>

          {showHistory && (
            <div className="animate-fade-in">
              <SessionHistory 
                onSelectSession={handleSelectSession}
              />
            </div>
          )}

          {/* Execute */}
          <div className="pt-4">
            <Button
              onClick={handleExecute}
              disabled={!problem.trim() || problem.length < 20 || processing}
              className="w-full h-12 text-base font-medium"
            >
              {processing ? (
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
            <p className="text-xs text-muted-foreground text-center mt-3">
              Your report will include actionable steps, risk analysis, and implementation roadmap
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeepAnalytics;