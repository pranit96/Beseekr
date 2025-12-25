import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    Sparkles,
    Target,
    Zap,
    TrendingUp,
    Globe,
    BrainCircuit,
    Rocket,
    Search,
    BarChart3,
    Shield,
    Bell,
    Users,
    Building2,
    Briefcase,
    CheckCircle2,
    XCircle,
    Clock,
    DollarSign,
    LineChart,
} from "lucide-react";

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

export default function About() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-24 pb-20 lg:pt-32 lg:pb-28">
                {/* Background Effects */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />
                </div>

                <div className="container relative z-10 px-4 md:px-6 max-w-6xl mx-auto">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <motion.div variants={fadeInUp} className="mb-6">
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                                <Sparkles className="h-4 w-4" />
                                AI-Powered Problem Discovery
                            </span>
                        </motion.div>

                        <motion.h1
                            variants={fadeInUp}
                            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
                        >
                            Stop Guessing.{" "}
                            <span className="bg-gradient-to-r from-primary via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                                Start Building
                            </span>{" "}
                            What People Actually Need.
                        </motion.h1>

                        <motion.p
                            variants={fadeInUp}
                            className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
                        >
                            Most startups fail because they solve problems nobody has. Beseekr finds the problems
                            people are already begging for solutions to — backed by real conversations, real pain,
                            and real market signals.
                        </motion.p>

                        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/auth">
                                <Button
                                    size="lg"
                                    className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 font-semibold text-base shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
                                >
                                    Start Finding Problems
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link to="/dashboard/problems">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="h-12 px-8 rounded-xl border-border/50 hover:bg-muted/50 transition-all"
                                >
                                    Browse Problems
                                </Button>
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* What is Beseekr Section */}
            <section className="py-20 lg:py-28 border-t border-border/30">
                <div className="container px-4 md:px-6 max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                                What is <span className="text-primary">Beseekr</span>?
                            </h2>
                            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                                Beseekr is an AI-powered problem discovery and validation platform that mines Reddit,
                                Hacker News, and online communities to uncover genuine business problems that people
                                are actively discussing — and desperately want solved.
                            </p>
                            <p className="text-lg font-medium text-foreground mb-8">
                                We don't deal in assumptions. We deal in evidence.
                            </p>

                            <div className="grid sm:grid-cols-2 gap-4">
                                {[
                                    { icon: BarChart3, text: "Validated demand signals", desc: "Real engagement metrics" },
                                    { icon: Target, text: "Target audience profiles", desc: "Know who's willing to pay" },
                                    { icon: TrendingUp, text: "Market intelligence", desc: "TAM and competitor data" },
                                    { icon: LineChart, text: "Trend tracking", desc: "Real-time momentum data" },
                                ].map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/30"
                                    >
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <item.icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{item.text}</p>
                                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-cyan-500/20 blur-3xl rounded-full opacity-30" />
                            <div className="relative rounded-2xl overflow-hidden border border-border/30 shadow-2xl">
                                <img
                                    src="/images/about-hero.png"
                                    alt="AI-powered problem discovery visualization"
                                    className="w-full h-auto"
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* The Problem We Solve */}
            <section className="py-20 lg:py-28 bg-muted/20 border-y border-border/30">
                <div className="container px-4 md:px-6 max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold mb-6">The Problem We Solve</h2>
                        <p className="text-xl text-muted-foreground mb-8">
                            Building products in the dark is expensive.
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid sm:grid-cols-3 gap-6 mb-12"
                    >
                        {[
                            { icon: XCircle, text: "Don't exist at scale", color: "text-red-400" },
                            { icon: Shield, text: "Have dominant competitors", color: "text-orange-400" },
                            { icon: DollarSign, text: "Target audiences won't pay", color: "text-yellow-400" },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                variants={fadeInUp}
                                className="p-6 rounded-xl bg-background border border-border/30"
                            >
                                <item.icon className={`h-8 w-8 mx-auto mb-3 ${item.color}`} />
                                <p className="text-muted-foreground">{item.text}</p>
                            </motion.div>
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-cyan-500/5 border border-primary/20"
                    >
                        <p className="text-lg text-muted-foreground mb-4">
                            The result? <span className="text-foreground font-semibold">90% of startups fail.</span>{" "}
                            Most of them had great ideas — just not the right problems.
                        </p>
                        <p className="text-xl font-semibold text-foreground">
                            What if you could see the problems people are already screaming about?
                        </p>
                        <p className="text-primary font-medium mt-2">That's what Beseekr does.</p>
                    </motion.div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 lg:py-28">
                <div className="container px-4 md:px-6 max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            From raw community discussions to validated business opportunities in four steps.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                step: "01",
                                icon: Search,
                                title: "Discovery",
                                subtitle: "AI Hunts 24/7",
                                desc: "Our AI continuously scans 50+ subreddits and communities, extracting genuine B2B pain points. We use GPT-4o to analyze context and filter noise.",
                                color: "from-blue-500 to-cyan-500",
                            },
                            {
                                step: "02",
                                icon: BrainCircuit,
                                title: "Enrichment",
                                subtitle: "Market Intelligence",
                                desc: "Every problem gets enriched with target audience analysis, competitor mapping, TAM estimates, pricing signals, and our proprietary opportunity score.",
                                color: "from-purple-500 to-pink-500",
                            },
                            {
                                step: "03",
                                icon: Shield,
                                title: "Validation",
                                subtitle: "Deep Research",
                                desc: "Run Deep AI Research for comprehensive reports with executive summaries, market analysis, competitive landscape, and data-backed recommendations.",
                                color: "from-emerald-500 to-teal-500",
                            },
                            {
                                step: "04",
                                icon: Bell,
                                title: "Tracking",
                                subtitle: "Watch Markets Evolve",
                                desc: "Add problems to your Watchlist and get alerts when new pain points emerge, competitor activity changes, or engagement spikes.",
                                color: "from-orange-500 to-amber-500",
                            },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group relative p-6 rounded-2xl bg-background border border-border/30 hover:border-primary/30 transition-colors"
                            >
                                <div
                                    className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl rounded-tr-2xl bg-gradient-to-r ${item.color} text-white text-xs font-bold`}
                                >
                                    {item.step}
                                </div>
                                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${item.color} mb-4`}>
                                    <item.icon className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-lg font-bold mb-1">{item.title}</h3>
                                <p className="text-sm text-primary mb-3">{item.subtitle}</p>
                                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-16 rounded-2xl overflow-hidden border border-border/30 shadow-xl"
                    >
                        <img
                            src="/images/discovery-pipeline.png"
                            alt="AI Discovery Pipeline"
                            className="w-full h-auto"
                        />
                    </motion.div>
                </div>
            </section>

            {/* Validation Process */}
            <section className="py-20 lg:py-28 bg-muted/20 border-y border-border/30">
                <div className="container px-4 md:px-6 max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="order-2 lg:order-1"
                        >
                            <div className="rounded-2xl overflow-hidden border border-border/30 shadow-xl">
                                <img
                                    src="/images/validation-chart.png"
                                    alt="Validation Dashboard"
                                    className="w-full h-auto"
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="order-1 lg:order-2"
                        >
                            <h2 className="text-3xl sm:text-4xl font-bold mb-6">How We Validate Problems</h2>
                            <p className="text-lg text-muted-foreground mb-8">
                                Not everything that gets complained about is a business opportunity. Every problem
                                goes through rigorous AI-powered validation.
                            </p>

                            <div className="space-y-4">
                                {[
                                    { label: "Business Relevance", desc: "Is this a B2B/SaaS problem with revenue potential?" },
                                    { label: "Specificity", desc: "Is it a clear, actionable pain point?" },
                                    { label: "Frequency", desc: "How often is this mentioned across sources?" },
                                    { label: "Urgency Signals", desc: "Are users actively seeking solutions?" },
                                    { label: "Willingness to Pay", desc: "Any pricing discussions or budget mentions?" },
                                    { label: "Quality Score", desc: "Our 0-100 proprietary score combining all signals" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                                        <div>
                                            <span className="font-medium">{item.label}</span>
                                            <span className="text-muted-foreground"> — {item.desc}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <p className="mt-6 text-sm text-muted-foreground bg-muted/50 p-4 rounded-xl border border-border/30">
                                Problems with quality scores under 50 never make it to your dashboard. Only
                                validated, actionable opportunities.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Who Is Beseekr For */}
            <section className="py-20 lg:py-28">
                <div className="container px-4 md:px-6 max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Who Is Beseekr For?</h2>
                        <p className="text-lg text-muted-foreground">Built for builders who want to win.</p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: Rocket,
                                title: "Indie Hackers",
                                desc: "Find validated micro-SaaS ideas without spending months lurking in forums.",
                            },
                            {
                                icon: Briefcase,
                                title: "Founders",
                                desc: "De-risk your next venture with real market signals before writing code.",
                            },
                            {
                                icon: Users,
                                title: "Product Managers",
                                desc: "Discover adjacent opportunities and unmet needs in your space.",
                            },
                            {
                                icon: TrendingUp,
                                title: "VCs & Investors",
                                desc: "Track emerging problems and spot trends before they hit mainstream.",
                            },
                            {
                                icon: Building2,
                                title: "Agencies",
                                desc: "Find problems your clients' customers have — and pitch better solutions.",
                            },
                            {
                                icon: Globe,
                                title: "Researchers",
                                desc: "Access curated market intelligence without expensive research subscriptions.",
                            },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className="p-6 rounded-2xl bg-background border border-border/30 hover:border-primary/30 transition-colors"
                            >
                                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                                    <item.icon className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Comparison Section */}
            <section className="py-20 lg:py-28 bg-muted/20 border-y border-border/30">
                <div className="container px-4 md:px-6 max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Beseekr?</h2>
                        <p className="text-lg text-muted-foreground">The smarter way to find what to build.</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="overflow-hidden rounded-2xl border border-border/30"
                    >
                        <table className="w-full">
                            <thead>
                                <tr className="bg-muted/50">
                                    <th className="text-left p-4 font-semibold">The Old Way</th>
                                    <th className="text-left p-4 font-semibold text-primary">The Beseekr Way</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {[
                                    ["Spend weeks reading Reddit threads", "Get curated problems in seconds"],
                                    ["Guess at market size", "AI-powered TAM estimates with sources"],
                                    ["Build first, validate later", "Validate first, build with confidence"],
                                    ["Miss emerging trends", "Track problems 24/7 with watchlist alerts"],
                                    ["Pay $5k+ for market research", "Comprehensive analysis for a fraction"],
                                    ["Survey bias and small samples", "Real conversations from real users"],
                                ].map(([old, newWay], i) => (
                                    <tr key={i} className="bg-background">
                                        <td className="p-4 text-muted-foreground text-sm">{old}</td>
                                        <td className="p-4 text-sm font-medium">{newWay}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 lg:py-32 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-3xl" />
                </div>

                <div className="container relative z-10 px-4 md:px-6 max-w-3xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <h2 className="text-4xl sm:text-5xl font-bold">
                            Ready to Build What People Actually Want?
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Stop wasting time on ideas nobody needs. Start with validated problems backed by real
                            conversations from real users.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/auth">
                                <Button
                                    size="lg"
                                    className="h-14 px-10 rounded-xl bg-primary hover:bg-primary/90 font-semibold text-lg shadow-xl shadow-primary/25 transition-all hover:scale-[1.02]"
                                >
                                    Get Started Free
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link to="/dashboard/pricing">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="h-14 px-10 rounded-xl border-border/50 transition-all"
                                >
                                    View Pricing
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
