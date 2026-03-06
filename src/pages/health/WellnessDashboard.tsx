import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useHealthDashboard } from "@/hooks/use-health";
import {
  Activity,
  ArrowLeft,
  Camera,
  Dumbbell,
  Salad,
  Sparkles,
} from "lucide-react";
import { useFood } from "@/hooks/use-health";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export default function WellnessDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useHealthDashboard();
  const { analyzeImage } = useFood();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

  const handleCameraCapture = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = URL.createObjectURL(file);
      toast({
        title: "Analyzing meal...",
        description: "Using AI to estimate calories and macros.",
      });
      const res = await analyzeImage.mutateAsync({
        imageUrl: url,
        mealType: "unspecified",
      });
      await refetch();
      toast({
        title: "Meal logged",
        description: `${res.ai?.name ?? "Food"} • ${Math.round(
          res.ai?.calories ?? 0,
        )} kcal`,
      });
    } catch (err: any) {
      toast({
        title: "Could not analyze food",
        description: err.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      e.target.value = "";
    }
  };

  const today = data?.today;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted/60 active:scale-95 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Activity className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-400 uppercase">
                Wellness
              </p>
              <h1 className="text-base sm:text-lg font-semibold">
                Mind & Body Dashboard
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Plan status / onboarding hint */}
        <section className="rounded-2xl border border-border bg-muted/40 p-4 flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold mb-1">
              {data?.profile
                ? "Personalised health profile active"
                : "Set up your health profile"}
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              {data?.profile
                ? "We’re tailoring training, nutrition and habits for your goals."
                : "Add your basics once – height, weight, goal and routine – to get a realistic plan."}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate("/wellness/onboarding")}
                className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 transition"
              >
                {data?.profile ? "Edit profile" : "Complete profile"}
              </button>
              <button
                onClick={() => navigate("/wellness/plan")}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted/80 transition"
              >
                View plan
              </button>
            </div>
          </div>
        </section>

        {/* Today summary */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-emerald-500/10 to-transparent p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Salad className="h-4 w-4 text-emerald-400" />
              Nutrition today
            </div>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-5 w-20 rounded bg-muted animate-pulse" />
                <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              </div>
            ) : (
              <>
                <p className="text-xl font-semibold">
                  {Math.round(today?.calories ?? 0)} kcal
                </p>
                <p className="text-xs text-muted-foreground">
                  {Math.round(today?.protein_g ?? 0)} g protein
                </p>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-gradient-to-br from-sky-500/10 to-transparent p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Dumbbell className="h-4 w-4 text-sky-400" />
              Training
            </div>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-5 w-16 rounded bg-muted animate-pulse" />
                <div className="h-4 w-28 rounded bg-muted animate-pulse" />
              </div>
            ) : (
              <>
                <p className="text-xl font-semibold">
                  {today?.workout_completed ? "Done" : "Not yet"}
                </p>
                <button
                  onClick={() => navigate("/wellness/training")}
                  className="text-xs text-primary underline underline-offset-2 self-start"
                >
                  {today?.workout ? "View session" : "Log workout"}
                </button>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-gradient-to-br from-violet-500/10 to-transparent p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-4 w-4 text-violet-400" />
              Habits
            </div>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-5 w-10 rounded bg-muted animate-pulse" />
                <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              </div>
            ) : (
              <>
                <p className="text-xl font-semibold">
                  {today?.habits_completed ?? 0}
                </p>
                <button
                  onClick={() => navigate("/wellness/habits")}
                  className="text-xs text-primary underline underline-offset-2 self-start"
                >
                  Manage habits
                </button>
              </>
            )}
          </div>
        </section>

        {/* Quick actions including camera-friendly food logging */}
        <section className="rounded-2xl border border-border bg-muted/30 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Quick actions</p>
            {isMobile && (
              <span className="text-[11px] text-muted-foreground">
                Optimized for mobile camera
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Camera-based food logging - works on iOS Safari */}
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-foreground text-background text-xs font-medium active:scale-[0.97] transition cursor-pointer">
              <Camera className="h-4 w-4" />
              <span>Log meal with camera</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleCameraCapture}
              />
            </label>

            <button
              onClick={() => navigate("/wellness/nutrition")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted/60 active:scale-[0.97] transition"
            >
              <Salad className="h-4 w-4" />
              Log meal manually
            </button>

            <button
              onClick={() => navigate("/wellness/training")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted/60 active:scale-[0.97] transition"
            >
              <Dumbbell className="h-4 w-4" />
              Log workout
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            On iOS Safari, choose “Camera” when prompted so you can capture your
            meal directly. We never store images in the browser cache.
          </p>
        </section>
      </main>
    </div>
  );
}

