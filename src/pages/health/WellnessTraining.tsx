import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkoutSessions } from "@/hooks/use-health";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WellnessTraining() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: sessions, isLoading, logSession, refetch } =
    useWorkoutSessions();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  const handleQuickLog = async () => {
    try {
      const type = prompt("Workout type (e.g. strength, cardio, mixed)") || "";
      const focus = prompt("Focus (e.g. full_body, upper, lower)") || "";
      const duration =
        Number(prompt("Duration in minutes (e.g. 45)") || "0") || undefined;
      await logSession.mutateAsync({
        type: type || undefined,
        focus: focus || undefined,
        durationMinutes: duration,
        source: "manual",
      });
      await refetch();
      toast({
        title: "Workout logged",
        description: "Session saved to your training history.",
      });
    } catch (err: any) {
      toast({
        title: "Could not log workout",
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
            <div className="h-8 w-8 rounded-xl bg-sky-500/20 flex items-center justify-center">
              <Dumbbell className="h-4 w-4 text-sky-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-sky-400 uppercase">
                Training
              </p>
              <h1 className="text-base sm:text-lg font-semibold">
                Workout sessions
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <section className="rounded-2xl border border-border bg-muted/30 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Quick log</p>
            <p className="text-xs text-muted-foreground">
              Short form to capture today&apos;s workout on the go.
            </p>
          </div>
          <button
            onClick={handleQuickLog}
            className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium active:scale-[0.97] transition"
          >
            Log workout
          </button>
        </section>

        <section className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-semibold">Recent sessions</p>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : !sessions || sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No workouts logged yet. Use “Log workout” to add your first
              session.
            </p>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 text-xs">
              {sessions.map((s: any) => (
                <div
                  key={s.id}
                  className="rounded-xl bg-background/60 border border-border/60 p-2.5 flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-medium">
                      {s.type || "session"} • {s.focus || "general"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {s.session_date} • {s.duration_minutes || "?"} min •{" "}
                      {s.perceived_intensity || "unrated"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

