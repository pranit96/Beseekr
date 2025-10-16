import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, FileText, X, Brain, Check, 
  ChevronRight, Loader2, Download,
  Target, Globe, Database, Clock, Users, Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { TopBar } from '@/components/TopBar';
import { useToast } from '@/hooks/use-toast';
import MarkdownRenderer from '@/components/messages/MarkdownRenderer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

const DeepAnalytics = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([]);
  const [problem, setProblem] = useState('');
  const [context, setContext] = useState('');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // File upload handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    if (files.length + selectedFiles.length > 5) {
      toast({
        title: 'Too many files',
        description: 'Maximum 5 files allowed',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => formData.append('files', file));

      const response = await fetch(`${API_BASE_URL}/api/thinkers/files/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Upload failed');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const uploadedFiles = Array.isArray(data.data) ? data.data : data.data.files;
        if (uploadedFiles && uploadedFiles.length > 0) {
          setFiles(prev => [...prev, ...uploadedFiles]);
          setUploadedFileIds(prev => [...prev, ...uploadedFiles.map(f => f.id)]);
          toast({
            title: 'Files uploaded',
            description: `${selectedFiles.length} file(s) uploaded successfully`,
          });
        } else {
          throw new Error('No files returned from server');
        }
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Could not upload files',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setUploadedFileIds(prev => prev.filter(fileId => fileId !== id));
  };

  // Simulate natural, accelerating progress
  const simulateProgress = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    let currentProgress = 0;
    // Slow, variable progress before response
    progressIntervalRef.current = setInterval(() => {
      const increment = 0.2 + Math.random() * 0.3; // 0.2–0.5 per 100ms
      currentProgress = Math.min(95, currentProgress + increment); // Cap at 95%
      setProgress(currentProgress);
    }, 100);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);

  // Accelerate to 100% smoothly after response
  const accelerateToComplete = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    const startProgress = progress;
    const duration = 2500; // 2.5 seconds to complete
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progressFraction = Math.min(elapsed / duration, 1);
      // Ease-out curve for natural feel
      const easeOut = 1 - Math.pow(1 - progressFraction, 3);
      const newProgress = startProgress + (100 - startProgress) * easeOut;
      
      setProgress(newProgress);

      if (progressFraction < 1) {
        requestAnimationFrame(animate);
      } else {
        setShowResult(true);
        setProcessing(false);
      }
    };

    requestAnimationFrame(animate);
  }, [progress]);

  const cleanMarkdownContent = (content: string) => {
    if (!content) return '';
    return content
      .replace(/###\s*Steps/g, '### Implementation Steps')
      .replace(/##\s*#/g, '##')
      .replace(/#\s*#/g, '#')
      .replace(/(#+)\s*#+/g, '$1')
      .replace(/\*\s*\*/g, '*')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/```\s*\n\s*```/g, '')
      .trim();
  };

  const handleExecute = async () => {
    if (!problem.trim()) {
      toast({
        title: 'Problem required',
        description: 'Please describe your problem or question',
        variant: 'destructive',
      });
      return;
    }

    if (problem.length < 20) {
      toast({
        title: 'Problem too short',
        description: 'Please provide at least 20 characters',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    setProgress(0);
    setResult(null);
    setShowResult(false);

    const cleanupProgress = simulateProgress();

    try {
      const requestBody = {
        problem: problem.trim(),
        context: context.trim() || undefined,
        files: uploadedFileIds.length > 0 ? uploadedFileIds : undefined,
        output_format: 'markdown',
        preferences: {
          temperature: 0.7,
          max_iterations: 3,
        },
      };

      const response = await fetch(`${API_BASE_URL}/api/thinkers/execute`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: Analysis failed`);
      }

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
        cleanupProgress();
        // Start smooth acceleration to 100%
        setTimeout(accelerateToComplete, 300); // Small delay for UX
      } else {
        throw new Error(data.message || 'Analysis failed');
      }
    } catch (error: any) {
      console.error('Execution error:', error);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setProcessing(false);
      toast({
        title: 'Analysis failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    const content = getResultContent();
    if (!content) {
      toast({
        title: 'No content',
        description: 'No analysis results to download',
        variant: 'destructive',
      });
      return;
    }

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-report-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: 'Analysis report saved',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getResultContent = () => {
    if (!result) return '';
    // Your sample shows content is in final_solution.content
    const content = result.final_solution?.content || '';
    return cleanMarkdownContent(content);
  };

  const StatsOverview = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[
        { icon: Users, value: '8', label: 'AI Specialists' },
        { icon: Database, value: '15+', label: 'Data Types' },
        { icon: Clock, value: '4-5 min', label: 'Avg. Analysis' },
        { icon: Rocket, value: '99%', label: 'Accuracy' }
      ].map((stat, i) => (
        <Card key={i} className="p-4 border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted">
              <stat.icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {!processing && !showResult ? (
          /* Single-screen input form */
          <div className="flex-1 flex flex-col">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border mb-4">
                <Brain className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  ADVANCED AI ANALYSIS
                </span>
              </div>
              
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Deep Analytics
              </h1>
              
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Describe your challenge, add context, and upload files for a comprehensive AI-powered analysis.
              </p>

              <StatsOverview />
            </div>

            <div className="space-y-6">
              {/* Problem Statement */}
              <Card className="p-5 border bg-card">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted mt-0.5">
                    <Target className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Problem Statement</h3>
                    <p className="text-sm text-muted-foreground">Describe your challenge in detail</p>
                  </div>
                </div>
                
                <Textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="Describe your analytical challenge, business problem, or research question..."
                  className="min-h-[120px] resize-none bg-background"
                  maxLength={10000}
                />
                
                <div className="flex items-center justify-between mt-3 text-xs">
                  <span className="text-muted-foreground">{problem.length} / 10,000 characters</span>
                  <div className={`flex items-center gap-1.5 ${problem.length >= 20 ? 'text-success' : 'text-warning'}`}>
                    {problem.length >= 20 ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" />
                    )}
                    <span>{problem.length >= 20 ? 'Ready' : `${20 - problem.length} more needed`}</span>
                  </div>
                </div>
              </Card>

              {/* Context & Constraints */}
              <Card className="p-5 border bg-card">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted mt-0.5">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Context & Constraints</h3>
                    <p className="text-sm text-muted-foreground">Additional information and requirements</p>
                  </div>
                </div>
                
                <Textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Provide strategic context, constraints, success metrics, or specific frameworks..."
                  className="min-h-[120px] resize-none bg-background"
                  maxLength={20000}
                />
                
                <div className="text-xs text-muted-foreground mt-2">
                  {context.length} / 20,000 characters
                </div>
              </Card>

              {/* Supporting Files */}
              <Card className="p-5 border bg-card">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted mt-0.5">
                    <Database className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Supporting Files</h3>
                    <p className="text-sm text-muted-foreground">Upload relevant documents and data</p>
                  </div>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors mb-4"
                >
                  {uploading ? (
                    <div className="space-y-2">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                      <p className="font-medium text-foreground">Uploading files...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto bg-muted">
                        <Upload className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Drop files here or click to upload</p>
                        <p className="text-sm text-muted-foreground">
                          PDF, DOCX, TXT, CSV, JSON • Max 5 files • 10MB each
                        </p>
                      </div>
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
                  <div className="space-y-2 mt-4">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Uploaded Files ({files.length})
                    </h4>
                    {files.map(file => (
                      <div key={file.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 border">
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => removeFile(file.id)} className="text-muted-foreground hover:text-foreground">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Execute Button */}
              <Button
                onClick={handleExecute}
                disabled={!problem.trim() || problem.length < 20 || processing}
                className="w-full h-12 font-medium py-3"
              >
                {processing ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    <span>Start Deep Analysis</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </div>
          </div>
        ) : processing ? (
          /* Processing View */
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-md text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border mb-6">
                <Brain className="w-4 h-4 text-muted-foreground animate-pulse" />
                <span className="text-sm font-medium text-muted-foreground">
                  ANALYZING YOUR REQUEST
                </span>
              </div>
              
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Analyzing Your Request
              </h2>
              
              <p className="text-muted-foreground mb-8">
                Our AI specialists are working on your comprehensive analysis.
              </p>

              <div className="mb-6">
                <Progress value={progress} className="h-2" />
                <div className="mt-2 text-sm text-muted-foreground">
                  {Math.round(progress)}% complete
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                This typically takes 4-5 minutes. We’ll notify you when it’s ready.
              </p>
            </div>
          </div>
        ) : (
          /* Results View */
          <div className="flex-1 flex flex-col">
            <Card className="p-5 border bg-card mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-success/10 border border-success/20">
                    <Check className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Analysis Complete</h2>
                    <p className="text-muted-foreground text-sm">
                      Completed in {((result?.execution_metrics?.execution_time_ms || 0) / 1000).toFixed(1)} seconds
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleDownload} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" /> Download
                  </Button>
                  <Button
                    onClick={() => {
                      setShowResult(false);
                      setResult(null);
                      setProblem('');
                      setContext('');
                      setFiles([]);
                      setUploadedFileIds([]);
                    }}
                    className="gap-2"
                  >
                    New Analysis <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="flex-1 border bg-card flex flex-col">
              <div className="flex-1 overflow-auto p-5">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {getResultContent() ? (
                    <MarkdownRenderer
                      content={getResultContent()}
                      showToc={true}
                      enableCopy={true}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-1">No Results Found</h3>
                      <p className="text-muted-foreground">The analysis did not return any content.</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeepAnalytics;