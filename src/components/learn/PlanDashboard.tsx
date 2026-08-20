import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, ChevronRight, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanProgressRing } from "./PlanProgressRing";
import { useLearningPlans, usePlanResume } from "@/hooks/use-education";
import { LearningPlan } from "@/types/education";
import { Skeleton } from "@/components/ui/skeleton";

interface PlanDashboardProps {
  onCreateClick: () => void;
  onPlanSelect: (planId: string, topicId?: string) => void;
}

function PlanCard({ 
  plan, 
  onSelect 
}: { 
  plan: LearningPlan; 
  onSelect: (planId: string, topicId?: string) => void;
}) {
  const { data: resumeData, isLoading } = usePlanResume(plan.id);

  const progress = resumeData?.data?.progress?.percentage || 0;
  const resumeTopic = resumeData?.data?.resume_topic;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative flex flex-col justify-between p-6 bg-card/5 backdrop-blur-xl border border-border/30 rounded-3xl hover:bg-teal-500/[0.05] hover:border-teal-500/30 transition-colors duration-300"
      role="article"
      aria-label={`Plan: ${plan.title}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-500 mb-1">
            {plan.subject}
          </div>
          <h3 className="text-lg font-bold text-foreground line-clamp-2">
            {plan.title}
          </h3>
          <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
            {plan.exam_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(plan.exam_date).toLocaleDateString()}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {plan.daily_study_hours}h / day
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 ml-4">
          <PlanProgressRing percentage={progress} size={56} strokeWidth={5} />
        </div>
      </div>

      <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
        <div className="text-sm text-muted-foreground truncate mr-4">
          {isLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : resumeTopic ? (
            <span className="truncate">Up next: {resumeTopic.topic_name}</span>
          ) : progress === 100 ? (
            <span className="text-teal-500 font-medium">Plan completed!</span>
          ) : (
            <span>Ready to start</span>
          )}
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-teal-500 hover:text-teal-400 hover:bg-teal-500/10 -mr-2"
          onClick={() => onSelect(plan.id, resumeTopic?.id)}
          aria-label={`Continue learning ${plan.title}`}
        >
          Continue <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}

export function PlanDashboard({ onCreateClick, onPlanSelect }: PlanDashboardProps) {
  const { data: plansRes, isLoading, error } = useLearningPlans();
  const plans = plansRes?.data || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[200px] rounded-3xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-500/10 rounded-3xl border border-red-500/20">
        Failed to load learning plans. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Learning Plans</h2>
          <p className="text-muted-foreground mt-1">Pick up where you left off or start something new.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
        <motion.div
          whileHover={{ y: -4 }}
          onClick={onCreateClick}
          className="cursor-pointer flex flex-col items-center justify-center p-6 min-h-[200px] border-2 border-dashed border-teal-500/30 rounded-3xl bg-teal-500/[0.02] hover:bg-teal-500/[0.05] hover:border-teal-500/50 transition-all duration-300"
          role="listitem"
        >
          <div className="w-14 h-14 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 mb-4">
            <Plus className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-teal-500">Create New Plan</h3>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            AI generated or import custom syllabus
          </p>
        </motion.div>

        {plans.map((plan) => (
          <PlanCard 
            key={plan.id} 
            plan={plan} 
            onSelect={onPlanSelect} 
          />
        ))}
      </div>
    </div>
  );
}
