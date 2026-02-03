import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catApi } from '@/api/cat';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileQuestion, Clock, ChevronLeft, ChevronRight, Flag, CheckCircle2, X, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function MockTest() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const [currentQ, setCurrentQ] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, { answer: string; time: number }>>({});
    const [timeSpent, setTimeSpent] = useState(0);
    const [showSubmitDialog, setShowSubmitDialog] = useState(false);
    const [showAbandonDialog, setShowAbandonDialog] = useState(false);

    const { data: mock, isLoading } = useQuery({
        queryKey: ['cat-mock', id],
        queryFn: () => catApi.getMock(id!),
        enabled: !!id,
        refetchOnWindowFocus: false,
    });

    const submitMutation = useMutation({
        mutationFn: ({ questionId, answer, time }: { questionId: string; answer: string; time: number }) =>
            catApi.submitMockAnswer(id!, { question_id: questionId, answer, time_spent: time }),
    });

    const completeMutation = useMutation({
        mutationFn: () => catApi.completeMock(id!),
        onSuccess: () => { toast({ title: 'Mock completed!' }); queryClient.invalidateQueries({ queryKey: ['cat-mock', id] }); },
    });

    const abandonMutation = useMutation({
        mutationFn: () => catApi.abandonMock(id!),
        onSuccess: () => { toast({ title: 'Mock abandoned' }); navigate('/cat/mocks'); },
    });

    // Timer
    useEffect(() => {
        if (mock?.status !== 'in_progress') return;
        const interval = setInterval(() => setTimeSpent(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, [mock?.status]);

    const currentQuestion = mock?.questions?.[currentQ];

    const handleAnswer = useCallback((answer: string) => {
        setSelectedAnswer(answer);
        if (currentQuestion) {
            setAnswers(prev => ({ ...prev, [currentQuestion.id]: { answer, time: timeSpent } }));
        }
    }, [currentQuestion, timeSpent]);

    const handleNext = () => {
        if (currentQuestion && selectedAnswer) {
            submitMutation.mutate({ questionId: currentQuestion.id, answer: selectedAnswer, time: answers[currentQuestion.id]?.time || 0 });
        }
        if (mock && currentQ < mock.questions.length - 1) {
            setCurrentQ(currentQ + 1);
            setSelectedAnswer(answers[mock.questions[currentQ + 1]?.id]?.answer || null);
        }
    };

    const handlePrev = () => {
        if (currentQ > 0) {
            setCurrentQ(currentQ - 1);
            if (mock) setSelectedAnswer(answers[mock.questions[currentQ - 1]?.id]?.answer || null);
        }
    };

    const handleSubmit = () => {
        if (currentQuestion && selectedAnswer) {
            submitMutation.mutate({ questionId: currentQuestion.id, answer: selectedAnswer, time: answers[currentQuestion.id]?.time || 0 });
        }
        completeMutation.mutate();
        setShowSubmitDialog(false);
    };

    if (isLoading) return <div className="flex justify-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!mock) return <div className="text-center py-16 text-muted-foreground">Mock not found</div>;

    // Show results if completed
    if (mock.status === 'completed') {
        return <MockResults mock={mock} onBack={() => navigate('/cat/mocks')} />;
    }

    const answered = Object.keys(answers).length;
    const progress = (answered / mock.total_questions) * 100;
    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => setShowAbandonDialog(true)}>
                    <X className="h-4 w-4 mr-2" />Exit
                </Button>
                <div className="flex items-center gap-4">
                    <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{formatTime(timeSpent)}</Badge>
                    <Badge>{currentQ + 1} / {mock.total_questions}</Badge>
                </div>
            </div>

            <Progress value={progress} className="h-2" />

            {/* Question Navigation */}
            <div className="flex gap-1 flex-wrap">
                {mock.questions.map((q, i) => (
                    <button key={q.id} onClick={() => { setCurrentQ(i); setSelectedAnswer(answers[q.id]?.answer || null); }}
                        className={cn("w-8 h-8 rounded text-sm font-medium transition-colors",
                            i === currentQ ? 'bg-primary text-primary-foreground' : answers[q.id] ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted hover:bg-muted/80')}>
                        {i + 1}
                    </button>
                ))}
            </div>

            {/* Question */}
            {currentQuestion && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Question {currentQ + 1}</span>
                            <Badge variant="outline">{currentQuestion.section.toUpperCase()}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-lg">{currentQuestion.question_text}</p>
                        {currentQuestion.options && currentQuestion.options.length > 0 ? (
                            <RadioGroup value={selectedAnswer || ''} onValueChange={handleAnswer}>
                                {currentQuestion.options.map(opt => (
                                    <div key={opt.key} className={cn("flex items-center space-x-3 p-3 rounded-lg border transition-colors",
                                        selectedAnswer === opt.key ? 'border-primary bg-primary/5' : 'hover:bg-muted/50')}>
                                        <RadioGroupItem value={opt.key} id={opt.key} />
                                        <Label htmlFor={opt.key} className="flex-1 cursor-pointer">{opt.key}. {opt.value}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        ) : (
                            <div className="p-4 rounded-lg bg-muted/50 text-center text-muted-foreground">
                                No answer options available for this question
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
                <Button variant="outline" onClick={handlePrev} disabled={currentQ === 0}>
                    <ChevronLeft className="h-4 w-4 mr-2" />Previous
                </Button>
                <Button variant="outline" onClick={() => setShowSubmitDialog(true)}>
                    <Flag className="h-4 w-4 mr-2" />Submit Mock
                </Button>
                {currentQ < mock.questions.length - 1 ? (
                    <Button onClick={handleNext}><ChevronRight className="h-4 w-4 ml-2" />Next</Button>
                ) : (
                    <Button onClick={() => setShowSubmitDialog(true)} className="bg-emerald-500">
                        <CheckCircle2 className="h-4 w-4 mr-2" />Finish
                    </Button>
                )}
            </div>

            {/* Submit Dialog */}
            <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit Mock?</DialogTitle>
                        <DialogDescription>You've answered {answered} of {mock.total_questions} questions.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>Continue</Button>
                        <Button onClick={handleSubmit} disabled={completeMutation.isPending}>
                            {completeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Submit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Abandon Dialog */}
            <Dialog open={showAbandonDialog} onOpenChange={setShowAbandonDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" />Abandon Mock?</DialogTitle>
                        <DialogDescription>Your progress will be lost.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAbandonDialog(false)}>Continue</Button>
                        <Button variant="destructive" onClick={() => abandonMutation.mutate()} disabled={abandonMutation.isPending}>Abandon</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function MockResults({ mock, onBack }: { mock: any; onBack: () => void }) {
    const scorePercent = mock.score && mock.max_score ? (mock.score / mock.max_score) * 100 : 0;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Mock Completed!</h1>
                <p className="text-muted-foreground">Here's how you did</p>
            </div>

            <Card>
                <CardContent className="pt-6 text-center">
                    <p className="text-5xl font-bold text-primary mb-2">{mock.score}/{mock.max_score}</p>
                    <Progress value={scorePercent} className="h-3 max-w-xs mx-auto mb-4" />
                    <div className="grid grid-cols-3 gap-4">
                        <div><p className="text-2xl font-semibold text-emerald-500">{mock.correct}</p><p className="text-sm text-muted-foreground">Correct</p></div>
                        <div><p className="text-2xl font-semibold text-red-500">{mock.attempted - mock.correct}</p><p className="text-sm text-muted-foreground">Wrong</p></div>
                        <div><p className="text-2xl font-semibold text-muted-foreground">{mock.total_questions - mock.attempted}</p><p className="text-sm text-muted-foreground">Skipped</p></div>
                    </div>
                </CardContent>
            </Card>

            {mock.section_scores && (
                <Card>
                    <CardHeader><CardTitle>Section-wise Performance</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {Object.entries(mock.section_scores).map(([section, data]: [string, any]) => (
                            <div key={section} className="flex items-center justify-between">
                                <span className="font-medium uppercase">{section}</span>
                                <div className="flex items-center gap-4">
                                    <span>{data.correct}/{data.attempted}</span>
                                    <Badge>{data.score}</Badge>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={onBack}>Back to Mocks</Button>
                <Button>Review Answers</Button>
            </div>
        </div>
    );
}
