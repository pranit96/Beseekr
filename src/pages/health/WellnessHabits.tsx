import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useHabits } from "@/hooks/use-health";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WellnessHabits() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: habits, isLoading, createHabit, logHabit, refetch } =
    useHabits();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  const handleCreateHabit = async () => {
    try {
      const name = prompt("Habit name (e.g. 10 min walk, 2L water)") || "";
      if (!name) return;
      await createHabit.mutateAsync({
        name,
        schedule: { type: "daily" },
      });
      await refetch();
      toast({
        title: "Habit added",
        description: "You can now track it daily.",
      });
    } catch (err: any) {
      toast({
        title: "Could not create habit",
        description: err.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteToday = async (id: string) => {
    try {
      await logHabit.mutateAsync({
        habitId: id,
        payload: { completed: true, value: 1 },
      });
      await refetch();
    } catch (err: any) {
      toast({
        title: "Could not log habit",
        description: err.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

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
            <div className="h-8 w-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-violet-400 uppercase">
                Habits
              </p>
              <h1 className="text-base sm:text-lg font-semibold">
                Daily & weekly routines
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <section className="rounded-2xl border border-border bg-muted/30 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Create habit</p>
            <p className="text-xs text-muted-foreground">
              Simple daily habits that support your health plan.
            </p>
          </div>
          <button
            onClick={handleCreateHabit}
            className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium active:scale-[0.97] transition"
          >
            Add habit
          </button>
        </section>

        <section className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-semibold">Your habits</p>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : !habits || habits.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No habits yet. Add one to start tracking.
            </p>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 text-xs">
              {habits.map((h: any) => (
                <div
                  key={h.id}
                  className="rounded-xl bg-background/60 border border-border/60 p-2.5 flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-medium">{h.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {h.category || "general"} • target{" "}
                      {h.target_per_day || 1} {h.unit || "times"} /day
                    </p>
                  </div>
                  <button
                    onClick={() => handleCompleteToday(h.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-foreground text-background text-[11px] font-medium active:scale-[0.97] transition"
                  >
                    Done today
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

