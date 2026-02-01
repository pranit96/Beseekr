import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catApi } from '@/api/cat';
import { SessionType, StartPracticePayload } from '@/types/cat';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Target, Play, Clock, Zap, Crosshair, Timer, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const sessionTypes: { value: SessionType; label: string; desc: string; icon: typeof Timer }[] = [
    { value: 'timed', label: 'Timed Practice', desc: 'Standard practice with time limit', icon: Timer },
    { value: 'untimed', label: 'Untimed', desc: 'Take your time, no pressure', icon: Clock },
    { value: 'speed_drill', label: 'Speed Drill', desc: 'Fast-paced to improve speed', icon: Zap },
    { value: 'accuracy_focus', label: 'Accuracy Focus', desc: 'Quality over quantity', icon: Crosshair },
];

export default function Practice() {
    const [startDialogOpen, setStartDialogOpen] = useState(false);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: subjects } = useQuery({
        queryKey: ['cat-subjects'],
        queryFn: () => catApi.getSubjects(),
        staleTime: 5 * 60 * 1000,
    });

    const { data: historyData, isLoading } = useQuery({
        queryKey: ['cat-practice-history'],
        queryFn: () => catApi.getPracticeHistory({ limit: 20 }),
        staleTime: 1 * 60 * 1000,
    });

    const history = historyData?.items || [];
    const totalQuestions = history.reduce((sum, s) => sum + s.questions_attempted, 0);
    const totalCorrect = history.reduce((sum, s) => sum + s.correct_answers, 0);
    const avgAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Target className="h-7 w-7 text-primary" />
                        Practice Sessions
                    </h1>
                    <p className="text-muted-foreground">Focused practice to improve skills</p>
                </div>
                <Button onClick={() => setStartDialogOpen(true)} className="bg-gradient-to-r from-emerald-500 to-teal-600">
                    <Play className="h-4 w-4 mr-2" />Start Practice
                </Button>
            </div>

            {/* Stats */}
            {history.length > 0 && (
                <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-3xl font-bold text-primary">{history.length}</p>
                            <p className="text-sm text-muted-foreground">Sessions</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-3xl font-bold text-emerald-500">{totalQuestions}</p>
                            <p className="text-sm text-muted-foreground">Questions Practiced</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-3xl font-bold text-amber-500">{avgAccuracy.toFixed(1)}%</p>
                            <p className="text-sm text-muted-foreground">Average Accuracy</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* History */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Sessions</CardTitle>
                    <CardDescription>Your practice history</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : history.length > 0 ? (
                        <div className="space-y-3">
                            {history.map(session => {
                                const accuracy = session.questions_attempted > 0 ? (session.correct_answers / session.questions_attempted) * 100 : 0;
                                const typeInfo = sessionTypes.find(t => t.value === session.session_type);
                                return (
                                    <div key={session.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                {typeInfo && <typeInfo.icon className="h-5 w-5 text-primary" />}
                                            </div>
                                            <div>
                                                <p className="font-medium">{typeInfo?.label || session.session_type}</p>
                                                <p className="text-sm text-muted-foreground">{format(new Date(session.started_at), 'MMM d, h:mm a')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-semibold">{session.correct_answers}/{session.questions_attempted}</p>
                                                <p className="text-xs text-muted-foreground">{accuracy.toFixed(0)}% accuracy</p>
                                            </div>
                                            <div className="w-20">
                                                <Progress value={accuracy} className={cn("h-2", accuracy >= 70 ? "[&>div]:bg-emerald-500" : accuracy >= 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500")} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">No practice sessions yet</div>
                    )}
                </CardContent>
            </Card>

            <StartPracticeDialog open={startDialogOpen} onOpenChange={setStartDialogOpen} subjects={subjects || []}
                onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['cat-practice'] }); setStartDialogOpen(false); toast({ title: 'Practice started!' }); }} />
        </div>
    );
}

function StartPracticeDialog({ open, onOpenChange, subjects, onSuccess }: { open: boolean; onOpenChange: (o: boolean) => void; subjects: any[]; onSuccess: () => void }) {
    const [sessionType, setSessionType] = useState<SessionType>('timed');
    const [subjectId, setSubjectId] = useState('');
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
            subject_id: subjectId || undefined,
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
                                <button key={type.value} type="button" onClick={() => setSessionType(type.value)}
                                    className={cn("p-3 rounded-lg border text-left transition-colors", sessionType === type.value ? 'border-primary bg-primary/5' : 'hover:bg-muted')}>
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
                                <SelectItem value="">All Subjects</SelectItem>
                                {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Questions</Label>
                            <Input type="number" value={questionCount} onChange={e => setQuestionCount(e.target.value)} min="5" max="50" />
                        </div>
                        {sessionType === 'timed' && (
                            <div>
                                <Label>Time Limit (min)</Label>
                                <Input type="number" value={timeLimit} onChange={e => setTimeLimit(e.target.value)} min="5" max="60" />
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleStart} disabled={mutation.isPending} className="bg-gradient-to-r from-emerald-500 to-teal-600">
                        {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        <Play className="h-4 w-4 mr-2" />Start
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
