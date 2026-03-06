import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFood, useHealthDashboard, useHealthPlan } from "@/hooks/use-health";
import { useToast } from "@/hooks/use-toast";
import {
  Activity, ArrowLeft, Camera, CheckCircle2, Dumbbell, Flame, Salad, Sparkles,
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
  const habitsTotal = data?.aggregates?.habit_logs ?? 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
        {/* Profile / plan status */}
        <section className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-4 flex items-start gap-3">
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

        {/* Today's data at a glance */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Nutrition card with macro bars */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-emerald-500/10 to-transparent p-4 flex flex-col gap-2.5 sm:col-span-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Salad className="h-4 w-4 text-emerald-400" />
              Nutrition today
            </div>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-5 w-20 rounded bg-muted animate-pulse" />
                <div className="h-2 w-full rounded-full bg-muted animate-pulse" />
              </div>
            ) : (
              <>
                <div>
                  <p className="text-xl font-semibold">{Math.round(today?.calories ?? 0)} <span className="text-sm font-normal text-muted-foreground">kcal</span></p>
                  <p className="text-xs text-muted-foreground">{Math.round(today?.protein_g ?? 0)} g protein</p>
                </div>
                {/* Calorie progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Calories</span><span>{calPct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${calPct}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Protein</span><span>{protPct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-sky-400 rounded-full transition-all" style={{ width: `${protPct}%` }} />
                  </div>
                </div>
                <button onClick={() => navigate("/wellness/nutrition")} className="text-xs text-primary underline underline-offset-2 self-start">
                  Log meal
                </button>
              </>
            )}
          </div>

          {/* Training card */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-sky-500/10 to-transparent p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Dumbbell className="h-4 w-4 text-sky-400" />
              Training
            </div>
            {isLoading ? (
              <div className="h-5 w-16 rounded bg-muted animate-pulse" />
            ) : (
              <>
                <p className="text-xl font-semibold">{today?.workout_completed ? "✓ Done" : "Not yet"}</p>
                <p className="text-xs text-muted-foreground">{data?.aggregates?.workouts ?? 0} sessions this week</p>
                <button onClick={() => navigate("/wellness/training")} className="text-xs text-primary underline underline-offset-2 self-start">
                  {today?.workout ? "View session" : "Log workout"}
                </button>
              </>
            )}
          </div>

          {/* Habits card */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-violet-500/10 to-transparent p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-violet-400" />
              Habits
            </div>
            {isLoading ? (
              <div className="h-5 w-10 rounded bg-muted animate-pulse" />
            ) : (
              <>
                <p className="text-xl font-semibold">{today?.habits_completed ?? 0}</p>
                <p className="text-xs text-muted-foreground">{habitsTotal} total logs this week</p>
                <button onClick={() => navigate("/wellness/habits")} className="text-xs text-primary underline underline-offset-2 self-start">
                  Manage habits
                </button>
              </>
            )}
          </div>
        </section>

        {/* Quick actions */}
        <section className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-semibold">Quick actions</p>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-foreground text-background text-xs font-medium active:scale-[0.97] transition cursor-pointer">
              <Camera className="h-4 w-4" />
              <span>Log meal with camera</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCameraCapture} />
            </label>
            <button onClick={() => navigate("/wellness/nutrition")} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted/60 active:scale-[0.97] transition">
              <Salad className="h-4 w-4" />
              Log meal manually
            </button>
            <button onClick={() => navigate("/wellness/training")} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted/60 active:scale-[0.97] transition">
              <Dumbbell className="h-4 w-4" />
              Log workout
            </button>
            <button onClick={() => navigate("/wellness/habits")} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted/60 active:scale-[0.97] transition">
              <Flame className="h-4 w-4" />
              Mark habit done
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">On iOS Safari, choose "Camera" to capture your meal directly. Images are analysed by AI only.</p>
        </section>
      </main>
    </div>
  );
}
