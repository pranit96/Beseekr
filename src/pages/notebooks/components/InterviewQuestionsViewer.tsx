// src/pages/notebooks/components/InterviewQuestionsViewer.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Interview questions viewer with expandable answers and type filtering.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Mic, Tag, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InterviewQuestion {
  id: number;
  question: string;
  type: string;
  difficulty: string;
  model_answer: string;
  key_points: string[];
  follow_up?: string | null;
}

interface InterviewData {
  title: string;
  summary: string;
  total_questions: number;
  questions: InterviewQuestion[];
}

interface Props {
  data: InterviewData;
}

const TYPE_COLORS: Record<string, string> = {
  conceptual: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  behavioral: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  technical: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  situational: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  analytical: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
};

const DIFF_COLORS: Record<string, string> = {
  entry: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
  mid: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30",
  senior: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
};

const QUESTION_TYPES = ["all", "conceptual", "behavioral", "technical", "situational", "analytical"];
const DIFFICULTY_LEVELS = ["all", "entry", "mid", "senior"];

export function InterviewQuestionsViewer({ data }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [typeFilter, setTypeFilter] = useState("all");
  const [diffFilter, setDiffFilter] = useState("all");

  const questions = data.questions || [];

  const filtered = questions.filter((q) => {
    const typeOk = typeFilter === "all" || q.type === typeFilter;
    const diffOk = diffFilter === "all" || q.difficulty === diffFilter;
    return typeOk && diffOk;
  });

  const toggle = (id: number) => {
    setExpandedIds((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const expandAll = () => setExpandedIds(new Set(filtered.map((q) => q.id)));
  const collapseAll = () => setExpandedIds(new Set());

  if (!questions.length) return <p className="text-center text-muted-foreground py-10">No interview questions generated.</p>;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Mic className="h-5 w-5 text-indigo-600" />
          {data.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{data.summary}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" /> Type:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUESTION_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium border transition-all capitalize",
                typeFilter === t
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-border hover:border-indigo-400",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground ml-2">
          Level:
        </div>
        <div className="flex gap-1.5">
          {DIFFICULTY_LEVELS.map((d) => (
            <button
              key={d}
              onClick={() => setDiffFilter(d)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium border transition-all capitalize",
                diffFilter === d
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-border hover:border-indigo-400",
              )}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll}>Expand All</Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>Collapse</Button>
        </div>
      </div>

      {/* Stats */}
      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {questions.length} questions
      </p>

      {/* Questions */}
      <div className="space-y-3">
        {filtered.map((q, index) => {
          const isOpen = expandedIds.has(q.id);
          return (
            <div
              key={q.id}
              className="rounded-xl border overflow-hidden transition-all"
            >
              <button
                onClick={() => toggle(q.id)}
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-sm font-medium leading-relaxed">{q.question}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge className={cn("text-xs capitalize", TYPE_COLORS[q.type] || "")}>
                      {q.type}
                    </Badge>
                    <Badge className={cn("text-xs capitalize", DIFF_COLORS[q.difficulty] || "")}>
                      {q.difficulty}
                    </Badge>
                  </div>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 mt-0.5 transition-transform duration-200", isOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0 space-y-4 bg-muted/20 border-t">
                      {/* Model answer */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 pt-3">
                          Model Answer
                        </p>
                        <p className="text-sm leading-relaxed">{q.model_answer}</p>
                      </div>

                      {/* Key points */}
                      {q.key_points?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <Tag className="h-3 w-3" /> What interviewers look for
                          </p>
                          <ul className="space-y-1.5">
                            {q.key_points.map((point, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Follow-up */}
                      {q.follow_up && (
                        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
                          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                            Likely Follow-up
                          </p>
                          <p className="text-sm text-amber-800 dark:text-amber-300 italic">"{q.follow_up}"</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No questions match the selected filters.
        </div>
      )}
    </div>
  );
}

