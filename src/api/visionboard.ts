import { api as apiClient } from "@/lib/apiWrapper";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BoardMonth {
  id: string;
  user_id: string;
  year: number;
  month: number;
  quote: string | null;
  mood_tag: string | null;
  theme_words: string[];
  focus_items: string[];
  created_at: string;
  updated_at: string;
}

export interface VisionGoal {
  id: string;
  user_id: string;
  year: number;
  month: number;
  title: string;
  status: "not_started" | "in_progress" | "done";
  progress_current: number;
  progress_target: number;
  progress_unit: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface LifeArea {
  id: string;
  user_id: string;
  year: number;
  month: number;
  area: "career" | "learning" | "health" | "relationships" | "finance";
  score: number;
  icon: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string;
  status: "done" | "partial" | "missed";
}

export interface Habit {
  id: string;
  user_id: string;
  year: number;
  month: number;
  name: string;
  icon: string;
  sort_order: number;
  created_at: string;
  logs: HabitLog[];
}

export interface BoardNotes {
  id: string;
  user_id: string;
  year: number;
  month: number;
  quick_notes: string | null;
  win: string | null;
  challenge: string | null;
  gratitude: string | null;
  improve: string | null;
  updated_at: string;
}

export interface VisionCard {
  id: string;
  user_id: string;
  year: number;
  month: number;
  title: string;
  emoji: string;
  color_accent: "terracotta" | "sage" | "taupe" | "ink" | "blush";
  card_type: "dream" | "motivation" | "career" | "home" | "custom";
  sort_order: number;
  // File attachment (optional)
  file_url: string | null;
  file_type: "image" | "pdf" | "json" | "text" | "md" | null;
  file_name: string | null;
  storage_path: string | null;
  created_at: string;
}

export interface FullBoardData {
  month: BoardMonth;
  goals: VisionGoal[];
  lifeAreas: LifeArea[];
  habits: Habit[];
  notes: BoardNotes | null;
  visionCards: VisionCard[];
}

export interface MonthSummary {
  month: number;
  exists: boolean;
  mood_tag: string | null;
  goal_count: number;
  done_count: number;
  completion_pct: number;
}

export interface WeatherData {
  id?: string;
  user_id?: string;
  year: number;
  month: number;
  lat: number | null;
  lon: number | null;
  city: string | null;
  temperature: number | null;
  weather_desc: string | null;
  weather_icon: string | null;
  mood_tag: string | null;
  updated_at?: string;
}

// ── API Client ─────────────────────────────────────────────────────────────────

export const visionBoardApi = {
  // Board month
  getBoardData: (year: number, month: number) =>
    apiClient.get<{ success: boolean; data: FullBoardData }>(
      `/api/visionboard/${year}/${month}`,
    ),

  updateBoardMonth: (
    year: number,
    month: number,
    payload: Partial<
      Pick<BoardMonth, "quote" | "mood_tag" | "theme_words" | "focus_items">
    >,
  ) =>
    apiClient.put<{ success: boolean; data: BoardMonth }>(
      `/api/visionboard/${year}/${month}`,
      payload,
    ),

  getYearSummary: (year: number) =>
    apiClient.get<{ success: boolean; data: MonthSummary[] }>(
      `/api/visionboard/${year}/summary`,
    ),

  // Goals
  addGoal: (
    year: number,
    month: number,
    payload: {
      title: string;
      status?: VisionGoal["status"];
      progressCurrent?: number;
      progressTarget?: number;
      progressUnit?: string;
    },
  ) =>
    apiClient.post<{ success: boolean; data: VisionGoal }>(
      `/api/visionboard/${year}/${month}/goals`,
      payload,
    ),

  updateGoal: (
    year: number,
    month: number,
    goalId: string,
    updates: Partial<{
      title: string;
      status: VisionGoal["status"];
      progressCurrent: number;
      progressTarget: number;
      progressUnit: string;
    }>,
  ) =>
    apiClient.patch<{ success: boolean; data: VisionGoal }>(
      `/api/visionboard/${year}/${month}/goals/${goalId}`,
      updates,
    ),

  deleteGoal: (year: number, month: number, goalId: string) =>
    apiClient.delete<{ success: boolean; data: { deleted: boolean } }>(
      `/api/visionboard/${year}/${month}/goals/${goalId}`,
    ),

  // Life areas
  upsertLifeAreas: (
    year: number,
    month: number,
    areas: Array<{ area: string; score: number; icon?: string }>,
  ) =>
    apiClient.put<{ success: boolean; data: LifeArea[] }>(
      `/api/visionboard/${year}/${month}/life-areas`,
      { areas },
    ),

  // Habits
  addHabit: (
    year: number,
    month: number,
    payload: { name: string; icon?: string },
  ) =>
    apiClient.post<{ success: boolean; data: Habit }>(
      `/api/visionboard/${year}/${month}/habits`,
      payload,
    ),

  deleteHabit: (year: number, month: number, habitId: string) =>
    apiClient.delete<{ success: boolean; data: { deleted: boolean } }>(
      `/api/visionboard/${year}/${month}/habits/${habitId}`,
    ),

  logHabit: (
    year: number,
    month: number,
    habitId: string,
    payload: { logDate: string; status: HabitLog["status"] },
  ) =>
    apiClient.post<{ success: boolean; data: HabitLog }>(
      `/api/visionboard/${year}/${month}/habits/${habitId}/log`,
      payload,
    ),

  // Notes & reflection
  upsertNotes: (
    year: number,
    month: number,
    payload: Partial<
      Pick<
        BoardNotes,
        "quick_notes" | "win" | "challenge" | "gratitude" | "improve"
      >
    >,
  ) =>
    apiClient.put<{ success: boolean; data: BoardNotes }>(
      `/api/visionboard/${year}/${month}/notes`,
      payload,
    ),

  // Vision cards
  addVisionCard: (
    year: number,
    month: number,
    payload: {
      title: string;
      emoji?: string;
      colorAccent?: VisionCard["color_accent"];
      cardType?: VisionCard["card_type"];
    },
  ) =>
    apiClient.post<{ success: boolean; data: VisionCard }>(
      `/api/visionboard/${year}/${month}/vision-cards`,
      payload,
    ),

  // Upload file to a vision card (replaces any existing file)
  uploadCardFile: (year: number, month: number, cardId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiClient.post<{ success: boolean; data: VisionCard }>(
      `/api/visionboard/${year}/${month}/vision-cards/${cardId}/upload`,
      form,
    );
  },

  deleteVisionCard: (year: number, month: number, cardId: string) =>
    apiClient.delete<{ success: boolean; data: { deleted: boolean } }>(
      `/api/visionboard/${year}/${month}/vision-cards/${cardId}`,
    ),

  // Weather
  getWeather: (year: number, month: number) =>
    apiClient.get<{ success: boolean; data: WeatherData | null }>(
      `/api/visionboard/${year}/${month}/weather`,
    ),

  upsertWeather: (year: number, month: number, payload: Partial<WeatherData>) =>
    apiClient.put<{ success: boolean; data: WeatherData }>(
      `/api/visionboard/${year}/${month}/weather`,
      payload,
    ),

  // Calendar Events
  getEvents: (year: number, month: number) =>
    apiClient.get<{
      success: boolean;
      data: Array<{
        id: string;
        title: string;
        event_date: string;
        event_time: string;
        color: "terracotta" | "sage" | "slate" | "mustard" | "blush";
        recurrence: "none" | "daily" | "weekly" | "monthly";
        notify: boolean;
      }>;
    }>(`/api/visionboard/${year}/${month}/events`),

  addEvent: (
    year: number,
    month: number,
    payload: {
      title: string;
      date: string;
      time?: string;
      color?: string;
      recurrence?: string;
      notify?: boolean;
    },
  ) =>
    apiClient.post<{ success: boolean; data: any }>(
      `/api/visionboard/${year}/${month}/events`,
      payload,
    ),

  deleteEvent: (year: number, month: number, eventId: string) =>
    apiClient.delete<{ success: boolean; data: { deleted: boolean } }>(
      `/api/visionboard/${year}/${month}/events/${eventId}`,
    ),
};
