import { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number; // characters per second
  onComplete?: () => void;
}

export const TypewriterText = ({ text, speed = 50, onComplete }: TypewriterTextProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const textRef = useRef(text);

  useEffect(() => {
    // Reset if text changes
    textRef.current = text;
    setDisplayedText('');
    setIsComplete(false);
    
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

  return <>{displayedText}</>;
};

// Hook for managing typewriter state
export const useTypewriter = (initialText: string = '', speed: number = 50) => {
  const [text, setText] = useState(initialText);
  const [isTyping, setIsTyping] = useState(false);

  const startTyping = (newText: string) => {
    setText(newText);
    setIsTyping(true);
  };

  const handleComplete = () => {
    setIsTyping(false);
  };

  return {
    text,
    isTyping,
    startTyping,
    handleComplete,
    TypewriterComponent: () => (
      <TypewriterText text={text} speed={speed} onComplete={handleComplete} />
    ),
  };
};