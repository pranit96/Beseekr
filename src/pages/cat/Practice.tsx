// CAT Practice Page - Unified Practice Hub (Practice + Mistakes + Bookmarks)
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
    Target,
    Play,
    Clock,
    Zap,
    Crosshair,
    Timer,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Bookmark,
    Star,
    RefreshCw,
    Brain,
    Plus,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { catApi } from '@/api/cat';
import type { SessionType, StartPracticePayload, Mistake, MistakeType, Bookmark as BookmarkType } from '@/types/cat';

const sessionTypes: { value: SessionType; label: string; desc: string; icon: typeof Timer }[] = [
    { value: 'timed', label: 'Timed Practice', desc: 'Standard practice with time limit', icon: Timer },
    { value: 'untimed', label: 'Untimed', desc: 'Take your time, no pressure', icon: Clock },
    { value: 'speed_drill', label: 'Speed Drill', desc: 'Fast-paced to improve speed', icon: Zap },
    { value: 'accuracy_focus', label: 'Accuracy Focus', desc: 'Quality over quantity', icon: Crosshair },
];

const mistakeTypes: Record<MistakeType, { label: string; color: string }> = {
    concept: { label: 'Concept', color: 'bg-red-500' },
    calculation: { label: 'Calculation', color: 'bg-orange-500' },
    silly_error: { label: 'Silly Mistake', color: 'bg-yellow-500' },
    time_pressure: { label: 'Time Pressure', color: 'bg-blue-500' },
    misread: { label: 'Misread Question', color: 'bg-purple-500' },
};

export default function Practice() {
    const [activeTab, setActiveTab] = useState('practice');
    const [startDialogOpen, setStartDialogOpen] = useState(false);
    const [reviewMistake, setReviewMistake] = useState<Mistake | null>(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Practice data
    const { data: subjects } = useQuery({
        queryKey: ['cat-subjects'],
        queryFn: () => catApi.getSubjects(),
        staleTime: 5 * 60 * 1000,
    });

    const { data: historyData, isLoading: isHistoryLoading } = useQuery({
        queryKey: ['cat-practice-history'],
        queryFn: () => catApi.getPracticeHistory({ limit: 20 }),
        staleTime: 60 * 1000,
    });

    // Mistakes data
    const { data: mistakes = [], isLoading: isMistakesLoading } = useQuery({
        queryKey: ['cat-mistakes'],
        queryFn: () => catApi.getMistakes({ reviewed: false }),
        staleTime: 60 * 1000,
    });

    // Bookmarks data
    const { data: bookmarks = [], isLoading: isBookmarksLoading } = useQuery({
        queryKey: ['cat-bookmarks'],
        queryFn: () => catApi.getBookmarks(),
        staleTime: 60 * 1000,
    });

    const history = historyData?.items || [];
    const unreviewedMistakes = mistakes.filter(m => !m.reviewed);

    const totalQuestions = history.reduce((sum, s) => sum + s.questions_attempted, 0);
    const totalCorrect = history.reduce((sum, s) => sum + s.correct_answers, 0);
    const avgAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    // Review mistake mutation
    const reviewMutation = useMutation({
        mutationFn: ({ id, notes }: { id: string; notes: string }) => catApi.reviewMistake(id, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cat-mistakes'] });
            toast({ title: 'Mistake reviewed!' });
            setReviewMistake(null);
        },
    });

    // Remove bookmark mutation
    const removeBookmarkMutation = useMutation({
        mutationFn: (questionId: string) => catApi.removeBookmark(questionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cat-bookmarks'] });
            toast({ title: 'Bookmark removed' });
        },
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Target className="h-7 w-7 text-primary" />
                        Practice
                    </h1>
                    <p className="text-muted-foreground">Practice, review mistakes & saved questions</p>
                </div>
                <Button onClick={() => setStartDialogOpen(true)} className="bg-gradient-to-r from-emerald-500 to-teal-600">
                    <Play className="h-4 w-4 mr-2" />Start Practice
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-emerald-500">{totalQuestions}</p>
                                <p className="text-xs text-muted-foreground">Questions Done</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                <Target className="h-5 w-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-amber-500">{avgAccuracy.toFixed(0)}%</p>
                                <p className="text-xs text-muted-foreground">Accuracy</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-rose-500/10 to-red-500/10 border-rose-500/20">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-rose-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-rose-500">{mistakes.length}</p>
                                <p className="text-xs text-muted-foreground">Mistakes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                <Bookmark className="h-5 w-5 text-violet-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-violet-500">{bookmarks.length}</p>
                                <p className="text-xs text-muted-foreground">Saved</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="practice" className="gap-2">
                        <Target className="h-4 w-4" />Practice
                    </TabsTrigger>
                    <TabsTrigger value="mistakes" className="gap-2">
                        <AlertCircle className="h-4 w-4" />Mistakes
                        {mistakes.length > 0 && (
                            <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                                {mistakes.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="saved" className="gap-2">
                        <Bookmark className="h-4 w-4" />Saved
                    </TabsTrigger>
                </TabsList>

                {/* Practice Tab */}
                <TabsContent value="practice" className="space-y-6">
                    {/* Session Type Cards */}
                    <div className="grid md:grid-cols-4 gap-4">
                        {sessionTypes.map((type) => (
                            <motion.div key={type.value} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Card
                                    className="cursor-pointer hover:border-primary/50 transition-colors h-full"
                                    onClick={() => setStartDialogOpen(true)}
                                >
                                    <CardContent className="pt-6">
                                        <div className="flex flex-col items-center text-center space-y-2">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                <type.icon className="h-5 w-5 text-primary" />
                                            </div>
                                            <h3 className="font-semibold">{type.label}</h3>
                                            <p className="text-xs text-muted-foreground">{type.desc}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Recent Sessions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Sessions</CardTitle>
                            <CardDescription>Your practice history</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isHistoryLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : history.length > 0 ? (
                                <div className="space-y-3">
                                    {history.slice(0, 10).map(session => {
                                        const accuracy = session.questions_attempted > 0
                                            ? (session.correct_answers / session.questions_attempted) * 100
                                            : 0;
                                        const typeInfo = sessionTypes.find(t => t.value === session.session_type);
                                        return (
                                            <div key={session.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        {typeInfo && <typeInfo.icon className="h-5 w-5 text-primary" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{typeInfo?.label || session.session_type}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {format(new Date(session.started_at), 'MMM d, h:mm a')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right hidden sm:block">
                                                        <p className="font-semibold">{session.correct_answers}/{session.questions_attempted}</p>
                                                        <p className="text-xs text-muted-foreground">{accuracy.toFixed(0)}%</p>
                                                    </div>
                                                    <div className="w-16">
                                                        <Progress
                                                            value={accuracy}
                                                            className={cn(
                                                                "h-2",
                                                                accuracy >= 70 ? "[&>div]:bg-emerald-500" :
                                                                    accuracy >= 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                                    <p className="text-muted-foreground">No practice sessions yet</p>
                                    <Button onClick={() => setStartDialogOpen(true)} className="mt-4">
                                        Start Your First Session
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Mistakes Tab */}
                <TabsContent value="mistakes" className="space-y-6">
                    {/* Mistakes by Type */}
                    <div className="grid grid-cols-5 gap-2">
                        {(Object.entries(mistakeTypes) as [MistakeType, typeof mistakeTypes[MistakeType]][]).map(([type, info]) => {
                            const count = mistakes.filter(m => m.mistake_type === type).length;
                            return (
                                <Card key={type} className="text-center">
                                    <CardContent className="pt-4">
                                        <div className={cn("h-3 w-3 rounded-full mx-auto mb-2", info.color)} />
                                        <p className="text-lg font-bold">{count}</p>
                                        <p className="text-xs text-muted-foreground">{info.label}</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Mistakes List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                Unreviewed Mistakes
                            </CardTitle>
                            <CardDescription>Click to review and learn from your errors</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isMistakesLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : mistakes.length > 0 ? (
                                <div className="space-y-3">
                                    {mistakes.map(mistake => {
                                        const typeInfo = mistakeTypes[mistake.mistake_type];
                                        return (
                                            <motion.div
                                                key={mistake.id}
                                                whileHover={{ x: 4 }}
                                                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer"
                                                onClick={() => setReviewMistake(mistake)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("h-3 w-3 rounded-full", typeInfo?.color || 'bg-gray-500')} />
                                                    <div>
                                                        <p className="font-medium">{mistake.question_text?.slice(0, 60)}...</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {typeInfo?.label} • {format(new Date(mistake.created_at), 'MMM d')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="outline">
                                                    <RefreshCw className="h-4 w-4 mr-1" />Review
                                                </Button>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500 opacity-50" />
                                    <p className="text-muted-foreground">No unreviewed mistakes!</p>
                                    <p className="text-sm text-muted-foreground">Keep practicing to identify areas to improve</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Saved Tab */}
                <TabsContent value="saved" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bookmark className="h-5 w-5 text-violet-500" />
                                Saved Questions
                            </CardTitle>
                            <CardDescription>Questions you've bookmarked for later review</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isBookmarksLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : bookmarks.length > 0 ? (
                                <div className="space-y-3">
                                    {bookmarks.map((bookmark: BookmarkType) => (
                                        <div key={bookmark.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                                            <div className="flex items-center gap-4">
                                                <Bookmark className="h-5 w-5 text-violet-500" />
                                                <div>
                                                    <p className="font-medium">{bookmark.question_text?.slice(0, 60)}...</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {bookmark.collection_name || 'Saved'} • {format(new Date(bookmark.created_at), 'MMM d')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {bookmark.importance && (
                                                    <div className="flex">
                                                        {Array.from({ length: bookmark.importance === 'must_revise' ? 4 : bookmark.importance === 'high' ? 3 : bookmark.importance === 'medium' ? 2 : 1 }).map((_, i) => (
                                                            <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                        ))}
                                                    </div>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => removeBookmarkMutation.mutate(bookmark.question_id)}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Bookmark className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                                    <p className="text-muted-foreground">No saved questions yet</p>
                                    <p className="text-sm text-muted-foreground">Bookmark questions during practice to review later</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Start Practice Dialog */}
            <StartPracticeDialog
                open={startDialogOpen}
                onOpenChange={setStartDialogOpen}
                subjects={subjects || []}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['cat-practice'] });
                    setStartDialogOpen(false);
                    toast({ title: 'Practice started!' });
                }}
            />

            {/* Review Mistake Dialog */}
            <ReviewMistakeDialog
                open={!!reviewMistake}
                mistake={reviewMistake}
                onOpenChange={(o) => !o && setReviewMistake(null)}
                onSubmit={(notes) => reviewMistake && reviewMutation.mutate({ id: reviewMistake.id, notes })}
                isLoading={reviewMutation.isPending}
            />
        </div>
    );
}

// Start Practice Dialog
function StartPracticeDialog({
    open,
    onOpenChange,
    subjects,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    subjects: any[];
    onSuccess: () => void;
}) {
    const [sessionType, setSessionType] = useState<SessionType>('timed');
    const [subjectId, setSubjectId] = useState('all');
    const [questionCount, setQuestionCount] = useState('10');
    const [timeLimit, setTimeLimit] = useState('15');
    const { toast } = useToast();

    const mutation = useMutation({
        mutationFn: (payload: StartPracticePayload) => catApi.startPractice(payload),
        onSuccess: () => onSuccess(),
        onError: () => toast({ title: 'Failed to start practice', variant: 'destructive' }),
    });

    const handleStart = () => {
        mutation.mutate({
            session_type: sessionType,
            subject_id: subjectId !== 'all' ? subjectId : undefined,
            question_count: parseInt(questionCount),
            time_limit_minutes: sessionType === 'timed' ? parseInt(timeLimit) : undefined,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Start Practice Session</DialogTitle>
                    <DialogDescription>Configure your practice</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label>Session Type</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {sessionTypes.map(type => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setSessionType(type.value)}
                                    className={cn(
                                        "p-3 rounded-lg border text-left transition-colors",
                                        sessionType === type.value ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                                    )}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <type.icon className="h-4 w-4 text-primary" />
                                        <span className="font-medium">{type.label}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{type.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <Label>Subject (optional)</Label>
                        <Select value={subjectId} onValueChange={setSubjectId}>
                            <SelectTrigger><SelectValue placeholder="All subjects" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Subjects</SelectItem>
                                {subjects.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Questions</Label>
                            <Input
                                type="number"
                                value={questionCount}
                                onChange={e => setQuestionCount(e.target.value)}
                                min="5"
                                max="50"
                            />
                        </div>
                        {sessionType === 'timed' && (
                            <div>
                                <Label>Time Limit (min)</Label>
                                <Input
                                    type="number"
                                    value={timeLimit}
                                    onChange={e => setTimeLimit(e.target.value)}
                                    min="5"
                                    max="60"
                                />
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleStart}
                        disabled={mutation.isPending}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600"
                    >
                        {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        <Play className="h-4 w-4 mr-2" />Start
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Review Mistake Dialog
function ReviewMistakeDialog({
    open,
    mistake,
    onOpenChange,
    onSubmit,
    isLoading,
}: {
    open: boolean;
    mistake: Mistake | null;
    onOpenChange: (o: boolean) => void;
    onSubmit: (notes: string) => void;
    isLoading: boolean;
}) {
    const [notes, setNotes] = useState('');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Review Mistake</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {mistake && (
                        <>
                            <div className="p-4 rounded-lg bg-muted/50">
                                <p className="font-medium mb-2">{mistake.question_text}</p>
                                <div className="flex items-center gap-2 text-sm">
                                    <Badge variant="outline" className={cn(
                                        mistakeTypes[mistake.mistake_type]?.color.replace('bg-', 'border-'),
                                        'text-foreground'
                                    )}>
                                        {mistakeTypes[mistake.mistake_type]?.label}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-2">
                                    <strong>Your answer:</strong> {mistake.user_answer}
                                </p>
                                <p className="text-sm text-emerald-500">
                                    <strong>Correct answer:</strong> {mistake.correct_answer}
                                </p>
                            </div>
                            {mistake.explanation && (
                                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <p className="text-sm">{mistake.explanation}</p>
                                </div>
                            )}
                        </>
                    )}
                    <div>
                        <Label>What did you learn?</Label>
                        <Textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Write notes to help you remember..."
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => onSubmit(notes)} disabled={isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        <CheckCircle2 className="h-4 w-4 mr-2" />Mark as Reviewed
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
