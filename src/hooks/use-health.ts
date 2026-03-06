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
  healthApi,
} from "@/api/health";

export const useHealthDashboard = () => {
  return useQuery({
    queryKey: ["health", "dashboard"],
    queryFn: async () => {
      const res = await healthApi.getDashboard();
      return res.data as HealthDashboard;
    },
  });
};

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

export const useHealthPlan = () => {
  const queryClient = useQueryClient();

  // Load existing plan from DB on mount
  const planQuery = useQuery({
    queryKey: ["health", "plan"],
    queryFn: async () => {
      const res = await healthApi.getLatestPlan();
      return res.data as HealthPlan | null;
    },
  });

  // Regenerate plan via Claude
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
