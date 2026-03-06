import { api as apiClient } from "@/lib/apiWrapper";

export interface HealthProfilePayload {
  gender?: string;
  dateOfBirth?: string;
  heightCm?: number;
  currentWeightKg?: number;
  targetWeightKg?: number;
  activityLevel?: string;
  primaryGoal?: string;
  trainingExperience?: string;
  weeklyTrainingDays?: number;
  dietaryPreference?: string;
  medicalConditions?: string[];
  injuries?: string;
  timezone?: string;
  notes?: string;
}

export interface HealthProfile extends HealthProfilePayload {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface HealthDashboard {
  profile: HealthProfile | null;
  range: { start: string; end: string };
  today: {
    calories: number;
    protein_g: number;
    workout_completed: boolean;
    workout: any | null;
    habits_completed: number;
  };
  aggregates: {
    food_logs: number;
    workouts: number;
    habit_logs: number;
  };
}

export interface HealthPlan {
  overview: {
    primary_goal: string;
    timeframe_weeks: number;
    key_focus_areas: string[];
    summary: string;
  };
  training: {
    weekly_frequency: number;
    split: string;
    sessions: any[];
  };
  nutrition: {
    estimated_tdee: number;
    calorie_target: number;
    protein_target_g: number;
    carb_target_g: number;
    fat_target_g: number;
    strategy: string;
    meal_structure: any[];
    example_meals: any[];
  };
  habits: {
    daily: any[];
    weekly: any[];
  };
  mindset: {
    checkins: any[];
    guidelines: string[];
  };
}

export interface WorkoutSessionPayload {
  sessionDate?: string;
  startTime?: string;
  endTime?: string;
  type?: string;
  focus?: string;
  source?: string;
  plan?: any;
  completedExercises?: any;
  durationMinutes?: number;
  perceivedIntensity?: string;
  caloriesBurned?: number;
  notes?: string;
}

export interface HabitPayload {
  name: string;
  category?: string;
  description?: string;
  targetPerDay?: number;
  unit?: string;
  schedule?: any;
}

export interface HabitLogPayload {
  logDate?: string;
  value?: number;
  completed?: boolean;
  notes?: string;
}

export interface FoodImagePayload {
  imageData: string;  // raw base64 (no data: prefix)
  mimeType?: string;  // e.g. "image/jpeg"
  mealType?: string;
  notes?: string;
}

export interface FoodManualPayload {
  foodName: string;
  serving: string;
  mealType?: string;
  notes?: string;
}

export interface FoodLog {
  id: string;
  food_name: string;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  serving_size: string | null;
  meal_type: string | null;
  food_image_url: string | null;
  ai_confidence: number | null;
  consumed_at: string;
}

export const healthApi = {
  getProfile: () =>
    apiClient.get<{ success: boolean; data: HealthProfile | null }>("/api/health/profile"),

  upsertProfile: (payload: HealthProfilePayload) =>
    apiClient.put<{ success: boolean; data: HealthProfile }>("/api/health/profile", payload),

  getDashboard: () =>
    apiClient.get<{ success: boolean; data: HealthDashboard }>("/api/health/dashboard"),

  getLatestPlan: () =>
    apiClient.get<{ success: boolean; data: HealthPlan | null; generated_at: string | null; source: string }>("/api/health/plan"),

  generatePlan: (overrides?: { primaryGoalOverride?: string; weeklyTrainingDaysOverride?: number }) =>
    apiClient.post<{ success: boolean; data: HealthPlan; source: string }>("/api/health/plan", overrides ?? {}),

  logWorkoutSession: (payload: WorkoutSessionPayload) =>
    apiClient.post<{ success: boolean; data: any }>("/api/health/workouts/sessions", payload),

  listWorkoutSessions: (params?: { from?: string; to?: string; limit?: number }) =>
    apiClient.get<{ success: boolean; data: any[] }>("/api/health/workouts/sessions", { params }),

  deleteWorkoutSession: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/health/workouts/sessions/${id}`),

  createHabit: (payload: HabitPayload) =>
    apiClient.post<{ success: boolean; data: any }>("/api/health/habits", payload),

  listHabits: (includeInactive?: boolean) =>
    apiClient.get<{ success: boolean; data: any[] }>("/api/health/habits", {
      params: includeInactive ? { includeInactive: true } : {},
    }),

  logHabit: (habitId: string, payload: HabitLogPayload) =>
    apiClient.post<{ success: boolean; data: any }>(`/api/health/habits/${habitId}/logs`, payload),

  deleteHabit: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/health/habits/${id}`),

  analyzeFoodImage: (payload: FoodImagePayload) =>
    apiClient.post<{ success: boolean; data: FoodLog; ai: any }>("/api/health/food/analyze-image", payload),

  logFoodManual: (payload: FoodManualPayload) =>
    apiClient.post<{ success: boolean; data: FoodLog; ai: any }>("/api/health/food/manual", payload),

  getFoodLogs: (from?: string, to?: string) =>
    apiClient.get<{ success: boolean; data: { logs: FoodLog[]; totals: any } }>("/api/health/food/logs", {
      params: { from, to },
    }),

  getFoodSummary: (from?: string, to?: string) =>
    apiClient.get<{ success: boolean; data: any }>("/api/health/food/summary", { params: { from, to } }),

  deleteFoodLog: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/health/food/logs/${id}`),
};
