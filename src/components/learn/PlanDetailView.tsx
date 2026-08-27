import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Calendar,
  BookOpen,
  AlertCircle,
  Lock,
  ChevronRight,
  CheckCircle2,
  MoreVertical,
  Edit3,
  Trash2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanTopic, PlanResumePoint, LearningPlan } from "@/types/education";
import { TopicStatusBadge } from "./TopicStatusBadge";
import { PlanProgressRing } from "./PlanProgressRing";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDeletePlan, useUpdatePlan } from "@/hooks/use-education";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  onTopicSelect,
}: PlanDetailViewProps) {
  const { user } = useAuth();
  const isUltra = user?.tier === "ultra";
  const [lockedNoticeTopic, setLockedNoticeTopic] = useState<string | null>(
    null,
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const deletePlanMutation = useDeletePlan();
  const updatePlanMutation = useUpdatePlan(planId);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editTargetScore, setEditTargetScore] = useState("");
  const [editHours, setEditHours] = useState(2);
  const [editExamDate, setEditExamDate] = useState("");

  const handleOpenEdit = () => {
    if (resumeData) {
      setEditTitle(resumeData.plan_title || "");
      setEditSubject(resumeData.subject || "");
      setEditTargetScore("");
      setEditHours(2);
      setEditExamDate("");
    }
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    updatePlanMutation.mutate(
      {
        title: editTitle,
        subject: editSubject,
        ...(editTargetScore ? { target_score: editTargetScore } : {}),
        ...(editHours ? { daily_study_hours: Number(editHours) } : {}),
        ...(editExamDate ? { exam_date: editExamDate } : {}),
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
        },
      },
    );
  };

  const handleDeletePlan = () => {
    deletePlanMutation.mutate(planId, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        onBack();
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <div>
            <Skeleton className="h-[400px] rounded-3xl" />
          </div>
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
      {/* Header with back button, subject, title, and action menu */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="text-sm font-semibold text-teal-500 uppercase tracking-wider">
              {subject}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{plan_title}</h1>
          </div>
        </div>

        {/* Options Menu */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-border/50 bg-card/10"
              >
                <MoreVertical className="w-4 h-4" />
                <span className="hidden sm:inline">Options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-popover/95 backdrop-blur-xl border-border/50"
            >
              <DropdownMenuItem
                onClick={handleOpenEdit}
                className="gap-2 cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-teal-400" />
                <span>Edit Plan Details</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/30" />
              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                className="gap-2 text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Plan</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Topics List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Syllabus Sequence</h2>
            <span className="text-xs text-muted-foreground">
              Clear each topic in sequence to unlock the next
            </span>
          </div>

          <AnimatePresence>
            {lockedNoticeTopic && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2 shadow-sm"
              >
                <Lock className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  <strong>Chapter Locked:</strong> Complete the quiz for previous chapters to
                  unlock <em>"{lockedNoticeTopic}"</em>.
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {topics_overview.map((topic, idx) => {
            const isCompleted = topic.status === "completed";
            const isUnlocked =
              idx === 0 ||
              topics_overview
                .slice(0, idx)
                .every((t) => t.status === "completed");
            const isLocked = !isCompleted && !isUnlocked;
            const isNext = isUnlocked && !isCompleted;
            const previousTopicName =
              idx > 0 ? topics_overview[idx - 1].topic_name : "";

            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => {
                  if (isLocked) {
                    setLockedNoticeTopic(previousTopicName || topic.topic_name);
                    setTimeout(() => setLockedNoticeTopic(null), 3500);
                    return;
                  }
                  onTopicSelect(topic.id);
                }}
                className={`p-5 rounded-2xl border transition-all duration-200 relative group
                  ${
                    isLocked
                      ? "bg-card/5 border-border/20 opacity-55 cursor-not-allowed select-none hover:border-border/40"
                      : isCompleted
                        ? "bg-card/5 border-border/30 opacity-80 hover:opacity-100 hover:bg-card/20 cursor-pointer"
                        : isNext || topic.status === "in_progress"
                          ? "bg-teal-500/10 border-teal-500/40 ring-1 ring-teal-500/20 shadow-lg shadow-teal-500/5 cursor-pointer hover:bg-teal-500/15"
                          : "bg-card/10 border-border/50 hover:border-teal-500/30 hover:bg-card/30 cursor-pointer"
                  }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground w-6 flex items-center justify-center">
                        {isLocked ? (
                          <Lock className="w-3.5 h-3.5 text-muted-foreground/60" />
                        ) : isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                        ) : (
                          (idx + 1).toString().padStart(2, "0")
                        )}
                      </span>
                      <h3
                        className={`font-bold text-lg leading-tight truncate ${isLocked ? "text-muted-foreground" : "text-foreground"}`}
                      >
                        {topic.topic_name}
                      </h3>
                      {isNext && (
                        <span className="text-[10px] font-semibold bg-teal-500/20 text-teal-400 border border-teal-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Next Up
                        </span>
                      )}
                    </div>

                    <div className="flex items-center flex-wrap gap-4 text-xs text-muted-foreground ml-8">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(topic.scheduled_date).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" },
                        )}
                      </span>
                      {isLocked ? (
                        <span className="flex items-center gap-1 text-amber-500/80 text-[11px] font-medium">
                          <Lock className="w-3 h-3" /> Complete "{previousTopicName}" quiz to unlock
                        </span>
                      ) : topic.has_prep ? (
                        <span className="flex items-center gap-1 text-teal-500/70">
                          <BookOpen className="w-3.5 h-3.5" /> Study materials
                          ready
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <TopicStatusBadge
                      status={isLocked ? "locked" : topic.status}
                    />
                    {!isLocked && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-teal-400 transition-colors" />
                    )}
                  </div>
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
              <PlanProgressRing
                percentage={progress.percentage}
                size={140}
                strokeWidth={12}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-background/50 p-3 rounded-xl border border-border/50">
                <div className="text-2xl font-bold text-teal-500">
                  {progress.completed}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                  Completed
                </div>
              </div>
              <div className="bg-background/50 p-3 rounded-xl border border-border/50">
                <div className="text-2xl font-bold">{progress.total}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                  Total Topics
                </div>
              </div>
            </div>

            {resumeData.resume_topic && (
              <Button
                className="w-full mt-6 bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/10"
                size="lg"
                onClick={() => onTopicSelect(resumeData.resume_topic!.id)}
              >
                {progress.percentage === 0
                  ? "Start Learning"
                  : "Continue Learning"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md bg-popover/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle>Edit Plan Details</DialogTitle>
            <DialogDescription>
              Update your study plan title and target parameters.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="plan-title">Plan Title</Label>
              <Input
                id="plan-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g. Master Data Structures"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plan-subject">Subject / Domain</Label>
              <Input
                id="plan-subject"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                placeholder="e.g. Computer Science"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="plan-hours">Daily Hours</Label>
                <Input
                  id="plan-hours"
                  type="number"
                  min={0.5}
                  max={16}
                  step={0.5}
                  value={editHours}
                  onChange={(e) =>
                    setEditHours(parseFloat(e.target.value) || 1)
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plan-target">Target Score</Label>
                <Input
                  id="plan-target"
                  value={editTargetScore}
                  onChange={(e) => setEditTargetScore(e.target.value)}
                  placeholder="e.g. 99th percentile"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updatePlanMutation.isPending || !editTitle.trim()}
              className="bg-teal-500 hover:bg-teal-600 text-white"
            >
              {updatePlanMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Alert Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-popover/95 backdrop-blur-xl border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">
              Delete Learning Plan?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>"{plan_title}"</strong>, all
              its scheduled topics, study guides, flashcards, generated exams,
              and active background AI jobs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              disabled={deletePlanMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deletePlanMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Delete Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
