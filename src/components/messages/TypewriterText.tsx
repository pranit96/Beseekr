import { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  children?: (typedText: string, isComplete: boolean) => React.ReactNode;
}

export const TypewriterText = ({
  text,
  speed = 300,
  onComplete,
  children,
}: TypewriterTextProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
    setDisplayedText('');
    setIsComplete(false);
    startTimeRef.current = undefined;

    if (!text) {
      setIsComplete(true);
      onComplete?.();
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const charactersToShow = Math.floor((elapsed / 1000) * speed);

      if (charactersToShow >= textRef.current.length) {
        setDisplayedText(textRef.current);
        setIsComplete(true);
        onComplete?.();
        return;
      }

      setDisplayedText(textRef.current.slice(0, charactersToShow));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [text, speed, onComplete]);

  // If there's a render function, use it
  if (children) {
    return <>{children(displayedText, isComplete)}</>;
  }

  // Default fallback (text only)
  return (
    <>
      <span>{displayedText}</span>
      {!isComplete && (
        <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-1 align-middle" />
      )}
    </>
  );
};
