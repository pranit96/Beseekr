// src/pages/Landing.tsx
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Users, Zap, Brain, ArrowRight,
  Target, DollarSign, TrendingUp, Lightbulb, Rocket,
  Search, Shield, FileText, Clock, Quote
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const discoverFeatures = [
    {
      icon: Brain,
      title: 'AI-Powered Problem Discovery',
      description: 'Our AI analyzes thousands of Reddit, HN, and Twitter conversations to surface validated startup problems.',
      color: 'bg-violet-500',
    },
    {
      icon: TrendingUp,
      title: 'Trending Pain Points',
      description: 'Catch rising opportunities before the competition builds it.',
      color: 'bg-cyan-500',
    },
    {
      icon: DollarSign,
      title: 'Pricing Intelligence',
      description: 'Extract willingness-to-pay signals so you know exactly what to charge.',
      color: 'bg-emerald-500',
    },
    {
      icon: Users,
      title: 'Customer Profiles',
      description: 'Know your buyer before you build. Role breakdowns, company stages, pain frequency.',
      color: 'bg-orange-500',
    },
  ];

  const researchFeatures = [
    {
      icon: Target,
      title: 'Instant Market Validation',
      description: 'Type your idea, get TAM/SAM/SOM sizing, competitive landscape, and recommendations.',
    },
    {
      icon: Shield,
      title: 'Risk Assessment',
      description: 'Know the major risks before you invest months. We surface what could go wrong.',
    },
    {
      icon: Rocket,
      title: 'Go-to-Market Strategy',
      description: 'MVP features, distribution channels, pricing tiers - your launch playbook in seconds.',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Problems Analyzed' },
    { value: '200+', label: 'Reddit Sources' },
    { value: '37s', label: 'Avg Analysis Time' },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Discover Problems',
      description: 'Browse validated startup problems. Filter by category, sort by opportunity score.',
      icon: Search,
    },
    {
      step: '02',
      title: 'Deep Dive with Briefs',
      description: 'See market validation scores, target audience insights, competitor analysis.',
      icon: FileText,
    },
    {
      step: '03',
      title: 'Research Your Idea',
      description: 'Run your idea through our AI. Get pricing, GTM, and risk analysis in 60 seconds.',
      icon: Zap,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              beseekr
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#discover" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Discover
            </a>
            <a href="#research" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Research
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate('/auth')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/dashboard/problems')}
              className="px-4 sm:px-6 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Problem Discovery + Idea Validation</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Your Next Startup Idea
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Exists in Real Conversations
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            We analyze Reddit, Hacker News, and Twitter to surface validated startup problems -
            then help you research your own ideas with market sizing, pricing intel, and GTM strategies.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/dashboard/problems')}
              className="group px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Explore Problems
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-3 rounded-xl border border-border bg-background text-foreground font-semibold text-base hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              Research My Idea
              <Lightbulb className="w-5 h-5 text-primary" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-12 sm:mt-16 max-w-xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Discover Section */}
      <section id="discover" className="py-16 sm:py-24 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
              <Search className="w-4 h-4 text-violet-500" />
              <span className="text-sm text-violet-500 font-medium">Problem Discovery</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold mb-4">
              Discover Problems{' '}
              <span className="text-violet-500">People Actually Have</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Stop building solutions to problems nobody cares about. Our AI surfaces validated pain points from real conversations.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {discoverFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="p-6 rounded-2xl bg-background border border-border hover:border-violet-500/30 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>

          {/* Demo Card */}
          <div className="mt-12 p-6 rounded-2xl bg-background border border-border">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-2 text-sm text-muted-foreground">Live Example</span>
            </div>
            <h4 className="text-lg font-semibold mb-3">"Managing Revenue Share in B2B SaaS Partnerships"</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 text-sm">SaaS</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-sm">B2B</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-start gap-2">
                  <Quote className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  "We track this in spreadsheets and it is a nightmare..." - r/SaaS
                </p>
                <p className="flex items-start gap-2">
                  <Quote className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  "I would pay $49/mo for something that just works" - HN user
                </p>
              </div>
              <div className="flex gap-4">
                <div className="p-3 rounded-lg bg-muted text-center flex-1">
                  <p className="text-xl font-bold text-primary">87/100</p>
                  <p className="text-xs text-muted-foreground">Opportunity</p>
                </div>
                <div className="p-3 rounded-lg bg-muted text-center flex-1">
                  <p className="text-lg font-semibold text-emerald-500">+23%</p>
                  <p className="text-xs text-muted-foreground">This Week</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Section */}
      <section id="research" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <Zap className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-emerald-500 font-medium">Idea Validation</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold mb-4">
              Research Your Idea{' '}
              <span className="text-emerald-500">In Under 60 Seconds</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Have your own startup idea? Get market sizing, competitive analysis, pricing strategy, and a clear recommendation.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-12">
            {researchFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="p-6 rounded-2xl bg-background border border-border hover:border-emerald-500/30 transition-colors text-center"
                >
                  <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mb-4">
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>

          {/* Report Preview */}
          <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h4 className="text-lg font-semibold">Sample Validation Report</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xl font-bold text-emerald-500 border border-emerald-500/30">
                  A
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-500">PURSUE</p>
                  <p className="text-xs text-muted-foreground">High Confidence</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-xl sm:text-2xl font-bold">$2.1B</p>
                <p className="text-xs text-muted-foreground mt-1">TAM</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-xl sm:text-2xl font-bold">$45/mo</p>
                <p className="text-xs text-muted-foreground mt-1">Median WTP</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-xl sm:text-2xl font-bold">3</p>
                <p className="text-xs text-muted-foreground mt-1">Competitors</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-xl sm:text-2xl font-bold">82%</p>
                <p className="text-xs text-muted-foreground mt-1">Confidence</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> 37s analysis</span>
              <span>205 Reddit discussions</span>
              <span>20 pricing data points</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold mb-4">
              Start Building{' '}
              <span className="text-primary">Something That Matters</span>
            </h2>
            <p className="text-muted-foreground">
              Three simple steps to find and research your next startup opportunity.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {howItWorks.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div key={index} className="p-6 rounded-2xl bg-background border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl font-bold text-primary/30">{item.step}</span>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border">
            <h2 className="text-2xl sm:text-4xl font-bold mb-4">
              Your Next Big Idea{' '}
              <span className="text-primary">Is Waiting to Be Found</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Thousands of people share their problems online every day. We turn those conversations into your competitive advantage.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/auth')}
                className="group px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                Start Exploring Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="px-8 py-4 rounded-xl border border-border bg-background text-foreground font-bold text-base hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                Research My Idea
                <Lightbulb className="w-5 h-5 text-primary" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              beseekr
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/privacy')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </button>
            <a href="#discover" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Discover
            </a>
            <a href="#research" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Research
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 beseekr
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
