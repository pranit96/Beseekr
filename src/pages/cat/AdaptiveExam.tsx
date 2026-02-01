// CAT Adaptive Exam Page - AI-powered difficulty adjustment
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain,
    Target,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Play,
    Trophy,
    TrendingUp,
    TrendingDown,
    Sparkles,
    AlertCircle,
    BarChart3,
    Lightbulb,
    Zap,
    RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { catApi } from '@/api/cat';
import type {
    AbilityCheckResponse,
    AdaptiveQuestion,
    StartAdaptiveExamPayload,
    SubmitAdaptiveAnswerResponse,
    AdaptiveExamResult,
    DifficultyLabel,
    AdaptiveExamType,
} from '@/types/cat';

const difficultyColors: Record<DifficultyLabel, { bg: string; text: string; label: string }> = {
    very_easy: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Very Easy' },
    easy: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Easy' },
    medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Medium' },
    hard: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Hard' },
    very_hard: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Very Hard' },
};

const examTypeLabels: Record<AdaptiveExamType, { label: string; description: string }> = {
    full: { label: 'Full Mock', description: 'Complete adaptive test across all subjects' },
    sectional: { label: 'Sectional', description: 'Focus on one subject at a time' },
    topic_focus: { label: 'Topic Focus', description: 'Deep dive into specific topics' },
    weakness_drill: { label: 'Weakness Drill', description: 'Practice your weak areas' },
};

interface ExamState {
    examId: string | null;
    currentQuestion: AdaptiveQuestion | null;
    progress: { answered: number; total: number; accuracy: string };
    isComplete: boolean;
    results: AdaptiveExamResult | null;
    lastFeedback: SubmitAdaptiveAnswerResponse | null;
}

export default function AdaptiveExam() {
    const queryClient = useQueryClient();
    const [examState, setExamState] = useState<ExamState>({
        examId: null,
        currentQuestion: null,
        progress: { answered: 0, total: 0, accuracy: '0' },
        isComplete: false,
        results: null,
        lastFeedback: null,
    });
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [startTime, setStartTime] = useState<number>(Date.now());
    const [showFeedback, setShowFeedback] = useState(false);
    const [configDialogOpen, setConfigDialogOpen] = useState(false);
    const [examConfig, setExamConfig] = useState<StartAdaptiveExamPayload>({
        exam_type: 'full',
        question_count: 20,
    });

    // Check if user needs diagnostic
    const { data: abilityData, isLoading: abilityLoading } = useQuery({
        queryKey: ['cat', 'adaptive', 'ability'],
        queryFn: () => catApi.checkAbility(),
    });

    // Start diagnostic
    const startDiagnosticMutation = useMutation({
        mutationFn: () => catApi.startDiagnostic({ questions_per_subject: 10 }),
        onSuccess: (data) => {
            setExamState({
                examId: data.exam_id,
                currentQuestion: data.first_question,
                progress: { answered: 0, total: data.total_questions, accuracy: '0' },
                isComplete: false,
                results: null,
                lastFeedback: null,
            });
            setStartTime(Date.now());
            setSelectedAnswer(null);
        },
    });

    // Start adaptive exam
    const startExamMutation = useMutation({
        mutationFn: (config: StartAdaptiveExamPayload) => catApi.startAdaptiveExam(config),
        onSuccess: (data) => {
            setExamState({
                examId: data.exam_id,
                currentQuestion: data.first_question,
                progress: { answered: 0, total: data.total_questions, accuracy: '0' },
                isComplete: false,
                results: null,
                lastFeedback: null,
            });
            setStartTime(Date.now());
            setSelectedAnswer(null);
            setConfigDialogOpen(false);
        },
    });

    // Submit answer
    const submitMutation = useMutation({
        mutationFn: ({ answer, timeSpent }: { answer: string; timeSpent: number }) =>
            catApi.submitAdaptiveAnswer(examState.examId!, {
                problem_id: examState.currentQuestion!.id,
                answer,
                time_spent_seconds: timeSpent,
            }),
        onSuccess: async (result) => {
            setExamState((s) => ({
                ...s,
                lastFeedback: result,
                progress: result.progress,
            }));
            setShowFeedback(true);

            if (result.is_exam_complete) {
                const examResults = await catApi.completeAdaptiveExam(examState.examId!);
                setExamState((s) => ({
                    ...s,
                    isComplete: true,
                    results: examResults,
                }));
                queryClient.invalidateQueries({ queryKey: ['cat', 'adaptive'] });
            }
        },
    });

    const handleSubmitAnswer = () => {
        if (!selectedAnswer || !examState.currentQuestion) return;
        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        submitMutation.mutate({ answer: selectedAnswer, timeSpent });
    };

    const handleNextQuestion = () => {
        if (examState.lastFeedback?.next_question) {
            setExamState((s) => ({
                ...s,
                currentQuestion: s.lastFeedback!.next_question,
                lastFeedback: null,
            }));
            setSelectedAnswer(null);
            setStartTime(Date.now());
            setShowFeedback(false);
        }
    };

    const handleStartExam = () => {
        startExamMutation.mutate(examConfig);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

    // Show results screen
    if (examState.isComplete && examState.results) {
        return <ExamResults results={examState.results} onRetake={() => setExamState({
            examId: null,
            currentQuestion: null,
            progress: { answered: 0, total: 0, accuracy: '0' },
            isComplete: false,
            results: null,
            lastFeedback: null,
        })} />;
    }

    // Show active exam
    if (examState.examId && examState.currentQuestion) {
        return (
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6 p-6 max-w-4xl mx-auto"
            >
                {/* Progress Header */}
                <motion.div variants={itemVariants} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className={`${difficultyColors[examState.currentQuestion.difficulty_label].bg} ${difficultyColors[examState.currentQuestion.difficulty_label].text}`}>
                            {difficultyColors[examState.currentQuestion.difficulty_label].label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                            {examState.currentQuestion.topic_name}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">
                            {examState.progress.answered}/{examState.progress.total}
                        </span>
                        <span className="text-sm text-muted-foreground">
                            {examState.progress.accuracy}% accuracy
                        </span>
                    </div>
                </motion.div>

                <Progress value={(examState.progress.answered / examState.progress.total) * 100} className="h-2" />

                {/* Question Card */}
                <AnimatePresence mode="wait">
                    {!showFeedback ? (
                        <motion.div
                            key="question"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <Card className="bg-card/50 border-border/50">
                                <CardContent className="pt-6">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="w-4 h-4" />
                                            Expected: {examState.currentQuestion.expected_time_seconds}s
                                        </div>

                                        <p className="text-lg">{examState.currentQuestion.question_text}</p>

                                        {examState.currentQuestion.question_type === 'mcq' && examState.currentQuestion.options && (
                                            <div className="space-y-3">
                                                {Object.entries(examState.currentQuestion.options).map(([key, value]) => (
                                                    <motion.button
                                                        key={key}
                                                        whileHover={{ scale: 1.01 }}
                                                        whileTap={{ scale: 0.99 }}
                                                        onClick={() => setSelectedAnswer(key)}
                                                        className={`w-full p-4 rounded-lg border text-left transition-all flex items-center gap-4 ${selectedAnswer === key
                                                                ? 'bg-violet-500/20 border-violet-500/50'
                                                                : 'bg-muted/10 border-border/50 hover:border-violet-500/30'
                                                            }`}
                                                    >
                                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${selectedAnswer === key
                                                                ? 'bg-violet-500 text-white'
                                                                : 'bg-muted/30'
                                                            }`}>
                                                            {key}
                                                        </span>
                                                        <span>{value}</span>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        )}

                                        {examState.currentQuestion.question_type === 'tita' && (
                                            <Input
                                                type="text"
                                                placeholder="Enter your answer"
                                                value={selectedAnswer || ''}
                                                onChange={(e) => setSelectedAnswer(e.target.value)}
                                                className="text-lg"
                                            />
                                        )}

                                        <Button
                                            onClick={handleSubmitAnswer}
                                            disabled={!selectedAnswer || submitMutation.isPending}
                                            className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                                        >
                                            {submitMutation.isPending ? 'Submitting...' : 'Submit Answer'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : examState.lastFeedback && (
                        <motion.div
                            key="feedback"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <Card className={`border-2 ${examState.lastFeedback.is_correct ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="flex items-center gap-3">
                                        {examState.lastFeedback.is_correct ? (
                                            <CheckCircle2 className="w-8 h-8 text-green-400" />
                                        ) : (
                                            <XCircle className="w-8 h-8 text-red-400" />
                                        )}
                                        <div>
                                            <p className="font-semibold text-lg">
                                                {examState.lastFeedback.is_correct ? 'Correct!' : 'Incorrect'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Correct Answer: <strong>{examState.lastFeedback.correct_answer}</strong>
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-sm">{examState.lastFeedback.solution_text}</p>

                                    <div className="flex items-center gap-4 pt-2">
                                        <Badge variant="outline" className={`${difficultyColors[examState.lastFeedback.difficulty_label].bg} ${difficultyColors[examState.lastFeedback.difficulty_label].text}`}>
                                            Next: {difficultyColors[examState.lastFeedback.difficulty_label].label}
                                        </Badge>
                                        <span className="flex items-center gap-1 text-sm">
                                            {examState.lastFeedback.difficulty_change.startsWith('-') ? (
                                                <TrendingDown className="w-4 h-4 text-red-400" />
                                            ) : (
                                                <TrendingUp className="w-4 h-4 text-green-400" />
                                            )}
                                            {examState.lastFeedback.difficulty_change}
                                        </span>
                                    </div>

                                    {examState.lastFeedback.is_exam_complete ? (
                                        <Button
                                            onClick={() => { }}
                                            className="w-full bg-gradient-to-r from-violet-500 to-purple-600"
                                        >
                                            <Trophy className="w-4 h-4 mr-2" />
                                            View Results
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleNextQuestion}
                                            className="w-full bg-gradient-to-r from-violet-500 to-purple-600"
                                        >
                                            Next Question
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    }

    // Show start screen
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 p-6"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
                        Adaptive Exam
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        AI-powered difficulty adjustment based on your performance
                    </p>
                </div>
            </motion.div>

            {/* Ability Status */}
            {abilityLoading ? (
                <Card className="bg-card/50 border-border/50">
                    <CardContent className="py-8 text-center">
                        <RefreshCw className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">Checking your ability scores...</p>
                    </CardContent>
                </Card>
            ) : abilityData?.needs_diagnostic ? (
                <motion.div variants={itemVariants}>
                    <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                    <AlertCircle className="w-6 h-6 text-amber-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">Diagnostic Test Required</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Take a quick diagnostic test to calibrate the adaptive system to your skill level.
                                        This helps us provide questions at the right difficulty.
                                    </p>
                                    <Button
                                        onClick={() => startDiagnosticMutation.mutate()}
                                        disabled={startDiagnosticMutation.isPending}
                                        className="mt-4 bg-gradient-to-r from-amber-500 to-orange-600"
                                    >
                                        {startDiagnosticMutation.isPending ? 'Starting...' : 'Start Diagnostic'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <>
                    {/* Ability Scores */}
                    {abilityData?.ability_scores && (
                        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {abilityData.ability_scores.map((score) => (
                                <Card key={score.subject} className="bg-card/50 border-border/50">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium capitalize">{score.subject}</span>
                                            <Badge variant="outline">
                                                {score.confidence}% confidence
                                            </Badge>
                                        </div>
                                        <p className="text-3xl font-bold">{score.ability_score.toFixed(1)}</p>
                                        <Progress value={(score.ability_score / 5) * 100} className="h-2 mt-2" />
                                    </CardContent>
                                </Card>
                            ))}
                        </motion.div>
                    )}

                    {/* Exam Types */}
                    <motion.div variants={itemVariants}>
                        <h2 className="text-xl font-semibold mb-4">Start an Adaptive Exam</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(Object.entries(examTypeLabels) as [AdaptiveExamType, typeof examTypeLabels[AdaptiveExamType]][]).map(([type, info]) => (
                                <Card
                                    key={type}
                                    className="bg-card/50 border-border/50 hover:border-violet-500/30 transition-colors cursor-pointer"
                                    onClick={() => {
                                        setExamConfig((c) => ({ ...c, exam_type: type }));
                                        setConfigDialogOpen(true);
                                    }}
                                >
                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                                                {type === 'full' && <Target className="w-5 h-5 text-violet-400" />}
                                                {type === 'sectional' && <BarChart3 className="w-5 h-5 text-violet-400" />}
                                                {type === 'topic_focus' && <Lightbulb className="w-5 h-5 text-violet-400" />}
                                                {type === 'weakness_drill' && <Zap className="w-5 h-5 text-violet-400" />}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{info.label}</h3>
                                                <p className="text-sm text-muted-foreground">{info.description}</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}

            {/* Config Dialog */}
            <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configure Adaptive Exam</DialogTitle>
                        <DialogDescription>
                            Customize your {examTypeLabels[examConfig.exam_type].label} exam
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {examConfig.exam_type === 'sectional' && (
                            <div>
                                <label className="text-sm font-medium mb-2 block">Subject</label>
                                <Select
                                    value={examConfig.subject || 'quant'}
                                    onValueChange={(v) => setExamConfig((c) => ({ ...c, subject: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="quant">Quantitative Aptitude</SelectItem>
                                        <SelectItem value="varc">Verbal Ability</SelectItem>
                                        <SelectItem value="dilr">Data Interpretation & LR</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Number of Questions</label>
                            <Select
                                value={String(examConfig.question_count || 20)}
                                onValueChange={(v) => setExamConfig((c) => ({ ...c, question_count: parseInt(v) }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 questions</SelectItem>
                                    <SelectItem value="20">20 questions</SelectItem>
                                    <SelectItem value="30">30 questions</SelectItem>
                                    <SelectItem value="50">50 questions</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Time Limit (optional)</label>
                            <Select
                                value={String(examConfig.time_limit_minutes || 0)}
                                onValueChange={(v) => setExamConfig((c) => ({ ...c, time_limit_minutes: parseInt(v) || undefined }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="No time limit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">No time limit</SelectItem>
                                    <SelectItem value="15">15 minutes</SelectItem>
                                    <SelectItem value="30">30 minutes</SelectItem>
                                    <SelectItem value="45">45 minutes</SelectItem>
                                    <SelectItem value="60">60 minutes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleStartExam}
                            disabled={startExamMutation.isPending}
                            className="bg-gradient-to-r from-violet-500 to-purple-600"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            {startExamMutation.isPending ? 'Starting...' : 'Start Exam'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}

// Results Component
function ExamResults({ results, onRetake }: { results: AdaptiveExamResult; onRetake: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 p-6 max-w-4xl mx-auto"
        >
            {/* Score Card */}
            <Card className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 border-violet-500/30">
                <CardContent className="pt-8 pb-8 text-center">
                    <Trophy className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
                    <p className="text-5xl font-bold">{results.summary.accuracy}%</p>
                    <p className="text-muted-foreground mt-2">
                        {results.summary.correct}/{results.summary.total} correct
                    </p>
                </CardContent>
            </Card>

            {/* Predicted Score */}
            <Card className="bg-card/50 border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Predicted CAT Score
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold text-violet-400">
                        {results.predicted_cat_score.percentile_range}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Confidence: {(results.predicted_cat_score.confidence * 100).toFixed(0)}%
                    </p>
                </CardContent>
            </Card>

            {/* Topic Performance */}
            <Card className="bg-card/50 border-border/50">
                <CardHeader>
                    <CardTitle>Topic Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {results.topic_performance.map((topic) => (
                            <div key={topic.topic_name} className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
                                <span className="font-medium">{topic.topic_name}</span>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-muted-foreground">
                                        {topic.correct}/{topic.total}
                                    </span>
                                    <Badge variant="outline" className={topic.accuracy >= 70 ? 'bg-green-500/20 text-green-400' : topic.accuracy >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}>
                                        {topic.accuracy.toFixed(0)}%
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-violet-400" />
                        AI Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>{results.ai_insights}</p>
                    {results.ai_deep_insights && (
                        <div className="space-y-2">
                            {results.ai_deep_insights.insights.map((insight, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm">
                                    <Brain className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                                    <span>{insight}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="bg-card/50 border-border/50">
                <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {results.recommendations.map((rec, idx) => (
                            <div key={idx} className={`p-3 rounded-lg border ${rec.type === 'practice' ? 'bg-blue-500/10 border-blue-500/30' :
                                    rec.type === 'review' ? 'bg-yellow-500/10 border-yellow-500/30' :
                                        'bg-green-500/10 border-green-500/30'
                                }`}>
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{rec.topic}</span>
                                    <Badge variant="outline" className="capitalize">{rec.type}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{rec.action}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Button onClick={onRetake} className="w-full" variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Take Another Exam
            </Button>
        </motion.div>
    );
}
