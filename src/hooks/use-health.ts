import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FoodImagePayload,
  FoodManualPayload,
  HabitLogPayload,
  HabitPayload,
  HealthDashboard,
  HealthPlan,
  HealthProfile,
  HealthProfilePayload,
  WorkoutSessionPayload,
  MoodLogPayload,
  MoodLog,
  SleepLogPayload,
  SleepLog,
  WeightLogPayload,
  WeightLog,
  JournalPayload,
  JournalEntry,
  WeeklyReview,
  healthApi,
} from "@/api/health";

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const useHealthDashboard = () => {
  return useQuery({
    queryKey: ["health", "dashboard"],
    queryFn: async () => {
      const res = await healthApi.getDashboard();
      return res.data as HealthDashboard;
    },
  });
};

// ─── Profile ─────────────────────────────────────────────────────────────────

export const useHealthProfile = () => {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["health", "profile"],
    queryFn: async () => {
      const res = await healthApi.getProfile();
      return res.data as HealthProfile | null;
    },
  });

  const saveProfile = useMutation({
    mutationFn: async (payload: HealthProfilePayload) => {
      const res = await healthApi.upsertProfile(payload);
      return res.data as HealthProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["health", "dashboard"] });
    },
  });

  return { ...profileQuery, saveProfile };
};

// ─── Plan ────────────────────────────────────────────────────────────────────

export const useHealthPlan = () => {
  const queryClient = useQueryClient();

  const planQuery = useQuery({
    queryKey: ["health", "plan"],
    queryFn: async () => {
      const res = await healthApi.getLatestPlan();
      return res.data as HealthPlan | null;
    },
  });

  const planMutation = useMutation({
    mutationFn: async (overrides?: {
      primaryGoalOverride?: string;
      weeklyTrainingDaysOverride?: number;
    }) => {
      const res = await healthApi.generatePlan(overrides);
      return res.data as HealthPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "plan"] });
      queryClient.invalidateQueries({ queryKey: ["health", "dashboard"] });
    },
  });

  return {
    plan: planMutation.data ?? planQuery.data ?? null,
    isLoading: planQuery.isLoading,
    isGenerating: planMutation.isPending,
    generate: planMutation.mutateAsync,
    error: planMutation.error,
  };
};

// ─── Workouts ────────────────────────────────────────────────────────────────

export const useWorkoutSessions = () => {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ["health", "workouts"],
    queryFn: async () => {
      const res = await healthApi.listWorkoutSessions();
      return res.data as any[];
    },
  });

  const logSession = useMutation({
    mutationFn: async (payload: WorkoutSessionPayload) => {
      const res = await healthApi.logWorkoutSession(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "workouts"] });
      queryClient.invalidateQueries({ queryKey: ["health", "dashboard"] });
    },
  });

  const deleteSession = useMutation({
    mutationFn: async (id: string) => healthApi.deleteWorkoutSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "workouts"] });
      queryClient.invalidateQueries({ queryKey: ["health", "dashboard"] });
    },
  });

  return { ...list, logSession, deleteSession };
};

// ─── Habits ──────────────────────────────────────────────────────────────────

export const useHabits = () => {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ["health", "habits"],
    queryFn: async () => {
      const res = await healthApi.listHabits(true);
      return res.data as any[];
    },
  });

  const createHabit = useMutation({
    mutationFn: async (payload: HabitPayload) => {
      const res = await healthApi.createHabit(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "habits"] });
    },
  });

  const logHabit = useMutation({
    mutationFn: async ({
      habitId,
      payload,
    }: {
      habitId: string;
      payload: HabitLogPayload;
    }) => {
      const res = await healthApi.logHabit(habitId, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "dashboard"] });
    },
  });

  const deleteHabit = useMutation({
    mutationFn: async (id: string) => healthApi.deleteHabit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "habits"] });
    },
  });

  return { ...list, createHabit, logHabit, deleteHabit };
};

// ─── Food ────────────────────────────────────────────────────────────────────

export const useFood = () => {
  const queryClient = useQueryClient();

  const logsQuery = useQuery({
    queryKey: ["health", "food", "logs"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const res = await healthApi.getFoodLogs(today, today);
      return res.data;
    },
  });

  const analyzeImage = useMutation({
    mutationFn: async (payload: FoodImagePayload) => {
      const res = await healthApi.analyzeFoodImage(payload);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "food"] });
      queryClient.invalidateQueries({ queryKey: ["health", "dashboard"] });
    },
  });

  const logManual = useMutation({
    mutationFn: async (payload: FoodManualPayload) => {
      const res = await healthApi.logFoodManual(payload);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "food"] });
      queryClient.invalidateQueries({ queryKey: ["health", "dashboard"] });
    },
  });

  const deleteFoodLog = useMutation({
    mutationFn: async (id: string) => healthApi.deleteFoodLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "food"] });
      queryClient.invalidateQueries({ queryKey: ["health", "dashboard"] });
    },
  });

  return { ...logsQuery, analyzeImage, logManual, deleteFoodLog };
};

// ═════════════════════════════════════════════════════════════════════════════
// MIND HOOKS
// ═════════════════════════════════════════════════════════════════════════════

// ─── Mood ────────────────────────────────────────────────────────────────────

export const useMood = () => {
  const queryClient = useQueryClient();

  const history = useQuery({
    queryKey: ["health", "mind", "mood"],
    queryFn: async () => {
      const res = await healthApi.getMoodHistory(30);
      return (res.data ?? []) as MoodLog[];
    },
  });

  const logMood = useMutation({
    mutationFn: async (payload: MoodLogPayload) => {
      const res = await healthApi.logMood(payload);
      return res.data as MoodLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "mind", "mood"] });
      queryClient.invalidateQueries({ queryKey: ["health", "dashboard"] });
    },
  });

  const deleteMood = useMutation({
    mutationFn: async (id: string) => healthApi.deleteMoodLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "mind", "mood"] });
      queryClient.invalidateQueries({ queryKey: ["health", "dashboard"] });
    },
  });

  return {
    history: history.data ?? [],
    isLoading: history.isLoading,
    logMood,
    deleteMood,
  };
};

// ─── Sleep ───────────────────────────────────────────────────────────────────

export const useSleep = () => {
  const queryClient = useQueryClient();

  const history = useQuery({
    queryKey: ["health", "mind", "sleep"],
    queryFn: async () => {
      const res = await healthApi.getSleepHistory(30);
      return (res.data ?? []) as SleepLog[];
    },
  });

  const logSleep = useMutation({
    mutationFn: async (payload: SleepLogPayload) => {
      const res = await healthApi.logSleep(payload);
      return res.data as SleepLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "mind", "sleep"] });
      queryClient.invalidateQueries({ queryKey: ["health", "dashboard"] });
    },
  });

  const deleteSleep = useMutation({
    mutationFn: async (id: string) => healthApi.deleteSleepLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "mind", "sleep"] });
      queryClient.invalidateQueries({ queryKey: ["health", "dashboard"] });
    },
  });

  return {
    history: history.data ?? [],
    isLoading: history.isLoading,
    logSleep,
    deleteSleep,
  };
};

// ─── Weight ──────────────────────────────────────────────────────────────────

export const useWeight = () => {
  const queryClient = useQueryClient();

  const history = useQuery({
    queryKey: ["health", "mind", "weight"],
    queryFn: async () => {
      const res = await healthApi.getWeightHistory(90);
      return (res.data ?? []) as WeightLog[];
    },
  });

  const logWeight = useMutation({
    mutationFn: async (payload: WeightLogPayload) => {
      const res = await healthApi.logWeight(payload);
      return res.data as WeightLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "mind", "weight"] });
      queryClient.invalidateQueries({ queryKey: ["health", "dashboard"] });
    },
  });

  const deleteWeight = useMutation({
    mutationFn: async (id: string) => healthApi.deleteWeightLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "mind", "weight"] });
      queryClient.invalidateQueries({ queryKey: ["health", "dashboard"] });
    },
  });

  return {
    history: history.data ?? [],
    isLoading: history.isLoading,
    logWeight,
    deleteWeight,
  };
};

// ─── Journal ─────────────────────────────────────────────────────────────────

export const useJournal = () => {
  const queryClient = useQueryClient();

  const entries = useQuery({
    queryKey: ["health", "mind", "journal"],
    queryFn: async () => {
      const res = await healthApi.listJournals(30);
      return (res.data ?? []) as JournalEntry[];
    },
  });

  const createJournal = useMutation({
    mutationFn: async (payload: JournalPayload) => {
      const res = await healthApi.createJournal(payload);
      return res.data as JournalEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["health", "mind", "journal"],
      });
    },
  });

  const deleteJournal = useMutation({
    mutationFn: async (id: string) => healthApi.deleteJournal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["health", "mind", "journal"],
      });
    },
  });

  return {
    entries: entries.data ?? [],
    isLoading: entries.isLoading,
    createJournal,
    deleteJournal,
  };
};

// ─── Weekly Review ───────────────────────────────────────────────────────────

export const useWeeklyReview = () => {
  const queryClient = useQueryClient();

  const reviews = useQuery({
    queryKey: ["health", "mind", "weekly-review"],
    queryFn: async () => {
      const res = await healthApi.getWeeklyReviews();
      return (res.data ?? []) as WeeklyReview[];
    },
  });

  const generate = useMutation({
    mutationFn: async () => {
      const res = await healthApi.generateWeeklyReview();
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["health", "mind", "weekly-review"],
      });
      queryClient.invalidateQueries({ queryKey: ["health", "dashboard"] });
    },
  });

  return {
    reviews: reviews.data ?? [],
    isLoading: reviews.isLoading,
    generate: generate.mutateAsync,
    isGenerating: generate.isPending,
  };
};
