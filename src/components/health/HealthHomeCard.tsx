import { useNavigate } from "react-router-dom";
import { useHealthDashboard } from "@/hooks/use-health";
import { Activity, Apple, Dumbbell } from "lucide-react";

export const HealthHomeCard = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useHealthDashboard();

  const today = data?.today;

  return (
    <div className="w-full rounded-2xl border border-border bg-gradient-to-br from-emerald-500/5 via-sky-500/5 to-violet-500/5 p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Activity className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-400 uppercase tracking-wide">
              Health
            </p>
            <p className="text-sm font-semibold text-foreground">
              Mind & Body Wellness
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/wellness")}
          className="text-xs px-3 py-1.5 rounded-full bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
        >
          Open dashboard
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs mt-1">
        <div className="rounded-xl bg-background/60 border border-border/60 p-2 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Apple className="h-3.5 w-3.5 text-emerald-400" />
            Food
          </div>
          {isLoading ? (
            <div className="h-4 w-14 rounded bg-muted animate-pulse" />
          ) : (
            <p className="text-sm font-semibold">
              {Math.round(today?.calories ?? 0)} kcal
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            {Math.round(today?.protein_g ?? 0)} g protein
          </p>
        </div>

        <div className="rounded-xl bg-background/60 border border-border/60 p-2 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Dumbbell className="h-3.5 w-3.5 text-sky-400" />
            Training
          </div>
          {isLoading ? (
            <div className="h-4 w-14 rounded bg-muted animate-pulse" />
          ) : (
            <p className="text-sm font-semibold">
              {today?.workout_completed ? "Done" : "Not yet"}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            {today?.workout ? "Logged session" : "Tap to log"}
          </p>
        </div>

        <div className="rounded-xl bg-background/60 border border-border/60 p-2 flex flex-col gap-1">
          <p className="text-[11px] text-muted-foreground">Habits</p>
          {isLoading ? (
            <div className="h-4 w-10 rounded bg-muted animate-pulse" />
          ) : (
            <p className="text-sm font-semibold">
              {today?.habits_completed ?? 0}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            done today
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate("/wellness/onboarding")}
        className="mt-1 text-[11px] text-muted-foreground underline underline-offset-2 self-start"
      >
        Configure health profile
      </button>
    </div>
  );
};

