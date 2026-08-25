import React, { useState } from "react";
import { Exam, ExamAnswer, ExamSubmission } from "@/types/education";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ClipboardList,
  Sparkles,
  Loader2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Moon,
  Crown,
  Clock,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ExamResultsView } from "./ExamResultsView";

interface QuizTabProps {
  exam: Exam | null;
  submission: ExamSubmission | null;
  isLoading: boolean;
  isGenerating: boolean;
  isSubmitting: boolean;
  onGenerate: () => void;
  onSubmit: (answers: ExamAnswer[]) => void;
  isQueuedForOffPeak?: boolean;
  onUpgradeClick?: () => void;
}

export function QuizTab({
  exam,
  submission,
  isLoading,
  isGenerating,
  isSubmitting,
  onGenerate,
  onSubmit,
  isQueuedForOffPeak = false,
  onUpgradeClick,
}: QuizTabProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // If there's a submission, show the results view
  if (submission) {
    return <ExamResultsView submission={submission} />;
  }

  // Off-Peak Scheduled Queue State for Free Tier
  if (isQueuedForOffPeak && (!exam || !exam.questions || exam.questions.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 text-center min-h-[420px]">
        <div className="p-8 max-w-xl w-full rounded-3xl bg-gradient-to-b from-teal-500/10 via-card/40 to-card/20 border border-teal-500/30 shadow-2xl backdrop-blur-sm space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto border border-teal-500/30 shadow-lg shadow-teal-500/10">
            <Moon className="w-8 h-8 text-teal-300" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-xs font-semibold text-teal-300">
              <Clock className="w-3.5 h-3.5" />
              Off-Peak Batch Queued
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground">
              Quiz Queued for Off-Peak Generation at 4:00 AM IST
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Assessment quizzes are generated alongside your study guide in our nightly off-peak batch. Your topic quiz will be ready tomorrow morning!
            </p>
          </div>

          <div className="pt-2 border-t border-border/40 space-y-3">
            <p className="text-xs text-amber-400/90 font-medium">
              Want instant AI quizzes and grading right now with Claude Sonnet?
            </p>
            <Button
              onClick={onUpgradeClick}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/20 h-11 rounded-xl gap-2"
            >
              <Crown className="w-4 h-4 text-amber-200" />
              Upgrade to Ultra for Instant Quizzes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state (fetching exam or generating)
  if (isLoading || isGenerating) {
    return (
      <div className="space-y-6 p-4 max-w-3xl mx-auto">
        {/* Active Generation Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-card/20 border border-teal-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-teal-500/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
            </div>
            <div>
              <h4 className="text-base font-bold text-foreground">
                Generating Topic Quiz
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Creating AI multiple-choice and conceptual assessment questions...
              </p>
            </div>
          </div>

          <Button disabled className="bg-teal-500/30 text-teal-300 border border-teal-500/40 cursor-not-allowed shrink-0">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Generating...
          </Button>
        </div>

        <Skeleton className="h-10 w-1/2 mx-auto" />
        <Skeleton className="h-4 w-1/4 mx-auto mb-6" />
        <div className="border border-border/50 p-8 rounded-3xl space-y-6 bg-card/5">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state (no exam yet)
  if (!exam || !exam.questions || exam.questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
        <div className="w-16 h-16 bg-teal-500/10 text-teal-500 rounded-full flex items-center justify-center mb-6 border border-teal-500/20">
          <ClipboardList className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold mb-2">Test Your Knowledge</h3>
        <p className="text-muted-foreground mb-8 max-w-md">
          Generate an AI-powered topic quiz to verify your understanding. The AI
          will grade your answers and provide feedback.
        </p>
        <Button
          onClick={onGenerate}
          disabled={isLoading || isGenerating}
          size="lg"
          className="bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/20"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Quiz...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Topic Quiz
            </>
          )}
        </Button>
      </div>
    );
  }

  const question = exam.questions[currentQuestionIdx];
  const isLastQuestion = currentQuestionIdx === exam.questions.length - 1;
  const isFirstQuestion = currentQuestionIdx === 0;
  const allAnswered = exam.questions.every((q) => !!answers[q.id]);

  const handleNext = () => {
    if (!isLastQuestion) setCurrentQuestionIdx((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (!isFirstQuestion) setCurrentQuestionIdx((prev) => prev - 1);
  };

  const handleSubmit = () => {
    const formattedAnswers: ExamAnswer[] = exam.questions.map((q) => {
      const ans = answers[q.id] || "";
      if (q.type === "mcq") {
        return { question_id: q.id, selected_option: ans };
      }
      return { question_id: q.id, text_answer: ans };
    });

    onSubmit(formattedAnswers);
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">{exam.title}</h2>
        <p className="text-muted-foreground text-sm uppercase tracking-wider">
          Question {currentQuestionIdx + 1} of {exam.questions.length}
        </p>

        {/* Question Selector Pills */}
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          {exam.questions.map((q, idx) => {
            const isAnswered = Boolean(answers[q.id]?.trim());
            const isCurrent = idx === currentQuestionIdx;
            return (
              <button
                key={q.id || idx}
                type="button"
                onClick={() => setCurrentQuestionIdx(idx)}
                className={`w-8 h-8 rounded-full text-xs font-semibold transition-all ${
                  isCurrent
                    ? "bg-teal-500 text-white shadow-md shadow-teal-500/30 scale-110 ring-2 ring-teal-400/50"
                    : isAnswered
                      ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                      : "bg-card/40 text-muted-foreground border border-border/40 hover:bg-card/60"
                }`}
                aria-label={`Jump to question ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted/50 rounded-full h-1.5 mt-5 overflow-hidden">
          <div
            className="bg-teal-500 h-full transition-all duration-300"
            style={{
              width: `${((currentQuestionIdx + 1) / exam.questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="bg-card/5 border border-border/30 p-6 md:p-10 rounded-3xl shadow-lg backdrop-blur-sm min-h-[400px] flex flex-col">
        <h3 className="text-xl md:text-2xl font-medium leading-relaxed mb-8">
          {question.question}
        </h3>

        <div className="flex-1 mb-8">
          {question.type === "mcq" && question.options ? (
            <RadioGroup
              value={answers[question.id] || ""}
              onValueChange={(val) =>
                setAnswers((prev) => ({ ...prev, [question.id]: val }))
              }
              className="space-y-4"
            >
              {question.options.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <RadioGroupItem
                    value={option}
                    id={`q${question.id}-opt${idx}`}
                    className="border-teal-500/50 text-teal-500"
                  />
                  <Label
                    htmlFor={`q${question.id}-opt${idx}`}
                    className="text-base font-normal cursor-pointer leading-relaxed flex-1 p-4 rounded-xl border border-border/30 hover:bg-card/30 transition-colors"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <Textarea
              placeholder="Type your answer here..."
              value={answers[question.id] || ""}
              onChange={(e) =>
                setAnswers((prev) => ({
                  ...prev,
                  [question.id]: e.target.value,
                }))
              }
              className="min-h-[200px] text-base resize-y bg-background/50 border-border/50 p-4 rounded-xl"
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-auto pt-6 border-t border-border/30">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={isFirstQuestion || isSubmitting}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {isLastQuestion ? (
            <Button
              className="bg-teal-500 hover:bg-teal-600 text-white"
              onClick={handleSubmit}
              disabled={!allAnswered || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Grading...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" /> Submit Quiz
                </>
              )}
            </Button>
          ) : (
            <Button
              className="bg-teal-500/10 text-teal-500 hover:bg-teal-500/20"
              onClick={handleNext}
              disabled={!answers[question.id]}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {!allAnswered && isLastQuestion && (
        <p className="text-center text-sm text-amber-500 mt-4 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" /> Please answer all questions before
          submitting.
        </p>
      )}
    </div>
  );
}

// Temporary import for the Check icon used above
import { Check } from "lucide-react";
