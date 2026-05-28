// src/api/resume.ts
import { apiClient } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export interface ResumePersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  custom_fields?: Array<{
    label: string;
    value: string;
    type?: "text" | "link" | "email";
  }>;
}

export interface ResumeExperience {
  company: string;
  position: string;
  location: string;
  period: string;
  highlights: string[];
}

export interface ResumeEducation {
  institution: string;
  degree: string;
  period: string;
  location?: string;
}

export interface ResumeSkill {
  category: string;
  items: string[];
}

export interface ResumeProject {
  name: string;
  link?: string;
  description: string;
  highlights: string[];
}

export interface ResumeSchema {
  personal_info: ResumePersonalInfo;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: ResumeSkill[];
  projects: ResumeProject[];
  certifications: string[];
  styles?: {
    primaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
  };
}

export interface ATSAspect {
  rating: number;
  why: string;
  how_to_improve: string;
}

export interface ATSAnalysis {
  score: number;
  aspects: {
    impact: ATSAspect;
    skills_match: ATSAspect;
    formatting: ATSAspect;
    language_tone: ATSAspect;
  };
  missing_keywords: string[];
  bullet_point_suggestions: Array<{
    original: string;
    improved: string;
    reason: string;
  }>;
  ats_checks?: {
    spelling_grammar: {
      passed: boolean;
      errors: string[];
      score_impact: number;
    };
    quantifiable_metrics: {
      passed: boolean;
      details: string;
      score_impact: number;
    };
    action_verbs: {
      passed: boolean;
      details: string;
      score_impact: number;
    };
    completeness: {
      passed: boolean;
      details: string;
      score_impact: number;
    };
  };
  general_feedback: string;
}

export interface JobApplication {
  id: string;
  company_name: string;
  job_title: string;
  status: "Applied" | "Interviewing" | "Offer" | "Rejected" | "Bookmarked";
  job_url?: string;
  jd_text?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InterviewPrepKit {
  rounds: Array<{
    name: string;
    focus: string;
    likely_topics: string[];
    difficulty: string;
  }>;
  culture: string;
  red_flags: string[];
  skill_gaps: Array<{
    skill: string;
    gap_severity: string;
    revision_topic: string;
    practice_source: string;
  }>;
  technical_questions: Array<{
    question: string;
    ideal_answer_concept: string;
  }>;
  hr_behavioral_questions: Array<{
    question: string;
    intent: string;
  }>;
  elevator_pitch: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function uploadAndParseResume(file: File): Promise<ResumeSchema> {
  const formData = new FormData();
  formData.append("file", file);

  // Use custom fetch for multi-part upload
  const response = await fetch(`${API_BASE_URL}/api/resume/upload`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to upload resume");
  }
  return data.data as ResumeSchema;
}

export interface SignedResumeUpload {
  bucket: string;
  storagePath: string;
  token: string;
  signedUrl: string;
  contentType: string;
}

export async function getSignedResumeUploadUrl(file: File): Promise<SignedResumeUpload> {
  const res = await apiClient.post("/api/resume/upload/signed-url", {
    fileName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
  });
  return res.data as SignedResumeUpload;
}

export async function uploadResumeToSignedUrl(params: {
  bucket: string;
  storagePath: string;
  token: string;
  file: File;
}): Promise<void> {
  const { bucket, storagePath, token, file } = params;
  const { data, error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(storagePath, token, file, {
      contentType: file.type,
      upsert: true,
    } as any);

  if (error) {
    throw new Error(error.message || "Failed to upload to storage");
  }
  if (!data) {
    throw new Error("Upload failed: empty response");
  }
}

export async function enqueueResumeParseFromStorage(params: {
  bucket: string;
  storagePath: string;
  originalname: string;
  mimetype: string;
}): Promise<{ jobId: string }> {
  const res = await apiClient.post("/api/resume/upload/parse", params);
  return { jobId: (res as any)?.jobId || (res.data as any)?.jobId };
}

/**
 * Upload with progress reporting via XMLHttpRequest.
 * onProgress receives a value 0–100 representing upload percentage.
 * Once upload completes, the parsing phase begins (no progress for that — it's server-side).
 */
export function uploadAndParseResumeWithProgress(
  file: File,
  onProgress: (percent: number) => void,
): Promise<ResumeSchema> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/api/resume/upload`);
    xhr.withCredentials = true;

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      }
    });

    xhr.addEventListener("load", () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.success) {
          resolve(data.data as ResumeSchema);
        } else {
          reject(new Error(data.error || "Failed to upload resume"));
        }
      } catch {
        reject(new Error("Invalid response from server"));
      }
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Network error during upload")),
    );
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));
    xhr.addEventListener("timeout", () =>
      reject(new Error("Upload timed out")),
    );
    xhr.timeout = 120000; // 2 minute timeout matching backend

    xhr.send(formData);
  });
}

export async function scoreResume(
  resume: ResumeSchema,
  jobDescription?: string,
): Promise<ATSAnalysis> {
  const res = await apiClient.post("/api/resume/score", {
    resume,
    job_description: jobDescription || "",
  });
  return res.data as ATSAnalysis;
}

export async function optimizeResume(
  resume: ResumeSchema,
  jobDescription?: string,
): Promise<ResumeSchema> {
  const res = await apiClient.post("/api/resume/optimize", {
    resume,
    job_description: jobDescription || "",
  });
  return res.data as ResumeSchema;
}

export async function downloadResumePdf(resume: ResumeSchema): Promise<string> {
  const res = await apiClient.post("/api/resume/download", { resume });

  // Extract raw structural text buffer
  const rawBase64 = (res.data as any)?.pdf_base64;
  if (!rawBase64) {
    throw new Error("Invalid PDF delivery packet from endpoint.");
  }

  // Reconstruct binary stream in-memory
  const binaryString = window.atob(rawBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: "application/pdf" });
  return window.URL.createObjectURL(blob);
}

export async function downloadResumeWord(
  resume: ResumeSchema,
): Promise<string> {
  const res = await apiClient.post("/api/resume/download/word", { resume });

  const rawBase64 = (res as any)?.word_base64 || (res.data as any)?.word_base64;
  if (!rawBase64) {
    throw new Error("Invalid Word delivery packet from endpoint.");
  }

  const binaryString = window.atob(rawBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  return window.URL.createObjectURL(blob);
}

export async function downloadLatexPdf(resume: ResumeSchema): Promise<string> {
  const res = await apiClient.post("/api/resume/download/latex-pdf", {
    resume,
  });

  const rawBase64 = (res.data as any)?.pdf_base64;
  if (!rawBase64) {
    throw new Error("Invalid LaTeX PDF delivery packet from endpoint.");
  }

  const binaryString = window.atob(rawBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: "application/pdf" });
  return window.URL.createObjectURL(blob);
}

export interface ResumeRevision {
  id: string;
  name: string;
  resume: ResumeSchema;
  job_description: string;
  saved_at: string;
}

export async function getResumeDraft(type?: "template" | "upload"): Promise<{
  resume_data: ResumeSchema;
  job_description: string;
  history: ResumeRevision[];
} | null> {
  const res = await apiClient.get("/api/resume/draft", { params: { type } });
  return res.data;
}

export async function saveResumeDraft(
  resume: ResumeSchema,
  jobDescription?: string,
  type?: "template" | "upload",
): Promise<boolean> {
  const res = await apiClient.post("/api/resume/draft", {
    resume,
    job_description: jobDescription || "",
    type,
  });
  return res.success === true;
}

export async function purgeResumeDraft(
  type?: "template" | "upload",
): Promise<boolean> {
  const res = await apiClient.delete("/api/resume/draft", { params: { type } });
  return res.success === true;
}

export async function saveResumeSnapshot(
  resume: ResumeSchema,
  jobDescription: string,
  name?: string,
  type?: "template" | "upload",
): Promise<ResumeRevision> {
  const res = await apiClient.post("/api/resume/history/save", {
    resume,
    job_description: jobDescription || "",
    name,
    type,
  });
  return res.data;
}

export async function restoreResumeSnapshot(
  revisionId: string,
  type?: "template" | "upload",
): Promise<{ resume_data: ResumeSchema; job_description: string }> {
  const res = await apiClient.post("/api/resume/history/restore", {
    revision_id: revisionId,
    type,
  });
  return res.data;
}

export async function deleteResumeSnapshot(
  revisionId: string,
  type?: "template" | "upload",
): Promise<boolean> {
  const res = await apiClient.delete(`/api/resume/history/${revisionId}`, {
    params: { type },
  });
  return res.success === true;
}

export async function getApplications(): Promise<JobApplication[]> {
  const res = await apiClient.get("/api/resume/applications");
  return res.data;
}

export async function createApplication(
  data: Partial<JobApplication>,
): Promise<JobApplication> {
  const res = await apiClient.post("/api/resume/applications", data);
  return res.data;
}

export async function updateApplication(
  id: string,
  data: Partial<JobApplication>,
): Promise<JobApplication> {
  const res = await apiClient.patch(`/api/resume/applications/${id}`, data);
  return res.data;
}

export async function deleteApplication(id: string): Promise<boolean> {
  const res = await apiClient.delete(`/api/resume/applications/${id}`);
  return res.success === true;
}

export async function generateCoverLetter(payload: {
  resume: ResumeSchema;
  job_description: string;
  company_name?: string;
  job_title?: string;
  tone?: string;
  hiring_manager?: string;
}): Promise<string> {
  const res = await apiClient.post("/api/resume/cover-letter", payload);
  return res.data;
}

export async function downloadCoverLetterPdf(
  resume: ResumeSchema,
  coverLetter: string,
): Promise<string> {
  const res = await apiClient.post("/api/resume/cover-letter/download", {
    resume,
    cover_letter: coverLetter,
  });

  const rawBase64 = (res.data as any)?.pdf_base64;
  if (!rawBase64) {
    throw new Error("Invalid PDF delivery packet from endpoint.");
  }

  const binaryString = window.atob(rawBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: "application/pdf" });
  return window.URL.createObjectURL(blob);
}

export async function downloadCoverLetterWord(
  resume: ResumeSchema,
  coverLetter: string,
): Promise<string> {
  const res = await apiClient.post("/api/resume/cover-letter/download/word", {
    resume,
    cover_letter: coverLetter,
  });

  const rawBase64 = (res.data as any)?.word_base64;
  if (!rawBase64) {
    throw new Error("Invalid Word delivery packet from endpoint.");
  }

  const binaryString = window.atob(rawBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  return window.URL.createObjectURL(blob);
}

export async function generateInterviewPrep(payload: {
  resume: ResumeSchema;
  job_description: string;
  company_name: string;
  job_title: string;
}): Promise<InterviewPrepKit> {
  const res = await apiClient.post("/api/resume/interview-prep", payload);
  return res.data;
}

export async function performCareerResearch(
  query: string,
  filters?: string[],
): Promise<any> {
  const res = await apiClient.post("/api/resume/research", { query, filters });
  return res.data;
}

export interface ResearchSummary {
  interview_themes: string[];
  culture_signals: string[];
  difficulty_rating: string;
  salary_range: string | null;
  key_insight: string;
}

export async function summarizeResearch(results: {
  reddit: any;
  web: any;
}): Promise<ResearchSummary> {
  const res = await apiClient.post("/api/resume/research/summarize", results);
  return res.data as ResearchSummary;
}

export async function parseJobUrl(url: string): Promise<{
  company_name: string;
  job_title: string;
  jd_text: string;
  applied_date?: string;
}> {
  const res = await apiClient.post("/api/resume/applications/parse-url", {
    url,
  });
  return res.data;
}

export interface CoachInsights {
  pep_talk: string;
  streaks_encouragement: string;
  checklist: Array<{ id: string; text: string; completed?: boolean }>;
  next_strategic_steps: string[];
}

export async function getCoachInsights(): Promise<CoachInsights> {
  const res = await apiClient.post("/api/resume/applications/coach-insights");
  return res.data;
}

export interface TailorAlignResult {
  resume: ResumeSchema;
  pdf_base64: string;
  ats_score: number;
  score_breakdown: any;
  missing_keywords: string[];
  ats_checks: any;
  bullet_point_suggestions: Array<{
    original: string;
    improved: string;
    reason: string;
  }>;
  general_feedback: string;
  generate_cover_letter?: boolean;
  cover_letter_text?: string;
  cover_letter_pdf_base64?: string;
}

export async function tailorAlignResume(
  file: File | null,
  jd: string,
  mode?: "enhance" | "rewrite",
  resumeId?: string,
  generateCoverLetter?: boolean,
  companyName?: string,
): Promise<TailorAlignResult> {
  const formData = new FormData();
  if (file) {
    formData.append("file", file);
  }
  formData.append("jd", jd);
  if (mode) {
    formData.append("mode", mode);
  }
  if (resumeId) {
    formData.append("resumeId", resumeId);
  }
  if (generateCoverLetter !== undefined) {
    formData.append("generateCoverLetter", String(generateCoverLetter));
  }
  if (companyName) {
    formData.append("companyName", companyName);
  }

  const res = await apiClient.post("/api/resume/tailor-align", formData);

  return res.data;
}

export interface TailorRunRecord extends TailorAlignResult {
  id: string;
  saved_at: string;
  company_name: string;
  job_title: string;
}

export async function getTailorRuns(): Promise<TailorRunRecord[]> {
  const res = await apiClient.get("/api/resume/tailor-runs");
  return (res.data as any) || [];
}

export async function deleteTailorRun(id: string): Promise<any> {
  const res = await apiClient.delete(`/api/resume/tailor-runs/${id}`);
  return res.data;
}

export const resumeApi = {
  uploadAndParseResume,
  uploadAndParseResumeWithProgress,
  getSignedResumeUploadUrl,
  uploadResumeToSignedUrl,
  enqueueResumeParseFromStorage,
  scoreResume,
  optimizeResume,
  downloadResumePdf,
  downloadResumeWord,
  getResumeDraft,
  saveResumeDraft,
  purgeResumeDraft,
  saveResumeSnapshot,
  restoreResumeSnapshot,
  deleteResumeSnapshot,
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  generateCoverLetter,
  downloadCoverLetterPdf,
  downloadCoverLetterWord,
  downloadLatexPdf,
  generateInterviewPrep,
  performCareerResearch,
  summarizeResearch,
  parseJobUrl,
  getCoachInsights,
  tailorAlignResume,
  getTailorRuns,
  deleteTailorRun,
};

export default resumeApi;
