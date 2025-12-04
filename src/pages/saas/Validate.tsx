import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    Loader2,
    AlertCircle,
    ClipboardCheck,
    ArrowRight,
    TrendingUp,
    DollarSign,
    Users,
    BarChart3,
} from 'lucide-react';
import { QuoteList } from '@/components/saas/QuoteList';
import { problemsApi } from '@/api/problems';
import type { ValidationResult } from '@/types/problems';

export function Validate() {
    const navigate = useNavigate();
    const [text, setText] = useState('');
    const [result, setResult] = useState<ValidationResult | null>(null);

    const {
        mutate: validate,
        isPending,
        isError,
        error,
        reset,
    } = useMutation({
        mutationFn: (problemText: string) => problemsApi.validateProblem(problemText),
        onSuccess: (data) => {
            setResult(data);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            validate(text.trim());
        }
    };

    const handleExplore = () => {
        if (result?.nearest_problem?.id) {
            navigate(`/dashboard/problems/${result.nearest_problem.id}`);
        }
    };

    const handleReset = () => {
        setText('');
        setResult(null);
        reset();
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <ClipboardCheck className="h-6 w-6" />
                    Validate Your Idea
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Describe your problem idea and we'll validate it against real market data
                </p>
            </div>

            {/* Input Form */}
            {!result && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Textarea
                            placeholder="Describe the problem you want to solve..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={6}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Be specific about the problem, target audience, and pain points
                        </p>
                    </div>
                    <Button type="submit" disabled={!text.trim() || isPending}>
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Validating...
                            </>
                        ) : (
                            'Validate Problem'
                        )}
                    </Button>
                </form>
            )}

            {/* Loading State */}
            {isPending && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Error State */}
            {isError && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                    <p className="text-sm text-muted-foreground">
                        {error instanceof Error ? error.message : 'Validation failed'}
                    </p>
                    <Button variant="outline" className="mt-4" onClick={handleReset}>
                        Try Again
                    </Button>
                </div>
            )}

            {/* Validation Result */}
            {result && (
                <div className="space-y-6">
                    {/* Validation Score */}
                    <Card className="border-2 border-primary">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-2">Validation Score</p>
                                <p className="text-6xl font-bold text-primary">
                                    {result.validation_score}
                                    <span className="text-2xl text-muted-foreground">/100</span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Match Score */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Match Score</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Progress value={result.match_score * 100} className="h-2" />
                            <p className="text-sm text-muted-foreground">
                                {Math.round(result.match_score * 100)}% match with existing problems
                            </p>
                        </CardContent>
                    </Card>

                    {/* Nearest Problem */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Nearest Problem</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <h3 className="font-medium">{result.nearest_problem.title}</h3>
                            <p className="text-sm text-muted-foreground">{result.nearest_problem.summary}</p>
                            <Button variant="outline" size="sm" onClick={handleExplore}>
                                Explore this Problem
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Signals */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Validation Signals</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-lg font-semibold">{result.signals.frequency_30d}</p>
                                        <p className="text-xs text-muted-foreground">Frequency (30d)</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-lg font-semibold">
                                            {result.signals.trend_pct > 0 ? '+' : ''}{result.signals.trend_pct}%
                                        </p>
                                        <p className="text-xs text-muted-foreground">Trend</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-lg font-semibold">{result.signals.upvote_weighted}</p>
                                        <p className="text-xs text-muted-foreground">Weighted Upvotes</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-lg font-semibold">{result.signals.pricing_signals}</p>
                                        <p className="text-xs text-muted-foreground">Pricing Signals</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-lg font-semibold">{result.signals.competitors}</p>
                                        <p className="text-xs text-muted-foreground">Competitors</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-lg font-semibold">{result.signals.market_estimate}</p>
                                        <p className="text-xs text-muted-foreground">Market Size</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Justification */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">{result.justification}</p>
                        </CardContent>
                    </Card>

                    {/* Quotes */}
                    <QuoteList quotes={result.quotes} title="Related Quotes" maxItems={5} />

                    {/* Reset Button */}
                    <div className="flex justify-center">
                        <Button variant="outline" onClick={handleReset}>
                            Validate Another Idea
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Validate;
