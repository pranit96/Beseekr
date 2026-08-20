import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Calendar, BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanTopic, PlanResumePoint } from "@/types/education";
import { TopicStatusBadge } from "./TopicStatusBadge";
import { PlanProgressRing } from "./PlanProgressRing";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PlanDetailViewProps {
  planId: string;
  resumeData: PlanResumePoint | null;
  isLoading: boolean;
  onBack: () => void;
  onTopicSelect: (topicId: string) => void;
}

export function PlanDetailView({ 
  planId, 
  resumeData, 
  isLoading, 
  onBack, 
  onTopicSelect 
}: PlanDetailViewProps) {

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <div><Skeleton className="h-[400px] rounded-3xl" /></div>
        </div>
      </div>
    );
  }

  if (!resumeData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>Failed to load plan details.</AlertDescription>
      </Alert>
    );
  }

  const { topics_overview, progress, plan_title, subject } = resumeData;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="text-sm font-semibold text-teal-500 uppercase tracking-wider">{subject}</div>
          <h1 className="text-2xl font-bold">{plan_title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Topics List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold mb-4">Syllabus</h2>
          {topics_overview.map((topic, idx) => {
            const isNext = topic.status === "pending" && topics_overview.slice(0, idx).every(t => t.status === "completed");
            
            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => onTopicSelect(topic.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 
                  ${topic.status === "completed" ? "bg-card/5 border-border/30 opacity-75 hover:opacity-100 hover:bg-card/20" : 
                    isNext || topic.status === "in_progress" ? "bg-teal-500/10 border-teal-500/30 ring-1 ring-teal-500/20 shadow-lg shadow-teal-500/5" :
                    "bg-card/10 border-border/50 hover:border-teal-500/30 hover:bg-card/30"
                  }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground w-6">{(idx + 1).toString().padStart(2, '0')}</span>
                      <h3 className="font-bold text-lg leading-tight">{topic.topic_name}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground ml-8">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(topic.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      {topic.has_prep && (
                        <span className="flex items-center gap-1 text-teal-500/70">
                          <BookOpen className="w-3.5 h-3.5" /> Study materials ready
                        </span>
                      )}
                    </div>
                  </div>
                  <TopicStatusBadge status={topic.status} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Progress Sidebar */}
        <div className="lg:sticky lg:top-8 space-y-6">
          <div className="p-6 bg-card/5 backdrop-blur-xl border border-border/30 rounded-3xl text-center shadow-sm">
            <h3 className="font-bold text-lg mb-6 text-left">Your Progress</h3>
            
            <div className="flex justify-center mb-6">
              <PlanProgressRing percentage={progress.percentage} size={140} strokeWidth={12} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-background/50 p-3 rounded-xl border border-border/50">
                <div className="text-2xl font-bold text-teal-500">{progress.completed}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Completed</div>
              </div>
              <div className="bg-background/50 p-3 rounded-xl border border-border/50">
                <div className="text-2xl font-bold">{progress.total}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Total Topics</div>
              </div>
            </div>
            
            {resumeData.resume_topic && (
              <Button 
                className="w-full mt-6 bg-teal-500 hover:bg-teal-600 text-white" 
                size="lg"
                onClick={() => onTopicSelect(resumeData.resume_topic!.id)}
              >
                {progress.percentage === 0 ? "Start Learning" : "Continue Learning"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
