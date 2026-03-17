import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
    MessageSquare,
    TrendingUp,
    Sparkles,
    Lock,
    ArrowRight,
    LogIn,
    User,
    Zap,
    Plus,
    ChevronRight,
    Activity,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { GlobalHeader } from '@/components/GlobalHeader';


interface ToolCard {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    badge: string;
    badgeColor: string;
    description: string;
    features: string[];
    gradient: string;
    borderGlow: string;
    iconBg: string;
    cta: string;
    route: string;
    available: true;
}

interface ComingSoonCard {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    badge: string;
    badgeColor: string;
    description: string;
    available: false;
}

type Card = ToolCard | ComingSoonCard;

const cards: Card[] = [
    {
        id: 'chat',
        icon: MessageSquare,
        title: 'AI Chat',
        badge: 'Orchestrator',
        badgeColor: 'bg-violet-500/15 text-violet-400 border border-violet-500/20',
        description:
            'Engage with our powerful AI assistant to craft, refine, and weave prompts for any use case. Research, write, and brainstorm at scale.',
        features: [
            'Multi-turn conversations',
            'Prompt engineering',
            'Agent-based workflows',
        ],
        gradient: 'from-violet-600/20 via-purple-500/10 to-fuchsia-500/10',
        borderGlow: 'hover:border-violet-500/50 hover:shadow-violet-500/10',
        iconBg: 'from-violet-500 to-fuchsia-500',
        cta: 'Open Chat',
        route: '/chat',
        available: true,
    },
    {
        id: 'reddit',
        icon: TrendingUp,
        title: 'Reddit Problem Discovery',
        badge: 'New',
        badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
        description:
            'Discover validated startup problems sourced from Reddit, HN, and online communities. Scored by AI for opportunity potential.',
        features: [
            'AI-scored opportunities',
            'Market validation data',
            'Competitor & pricing intel',
        ],
        gradient: 'from-emerald-600/20 via-cyan-500/10 to-teal-500/10',
        borderGlow: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
        iconBg: 'from-emerald-500 to-cyan-500',
        cta: 'Explore Problems',
        route: '/dashboard/problems',
        available: true,
    },
    // {
    //     id: 'stocks',
    //     icon: TrendingUp,
    //     title: 'Stock Strategy Signals',
    //     badge: 'AI-Powered',
    //     badgeColor: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    //     description:
    //         'High-probability trading setups identified by AI. Mean reversion, breakouts, and event-driven plays with defined entry, target, and stop loss.',
    //     features: [
    //         'Strategy-based signals',
    //         'Risk/reward analysis',
    //         'Trade journal & performance',
    //     ],
    //     gradient: 'from-blue-600/20 via-indigo-500/10 to-purple-500/10',
    //     borderGlow: 'hover:border-blue-500/50 hover:shadow-blue-500/10',
    //     iconBg: 'from-blue-500 to-indigo-500',
    //     cta: 'View Signals',
    //     route: '/trading/overview',
    //     available: true,
    // },
    // {
    //     id: 'wellness',
    //     icon: Activity,
    //     title: 'Mind & Body Wellness',
    //     badge: 'Health',
    //     badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    //     description: 'Track your nutrition, training, and habits in one unified dashboard. AI-powered food logging and custom plans.',
    //     features: [
    //         'AI food photo analysis',
    //         'Custom training plans',
    //         'Daily habit tracking',
    //     ],
    //     gradient: 'from-emerald-600/20 via-sky-500/10 to-violet-500/10',
    //     borderGlow: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
    //     iconBg: 'from-emerald-500 to-sky-500',
    //     cta: 'Open Dashboard',
    //     route: '/wellness',
    //     available: true,
    // },
    // {
    //     id: 'blogs',
    //     icon: Sparkles,
    //     title: 'Blogs',
    //     badge: 'New',
    //     badgeColor: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    //     description:
    //         'Discover high-quality blogs on various topics. Curated and written by our team to provide valuable insights and knowledge.',
    //     features: [
    //         'Various topics',
    //         'High-quality content',
    //         'Regular updates',
    //     ],
    //     gradient: 'from-amber-600/20 via-orange-500/10 to-red-500/10',
    //     borderGlow: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
    //     iconBg: 'from-amber-500 to-orange-500',
    //     cta: 'Explore Blogs',
    //     route: '/blogs',
    //     available: true,
    // },
    {
        id: 'coming-soon',
        icon: Plus,
        title: 'More Tools Coming Soon',
        badge: 'Soon',
        badgeColor: 'bg-muted text-muted-foreground border border-border',
        description:
            "We're building more powerful tools to help founders, indie hackers, and product teams move faster. Stay tuned.",
        available: false,
    },
];

export default function Home() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    const handleToolClick = (route: string) => {
        if (loading) return;
        if (!user) {
            // Save intended destination so auth flow redirects back here after login
            sessionStorage.setItem('auth-redirect', route);
            navigate('/auth');
        } else {
            navigate(route);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* ── Nav ──────────────────────────────────────────────────── */}
            <GlobalHeader />

            {/* ── Hero ─────────────────────────────────────────────────── */}
            <section className="flex-1 py-16 sm:py-24 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Heading */}
                    <motion.div
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55 }}
                        className="text-center mb-14 sm:mb-20"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6 text-sm text-primary font-medium">
                            <Sparkles className="w-3.5 h-3.5" />
                            Your AI-powered toolkit
                        </div>
                        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-5 leading-tight tracking-tight">
                            Tools Built for{' '}
                            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                                Ambitious Builders
                            </span>
                        </h1>
                        <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
                            Pick a tool and start building. Each one is designed to compress weeks of research into minutes.
                        </p>
                    </motion.div>

                    {/* ── Tool Cards Grid + Health ───────────────────────────── */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">

                        {cards.map((card, i) => {
                            const Icon = card.icon;

                            if (!card.available) {
                                // Coming Soon placeholder
                                return (
                                    <motion.div
                                        key={card.id}
                                        initial={{ opacity: 0, y: 24 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.45, delay: i * 0.1 }}
                                        className="relative rounded-2xl border border-dashed border-border bg-muted/20 p-6 sm:p-8 flex flex-col items-center justify-center text-center min-h-[280px] gap-4"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-1">
                                            <Lock className="w-6 h-6 text-muted-foreground/50" />
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${card.badgeColor}`}>
                                            {card.badge}
                                        </span>
                                        <h3 className="text-base font-semibold text-muted-foreground">{card.title}</h3>
                                        <p className="text-sm text-muted-foreground/70 max-w-[220px]">{card.description}</p>
                                    </motion.div>
                                );
                            }

                            // Available tool card
                            const tc = card as ToolCard;
                            return (
                                <motion.div
                                    key={tc.id}
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.45, delay: i * 0.1 }}
                                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                                    onClick={() => handleToolClick(tc.route)}
                                    className={[
                                        'group relative cursor-pointer rounded-2xl border border-border/60 p-6 sm:p-8',
                                        'bg-gradient-to-br', tc.gradient,
                                        'hover:shadow-2xl', tc.borderGlow,
                                        'transition-all duration-300',
                                        'flex flex-col min-h-[320px]',
                                    ].join(' ')}
                                >
                                    {/* Glow overlay */}
                                    <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${tc.gradient} blur-xl -z-10`} />

                                    {/* Badge */}
                                    <span className={`inline-flex self-start items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mb-5 ${tc.badgeColor}`}>
                                        {tc.badge}
                                    </span>

                                    {/* Icon */}
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tc.iconBg} flex items-center justify-center mb-5 shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                                        <Icon className="w-7 h-7 text-white" />
                                    </div>

                                    {/* Title & Description */}
                                    <h3 className="text-xl font-bold mb-2 group-hover:text-foreground transition-colors">
                                        {tc.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                                        {tc.description}
                                    </p>

                                    {/* Features */}
                                    <ul className="space-y-1.5 mb-6 flex-1">
                                        {tc.features.map((f) => (
                                            <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <ChevronRight className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA */}
                                    <button className={[
                                        'mt-auto w-full py-2.5 rounded-xl font-semibold text-sm',
                                        'bg-gradient-to-r', tc.iconBg,
                                        'text-white flex items-center justify-center gap-2',
                                        'group-hover:opacity-95 transition-opacity active:scale-[0.98]',
                                    ].join(' ')}>
                                        {!user && !loading ? (
                                            <>
                                                <LogIn className="w-4 h-4" />
                                                Sign in to {tc.cta}
                                            </>
                                        ) : (
                                            <>
                                                {tc.cta}
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* ── Bottom note ────────────────────────────────────────── */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.55, duration: 0.5 }}
                        className="text-center text-xs text-muted-foreground mt-10"
                    >
                        Free to explore · Premium features unlock deeper insights
                    </motion.p>
                </div>
            </section>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <footer className="border-t border-border py-6 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            beseekr
                        </span>
                    </div>

                    <div className="flex items-center gap-5">
                        <button onClick={() => navigate('/about')} className="hover:text-foreground transition-colors">
                            About
                        </button>
                        <button onClick={() => navigate('/privacy')} className="hover:text-foreground transition-colors">
                            Privacy
                        </button>
                        <button onClick={() => navigate('/contact')} className="hover:text-foreground transition-colors">
                            Contact
                        </button>
                    </div>

                    <p className="text-xs">© 2025 beseekr</p>
                </div>
            </footer>
        </div>
    );
}
