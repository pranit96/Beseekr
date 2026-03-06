import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFood, useHealthPlan } from "@/hooks/use-health";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Salad, Trash2, ImageIcon } from "lucide-react";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "unspecified"];

export default function WellnessNutrition() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: foodData, isLoading: logsLoading, analyzeImage, logManual, deleteFoodLog, refetch } = useFood();
  const { plan } = useHealthPlan();
  const { toast } = useToast();

  const [manualForm, setManualForm] = useState({ name: "", serving: "", mealType: "lunch" });
  const [showManual, setShowManual] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  const logs = (foodData as any)?.logs ?? [];
  const totals = (foodData as any)?.totals ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const targets = {
    calories: plan?.nutrition?.calorie_target ?? 2000,
    protein: plan?.nutrition?.protein_target_g ?? 120,
    carbs: plan?.nutrition?.carb_target_g ?? 200,
    fat: plan?.nutrition?.fat_target_g ?? 65,
  };

  const pct = (val: number, target: number) => Math.min(100, Math.round((val / target) * 100));

  const handleCamera = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setPreviewUrl(dataUrl);

      const base64 = dataUrl.split(",")[1];
      toast({ title: "Analysing meal…", description: "AI is estimating calories and macros." });

      const res = await analyzeImage.mutateAsync({
        imageData: base64,
        mimeType: file.type || "image/jpeg",
        mealType: "unspecified",
      });
      setPreviewUrl(null);
      await refetch();
      toast({ title: "Meal logged ✓", description: `${res.ai?.name ?? "Food"} · ${Math.round(res.ai?.calories ?? 0)} kcal` });
    } catch (err: any) {
      setPreviewUrl(null);
      toast({ title: "Could not analyse food", description: err.message ?? "Please try again.", variant: "destructive" });
    } finally {
      e.target.value = "";
    }
  };

  const handleManual = async () => {
    if (!manualForm.name.trim() || !manualForm.serving.trim()) return;
    try {
      toast({ title: "Estimating macros…", description: "AI is analysing your meal." });
      const res = await logManual.mutateAsync({
        foodName: manualForm.name.trim(),
        serving: manualForm.serving.trim(),
        mealType: manualForm.mealType,
      });
      setManualForm({ name: "", serving: "", mealType: "lunch" });
      setShowManual(false);
      await refetch();
      toast({ title: "Meal logged ✓", description: `${res.ai?.name ?? manualForm.name} · ${Math.round(res.ai?.calories ?? 0)} kcal` });
    } catch (err: any) {
      toast({ title: "Could not log meal", description: err.message ?? "Please try again.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFoodLog.mutateAsync(id);
      await refetch();
      toast({ title: "Entry deleted" });
    } catch (err: any) {
      toast({ title: "Could not delete", description: err.message ?? "Please try again.", variant: "destructive" });
    }
  };

  const macros = [
    { label: "Calories", val: Math.round(totals.calories), target: targets.calories, unit: "kcal", color: "bg-orange-400" },
    { label: "Protein", val: Math.round(totals.protein), target: targets.protein, unit: "g", color: "bg-sky-400" },
    { label: "Carbs", val: Math.round(totals.carbs), target: targets.carbs, unit: "g", color: "bg-emerald-400" },
    { label: "Fat", val: Math.round(totals.fat), target: targets.fat, unit: "g", color: "bg-violet-400" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted/60 active:scale-95 transition">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Salad className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-400 uppercase">Nutrition</p>
              <h1 className="text-base sm:text-lg font-semibold">Food & calorie tracking</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* Macro progress */}
        <section className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-semibold">Today's intake vs targets</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {macros.map(m => (
              <div key={m.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-medium">{m.val}<span className="text-muted-foreground">/{m.target}{m.unit}</span></span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${m.color} rounded-full transition-all`} style={{ width: `${pct(m.val, m.target)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Log actions */}
        <section className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-semibold">Log a meal</p>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-foreground text-background text-xs font-medium active:scale-[0.97] transition cursor-pointer">
              <Camera className="h-4 w-4" />
              <span>Use camera</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCamera} />
            </label>
            <button
              onClick={() => setShowManual(v => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted/60 active:scale-[0.97] transition"
            >
              <Salad className="h-4 w-4" />
              {showManual ? "Cancel" : "Type meal"}
            </button>
          </div>

          {previewUrl && (
            <div className="flex items-center gap-3 rounded-xl bg-background/60 border border-border/60 p-2.5">
              <img src={previewUrl} alt="Preview" className="h-14 w-14 rounded-lg object-cover" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ImageIcon className="h-4 w-4 animate-pulse" />
                Analysing with AI…
              </div>
            </div>
          )}

          {showManual && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-[11px] text-muted-foreground uppercase font-medium">What did you eat?</label>
                <input
                  type="text" placeholder="e.g. 2 rotis, dal, sabzi, salad"
                  value={manualForm.name}
                  onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full mt-1 px-2.5 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-muted-foreground uppercase font-medium">Serving size</label>
                  <input
                    type="text" placeholder="e.g. 1 plate, 1 bowl"
                    value={manualForm.serving}
                    onChange={e => setManualForm(f => ({ ...f, serving: e.target.value }))}
                    className="w-full mt-1 px-2.5 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground uppercase font-medium">Meal type</label>
                  <select
                    value={manualForm.mealType}
                    onChange={e => setManualForm(f => ({ ...f, mealType: e.target.value }))}
                    className="w-full mt-1 px-2.5 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {MEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <button
                onClick={handleManual}
                disabled={logManual.isPending || !manualForm.name.trim() || !manualForm.serving.trim()}
                className="w-full py-2 rounded-xl bg-foreground text-background text-xs font-medium active:scale-[0.97] transition disabled:opacity-60"
              >
                {logManual.isPending ? "Estimating…" : "Log meal"}
              </button>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">iOS tip: choose "Camera" when prompted. Limit: 10 image analyses/hour.</p>
        </section>

        {/* Today's food log */}
        <section className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-semibold">Today's food log</p>
          {logsLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-12 rounded-xl bg-muted/40 animate-pulse" />)}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No meals logged today. Use camera or type a meal above.</p>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {logs.map((log: any) => (
                <div key={log.id} className="rounded-xl bg-background/60 border border-border/60 p-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {log.food_image_url ? (
                      <img src={log.food_image_url} alt={log.food_name} className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Salad className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{log.food_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {Math.round(log.calories)} kcal · {log.meal_type || "—"}
                        {log.protein_g ? ` · ${Math.round(log.protein_g)}g P` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(log.id)}
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
