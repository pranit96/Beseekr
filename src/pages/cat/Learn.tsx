// CAT Learn Page - Unified learning hub with Topics, Notes, and Flashcards tabs
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Layers,
  StickyNote,
  GraduationCap,
  Target,
  ChevronRight,
  Play,
  Loader2,
  Plus,
  Search,
  Check,
  X,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Clock,
  Trash2,
  Edit,
  Filter,
  AlertCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { catApi } from "@/api/cat";
import { useToast } from "@/hooks/use-toast";
import { CatNavigation } from "@/components/cat/CatNavigation";
import { SectionTabs } from "@/components/cat/SectionTabs";
import type {
  MasteryOverview,
  TopicMastery,
  ProblemDifficulty,
  MasteryLevel,
  StartLearnSessionPayload,
  Note,
  CreateNotePayload,
  Flashcard,
  CreateFlashcardPayload,
  LessonWithProgress,
  LessonProgressPayload,
  LessonType,
  Problem,
} from "@/types/cat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Subjects from "./Subjects";

const difficultyColors: Record<ProblemDifficulty, string> = {
  easy: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  hard: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  cat_level: "bg-red-500/20 text-red-400 border-red-500/30",
};

const masteryColors: Record<
  MasteryLevel,
  { bg: string; text: string; label: string }
> = {
  beginner: { bg: "bg-gray-500/20", text: "text-gray-400", label: "Beginner" },
  learning: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Learning" },
  practicing: {
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    label: "Practicing",
  },
  proficient: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    label: "Proficient",
  },
  mastered: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    label: "Mastered",
  },
};

export default function Learn() {
  const [activeTab, setActiveTab] = useState("topics");
  const [selectedTopic, setSelectedTopic] = useState<TopicMastery | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "detail">("grid");
  const [activeDetailTab, setActiveDetailTab] = useState<
    "lessons" | "practice" | "tips"
  >("lessons");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: masteryData, isLoading: masteryLoading } = useQuery({
    queryKey: ["cat", "mastery"],
    queryFn: () => catApi.getMastery(),
  });

  const handleLearnTopic = (topicId: string) => {
    setActiveTab("topics");
    // Check both topic_id and id since Subjects.tsx passes id but mastery data uses topic_id
    const topic = masteryData?.topics.find(
      (t) =>
        t.topic_id === topicId ||
        t.topic_id === topicId.toLowerCase() ||
        (t as any).id === topicId,
    );
    if (topic) {
      setSelectedTopic(topic);
      setViewMode("detail");
      setActiveDetailTab("lessons");
    } else {
      toast({ title: "Topic not found", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* CAT Module Navigation */}
      <CatNavigation />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            Learn
          </h1>
          <p className="text-muted-foreground">
            Master topics, take notes, and review with flashcards
          </p>
        </div>
      </div>

      {/* Section Tabs */}
      <SectionTabs
        tabs={[
          {
            value: "topics",
            label: "Topics",
            description: "Master concepts by topic",
            icon: BookOpen,
          },
          {
            value: "syllabus",
            label: "Syllabus",
            description: "Track subject progress",
            icon: Target,
          },
          {
            value: "notes",
            label: "Notes",
            description: "Your study notes",
            icon: StickyNote,
          },
          {
            value: "flashcards",
            label: "Flashcards",
            description: "Quick revision cards",
            icon: Layers,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      {/* Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-0">
        {/* Topics Tab */}
        <TabsContent value="topics" className="space-y-6">
          <TopicsSection
            masteryData={masteryData}
            masteryLoading={masteryLoading}
            selectedTopic={selectedTopic}
            setSelectedTopic={setSelectedTopic}
            viewMode={viewMode}
            setViewMode={setViewMode}
            activeDetailTab={activeDetailTab}
            setActiveDetailTab={setActiveDetailTab}
          />
        </TabsContent>

        {/* Syllabus Tab */}
        <TabsContent value="syllabus" className="space-y-6">
          <Subjects onLearnTopic={handleLearnTopic} />
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-6">
          <NotesSection />
        </TabsContent>

        {/* Flashcards Tab */}
        <TabsContent value="flashcards" className="space-y-6">
          <FlashcardsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ========================
// TOPICS SECTION
// ========================
interface TopicsSectionProps {
  masteryData?: MasteryOverview;
  masteryLoading: boolean;
  selectedTopic: TopicMastery | null;
  setSelectedTopic: (topic: TopicMastery | null) => void;
  viewMode: "grid" | "detail";
  setViewMode: (mode: "grid" | "detail") => void;
  activeDetailTab: "lessons" | "practice" | "tips";
  setActiveDetailTab: (tab: "lessons" | "practice" | "tips") => void;
}

function TopicsSection({
  masteryData,
  masteryLoading,
  selectedTopic,
  setSelectedTopic,
  viewMode,
  setViewMode,
  activeDetailTab,
  setActiveDetailTab,
}: TopicsSectionProps) {
  const queryClient = useQueryClient();
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [sessionType, setSessionType] = useState<
    "practice" | "speed_drill" | "revision"
  >("practice");
  const [problemCount, setProblemCount] = useState<number>(10);
  const [viewingLessonId, setViewingLessonId] = useState<string | null>(null);
  const { toast } = useToast();

  // Effect to handle navigation from parent
  useMemo(() => {
    // Props are now handled directly
  }, []);

  // Fetch lessons for selected topic
  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ["cat", "lessons", selectedTopic?.topic_id],
    queryFn: () => catApi.getTopicLessons(selectedTopic!.topic_id),
    enabled: !!selectedTopic && viewMode === "detail",
  });

  // Fetch problems for selected topic
  const { data: problems, isLoading: problemsLoading } = useQuery({
    queryKey: ["cat", "problems", selectedTopic?.topic_id],
    queryFn: () => catApi.getTopicProblems(selectedTopic!.topic_id),
    enabled:
      !!selectedTopic &&
      viewMode === "detail" &&
      activeDetailTab === "practice",
  });

  // Fetch AI tips for selected topic
  const { data: aiTips, isLoading: aiTipsLoading } = useQuery({
    queryKey: ["cat", "ai-tips", selectedTopic?.topic_id],
    queryFn: () => catApi.getAITopicTips(selectedTopic!.topic_id),
    enabled:
      !!selectedTopic && viewMode === "detail" && activeDetailTab === "tips",
    staleTime: 30 * 60 * 1000,
  });

  const startSession = useMutation({
    mutationFn: (payload: StartLearnSessionPayload) =>
      catApi.startLearnSession(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cat", "mastery"] });
      setSessionDialogOpen(false);
      toast({ title: "Learning session started!" });
    },
  });

  const updateProgress = useMutation({
    mutationFn: ({
      lessonId,
      payload,
    }: {
      lessonId: string;
      payload: LessonProgressPayload;
    }) => catApi.updateLessonProgress(lessonId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cat", "lessons", selectedTopic?.topic_id],
      });
      toast({ title: "Progress updated!" });
    },
  });

  const handleStartSession = () => {
    if (!selectedTopic) return;
    startSession.mutate({
      topicName: selectedTopic.topic_name,
      sessionType: sessionType,
      problemCount: problemCount,
    });
  };

  const handleTopicClick = (topic: TopicMastery) => {
    setSelectedTopic(topic);
    setViewMode("detail");
    setActiveDetailTab("lessons");
  };

  const handleBackToGrid = () => {
    setViewMode("grid");
    setSelectedTopic(null);
  };

  if (masteryLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const subjectOverviews = masteryData?.by_subject || [];
  const allTopics = masteryData?.topics || [];

  // Detail View
  if (viewMode === "detail" && selectedTopic) {
    const mastery = masteryColors[selectedTopic.mastery_level];
    return (
      <>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBackToGrid}>
            <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
            Back
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{selectedTopic.topic_name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="outline" className={cn(mastery.bg, mastery.text)}>
                {mastery.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {selectedTopic.problems_correct}/
                {selectedTopic.problems_attempted} correct (
                {selectedTopic.accuracy_percent}%)
              </span>
            </div>
          </div>
          <Button
            onClick={() => setSessionDialogOpen(true)}
            className="bg-gradient-to-r from-violet-500 to-purple-600"
          >
            <Play className="h-4 w-4 mr-2" />
            Practice
          </Button>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeDetailTab}
          onValueChange={(v) =>
            setActiveDetailTab(v as "lessons" | "practice" | "tips")
          }
        >
          <TabsList className="mb-4">
            <TabsTrigger value="lessons" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Lessons ({lessons?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="practice" className="gap-2">
              <Target className="h-4 w-4" />
              Problems
            </TabsTrigger>
            <TabsTrigger value="tips" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI Tips
            </TabsTrigger>
          </TabsList>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="space-y-4">
            {lessonsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : lessons && lessons.length > 0 ? (
              <div className="space-y-3">
                {lessons.map((lesson, idx) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    index={idx + 1}
                    onView={() => setViewingLessonId(lesson.id)}
                    onMarkComplete={() => {
                      updateProgress.mutate({
                        lessonId: lesson.id,
                        payload: {
                          status: "completed",
                          progress_percent: 100,
                          time_spent_seconds: 0,
                        },
                      });
                    }}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    No lessons available for this topic yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Practice Tab */}
          <TabsContent value="practice" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {problems?.length || 0} problems available
              </p>
              <Button size="sm" onClick={() => setSessionDialogOpen(true)}>
                <Play className="h-4 w-4 mr-2" />
                Start Session
              </Button>
            </div>
            {problemsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : problems && problems.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-3">
                {problems.slice(0, 10).map((problem) => (
                  <ProblemCard key={problem.id} problem={problem} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    No practice problems available.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* AI Tips Tab */}
          <TabsContent value="tips" className="space-y-4">
            {aiTipsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : aiTips ? (
              <div className="space-y-4">
                {/* Tips */}
                <Card className="bg-gradient-to-br from-violet-500/5 to-purple-500/5 border-violet-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="h-5 w-5 text-violet-500" />
                      Tips for {aiTips.topic_title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {aiTips.tips.map((tip, i) => (
                      <div key={i} className="flex gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{tip}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Common Pitfalls */}
                {aiTips.common_pitfalls.length > 0 && (
                  <Card className="border-amber-500/20 bg-amber-500/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                        Common Pitfalls to Avoid
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {aiTips.common_pitfalls.map((pitfall, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-amber-500">⚠</span>
                          <p className="text-sm">{pitfall}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Practice Strategy */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="h-5 w-5 text-primary" />
                      Practice Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {aiTips.practice_strategy}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    AI tips not available for this topic.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Start Session Dialog */}
        <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Start Practice: {selectedTopic.topic_name}
              </DialogTitle>
              <DialogDescription>
                Configure your practice session
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Session Type</Label>
                <Select
                  value={sessionType}
                  onValueChange={(v) => setSessionType(v as typeof sessionType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="practice">Practice Problems</SelectItem>
                    <SelectItem value="speed_drill">Speed Drill</SelectItem>
                    <SelectItem value="revision">Revision</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Number of Problems</Label>
                <Select
                  value={String(problemCount)}
                  onValueChange={(v) => setProblemCount(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 problems</SelectItem>
                    <SelectItem value="10">10 problems</SelectItem>
                    <SelectItem value="20">20 problems</SelectItem>
                    <SelectItem value="30">30 problems</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSessionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartSession}
                disabled={startSession.isPending}
              >
                {startSession.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Start Session
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lesson Viewer */}
        <LessonViewer
          lessonId={viewingLessonId}
          isOpen={!!viewingLessonId}
          onClose={() => setViewingLessonId(null)}
        />
      </>
    );
  }

  // Grid View
  return (
    <>
      {/* Subject Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        {subjectOverviews.map((subject) => {
          const progress =
            subject.total_topics > 0
              ? (subject.topics_mastered / subject.total_topics) * 100
              : 0;

          return (
            <motion.div
              key={subject.subject_code}
              whileHover={{ scale: 1.02 }}
              className="relative overflow-hidden"
            >
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {subject.subject_code === "quant" && "📐"}
                    {subject.subject_code === "varc" && "📚"}
                    {subject.subject_code === "dilr" && "🧩"}
                    {subject.subject_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      {subject.topics_mastered}/{subject.total_topics} mastered
                    </span>
                    <span className="text-sm font-medium">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Topics Grid */}
      <Card>
        <CardHeader>
          <CardTitle>All Topics</CardTitle>
          <CardDescription>
            Click on a topic to view lessons and practice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allTopics.map((topic) => {
                const mastery = masteryColors[topic.mastery_level];
                return (
                  <motion.button
                    key={topic.topic_id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTopicClick(topic)}
                    className={cn(
                      "text-left p-4 rounded-lg border transition-colors",
                      "hover:border-primary/50 hover:bg-muted/50",
                      mastery.bg,
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {topic.topic_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {topic.problems_correct}/{topic.problems_attempted}{" "}
                          correct
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", mastery.text)}
                      >
                        {mastery.label}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <Progress
                        value={topic.accuracy_percent}
                        className="h-1"
                      />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}

// Lesson Card Component
function LessonCard({
  lesson,
  index,
  onView,
  onMarkComplete,
}: {
  lesson: LessonWithProgress;
  index: number;
  onView: () => void;
  onMarkComplete: () => void;
}) {
  const isCompleted = lesson.status === "completed";
  const lessonTypeIcons: Record<LessonType, string> = {
    concept: "📖",
    formula: "📐",
    shortcut: "⚡",
    video: "🎥",
    example: "💡",
  };

  return (
    <Card
      className={cn(
        "transition-colors",
        isCompleted && "border-green-500/30 bg-green-500/5",
      )}
    >
      <CardContent className="pt-4">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              isCompleted
                ? "bg-green-500 text-white"
                : "bg-muted text-muted-foreground",
            )}
          >
            {isCompleted ? <Check className="h-4 w-4" /> : index}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span>{lessonTypeIcons[lesson.lesson_type] || "📄"}</span>
              <h4 className="font-medium truncate">{lesson.title}</h4>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="capitalize">{lesson.lesson_type}</span>
              {lesson.duration_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lesson.duration_minutes} min
                </span>
              )}
            </div>
            {lesson.progress_percent > 0 && lesson.progress_percent < 100 && (
              <Progress value={lesson.progress_percent} className="h-1 mt-2" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={onView}>
              {isCompleted ? "Review" : "Start"}
            </Button>
            {!isCompleted && (
              <Button size="sm" variant="outline" onClick={onMarkComplete}>
                <Check className="h-4 w-4 mr-1" />
                Complete
              </Button>
            )}
            {isCompleted && (
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-500"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Done
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LessonViewer({
  lessonId,
  isOpen,
  onClose,
}: {
  lessonId: string | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch full lesson content
  const { data: lesson, isLoading } = useQuery({
    queryKey: ["cat", "lesson", lessonId],
    queryFn: () => catApi.getLesson(lessonId!),
    enabled: !!lessonId && isOpen,
  });

  const updateProgress = useMutation({
    mutationFn: (payload: LessonProgressPayload) =>
      catApi.updateLessonProgress(lessonId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cat", "lessons"] });
      toast({ title: "Lesson marked as complete!" });
      onClose();
    },
  });

  const handleComplete = () => {
    updateProgress.mutate({
      status: "completed",
      progress_percent: 100,
      time_spent_seconds: 0, // In a real app we'd track this
      is_bookmarked: lesson?.is_bookmarked,
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isLoading ? "Loading..." : lesson?.title}
          </DialogTitle>
          <DialogDescription>
            {lesson && `${lesson.topic_name} • ${lesson.lesson_type}`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6 pt-2">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : lesson ? (
            <div className="space-y-6">
              {lesson.video_url && (
                <div className="aspect-video bg-background rounded-lg overflow-hidden flex items-center justify-center">
                  {/* Handle various video sources if needed, for now assuming direct link or standard embed */}
                  {lesson.video_url.includes("youtube") ||
                  lesson.video_url.includes("vimeo") ? (
                    <iframe
                      src={lesson.video_url.replace("watch?v=", "embed/")}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  ) : (
                    <video
                      controls
                      src={lesson.video_url}
                      className="w-full h-full"
                    />
                  )}
                </div>
              )}

              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {lesson.content}
                </ReactMarkdown>
              </div>

              {lesson.examples && lesson.examples.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Examples
                  </h3>
                  {lesson.examples.map((ex, i) => (
                    <Card key={i} className="bg-muted/30">
                      <CardContent className="pt-4 space-y-3">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            Problem
                          </Badge>
                          <p className="text-sm font-medium">{ex.problem}</p>
                        </div>
                        <div>
                          <Badge
                            variant="outline"
                            className="mb-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          >
                            Solution
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            {ex.solution}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Failed to load lesson content.
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-4 border-t bg-muted/20">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={handleComplete}
            disabled={updateProgress.isPending || !lesson}
          >
            {updateProgress.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark as Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Problem Card Component
function ProblemCard({ problem }: { problem: Problem }) {
  const difficultyColor = difficultyColors[problem.difficulty];

  return (
    <Card className="hover:border-primary/30 transition-colors cursor-pointer">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm line-clamp-2">{problem.question_text}</p>
          <Badge
            variant="outline"
            className={cn("text-xs flex-shrink-0", difficultyColor)}
          >
            {problem.difficulty}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-3">
          {problem.is_real_cat && (
            <Badge className="bg-red-500/20 text-red-400 text-xs">
              PYQ {problem.cat_year}
            </Badge>
          )}
          {problem.attempted && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                problem.is_correct ? "text-green-400" : "text-red-400",
              )}
            >
              {problem.is_correct ? "Correct" : "Incorrect"}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ========================
// NOTES SECTION
// ========================
function NotesSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: subjects } = useQuery({
    queryKey: ["cat-subjects"],
    queryFn: () => catApi.getSubjects(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["cat-notes-search", searchQuery],
    queryFn: () => catApi.searchNotes({ q: searchQuery }),
    enabled: searchQuery.length > 0,
  });

  const { data: topicNotes, isLoading } = useQuery({
    queryKey: ["cat-notes-topic", selectedTopic],
    queryFn: () => catApi.getTopicNotes(selectedTopic),
    enabled: selectedTopic !== "all" && !searchQuery,
  });

  const allTopics = useMemo(() => {
    if (!subjects) return [];
    return subjects.flatMap((s) =>
      s.topics.map((t) => ({ id: t.id, title: t.title, icon: s.icon })),
    );
  }, [subjects]);

  const displayNotes = searchQuery ? searchResults : topicNotes;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => catApi.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cat-notes"] });
      toast({ title: "Note deleted" });
    },
  });

  const generateFlashcardsMutation = useMutation({
    mutationFn: (noteId: string) => catApi.generateFlashcardsFromNote(noteId),
    onSuccess: (data) => {
      toast({ title: `Created ${data.length} flashcards!` });
    },
  });

  return (
    <>
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="pl-9"
          />
        </div>
        <Select value={selectedTopic} onValueChange={setSelectedTopic}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {allTopics.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.icon} {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Note
        </Button>
      </div>

      {/* Notes Grid */}
      {isLoading || isSearching ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : displayNotes && displayNotes.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayNotes.map((note: Note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
            >
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base line-clamp-1">
                    {note.title}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {note.content}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditNote(note);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateFlashcardsMutation.mutate(note.id)}
                      disabled={generateFlashcardsMutation.isPending}
                    >
                      <Sparkles className="h-3 w-3 mr-1" /> Cards
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => deleteMutation.mutate(note.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <StickyNote className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">No notes yet</h3>
          <p className="text-muted-foreground mb-4">
            {selectedTopic === "all"
              ? "Start taking notes to organize your learning"
              : "No notes for this topic yet"}
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Note
          </Button>
        </div>
      )}

      {/* Note Dialog */}
      <NoteDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditNote(null);
        }}
        note={editNote}
        topics={allTopics}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["cat-notes"] });
          setDialogOpen(false);
          setEditNote(null);
        }}
      />
    </>
  );
}

function NoteDialog({
  open,
  onOpenChange,
  note,
  topics,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  topics: { id: string; title: string; icon: string }[];
  onSuccess: () => void;
}) {
  const [topicId, setTopicId] = useState(note?.topic_id || "");
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (p: CreateNotePayload) => catApi.createNote(p),
    onSuccess: () => {
      toast({ title: "Note created" });
      onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...p }: { id: string } & Partial<CreateNotePayload>) =>
      catApi.updateNote(id, p),
    onSuccess: () => {
      toast({ title: "Note updated" });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (note) {
      updateMutation.mutate({ id: note.id, topic_id: topicId, title, content });
    } else {
      createMutation.mutate({ topic_id: topicId, title, content });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{note ? "Edit Note" : "Create Note"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Topic</Label>
            <Select value={topicId} onValueChange={setTopicId}>
              <SelectTrigger>
                <SelectValue placeholder="Select topic" />
              </SelectTrigger>
              <SelectContent>
                {topics.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.icon} {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!topicId || !title || !content}>
              {note ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ========================
// FLASHCARDS SECTION
// ========================
function FlashcardsSection() {
  const [mode, setMode] = useState<"browse" | "review">("browse");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: subjects } = useQuery({
    queryKey: ["cat-subjects"],
    queryFn: () => catApi.getSubjects(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: dueCards, isLoading: isDueLoading } = useQuery({
    queryKey: ["cat-flashcards-due"],
    queryFn: () => catApi.getDueFlashcards(50),
    staleTime: 1 * 60 * 1000,
  });

  const { data: topicCards, isLoading: isTopicLoading } = useQuery({
    queryKey: ["cat-flashcards-topic", selectedTopic],
    queryFn: () => catApi.getTopicFlashcards(selectedTopic),
    enabled: selectedTopic !== "all",
  });

  const allTopics = useMemo(() => {
    if (!subjects) return [];
    return subjects.flatMap((s) =>
      s.topics.map((t) => ({ id: t.id, title: t.title, icon: s.icon })),
    );
  }, [subjects]);

  const displayCards = selectedTopic === "all" ? dueCards : topicCards;
  const isLoading = selectedTopic === "all" ? isDueLoading : isTopicLoading;

  return (
    <>
      {mode === "review" && dueCards ? (
        <ReviewModeComponent
          cards={dueCards}
          onComplete={() => {
            setMode("browse");
            queryClient.invalidateQueries({ queryKey: ["cat-flashcards"] });
          }}
        />
      ) : (
        <>
          {/* Header with Actions */}
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Filter by topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Due Cards ({dueCards?.length || 0})
                </SelectItem>
                {allTopics.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.icon} {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 ml-auto">
              {dueCards && dueCards.length > 0 && (
                <Button
                  onClick={() => setMode("review")}
                  className="bg-gradient-to-r from-violet-500 to-purple-600"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Review {dueCards.length} Due
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Card
              </Button>
            </div>
          </div>

          {/* Cards Grid */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : displayCards && displayCards.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayCards.map((card: Flashcard) => (
                <FlashcardPreviewCard key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">
                {selectedTopic === "all"
                  ? "No cards due for review!"
                  : "No flashcards"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {selectedTopic === "all"
                  ? "Great job! Check back later."
                  : "Create flashcards from notes or add manually."}
              </p>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" /> Create Card
              </Button>
            </div>
          )}
        </>
      )}

      <CreateFlashcardDialog
        open={createDialogOpen}
        topics={allTopics}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["cat-flashcards"] });
          setCreateDialogOpen(false);
        }}
      />
    </>
  );
}

function FlashcardPreviewCard({ card }: { card: Flashcard }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="cursor-pointer"
      onClick={() => setFlipped(!flipped)}
    >
      <Card className="h-40 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={flipped ? "back" : "front"}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 p-4 flex flex-col"
          >
            <Badge
              className="self-start mb-2"
              variant={flipped ? "secondary" : "outline"}
            >
              {flipped ? "Answer" : "Question"}
            </Badge>
            <p className="flex-1 text-sm overflow-y-auto">
              {flipped ? card.answer : card.question}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Click to flip</p>
          </motion.div>
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

function ReviewModeComponent({
  cards,
  onComplete,
}: {
  cards: Flashcard[];
  onComplete: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState<{ id: string; correct: boolean }[]>(
    [],
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const reviewMutation = useMutation({
    mutationFn: ({ id, correct }: { id: string; correct: boolean }) =>
      catApi.reviewFlashcard(id, correct),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["cat-flashcards"] }),
  });

  const currentCard = cards[currentIndex];
  const progress = (reviewed.length / cards.length) * 100;
  const correctCount = reviewed.filter((r) => r.correct).length;

  const handleReview = (correct: boolean) => {
    reviewMutation.mutate({ id: currentCard.id, correct });
    setReviewed([...reviewed, { id: currentCard.id, correct }]);
    setFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      toast({
        title: `Session complete! ${correctCount + (correct ? 1 : 0)}/${cards.length} correct`,
      });
      onComplete();
    }
  };

  if (!currentCard) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onComplete}>
          <X className="h-4 w-4 mr-2" /> Exit
        </Button>
        <Badge variant="secondary">
          {currentIndex + 1} / {cards.length}
        </Badge>
      </div>

      <Progress value={progress} className="h-2" />

      <motion.div
        className="min-h-[300px] cursor-pointer"
        onClick={() => setFlipped(!flipped)}
      >
        <Card className="h-full">
          <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={flipped ? "back" : "front"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <Badge
                  className="mb-4"
                  variant={flipped ? "default" : "outline"}
                >
                  {flipped ? "Answer" : "Question"}
                </Badge>
                <p className="text-xl">
                  {flipped ? currentCard.answer : currentCard.question}
                </p>
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {flipped ? (
        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            variant="outline"
            className="text-red-500 border-red-500"
            onClick={() => handleReview(false)}
          >
            <X className="h-5 w-5 mr-2" /> Incorrect
          </Button>
          <Button
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-600"
            onClick={() => handleReview(true)}
          >
            <CheckCircle2 className="h-5 w-5 mr-2" /> Correct
          </Button>
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          Click the card to reveal the answer
        </div>
      )}
    </div>
  );
}

function CreateFlashcardDialog({
  open,
  topics,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  topics: { id: string; title: string; icon: string }[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [topicId, setTopicId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (p: CreateFlashcardPayload) => catApi.createFlashcard(p),
    onSuccess: () => {
      toast({ title: "Flashcard created" });
      setQuestion("");
      setAnswer("");
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ topic_id: topicId, question, answer });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Flashcard</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Topic</Label>
            <Select value={topicId} onValueChange={setTopicId}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {topics.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.icon} {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Question</Label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label>Answer</Label>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!topicId || !question || !answer || mutation.isPending}
            >
              {mutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
