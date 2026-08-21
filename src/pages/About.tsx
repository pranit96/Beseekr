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
  DollarSign,
  LineChart,
  MessageSquare,
  FileText,
  Eye,
  Loader2,
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
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            >
              Your Ultimate AI Co-Pilot.{" "}
              <span className="bg-gradient-to-r from-primary via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Discover, Weave, & Build.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              Beseekr is a comprehensive, multi-agent AI platform built for
              ambitious founders. From crafting complex prompts in our
              Orchestrator Desk to mining thousands of Reddit threads for{" "}
              <span className="text-foreground font-medium">
                real, validated problems
              </span>{" "}
              — we compress weeks of product development into minutes.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/auth">
                <Button
                  size="lg"
                  className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 font-semibold text-base shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
                >
                  Launch AI Workspace
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

      {/* The Orchestrator - AI Chat Section */}
      <section className="py-20 lg:py-28 border-t border-border/30">
        <div className="container px-4 md:px-6 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl p-8 bg-muted/20">
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                      <BrainCircuit className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-background border border-border/50 p-4 rounded-2xl rounded-tl-sm text-sm w-full shadow-sm">
                      "Research the CRM market, draft an architecture document
                      for a new entrant, and generate the boilerplate codebase."
                    </div>
                  </div>
                  <div className="flex gap-4 items-start justify-end flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex-shrink-0 flex items-center justify-center">
                      <Rocket className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl rounded-tr-sm text-sm w-full shadow-sm">
                      <p className="font-semibold text-primary mb-2">
                        Executing multi-agent workflow...
                      </p>
                      <ul className="space-y-2 text-muted-foreground text-xs">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />{" "}
                          Analyst Agent fetching market data
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />{" "}
                          Architect Agent designing schema
                        </li>
                        <li className="flex items-center gap-2 animate-pulse">
                          <Loader2 className="w-3 h-3 text-primary animate-spin" />{" "}
                          Coding Agent generating repository...
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Connect multiple AI models to perform complex strategic
                workflows.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                The <span className="text-primary">Prompt Weaving</span>{" "}
                Orchestrator
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Our AI Chat isn't just a basic interface — it's a comprehensive
                multi-turn orchestration desk. Connect to OpenAI, Anthropic, or
                Groq, and command specialized agents to brainstorm, write code,
                or perform strategic research at scale.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: BrainCircuit,
                    text: "Multi-Agent Workflows",
                    desc: "Agents collaborating to solve tasks",
                  },
                  {
                    icon: Zap,
                    text: "Model Agnostic",
                    desc: "GPT-4o, Claude 3.5, Gemini & more",
                  },
                  {
                    icon: MessageSquare,
                    text: "Advanced Context",
                    desc: "Bulk operations & file injections",
                  },
                  {
                    icon: Sparkles,
                    text: "Template Library",
                    desc: "Pre-crafted strategic prompts",
                  },
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
                      <p className="text-xs text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Discovery - What We Do */}
      <section className="py-20 lg:py-28 border-t border-border/30 bg-muted/10">
        <div className="container px-4 md:px-6 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                We Mine <span className="text-primary">Real Conversations</span>{" "}
                for Business Opportunities
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Every day, thousands of people vent their frustrations on
                Reddit.{" "}
                <span className="text-foreground">
                  "I wish there was an app that..."
                </span>{" "}
                <span className="text-foreground">
                  "Why doesn't anyone build..."
                </span>{" "}
                <span className="text-foreground">
                  "I'd pay good money for..."
                </span>
              </p>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Our AI reads these conversations, identifies genuine B2B pain
                points, filters out noise, and surfaces only the problems with
                real market potential.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: MessageSquare,
                    text: "50+ communities scanned",
                    desc: "Reddit, HN, forums",
                  },
                  {
                    icon: BrainCircuit,
                    text: "GPT-4o analysis",
                    desc: "Context-aware filtering",
                  },
                  {
                    icon: Target,
                    text: "B2B focus only",
                    desc: "No consumer noise",
                  },
                  {
                    icon: Zap,
                    text: "Daily updates",
                    desc: "Fresh problems daily",
                  },
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
                      <p className="text-xs text-muted-foreground">
                        {item.desc}
                      </p>
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
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-cyan-500/20 blur-3xl rounded-3xl opacity-30" />
              <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
                <img
                  src="/images/reddit-analysis.png"
                  alt="AI analyzing Reddit posts to find business problems"
                  className="w-full h-auto"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                AI identifies pain points from real user discussions
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Cards Section */}
      <section className="py-20 lg:py-28 bg-muted/20 border-y border-border/30">
        <div className="container px-4 md:px-6 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
                <img
                  src="/images/problem-cards.png"
                  alt="Dashboard showing validated problem opportunities"
                  className="w-full h-auto"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Each problem comes with scores, audiences, and market data
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Every Problem is{" "}
                <span className="text-primary">Pre-Validated</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                No more guessing if an idea has legs. Every problem on Beseekr
                comes with data:
              </p>

              <div className="space-y-4">
                {[
                  {
                    icon: BarChart3,
                    title: "Opportunity Score (0-100)",
                    desc: "Our AI rates each problem based on demand, competition, and monetization potential.",
                  },
                  {
                    icon: Users,
                    title: "Target Audience Profile",
                    desc: "Who's struggling with this? What's their role, company size, and industry?",
                  },
                  {
                    icon: TrendingUp,
                    title: "Market Signals",
                    desc: "TAM estimates, pricing indicators, and willingness-to-pay signals from real discussions.",
                  },
                  {
                    icon: LineChart,
                    title: "Trend Momentum",
                    desc: "Is this problem growing? Track engagement over time to spot rising opportunities.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-4 rounded-xl bg-background border border-border/30"
                  >
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Deep Research Section */}
      <section className="py-20 lg:py-28">
        <div className="container px-4 md:px-6 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Go Deep with{" "}
                <span className="text-primary">AI Research Reports</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Found a promising problem? Run Deep Research to get a
                comprehensive analysis that would take a consultant weeks to
                produce:
              </p>

              <div className="space-y-3 mb-8">
                {[
                  "Executive summary with clear build/skip recommendation",
                  "Detailed market analysis with TAM breakdown",
                  "Competitor landscape and positioning gaps",
                  "Risk assessment and entry barriers",
                  "Go-to-market strategy suggestions",
                  "Confidence scores backed by data sources",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground bg-primary/5 p-4 rounded-xl border border-primary/20">
                <strong className="text-foreground">
                  No more surveys. No more guessing.
                </strong>{" "}
                Just evidence-backed insights from real market data.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 blur-3xl rounded-3xl opacity-30" />
              <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
                <img
                  src="/images/research-report.png"
                  alt="AI-generated research report with market analysis"
                  className="w-full h-auto"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Comprehensive research reports generated in minutes
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-28 bg-muted/20 border-y border-border/30">
        <div className="container px-4 md:px-6 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From raw community discussions to validated business opportunities
              in four steps.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: Search,
                title: "Discover",
                desc: "AI scans 50+ subreddits and communities 24/7, extracting genuine B2B pain points using GPT-4o analysis.",
                color: "from-blue-500 to-cyan-500",
              },
              {
                step: "02",
                icon: BarChart3,
                title: "Enrich",
                desc: "Every problem gets scored on opportunity potential and enriched with audience, market size, and competitor data.",
                color: "from-purple-500 to-pink-500",
              },
              {
                step: "03",
                icon: FileText,
                title: "Validate",
                desc: "Run Deep Research for comprehensive reports with executive summaries, market analysis, and recommendations.",
                color: "from-emerald-500 to-teal-500",
              },
              {
                step: "04",
                icon: Eye,
                title: "Track",
                desc: "Add problems to your Watchlist and get alerts when new pain points or competitor activity emerges.",
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
                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${item.color} mb-4`}
                >
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Built For Builders
            </h2>
            <p className="text-lg text-muted-foreground">
              Who wins with validated problem discovery?
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Rocket,
                title: "Indie Hackers",
                desc: "Find micro-SaaS ideas in hours instead of spending months lurking in subreddits.",
              },
              {
                icon: Briefcase,
                title: "Founders",
                desc: "De-risk your next venture. Validate market demand before writing a single line of code.",
              },
              {
                icon: Users,
                title: "Product Teams",
                desc: "Discover adjacent opportunities and unmet needs your competitors are missing.",
              },
              {
                icon: TrendingUp,
                title: "VCs & Investors",
                desc: "Track emerging problems and spot investable trends before they go mainstream.",
              },
              {
                icon: Building2,
                title: "Agencies",
                desc: "Find problems your clients' customers have — and pitch solutions they'll pay for.",
              },
              {
                icon: Globe,
                title: "Market Researchers",
                desc: "Get curated market intelligence without $5k+ research subscriptions.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-6 rounded-2xl bg-muted/30 border border-border/30 hover:border-primary/30 transition-colors"
              >
                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Old Way vs Beseekr */}
      <section className="py-20 lg:py-28 bg-muted/20 border-y border-border/30">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              The Smarter Way to Find What to Build
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-2xl border border-border/30 bg-background"
          >
            <div className="grid grid-cols-2">
              <div className="p-4 bg-muted/50 font-semibold text-muted-foreground border-b border-r border-border/30">
                The Old Way
              </div>
              <div className="p-4 bg-primary/5 font-semibold text-primary border-b border-border/30">
                With Beseekr
              </div>
            </div>
            {[
              [
                "Spend weeks reading Reddit threads",
                "Curated problems in seconds",
              ],
              ["Guess at market size", "AI-powered TAM estimates with sources"],
              [
                "Build first, validate later",
                "Validate first, build with confidence",
              ],
              [
                "Miss emerging trends",
                "24/7 watchlist alerts on new pain points",
              ],
              [
                "Pay $5k+ for market research",
                "Comprehensive analysis at a fraction",
              ],
              [
                "Survey bias, small samples",
                "Real conversations from thousands of users",
              ],
            ].map(([old, newWay], i) => (
              <div key={i} className="grid grid-cols-2">
                <div className="p-4 text-sm text-muted-foreground border-b border-r border-border/30 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                  {old}
                </div>
                <div className="p-4 text-sm font-medium border-b border-border/30 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  {newWay}
                </div>
              </div>
            ))}
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
              Stop wasting months on ideas nobody needs. Start with problems
              people are already desperate to solve — and willing to pay for.
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
              <Link to="/pricing">
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
