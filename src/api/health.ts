import { api as apiClient } from "@/lib/apiWrapper";

// ─── Health Profile ──────────────────────────────────────────────────────────

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

// ─── Dashboard (enriched) ────────────────────────────────────────────────────

export interface DailyCalorieEntry {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface DailyMoodEntry {
  date: string;
  mood_score: number | null;
  energy_level: number | null;
  stress_level: number | null;
}

export interface DailySleepEntry {
  date: string;
  duration_hours: number | null;
  quality: number | null;
}

export interface WeightTrendEntry {
  date: string;
  weight_kg: number;
}

export interface HealthDashboard {
  profile: HealthProfile | null;
  range: { start: string; end: string };
  today: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    workout_completed: boolean;
    workout: any | null;
    habits_completed: number;
  };
  todayMood: MoodLog | null;
  todaySleep: SleepLog | null;
  latestWeight: { weight_kg: number; date: string } | null;
  dailyCalories: DailyCalorieEntry[];
  dailyMood: DailyMoodEntry[];
  dailySleep: DailySleepEntry[];
  weightTrend: WeightTrendEntry[];
  streaks: { workout: number; mood: number; food: number };
  aggregates: {
    food_logs: number;
    workouts: number;
    habit_logs: number;
    mood_logs: number;
    sleep_logs: number;
  };
}

// ─── Health Plan ─────────────────────────────────────────────────────────────

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

// ─── Workout ─────────────────────────────────────────────────────────────────

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

// ─── Habits ──────────────────────────────────────────────────────────────────

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

// ─── Food ────────────────────────────────────────────────────────────────────

export interface FoodImagePayload {
  imageData: string;
  mimeType?: string;
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

// ─── Mind — Mood ─────────────────────────────────────────────────────────────

export interface MoodLogPayload {
  moodScore: number;
  energyLevel?: number;
  stressLevel?: number;
  notes?: string;
  logDate?: string;
}

export interface MoodLog {
  id: string;
  user_id: string;
  log_date: string;
  mood_score: number;
  energy_level: number | null;
  stress_level: number | null;
  notes: string | null;
  created_at: string;
}

// ─── Mind — Sleep ────────────────────────────────────────────────────────────

export interface SleepLogPayload {
  bedtime?: string;
  wakeTime?: string;
  durationHours?: number;
  quality?: number;
  notes?: string;
  logDate?: string;
}

export interface SleepLog {
  id: string;
  user_id: string;
  log_date: string;
  bedtime: string | null;
  wake_time: string | null;
  duration_hours: number | null;
  quality: number | null;
  notes: string | null;
  created_at: string;
}

// ─── Mind — Weight ───────────────────────────────────────────────────────────

export interface WeightLogPayload {
  weightKg: number;
  bodyFatPct?: number;
  notes?: string;
  logDate?: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  log_date: string;
  weight_kg: number;
  body_fat_pct: number | null;
  notes: string | null;
  created_at: string;
}

// ─── Mind — Journal ──────────────────────────────────────────────────────────

export interface JournalPayload {
  content: string;
  tags?: string[];
  entryDate?: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// ─── Mind — Weekly Review ────────────────────────────────────────────────────

export interface WeeklyReview {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  review: {
    overall_score: number;
    summary: string;
    training: { score: number; sessions_completed: number; highlights: string[]; suggestions: string[] };
    nutrition: { score: number; avg_calories: number; avg_protein_g: number; highlights: string[]; suggestions: string[] };
    mood: { score: number; avg_mood: number; trend: string; highlights: string[]; suggestions: string[] };
    sleep: { score: number; avg_duration_hours: number; avg_quality: number; highlights: string[]; suggestions: string[] };
    habits: { score: number; completion_rate: number; highlights: string[]; suggestions: string[] };
    wins: string[];
    improvement_areas: string[];
    next_week_priorities: string[];
  };
  created_at: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// API Client
// ═════════════════════════════════════════════════════════════════════════════

export const healthApi = {
  // ── Profile ─────────────────────────────────────────────────────────────
  getProfile: () =>
    apiClient.get<{ success: boolean; data: HealthProfile | null }>("/api/health/profile"),

  upsertProfile: (payload: HealthProfilePayload) =>
    apiClient.put<{ success: boolean; data: HealthProfile }>("/api/health/profile", payload),

  // ── Dashboard ───────────────────────────────────────────────────────────
  getDashboard: () =>
    apiClient.get<{ success: boolean; data: HealthDashboard }>("/api/health/dashboard"),

  // ── Plan ────────────────────────────────────────────────────────────────
  getLatestPlan: () =>
    apiClient.get<{ success: boolean; data: HealthPlan | null; generated_at: string | null; source: string }>("/api/health/plan"),

  generatePlan: (overrides?: { primaryGoalOverride?: string; weeklyTrainingDaysOverride?: number }) =>
    apiClient.post<{ success: boolean; data: HealthPlan; source: string }>("/api/health/plan", overrides ?? {}),

  // ── Workouts ────────────────────────────────────────────────────────────
  logWorkoutSession: (payload: WorkoutSessionPayload) =>
    apiClient.post<{ success: boolean; data: any }>("/api/health/workouts/sessions", payload),

  listWorkoutSessions: (params?: { from?: string; to?: string; limit?: number }) =>
    apiClient.get<{ success: boolean; data: any[] }>("/api/health/workouts/sessions", { params }),

  deleteWorkoutSession: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/health/workouts/sessions/${id}`),

  // ── Habits ──────────────────────────────────────────────────────────────
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

  // ── Food ────────────────────────────────────────────────────────────────
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

  // ── Mind — Mood ─────────────────────────────────────────────────────────
  logMood: (payload: MoodLogPayload) =>
    apiClient.post<{ success: boolean; data: MoodLog }>("/api/health/mind/mood", payload),

  getMoodHistory: (days?: number) =>
    apiClient.get<{ success: boolean; data: MoodLog[] }>("/api/health/mind/mood", { params: { days } }),

  deleteMoodLog: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/health/mind/mood/${id}`),

  // ── Mind — Sleep ────────────────────────────────────────────────────────
  logSleep: (payload: SleepLogPayload) =>
    apiClient.post<{ success: boolean; data: SleepLog }>("/api/health/mind/sleep", payload),

  getSleepHistory: (days?: number) =>
    apiClient.get<{ success: boolean; data: SleepLog[] }>("/api/health/mind/sleep", { params: { days } }),

  deleteSleepLog: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/health/mind/sleep/${id}`),

  // ── Mind — Weight ───────────────────────────────────────────────────────
  logWeight: (payload: WeightLogPayload) =>
    apiClient.post<{ success: boolean; data: WeightLog }>("/api/health/mind/weight", payload),

  getWeightHistory: (days?: number) =>
    apiClient.get<{ success: boolean; data: WeightLog[] }>("/api/health/mind/weight", { params: { days } }),

  deleteWeightLog: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/health/mind/weight/${id}`),

  // ── Mind — Journal ──────────────────────────────────────────────────────
  createJournal: (payload: JournalPayload) =>
    apiClient.post<{ success: boolean; data: JournalEntry }>("/api/health/mind/journal", payload),

  listJournals: (limit?: number) =>
    apiClient.get<{ success: boolean; data: JournalEntry[] }>("/api/health/mind/journal", { params: { limit } }),

  deleteJournal: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/health/mind/journal/${id}`),

  // ── Mind — Weekly Review ────────────────────────────────────────────────
  generateWeeklyReview: () =>
    apiClient.post<{ success: boolean; data: any; week: { start: string; end: string } }>("/api/health/mind/weekly-review", {}),

  getWeeklyReviews: () =>
    apiClient.get<{ success: boolean; data: WeeklyReview[] }>("/api/health/mind/weekly-review"),
};
