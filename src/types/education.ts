// ============== Learning Plans ==============
export interface LearningPlan {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  exam_date: string | null;
  target_score: string | null;
  daily_study_hours: number;
  current_topic_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanWithTopics {
  plan: LearningPlan;
  topics: PlanTopic[];
}

// ============== Plan Topics ==============
export interface PlanTopic {
  id: string;
  plan_id: string;
  topic_name: string;
  description: string;
  scheduled_date: string;
  status: "pending" | "in_progress" | "completed";
  prep_summary: string | null;
  key_concepts: string[] | null;
  flashcards: Flashcard[] | null;
  hands_on_exercises: HandsOnExercise[] | null;
  is_queued?: boolean;
  exam_id?: string | null;
  exam?: Exam | null;
  active_jobs?: Array<{
    id: string;
    job_type: string;
    status: string;
    priority?: number;
  }>;
  created_at: string;
  updated_at: string;
}

export type TopicStatus = PlanTopic["status"];

// ============== Flashcards ==============
export interface Flashcard {
  question: string;
  answer: string;
  tier: "recall" | "application" | "analysis";
  state?: "new" | "learning" | "review" | "mastered";
  reviews?: number;
  ease_factor?: number;
  last_reviewed_at?: string;
}

export type FlashcardRating = "again" | "hard" | "good" | "easy";

// ============== Hands-On Exercises ==============
export interface HandsOnExercise {
  type: "coding_challenge" | "scenario" | "mini_project" | "design_challenge";
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimated_minutes: number;
  description: string;
  starter_code?: string;
  hints: string[];
  solution: string;
  key_learning?: string;
}

// ============== Exams & MCQ ==============
export interface Exam {
  id: string;
  user_id: string;
  plan_id: string | null;
  title: string;
  subject: string;
  type: "practice" | "mock" | "topic_test";
  difficulty: "easy" | "medium" | "hard";
  time_limit_mins: number;
  questions: ExamQuestion[];
  created_at: string;
}

export interface ExamQuestion {
  id: string;
  question: string;
  type: "mcq" | "text";
  options?: string[];
  correct_answer?: string; // Only present when solutions=true
  explanation?: string;
}

export interface ExamAnswer {
  question_id: string;
  selected_option?: string;
  text_answer?: string;
}

export interface ExamSubmission {
  id: string;
  exam_id: string;
  user_id: string;
  answers: ExamAnswer[];
  score: number;
  total_possible: number;
  percentage: number;
  ai_feedback: ExamFeedback;
  created_at: string;
}

export interface ExamFeedback {
  general_summary: string;
  strengths: string[];
  weaknesses: string[];
  graded_questions: GradedQuestion[];
}

export interface GradedQuestion {
  question_id: string;
  question: string;
  type: "mcq" | "text";
  student_answer: string;
  correct_answer: string;
  score: number;
  feedback: string;
}

// ============== Insights & Progress ==============
export interface PlanInsights {
  plan_id: string;
  completion_rate: number;
  completed_topics: number;
  total_topics: number;
  average_exam_score: number;
  strengths: string[];
  weaknesses: string[];
  ai_recommendations: string;
}

export interface PlanResumePoint {
  plan_id: string;
  plan_title: string;
  subject: string;
  daily_study_hours: number;
  exam_date: string | null;
  progress: {
    total: number;
    completed: number;
    in_progress: number;
    pending: number;
    percentage: number;
  };
  resume_topic: {
    id: string;
    topic_name: string;
    description: string;
    status: TopicStatus;
    scheduled_date: string;
    readiness: {
      has_prep: boolean;
      has_flashcards: boolean;
      has_hands_on: boolean;
      flashcard_progress: {
        total: number;
        reviewed: number;
        mastered: number;
        percentage: number;
      } | null;
    } | null;
  } | null;
  topics_overview: Array<{
    id: string;
    topic_name: string;
    status: TopicStatus;
    is_locked?: boolean;
    scheduled_date: string;
    has_prep: boolean;
    has_hands_on: boolean;
    has_flashcards: boolean;
  }>;
}

// ============== Import Schema ==============
export interface ImportPlanPayload {
  title: string;
  subject: string;
  exam_date?: string;
  target_score?: string;
  daily_study_hours?: number;
  topics: Array<{
    topic_name: string;
    description: string;
    days_to_allocate?: number;
  }>;
}
