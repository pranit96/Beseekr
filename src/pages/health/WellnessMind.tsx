import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMood, useSleep, useJournal } from "@/hooks/use-health";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Brain,
  Moon,
  Smile,
  Frown,
  Meh,
  BookOpen,
  Trash2,
  Zap,
  Activity,
} from "lucide-react";

const MOOD_EMOJIS = [
  "😞",
  "😔",
  "😕",
  "😐",
  "🙂",
  "😊",
  "😄",
  "😁",
  "🤩",
  "🔥",
];

export default function WellnessMind() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    history: moodHistory,
    logMood,
    deleteMood,
    isLoading: moodLoading,
  } = useMood();
  const {
    history: sleepHistory,
    logSleep,
    deleteSleep,
    isLoading: sleepLoading,
  } = useSleep();
  const {
    entries: journals,
    createJournal,
    deleteJournal,
    isLoading: journalLoading,
  } = useJournal();

  // ─── Mood form ──────────────────────────────────────────────────────
  const [moodScore, setMoodScore] = useState(5);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [stressLevel, setStressLevel] = useState(5);
  const [moodNotes, setMoodNotes] = useState("");

  // ─── Sleep form ─────────────────────────────────────────────────────
  const [bedtime, setBedtime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepQuality, setSleepQuality] = useState(3);
  const [sleepNotes, setSleepNotes] = useState("");

  // ─── Journal form ───────────────────────────────────────────────────
  const [journalContent, setJournalContent] = useState("");

  // ─── Tab state ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"mood" | "sleep" | "journal">(
    "mood",
  );

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  const calcDuration = (bed: string, wake: string) => {
    const [bh, bm] = bed.split(":").map(Number);
    const [wh, wm] = wake.split(":").map(Number);
    let mins = wh * 60 + wm - (bh * 60 + bm);
    if (mins < 0) mins += 24 * 60;
    return Math.round((mins / 60) * 10) / 10;
  };

  const handleMoodSubmit = async () => {
    try {
      await logMood.mutateAsync({
        moodScore,
        energyLevel,
        stressLevel,
        notes: moodNotes || undefined,
      });
      setMoodNotes("");
      toast({
        title: "Mood logged ✓",
        description: `Score: ${moodScore}/10 ${MOOD_EMOJIS[moodScore - 1]}`,
      });
    } catch (err: any) {
      toast({
        title: "Error logging mood",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleSleepSubmit = async () => {
    const duration = calcDuration(bedtime, wakeTime);
    try {
      await logSleep.mutateAsync({
        bedtime,
        wakeTime,
        durationHours: duration,
        quality: sleepQuality,
        notes: sleepNotes || undefined,
      });
      setSleepNotes("");
      toast({
        title: "Sleep logged ✓",
        description: `${duration} hours, quality ${sleepQuality}/5`,
      });
    } catch (err: any) {
      toast({
        title: "Error logging sleep",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleJournalSubmit = async () => {
    if (!journalContent.trim()) return;
    try {
      await createJournal.mutateAsync({ content: journalContent.trim() });
      setJournalContent("");
      toast({ title: "Journal entry saved ✓" });
    } catch (err: any) {
      toast({
        title: "Error saving journal",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // ─── 7-day mood chart data ─────────────────────────────────────────
  const last7Moods = moodHistory.slice(-7);
  const maxMood = 10;

  // ─── 7-day sleep chart data ────────────────────────────────────────
  const last7Sleep = sleepHistory.slice(-7);
  const maxSleepHrs = 10;

  const tabs = [
    { id: "mood" as const, label: "Mood", icon: Smile },
    { id: "sleep" as const, label: "Sleep", icon: Moon },
    { id: "journal" as const, label: "Journal", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/wellness")}
            className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted/60 active:scale-95 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Brain className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-violet-400 uppercase">
                Mind
              </p>
              <h1 className="text-base sm:text-lg font-semibold">
                Mood · Sleep · Journal
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 sm:py-6 space-y-5">
        {/* Tab selector */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted/50 border border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* MOOD TAB */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === "mood" && (
          <div className="space-y-5">
            {/* Mood input */}
            <section className="rounded-2xl border border-border bg-gradient-to-br from-violet-500/10 to-transparent p-5 space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Smile className="h-4 w-4 text-violet-400" /> How are you
                feeling?
              </h2>

              {/* Mood slider with emoji */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{MOOD_EMOJIS[moodScore - 1]}</span>
                  <span className="text-lg font-bold text-violet-400">
                    {moodScore}/10
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={moodScore}
                  onChange={(e) => setMoodScore(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-violet-500"
                  style={{
                    background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${((moodScore - 1) / 9) * 100}%, hsl(var(--muted)) ${((moodScore - 1) / 9) * 100}%, hsl(var(--muted)) 100%)`,
                  }}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Terrible</span>
                  <span>Amazing</span>
                </div>
              </div>

              {/* Energy + Stress */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3 text-amber-400" /> Energy:{" "}
                    {energyLevel}
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-amber-500"
                    style={{
                      background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${((energyLevel - 1) / 9) * 100}%, hsl(var(--muted)) ${((energyLevel - 1) / 9) * 100}%, hsl(var(--muted)) 100%)`,
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Activity className="h-3 w-3 text-rose-400" /> Stress:{" "}
                    {stressLevel}
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={stressLevel}
                    onChange={(e) => setStressLevel(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-rose-500"
                    style={{
                      background: `linear-gradient(to right, #f43f5e 0%, #f43f5e ${((stressLevel - 1) / 9) * 100}%, hsl(var(--muted)) ${((stressLevel - 1) / 9) * 100}%, hsl(var(--muted)) 100%)`,
                    }}
                  />
                </div>
              </div>

              {/* Notes */}
              <textarea
                value={moodNotes}
                onChange={(e) => setMoodNotes(e.target.value)}
                placeholder="How's your day? (optional)"
                className="w-full bg-background/50 border border-border rounded-xl px-3 py-2 text-sm resize-none h-16 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
              />

              <button
                onClick={handleMoodSubmit}
                disabled={logMood.isPending}
                className="w-full py-2.5 rounded-xl bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 active:scale-[0.98] transition disabled:opacity-50"
              >
                {logMood.isPending ? "Saving…" : "Log mood"}
              </button>
            </section>

            {/* 7-day mood trend */}
            {last7Moods.length > 0 && (
              <section className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                  7-day mood trend
                </h3>
                <div className="flex items-end gap-1.5 h-24">
                  {last7Moods.map((m) => (
                    <div
                      key={m.id}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-[10px] font-medium">
                        {m.mood_score}
                      </span>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-violet-500/80 to-violet-400/40 transition-all"
                        style={{ height: `${(m.mood_score / maxMood) * 100}%` }}
                      />
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(m.log_date).toLocaleDateString("en", {
                          weekday: "short",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Mood history */}
            {moodHistory.length > 0 && (
              <section className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                  Recent moods
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {moodHistory
                    .slice()
                    .reverse()
                    .slice(0, 10)
                    .map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/50 border border-border/50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {MOOD_EMOJIS[m.mood_score - 1]}
                          </span>
                          <div>
                            <p className="text-xs font-medium">
                              {m.mood_score}/10 · E:{m.energy_level ?? "–"} S:
                              {m.stress_level ?? "–"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {m.log_date}
                              {m.notes ? ` · ${m.notes}` : ""}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteMood.mutateAsync(m.id)}
                          className="text-muted-foreground hover:text-destructive transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* SLEEP TAB */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === "sleep" && (
          <div className="space-y-5">
            <section className="rounded-2xl border border-border bg-gradient-to-br from-indigo-500/10 to-transparent p-5 space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Moon className="h-4 w-4 text-indigo-400" /> Log your sleep
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Bedtime
                  </label>
                  <input
                    type="time"
                    value={bedtime}
                    onChange={(e) => setBedtime(e.target.value)}
                    className="w-full bg-background/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Wake time
                  </label>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full bg-background/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Duration:{" "}
                  <span className="font-semibold text-foreground">
                    {calcDuration(bedtime, wakeTime)} hrs
                  </span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Quality</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((q) => (
                    <button
                      key={q}
                      onClick={() => setSleepQuality(q)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                        sleepQuality === q
                          ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                          : "border-border text-muted-foreground hover:bg-muted/60"
                      }`}
                    >
                      {"⭐".repeat(q)}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={sleepNotes}
                onChange={(e) => setSleepNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="w-full bg-background/50 border border-border rounded-xl px-3 py-2 text-sm resize-none h-14 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />

              <button
                onClick={handleSleepSubmit}
                disabled={logSleep.isPending}
                className="w-full py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 active:scale-[0.98] transition disabled:opacity-50"
              >
                {logSleep.isPending ? "Saving…" : "Log sleep"}
              </button>
            </section>

            {/* 7-day sleep chart */}
            {last7Sleep.length > 0 && (
              <section className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                  7-day sleep
                </h3>
                <div className="flex items-end gap-1.5 h-24">
                  {last7Sleep.map((s) => {
                    const hrs = Number(s.duration_hours) || 0;
                    return (
                      <div
                        key={s.id}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <span className="text-[10px] font-medium">{hrs}h</span>
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-indigo-500/80 to-indigo-400/40 transition-all"
                          style={{
                            height: `${Math.min(100, (hrs / maxSleepHrs) * 100)}%`,
                          }}
                        />
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(s.log_date).toLocaleDateString("en", {
                            weekday: "short",
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Recent sleep logs */}
            {sleepHistory.length > 0 && (
              <section className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                  Recent sleep
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {sleepHistory
                    .slice()
                    .reverse()
                    .slice(0, 10)
                    .map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/50 border border-border/50"
                      >
                        <div>
                          <p className="text-xs font-medium">
                            {Number(s.duration_hours) || "–"}h ·{" "}
                            {"⭐".repeat(s.quality ?? 0)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {s.log_date} · {s.bedtime ?? "–"} →{" "}
                            {s.wake_time ?? "–"}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteSleep.mutateAsync(s.id)}
                          className="text-muted-foreground hover:text-destructive transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* JOURNAL TAB */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === "journal" && (
          <div className="space-y-5">
            <section className="rounded-2xl border border-border bg-gradient-to-br from-amber-500/10 to-transparent p-5 space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-amber-400" /> Daily reflection
              </h2>
              <textarea
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                placeholder="What's on your mind today? Wins, struggles, gratitude…"
                className="w-full bg-background/50 border border-border rounded-xl px-3 py-3 text-sm resize-none h-32 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
              <button
                onClick={handleJournalSubmit}
                disabled={createJournal.isPending || !journalContent.trim()}
                className="w-full py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 active:scale-[0.98] transition disabled:opacity-50"
              >
                {createJournal.isPending ? "Saving…" : "Save entry"}
              </button>
            </section>

            {/* Entries list */}
            {journals.length > 0 && (
              <section className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                  Past entries
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {journals.map((j) => (
                    <div
                      key={j.id}
                      className="px-3 py-2.5 rounded-xl bg-background/50 border border-border/50 space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[10px] text-muted-foreground">
                          {j.entry_date}
                        </p>
                        <button
                          onClick={() => deleteJournal.mutateAsync(j.id)}
                          className="text-muted-foreground hover:text-destructive transition shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-foreground/90 whitespace-pre-wrap">
                        {j.content}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
