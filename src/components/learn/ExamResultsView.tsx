import React from "react";
import { ExamSubmission } from "@/types/education";
import { PlanProgressRing } from "./PlanProgressRing";
import { CheckCircle2, XCircle, TrendingUp, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ExamResultsViewProps {
  submission: ExamSubmission;
}

export function ExamResultsView({ submission }: ExamResultsViewProps) {
  const { percentage, ai_feedback } = submission;

  let scoreColor = "text-red-500";
  if (percentage >= 80) scoreColor = "text-teal-500";
  else if (percentage >= 60) scoreColor = "text-amber-500";

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
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold mb-2">Quiz Results</h2>
          <div className="prose prose-invert prose-teal max-w-none text-muted-foreground text-sm">
            <ReactMarkdown>{ai_feedback.general_summary}</ReactMarkdown>
          </div>
        </div>
      </div>

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
        <h3 className="text-xl font-bold mb-6">Detailed Review</h3>
        <Accordion type="multiple" className="space-y-4">
          {ai_feedback.graded_questions.map((q, i) => (
            <AccordionItem
              key={q.question_id}
              value={q.question_id}
              className="border border-border/30 rounded-2xl px-6 bg-card/5"
            >
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-4 text-left">
                  {q.score > 0 ? (
                    <CheckCircle2 className="w-6 h-6 text-teal-500 shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500 shrink-0" />
                  )}
                  <span className="font-semibold text-lg">{q.question}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-4 ml-10">
                  <div className="bg-muted/30 p-4 rounded-xl border border-border/30">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1 block">
                      Your Answer:
                    </span>
                    <p className="text-foreground/90">{q.student_answer}</p>
                  </div>

                  {q.score === 0 && (
                    <div className="bg-teal-500/10 p-4 rounded-xl border border-teal-500/20">
                      <span className="text-xs uppercase tracking-wider text-teal-500 font-bold mb-1 block">
                        Correct Answer:
                      </span>
                      <p className="text-teal-400">{q.correct_answer}</p>
                    </div>
                  )}

                  <div className="mt-4 prose prose-invert prose-sm text-muted-foreground">
                    <ReactMarkdown>{q.feedback}</ReactMarkdown>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
