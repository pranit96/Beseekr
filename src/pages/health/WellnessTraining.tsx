import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkoutSessions } from "@/hooks/use-health";
import { ArrowLeft, Dumbbell, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const INTENSITY_OPTIONS = ["easy", "moderate", "hard"];
const TYPE_OPTIONS = ["strength", "cardio", "mixed", "mobility", "hiit"];
const FOCUS_OPTIONS = ["full_body", "upper", "lower", "push", "pull", "legs", "core", "general"];

export default function WellnessTraining() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: sessions, isLoading, logSession, deleteSession, refetch } = useWorkoutSessions();
  const { toast } = useToast();

  const [form, setForm] = useState({
    type: "strength", focus: "full_body", duration: "", intensity: "moderate", notes: ""
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  const handleLog = async () => {
    try {
      await logSession.mutateAsync({
        type: form.type,
        focus: form.focus,
        durationMinutes: form.duration ? Number(form.duration) : undefined,
        perceivedIntensity: form.intensity,
        notes: form.notes || undefined,
        source: "manual",
      });
      setForm({ type: "strength", focus: "full_body", duration: "", intensity: "moderate", notes: "" });
      setShowForm(false);
      await refetch();
      toast({ title: "Workout logged ✓", description: "Session saved to your training history." });
    } catch (err: any) {
      toast({ title: "Could not log workout", description: err.message ?? "Please try again.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSession.mutateAsync(id);
      await refetch();
      toast({ title: "Session deleted" });
    } catch (err: any) {
      toast({ title: "Could not delete", description: err.message ?? "Please try again.", variant: "destructive" });
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
            <div className="h-8 w-8 rounded-xl bg-sky-500/20 flex items-center justify-center">
              <Dumbbell className="h-4 w-4 text-sky-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-sky-400 uppercase">Training</p>
              <h1 className="text-base sm:text-lg font-semibold">Workout sessions</h1>
            </div>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium flex items-center gap-1.5 active:scale-[0.97] transition"
          >
            <Plus className="h-3.5 w-3.5" />
            {showForm ? "Cancel" : "Log workout"}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* Inline log form */}
        {showForm && (
          <section className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-semibold">Log today's workout</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground uppercase font-medium">Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full mt-1 px-2.5 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground uppercase font-medium">Focus</label>
                <select
                  value={form.focus}
                  onChange={e => setForm(f => ({ ...f, focus: e.target.value }))}
                  className="w-full mt-1 px-2.5 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {FOCUS_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground uppercase font-medium">Duration (min)</label>
                <input
                  type="number" min="1" max="300" placeholder="e.g. 45"
                  value={form.duration}
                  onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                  className="w-full mt-1 px-2.5 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground uppercase font-medium">Intensity</label>
                <select
                  value={form.intensity}
                  onChange={e => setForm(f => ({ ...f, intensity: e.target.value }))}
                  className="w-full mt-1 px-2.5 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {INTENSITY_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[11px] text-muted-foreground uppercase font-medium">Notes (optional)</label>
                <input
                  type="text" placeholder="e.g. PR on deadlift"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full mt-1 px-2.5 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <button
              onClick={handleLog}
              disabled={logSession.isPending}
              className="w-full py-2 rounded-xl bg-foreground text-background text-xs font-medium active:scale-[0.97] transition disabled:opacity-60"
            >
              {logSession.isPending ? "Saving…" : "Save session"}
            </button>
          </section>
        )}

        {/* Session history */}
        <section className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-semibold">Session history</p>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-xl bg-muted/40 animate-pulse" />)}
            </div>
          ) : !sessions || sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No workouts logged yet. Hit "Log workout" to start.</p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {sessions.map((s: any) => (
                <div key={s.id} className="rounded-xl bg-background/60 border border-border/60 p-3 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold capitalize">{s.type || "workout"} · {s.focus?.replace(/_/g, " ") || "general"}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {s.session_date} · {s.duration_minutes ? `${s.duration_minutes} min` : "—"} · {s.perceived_intensity || "—"}
                    </p>
                    {s.notes && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{s.notes}</p>}
                  </div>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition flex-shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
