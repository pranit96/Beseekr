import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWeeklyReview } from "@/hooks/use-health";
import { useToast } from "@/hooks/use-toast";
import {
    ArrowLeft, BarChart3, Sparkles, ChevronDown, ChevronUp, Dumbbell, Salad,
    Smile, Moon, CheckCircle2, Trophy, Target, ArrowUpRight,
} from "lucide-react";
import { useState } from "react";

const SECTION_ICONS: Record<string, any> = {
    training: Dumbbell,
    nutrition: Salad,
    mood: Smile,
    sleep: Moon,
    habits: CheckCircle2,
};

const SECTION_COLORS: Record<string, string> = {
    training: "text-sky-400 bg-sky-500/20",
    nutrition: "text-emerald-400 bg-emerald-500/20",
    mood: "text-violet-400 bg-violet-500/20",
    sleep: "text-indigo-400 bg-indigo-500/20",
    habits: "text-amber-400 bg-amber-500/20",
};

export default function WellnessWeekly() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { reviews, isLoading, generate, isGenerating } = useWeeklyReview();
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) navigate("/auth");
    }, [loading, user, navigate]);

    const handleGenerate = async () => {
        try {
            await generate();
            toast({ title: "Weekly review generated ✓", description: "Your AI analysis is ready." });
        } catch (err: any) {
            toast({ title: "Error generating review", description: err.message, variant: "destructive" });
        }
    };

    const latestReview = reviews[0];

    const ScoreRing = ({ score, size = 72 }: { score: number; size?: number }) => {
        const strokeWidth = 5;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (score / 100) * circumference;
        const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";

        return (
            <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
                    <circle
                        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color}
                        strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset}
                        strokeLinecap="round" className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <span className="absolute text-lg font-bold" style={{ color }}>{score}</span>
            </div>
        );
    };

    const ReviewSection = ({ sectionKey, data }: { sectionKey: string; data: any }) => {
        if (!data) return null;
        const Icon = SECTION_ICONS[sectionKey] || BarChart3;
        const colorClass = SECTION_COLORS[sectionKey] || "text-muted-foreground bg-muted";
        const isOpen = expanded === sectionKey;

        return (
            <div className="rounded-xl border border-border bg-background/50 overflow-hidden">
                <button
                    onClick={() => setExpanded(isOpen ? null : sectionKey)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition"
                >
                    <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${colorClass.split(" ")[1]}`}>
                            <Icon className={`h-4 w-4 ${colorClass.split(" ")[0]}`} />
                        </div>
                        <span className="text-sm font-medium capitalize">{sectionKey}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${data.score >= 70 ? "text-green-400" : data.score >= 40 ? "text-amber-400" : "text-red-400"}`}>
                            {data.score}/100
                        </span>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                </button>
                {isOpen && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                        {data.highlights?.length > 0 && (
                            <div>
                                <p className="text-[10px] uppercase text-muted-foreground mb-1 font-semibold">Highlights</p>
                                <ul className="space-y-1">
                                    {data.highlights.map((h: string, i: number) => (
                                        <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                                            <span className="text-green-400 mt-0.5">✓</span> {h}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {data.suggestions?.length > 0 && (
                            <div>
                                <p className="text-[10px] uppercase text-muted-foreground mb-1 font-semibold">Suggestions</p>
                                <ul className="space-y-1">
                                    {data.suggestions.map((s: string, i: number) => (
                                        <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                                            <ArrowUpRight className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" /> {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
                    <button onClick={() => navigate("/wellness")} className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted/60 active:scale-95 transition">
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
                            <BarChart3 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-primary uppercase">Analysis</p>
                            <h1 className="text-base sm:text-lg font-semibold">Weekly Review</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 sm:py-6 space-y-5">
                {/* Generate CTA */}
                <section className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-accent/5 p-5 text-center space-y-3">
                    <Sparkles className="h-8 w-8 text-primary mx-auto" />
                    <h2 className="text-sm font-semibold">AI Weekly Analysis</h2>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                        Get a comprehensive review of your training, nutrition, mood, sleep and habits from the past 7 days — powered by AI.
                    </p>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="px-6 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 active:scale-[0.97] transition disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <span className="flex items-center gap-2">
                                <span className="h-3.5 w-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                Analysing your week…
                            </span>
                        ) : (
                            "Generate weekly review"
                        )}
                    </button>
                </section>

                {/* Latest review */}
                {latestReview && (
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        {latestReview.week_start} → {latestReview.week_end}
                                    </p>
                                    <h3 className="text-sm font-semibold mt-1">Latest Review</h3>
                                </div>
                                <ScoreRing score={latestReview.review?.overall_score ?? 0} />
                            </div>
                            <p className="text-xs text-foreground/80 leading-relaxed">
                                {latestReview.review?.summary}
                            </p>
                        </div>

                        {/* Section breakdowns */}
                        <div className="space-y-2">
                            {["training", "nutrition", "mood", "sleep", "habits"].map((key) => (
                                <ReviewSection key={key} sectionKey={key} data={latestReview.review?.[key as keyof typeof latestReview.review]} />
                            ))}
                        </div>

                        {/* Wins + Priorities */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {latestReview.review?.wins?.length > 0 && (
                                <div className="rounded-xl border border-border bg-green-500/5 p-4 space-y-2">
                                    <h4 className="text-xs font-semibold flex items-center gap-1.5">
                                        <Trophy className="h-3.5 w-3.5 text-green-400" /> Wins
                                    </h4>
                                    <ul className="space-y-1">
                                        {latestReview.review.wins.map((w: string, i: number) => (
                                            <li key={i} className="text-xs text-foreground/80">🎉 {w}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {latestReview.review?.next_week_priorities?.length > 0 && (
                                <div className="rounded-xl border border-border bg-amber-500/5 p-4 space-y-2">
                                    <h4 className="text-xs font-semibold flex items-center gap-1.5">
                                        <Target className="h-3.5 w-3.5 text-amber-400" /> Next Week
                                    </h4>
                                    <ul className="space-y-1">
                                        {latestReview.review.next_week_priorities.map((p: string, i: number) => (
                                            <li key={i} className="text-xs text-foreground/80">→ {p}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Historical reviews */}
                {reviews.length > 1 && (
                    <section className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase">Past reviews</h3>
                        <div className="space-y-2">
                            {reviews.slice(1).map((r) => (
                                <div key={r.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background/50 border border-border/50">
                                    <div>
                                        <p className="text-xs font-medium">{r.week_start} → {r.week_end}</p>
                                        <p className="text-[10px] text-muted-foreground line-clamp-1">{r.review?.summary}</p>
                                    </div>
                                    <span className={`text-sm font-bold ${(r.review?.overall_score ?? 0) >= 70 ? "text-green-400" : (r.review?.overall_score ?? 0) >= 40 ? "text-amber-400" : "text-red-400"}`}>
                                        {r.review?.overall_score ?? "–"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {isLoading && !reviews.length && (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
