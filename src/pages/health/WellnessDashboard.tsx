import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFood, useHealthDashboard, useHealthPlan } from "@/hooks/use-health";
import { useToast } from "@/hooks/use-toast";
import {
  Activity, ArrowLeft, BarChart3, BookOpen, Brain, Camera, CheckCircle2, Dumbbell,
  Flame, Moon, Salad, Scale, Smile, Sparkles, TrendingUp, Zap,
} from "lucide-react";

export default function WellnessDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useHealthDashboard();
  const { plan } = useHealthPlan();
  const { analyzeImage } = useFood();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  const today = data?.today;
  const targets = {
    calories: plan?.nutrition?.calorie_target ?? 2000,
    protein: plan?.nutrition?.protein_target_g ?? 120,
    carbs: plan?.nutrition?.carb_target_g ?? 200,
    fat: plan?.nutrition?.fat_target_g ?? 65,
  };

  const pct = (val: number, target: number) => Math.min(100, Math.round((val / target) * 100));

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      toast({ title: "Analysing meal…", description: "AI is estimating calories and macros." });
      const res = await analyzeImage.mutateAsync({
        imageData: base64,
        mimeType: file.type || "image/jpeg",
        mealType: "unspecified",
      });
      await refetch();
      toast({ title: "Meal logged ✓", description: `${res.ai?.name ?? "Food"} · ${Math.round(res.ai?.calories ?? 0)} kcal` });
    } catch (err: any) {
      toast({ title: "Could not analyse food", description: err.message ?? "Please try again.", variant: "destructive" });
    } finally {
      e.target.value = "";
    }
  };

  const calPct = pct(today?.calories ?? 0, targets.calories);
  const protPct = pct(today?.protein_g ?? 0, targets.protein);
  const carbPct = pct(today?.carbs_g ?? 0, targets.carbs);
  const fatPct = pct(today?.fat_g ?? 0, targets.fat);

  // ─── Macro ring SVG helper ─────────────────────────────────────────
  const MacroRing = ({ value, max, color, label, unit = "kcal" }: { value: number; max: number; color: string; label: string; unit?: string }) => {
    const size = 80;
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * radius;
    const p = Math.min(1, value / (max || 1));
    const offset = circ - p * circ;

    return (
      <div className="flex flex-col items-center gap-1">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
            <circle
              cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color}
              strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={offset}
              strokeLinecap="round" className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold">{Math.round(value)}</span>
            <span className="text-[8px] text-muted-foreground">{unit}</span>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
    );
  };

  // ─── Streak badge ──────────────────────────────────────────────────
  const StreakBadge = ({ count, label, icon: Icon, color }: { count: number; label: string; icon: any; color: string }) => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-border ${count > 0 ? "bg-gradient-to-r from-" + color + "/10 to-transparent" : "bg-muted/20 opacity-60"}`}>
      <Icon className={`h-4 w-4 text-${color}`} />
      <div>
        <p className="text-sm font-bold">{count}<span className="text-[10px] font-normal text-muted-foreground ml-1">days</span></p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );

  // ─── 7-day calorie mini chart ──────────────────────────────────────
  const dailyCals = data?.dailyCalories ?? [];
  const maxCal = Math.max(...dailyCals.map((d) => d.calories), targets.calories, 1);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted/60 active:scale-95 transition">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Activity className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-400 uppercase">Wellness</p>
              <h1 className="text-base sm:text-lg font-semibold">Mind & Body Dashboard</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* ── Hero section ──────────────────────────────────────────── */}
        <section className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-transparent to-accent/5 p-4 flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold mb-0.5">
              {data?.profile ? "Personalised health profile active" : "Complete your health profile"}
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              {data?.profile
                ? plan
                  ? "Your AI plan is ready. Training, nutrition and habits are personalised for your goals."
                  : "Profile is set. Generate your personalised plan from the Plan page."
                : "Add your basics (height, weight, goal, routine) to unlock your personalised plan."}
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => navigate("/wellness/onboarding")} className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 transition">
                {data?.profile ? "Edit profile" : "Complete profile"}
              </button>
              <button onClick={() => navigate("/wellness/plan")} className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted/80 transition">
                {plan ? "View plan" : "Generate plan"}
              </button>
            </div>
          </div>
        </section>

        {/* ── Macro rings ──────────────────────────────────────────── */}
        <section className="rounded-2xl border border-border bg-gradient-to-br from-emerald-500/5 to-transparent p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Today's macros</p>
          {isLoading ? (
            <div className="flex gap-4 justify-center">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 w-20 rounded-full bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex justify-around">
              <MacroRing value={today?.calories ?? 0} max={targets.calories} color="#10b981" label="Calories" unit="kcal" />
              <MacroRing value={today?.protein_g ?? 0} max={targets.protein} color="#3b82f6" label="Protein" unit="g" />
              <MacroRing value={today?.carbs_g ?? 0} max={targets.carbs} color="#f59e0b" label="Carbs" unit="g" />
              <MacroRing value={today?.fat_g ?? 0} max={targets.fat} color="#ef4444" label="Fat" unit="g" />
            </div>
          )}
        </section>

        {/* ── 7-day calorie chart ────────────────────────────────── */}
        {dailyCals.length > 0 && (
          <section className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase">7-day calories</p>
            <div className="flex items-end gap-1.5 h-20">
              {dailyCals.map((d) => {
                const h = (d.calories / maxCal) * 100;
                const isToday = d.date === data?.range?.end;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5">
                    {d.calories > 0 && <span className="text-[8px] text-muted-foreground">{Math.round(d.calories)}</span>}
                    <div
                      className={`w-full rounded-t-md transition-all ${isToday ? "bg-emerald-500" : "bg-emerald-500/40"}`}
                      style={{ height: `${Math.max(2, h)}%` }}
                    />
                    <span className="text-[8px] text-muted-foreground">{new Date(d.date + "T12:00").toLocaleDateString("en", { weekday: "narrow" })}</span>
                  </div>
                );
              })}
            </div>
            {targets.calories > 0 && (
              <p className="text-[10px] text-muted-foreground text-center">
                Target: {targets.calories} kcal/day
              </p>
            )}
          </section>
        )}

        {/* ── Today's vitals grid ────────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Mood */}
          <div
            className="rounded-xl border border-border bg-gradient-to-br from-violet-500/10 to-transparent p-3.5 cursor-pointer hover:shadow-md transition"
            onClick={() => navigate("/wellness/mind")}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
              <Smile className="h-3.5 w-3.5 text-violet-400" /> Mood
            </div>
            {isLoading ? (
              <div className="h-5 w-10 bg-muted rounded animate-pulse" />
            ) : (
              <p className="text-lg font-bold">
                {data?.todayMood ? `${data.todayMood.mood_score}/10` : "–"}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">
              {data?.todayMood ? `E:${data.todayMood.energy_level ?? "–"} S:${data.todayMood.stress_level ?? "–"}` : "Tap to log"}
            </p>
          </div>

          {/* Sleep */}
          <div
            className="rounded-xl border border-border bg-gradient-to-br from-indigo-500/10 to-transparent p-3.5 cursor-pointer hover:shadow-md transition"
            onClick={() => navigate("/wellness/mind")}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
              <Moon className="h-3.5 w-3.5 text-indigo-400" /> Sleep
            </div>
            {isLoading ? (
              <div className="h-5 w-10 bg-muted rounded animate-pulse" />
            ) : (
              <p className="text-lg font-bold">
                {data?.todaySleep ? `${Number(data.todaySleep.duration_hours ?? 0).toFixed(1)}h` : "–"}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">
              {data?.todaySleep ? `Quality: ${"⭐".repeat(data.todaySleep.quality ?? 0)}` : "Tap to log"}
            </p>
          </div>

          {/* Training */}
          <div
            className="rounded-xl border border-border bg-gradient-to-br from-sky-500/10 to-transparent p-3.5 cursor-pointer hover:shadow-md transition"
            onClick={() => navigate("/wellness/training")}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
              <Dumbbell className="h-3.5 w-3.5 text-sky-400" /> Training
            </div>
            {isLoading ? (
              <div className="h-5 w-10 bg-muted rounded animate-pulse" />
            ) : (
              <p className="text-lg font-bold">{today?.workout_completed ? "✓ Done" : "Not yet"}</p>
            )}
            <p className="text-[10px] text-muted-foreground">{data?.aggregates?.workouts ?? 0} this week</p>
          </div>

          {/* Weight */}
          <div
            className="rounded-xl border border-border bg-gradient-to-br from-teal-500/10 to-transparent p-3.5 cursor-pointer hover:shadow-md transition"
            onClick={() => navigate("/wellness/weight")}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
              <Scale className="h-3.5 w-3.5 text-teal-400" /> Weight
            </div>
            {isLoading ? (
              <div className="h-5 w-10 bg-muted rounded animate-pulse" />
            ) : (
              <p className="text-lg font-bold">
                {data?.latestWeight ? `${data.latestWeight.weight_kg}` : "–"}
                <span className="text-[10px] font-normal text-muted-foreground ml-0.5">kg</span>
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">
              {data?.latestWeight?.date ? `as of ${data.latestWeight.date}` : "Tap to log"}
            </p>
          </div>

          {/* Habits */}
          <div
            className="rounded-xl border border-border bg-gradient-to-br from-amber-500/10 to-transparent p-3.5 cursor-pointer hover:shadow-md transition"
            onClick={() => navigate("/wellness/habits")}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" /> Habits
            </div>
            {isLoading ? (
              <div className="h-5 w-10 bg-muted rounded animate-pulse" />
            ) : (
              <p className="text-lg font-bold">{today?.habits_completed ?? 0}</p>
            )}
            <p className="text-[10px] text-muted-foreground">{data?.aggregates?.habit_logs ?? 0} total this week</p>
          </div>

          {/* Nutrition */}
          <div
            className="rounded-xl border border-border bg-gradient-to-br from-emerald-500/10 to-transparent p-3.5 cursor-pointer hover:shadow-md transition"
            onClick={() => navigate("/wellness/nutrition")}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
              <Salad className="h-3.5 w-3.5 text-emerald-400" /> Nutrition
            </div>
            {isLoading ? (
              <div className="h-5 w-10 bg-muted rounded animate-pulse" />
            ) : (
              <p className="text-lg font-bold">
                {Math.round(today?.calories ?? 0)}
                <span className="text-[10px] font-normal text-muted-foreground ml-0.5">kcal</span>
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">{calPct}% of target</p>
          </div>
        </section>

        {/* ── Streaks ──────────────────────────────────────────────── */}
        {data?.streaks && (
          <section className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-orange-400" /> Streaks
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className={`flex flex-col items-center p-2.5 rounded-xl border border-border ${data.streaks.workout > 0 ? "bg-sky-500/5" : "bg-muted/30"}`}>
                <Dumbbell className="h-4 w-4 text-sky-400 mb-1" />
                <p className="text-lg font-bold">{data.streaks.workout}</p>
                <p className="text-[9px] text-muted-foreground">Workout</p>
              </div>
              <div className={`flex flex-col items-center p-2.5 rounded-xl border border-border ${data.streaks.mood > 0 ? "bg-violet-500/5" : "bg-muted/30"}`}>
                <Smile className="h-4 w-4 text-violet-400 mb-1" />
                <p className="text-lg font-bold">{data.streaks.mood}</p>
                <p className="text-[9px] text-muted-foreground">Mood</p>
              </div>
              <div className={`flex flex-col items-center p-2.5 rounded-xl border border-border ${data.streaks.food > 0 ? "bg-emerald-500/5" : "bg-muted/30"}`}>
                <Salad className="h-4 w-4 text-emerald-400 mb-1" />
                <p className="text-lg font-bold">{data.streaks.food}</p>
                <p className="text-[9px] text-muted-foreground">Food</p>
              </div>
            </div>
          </section>
        )}

        {/* ── Weight sparkline ─────────────────────────────────────── */}
        {data?.weightTrend && data.weightTrend.length >= 2 && (() => {
          const wt = data.weightTrend;
          const vals = wt.map((w) => w.weight_kg);
          const mn = Math.min(...vals) - 0.5;
          const mx = Math.max(...vals) + 0.5;
          const rng = mx - mn || 1;
          const step = 100 / (wt.length - 1);
          const path = wt.map((w, i) => `${i === 0 ? "M" : "L"} ${i * step} ${100 - ((w.weight_kg - mn) / rng) * 100}`).join(" ");

          return (
            <section className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-teal-400" /> Weight trend (14 days)
              </p>
              <div className="h-16">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                  <path d={path} fill="none" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>{wt[0].weight_kg} kg</span>
                <span>{wt[wt.length - 1].weight_kg} kg</span>
              </div>
            </section>
          );
        })()}

        {/* ── Quick actions ───────────────────────────────────────── */}
        <section className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-semibold">Quick actions</p>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-foreground text-background text-xs font-medium active:scale-[0.97] transition cursor-pointer">
              <Camera className="h-4 w-4" />
              <span>Log meal with camera</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCameraCapture} />
            </label>
            <button onClick={() => navigate("/wellness/nutrition")} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted/60 active:scale-[0.97] transition">
              <Salad className="h-4 w-4" /> Log meal manually
            </button>
            <button onClick={() => navigate("/wellness/mind")} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted/60 active:scale-[0.97] transition">
              <Brain className="h-4 w-4" /> Mind check-in
            </button>
            <button onClick={() => navigate("/wellness/training")} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted/60 active:scale-[0.97] transition">
              <Dumbbell className="h-4 w-4" /> Log workout
            </button>
            <button onClick={() => navigate("/wellness/weekly")} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted/60 active:scale-[0.97] transition">
              <BarChart3 className="h-4 w-4" /> Weekly review
            </button>
          </div>
        </section>

        {/* ── Navigation cards ──────────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { to: "/wellness/mind", icon: Brain, label: "Mind", desc: "Mood · Sleep · Journal", color: "violet" },
            { to: "/wellness/nutrition", icon: Salad, label: "Nutrition", desc: "Meals & macros", color: "emerald" },
            { to: "/wellness/training", icon: Dumbbell, label: "Training", desc: "Workouts", color: "sky" },
            { to: "/wellness/habits", icon: CheckCircle2, label: "Habits", desc: "Daily habits", color: "amber" },
            { to: "/wellness/weight", icon: Scale, label: "Weight", desc: "Body tracker", color: "teal" },
            { to: "/wellness/weekly", icon: BarChart3, label: "Weekly", desc: "AI analysis", color: "primary" },
          ].map(({ to, icon: Icon, label, desc, color }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border border-border hover:shadow-md hover:bg-muted/40 active:scale-[0.98] transition text-left`}
            >
              <div className={`h-8 w-8 rounded-lg bg-${color}-500/20 flex items-center justify-center shrink-0`}>
                <Icon className={`h-4 w-4 text-${color}-400`} />
              </div>
              <div>
                <p className="text-xs font-semibold">{label}</p>
                <p className="text-[10px] text-muted-foreground">{desc}</p>
              </div>
            </button>
          ))}
        </section>
      </main>
    </div>
  );
}
