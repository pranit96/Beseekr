// src/pages/notebooks/components/QuizViewer.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Interactive MCQ quiz with scoring, explanations, and results screen.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, ChevronRight, Trophy, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: number;
  question: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
}

interface QuizData {
  title: string;
  summary: string;
  total_questions: number;
  estimated_minutes: number;
  questions: QuizQuestion[];
}

interface Props {
  data: QuizData;
}

const DIFF_COLORS = {
  easy: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
  medium: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30",
  hard: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
};

type QuizState = "quiz" | "results";

export function QuizViewer({ data }: Props) {
  const [state, setState] = useState<QuizState>("quiz");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Set<number>>(new Set());

  const questions = data.questions || [];
  const current = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const selectedAnswer = selectedAnswers[currentIndex];
  const isRevealed = revealedQuestions.has(currentIndex);

  const selectAnswer = (option: string) => {
    if (isRevealed) return;
    setSelectedAnswers((s) => ({ ...s, [currentIndex]: option }));
    setRevealedQuestions((s) => new Set([...s, currentIndex]));
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setState("results");
    }
  };

  const reset = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setRevealedQuestions(new Set());
    setState("quiz");
  };

  const score = questions.reduce((acc, q, i) => {
    return acc + (selectedAnswers[i] === q.correct_answer ? 1 : 0);
  }, 0);

  const scorePercent = Math.round((score / questions.length) * 100);

  if (!questions.length) return <p className="text-center text-muted-foreground py-10">No quiz generated.</p>;

  if (state === "results") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 py-8"
      >
        <div className={cn(
          "w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold",
          scorePercent >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
          : scorePercent >= 60 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
          : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
        )}>
          {scorePercent}%
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-bold">
            {scorePercent >= 80 ? "🎉 Excellent!" : scorePercent >= 60 ? "👍 Good job!" : "📚 Keep studying!"}
          </h3>
          <p className="text-muted-foreground mt-1">
            You got {score} out of {questions.length} correct
          </p>
        </div>

        {/* Per-question review */}
        <div className="w-full max-w-2xl space-y-3 mt-4">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Question Review</h4>
          {questions.map((q, i) => {
            const userAns = selectedAnswers[i];
            const isCorrect = userAns === q.correct_answer;
            return (
              <div key={q.id} className={cn(
                "rounded-xl p-4 border",
                isCorrect ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10"
                  : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10"
              )}>
                <div className="flex items-start gap-2">
                  {isCorrect ? <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{q.question}</p>
                    {!isCorrect && userAns && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">Your answer: {userAns}. {q.options[userAns]}</p>
                    )}
                    <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">Correct: {q.correct_answer}. {q.options[q.correct_answer]}</p>
                    <p className="text-xs text-muted-foreground mt-1 italic">{q.explanation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button onClick={reset} className="gap-2 mt-2">
          <RotateCcw className="h-4 w-4" /> Retake Quiz
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">{data.title}</h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>~{data.estimated_minutes} min</span>
            <span>·</span>
            <span>{questions.length} questions</span>
          </div>
        </div>
        <Badge variant="outline" className={cn("capitalize", current && DIFF_COLORS[current.difficulty])}>
          {current?.difficulty}
        </Badge>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Object.keys(selectedAnswers).length} answered</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border bg-card p-6 space-y-5"
        >
          <p className="text-base font-medium leading-relaxed">{current?.question}</p>

          {/* Options */}
          <div className="space-y-2.5">
            {current && Object.entries(current.options).map(([key, value]) => {
              const isSelected = selectedAnswer === key;
              const isCorrect = key === current.correct_answer;
              const showResult = isRevealed;

              return (
                <button
                  key={key}
                  onClick={() => selectAnswer(key)}
                  className={cn(
                    "w-full text-left flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all duration-200",
                    !showResult && "hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20",
                    !showResult && !isSelected && "border-border bg-background",
                    !showResult && isSelected && "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30",
                    showResult && isCorrect && "border-green-500 bg-green-50 dark:bg-green-900/20",
                    showResult && isSelected && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-900/20",
                    showResult && !isCorrect && !isSelected && "border-border opacity-60",
                  )}
                >
                  <span className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full border-2 text-xs font-bold shrink-0 mt-0.5",
                    !showResult && "border-current",
                    showResult && isCorrect && "border-green-500 text-green-600",
                    showResult && isSelected && !isCorrect && "border-red-500 text-red-600",
                  )}>
                    {key}
                  </span>
                  <span className="text-sm leading-relaxed flex-1">{value}</span>
                  {showResult && isCorrect && <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />}
                  {showResult && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {isRevealed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-lg bg-muted/60 border p-4"
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Explanation</p>
              <p className="text-sm leading-relaxed">{current?.explanation}</p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button
          onClick={goNext}
          disabled={!isRevealed}
          className="gap-1.5"
        >
          {currentIndex < questions.length - 1 ? "Next Question" : "See Results"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

