import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catApi } from '@/api/cat';
import { Bookmark as BookmarkType, BookmarkCollection, BookmarkImportance } from '@/types/cat';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Bookmark as BookmarkIcon, Plus, Folder, Trash2, Loader2, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const importanceConfig: Record<BookmarkImportance, { label: string; stars: number }> = {
    low: { label: 'Low', stars: 1 },
    medium: { label: 'Medium', stars: 2 },
    high: { label: 'High', stars: 3 },
    must_revise: { label: 'Must Revise', stars: 4 },
};

export default function Bookmarks() {
    const [selectedCollection, setSelectedCollection] = useState<string>('all');
    const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: collections } = useQuery({
        queryKey: ['cat-bookmark-collections'],
        queryFn: () => catApi.getBookmarkCollections(),
    });

    const { data: bookmarks, isLoading } = useQuery({
        queryKey: ['cat-bookmarks', selectedCollection],
        queryFn: () => catApi.getBookmarks(selectedCollection !== 'all' ? selectedCollection : undefined),
    });

    const deleteMutation = useMutation({
        mutationFn: (questionId: string) => catApi.removeBookmark(questionId),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cat-bookmarks'] }); toast({ title: 'Bookmark removed' }); },
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BookmarkIcon className="h-7 w-7 text-primary" />
                        Bookmarks
                    </h1>
                    <p className="text-muted-foreground">Questions you want to revisit</p>
                </div>
                <Button variant="outline" onClick={() => setCreateCollectionOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />New Collection
                </Button>
            </div>

            {/* Collections */}
            {collections && collections.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <Button variant={selectedCollection === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCollection('all')}>
                        All ({bookmarks?.length || 0})
                    </Button>
                    {collections.map(col => (
                        <Button key={col.id} variant={selectedCollection === col.name ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCollection(col.name)}>
                            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: col.color }} />
                            {col.name} ({col.question_count})
                        </Button>
                    ))}
                </div>
            )}

            {/* Bookmarks List */}
            {isLoading ? (
                <div className="flex justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : bookmarks && bookmarks.length > 0 ? (
                <div className="space-y-3">
                    {bookmarks.map(bookmark => (
                        <Card key={bookmark.id}>
                            <CardContent className="pt-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex">
                                                {Array.from({ length: importanceConfig[bookmark.importance].stars }).map((_, i) => (
                                                    <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                                                ))}
                                            </div>
                                            <Badge variant="secondary">{importanceConfig[bookmark.importance].label}</Badge>
                                            {bookmark.collection_name && (
                                                <Badge variant="outline"><Folder className="h-3 w-3 mr-1" />{bookmark.collection_name}</Badge>
                                            )}
                                            <span className="text-xs text-muted-foreground">{format(new Date(bookmark.created_at), 'MMM d')}</span>
                                        </div>
                                        <p className="text-sm">{bookmark.question_text}</p>
                                        {bookmark.notes && <p className="mt-2 text-sm text-muted-foreground">{bookmark.notes}</p>}
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(bookmark.question_id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <BookmarkIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No bookmarks yet</p>
                    <p className="text-sm">Bookmark questions during practice or mocks</p>
                </div>
            )}

            <CreateCollectionDialog open={createCollectionOpen} onOpenChange={setCreateCollectionOpen}
                onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['cat-bookmark-collections'] }); setCreateCollectionOpen(false); }} />
        </div>
    );
}

function CreateCollectionDialog({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (o: boolean) => void; onSuccess: () => void }) {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#3b82f6');
    const { toast } = useToast();

    const mutation = useMutation({
        mutationFn: () => catApi.createBookmarkCollection({ name, color, icon: '📌' }),
        onSuccess: () => { toast({ title: 'Collection created' }); setName(''); onSuccess(); },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>Create Collection</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Tough DI Sets" /></div>
                    <div><Label>Color</Label><div className="flex gap-2 mt-2">
                        {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(c => (
                            <button key={c} type="button" onClick={() => setColor(c)}
                                className={cn("w-8 h-8 rounded-full border-2", color === c ? 'border-foreground' : 'border-transparent')} style={{ backgroundColor: c }} />
                        ))}
                    </div></div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}>
                        {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
