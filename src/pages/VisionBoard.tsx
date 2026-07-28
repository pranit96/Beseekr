/**
 * VisionBoard.tsx — Monthly Scrapbook / Vision Board
 * Route: /board  (standalone, like /brain)
 *
 * Cork-board & washi-tape scrapbook aesthetic. Month-by-month personal tracker:
 * goals, habits, life areas, vision collage, notes & reflection.
 *
 * NOTE: All data-fetching, mutations, query keys, and API payload shapes are
 * unchanged from the original — only presentation (JSX structure that lives in
 * this file, plus the shared BOARD_STYLES stylesheet) has been redesigned.
 * A small "Month at a glance" strip was added using data already returned by
 * the existing endpoints (goals/habits/lifeAreas/visionCards arrays + habit
 * log status), no new API calls.
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { visionBoardApi } from "@/api/visionboard";
import type {
  FullBoardData, VisionGoal, VisionCard, LifeArea,
  HabitLog, BoardNotes, BoardMonth, WeatherData,
} from "@/api/visionboard";

import { GlobalHeader }     from "@/components/GlobalHeader";
import { BoardHeader }     from "@/components/visionboard/BoardHeader";
import { WeatherStrip }    from "@/components/visionboard/WeatherStrip";
import { VisionCollage }   from "@/components/visionboard/VisionCollage";
import { ThemeSidebar }    from "@/components/visionboard/ThemeSidebar";
import { FocusToday }      from "@/components/visionboard/FocusToday";
import { MonthGoals }      from "@/components/visionboard/MonthGoals";
import { LifeAreas }       from "@/components/visionboard/LifeAreas";
import { HabitGarden }     from "@/components/visionboard/HabitGarden";
import { QuickNotes }      from "@/components/visionboard/QuickNotes";
import { CalendarHeatmap } from "@/components/visionboard/CalendarHeatmap";
import { MonthReflection } from "@/components/visionboard/MonthReflection";
import { YearJourney }     from "@/components/visionboard/YearJourney";

// ── Helpers ───────────────────────────────────────────────────────────────────

function currentYearMonth() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Respects the OS-level "reduce motion" preference so animation is opt-out, not forced. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  return reduced;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VisionBoard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const now = currentYearMonth();
  const prefersReducedMotion = usePrefersReducedMotion();

  const [year,  setYear]  = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const isCurrentMonth = year === now.year && month === now.month;

  const boardKey = ["visionboard", year, month];
  const yearKey  = ["visionboard-year", year];

  // ── Queries ─────────────────────────────────────────────────────────────────

  const { data: boardRes, isLoading } = useQuery({
    queryKey: boardKey,
    queryFn:  () => visionBoardApi.getBoardData(year, month),
    staleTime: 2 * 60 * 1000,
  });

  const { data: yearRes } = useQuery({
    queryKey: yearKey,
    queryFn:  () => visionBoardApi.getYearSummary(year),
    staleTime: 5 * 60 * 1000,
  });

  const { data: weatherRes } = useQuery({
    queryKey: ["visionboard-weather", year, month],
    queryFn:  () => visionBoardApi.getWeather(year, month),
    staleTime: 30 * 60 * 1000, // 30 min — weather rarely needs instant refresh
  });

  const board       = boardRes?.data;
  const yearSummary = yearRes?.data ?? [];
  const cachedWeather = weatherRes?.data ?? null;

  // ── Month navigation ────────────────────────────────────────────────────────

  function navigate(direction: -1 | 1) {
    let m = month + direction;
    let y = year;
    if (m < 1)  { m = 12; y--; }
    if (m > 12) { m = 1;  y++; }
    setMonth(m); setYear(y);
  }

  function goToMonth(m: number) {
    setMonth(m);
  }

  // ── Mutations ───────────────────────────────────────────────────────────────

  function invalidateBoard() {
    qc.invalidateQueries({ queryKey: boardKey });
    qc.invalidateQueries({ queryKey: yearKey  });
  }

  function onError(ctx: string, err: any) {
    toast({ title: "Something went wrong", description: err?.message, variant: "destructive" });
  }

  // Board metadata
  const updateMeta = useMutation({
    mutationFn: (updates: Partial<Pick<BoardMonth, "quote"|"mood_tag"|"theme_words"|"focus_items">>) =>
      visionBoardApi.updateBoardMonth(year, month, updates),
    onMutate: async (updates) => {
      await qc.cancelQueries({ queryKey: boardKey });
      const previousBoard = qc.getQueryData<{ success: boolean; data: FullBoardData }>(boardKey);
      if (previousBoard?.data) {
        qc.setQueryData(boardKey, {
          ...previousBoard,
          data: {
            ...previousBoard.data,
            month: { ...previousBoard.data.month, ...updates },
          },
        });
      }
      return { previousBoard };
    },
    onError: (err, _vars, context) => {
      if (context?.previousBoard) qc.setQueryData(boardKey, context.previousBoard);
      onError("updateMeta", err);
    },
    onSettled: invalidateBoard,
  });

  // Goals
  const addGoal = useMutation({
    mutationFn: (payload: { title: string; progressTarget: number; progressUnit: string }) =>
      visionBoardApi.addGoal(year, month, payload),
    onSuccess: invalidateBoard,
    onError: (e) => onError("addGoal", e),
  });

  const updateGoal = useMutation({
    mutationFn: ({ goalId, updates }: { goalId: string; updates: any }) =>
      visionBoardApi.updateGoal(year, month, goalId, updates),
    onMutate: async ({ goalId, updates }) => {
      await qc.cancelQueries({ queryKey: boardKey });
      const previousBoard = qc.getQueryData<{ success: boolean; data: FullBoardData }>(boardKey);
      if (previousBoard?.data) {
        qc.setQueryData(boardKey, {
          ...previousBoard,
          data: {
            ...previousBoard.data,
            goals: previousBoard.data.goals.map((g) => (g.id === goalId ? { ...g, ...updates } : g)),
          },
        });
      }
      return { previousBoard };
    },
    onError: (err, _vars, context) => {
      if (context?.previousBoard) qc.setQueryData(boardKey, context.previousBoard);
      onError("updateGoal", err);
    },
    onSettled: invalidateBoard,
  });

  const deleteGoal = useMutation({
    mutationFn: (goalId: string) => visionBoardApi.deleteGoal(year, month, goalId),
    onMutate: async (goalId) => {
      await qc.cancelQueries({ queryKey: boardKey });
      const previousBoard = qc.getQueryData<{ success: boolean; data: FullBoardData }>(boardKey);
      if (previousBoard?.data) {
        qc.setQueryData(boardKey, {
          ...previousBoard,
          data: {
            ...previousBoard.data,
            goals: previousBoard.data.goals.filter((g) => g.id !== goalId),
          },
        });
      }
      return { previousBoard };
    },
    onError: (err, _vars, context) => {
      if (context?.previousBoard) qc.setQueryData(boardKey, context.previousBoard);
      onError("deleteGoal", err);
    },
    onSettled: invalidateBoard,
  });

  // Life areas
  const upsertAreas = useMutation({
    mutationFn: (areas: Array<{ area: string; score: number }>) =>
      visionBoardApi.upsertLifeAreas(year, month, areas),
    onMutate: async (areas) => {
      await qc.cancelQueries({ queryKey: boardKey });
      const previousBoard = qc.getQueryData<{ success: boolean; data: FullBoardData }>(boardKey);
      if (previousBoard?.data) {
        const areaMap = new Map(areas.map((a) => [a.area, a.score]));
        qc.setQueryData(boardKey, {
          ...previousBoard,
          data: {
            ...previousBoard.data,
            lifeAreas: previousBoard.data.lifeAreas.map((la) =>
              areaMap.has(la.area) ? { ...la, score: areaMap.get(la.area)! } : la
            ),
          },
        });
      }
      return { previousBoard };
    },
    onError: (err, _vars, context) => {
      if (context?.previousBoard) qc.setQueryData(boardKey, context.previousBoard);
      onError("upsertAreas", err);
    },
    onSettled: invalidateBoard,
  });

  // Habits
  const addHabit = useMutation({
    mutationFn: (payload: { name: string; icon?: string }) =>
      visionBoardApi.addHabit(year, month, payload),
    onSuccess: invalidateBoard,
    onError: (e) => onError("addHabit", e),
  });

  const deleteHabit = useMutation({
    mutationFn: (habitId: string) => visionBoardApi.deleteHabit(year, month, habitId),
    onMutate: async (habitId) => {
      await qc.cancelQueries({ queryKey: boardKey });
      const previousBoard = qc.getQueryData<{ success: boolean; data: FullBoardData }>(boardKey);
      if (previousBoard?.data) {
        qc.setQueryData(boardKey, {
          ...previousBoard,
          data: {
            ...previousBoard.data,
            habits: previousBoard.data.habits.filter((h) => h.id !== habitId),
          },
        });
      }
      return { previousBoard };
    },
    onError: (err, _vars, context) => {
      if (context?.previousBoard) qc.setQueryData(boardKey, context.previousBoard);
      onError("deleteHabit", err);
    },
    onSettled: invalidateBoard,
  });

  const logHabit = useMutation({
    mutationFn: ({ habitId, payload }: { habitId: string; payload: { logDate: string; status: HabitLog["status"] } }) =>
      visionBoardApi.logHabit(year, month, habitId, payload),
    onMutate: async ({ habitId, payload }) => {
      await qc.cancelQueries({ queryKey: boardKey });
      const previousBoard = qc.getQueryData<{ success: boolean; data: FullBoardData }>(boardKey);
      if (previousBoard?.data) {
        qc.setQueryData(boardKey, {
          ...previousBoard,
          data: {
            ...previousBoard.data,
            habits: previousBoard.data.habits.map((h) => {
              if (h.id !== habitId) return h;
              const filteredLogs = h.logs.filter((l) => l.log_date !== payload.logDate);
              return {
                ...h,
                logs: [
                  ...filteredLogs,
                  { id: "temp", habit_id: habitId, user_id: "", log_date: payload.logDate, status: payload.status },
                ],
              };
            }),
          },
        });
      }
      return { previousBoard };
    },
    onError: (err, _vars, context) => {
      if (context?.previousBoard) qc.setQueryData(boardKey, context.previousBoard);
      onError("logHabit", err);
    },
    onSettled: invalidateBoard,
  });

  // Notes
  const upsertNotes = useMutation({
    mutationFn: (updates: Partial<BoardNotes>) =>
      visionBoardApi.upsertNotes(year, month, updates),
    onMutate: async (updates) => {
      await qc.cancelQueries({ queryKey: boardKey });
      const previousBoard = qc.getQueryData<{ success: boolean; data: FullBoardData }>(boardKey);
      if (previousBoard?.data) {
        const currentNotes = previousBoard.data.notes || {
          id: "temp", user_id: "", year, month,
          quick_notes: null, win: null, challenge: null, gratitude: null, improve: null,
          updated_at: new Date().toISOString(),
        };
        qc.setQueryData(boardKey, {
          ...previousBoard,
          data: {
            ...previousBoard.data,
            notes: { ...currentNotes, ...updates },
          },
        });
      }
      return { previousBoard };
    },
    onError: (err, _vars, context) => {
      if (context?.previousBoard) qc.setQueryData(boardKey, context.previousBoard);
      onError("upsertNotes", err);
    },
    onSettled: invalidateBoard,
  });

  // Vision cards
  const addCard = useMutation({
    mutationFn: (payload: { title: string; emoji: string; colorAccent: VisionCard["color_accent"]; cardType: VisionCard["card_type"] }) =>
      visionBoardApi.addVisionCard(year, month, payload),
    onSuccess: invalidateBoard,
    onError: (e) => onError("addCard", e),
  });

  const deleteCard = useMutation({
    mutationFn: (cardId: string) => visionBoardApi.deleteVisionCard(year, month, cardId),
    onMutate: async (cardId) => {
      await qc.cancelQueries({ queryKey: boardKey });
      const previousBoard = qc.getQueryData<{ success: boolean; data: FullBoardData }>(boardKey);
      if (previousBoard?.data) {
        qc.setQueryData(boardKey, {
          ...previousBoard,
          data: {
            ...previousBoard.data,
            visionCards: previousBoard.data.visionCards.filter((c) => c.id !== cardId),
          },
        });
      }
      return { previousBoard };
    },
    onError: (err, _vars, context) => {
      if (context?.previousBoard) qc.setQueryData(boardKey, context.previousBoard);
      onError("deleteCard", err);
    },
    onSettled: invalidateBoard,
  });

  const uploadCardFile = useMutation({
    mutationFn: ({ cardId, file }: { cardId: string; file: File }) =>
      visionBoardApi.uploadCardFile(year, month, cardId, file),
    onSuccess: invalidateBoard,
    onError: (e) => onError("uploadCardFile", e),
  });

  // Weather
  const upsertWeather = useMutation({
    mutationFn: (payload: Partial<WeatherData>) =>
      visionBoardApi.upsertWeather(year, month, payload),
    onMutate: async (payload) => {
      const weatherKey = ["visionboard-weather", year, month];
      await qc.cancelQueries({ queryKey: weatherKey });
      const previousWeather = qc.getQueryData<{ success: boolean; data: WeatherData | null }>(weatherKey);
      if (previousWeather) {
        qc.setQueryData(weatherKey, {
          ...previousWeather,
          data: previousWeather.data ? { ...previousWeather.data, ...payload } : (payload as WeatherData),
        });
      }
      return { previousWeather };
    },
    onError: (err, _vars, context) => {
      if (context?.previousWeather) qc.setQueryData(["visionboard-weather", year, month], context.previousWeather);
      onError("upsertWeather", err);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["visionboard-weather", year, month] }),
  });

  // ── Derived "at a glance" stats (client-side only, from data already fetched) ──

  const glance = useMemo(() => {
    if (!board) return null;
    const totalGoals   = board.goals.length;
    const totalHabits  = board.habits.length;
    const totalAreas   = board.lifeAreas.length;
    const totalCards   = board.visionCards.length;

    const checkIns = board.habits.reduce(
      (sum, h) => sum + h.logs.filter((l) => l.status === "done").length,
      0
    );

    const avgAreaScore = totalAreas
      ? Math.round((board.lifeAreas.reduce((sum, la) => sum + (la.score ?? 0), 0) / totalAreas) * 10) / 10
      : null;

    // Longest current streak of consecutive "done" days across all habits (simple, safe heuristic)
    let bestStreak = 0;
    for (const h of board.habits) {
      const doneDates = new Set(h.logs.filter((l) => l.status === "done").map((l) => l.log_date));
      let streak = 0;
      let cursor = new Date();
      while (doneDates.has(cursor.toISOString().slice(0, 10))) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
      bestStreak = Math.max(bestStreak, streak);
    }

    return { totalGoals, totalHabits, totalAreas, totalCards, checkIns, avgAreaScore, bestStreak };
  }, [board]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500/30"
      data-reduced-motion={prefersReducedMotion ? "true" : "false"}
    >
      <a href="#vb-main-content" className="vb-skip-link">Skip to your board</a>
      <GlobalHeader />
      <main id="vb-main-content" className="flex-1 w-full max-w-[1550px] mx-auto px-4 sm:px-8 py-8">
        <div className="vb-page">
          {/* Google Fonts */}
          <link
            href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Caveat:wght@400;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;600&display=swap"
            rel="stylesheet"
          />

          {/* CSS Variables + Styles */}
          <style>{BOARD_STYLES}</style>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="vb-loading" role="status" aria-live="polite">
          <div className="vb-loading-card">
            <motion.div
              animate={prefersReducedMotion ? {} : { rotate: 360 }}
              transition={prefersReducedMotion ? {} : { duration: 2.2, repeat: Infinity, ease: "linear" }}
              className="vb-spinner"
              aria-hidden="true"
            >✦</motion.div>
            <p>Smoothing the pages, pinning the corners…</p>
          </div>
        </div>
      )}

      {/* ── Board ── */}
      <AnimatePresence mode="wait">
        {board && (
          <motion.div
            key={`${year}-${month}`}
            initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{    opacity: 0, x: prefersReducedMotion ? 0 : -24 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.35, ease: "easeInOut" }}
          >
            {/* 1. Header */}
            <BoardHeader
              boardMonth={board.month}
              onPrev={() => navigate(-1)}
              onNext={() => navigate(1)}
              onUpdate={(u) => updateMeta.mutateAsync(u)}
              isCurrentMonth={isCurrentMonth}
            />

            {/* 1a. Month at a glance — new, derived from existing board data */}
            {glance && (
              <section className="vb-glance-strip" aria-label={`${MONTH_NAMES[month - 1]} ${year} at a glance`}>
                <div className="vb-glance-item">
                  <span className="vb-glance-icon" aria-hidden="true">🎯</span>
                  <span className="vb-glance-num">{glance.totalGoals}</span>
                  <span className="vb-glance-label">goal{glance.totalGoals === 1 ? "" : "s"}</span>
                </div>
                <span className="vb-glance-sep" aria-hidden="true">·</span>
                <div className="vb-glance-item">
                  <span className="vb-glance-icon" aria-hidden="true">🌱</span>
                  <span className="vb-glance-num">{glance.checkIns}</span>
                  <span className="vb-glance-label">check-in{glance.checkIns === 1 ? "" : "s"}</span>
                </div>
                {glance.bestStreak > 0 && (
                  <>
                    <span className="vb-glance-sep" aria-hidden="true">·</span>
                    <div className="vb-glance-item">
                      <span className="vb-glance-icon" aria-hidden="true">🔥</span>
                      <span className="vb-glance-num">{glance.bestStreak}</span>
                      <span className="vb-glance-label">day streak</span>
                    </div>
                  </>
                )}
                {glance.avgAreaScore !== null && (
                  <>
                    <span className="vb-glance-sep" aria-hidden="true">·</span>
                    <div className="vb-glance-item">
                      <span className="vb-glance-icon" aria-hidden="true">💫</span>
                      <span className="vb-glance-num">{glance.avgAreaScore}</span>
                      <span className="vb-glance-label">avg. balance</span>
                    </div>
                  </>
                )}
                <span className="vb-glance-sep" aria-hidden="true">·</span>
                <div className="vb-glance-item">
                  <span className="vb-glance-icon" aria-hidden="true">📌</span>
                  <span className="vb-glance-num">{glance.totalCards}</span>
                  <span className="vb-glance-label">on the board</span>
                </div>
              </section>
            )}

            {/* 1b. Weather Strip */}
            <WeatherStrip
              year={year}
              month={month}
              cached={cachedWeather}
              onSave={(p) => upsertWeather.mutateAsync(p)}
            />

            {/* 2. Three-column: Theme | Collage | Focus */}
            <div className="vb-three-col">
              <ThemeSidebar
                themeWords={board.month.theme_words}
                focusItems={board.month.focus_items}
                onUpdate={(u) => updateMeta.mutateAsync(u)}
              />
              <VisionCollage
                cards={board.visionCards}
                onAdd={(p) => addCard.mutateAsync(p)}
                onDelete={(id) => deleteCard.mutateAsync(id)}
                onUpload={(cardId, file) => uploadCardFile.mutateAsync({ cardId, file })}
              />
              <FocusToday
                focusItems={board.month.focus_items}
                month={month}
                year={year}
                onUpdate={(u) => updateMeta.mutateAsync(u)}
              />
            </div>

            {/* 3. Month Goals */}
            <MonthGoals
              goals={board.goals}
              onAdd={(p) => addGoal.mutateAsync(p)}
              onUpdate={(goalId, updates) => updateGoal.mutateAsync({ goalId, updates })}
              onDelete={(goalId) => deleteGoal.mutateAsync(goalId)}
            />

            {/* 4. Life Areas */}
            {board.lifeAreas.length > 0 && (
              <LifeAreas
                areas={board.lifeAreas}
                onUpdate={(areas) => upsertAreas.mutateAsync(areas)}
              />
            )}

            {/* 5. Habit Garden + Quick Notes */}
            <div className="vb-two-col">
              <HabitGarden
                habits={board.habits}
                year={year}
                month={month}
                onAddHabit={(p) => addHabit.mutateAsync(p)}
                onDeleteHabit={(id) => deleteHabit.mutateAsync(id)}
                onLogHabit={(habitId, p) => logHabit.mutateAsync({ habitId, payload: p })}
              />
              <QuickNotes
                notes={board.notes}
                onSave={(u) => upsertNotes.mutateAsync(u)}
              />
            </div>

            {/* 6. Calendar Heatmap */}
            <CalendarHeatmap
              habits={board.habits}
              year={year}
              month={month}
            />

            {/* 7. Month Reflection */}
            <MonthReflection
              notes={board.notes}
              onSave={(u) => upsertNotes.mutateAsync(u)}
            />

            {/* 8. Year Journey */}
            {yearSummary.length > 0 && (
              <YearJourney
                summary={yearSummary}
                currentYear={year}
                activeMonth={month}
                onNavigate={goToMonth}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
// All vision board styles are self-contained here — no Tailwind dependency.
// Cork-board & washi-tape scrapbook palette, tactile paper textures, warm
// handwritten accents, and accessible focus/contrast/motion handling.

const BOARD_STYLES = `
  /* ── Fonts & Light/Dark Theme Tokens ─────────────────────────────── */
  .vb-page {
    /* Paper & surfaces */
    --vb-parchment:   #F8EFDC;
    --vb-linen:       #EFE1C4;
    --vb-aged:        #DED0AE;
    --vb-cream:       #FFFBF2;

    /* Cork-board backdrop */
    --vb-cork:        #B4906A;
    --vb-cork-dark:   #8C6A48;

    /* Ink & text */
    --vb-ink:         #35281D;
    --vb-muted-ink:   #6E5A45;
    --vb-taupe:       #8A7357;

    /* Signature accent — clay/terracotta, used with restraint */
    --vb-terracotta:  #C1603A;
    --vb-terracotta-dark: #A24E2E;

    /* Washi-tape family (secondary accents, not just one color) */
    --vb-sage:        #7E9971;
    --vb-blush:       #CC7E77;
    --vb-mustard:     #D3A036;
    --vb-slate:       #5C8599;

    --vb-border:      rgba(53,40,29,0.15);
    --vb-border-strong: rgba(53,40,29,0.28);
    --vb-shadow:      rgba(53,40,29,0.10);
    --vb-focus-ring:  #A24E2E;

    font-family: 'Lora', Georgia, serif;
    color: var(--vb-ink);
    max-width: 1500px;
    margin: 0 auto;
    padding: 0 0 64px;
    position: relative;
  }

  /* Dark mode — cork & leather scrapbook, still warm, never flat black */
  .dark .vb-page,
  :root[class~="dark"] .vb-page {
    --vb-parchment:   #241E17;
    --vb-linen:       #2D2519;
    --vb-aged:        #453722;
    --vb-cream:       #1C1712;
    --vb-cork:        #5A4530;
    --vb-cork-dark:   #3E301F;
    --vb-ink:         #F5E9D3;
    --vb-muted-ink:   #D8C4A3;
    --vb-taupe:       #C2A579;
    --vb-terracotta:  #E2825A;
    --vb-terracotta-dark: #C96B45;
    --vb-sage:        #9BB98C;
    --vb-blush:       #E1a196;
    --vb-mustard:     #E5B94F;
    --vb-slate:       #7FAFC4;
    --vb-border:      rgba(245,233,211,0.16);
    --vb-border-strong: rgba(245,233,211,0.30);
    --vb-shadow:      rgba(0,0,0,0.45);
    --vb-focus-ring:  #E2825A;
  }

  /* ── Accessibility baseline ──────────────────────────────────────── */
  .vb-page *:focus-visible {
    outline: 2.5px solid var(--vb-focus-ring);
    outline-offset: 2px;
    border-radius: 4px;
  }
  .vb-skip-link {
    position: fixed;
    top: -48px;
    left: 12px;
    z-index: 1000;
    background: var(--vb-terracotta, #C1603A);
    color: #fff;
    padding: 10px 16px;
    border-radius: 8px;
    font-family: 'Lora', serif;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    transition: top 0.2s ease;
    box-shadow: 0 4px 14px rgba(0,0,0,0.25);
  }
  .vb-skip-link:focus {
    top: 12px;
  }

  [data-reduced-motion="true"] * {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }

  /* ── Loading ─────────────────────────────── */
  .vb-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 320px;
  }
  .vb-loading-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    background: var(--vb-parchment);
    border: 1px solid var(--vb-border);
    border-radius: 16px;
    padding: 32px 40px;
    box-shadow: 0 4px 20px var(--vb-shadow);
    color: var(--vb-taupe);
    font-family: 'Caveat', cursive;
    font-size: 19px;
  }
  .vb-spinner {
    font-size: 30px;
    color: var(--vb-terracotta);
  }

  /* ── Section wrapper ─────────────────────── */
  .vb-section {
    background: var(--vb-parchment);
    border: 1px solid var(--vb-border);
    border-radius: 14px;
    padding: 26px 24px 24px;
    margin-bottom: 18px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 3px 14px var(--vb-shadow), inset 0 1px 0 rgba(255,255,255,0.55);
  }
  .vb-section::before {
    /* paper grain */
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E");
    pointer-events: none;
    border-radius: 14px;
    opacity: 0.55;
  }
  .vb-section::after {
    /* washi-tape corner — the page's signature motif */
    content: '';
    position: absolute;
    top: -9px;
    left: 26px;
    width: 74px;
    height: 22px;
    background: repeating-linear-gradient(
      135deg,
      color-mix(in srgb, var(--vb-terracotta) 78%, transparent),
      color-mix(in srgb, var(--vb-terracotta) 78%, transparent) 6px,
      color-mix(in srgb, var(--vb-terracotta) 55%, transparent) 6px,
      color-mix(in srgb, var(--vb-terracotta) 55%, transparent) 12px
    );
    opacity: 0.85;
    transform: rotate(-3deg);
    border-radius: 2px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.12);
    pointer-events: none;
  }

  /* ── Section label ─────────────────────── */
  .vb-section-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: 'Lora', serif;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.13em;
    color: var(--vb-taupe);
    margin-bottom: 16px;
  }
  .vb-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  /* ── Header Card ─────────────────────────── */
  .vb-header-card {
    background: linear-gradient(150deg, var(--vb-linen) 0%, var(--vb-parchment) 55%, #EFDBB0 100%);
    border: 1px solid var(--vb-border);
    border-radius: 18px;
    padding: 34px 24px 30px;
    margin-bottom: 18px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 6px 26px var(--vb-shadow), inset 0 1px 0 rgba(255,255,255,0.8);
    text-align: center;
  }
  .vb-header-card::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 10px;
    transform: translateX(-50%) rotate(-1.5deg);
    width: 84px;
    height: 24px;
    background: repeating-linear-gradient(
      135deg,
      color-mix(in srgb, var(--vb-mustard) 80%, transparent),
      color-mix(in srgb, var(--vb-mustard) 80%, transparent) 6px,
      color-mix(in srgb, var(--vb-mustard) 55%, transparent) 6px,
      color-mix(in srgb, var(--vb-mustard) 55%, transparent) 12px
    );
    box-shadow: 0 2px 5px rgba(0,0,0,0.12);
    border-radius: 2px;
  }
  .vb-grain-overlay {
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
    pointer-events: none;
    opacity: 0.5;
  }
  .vb-header-inner {
    display: flex;
    align-items: center;
    gap: 16px;
    position: relative;
    margin-top: 6px;
  }
  .vb-header-center {
    flex: 1;
  }
  .vb-nav-btn {
    background: rgba(53,40,29,0.06);
    border: 1px solid var(--vb-border);
    border-radius: 10px;
    width: 38px; height: 38px;
    display: flex; align-items: center; justify-content: center;
    color: var(--vb-muted-ink);
    cursor: pointer;
    transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.2s;
    flex-shrink: 0;
  }
  .vb-nav-btn:hover {
    background: var(--vb-terracotta);
    color: white;
    border-color: var(--vb-terracotta);
    transform: scale(1.06);
  }

  /* Month title */
  .vb-month-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: clamp(24px, 4vw, 36px);
    font-weight: 700;
    color: var(--vb-ink);
    letter-spacing: 0.04em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 10px;
  }
  .vb-ornament {
    color: var(--vb-terracotta);
    font-size: 0.65em;
  }

  /* Quote */
  .vb-quote-row { margin-bottom: 12px; }
  .vb-quote {
    font-family: 'Caveat', cursive;
    font-size: 19px;
    font-weight: 600;
    color: var(--vb-muted-ink);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: color 0.2s;
    margin: 0;
    border-radius: 6px;
    padding: 2px 6px;
  }
  .vb-quote:hover { color: var(--vb-terracotta); }
  .vb-inline-pencil {
    opacity: 0;
    transition: opacity 0.2s;
  }
  .vb-quote:hover .vb-inline-pencil,
  .vb-refl-text:hover .vb-inline-pencil { opacity: 0.7; }

  /* Meta row */
  .vb-meta-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 13px;
    color: var(--vb-taupe);
    flex-wrap: wrap;
  }
  .vb-divider { opacity: 0.5; }
  .vb-mood-tag {
    font-family: 'Caveat', cursive;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: color 0.2s;
    border-radius: 6px;
    padding: 2px 6px;
  }
  .vb-mood-tag:hover { color: var(--vb-terracotta); }
  .vb-time { font-size: 13px; }
  .vb-current-badge {
    background: var(--vb-terracotta);
    color: white;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
    font-family: 'Lora', serif;
    letter-spacing: 0.06em;
  }

  /* Edit rows */
  .vb-edit-row {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
  }
  .vb-quote-input, .vb-mood-input {
    background: var(--vb-cream);
    border: 1px solid var(--vb-border);
    border-radius: 8px;
    padding: 5px 12px;
    font-family: 'Caveat', cursive;
    font-size: 18px;
    color: var(--vb-ink);
    width: min(400px, 70vw);
    text-align: center;
    outline: none;
  }
  .vb-quote-input:focus, .vb-mood-input:focus {
    border-color: var(--vb-terracotta);
    box-shadow: 0 0 0 3px rgba(193,96,58,0.16);
  }
  .vb-save-btn {
    background: var(--vb-terracotta);
    border: none;
    border-radius: 8px;
    width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    color: white;
    cursor: pointer;
    transition: background 0.2s;
  }
  .vb-save-btn:hover { background: var(--vb-terracotta-dark); }

  /* ── Month at a glance (new) ──────────────── */
  .vb-glance-strip {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px 16px;
    background: var(--vb-cream);
    border: 1px dashed var(--vb-border-strong);
    border-radius: 12px;
    padding: 12px 20px;
    margin-bottom: 18px;
  }
  .vb-glance-item {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }
  .vb-glance-icon { font-size: 15px; }
  .vb-glance-num {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
    font-size: 15px;
    color: var(--vb-terracotta);
  }
  .vb-glance-label {
    font-family: 'Lora', serif;
    font-size: 12.5px;
    color: var(--vb-muted-ink);
  }
  .vb-glance-sep {
    color: var(--vb-aged);
    font-size: 16px;
  }
  @media (max-width: 560px) {
    .vb-glance-sep { display: none; }
    .vb-glance-strip { justify-content: flex-start; gap: 10px 18px; }
  }

  /* ── Three-column layout ─────────────────── */
  .vb-three-col {
    display: grid;
    grid-template-columns: 240px 1fr 260px;
    gap: 16px;
    margin-bottom: 20px;
  }
  @media (max-width: 1024px) {
    .vb-three-col {
      grid-template-columns: 200px 1fr 200px;
      gap: 12px;
    }
  }
  @media (max-width: 768px) {
    .vb-three-col {
      grid-template-columns: 1fr;
    }
  }
  .vb-sidebar {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* ── Theme chips ─────────────────────────── */
  .vb-theme-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .vb-theme-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(193,96,58,0.13);
    border: 1px solid rgba(193,96,58,0.32);
    border-radius: 20px;
    padding: 4px 11px;
    font-family: 'Caveat', cursive;
    font-size: 16px;
    font-weight: 600;
    color: var(--vb-terracotta-dark);
    cursor: default;
  }
  .vb-chip-x {
    background: none; border: none; cursor: pointer;
    color: var(--vb-taupe); opacity: 0.75; padding: 2px;
    display: flex; align-items: center;
    transition: opacity 0.2s;
    border-radius: 50%;
  }
  .vb-chip-x:hover { opacity: 1; color: var(--vb-terracotta); }
  .vb-chip-add {
    display: flex; align-items: center; gap: 4px;
    background: none;
    border: 1.5px dashed var(--vb-border-strong);
    border-radius: 20px;
    padding: 4px 11px;
    font-family: 'Lora', serif;
    font-size: 12px;
    color: var(--vb-taupe);
    cursor: pointer;
    transition: all 0.2s;
  }
  .vb-chip-add:hover {
    border-color: var(--vb-terracotta);
    color: var(--vb-terracotta);
    background: rgba(193,96,58,0.06);
  }
  .vb-chip-input {
    background: var(--vb-cream);
    border: 1px solid var(--vb-terracotta);
    border-radius: 20px;
    padding: 4px 12px;
    font-family: 'Caveat', cursive;
    font-size: 16px;
    color: var(--vb-ink);
    width: 120px;
    outline: none;
  }
  .vb-mt-2 { margin-top: 8px; }

  /* ── Focus Today ──────────────────────────── */
  .vb-focus-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
  .vb-focus-item {
    display: flex; align-items: center; gap: 7px;
    background: rgba(126,153,113,0.13);
    border-radius: 9px;
    padding: 7px 11px;
    font-family: 'Caveat', cursive;
    font-size: 17px;
    font-weight: 500;
    color: var(--vb-ink);
  }
  .vb-focus-dot { color: var(--vb-sage); font-size: 14px; }
  .vb-focus-text { flex: 1; }
  .vb-empty-hint {
    font-family: 'Caveat', cursive;
    font-size: 16px;
    color: var(--vb-taupe);
    text-align: center;
    padding: 18px 0;
    margin: 0;
    font-style: italic;
  }
  .vb-month-progress { margin-top: 16px; }
  .vb-progress-label {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--vb-muted-ink);
    margin-bottom: 6px;
    font-family: 'Lora', serif;
  }
  .vb-progress-pct { font-weight: 700; color: var(--vb-terracotta); }
  .vb-progress-track {
    height: 7px;
    background: var(--vb-aged);
    border-radius: 5px;
    overflow: hidden;
  }
  .vb-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--vb-terracotta), #DE8A5D);
    border-radius: 5px;
  }

  /* ── Vision Collage ──────────────────────── */
  .vb-collage-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 16px;
    min-height: 160px;
  }
  .vb-vision-card {
    position: relative;
    border-radius: 4px 4px 12px 12px;
    padding: 18px 14px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 10px;
    border: 1px solid var(--vb-border);
    min-height: 130px;
    aspect-ratio: 4 / 3;
    cursor: default;
    text-align: center;
    transition: box-shadow 0.25s, transform 0.2s;
  }
  .vb-vision-card::before {
    /* polaroid pin dot */
    content: '';
    position: absolute;
    top: 8px; left: 50%;
    transform: translateX(-50%);
    width: 8px; height: 8px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #fff8, var(--vb-terracotta) 65%);
    box-shadow: 0 1px 2px rgba(0,0,0,0.25);
    opacity: 0.9;
  }
  .vb-vision-card:hover { box-shadow: 0 6px 18px var(--vb-shadow); transform: translateY(-2px); }
  .vb-card-terracotta { background: rgba(193,96,58,0.13); border-color: rgba(193,96,58,0.28); }
  .vb-card-sage       { background: rgba(126,153,113,0.13); border-color: rgba(126,153,113,0.28); }
  .vb-card-taupe      { background: rgba(138,115,87,0.13); border-color: rgba(138,115,87,0.28); }
  .vb-card-ink        { background: rgba(53,40,29,0.07);   border-color: rgba(53,40,29,0.18);   }
  .vb-card-blush      { background: rgba(204,126,119,0.16); border-color: rgba(204,126,119,0.32); }
  .vb-card-add {
    background: transparent;
    border: 1.5px dashed var(--vb-border-strong);
    cursor: pointer;
    color: var(--vb-taupe);
    transition: all 0.2s;
  }
  .vb-card-add::before { display: none; }
  .vb-card-add:hover { border-color: var(--vb-terracotta); color: var(--vb-terracotta); background: rgba(193,96,58,0.06); }
  .vb-add-icon { opacity: 0.55; }
  .vb-card-emoji { font-size: 28px; line-height: 1; }
  .vb-card-title {
    font-family: 'Caveat', cursive;
    font-size: 16px;
    font-weight: 600;
    color: var(--vb-ink);
    line-height: 1.3;
  }
  .vb-card-delete {
    position: absolute; top: 6px; right: 6px;
    background: rgba(53,40,29,0.12);
    border: none; border-radius: 50%;
    width: 22px; height: 22px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    opacity: 0; transition: opacity 0.2s, background 0.2s;
    color: var(--vb-muted-ink);
  }
  .vb-vision-card:hover .vb-card-delete,
  .vb-card-delete:focus-visible { opacity: 1; }
  .vb-card-delete:hover { background: var(--vb-terracotta); color: #fff; }

  /* Templates */
  .vb-templates { margin-top: 12px; }
  .vb-templates-label {
    font-size: 12px;
    color: var(--vb-taupe);
    font-family: 'Lora', serif;
    margin-bottom: 8px;
  }
  .vb-templates-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .vb-template-chip {
    background: var(--vb-cream);
    border: 1px solid var(--vb-border);
    border-radius: 20px;
    padding: 4px 12px;
    font-family: 'Caveat', cursive;
    font-size: 15px;
    font-weight: 500;
    color: var(--vb-muted-ink);
    cursor: pointer;
    transition: all 0.2s;
  }
  .vb-template-chip:hover {
    background: var(--vb-linen);
    border-color: var(--vb-terracotta);
    color: var(--vb-terracotta);
  }

  /* ── Form overlay / modal ────────────────── */
  .vb-form-overlay {
    position: fixed; inset: 0;
    background: rgba(53,40,29,0.35);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 100;
    padding: 16px;
  }
  .vb-add-form {
    background: var(--vb-cream);
    border: 1px solid var(--vb-border);
    border-radius: 18px;
    padding: 28px;
    width: min(400px, 100%);
    box-shadow: 0 18px 52px rgba(53,40,29,0.24);
  }
  .vb-form-title {
    font-family: 'Playfair Display', serif;
    font-size: 21px;
    color: var(--vb-ink);
    margin: 0 0 16px;
  }
  .vb-form-input {
    width: 100%;
    background: var(--vb-parchment);
    border: 1px solid var(--vb-border);
    border-radius: 9px;
    padding: 9px 12px;
    font-family: 'Lora', serif;
    font-size: 14px;
    color: var(--vb-ink);
    outline: none;
    box-sizing: border-box;
    margin-bottom: 12px;
  }
  .vb-form-input:focus {
    border-color: var(--vb-terracotta);
    box-shadow: 0 0 0 3px rgba(193,96,58,0.14);
  }
  .vb-form-input-sm { flex: 1; }
  .vb-goals-form-row { display: flex; gap: 8px; }
  .vb-form-actions {
    display: flex; justify-content: flex-end; gap: 8px;
    margin-top: 4px;
  }

  /* Buttons */
  .vb-btn-primary {
    background: var(--vb-terracotta);
    color: white;
    border: none;
    border-radius: 9px;
    padding: 8px 17px;
    font-family: 'Lora', serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: flex; align-items: center; gap: 6px;
    transition: background 0.2s, transform 0.2s;
  }
  .vb-btn-primary:hover:not(:disabled) { background: var(--vb-terracotta-dark); transform: translateY(-1px); }
  .vb-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .vb-btn-primary.vb-btn-sm { padding: 5px 13px; font-size: 12px; }
  .vb-btn-ghost {
    background: transparent;
    color: var(--vb-taupe);
    border: 1px solid var(--vb-border);
    border-radius: 9px;
    padding: 8px 17px;
    font-family: 'Lora', serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .vb-btn-ghost:hover { border-color: var(--vb-taupe); color: var(--vb-ink); }

  /* Emoji grid */
  .vb-emoji-grid {
    display: flex; flex-wrap: wrap; gap: 6px;
    margin-bottom: 12px;
  }
  .vb-emoji-btn {
    background: var(--vb-parchment);
    border: 1.5px solid transparent;
    border-radius: 9px;
    width: 37px; height: 37px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .vb-emoji-btn:hover { background: var(--vb-linen); }
  .vb-emoji-selected { border-color: var(--vb-terracotta); background: rgba(193,96,58,0.12); }

  /* Color dots */
  .vb-color-row { display: flex; gap: 10px; margin-bottom: 16px; }
  .vb-color-dot {
    width: 25px; height: 25px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform 0.15s;
  }
  .vb-color-dot:hover { transform: scale(1.2); }
  .vb-dot-selected { border-color: var(--vb-ink); transform: scale(1.15); }
  .vb-dot-terracotta { background: var(--vb-terracotta); }
  .vb-dot-sage       { background: var(--vb-sage); }
  .vb-dot-taupe      { background: var(--vb-taupe); }
  .vb-dot-ink        { background: var(--vb-ink); }
  .vb-dot-blush      { background: var(--vb-blush); }

  /* ── Goals ─────────────────────────────────── */
  .vb-goals-form {
    overflow: hidden;
    background: var(--vb-linen);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    border: 1px solid var(--vb-border);
  }
  .vb-goals-list { display: flex; flex-direction: column; gap: 8px; }
  .vb-goal-row {
    display: flex; align-items: center; gap: 10px;
    background: var(--vb-cream);
    border: 1px solid var(--vb-border);
    border-radius: 10px;
    padding: 11px 13px;
    transition: background 0.2s, box-shadow 0.2s;
  }
  .vb-goal-row:hover { box-shadow: 0 2px 8px var(--vb-shadow); }
  .vb-goal-done { opacity: 0.6; }
  .vb-goal-check {
    width: 25px; height: 25px;
    border: 1.5px solid var(--vb-border-strong);
    border-radius: 7px;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    display: flex; align-items: center; justify-content: center;
    color: var(--vb-taupe);
    flex-shrink: 0;
    transition: all 0.2s;
    font-family: 'Lora', serif;
  }
  .vb-check-done     { background: var(--vb-sage); border-color: var(--vb-sage); color: white; }
  .vb-check-progress { background: rgba(193,96,58,0.16); border-color: var(--vb-terracotta); color: var(--vb-terracotta); }
  .vb-goal-body { flex: 1; min-width: 0; }
  .vb-goal-title {
    font-family: 'Lora', serif;
    font-weight: 500;
    font-size: 14px;
    color: var(--vb-ink);
    display: block;
    margin-bottom: 4px;
  }
  .vb-goal-done .vb-goal-title { text-decoration: line-through; }
  .vb-goal-status {
    font-family: 'Caveat', cursive;
    font-size: 14px;
    color: var(--vb-taupe);
  }
  .vb-goal-progress-wrap {
    display: flex; align-items: center; gap: 8px;
  }
  .vb-goal-progress-track {
    flex: 1; height: 5px;
    background: var(--vb-aged);
    border-radius: 4px; overflow: hidden;
  }
  .vb-goal-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--vb-terracotta), #DE8A5D);
    border-radius: 4px;
  }
  .vb-goal-pct { font-size: 12px; color: var(--vb-taupe); white-space: nowrap; font-family: 'JetBrains Mono', monospace; }
  .vb-goal-bump {
    background: rgba(193,96,58,0.12);
    border: 1px solid rgba(193,96,58,0.3);
    border-radius: 7px;
    padding: 2px 7px;
    font-size: 11px;
    color: var(--vb-terracotta-dark);
    cursor: pointer;
    font-family: 'Lora', serif;
    font-weight: 700;
    transition: all 0.15s;
  }
  .vb-goal-bump:hover { background: var(--vb-terracotta); color: white; }
  .vb-goal-del {
    background: none; border: none;
    color: var(--vb-taupe); opacity: 0;
    cursor: pointer; padding: 4px;
    transition: opacity 0.2s, color 0.2s;
    display: flex; align-items: center;
    border-radius: 6px;
  }
  .vb-goal-row:hover .vb-goal-del,
  .vb-goal-del:focus-visible { opacity: 0.7; }
  .vb-goal-del:hover { opacity: 1 !important; color: #B23A2C; }

  /* ── Life Areas ───────────────────────────── */
  .vb-areas-list { display: flex; flex-direction: column; gap: 13px; }
  .vb-area-row {
    display: flex; align-items: center; gap: 10px;
  }
  .vb-area-icon { font-size: 18px; flex-shrink: 0; }
  .vb-area-label {
    width: 110px; flex-shrink: 0;
    font-family: 'Lora', serif;
    font-size: 13px; font-weight: 500; color: var(--vb-muted-ink);
  }
  .vb-bar-track {
    flex: 1; height: 9px;
    background: var(--vb-aged);
    border-radius: 6px; overflow: hidden;
    cursor: pointer;
    transition: height 0.2s;
  }
  .vb-bar-track:hover, .vb-bar-track:focus-visible { height: 11px; }
  .vb-bar-fill {
    height: 100%;
    border-radius: 6px;
    transition: background-color 0.3s;
  }
  .vb-area-score {
    width: 40px; text-align: right;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px; font-weight: 600;
    color: var(--vb-terracotta);
  }
  .vb-area-hint {
    font-size: 11.5px;
    color: var(--vb-taupe);
    text-align: center;
    margin-top: 12px;
    font-family: 'Lora', serif;
    font-style: italic;
  }

  /* ── Habit Garden ─────────────────────────── */
  .vb-habit-header-row,
  .vb-habit-row {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 7px;
  }
  .vb-habit-name-col {
    display: flex; align-items: center; gap: 6px;
    width: 160px; flex-shrink: 0;
    overflow: hidden;
  }
  .vb-habit-icon { font-size: 16px; flex-shrink: 0; }
  .vb-habit-name {
    font-family: 'Caveat', cursive;
    font-size: 16px;
    font-weight: 600;
    color: var(--vb-ink);
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .vb-dot-col {
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .vb-day-label {
    font-size: 11px;
    color: var(--vb-taupe);
    font-family: 'JetBrains Mono', monospace;
  }
  .vb-today-label { color: var(--vb-terracotta); font-weight: 700; }
  .vb-habit-dot {
    background: none; border: none;
    cursor: pointer;
    font-size: 16px;
    border-radius: 50%;
    transition: transform 0.15s;
    color: var(--vb-aged);
  }
  .vb-habit-dot:hover { transform: scale(1.25); }
  .vb-dot-done    { color: var(--vb-sage); }
  .vb-dot-partial { color: var(--vb-terracotta); }
  .vb-dot-missed  { color: var(--vb-taupe); }
  .vb-dot-empty   { color: var(--vb-aged); opacity: 0.55; }
  .vb-dot-future  { color: var(--vb-aged); opacity: 0.3; cursor: default !important; }

  /* ── Two-column layout ─────────────────────── */
  .vb-two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 18px;
  }
  @media (max-width: 600px) {
    .vb-two-col { grid-template-columns: 1fr; }
  }

  /* ── Quick Notes ──────────────────────────── */
  .vb-notes-area {
    width: 100%;
    min-height: 140px;
    background: var(--vb-cream);
    border: 1px solid var(--vb-border);
    border-radius: 10px;
    padding: 13px;
    font-family: 'Caveat', cursive;
    font-size: 17px;
    color: var(--vb-ink);
    resize: none;
    outline: none;
    line-height: 1.7;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .vb-notes-area:focus { border-color: var(--vb-terracotta); box-shadow: 0 0 0 3px rgba(193,96,58,0.12); }
  .vb-save-indicator {
    font-size: 12px;
    color: var(--vb-sage);
    font-family: 'Lora', serif;
    font-style: italic;
  }

  /* ── Calendar Heatmap ─────────────────────── */
  .vb-heatmap-grid { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
  .vb-heatmap-row  { display: flex; gap: 8px; }
  .vb-heat-day-label {
    width: 24px; text-align: center;
    font-size: 11px;
    color: var(--vb-taupe);
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
  }
  .vb-heat-cell {
    width: 24px; text-align: center;
    font-size: 16px;
    cursor: default;
    border-radius: 5px;
    transition: transform 0.15s;
  }
  .vb-heat-full    { color: var(--vb-sage); }
  .vb-heat-partial { color: var(--vb-terracotta); }
  .vb-heat-missed  { color: var(--vb-taupe); }
  .vb-heat-empty   { color: var(--vb-aged); opacity: 0.35; }
  .vb-heat-future  { color: var(--vb-aged); opacity: 0.2; }
  .vb-heat-today   {
    background: rgba(193,96,58,0.14);
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgba(193,96,58,0.35) inset;
  }
  .vb-heatmap-legend {
    font-size: 12px;
    color: var(--vb-taupe);
    font-family: 'Lora', serif;
    font-style: italic;
    text-align: center;
  }

  /* ── Reflection ────────────────────────────── */
  .vb-reflection-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
  }
  .vb-reflection-card {
    background: var(--vb-cream);
    border: 1px solid var(--vb-border);
    border-radius: 12px;
    padding: 15px;
    transition: box-shadow 0.2s;
  }
  .vb-reflection-card:hover { box-shadow: 0 3px 12px var(--vb-shadow); }
  .vb-reflection-editing { border-color: var(--vb-terracotta); }
  .vb-reflection-header {
    display: flex; align-items: center; gap: 6px;
    margin-bottom: 8px;
  }
  .vb-refl-icon { font-size: 16px; }
  .vb-refl-label {
    flex: 1;
    font-family: 'Lora', serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--vb-ink);
  }
  .vb-refl-edit {
    display: flex; align-items: center; gap: 3px;
    background: none; border: none;
    color: var(--vb-taupe);
    cursor: pointer;
    font-size: 11px;
    font-family: 'Lora', serif;
    transition: color 0.2s;
    border-radius: 6px;
  }
  .vb-refl-edit:hover { color: var(--vb-terracotta); }
  .vb-refl-text {
    font-family: 'Caveat', cursive;
    font-size: 16px;
    color: var(--vb-ink);
    line-height: 1.5;
    cursor: pointer;
    margin: 0;
    display: flex; align-items: center; gap: 4px;
  }
  .vb-refl-empty { color: var(--vb-taupe); font-style: italic; }
  .vb-refl-textarea {
    width: 100%;
    background: var(--vb-parchment);
    border: 1px solid var(--vb-border);
    border-radius: 8px;
    padding: 9px;
    font-family: 'Caveat', cursive;
    font-size: 16px;
    color: var(--vb-ink);
    resize: none;
    outline: none;
    box-sizing: border-box;
    margin-bottom: 8px;
    line-height: 1.5;
  }
  .vb-refl-textarea:focus { border-color: var(--vb-terracotta); }

  /* ── Year Journey ──────────────────────────── */
  .vb-journey-strip {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 8px;
    scrollbar-width: thin;
    scrollbar-color: var(--vb-aged) transparent;
  }
  .vb-journey-month {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    background: var(--vb-cream);
    border: 1px solid var(--vb-border);
    border-radius: 12px;
    padding: 11px 9px;
    min-width: 70px;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .vb-journey-month:hover { box-shadow: 0 3px 10px var(--vb-shadow); }
  .vb-journey-active {
    border-color: var(--vb-terracotta);
    background: rgba(193,96,58,0.1) !important;
  }
  .vb-journey-current {
    border-color: var(--vb-terracotta);
    box-shadow: 0 0 0 2px rgba(193,96,58,0.22);
  }
  .vb-journey-future { opacity: 0.5; }
  .vb-journey-label {
    font-family: 'Lora', serif;
    font-size: 12px;
    font-weight: 700;
    color: var(--vb-muted-ink);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .vb-journey-active .vb-journey-label { color: var(--vb-terracotta); }
  .vb-journey-dots {
    display: flex; gap: 2px; align-items: center;
    font-size: 12px;
    min-height: 16px;
  }
  .vb-journey-star { font-size: 16px; }
  .vb-journey-bar {
    width: 100%; height: 4px;
    background: var(--vb-aged);
    border-radius: 4px;
    overflow: hidden;
  }
  .vb-journey-bar-fill {
    height: 100%;
    background: var(--vb-terracotta);
    border-radius: 4px;
  }

  /* ── Weather Strip ─────────────────────────────── */
  .vb-weather-strip {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--vb-parchment);
    border: 1px solid var(--vb-border);
    border-radius: 14px;
    padding: 13px 20px;
    margin-bottom: 18px;
    font-family: 'Caveat', cursive;
    font-size: 17px;
    color: var(--vb-ink);
    box-shadow: 0 3px 14px var(--vb-shadow);
    flex-wrap: wrap;
    position: relative;
    overflow: hidden;
  }
  .vb-weather-seg {
    display: flex; align-items: center; gap: 8px;
    flex-wrap: wrap;
  }
  .vb-weather-real {
    display: flex; align-items: center; gap: 6px;
    color: var(--vb-ink);
  }
  .vb-weather-icon { font-size: 18px; }
  .vb-weather-city {
    display: flex; align-items: center; gap: 2px;
    font-size: 13px; color: var(--vb-taupe);
  }
  .vb-weather-temp { font-weight: 700; color: var(--vb-terracotta); font-size: 17px; font-family: 'JetBrains Mono', monospace; }
  .vb-weather-desc { font-size: 14px; color: var(--vb-muted-ink); }
  .vb-weather-empty {
    display: flex; align-items: center; gap: 6px;
    color: var(--vb-taupe); font-style: italic; font-size: 14px;
  }
  .vb-weather-fetch-btn {
    display: flex; align-items: center; gap: 5px;
    background: rgba(193,96,58,0.12);
    border: 1px solid rgba(193,96,58,0.32);
    border-radius: 20px;
    padding: 5px 13px;
    font-family: 'Lora', serif;
    font-size: 12px;
    font-weight: 600;
    color: var(--vb-terracotta-dark);
    cursor: pointer;
    transition: all 0.2s;
  }
  .vb-weather-fetch-btn:hover:not(:disabled) {
    background: var(--vb-terracotta); color: white;
  }
  .vb-weather-fetch-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .vb-weather-sep { color: var(--vb-aged); font-size: 18px; }
  .vb-mood-display {
    display: flex; align-items: center; gap: 5px;
    background: none; border: none;
    font-family: 'Caveat', cursive; font-size: 17px; font-weight: 600;
    color: var(--vb-muted-ink); cursor: pointer;
    padding: 0; transition: color 0.2s;
  }
  .vb-mood-display:hover { color: var(--vb-terracotta); }
  .vb-mood-strip-input {
    width: 180px !important;
    padding: 4px 10px !important;
    font-size: 15px !important;
    background: var(--vb-linen) !important;
    color: var(--vb-ink) !important;
    border: 1px solid var(--vb-border) !important;
    border-radius: 8px !important;
  }
  .vb-mood-prefix { font-size: 16px; }
  .vb-spin { animation: vb-rotate 1s linear infinite; }
  @keyframes vb-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  /* ── Reduced motion: strip decorative motion, keep affordances ────── */
  @media (prefers-reduced-motion: reduce) {
    .vb-spin { animation: none; }
    .vb-nav-btn:hover,
    .vb-color-dot:hover,
    .vb-vision-card:hover,
    .vb-habit-dot:hover { transform: none; }
  }
`;