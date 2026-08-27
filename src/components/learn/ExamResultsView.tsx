import React from "react";
import { ExamSubmission } from "@/types/education";
import { PlanProgressRing } from "./PlanProgressRing";
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ExamResultsViewProps {
  submission: ExamSubmission;
  onNextChapter?: () => void;
  nextTopicName?: string;
  onRetakeQuiz?: () => void;
  isRetaking?: boolean;
}

export function ExamResultsView({
  submission,
  onNextChapter,
  nextTopicName,
  onRetakeQuiz,
  isRetaking = false,
}: ExamResultsViewProps) {
  const { percentage, ai_feedback } = submission;

  const passingThreshold =
    submission.passing_threshold ?? ai_feedback?.passing_threshold ?? 70;
  const isPassed =
    typeof submission.passed === "boolean"
      ? submission.passed
      : typeof ai_feedback?.passed === "boolean"
        ? ai_feedback.passed
        : submission.attempt_status === "success" ||
          percentage >= passingThreshold;

  const retriesRemaining =
    submission.retries_remaining ?? ai_feedback?.retries_remaining ?? 3;
  const nextRetryAt =
    submission.next_retry_available_at ??
    ai_feedback?.next_retry_available_at ??
    null;

  const canRetake = retriesRemaining > 0 || !nextRetryAt;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Top Header: Score & Summary */}
      <div className="bg-card/5 border border-border/30 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-lg backdrop-blur-sm">
        <div className="flex-shrink-0">
          <PlanProgressRing
            percentage={percentage}
            size={160}
            strokeWidth={12}
          />
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
            <h2 className="text-2xl font-bold">Quiz Results</h2>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                isPassed
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                  : "bg-red-500/20 text-red-300 border border-red-500/40"
              }`}
            >
              {isPassed ? "✓ Passed (≥70%)" : "✗ Not Passed (<70%)"}
            </span>
          </div>
          <div className="prose prose-invert prose-teal max-w-none text-muted-foreground text-sm">
            <ReactMarkdown>{ai_feedback.general_summary}</ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Action Banner: Pass vs Retake */}
      {isPassed ? (
        onNextChapter && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-teal-500/15 via-cyan-500/15 to-emerald-500/15 border border-teal-500/30 shadow-xl shadow-teal-500/10">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-base">
                  Chapter Cleared & Unlocked! 🎉
                </h4>
                <p className="text-xs text-muted-foreground">
                  You passed the quiz ({percentage}% ≥ {passingThreshold}%).{" "}
                  {nextTopicName
                    ? `Next up: "${nextTopicName}"`
                    : "You're ready to proceed."}
                </p>
              </div>
            </div>
            <Button
              onClick={onNextChapter}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold shadow-lg shadow-teal-500/20 h-11 px-6 rounded-xl gap-2 transition-all duration-200 hover:scale-[1.02] shrink-0"
            >
              <span>Continue to Next Chapter</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-red-500/15 via-amber-500/15 to-orange-500/15 border border-red-500/30 shadow-xl shadow-red-500/10">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h4 className="font-bold text-foreground text-base">
                  Score: {percentage}% — 70% Required to Advance
                </h4>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                To unlock the next chapter, review the study materials and
                retake the quiz.{" "}
                <span className="font-medium text-foreground/80">
                  ({retriesRemaining} of 3 retries remaining per 8h window)
                </span>
              </p>
            </div>
          </div>

          {onRetakeQuiz && (
            <Button
              onClick={onRetakeQuiz}
              disabled={!canRetake || isRetaking}
              className="bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white font-semibold shadow-lg shadow-amber-500/20 h-11 px-6 rounded-xl gap-2 transition-all duration-200 hover:scale-[1.02] shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetaking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating New Quiz...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake with New Questions</span>
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-teal-500/5 border border-teal-500/20 rounded-2xl p-6">
          <h3 className="flex items-center gap-2 font-bold text-teal-400 mb-4">
            <TrendingUp className="w-5 h-5" /> Strengths
          </h3>
          <ul className="space-y-2">
            {ai_feedback.strengths.map((str, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-foreground/90"
              >
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
          <h3 className="flex items-center gap-2 font-bold text-amber-500 mb-4">
            <AlertTriangle className="w-5 h-5" /> Areas to Improve
          </h3>
          <ul className="space-y-2">
            {ai_feedback.weaknesses.map((wk, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-foreground/90"
              >
                <XCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{wk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Detailed Question Review */}
      <div className="pt-4 border-t border-border/30">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold">Detailed Question Review</h3>
          <span className="text-xs text-muted-foreground">
            {ai_feedback.graded_questions.filter((q) => q.score > 0).length} of {ai_feedback.graded_questions.length} Correct
          </span>
        </div>
        <Accordion type="multiple" className="space-y-4">
          {ai_feedback.graded_questions.map((q, i) => {
            const isCorrect = q.score > 0;
            const studentText = q.student_answer || "No answer provided";
            const correctText = q.correct_answer || "Reference answer not specified";

            return (
              <AccordionItem
                key={q.question_id || i}
                value={q.question_id || `q_${i}`}
                className="border border-border/30 rounded-2xl px-6 bg-card/5 transition-colors duration-200 hover:border-border/50"
              >
                <AccordionTrigger className="hover:no-underline py-6">
                  <div className="flex items-start gap-4 text-left flex-1 min-w-0 pr-4">
                    <span className="shrink-0 mt-0.5">
                      {isCorrect ? (
                        <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                          <CheckCircle2 className="w-4 h-4 text-teal-400" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
                          <XCircle className="w-4 h-4 text-red-400" />
                        </div>
                      )}
                    </span>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground uppercase font-semibold">
                          Question {i + 1}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            isCorrect
                              ? "bg-teal-500/15 text-teal-400 border border-teal-500/30"
                              : "bg-red-500/15 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {isCorrect ? "+1.0 Correct" : "0.0 Incorrect"}
                        </span>
                      </div>
                      <h4 className="font-semibold text-base sm:text-lg text-foreground leading-relaxed">
                        {q.question}
                      </h4>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="pb-6 pt-2">
                  <div className="space-y-4 ml-0 sm:ml-11">
                    {/* Student Answer */}
                    <div
                      className={`p-4 rounded-2xl border ${
                        isCorrect
                          ? "bg-teal-500/10 border-teal-500/30 text-teal-300"
                          : "bg-red-500/10 border-red-500/25 text-red-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs uppercase tracking-wider font-bold opacity-80">
                          Your Answer:
                        </span>
                        <span className="text-xs font-medium opacity-70">
                          {isCorrect ? "✓ Matches correct solution" : "✗ Needs review"}
                        </span>
                      </div>
                      <p className="text-foreground text-sm leading-relaxed font-medium">
                        {studentText}
                      </p>
                    </div>

                    {/* Correct Answer if student got it wrong */}
                    {!isCorrect && (
                      <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/30">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-400 font-bold mb-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Correct Answer / Reference Solution:</span>
                        </div>
                        <p className="text-emerald-300 text-sm leading-relaxed font-medium">
                          {correctText}
                        </p>
                      </div>
                    )}

                    {/* Feedback & Detailed Explanation */}
                    {q.feedback && (
                      <div className="p-4 rounded-2xl bg-card/20 border border-border/40 space-y-1.5">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold block">
                          Explanation & Key Takeaway:
                        </span>
                        <div className="prose prose-invert prose-sm text-muted-foreground leading-relaxed max-w-none">
                          <ReactMarkdown>{q.feedback}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
