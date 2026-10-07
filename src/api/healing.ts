// src/api/healing.ts
import { api as apiClient } from "@/lib/apiWrapper";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmotionLabel =
  | "anxious" | "afraid" | "ashamed" | "angry"
  | "sad" | "hopeless" | "other";

export type ThinkingTrap =
  | "catastrophizing" | "mind_reading" | "fortune_telling"
  | "all_or_nothing" | "overgeneralizing" | "emotional_reasoning"
  | "should_statements" | "personalization";

export type RecordStatus = "draft" | "completed";
export type ExperimentStatus = "planned" | "completed" | "cancelled";

export interface RecordEmotion {
  id?: string;
  record_id?: string;
  emotion: EmotionLabel;
  intensity_before: number; // 0-10
  intensity_after?: number | null; // 0-10
}

export interface ThoughtRecord {
  id: string;
  user_id: string;
  status: RecordStatus;
  traps: ThinkingTrap[];
  belief_before?: number | null; // 0-100
  belief_after?: number | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  deleted_at?: string | null;
  situation?: string | null;
  thought?: string | null;
  balanced_thought?: string | null;
  next_action?: string | null;
  evidence_for: string[];
  evidence_against: string[];
  emotions?: RecordEmotion[];
}

export interface UpsertRecordPayload {
  situation?: string;
  thought?: string;
  traps?: ThinkingTrap[];
  evidence_for?: string[];
  evidence_against?: string[];
  balanced_thought?: string;
  belief_before?: number;
  belief_after?: number;
  next_action?: string;
  status?: RecordStatus;
}

export interface Worry {
  id: string;
  text: string;
  parked_at: string;
  reviewed_at?: string | null;
}

export interface BehavioralExperiment {
  id: string;
  prediction?: string | null;
  plan?: string | null;
  outcome?: string | null;
  confidence_before?: number | null;
  confidence_after?: number | null;
  scheduled_for?: string | null;
  status: ExperimentStatus;
  created_at: string;
  updated_at: string;
}

export interface CbtSettings {
  user_id: string;
  country: string;
  ai_enabled: boolean;
  ai_consent_given_at?: string | null;
  reminders_enabled: boolean;
  reminder_time_utc?: string | null;
  quiet_hours_start_utc?: string;
  quiet_hours_end_utc?: string;
  disclaimer_accepted_at?: string | null;
  data_retention_days?: number;
  worry_time_slot_utc?: string | null;
}

export interface Helpline {
  name: string;
  number?: string;
  url?: string;
  type: string;
  note?: string;
}

export interface SafetyResponse {
  crisis: true;
  helplines: Helpline[];
  message?: string;
}

export interface WeeklyProgressItem {
  week: string;
  count: number;
  avg_intensity_before: number | null;
  avg_intensity_after: number | null;
  top_traps: { trap: ThinkingTrap; count: number }[];
}

export interface AiTrapSuggestion {
  traps: ThinkingTrap[];
  brief_reason: string;
  ai_suggestion: true;
}

export interface AiBalancedSuggestion {
  options: string[];
  ai_suggestion: true;
}

// ─── API Client ───────────────────────────────────────────────────────────────

export const healingApi = {
  // ── Records ────────────────────────────────────────────────────────────────
  listRecords: (params?: {
    page?: number; limit?: number; status?: RecordStatus;
    emotion?: EmotionLabel; trap?: ThinkingTrap;
    from?: string; to?: string; q?: string;
  }) =>
    apiClient.get<{
      success: boolean;
      data: ThoughtRecord[];
      pagination: { page: number; limit: number; total: number };
    }>("/api/healing/records", { params }),

  getRecord: (id: string) =>
    apiClient.get<{ success: boolean; data: ThoughtRecord; suggest_professional: boolean }>(
      `/api/healing/records/${id}`,
    ),

  createRecord: (payload: UpsertRecordPayload) =>
    apiClient.post<{ success: boolean; data: { id: string; status: RecordStatus } } | SafetyResponse>(
      "/api/healing/records",
      payload,
    ),

  updateRecord: (id: string, payload: UpsertRecordPayload) =>
    apiClient.put<{ success: boolean; data: { id: string; status: RecordStatus; updated_at: string } } | SafetyResponse>(
      `/api/healing/records/${id}`,
      payload,
    ),

  completeRecord: (id: string) =>
    apiClient.post<{ success: boolean; data: { id: string; status: RecordStatus; completed_at: string } }>(
      `/api/healing/records/${id}/complete`,
      {},
    ),

  deleteRecord: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/healing/records/${id}`),

  deleteAllData: (confirm: string) =>
    apiClient.delete<{ success: boolean; message: string }>("/api/healing/records/all", {
      body: JSON.stringify({ confirm }),
    }),

  exportRecord: (id: string, format: "json" | "pdf" = "json") =>
    fetch(`/api/healing/records/${id}/export?format=${format}`, {
      credentials: "include",
    }),

  upsertEmotions: (recordId: string, emotions: Omit<RecordEmotion, "id" | "record_id">[]) =>
    apiClient.put<{ success: boolean; data: RecordEmotion[] }>(
      `/api/healing/records/${recordId}/emotions`,
      { emotions },
    ),

  getProgress: (weeks = 4) =>
    apiClient.get<{
      success: boolean;
      data: { weekly: WeeklyProgressItem[]; total_completed: number };
    }>("/api/healing/progress", { params: { weeks } }),

  // ── Worries ────────────────────────────────────────────────────────────────
  listWorries: () =>
    apiClient.get<{ success: boolean; data: Worry[] }>("/api/healing/worries"),

  createWorry: (text: string) =>
    apiClient.post<{ success: boolean; data: { id: string; parked_at: string } }>(
      "/api/healing/worries",
      { text },
    ),

  reviewWorry: (id: string) =>
    apiClient.put<{ success: boolean; data: { id: string; reviewed_at: string } }>(
      `/api/healing/worries/${id}/review`,
      {},
    ),

  deleteWorry: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/healing/worries/${id}`),

  // ── Behavioral Experiments ─────────────────────────────────────────────────
  listExperiments: () =>
    apiClient.get<{ success: boolean; data: BehavioralExperiment[] }>("/api/healing/experiments"),

  createExperiment: (payload: {
    prediction: string; plan: string; confidence_before?: number; scheduled_for?: string;
  }) =>
    apiClient.post<{ success: boolean; data: BehavioralExperiment }>(
      "/api/healing/experiments",
      payload,
    ),

  updateExperiment: (id: string, payload: Partial<BehavioralExperiment & { prediction: string; plan: string; outcome: string }>) =>
    apiClient.put<{ success: boolean; data: BehavioralExperiment }>(
      `/api/healing/experiments/${id}`,
      payload,
    ),

  deleteExperiment: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/healing/experiments/${id}`),

  // ── Settings ───────────────────────────────────────────────────────────────
  getSettings: () =>
    apiClient.get<{ success: boolean; data: CbtSettings | null }>("/api/healing/settings"),

  updateSettings: (payload: Partial<CbtSettings & { disclaimer_accepted: boolean }>) =>
    apiClient.put<{ success: boolean; data: CbtSettings }>("/api/healing/settings", payload),

  // ── AI Suggestions ─────────────────────────────────────────────────────────
  suggestTraps: (thought: string, situation?: string) =>
    apiClient.post<{
      success: boolean;
      data: AiTrapSuggestion | null;
      fallback?: boolean;
      crisis?: boolean;
      helplines?: Helpline[];
    }>("/api/healing/ai/suggest-traps", { thought, situation }),

  suggestBalanced: (payload: {
    thought: string; situation?: string;
    evidence_for?: string[]; evidence_against?: string[];
    traps?: ThinkingTrap[];
  }) =>
    apiClient.post<{
      success: boolean;
      data: AiBalancedSuggestion | null;
      fallback?: boolean;
      crisis?: boolean;
      helplines?: Helpline[];
    }>("/api/healing/ai/suggest-balanced", payload),

  helpFindThought: (situation: string) =>
    apiClient.post<{
      success: boolean;
      data: { question: string; ai_suggestion: true } | null;
      fallback?: boolean;
    }>("/api/healing/ai/help-find-thought", { situation }),
};

export default healingApi;
