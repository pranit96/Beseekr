/**
 * VisionBoard.tsx — Monthly Scrapbook / Vision Board
 * Route: /board  (standalone, like /brain)
 *
 * Warm beige, cork-board aesthetic. Month-by-month personal tracker:
 * goals, habits, life areas, vision collage, notes & reflection.
 */

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { visionBoardApi } from "@/api/visionboard";
import type {
  FullBoardData, VisionGoal, VisionCard, LifeArea,
  HabitLog, BoardNotes, BoardMonth, WeatherData,
} from "@/api/visionboard";

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VisionBoard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const now = currentYearMonth();

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
    onSuccess: invalidateBoard,
    onError: (e) => onError("updateMeta", e),
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
    onSuccess: invalidateBoard,
    onError: (e) => onError("deleteGoal", e),
  });

  // Life areas
  const upsertAreas = useMutation({
    mutationFn: (areas: Array<{ area: string; score: number }>) =>
      visionBoardApi.upsertLifeAreas(year, month, areas),
    onSuccess: invalidateBoard,
    onError: (e) => onError("upsertAreas", e),
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
    onSuccess: invalidateBoard,
    onError: (e) => onError("deleteHabit", e),
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
    onSuccess: invalidateBoard,
    onError: (e) => onError("upsertNotes", e),
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
    onSuccess: invalidateBoard,
    onError: (e) => onError("deleteCard", e),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visionboard-weather", year, month] }),
    onError: (e) => onError("upsertWeather", e),
  });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="vb-page">
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Caveat:wght@400;600&family=Lora:ital,wght@0,400;0,500;1,400&display=swap"
        rel="stylesheet"
      />

      {/* CSS Variables + Styles */}
      <style>{BOARD_STYLES}</style>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="vb-loading">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="vb-spinner"
          >✦</motion.div>
          <p>Preparing your board…</p>
        </div>
      )}

      {/* ── Board ── */}
      <AnimatePresence mode="wait">
        {board && (
          <motion.div
            key={`${year}-${month}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{    opacity: 0, x: -30 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {/* 1. Header */}
            <BoardHeader
              boardMonth={board.month}
              onPrev={() => navigate(-1)}
              onNext={() => navigate(1)}
              onUpdate={(u) => updateMeta.mutateAsync(u)}
              isCurrentMonth={isCurrentMonth}
            />

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
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
// All vision board styles are self-contained here — no Tailwind dependency.
// Warm beige palette, paper texture, artistic fonts.

const BOARD_STYLES = `
  /* ── Fonts ─────────────────────────────── */
  .vb-page {
    --vb-parchment:   #F5ECD7;
    --vb-linen:       #EDE0C4;
    --vb-aged:        #DDD0B3;
    --vb-terracotta:  #C9714A;
    --vb-sage:        #8FA689;
    --vb-taupe:       #A89070;
    --vb-ink:         #3B2F2F;
    --vb-muted-ink:   #6B5A4E;
    --vb-blush:       #D4A09A;
    --vb-cream:       #FAF5EB;
    --vb-border:      rgba(59,47,47,0.12);
    --vb-shadow:      rgba(59,47,47,0.08);
    font-family: 'Lora', Georgia, serif;
    color: var(--vb-ink);
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 0 64px;
  }

  /* ── Loading ─────────────────────────────── */
  .vb-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    gap: 12px;
    color: var(--vb-taupe);
    font-family: 'Caveat', cursive;
    font-size: 18px;
  }
  .vb-spinner {
    font-size: 32px;
    color: var(--vb-terracotta);
  }

  /* ── Section wrapper ─────────────────────── */
  .vb-section {
    background: var(--vb-parchment);
    border: 1px solid var(--vb-border);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 16px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 2px 12px var(--vb-shadow), inset 0 1px 0 rgba(255,255,255,0.6);
  }
  .vb-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    border-radius: 12px;
    opacity: 0.5;
  }

  /* ── Section label ─────────────────────── */
  .vb-section-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: 'Lora', serif;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.12em;
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
    background: linear-gradient(135deg, var(--vb-linen) 0%, var(--vb-parchment) 60%, #EAD8B8 100%);
    border: 1px solid var(--vb-border);
    border-radius: 16px;
    padding: 32px 24px 28px;
    margin-bottom: 16px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 24px var(--vb-shadow), inset 0 1px 0 rgba(255,255,255,0.8);
    text-align: center;
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
  }
  .vb-header-center {
    flex: 1;
  }
  .vb-nav-btn {
    background: rgba(59,47,47,0.06);
    border: 1px solid var(--vb-border);
    border-radius: 8px;
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    color: var(--vb-muted-ink);
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .vb-nav-btn:hover {
    background: var(--vb-terracotta);
    color: white;
    border-color: var(--vb-terracotta);
    transform: scale(1.05);
  }

  /* Month title */
  .vb-month-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: clamp(22px, 4vw, 34px);
    font-weight: 700;
    color: var(--vb-ink);
    letter-spacing: 0.06em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 10px;
  }
  .vb-ornament {
    color: var(--vb-terracotta);
    font-size: 0.7em;
  }

  /* Quote */
  .vb-quote-row { margin-bottom: 12px; }
  .vb-quote {
    font-family: 'Caveat', cursive;
    font-size: 18px;
    color: var(--vb-muted-ink);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: color 0.2s;
    margin: 0;
  }
  .vb-quote:hover { color: var(--vb-terracotta); }
  .vb-inline-pencil {
    opacity: 0;
    transition: opacity 0.2s;
  }
  .vb-quote:hover .vb-inline-pencil,
  .vb-refl-text:hover .vb-inline-pencil { opacity: 0.6; }

  /* Meta row */
  .vb-meta-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 13px;
    color: var(--vb-taupe);
  }
  .vb-divider { opacity: 0.4; }
  .vb-mood-tag {
    font-family: 'Caveat', cursive;
    font-size: 15px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: color 0.2s;
  }
  .vb-mood-tag:hover { color: var(--vb-terracotta); }
  .vb-time { font-size: 13px; }
  .vb-current-badge {
    background: var(--vb-terracotta);
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 20px;
    font-family: 'Lora', serif;
    letter-spacing: 0.05em;
  }

  /* Edit rows */
  .vb-edit-row {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
  }
  .vb-quote-input, .vb-mood-input {
    background: rgba(255,255,255,0.7);
    border: 1px solid var(--vb-border);
    border-radius: 6px;
    padding: 4px 10px;
    font-family: 'Caveat', cursive;
    font-size: 17px;
    color: var(--vb-ink);
    width: min(400px, 70vw);
    text-align: center;
    outline: none;
  }
  .vb-quote-input:focus, .vb-mood-input:focus {
    border-color: var(--vb-terracotta);
    box-shadow: 0 0 0 2px rgba(201,113,74,0.15);
  }
  .vb-save-btn {
    background: var(--vb-terracotta);
    border: none;
    border-radius: 6px;
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    color: white;
    cursor: pointer;
  }

  /* ── Three-column layout ─────────────────── */
  .vb-three-col {
    display: grid;
    grid-template-columns: 180px 1fr 180px;
    gap: 14px;
    margin-bottom: 16px;
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
    background: rgba(201,113,74,0.12);
    border: 1px solid rgba(201,113,74,0.3);
    border-radius: 20px;
    padding: 4px 10px;
    font-family: 'Caveat', cursive;
    font-size: 15px;
    color: var(--vb-terracotta);
    cursor: default;
  }
  .vb-chip-x {
    background: none; border: none; cursor: pointer;
    color: var(--vb-taupe); opacity: 0.7; padding: 0;
    display: flex; align-items: center;
    transition: opacity 0.2s;
  }
  .vb-chip-x:hover { opacity: 1; color: var(--vb-terracotta); }
  .vb-chip-add {
    display: flex; align-items: center; gap: 4px;
    background: none;
    border: 1px dashed var(--vb-border);
    border-radius: 20px;
    padding: 4px 10px;
    font-family: 'Lora', serif;
    font-size: 12px;
    color: var(--vb-taupe);
    cursor: pointer;
    transition: all 0.2s;
  }
  .vb-chip-add:hover {
    border-color: var(--vb-terracotta);
    color: var(--vb-terracotta);
    background: rgba(201,113,74,0.05);
  }
  .vb-chip-input {
    background: rgba(255,255,255,0.7);
    border: 1px solid var(--vb-terracotta);
    border-radius: 20px;
    padding: 4px 12px;
    font-family: 'Caveat', cursive;
    font-size: 15px;
    color: var(--vb-ink);
    width: 120px;
    outline: none;
  }
  .vb-mt-2 { margin-top: 8px; }

  /* ── Focus Today ──────────────────────────── */
  .vb-focus-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
  .vb-focus-item {
    display: flex; align-items: center; gap: 6px;
    background: rgba(143,166,137,0.1);
    border-radius: 8px;
    padding: 6px 10px;
    font-family: 'Caveat', cursive;
    font-size: 16px;
    color: var(--vb-ink);
  }
  .vb-focus-dot { color: var(--vb-sage); font-size: 14px; }
  .vb-focus-text { flex: 1; }
  .vb-empty-hint {
    font-family: 'Caveat', cursive;
    font-size: 15px;
    color: var(--vb-taupe);
    text-align: center;
    padding: 16px 0;
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
  .vb-progress-pct { font-weight: 600; color: var(--vb-terracotta); }
  .vb-progress-track {
    height: 6px;
    background: var(--vb-aged);
    border-radius: 4px;
    overflow: hidden;
  }
  .vb-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--vb-terracotta), #D4845A);
    border-radius: 4px;
  }

  /* ── Vision Collage ──────────────────────── */
  .vb-collage-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 12px;
    min-height: 140px;
  }
  .vb-vision-card {
    position: relative;
    border-radius: 10px;
    padding: 16px 14px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 8px;
    border: 1px solid var(--vb-border);
    min-height: 110px;
    cursor: default;
    text-align: center;
    transition: box-shadow 0.2s;
  }
  .vb-vision-card:hover { box-shadow: 0 4px 16px var(--vb-shadow); }
  .vb-card-terracotta { background: rgba(201,113,74,0.12); border-color: rgba(201,113,74,0.25); }
  .vb-card-sage       { background: rgba(143,166,137,0.12); border-color: rgba(143,166,137,0.25); }
  .vb-card-taupe      { background: rgba(168,144,112,0.12); border-color: rgba(168,144,112,0.25); }
  .vb-card-ink        { background: rgba(59,47,47,0.06);   border-color: rgba(59,47,47,0.15);   }
  .vb-card-blush      { background: rgba(212,160,154,0.15); border-color: rgba(212,160,154,0.3); }
  .vb-card-add {
    background: transparent;
    border: 1.5px dashed var(--vb-border);
    cursor: pointer;
    color: var(--vb-taupe);
    transition: all 0.2s;
  }
  .vb-card-add:hover { border-color: var(--vb-terracotta); color: var(--vb-terracotta); background: rgba(201,113,74,0.05); }
  .vb-add-icon { opacity: 0.5; }
  .vb-card-emoji { font-size: 28px; line-height: 1; }
  .vb-card-title {
    font-family: 'Caveat', cursive;
    font-size: 15px;
    color: var(--vb-ink);
    line-height: 1.3;
  }
  .vb-card-delete {
    position: absolute; top: 6px; right: 6px;
    background: rgba(59,47,47,0.1);
    border: none; border-radius: 50%;
    width: 20px; height: 20px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    opacity: 0; transition: opacity 0.2s;
    color: var(--vb-muted-ink);
  }
  .vb-vision-card:hover .vb-card-delete { opacity: 1; }

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
    background: rgba(255,255,255,0.5);
    border: 1px solid var(--vb-border);
    border-radius: 20px;
    padding: 4px 12px;
    font-family: 'Caveat', cursive;
    font-size: 14px;
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
    background: rgba(59,47,47,0.3);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 100;
    padding: 16px;
  }
  .vb-add-form {
    background: var(--vb-cream);
    border: 1px solid var(--vb-border);
    border-radius: 16px;
    padding: 28px;
    width: min(400px, 100%);
    box-shadow: 0 16px 48px rgba(59,47,47,0.2);
  }
  .vb-form-title {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    color: var(--vb-ink);
    margin: 0 0 16px;
  }
  .vb-form-input {
    width: 100%;
    background: rgba(255,255,255,0.7);
    border: 1px solid var(--vb-border);
    border-radius: 8px;
    padding: 8px 12px;
    font-family: 'Lora', serif;
    font-size: 14px;
    color: var(--vb-ink);
    outline: none;
    box-sizing: border-box;
    margin-bottom: 12px;
  }
  .vb-form-input:focus {
    border-color: var(--vb-terracotta);
    box-shadow: 0 0 0 3px rgba(201,113,74,0.1);
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
    border-radius: 8px;
    padding: 7px 16px;
    font-family: 'Lora', serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: flex; align-items: center; gap: 6px;
    transition: all 0.2s;
  }
  .vb-btn-primary:hover:not(:disabled) { background: #B86040; transform: translateY(-1px); }
  .vb-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .vb-btn-primary.vb-btn-sm { padding: 4px 12px; font-size: 12px; }
  .vb-btn-ghost {
    background: transparent;
    color: var(--vb-taupe);
    border: 1px solid var(--vb-border);
    border-radius: 8px;
    padding: 7px 16px;
    font-family: 'Lora', serif;
    font-size: 13px;
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
    background: rgba(255,255,255,0.5);
    border: 1.5px solid transparent;
    border-radius: 8px;
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .vb-emoji-btn:hover { background: var(--vb-linen); }
  .vb-emoji-selected { border-color: var(--vb-terracotta); background: rgba(201,113,74,0.1); }

  /* Color dots */
  .vb-color-row { display: flex; gap: 10px; margin-bottom: 16px; }
  .vb-color-dot {
    width: 24px; height: 24px;
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
    border-radius: 10px;
    padding: 16px;
    margin-bottom: 12px;
    border: 1px solid var(--vb-border);
  }
  .vb-goals-list { display: flex; flex-direction: column; gap: 8px; }
  .vb-goal-row {
    display: flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,0.4);
    border: 1px solid var(--vb-border);
    border-radius: 8px;
    padding: 10px 12px;
    transition: background 0.2s;
  }
  .vb-goal-row:hover { background: rgba(255,255,255,0.65); }
  .vb-goal-done { opacity: 0.55; }
  .vb-goal-check {
    width: 24px; height: 24px;
    border: 1.5px solid var(--vb-border);
    border-radius: 6px;
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
  .vb-check-progress { background: rgba(201,113,74,0.15); border-color: var(--vb-terracotta); color: var(--vb-terracotta); }
  .vb-goal-body { flex: 1; min-width: 0; }
  .vb-goal-title {
    font-family: 'Lora', serif;
    font-size: 14px;
    color: var(--vb-ink);
    display: block;
    margin-bottom: 4px;
  }
  .vb-goal-done .vb-goal-title { text-decoration: line-through; }
  .vb-goal-status {
    font-family: 'Caveat', cursive;
    font-size: 13px;
    color: var(--vb-taupe);
  }
  .vb-goal-progress-wrap {
    display: flex; align-items: center; gap: 8px;
  }
  .vb-goal-progress-track {
    flex: 1; height: 4px;
    background: var(--vb-aged);
    border-radius: 4px; overflow: hidden;
  }
  .vb-goal-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--vb-terracotta), #D4845A);
    border-radius: 4px;
  }
  .vb-goal-pct { font-size: 12px; color: var(--vb-taupe); white-space: nowrap; }
  .vb-goal-bump {
    background: rgba(201,113,74,0.1);
    border: 1px solid rgba(201,113,74,0.25);
    border-radius: 6px;
    padding: 2px 6px;
    font-size: 11px;
    color: var(--vb-terracotta);
    cursor: pointer;
    font-family: 'Lora', serif;
    font-weight: 600;
    transition: all 0.15s;
  }
  .vb-goal-bump:hover { background: var(--vb-terracotta); color: white; }
  .vb-goal-del {
    background: none; border: none;
    color: var(--vb-taupe); opacity: 0;
    cursor: pointer; padding: 4px;
    transition: opacity 0.2s;
    display: flex; align-items: center;
  }
  .vb-goal-row:hover .vb-goal-del { opacity: 0.6; }
  .vb-goal-del:hover { opacity: 1 !important; color: #C0392B; }

  /* ── Life Areas ───────────────────────────── */
  .vb-areas-list { display: flex; flex-direction: column; gap: 12px; }
  .vb-area-row {
    display: flex; align-items: center; gap: 10px;
  }
  .vb-area-icon { font-size: 18px; flex-shrink: 0; }
  .vb-area-label {
    width: 110px; flex-shrink: 0;
    font-family: 'Lora', serif;
    font-size: 13px; color: var(--vb-muted-ink);
  }
  .vb-bar-track {
    flex: 1; height: 8px;
    background: var(--vb-aged);
    border-radius: 6px; overflow: hidden;
    cursor: pointer;
    transition: height 0.2s;
  }
  .vb-bar-track:hover { height: 10px; }
  .vb-bar-fill {
    height: 100%;
    border-radius: 6px;
    transition: background-color 0.3s;
  }
  .vb-area-score {
    width: 38px; text-align: right;
    font-family: 'Caveat', cursive;
    font-size: 15px; font-weight: 600;
    color: var(--vb-terracotta);
  }
  .vb-area-hint {
    font-size: 11px;
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
    margin-bottom: 6px;
  }
  .vb-habit-name-col {
    display: flex; align-items: center; gap: 6px;
    width: 160px; flex-shrink: 0;
    overflow: hidden;
  }
  .vb-habit-icon { font-size: 16px; flex-shrink: 0; }
  .vb-habit-name {
    font-family: 'Caveat', cursive;
    font-size: 15px;
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
    font-family: 'Lora', serif;
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
  .vb-dot-done    { color: var(--vb-sage); }
  .vb-dot-partial { color: var(--vb-terracotta); }
  .vb-dot-missed  { color: var(--vb-taupe); }
  .vb-dot-empty   { color: var(--vb-aged); opacity: 0.5; }
  .vb-dot-future  { color: var(--vb-aged); opacity: 0.3; cursor: default !important; }

  /* ── Two-column layout ─────────────────────── */
  .vb-two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 16px;
  }
  @media (max-width: 600px) {
    .vb-two-col { grid-template-columns: 1fr; }
  }

  /* ── Quick Notes ──────────────────────────── */
  .vb-notes-area {
    width: 100%;
    min-height: 140px;
    background: rgba(255,255,255,0.4);
    border: 1px solid var(--vb-border);
    border-radius: 8px;
    padding: 12px;
    font-family: 'Caveat', cursive;
    font-size: 16px;
    color: var(--vb-ink);
    resize: none;
    outline: none;
    line-height: 1.7;
    box-sizing: border-box;
    transition: border-color 0.2s;
  }
  .vb-notes-area:focus { border-color: var(--vb-terracotta); }
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
    font-family: 'Lora', serif;
    font-weight: 600;
  }
  .vb-heat-cell {
    width: 24px; text-align: center;
    font-size: 16px;
    cursor: default;
    border-radius: 4px;
    transition: transform 0.15s;
  }
  .vb-heat-full    { color: var(--vb-sage); }
  .vb-heat-partial { color: var(--vb-terracotta); }
  .vb-heat-missed  { color: var(--vb-taupe); }
  .vb-heat-empty   { color: var(--vb-aged); opacity: 0.3; }
  .vb-heat-future  { color: var(--vb-aged); opacity: 0.2; }
  .vb-heat-today   {
    background: rgba(201,113,74,0.12);
    border-radius: 50%;
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
    background: rgba(255,255,255,0.4);
    border: 1px solid var(--vb-border);
    border-radius: 10px;
    padding: 14px;
    transition: box-shadow 0.2s;
  }
  .vb-reflection-card:hover { box-shadow: 0 2px 10px var(--vb-shadow); }
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
    font-weight: 500;
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
  }
  .vb-refl-edit:hover { color: var(--vb-terracotta); }
  .vb-refl-text {
    font-family: 'Caveat', cursive;
    font-size: 15px;
    color: var(--vb-ink);
    line-height: 1.5;
    cursor: pointer;
    margin: 0;
    display: flex; align-items: center; gap: 4px;
  }
  .vb-refl-empty { color: var(--vb-taupe); font-style: italic; }
  .vb-refl-textarea {
    width: 100%;
    background: rgba(255,255,255,0.6);
    border: 1px solid var(--vb-border);
    border-radius: 6px;
    padding: 8px;
    font-family: 'Caveat', cursive;
    font-size: 15px;
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
    background: rgba(255,255,255,0.35);
    border: 1px solid var(--vb-border);
    border-radius: 10px;
    padding: 10px 8px;
    min-width: 68px;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .vb-journey-month:hover { background: rgba(255,255,255,0.65); }
  .vb-journey-active {
    border-color: var(--vb-terracotta);
    background: rgba(201,113,74,0.1) !important;
  }
  .vb-journey-current {
    border-color: var(--vb-terracotta);
    box-shadow: 0 0 0 2px rgba(201,113,74,0.2);
  }
  .vb-journey-future { opacity: 0.5; }
  .vb-journey-label {
    font-family: 'Lora', serif;
    font-size: 12px;
    font-weight: 600;
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
    width: 100%; height: 3px;
    background: var(--vb-aged);
    border-radius: 4px;
    overflow: hidden;
  }
  .vb-journey-bar-fill {
    height: 100%;
    background: var(--vb-terracotta);
    border-radius: 4px;
  }
`;
