// src/components/WelcomeScreen.tsx
import React, { useEffect, useRef } from "react";

const SUGGESTED_PROMPTS = [
  {
    label: "Write a brief",
    prompt:
      "Write a concise executive brief summarizing the key points of our Q4 strategy.",
  },
  {
    label: "Debug code",
    prompt:
      "I have a bug in my React component where state updates aren't reflecting in the UI. Can you help me debug it?",
  },
  {
    label: "Brainstorm ideas",
    prompt:
      "Brainstorm 10 creative marketing strategies for a SaaS product launch targeting small business owners.",
  },
  {
    label: "Analyze data",
    prompt:
      "Explain how to analyze customer churn data and identify key factors contributing to retention.",
  },
  {
    label: "Explain a concept",
    prompt:
      "Explain how large language models work in simple terms, including attention mechanisms and transformers.",
  },
  {
    label: "Research topic",
    prompt:
      "Research the current state of AI regulation globally and summarize key policies in the US, EU, and China.",
  },
  {
    label: "Draft email",
    prompt:
      "Draft a professional follow-up email after a client meeting where we discussed a new product proposal.",
  },
  {
    label: "Summarize text",
    prompt:
      "Summarize the following long document into 5 key bullet points with action items.",
  },
];

interface WelcomeScreenProps {
  onPromptSelect: (prompt: string) => void;
  hideHeader?: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onPromptSelect,
  hideHeader = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Subtle auto-scroll hint on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const timer = setTimeout(() => {
      el.scrollBy({ left: 40, behavior: "smooth" });
      setTimeout(() => el.scrollBy({ left: -40, behavior: "smooth" }), 600);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`flex flex-col items-start w-full max-w-4xl animate-welcome-in mx-auto ${
        hideHeader ? "px-4 sm:px-6 py-6" : "px-6 sm:px-12 py-12 sm:py-20"
      }`}
    >
      {!hideHeader && (
        <>
          {/* Background ambient blobs — GPU-composited, no layout cost */}
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 overflow-hidden -z-10"
          >
            <div className="ambient-blob ambient-blob-1" />
            <div className="ambient-blob ambient-blob-2" />
          </div>

          {/* Eyebrow label */}
          <div className="mb-5 flex items-center gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-muted-foreground/70 uppercase flex items-center select-none">
              AI Chat <span className="mx-2 opacity-60 text-[8px]">•</span> The
              Orchestrator
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] flex flex-col gap-1 text-left mb-8">
            <span className="text-foreground">Think, write, execute.</span>
            <span className="text-muted-foreground/50">
              All in one workspace.
            </span>
          </h1>

          {/* Sub-copy */}
          <p className="text-base text-muted-foreground/70 text-left mb-8 max-w-md font-medium">
            Select agents to get started or try a suggested prompt below.
          </p>
        </>
      )}

      {/* Custom intro message seen in compact design when no header is present */}
      {hideHeader && (
        <div className="flex flex-col items-start gap-4 mb-6 max-w-2xl">
          <div className="flex gap-3 items-start p-4 rounded-2xl bg-muted/20 border border-border/30 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-sm">B</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">
              Hi — I'm Beseekr. Ask me about a market, a pain point, or paste an
              idea to validate.
            </p>
          </div>
        </div>
      )}

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
        <kbd className="kbd">↵</kbd> send &nbsp;·&nbsp;{" "}
        <kbd className="kbd">⇧↵</kbd> new line &nbsp;·&nbsp;{" "}
        <kbd className="kbd">⌘B</kbd> toggle sidebar
      </p>
    </div>
  );
};

export default WelcomeScreen;
