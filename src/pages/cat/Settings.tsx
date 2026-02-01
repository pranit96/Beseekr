import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catApi } from '@/api/cat';
import { CatSettings } from '@/types/cat';
import { format } from 'date-fns';
import { Settings as SettingsIcon, Calendar, Target, Clock, Bell, Download, Loader2, Save, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: settings, isLoading } = useQuery({
        queryKey: ['cat-settings'],
        queryFn: () => catApi.getCatSettings(),
    });

    const [form, setForm] = useState<Partial<CatSettings>>({});

    // Initialize form when settings load
    useMemo(() => {
        if (settings) {
            setForm(settings);
        }
    }, [settings]);

    const updateMutation = useMutation({
        mutationFn: (payload: Partial<CatSettings>) => catApi.updateCatSettings(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cat-settings'] });
            queryClient.invalidateQueries({ queryKey: ['cat-dashboard'] });
            toast({ title: 'Settings saved!' });
        },
        onError: () => toast({ title: 'Failed to save settings', variant: 'destructive' }),
    });

    const exportMutation = useMutation({
        mutationFn: () => catApi.exportData('json'),
        onSuccess: (blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cat-prep-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
            a.click();
            toast({ title: 'Data exported!' });
        },
        onError: () => toast({ title: 'Export failed', variant: 'destructive' }),
    });

    const handleSave = () => {
        updateMutation.mutate(form);
    };

    if (isLoading) {
        return <div className="flex justify-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <SettingsIcon className="h-7 w-7 text-primary" />
                    CAT Settings
                </h1>
                <p className="text-muted-foreground">Customize your preparation</p>
            </div>

            {/* Exam Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" />Exam Details</CardTitle>
                    <CardDescription>Set your target exam date</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Target Exam Date</Label>
                        <Input type="date" value={form.target_exam_date ? format(new Date(form.target_exam_date), 'yyyy-MM-dd') : ''}
                            onChange={e => setForm({ ...form, target_exam_date: e.target.value })} />
                    </div>
                    <div>
                        <Label>Target Percentile</Label>
                        <Input type="number" value={form.target_percentile || ''} onChange={e => setForm({ ...form, target_percentile: parseInt(e.target.value) })}
                            placeholder="e.g., 99" min="50" max="100" />
                    </div>
                    <div>
                        <Label>Preferred Slot</Label>
                        <Select value={form.preferred_slot || ''} onValueChange={v => setForm({ ...form, preferred_slot: v as any })}>
                            <SelectTrigger><SelectValue placeholder="Select slot" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="slot_1">Slot 1 (Morning)</SelectItem>
                                <SelectItem value="slot_2">Slot 2 (Afternoon)</SelectItem>
                                <SelectItem value="slot_3">Slot 3 (Evening)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Daily Goals */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-emerald-500" />Daily Goals</CardTitle>
                    <CardDescription>Set your daily study targets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Study Hours / Day</Label>
                            <Input type="number" value={form.daily_study_hours_goal || ''} onChange={e => setForm({ ...form, daily_study_hours_goal: parseInt(e.target.value) })}
                                min="1" max="12" />
                        </div>
                        <div>
                            <Label>Questions / Day</Label>
                            <Input type="number" value={form.daily_question_goal || ''} onChange={e => setForm({ ...form, daily_question_goal: parseInt(e.target.value) })}
                                min="5" max="100" />
                        </div>
                    </div>
                    <div>
                        <Label>Mocks / Week</Label>
                        <Input type="number" value={form.weekly_mocks_goal || ''} onChange={e => setForm({ ...form, weekly_mocks_goal: parseInt(e.target.value) })}
                            min="1" max="7" />
                    </div>
                </CardContent>
            </Card>

            {/* Mock Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-amber-500" />Mock Test Settings</CardTitle>
                    <CardDescription>Configure mock behavior</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Sectional Time Limit (minutes)</Label>
                        <Input type="number" value={form.sectional_time_limit || 60} onChange={e => setForm({ ...form, sectional_time_limit: parseInt(e.target.value) })}
                            min="30" max="90" />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enforce Sectional Timing</Label>
                            <p className="text-sm text-muted-foreground">Prevent moving between sections</p>
                        </div>
                        <Switch checked={form.enforce_sectional_timing ?? true} onCheckedChange={v => setForm({ ...form, enforce_sectional_timing: v })} />
                    </div>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-violet-500" />Notifications</CardTitle>
                    <CardDescription>Manage reminders</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Daily Reminder Email</Label>
                            <p className="text-sm text-muted-foreground">Get daily study reminders</p>
                        </div>
                        <Switch checked={form.email_daily_reminder ?? false} onCheckedChange={v => setForm({ ...form, email_daily_reminder: v })} />
                    </div>
                    {form.email_daily_reminder && (
                        <div>
                            <Label>Reminder Time</Label>
                            <Input type="time" value={form.reminder_time || '08:00'} onChange={e => setForm({ ...form, reminder_time: e.target.value })} />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Data */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" />Data</CardTitle>
                    <CardDescription>Export your preparation data</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
                        {exportMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                        Export All Data (JSON)
                    </Button>
                </CardContent>
            </Card>

            <Separator />

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={updateMutation.isPending} size="lg">
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Settings
                </Button>
            </div>
        </div>
    );
}
