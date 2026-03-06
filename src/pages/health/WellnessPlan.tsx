import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useHealthDashboard, useHealthPlan } from "@/hooks/use-health";
import { Activity, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WellnessPlan() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: dashboard } = useHealthDashboard();
  const planMutation = useHealthPlan();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

  const handleRegenerate = async () => {
    try {
      await planMutation.mutateAsync({});
      toast({
        title: "Plan updated",
        description: "Your health plan has been regenerated.",
      });
    } catch (err: any) {
      toast({
        title: "Could not regenerate plan",
        description: err.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  const plan = (planMutation.data ??
    (dashboard as any)?.plan) as any | undefined;

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
                Health plan
              </p>
              <h1 className="text-base sm:text-lg font-semibold">
                Training, nutrition & habits
              </h1>
            </div>
          </div>
          <div className="ml-auto">
            <button
              onClick={handleRegenerate}
              disabled={planMutation.isPending}
              className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted/60 disabled:opacity-60"
            >
              {planMutation.isPending ? "Regenerating..." : "Regenerate plan"}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {!plan ? (
          <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            No plan yet. Complete your profile from the Wellness dashboard to
            generate a personalised plan.
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground font-medium">
                    Overview
                  </p>
                  <h2 className="text-sm font-semibold">
                    Goal:{" "}
                    <span className="capitalize">
                      {plan.overview?.primary_goal?.replace("_", " ") ??
                        "Custom"}
                    </span>
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  {plan.overview?.timeframe_weeks ?? 12}‑week horizon
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {plan.overview?.summary}
              </p>
              {plan.overview?.key_focus_areas?.length ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {plan.overview.key_focus_areas.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full bg-background text-[11px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-5 space-y-3">
                <h3 className="text-sm font-semibold">Training</h3>
                <p className="text-xs text-muted-foreground">
                  {plan.training?.weekly_frequency ?? 3} sessions / week • Split:{" "}
                  {plan.training?.split}
                </p>
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {plan.training?.sessions?.map((s: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-xl bg-background/60 border border-border/60 p-2.5"
                    >
                      <p className="text-xs font-semibold">
                        {s.day || `Session ${idx + 1}`} •{" "}
                        <span className="text-muted-foreground font-normal">
                          {s.focus}
                        </span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {s.duration_minutes} min • {s.intensity}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-5 space-y-3">
                <h3 className="text-sm font-semibold">Nutrition</h3>
                <p className="text-xs text-muted-foreground">
                  Target: {plan.nutrition?.calorie_target} kcal •{" "}
                  {plan.nutrition?.protein_target_g} g protein •{" "}
                  {plan.nutrition?.carb_target_g} g carbs •{" "}
                  {plan.nutrition?.fat_target_g} g fat
                </p>
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {plan.nutrition?.example_meals?.map(
                    (m: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-background/60 border border-border/60 p-2.5"
                      >
                        <p className="text-xs font-semibold">{m.label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {m.description}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-5 space-y-3">
              <h3 className="text-sm font-semibold">Habits & mindset</h3>
              <div className="grid md:grid-cols-2 gap-3 text-xs">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase text-muted-foreground font-medium">
                    Daily habits
                  </p>
                  <ul className="space-y-1.5">
                    {plan.habits?.daily?.map((h: any, idx: number) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-muted-foreground"
                      >
                        <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{h.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] uppercase text-muted-foreground font-medium">
                    Mindset guidelines
                  </p>
                  <ul className="space-y-1.5">
                    {plan.mindset?.guidelines?.map(
                      (g: string, idx: number) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-muted-foreground"
                        >
                          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary/60" />
                          <span>{g}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

