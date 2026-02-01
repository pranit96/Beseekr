// API client for CAT Prep Module

import type {
    Subject,
    Topic,
    TopicStatus,
    StudyTask,
    CreateTaskPayload,
    Note,
    CreateNotePayload,
    Flashcard,
    CreateFlashcardPayload,
    Mock,
    StartMockPayload,
    SubmitAnswerPayload,
    PracticeSession,
    StartPracticePayload,
    Revision,
    Mistake,
    MistakeType,
    Bookmark,
    BookmarkCollection,
    CreateBookmarkPayload,
    DailyGoal,
    ExternalMock,
    CreateExternalMockPayload,
    Resource,
    CreateResourcePayload,
    CatSettings,
    CatSlot,
    DashboardData,
    AIStudyPlan,
    AIAnalysis,
    AITopicTips,
    AskDoubtPayload,
    AskDoubtResponse,
    ExplainWrongPayload,
    ExplainWrongResponse,
    PaginatedResponse,
    // Learn types
    Lesson,
    Problem,
    ProblemDifficulty,
    ProblemAttemptPayload,
    ProblemAttemptResponse,
    MasteryOverview,
    LearnSession,
    StartLearnSessionPayload,
    LearnSubjectsOverview,
    ExplainProblemPayload,
    ExplainProblemResponse,
    // Adaptive Exam types
    AbilityCheckResponse,
    DiagnosticConfig,
    DiagnosticExamResponse,
    StartAdaptiveExamPayload,
    StartAdaptiveExamResponse,
    SubmitAdaptiveAnswerPayload,
    SubmitAdaptiveAnswerResponse,
    AdaptiveExamResult,
    GenerateQuestionPayload,
    GeneratedQuestion,
    ScorePrediction,
    StudyPlan,
    // Sectional Mock types
    SectionalMockStartPayload,
    SectionalMockStartResponse,
    SectionTimeResponse,
    SectionalSubmitAnswerPayload,
    SectionalSubmitAnswerResponse,
    NextSectionResponse,
    CompleteSectionalMockResponse,
    CalculatorInput,
    CalculatorState,
    CalculatorResponse,
    BenchmarksResponse,
    SectionalMockAnalytics,
    MockSummary,
} from '@/types/cat';

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

// Standard headers for authenticated calls
const getAuthHeaders = (): HeadersInit => ({
    'Content-Type': 'application/json',
});

// Custom error class
export class CatApiError extends Error {
    data: unknown;
    status: number;

    constructor(message: string, data: unknown, status: number) {
        super(message);
        this.name = 'CatApiError';
        this.data = data;
        this.status = status;
    }
}

// Base request helper
async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            ...getAuthHeaders(),
            ...options.headers,
        },
        credentials: 'include',
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new CatApiError(
            errorData.message || errorData.error || `Request failed: ${response.status}`,
            errorData,
            response.status
        );
    }

    const json = await response.json();

    // Backend wraps responses in {success: true, data: {...}}
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
        return json.data as T;
    }

    return json;
}

// ========================
// Subjects & Topics API
// ========================

export async function getSubjects(): Promise<Subject[]> {
    return request<Subject[]>('/api/cat/subjects');
}

export async function getTopic(id: string): Promise<Topic> {
    return request<Topic>(`/api/cat/topics/${id}`);
}

export async function createTopic(payload: {
    subject_id: string;
    title: string;
    description?: string;
}): Promise<Topic> {
    return request<Topic>('/api/cat/topics', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function updateTopic(
    id: string,
    payload: { title?: string; description?: string; difficulty?: number }
): Promise<Topic> {
    return request<Topic>(`/api/cat/topics/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export async function updateTopicStatus(
    id: string,
    status: TopicStatus
): Promise<Topic> {
    return request<Topic>(`/api/cat/topics/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
}

export async function deleteTopic(id: string): Promise<void> {
    return request<void>(`/api/cat/topics/${id}`, {
        method: 'DELETE',
    });
}

// ========================
// Study Tasks API
// ========================

export async function getTasks(params?: {
    status?: string;
    priority?: string;
    subject_id?: string;
    task_type?: string;
    page?: number;
    limit?: number;
}): Promise<PaginatedResponse<StudyTask>> {
    const searchParams = new URLSearchParams();
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) searchParams.set(key, String(value));
        });
    }
    const query = searchParams.toString();
    return request<PaginatedResponse<StudyTask>>(`/api/cat/tasks${query ? `?${query}` : ''}`);
}

export async function createTask(payload: CreateTaskPayload): Promise<StudyTask> {
    return request<StudyTask>('/api/cat/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function updateTask(
    id: string,
    payload: Partial<CreateTaskPayload>
): Promise<StudyTask> {
    return request<StudyTask>(`/api/cat/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export async function completeTask(id: string): Promise<StudyTask> {
    return request<StudyTask>(`/api/cat/tasks/${id}/complete`, {
        method: 'PATCH',
    });
}

export async function deleteTask(id: string): Promise<void> {
    return request<void>(`/api/cat/tasks/${id}`, {
        method: 'DELETE',
    });
}

// ========================
// Notes API
// ========================

export async function getTopicNotes(topicId: string): Promise<Note[]> {
    return request<Note[]>(`/api/cat/topics/${topicId}/notes`);
}

export async function searchNotes(params: {
    q?: string;
    tags?: string;
}): Promise<Note[]> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.tags) searchParams.set('tags', params.tags);
    return request<Note[]>(`/api/cat/notes/search?${searchParams.toString()}`);
}

export async function createNote(payload: CreateNotePayload): Promise<Note> {
    return request<Note>('/api/cat/notes', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function updateNote(
    id: string,
    payload: Partial<CreateNotePayload>
): Promise<Note> {
    return request<Note>(`/api/cat/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export async function deleteNote(id: string): Promise<void> {
    return request<void>(`/api/cat/notes/${id}`, {
        method: 'DELETE',
    });
}

export async function generateFlashcardsFromNote(noteId: string): Promise<Flashcard[]> {
    return request<Flashcard[]>(`/api/cat/notes/${noteId}/generate-flashcards`, {
        method: 'POST',
    });
}

// ========================
// Flashcards API
// ========================

export async function getTopicFlashcards(topicId: string): Promise<Flashcard[]> {
    return request<Flashcard[]>(`/api/cat/topics/${topicId}/flashcards`);
}

export async function getDueFlashcards(limit: number = 20): Promise<Flashcard[]> {
    return request<Flashcard[]>(`/api/cat/flashcards/due?limit=${limit}`);
}

export async function createFlashcard(payload: CreateFlashcardPayload): Promise<Flashcard> {
    return request<Flashcard>('/api/cat/flashcards', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function reviewFlashcard(
    id: string,
    correct: boolean
): Promise<Flashcard> {
    return request<Flashcard>(`/api/cat/flashcards/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ correct }),
    });
}

// ========================
// Mock Tests API
// ========================

export async function startMock(payload: StartMockPayload): Promise<Mock> {
    return request<Mock>('/api/cat/mocks/start', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function getMocks(params?: {
    page?: number;
    limit?: number;
}): Promise<PaginatedResponse<Mock>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return request<PaginatedResponse<Mock>>(`/api/cat/mocks${query ? `?${query}` : ''}`);
}

export async function getMock(id: string): Promise<Mock> {
    return request<Mock>(`/api/cat/mocks/${id}`);
}

export async function submitMockAnswer(
    mockId: string,
    payload: SubmitAnswerPayload
): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/cat/mocks/${mockId}/submit`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function completeMock(id: string): Promise<Mock> {
    return request<Mock>(`/api/cat/mocks/${id}/complete`, {
        method: 'POST',
    });
}

export async function abandonMock(id: string): Promise<void> {
    return request<void>(`/api/cat/mocks/${id}/abandon`, {
        method: 'POST',
    });
}

export async function getWeakAreas(): Promise<
    { topic_id: string; topic_title: string; accuracy: number }[]
> {
    return request('/api/cat/mocks/weak-areas');
}

export async function getImprovingTopics(): Promise<
    { topic_id: string; topic_title: string; improvement: number }[]
> {
    return request('/api/cat/mocks/improving');
}

export async function getMockPerformance(): Promise<{
    total: number;
    average_score: number;
    trend: { date: string; score: number; percentile?: number }[];
}> {
    return request('/api/cat/mocks/performance');
}

// ========================
// Revisions API
// ========================

export async function getRevisions(): Promise<Revision[]> {
    return request<Revision[]>('/api/cat/revisions');
}

export async function getUpcomingRevisions(days: number = 7): Promise<Revision[]> {
    return request<Revision[]>(`/api/cat/revisions/upcoming?days=${days}`);
}

export async function getRevisionCalendar(year: number, month: number): Promise<{
    [date: string]: Revision[];
}> {
    return request(`/api/cat/revisions/calendar?year=${year}&month=${month}`);
}

export async function completeRevision(
    id: string,
    payload: { notes?: string; create_task?: boolean }
): Promise<Revision> {
    return request<Revision>(`/api/cat/revisions/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

// ========================
// Dashboard & Settings API
// ========================

export async function getDashboard(): Promise<DashboardData> {
    return request<DashboardData>('/api/cat/dashboard');
}

export async function getSettings(): Promise<CatSettings> {
    return request<CatSettings>('/api/cat/settings');
}

export async function updateSettings(payload: Partial<CatSettings>): Promise<CatSettings> {
    return request<CatSettings>('/api/cat/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export async function getCatSettings(): Promise<CatSettings> {
    return request<CatSettings>('/api/cat/cat-settings');
}

export async function updateCatSettings(payload: Partial<CatSettings>): Promise<CatSettings> {
    return request<CatSettings>('/api/cat/cat-settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export async function getCatSlots(): Promise<CatSlot[]> {
    return request<CatSlot[]>('/api/cat/cat-settings/slots');
}

export async function getStrategy(): Promise<{
    sections: { name: string; recommended_time: number; tips: string[] }[];
}> {
    return request('/api/cat/cat-settings/strategy');
}

// ========================
// AI Features API
// ========================

export async function getAIStudyPlan(): Promise<AIStudyPlan> {
    return request<AIStudyPlan>('/api/cat/ai/study-plan');
}

export async function getAIAnalysis(): Promise<AIAnalysis> {
    return request<AIAnalysis>('/api/cat/ai/analysis');
}

export async function getAITopicTips(topicId: string): Promise<AITopicTips> {
    return request<AITopicTips>(`/api/cat/ai/topic-tips/${topicId}`);
}

export async function askDoubt(payload: AskDoubtPayload): Promise<AskDoubtResponse> {
    return request<AskDoubtResponse>('/api/cat/tutor/doubt', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function explainWrongAnswer(payload: ExplainWrongPayload): Promise<ExplainWrongResponse> {
    return request<ExplainWrongResponse>('/api/cat/tutor/explain-wrong', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

// ========================
// Practice Sessions API
// ========================

export async function startPractice(payload: StartPracticePayload): Promise<PracticeSession> {
    return request<PracticeSession>('/api/cat/practice/start', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function submitPracticeAnswer(payload: {
    session_id: string;
    question_id: string;
    answer: string;
    time_spent: number;
}): Promise<{ correct: boolean; explanation?: string }> {
    return request('/api/cat/practice/submit', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function completePractice(id: string): Promise<PracticeSession> {
    return request<PracticeSession>(`/api/cat/practice/${id}/complete`, {
        method: 'POST',
    });
}

export async function getPracticeHistory(params?: {
    page?: number;
    limit?: number;
}): Promise<PaginatedResponse<PracticeSession>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return request<PaginatedResponse<PracticeSession>>(
        `/api/cat/practice/history${query ? `?${query}` : ''}`
    );
}

// ========================
// Mistakes API
// ========================

export async function getMistakes(params?: {
    reviewed?: boolean;
    type?: MistakeType;
}): Promise<Mistake[]> {
    const searchParams = new URLSearchParams();
    if (params?.reviewed !== undefined) searchParams.set('reviewed', String(params.reviewed));
    if (params?.type) searchParams.set('type', params.type);
    const query = searchParams.toString();
    return request<Mistake[]>(`/api/cat/mistakes${query ? `?${query}` : ''}`);
}

export async function getMistakeStats(): Promise<{
    total: number;
    by_type: { type: MistakeType; count: number }[];
    unreviewed: number;
}> {
    return request('/api/cat/mistakes/stats');
}

export async function reviewMistake(
    id: string,
    notes: string
): Promise<Mistake> {
    return request<Mistake>(`/api/cat/mistakes/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
    });
}

export async function categorizeMistake(id: string): Promise<{
    type: MistakeType;
    confidence: number;
}> {
    return request(`/api/cat/mistakes/${id}/categorize`, {
        method: 'POST',
    });
}

// ========================
// Bookmarks API
// ========================

export async function getBookmarks(collection?: string): Promise<Bookmark[]> {
    const query = collection ? `?collection=${encodeURIComponent(collection)}` : '';
    return request<Bookmark[]>(`/api/cat/bookmarks${query}`);
}

export async function getBookmarkCollections(): Promise<BookmarkCollection[]> {
    return request<BookmarkCollection[]>('/api/cat/bookmarks/collections');
}

export async function createBookmarkCollection(payload: {
    name: string;
    color: string;
    icon: string;
}): Promise<BookmarkCollection> {
    return request<BookmarkCollection>('/api/cat/bookmarks/collections', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function addBookmark(
    questionId: string,
    payload: CreateBookmarkPayload
): Promise<Bookmark> {
    return request<Bookmark>(`/api/cat/bookmarks/${questionId}`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function removeBookmark(questionId: string): Promise<void> {
    return request<void>(`/api/cat/bookmarks/${questionId}`, {
        method: 'DELETE',
    });
}

// ========================
// Daily Goals API
// ========================

export async function getTodayGoals(): Promise<DailyGoal> {
    return request<DailyGoal>('/api/cat/goals/today');
}

export async function getGoalsHistory(days: number = 7): Promise<DailyGoal[]> {
    return request<DailyGoal[]>(`/api/cat/goals/history?days=${days}`);
}

// ========================
// External Mocks API
// ========================

export async function createExternalMock(
    payload: CreateExternalMockPayload
): Promise<ExternalMock> {
    return request<ExternalMock>('/api/cat/external-mocks', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function getExternalMocks(params?: {
    platform?: string;
    limit?: number;
}): Promise<ExternalMock[]> {
    const searchParams = new URLSearchParams();
    if (params?.platform) searchParams.set('platform', params.platform);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return request<ExternalMock[]>(`/api/cat/external-mocks${query ? `?${query}` : ''}`);
}

export async function getExternalMocksAnalytics(): Promise<{
    total_mocks: number;
    average_percentile: number;
    trend: { date: string; percentile: number }[];
    by_platform: { platform: string; count: number; avg_percentile: number }[];
}> {
    return request('/api/cat/external-mocks/analytics');
}

export async function getExternalMock(id: string): Promise<ExternalMock> {
    return request<ExternalMock>(`/api/cat/external-mocks/${id}`);
}

export async function updateExternalMock(
    id: string,
    payload: Partial<CreateExternalMockPayload>
): Promise<ExternalMock> {
    return request<ExternalMock>(`/api/cat/external-mocks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export async function deleteExternalMock(id: string): Promise<void> {
    return request<void>(`/api/cat/external-mocks/${id}`, {
        method: 'DELETE',
    });
}

// ========================
// Resources API
// ========================

export async function searchResources(params: {
    q?: string;
    type?: string;
    difficulty?: string;
    free?: boolean;
}): Promise<Resource[]> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.type) searchParams.set('type', params.type);
    if (params.difficulty) searchParams.set('difficulty', params.difficulty);
    if (params.free !== undefined) searchParams.set('free', String(params.free));
    return request<Resource[]>(`/api/cat/resources/search?${searchParams.toString()}`);
}

export async function getRecommendedResources(): Promise<Resource[]> {
    return request<Resource[]>('/api/cat/resources/recommended');
}

export async function getTopicResources(topicId: string): Promise<Resource[]> {
    return request<Resource[]>(`/api/cat/resources/topic/${topicId}`);
}

export async function getSubjectResources(subjectId: string): Promise<Resource[]> {
    return request<Resource[]>(`/api/cat/resources/subject/${subjectId}`);
}

export async function createResource(payload: CreateResourcePayload): Promise<Resource> {
    return request<Resource>('/api/cat/resources', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function rateResource(id: string, rating: number): Promise<Resource> {
    return request<Resource>(`/api/cat/resources/${id}/rate`, {
        method: 'PATCH',
        body: JSON.stringify({ rating }),
    });
}

export async function deleteResource(id: string): Promise<void> {
    return request<void>(`/api/cat/resources/${id}`, {
        method: 'DELETE',
    });
}

// ========================
// Export API
// ========================

export async function exportData(format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const url = `${API_BASE}/api/cat/export?format=${format}`;
    const response = await fetch(url, {
        credentials: 'include',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new CatApiError('Export failed', null, response.status);
    }

    return response.blob();
}

// ========================
// Learn Section
// ========================

export async function getTopicLessons(topicName: string): Promise<Lesson[]> {
    return request<Lesson[]>(`/api/cat/${encodeURIComponent(topicName)}/lessons`);
}

export async function getTopicProblems(
    topicName: string,
    difficulty?: ProblemDifficulty,
    limit?: number
): Promise<Problem[]> {
    const params = new URLSearchParams();
    if (difficulty) params.append('difficulty', difficulty);
    if (limit) params.append('limit', limit.toString());
    return request<Problem[]>(`/api/cat/${encodeURIComponent(topicName)}/problems?${params}`);
}

export async function getTopicRealCatQuestions(
    topicName: string,
    year?: number
): Promise<Problem[]> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    return request<Problem[]>(`/api/cat/${encodeURIComponent(topicName)}/real-cat?${params}`);
}

export async function attemptProblem(
    problemId: string,
    payload: ProblemAttemptPayload
): Promise<ProblemAttemptResponse> {
    return request<ProblemAttemptResponse>(`/api/cat/problems/${problemId}/attempt`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function getMasteryOverview(): Promise<MasteryOverview> {
    return request<MasteryOverview>('/api/cat/mastery');
}

export async function startLearnSession(
    payload: StartLearnSessionPayload
): Promise<LearnSession> {
    return request<LearnSession>('/api/cat/sessions/start', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function getLearnSession(sessionId: string): Promise<LearnSession> {
    return request<LearnSession>(`/api/cat/sessions/${sessionId}`);
}

export async function completeLearnSession(sessionId: string): Promise<LearnSession> {
    return request<LearnSession>(`/api/cat/sessions/${sessionId}/complete`, {
        method: 'POST',
    });
}

export async function getLearnSubjects(): Promise<LearnSubjectsOverview> {
    return request<LearnSubjectsOverview>('/api/cat/learn/subjects');
}

export async function getSessionHistory(params?: {
    page?: number;
    limit?: number;
}): Promise<PaginatedResponse<LearnSession>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    return request<PaginatedResponse<LearnSession>>(`/api/cat/sessions/history?${searchParams}`);
}

export async function explainProblem(
    payload: ExplainProblemPayload
): Promise<ExplainProblemResponse> {
    return request<ExplainProblemResponse>('/api/cat/tutor/explain', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

// ========================
// AI Adaptive Exam API
// ========================

export async function checkAbility(): Promise<AbilityCheckResponse> {
    return request<AbilityCheckResponse>('/api/cat/adaptive/ability');
}

export async function startDiagnostic(
    config: DiagnosticConfig = {}
): Promise<DiagnosticExamResponse> {
    return request<DiagnosticExamResponse>('/api/cat/adaptive/diagnostic', {
        method: 'POST',
        body: JSON.stringify({
            subjects: config.subjects || ['quant', 'varc', 'dilr'],
            questions_per_subject: config.questions_per_subject || 10,
        }),
    });
}

export async function startAdaptiveExam(
    config: StartAdaptiveExamPayload
): Promise<StartAdaptiveExamResponse> {
    return request<StartAdaptiveExamResponse>('/api/cat/adaptive/start', {
        method: 'POST',
        body: JSON.stringify(config),
    });
}

export async function submitAdaptiveAnswer(
    examId: string,
    payload: SubmitAdaptiveAnswerPayload
): Promise<SubmitAdaptiveAnswerResponse> {
    return request<SubmitAdaptiveAnswerResponse>(`/api/cat/adaptive/${examId}/submit`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function completeAdaptiveExam(
    examId: string
): Promise<AdaptiveExamResult> {
    return request<AdaptiveExamResult>(`/api/cat/adaptive/${examId}/complete`, {
        method: 'POST',
    });
}

export async function generateAIQuestion(
    payload: GenerateQuestionPayload
): Promise<GeneratedQuestion> {
    return request<GeneratedQuestion>('/api/cat/adaptive/ai/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function getScorePrediction(): Promise<ScorePrediction> {
    return request<ScorePrediction>('/api/cat/adaptive/predict');
}

export async function getAdaptiveStudyPlan(
    targetPercentile: number = 95,
    weeks: number = 12
): Promise<StudyPlan> {
    return request<StudyPlan>(`/api/cat/adaptive/study-plan?target=${targetPercentile}&weeks=${weeks}`);
}

// ========================
// Sectional Mock & Features API
// ========================

export async function startSectionalMock(
    payload: SectionalMockStartPayload
): Promise<SectionalMockStartResponse> {
    return request<SectionalMockStartResponse>('/api/cat/mock/sectional/start', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function getSectionTime(
    mockId: string,
    section: string
): Promise<SectionTimeResponse> {
    return request<SectionTimeResponse>(`/api/cat/mock/sectional/${mockId}/time?section=${section}`);
}

export async function submitSectionalAnswer(
    mockId: string,
    payload: SectionalSubmitAnswerPayload
): Promise<SectionalSubmitAnswerResponse> {
    return request<SectionalSubmitAnswerResponse>(`/api/cat/mock/sectional/${mockId}/submit`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function nextSection(
    mockId: string
): Promise<NextSectionResponse> {
    return request<NextSectionResponse>(`/api/cat/mock/sectional/${mockId}/next-section`, {
        method: 'POST',
    });
}

export async function completeSectionalMock(
    mockId: string
): Promise<CompleteSectionalMockResponse> {
    return request<CompleteSectionalMockResponse>(`/api/cat/mock/sectional/${mockId}/complete`, {
        method: 'POST',
    });
}

export async function simulateCalculator(payload: {
    input: CalculatorInput;
    state?: CalculatorState;
}): Promise<CalculatorResponse> {
    return request<CalculatorResponse>('/api/cat/mock/sectional/calculator/simulate', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function getBenchmarks(): Promise<BenchmarksResponse> {
    return request<BenchmarksResponse>('/api/cat/mock/sectional/benchmarks');
}

export async function getAttemptAnalytics(
    mockId: string
): Promise<SectionalMockAnalytics> {
    return request<SectionalMockAnalytics>(`/api/cat/mock/sectional/analytics/${mockId}`);
}

export async function getMockSummary(
    mockId: string
): Promise<MockSummary> {
    return request<MockSummary>(`/api/cat/mock/sectional/${mockId}/summary`);
}

// ========================
// Export as namespace
// ========================

export const catApi = {
    // Subjects & Topics
    getSubjects,
    getTopic,
    createTopic,
    updateTopic,
    updateTopicStatus,
    deleteTopic,
    // Tasks
    getTasks,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    // Notes
    getTopicNotes,
    searchNotes,
    createNote,
    updateNote,
    deleteNote,
    generateFlashcardsFromNote,
    // Flashcards
    getTopicFlashcards,
    getDueFlashcards,
    createFlashcard,
    reviewFlashcard,
    // Mocks
    startMock,
    getMocks,
    getMock,
    submitMockAnswer,
    completeMock,
    abandonMock,
    getWeakAreas,
    getImprovingTopics,
    getMockPerformance,
    // Revisions
    getRevisions,
    getUpcomingRevisions,
    getRevisionCalendar,
    completeRevision,
    // Dashboard & Settings
    getDashboard,
    getSettings,
    updateSettings,
    getCatSettings,
    updateCatSettings,
    getCatSlots,
    getStrategy,
    // AI
    getAIStudyPlan,
    getAIAnalysis,
    getAITopicTips,
    askDoubt,
    explainWrongAnswer,
    // Practice
    startPractice,
    submitPracticeAnswer,
    completePractice,
    getPracticeHistory,
    // Mistakes
    getMistakes,
    getMistakeStats,
    reviewMistake,
    categorizeMistake,
    // Bookmarks
    getBookmarks,
    getBookmarkCollections,
    createBookmarkCollection,
    addBookmark,
    removeBookmark,
    // Goals
    getTodayGoals,
    getGoalsHistory,
    // External Mocks
    createExternalMock,
    getExternalMocks,
    getExternalMocksAnalytics,
    getExternalMock,
    updateExternalMock,
    deleteExternalMock,
    // Resources
    searchResources,
    getRecommendedResources,
    getTopicResources,
    getSubjectResources,
    createResource,
    rateResource,
    deleteResource,
    // Export
    exportData,
    // Learn
    getTopicLessons,
    getTopicProblems,
    getTopicRealCatQuestions,
    attemptProblem,
    getMasteryOverview,
    startLearnSession,
    getLearnSession,
    completeLearnSession,
    getLearnSubjects,
    getSessionHistory,
    explainProblem,
    // Adaptive Exam
    checkAbility,
    startDiagnostic,
    startAdaptiveExam,
    submitAdaptiveAnswer,
    completeAdaptiveExam,
    generateAIQuestion,
    getScorePrediction,
    getAdaptiveStudyPlan,
    // Sectional Mock & Features
    startSectionalMock,
    getSectionTime,
    submitSectionalAnswer,
    nextSection,
    completeSectionalMock,
    simulateCalculator,
    getBenchmarks,
    getAttemptAnalytics,
    getMockSummary,
};

export default catApi;
