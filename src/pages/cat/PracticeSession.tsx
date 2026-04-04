import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Flag,
  Pause,
  Play,
  StopCircle,
  Timer,
  RotateCcw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { catApi } from "@/api/cat";
import type { Problem, ProblemAttemptResponse } from "@/types/cat";

interface PracticeSessionProps {
  session: any;
  questions: Problem[];
  onComplete: () => void;
  onExit: () => void;
}

export default function PracticeSession({
  session,
  questions,
  onComplete,
  onExit,
}: PracticeSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [reviewMode, setReviewMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(session.time_limit_seconds || 0);
  const [isPaused, setIsPaused] = useState(false);
  const [results, setResults] = useState<
    Record<string, ProblemAttemptResponse>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // Timer effect
  useEffect(() => {
    if (!session.time_limit_seconds || isPaused || reviewMode) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, reviewMode, session.time_limit_seconds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (value: string) => {
    if (reviewMode) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmitSession = async () => {
    setSubmitting(true);
    try {
      // Submit all answers
      await catApi.completePractice(session.id);
      setReviewMode(true);
      toast({ title: "Session completed!" });
      onComplete();
    } catch (error) {
      toast({ title: "Failed to submit session", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Render Review View
  if (reviewMode) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              Session Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{questions.length}</p>
                <p className="text-sm text-muted-foreground">Total Questions</p>
              </div>
              <div className="p-4 bg-emerald-500/10 rounded-lg">
                {/* Correct count logic would need server validation response */}
                <p className="text-2xl font-bold text-emerald-500">Completed</p>
                <p className="text-sm text-muted-foreground">Status</p>
              </div>
              <div className="p-4 bg-blue-500/10 rounded-lg">
                <p className="text-2xl font-bold text-blue-500">
                  {formatTime(session.time_limit_seconds - timeLeft)}
                </p>
                <p className="text-sm text-muted-foreground">Time Taken</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button onClick={onExit}>Return to Practice</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="sticky top-4 z-10 shadow-md border-primary/20">
        <CardContent className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onExit}>
              <XCircle className="h-5 w-5" />
            </Button>
            <div>
              <p className="font-medium">
                Question {currentIndex + 1} of {questions.length}
              </p>
              <Progress value={progress} className="w-32 h-2 mt-1" />
            </div>
          </div>

          {session.time_limit_seconds && (
            <div
              className={cn(
                "flex items-center gap-2 font-mono text-lg font-bold px-3 py-1 rounded",
                timeLeft < 60 ? "bg-red-500/10 text-red-500" : "bg-muted",
              )}
            >
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant={isLastQuestion ? "default" : "outline"}
              onClick={isLastQuestion ? handleSubmitSession : handleNext}
              disabled={submitting}
            >
              {isLastQuestion ? "Submit" : "Next"}{" "}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card className="min-h-[400px] flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline">
                  {currentQuestion.question_type.toUpperCase()}
                </Badge>
                <Badge
                  variant={
                    currentQuestion.difficulty === "easy"
                      ? "secondary"
                      : currentQuestion.difficulty === "medium"
                        ? "default"
                        : "destructive"
                  }
                >
                  {currentQuestion.difficulty}
                </Badge>
              </div>
              <CardTitle className="text-xl leading-relaxed">
                {currentQuestion.question_text ||
                  (currentQuestion as any).content}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {currentQuestion.question_type === "mcq" &&
              currentQuestion.options &&
              Object.keys(currentQuestion.options).length > 0 ? (
                <RadioGroup
                  value={answers[currentQuestion.id] || ""}
                  onValueChange={handleAnswer}
                  className="space-y-3"
                >
                  {Object.entries(
                    currentQuestion.options as Record<string, string>,
                  ).map(([key, value]) => (
                    <div
                      key={key}
                      className={cn(
                        "flex items-center space-x-2 border rounded-lg p-4 cursor-pointer transition-colors",
                        answers[currentQuestion.id] === key
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted",
                      )}
                    >
                      <RadioGroupItem value={key} id={key} />
                      <Label
                        htmlFor={key}
                        className="flex-1 cursor-pointer font-normal"
                      >
                        <span className="font-bold mr-2">{key}.</span> {value}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="space-y-4">
                  <Label>Your Answer</Label>
                  <Input
                    placeholder="Enter your numerical answer"
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleAnswer(e.target.value)}
                    className="text-lg font-mono"
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-between border-t py-4 bg-muted/20">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button variant="ghost">
                <Flag className="h-4 w-4 mr-1" /> Report Issue
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
