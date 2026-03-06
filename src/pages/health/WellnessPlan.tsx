import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useHealthDashboard, useHealthPlan } from "@/hooks/use-health";
import { useToast } from "@/hooks/use-toast";
import {
  Activity, ArrowLeft, Dumbbell, Flame, RefreshCw, Salad, Sparkles, Target, Zap,
} from "lucide-react";

export default function WellnessPlan() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: dashboard } = useHealthDashboard();
  const { plan, isLoading, isGenerating, generate } = useHealthPlan();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  const nutrition = plan?.nutrition;
  const training = plan?.training;

  const macros = [
    { label: "Calories", value: nutrition?.calorie_target, unit: "kcal", color: "bg-orange-400" },
    { label: "Protein", value: nutrition?.protein_target_g, unit: "g", color: "bg-sky-400" },
    { label: "Carbs", value: nutrition?.carb_target_g, unit: "g", color: "bg-emerald-400" },
    { label: "Fat", value: nutrition?.fat_target_g, unit: "g", color: "bg-violet-400" },
  ];

  const handleRegenerate = async () => {
    try {
      await generate({});
      toast({ title: "Plan updated", description: "Your personalised plan has been regenerated." });
    } catch (err: any) {
      toast({ title: "Could not regenerate plan", description: err.message ?? "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted/60 active:scale-95 transition">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-400 uppercase">Health plan</p>
              <h1 className="text-base sm:text-lg font-semibold">Training, nutrition & habits</h1>
            </div>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted/60 disabled:opacity-60 flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Generating…" : "Regenerate"}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {isLoading && !plan ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : isGenerating ? (
          <div className="rounded-2xl border border-border bg-muted/30 p-8 flex flex-col items-center gap-3 text-center">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-emerald-400 animate-pulse" />
            </div>
            <p className="text-sm font-semibold">Generating your personalised plan…</p>
            <p className="text-xs text-muted-foreground">Claude is analysing your profile and building a realistic plan. This takes ~15–30 seconds.</p>
          </div>
        ) : !plan ? (
          <div className="rounded-2xl border border-border bg-muted/30 p-6 flex flex-col items-center gap-4 text-center">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold mb-1">No plan yet</p>
              <p className="text-xs text-muted-foreground mb-3">Complete your health profile, then generate a personalised training + nutrition plan.</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => navigate("/wellness/onboarding")} className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium">
                  Complete profile
                </button>
                <button onClick={handleRegenerate} className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted/60">
                  Generate plan
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Overview */}
            <section className="rounded-2xl border border-border bg-gradient-to-br from-emerald-500/10 to-transparent p-4 sm:p-5 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-[11px] uppercase text-muted-foreground font-medium tracking-wide">Goal</p>
                  <h2 className="text-sm font-semibold capitalize">
                    {plan.overview?.primary_goal?.replace(/_/g, " ") ?? "Custom"} · {plan.overview?.timeframe_weeks ?? 12} weeks
                  </h2>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {plan.overview?.key_focus_areas?.map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-background text-[11px] border border-border">{tag}</span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{plan.overview?.summary}</p>
            </section>

            {/* Macro targets */}
            {nutrition && (
              <section className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-400" />
                  <h3 className="text-sm font-semibold">Daily nutrition targets</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {macros.map(m => (
                    <div key={m.label} className="rounded-xl bg-background/60 border border-border/60 p-2.5 text-center">
                      <p className="text-lg font-bold">{m.value ?? "—"}</p>
                      <p className="text-[11px] text-muted-foreground">{m.unit} {m.label}</p>
                      <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${m.color} rounded-full`} style={{ width: "100%" }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">Strategy: {nutrition.strategy?.replace(/_/g, " ")}</p>
              </section>
            )}

            {/* Training sessions */}
            {training && (
              <section className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-sky-400" />
                  <h3 className="text-sm font-semibold">
                    Training · {training.weekly_frequency} sessions/week · {training.split?.replace(/_/g, " ")}
                  </h3>
                </div>
                <div className="space-y-2">
                  {training.sessions?.map((s: any, idx: number) => (
                    <div key={idx} className="rounded-xl bg-background/60 border border-border/60 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold">{s.day} · <span className="text-muted-foreground font-normal">{s.focus}</span></p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${s.intensity === "hard" ? "bg-red-500/15 text-red-400" :
                            s.intensity === "moderate" ? "bg-amber-500/15 text-amber-400" :
                              "bg-emerald-500/15 text-emerald-400"
                          }`}>{s.intensity}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-2">{s.duration_minutes} min</p>
                      {s.exercises?.length > 0 && (
                        <div className="space-y-1">
                          {s.exercises.map((ex: any, ei: number) => (
                            <div key={ei} className="flex items-center justify-between text-[11px]">
                              <span>{ex.name}</span>
                              <span className="text-muted-foreground">{ex.sets}×{ex.reps} · {ex.rest_seconds}s rest</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {s.cardio && (
                        <p className="text-[11px] text-muted-foreground mt-1.5">
                          Cardio: {s.cardio.type} · {s.cardio.duration_minutes} min · {s.cardio.intensity}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Example meals */}
            {nutrition?.example_meals?.length > 0 && (
              <section className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Salad className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold">Example meals</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {nutrition.example_meals.map((m: any, i: number) => (
                    <div key={i} className="rounded-xl bg-background/60 border border-border/60 p-2.5">
                      <p className="text-xs font-semibold">{m.label}</p>
                      <p className="text-[11px] text-muted-foreground">{m.description}</p>
                      {m.approx_macros && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          ~{m.approx_macros.calories} kcal · {m.approx_macros.protein}g P · {m.approx_macros.carbs}g C · {m.approx_macros.fat}g F
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Habits */}
            {plan.habits?.daily?.length > 0 && (
              <section className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-violet-400" />
                  <h3 className="text-sm font-semibold">Recommended habits</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  {plan.habits.daily.map((h: any, i: number) => (
                    <div key={i} className="rounded-xl bg-background/60 border border-border/60 p-2.5">
                      <p className="font-medium">{h.name}</p>
                      <p className="text-[11px] text-muted-foreground">{h.how} · {h.target_per_day} {h.unit}/day</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Mindset */}
            {plan.mindset?.guidelines?.length > 0 && (
              <section className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm font-semibold">Mindset guidelines</h3>
                </div>
                <ul className="space-y-1.5">
                  {plan.mindset.guidelines.map((g: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400/60 flex-shrink-0" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
