import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFood, useHealthDashboard, useHealthPlan } from "@/hooks/use-health";
import { useToast } from "@/hooks/use-toast";
import {
  Activity, ArrowLeft, BarChart3, Brain, Camera, CheckCircle2, Dumbbell,
  Flame, Moon, Salad, Scale, Smile, Sparkles, TrendingUp, ChevronRight,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   WELLNESS DASHBOARD — Complete redesign
   Layout flow (mobile-first, responsive):
     1. Sticky header
     2. Today Hero  — large calorie ring + macro progress bars
     3. Vitals grid — 2-col mobile / 3-col desktop
     4. Charts row  — 7-day bars + weight sparkline (stacked mobile / side-by-side desktop)
     5. Streaks     — horizontal trio of streak pills
     6. Quick actions
     7. Section navigation grid
───────────────────────────────────────────────────────────────────────────── */

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
  const calPct = pct(today?.calories ?? 0, targets.calories);
  const protPct = pct(today?.protein_g ?? 0, targets.protein);
  const carbPct = pct(today?.carbs_g ?? 0, targets.carbs);
  const fatPct = pct(today?.fat_g ?? 0, targets.fat);

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

  // 7-day chart
  const dailyCals = data?.dailyCalories ?? [];
  const maxCal = Math.max(...dailyCals.map((d) => d.calories), targets.calories, 1);

  // Weight sparkline
  const weightSparkline = (() => {
    const wt = data?.weightTrend ?? [];
    if (wt.length < 2) return null;
    const vals = wt.map((w) => w.weight_kg);
    const mn = Math.min(...vals) - 0.5;
    const mx = Math.max(...vals) + 0.5;
    const rng = mx - mn || 1;
    const step = 100 / (wt.length - 1);
    const pts = wt.map((w, i) => ({ x: i * step, y: 100 - ((w.weight_kg - mn) / rng) * 100 }));
    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const fill = line + ` L ${pts[pts.length - 1].x} 100 L 0 100 Z`;
    return { line, fill, first: wt[0].weight_kg, last: wt[wt.length - 1].weight_kg };
  })();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Figtree:wght@300;400;500;600&display=swap');

        :root {
          --bg:       #070b09;
          --s1:       #0f1511;
          --s2:       #141c16;
          --s3:       #1b2420;
          --border:   rgba(255,255,255,0.07);
          --border-h: rgba(255,255,255,0.13);
          --t1:       #dde8de;
          --t2:       rgba(221,232,222,0.55);
          --t3:       rgba(221,232,222,0.28);
          --green:    #3ecf6e;
          --g-dim:    rgba(62,207,110,0.12);
          --g-glow:   rgba(62,207,110,0.22);
          --amber:    #f5a623;
          --blue:     #5b9cf6;
          --violet:   #9b7fe8;
          --teal:     #2dd4bf;
          --red:      #f27575;
          --pink:     #f472b6;
        }

        .wd { font-family:'Figtree',sans-serif; background:var(--bg); color:var(--t1); min-height:100vh; }
        .wd *{ box-sizing:border-box; margin:0; padding:0; }
        .syne{ font-family:'Syne',sans-serif; }

        /* Header */
        .wd-hdr{
          position:sticky; top:0; z-index:50;
          background:rgba(7,11,9,0.88);
          backdrop-filter:blur(20px);
          border-bottom:1px solid var(--border);
        }
        .wd-hdr-inner{
          max-width:920px; margin:0 auto;
          padding:0 16px; height:56px;
          display:flex; align-items:center; gap:12px;
        }
        @media(min-width:640px){ .wd-hdr-inner{ padding:0 24px; } }

        /* Main */
        .wd-main{ max-width:920px; margin:0 auto; padding:20px 16px 64px; display:flex; flex-direction:column; gap:14px; }
        @media(min-width:640px){ .wd-main{ padding:24px 24px 64px; } }

        /* Card */
        .card{ background:var(--s1); border:1px solid var(--border); border-radius:20px; overflow:hidden; }
        .cp{ padding:18px; }
        @media(min-width:640px){ .cp{ padding:22px; } }

        /* Section label */
        .slbl{ font-family:'Syne',sans-serif; font-size:10px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--t3); }

        /* Ring */
        .ring-track{ fill:none; stroke:rgba(255,255,255,0.05); }
        .ring-fill{ fill:none; stroke:var(--green); stroke-linecap:round; transition:stroke-dashoffset 1s cubic-bezier(.4,0,.2,1); filter:drop-shadow(0 0 8px var(--g-glow)); }

        /* Macro bar */
        .mbar-track{ height:5px; border-radius:999px; background:rgba(255,255,255,0.06); overflow:hidden; }
        .mbar-fill{ height:100%; border-radius:999px; transition:width .9s cubic-bezier(.4,0,.2,1); }

        /* Vitals grid */
        .vitals-grid{ display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        @media(min-width:640px){ .vitals-grid{ grid-template-columns:repeat(3,1fr); } }

        /* Vital card */
        .vcard{
          background:var(--s2); border:1px solid var(--border); border-radius:16px;
          padding:14px; cursor:pointer; transition:all .2s;
          position:relative; overflow:hidden;
        }
        .vcard::after{
          content:''; position:absolute; top:0; left:0; right:0; height:2px;
          background:var(--ac,transparent); border-radius:2px 2px 0 0; opacity:.75;
        }
        .vcard:hover{ border-color:var(--border-h); background:var(--s3); transform:translateY(-2px); }
        .vcard:active{ transform:scale(.98); }
        .vnum{ font-family:'Syne',sans-serif; font-size:1.55rem; font-weight:700; line-height:1; letter-spacing:-.02em; margin:8px 0 3px; }

        /* Charts row */
        .charts-row{ display:grid; grid-template-columns:1fr; gap:12px; }
        @media(min-width:640px){ .charts-row{ grid-template-columns:3fr 2fr; } }

        /* Chart bar */
        .cbar{ border-radius:3px 3px 0 0; transition:height .7s cubic-bezier(.34,1.56,.64,1); }

        /* Streaks */
        .streak-row{ display:flex; gap:8px; }
        .strk{
          flex:1; display:flex; align-items:center; gap:10px;
          padding:12px 14px; border-radius:14px;
          border:1px solid var(--border); background:var(--s2);
          transition:all .2s;
        }
        .strk:hover{ background:var(--s3); border-color:var(--border-h); }
        .strk-n{ font-family:'Syne',sans-serif; font-size:1.4rem; font-weight:800; line-height:1; }

        /* Buttons */
        .btn-p{
          display:inline-flex; align-items:center; gap:7px;
          background:var(--green); color:#061209;
          font-family:'Syne',sans-serif; font-size:12px; font-weight:700;
          padding:10px 16px; border-radius:12px; cursor:pointer; border:none;
          transition:opacity .15s, transform .15s;
        }
        .btn-p:hover{ opacity:.9; }
        .btn-p:active{ transform:scale(.97); }

        .btn-g{
          display:inline-flex; align-items:center; gap:7px;
          background:var(--s3); color:var(--t1);
          font-size:12px; font-weight:500;
          padding:9px 14px; border-radius:12px; cursor:pointer;
          border:1px solid var(--border); transition:all .15s;
        }
        .btn-g:hover{ background:var(--s2); border-color:var(--border-h); }
        .btn-g:active{ transform:scale(.97); }

        /* Quick actions wrap */
        .qa-wrap{ display:flex; flex-wrap:wrap; gap:8px; }

        /* Nav grid */
        .nav-grid{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        @media(min-width:640px){ .nav-grid{ grid-template-columns:repeat(3,1fr); } }

        .ntile{
          display:flex; align-items:center; gap:11px;
          padding:13px 15px; border-radius:16px;
          border:1px solid var(--border); background:var(--s1);
          cursor:pointer; transition:all .2s; text-align:left;
        }
        .ntile:hover{ background:var(--s2); border-color:var(--border-h); transform:translateY(-1px); }
        .ntile:active{ transform:scale(.98); }

        /* Icon chip */
        .chip{ display:flex; align-items:center; justify-content:center; border-radius:10px; flex-shrink:0; }

        /* Skeleton */
        @keyframes wdpulse{ 0%,100%{ opacity:.35; } 50%{ opacity:.7; } }
        .skel{ background:rgba(255,255,255,0.09); border-radius:7px; animation:wdpulse 1.6s ease infinite; }

        /* Entry animations */
        @keyframes fadeup{ from{ opacity:0; transform:translateY(14px); } to{ opacity:1; transform:translateY(0); } }
        .fu{ animation:fadeup .45s ease both; }
        .d1{ animation-delay:.06s; } .d2{ animation-delay:.12s; }
        .d3{ animation-delay:.18s; } .d4{ animation-delay:.24s; }
        .d5{ animation-delay:.30s; }

        /* Hero layout */
        .hero-body{ display:flex; flex-direction:column; align-items:center; gap:20px; }
        @media(min-width:520px){ .hero-body{ flex-direction:row; align-items:flex-start; } }

        /* Back btn */
        .back-btn{
          height:34px; width:34px; border-radius:50%;
          border:1px solid var(--border); background:var(--s2);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; color:var(--t2); flex-shrink:0;
          transition:all .15s;
        }
        .back-btn:hover{ background:var(--s3); border-color:var(--border-h); }
      `}</style>

      <div className="wd">

        {/* ═══ HEADER ══════════════════════════════════════════════ */}
        <header className="wd-hdr">
          <div className="wd-hdr-inner">
            <button className="back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={15} />
            </button>

            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, color: "var(--green)", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 1 }}>
                {greeting}
              </p>
              <h1 className="syne" style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)", lineHeight: 1 }}>
                Mind & Body Dashboard
              </h1>
            </div>

            <div className="chip" style={{ width: 34, height: 34, background: "var(--g-dim)", border: "1px solid var(--g-glow)" }}>
              <Activity size={16} color="var(--green)" />
            </div>
          </div>
        </header>

        <main className="wd-main">

          {/* ═══ 1. TODAY HERO ═══════════════════════════════════════ */}
          <div className="card fu">
            {/* Profile prompt banner */}
            {!data?.profile && (
              <div style={{ background: "linear-gradient(90deg,rgba(62,207,110,.1),rgba(62,207,110,.02))", borderBottom: "1px solid rgba(62,207,110,.14)", padding: "9px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Sparkles size={12} color="var(--green)" />
                  <p style={{ fontSize: 11, color: "var(--t2)" }}>Complete your profile to unlock your personalised AI plan</p>
                </div>
                <button onClick={() => navigate("/wellness/onboarding")} style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                  Set up →
                </button>
              </div>
            )}

            <div className="cp">
              <div className="hero-body">

                {/* Big calorie ring */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {(() => {
                    const sz = 152; const sw = 11;
                    const r = (sz - sw) / 2;
                    const circ = 2 * Math.PI * r;
                    const offset = circ - (calPct / 100) * circ;
                    return (
                      <svg width={sz} height={sz} style={{ transform: "rotate(-90deg)" }}>
                        <defs>
                          <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3ecf6e" />
                            <stop offset="100%" stopColor="#1ab554" />
                          </linearGradient>
                        </defs>
                        <circle cx={sz / 2} cy={sz / 2} r={r} className="ring-track" strokeWidth={sw} />
                        {!isLoading && (
                          <circle cx={sz / 2} cy={sz / 2} r={r} className="ring-fill" stroke="url(#cg)" strokeWidth={sw} strokeDasharray={circ} strokeDashoffset={offset} />
                        )}
                      </svg>
                    );
                  })()}
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    {isLoading
                      ? <div className="skel" style={{ width: 58, height: 30 }} />
                      : <>
                        <p className="syne" style={{ fontSize: 26, fontWeight: 800, color: "var(--t1)", lineHeight: 1 }}>{Math.round(today?.calories ?? 0)}</p>
                        <p style={{ fontSize: 9, color: "var(--t3)", letterSpacing: ".06em", marginTop: 3 }}>kcal eaten</p>
                        <p style={{ fontSize: 10, color: "var(--green)", fontWeight: 700, marginTop: 3 }}>{calPct}% of goal</p>
                      </>
                    }
                  </div>
                </div>

                {/* Macro bars */}
                <div style={{ flex: 1, width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div>
                      <p className="syne" style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)" }}>Today's Nutrition</p>
                      <p style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>{dateStr}</p>
                    </div>
                    <button onClick={() => navigate("/wellness/nutrition")} style={{ fontSize: 11, color: "var(--green)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                      Details →
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                    {[
                      { label: "Protein", val: today?.protein_g ?? 0, target: targets.protein, unit: "g", p: protPct, color: "var(--blue)" },
                      { label: "Carbs", val: today?.carbs_g ?? 0, target: targets.carbs, unit: "g", p: carbPct, color: "var(--amber)" },
                      { label: "Fat", val: today?.fat_g ?? 0, target: targets.fat, unit: "g", p: fatPct, color: "var(--red)" },
                    ].map(({ label, val, target, unit, p, color }) => (
                      <div key={label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 11, color: "var(--t2)", fontWeight: 500 }}>{label}</span>
                          <span style={{ fontSize: 11, color: "var(--t3)" }}>
                            {isLoading ? "–" : `${Math.round(val)}`}
                            <span style={{ color: "var(--t3)" }}> / {target}{unit}</span>
                          </span>
                        </div>
                        <div className="mbar-track">
                          <div className="mbar-fill" style={{ width: isLoading ? "0%" : `${p}%`, background: color }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                    <p style={{ fontSize: 10, color: "var(--t3)" }}>
                      Target <span style={{ color: "var(--t2)" }}>{targets.calories.toLocaleString()} kcal</span>
                    </p>
                    <p style={{ fontSize: 10, color: "var(--t3)" }}>
                      Remaining <span style={{ color: "var(--green)", fontWeight: 600 }}>{Math.max(0, targets.calories - Math.round(today?.calories ?? 0)).toLocaleString()} kcal</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ 2. VITALS GRID ══════════════════════════════════════ */}
          <div className="fu d1">
            <p className="slbl" style={{ marginBottom: 10, paddingLeft: 2 }}>Today's vitals</p>
            <div className="vitals-grid">

              {/* Mood */}
              <div className="vcard" style={{ "--ac": "var(--violet)" } as any} onClick={() => navigate("/wellness/mind")}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className="chip" style={{ width: 26, height: 26, background: "rgba(155,127,232,.12)" }}><Smile size={13} color="var(--violet)" /></div>
                    <span style={{ fontSize: 10, color: "var(--t3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em" }}>Mood</span>
                  </div>
                  <ChevronRight size={12} color="var(--t3)" />
                </div>
                {isLoading ? <div className="skel" style={{ width: 54, height: 26, marginTop: 9 }} />
                  : <p className="vnum" style={{ color: data?.todayMood ? "var(--t1)" : "var(--t3)" }}>
                    {data?.todayMood ? `${data.todayMood.mood_score}/10` : "–"}
                  </p>}
                <p style={{ fontSize: 10, color: "var(--t3)" }}>
                  {data?.todayMood ? `E ${data.todayMood.energy_level ?? "–"} · S ${data.todayMood.stress_level ?? "–"}` : "Tap to log"}
                </p>
              </div>

              {/* Sleep */}
              <div className="vcard" style={{ "--ac": "var(--blue)" } as any} onClick={() => navigate("/wellness/mind")}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className="chip" style={{ width: 26, height: 26, background: "rgba(91,156,246,.12)" }}><Moon size={13} color="var(--blue)" /></div>
                    <span style={{ fontSize: 10, color: "var(--t3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em" }}>Sleep</span>
                  </div>
                  <ChevronRight size={12} color="var(--t3)" />
                </div>
                {isLoading ? <div className="skel" style={{ width: 54, height: 26, marginTop: 9 }} />
                  : <p className="vnum" style={{ color: data?.todaySleep ? "var(--t1)" : "var(--t3)" }}>
                    {data?.todaySleep ? `${Number(data.todaySleep.duration_hours ?? 0).toFixed(1)}h` : "–"}
                  </p>}
                <p style={{ fontSize: 10, color: "var(--t3)" }}>
                  {data?.todaySleep ? `Quality: ${"★".repeat(data.todaySleep.quality ?? 0)}${"☆".repeat(Math.max(0, 5 - (data.todaySleep.quality ?? 0)))}` : "Tap to log"}
                </p>
              </div>

              {/* Training */}
              <div className="vcard" style={{ "--ac": "var(--teal)" } as any} onClick={() => navigate("/wellness/training")}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className="chip" style={{ width: 26, height: 26, background: "rgba(45,212,191,.12)" }}><Dumbbell size={13} color="var(--teal)" /></div>
                    <span style={{ fontSize: 10, color: "var(--t3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em" }}>Training</span>
                  </div>
                  <ChevronRight size={12} color="var(--t3)" />
                </div>
                {isLoading ? <div className="skel" style={{ width: 54, height: 26, marginTop: 9 }} />
                  : <p className="vnum" style={{ color: today?.workout_completed ? "var(--green)" : "var(--t3)" }}>
                    {today?.workout_completed ? "Done ✓" : "Rest"}
                  </p>}
                <p style={{ fontSize: 10, color: "var(--t3)" }}>{data?.aggregates?.workouts ?? 0} sessions this week</p>
              </div>

              {/* Weight */}
              <div className="vcard" style={{ "--ac": "var(--green)" } as any} onClick={() => navigate("/wellness/weight")}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className="chip" style={{ width: 26, height: 26, background: "var(--g-dim)" }}><Scale size={13} color="var(--green)" /></div>
                    <span style={{ fontSize: 10, color: "var(--t3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em" }}>Weight</span>
                  </div>
                  <ChevronRight size={12} color="var(--t3)" />
                </div>
                {isLoading ? <div className="skel" style={{ width: 64, height: 26, marginTop: 9 }} />
                  : <p className="vnum" style={{ color: data?.latestWeight ? "var(--t1)" : "var(--t3)" }}>
                    {data?.latestWeight ? <>{data.latestWeight.weight_kg}<span style={{ fontSize: 12, fontFamily: "'Figtree',sans-serif", color: "var(--t3)", fontWeight: 400 }}> kg</span></> : "–"}
                  </p>}
                <p style={{ fontSize: 10, color: "var(--t3)" }}>
                  {data?.latestWeight?.date ? `Logged ${data.latestWeight.date}` : "Tap to log"}
                </p>
              </div>

              {/* Habits */}
              <div className="vcard" style={{ "--ac": "var(--amber)" } as any} onClick={() => navigate("/wellness/habits")}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className="chip" style={{ width: 26, height: 26, background: "rgba(245,166,35,.12)" }}><CheckCircle2 size={13} color="var(--amber)" /></div>
                    <span style={{ fontSize: 10, color: "var(--t3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em" }}>Habits</span>
                  </div>
                  <ChevronRight size={12} color="var(--t3)" />
                </div>
                {isLoading ? <div className="skel" style={{ width: 38, height: 26, marginTop: 9 }} />
                  : <p className="vnum" style={{ color: (today?.habits_completed ?? 0) > 0 ? "var(--t1)" : "var(--t3)" }}>
                    {today?.habits_completed ?? 0}
                  </p>}
                <p style={{ fontSize: 10, color: "var(--t3)" }}>{data?.aggregates?.habit_logs ?? 0} completed this week</p>
              </div>

              {/* AI Plan card */}
              <div
                className="vcard"
                style={{ "--ac": "var(--green)", background: "linear-gradient(135deg,rgba(62,207,110,.07),var(--s2))" } as any}
                onClick={() => navigate(data?.profile ? "/wellness/plan" : "/wellness/onboarding")}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className="chip" style={{ width: 26, height: 26, background: "var(--g-dim)" }}><Sparkles size={13} color="var(--green)" /></div>
                    <span style={{ fontSize: 10, color: "var(--t3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em" }}>AI Plan</span>
                  </div>
                  <ChevronRight size={12} color="var(--t3)" />
                </div>
                <p className="vnum" style={{ color: plan ? "var(--green)" : "var(--t3)", fontSize: "1.2rem" }}>
                  {plan ? "Active ✓" : "Set up"}
                </p>
                <p style={{ fontSize: 10, color: "var(--t3)" }}>
                  {plan ? "Personalised plan ready" : data?.profile ? "Generate your plan" : "Complete profile first"}
                </p>
              </div>

            </div>
          </div>

          {/* ═══ 3. CHARTS ROW ═══════════════════════════════════════ */}
          {(dailyCals.length > 0 || weightSparkline) && (
            <div className="charts-row fu d2">

              {/* 7-day calorie bars */}
              {dailyCals.length > 0 && (
                <div className="card cp">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <p className="syne" style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)" }}>7-Day Calories</p>
                    <span style={{ fontSize: 10, color: "var(--t3)" }}>Target {targets.calories.toLocaleString()}</span>
                  </div>

                  <div style={{ position: "relative", height: 84 }}>
                    {/* Dashed target line */}
                    <div style={{
                      position: "absolute",
                      top: `${100 - (targets.calories / maxCal) * 100}%`,
                      left: 0, right: 0,
                      borderTop: "1px dashed rgba(62,207,110,0.22)",
                    }} />
                    <div style={{ display: "flex", alignItems: "flex-end", height: "100%", gap: 5 }}>
                      {dailyCals.map((d) => {
                        const h = Math.max(4, (d.calories / maxCal) * 100);
                        const isToday = d.date === data?.range?.end;
                        const over = d.calories > targets.calories;
                        return (
                          <div key={d.date} style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end" }}>
                            <div className="cbar" style={{
                              width: "100%", height: `${h}%`,
                              background: isToday
                                ? "linear-gradient(to top,#1ab554,#3ecf6e)"
                                : over ? "rgba(242,117,117,.45)" : "rgba(62,207,110,.22)",
                            }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 5, marginTop: 7 }}>
                    {dailyCals.map((d) => {
                      const isToday = d.date === data?.range?.end;
                      return (
                        <div key={d.date} style={{ flex: 1, textAlign: "center" }}>
                          <span style={{ fontSize: 9, color: isToday ? "var(--green)" : "var(--t3)", fontWeight: isToday ? 700 : 400 }}>
                            {new Date(d.date + "T12:00").toLocaleDateString("en", { weekday: "narrow" })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Weight sparkline */}
              {weightSparkline && (
                <div className="card cp" style={{ cursor: "pointer" }} onClick={() => navigate("/wellness/weight")}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <p className="syne" style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)" }}>Weight Trend</p>
                    <span style={{ fontSize: 10, color: "var(--teal)" }}>14 days</span>
                  </div>

                  <div style={{ height: 68 }}>
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
                      <defs>
                        <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2dd4bf" stopOpacity=".28" />
                          <stop offset="100%" stopColor="#2dd4bf" stopOpacity=".01" />
                        </linearGradient>
                      </defs>
                      <path d={weightSparkline.fill} fill="url(#wg)" />
                      <path d={weightSparkline.line} fill="none" stroke="#2dd4bf" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                    <div>
                      <p style={{ fontSize: 9, color: "var(--t3)" }}>Start</p>
                      <p className="syne" style={{ fontSize: 15, fontWeight: 700, color: "var(--t2)" }}>{weightSparkline.first} <span style={{ fontSize: 10, fontWeight: 400 }}>kg</span></p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 9, color: "var(--t3)" }}>Now</p>
                      <p className="syne" style={{ fontSize: 15, fontWeight: 700, color: "var(--teal)" }}>{weightSparkline.last} <span style={{ fontSize: 10, fontWeight: 400 }}>kg</span></p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ 4. STREAKS ══════════════════════════════════════════ */}
          {data?.streaks && (
            <div className="fu d3">
              <p className="slbl" style={{ marginBottom: 10, paddingLeft: 2, display: "flex", alignItems: "center", gap: 5 }}>
                <Flame size={11} color="#fb923c" /> Streaks
              </p>
              <div className="streak-row">
                {[
                  { count: data.streaks.workout, icon: Dumbbell, label: "Workout", color: "var(--teal)", bg: "rgba(45,212,191,.1)" },
                  { count: data.streaks.mood, icon: Smile, label: "Mood", color: "var(--violet)", bg: "rgba(155,127,232,.1)" },
                  { count: data.streaks.food, icon: Salad, label: "Food", color: "var(--green)", bg: "var(--g-dim)" },
                ].map(({ count, icon: Icon, label, color, bg }) => (
                  <div key={label} className="strk" style={{ opacity: count > 0 ? 1 : 0.42 }}>
                    <div className="chip" style={{ width: 34, height: 34, background: bg, flexShrink: 0 }}>
                      <Icon size={15} color={color} />
                    </div>
                    <div>
                      <p className="strk-n" style={{ color }}>
                        {count}
                        <span style={{ fontSize: 10, fontFamily: "'Figtree',sans-serif", fontWeight: 400, color: "var(--t3)", marginLeft: 3 }}>days</span>
                      </p>
                      <p style={{ fontSize: 10, color: "var(--t3)", marginTop: 1 }}>{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ 5. QUICK ACTIONS ════════════════════════════════════ */}
          <div className="fu d4">
            <p className="slbl" style={{ marginBottom: 10, paddingLeft: 2 }}>Quick log</p>
            <div className="card cp">
              <div className="qa-wrap">
                <label className="btn-p" style={{ cursor: "pointer" }}>
                  <Camera size={14} />
                  Log meal with AI
                  <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleCameraCapture} />
                </label>
                {[
                  { label: "Log meal", icon: Salad, to: "/wellness/nutrition" },
                  { label: "Mind check", icon: Brain, to: "/wellness/mind" },
                  { label: "Log workout", icon: Dumbbell, to: "/wellness/training" },
                  { label: "Weekly", icon: BarChart3, to: "/wellness/weekly" },
                ].map(({ label, icon: Icon, to }) => (
                  <button key={to} className="btn-g" onClick={() => navigate(to)}>
                    <Icon size={13} />{label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ 6. NAV GRID ═════════════════════════════════════════ */}
          <div className="fu d5">
            <p className="slbl" style={{ marginBottom: 10, paddingLeft: 2 }}>Explore</p>
            <div className="nav-grid">
              {[
                { to: "/wellness/mind", icon: Brain, label: "Mind", desc: "Mood · Sleep · Journal", color: "var(--violet)", bg: "rgba(155,127,232,.1)" },
                { to: "/wellness/nutrition", icon: Salad, label: "Nutrition", desc: "Meals & macros", color: "var(--green)", bg: "var(--g-dim)" },
                { to: "/wellness/training", icon: Dumbbell, label: "Training", desc: "Workouts & progress", color: "var(--teal)", bg: "rgba(45,212,191,.1)" },
                { to: "/wellness/habits", icon: CheckCircle2, label: "Habits", desc: "Daily habit tracker", color: "var(--amber)", bg: "rgba(245,166,35,.1)" },
                { to: "/wellness/weight", icon: Scale, label: "Weight", desc: "Body composition", color: "#5bc4f5", bg: "rgba(91,196,245,.1)" },
                { to: "/wellness/weekly", icon: BarChart3, label: "Weekly", desc: "AI-powered analysis", color: "var(--pink)", bg: "rgba(244,114,182,.1)" },
              ].map(({ to, icon: Icon, label, desc, color, bg }) => (
                <button key={to} className="ntile" onClick={() => navigate(to)}>
                  <div className="chip" style={{ width: 34, height: 34, background: bg }}>
                    <Icon size={15} color={color} />
                  </div>
                  <div style={{ overflow: "hidden", minWidth: 0 }}>
                    <p className="syne" style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)", whiteSpace: "nowrap" }}>{label}</p>
                    <p style={{ fontSize: 10, color: "var(--t3)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </main>
      </div>
    </>
  );
}