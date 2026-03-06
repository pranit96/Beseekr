import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWeight, useHealthProfile } from "@/hooks/use-health";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Scale, TrendingDown, TrendingUp, Minus, Trash2, Target } from "lucide-react";

export default function WellnessWeight() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { history, isLoading, logWeight, deleteWeight } = useWeight();
    const { data: profile } = useHealthProfile();

    const [weightKg, setWeightKg] = useState("");
    const [bodyFatPct, setBodyFatPct] = useState("");

    useEffect(() => {
        if (!loading && !user) navigate("/auth");
    }, [loading, user, navigate]);

    const handleSubmit = async () => {
        const kg = Number(weightKg);
        if (!kg || kg < 20 || kg > 300) {
            toast({ title: "Invalid weight", description: "Enter a valid weight in kg", variant: "destructive" });
            return;
        }
        try {
            await logWeight.mutateAsync({
                weightKg: kg,
                bodyFatPct: bodyFatPct ? Number(bodyFatPct) : undefined,
            });
            setWeightKg("");
            setBodyFatPct("");
            toast({ title: "Weight logged ✓", description: `${kg} kg recorded` });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    // ─── Chart data ────────────────────────────────────────────────────
    const sorted = [...history].sort((a, b) => a.log_date.localeCompare(b.log_date));
    const chartData = sorted.slice(-30);
    const weights = chartData.map((w) => Number(w.weight_kg));
    const minW = weights.length > 0 ? Math.min(...weights) - 1 : 50;
    const maxW = weights.length > 0 ? Math.max(...weights) + 1 : 100;
    const rangeW = maxW - minW || 1;

    const targetWeight = profile?.targetWeightKg ?? (profile as any)?.target_weight_kg;
    const currentWeight = weights.length > 0 ? weights[weights.length - 1] : null;
    const firstWeight = weights.length > 0 ? weights[0] : null;
    const change = currentWeight && firstWeight ? currentWeight - firstWeight : null;

    // Build SVG path for sparkline
    const buildPath = () => {
        if (chartData.length < 2) return "";
        const step = 100 / (chartData.length - 1);
        return chartData.map((w, i) => {
            const x = i * step;
            const y = 100 - ((Number(w.weight_kg) - minW) / rangeW) * 100;
            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
        }).join(" ");
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
                    <button onClick={() => navigate("/wellness")} className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted/60 active:scale-95 transition">
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-teal-500/20 flex items-center justify-center">
                            <Scale className="h-4 w-4 text-teal-400" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-teal-400 uppercase">Body</p>
                            <h1 className="text-base sm:text-lg font-semibold">Weight Tracker</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 sm:py-6 space-y-5">
                {/* Log weight */}
                <section className="rounded-2xl border border-border bg-gradient-to-br from-teal-500/10 to-transparent p-5 space-y-4">
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                        <Scale className="h-4 w-4 text-teal-400" /> Log today's weight
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground">Weight (kg) *</label>
                            <input
                                type="number" step="0.1" min="20" max="300"
                                value={weightKg} onChange={(e) => setWeightKg(e.target.value)}
                                placeholder="72.5"
                                className="w-full bg-background/50 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground">Body fat % (optional)</label>
                            <input
                                type="number" step="0.1" min="3" max="60"
                                value={bodyFatPct} onChange={(e) => setBodyFatPct(e.target.value)}
                                placeholder="18.5"
                                className="w-full bg-background/50 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={logWeight.isPending || !weightKg}
                        className="w-full py-2.5 rounded-xl bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 active:scale-[0.98] transition disabled:opacity-50"
                    >
                        {logWeight.isPending ? "Saving…" : "Log weight"}
                    </button>
                </section>

                {/* Progress card */}
                {currentWeight && (
                    <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase mb-1">Current</p>
                            <p className="text-xl font-bold">{currentWeight}<span className="text-xs font-normal text-muted-foreground ml-1">kg</span></p>
                        </div>
                        {targetWeight && (
                            <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase mb-1 flex items-center justify-center gap-1">
                                    <Target className="h-3 w-3" /> Target
                                </p>
                                <p className="text-xl font-bold">{targetWeight}<span className="text-xs font-normal text-muted-foreground ml-1">kg</span></p>
                            </div>
                        )}
                        {change !== null && (
                            <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase mb-1">Change (30d)</p>
                                <p className={`text-xl font-bold flex items-center justify-center gap-1 ${change < 0 ? "text-green-400" : change > 0 ? "text-rose-400" : "text-muted-foreground"}`}>
                                    {change < 0 ? <TrendingDown className="h-4 w-4" /> : change > 0 ? <TrendingUp className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                                    {Math.abs(change).toFixed(1)}
                                    <span className="text-xs font-normal text-muted-foreground">kg</span>
                                </p>
                            </div>
                        )}
                    </section>
                )}

                {/* 30-day trend chart */}
                {chartData.length >= 2 && (
                    <section className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase">30-day trend</h3>
                        <div className="relative h-40 w-full">
                            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                                {/* Grid lines */}
                                {[0, 25, 50, 75, 100].map((y) => (
                                    <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="hsl(var(--border))" strokeWidth="0.3" strokeDasharray="2 2" />
                                ))}
                                {/* Target line */}
                                {targetWeight && targetWeight >= minW && targetWeight <= maxW && (
                                    <line
                                        x1="0" y1={100 - ((targetWeight - minW) / rangeW) * 100}
                                        x2="100" y2={100 - ((targetWeight - minW) / rangeW) * 100}
                                        stroke="#14b8a6" strokeWidth="0.5" strokeDasharray="3 2" opacity={0.7}
                                    />
                                )}
                                {/* Weight line */}
                                <path d={buildPath()} fill="none" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                {/* Dots */}
                                {chartData.map((w, i) => {
                                    const step = 100 / (chartData.length - 1);
                                    const x = i * step;
                                    const y = 100 - ((Number(w.weight_kg) - minW) / rangeW) * 100;
                                    return <circle key={i} cx={x} cy={y} r="1.2" fill="#14b8a6" />;
                                })}
                            </svg>
                            {/* Y-axis labels */}
                            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[9px] text-muted-foreground -ml-1">
                                <span>{maxW.toFixed(0)}</span>
                                <span>{((minW + maxW) / 2).toFixed(0)}</span>
                                <span>{minW.toFixed(0)}</span>
                            </div>
                        </div>
                        <div className="flex justify-between text-[9px] text-muted-foreground px-1">
                            <span>{chartData[0]?.log_date}</span>
                            <span>{chartData[chartData.length - 1]?.log_date}</span>
                        </div>
                    </section>
                )}

                {/* Recent entries */}
                {sorted.length > 0 && (
                    <section className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase">Log history</h3>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto">
                            {sorted.slice().reverse().slice(0, 20).map((w) => (
                                <div key={w.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/50 border border-border/50">
                                    <div>
                                        <p className="text-xs font-medium">{Number(w.weight_kg).toFixed(1)} kg{w.body_fat_pct ? ` · ${Number(w.body_fat_pct).toFixed(1)}% BF` : ""}</p>
                                        <p className="text-[10px] text-muted-foreground">{w.log_date}{w.notes ? ` · ${w.notes}` : ""}</p>
                                    </div>
                                    <button onClick={() => deleteWeight.mutateAsync(w.id)} className="text-muted-foreground hover:text-destructive transition">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {isLoading && !history.length && (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
