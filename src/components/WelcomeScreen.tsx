// src/components/WelcomeScreen.tsx
import React, { useEffect, useRef } from 'react';

const SUGGESTED_PROMPTS = [
  { label: 'Write a brief', prompt: 'Write a concise executive brief summarizing the key points of our Q4 strategy.' },
  { label: 'Debug code', prompt: "I have a bug in my React component where state updates aren't reflecting in the UI. Can you help me debug it?" },
  { label: 'Brainstorm ideas', prompt: 'Brainstorm 10 creative marketing strategies for a SaaS product launch targeting small business owners.' },
  { label: 'Analyze data', prompt: 'Explain how to analyze customer churn data and identify key factors contributing to retention.' },
  { label: 'Explain a concept', prompt: 'Explain how large language models work in simple terms, including attention mechanisms and transformers.' },
  { label: 'Research topic', prompt: 'Research the current state of AI regulation globally and summarize key policies in the US, EU, and China.' },
  { label: 'Draft email', prompt: 'Draft a professional follow-up email after a client meeting where we discussed a new product proposal.' },
  { label: 'Summarize text', prompt: 'Summarize the following long document into 5 key bullet points with action items.' },
];

interface WelcomeScreenProps {
  onPromptSelect: (prompt: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onPromptSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Subtle auto-scroll hint on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const timer = setTimeout(() => {
      el.scrollBy({ left: 40, behavior: 'smooth' });
      setTimeout(() => el.scrollBy({ left: -40, behavior: 'smooth' }), 600);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full px-4 py-8 animate-welcome-in">
      {/* Background ambient blobs — GPU-composited, no layout cost */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
      </div>

      {/* Eyebrow label */}
      <div className="mb-6 flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/70 animate-pulse-soft" />
        <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground/60 select-none">
          Multi-Agent Orchestration
        </span>
      </div>

      {/* Headline */}
      <h1 className="text-[2.15rem] sm:text-[2.6rem] font-semibold tracking-[-0.03em] text-foreground leading-[1.15] text-center mb-3 max-w-xl">
        What would you like
        <br />
        <span className="text-primary/80">to orchestrate?</span>
      </h1>

      {/* Sub-copy */}
      <p className="text-sm text-muted-foreground/60 text-center mb-10 max-w-sm leading-relaxed">
        Pick a suggestion or type your own — select agents below to begin.
      </p>

      {/* Horizontal scrollable chip strip */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto w-full max-w-2xl pb-2 scroll-smooth chips-scroll"
        role="list"
        aria-label="Suggested prompts"
      >
        {SUGGESTED_PROMPTS.map((item) => (
          <button
            key={item.label}
            role="listitem"
            onClick={() => onPromptSelect(item.prompt)}
            className="chip-btn flex-shrink-0"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Keyboard hint */}
      <p className="mt-10 text-[11px] text-muted-foreground/35 select-none">
        <kbd className="kbd">↵</kbd> send &nbsp;·&nbsp; <kbd className="kbd">⇧↵</kbd> new line &nbsp;·&nbsp; <kbd className="kbd">⌘B</kbd> toggle sidebar
      </p>
    </div>
  );
};

export default WelcomeScreen;
