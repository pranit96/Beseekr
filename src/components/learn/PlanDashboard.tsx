import React, { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, ChevronRight, Calendar, Clock, MoreVertical, Edit3, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanProgressRing } from "./PlanProgressRing";
import { useLearningPlans, usePlanResume, useDeletePlan, useUpdatePlan } from "@/hooks/use-education";
import { LearningPlan } from "@/types/education";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const deletePlanMutation = useDeletePlan();
  const updatePlanMutation = useUpdatePlan(plan.id);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState(plan.title);
  const [editSubject, setEditSubject] = useState(plan.subject);
  const [editTargetScore, setEditTargetScore] = useState(plan.target_score || "");
  const [editHours, setEditHours] = useState(plan.daily_study_hours || 2);
  const [editExamDate, setEditExamDate] = useState(plan.exam_date || "");

  const progress = resumeData?.data?.progress?.percentage || 0;
  const resumeTopic = resumeData?.data?.resume_topic;

  const handleOpenEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(plan.title);
    setEditSubject(plan.subject);
    setEditTargetScore(plan.target_score || "");
    setEditHours(plan.daily_study_hours || 2);
    setEditExamDate(plan.exam_date || "");
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      }
    );
  };

  const handleDeletePlan = (e: React.MouseEvent) => {
    e.stopPropagation();
    deletePlanMutation.mutate(plan.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
      },
    });
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        onClick={() => onSelect(plan.id)}
        className="group relative flex flex-col justify-between p-6 bg-card/5 backdrop-blur-xl border border-border/30 rounded-3xl hover:bg-teal-500/[0.05] hover:border-teal-500/30 transition-colors duration-300 cursor-pointer"
        role="article"
        aria-label={`Plan: ${plan.title}`}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0 pr-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-500 mb-1">
              {plan.subject}
            </div>
            <h3 className="text-lg font-bold text-foreground line-clamp-2">
              {plan.title}
            </h3>
            <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground flex-wrap">
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
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <PlanProgressRing percentage={progress} size={50} strokeWidth={4} />

            {/* Quick Actions Dropdown */}
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover/95 backdrop-blur-xl border-border/50">
                  <DropdownMenuItem onClick={handleOpenEdit} className="gap-2 cursor-pointer">
                    <Edit3 className="w-4 h-4 text-teal-400" />
                    <span>Edit Plan Details</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/30" />
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDeleteDialogOpen(true);
                    }} 
                    className="gap-2 text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Plan</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
            onClick={(e) => {
              e.stopPropagation();
              onSelect(plan.id, resumeTopic?.id);
            }}
            aria-label={`Continue learning ${plan.title}`}
          >
            Continue <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </motion.div>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent 
          onClick={(e) => e.stopPropagation()} 
          className="sm:max-w-md bg-card/95 backdrop-blur-2xl border-border/50 text-card-foreground shadow-2xl"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-teal-400" />
              Edit Learning Plan Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="plan-title" className="text-xs font-semibold text-muted-foreground uppercase">
                Plan Title
              </Label>
              <Input
                id="plan-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g. Distributed Systems Mastery"
                className="bg-background/50 border-border/60"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plan-subject" className="text-xs font-semibold text-muted-foreground uppercase">
                Subject / Domain
              </Label>
              <Input
                id="plan-subject"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                placeholder="e.g. Computer Science"
                className="bg-background/50 border-border/60"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="plan-hours" className="text-xs font-semibold text-muted-foreground uppercase">
                  Daily Study Hours
                </Label>
                <Input
                  id="plan-hours"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  value={editHours}
                  onChange={(e) => setEditHours(Number(e.target.value))}
                  className="bg-background/50 border-border/60"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plan-date" className="text-xs font-semibold text-muted-foreground uppercase">
                  Target Exam Date
                </Label>
                <Input
                  id="plan-date"
                  type="date"
                  value={editExamDate}
                  onChange={(e) => setEditExamDate(e.target.value)}
                  className="bg-background/50 border-border/60"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plan-score" className="text-xs font-semibold text-muted-foreground uppercase">
                Target Score / Objective
              </Label>
              <Input
                id="plan-score"
                value={editTargetScore}
                onChange={(e) => setEditTargetScore(e.target.value)}
                placeholder="e.g. 99th Percentile / Staff Level"
                className="bg-background/50 border-border/60"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updatePlanMutation.isPending || !editTitle.trim() || !editSubject.trim()}
              className="bg-teal-500 hover:bg-teal-600 text-white font-semibold"
            >
              {updatePlanMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent 
          onClick={(e) => e.stopPropagation()} 
          className="bg-card/95 backdrop-blur-2xl border-border/50 text-card-foreground shadow-2xl"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Learning Plan?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. All syllabus topics, study guides, flashcards, and practice exams linked to <strong className="text-foreground">"{plan.title}"</strong> will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              disabled={deletePlanMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold"
            >
              {deletePlanMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
