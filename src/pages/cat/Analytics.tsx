import { useQuery } from '@tanstack/react-query';
import { catApi } from '@/api/cat';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { BarChart3, TrendingUp, TrendingDown, Target, Flame, Brain, Sparkles, Loader2, Calendar, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function Analytics() {
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

    if (isDashboardLoading) {
        return <div className="flex justify-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    const streak = dashboard?.streak;
    const mockPerf = dashboard?.mock_performance;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BarChart3 className="h-7 w-7 text-primary" />
                    Analytics & Goals
                </h1>
                <p className="text-muted-foreground">Track your progress and performance</p>
            </div>

            {/* Streak & Overview */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card className="border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                    <CardContent className="pt-6 text-center">
                        <Flame className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                        <p className="text-4xl font-bold text-amber-500">{streak?.current || 0}</p>
                        <p className="text-sm text-muted-foreground">Day Streak</p>
                        <p className="text-xs mt-1">Best: {streak?.longest || 0} days</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <p className="text-4xl font-bold text-primary">{mockPerf?.total_mocks || 0}</p>
                        <p className="text-sm text-muted-foreground">Mocks Taken</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                        <p className="text-4xl font-bold text-emerald-500">{mockPerf?.average_score?.toFixed(0) || '-'}</p>
                        <p className="text-sm text-muted-foreground">Avg Score</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-violet-500" />
                        <p className="text-4xl font-bold text-violet-500">{dashboard?.syllabus_progress?.overall_completion || 0}%</p>
                        <p className="text-sm text-muted-foreground">Syllabus Done</p>
                    </CardContent>
                </Card>
            </div>

            {/* Goals History */}
            {goalsHistory && goalsHistory.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Daily Goals (Last 14 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-1 justify-between">
                            {goalsHistory.slice(-14).map((goal, i) => (
                                <div key={goal.date} className="flex flex-col items-center">
                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium",
                                        goal.completed ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground")}>
                                        {goal.completed ? '✓' : format(new Date(goal.date), 'd')}
                                    </div>
                                    <span className="text-xs mt-1 text-muted-foreground">{format(new Date(goal.date), 'EEE')}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Mock Performance Trend */}
            {mockPerf && mockPerf.trend.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-500" />Mock Score Trend</CardTitle>
                        <CardDescription>Your performance over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-40 flex items-end gap-2">
                            {mockPerf.trend.slice(-15).map((point, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-xs font-medium">{point.score}</span>
                                    <div className="w-full bg-primary/20 hover:bg-primary/40 rounded-t transition-colors"
                                        style={{ height: `${(point.score / (mockPerf.best_score || 200)) * 100}%` }} />
                                    <span className="text-xs text-muted-foreground">{format(new Date(point.date), 'M/d')}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* AI Analysis */}
            {isAnalysisLoading ? (
                <Card><CardContent className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /><p className="text-sm text-muted-foreground mt-2">Analyzing your performance...</p></CardContent></Card>
            ) : aiAnalysis && (
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-emerald-500"><TrendingUp className="h-5 w-5" />Strengths</CardTitle>
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
                            {aiAnalysis.strengths.length === 0 && <p className="text-muted-foreground">Keep practicing to identify strengths</p>}
                        </CardContent>
                    </Card>

                    {/* Weaknesses */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-500"><TrendingDown className="h-5 w-5" />Areas to Improve</CardTitle>
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
                            {aiAnalysis.weaknesses.length === 0 && <p className="text-muted-foreground">Great job! No major weak areas</p>}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* AI Study Plan */}
            {studyPlan && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-violet-500" />AI Study Plan</CardTitle>
                        <CardDescription>Week of {format(new Date(studyPlan.week_start), 'MMM d')} - {format(new Date(studyPlan.week_end), 'MMM d')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-7 gap-2">
                            {studyPlan.daily_plans.map((day, i) => (
                                <div key={i} className="p-3 rounded-lg bg-muted/50">
                                    <p className="font-medium text-sm mb-2">{day.day}</p>
                                    <div className="space-y-1">
                                        {day.tasks.slice(0, 3).map((task, j) => (
                                            <div key={j} className="text-xs p-1.5 rounded bg-background">
                                                <Badge variant="outline" className="text-[10px] mb-1">{task.type}</Badge>
                                                <p className="line-clamp-2">{task.title}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">{day.estimated_hours}h planned</p>
                                </div>
                            ))}
                        </div>
                        {studyPlan.recommendations.length > 0 && (
                            <div className="mt-4 p-3 rounded-lg bg-violet-500/10">
                                <p className="font-medium text-sm mb-2">Recommendations</p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                    {studyPlan.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Overall Assessment */}
            {aiAnalysis?.overall_assessment && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" />Overall Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{aiAnalysis.overall_assessment}</p>
                        {aiAnalysis.predicted_percentile && (
                            <div className="mt-4 p-4 rounded-lg bg-primary/10 text-center">
                                <p className="text-sm text-muted-foreground">Predicted Percentile</p>
                                <p className="text-3xl font-bold text-primary">{aiAnalysis.predicted_percentile}%ile</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
