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
  FullBoardData,
  VisionGoal,
  VisionCard,
  LifeArea,
  HabitLog,
  BoardNotes,
  BoardMonth,
  WeatherData,
} from "@/api/visionboard";

import { GlobalHeader } from "@/components/GlobalHeader";
import { BoardHeader } from "@/components/visionboard/BoardHeader";
import { WeatherStrip } from "@/components/visionboard/WeatherStrip";
import { VisionCollage } from "@/components/visionboard/VisionCollage";
import { ThemeSidebar } from "@/components/visionboard/ThemeSidebar";
import { FocusToday } from "@/components/visionboard/FocusToday";
import { MonthGoals } from "@/components/visionboard/MonthGoals";
import { LifeAreas } from "@/components/visionboard/LifeAreas";
import { HabitGarden } from "@/components/visionboard/HabitGarden";
import { QuickNotes } from "@/components/visionboard/QuickNotes";
import { CalendarHeatmap } from "@/components/visionboard/CalendarHeatmap";
import { MonthReflection } from "@/components/visionboard/MonthReflection";
import { YearJourney } from "@/components/visionboard/YearJourney";
import { VisionBoardAI } from "@/components/visionboard/VisionBoardAI";


// ── Helpers ───────────────────────────────────────────────────────────────────

function currentYearMonth() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
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

  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const isCurrentMonth = year === now.year && month === now.month;

  const boardKey = ["visionboard", year, month];
  const yearKey = ["visionboard-year", year];

  // ── Queries ─────────────────────────────────────────────────────────────────

  const { data: boardRes, isLoading } = useQuery({
    queryKey: boardKey,
    queryFn: () => visionBoardApi.getBoardData(year, month),
    staleTime: 2 * 60 * 1000,
  });

  const { data: yearRes } = useQuery({
    queryKey: yearKey,
    queryFn: () => visionBoardApi.getYearSummary(year),
    staleTime: 5 * 60 * 1000,
  });

  const { data: weatherRes } = useQuery({
    queryKey: ["visionboard-weather", year, month],
    queryFn: () => visionBoardApi.getWeather(year, month),
    staleTime: 30 * 60 * 1000, // 30 min — weather rarely needs instant refresh
  });

  const board = boardRes?.data;
  const yearSummary = yearRes?.data ?? [];
  const cachedWeather = weatherRes?.data ?? null;

  // ── Month navigation ────────────────────────────────────────────────────────

  function navigate(direction: -1 | 1) {
    let m = month + direction;
    let y = year;
    if (m < 1) {
      m = 12;
      y--;
    }
    if (m > 12) {
      m = 1;
      y++;
    }
    setMonth(m);
    setYear(y);
  }

  function goToMonth(m: number) {
    setMonth(m);
  }

  // ── Mutations ───────────────────────────────────────────────────────────────

  function invalidateBoard() {
    qc.invalidateQueries({ queryKey: boardKey });
    qc.invalidateQueries({ queryKey: yearKey });
  }

  function onError(ctx: string, err: any) {
    toast({
      title: "Something went wrong",
      description: err?.message,
      variant: "destructive",
    });
  }

  // Board metadata
  const updateMeta = useMutation({
    mutationFn: (
      updates: Partial<
        Pick<BoardMonth, "quote" | "mood_tag" | "theme_words" | "focus_items">
      >,
    ) => visionBoardApi.updateBoardMonth(year, month, updates),
    onMutate: async (updates) => {
      await qc.cancelQueries({ queryKey: boardKey });
      const previousBoard = qc.getQueryData<{
        success: boolean;
        data: FullBoardData;
      }>(boardKey);
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
      if (context?.previousBoard)
        qc.setQueryData(boardKey, context.previousBoard);
      onError("updateMeta", err);
    },
    onSettled: invalidateBoard,
  });

  // Goals
  const addGoal = useMutation({
    mutationFn: (payload: {
      title: string;
      progressTarget: number;
      progressUnit: string;
    }) => visionBoardApi.addGoal(year, month, payload),
    onSuccess: invalidateBoard,
    onError: (e) => onError("addGoal", e),
  });

  const updateGoal = useMutation({
    mutationFn: ({ goalId, updates }: { goalId: string; updates: any }) =>
      visionBoardApi.updateGoal(year, month, goalId, updates),
    onMutate: async ({ goalId, updates }) => {
      await qc.cancelQueries({ queryKey: boardKey });
      const previousBoard = qc.getQueryData<{
        success: boolean;
        data: FullBoardData;
      }>(boardKey);
      if (previousBoard?.data) {
        qc.setQueryData(boardKey, {
          ...previousBoard,
          data: {
            ...previousBoard.data,
            goals: previousBoard.data.goals.map((g) =>
              g.id === goalId ? { ...g, ...updates } : g,
            ),
          },
        });
      }
      return { previousBoard };
    },
    onError: (err, _vars, context) => {
      if (context?.previousBoard)
        qc.setQueryData(boardKey, context.previousBoard);
      onError("updateGoal", err);
    },
    onSettled: invalidateBoard,
  });

  const deleteGoal = useMutation({
    mutationFn: (goalId: string) =>
      visionBoardApi.deleteGoal(year, month, goalId),
    onMutate: async (goalId) => {
      await qc.cancelQueries({ queryKey: boardKey });
      const previousBoard = qc.getQueryData<{
        success: boolean;
        data: FullBoardData;
      }>(boardKey);
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
      if (context?.previousBoard)
        qc.setQueryData(boardKey, context.previousBoard);
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
      const previousBoard = qc.getQueryData<{
        success: boolean;
        data: FullBoardData;
      }>(boardKey);
      if (previousBoard?.data) {
        const areaMap = new Map(areas.map((a) => [a.area, a.score]));
        qc.setQueryData(boardKey, {
          ...previousBoard,
          data: {
            ...previousBoard.data,
            lifeAreas: previousBoard.data.lifeAreas.map((la) =>
              areaMap.has(la.area)
                ? { ...la, score: areaMap.get(la.area)! }
                : la,
            ),
          },
        });
      }
      return { previousBoard };
    },
    onError: (err, _vars, context) => {
      if (context?.previousBoard)
        qc.setQueryData(boardKey, context.previousBoard);
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
    mutationFn: (habitId: string) =>
      visionBoardApi.deleteHabit(year, month, habitId),
    onMutate: async (habitId) => {
      await qc.cancelQueries({ queryKey: boardKey });
      const previousBoard = qc.getQueryData<{
        success: boolean;
        data: FullBoardData;
      }>(boardKey);
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
      if (context?.previousBoard)
        qc.setQueryData(boardKey, context.previousBoard);
      onError("deleteHabit", err);
    },
    onSettled: invalidateBoard,
  });

  const logHabit = useMutation({
    mutationFn: ({
      habitId,
      payload,
    }: {
      habitId: string;
      payload: { logDate: string; status: HabitLog["status"] };
    }) => visionBoardApi.logHabit(year, month, habitId, payload),
    onMutate: async ({ habitId, payload }) => {
      await qc.cancelQueries({ queryKey: boardKey });
      const previousBoard = qc.getQueryData<{
        success: boolean;
        data: FullBoardData;
      }>(boardKey);
      if (previousBoard?.data) {
        qc.setQueryData(boardKey, {
          ...previousBoard,
          data: {
            ...previousBoard.data,
            habits: previousBoard.data.habits.map((h) => {
              if (h.id !== habitId) return h;
              const filteredLogs = h.logs.filter(
                (l) => l.log_date !== payload.logDate,
              );
              return {
                ...h,
                logs: [
                  ...filteredLogs,
                  {
                    id: "temp",
                    habit_id: habitId,
                    user_id: "",
                    log_date: payload.logDate,
                    status: payload.status,
                  },
                ],
              };
            }),
          },
        });
      }
      return { previousBoard };
    },
    onError: (err, _vars, context) => {
      if (context?.previousBoard)
        qc.setQueryData(boardKey, context.previousBoard);
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
      const previousBoard = qc.getQueryData<{
        success: boolean;
        data: FullBoardData;
      }>(boardKey);
      if (previousBoard?.data) {
        const currentNotes = previousBoard.data.notes || {
          id: "temp",
          user_id: "",
          year,
          month,
          quick_notes: null,
          win: null,
          challenge: null,
          gratitude: null,
          improve: null,
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
      if (context?.previousBoard)
        qc.setQueryData(boardKey, context.previousBoard);
      onError("upsertNotes", err);
    },
    onSettled: invalidateBoard,
  });

  // Vision cards
  const addCard = useMutation({
    mutationFn: (payload: {
      title: string;
      emoji: string;
      colorAccent: VisionCard["color_accent"];
      cardType: VisionCard["card_type"];
    }) => visionBoardApi.addVisionCard(year, month, payload),
    onSuccess: invalidateBoard,
    onError: (e) => onError("addCard", e),
  });

  const deleteCard = useMutation({
    mutationFn: (cardId: string) =>
      visionBoardApi.deleteVisionCard(year, month, cardId),
    onMutate: async (cardId) => {
      await qc.cancelQueries({ queryKey: boardKey });
      const previousBoard = qc.getQueryData<{
        success: boolean;
        data: FullBoardData;
      }>(boardKey);
      if (previousBoard?.data) {
        qc.setQueryData(boardKey, {
          ...previousBoard,
          data: {
            ...previousBoard.data,
            visionCards: previousBoard.data.visionCards.filter(
              (c) => c.id !== cardId,
            ),
          },
        });
      }
      return { previousBoard };
    },
    onError: (err, _vars, context) => {
      if (context?.previousBoard)
        qc.setQueryData(boardKey, context.previousBoard);
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
      const previousWeather = qc.getQueryData<{
        success: boolean;
        data: WeatherData | null;
      }>(weatherKey);
      if (previousWeather) {
        qc.setQueryData(weatherKey, {
          ...previousWeather,
          data: previousWeather.data
            ? { ...previousWeather.data, ...payload }
            : (payload as WeatherData),
        });
      }
      return { previousWeather };
    },
    onError: (err, _vars, context) => {
      if (context?.previousWeather)
        qc.setQueryData(
          ["visionboard-weather", year, month],
          context.previousWeather,
        );
      onError("upsertWeather", err);
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ["visionboard-weather", year, month] }),
  });

  // ── Derived "at a glance" stats (client-side only, from data already fetched) ──

  const glance = useMemo(() => {
    if (!board) return null;
    const totalGoals = board.goals.length;
    const totalHabits = board.habits.length;
    const totalAreas = board.lifeAreas.length;
    const totalCards = board.visionCards.length;

    const checkIns = board.habits.reduce(
      (sum, h) => sum + h.logs.filter((l) => l.status === "done").length,
      0,
    );

    const avgAreaScore = totalAreas
      ? Math.round(
          (board.lifeAreas.reduce((sum, la) => sum + (la.score ?? 0), 0) /
            totalAreas) *
            10,
        ) / 10
      : null;

    // Longest current streak of consecutive "done" days across all habits (simple, safe heuristic)
    let bestStreak = 0;
    for (const h of board.habits) {
      const doneDates = new Set(
        h.logs.filter((l) => l.status === "done").map((l) => l.log_date),
      );
      let streak = 0;
      let cursor = new Date();
      while (doneDates.has(cursor.toISOString().slice(0, 10))) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
      bestStreak = Math.max(bestStreak, streak);
    }

    return {
      totalGoals,
      totalHabits,
      totalAreas,
      totalCards,
      checkIns,
      avgAreaScore,
      bestStreak,
    };
  }, [board]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col"
      data-reduced-motion={prefersReducedMotion ? "true" : "false"}
    >
      <a href="#vb-main-content" className="vb-skip-link">
        Skip to your board
      </a>
      <GlobalHeader />
      <main
        id="vb-main-content"
        className="flex-1 w-full max-w-[1280px] mx-auto px-5 sm:px-8 py-8"
      >
        <div className="vb-page">
          {/* Google Fonts */}
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap"
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
                  transition={
                    prefersReducedMotion
                      ? {}
                      : { duration: 2.2, repeat: Infinity, ease: "linear" }
                  }
                  className="vb-spinner"
                  aria-hidden="true"
                >
                  ✦
                </motion.div>
                <p>Preparing your board…</p>
              </div>
            </div>
          )}

          {/* ── Board ── */}
          <AnimatePresence mode="wait">
            {board && (
              <motion.div
                key={`${year}-${month}`}
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -16 }}
                transition={{
                  duration: prefersReducedMotion ? 0.01 : 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {/* 1. Header */}
                <BoardHeader
                  boardMonth={board.month}
                  onPrev={() => navigate(-1)}
                  onNext={() => navigate(1)}
                  onUpdate={(u) => updateMeta.mutateAsync(u)}
                  isCurrentMonth={isCurrentMonth}
                />

                {/* 1a. AI Copilot */}
                <VisionBoardAI
                  year={year}
                  month={month}
                  onRefreshBoard={invalidateBoard}
                />


                {/* 1a. Month at a glance */}
                {glance && (
                  <section
                    className="vb-glance-strip"
                    aria-label={`${MONTH_NAMES[month - 1]} ${year} at a glance`}
                  >
                    <div className="vb-glance-item">
                      <span className="vb-glance-icon" aria-hidden="true">
                        🎯
                      </span>
                      <span className="vb-glance-num">{glance.totalGoals}</span>
                      <span className="vb-glance-label">
                        goal{glance.totalGoals === 1 ? "" : "s"}
                      </span>
                    </div>
                    <span className="vb-glance-sep" aria-hidden="true">
                      ·
                    </span>
                    <div className="vb-glance-item">
                      <span className="vb-glance-icon" aria-hidden="true">
                        🌱
                      </span>
                      <span className="vb-glance-num">{glance.checkIns}</span>
                      <span className="vb-glance-label">
                        check-in{glance.checkIns === 1 ? "" : "s"}
                      </span>
                    </div>
                    {glance.bestStreak > 0 && (
                      <>
                        <span className="vb-glance-sep" aria-hidden="true">
                          ·
                        </span>
                        <div className="vb-glance-item">
                          <span className="vb-glance-icon" aria-hidden="true">
                            🔥
                          </span>
                          <span className="vb-glance-num">
                            {glance.bestStreak}
                          </span>
                          <span className="vb-glance-label">day streak</span>
                        </div>
                      </>
                    )}
                    {glance.avgAreaScore !== null && (
                      <>
                        <span className="vb-glance-sep" aria-hidden="true">
                          ·
                        </span>
                        <div className="vb-glance-item">
                          <span className="vb-glance-icon" aria-hidden="true">
                            💫
                          </span>
                          <span className="vb-glance-num">
                            {glance.avgAreaScore}
                          </span>
                          <span className="vb-glance-label">avg. balance</span>
                        </div>
                      </>
                    )}
                    <span className="vb-glance-sep" aria-hidden="true">
                      ·
                    </span>
                    <div className="vb-glance-item">
                      <span className="vb-glance-icon" aria-hidden="true">
                        📌
                      </span>
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

                {/* 2. Bento: Theme + Focus | Collage */}
                <div className="vb-three-col">
                  <div className="vb-sidebar-stack">
                    <ThemeSidebar
                      themeWords={board.month.theme_words}
                      focusItems={board.month.focus_items}
                      onUpdate={(u) => updateMeta.mutateAsync(u)}
                    />
                    <FocusToday
                      focusItems={board.month.focus_items}
                      month={month}
                      year={year}
                      onUpdate={(u) => updateMeta.mutateAsync(u)}
                    />
                  </div>
                  <VisionCollage
                    cards={board.visionCards}
                    onAdd={(p) => addCard.mutateAsync(p)}
                    onDelete={(id) => deleteCard.mutateAsync(id)}
                    onUpload={(cardId, file) =>
                      uploadCardFile.mutateAsync({ cardId, file })
                    }
                  />
                </div>

                {/* 3. Month Goals */}
                <MonthGoals
                  goals={board.goals}
                  onAdd={(p) => addGoal.mutateAsync(p)}
                  onUpdate={(goalId, updates) =>
                    updateGoal.mutateAsync({ goalId, updates })
                  }
                  onDelete={(goalId) => deleteGoal.mutateAsync(goalId)}
                />

                {/* 4. Life Areas + Habit Garden */}
                <div className="vb-two-col">
                  {board.lifeAreas.length > 0 && (
                    <LifeAreas
                      areas={board.lifeAreas}
                      onUpdate={(areas) => upsertAreas.mutateAsync(areas)}
                    />
                  )}
                  <HabitGarden
                    habits={board.habits}
                    year={year}
                    month={month}
                    onAddHabit={(p) => addHabit.mutateAsync(p)}
                    onDeleteHabit={(id) => deleteHabit.mutateAsync(id)}
                    onLogHabit={(habitId, p) =>
                      logHabit.mutateAsync({ habitId, payload: p })
                    }
                  />
                </div>

                {/* 5. Calendar Heatmap */}
                <CalendarHeatmap
                  habits={board.habits}
                  year={year}
                  month={month}
                />

                {/* 6. Notes + Reflection */}
                <div className="vb-two-col">
                  <QuickNotes
                    notes={board.notes}
                    onSave={(u) => upsertNotes.mutateAsync(u)}
                  />
                  <MonthReflection
                    notes={board.notes}
                    onSave={(u) => upsertNotes.mutateAsync(u)}
                  />
                </div>

                {/* 7. Year Journey */}
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
// Glass Journal design system — clean editorial aesthetic, frosted glass cards,
// Inter + Source Serif 4 typography, muted stone/amber palette.
// All vb-* classes are restyled here; child components need zero changes.

const BOARD_STYLES = `
  /* ══════════════════════════════════════════════════════════════════════
     DESIGN TOKENS — LIGHT MODE
     ══════════════════════════════════════════════════════════════════════ */
  .vb-page {
    /* Surfaces */
    --vb-parchment:   #FFFFFF;
    --vb-linen:       #F5F5F3;
    --vb-aged:        #E5E5E0;
    --vb-cream:       #FAFAF8;

    /* Cork aliases (for backward compat, map to new palette) */
    --vb-cork:        #D4D4CD;
    --vb-cork-dark:   #A3A39C;

    /* Text */
    --vb-ink:         #1A1A1A;
    --vb-muted-ink:   #525252;
    --vb-taupe:       #737373;

    /* Signature accent — warm amber */
    --vb-terracotta:  #D97706;
    --vb-terracotta-dark: #B45309;

    /* Accent family */
    --vb-sage:        #059669;
    --vb-blush:       #E11D48;
    --vb-mustard:     #CA8A04;
    --vb-slate:       #0284C7;

    /* Borders & shadows */
    --vb-border:      rgba(0,0,0,0.08);
    --vb-border-strong: rgba(0,0,0,0.15);
    --vb-shadow:      rgba(0,0,0,0.04);
    --vb-focus-ring:  #D97706;

    /* Glass */
    --vb-glass-bg:    rgba(255,255,255,0.72);
    --vb-glass-blur:  12px;

    /* Typography */
    font-family: 'Source Serif 4', Georgia, serif;
    color: var(--vb-ink);
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 0 64px;
    position: relative;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* ══════════════════════════════════════════════════════════════════════
     DARK MODE
     ══════════════════════════════════════════════════════════════════════ */
  .dark .vb-page,
  :root[class~="dark"] .vb-page {
    --vb-parchment:   #18181B;
    --vb-linen:       #1E1E22;
    --vb-aged:        #2A2A2E;
    --vb-cream:       #111113;
    --vb-cork:        #3F3F46;
    --vb-cork-dark:   #27272A;
    --vb-ink:         #FAFAFA;
    --vb-muted-ink:   #A1A1AA;
    --vb-taupe:       #71717A;
    --vb-terracotta:  #FBBF24;
    --vb-terracotta-dark: #F59E0B;
    --vb-sage:        #34D399;
    --vb-blush:       #FB7185;
    --vb-mustard:     #FACC15;
    --vb-slate:       #38BDF8;
    --vb-border:      rgba(255,255,255,0.08);
    --vb-border-strong: rgba(255,255,255,0.15);
    --vb-shadow:      rgba(0,0,0,0.4);
    --vb-focus-ring:  #FBBF24;
    --vb-glass-bg:    rgba(24,24,27,0.72);
    --vb-glass-blur:  12px;
  }

  /* ══════════════════════════════════════════════════════════════════════
     ACCESSIBILITY
     ══════════════════════════════════════════════════════════════════════ */
  .vb-page *:focus-visible {
    outline: 2px solid var(--vb-focus-ring);
    outline-offset: 2px;
    border-radius: 6px;
  }
  .vb-skip-link {
    position: fixed; top: -48px; left: 12px; z-index: 1000;
    background: var(--vb-terracotta);
    color: #fff; padding: 10px 18px; border-radius: 10px;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 13px; font-weight: 600;
    text-decoration: none; transition: top 0.2s ease;
    box-shadow: 0 4px 14px rgba(0,0,0,0.2);
  }
  .vb-skip-link:focus { top: 12px; }
  [data-reduced-motion="true"] * {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }

  /* ══════════════════════════════════════════════════════════════════════
     LOADING
     ══════════════════════════════════════════════════════════════════════ */
  .vb-loading {
    display: flex; align-items: center; justify-content: center;
    min-height: 400px;
  }
  .vb-loading-card {
    display: flex; flex-direction: column; align-items: center; gap: 14px;
    background: var(--vb-glass-bg);
    backdrop-filter: blur(var(--vb-glass-blur));
    -webkit-backdrop-filter: blur(var(--vb-glass-blur));
    border: 1px solid var(--vb-border);
    border-radius: 20px; padding: 40px 48px;
    box-shadow: 0 8px 32px var(--vb-shadow);
    color: var(--vb-taupe);
    font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 500;
    letter-spacing: -0.01em;
  }
  .vb-spinner {
    font-size: 28px; color: var(--vb-terracotta);
  }

  /* ══════════════════════════════════════════════════════════════════════
     SECTION CARD — frosted glass container
     ══════════════════════════════════════════════════════════════════════ */
  .vb-section {
    background: var(--vb-glass-bg);
    backdrop-filter: blur(var(--vb-glass-blur));
    -webkit-backdrop-filter: blur(var(--vb-glass-blur));
    border: 1px solid var(--vb-border);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 16px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 1px 3px var(--vb-shadow), 0 4px 16px var(--vb-shadow);
    transition: box-shadow 0.3s ease, transform 0.3s ease;
  }
  .vb-section:hover {
    box-shadow: 0 2px 6px var(--vb-shadow), 0 8px 24px var(--vb-shadow);
  }
  .vb-section::before {
    /* Subtle top accent line */
    content: '';
    position: absolute; top: 0; left: 24px; right: 24px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--vb-border-strong), transparent);
    pointer-events: none;
  }
  .vb-section::after { display: none; /* Remove washi-tape */ }

  /* ══════════════════════════════════════════════════════════════════════
     SECTION LABEL — clean uppercase tracking
     ══════════════════════════════════════════════════════════════════════ */
  .vb-section-label {
    display: flex; align-items: center; gap: 8px;
    font-family: 'Inter', sans-serif;
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--vb-taupe);
    margin-bottom: 18px;
  }
  .vb-section-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 18px;
  }

  /* ══════════════════════════════════════════════════════════════════════
     HEADER CARD
     ══════════════════════════════════════════════════════════════════════ */
  .vb-header-card {
    background: var(--vb-glass-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--vb-border);
    border-radius: 20px;
    padding: 36px 28px 32px;
    margin-bottom: 16px;
    position: relative; overflow: hidden;
    box-shadow: 0 4px 24px var(--vb-shadow);
    text-align: center;
  }
  .vb-header-card::before { display: none; /* Remove washi tape */ }
  .vb-grain-overlay { display: none; /* Remove grain texture */ }
  .vb-header-inner {
    display: flex; align-items: center; gap: 20px;
    position: relative;
  }
  .vb-header-center { flex: 1; }

  /* Nav buttons — pill shape */
  .vb-nav-btn {
    background: var(--vb-linen);
    border: 1px solid var(--vb-border);
    border-radius: 12px;
    width: 40px; height: 40px;
    display: flex; align-items: center; justify-content: center;
    color: var(--vb-muted-ink);
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }
  .vb-nav-btn:hover {
    background: var(--vb-terracotta);
    color: white; border-color: var(--vb-terracotta);
    transform: scale(1.05);
    box-shadow: 0 2px 8px color-mix(in srgb, var(--vb-terracotta) 30%, transparent);
  }

  /* Month title — editorial serif */
  .vb-month-title {
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: clamp(26px, 4vw, 38px);
    font-weight: 700; color: var(--vb-ink);
    letter-spacing: -0.02em;
    display: flex; align-items: center; justify-content: center;
    gap: 12px; margin-bottom: 10px;
  }
  .vb-ornament {
    color: var(--vb-terracotta);
    font-size: 0.5em; opacity: 0.6;
  }

  /* Quote */
  .vb-quote-row { margin-bottom: 12px; }
  .vb-quote {
    font-family: 'Source Serif 4', serif;
    font-size: 17px; font-weight: 400; font-style: italic;
    color: var(--vb-muted-ink);
    cursor: pointer;
    display: inline-flex; align-items: center; gap: 6px;
    transition: color 0.2s; margin: 0;
    border-radius: 6px; padding: 2px 8px;
  }
  .vb-quote:hover { color: var(--vb-terracotta); }
  .vb-inline-pencil { opacity: 0; transition: opacity 0.2s; }
  .vb-quote:hover .vb-inline-pencil,
  .vb-refl-text:hover .vb-inline-pencil { opacity: 0.5; }

  /* Meta row */
  .vb-meta-row {
    display: flex; align-items: center; justify-content: center;
    gap: 12px; font-size: 13px; color: var(--vb-taupe);
    font-family: 'Inter', sans-serif; flex-wrap: wrap;
  }
  .vb-divider { opacity: 0.35; }
  .vb-mood-tag {
    font-family: 'Inter', sans-serif;
    font-size: 13px; font-weight: 500;
    cursor: pointer; display: inline-flex; align-items: center;
    gap: 4px; transition: color 0.2s;
    border-radius: 6px; padding: 2px 6px;
  }
  .vb-mood-tag:hover { color: var(--vb-terracotta); }
  .vb-time { font-size: 13px; font-family: 'JetBrains Mono', monospace; }
  .vb-current-badge {
    background: var(--vb-terracotta);
    color: white; font-size: 11px; font-weight: 600;
    padding: 3px 10px; border-radius: 20px;
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.03em;
  }

  /* Edit rows */
  .vb-edit-row {
    display: flex; align-items: center; gap: 8px; justify-content: center;
  }
  .vb-quote-input, .vb-mood-input {
    background: var(--vb-linen);
    border: 1px solid var(--vb-border-strong);
    border-radius: 10px; padding: 7px 14px;
    font-family: 'Source Serif 4', serif;
    font-size: 16px; color: var(--vb-ink);
    width: min(400px, 70vw); text-align: center; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .vb-quote-input:focus, .vb-mood-input:focus {
    border-color: var(--vb-terracotta);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--vb-terracotta) 15%, transparent);
  }
  .vb-save-btn {
    background: var(--vb-terracotta); border: none; border-radius: 10px;
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    color: white; cursor: pointer; transition: background 0.2s, transform 0.15s;
  }
  .vb-save-btn:hover { background: var(--vb-terracotta-dark); transform: scale(1.05); }

  /* ══════════════════════════════════════════════════════════════════════
     GLANCE STRIP — metric pills
     ══════════════════════════════════════════════════════════════════════ */
  .vb-glance-strip {
    display: flex; align-items: center; justify-content: center;
    flex-wrap: wrap; gap: 8px 14px;
    background: var(--vb-glass-bg);
    backdrop-filter: blur(var(--vb-glass-blur));
    -webkit-backdrop-filter: blur(var(--vb-glass-blur));
    border: 1px solid var(--vb-border);
    border-radius: 14px; padding: 14px 22px;
    margin-bottom: 16px;
  }
  .vb-glance-item { display: flex; align-items: baseline; gap: 6px; }
  .vb-glance-icon { font-size: 14px; }
  .vb-glance-num {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600; font-size: 16px;
    color: var(--vb-terracotta);
  }
  .vb-glance-label {
    font-family: 'Inter', sans-serif;
    font-size: 12px; color: var(--vb-taupe);
    letter-spacing: -0.01em;
  }
  .vb-glance-sep { color: var(--vb-aged); font-size: 14px; }
  @media (max-width: 560px) {
    .vb-glance-sep { display: none; }
    .vb-glance-strip { justify-content: flex-start; gap: 10px 18px; }
  }

  /* ══════════════════════════════════════════════════════════════════════
     LAYOUT GRIDS
     ══════════════════════════════════════════════════════════════════════ */
  .vb-three-col {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 16px; margin-bottom: 16px;
  }
  @media (max-width: 900px) {
    .vb-three-col { grid-template-columns: 1fr; }
  }
  .vb-sidebar-stack {
    display: flex; flex-direction: column; gap: 16px;
  }
  .vb-sidebar {
    display: flex; flex-direction: column; gap: 16px;
  }
  .vb-two-col {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 16px; margin-bottom: 16px;
  }
  @media (max-width: 700px) {
    .vb-two-col { grid-template-columns: 1fr; }
  }

  /* ══════════════════════════════════════════════════════════════════════
     THEME CHIPS
     ══════════════════════════════════════════════════════════════════════ */
  .vb-theme-chips {
    display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
  }
  .vb-theme-chip {
    display: flex; align-items: center; gap: 4px;
    background: color-mix(in srgb, var(--vb-terracotta) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--vb-terracotta) 25%, transparent);
    border-radius: 8px; padding: 5px 12px;
    font-family: 'Inter', sans-serif;
    font-size: 13px; font-weight: 500;
    color: var(--vb-terracotta-dark);
    cursor: default;
  }
  .vb-chip-x {
    background: none; border: none; cursor: pointer;
    color: var(--vb-taupe); opacity: 0.6; padding: 2px;
    display: flex; align-items: center;
    transition: opacity 0.15s; border-radius: 50%;
  }
  .vb-chip-x:hover { opacity: 1; color: var(--vb-blush); }
  .vb-chip-add {
    display: flex; align-items: center; gap: 4px;
    background: none;
    border: 1.5px dashed var(--vb-border-strong);
    border-radius: 8px; padding: 5px 12px;
    font-family: 'Inter', sans-serif;
    font-size: 12px; font-weight: 500;
    color: var(--vb-taupe); cursor: pointer;
    transition: all 0.2s;
  }
  .vb-chip-add:hover {
    border-color: var(--vb-terracotta);
    color: var(--vb-terracotta);
    background: color-mix(in srgb, var(--vb-terracotta) 5%, transparent);
  }
  .vb-chip-input {
    background: var(--vb-linen);
    border: 1px solid var(--vb-terracotta);
    border-radius: 8px; padding: 5px 12px;
    font-family: 'Inter', sans-serif;
    font-size: 13px; color: var(--vb-ink);
    width: 130px; outline: none;
  }
  .vb-mt-2 { margin-top: 8px; }

  /* ══════════════════════════════════════════════════════════════════════
     FOCUS TODAY
     ══════════════════════════════════════════════════════════════════════ */
  .vb-focus-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
  .vb-focus-item {
    display: flex; align-items: center; gap: 8px;
    background: color-mix(in srgb, var(--vb-sage) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--vb-sage) 15%, transparent);
    border-radius: 10px; padding: 8px 12px;
    font-family: 'Source Serif 4', serif;
    font-size: 14px; font-weight: 400;
    color: var(--vb-ink);
  }
  .vb-focus-dot { color: var(--vb-sage); font-size: 12px; }
  .vb-focus-text { flex: 1; }
  .vb-empty-hint {
    font-family: 'Source Serif 4', serif;
    font-size: 14px; font-style: italic;
    color: var(--vb-taupe);
    text-align: center; padding: 20px 0; margin: 0;
  }
  .vb-month-progress { margin-top: 18px; }
  .vb-progress-label {
    display: flex; justify-content: space-between;
    font-size: 12px; color: var(--vb-muted-ink);
    margin-bottom: 6px; font-family: 'Inter', sans-serif;
  }
  .vb-progress-pct {
    font-weight: 700; color: var(--vb-terracotta);
    font-family: 'JetBrains Mono', monospace;
  }
  .vb-progress-track {
    height: 6px; background: var(--vb-aged);
    border-radius: 6px; overflow: hidden;
  }
  .vb-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--vb-terracotta), var(--vb-terracotta-dark));
    border-radius: 6px;
  }

  /* ══════════════════════════════════════════════════════════════════════
     VISION COLLAGE
     ══════════════════════════════════════════════════════════════════════ */
  .vb-collage-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 14px; min-height: 160px;
  }
  .vb-vision-card {
    position: relative; border-radius: 14px;
    padding: 20px 14px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 10px; border: 1px solid var(--vb-border);
    min-height: 120px; aspect-ratio: 4 / 3;
    cursor: default; text-align: center;
    transition: box-shadow 0.25s ease, transform 0.25s ease;
    overflow: hidden;
  }
  .vb-vision-card::before { display: none; /* Remove pin dot */ }
  .vb-vision-card:hover {
    box-shadow: 0 8px 24px var(--vb-shadow);
    transform: translateY(-3px);
  }
  .vb-card-terracotta { background: color-mix(in srgb, var(--vb-terracotta) 8%, var(--vb-parchment)); border-color: color-mix(in srgb, var(--vb-terracotta) 20%, transparent); }
  .vb-card-sage       { background: color-mix(in srgb, var(--vb-sage) 8%, var(--vb-parchment)); border-color: color-mix(in srgb, var(--vb-sage) 20%, transparent); }
  .vb-card-taupe      { background: color-mix(in srgb, var(--vb-taupe) 8%, var(--vb-parchment)); border-color: color-mix(in srgb, var(--vb-taupe) 20%, transparent); }
  .vb-card-ink        { background: color-mix(in srgb, var(--vb-ink) 5%, var(--vb-parchment)); border-color: color-mix(in srgb, var(--vb-ink) 12%, transparent); }
  .vb-card-blush      { background: color-mix(in srgb, var(--vb-blush) 8%, var(--vb-parchment)); border-color: color-mix(in srgb, var(--vb-blush) 20%, transparent); }
  .vb-card-add {
    background: transparent;
    border: 1.5px dashed var(--vb-border-strong);
    cursor: pointer; color: var(--vb-taupe);
    transition: all 0.2s;
  }
  .vb-card-add::before { display: none; }
  .vb-card-add:hover {
    border-color: var(--vb-terracotta);
    color: var(--vb-terracotta);
    background: color-mix(in srgb, var(--vb-terracotta) 5%, transparent);
  }
  .vb-add-icon { opacity: 0.5; }
  .vb-card-emoji { font-size: 28px; line-height: 1; }
  .vb-card-title {
    font-family: 'Inter', sans-serif;
    font-size: 13px; font-weight: 600;
    color: var(--vb-ink); line-height: 1.3;
    letter-spacing: -0.01em;
  }
  .vb-card-delete {
    position: absolute; top: 8px; right: 8px;
    background: var(--vb-linen);
    border: 1px solid var(--vb-border); border-radius: 8px;
    width: 24px; height: 24px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; opacity: 0;
    transition: opacity 0.2s, background 0.2s;
    color: var(--vb-muted-ink);
  }
  .vb-vision-card:hover .vb-card-delete,
  .vb-card-delete:focus-visible { opacity: 1; }
  .vb-card-delete:hover { background: var(--vb-blush); color: #fff; border-color: var(--vb-blush); }

  /* Card image */
  .vb-card-img-wrap {
    position: absolute; inset: 0;
    border-radius: 14px; overflow: hidden;
  }
  .vb-card-img {
    width: 100%; height: 100%;
    object-fit: cover;
  }
  .vb-card-img-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.55), transparent 50%);
    display: flex; align-items: flex-end;
    padding: 12px;
  }
  .vb-card-img-overlay .vb-card-title { color: #fff; }
  .vb-card-file-badge {
    display: flex; align-items: center; gap: 4px;
    background: var(--vb-linen); border: 1px solid var(--vb-border);
    border-radius: 8px; padding: 3px 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; color: var(--vb-muted-ink);
    text-decoration: none; margin-top: 4px;
  }
  .vb-card-file-badge:hover { background: var(--vb-aged); }
  .vb-card-file-name {
    max-width: 80px; overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap;
  }
  .vb-card-upload-btn {
    display: flex; align-items: center; gap: 4px;
    background: color-mix(in srgb, var(--vb-terracotta) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--vb-terracotta) 20%, transparent);
    border-radius: 8px; padding: 4px 10px;
    font-family: 'Inter', sans-serif;
    font-size: 11px; font-weight: 500;
    color: var(--vb-terracotta-dark);
    cursor: pointer; transition: all 0.2s;
    margin-top: 4px;
  }
  .vb-card-upload-btn:hover:not(:disabled) { background: var(--vb-terracotta); color: white; }
  .vb-card-upload-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .vb-card-upload-replace {
    position: absolute; bottom: 8px; right: 8px;
    opacity: 0; z-index: 2;
  }
  .vb-vision-card:hover .vb-card-upload-replace { opacity: 1; }
  .vb-card-drag-over {
    outline: 2px dashed var(--vb-terracotta);
    outline-offset: -2px;
  }
  .vb-card-drop-hint {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    background: color-mix(in srgb, var(--vb-terracotta) 15%, transparent);
    font-family: 'Inter', sans-serif;
    font-size: 12px; font-weight: 600;
    color: var(--vb-terracotta-dark);
    border-radius: 14px;
  }

  /* Templates */
  .vb-templates { margin-top: 14px; }
  .vb-templates-label {
    font-size: 12px; color: var(--vb-taupe);
    font-family: 'Inter', sans-serif;
    font-weight: 500; margin-bottom: 8px;
  }
  .vb-templates-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .vb-template-chip {
    background: var(--vb-linen);
    border: 1px solid var(--vb-border);
    border-radius: 8px; padding: 5px 14px;
    font-family: 'Inter', sans-serif;
    font-size: 13px; font-weight: 500;
    color: var(--vb-muted-ink);
    cursor: pointer; transition: all 0.2s;
  }
  .vb-template-chip:hover {
    background: color-mix(in srgb, var(--vb-terracotta) 8%, transparent);
    border-color: var(--vb-terracotta); color: var(--vb-terracotta);
  }
  .vb-form-hint {
    font-family: 'Inter', sans-serif;
    font-size: 13px; color: var(--vb-taupe);
    margin: 0 0 16px;
  }

  /* ══════════════════════════════════════════════════════════════════════
     FORM OVERLAY / MODAL
     ══════════════════════════════════════════════════════════════════════ */
  .vb-form-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    z-index: 100; padding: 16px;
  }
  .vb-add-form {
    background: var(--vb-parchment);
    border: 1px solid var(--vb-border);
    border-radius: 20px; padding: 32px;
    width: min(420px, 100%);
    box-shadow: 0 24px 64px rgba(0,0,0,0.2);
  }
  .vb-form-title {
    font-family: 'Source Serif 4', serif;
    font-size: 22px; font-weight: 700;
    color: var(--vb-ink);
    margin: 0 0 18px; letter-spacing: -0.02em;
  }
  .vb-form-input {
    width: 100%; background: var(--vb-linen);
    border: 1px solid var(--vb-border);
    border-radius: 10px; padding: 10px 14px;
    font-family: 'Source Serif 4', serif;
    font-size: 14px; color: var(--vb-ink);
    outline: none; box-sizing: border-box;
    margin-bottom: 12px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .vb-form-input:focus {
    border-color: var(--vb-terracotta);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--vb-terracotta) 12%, transparent);
  }
  .vb-form-input-sm { flex: 1; }
  .vb-goals-form-row { display: flex; gap: 8px; }
  .vb-form-actions {
    display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px;
  }

  /* ══════════════════════════════════════════════════════════════════════
     BUTTONS
     ══════════════════════════════════════════════════════════════════════ */
  .vb-btn-primary {
    background: var(--vb-terracotta); color: white;
    border: none; border-radius: 10px;
    padding: 8px 18px;
    font-family: 'Inter', sans-serif;
    font-size: 13px; font-weight: 600;
    cursor: pointer; display: flex; align-items: center; gap: 6px;
    transition: all 0.2s ease;
    letter-spacing: -0.01em;
  }
  .vb-btn-primary:hover:not(:disabled) {
    background: var(--vb-terracotta-dark);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px color-mix(in srgb, var(--vb-terracotta) 30%, transparent);
  }
  .vb-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
  .vb-btn-primary.vb-btn-sm { padding: 5px 13px; font-size: 12px; }
  .vb-btn-ghost {
    background: transparent;
    color: var(--vb-taupe);
    border: 1px solid var(--vb-border);
    border-radius: 10px; padding: 8px 18px;
    font-family: 'Inter', sans-serif;
    font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.2s;
  }
  .vb-btn-ghost:hover { border-color: var(--vb-muted-ink); color: var(--vb-ink); }

  /* Emoji grid */
  .vb-emoji-grid {
    display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px;
  }
  .vb-emoji-btn {
    background: var(--vb-linen);
    border: 1.5px solid transparent; border-radius: 10px;
    width: 38px; height: 38px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; cursor: pointer;
    transition: all 0.15s;
  }
  .vb-emoji-btn:hover { background: var(--vb-aged); }
  .vb-emoji-selected {
    border-color: var(--vb-terracotta);
    background: color-mix(in srgb, var(--vb-terracotta) 10%, transparent);
  }

  /* Color dots */
  .vb-color-row { display: flex; gap: 10px; margin-bottom: 16px; }
  .vb-color-dot {
    width: 26px; height: 26px; border-radius: 50%;
    border: 2.5px solid transparent;
    cursor: pointer; transition: transform 0.15s;
  }
  .vb-color-dot:hover { transform: scale(1.15); }
  .vb-dot-selected { border-color: var(--vb-ink); transform: scale(1.1); }
  .vb-dot-terracotta { background: var(--vb-terracotta); }
  .vb-dot-sage       { background: var(--vb-sage); }
  .vb-dot-taupe      { background: var(--vb-taupe); }
  .vb-dot-ink        { background: var(--vb-ink); }
  .vb-dot-blush      { background: var(--vb-blush); }

  /* ══════════════════════════════════════════════════════════════════════
     GOALS
     ══════════════════════════════════════════════════════════════════════ */
  .vb-goals-form {
    overflow: hidden;
    background: var(--vb-linen);
    border-radius: 14px; padding: 18px;
    margin-bottom: 14px;
    border: 1px solid var(--vb-border);
  }
  .vb-goals-list { display: flex; flex-direction: column; gap: 8px; }
  .vb-goal-row {
    display: flex; align-items: center; gap: 12px;
    background: var(--vb-parchment);
    border: 1px solid var(--vb-border);
    border-radius: 12px; padding: 12px 14px;
    transition: all 0.2s ease;
  }
  .vb-goal-row:hover {
    box-shadow: 0 2px 8px var(--vb-shadow);
    border-color: var(--vb-border-strong);
  }
  .vb-goal-done { opacity: 0.5; }
  .vb-goal-check {
    width: 24px; height: 24px;
    border: 2px solid var(--vb-aged);
    border-radius: 8px; background: transparent;
    cursor: pointer; font-size: 12px;
    display: flex; align-items: center; justify-content: center;
    color: var(--vb-taupe); flex-shrink: 0;
    transition: all 0.2s;
    font-family: 'Inter', sans-serif;
  }
  .vb-check-done {
    background: var(--vb-sage); border-color: var(--vb-sage); color: white;
  }
  .vb-check-progress {
    background: color-mix(in srgb, var(--vb-terracotta) 15%, transparent);
    border-color: var(--vb-terracotta);
    color: var(--vb-terracotta);
  }
  .vb-goal-body { flex: 1; min-width: 0; }
  .vb-goal-title {
    font-family: 'Source Serif 4', serif;
    font-weight: 500; font-size: 14px;
    color: var(--vb-ink); display: block;
    margin-bottom: 4px;
  }
  .vb-goal-done .vb-goal-title { text-decoration: line-through; }
  .vb-goal-status {
    font-family: 'Inter', sans-serif;
    font-size: 12px; color: var(--vb-taupe);
  }
  .vb-goal-progress-wrap { display: flex; align-items: center; gap: 8px; }
  .vb-goal-progress-track {
    flex: 1; height: 5px;
    background: var(--vb-aged);
    border-radius: 5px; overflow: hidden;
  }
  .vb-goal-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--vb-terracotta), var(--vb-terracotta-dark));
    border-radius: 5px;
  }
  .vb-goal-pct {
    font-size: 12px; color: var(--vb-taupe);
    white-space: nowrap; font-family: 'JetBrains Mono', monospace;
  }
  .vb-goal-bump {
    background: color-mix(in srgb, var(--vb-terracotta) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--vb-terracotta) 25%, transparent);
    border-radius: 8px; padding: 3px 8px;
    font-size: 11px; color: var(--vb-terracotta-dark);
    cursor: pointer; font-family: 'JetBrains Mono', monospace;
    font-weight: 600; transition: all 0.15s;
  }
  .vb-goal-bump:hover { background: var(--vb-terracotta); color: white; }
  .vb-goal-del {
    background: none; border: none;
    color: var(--vb-taupe); opacity: 0;
    cursor: pointer; padding: 4px;
    transition: opacity 0.2s, color 0.2s;
    display: flex; align-items: center; border-radius: 6px;
  }
  .vb-goal-row:hover .vb-goal-del,
  .vb-goal-del:focus-visible { opacity: 0.6; }
  .vb-goal-del:hover { opacity: 1 !important; color: var(--vb-blush); }

  /* ══════════════════════════════════════════════════════════════════════
     LIFE AREAS
     ══════════════════════════════════════════════════════════════════════ */
  .vb-areas-list { display: flex; flex-direction: column; gap: 14px; }
  .vb-area-row { display: flex; align-items: center; gap: 12px; }
  .vb-area-icon { font-size: 18px; flex-shrink: 0; }
  .vb-area-label {
    width: 100px; flex-shrink: 0;
    font-family: 'Inter', sans-serif;
    font-size: 13px; font-weight: 500; color: var(--vb-muted-ink);
    letter-spacing: -0.01em;
  }
  .vb-bar-track {
    flex: 1; height: 8px;
    background: var(--vb-aged);
    border-radius: 8px; overflow: hidden;
    cursor: pointer; transition: height 0.2s;
  }
  .vb-bar-track:hover, .vb-bar-track:focus-visible { height: 10px; }
  .vb-bar-fill {
    height: 100%; border-radius: 8px;
    transition: background-color 0.3s;
  }
  .vb-area-score {
    width: 42px; text-align: right;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px; font-weight: 600;
    color: var(--vb-terracotta);
  }
  .vb-area-hint {
    font-size: 12px; color: var(--vb-taupe);
    text-align: center; margin-top: 14px;
    font-family: 'Inter', sans-serif;
    font-style: italic;
  }

  /* ══════════════════════════════════════════════════════════════════════
     HABIT GARDEN
     ══════════════════════════════════════════════════════════════════════ */
  .vb-habit-header-row,
  .vb-habit-row {
    display: flex; align-items: center;
    gap: 4px; margin-bottom: 7px;
  }
  .vb-habit-name-col {
    display: flex; align-items: center; gap: 6px;
    width: 160px; flex-shrink: 0; overflow: hidden;
  }
  .vb-habit-icon { font-size: 16px; flex-shrink: 0; }
  .vb-habit-name {
    font-family: 'Inter', sans-serif;
    font-size: 13px; font-weight: 500;
    color: var(--vb-ink); flex: 1;
    white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis;
  }
  .vb-dot-col {
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .vb-day-label {
    font-size: 11px; color: var(--vb-taupe);
    font-family: 'JetBrains Mono', monospace;
  }
  .vb-today-label { color: var(--vb-terracotta); font-weight: 700; }
  .vb-habit-dot {
    background: none; border: none; cursor: pointer;
    font-size: 16px; border-radius: 50%;
    transition: transform 0.15s; color: var(--vb-aged);
  }
  .vb-habit-dot:hover { transform: scale(1.25); }
  .vb-dot-done    { color: var(--vb-sage); }
  .vb-dot-partial { color: var(--vb-terracotta); }
  .vb-dot-missed  { color: var(--vb-taupe); }
  .vb-dot-empty   { color: var(--vb-aged); opacity: 0.5; }
  .vb-dot-future  { color: var(--vb-aged); opacity: 0.25; cursor: default !important; }

  /* ══════════════════════════════════════════════════════════════════════
     QUICK NOTES
     ══════════════════════════════════════════════════════════════════════ */
  .vb-notes-area {
    width: 100%; min-height: 140px;
    background: var(--vb-linen);
    border: 1px solid var(--vb-border);
    border-radius: 12px; padding: 14px;
    font-family: 'Source Serif 4', serif;
    font-size: 14px; color: var(--vb-ink);
    resize: none; outline: none;
    line-height: 1.8; box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .vb-notes-area:focus {
    border-color: var(--vb-terracotta);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--vb-terracotta) 10%, transparent);
  }
  .vb-save-indicator {
    font-size: 12px; color: var(--vb-sage);
    font-family: 'Inter', sans-serif; font-weight: 500;
  }

  /* ══════════════════════════════════════════════════════════════════════
     CALENDAR HEATMAP
     ══════════════════════════════════════════════════════════════════════ */
  /* ══════════════════════════════════════════════════════════════════════
     CALENDAR & EVENTS GRID
     ══════════════════════════════════════════════════════════════════════ */
  .vb-cal-grid-wrapper {
    display: flex; flex-direction: column; gap: 4px;
    background: var(--vb-linen);
    border: 1px solid var(--vb-border);
    border-radius: 14px; padding: 12px;
    overflow-x: auto;
  }
  .vb-cal-header-row {
    display: grid; grid-template-columns: repeat(7, 1fr);
    gap: 4px; text-align: center; margin-bottom: 6px;
  }
  .vb-cal-header-cell {
    font-family: 'Inter', sans-serif;
    font-size: 11px; font-weight: 700;
    color: var(--vb-taupe); text-transform: uppercase;
    letter-spacing: 0.05em; padding: 4px 0;
  }
  .vb-cal-body {
    display: flex; flex-direction: column; gap: 4px;
  }
  .vb-cal-week-row {
    display: grid; grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }
  .vb-cal-cell {
    min-height: 84px; background: var(--vb-parchment);
    border: 1px solid var(--vb-border);
    border-radius: 10px; padding: 6px;
    display: flex; flex-direction: column; gap: 4px;
    cursor: pointer; transition: all 0.2s ease;
    position: relative; overflow: hidden;
  }
  .vb-cal-cell:hover {
    border-color: var(--vb-terracotta);
    box-shadow: 0 4px 12px var(--vb-shadow);
  }
  .vb-cal-cell-empty {
    background: transparent; border-color: transparent;
    cursor: default; pointer-events: none; opacity: 0.3;
  }
  .vb-cal-cell-today {
    border-color: var(--vb-terracotta) !important;
    background: color-mix(in srgb, var(--vb-terracotta) 4%, var(--vb-parchment));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--vb-terracotta) 30%, transparent) inset;
  }
  .vb-cal-cell-top {
    display: flex; align-items: center; justify-content: space-between;
  }
  .vb-cal-day-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; font-weight: 600; color: var(--vb-muted-ink);
  }
  .vb-cal-num-today {
    background: var(--vb-terracotta); color: white;
    width: 20px; height: 20px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px;
  }
  .vb-cal-habit-indicator {
    font-size: 10px; line-height: 1;
  }
  .vb-heat-full    { color: var(--vb-sage); }
  .vb-heat-partial { color: var(--vb-terracotta); }
  .vb-heat-missed  { color: var(--vb-taupe); }
  .vb-heat-empty   { color: var(--vb-aged); opacity: 0.3; }
  .vb-heat-future  { color: var(--vb-aged); opacity: 0.15; }

  .vb-cal-events-list {
    display: flex; flex-direction: column; gap: 3px;
    flex: 1; overflow: hidden;
  }
  .vb-cal-event-pill {
    display: flex; align-items: center; justify-content: space-between; gap: 4px;
    padding: 3px 6px; border-radius: 6px;
    font-family: 'Inter', sans-serif; font-size: 10.5px; font-weight: 500;
    line-height: 1.2; overflow: hidden;
    transition: transform 0.15s;
  }
  .vb-cal-event-pill:hover { transform: scale(1.02); }
  .vb-cal-event-title {
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;
  }
  .vb-cal-event-time {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9.5px; opacity: 0.85; flex-shrink: 0;
  }
  .vb-cal-event-del {
    background: none; border: none; padding: 1px;
    color: currentColor; opacity: 0; cursor: pointer;
    border-radius: 4px; display: flex; align-items: center;
  }
  .vb-cal-event-pill:hover .vb-cal-event-del { opacity: 0.8; }
  .vb-cal-event-del:hover { opacity: 1; background: rgba(0,0,0,0.15); }

  .vb-cal-more-pill {
    font-family: 'Inter', sans-serif; font-size: 10px;
    color: var(--vb-taupe); text-align: right; padding-right: 2px;
  }

  .vb-heatmap-legend {
    font-size: 12px; color: var(--vb-taupe);
    font-family: 'Inter', sans-serif;
  }


  /* ══════════════════════════════════════════════════════════════════════
     REFLECTION
     ══════════════════════════════════════════════════════════════════════ */
  .vb-reflection-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }
  .vb-reflection-card {
    background: var(--vb-linen);
    border: 1px solid var(--vb-border);
    border-radius: 14px; padding: 16px;
    transition: box-shadow 0.2s, border-color 0.2s;
  }
  .vb-reflection-card:hover { box-shadow: 0 4px 14px var(--vb-shadow); }
  .vb-reflection-editing { border-color: var(--vb-terracotta); }
  .vb-reflection-header {
    display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
  }
  .vb-refl-icon { font-size: 16px; }
  .vb-refl-label {
    flex: 1; font-family: 'Inter', sans-serif;
    font-size: 12px; font-weight: 600; color: var(--vb-ink);
    letter-spacing: -0.01em;
  }
  .vb-refl-edit {
    display: flex; align-items: center; gap: 3px;
    background: none; border: none; color: var(--vb-taupe);
    cursor: pointer; font-size: 11px;
    font-family: 'Inter', sans-serif;
    transition: color 0.2s; border-radius: 6px;
  }
  .vb-refl-edit:hover { color: var(--vb-terracotta); }
  .vb-refl-text {
    font-family: 'Source Serif 4', serif;
    font-size: 14px; color: var(--vb-ink);
    line-height: 1.6; cursor: pointer; margin: 0;
    display: flex; align-items: center; gap: 4px;
  }
  .vb-refl-empty { color: var(--vb-taupe); font-style: italic; }
  .vb-refl-textarea {
    width: 100%; background: var(--vb-parchment);
    border: 1px solid var(--vb-border);
    border-radius: 10px; padding: 10px;
    font-family: 'Source Serif 4', serif;
    font-size: 14px; color: var(--vb-ink);
    resize: none; outline: none;
    box-sizing: border-box; margin-bottom: 8px;
    line-height: 1.6;
    transition: border-color 0.2s;
  }
  .vb-refl-textarea:focus { border-color: var(--vb-terracotta); }

  /* ══════════════════════════════════════════════════════════════════════
     YEAR JOURNEY
     ══════════════════════════════════════════════════════════════════════ */
  .vb-journey-strip {
    display: flex; gap: 8px;
    overflow-x: auto; padding-bottom: 8px;
    scrollbar-width: thin;
    scrollbar-color: var(--vb-aged) transparent;
  }
  .vb-journey-month {
    display: flex; flex-direction: column;
    align-items: center; gap: 6px;
    background: var(--vb-linen);
    border: 1px solid var(--vb-border);
    border-radius: 14px; padding: 12px 10px;
    min-width: 72px; cursor: pointer;
    transition: all 0.2s; flex-shrink: 0;
  }
  .vb-journey-month:hover {
    box-shadow: 0 4px 12px var(--vb-shadow);
    border-color: var(--vb-border-strong);
  }
  .vb-journey-active {
    border-color: var(--vb-terracotta) !important;
    background: color-mix(in srgb, var(--vb-terracotta) 8%, var(--vb-linen)) !important;
  }
  .vb-journey-current {
    border-color: var(--vb-terracotta);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--vb-terracotta) 20%, transparent);
  }
  .vb-journey-future { opacity: 0.45; }
  .vb-journey-label {
    font-family: 'Inter', sans-serif;
    font-size: 11px; font-weight: 700;
    color: var(--vb-muted-ink);
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .vb-journey-active .vb-journey-label { color: var(--vb-terracotta); }
  .vb-journey-dots {
    display: flex; gap: 2px; align-items: center;
    font-size: 12px; min-height: 16px;
  }
  .vb-journey-star { font-size: 16px; }
  .vb-journey-bar {
    width: 100%; height: 4px;
    background: var(--vb-aged);
    border-radius: 4px; overflow: hidden;
  }
  .vb-journey-bar-fill {
    height: 100%;
    background: var(--vb-terracotta);
    border-radius: 4px;
  }

  /* ══════════════════════════════════════════════════════════════════════
     WEATHER STRIP
     ══════════════════════════════════════════════════════════════════════ */
  .vb-weather-strip {
    display: flex; align-items: center; gap: 14px;
    background: var(--vb-glass-bg);
    backdrop-filter: blur(var(--vb-glass-blur));
    -webkit-backdrop-filter: blur(var(--vb-glass-blur));
    border: 1px solid var(--vb-border);
    border-radius: 14px; padding: 14px 22px;
    margin-bottom: 16px;
    font-family: 'Inter', sans-serif;
    font-size: 14px; color: var(--vb-ink);
    box-shadow: 0 1px 3px var(--vb-shadow);
    flex-wrap: wrap; position: relative; overflow: hidden;
  }
  .vb-weather-seg { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .vb-weather-real { display: flex; align-items: center; gap: 8px; color: var(--vb-ink); }
  .vb-weather-icon { font-size: 18px; }
  .vb-weather-city {
    display: flex; align-items: center; gap: 3px;
    font-size: 13px; color: var(--vb-taupe);
  }
  .vb-weather-temp {
    font-weight: 700; color: var(--vb-terracotta);
    font-size: 15px; font-family: 'JetBrains Mono', monospace;
  }
  .vb-weather-desc { font-size: 13px; color: var(--vb-muted-ink); }
  .vb-weather-empty {
    display: flex; align-items: center; gap: 6px;
    color: var(--vb-taupe); font-style: italic; font-size: 13px;
  }
  .vb-weather-fetch-btn {
    display: flex; align-items: center; gap: 5px;
    background: color-mix(in srgb, var(--vb-terracotta) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--vb-terracotta) 25%, transparent);
    border-radius: 8px; padding: 5px 14px;
    font-family: 'Inter', sans-serif;
    font-size: 12px; font-weight: 600;
    color: var(--vb-terracotta-dark);
    cursor: pointer; transition: all 0.2s;
  }
  .vb-weather-fetch-btn:hover:not(:disabled) { background: var(--vb-terracotta); color: white; }
  .vb-weather-fetch-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .vb-weather-sep { color: var(--vb-aged); font-size: 16px; }
  .vb-mood-display {
    display: flex; align-items: center; gap: 5px;
    background: none; border: none;
    font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500;
    color: var(--vb-muted-ink); cursor: pointer;
    padding: 0; transition: color 0.2s;
  }
  .vb-mood-display:hover { color: var(--vb-terracotta); }
  .vb-mood-strip-input {
    width: 180px !important; padding: 5px 12px !important;
    font-size: 13px !important;
    background: var(--vb-linen) !important;
    color: var(--vb-ink) !important;
    border: 1px solid var(--vb-border-strong) !important;
    border-radius: 8px !important;
    font-family: 'Inter', sans-serif !important;
  }
  .vb-mood-prefix { font-size: 16px; }

  /* ══════════════════════════════════════════════════════════════════════
     ANIMATIONS
     ══════════════════════════════════════════════════════════════════════ */
  .vb-spin { animation: vb-rotate 1s linear infinite; }
  @keyframes vb-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  @media (prefers-reduced-motion: reduce) {
    .vb-spin { animation: none; }
    .vb-nav-btn:hover,
    .vb-color-dot:hover,
    .vb-vision-card:hover,
    .vb-habit-dot:hover { transform: none; }
  }
`;
