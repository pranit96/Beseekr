// src/components/WelcomeScreen.tsx
import React from 'react';
import { Sparkles, MessageSquare, Code, Lightbulb, PenLine, BarChart3, Globe } from 'lucide-react';

interface SuggestedPrompt {
    icon: React.ReactNode;
    label: string;
    prompt: string;
}

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
    {
        icon: <PenLine className="w-5 h-5" />,
        label: 'Help me write',
        prompt: 'Help me write a professional email to follow up on a business proposal',
    },
    {
        icon: <Code className="w-5 h-5" />,
        label: 'Debug my code',
        prompt: 'I have a bug in my React component where state updates aren\'t reflecting in the UI. Can you help me debug it?',
    },
    {
        icon: <Lightbulb className="w-5 h-5" />,
        label: 'Brainstorm ideas',
        prompt: 'Brainstorm 10 creative marketing strategies for a SaaS product launch targeting small business owners',
    },
    {
        icon: <BarChart3 className="w-5 h-5" />,
        label: 'Analyze data',
        prompt: 'Explain how to analyze customer churn data and identify key factors contributing to retention',
    },
    {
        icon: <MessageSquare className="w-5 h-5" />,
        label: 'Explain a concept',
        prompt: 'Explain how large language models work in simple terms, including attention mechanisms and transformers',
    },
    {
        icon: <Globe className="w-5 h-5" />,
        label: 'Research a topic',
        prompt: 'Research the current state of AI regulation globally and summarize the key policies in the US, EU, and China',
    },
];

interface WelcomeScreenProps {
    onPromptSelect: (prompt: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onPromptSelect }) => {
    return (
        <div className="flex flex-col items-center justify-center text-center px-4 py-6 max-w-3xl mx-auto animate-fade-in-up">
            {/* Hero */}
            <div className="mb-10 space-y-5">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/40 bg-muted/20 backdrop-blur-sm text-muted-foreground text-sm font-medium shadow-soft">
                    <Sparkles className="w-4 h-4 text-primary/70" />
                    Multi-Agent Orchestration
                </div>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground leading-tight">
                    How can I help you today?
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
                    Select your agents below and ask anything — or pick a suggestion to get started.
                </p>
            </div>

            {/* Prompt Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
                {SUGGESTED_PROMPTS.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => onPromptSelect(item.prompt)}
                        className="group relative flex items-start gap-3 p-4 rounded-xl border border-border/40 bg-background/40 hover:bg-muted/40 hover:border-border/80 hover:shadow-soft backdrop-blur-sm transition-all duration-300 text-left"
                    >
                        <div className="flex-shrink-0 mt-0.5 text-muted-foreground/70 group-hover:text-foreground transition-colors duration-300">
                            {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-foreground/90 group-hover:text-foreground transition-colors block mb-1">
                                {item.label}
                            </span>
                            <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {item.prompt}
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Subtle footer hint */}
            <p className="mt-8 text-xs text-muted-foreground/50">
                Press <kbd className="px-1.5 py-0.5 rounded bg-muted/50 border border-border/40 text-[10px] font-mono text-muted-foreground shadow-sm">Enter</kbd> to send · <kbd className="px-1.5 py-0.5 rounded bg-muted/50 border border-border/40 text-[10px] font-mono text-muted-foreground shadow-sm">Shift+Enter</kbd> for new line
            </p>
        </div>
    );
};

export default WelcomeScreen;
