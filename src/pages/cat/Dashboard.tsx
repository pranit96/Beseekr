// CAT Dashboard - Unified hub with Tasks, AI Insights, and Quick Actions
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catApi } from '@/api/cat';
import { motion, AnimatePresence } from 'framer-motion';
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
    Clock,
    CheckCircle2,
    Calendar,
    ArrowRight,
    Sparkles,
    Loader2,
    Plus,
    ChevronRight,
    Brain,
    Lightbulb,
    Zap,
    Play,
    Timer,
    Trophy,
    BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CatNavigation } from '@/components/cat/CatNavigation';
import type { StudyTask, CreateTaskPayload, TaskType, TaskPriority } from '@/types/cat';

const taskTypeConfig: Record<TaskType, { label: string; color: string; icon: typeof BookOpen }> = {
    study: { label: 'Study', color: 'bg-blue-500', icon: BookOpen },
    practice: { label: 'Practice', color: 'bg-emerald-500', icon: Target },
    revision: { label: 'Revision', color: 'bg-amber-500', icon: RotateCcw },
    mock: { label: 'Mock', color: 'bg-violet-500', icon: FileQuestion },
};

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
    low: { label: 'Low', color: 'text-muted-foreground' },
    medium: { label: 'Medium', color: 'text-blue-500' },
    high: { label: 'High', color: 'text-amber-500' },
    urgent: { label: 'Urgent', color: 'text-red-500' },
};

export default function CatDashboard() {
    const [quickTaskOpen, setQuickTaskOpen] = useState(false);
    const queryClient = useQueryClient();
    const { toast } = useToast();

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

    const { data: tasksData } = useQuery({
        queryKey: ['cat-tasks'],
        queryFn: () => catApi.getTasks({ limit: 10 }),
        staleTime: 1 * 60 * 1000,
    });

    const { data: aiAnalysis } = useQuery({
        queryKey: ['cat-ai-analysis'],
        queryFn: () => catApi.getAIAnalysis(),
        staleTime: 5 * 60 * 1000,
    });

    // AI Study Plan
    const { data: aiStudyPlan } = useQuery({
        queryKey: ['cat-ai-study-plan'],
        queryFn: () => catApi.getAIStudyPlan(),
        staleTime: 10 * 60 * 1000,
    });

    // Tutor Usage Stats
    const { data: tutorUsage } = useQuery({
        queryKey: ['cat-tutor-usage'],
        queryFn: () => catApi.getTutorUsage(),
        staleTime: 5 * 60 * 1000,
    });

    const completeMutation = useMutation({
        mutationFn: (id: string) => catApi.completeTask(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cat-tasks'] });
            toast({ title: 'Task completed! 🎉' });
        },
    });

    const tasks = useMemo(() => {
        const items = tasksData?.items || [];
        return items.filter((t: StudyTask) => t.status !== 'completed' && t.status !== 'cancelled');
    }, [tasksData]);

    const overdueTasks = useMemo(() => {
        return tasks.filter((t: StudyTask) => t.deadline && new Date(t.deadline) < new Date());
    }, [tasks]);

    const todayTasks = useMemo(() => {
        const today = new Date().toDateString();
        return tasks.filter((t: StudyTask) => t.deadline && new Date(t.deadline).toDateString() === today);
    }, [tasks]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const overallProgress = parseFloat(dashboard?.syllabus?.progress_percent || '0');
    const dueRevisions = dashboard?.revisions?.due_today || 0;
    const weakAreas = dashboard?.weak_areas?.slice(0, 3) || [];

    return (
        <div className="space-y-6">
            {/* CAT Module Navigation */}
            <CatNavigation />

            {/* Header with Streak */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Welcome back! 👋</h1>
                    <p className="text-muted-foreground">
                        Let's continue your CAT preparation journey
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {dashboard?.settings && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20"
                        >
                            <Flame className="h-5 w-5 text-amber-500" />
                            <div>
                                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                                    {dashboard.settings.current_streak} Day Streak
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Best: {dashboard.settings.longest_streak} days
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Quick Action Toolbar */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="grid grid-cols-2 md:grid-cols-5 gap-3"
            >
                <Link to="/cat/assess">
                    <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 hover:border-violet-500/40 transition-all"
                    >
                        <FileQuestion className="h-6 w-6 text-violet-500 mb-2" />
                        <p className="font-medium">Take Mock</p>
                        <p className="text-xs text-muted-foreground">Full test</p>
                    </motion.div>
                </Link>
                <Link to="/cat/practice">
                    <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all"
                    >
                        <Target className="h-6 w-6 text-emerald-500 mb-2" />
                        <p className="font-medium">Practice</p>
                        <p className="text-xs text-muted-foreground">Timed session</p>
                    </motion.div>
                </Link>
                <Link to="/cat/review">
                    <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all"
                    >
                        <RotateCcw className="h-6 w-6 text-amber-500 mb-2" />
                        <p className="font-medium">Revisions</p>
                        <p className="text-xs text-muted-foreground">{dueRevisions} due</p>
                    </motion.div>
                </Link>
                <Link to="/cat/learn">
                    <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 hover:border-pink-500/40 transition-all"
                    >
                        <BookOpen className="h-6 w-6 text-pink-500 mb-2" />
                        <p className="font-medium">Learn</p>
                        <p className="text-xs text-muted-foreground">Topics & Notes</p>
                    </motion.div>
                </Link>
                <button onClick={() => setQuickTaskOpen(true)} className="col-span-2 md:col-span-1">
                    <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all h-full"
                    >
                        <Plus className="h-6 w-6 text-blue-500 mb-2" />
                        <p className="font-medium">Quick Task</p>
                        <p className="text-xs text-muted-foreground">Add new</p>
                    </motion.div>
                </button>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Tasks Widget */}
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <ListTodo className="h-5 w-5 text-primary" />
                                Today's Tasks
                            </CardTitle>
                            <CardDescription>
                                {todayTasks.length} tasks for today, {overdueTasks.length} overdue
                            </CardDescription>
                        </div>
                        <Link to="/cat/tasks">
                            <Button variant="ghost" size="sm">
                                View All <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[280px]">
                            {tasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                    <CheckCircle2 className="h-12 w-12 text-emerald-500/50 mb-3" />
                                    <p className="text-muted-foreground">All caught up! 🎉</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-4"
                                        onClick={() => setQuickTaskOpen(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add Task
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {overdueTasks.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-xs font-medium text-red-500 mb-2 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" /> Overdue
                                            </p>
                                            {overdueTasks.map((task: StudyTask) => (
                                                <TaskItem
                                                    key={task.id}
                                                    task={task}
                                                    onComplete={() => completeMutation.mutate(task.id)}
                                                    isOverdue
                                                />
                                            ))}
                                        </div>
                                    )}
                                    {todayTasks.filter((t: StudyTask) => !overdueTasks.includes(t)).map((task: StudyTask) => (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            onComplete={() => completeMutation.mutate(task.id)}
                                        />
                                    ))}
                                    {tasks.filter((t: StudyTask) => !todayTasks.includes(t) && !overdueTasks.includes(t)).slice(0, 3).map((task: StudyTask) => (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            onComplete={() => completeMutation.mutate(task.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* AI Insights Panel */}
                <Card className="bg-gradient-to-br from-violet-500/5 to-purple-500/5 border-violet-500/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-violet-500" />
                            AI Insights
                        </CardTitle>
                        <CardDescription>Personalized recommendations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {aiAnalysis ? (
                            <>
                                {/* Strengths */}
                                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <p className="text-xs font-medium text-emerald-500 mb-1 flex items-center gap-1">
                                        <Trophy className="h-3 w-3" /> Strong In
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {aiAnalysis.strengths?.slice(0, 3).map((s, i) => (
                                            <Badge key={i} variant="outline" className="text-xs bg-emerald-500/10">
                                                {s.topic}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Focus Areas */}
                                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                    <p className="text-xs font-medium text-amber-500 mb-1 flex items-center gap-1">
                                        <Lightbulb className="h-3 w-3" /> Focus On
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {aiAnalysis.weaknesses?.slice(0, 3).map((w, i) => (
                                            <Badge key={i} variant="outline" className="text-xs bg-amber-500/10">
                                                {w.topic}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Recommendation */}
                                <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                                    <p className="text-xs font-medium text-violet-500 mb-1 flex items-center gap-1">
                                        <Brain className="h-3 w-3" /> Today's Focus
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {aiAnalysis.improvement_roadmap?.[0] || 'Keep practicing consistently!'}
                                    </p>
                                </div>

                                {/* AI Study Plan Summary */}
                                {aiStudyPlan && (
                                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                        <p className="text-xs font-medium text-blue-500 mb-2 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> Today's Plan
                                        </p>
                                        {aiStudyPlan.daily_plans?.[0]?.focus_areas?.slice(0, 2).map((area, i) => (
                                            <Badge key={i} variant="outline" className="text-xs mr-1">
                                                {area}
                                            </Badge>
                                        ))}
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {aiStudyPlan.daily_plans?.[0]?.estimated_hours || 0} hours planned
                                        </p>
                                    </div>
                                )}

                                {/* Tutor Usage */}
                                {tutorUsage && (
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>AI Tutor: {tutorUsage.questions_today} queries today • {tutorUsage.streak_days} day streak</span>
                                    </div>
                                )}

                                <Link to="/cat/review">
                                    <Button variant="outline" size="sm" className="w-full">
                                        <BarChart3 className="h-4 w-4 mr-2" /> View Full Analysis
                                    </Button>
                                </Link>
                            </>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Complete more practice to unlock AI insights</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Progress & Goals Row */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Syllabus Progress */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            Syllabus Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Overall Progress</span>
                                <span className="text-sm font-semibold">{overallProgress}%</span>
                            </div>
                            <Progress value={overallProgress} className="h-2" />
                        </div>
                        <div className="space-y-3">
                            {dashboard?.syllabus?.subjects?.map((subject, idx) => (
                                <Link
                                    key={idx}
                                    to="/cat/learn"
                                    className="block"
                                >
                                    <motion.div
                                        whileHover={{ x: 4 }}
                                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <div className="text-2xl">{subject.icon}</div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-sm">{subject.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {subject.done}/{subject.total}
                                                </span>
                                            </div>
                                            <Progress
                                                value={parseFloat(subject.progress)}
                                                className="h-1.5"
                                            />
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Daily Goals */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            Today's Goals
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {todayGoals && (
                            <>
                                <GoalItem
                                    label="Study Hours"
                                    current={todayGoals.progress?.study_hours?.completed || 0}
                                    target={todayGoals.progress?.study_hours?.target || 4}
                                    unit="hrs"
                                    icon={<Clock className="h-4 w-4" />}
                                />
                                <GoalItem
                                    label="Questions Practiced"
                                    current={todayGoals.progress?.questions_practiced?.completed || 0}
                                    target={todayGoals.progress?.questions_practiced?.target || 50}
                                    icon={<Target className="h-4 w-4" />}
                                />
                                <GoalItem
                                    label="Topics Revised"
                                    current={todayGoals.progress?.topics_revised?.completed || 0}
                                    target={todayGoals.progress?.topics_revised?.target || 3}
                                    icon={<RotateCcw className="h-4 w-4" />}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Weak Areas Alert */}
            {weakAreas.length > 0 && (
                <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-semibold mb-2">Areas Needing Attention</h4>
                                <div className="flex flex-wrap gap-2">
                                    {weakAreas.map((area, idx) => (
                                        <Badge key={idx} variant="outline" className="bg-amber-500/10">
                                            {area.topic_name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <Link to="/cat/practice">
                                <Button size="sm">
                                    <Zap className="h-4 w-4 mr-2" /> Practice Now
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Leaderboard Section */}
            <LeaderboardSection />

            {/* Quick Add Task Dialog */}
            <QuickTaskDialog
                open={quickTaskOpen}
                onOpenChange={setQuickTaskOpen}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['cat-tasks'] });
                    toast({ title: 'Task created!' });
                }}
            />
        </div>
    );
}

// Task Item Component
function TaskItem({
    task,
    onComplete,
    isOverdue = false,
}: {
    task: StudyTask;
    onComplete: () => void;
    isOverdue?: boolean;
}) {
    const config = taskTypeConfig[task.task_type];
    const priorityInfo = priorityConfig[task.priority];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                isOverdue ? "bg-red-500/10 border border-red-500/20" : "bg-muted/50 hover:bg-muted"
            )}
        >
            <button
                onClick={onComplete}
                className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 hover:border-emerald-500 hover:bg-emerald-500/20 transition-colors flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{task.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={cn("flex items-center gap-1", priorityInfo.color)}>
                        {priorityInfo.label}
                    </span>
                    {task.estimated_minutes && (
                        <>
                            <span>•</span>
                            <span>{task.estimated_minutes}m</span>
                        </>
                    )}
                </div>
            </div>
            <Badge variant="outline" className={cn("text-xs", config.color.replace('bg-', 'border-'))}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </Badge>
        </motion.div>
    );
}

// Goal Item Component
function GoalItem({
    label,
    current,
    target,
    unit = '',
    icon,
}: {
    label: string;
    current: number;
    target: number;
    unit?: string;
    icon: React.ReactNode;
}) {
    const progress = target > 0 ? (current / target) * 100 : 0;
    const isComplete = current >= target;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                    {icon}
                    {label}
                </span>
                <span className={cn("text-sm font-medium", isComplete && "text-emerald-500")}>
                    {current}{unit} / {target}{unit}
                </span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-2" />
        </div>
    );
}

// Quick Task Dialog
function QuickTaskDialog({
    open,
    onOpenChange,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}) {
    const [title, setTitle] = useState('');
    const [taskType, setTaskType] = useState<TaskType>('study');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [estimatedMinutes, setEstimatedMinutes] = useState('30');

    const createMutation = useMutation({
        mutationFn: (payload: CreateTaskPayload) => catApi.createTask(payload),
        onSuccess: () => {
            onSuccess();
            onOpenChange(false);
            setTitle('');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        createMutation.mutate({
            title: title.trim(),
            task_type: taskType,
            priority,
            estimated_minutes: parseInt(estimatedMinutes),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Quick Add Task</DialogTitle>
                    <DialogDescription>
                        Create a new task for your study plan
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Title</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Practice Time & Work problems"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Type</Label>
                            <Select value={taskType} onValueChange={(v) => setTaskType(v as TaskType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(taskTypeConfig).map(([key, config]) => (
                                        <SelectItem key={key} value={key}>
                                            {config.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Priority</Label>
                            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(priorityConfig).map(([key, config]) => (
                                        <SelectItem key={key} value={key}>
                                            {config.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label>Estimated Time (minutes)</Label>
                        <Select value={estimatedMinutes} onValueChange={setEstimatedMinutes}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="15">15 minutes</SelectItem>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="45">45 minutes</SelectItem>
                                <SelectItem value="60">1 hour</SelectItem>
                                <SelectItem value="90">1.5 hours</SelectItem>
                                <SelectItem value="120">2 hours</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!title.trim() || createMutation.isPending}>
                            {createMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Plus className="h-4 w-4 mr-2" />
                            )}
                            Create Task
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Leaderboard Section Component
function LeaderboardSection() {
    const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');

    const { data: leaderboard, isLoading } = useQuery({
        queryKey: ['cat-leaderboard', period],
        queryFn: () => catApi.getLeaderboard({ period, limit: 5 }),
        staleTime: 5 * 60 * 1000,
    });

    const { data: myRanking } = useQuery({
        queryKey: ['cat-my-ranking'],
        queryFn: () => catApi.getMyRanking(),
        staleTime: 5 * 60 * 1000,
    });

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        Leaderboard
                    </CardTitle>
                    <CardDescription>Top performers this {period === 'weekly' ? 'week' : 'month'}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={period === 'weekly' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPeriod('weekly')}
                    >
                        Weekly
                    </Button>
                    <Button
                        variant={period === 'monthly' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPeriod('monthly')}
                    >
                        Monthly
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : leaderboard?.entries && leaderboard.entries.length > 0 ? (
                    <div className="space-y-3">
                        {leaderboard.entries.map((entry, idx) => (
                            <div
                                key={entry.user_id}
                                className={cn(
                                    "flex items-center gap-3 p-2 rounded-lg",
                                    idx === 0 && "bg-amber-500/10",
                                    idx === 1 && "bg-slate-500/10",
                                    idx === 2 && "bg-orange-500/10"
                                )}
                            >
                                <div className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold",
                                    idx === 0 ? "bg-amber-500 text-white" :
                                        idx === 1 ? "bg-slate-400 text-white" :
                                            idx === 2 ? "bg-orange-400 text-white" : "bg-muted"
                                )}>
                                    {entry.rank}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{entry.name}</p>
                                    <p className="text-xs text-muted-foreground">{entry.problems_solved} problems • {entry.streak_days}d streak</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">{entry.score}</p>
                                    <p className="text-xs text-muted-foreground">points</p>
                                </div>
                            </div>
                        ))}
                        {myRanking && (
                            <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">Your Rank</p>
                                        <p className="text-xs text-muted-foreground">Top {myRanking.percentile.toFixed(1)}%</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-primary">#{myRanking.my_rank}</p>
                                        <p className="text-xs text-muted-foreground">{myRanking.my_score} points</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No leaderboard data available</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
