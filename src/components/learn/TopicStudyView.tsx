import React from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Layers,
  Terminal,
  CheckSquare,
  CheckCircle2,
  Clock,
  Loader2,
  Crown,
  Sparkles,
  Zap,
} from "lucide-react";
import { PlanTopic } from "@/types/education";
import { LearnTab } from "./LearnTab";
import { FlashcardsTab } from "./FlashcardsTab";
import { HandsOnTab } from "./HandsOnTab";
import { QuizTab } from "./QuizTab";
import { TopicStatusBadge } from "./TopicStatusBadge";
import { PricingDialog } from "@/components/PricingDialog";
import { useJobStatus } from "@/hooks/useJobStatus";
import { useAuth } from "@/contexts/AuthContext";
import {
  educationKeys,
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
  type QueueJobResponse,
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
  onTopicSelect,
}: TopicStudyViewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userTier = user?.tier || "free";

  // Direct (synchronous) mutations — kept as fallback
  const generatePrepMutation = useGeneratePrep(planId);
  const generateHandsOnMutation = useGenerateHandsOn(planId);
  const reviewFlashcardMutation = useReviewFlashcard(planId);
  const generateExamMutation = useGenerateExam();

  // Background queue mutations
  const queuePrepMutation = useQueuePrepContent?.(planId);
  const queueHandsOnMutation = useQueueHandsOn?.(planId);
  const resumePlanQuery = useResumePlan?.(planId);

  const queryClient = useQueryClient();

  // Track background job IDs for polling
  const [prepJobId, setPrepJobId] = React.useState<string | null>(null);
  const [handsOnJobId, setHandsOnJobId] = React.useState<string | null>(null);

  // Poll job status while pending (stabilized callbacks)
  const onPrepComplete = React.useCallback(() => {
    setPrepJobId(null);
    queryClient.invalidateQueries({ queryKey: educationKeys.plan(planId) });
    queryClient.invalidateQueries({ queryKey: educationKeys.planResume(planId) });
  }, [queryClient, planId]);

  const onHandsOnComplete = React.useCallback(() => {
    setHandsOnJobId(null);
    queryClient.invalidateQueries({ queryKey: educationKeys.plan(planId) });
    queryClient.invalidateQueries({ queryKey: educationKeys.planResume(planId) });
  }, [queryClient, planId]);

  const prepJob = useJobStatus(prepJobId, { onComplete: onPrepComplete });
  const handsOnJob = useJobStatus(handsOnJobId, { onComplete: onHandsOnComplete });

  const [examId, setExamId] = React.useState<string | undefined>();
  const { data: examRes, isLoading: isExamLoading } = useExam(examId);
  const submitExamMutation = useSubmitExam(examId || "");
  const updateStatusMutation = useUpdateTopicStatus(planId);

  const [submission, setSubmission] = React.useState<any>(null);
  const [isPricingOpen, setIsPricingOpen] = React.useState(false);
  const [pricingTier, setPricingTier] = React.useState<"pro" | "ultra">("ultra");
  const [isPrepQueuedOffPeak, setIsPrepQueuedOffPeak] = React.useState(false);
  const [isHandsOnQueuedOffPeak, setIsHandsOnQueuedOffPeak] = React.useState(false);
  const [isQuizQueuedOffPeak, setIsQuizQueuedOffPeak] = React.useState(false);

  if (!topic) {
    return (
      <div className="max-w-6xl mx-auto p-8 space-y-6">
        <Button variant="ghost" onClick={onBack} className="gap-2 -ml-2">
          <ArrowLeft className="w-4 h-4" /> Back to Topics
        </Button>
        <div className="p-12 text-center border border-border/40 rounded-3xl bg-card/10 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-400" />
          <p className="text-muted-foreground text-sm">Loading topic details...</p>
        </div>
      </div>
    );
  }

  const currentIdx = allTopics.findIndex((t) => t.id === topic.id);
  const nextTopic =
    currentIdx >= 0 && currentIdx < allTopics.length - 1
      ? allTopics[currentIdx + 1]
      : null;
  const isCompleted = topic.status === "completed";

  const isPrepGenerating =
    generatePrepMutation.isPending ||
    Boolean(queuePrepMutation?.isPending) ||
    prepJob.isLoading ||
    Boolean(prepJobId);
  const isHandsOnGenerating =
    generateHandsOnMutation.isPending ||
    Boolean(queueHandsOnMutation?.isPending) ||
    handsOnJob.isLoading ||
    Boolean(handsOnJobId);

  const hasActualContent = Boolean(
    (topic.prep_summary && topic.prep_summary.trim().length > 0) ||
    (topic.hands_on_exercises && topic.hands_on_exercises.length > 0) ||
    (topic.flashcards && topic.flashcards.length > 0) ||
    (topic.key_concepts && topic.key_concepts.length > 0),
  );

  const handleGeneratePrep = () => {
    if (queuePrepMutation) {
      queuePrepMutation.mutate(topic.id, {
        onSuccess: (res: QueueJobResponse) => {
          if (res.sync) {
            // Ultra tier: content already saved, just refresh the plan
            queryClient.invalidateQueries({ queryKey: educationKeys.plan(planId) });
            queryClient.invalidateQueries({ queryKey: educationKeys.planResume(planId) });
          } else if (res.tier === "free") {
            // Free tier: scheduled for 4 AM IST batch — show off-peak card
            setIsPrepQueuedOffPeak(true);
          } else if (res.job_id) {
            // Pro tier: start polling
            setPrepJobId(res.job_id);
          }
        },
        onError: () => {
          // Fallback to direct (synchronous) generation
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
        onSuccess: (res: QueueJobResponse) => {
          if (res.sync) {
            queryClient.invalidateQueries({ queryKey: educationKeys.plan(planId) });
            queryClient.invalidateQueries({ queryKey: educationKeys.planResume(planId) });
          } else if (res.tier === "free") {
            setIsHandsOnQueuedOffPeak(true);
          } else if (res.job_id) {
            setHandsOnJobId(res.job_id);
          }
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
    if (userTier === "free") {
      setIsQuizQueuedOffPeak(true);
      return;
    }

    generateExamMutation.mutate(
      {
        plan_id: planId,
        title: `${topic.topic_name} Quiz`,
        subject: topic.topic_name,
        type: "topic_test",
        topics: [topic.topic_name],
        question_count: 5,
      },
      {
        onSuccess: (res) => {
          if (res.data) setExamId(res.data.id);
        },
      },
    );
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
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{topic.topic_name}</h1>
              <TopicStatusBadge status={topic.status} />
              {userTier === "ultra" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Crown className="w-3 h-3" /> Ultra (Claude Sonnet)
                </span>
              ) : userTier === "pro" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/30">
                  <Zap className="w-3 h-3" /> Pro Priority Queue
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/30">
                  Free Tier
                </span>
              )}
            </div>
            <p className="text-muted-foreground line-clamp-1 max-w-2xl text-sm mt-1">
              {topic.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasActualContent && !isCompleted && (
            <Button
              className="bg-teal-500 hover:bg-teal-600 text-white gap-1.5 shadow-lg shadow-teal-500/10"
              onClick={handleMarkComplete}
              disabled={updateStatusMutation.isPending}
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark Complete & Unlock Next
            </Button>
          )}
          {isCompleted && nextTopic && onTopicSelect && (
            <Button
              onClick={() => onTopicSelect(nextTopic.id)}
              className="bg-teal-500 hover:bg-teal-600 text-white gap-1.5 shadow-lg shadow-teal-500/10"
            >
              <span>Next Topic: {nextTopic.topic_name}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Upgrade Callout for Free & Pro Tiers */}
      {userTier === "free" && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-amber-500/10 border border-teal-500/30 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">
                Upgrade to Ultra for Instant Generation with Claude Sonnet
              </div>
              <div className="text-xs text-muted-foreground">
                Free tier runs off-peak (4:00 AM IST). Get instant 8,000-token
                study guides & priority coding challenges.
              </div>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setPricingTier("ultra");
              setIsPricingOpen(true);
            }}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold gap-1.5 shrink-0 shadow-lg shadow-teal-500/20"
          >
            <Crown className="w-4 h-4 text-amber-300" />
            Upgrade Plan
          </Button>
        </div>
      )}

      {userTier === "pro" && (
        <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-card/40 border border-border/50 flex-wrap text-sm">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <Zap className="w-4 h-4 text-teal-400 shrink-0" />
            <span>
              You're on <strong>Pro Tier</strong> (Priority 1 Queue). Want zero
              wait time?
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setPricingTier("ultra");
              setIsPricingOpen(true);
            }}
            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 font-semibold gap-1 h-8 px-3"
          >
            <Crown className="w-3.5 h-3.5" />
            Upgrade to Ultra
          </Button>
        </div>
      )}

      <Tabs defaultValue="learn" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto mb-8 bg-card/10 border border-border/30 p-1 rounded-2xl h-14">
          <TabsTrigger
            value="learn"
            className="rounded-xl h-full data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400"
          >
            <BookOpen className="w-4 h-4 mr-2 hidden sm:block" /> Learn
          </TabsTrigger>
          <TabsTrigger
            value="cards"
            className="rounded-xl h-full data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400"
          >
            <Layers className="w-4 h-4 mr-2 hidden sm:block" /> Cards
          </TabsTrigger>
          <TabsTrigger
            value="build"
            className="rounded-xl h-full data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400"
          >
            <Terminal className="w-4 h-4 mr-2 hidden sm:block" /> Build
          </TabsTrigger>
          <TabsTrigger
            value="quiz"
            className="rounded-xl h-full data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400"
          >
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
                  {prepJob.elapsed > 0 && (
                    <span className="text-teal-400/70 ml-1">
                      ({prepJob.elapsed}s)
                    </span>
                  )}
                  {prepJob.status === "pending" && (
                    <span className="ml-1 text-teal-400/60">· queued</span>
                  )}
                  {prepJob.status === "processing" && (
                    <span className="ml-1 text-teal-400/60">
                      · AI is writing…
                    </span>
                  )}
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
              jobStatus={prepJob.status}
              elapsedSeconds={prepJob.elapsed}
              isQueuedForOffPeak={isPrepQueuedOffPeak}
              onUpgradeClick={() => {
                setPricingTier("ultra");
                setIsPricingOpen(true);
              }}
            />
          </TabsContent>

          <TabsContent value="cards" className="mt-0 outline-none">
            <FlashcardsTab
              flashcards={topic.flashcards}
              isGenerating={isPrepGenerating}
              isQueuedForOffPeak={isPrepQueuedOffPeak}
              onUpgradeClick={() => {
                setPricingTier("ultra");
                setIsPricingOpen(true);
              }}
              onRate={(index, rating) =>
                reviewFlashcardMutation.mutate({
                  topicId: topic.id,
                  questionIndex: index,
                  rating,
                })
              }
            />
          </TabsContent>

          <TabsContent value="build" className="mt-0 outline-none">
            {handsOnJob.isLoading && handsOnJobId && (
              <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-sm text-teal-300">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>
                  Building exercises in the background
                  {handsOnJob.elapsed > 0 && (
                    <span className="text-teal-400/70 ml-1">
                      ({handsOnJob.elapsed}s)
                    </span>
                  )}
                  {handsOnJob.status === "pending" && (
                    <span className="ml-1 text-teal-400/60">· queued</span>
                  )}
                  {handsOnJob.status === "processing" && (
                    <span className="ml-1 text-teal-400/60">
                      · AI is writing…
                    </span>
                  )}
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
              jobStatus={handsOnJob.status}
              elapsedSeconds={handsOnJob.elapsed}
              isQueuedForOffPeak={isHandsOnQueuedOffPeak}
              onUpgradeClick={() => {
                setPricingTier("ultra");
                setIsPricingOpen(true);
              }}
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
              isQueuedForOffPeak={isQuizQueuedOffPeak}
              onUpgradeClick={() => {
                setPricingTier("ultra");
                setIsPricingOpen(true);
              }}
              onSubmit={(answers) => {
                submitExamMutation.mutate(answers, {
                  onSuccess: (res) => {
                    if (res.data) setSubmission(res.data);
                  },
                });
              }}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* Instant In-Place Pricing Dialog */}
      <PricingDialog
        open={isPricingOpen}
        onOpenChange={setIsPricingOpen}
        defaultTier={pricingTier}
      />
    </div>
  );
}
