import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catApi } from '@/api/cat';
import { Note, CreateNotePayload } from '@/types/cat';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
    StickyNote, Search, Plus, Tag, Sparkles, Trash2, Pencil, Loader2,
    FileText, Lightbulb, AlertCircle, Calculator,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function Notes() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTopic, setSelectedTopic] = useState<string>('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editNote, setEditNote] = useState<Note | null>(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: subjects } = useQuery({
        queryKey: ['cat-subjects'],
        queryFn: () => catApi.getSubjects(),
        staleTime: 5 * 60 * 1000,
    });

    const { data: searchResults, isLoading: isSearching } = useQuery({
        queryKey: ['cat-notes-search', searchQuery],
        queryFn: () => catApi.searchNotes({ q: searchQuery }),
        enabled: searchQuery.length > 0,
    });

    const allTopics = useMemo(() => {
        if (!subjects) return [];
        return subjects.flatMap(s => s.topics.map(t => ({ id: t.id, title: t.title, icon: s.icon })));
    }, [subjects]);

    const { data: topicNotes, isLoading } = useQuery({
        queryKey: ['cat-notes-topic', selectedTopic],
        queryFn: () => catApi.getTopicNotes(selectedTopic),
        enabled: selectedTopic !== 'all' && !searchQuery,
    });

    const displayNotes = searchQuery ? searchResults : topicNotes;

    const deleteMutation = useMutation({
        mutationFn: (id: string) => catApi.deleteNote(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cat-notes-topic'] });
            toast({ title: 'Note deleted' });
        },
    });

    const generateFlashcardsMutation = useMutation({
        mutationFn: (noteId: string) => catApi.generateFlashcardsFromNote(noteId),
        onSuccess: (data) => {
            toast({ title: `Created ${data.length} flashcards!` });
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <StickyNote className="h-7 w-7 text-primary" />
                        Study Notes
                    </h1>
                    <p className="text-muted-foreground">Organize formulas, tricks, and concepts</p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Add Note
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                </div>
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                    <SelectTrigger className="w-full sm:w-56">
                        <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Topics</SelectItem>
                        {allTopics.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.icon} {t.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {(isLoading || isSearching) ? (
                <div className="flex justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : selectedTopic === 'all' && !searchQuery ? (
                <div className="text-center py-16 text-muted-foreground">Select a topic to view notes</div>
            ) : displayNotes && displayNotes.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayNotes.map((note) => (
                        <Card key={note.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg line-clamp-1">{note.title}</CardTitle>
                                <CardDescription>{format(new Date(note.updated_at), 'MMM d, yyyy')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{note.content.slice(0, 150)}...</p>
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {note.formulas.length > 0 && <Badge variant="outline"><Calculator className="h-3 w-3 mr-1" />{note.formulas.length}</Badge>}
                                    {note.tricks.length > 0 && <Badge variant="outline"><Lightbulb className="h-3 w-3 mr-1" />{note.tricks.length}</Badge>}
                                    {note.common_mistakes.length > 0 && <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />{note.common_mistakes.length}</Badge>}
                                </div>
                                <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => generateFlashcardsMutation.mutate(note.id)} disabled={generateFlashcardsMutation.isPending}>
                                        <Sparkles className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => { setEditNote(note); setDialogOpen(true); }}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(note.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground">No notes found</div>
            )}

            <NoteDialog open={dialogOpen} note={editNote} topics={allTopics} onOpenChange={(o) => { if (!o) { setDialogOpen(false); setEditNote(null); } }}
                onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['cat-notes-topic'] }); setDialogOpen(false); setEditNote(null); }} />
        </div>
    );
}

function NoteDialog({ open, onOpenChange, note, topics, onSuccess }: { open: boolean; onOpenChange: (o: boolean) => void; note: Note | null; topics: { id: string; title: string; icon: string }[]; onSuccess: () => void }) {
    const [topicId, setTopicId] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [formulas, setFormulas] = useState('');
    const [tricks, setTricks] = useState('');
    const [mistakes, setMistakes] = useState('');
    const { toast } = useToast();

    const createMutation = useMutation({ mutationFn: (p: CreateNotePayload) => catApi.createNote(p), onSuccess: () => { toast({ title: 'Note created' }); onSuccess(); } });
    const updateMutation = useMutation({ mutationFn: ({ id, ...p }: { id: string } & Partial<CreateNotePayload>) => catApi.updateNote(id, p), onSuccess: () => { toast({ title: 'Note updated' }); onSuccess(); } });

    useMemo(() => {
        if (note) { setTopicId(note.topic_id); setTitle(note.title); setContent(note.content); setFormulas(note.formulas.join('\n')); setTricks(note.tricks.join('\n')); setMistakes(note.common_mistakes.join('\n')); }
        else { setTopicId(''); setTitle(''); setContent(''); setFormulas(''); setTricks(''); setMistakes(''); }
    }, [note]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: CreateNotePayload = { topic_id: topicId, title, content, formulas: formulas.split('\n').filter(Boolean), tricks: tricks.split('\n').filter(Boolean), common_mistakes: mistakes.split('\n').filter(Boolean) };
        note ? updateMutation.mutate({ id: note.id, ...payload }) : createMutation.mutate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{note ? 'Edit Note' : 'Create Note'}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label>Topic</Label><Select value={topicId} onValueChange={setTopicId}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{topics.map(t => <SelectItem key={t.id} value={t.id}>{t.icon} {t.title}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
                    </div>
                    <div><Label>Content</Label><Textarea value={content} onChange={e => setContent(e.target.value)} rows={5} /></div>
                    <div><Label>Formulas (one per line)</Label><Textarea value={formulas} onChange={e => setFormulas(e.target.value)} rows={3} className="font-mono" /></div>
                    <div><Label>Tricks (one per line)</Label><Textarea value={tricks} onChange={e => setTricks(e.target.value)} rows={3} /></div>
                    <div><Label>Common Mistakes (one per line)</Label><Textarea value={mistakes} onChange={e => setMistakes(e.target.value)} rows={3} /></div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={!topicId || !title || createMutation.isPending || updateMutation.isPending}>
                            {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {note ? 'Save' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
