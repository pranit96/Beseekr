// Types for CAT Prep Module

// ========================
// Subject & Topic Types
// ========================

export type TopicStatus = 'not_started' | 'in_progress' | 'done' | 'needs_revision';

export interface Topic {
    id: string;
    subject_id: string;
    title: string;
    description?: string;
    status: TopicStatus;
    accuracy_percent: number | null;
    difficulty?: number;
    is_custom?: boolean;
    created_at: string;
    updated_at: string;
}

export interface SubjectStats {
    total: number;
    not_started: number;
    in_progress: number;
    done: number;
    needs_revision?: number;
}

export interface Subject {
    id: string;
    code: 'quant' | 'varc' | 'dilr';
    name: string;
    icon: string;
    topics: Topic[];
    stats: SubjectStats;
}

// ========================
// Study Task Types
// ========================

export type TaskType = 'study' | 'practice' | 'revision' | 'mock';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface StudyTask {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    topic_id?: string;
    subject_id?: string;
    task_type: TaskType;
    priority: TaskPriority;
    status: TaskStatus;
    estimated_minutes?: number;
    actual_minutes?: number;
    deadline?: string;
    completed_at?: string;
    created_at: string;
    updated_at: string;
    // Populated fields
    topic?: Topic;
    subject?: Subject;
}

export interface CreateTaskPayload {
    title: string;
    topic_id?: string;
    subject_id?: string;
    task_type: TaskType;
    priority: TaskPriority;
    estimated_minutes?: number;
    deadline?: string;
}

// ========================
// Notes Types
// ========================

export interface Note {
    id: string;
    user_id: string;
    topic_id: string;
    title: string;
    content: string; // Markdown content
    concepts: string[];
    formulas: string[];
    tricks: string[];
    common_mistakes: string[];
    tags: string[];
    created_at: string;
    updated_at: string;
    // Populated
    topic?: Topic;
}

export interface CreateNotePayload {
    topic_id: string;
    title: string;
    content: string;
    concepts?: string[];
    formulas?: string[];
    tricks?: string[];
    common_mistakes?: string[];
    tags?: string[];
}

// ========================
// Flashcard Types
// ========================

export interface Flashcard {
    id: string;
    user_id: string;
    topic_id: string;
    question: string;
    answer: string;
    difficulty: number;
    // Spaced repetition fields
    ease_factor: number;
    interval_days: number;
    repetitions: number;
    next_review_date: string;
    last_reviewed_at?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateFlashcardPayload {
    topic_id: string;
    question: string;
    answer: string;
    difficulty?: number;
}

// ========================
// Mock Test Types
// ========================

export type MockType = 'full' | 'sectional_quant' | 'sectional_varc' | 'sectional_dilr' | 'custom';
export type MockDifficulty = 'easy' | 'medium' | 'hard';
export type MockStatus = 'in_progress' | 'completed' | 'abandoned';

export interface MockQuestion {
    id: string;
    mock_id: string;
    question_number: number;
    question_text: string;
    options: { key: string; value: string }[];
    correct_answer?: string; // Hidden until mock complete
    explanation?: string;
    topic_id?: string;
    difficulty: number;
    section: 'quant' | 'varc' | 'dilr';
}

export interface MockAnswer {
    question_id: string;
    answer: string | null;
    time_spent: number;
    is_correct?: boolean; // Revealed after complete
}

export interface Mock {
    id: string;
    user_id: string;
    type: MockType;
    difficulty: MockDifficulty;
    status: MockStatus;
    total_questions: number;
    attempted: number;
    correct: number;
    score?: number;
    max_score?: number;
    percentile?: number;
    time_taken_minutes?: number;
    started_at: string;
    completed_at?: string;
    questions: MockQuestion[];
    answers: MockAnswer[];
    // Section-wise scores
    section_scores?: {
        quant?: { attempted: number; correct: number; score: number };
        varc?: { attempted: number; correct: number; score: number };
        dilr?: { attempted: number; correct: number; score: number };
    };
}

export interface StartMockPayload {
    type: MockType;
    difficulty: MockDifficulty;
    generate_new?: boolean;
}

export interface SubmitAnswerPayload {
    question_id: string;
    answer: string;
    time_spent: number;
}

// ========================
// Practice Session Types
// ========================

export type SessionType = 'timed' | 'untimed' | 'speed_drill' | 'accuracy_focus';

export interface PracticeSession {
    id: string;
    user_id: string;
    subject_id?: string;
    topic_id?: string;
    session_type: SessionType;
    question_count: number;
    time_limit_minutes?: number;
    questions_attempted: number;
    correct_answers: number;
    total_time_spent: number;
    started_at: string;
    completed_at?: string;
    status: 'in_progress' | 'completed';
}

export interface StartPracticePayload {
    subject_id?: string;
    topic_id?: string;
    session_type: SessionType;
    question_count: number;
    time_limit_minutes?: number;
}

// ========================
// Revision Types
// ========================

export interface Revision {
    id: string;
    user_id: string;
    topic_id: string;
    scheduled_date: string;
    completed_date?: string;
    revision_number: number;
    status: 'pending' | 'completed' | 'overdue';
    notes?: string;
    created_at: string;
    // Populated
    topic?: Topic;
}

// ========================
// Mistake Types
// ========================

export type MistakeType = 'concept' | 'calculation' | 'silly_error' | 'time_pressure' | 'misread';

export interface Mistake {
    id: string;
    user_id: string;
    question_id: string;
    topic_id?: string;
    mistake_type: MistakeType;
    question_text: string;
    user_answer: string;
    correct_answer: string;
    explanation?: string;
    reviewed: boolean;
    review_notes?: string;
    source: 'mock' | 'practice';
    created_at: string;
    // Populated
    topic?: Topic;
}

// ========================
// Bookmark Types
// ========================

export type BookmarkImportance = 'low' | 'medium' | 'high' | 'must_revise';

export interface BookmarkCollection {
    id: string;
    user_id: string;
    name: string;
    color: string;
    icon: string;
    question_count: number;
}

export interface Bookmark {
    id: string;
    user_id: string;
    question_id: string;
    collection_id?: string;
    collection_name?: string;
    importance: BookmarkImportance;
    notes?: string;
    question_text: string;
    created_at: string;
}

export interface CreateBookmarkPayload {
    collection?: string;
    importance: BookmarkImportance;
    notes?: string;
}

// ========================
// Daily Goals Types
// ========================

export interface DailyGoalProgress {
    study_hours: { target: number; completed: number };
    questions_practiced: { target: number; completed: number };
    topics_revised: { target: number; completed: number };
    flashcards_reviewed: { target: number; completed: number };
}

export interface DailyGoal {
    date: string;
    progress: DailyGoalProgress;
    streak: number;
    completed: boolean;
}

// ========================
// External Mock Types
// ========================

export type ExternalPlatform = 'IMS' | 'TIME' | 'Career Launcher' | 'Unacademy' | '2IIM' | 'Bodhee' | 'Other';

export interface ExternalMock {
    id: string;
    user_id: string;
    platform: ExternalPlatform;
    mock_name: string;
    mock_date: string;
    overall_score: number;
    max_score: number;
    percentile?: number;
    quant_score?: number;
    quant_percentile?: number;
    varc_score?: number;
    varc_percentile?: number;
    dilr_score?: number;
    dilr_percentile?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateExternalMockPayload {
    platform: ExternalPlatform;
    mock_name: string;
    mock_date: string;
    overall_score: number;
    max_score: number;
    percentile?: number;
    quant_score?: number;
    quant_percentile?: number;
    varc_score?: number;
    varc_percentile?: number;
    dilr_score?: number;
    dilr_percentile?: number;
    notes?: string;
}

// ========================
// Resource Types
// ========================

export type ResourceType = 'video' | 'article' | 'pdf' | 'course' | 'practice_set' | 'other';
export type ResourceDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Resource {
    id: string;
    topic_id?: string;
    subject_id?: string;
    title: string;
    url: string;
    resource_type: ResourceType;
    source: string;
    duration_minutes?: number;
    difficulty: ResourceDifficulty;
    is_free: boolean;
    rating?: number;
    rating_count?: number;
    user_rating?: number;
    created_at: string;
}

export interface CreateResourcePayload {
    topic_id?: string;
    title: string;
    url: string;
    resource_type: ResourceType;
    source: string;
    duration_minutes?: number;
    difficulty: ResourceDifficulty;
    is_free: boolean;
}

// ========================
// Settings Types
// ========================

export interface CatSettings {
    target_exam_date?: string;
    daily_study_hours_goal: number;
    weekly_mocks_goal: number;
    // CAT-specific settings
    preferred_slot?: 'slot_1' | 'slot_2' | 'slot_3';
    sectional_time_limit: number;
    enforce_sectional_timing: boolean;
    target_percentile?: number;
    daily_question_goal: number;
    email_daily_reminder: boolean;
    reminder_time?: string;
}

export interface CatSlot {
    slot: 'slot_1' | 'slot_2' | 'slot_3';
    name: string;
    time: string;
}

// ========================
// Dashboard Types
// ========================

export interface DashboardSyllabusSubject {
    name: string;
    icon: string;
    total: number;
    done: number;
    progress: string; // "0" to "100"
}

export interface DashboardSyllabus {
    total_topics: number;
    completed: number;
    progress_percent: string; // "0.0"
    subjects: DashboardSyllabusSubject[];
}

export interface DashboardSettings {
    target_date: string | null;
    daily_goal: number;
    weekly_mock_goal: number;
    current_streak: number;
    longest_streak: number;
    total_study_hours: number;
}

export interface DashboardRevisions {
    due_today: number;
    overdue: number;
    completion_rate: number;
}

export interface DashboardMocks {
    total_mocks: number;
    average_score: string; // "0.0"
    average_accuracy: string; // "0.0"
    weak_areas_count: number;
}

export interface WeakArea {
    topic_id: string;
    topic_name: string;
    accuracy: number;
    attempts: number;
}

export interface DashboardData {
    syllabus: DashboardSyllabus;
    settings: DashboardSettings;
    revisions: DashboardRevisions;
    mocks: DashboardMocks;
    score_trend: { date: string; score: number }[];
    weak_areas: WeakArea[];
}

// ========================
// AI Types
// ========================

export interface AIStudyPlan {
    week_start: string;
    week_end: string;
    daily_plans: {
        date: string;
        day: string;
        focus_areas: string[];
        tasks: {
            type: TaskType;
            title: string;
            duration_minutes: number;
            topic_id?: string;
        }[];
        estimated_hours: number;
    }[];
    recommendations: string[];
}

export interface AIAnalysis {
    strengths: { topic: string; accuracy: number; insight: string }[];
    weaknesses: { topic: string; accuracy: number; suggestion: string }[];
    overall_assessment: string;
    improvement_roadmap: string[];
    predicted_percentile?: number;
}

export interface AITopicTips {
    topic_id: string;
    topic_title: string;
    tips: string[];
    common_pitfalls: string[];
    recommended_resources: { title: string; url: string; type: string }[];
    practice_strategy: string;
}

// ========================
// Learn Section Types
// ========================

export type LessonType = 'concept' | 'formula' | 'shortcut' | 'video' | 'example';
export type ProblemDifficulty = 'easy' | 'medium' | 'hard' | 'cat_level';
export type MasteryLevel = 'beginner' | 'learning' | 'practicing' | 'proficient' | 'mastered';

export interface Lesson {
    id: string;
    topic_id: string;
    topic_name: string;
    title: string;
    lesson_type: LessonType;
    content: string; // Markdown
    formulas?: string[];
    examples?: { problem: string; solution: string }[];
    video_url?: string;
    duration_minutes?: number;
    order: number;
    is_completed?: boolean;
    created_at: string;
}

export interface Problem {
    id: string;
    topic_id: string;
    topic_name: string;
    question_text: string;
    options: { key: string; value: string }[];
    correct_answer?: string; // Hidden until attempted
    explanation?: string;
    difficulty: ProblemDifficulty;
    is_real_cat: boolean;
    cat_year?: number;
    time_limit_seconds?: number;
    tags: string[];
    attempted?: boolean;
    user_answer?: string;
    is_correct?: boolean;
    created_at: string;
}

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface ProblemAttemptPayload {
    answer: string;
    time_spent_seconds: number;
    hints_used?: number;
    confidence_level?: ConfidenceLevel;
}

export interface LessonProgressPayload {
    status: 'in_progress' | 'completed';
    progress_percent: number;
    time_spent_seconds: number;
    user_notes?: string;
    is_bookmarked?: boolean;
}

export interface LessonWithProgress extends Lesson {
    progress_percent: number;
    status: 'not_started' | 'in_progress' | 'completed';
    user_notes?: string;
    is_bookmarked: boolean;
    last_accessed_at?: string;
}

export interface ProblemsQueryParams {
    difficulty?: 1 | 2 | 3 | 4 | 5;
    source?: 'practice' | 'cat_pyq';
}

export interface ProblemWithHints extends Problem {
    hints: string[];
    hints_revealed: number;
}

export interface ProblemAttemptResponse {
    is_correct: boolean;
    correct_answer: string;
    explanation: string;
    points_earned: number;
    streak_bonus?: number;
    mastery_update?: { old_level: MasteryLevel; new_level: MasteryLevel };
}

export interface TopicMastery {
    topic_id: string;
    topic_name: string;
    subject_code: 'quant' | 'varc' | 'dilr';
    mastery_level: MasteryLevel;
    mastery_score: number; // 0-100
    problems_attempted: number;
    problems_correct: number;
    accuracy_percent: number;
    streak: number;
    last_practiced_at?: string;
    lessons_completed: number;
    total_lessons: number;
}

export interface MasteryOverview {
    overall_mastery: number; // 0-100
    by_subject: {
        subject_code: 'quant' | 'varc' | 'dilr';
        subject_name: string;
        mastery_score: number;
        topics_mastered: number;
        total_topics: number;
    }[];
    topics: TopicMastery[];
    weak_topics: TopicMastery[];
    strong_topics: TopicMastery[];
}

export interface LearnSession {
    id: string;
    user_id: string;
    topic_id: string;
    topic_name: string;
    session_type: 'lesson' | 'practice' | 'real_cat' | 'mixed';
    status: 'active' | 'paused' | 'completed';
    total_problems: number;
    problems_attempted: number;
    correct_answers: number;
    time_spent_seconds: number;
    started_at: string;
    completed_at?: string;
    current_problem_index: number;
}

export interface StartLearnSessionPayload {
    topicName: string;
    sessionType: 'practice' | 'speed_drill' | 'revision';
    problemCount?: number;
    difficulty?: number[];
    timeLimitMinutes?: number;
    includeRealCat?: boolean;
}

export interface LearnSubjectInfo {
    name: string;
    topics: string[];
    lessonCount: number;
    problemCount: number;
}

export interface LearnSubjectsOverview {
    quant: LearnSubjectInfo;
    varc: LearnSubjectInfo;
    dilr: LearnSubjectInfo;
}

export interface ExplainProblemPayload {
    problem_id: string;
    specific_doubt?: string;
}

export interface ExplainProblemResponse {
    explanation: string;
    step_by_step: string[];
    key_concepts: string[];
    related_formulas?: string[];
    common_mistakes?: string[];
    similar_problems?: { id: string; title: string }[];
}

// ========================
// AI Tutor Types
// ========================

export interface AskDoubtPayload {
    question: string;
    topic_id?: string;
    subject_code?: 'quant' | 'varc' | 'dilr';
    context?: string;
}

export interface AskDoubtResponse {
    answer: string;
    related_concepts: string[];
    examples: { problem: string; solution: string }[];
    formula_used?: string[];
    tips?: string[];
    recommended_topics?: { id: string; title: string }[];
    confidence: number;
}

export interface ExplainWrongPayload {
    question_text: string;
    options: string[];
    user_answer: string;
    correct_answer: string;
    topic?: string;
    subject_code?: 'quant' | 'varc' | 'dilr';
}

export interface ExplainWrongResponse {
    explanation: string;
    why_wrong: string;
    why_correct: string;
    step_by_step_solution: string[];
    concept_gap?: string;
    similar_examples?: { problem: string; solution: string }[];
    tips_to_avoid?: string[];
    related_formulas?: string[];
}

export interface TutorFollowUpPayload {
    original_question: string;
    previous_answer: string;
    follow_up_question: string;
}

export interface TutorFollowUpResponse {
    answer: string;
    examples?: { problem: string; solution: string }[];
    next_steps?: string[];
}

export interface ExplainMockPayload {
    mock_id: string;
    limit?: number;
}

export interface ExplainMockResponse {
    mistakes: {
        question_id: string;
        question_text: string;
        user_answer: string;
        correct_answer: string;
        mistake_type: 'concept' | 'calculation' | 'careless' | 'time_pressure';
        explanation: string;
        correct_approach: string;
    }[];
    summary: {
        total_mistakes: number;
        by_type: Record<string, number>;
        weakest_topics: string[];
        practice_recommendation: string;
    };
}

export interface TutorUsageResponse {
    total_questions_asked: number;
    questions_this_week: number;
    questions_today: number;
    topics_covered: { topic: string; count: number }[];
    streak_days: number;
}

export interface TutorLimitResponse {
    daily_limit: number;
    used_today: number;
    remaining: number;
    resets_at: string;
}

// ========================
// Features API Types
// ========================

export interface LeaderboardEntry {
    rank: number;
    user_id: string;
    name: string;
    avatar_url?: string;
    score: number;
    problems_solved: number;
    streak_days: number;
}

export interface LeaderboardResponse {
    period: 'weekly' | 'monthly';
    entries: LeaderboardEntry[];
    updated_at: string;
}

export interface MyRankingResponse {
    my_rank: number;
    my_score: number;
    nearby_users: LeaderboardEntry[];
    percentile: number;
}

export interface StartTimerPayload {
    subjectId?: string;
    topicId?: string;
    sessionType: 'study' | 'practice' | 'revision';
    targetMinutes?: number;
    isPomodoro?: boolean;
}

export interface TimerSession {
    id: string;
    user_id: string;
    subject_id?: string;
    topic_id?: string;
    session_type: 'study' | 'practice' | 'revision';
    status: 'running' | 'paused' | 'completed';
    target_minutes?: number;
    elapsed_seconds: number;
    is_pomodoro: boolean;
    pomodoro_cycle?: number;
    started_at: string;
    paused_at?: string;
    completed_at?: string;
}

export interface TimerStatsResponse {
    total_study_minutes: number;
    today_minutes: number;
    this_week_minutes: number;
    by_subject: { subject: string; minutes: number }[];
    by_topic: { topic: string; minutes: number }[];
    pomodoro_sessions_completed: number;
    longest_session_minutes: number;
}

export type ReportType = 'wrong_answer' | 'typo' | 'unclear' | 'duplicate';

export interface ReportQuestionPayload {
    reportType: ReportType;
    description: string;
}

export interface ReportQuestionResponse {
    report_id: string;
    status: 'submitted' | 'under_review' | 'resolved';
    message: string;
}

export interface SpeedAnalyticsResponse {
    topics: {
        id: string;
        name: string;
        avg_time_seconds: number;
        target_time_seconds: number;
        improvement_percent: number;
        problems_attempted: number;
    }[];
    overall_avg_time: number;
    percentile_speed: number;
}

export interface AdaptiveNextQuestionResponse {
    question: {
        id: string;
        text: string;
        options?: { key: string; value: string }[];
        difficulty: number;
        topic: string;
        time_limit_seconds?: number;
        is_ai_generated: boolean;
    };
    questions_remaining: number;
    current_ability_estimate: number;
}

// ========================
// AI Adaptive Exam System Types
// ========================

export type AdaptiveExamType = 'full' | 'sectional' | 'topic_focus' | 'weakness_drill';
export type DifficultyLabel = 'very_easy' | 'easy' | 'medium' | 'hard' | 'very_hard';
export type AdaptiveQuestionType = 'mcq' | 'tita';

export interface AbilityScore {
    subject: 'quant' | 'varc' | 'dilr';
    ability_score: number;
    confidence: number;
    last_updated: string;
}

export interface AbilityCheckResponse {
    needs_diagnostic: boolean;
    ability_scores?: AbilityScore[];
    overall_ability?: number;
    last_diagnostic_at?: string;
}

export interface DiagnosticConfig {
    subjects?: ('quant' | 'varc' | 'dilr')[];
    questions_per_subject?: number;
}

export interface AdaptiveQuestion {
    id: string;
    topic_name: string;
    difficulty: number;
    difficulty_label: DifficultyLabel;
    question_text: string;
    question_type: AdaptiveQuestionType;
    options?: Record<string, string>;
    expected_time_seconds: number;
}

export interface DiagnosticExamResponse {
    exam_id: string;
    total_questions: number;
    first_question: AdaptiveQuestion;
}

export interface StartAdaptiveExamPayload {
    exam_type: AdaptiveExamType;
    subject?: string;
    topics?: string[];
    question_count?: number;
    time_limit_minutes?: number;
}

export interface StartAdaptiveExamResponse {
    exam_id: string;
    total_questions: number;
    initial_difficulty: number;
    difficulty_label: DifficultyLabel;
    first_question: AdaptiveQuestion;
}

export interface SubmitAdaptiveAnswerPayload {
    problem_id: string;
    answer: string;
    time_spent_seconds: number;
}

export interface AdaptiveProgress {
    answered: number;
    total: number;
    accuracy: string;
}

export interface SubmitAdaptiveAnswerResponse {
    is_correct: boolean;
    correct_answer: string;
    solution_text: string;
    difficulty_change: string;
    new_difficulty: string;
    difficulty_label: DifficultyLabel;
    progress: AdaptiveProgress;
    is_exam_complete: boolean;
    next_question: AdaptiveQuestion | null;
}

export interface DifficultyProgression {
    question_number: number;
    difficulty: number;
    is_correct: boolean;
}

export interface TopicPerformance {
    topic_name: string;
    total: number;
    correct: number;
    accuracy: number;
    avg_time_seconds: number;
}

export interface PredictedCatScore {
    percentile_range: string;
    estimated_score: number;
    confidence: number;
}

export interface AdaptiveExamResult {
    summary: {
        total: number;
        correct: number;
        accuracy: string;
        time_taken_seconds: number;
    };
    difficulty_progression: DifficultyProgression[];
    topic_performance: TopicPerformance[];
    predicted_cat_score: PredictedCatScore;
    ai_insights: string;
    ai_deep_insights?: {
        insights: string[];
        strengths: string[];
        weaknesses: string[];
    };
    recommendations: {
        type: 'practice' | 'review' | 'master';
        topic: string;
        action: string;
        priority: number;
    }[];
}

export interface GenerateQuestionPayload {
    topic: string;
    difficulty?: number;
    question_type?: AdaptiveQuestionType;
    subject_code?: 'quant' | 'varc' | 'dilr';
}

export interface GeneratedQuestion {
    question_text: string;
    options?: Record<string, string>;
    correct_answer: string;
    explanation: string;
    difficulty: number;
}

export interface ScorePrediction {
    overall_percentile: number;
    percentile_range: string;
    section_predictions: {
        section: string;
        percentile: number;
        score_range: string;
    }[];
    improvement_potential: number;
    confidence: number;
}

export interface StudyPlanPayload {
    target_percentile?: number;
    weeks?: number;
}

export interface StudyPlanWeek {
    week: number;
    focus_topics: string[];
    daily_question_target: number;
    mock_tests: number;
    revision_topics: string[];
}

export interface StudyPlan {
    target_percentile: number;
    weeks: number;
    weekly_schedule: StudyPlanWeek[];
    priority_topics: { topic: string; priority: 'high' | 'medium' | 'low'; reason: string }[];
    daily_targets: {
        questions: number;
        study_hours: number;
        revision_time_minutes: number;
    };
    milestones: { week: number; target: string; metric: string }[];
}

// ========================
// Sectional Mock & Features Types
// ========================

export interface SectionalMockStartPayload {
    pyq_paper_id?: string;
    shuffle_questions?: boolean;
}

export interface SectionalMockStartResponse {
    mock_id: string;
    sections: ('varc' | 'dilr' | 'quant')[];
    current_section: 'varc' | 'dilr' | 'quant';
    section_time_limit_seconds: number;
    total_questions: number;
    first_question: AdaptiveQuestion;
}

export interface SectionTimeResponse {
    remaining_seconds: number;
    total_seconds: number;
    is_locked: boolean;
}

export interface SectionalSubmitAnswerPayload {
    question_id: string;
    answer: string;
    time_spent_seconds: number;
}

export interface SectionalSubmitAnswerResponse {
    success: boolean;
    next_question: AdaptiveQuestion | null;
}

export interface SectionSummary {
    attempted: number;
    unattempted: number;
    marked_for_review: number;
}

export interface NextSectionResponse {
    previous_section: string;
    next_section: string;
    section_summary: SectionSummary;
    first_question_of_next_section?: AdaptiveQuestion;
}

export interface CompleteSectionalMockResponse {
    scaled_score: number;
    percentile: number;
    analytics: {
        total_questions: number;
        attempted: number;
        correct: number;
        wrong: number;
        accuracy: number;
        score: number;
        section_wise_score: Record<string, number>;
    };
}

export interface CalculatorInput {
    type: 'digit' | 'operator' | 'function' | 'command' | 'memory';
    value: string;
}

export interface CalculatorState {
    currentValue: string;
    memory: number;
    expression?: string;
    lastOperator?: string;
    isNewNumber?: boolean;
}

export interface CalculatorResponse {
    display: string;
    state: CalculatorState;
}

export interface Benchmark {
    percentile: number;
    scaled_score: number;
}

export interface BenchmarksResponse {
    benchmarks: Benchmark[];
    college_cutoffs: Record<string, number>;
}

export interface SectionalMockAnalytics {
    attempt_rate: number;
    accuracy: number;
    weakest_section: string;
    time_management: {
        avg_time_per_correct: number;
        avg_time_per_wrong: number;
        avg_time_per_unattempted: number;
    };
}

export interface MockSummary {
    mock_id: string;
    score: number;
    percentile: number;
    accuracy: number;
    total_attempted: number;
}

// ========================
// API Response Types
// ========================

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
}

export interface ApiErrorResponse {
    success: false;
    error: string;
    message?: string;
}
