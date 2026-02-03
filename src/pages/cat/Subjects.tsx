import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catApi } from '@/api/cat';
import { TopicStatus, Subject, Topic } from '@/types/cat';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
    BookOpen,
    Search,
    Filter,
    Plus,
    ChevronDown,
    ChevronRight,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Circle,
    MoreVertical,
    Pencil,
    Trash2,
    Sparkles,
    Loader2,
    X,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const statusConfig: Record<TopicStatus, { label: string; icon: typeof Circle; color: string }> = {
    not_started: { label: 'Not Started', icon: Circle, color: 'text-muted-foreground' },
    in_progress: { label: 'In Progress', icon: Clock, color: 'text-amber-500' },
    done: { label: 'Done', icon: CheckCircle2, color: 'text-emerald-500' },
    needs_revision: { label: 'Needs Revision', icon: AlertTriangle, color: 'text-orange-500' },
};

export default function Subjects({ onLearnTopic }: { onLearnTopic?: (topicTitle: string) => void }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<TopicStatus | 'all'>('all');
    const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
    const [createTopicDialog, setCreateTopicDialog] = useState<{
        open: boolean;
        subjectId: string;
        subjectName: string;
    } | null>(null);
    const [editTopicDialog, setEditTopicDialog] = useState<Topic | null>(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Get subject filter from URL
    const subjectFilter = searchParams.get('subject');

    const { data: subjects, isLoading } = useQuery({
        queryKey: ['cat-subjects'],
        queryFn: () => catApi.getSubjects(),
        staleTime: 2 * 60 * 1000,
    });

    // Auto-expand subject from URL
    useMemo(() => {
        if (subjectFilter && subjects) {
            const subject = subjects.find(s => s.code === subjectFilter);
            if (subject) {
                setExpandedSubjects(prev => new Set([...prev, subject.id]));
            }
        }
    }, [subjectFilter, subjects]);

    const updateStatusMutation = useMutation({
        mutationFn: ({ topicId, status }: { topicId: string; status: TopicStatus }) =>
            catApi.updateTopicStatus(topicId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cat-subjects'] });
            toast({ title: 'Status updated' });
        },
        onError: () => {
            toast({ title: 'Failed to update status', variant: 'destructive' });
        },
    });

    const createTopicMutation = useMutation({
        mutationFn: (payload: { subject_id: string; title: string; description?: string }) =>
            catApi.createTopic(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cat-subjects'] });
            setCreateTopicDialog(null);
            toast({ title: 'Topic created' });
        },
        onError: () => {
            toast({ title: 'Failed to create topic', variant: 'destructive' });
        },
    });

    const updateTopicMutation = useMutation({
        mutationFn: ({ id, ...payload }: { id: string; title?: string; description?: string; difficulty?: number }) =>
            catApi.updateTopic(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cat-subjects'] });
            setEditTopicDialog(null);
            toast({ title: 'Topic updated' });
        },
        onError: () => {
            toast({ title: 'Failed to update topic', variant: 'destructive' });
        },
    });

    const deleteTopicMutation = useMutation({
        mutationFn: (id: string) => catApi.deleteTopic(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cat-subjects'] });
            toast({ title: 'Topic deleted' });
        },
        onError: () => {
            toast({ title: 'Failed to delete topic', variant: 'destructive' });
        },
    });

    const filteredSubjects = useMemo(() => {
        if (!subjects) return [];
        return subjects.map(subject => ({
            ...subject,
            topics: subject.topics.filter(topic => {
                const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesStatus = statusFilter === 'all' || topic.status === statusFilter;
                return matchesSearch && matchesStatus;
            }),
        }));
    }, [subjects, searchQuery, statusFilter]);

    const toggleSubject = (subjectId: string) => {
        setExpandedSubjects(prev => {
            const next = new Set(prev);
            if (next.has(subjectId)) {
                next.delete(subjectId);
            } else {
                next.add(subjectId);
            }
            return next;
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                        <BookOpen className="h-7 w-7 text-primary" />
                        Subjects & Topics
                    </h1>
                    <p className="text-muted-foreground">
                        Track your progress across all CAT topics
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search topics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TopicStatus | 'all')}>
                    <SelectTrigger className="w-full sm:w-48">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {Object.entries(statusConfig).map(([value, config]) => (
                            <SelectItem key={value} value={value}>
                                <div className="flex items-center gap-2">
                                    <config.icon className={cn('h-4 w-4', config.color)} />
                                    {config.label}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Subjects Grid */}
            <div className="space-y-4">
                {filteredSubjects.map((subject) => (
                    <SubjectCard
                        key={subject.id}
                        subject={subject}
                        expanded={expandedSubjects.has(subject.id)}
                        onToggle={() => toggleSubject(subject.id)}
                        onStatusChange={(topicId, status) =>
                            updateStatusMutation.mutate({ topicId, status })
                        }
                        onAddTopic={() =>
                            setCreateTopicDialog({
                                open: true,
                                subjectId: subject.id,
                                subjectName: subject.name,
                            })
                        }
                        onEditTopic={setEditTopicDialog}
                        onDeleteTopic={(id) => deleteTopicMutation.mutate(id)}
                        onLearnTopic={onLearnTopic}
                    />
                ))}
            </div>

            {/* Create Topic Dialog */}
            <CreateTopicDialog
                open={!!createTopicDialog?.open}
                onOpenChange={(open) => !open && setCreateTopicDialog(null)}
                subjectId={createTopicDialog?.subjectId || ''}
                subjectName={createTopicDialog?.subjectName || ''}
                onSubmit={(data) => createTopicMutation.mutate(data)}
                isLoading={createTopicMutation.isPending}
            />

            {/* Edit Topic Dialog */}
            <EditTopicDialog
                open={!!editTopicDialog}
                topic={editTopicDialog}
                onOpenChange={(open) => !open && setEditTopicDialog(null)}
                onSubmit={(data) => updateTopicMutation.mutate(data)}
                isLoading={updateTopicMutation.isPending}
            />
        </div>
    );
}

function SubjectCard({
    subject,
    expanded,
    onToggle,
    onStatusChange,
    onAddTopic,
    onEditTopic,
    onDeleteTopic,
    onLearnTopic,
}: {
    subject: Subject & { topics: Topic[] };
    expanded: boolean;
    onToggle: () => void;
    onStatusChange: (topicId: string, status: TopicStatus) => void;
    onAddTopic: () => void;
    onEditTopic: (topic: Topic) => void;
    onDeleteTopic: (id: string) => void;
    onLearnTopic?: (topicId: string) => void;
}) {
    const progress = (subject.stats.done / subject.stats.total) * 100;

    return (
        <Card className="overflow-hidden">
            <motion.div
                className="cursor-pointer"
                onClick={onToggle}
                whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
            >
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">{subject.icon}</span>
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    {subject.name}
                                    <Badge variant="secondary" className="ml-2">
                                        {subject.topics.length} topics
                                    </Badge>
                                </CardTitle>
                                <CardDescription className="flex items-center gap-4 mt-1">
                                    <span className="text-emerald-500">{subject.stats.done} done</span>
                                    <span className="text-amber-500">{subject.stats.in_progress} in progress</span>
                                    <span className="text-muted-foreground">{subject.stats.not_started} not started</span>
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-2 w-32">
                                <Progress value={progress} className="h-2" />
                                <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
                            </div>
                            {expanded ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                        </div>
                    </div>
                </CardHeader>
            </motion.div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <CardContent className="border-t pt-4">
                            <div className="flex justify-end mb-3">
                                <Button size="sm" variant="outline" onClick={onAddTopic}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Topic
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {subject.topics.map((topic) => (
                                    <TopicRow
                                        key={topic.id}
                                        topic={topic}
                                        onStatusChange={(status) => onStatusChange(topic.id, status)}
                                        onEdit={() => onEditTopic(topic)}
                                        onDelete={() => onDeleteTopic(topic.id)}
                                        onLearn={() => onLearnTopic?.(topic.id)}
                                    />
                                ))}
                                {subject.topics.length === 0 && (
                                    <div className="text-center text-muted-foreground py-8">
                                        No topics match your filters
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}

function TopicRow({
    topic,
    onStatusChange,
    onEdit,
    onDelete,
    onLearn,
}: {
    topic: Topic;
    onStatusChange: (status: TopicStatus) => void;
    onEdit: () => void;
    onDelete: () => void;
    onLearn?: () => void;
}) {
    const config = statusConfig[topic.status];

    return (
        <motion.div
            layout
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <config.icon className={cn('h-5 w-5 shrink-0', config.color)} />
                <div className="min-w-0">
                    <p className="font-medium truncate">{topic.title}</p>
                    {topic.accuracy_percent !== null && (
                        <p className="text-xs text-muted-foreground">
                            Accuracy: {topic.accuracy_percent}%
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Select value={topic.status} onValueChange={(v) => onStatusChange(v as TopicStatus)}>
                    <SelectTrigger className="w-36 h-8">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(statusConfig).map(([value, config]) => (
                            <SelectItem key={value} value={value}>
                                <div className="flex items-center gap-2">
                                    <config.icon className={cn('h-4 w-4', config.color)} />
                                    {config.label}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onEdit}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Sparkles className="h-4 w-4 mr-2" />
                            AI Tips
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {topic.is_custom && (
                            <DropdownMenuItem
                                onClick={onDelete}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={onLearn}>
                            <BookOpen className="h-4 w-4 mr-2" />
                            Start Learning
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </motion.div>
    );
}

function CreateTopicDialog({
    open,
    onOpenChange,
    subjectId,
    subjectName,
    onSubmit,
    isLoading,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subjectId: string;
    subjectName: string;
    onSubmit: (data: { subject_id: string; title: string; description?: string }) => void;
    isLoading: boolean;
}) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({
            subject_id: subjectId,
            title: title.trim(),
            description: description.trim() || undefined,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Custom Topic</DialogTitle>
                    <DialogDescription>
                        Add a new topic to {subjectName}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="title">Topic Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Advanced Permutations"
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">Description (optional)</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of the topic..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!title.trim() || isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Create Topic
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditTopicDialog({
    open,
    topic,
    onOpenChange,
    onSubmit,
    isLoading,
}: {
    open: boolean;
    topic: Topic | null;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: { id: string; title?: string; description?: string; difficulty?: number }) => void;
    isLoading: boolean;
}) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState(3);

    // Reset form when topic changes
    useMemo(() => {
        if (topic) {
            setTitle(topic.title);
            setDescription(topic.description || '');
            setDifficulty(topic.difficulty || 3);
        }
    }, [topic]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic || !title.trim()) return;
        onSubmit({
            id: topic.id,
            title: title.trim(),
            description: description.trim() || undefined,
            difficulty,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Topic</DialogTitle>
                    <DialogDescription>Update topic details</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="edit-title">Topic Title</Label>
                            <Input
                                id="edit-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-difficulty">Difficulty (1-5)</Label>
                            <Select value={String(difficulty)} onValueChange={(v) => setDifficulty(Number(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[1, 2, 3, 4, 5].map((d) => (
                                        <SelectItem key={d} value={String(d)}>
                                            {d} - {['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'][d - 1]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!title.trim() || isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
