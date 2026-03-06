import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFood, useHealthDashboard, useHealthPlan } from "@/hooks/use-health";
import { useToast } from "@/hooks/use-toast";
import {
  Activity, ArrowLeft, BarChart3, BookOpen, Brain, Camera, CheckCircle2, Dumbbell,
  Flame, Moon, Salad, Scale, Smile, Sparkles, TrendingUp, Zap,
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
    carbs: plan?.nutrition?.carb_target_g ?? 200,
    fat: plan?.nutrition?.fat_target_g ?? 65,
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
  const carbPct = pct(today?.carbs_g ?? 0, targets.carbs);
  const fatPct = pct(today?.fat_g ?? 0, targets.fat);

  // ─── Macro ring SVG helper ─────────────────────────────────────────
  const MacroRing = ({
    value, max, color, gradStart, gradEnd, label, unit = "kcal",
  }: {
    value: number; max: number; color: string; gradStart: string; gradEnd: string; label: string; unit?: string;
  }) => {
    const size = 88;
    const strokeWidth = 7;
    const radius = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * radius;
    const p = Math.min(1, value / (max || 1));
    const offset = circ - p * circ;
    const id = `grad-${label}`;

    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            <defs>
              <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={gradStart} />
                <stop offset="100%" stopColor={gradEnd} />
              </linearGradient>
            </defs>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
            <circle
              cx={size / 2} cy={size / 2} r={radius} fill="none"
              stroke={`url(#${id})`}
              strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={offset}
              strokeLinecap="round" className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold tracking-tight" style={{ color }}>{Math.round(value)}</span>
            <span className="text-[8px] text-white/40 font-medium">{unit}</span>
          </div>
        </div>
        <span className="text-[10px] font-semibold tracking-widest uppercase text-white/40">{label}</span>
      </div>
    );
  };

  // ─── 7-day calorie mini chart ──────────────────────────────────────
  const dailyCals = data?.dailyCalories ?? [];
  const maxCal = Math.max(...dailyCals.map((d) => d.calories), targets.calories, 1);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        .wellness-root {
          font-family: 'DM Sans', sans-serif;
          background: #0a0f0d;
          color: #e8ede9;
          min-height: 100vh;
        }
        .serif { font-family: 'Instrument Serif', serif; }

        .card-glass {
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(12px);
        }
        .card-glass-hover {
          transition: background 0.2s, border-color 0.2s, transform 0.15s;
        }
        .card-glass-hover:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.12);
        }
        .card-glass-hover:active { transform: scale(0.98); }

        .vital-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .vital-card::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.2s;
          background: radial-gradient(ellipse at top left, var(--accent-color, rgba(255,255,255,0.05)), transparent 70%);
        }
        .vital-card:hover::before { opacity: 1; }
        .vital-card:hover { border-color: rgba(255,255,255,0.11); transform: translateY(-1px); }

        .stat-number {
          font-family: 'Instrument Serif', serif;
          font-size: 1.75rem;
          line-height: 1;
          letter-spacing: -0.02em;
        }

        .pill-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 100px;
          font-size: 12px; font-weight: 500;
          transition: all 0.15s; cursor: pointer;
        }
        .pill-btn:active { transform: scale(0.97); }

        .streak-orb {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 16px 12px; border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.025);
          transition: all 0.2s;
        }
        .streak-orb:hover { background: rgba(255,255,255,0.05); }

        .nav-tile {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.025);
          cursor: pointer; transition: all 0.2s; text-align: left;
        }
        .nav-tile:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-1px);
        }
        .nav-tile:active { transform: scale(0.98); }

        .section-label {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(255,255,255,0.35);
        }

        .header-shimmer {
          background: linear-gradient(135deg, #0e1a12 0%, #0d1a10 40%, #101a0e 100%);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .hero-glow {
          background: linear-gradient(135deg,
            rgba(74,210,120,0.08) 0%,
            rgba(74,210,120,0.03) 40%,
            rgba(180,150,80,0.04) 100%);
          border: 1px solid rgba(74,210,120,0.12);
        }

        .bar-chart-bar {
          border-radius: 4px 4px 0 0;
          transition: height 0.6s cubic-bezier(0.34,1.56,0.64,1);
        }

        .sparkline-container {
          background: rgba(20,184,166,0.04);
          border: 1px solid rgba(20,184,166,0.1);
        }
      `}</style>

      <div className="wellness-root">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 header-shimmer">
          <div style={{ maxWidth: 860, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                height: 34, width: 34, borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "rgba(255,255,255,0.5)",
                transition: "all 0.15s",
              }}
            >
              <ArrowLeft size={15} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
              <div style={{
                height: 34, width: 34, borderRadius: 10,
                background: "linear-gradient(135deg, #22c55e22, #16a34a44)",
                border: "1px solid rgba(74,210,120,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Activity size={16} color="#4ade80" />
              </div>
              <div>
                <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4ade80", marginBottom: 1 }}>Wellness</p>
                <h1 className="serif" style={{ fontSize: 17, fontWeight: 400, color: "#e8ede9", lineHeight: 1 }}>Mind & Body</h1>
              </div>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: 860, margin: "0 auto", padding: "20px 20px 40px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── Hero ─────────────────────────────────────────────────── */}
          <section className="hero-glow" style={{ borderRadius: 20, padding: "20px 22px" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{
                height: 38, width: 38, flexShrink: 0, borderRadius: 12,
                background: "linear-gradient(135deg, #4ade80, #16a34a)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Sparkles size={17} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#e8ede9", marginBottom: 4 }}>
                  {data?.profile ? "Personalised health profile active" : "Complete your health profile"}
                </p>
                <p style={{ fontSize: 12, color: "rgba(232,237,233,0.5)", marginBottom: 14, lineHeight: 1.55 }}>
                  {data?.profile
                    ? plan
                      ? "Your AI plan is ready. Training, nutrition and habits are personalised for your goals."
                      : "Profile is set. Generate your personalised plan from the Plan page."
                    : "Add your basics (height, weight, goal, routine) to unlock your personalised plan."}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => navigate("/wellness/onboarding")}
                    className="pill-btn"
                    style={{ background: "#4ade80", color: "#0a0f0d", fontWeight: 600 }}
                  >
                    {data?.profile ? "Edit profile" : "Complete profile"}
                  </button>
                  <button
                    onClick={() => navigate("/wellness/plan")}
                    className="pill-btn"
                    style={{ background: "rgba(255,255,255,0.07)", color: "#e8ede9", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    {plan ? "View plan" : "Generate plan"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ── Macro rings ──────────────────────────────────────────── */}
          <section style={{ borderRadius: 20, padding: "22px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="section-label" style={{ marginBottom: 18 }}>Today's macros</p>
            {isLoading ? (
              <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ height: 88, width: 88, borderRadius: "50%", background: "rgba(255,255,255,0.07)", animation: "pulse 1.5s infinite" }} />
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
                <MacroRing value={today?.calories ?? 0} max={targets.calories} color="#4ade80" gradStart="#4ade80" gradEnd="#16a34a" label="Calories" unit="kcal" />
                <MacroRing value={today?.protein_g ?? 0} max={targets.protein} color="#60a5fa" gradStart="#60a5fa" gradEnd="#2563eb" label="Protein" unit="g" />
                <MacroRing value={today?.carbs_g ?? 0} max={targets.carbs} color="#fbbf24" gradStart="#fbbf24" gradEnd="#d97706" label="Carbs" unit="g" />
                <MacroRing value={today?.fat_g ?? 0} max={targets.fat} color="#f87171" gradStart="#f87171" gradEnd="#dc2626" label="Fat" unit="g" />
              </div>
            )}
          </section>

          {/* ── 7-day calorie chart ───────────────────────────────────── */}
          {dailyCals.length > 0 && (
            <section style={{ borderRadius: 20, padding: "20px 20px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="section-label" style={{ marginBottom: 16 }}>7-day calories</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 72 }}>
                {dailyCals.map((d) => {
                  const h = (d.calories / maxCal) * 100;
                  const isToday = d.date === data?.range?.end;
                  return (
                    <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      {d.calories > 0 && (
                        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>{Math.round(d.calories)}</span>
                      )}
                      <div
                        className="bar-chart-bar"
                        style={{
                          width: "100%",
                          height: `${Math.max(3, h)}%`,
                          background: isToday
                            ? "linear-gradient(to top, #16a34a, #4ade80)"
                            : "rgba(74,222,128,0.2)",
                        }}
                      />
                      <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>
                        {new Date(d.date + "T12:00").toLocaleDateString("en", { weekday: "narrow" })}
                      </span>
                    </div>
                  );
                })}
              </div>
              {targets.calories > 0 && (
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: 10 }}>
                  Target · {targets.calories} kcal/day
                </p>
              )}
            </section>
          )}

          {/* ── Today's vitals grid ───────────────────────────────────── */}
          <section style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>

            {/* Mood */}
            <div className="vital-card" style={{ "--accent-color": "rgba(167,139,250,0.08)" } as any} onClick={() => navigate("/wellness/mind")}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Smile size={13} color="#a78bfa" />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Mood</span>
              </div>
              {isLoading
                ? <div style={{ height: 32, width: 60, background: "rgba(255,255,255,0.07)", borderRadius: 6 }} />
                : <p className="stat-number" style={{ color: data?.todayMood ? "#e8ede9" : "rgba(255,255,255,0.2)" }}>
                  {data?.todayMood ? `${data.todayMood.mood_score}/10` : "–"}
                </p>}
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                {data?.todayMood ? `E:${data.todayMood.energy_level ?? "–"} · S:${data.todayMood.stress_level ?? "–"}` : "Tap to log"}
              </p>
            </div>

            {/* Sleep */}
            <div className="vital-card" style={{ "--accent-color": "rgba(99,102,241,0.08)" } as any} onClick={() => navigate("/wellness/mind")}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Moon size={13} color="#818cf8" />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Sleep</span>
              </div>
              {isLoading
                ? <div style={{ height: 32, width: 60, background: "rgba(255,255,255,0.07)", borderRadius: 6 }} />
                : <p className="stat-number" style={{ color: data?.todaySleep ? "#e8ede9" : "rgba(255,255,255,0.2)" }}>
                  {data?.todaySleep ? `${Number(data.todaySleep.duration_hours ?? 0).toFixed(1)}h` : "–"}
                </p>}
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                {data?.todaySleep ? `Quality: ${"⭐".repeat(data.todaySleep.quality ?? 0)}` : "Tap to log"}
              </p>
            </div>

            {/* Training */}
            <div className="vital-card" style={{ "--accent-color": "rgba(56,189,248,0.08)" } as any} onClick={() => navigate("/wellness/training")}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Dumbbell size={13} color="#38bdf8" />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Training</span>
              </div>
              {isLoading
                ? <div style={{ height: 32, width: 60, background: "rgba(255,255,255,0.07)", borderRadius: 6 }} />
                : <p className="stat-number" style={{ color: today?.workout_completed ? "#4ade80" : "rgba(255,255,255,0.2)" }}>
                  {today?.workout_completed ? "Done" : "Rest"}
                </p>}
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{data?.aggregates?.workouts ?? 0} sessions this week</p>
            </div>

            {/* Weight */}
            <div className="vital-card" style={{ "--accent-color": "rgba(45,212,191,0.08)" } as any} onClick={() => navigate("/wellness/weight")}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Scale size={13} color="#2dd4bf" />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Weight</span>
              </div>
              {isLoading
                ? <div style={{ height: 32, width: 60, background: "rgba(255,255,255,0.07)", borderRadius: 6 }} />
                : <p className="stat-number" style={{ color: data?.latestWeight ? "#e8ede9" : "rgba(255,255,255,0.2)" }}>
                  {data?.latestWeight ? (
                    <>{data.latestWeight.weight_kg}<span style={{ fontSize: 12, fontFamily: "DM Sans, sans-serif", color: "rgba(255,255,255,0.35)" }}> kg</span></>
                  ) : "–"}
                </p>}
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                {data?.latestWeight?.date ? `as of ${data.latestWeight.date}` : "Tap to log"}
              </p>
            </div>

            {/* Habits */}
            <div className="vital-card" style={{ "--accent-color": "rgba(251,191,36,0.08)" } as any} onClick={() => navigate("/wellness/habits")}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <CheckCircle2 size={13} color="#fbbf24" />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Habits</span>
              </div>
              {isLoading
                ? <div style={{ height: 32, width: 60, background: "rgba(255,255,255,0.07)", borderRadius: 6 }} />
                : <p className="stat-number" style={{ color: "#e8ede9" }}>{today?.habits_completed ?? 0}</p>}
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{data?.aggregates?.habit_logs ?? 0} total this week</p>
            </div>

            {/* Nutrition */}
            <div className="vital-card" style={{ "--accent-color": "rgba(74,222,128,0.08)" } as any} onClick={() => navigate("/wellness/nutrition")}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Salad size={13} color="#4ade80" />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Nutrition</span>
              </div>
              {isLoading
                ? <div style={{ height: 32, width: 60, background: "rgba(255,255,255,0.07)", borderRadius: 6 }} />
                : <p className="stat-number" style={{ color: "#e8ede9" }}>
                  {Math.round(today?.calories ?? 0)}<span style={{ fontSize: 12, fontFamily: "DM Sans, sans-serif", color: "rgba(255,255,255,0.35)" }}> kcal</span>
                </p>}
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{calPct}% of daily target</p>
            </div>
          </section>

          {/* ── Streaks ──────────────────────────────────────────────── */}
          {data?.streaks && (
            <section style={{ borderRadius: 20, padding: "20px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="section-label" style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <Flame size={12} color="#fb923c" style={{ display: "inline" }} /> Streaks
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {[
                  { count: data.streaks.workout, icon: Dumbbell, label: "Workout", color: "#38bdf8", active: data.streaks.workout > 0 },
                  { count: data.streaks.mood, icon: Smile, label: "Mood", color: "#a78bfa", active: data.streaks.mood > 0 },
                  { count: data.streaks.food, icon: Salad, label: "Food", color: "#4ade80", active: data.streaks.food > 0 },
                ].map(({ count, icon: Icon, label, color, active }) => (
                  <div key={label} className="streak-orb" style={{ opacity: active ? 1 : 0.4 }}>
                    <Icon size={16} color={color} style={{ marginBottom: 8 }} />
                    <p className="serif" style={{ fontSize: 24, lineHeight: 1, color: "#e8ede9" }}>{count}</p>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 4, letterSpacing: "0.05em" }}>{label}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Weight sparkline ──────────────────────────────────────── */}
          {data?.weightTrend && data.weightTrend.length >= 2 && (() => {
            const wt = data.weightTrend;
            const vals = wt.map((w) => w.weight_kg);
            const mn = Math.min(...vals) - 0.5;
            const mx = Math.max(...vals) + 0.5;
            const rng = mx - mn || 1;
            const step = 100 / (wt.length - 1);
            const path = wt.map((w, i) => `${i === 0 ? "M" : "L"} ${i * step} ${100 - ((w.weight_kg - mn) / rng) * 100}`).join(" ");
            const fillPath = path + ` L ${(wt.length - 1) * step} 100 L 0 100 Z`;

            return (
              <section className="sparkline-container" style={{ borderRadius: 20, padding: "20px" }}>
                <p className="section-label" style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  <TrendingUp size={12} color="#2dd4bf" style={{ display: "inline" }} /> Weight trend · 14 days
                </p>
                <div style={{ height: 60, position: "relative" }}>
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
                    <defs>
                      <linearGradient id="fill-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={fillPath} fill="url(#fill-grad)" />
                    <path d={path} fill="none" stroke="#14b8a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{wt[0].weight_kg} kg</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{wt[wt.length - 1].weight_kg} kg</span>
                </div>
              </section>
            );
          })()}

          {/* ── Quick actions ─────────────────────────────────────────── */}
          <section style={{ borderRadius: 20, padding: "20px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#e8ede9", marginBottom: 14 }}>Quick actions</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <label
                className="pill-btn"
                style={{ background: "#4ade80", color: "#0a0f0d", fontWeight: 600, cursor: "pointer" }}
              >
                <Camera size={14} />
                Log meal with camera
                <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleCameraCapture} />
              </label>
              {[
                { label: "Log manually", icon: Salad, to: "/wellness/nutrition" },
                { label: "Mind check-in", icon: Brain, to: "/wellness/mind" },
                { label: "Log workout", icon: Dumbbell, to: "/wellness/training" },
                { label: "Weekly review", icon: BarChart3, to: "/wellness/weekly" },
              ].map(({ label, icon: Icon, to }) => (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className="pill-btn"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#e8ede9", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* ── Navigation tiles ─────────────────────────────────────── */}
          <section style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {[
              { to: "/wellness/mind", icon: Brain, label: "Mind", desc: "Mood · Sleep · Journal", color: "#a78bfa" },
              { to: "/wellness/nutrition", icon: Salad, label: "Nutrition", desc: "Meals & macros", color: "#4ade80" },
              { to: "/wellness/training", icon: Dumbbell, label: "Training", desc: "Workouts", color: "#38bdf8" },
              { to: "/wellness/habits", icon: CheckCircle2, label: "Habits", desc: "Daily habits", color: "#fbbf24" },
              { to: "/wellness/weight", icon: Scale, label: "Weight", desc: "Body tracker", color: "#2dd4bf" },
              { to: "/wellness/weekly", icon: BarChart3, label: "Weekly", desc: "AI analysis", color: "#f472b6" },
            ].map(({ to, icon: Icon, label, desc, color }) => (
              <button key={to} className="nav-tile" onClick={() => navigate(to)}>
                <div style={{
                  height: 34, width: 34, flexShrink: 0, borderRadius: 10,
                  background: `${color}18`,
                  border: `1px solid ${color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={15} color={color} />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#e8ede9" }}>{label}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{desc}</p>
                </div>
              </button>
            ))}
          </section>

        </main>
      </div>
    </>
  );
}