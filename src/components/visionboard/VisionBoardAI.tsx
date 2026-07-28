import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Compass, CheckCircle2, RefreshCw, BarChart2, Calendar, Lightbulb } from "lucide-react";
import { visionBoardApi } from "@/api/visionboard";
import { useToast } from "@/components/ui/use-toast";

interface VisionBoardAIProps {
  year: number;
  month: number;
  onRefreshBoard?: () => void;
}

type AIAction = "ask" | "define" | "analyse" | "expand_horizon";

export function VisionBoardAI({ year, month, onRefreshBoard }: VisionBoardAIProps) {
  const { toast } = useToast();
  const [activeAction, setActiveAction] = useState<AIAction>("ask");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [parsedSchedule, setParsedSchedule] = useState<any | null>(null);

  const handleRunAI = async (actionOverride?: AIAction) => {
    const actionToRun = actionOverride || activeAction;
    setLoading(true);
    setAiResult(null);
    setParsedSchedule(null);

    try {
      const res = await visionBoardApi.aiAssistant(year, month, actionToRun, query);
      if (res?.data?.result) {
        setAiResult(res.data.result);

        // If action is define, attempt JSON parsing
        if (actionToRun === "define") {
          try {
            const cleanJson = res.data.result.replace(/```json\n?|\n?```/g, "").trim();
            const parsed = JSON.parse(cleanJson);
            setParsedSchedule(parsed);
          } catch (e) {
            // Text format fallback
          }
        }
      }
    } catch (err: any) {
      toast({
        title: "AI Assistant Error",
        description: err?.message || "Failed to generate AI response",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplySchedule = async () => {
    if (!parsedSchedule) return;
    try {
      // Apply theme words & focus items if available
      if (parsedSchedule.theme_words || parsedSchedule.focus_items) {
        await visionBoardApi.updateBoardMonth(year, month, {
          theme_words: parsedSchedule.theme_words || [],
          focus_items: parsedSchedule.focus_items || [],
        });
      }

      // Add suggested goals
      if (Array.isArray(parsedSchedule.suggested_goals)) {
        for (const g of parsedSchedule.suggested_goals) {
          await visionBoardApi.addGoal(year, month, {
            title: g.title,
            progressTarget: g.progress_target || 10,
            progressUnit: g.progress_unit || "items",
          });
        }
      }

      // Add suggested habits
      if (Array.isArray(parsedSchedule.suggested_habits)) {
        for (const h of parsedSchedule.suggested_habits) {
          await visionBoardApi.addHabit(year, month, {
            name: h.name,
            icon: h.icon || "⚡",
          });
        }
      }

      toast({
        title: "Schedule Applied!",
        description: "Suggested goals, habits, and focus items added to your vision board.",
      });

      if (onRefreshBoard) onRefreshBoard();
    } catch (e: any) {
      toast({
        title: "Failed to Apply Schedule",
        description: e?.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="vb-section vb-ai-section border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 backdrop-blur-md rounded-2xl p-6 mb-6">
      {/* Header with AI Icon and Subtext */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
              Vision Board AI Copilot
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              Ask, Define, Analyse, or Expand Horizon
            </p>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => { setActiveAction("ask"); }}
            className={`vb-chip-add text-xs ${activeAction === "ask" ? "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-400 font-semibold" : ""}`}
          >
            💬 Ask
          </button>
          <button
            onClick={() => { setActiveAction("define"); handleRunAI("define"); }}
            className={`vb-chip-add text-xs ${activeAction === "define" ? "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-400 font-semibold" : ""}`}
          >
            🗓 Define Schedule
          </button>
          <button
            onClick={() => { setActiveAction("analyse"); handleRunAI("analyse"); }}
            className={`vb-chip-add text-xs ${activeAction === "analyse" ? "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-400 font-semibold" : ""}`}
          >
            📊 Analyse Progress
          </button>
          <button
            onClick={() => { setActiveAction("expand_horizon"); handleRunAI("expand_horizon"); }}
            className={`vb-chip-add text-xs ${activeAction === "expand_horizon" ? "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-400 font-semibold" : ""}`}
          >
            🚀 Expand Horizon
          </button>
        </div>
      </div>

      {/* Input area for "Ask" mode */}
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
            placeholder="Ask AI anything about your month, goals, or balance..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="vb-form-input flex-1 !mb-0"
          />
          <button
            type="submit"
            disabled={loading}
            className="vb-btn-primary flex items-center gap-1.5 whitespace-nowrap"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Ask AI
          </button>
        </form>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground font-medium">
          <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
          Analyzing board context & synthesizing advice...
        </div>
      )}

      {/* AI Response Display */}
      {aiResult && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/70 border border-border/80 rounded-xl p-4 text-sm text-foreground space-y-3"
        >
          {parsedSchedule ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-amber-600 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Proposed Month Roadmap
                </h4>
                <p className="text-xs text-muted-foreground mt-1">{parsedSchedule.summary}</p>
              </div>

              {parsedSchedule.suggested_goals?.length > 0 && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suggested Goals</span>
                  <ul className="list-disc list-inside text-xs space-y-1 mt-1">
                    {parsedSchedule.suggested_goals.map((g: any, i: number) => (
                      <li key={i}><strong>{g.title}</strong> ({g.progress_target} {g.progress_unit})</li>
                    ))}
                  </ul>
                </div>
              )}

              {parsedSchedule.suggested_habits?.length > 0 && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suggested Habits</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {parsedSchedule.suggested_habits.map((h: any, i: number) => (
                      <span key={i} className="vb-theme-chip text-xs">{h.icon} {h.name}</span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleApplySchedule}
                className="vb-btn-primary text-xs w-full justify-center mt-3"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Apply Schedule & Goals to Board
              </button>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed font-serif">
              {aiResult}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
