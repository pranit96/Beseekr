// src/components/WelcomeScreen.tsx
import React from 'react';
import { Sparkles, MessageSquare, Code, Lightbulb, PenLine, BarChart3, Globe } from 'lucide-react';

interface SuggestedPrompt {
    icon: React.ReactNode;
    label: string;
    prompt: string;
    gradient: string;
}

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
    {
        icon: <PenLine className="w-5 h-5" />,
        label: 'Help me write',
        prompt: 'Help me write a professional email to follow up on a business proposal',
        gradient: 'from-violet-500/20 to-purple-500/20',
    },
    {
        icon: <Code className="w-5 h-5" />,
        label: 'Debug my code',
        prompt: 'I have a bug in my React component where state updates aren\'t reflecting in the UI. Can you help me debug it?',
        gradient: 'from-emerald-500/20 to-cyan-500/20',
    },
    {
        icon: <Lightbulb className="w-5 h-5" />,
        label: 'Brainstorm ideas',
        prompt: 'Brainstorm 10 creative marketing strategies for a SaaS product launch targeting small business owners',
        gradient: 'from-amber-500/20 to-orange-500/20',
    },
    {
        icon: <BarChart3 className="w-5 h-5" />,
        label: 'Analyze data',
        prompt: 'Explain how to analyze customer churn data and identify key factors contributing to retention',
        gradient: 'from-blue-500/20 to-indigo-500/20',
    },
    {
        icon: <MessageSquare className="w-5 h-5" />,
        label: 'Explain a concept',
        prompt: 'Explain how large language models work in simple terms, including attention mechanisms and transformers',
        gradient: 'from-pink-500/20 to-rose-500/20',
    },
    {
        icon: <Globe className="w-5 h-5" />,
        label: 'Research a topic',
        prompt: 'Research the current state of AI regulation globally and summarize the key policies in the US, EU, and China',
        gradient: 'from-teal-500/20 to-green-500/20',
    },
];

interface WelcomeScreenProps {
    onPromptSelect: (prompt: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onPromptSelect }) => {
    return (
        <div className="flex flex-col items-center justify-center text-center px-4 py-6 max-w-3xl mx-auto animate-fade-in">
            {/* Hero */}
            <div className="mb-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    Multi-Agent Orchestration
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
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
                        className={`group relative flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-gradient-to-br ${item.gradient} hover:border-primary/40 hover:shadow-md transition-all duration-200 text-left`}
                    >
                        <div className="flex-shrink-0 mt-0.5 text-foreground/70 group-hover:text-primary transition-colors">
                            {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors block mb-0.5">
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
            <p className="mt-6 text-xs text-muted-foreground/60">
                Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/50 text-[10px] font-mono">Enter</kbd> to send · <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/50 text-[10px] font-mono">Shift+Enter</kbd> for new line
            </p>
        </div>
    );
};

export default WelcomeScreen;
