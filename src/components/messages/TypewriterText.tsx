import { useState, useEffect, useRef } from "react";

interface TypewriterTextProps {
  text: string;
  speed?: number; // milliseconds per character
  onComplete?: () => void;
  children?: (typedText: string, isComplete: boolean) => React.ReactNode;
}

export const TypewriterText = ({
  text,
  speed = 1,
  onComplete,
  children,
}: TypewriterTextProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const rafRef = useRef<number>();
  const lastTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (!text) {
      setDisplayedText("");
      setIsComplete(true);
      onComplete?.();
      return;
    }

    // Reset state when text changes
    setDisplayedText("");
    setIsComplete(false);
    indexRef.current = 0;
    lastTimestampRef.current = 0;

    const step = (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      const elapsed = timestamp - lastTimestampRef.current;

      // Advance only when elapsed time exceeds the speed per character
      if (elapsed >= speed) {
        lastTimestampRef.current = timestamp;
        indexRef.current += 1;
        setDisplayedText(text.slice(0, indexRef.current));
      }

      if (indexRef.current < text.length) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setIsComplete(true);
        onComplete?.();
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [text, speed, onComplete]);

  // Render with provided render prop (for MarkdownRenderer integration)
  if (children) {
    return <>{children(displayedText, isComplete)}</>;
  }

  // Default display (plain text typewriter)
  return (
    <span>
      {displayedText}
      {!isComplete && (
        <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-1 align-middle" />
      )}
    </span>
  );
};
