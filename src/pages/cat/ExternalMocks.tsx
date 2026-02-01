import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catApi } from '@/api/cat';
import { ExternalMock, ExternalPlatform, CreateExternalMockPayload } from '@/types/cat';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Trophy, Plus, TrendingUp, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const platforms: ExternalPlatform[] = ['IMS', 'TIME', 'Career Launcher', 'Unacademy', '2IIM', 'Bodhee', 'Other'];

export default function ExternalMocks() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editMock, setEditMock] = useState<ExternalMock | null>(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: mocks, isLoading } = useQuery({
        queryKey: ['cat-external-mocks'],
        queryFn: () => catApi.getExternalMocks({ limit: 50 }),
    });

    const { data: analytics } = useQuery({
        queryKey: ['cat-external-mocks-analytics'],
        queryFn: () => catApi.getExternalMocksAnalytics(),
        staleTime: 5 * 60 * 1000,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => catApi.deleteExternalMock(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cat-external-mocks'] }); toast({ title: 'Mock deleted' }); },
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Trophy className="h-7 w-7 text-primary" />
                        External Mocks
                    </h1>
                    <p className="text-muted-foreground">Track scores from IMS, TIME, and other platforms</p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Add Score
                </Button>
            </div>

            {/* Analytics */}
            {analytics && analytics.total_mocks > 0 && (
                <div className="grid md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-3xl font-bold text-primary">{analytics.total_mocks}</p>
                            <p className="text-sm text-muted-foreground">Total Mocks</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-3xl font-bold text-emerald-500">{analytics.average_percentile.toFixed(1)}%ile</p>
                            <p className="text-sm text-muted-foreground">Avg Percentile</p>
                        </CardContent>
                    </Card>
                    <Card className="md:col-span-2">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">Percentile Trend</span>
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            </div>
                            {analytics.trend.length > 0 && (
                                <div className="h-16 flex items-end gap-1">
                                    {analytics.trend.slice(-10).map((p, i) => (
                                        <div key={i} className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors"
                                            style={{ height: `${p.percentile}%` }} title={`${p.date}: ${p.percentile}%`} />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* By Platform */}
            {analytics?.by_platform && analytics.by_platform.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Performance by Platform</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {analytics.by_platform.map(p => (
                                <div key={p.platform} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                                    <span className="font-medium">{p.platform}</span>
                                    <Badge variant="secondary">{p.count} mocks</Badge>
                                    <Badge>{p.avg_percentile.toFixed(0)}%ile</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* List */}
            <Card>
                <CardHeader>
                    <CardTitle>Mock History</CardTitle>
                    <CardDescription>All your external mock scores</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : mocks && mocks.length > 0 ? (
                        <div className="space-y-3">
                            {mocks.map(mock => (
                                <div key={mock.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Trophy className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{mock.mock_name}</p>
                                            <p className="text-sm text-muted-foreground">{mock.platform} • {format(new Date(mock.mock_date), 'MMM d, yyyy')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-semibold">{mock.overall_score}/{mock.max_score}</p>
                                            {mock.percentile && <p className="text-sm text-emerald-500">{mock.percentile}%ile</p>}
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => { setEditMock(mock); setDialogOpen(true); }}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(mock.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">No external mocks added yet</div>
                    )}
                </CardContent>
            </Card>

            <ExternalMockDialog open={dialogOpen} mock={editMock} onOpenChange={(o) => { if (!o) { setDialogOpen(false); setEditMock(null); } }}
                onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['cat-external-mocks'] }); setDialogOpen(false); setEditMock(null); }} />
        </div>
    );
}

function ExternalMockDialog({ open, mock, onOpenChange, onSuccess }: { open: boolean; mock: ExternalMock | null; onOpenChange: (o: boolean) => void; onSuccess: () => void }) {
    const [platform, setPlatform] = useState<ExternalPlatform>('IMS');
    const [mockName, setMockName] = useState('');
    const [mockDate, setMockDate] = useState('');
    const [overallScore, setOverallScore] = useState('');
    const [maxScore, setMaxScore] = useState('200');
    const [percentile, setPercentile] = useState('');
    const { toast } = useToast();

    const createMutation = useMutation({
        mutationFn: (p: CreateExternalMockPayload) => catApi.createExternalMock(p),
        onSuccess: () => { toast({ title: 'Score added' }); onSuccess(); },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, ...p }: { id: string } & Partial<CreateExternalMockPayload>) => catApi.updateExternalMock(id, p),
        onSuccess: () => { toast({ title: 'Score updated' }); onSuccess(); },
    });

    // Reset on mock change
    useState(() => {
        if (mock) {
            setPlatform(mock.platform);
            setMockName(mock.mock_name);
            setMockDate(format(new Date(mock.mock_date), 'yyyy-MM-dd'));
            setOverallScore(String(mock.overall_score));
            setMaxScore(String(mock.max_score));
            setPercentile(mock.percentile ? String(mock.percentile) : '');
        } else {
            setPlatform('IMS');
            setMockName('');
            setMockDate('');
            setOverallScore('');
            setMaxScore('200');
            setPercentile('');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: CreateExternalMockPayload = {
            platform,
            mock_name: mockName,
            mock_date: mockDate,
            overall_score: parseFloat(overallScore),
            max_score: parseFloat(maxScore),
            percentile: percentile ? parseFloat(percentile) : undefined,
        };
        mock ? updateMutation.mutate({ id: mock.id, ...payload }) : createMutation.mutate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mock ? 'Edit Score' : 'Add External Mock Score'}</DialogTitle>
                    <DialogDescription>Track your performance from external platforms</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Platform</Label>
                            <Select value={platform} onValueChange={(v) => setPlatform(v as ExternalPlatform)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{platforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Mock Date</Label>
                            <Input type="date" value={mockDate} onChange={e => setMockDate(e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <Label>Mock Name</Label>
                        <Input value={mockName} onChange={e => setMockName(e.target.value)} placeholder="e.g., SimCAT 15" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label>Score</Label>
                            <Input type="number" value={overallScore} onChange={e => setOverallScore(e.target.value)} />
                        </div>
                        <div>
                            <Label>Max Score</Label>
                            <Input type="number" value={maxScore} onChange={e => setMaxScore(e.target.value)} />
                        </div>
                        <div>
                            <Label>Percentile</Label>
                            <Input type="number" value={percentile} onChange={e => setPercentile(e.target.value)} placeholder="Optional" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={!mockName || !overallScore || createMutation.isPending || updateMutation.isPending}>
                            {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {mock ? 'Save' : 'Add'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
