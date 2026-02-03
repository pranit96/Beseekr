// CAT Review Page - Unified Review Hub (Revisions + Analytics)
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, isToday, isFuture, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Target,
    Flame,
    Brain,
    Sparkles,
    Loader2,
    Calendar,
    CheckCircle2,
    RotateCcw,
    AlertTriangle,
    Clock,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { catApi } from '@/api/cat';
import { CatNavigation } from '@/components/cat/CatNavigation';
import { SectionTabs } from '@/components/cat/SectionTabs';
import type { Revision } from '@/types/cat';

export default function Review() {
    const [activeTab, setActiveTab] = useState('analytics');
    const [revisionView, setRevisionView] = useState<'list' | 'calendar'>('list');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [completeDialog, setCompleteDialog] = useState<Revision | null>(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Analytics data
    const { data: dashboard, isLoading: isDashboardLoading } = useQuery({
        queryKey: ['cat-dashboard'],
        queryFn: () => catApi.getDashboard(),
    });

    const { data: goalsHistory } = useQuery({
        queryKey: ['cat-goals-history'],
        queryFn: () => catApi.getGoalsHistory(14),
    });

    const { data: aiAnalysis, isLoading: isAnalysisLoading } = useQuery({
        queryKey: ['cat-ai-analysis'],
        queryFn: () => catApi.getAIAnalysis(),
        staleTime: 10 * 60 * 1000,
    });

    const { data: studyPlan } = useQuery({
        queryKey: ['cat-ai-study-plan'],
        queryFn: () => catApi.getAIStudyPlan(),
        staleTime: 30 * 60 * 1000,
    });

    // Speed Analytics
    const { data: speedAnalytics } = useQuery({
        queryKey: ['cat-speed-analytics'],
        queryFn: () => catApi.getSpeedAnalytics(),
        staleTime: 10 * 60 * 1000,
    });

    // Revisions data
    const { data: revisions, isLoading: isRevisionsLoading } = useQuery({
        queryKey: ['cat-revisions'],
        queryFn: () => catApi.getRevisions(),
    });

    const completeMutation = useMutation({
        mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
            catApi.completeRevision(id, { notes }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cat-revisions'] });
            toast({ title: 'Revision completed!' });
            setCompleteDialog(null);
        },
    });

    const currentStreak = dashboard?.settings?.current_streak || 0;
    const mockData = dashboard?.mocks;

    const grouped = useMemo(() => {
        if (!revisions || !Array.isArray(revisions)) return { overdue: [], today: [], upcoming: [], completed: [] };
        return {
            overdue: revisions.filter(r => r.status === 'overdue'),
            today: revisions.filter(r => r.status === 'pending' && isToday(new Date(r.scheduled_date))),
            upcoming: revisions.filter(r => r.status === 'pending' && isFuture(new Date(r.scheduled_date))),
            completed: revisions.filter(r => r.status === 'completed').slice(0, 10),
        };
    }, [revisions]);

    const calendarDays = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const revisionsByDate = useMemo(() => {
        if (!revisions || !Array.isArray(revisions)) return {};
        const map: Record<string, Revision[]> = {};
        revisions.forEach(r => {
            const key = format(new Date(r.scheduled_date), 'yyyy-MM-dd');
            if (!map[key]) map[key] = [];
            map[key].push(r);
        });
        return map;
    }, [revisions]);

    const dueCount = grouped.overdue.length + grouped.today.length;

    return (
        <div className="space-y-6">
            {/* CAT Module Navigation */}
            <CatNavigation />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="h-7 w-7 text-primary" />
                        Review
                    </h1>
                    <p className="text-muted-foreground">Analytics, progress & revision schedule</p>
                </div>
                {dueCount > 0 && (
                    <Badge variant="destructive" className="text-sm px-3 py-1">
                        {dueCount} revisions due
                    </Badge>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                <Flame className="h-5 w-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-amber-500">{currentStreak}</p>
                                <p className="text-xs text-muted-foreground">Day Streak</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-violet-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-violet-500">{dashboard?.syllabus?.progress_percent || 0}%</p>
                                <p className="text-xs text-muted-foreground">Syllabus</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-emerald-500">{mockData?.average_score || '--'}</p>
                                <p className="text-xs text-muted-foreground">Avg Score</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-rose-500/10 to-red-500/10 border-rose-500/20">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                                <RotateCcw className="h-5 w-5 text-rose-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-rose-500">{dueCount}</p>
                                <p className="text-xs text-muted-foreground">Revisions Due</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Section Tabs */}
            <SectionTabs
                tabs={[
                    { value: 'analytics', label: 'Analytics', description: 'Performance & trends', icon: TrendingUp },
                    { value: 'revisions', label: 'Revisions', description: 'Spaced repetition schedule', icon: RotateCcw, badge: dueCount > 0 ? dueCount : undefined, badgeVariant: 'destructive' },
                    { value: 'insights', label: 'AI Insights', description: 'Personalized recommendations', icon: Sparkles },
                ]}
                value={activeTab}
                onValueChange={setActiveTab}
            />

            {/* Tab Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-0">

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-6">
                    {isDashboardLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <>
                            {/* Goals History */}
                            {goalsHistory && goalsHistory.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="h-5 w-5 text-primary" />Daily Goals (Last 14 Days)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-1 justify-between">
                                            {goalsHistory.slice(-14).map((goal) => (
                                                <div key={goal.date} className="flex flex-col items-center">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium",
                                                        goal.completed ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                                                    )}>
                                                        {goal.completed ? '✓' : format(new Date(goal.date), 'd')}
                                                    </div>
                                                    <span className="text-xs mt-1 text-muted-foreground">
                                                        {format(new Date(goal.date), 'EEE')}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Mock Performance Trend */}
                            {dashboard?.score_trend && dashboard.score_trend.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-emerald-500" />Mock Score Trend
                                        </CardTitle>
                                        <CardDescription>Your performance over time</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-40 flex items-end gap-2">
                                            {dashboard.score_trend.slice(-15).map((point, i) => {
                                                const maxScore = Math.max(...dashboard.score_trend.map(p => p.score), 200);
                                                return (
                                                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                        <span className="text-xs font-medium">{point.score}</span>
                                                        <div
                                                            className="w-full bg-primary/20 hover:bg-primary/40 rounded-t transition-colors"
                                                            style={{ height: `${(point.score / maxScore) * 100}%` }}
                                                        />
                                                        <span className="text-xs text-muted-foreground">
                                                            {format(new Date(point.date), 'M/d')}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Predicted Percentile */}
                            {aiAnalysis?.predicted_percentile && (
                                <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30">
                                    <CardContent className="pt-6 text-center">
                                        <p className="text-sm text-muted-foreground">Predicted CAT Percentile</p>
                                        <p className="text-5xl font-bold text-violet-400 mt-2">
                                            {aiAnalysis.predicted_percentile}%ile
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Speed Analytics */}
                            {speedAnalytics && speedAnalytics.topics.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Clock className="h-5 w-5 text-blue-500" />Speed Analytics
                                        </CardTitle>
                                        <CardDescription>Avg time per topic vs target • Top {speedAnalytics.percentile_speed}% speed</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {speedAnalytics.topics.slice(0, 5).map((topic) => (
                                            <div key={topic.id} className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm font-medium">{topic.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {Math.round(topic.avg_time_seconds / 60)}m avg / {Math.round(topic.target_time_seconds / 60)}m target
                                                        </span>
                                                    </div>
                                                    <Progress value={Math.min((topic.target_time_seconds / Math.max(topic.avg_time_seconds, 1)) * 100, 100)} className="h-2" />
                                                </div>
                                                <Badge variant={topic.improvement_percent >= 0 ? 'default' : 'destructive'} className="text-xs">
                                                    {topic.improvement_percent >= 0 ? '+' : ''}{topic.improvement_percent}%
                                                </Badge>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </TabsContent>

                {/* Revisions Tab */}
                <TabsContent value="revisions" className="space-y-6">
                    <div className="flex justify-end gap-2">
                        <Button
                            variant={revisionView === 'list' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setRevisionView('list')}
                        >
                            List
                        </Button>
                        <Button
                            variant={revisionView === 'calendar' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setRevisionView('calendar')}
                        >
                            Calendar
                        </Button>
                    </div>

                    {/* Revision Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card className={cn(grouped.overdue.length > 0 && "border-red-500/50")}>
                            <CardContent className="pt-6 text-center">
                                <p className="text-3xl font-bold text-red-500">{grouped.overdue.length}</p>
                                <p className="text-sm text-muted-foreground">Overdue</p>
                            </CardContent>
                        </Card>
                        <Card className={cn(grouped.today.length > 0 && "border-amber-500/50")}>
                            <CardContent className="pt-6 text-center">
                                <p className="text-3xl font-bold text-amber-500">{grouped.today.length}</p>
                                <p className="text-sm text-muted-foreground">Due Today</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <p className="text-3xl font-bold text-primary">{grouped.upcoming.length}</p>
                                <p className="text-sm text-muted-foreground">Upcoming</p>
                            </CardContent>
                        </Card>
                    </div>

                    {isRevisionsLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : revisionView === 'list' ? (
                        <div className="space-y-4">
                            {grouped.overdue.length > 0 && (
                                <RevisionGroup
                                    title="Overdue"
                                    icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                                    revisions={grouped.overdue}
                                    onComplete={setCompleteDialog}
                                    variant="destructive"
                                />
                            )}
                            {grouped.today.length > 0 && (
                                <RevisionGroup
                                    title="Due Today"
                                    icon={<Clock className="h-5 w-5 text-amber-500" />}
                                    revisions={grouped.today}
                                    onComplete={setCompleteDialog}
                                />
                            )}
                            <RevisionGroup
                                title="Upcoming"
                                icon={<Calendar className="h-5 w-5 text-primary" />}
                                revisions={grouped.upcoming}
                                onComplete={setCompleteDialog}
                                emptyMessage="No upcoming revisions"
                            />
                            {grouped.completed.length > 0 && (
                                <RevisionGroup
                                    title="Recently Completed"
                                    icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                                    revisions={grouped.completed}
                                    onComplete={() => { }}
                                />
                            )}
                        </div>
                    ) : (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1))}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1))}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                        <div key={d} className="py-2 font-medium text-muted-foreground">{d}</div>
                                    ))}
                                    {calendarDays.map(day => {
                                        const key = format(day, 'yyyy-MM-dd');
                                        const dayRevisions = revisionsByDate[key] || [];
                                        return (
                                            <div
                                                key={key}
                                                className={cn(
                                                    "p-2 min-h-[60px] border rounded-lg",
                                                    isToday(day) && "bg-primary/5 border-primary"
                                                )}
                                            >
                                                <p className={cn("text-sm", isToday(day) && "font-bold text-primary")}>
                                                    {format(day, 'd')}
                                                </p>
                                                {dayRevisions.length > 0 && (
                                                    <div className="mt-1 flex flex-wrap gap-0.5">
                                                        {dayRevisions.slice(0, 3).map(r => (
                                                            <div
                                                                key={r.id}
                                                                className={cn(
                                                                    "w-2 h-2 rounded-full",
                                                                    r.status === 'overdue' ? 'bg-red-500' :
                                                                        r.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                                                                )}
                                                            />
                                                        ))}
                                                        {dayRevisions.length > 3 && (
                                                            <span className="text-xs text-muted-foreground">
                                                                +{dayRevisions.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* AI Insights Tab */}
                <TabsContent value="insights" className="space-y-6">
                    {isAnalysisLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin mb-4" />
                            <p className="text-muted-foreground">Analyzing your performance...</p>
                        </div>
                    ) : aiAnalysis ? (
                        <>
                            {/* Strengths & Weaknesses */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-emerald-500">
                                            <TrendingUp className="h-5 w-5" />Strengths
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {aiAnalysis.strengths.map((s, i) => (
                                            <div key={i} className="p-3 rounded-lg bg-emerald-500/10">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium">{s.topic}</span>
                                                    <Badge variant="secondary">{s.accuracy}%</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{s.insight}</p>
                                            </div>
                                        ))}
                                        {aiAnalysis.strengths.length === 0 && (
                                            <p className="text-muted-foreground">Keep practicing to identify strengths</p>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-red-500">
                                            <TrendingDown className="h-5 w-5" />Areas to Improve
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {aiAnalysis.weaknesses.map((w, i) => (
                                            <div key={i} className="p-3 rounded-lg bg-red-500/10">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium">{w.topic}</span>
                                                    <Badge variant="destructive">{w.accuracy}%</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{w.suggestion}</p>
                                            </div>
                                        ))}
                                        {aiAnalysis.weaknesses.length === 0 && (
                                            <p className="text-muted-foreground">Great job! No major weak areas</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Overall Assessment */}
                            {aiAnalysis.overall_assessment && (
                                <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Brain className="h-5 w-5 text-violet-400" />Overall Assessment
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground">{aiAnalysis.overall_assessment}</p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* AI Study Plan */}
                            {studyPlan && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Sparkles className="h-5 w-5 text-violet-500" />AI Study Plan
                                        </CardTitle>
                                        <CardDescription>
                                            Week of {format(new Date(studyPlan.week_start), 'MMM d')} - {format(new Date(studyPlan.week_end), 'MMM d')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid md:grid-cols-7 gap-2">
                                            {studyPlan.daily_plans.map((day, i) => (
                                                <div key={i} className="p-3 rounded-lg bg-muted/50">
                                                    <p className="font-medium text-sm mb-2">{day.day}</p>
                                                    <div className="space-y-1">
                                                        {day.tasks.slice(0, 3).map((task, j) => (
                                                            <div key={j} className="text-xs p-1.5 rounded bg-background">
                                                                <Badge variant="outline" className="text-[10px] mb-1">
                                                                    {task.type}
                                                                </Badge>
                                                                <p className="line-clamp-2">{task.title}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        {day.estimated_hours}h planned
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                        {studyPlan.recommendations.length > 0 && (
                                            <div className="mt-4 p-3 rounded-lg bg-violet-500/10">
                                                <p className="font-medium text-sm mb-2">Recommendations</p>
                                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                                    {studyPlan.recommendations.map((r, i) => (
                                                        <li key={i}>{r}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground">Complete more practice to unlock AI insights</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* Complete Revision Dialog */}
            <CompleteRevisionDialog
                open={!!completeDialog}
                revision={completeDialog}
                onOpenChange={(o) => !o && setCompleteDialog(null)}
                onComplete={(notes) => completeDialog && completeMutation.mutate({ id: completeDialog.id, notes })}
                isLoading={completeMutation.isPending}
            />
        </div>
    );
}

// Revision Group Component
function RevisionGroup({
    title,
    icon,
    revisions,
    onComplete,
    variant,
    emptyMessage,
}: {
    title: string;
    icon: React.ReactNode;
    revisions: Revision[];
    onComplete: (r: Revision) => void;
    variant?: 'destructive';
    emptyMessage?: string;
}) {
    if (revisions.length === 0 && !emptyMessage) return null;

    return (
        <Card className={cn(variant === 'destructive' && "border-red-500/50")}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    {icon}{title}
                    <Badge variant="secondary" className="ml-2">{revisions.length}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {revisions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">{emptyMessage}</p>
                ) : (
                    <div className="space-y-2">
                        {revisions.map(r => (
                            <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                                <div>
                                    <p className="font-medium">{r.topic?.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Revision #{r.revision_number} • {format(new Date(r.scheduled_date), 'MMM d')}
                                    </p>
                                </div>
                                {r.status !== 'completed' && (
                                    <Button size="sm" onClick={() => onComplete(r)}>
                                        <CheckCircle2 className="h-4 w-4 mr-1" />Complete
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Complete Revision Dialog
function CompleteRevisionDialog({
    open,
    revision,
    onOpenChange,
    onComplete,
    isLoading,
}: {
    open: boolean;
    revision: Revision | null;
    onOpenChange: (o: boolean) => void;
    onComplete: (notes?: string) => void;
    isLoading: boolean;
}) {
    const [notes, setNotes] = useState('');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Complete Revision</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p>Mark <strong>{revision?.topic?.title}</strong> as revised?</p>
                    <div>
                        <Label>Notes (optional)</Label>
                        <Textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Any observations..."
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => onComplete(notes)} disabled={isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Complete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
