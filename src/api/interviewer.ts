// src/api/interviewer.ts
// API client for the AI Interviewer feature — sessions, Whisper STT, SSE turn streaming, and feedback.

const API_BASE =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";

export interface InterviewSessionConfig {
  persona: string;
  interviewType?: "Technical" | "Behavioral" | "System Design" | "HR" | "Leadership" | "General" | string;
  role?: string;
  company?: string;
  totalQuestions?: number;
  jdContext?: string;
  resumeContext?: string;
}

export interface InterviewMessage {
  role: "interviewer" | "candidate" | "system";
  content: string;
  timestamp?: string;
  audio?: {
    base64: string;
    contentType: string;
  };
}

export interface QuestionBreakdownItem {
  question: string;
  candidateResponse: string;
  quality: "Excellent" | "Good" | "Needs Improvement" | "Weak" | string;
  comment: string;
}

export interface InterviewFeedbackScores {
  communication: number;
  technicalDepth: number;
  problemSolving: number;
  confidence: number;
  relevance: number;
}

export interface InterviewFeedback {
  overallScore: number;
  verdict: "Strong Hire" | "Hire" | "Lean Hire" | "No Hire" | string;
  summary: string;
  scores: InterviewFeedbackScores;
  strengths: string[];
  improvements: string[];
  questionBreakdown: QuestionBreakdownItem[];
  hiringNotes: string;
}

export interface InterviewSession {
  id: string;
  status: "active" | "completed" | "ended";
  config: InterviewSessionConfig;
  transcript?: InterviewMessage[];
  openingMessage?: InterviewMessage;
  feedback?: InterviewFeedback;
  created_at: string;
  updated_at?: string;
}

export interface StreamTurnCallbacks {
  onDelta?: (delta: string) => void;
  onEnd?: (fullText: string) => void;
  onAudio?: (audio: { base64: string; contentType: string }) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
  signal?: AbortSignal;
}

export class InterviewerApiError extends Error {
  data: unknown;
  status: number;
  constructor(message: string, data: unknown, status: number) {
    super(message);
    this.name = "InterviewerApiError";
    this.data = data;
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const isFormData = options.body instanceof FormData;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new InterviewerApiError(
      errorData.error || errorData.message || `Request failed (${response.status})`,
      errorData,
      response.status,
    );
  }

  const result = await response.json();
  return result.data !== undefined ? result.data : result;
}

export const interviewerApi = {
  /**
   * Create a new interview session and fetch opening message + audio
   */
  async createSession(config: InterviewSessionConfig): Promise<{
    sessionId: string;
    status: string;
    config: InterviewSessionConfig;
    openingMessage: InterviewMessage;
  }> {
    return request("/api/interviewer/sessions", {
      method: "POST",
      body: JSON.stringify(config),
    });
  },

  /**
   * List recent sessions for current user
   */
  async listSessions(limit: number = 20): Promise<InterviewSession[]> {
    return request(`/api/interviewer/sessions?limit=${limit}`);
  },

  /**
   * Get complete session details including transcript & cached feedback
   */
  async getSession(sessionId: string): Promise<InterviewSession> {
    return request(`/api/interviewer/sessions/${sessionId}`);
  },

  /**
   * Delete an interview session
   */
  async deleteSession(sessionId: string): Promise<{ deleted: boolean }> {
    return request(`/api/interviewer/sessions/${sessionId}`, {
      method: "DELETE",
    });
  },

  /**
   * Transcribe recorded audio blob using OpenAI Whisper STT
   */
  async transcribeAudio(
    sessionId: string,
    audioBlob: Blob,
    language: string = "en",
  ): Promise<{ text: string; duration?: number; words?: Array<{ word: string; start: number; end: number }> }> {
    const formData = new FormData();
    const extension = audioBlob.type.includes("mp4") ? "mp4" : "webm";
    formData.append("audio", audioBlob, `recording.${extension}`);
    formData.append("language", language);

    return request(`/api/interviewer/sessions/${sessionId}/transcribe`, {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Send candidate message and stream back interviewer text (SSE) + TTS audio
   */
  async streamTurn(
    sessionId: string,
    message: string,
    callbacks: StreamTurnCallbacks,
  ): Promise<void> {
    const url = `${API_BASE}/api/interviewer/sessions/${sessionId}/turn/stream`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ message }),
        signal: callbacks.signal,
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new InterviewerApiError(
          errorJson.error || errorJson.message || `SSE Stream failed (${response.status})`,
          errorJson,
          response.status,
        );
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported by this browser.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep unfinished trailing line in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === "text" && event.delta) {
              callbacks.onDelta?.(event.delta);
            } else if (event.type === "end") {
              callbacks.onEnd?.(event.fullText || "");
            } else if (event.type === "audio" && event.audio) {
              callbacks.onAudio?.(event.audio);
            } else if (event.type === "interview_complete") {
              callbacks.onComplete?.();
            } else if (event.type === "error") {
              callbacks.onError?.(event.error || "Turn generation error");
            }
          } catch (e) {
            console.warn("[Interviewer SSE] Failed to parse event JSON:", jsonStr, e);
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("[Interviewer SSE] Stream aborted by caller");
        return;
      }
      callbacks.onError?.(err.message || "Failed to stream interviewer turn");
      throw err;
    }
  },

  /**
   * Request full AI evaluation & feedback for the session
   */
  async generateFeedback(sessionId: string): Promise<InterviewFeedback> {
    return request(`/api/interviewer/sessions/${sessionId}/feedback`, {
      method: "POST",
    });
  },

  /**
   * Replay TTS audio for any given text
   */
  async getTTSAudio(text: string, voiceId?: string): Promise<Blob> {
    const url = `${API_BASE}/api/interviewer/tts`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ text, voiceId }),
    });

    if (!response.ok) {
      throw new Error(`TTS failed with status ${response.status}`);
    }

    return response.blob();
  },
};
