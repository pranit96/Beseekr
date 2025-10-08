import { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

export const TypewriterText = ({ text, speed = 300, onComplete }: TypewriterTextProps) => {
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

  if (isComplete) {
    return <span>{text}</span>;
  }

  return (
    <>
      <span>{displayedText}</span>
      <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-1 align-middle" />
    </>
  );
};