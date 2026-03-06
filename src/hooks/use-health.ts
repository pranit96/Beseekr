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

  const planMutation = useMutation({
    mutationFn: async (overrides?: {
      primaryGoalOverride?: string;
      weeklyTrainingDaysOverride?: number;
    }) => {
      const res = await healthApi.generatePlan(overrides);
      return res.data as HealthPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "dashboard"] });
    },
  });

  return planMutation;
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

  return { ...list, logSession };
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

  return { ...list, createHabit, logHabit };
};

export const useFood = () => {
  const queryClient = useQueryClient();

  const analyzeImage = useMutation({
    mutationFn: async (payload: FoodImagePayload) => {
      const res = await healthApi.analyzeFoodImage(payload);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "dashboard"] });
    },
  });

  const logManual = useMutation({
    mutationFn: async (payload: FoodManualPayload) => {
      const res = await healthApi.logFoodManual(payload);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "dashboard"] });
    },
  });

  return { analyzeImage, logManual };
};

