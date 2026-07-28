import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, CheckCircle2, RefreshCw, BarChart2, Calendar, Trash2, Wand2, MessageSquare, AlertTriangle } from "lucide-react";
import { visionBoardApi } from "@/api/visionboard";
import { useToast } from "@/components/ui/use-toast";

interface VisionBoardAIProps {
  year: number;
  month: number;
  onRefreshBoard?: () => void;
}

type AIAction = "create" | "ask" | "analyse";

export function VisionBoardAI({ year, month, onRefreshBoard }: VisionBoardAIProps) {
  const { toast } = useToast();
  const [activeAction, setActiveAction] = useState<AIAction>("create");
  const [promptInput, setPromptInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [parsedSetup, setParsedSetup] = useState<any | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleRunAI = async (actionToRun: AIAction) => {
    setLoading(true);
    setAiResult(null);
    setParsedSetup(null);

    try {
      const res = await visionBoardApi.aiAssistant(year, month, actionToRun, promptInput);
      if (res?.data?.result) {
        setAiResult(res.data.result);

        if (actionToRun === "create") {
          try {
            const cleanJson = res.data.result.replace(/```json\n?|\n?```/g, "").trim();
            const parsed = JSON.parse(cleanJson);
            setParsedSetup(parsed);
          } catch (e) {
            console.warn("JSON parse fallback:", e);
          }
        }
      }
    } catch (err: any) {
      toast({
        title: "AI Assistant Error",
        description: err?.message || "Failed to process AI request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFullBoard = async () => {
    if (!parsedSetup) return;
    setLoading(true);
    try {
      // 1. Update Month Metadata (quote, mood_tag, theme_words, focus_items)
      await visionBoardApi.updateBoardMonth(year, month, {
        quote: parsedSetup.quote,
        mood_tag: parsedSetup.mood_tag,
        theme_words: parsedSetup.theme_words || [],
        focus_items: parsedSetup.focus_items || [],
      });

      // 2. Life Areas
      if (Array.isArray(parsedSetup.life_areas)) {
        await visionBoardApi.upsertLifeAreas(year, month, parsedSetup.life_areas);
      }

      // 3. Goals
      if (Array.isArray(parsedSetup.goals)) {
        for (const g of parsedSetup.goals) {
          await visionBoardApi.addGoal(year, month, {
            title: g.title,
            progressTarget: g.progress_target || 10,
            progressUnit: g.progress_unit || "items",
          });
        }
      }

      // 4. Habits
      if (Array.isArray(parsedSetup.habits)) {
        for (const h of parsedSetup.habits) {
          await visionBoardApi.addHabit(year, month, {
            name: h.name,
            icon: h.icon || "🌱",
          });
        }
      }

      // 5. Vision Cards
      if (Array.isArray(parsedSetup.vision_cards)) {
        for (const vc of parsedSetup.vision_cards) {
          await visionBoardApi.addVisionCard(year, month, {
            title: vc.title,
            emoji: vc.emoji || "✨",
            colorAccent: vc.color_accent || "terracotta",
          });
        }
      }

      // 6. Events
      if (Array.isArray(parsedSetup.events)) {
        for (const ev of parsedSetup.events) {
          await visionBoardApi.addEvent(year, month, {
            title: ev.title,
            date: ev.event_date || ev.date,
            time: ev.event_time || "09:00",
            color: ev.color || "terracotta",
            recurrence: ev.recurrence || "none",
            notify: true,
          });
        }
      }

      // 7. Reflection Notes
      if (parsedSetup.notes) {
        await visionBoardApi.upsertNotes(year, month, parsedSetup.notes);
      }

      toast({
        title: "Whole Month Generated & Applied! 🎉",
        description: "Manifestation, goals, habits, cards, and calendar events created successfully.",
      });

      setParsedSetup(null);
      setAiResult(null);
      if (onRefreshBoard) onRefreshBoard();
    } catch (e: any) {
      toast({
        title: "Failed to apply full month",
        description: e?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetBoard = async () => {
    setResetting(true);
    try {
      await visionBoardApi.resetBoard(year, month);
      toast({
        title: "Month Board Reset",
        description: "All goals, habits, cards, events, and notes for this month have been cleared.",
      });
      setShowResetConfirm(false);
      if (onRefreshBoard) onRefreshBoard();
    } catch (e: any) {
      toast({
        title: "Reset Error",
        description: e?.message,
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="vb-section vb-ai-section border border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-background to-amber-500/5 backdrop-blur-md rounded-2xl p-6 mb-6 shadow-lg shadow-amber-500/5">
      {/* Header with AI Icon and Subtext */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <Wand2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
              Vision Board AI Copilot
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              Create Whole Month · Ask · Analyse
            </p>
          </div>
        </div>

        {/* Action Tabs & Reset */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveAction("create")}
            className={`vb-chip-add text-xs flex items-center gap-1.5 ${activeAction === "create" ? "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 font-semibold" : ""}`}
          >
            <Wand2 className="w-3.5 h-3.5" /> ✨ Create Month
          </button>
          <button
            onClick={() => setActiveAction("ask")}
            className={`vb-chip-add text-xs flex items-center gap-1.5 ${activeAction === "ask" ? "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 font-semibold" : ""}`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> 💬 Ask
          </button>
          <button
            onClick={() => { setActiveAction("analyse"); handleRunAI("analyse"); }}
            className={`vb-chip-add text-xs flex items-center gap-1.5 ${activeAction === "analyse" ? "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 font-semibold" : ""}`}
          >
            <BarChart2 className="w-3.5 h-3.5" /> 📊 Analyse
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="vb-chip-add text-xs text-red-600 hover:text-red-700 border-red-500/30 hover:bg-red-500/10 flex items-center gap-1"
            title="Reset/clear this month's board data"
          >
            <Trash2 className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Mode 1: Create Month Prompt */}
      {activeAction === "create" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunAI("create");
          }}
          className="space-y-3 mb-4"
        >
          <textarea
            placeholder="Describe what you want to achieve for this month (e.g. 'I want to launch my SaaS, train for a 10k run, read 2 books, and build daily meditation habits')..."
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            className="vb-form-input w-full min-h-[70px] resize-none !mb-0 text-xs"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="vb-btn-primary text-xs flex items-center gap-1.5"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              Generate Whole Month Setup
            </button>
          </div>
        </form>
      )}

      {/* Mode 2: Ask Prompt */}
      {activeAction === "ask" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunAI("ask");
          }}
          className="flex items-center gap-2 mb-4"
        >
          <input
            type="text"
            placeholder="Ask anything about your month, goals, habits, or schedule..."
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            className="vb-form-input flex-1 !mb-0 text-xs"
          />
          <button
            type="submit"
            disabled={loading}
            className="vb-btn-primary text-xs flex items-center gap-1.5 whitespace-nowrap"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Ask AI
          </button>
        </form>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground font-medium">
          <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
          Synthesizing monthly vision board architecture & schedule...
        </div>
      )}

      {/* AI Response Display */}
      {aiResult && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/80 border border-border rounded-xl p-4 text-xs text-foreground space-y-3"
        >
          {parsedSetup ? (
            <div className="space-y-4">
              <div className="border-b border-border/60 pb-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600">Generated Manifestation Statement</span>
                <p className="text-sm font-serif italic text-foreground mt-1">"{parsedSetup.quote}"</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {parsedSetup.theme_words?.map((w: string, idx: number) => (
                    <span key={idx} className="vb-theme-chip text-[11px]">{w}</span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {parsedSetup.goals?.length > 0 && (
                  <div className="bg-muted/50 p-2.5 rounded-lg">
                    <span className="font-semibold text-foreground block mb-1">🎯 Goals ({parsedSetup.goals.length})</span>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                      {parsedSetup.goals.map((g: any, i: number) => (
                        <li key={i}>{g.title} ({g.progress_target} {g.progress_unit})</li>
                      ))}
                    </ul>
                  </div>
                )}

                {parsedSetup.habits?.length > 0 && (
                  <div className="bg-muted/50 p-2.5 rounded-lg">
                    <span className="font-semibold text-foreground block mb-1">🌱 Daily Habits ({parsedSetup.habits.length})</span>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                      {parsedSetup.habits.map((h: any, i: number) => (
                        <li key={i}>{h.icon} {h.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button
                onClick={handleApplyFullBoard}
                className="vb-btn-primary text-xs w-full justify-center py-2.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Apply Full Month Setup to Board
              </button>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed font-serif">
              {aiResult}
            </div>
          )}
        </motion.div>
      )}

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="vb-form-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="vb-add-form"
            >
              <div className="flex items-center gap-2 mb-3 text-red-600 font-semibold text-base">
                <AlertTriangle className="w-5 h-5" />
                Reset Month Board ({month}/{year})
              </div>
              <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
                Are you sure you want to clear all goals, habits, cards, events, and notes for this month? This action cannot be undone.
              </p>
              <div className="vb-form-actions">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="vb-btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetBoard}
                  disabled={resetting}
                  className="vb-btn-primary !bg-red-600 text-xs flex items-center gap-1.5"
                >
                  {resetting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Confirm Reset Board
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
