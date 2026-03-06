import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useHabits } from "@/hooks/use-health";
import { ArrowLeft, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORY_OPTIONS = ["movement", "nutrition", "sleep", "mindset", "productivity", "hydration", "other"];
const UNIT_OPTIONS = ["times", "minutes", "steps", "glasses", "pages", "km"];

export default function WellnessHabits() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: habits, isLoading, createHabit, logHabit, deleteHabit, refetch } = useHabits();
  const { toast } = useToast();

  const [form, setForm] = useState({ name: "", category: "movement", target: "1", unit: "times" });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      await createHabit.mutateAsync({
        name: form.name.trim(),
        category: form.category,
        targetPerDay: Number(form.target) || 1,
        unit: form.unit,
        schedule: { type: "daily" },
      });
      setForm({ name: "", category: "movement", target: "1", unit: "times" });
      setShowForm(false);
      await refetch();
      toast({ title: "Habit added ✓", description: "Track it daily from now on." });
    } catch (err: any) {
      toast({ title: "Could not create habit", description: err.message ?? "Please try again.", variant: "destructive" });
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await logHabit.mutateAsync({ habitId: id, payload: { completed: true, value: 1 } });
      await refetch();
      toast({ title: "Logged ✓" });
    } catch (err: any) {
      toast({ title: "Could not log", description: err.message ?? "Please try again.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHabit.mutateAsync(id);
      await refetch();
      toast({ title: "Habit deleted" });
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
            <div className="h-8 w-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-violet-400 uppercase">Habits</p>
              <h1 className="text-base sm:text-lg font-semibold">Daily & weekly routines</h1>
            </div>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium flex items-center gap-1.5 active:scale-[0.97] transition"
          >
            <Plus className="h-3.5 w-3.5" />
            {showForm ? "Cancel" : "Add habit"}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {showForm && (
          <section className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-semibold">New habit</p>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase font-medium">Habit name</label>
              <input
                type="text" placeholder="e.g. 10 min morning walk, 2L water"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full mt-1 px-2.5 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground uppercase font-medium">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full mt-1 px-2.5 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground uppercase font-medium">Target</label>
                <input
                  type="number" min="1" value={form.target}
                  onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                  className="w-full mt-1 px-2.5 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground uppercase font-medium">Unit</label>
                <select
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  className="w-full mt-1 px-2.5 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={createHabit.isPending || !form.name.trim()}
              className="w-full py-2 rounded-xl bg-foreground text-background text-xs font-medium active:scale-[0.97] transition disabled:opacity-60"
            >
              {createHabit.isPending ? "Saving…" : "Create habit"}
            </button>
          </section>
        )}

        <section className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-semibold">Your habits</p>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-muted/40 animate-pulse" />)}
            </div>
          ) : !habits || habits.length === 0 ? (
            <p className="text-xs text-muted-foreground">No habits yet. Add one to start tracking.</p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {habits.map((h: any) => (
                <div key={h.id} className="rounded-xl bg-background/60 border border-border/60 p-3 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{h.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {h.category || "general"} · target {h.target_per_day || 1} {h.unit || "times"}/day
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleComplete(h.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-violet-500/20 text-violet-400 text-[11px] font-medium hover:bg-violet-500/30 active:scale-[0.97] transition"
                    >
                      Done
                    </button>
                    <button
                      onClick={() => handleDelete(h.id)}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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
