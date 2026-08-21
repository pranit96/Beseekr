import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flashcard, FlashcardRating } from "@/types/education";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, X, RotateCcw } from "lucide-react";

interface FlashcardsTabProps {
  flashcards: Flashcard[] | null;
  onRate: (index: number, rating: FlashcardRating) => void;
}

export function FlashcardsTab({ flashcards, onRate }: FlashcardsTabProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
        <div className="w-16 h-16 bg-card/5 text-muted-foreground rounded-full flex items-center justify-center mb-6 border border-border/50">
          <RefreshCw className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold mb-2">No Flashcards Available</h3>
        <p className="text-muted-foreground max-w-md">
          Flashcards are generated automatically as part of the study guide. Go
          to the Learn tab to generate them.
        </p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRate = (rating: FlashcardRating) => {
    onRate(currentIndex, rating);
    setIsFlipped(false);

    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setSessionCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
  };

  if (sessionCompleted) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
        <div className="w-16 h-16 bg-teal-500/10 text-teal-500 rounded-full flex items-center justify-center mb-6">
          <Check className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Session Complete!</h3>
        <p className="text-muted-foreground mb-8">
          You've reviewed all {flashcards.length} cards in this topic.
        </p>
        <Button onClick={handleRestart} variant="outline" className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Review Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center max-w-3xl mx-auto py-8 px-4">
      <div className="w-full flex justify-between text-sm text-muted-foreground mb-6 px-4">
        <span>
          Card {currentIndex + 1} of {flashcards.length}
        </span>
        <span className="uppercase tracking-wider">{currentCard.tier}</span>
      </div>

      <div
        className="w-full aspect-[4/3] md:aspect-[16/9] perspective-1000 cursor-pointer"
        onClick={handleFlip}
      >
        <motion.div
          className="w-full h-full relative preserve-3d"
          animate={{ rotateX: isFlipped ? 180 : 0 }}
          transition={{
            duration: 0.6,
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden w-full h-full p-8 md:p-12 flex flex-col justify-center items-center text-center bg-card/5 border border-border/30 rounded-3xl shadow-lg backdrop-blur-sm">
            <h3 className="text-2xl md:text-3xl font-bold leading-tight">
              {currentCard.question}
            </h3>
            <p className="mt-8 text-sm text-muted-foreground flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Click to reveal answer
            </p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 backface-hidden w-full h-full p-8 md:p-12 flex flex-col justify-center text-left bg-teal-500/[0.03] border border-teal-500/20 rounded-3xl shadow-lg backdrop-blur-sm"
            style={{ transform: "rotateX(180deg)" }}
          >
            <div className="prose prose-invert prose-teal max-w-none overflow-y-auto custom-scrollbar">
              <h4 className="text-teal-500 font-semibold mb-4 uppercase tracking-wider text-sm">
                Answer
              </h4>
              <p className="text-lg md:text-xl leading-relaxed">
                {currentCard.answer}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-8 w-full max-w-md"
          >
            <p className="text-center text-sm text-muted-foreground mb-4">
              How hard was it to recall?
            </p>
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="outline"
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20 h-12"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRate("again");
                }}
              >
                Again
              </Button>
              <Button
                variant="outline"
                className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border-orange-500/20 h-12"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRate("hard");
                }}
              >
                Hard
              </Button>
              <Button
                variant="outline"
                className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-500 border-teal-500/20 h-12"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRate("good");
                }}
              >
                Good
              </Button>
              <Button
                variant="outline"
                className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border-blue-500/20 h-12"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRate("easy");
                }}
              >
                Easy
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
