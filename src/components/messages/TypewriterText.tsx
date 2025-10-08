import { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  onUpdate?: (currentText: string) => void;
}

export const TypewriterText = ({ text, speed = 100, onComplete, onUpdate }: TypewriterTextProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
    setDisplayedText('');
    
    if (!text) {
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
        onUpdate?.(textRef.current);
        onComplete?.();
        return;
      }const currentText = textRef.current.slice(0, charactersToShow);
      setDisplayedText(currentText);
      onUpdate?.(currentText);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [text, speed, onComplete, onUpdate]);

  return <span>{displayedText}</span>;
};

// Hook for managing typewriter state
export const useTypewriter = (initialText: string = '', speed: number = 100) => {
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