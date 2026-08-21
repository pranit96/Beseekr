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
}

export function QuizTab({
  exam,
  submission,
  isLoading,
  isGenerating,
  isSubmitting,
  onGenerate,
  onSubmit,
}: QuizTabProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // If there's a submission, show the results view
  if (submission) {
    return <ExamResultsView submission={submission} />;
  }

  // Loading state (fetching exam)
  if (isLoading || isGenerating) {
    return (
      <div className="space-y-8 p-4 max-w-3xl mx-auto">
        <Skeleton className="h-10 w-1/2 mx-auto" />
        <Skeleton className="h-4 w-1/4 mx-auto mb-12" />
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
          size="lg"
          className="bg-teal-500 hover:bg-teal-600 text-white"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Generate Topic Quiz
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
    const formattedAnswers: ExamAnswer[] = Object.entries(answers).map(
      ([qId, ans]) => {
        const q = exam.questions.find((x) => x.id === qId);
        if (q?.type === "mcq") {
          return { question_id: qId, selected_option: ans };
        }
        return { question_id: qId, text_answer: ans };
      },
    );

    onSubmit(formattedAnswers);
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">{exam.title}</h2>
        <p className="text-muted-foreground text-sm uppercase tracking-wider">
          Question {currentQuestionIdx + 1} of {exam.questions.length}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-muted/50 rounded-full h-2 mt-6 overflow-hidden">
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
