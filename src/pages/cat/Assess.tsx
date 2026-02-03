// CAT Assess Page - Unified Assessment Hub (Mocks + Adaptive + External)
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
    FileQuestion,
    Brain,
    Trophy,
    Play,
    Clock,
    Target,
    TrendingUp,
    Loader2,
    Plus,
    BarChart3,
    ChevronRight,
    Calendar,
    Sparkles,
    Zap,
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { catApi } from '@/api/cat';
import { CatNavigation } from '@/components/cat/CatNavigation';
import { SectionTabs } from '@/components/cat/SectionTabs';
import type { Mock, MockType, MockDifficulty, ExternalMock } from '@/types/cat';
import AdaptiveExam from './AdaptiveExam';

const mockTypes: { value: MockType; label: string; desc: string; duration: string; icon: React.ReactNode }[] = [
    { value: 'full', label: 'Full Mock', desc: 'Complete CAT simulation', duration: '180 min', icon: <FileQuestion className="h-5 w-5" /> },
    { value: 'sectional_quant', label: 'Quant', desc: 'Quantitative Aptitude', duration: '60 min', icon: <Target className="h-5 w-5" /> },
    { value: 'sectional_varc', label: 'VARC', desc: 'Verbal & RC', duration: '60 min', icon: <FileQuestion className="h-5 w-5" /> },
    { value: 'sectional_dilr', label: 'DILR', desc: 'Data & Logic', duration: '60 min', icon: <Brain className="h-5 w-5" /> },
];

const platformColors: Record<string, string> = {
    'IMS': 'bg-blue-500',
    'TIME': 'bg-emerald-500',
    'Career Launcher': 'bg-amber-500',
    'Unacademy': 'bg-green-500',
    '2IIM': 'bg-purple-500',
    'Bodhee': 'bg-rose-500',
    'Other': 'bg-gray-500',
};

export default function Assess() {
    const [activeTab, setActiveTab] = useState('mocks');
    const [startMockOpen, setStartMockOpen] = useState(false);
    const [addExternalOpen, setAddExternalOpen] = useState(false);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Fetch all data
    const { data: mocksData, isLoading: mocksLoading } = useQuery({
        queryKey: ['cat-mocks'],
        queryFn: () => catApi.getMocks({ limit: 20 }),
        staleTime: 60 * 1000,
    });

    const { data: performance } = useQuery({
        queryKey: ['cat-mocks-performance'],
        queryFn: () => catApi.getMockPerformance(),
        staleTime: 5 * 60 * 1000,
    });

    const { data: externalMocks } = useQuery({
        queryKey: ['cat-external-mocks'],
        queryFn: () => catApi.getExternalMocks({ limit: 20 }),
        staleTime: 5 * 60 * 1000,
    });

    const { data: scorePrediction } = useQuery({
        queryKey: ['cat-score-prediction'],
        queryFn: () => catApi.getScorePrediction(),
        staleTime: 10 * 60 * 1000,
    });

    const mocks = mocksData?.items || [];
    const inProgress = mocks.find(m => m.status === 'in_progress');

    return (
        <div className="space-y-6">
            {/* CAT Module Navigation */}
            <CatNavigation />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileQuestion className="h-7 w-7 text-primary" />
                        Assess
                    </h1>
                    <p className="text-muted-foreground">Mock tests, adaptive exams & external tracking</p>
                </div>
                <div className="flex gap-2">
                    {inProgress && (
                        <Link to={`/cat/mocks/${inProgress.id}`}>
                            <Button variant="outline" className="gap-2">
                                <Play className="h-4 w-4" />Resume Mock
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                <FileQuestion className="h-5 w-5 text-violet-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{performance?.total || 0}</p>
                                <p className="text-xs text-muted-foreground">Mocks Taken</p>
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
                                <p className="text-2xl font-bold">{performance?.average_score?.toFixed(0) || 0}</p>
                                <p className="text-xs text-muted-foreground">Avg Score</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{scorePrediction?.overall_percentile?.toFixed(0) || '--'}%</p>
                                <p className="text-xs text-muted-foreground">Predicted</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Trophy className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{externalMocks?.length || 0}</p>
                                <p className="text-xs text-muted-foreground">External</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            {/* Section Tabs */}
            <SectionTabs
                tabs={[
                    { value: 'mocks', label: 'Mock Tests', description: 'Full-length & sectional', icon: FileQuestion },
                    { value: 'adaptive', label: 'Adaptive', description: 'AI-powered difficulty', icon: Brain },
                    { value: 'external', label: 'External', description: 'Track other platforms', icon: Trophy },
                ]}
                value={activeTab}
                onValueChange={setActiveTab}
            />

            {/* Tab Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-0">

                {/* Mocks Tab */}
                <TabsContent value="mocks" className="space-y-6">
                    {/* Quick Start Cards */}
                    <div className="grid md:grid-cols-4 gap-4">
                        {mockTypes.map((type) => (
                            <motion.div
                                key={type.value}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Card
                                    className="cursor-pointer hover:border-primary/50 transition-colors h-full"
                                    onClick={() => {
                                        setStartMockOpen(true);
                                    }}
                                >
                                    <CardContent className="pt-6">
                                        <div className="flex flex-col items-center text-center space-y-2">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                {type.icon}
                                            </div>
                                            <h3 className="font-semibold">{type.label}</h3>
                                            <p className="text-xs text-muted-foreground">{type.desc}</p>
                                            <Badge variant="outline" className="text-xs">
                                                <Clock className="h-3 w-3 mr-1" />{type.duration}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Recent Mocks */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Recent Mocks</CardTitle>
                                <CardDescription>Your mock test history</CardDescription>
                            </div>
                            <Button onClick={() => setStartMockOpen(true)} className="bg-gradient-to-r from-violet-500 to-purple-600">
                                <Plus className="h-4 w-4 mr-2" />Start New
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {mocksLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : mocks.length > 0 ? (
                                <div className="space-y-3">
                                    {mocks.slice(0, 10).map(mock => (
                                        <MockRow key={mock.id} mock={mock} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <FileQuestion className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No mocks taken yet. Start your first mock test!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Adaptive Tab */}
                <TabsContent value="adaptive" className="space-y-6">
                    <AdaptiveExam />
                </TabsContent>

                {/* External Tab */}
                <TabsContent value="external" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold">External Mock Tracking</h3>
                            <p className="text-sm text-muted-foreground">Track mocks from IMS, TIME, and other platforms</p>
                        </div>
                        <Button onClick={() => setAddExternalOpen(true)} className="gap-2">
                            <Plus className="h-4 w-4" />Add Mock
                        </Button>
                    </div>

                    {externalMocks && externalMocks.length > 0 ? (
                        <div className="space-y-3">
                            {externalMocks.map((mock: ExternalMock) => (
                                <ExternalMockRow key={mock.id} mock={mock} />
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground">No external mocks recorded yet.</p>
                                <Button onClick={() => setAddExternalOpen(true)} className="mt-4">
                                    Add Your First Mock
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* Start Mock Dialog */}
            <StartMockDialog
                open={startMockOpen}
                onOpenChange={setStartMockOpen}
                onSuccess={(mockId) => {
                    setStartMockOpen(false);
                    navigate(`/cat/mocks/${mockId}`);
                }}
            />

            {/* Add External Mock Dialog */}
            <AddExternalMockDialog
                open={addExternalOpen}
                onOpenChange={setAddExternalOpen}
                onSuccess={() => {
                    setAddExternalOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['cat-external-mocks'] });
                }}
            />
        </div>
    );
}

// Mock Row Component
function MockRow({ mock }: { mock: Mock }) {
    const typeLabel = mockTypes.find(t => t.value === mock.type)?.label || mock.type;
    const scorePercent = mock.score && mock.max_score ? (mock.score / mock.max_score) * 100 : 0;
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [analysisData, setAnalysisData] = useState<{
        mistakes: { question_text: string; explanation: string; mistake_type: string }[];
        summary: { total_mistakes: number; practice_recommendation: string; weakest_topics: string[] };
    } | null>(null);
    const { toast } = useToast();

    const explainMutation = useMutation({
        mutationFn: () => catApi.explainMock({ mock_id: mock.id }),
        onSuccess: (data) => {
            setAnalysisData(data);
            setShowAnalysis(true);
        },
        onError: () => toast({ title: 'Failed to get analysis', variant: 'destructive' }),
    });

    return (
        <>
            <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
                <Link to={`/cat/mocks/${mock.id}`} className="flex items-center gap-4 flex-1">
                    <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center",
                        mock.status === 'completed' ? 'bg-emerald-500/10' :
                            mock.status === 'in_progress' ? 'bg-amber-500/10' : 'bg-muted'
                    )}>
                        <FileQuestion className={cn(
                            "h-5 w-5",
                            mock.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'
                        )} />
                    </div>
                    <div>
                        <p className="font-medium">{typeLabel}</p>
                        <p className="text-sm text-muted-foreground">
                            {format(new Date(mock.started_at), 'MMM d, yyyy')}
                        </p>
                    </div>
                </Link>
                <div className="flex items-center gap-4">
                    {mock.status === 'completed' && mock.score !== undefined && (
                        <>
                            <div className="text-right hidden sm:block">
                                <p className="font-semibold">{mock.score}/{mock.max_score}</p>
                                <p className="text-xs text-muted-foreground">{mock.correct}/{mock.total_questions} correct</p>
                            </div>
                            <div className="w-16 hidden md:block">
                                <Progress value={scorePercent} className="h-2" />
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    explainMutation.mutate();
                                }}
                                disabled={explainMutation.isPending}
                            >
                                {explainMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="h-4 w-4" />
                                )}
                            </Button>
                        </>
                    )}
                    <Badge variant={mock.status === 'completed' ? 'default' : mock.status === 'in_progress' ? 'secondary' : 'outline'}>
                        {mock.status === 'completed' ? 'Done' : mock.status === 'in_progress' ? 'Active' : 'Left'}
                    </Badge>
                </div>
            </motion.div>

            {/* AI Analysis Dialog */}
            <Dialog open={showAnalysis} onOpenChange={setShowAnalysis}>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-violet-500" /> AI Mock Analysis
                        </DialogTitle>
                        <DialogDescription>
                            AI-powered insights on your mock performance
                        </DialogDescription>
                    </DialogHeader>
                    {analysisData && (
                        <div className="space-y-4 py-2">
                            <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                                <p className="text-sm font-medium">Recommendation</p>
                                <p className="text-sm text-muted-foreground">{analysisData.summary.practice_recommendation}</p>
                            </div>
                            {analysisData.summary.weakest_topics.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium mb-2">Weakest Topics</p>
                                    <div className="flex flex-wrap gap-1">
                                        {analysisData.summary.weakest_topics.map((t, i) => (
                                            <Badge key={i} variant="outline">{t}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {analysisData.mistakes.slice(0, 3).map((m, i) => (
                                <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-2">
                                    <p className="text-sm line-clamp-2">{m.question_text}</p>
                                    <p className="text-xs text-muted-foreground">{m.explanation}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAnalysis(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// External Mock Row
function ExternalMockRow({ mock }: { mock: ExternalMock }) {
    const platformColor = platformColors[mock.platform] || platformColors['Other'];

    return (
        <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center text-white", platformColor)}>
                            {mock.platform.charAt(0)}
                        </div>
                        <div>
                            <p className="font-medium">{mock.platform}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(mock.mock_date), 'MMM d, yyyy')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-center hidden sm:block">
                            <p className="text-2xl font-bold">{mock.overall_score}</p>
                            <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-primary">{mock.percentile?.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">Percentile</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Start Mock Dialog
function StartMockDialog({ open, onOpenChange, onSuccess }: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onSuccess: (mockId: string) => void;
}) {
    const [mockType, setMockType] = useState<MockType>('full');
    const [difficulty, setDifficulty] = useState<MockDifficulty>('medium');
    const { toast } = useToast();

    const mutation = useMutation({
        mutationFn: () => catApi.startMock({ type: mockType, difficulty, generate_new: false }),
        onSuccess: (data) => {
            toast({ title: 'Mock started!' });
            onSuccess(data.id);
        },
        onError: () => toast({ title: 'Failed to start mock', variant: 'destructive' }),
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Start Mock Test</DialogTitle>
                    <DialogDescription>Choose your mock configuration</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label>Mock Type</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {mockTypes.map(type => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setMockType(type.value)}
                                    className={cn(
                                        "p-3 rounded-lg border text-left transition-colors",
                                        mockType === type.value ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                                    )}
                                >
                                    <p className="font-medium">{type.label}</p>
                                    <p className="text-xs text-muted-foreground">{type.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <Label>Difficulty</Label>
                        <Select value={difficulty} onValueChange={(v) => setDifficulty(v as MockDifficulty)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending}
                        className="bg-gradient-to-r from-violet-500 to-purple-600"
                    >
                        {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        <Play className="h-4 w-4 mr-2" />Start Mock
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Add External Mock Dialog
function AddExternalMockDialog({ open, onOpenChange, onSuccess }: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState({
        platform: 'IMS',
        mock_name: '',
        mock_date: format(new Date(), 'yyyy-MM-dd'),
        overall_score: '',
        max_score: '300',
        percentile: '',
        varc_score: '',
        dilr_score: '',
        quant_score: '',
    });
    const { toast } = useToast();

    const mutation = useMutation({
        mutationFn: () => catApi.createExternalMock({
            platform: formData.platform as any,
            mock_name: formData.mock_name || `${formData.platform} Mock`,
            mock_date: formData.mock_date,
            overall_score: parseFloat(formData.overall_score),
            max_score: parseFloat(formData.max_score) || 300,
            percentile: parseFloat(formData.percentile),
            varc_score: formData.varc_score ? parseFloat(formData.varc_score) : undefined,
            dilr_score: formData.dilr_score ? parseFloat(formData.dilr_score) : undefined,
            quant_score: formData.quant_score ? parseFloat(formData.quant_score) : undefined,
        }),
        onSuccess: () => {
            toast({ title: 'Mock added!' });
            onSuccess();
        },
        onError: () => toast({ title: 'Failed to add mock', variant: 'destructive' }),
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add External Mock</DialogTitle>
                    <DialogDescription>Record a mock from another platform</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Platform</Label>
                            <Select value={formData.platform} onValueChange={(v) => setFormData(f => ({ ...f, platform: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.keys(platformColors).map(p => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={formData.mock_date}
                                onChange={(e) => setFormData(f => ({ ...f, mock_date: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Overall Score</Label>
                            <Input
                                type="number"
                                placeholder="e.g., 85"
                                value={formData.overall_score}
                                onChange={(e) => setFormData(f => ({ ...f, overall_score: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label>Percentile</Label>
                            <Input
                                type="number"
                                placeholder="e.g., 94.5"
                                value={formData.percentile}
                                onChange={(e) => setFormData(f => ({ ...f, percentile: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label>VARC</Label>
                            <Input
                                type="number"
                                placeholder="Score"
                                value={formData.varc_score}
                                onChange={(e) => setFormData(f => ({ ...f, varc_score: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label>DILR</Label>
                            <Input
                                type="number"
                                placeholder="Score"
                                value={formData.dilr_score}
                                onChange={(e) => setFormData(f => ({ ...f, dilr_score: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label>Quant</Label>
                            <Input
                                type="number"
                                placeholder="Score"
                                value={formData.quant_score}
                                onChange={(e) => setFormData(f => ({ ...f, quant_score: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Add Mock
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
