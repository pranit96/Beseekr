import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type {
  LearningPlan, PlanWithTopics, PlanTopic, PlanResumePoint,
  PlanInsights, TopicStatus, FlashcardRating, ImportPlanPayload,
  Exam, ExamAnswer, ExamSubmission,
} from "@/types/education";

// ============= QUERY KEYS =============
export const educationKeys = {
  plans: ["education", "plans"] as const,
  plan: (id: string) => ["education", "plan", id] as const,
  planResume: (id: string) => ["education", "plan", id, "resume"] as const,
  planInsights: (id: string) => ["education", "plan", id, "insights"] as const,
  exams: (planId?: string) => ["education", "exams", planId] as const,
  exam: (id: string) => ["education", "exam", id] as const,
  submissions: (examId?: string) => ["education", "submissions", examId] as const,
};

// ============= QUERIES =============

/** List all learning plans */
export function useLearningPlans() {
  return useQuery({
    queryKey: educationKeys.plans,
    queryFn: () => apiClient.getLearningPlans(),
    staleTime: 5 * 60 * 1000,     // 5 min — plans don't change often
    gcTime: 15 * 60 * 1000,       // 15 min garbage collection
  });
}

/** Get a single plan with all topics */
export function useLearningPlan(planId: string | undefined) {
  return useQuery({
    queryKey: educationKeys.plan(planId!),
    queryFn: () => apiClient.getLearningPlan(planId!),
    enabled: !!planId,
    staleTime: 2 * 60 * 1000,     // 2 min — topic status may change
    gcTime: 10 * 60 * 1000,
  });
}

/** Get the user's resume point (continue where left off) */
export function usePlanResume(planId: string | undefined) {
  return useQuery({
    queryKey: educationKeys.planResume(planId!),
    queryFn: () => apiClient.getLearningPlanResume(planId!),
    enabled: !!planId,
    staleTime: 30 * 1000,         // 30 sec — progress changes frequently
    gcTime: 5 * 60 * 1000,
  });
}

/** Get plan performance insights */
export function usePlanInsights(planId: string | undefined) {
  return useQuery({
    queryKey: educationKeys.planInsights(planId!),
    queryFn: () => apiClient.getLearningPlanInsights(planId!),
    enabled: !!planId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/** Get exam details */
export function useExam(examId: string | undefined, solutions = false) {
  return useQuery({
    queryKey: educationKeys.exam(examId!),
    queryFn: () => apiClient.getExam(examId!, solutions),
    enabled: !!examId,
    staleTime: 10 * 60 * 1000,   // 10 min — exams are static
    gcTime: 30 * 60 * 1000,
  });
}

// ============= MUTATIONS =============

/** Create an AI-generated plan */
export function useCreatePlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Parameters<typeof apiClient.createLearningPlan>[0]) =>
      apiClient.createLearningPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: educationKeys.plans });
      toast({ title: "Plan created!", description: "Your learning plan has been generated." });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create plan",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });
}

/** Import a plan from JSON */
export function useImportPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: ImportPlanPayload) => apiClient.importLearningPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: educationKeys.plans });
      toast({ title: "Plan imported!", description: "Your learning plan has been imported." });
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error?.message || "Check your JSON format and try again.",
        variant: "destructive",
      });
    },
  });
}

/** Update topic status — with optimistic update */
export function useUpdateTopicStatus(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ topicId, status }: { topicId: string; status: TopicStatus }) =>
      apiClient.updateTopicStatus(planId, topicId, status),

    // Optimistic update: immediately reflect status change in UI
    onMutate: async ({ topicId, status }) => {
      await queryClient.cancelQueries({ queryKey: educationKeys.plan(planId) });
      const prev = queryClient.getQueryData(educationKeys.plan(planId));

      queryClient.setQueryData(educationKeys.plan(planId), (old: any) => {
        if (!old?.data?.topics) return old;
        return {
          ...old,
          data: {
            ...old.data,
            topics: old.data.topics.map((t: PlanTopic) =>
              t.id === topicId ? { ...t, status } : t
            ),
          },
        };
      });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.prev) {
        queryClient.setQueryData(educationKeys.plan(planId), context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: educationKeys.plan(planId) });
      queryClient.invalidateQueries({ queryKey: educationKeys.planResume(planId) });
    },
  });
}

/** Generate topic prep content (summary, flashcards, key concepts) */
export function useGeneratePrep(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (topicId: string) => apiClient.generateTopicPrep(planId, topicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: educationKeys.plan(planId) });
    },
  });
}

/** Generate hands-on exercises */
export function useGenerateHandsOn(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (topicId: string) => apiClient.generateHandsOn(planId, topicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: educationKeys.plan(planId) });
    },
  });
}

/** Review flashcard (spaced repetition) */
export function useReviewFlashcard(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { topicId: string; questionIndex: number; rating: FlashcardRating }) =>
      apiClient.reviewFlashcard(planId, data.topicId, {
        questionIndex: data.questionIndex,
        rating: data.rating,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: educationKeys.plan(planId) });
    },
  });
}

/** Generate an MCQ exam */
export function useGenerateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof apiClient.generateExam>[0]) =>
      apiClient.generateExam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: educationKeys.exams() });
    },
  });
}

/** Submit exam for AI grading */
export function useSubmitExam(examId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answers: ExamAnswer[]) => apiClient.submitExam(examId, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: educationKeys.exam(examId) });
      queryClient.invalidateQueries({ queryKey: educationKeys.submissions() });
    },
  });
}
