import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catApi } from '@/api/cat';
import { Flashcard, CreateFlashcardPayload } from '@/types/cat';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, RotateCcw, CheckCircle2, X, Loader2, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Flashcards() {
    const [mode, setMode] = useState<'browse' | 'review'>('browse');
    const [selectedTopic, setSelectedTopic] = useState<string>('all');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: subjects } = useQuery({
        queryKey: ['cat-subjects'],
        queryFn: () => catApi.getSubjects(),
        staleTime: 5 * 60 * 1000,
    });

    const { data: dueCards, isLoading: isDueLoading } = useQuery({
        queryKey: ['cat-flashcards-due'],
        queryFn: () => catApi.getDueFlashcards(50),
        staleTime: 1 * 60 * 1000,
    });

    const { data: topicCards, isLoading: isTopicLoading } = useQuery({
        queryKey: ['cat-flashcards-topic', selectedTopic],
        queryFn: () => catApi.getTopicFlashcards(selectedTopic),
        enabled: selectedTopic !== 'all',
    });

    const allTopics = useMemo(() => {
        if (!subjects) return [];
        return subjects.flatMap(s => s.topics.map(t => ({ id: t.id, title: t.title, icon: s.icon })));
    }, [subjects]);

    const displayCards = selectedTopic === 'all' ? dueCards : topicCards;
    const isLoading = selectedTopic === 'all' ? isDueLoading : isTopicLoading;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Layers className="h-7 w-7 text-primary" />
                        Flashcards
                    </h1>
                    <p className="text-muted-foreground">Review with spaced repetition</p>
                </div>
                <div className="flex gap-2">
                    {dueCards && dueCards.length > 0 && mode === 'browse' && (
                        <Button onClick={() => setMode('review')} className="bg-gradient-to-r from-violet-500 to-purple-600">
                            <Play className="h-4 w-4 mr-2" />
                            Review {dueCards.length} Due
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />Add Card
                    </Button>
                </div>
            </div>

            {mode === 'review' && dueCards ? (
                <ReviewMode cards={dueCards} onComplete={() => { setMode('browse'); queryClient.invalidateQueries({ queryKey: ['cat-flashcards'] }); }} />
            ) : (
                <>
                    <div className="flex gap-3">
                        <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                            <SelectTrigger className="w-56">
                                <SelectValue placeholder="Filter by topic" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Due Cards ({dueCards?.length || 0})</SelectItem>
                                {allTopics.map(t => <SelectItem key={t.id} value={t.id}>{t.icon} {t.title}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : displayCards && displayCards.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {displayCards.map(card => <FlashcardPreview key={card.id} card={card} />)}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                            <h3 className="text-lg font-medium mb-2">
                                {selectedTopic === 'all' ? 'No cards due for review!' : 'No flashcards'}
                            </h3>
                            <p className="text-muted-foreground">
                                {selectedTopic === 'all' ? 'Great job! Check back later.' : 'Create flashcards from notes or add manually.'}
                            </p>
                        </div>
                    )}
                </>
            )}

            <CreateFlashcardDialog open={createDialogOpen} topics={allTopics} onOpenChange={setCreateDialogOpen}
                onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['cat-flashcards'] }); setCreateDialogOpen(false); }} />
        </div>
    );
}

function FlashcardPreview({ card }: { card: Flashcard }) {
    const [flipped, setFlipped] = useState(false);
    return (
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => setFlipped(!flipped)}>
            <Card className="h-40 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div key={flipped ? 'back' : 'front'} initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: -90, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="absolute inset-0 p-4 flex flex-col">
                        <Badge className="self-start mb-2" variant={flipped ? 'secondary' : 'outline'}>
                            {flipped ? 'Answer' : 'Question'}
                        </Badge>
                        <p className="flex-1 text-sm overflow-y-auto">{flipped ? card.answer : card.question}</p>
                        <p className="text-xs text-muted-foreground mt-2">Click to flip</p>
                    </motion.div>
                </AnimatePresence>
            </Card>
        </motion.div>
    );
}

function ReviewMode({ cards, onComplete }: { cards: Flashcard[]; onComplete: () => void }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [reviewed, setReviewed] = useState<{ id: string; correct: boolean }[]>([]);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const reviewMutation = useMutation({
        mutationFn: ({ id, correct }: { id: string; correct: boolean }) => catApi.reviewFlashcard(id, correct),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cat-flashcards'] }),
    });

    const currentCard = cards[currentIndex];
    const progress = (reviewed.length / cards.length) * 100;
    const correctCount = reviewed.filter(r => r.correct).length;

    const handleReview = (correct: boolean) => {
        reviewMutation.mutate({ id: currentCard.id, correct });
        setReviewed([...reviewed, { id: currentCard.id, correct }]);
        setFlipped(false);
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            toast({ title: `Session complete! ${correctCount + (correct ? 1 : 0)}/${cards.length} correct` });
            onComplete();
        }
    };

    if (!currentCard) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={onComplete}><X className="h-4 w-4 mr-2" />Exit</Button>
                <Badge variant="secondary">{currentIndex + 1} / {cards.length}</Badge>
            </div>

            <Progress value={progress} className="h-2" />

            <motion.div className="min-h-[300px] cursor-pointer" onClick={() => setFlipped(!flipped)}>
                <Card className="h-full">
                    <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px]">
                        <AnimatePresence mode="wait">
                            <motion.div key={flipped ? 'back' : 'front'} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                                className="text-center">
                                <Badge className="mb-4" variant={flipped ? 'default' : 'outline'}>
                                    {flipped ? 'Answer' : 'Question'}
                                </Badge>
                                <p className="text-xl">{flipped ? currentCard.answer : currentCard.question}</p>
                            </motion.div>
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </motion.div>

            {flipped ? (
                <div className="flex justify-center gap-4">
                    <Button size="lg" variant="outline" className="text-red-500 border-red-500" onClick={() => handleReview(false)}>
                        <X className="h-5 w-5 mr-2" />Incorrect
                    </Button>
                    <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600" onClick={() => handleReview(true)}>
                        <CheckCircle2 className="h-5 w-5 mr-2" />Correct
                    </Button>
                </div>
            ) : (
                <div className="text-center text-muted-foreground">Click the card to reveal the answer</div>
            )}
        </div>
    );
}

function CreateFlashcardDialog({ open, topics, onOpenChange, onSuccess }: { open: boolean; topics: { id: string; title: string; icon: string }[]; onOpenChange: (o: boolean) => void; onSuccess: () => void }) {
    const [topicId, setTopicId] = useState('');
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const { toast } = useToast();

    const mutation = useMutation({
        mutationFn: (p: CreateFlashcardPayload) => catApi.createFlashcard(p),
        onSuccess: () => { toast({ title: 'Flashcard created' }); setQuestion(''); setAnswer(''); onSuccess(); },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate({ topic_id: topicId, question, answer });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>Create Flashcard</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><Label>Topic</Label><Select value={topicId} onValueChange={setTopicId}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{topics.map(t => <SelectItem key={t.id} value={t.id}>{t.icon} {t.title}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Question</Label><Textarea value={question} onChange={e => setQuestion(e.target.value)} rows={3} /></div>
                    <div><Label>Answer</Label><Textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={3} /></div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={!topicId || !question || !answer || mutation.isPending}>
                            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
