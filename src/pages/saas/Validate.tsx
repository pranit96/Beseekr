import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Loader2,
    AlertCircle,
    ClipboardCheck,
    ArrowRight,
    TrendingUp,
    DollarSign,
    Users,
    BarChart3,
    Zap,
    Quote,
    ThumbsUp,
} from 'lucide-react';
import { problemsApi } from '@/api/problems';
import type { ValidationResult } from '@/types/problems';
import { cn } from '@/lib/utils';

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

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        if (score >= 40) return 'text-orange-500';
        return 'text-red-500';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Strong Validation';
        if (score >= 60) return 'Good Potential';
        if (score >= 40) return 'Moderate Interest';
        return 'Needs Research';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text flex items-center gap-2">
                    <ClipboardCheck className="h-6 w-6 text-primary" />
                    Validate Your Idea
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Describe your problem idea and we'll validate it against real market data
                </p>
            </div>

            {/* Input Form */}
            {!result && (
                <Card>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Textarea
                                    placeholder="Describe the problem you want to solve...

For example: 'Developers struggle to find and fix security vulnerabilities in their code before deploying to production. Current tools are slow and generate too many false positives.'"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    rows={6}
                                    className="resize-none text-base"
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                    Be specific about the problem, target audience, and pain points for better validation
                                </p>
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={!text.trim() || isPending} size="lg">
                                    {isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Validating...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="h-4 w-4 mr-2" />
                                            Validate Problem
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Loading State */}
            {isPending && (
                <div className="space-y-4">
                    <Skeleton className="h-40 w-full" />
                    <div className="grid gap-4 md:grid-cols-2">
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                    </div>
                </div>
            )}

            {/* Error State */}
            {isError && !result && (
                <Card className="border-destructive/50">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                        <p className="text-sm text-muted-foreground">
                            {error instanceof Error ? error.message : 'Validation failed. Please try again.'}
                        </p>
                        <Button variant="outline" className="mt-4" onClick={handleReset}>
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Validation Result */}
            {result && (
                <div className="space-y-6">
                    {/* Main Score Card */}
                    <Card className="border-2 border-primary/30 bg-gradient-to-br from-background to-primary/5">
                        <CardContent className="p-8">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="text-center md:text-left">
                                    <p className="text-sm text-muted-foreground mb-1">Validation Score</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className={cn('text-6xl font-bold', getScoreColor(result.validation_score))}>
                                            {result.validation_score}
                                        </span>
                                        <span className="text-2xl text-muted-foreground">/100</span>
                                    </div>
                                    <p className={cn('text-sm font-medium mt-1', getScoreColor(result.validation_score))}>
                                        {getScoreLabel(result.validation_score)}
                                    </p>
                                </div>

                                <div className="flex-1 max-w-md w-full">
                                    <p className="text-sm text-muted-foreground mb-2">Match Score</p>
                                    <Progress value={result.match_score * 100} className="h-3" />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {Math.round(result.match_score * 100)}% match with existing validated problems
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Nearest Problem */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Most Similar Validated Problem</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <h3 className="font-semibold text-lg">{result.nearest_problem.title}</h3>
                            <p className="text-sm text-muted-foreground mt-2">{result.nearest_problem.summary}</p>
                            <Button variant="outline" size="sm" onClick={handleExplore} className="mt-4 gap-2">
                                Explore this Problem
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Signals Grid */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <TrendingUp className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{result.signals.frequency_30d}</p>
                                        <p className="text-xs text-muted-foreground">Frequency (30d)</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        'w-10 h-10 rounded-lg flex items-center justify-center',
                                        result.signals.trend_pct >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                                    )}>
                                        <TrendingUp className={cn('h-5 w-5', result.signals.trend_pct >= 0 ? 'text-green-500' : 'text-red-500')} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {result.signals.trend_pct > 0 ? '+' : ''}{result.signals.trend_pct}%
                                        </p>
                                        <p className="text-xs text-muted-foreground">Trend</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                        <ThumbsUp className="h-5 w-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{result.signals.upvote_weighted}</p>
                                        <p className="text-xs text-muted-foreground">Weighted Upvotes</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                        <DollarSign className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{result.signals.pricing_signals}</p>
                                        <p className="text-xs text-muted-foreground">Pricing Signals</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{result.signals.competitors}</p>
                                        <p className="text-xs text-muted-foreground">Competitors</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                        <BarChart3 className="h-5 w-5 text-cyan-500" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold">{result.signals.market_estimate}</p>
                                        <p className="text-xs text-muted-foreground">Market Size</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Justification */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <p className="text-sm leading-relaxed">{result.justification}</p>
                        </CardContent>
                    </Card>

                    {/* Quotes */}
                    {result.quotes && result.quotes.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Quote className="h-4 w-4" />
                                    Related Quotes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-3">
                                {result.quotes.slice(0, 3).map((quote, i) => (
                                    <div key={quote.id || i} className="border-l-2 border-primary/30 pl-3">
                                        <p className="text-sm italic">"{quote.text}"</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            — {quote.source}{quote.author && `, ${quote.author}`}
                                        </p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Reset Button */}
                    <div className="flex justify-center pt-4">
                        <Button variant="outline" onClick={handleReset} size="lg">
                            Validate Another Idea
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Validate;
