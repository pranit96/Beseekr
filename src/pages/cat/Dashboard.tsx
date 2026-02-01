import { useQuery } from '@tanstack/react-query';
import { catApi } from '@/api/cat';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    BookOpen,
    ListTodo,
    FileQuestion,
    Target,
    RotateCcw,
    AlertCircle,
    Flame,
    TrendingUp,
    TrendingDown,
    Clock,
    CheckCircle2,
    Calendar,
    ArrowRight,
    Sparkles,
    Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function CatDashboard() {
    const { data: dashboard, isLoading } = useQuery({
        queryKey: ['cat-dashboard'],
        queryFn: () => catApi.getDashboard(),
        staleTime: 2 * 60 * 1000,
    });

    const { data: todayGoals } = useQuery({
        queryKey: ['cat-goals-today'],
        queryFn: () => catApi.getTodayGoals(),
        staleTime: 1 * 60 * 1000,
    });

    const { data: revisions } = useQuery({
        queryKey: ['cat-revisions'],
        queryFn: () => catApi.getRevisions(),
        staleTime: 2 * 60 * 1000,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const overallProgress = dashboard?.syllabus_progress?.overall_completion || 0;
    const dueRevisions = revisions?.filter(r => r.status === 'pending' || r.status === 'overdue') || [];
    const weakAreas = dashboard?.weak_areas?.slice(0, 3) || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Welcome back! 👋</h1>
                    <p className="text-muted-foreground">
                        Let's continue your CAT preparation journey
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {dashboard?.streak && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20"
                        >
                            <Flame className="h-5 w-5 text-amber-500" />
                            <div>
                                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                                    {dashboard.streak.current} Day Streak
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Best: {dashboard.streak.longest} days
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link to="/cat/mocks">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 hover:border-violet-500/40 transition-colors"
                    >
                        <FileQuestion className="h-6 w-6 text-violet-500 mb-2" />
                        <p className="font-medium">Take Mock</p>
                        <p className="text-xs text-muted-foreground">Start a full test</p>
                    </motion.div>
                </Link>
                <Link to="/cat/practice">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors"
                    >
                        <Target className="h-6 w-6 text-emerald-500 mb-2" />
                        <p className="font-medium">Practice</p>
                        <p className="text-xs text-muted-foreground">Timed sessions</p>
                    </motion.div>
                </Link>
                <Link to="/cat/revisions">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-colors"
                    >
                        <RotateCcw className="h-6 w-6 text-amber-500 mb-2" />
                        <p className="font-medium">Revisions</p>
                        <p className="text-xs text-muted-foreground">
                            {dueRevisions.length} due today
                        </p>
                    </motion.div>
                </Link>
                <Link to="/cat/flashcards">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 hover:border-pink-500/40 transition-colors"
                    >
                        <Sparkles className="h-6 w-6 text-pink-500 mb-2" />
                        <p className="font-medium">Flashcards</p>
                        <p className="text-xs text-muted-foreground">Review cards</p>
                    </motion.div>
                </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Syllabus Progress */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            Syllabus Progress
                        </CardTitle>
                        <CardDescription>Your overall completion across all subjects</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Overall Progress</span>
                                <span className="text-sm font-semibold">{overallProgress}%</span>
                            </div>
                            <Progress value={overallProgress} className="h-2" />
                        </div>
                        <div className="grid gap-4">
                            {dashboard?.syllabus_progress?.subjects?.map((subject) => (
                                <Link
                                    key={subject.id}
                                    to={`/cat/subjects?subject=${subject.code}`}
                                    className="block"
                                >
                                    <motion.div
                                        whileHover={{ x: 4 }}
                                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <div className="text-2xl">{subject.icon}</div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium">{subject.name}</span>
                                                <span className="text-sm text-muted-foreground">
                                                    {subject.stats.done}/{subject.stats.total} topics
                                                </span>
                                            </div>
                                            <Progress
                                                value={(subject.stats.done / subject.stats.total) * 100}
                                                className="h-1.5"
                                            />
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Today's Goals */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            Today's Goals
                        </CardTitle>
                        <CardDescription>Track your daily progress</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {todayGoals?.progress ? (
                            <>
                                <GoalItem
                                    label="Study Hours"
                                    current={todayGoals.progress.study_hours.completed}
                                    target={todayGoals.progress.study_hours.target}
                                    unit="hrs"
                                />
                                <GoalItem
                                    label="Questions"
                                    current={todayGoals.progress.questions_practiced.completed}
                                    target={todayGoals.progress.questions_practiced.target}
                                />
                                <GoalItem
                                    label="Topics Revised"
                                    current={todayGoals.progress.topics_revised.completed}
                                    target={todayGoals.progress.topics_revised.target}
                                />
                                <GoalItem
                                    label="Flashcards"
                                    current={todayGoals.progress.flashcards_reviewed.completed}
                                    target={todayGoals.progress.flashcards_reviewed.target}
                                />
                            </>
                        ) : (
                            <div className="text-center text-muted-foreground py-4">
                                <p>Set your daily goals in settings</p>
                                <Link to="/cat/settings">
                                    <Button variant="link" size="sm">
                                        Configure Goals
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Upcoming Revisions */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-amber-500" />
                                Due Revisions
                            </CardTitle>
                            <CardDescription>Topics scheduled for review</CardDescription>
                        </div>
                        <Link to="/cat/revisions">
                            <Button variant="ghost" size="sm">
                                View All
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {dueRevisions.length > 0 ? (
                            <div className="space-y-3">
                                {dueRevisions.slice(0, 5).map((revision) => (
                                    <div
                                        key={revision.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                    >
                                        <div>
                                            <p className="font-medium">{revision.topic?.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Revision #{revision.revision_number}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={revision.status === 'overdue' ? 'destructive' : 'secondary'}
                                        >
                                            {revision.status === 'overdue' ? 'Overdue' : 'Due Today'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                <RotateCcw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>No revisions due!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Weak Areas */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                Weak Areas
                            </CardTitle>
                            <CardDescription>Topics needing more practice</CardDescription>
                        </div>
                        <Link to="/cat/analytics">
                            <Button variant="ghost" size="sm">
                                View Analytics
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {weakAreas.length > 0 ? (
                            <div className="space-y-3">
                                {weakAreas.map((area) => (
                                    <div
                                        key={area.topic_id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                    >
                                        <div>
                                            <p className="font-medium">{area.topic_title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {area.attempts} attempts
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <TrendingDown className="h-4 w-4 text-red-500" />
                                            <span className={cn(
                                                "font-semibold",
                                                area.accuracy < 40 ? "text-red-500" : "text-amber-500"
                                            )}>
                                                {area.accuracy}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Great job! No weak areas detected.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Mock Performance */}
            {dashboard?.mock_performance && dashboard.mock_performance.total_mocks > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FileQuestion className="h-5 w-5 text-violet-500" />
                                Mock Performance
                            </CardTitle>
                            <CardDescription>Your recent mock test scores</CardDescription>
                        </div>
                        <Link to="/cat/mocks">
                            <Button variant="ghost" size="sm">
                                View All Mocks
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="text-center p-4 rounded-lg bg-muted/50">
                                <p className="text-2xl font-bold text-primary">
                                    {dashboard.mock_performance.total_mocks}
                                </p>
                                <p className="text-sm text-muted-foreground">Total Mocks</p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-muted/50">
                                <p className="text-2xl font-bold text-emerald-500">
                                    {dashboard.mock_performance.average_score.toFixed(1)}
                                </p>
                                <p className="text-sm text-muted-foreground">Avg Score</p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-muted/50">
                                <p className="text-2xl font-bold text-amber-500">
                                    {dashboard.mock_performance.best_score}
                                </p>
                                <p className="text-sm text-muted-foreground">Best Score</p>
                            </div>
                        </div>
                        {dashboard.mock_performance.trend.length > 0 && (
                            <div className="h-32 flex items-end gap-1">
                                {dashboard.mock_performance.trend.slice(-10).map((point, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 bg-primary/20 hover:bg-primary/30 transition-colors rounded-t"
                                        style={{ height: `${(point.score / 200) * 100}%` }}
                                        title={`${point.date}: ${point.score}`}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function GoalItem({
    label,
    current,
    target,
    unit = '',
}: {
    label: string;
    current: number;
    target: number;
    unit?: string;
}) {
    const progress = Math.min((current / target) * 100, 100);
    const isComplete = current >= target;

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm">{label}</span>
                <span className={cn(
                    "text-sm font-medium",
                    isComplete ? "text-emerald-500" : "text-muted-foreground"
                )}>
                    {current}{unit} / {target}{unit}
                </span>
            </div>
            <Progress value={progress} className={cn("h-1.5", isComplete && "[&>div]:bg-emerald-500")} />
        </div>
    );
}
