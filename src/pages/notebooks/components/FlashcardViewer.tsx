// src/pages/notebooks/components/FlashcardViewer.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Beautiful flip-card viewer with keyboard navigation and progress tracking.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw, Lightbulb, CheckCircle, XCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Flashcard {
  id: number;
  front: string;
  back: string;
  category: string;
  hint?: string | null;
}

interface FlashcardsData {
  title: string;
  summary: string;
  difficulty: string;
  flashcards: Flashcard[];
}

interface Props {
  data: FlashcardsData;
}

const CATEGORY_COLORS: Record<string, string> = {
  definition: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  concept: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  process: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  comparison: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  application: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  formula: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
};

export function FlashcardViewer({ data }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());
  const [unknownCards, setUnknownCards] = useState<Set<number>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const cards = data.flashcards || [];
  const current = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  const goNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  }, [currentIndex, cards.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "n") goNext();
      if (e.key === "ArrowLeft" || e.key === "p") goPrev();
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setIsFlipped((f) => !f);
      }
      if (e.key === "g") markKnown();
      if (e.key === "b") markUnknown();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev]);

  const markKnown = () => {
    setKnownCards((s) => new Set([...s, currentIndex]));
    setUnknownCards((s) => { const n = new Set(s); n.delete(currentIndex); return n; });
    goNext();
  };

  const markUnknown = () => {
    setUnknownCards((s) => new Set([...s, currentIndex]));
    setKnownCards((s) => { const n = new Set(s); n.delete(currentIndex); return n; });
    goNext();
  };

  const resetAll = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards(new Set());
    setUnknownCards(new Set());
    setShowHint(false);
  };

  if (!cards.length) return <p className="text-center text-muted-foreground py-10">No flashcards generated.</p>;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">{data.title}</h3>
          <p className="text-sm text-muted-foreground">{data.summary}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <CheckCircle className="h-3 w-3 text-green-500" />
            {knownCards.size}
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <XCircle className="h-3 w-3 text-red-500" />
            {unknownCards.size}
          </Badge>
          <Button variant="ghost" size="sm" onClick={resetAll} className="gap-1.5">
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Card {currentIndex + 1} of {cards.length}</span>
          <span className="capitalize">{data.difficulty} difficulty</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Card */}
      <div
        className="relative h-72 cursor-pointer perspective-1000"
        onClick={() => setIsFlipped((f) => !f)}
        style={{ perspective: "1200px" }}
      >
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Front */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center p-8 rounded-2xl border-2",
              "bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30",
              "border-indigo-200 dark:border-indigo-800",
              isFlipped ? "pointer-events-none" : "",
            )}
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="absolute top-4 left-4">
              <Badge className={cn("text-xs capitalize", CATEGORY_COLORS[current?.category] || "")}>
                {current?.category}
              </Badge>
            </div>
            <div className="absolute top-4 right-4 text-xs text-muted-foreground">
              #{currentIndex + 1} • Click to reveal
            </div>
            <p className="text-center text-xl font-medium leading-relaxed max-w-lg">
              {current?.front}
            </p>
            {current?.hint && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowHint((s) => !s); }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                {showHint ? current.hint : "Show hint"}
              </button>
            )}
          </div>

          {/* Back */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center p-8 rounded-2xl border-2",
              "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
              "border-emerald-200 dark:border-emerald-800",
            )}
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="absolute top-4 right-4 text-xs text-muted-foreground">Answer</div>
            <p className="text-center text-base leading-relaxed max-w-lg">{current?.back}</p>
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={goPrev} disabled={currentIndex === 0} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>

        {isFlipped && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={markUnknown} className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400">
              <XCircle className="h-4 w-4" /> Need Review
            </Button>
            <Button onClick={markKnown} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle className="h-4 w-4" /> Got It
            </Button>
          </div>
        )}
        {!isFlipped && (
          <Button onClick={() => setIsFlipped(true)} variant="secondary" className="gap-1.5">
            <BookOpen className="h-4 w-4" /> Reveal Answer
          </Button>
        )}

        <Button variant="outline" onClick={goNext} disabled={currentIndex === cards.length - 1} className="gap-1.5">
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs text-muted-foreground">
        Use <kbd className="px-1.5 py-0.5 rounded border text-xs">Space</kbd> to flip,{" "}
        <kbd className="px-1.5 py-0.5 rounded border text-xs">→</kbd>{" "}
        <kbd className="px-1.5 py-0.5 rounded border text-xs">←</kbd> to navigate,{" "}
        <kbd className="px-1.5 py-0.5 rounded border text-xs">G</kbd> = got it,{" "}
        <kbd className="px-1.5 py-0.5 rounded border text-xs">B</kbd> = review
      </p>
    </div>
  );
}

