import React, { useState } from "react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { Button } from "@/components/ui/button";
import { PlanDashboard } from "@/components/learn/PlanDashboard";
import { CreatePlanForm } from "@/components/learn/CreatePlanForm";
import { PlanDetailView } from "@/components/learn/PlanDetailView";
import { TopicStudyView } from "@/components/learn/TopicStudyView";
import {
  useLearningPlan,
  usePlanResume,
  useUpdateTopicStatus,
} from "@/hooks/use-education";

import { useToast } from "@/hooks/use-toast";

type ViewState = "dashboard" | "create" | "detail" | "study";

export default function LearnByDoing() {
  const { toast } = useToast();
  const [view, setView] = useState<ViewState>("dashboard");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Queries for detail/study views
  const { data: planData, isLoading: isPlanLoading } = useLearningPlan(
    selectedPlanId || undefined,
  );
  const { data: resumeData, isLoading: isResumeLoading } = usePlanResume(
    selectedPlanId || undefined,
  );
  const updateStatusMutation = useUpdateTopicStatus(selectedPlanId || "");

  const handleCreatePlanSuccess = (planId: string) => {
    setSelectedPlanId(planId);
    setView("detail");
  };

  const handlePlanSelect = (planId: string, topicId?: string) => {
    setSelectedPlanId(planId);
    if (topicId) {
      setSelectedTopicId(topicId);
      setView("study");
    } else {
      setView("detail");
    }
  };

  const handleTopicSelect = (topicId: string) => {
    const topics = planData?.data?.topics || [];
    const topicIdx = topics.findIndex((t) => t.id === topicId);

    // Lock guard: Topic can only be opened if it's the first topic, already completed, or all prior topics are completed
    if (topicIdx > 0) {
      const isCompleted = topics[topicIdx]?.status === "completed";
      const isUnlocked = topics
        .slice(0, topicIdx)
        .every((t) => t.status === "completed");
      if (!isCompleted && !isUnlocked) {
        toast({
          title: "Topic Locked",
          description: "Complete the preceding topics first to unlock this topic.",
          variant: "destructive",
        });
        return;
      }
    }

    setSelectedTopicId(topicId);

    // Auto-mark as in_progress when starting a pending topic
    const topic = topics[topicIdx];
    if (topic && topic.status === "pending") {
      updateStatusMutation.mutate({ topicId, status: "in_progress" });
    }

    setView("study");
  };

  const handleBackToDashboard = () => {
    setSelectedPlanId(null);
    setSelectedTopicId(null);
    setView("dashboard");
  };

  const handleBackToDetail = () => {
    setSelectedTopicId(null);
    setView("detail");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="flex-1 flex flex-col h-screen w-full transition-all duration-300">
        <GlobalHeader />

        <main className="flex-1 overflow-y-auto custom-scrollbar relative bg-background">
          {/* Subtle background glow effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-32">
            {view === "dashboard" && (
              <PlanDashboard
                onCreateClick={() => setView("create")}
                onPlanSelect={handlePlanSelect}
              />
            )}

            {view === "create" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Button
                  variant="ghost"
                  onClick={handleBackToDashboard}
                  className="mb-6 -ml-4"
                >
                  &larr; Back to Dashboard
                </Button>
                <CreatePlanForm onSuccess={handleCreatePlanSuccess} />
              </div>
            )}

            {view === "detail" && selectedPlanId && (
              <div className="animate-in fade-in duration-300">
                <PlanDetailView
                  planId={selectedPlanId}
                  resumeData={resumeData?.data || null}
                  isLoading={isResumeLoading || isPlanLoading}
                  onBack={handleBackToDashboard}
                  onTopicSelect={handleTopicSelect}
                />
              </div>
            )}

            {view === "study" && selectedPlanId && selectedTopicId && (
              <div className="animate-in fade-in duration-300 h-full">
                <TopicStudyView
                  planId={selectedPlanId}
                  topic={
                    planData?.data?.topics.find(
                      (t) => t.id === selectedTopicId,
                    ) || null
                  }
                  allTopics={planData?.data?.topics || []}
                  onBack={handleBackToDetail}
                  onTopicSelect={handleTopicSelect}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
