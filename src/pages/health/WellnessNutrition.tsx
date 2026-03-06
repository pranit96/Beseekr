import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useHealthDashboard } from "@/hooks/use-health";
import { useFood } from "@/hooks/use-health";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Salad } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function WellnessNutrition() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const dashboard = useHealthDashboard();
  const { analyzeImage, logManual } = useFood();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
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
      await dashboard.refetch();
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

  const handleQuickManual = async () => {
    try {
      const name = prompt("What did you eat? e.g. 2 rotis, dal, sabzi");
      if (!name) return;
      const serving =
        prompt("Serving size? e.g. 1 plate, 1 bowl, 2 rotis") || "1 plate";
      toast({
        title: "Analyzing meal...",
        description: "Using AI to estimate macros.",
      });
      const res = await logManual.mutateAsync({
        foodName: name,
        serving,
      });
      await dashboard.refetch();
      toast({
        title: "Meal logged",
        description: `${res.ai?.name ?? name} • ${Math.round(
          res.ai?.calories ?? 0,
        )} kcal`,
      });
    } catch (err: any) {
      toast({
        title: "Could not log meal",
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
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Salad className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-400 uppercase">
                Nutrition
              </p>
              <h1 className="text-base sm:text-lg font-semibold">
                Food & calorie tracking
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <section className="rounded-2xl border border-border bg-muted/30 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Log a meal</p>
            {isMobile && (
              <span className="text-[11px] text-muted-foreground">
                Use camera for fastest logging
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-foreground text-background text-xs font-medium active:scale-[0.97] transition cursor-pointer">
              <Camera className="h-4 w-4" />
              <span>Use camera</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleCameraCapture}
              />
            </label>
            <button
              onClick={handleQuickManual}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted/60 active:scale-[0.97] transition"
            >
              Type meal & serving
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            iOS Safari tip: when asked, choose “Camera” to capture the meal
            directly. We only send the image once for AI analysis.
          </p>
        </section>
      </main>
    </div>
  );
}

