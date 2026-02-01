// CAT Learn Page - Topic-based learning with lessons, problems, and real CAT questions
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
    GraduationCap,
    Target,
    CheckCircle2,
    Clock,
    TrendingUp,
    ChevronRight,
    Play,
    AlertCircle,
    Lightbulb,
    Star,
    Timer,
    BarChart3,
    Trophy,
    Brain,
    Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { catApi } from '@/api/cat';
import type {
    Lesson,
    Problem,
    MasteryOverview,
    TopicMastery,
    ProblemDifficulty,
    MasteryLevel,
    StartLearnSessionPayload
} from '@/types/cat';

const difficultyColors: Record<ProblemDifficulty, string> = {
    easy: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    hard: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    cat_level: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const masteryLevelColors: Record<MasteryLevel, { bg: string; text: string; label: string }> = {
    beginner: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Beginner' },
    learning: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Learning' },
    practicing: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Practicing' },
    proficient: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Proficient' },
    mastered: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Mastered' },
};

export default function Learn() {
    const queryClient = useQueryClient();
    const [selectedTopic, setSelectedTopic] = useState<TopicMastery | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'practice' | 'real-cat'>('overview');
    const [difficultyFilter, setDifficultyFilter] = useState<ProblemDifficulty | 'all'>('all');
    const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
    const [sessionType, setSessionType] = useState<'practice' | 'real_cat' | 'mixed'>('practice');
    const [problemCount, setProblemCount] = useState<number>(10);

    // Fetch mastery overview
    const { data: masteryData, isLoading: masteryLoading } = useQuery({
        queryKey: ['cat', 'mastery'],
        queryFn: () => catApi.getMasteryOverview(),
    });

    // Fetch lessons for selected topic
    const { data: lessons, isLoading: lessonsLoading } = useQuery({
        queryKey: ['cat', 'lessons', selectedTopic?.topic_name],
        queryFn: () => catApi.getTopicLessons(selectedTopic!.topic_name),
        enabled: !!selectedTopic,
    });

    // Fetch problems for selected topic
    const { data: problems, isLoading: problemsLoading } = useQuery({
        queryKey: ['cat', 'problems', selectedTopic?.topic_name, difficultyFilter],
        queryFn: () => catApi.getTopicProblems(
            selectedTopic!.topic_name,
            difficultyFilter === 'all' ? undefined : difficultyFilter
        ),
        enabled: !!selectedTopic,
    });

    // Fetch real CAT questions for selected topic
    const { data: realCatQuestions, isLoading: realCatLoading } = useQuery({
        queryKey: ['cat', 'real-cat', selectedTopic?.topic_name],
        queryFn: () => catApi.getTopicRealCatQuestions(selectedTopic!.topic_name),
        enabled: !!selectedTopic,
    });

    // Start learn session mutation
    const startSession = useMutation({
        mutationFn: (payload: StartLearnSessionPayload) => catApi.startLearnSession(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cat', 'mastery'] });
            setSessionDialogOpen(false);
        },
    });

    const handleStartSession = () => {
        if (!selectedTopic) return;
        startSession.mutate({
            topic_id: selectedTopic.topic_id,
            session_type: sessionType,
            problem_count: problemCount,
        });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

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
                        Learn
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Master topics through lessons, practice problems, and real CAT questions
                    </p>
                </div>
                {masteryData && (
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Overall Mastery</p>
                            <p className="text-2xl font-bold text-violet-400">
                                {masteryData.overall_mastery}%
                            </p>
                        </div>
                        <div className="w-24 h-24 relative">
                            <svg className="w-24 h-24 transform -rotate-90">
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    className="text-muted/20"
                                />
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="url(#gradient)"
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray={`${(masteryData.overall_mastery / 100) * 251.2} 251.2`}
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#8b5cf6" />
                                        <stop offset="100%" stopColor="#a855f7" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Trophy className="w-8 h-8 text-violet-400" />
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Subject Progress Cards */}
            {masteryData && (
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {masteryData.by_subject.map((subject) => (
                        <Card key={subject.subject_code} className="bg-card/50 border-border/50 hover:border-violet-500/30 transition-colors">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {subject.subject_code === 'quant' && <Target className="w-5 h-5 text-blue-400" />}
                                        {subject.subject_code === 'varc' && <BookOpen className="w-5 h-5 text-green-400" />}
                                        {subject.subject_code === 'dilr' && <Brain className="w-5 h-5 text-purple-400" />}
                                        <span className="font-semibold">{subject.subject_name}</span>
                                    </div>
                                    <span className="text-lg font-bold">{subject.mastery_score}%</span>
                                </div>
                                <Progress
                                    value={subject.mastery_score}
                                    className="h-2"
                                />
                                <p className="text-sm text-muted-foreground mt-2">
                                    {subject.topics_mastered} / {subject.total_topics} topics mastered
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Topics List */}
                <motion.div variants={itemVariants} className="lg:col-span-1">
                    <Card className="bg-card/50 border-border/50 h-[600px] flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <GraduationCap className="w-5 h-5" />
                                Topics
                            </CardTitle>
                            <CardDescription>Select a topic to learn</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-0">
                            <ScrollArea className="h-full px-6 pb-6">
                                {masteryLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="h-16 bg-muted/20 rounded-lg animate-pulse" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {masteryData?.topics.map((topic) => {
                                            const isSelected = selectedTopic?.topic_id === topic.topic_id;
                                            const levelInfo = masteryLevelColors[topic.mastery_level];
                                            return (
                                                <motion.button
                                                    key={topic.topic_id}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setSelectedTopic(topic)}
                                                    className={`w-full p-3 rounded-lg border text-left transition-all ${isSelected
                                                            ? 'bg-violet-500/20 border-violet-500/50'
                                                            : 'bg-muted/10 border-border/50 hover:border-violet-500/30'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-medium text-sm">{topic.topic_name}</span>
                                                        <Badge variant="outline" className={`${levelInfo.bg} ${levelInfo.text} text-xs`}>
                                                            {levelInfo.label}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={topic.mastery_score} className="h-1 flex-1" />
                                                        <span className="text-xs text-muted-foreground">
                                                            {topic.mastery_score}%
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            {topic.lessons_completed}/{topic.total_lessons} lessons
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Target className="w-3 h-3" />
                                                            {topic.problems_correct}/{topic.problems_attempted} correct
                                                        </span>
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Topic Content */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <Card className="bg-card/50 border-border/50 h-[600px] flex flex-col">
                        {selectedTopic ? (
                            <>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {selectedTopic.topic_name}
                                                <Badge variant="outline" className={`${masteryLevelColors[selectedTopic.mastery_level].bg} ${masteryLevelColors[selectedTopic.mastery_level].text}`}>
                                                    {masteryLevelColors[selectedTopic.mastery_level].label}
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription className="mt-1 flex items-center gap-4">
                                                <span className="flex items-center gap-1">
                                                    <TrendingUp className="w-4 h-4" />
                                                    {selectedTopic.accuracy_percent}% accuracy
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-4 h-4" />
                                                    {selectedTopic.streak} day streak
                                                </span>
                                            </CardDescription>
                                        </div>
                                        <Button
                                            onClick={() => setSessionDialogOpen(true)}
                                            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                                        >
                                            <Play className="w-4 h-4 mr-2" />
                                            Start Session
                                        </Button>
                                    </div>
                                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mt-4">
                                        <TabsList className="bg-muted/20">
                                            <TabsTrigger value="overview">Overview</TabsTrigger>
                                            <TabsTrigger value="lessons">Lessons</TabsTrigger>
                                            <TabsTrigger value="practice">Practice</TabsTrigger>
                                            <TabsTrigger value="real-cat">Real CAT</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-hidden">
                                    <ScrollArea className="h-full pr-4">
                                        <AnimatePresence mode="wait">
                                            {/* Overview Tab */}
                                            {activeTab === 'overview' && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="space-y-4"
                                                >
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <Card className="bg-muted/10 border-border/50">
                                                            <CardContent className="pt-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                                        <BookOpen className="w-5 h-5 text-blue-400" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-2xl font-bold">
                                                                            {selectedTopic.lessons_completed}/{selectedTopic.total_lessons}
                                                                        </p>
                                                                        <p className="text-sm text-muted-foreground">Lessons Completed</p>
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                        <Card className="bg-muted/10 border-border/50">
                                                            <CardContent className="pt-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                                                        <Target className="w-5 h-5 text-green-400" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-2xl font-bold">
                                                                            {selectedTopic.problems_correct}/{selectedTopic.problems_attempted}
                                                                        </p>
                                                                        <p className="text-sm text-muted-foreground">Problems Solved</p>
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                    <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30">
                                                        <CardContent className="pt-4">
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                                                                    <Sparkles className="w-5 h-5 text-violet-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold mb-1">AI Recommendation</p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Based on your performance, focus on medium difficulty problems
                                                                        to improve your mastery. You're close to reaching the
                                                                        "Proficient" level!
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            )}

                                            {/* Lessons Tab */}
                                            {activeTab === 'lessons' && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="space-y-3"
                                                >
                                                    {lessonsLoading ? (
                                                        <div className="space-y-3">
                                                            {[1, 2, 3].map((i) => (
                                                                <div key={i} className="h-20 bg-muted/20 rounded-lg animate-pulse" />
                                                            ))}
                                                        </div>
                                                    ) : lessons?.length === 0 ? (
                                                        <div className="text-center py-8 text-muted-foreground">
                                                            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                            <p>No lessons available for this topic yet.</p>
                                                        </div>
                                                    ) : (
                                                        lessons?.map((lesson, index) => (
                                                            <Card
                                                                key={lesson.id}
                                                                className={`bg-muted/10 border-border/50 hover:border-violet-500/30 transition-colors cursor-pointer ${lesson.is_completed ? 'opacity-75' : ''
                                                                    }`}
                                                            >
                                                                <CardContent className="py-4">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${lesson.is_completed
                                                                                ? 'bg-green-500/20 text-green-400'
                                                                                : 'bg-muted/30 text-muted-foreground'
                                                                            }`}>
                                                                            {lesson.is_completed ? (
                                                                                <CheckCircle2 className="w-5 h-5" />
                                                                            ) : (
                                                                                <span className="font-semibold">{index + 1}</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="font-medium">{lesson.title}</p>
                                                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                                                <Badge variant="outline" className="capitalize">
                                                                                    {lesson.lesson_type}
                                                                                </Badge>
                                                                                {lesson.duration_minutes && (
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Clock className="w-3 h-3" />
                                                                                        {lesson.duration_minutes} min
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        ))
                                                    )}
                                                </motion.div>
                                            )}

                                            {/* Practice Tab */}
                                            {activeTab === 'practice' && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="space-y-4"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm text-muted-foreground">
                                                            {problems?.length || 0} problems available
                                                        </p>
                                                        <Select
                                                            value={difficultyFilter}
                                                            onValueChange={(v) => setDifficultyFilter(v as typeof difficultyFilter)}
                                                        >
                                                            <SelectTrigger className="w-40">
                                                                <SelectValue placeholder="Difficulty" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="all">All Levels</SelectItem>
                                                                <SelectItem value="easy">Easy</SelectItem>
                                                                <SelectItem value="medium">Medium</SelectItem>
                                                                <SelectItem value="hard">Hard</SelectItem>
                                                                <SelectItem value="cat_level">CAT Level</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    {problemsLoading ? (
                                                        <div className="space-y-3">
                                                            {[1, 2, 3].map((i) => (
                                                                <div key={i} className="h-24 bg-muted/20 rounded-lg animate-pulse" />
                                                            ))}
                                                        </div>
                                                    ) : problems?.length === 0 ? (
                                                        <div className="text-center py-8 text-muted-foreground">
                                                            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                            <p>No practice problems available.</p>
                                                        </div>
                                                    ) : (
                                                        problems?.slice(0, 10).map((problem) => (
                                                            <ProblemCard key={problem.id} problem={problem} />
                                                        ))
                                                    )}
                                                </motion.div>
                                            )}

                                            {/* Real CAT Tab */}
                                            {activeTab === 'real-cat' && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="space-y-4"
                                                >
                                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                                        <Lightbulb className="w-5 h-5 text-amber-400" />
                                                        <p className="text-sm text-amber-400">
                                                            These are actual questions from past CAT exams. Great for understanding the exam pattern!
                                                        </p>
                                                    </div>
                                                    {realCatLoading ? (
                                                        <div className="space-y-3">
                                                            {[1, 2, 3].map((i) => (
                                                                <div key={i} className="h-24 bg-muted/20 rounded-lg animate-pulse" />
                                                            ))}
                                                        </div>
                                                    ) : realCatQuestions?.length === 0 ? (
                                                        <div className="text-center py-8 text-muted-foreground">
                                                            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                            <p>No real CAT questions available for this topic.</p>
                                                        </div>
                                                    ) : (
                                                        realCatQuestions?.map((problem) => (
                                                            <ProblemCard key={problem.id} problem={problem} showYear />
                                                        ))
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </ScrollArea>
                                </CardContent>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                                    <p className="text-muted-foreground">Select a topic to start learning</p>
                                </div>
                            </div>
                        )}
                    </Card>
                </motion.div>
            </div>

            {/* Weak & Strong Topics */}
            {masteryData && (
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-card/50 border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-amber-400">
                                <AlertCircle className="w-5 h-5" />
                                Weak Topics
                            </CardTitle>
                            <CardDescription>Focus on these to improve</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {masteryData.weak_topics.slice(0, 5).map((topic) => (
                                    <div
                                        key={topic.topic_id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/10 hover:bg-muted/20 cursor-pointer transition-colors"
                                        onClick={() => setSelectedTopic(topic)}
                                    >
                                        <div>
                                            <p className="font-medium">{topic.topic_name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {topic.accuracy_percent}% accuracy
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-16">
                                                <Progress value={topic.mastery_score} className="h-2" />
                                            </div>
                                            <span className="text-sm font-medium w-8 text-right">
                                                {topic.mastery_score}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/50 border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-400">
                                <Trophy className="w-5 h-5" />
                                Strong Topics
                            </CardTitle>
                            <CardDescription>Keep up the great work!</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {masteryData.strong_topics.slice(0, 5).map((topic) => (
                                    <div
                                        key={topic.topic_id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/10 hover:bg-muted/20 cursor-pointer transition-colors"
                                        onClick={() => setSelectedTopic(topic)}
                                    >
                                        <div>
                                            <p className="font-medium">{topic.topic_name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {topic.accuracy_percent}% accuracy
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-16">
                                                <Progress value={topic.mastery_score} className="h-2" />
                                            </div>
                                            <span className="text-sm font-medium w-8 text-right">
                                                {topic.mastery_score}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Start Session Dialog */}
            <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Start Learning Session</DialogTitle>
                        <DialogDescription>
                            Configure your learning session for {selectedTopic?.topic_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Session Type</label>
                            <Select
                                value={sessionType}
                                onValueChange={(v) => setSessionType(v as typeof sessionType)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="practice">Practice Problems</SelectItem>
                                    <SelectItem value="real_cat">Real CAT Questions</SelectItem>
                                    <SelectItem value="mixed">Mixed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Number of Problems</label>
                            <Select
                                value={problemCount.toString()}
                                onValueChange={(v) => setProblemCount(parseInt(v))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5 problems</SelectItem>
                                    <SelectItem value="10">10 problems</SelectItem>
                                    <SelectItem value="15">15 problems</SelectItem>
                                    <SelectItem value="20">20 problems</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSessionDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleStartSession}
                            disabled={startSession.isPending}
                            className="bg-gradient-to-r from-violet-500 to-purple-600"
                        >
                            {startSession.isPending ? 'Starting...' : 'Start Session'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}

// Problem Card Component
function ProblemCard({ problem, showYear = false }: { problem: Problem; showYear?: boolean }) {
    return (
        <Card className="bg-muted/10 border-border/50 hover:border-violet-500/30 transition-colors cursor-pointer">
            <CardContent className="py-4">
                <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${problem.attempted
                            ? problem.is_correct
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            : 'bg-muted/30 text-muted-foreground'
                        }`}>
                        {problem.attempted ? (
                            problem.is_correct ? (
                                <CheckCircle2 className="w-5 h-5" />
                            ) : (
                                <AlertCircle className="w-5 h-5" />
                            )
                        ) : (
                            <Target className="w-5 h-5" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2">{problem.question_text}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className={`${difficultyColors[problem.difficulty]} capitalize`}>
                                {problem.difficulty.replace('_', ' ')}
                            </Badge>
                            {showYear && problem.cat_year && (
                                <Badge variant="outline" className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                                    CAT {problem.cat_year}
                                </Badge>
                            )}
                            {problem.time_limit_seconds && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Timer className="w-3 h-3" />
                                    {Math.floor(problem.time_limit_seconds / 60)}m {problem.time_limit_seconds % 60}s
                                </span>
                            )}
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
            </CardContent>
        </Card>
    );
}
