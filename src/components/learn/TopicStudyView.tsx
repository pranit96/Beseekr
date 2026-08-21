import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, BookOpen, Layers, Terminal, CheckSquare, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { PlanTopic } from "@/types/education";
import { LearnTab } from "./LearnTab";
import { FlashcardsTab } from "./FlashcardsTab";
import { HandsOnTab } from "./HandsOnTab";
import { QuizTab } from "./QuizTab";
import { TopicStatusBadge } from "./TopicStatusBadge";
import { useJobStatus } from "@/hooks/useJobStatus";
import { 
  useGeneratePrep, 
  useGenerateHandsOn, 
  useReviewFlashcard,
  useGenerateExam,
  useSubmitExam,
  useExam,
  useUpdateTopicStatus,
  useQueuePrepContent,
  useQueueHandsOn,
  useResumePlan,
} from "@/hooks/use-education";

interface TopicStudyViewProps {
  planId: string;
  topic: PlanTopic | null;
  allTopics?: PlanTopic[];
  onBack: () => void;
  onTopicSelect?: (topicId: string) => void;
}

export function TopicStudyView({ 
  planId, 
  topic, 
  allTopics = [], 
  onBack, 
  onTopicSelect 
}: TopicStudyViewProps) {
  // Direct (synchronous) mutations — kept as fallback
  const generatePrepMutation = useGeneratePrep(planId);
  const generateHandsOnMutation = useGenerateHandsOn(planId);
  const reviewFlashcardMutation = useReviewFlashcard(planId);
  const generateExamMutation = useGenerateExam();
  
  // Background queue mutations
  const queuePrepMutation = useQueuePrepContent?.(planId);
  const queueHandsOnMutation = useQueueHandsOn?.(planId);
  const resumePlanQuery = useResumePlan?.(planId);

  // Track background job IDs for polling
  const [prepJobId, setPrepJobId] = React.useState<string | null>(null);
  const [handsOnJobId, setHandsOnJobId] = React.useState<string | null>(null);

  // Poll job status while pending
  const prepJob = useJobStatus(prepJobId, {
    onComplete: () => {
      setPrepJobId(null);
      // Refresh the topic data so the study guide appears
      resumePlanQuery?.refetch?.();
    },
  });
  const handsOnJob = useJobStatus(handsOnJobId, {
    onComplete: () => {
      setHandsOnJobId(null);
      resumePlanQuery?.refetch?.();
    },
  });

  const [examId, setExamId] = React.useState<string | undefined>();
  const { data: examRes, isLoading: isExamLoading } = useExam(examId);
  const submitExamMutation = useSubmitExam(examId || "");
  const updateStatusMutation = useUpdateTopicStatus(planId);

  const [submission, setSubmission] = React.useState<any>(null);

  if (!topic) return null;

  const currentIdx = allTopics.findIndex((t) => t.id === topic.id);
  const nextTopic = currentIdx >= 0 && currentIdx < allTopics.length - 1 ? allTopics[currentIdx + 1] : null;
  const isCompleted = topic.status === "completed";

  const isPrepGenerating = generatePrepMutation.isPending || prepJob.isLoading;
  const isHandsOnGenerating = generateHandsOnMutation.isPending || handsOnJob.isLoading;

  const handleGeneratePrep = () => {
    // Prefer queue endpoint; fall back to sync if queue hooks unavailable
    if (queuePrepMutation) {
      queuePrepMutation.mutate(topic.id, {
        onSuccess: (res: any) => {
          const jobId = res?.data?.job_id;
          if (jobId) setPrepJobId(jobId);
        },
        onError: () => {
          // Fallback to synchronous if queue fails
          generatePrepMutation.mutate(topic.id);
        },
      });
    } else {
      generatePrepMutation.mutate(topic.id);
    }
  };

  const handleGenerateHandsOn = () => {
    if (queueHandsOnMutation) {
      queueHandsOnMutation.mutate(topic.id, {
        onSuccess: (res: any) => {
          const jobId = res?.data?.job_id;
          if (jobId) setHandsOnJobId(jobId);
        },
        onError: () => {
          generateHandsOnMutation.mutate(topic.id);
        },
      });
    } else {
      generateHandsOnMutation.mutate(topic.id);
    }
  };

  const handleGenerateQuiz = () => {
    generateExamMutation.mutate({
      plan_id: planId,
      title: `${topic.topic_name} Quiz`,
      subject: topic.topic_name,
      type: "topic_test",
      topics: [topic.topic_name],
      question_count: 5
    }, {
      onSuccess: (res) => {
        if (res.data) setExamId(res.data.id);
      }
    });
  };

  const handleMarkComplete = () => {
    updateStatusMutation.mutate({ topicId: topic.id, status: "completed" });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{topic.topic_name}</h1>
              <TopicStatusBadge status={topic.status} />
            </div>
            <p className="text-muted-foreground line-clamp-1 max-w-2xl text-sm mt-1">{topic.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isCompleted ? (
            <Button 
              className="bg-teal-500 hover:bg-teal-600 text-white gap-1.5 shadow-lg shadow-teal-500/10"
              onClick={handleMarkComplete}
              disabled={updateStatusMutation.isPending}
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark Complete & Unlock Next
            </Button>
          ) : (
            nextTopic && onTopicSelect && (
              <Button
                onClick={() => onTopicSelect(nextTopic.id)}
                className="bg-teal-500 hover:bg-teal-600 text-white gap-1.5 shadow-lg shadow-teal-500/10"
              >
                <span>Next Topic: {nextTopic.topic_name}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            )
          )}
        </div>
      </div>

      <Tabs defaultValue="learn" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto mb-8 bg-card/10 border border-border/30 p-1 rounded-2xl h-14">
          <TabsTrigger value="learn" className="rounded-xl h-full data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
            <BookOpen className="w-4 h-4 mr-2 hidden sm:block" /> Learn
          </TabsTrigger>
          <TabsTrigger value="cards" className="rounded-xl h-full data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
            <Layers className="w-4 h-4 mr-2 hidden sm:block" /> Cards
          </TabsTrigger>
          <TabsTrigger value="build" className="rounded-xl h-full data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
            <Terminal className="w-4 h-4 mr-2 hidden sm:block" /> Build
          </TabsTrigger>
          <TabsTrigger value="quiz" className="rounded-xl h-full data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
            <CheckSquare className="w-4 h-4 mr-2 hidden sm:block" /> Quiz
          </TabsTrigger>
        </TabsList>
        
        <div className="min-h-[500px]">
          <TabsContent value="learn" className="mt-0 outline-none">
            {prepJob.isLoading && prepJobId && (
              <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-sm text-teal-300">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>
                  Generating your study guide in the background
                  {prepJob.elapsed > 0 && <span className="text-teal-400/70 ml-1">({prepJob.elapsed}s)</span>}
                  {prepJob.status === "pending" && <span className="ml-1 text-teal-400/60">· queued</span>}
                  {prepJob.status === "processing" && <span className="ml-1 text-teal-400/60">· AI is writing…</span>}
                </span>
              </div>
            )}
            {prepJob.error && (
              <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
                Generation failed: {prepJob.error} — try again.
              </div>
            )}
            <LearnTab 
              content={topic.prep_summary} 
              isLoading={isPrepGenerating} 
              onGenerate={handleGeneratePrep} 
            />
          </TabsContent>
          
          <TabsContent value="cards" className="mt-0 outline-none">
            <FlashcardsTab 
              flashcards={topic.flashcards} 
              onRate={(index, rating) => reviewFlashcardMutation.mutate({ topicId: topic.id, questionIndex: index, rating })}
            />
          </TabsContent>
          
          <TabsContent value="build" className="mt-0 outline-none">
            {handsOnJob.isLoading && handsOnJobId && (
              <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-sm text-teal-300">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>
                  Building exercises in the background
                  {handsOnJob.elapsed > 0 && <span className="text-teal-400/70 ml-1">({handsOnJob.elapsed}s)</span>}
                  {handsOnJob.status === "pending" && <span className="ml-1 text-teal-400/60">· queued</span>}
                  {handsOnJob.status === "processing" && <span className="ml-1 text-teal-400/60">· AI is writing…</span>}
                </span>
              </div>
            )}
            {handsOnJob.error && (
              <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
                Generation failed: {handsOnJob.error} — try again.
              </div>
            )}
            <HandsOnTab 
              exercises={topic.hands_on_exercises}
              isLoading={isHandsOnGenerating}
              onGenerate={handleGenerateHandsOn}
            />
          </TabsContent>
          
          <TabsContent value="quiz" className="mt-0 outline-none">
            <QuizTab 
              exam={examRes?.data || null}
              submission={submission}
              isLoading={isExamLoading}
              isGenerating={generateExamMutation.isPending}
              isSubmitting={submitExamMutation.isPending}
              onGenerate={handleGenerateQuiz}
              onSubmit={(answers) => {
                submitExamMutation.mutate(answers, {
                  onSuccess: (res) => {
                    if (res.data) setSubmission(res.data);
                  }
                });
              }}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
