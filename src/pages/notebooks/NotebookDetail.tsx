// src/pages/notebooks/NotebookDetail.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Notebook detail page — content source editor + 4-tab AI output viewer.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Wand2, Loader2, Edit3, Save, X, RefreshCw,
  CreditCard, HelpCircle, Mic, Map, CheckCircle, AlertCircle, Sparkles,
  Clock, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { FlashcardViewer } from "./components/FlashcardViewer";
import { QuizViewer } from "./components/QuizViewer";
import { InterviewQuestionsViewer } from "./components/InterviewQuestionsViewer";
import { MindMapViewer } from "./components/MindMapViewer";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "flashcards", label: "Flashcards", icon: CreditCard, emoji: "🃏" },
  { id: "quiz", label: "Quiz", icon: HelpCircle, emoji: "📝" },
  { id: "interview_questions", label: "Interview Prep", icon: Mic, emoji: "💼" },
  { id: "mind_map", label: "Mind Map", icon: Map, emoji: "🗺️" },
] as const;

type TabId = typeof TABS[number]["id"];

const STATUS_BADGE = {
  draft: { label: "Draft", class: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  processing: { label: "Generating...", class: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" },
  ready: { label: "Ready", class: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400" },
  error: { label: "Error", class: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400" },
};

export default function NotebookDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabId>("flashcards");
  const [editingText, setEditingText] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");

  const { data: notebookData, isLoading, error } = useQuery({
    queryKey: ["notebook", id],
    queryFn: () => apiClient.getNotebook(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const notebook = notebookData?.data;
  const content = notebook?.content || {};
  const activeContent = content[activeTab];

  const tier = user?.tier || "free";
  const isUltra = tier === "ultra";

  // Generate all content types
  const generateAllMutation = useMutation({
    mutationFn: () =>
      apiClient.generateNotebookContent(id!, {
        types: ["flashcards", "quiz", "interview_questions", "mind_map"],
        difficulty,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notebook", id] });
      toast({ title: "✨ Content generated!", description: "All learning materials are ready." });
    },
    onError: (err: any) => {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    },
  });

  // Regenerate single tab
  const regenerateMutation = useMutation({
    mutationFn: (type: TabId) =>
      apiClient.generateSingleNotebookContent(id!, { type, difficulty }),
    onSuccess: (_, type) => {
      queryClient.invalidateQueries({ queryKey: ["notebook", id] });
      toast({ title: `${type.replace("_", " ")} regenerated!` });
    },
    onError: (err: any) => {
      toast({ title: "Regeneration failed", description: err.message, variant: "destructive" });
    },
  });

  // Save source text
  const saveMutation = useMutation({
    mutationFn: (text: string) => apiClient.updateNotebook(id!, { source_text: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notebook", id] });
      setEditingText(false);
      toast({ title: "Content saved" });
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  const startEdit = useCallback(() => {
    setDraftText(notebook?.source_text || "");
    setEditingText(true);
  }, [notebook]);

  const charCount = (notebook?.source_text || "").length;
  const wordCount = (notebook?.source_text || "").trim().split(/\s+/).filter(Boolean).length;
  const hasContent = charCount >= 100;
  const isGenerating = generateAllMutation.isPending || notebook?.status === "processing";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !notebook) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-muted-foreground">Notebook not found.</p>
        <Button onClick={() => navigate("/notebooks")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Notebooks
        </Button>
      </div>
    );
  }

  const statusBadge = STATUS_BADGE[notebook.status as keyof typeof STATUS_BADGE] || STATUS_BADGE.draft;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 shrink-0">
            <Link to="/notebooks">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Notebooks</span>
            </Link>
          </Button>

          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate">{notebook.title}</h1>
            <div className="flex items-center gap-2">
              <Badge className={cn("text-xs", statusBadge.class)}>
                {isGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                {isGenerating ? "Generating..." : statusBadge.label}
              </Badge>
              {isUltra && (
                <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-indigo-500" /> Claude Sonnet 4.6
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Difficulty selector */}
            <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            {/* Generate all button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => generateAllMutation.mutate()}
                    disabled={isGenerating || !hasContent}
                    size="sm"
                    className="gap-1.5"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">Generate All</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {hasContent
                    ? "Generate flashcards, quiz, interview questions, and mind map"
                    : "Add at least 100 characters of content first"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Source content editor */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Source Content</span>
                  <Badge variant="outline" className="text-xs">
                    {charCount.toLocaleString()} chars · {wordCount.toLocaleString()} words
                  </Badge>
                </div>
                {!editingText ? (
                  <Button variant="ghost" size="sm" onClick={startEdit} className="gap-1.5 h-7">
                    <Edit3 className="h-3.5 w-3.5" /> Edit
                  </Button>
                ) : (
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => setEditingText(false)} className="h-7 w-7 p-0">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveMutation.mutate(draftText)}
                      disabled={saveMutation.isPending}
                      className="h-7 gap-1 text-xs"
                    >
                      {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save
                    </Button>
                  </div>
                )}
              </div>

              {editingText ? (
                <Textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  placeholder="Paste your content here (articles, notes, documentation...)..."
                  className="min-h-[400px] rounded-none border-0 resize-y focus-visible:ring-0 text-sm"
                />
              ) : (
                <div
                  className={cn(
                    "min-h-[400px] p-4 text-sm leading-relaxed whitespace-pre-wrap overflow-auto max-h-[600px]",
                    !notebook.source_text && "text-muted-foreground italic",
                  )}
                  onClick={startEdit}
                  style={{ cursor: "text" }}
                >
                  {notebook.source_text || "Click to add content..."}
                </div>
              )}
            </div>

            {/* Stats / tier info */}
            <div className="rounded-xl border bg-muted/20 p-4 space-y-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground text-sm">
                {isUltra ? (
                  <>
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    Ultra — Claude Sonnet 4.6
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 text-amber-500" />
                    {tier === "pro" ? "Pro" : "Free"} — Groq
                  </>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span>Flashcards</span>
                  <span className="font-medium text-foreground">{isUltra ? "20" : tier === "pro" ? "15" : "10"} cards</span>
                </div>
                <div className="flex justify-between">
                  <span>Quiz questions</span>
                  <span className="font-medium text-foreground">{isUltra ? "15" : "12"} Qs</span>
                </div>
                <div className="flex justify-between">
                  <span>Interview questions</span>
                  <span className="font-medium text-foreground">{isUltra ? "20" : "15"} Qs</span>
                </div>
                <div className="flex justify-between">
                  <span>Content limit</span>
                  <span className="font-medium text-foreground">{isUltra ? "12k" : "8k"} tokens</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: AI output tabs */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border bg-card overflow-hidden">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
                <div className="border-b bg-muted/20 px-4 pt-3">
                  <TabsList className="w-full bg-transparent gap-1 h-auto flex-wrap justify-start">
                    {TABS.map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        <span>{tab.emoji}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                        {content[tab.id] && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {TABS.map((tab) => {
                  const tabContent = content[tab.id];
                  const isRegenerating = regenerateMutation.isPending && regenerateMutation.variables === tab.id;

                  return (
                    <TabsContent key={tab.id} value={tab.id} className="mt-0 p-5">
                      {/* Tab action bar */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{tab.emoji}</span>
                          <span className="font-semibold">{tab.label}</span>
                        </div>
                        {tabContent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => regenerateMutation.mutate(tab.id)}
                            disabled={isRegenerating || !hasContent}
                            className="gap-1.5 text-xs h-7"
                          >
                            {isRegenerating ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            Regenerate
                          </Button>
                        )}
                      </div>

                      <AnimatePresence mode="wait">
                        {/* Generating state */}
                        {(isGenerating || isRegenerating) && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20 gap-4"
                          >
                            <div className="relative">
                              <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
                              <Wand2 className="relative h-10 w-10 text-indigo-500" />
                            </div>
                            <div className="text-center">
                              <p className="font-medium">Generating {tab.label}...</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {isUltra ? "Claude Sonnet is analyzing your content" : "AI is analyzing your content"}
                              </p>
                            </div>
                          </motion.div>
                        )}

                        {/* Empty state */}
                        {!isGenerating && !isRegenerating && !tabContent && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20 gap-4 text-center"
                          >
                            <span className="text-5xl">{tab.emoji}</span>
                            <div>
                              <p className="font-medium">No {tab.label} Yet</p>
                              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                                {hasContent
                                  ? `Click "Generate All" to create ${tab.label.toLowerCase()}, or generate this tab individually.`
                                  : "Add source content first, then generate learning materials."}
                              </p>
                            </div>
                            {hasContent && (
                              <Button
                                onClick={() => regenerateMutation.mutate(tab.id)}
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                              >
                                <Wand2 className="h-4 w-4" /> Generate {tab.label}
                              </Button>
                            )}
                          </motion.div>
                        )}

                        {/* Content */}
                        {!isGenerating && !isRegenerating && tabContent && (
                          <motion.div
                            key={tab.id + "-content"}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                          >
                            {tab.id === "flashcards" && <FlashcardViewer data={tabContent} />}
                            {tab.id === "quiz" && <QuizViewer data={tabContent} />}
                            {tab.id === "interview_questions" && <InterviewQuestionsViewer data={tabContent} />}
                            {tab.id === "mind_map" && <MindMapViewer data={tabContent} />}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

