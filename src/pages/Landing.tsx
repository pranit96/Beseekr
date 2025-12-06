// src/pages/Landing.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, MessageSquare, Users, Zap, Brain, ArrowRight, CheckCircle2,
  Target, DollarSign, TrendingUp, BarChart3, Lightbulb, Rocket,
  Search, Shield, FileText, Clock, Quote
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 10,
        y: (e.clientY / window.innerHeight - 0.5) * 10,
      });
    };

    const handleScroll = () => setScrollY(window.scrollY);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const discoverFeatures = [
    {
      icon: Brain,
      title: 'AI-Powered Problem Discovery',
      description: 'Our AI analyzes thousands of Reddit, HN, and Twitter conversations to surface validated startup problems real people are struggling with.',
      color: 'from-violet-500 to-purple-600',
    },
    {
      icon: TrendingUp,
      title: 'Trending Pain Points',
      description: 'See which problems are gaining momentum. Catch rising opportunities before the competition -- not after they\'ve built it.',
      color: 'from-cyan-500 to-blue-600',
    },
    {
      icon: DollarSign,
      title: 'Pricing Intelligence',
      description: '"I\'d pay $49/mo for this..." -- We extract willingness-to-pay signals so you know exactly what to charge.',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      icon: Users,
      title: 'Customer Profiles',
      description: 'Know your buyer before you build. Role breakdowns, company stages, pain frequency -- all from real conversations.',
      color: 'from-orange-500 to-red-600',
    },
  ];

  const validateFeatures = [
    {
      icon: Target,
      title: 'Instant Market Validation',
      description: 'Type your idea, get a comprehensive report. TAM/SAM/SOM sizing, competitive landscape, and evidence-backed recommendations.',
      gradient: 'from-primary to-accent',
    },
    {
      icon: Shield,
      title: 'Risk Assessment',
      description: 'Know the major risks before you invest months. We surface what could go wrong -- and how to mitigate it.',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      icon: Rocket,
      title: 'Go-to-Market Strategy',
      description: 'MVP features, distribution channels, positioning, pricing tiers -- your launch playbook generated in seconds.',
      gradient: 'from-emerald-500 to-cyan-500',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Problems Analyzed' },
    { value: '200+', label: 'Reddit Sources' },
    { value: '37s', label: 'Avg Analysis Time' },
    { value: 'PURSUE', label: 'Clear Recommendations' },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Discover Problems',
      description: 'Browse our curated database of validated startup problems. Filter by category, sort by opportunity score, save to your watchlist.',
      icon: Search,
    },
    {
      step: '02',
      title: 'Deep Dive with Briefs',
      description: 'Click any problem to see the full brief: market validation scores, target audience insights, competitor analysis, and raw user quotes.',
      icon: FileText,
    },
    {
      step: '03',
      title: 'Research Your Idea',
      description: 'Have your own idea? Run it through our validator. In under 60 seconds, get a comprehensive report with pricing, GTM, and risk analysis.',
      icon: Zap,
    },
  ];

  const testimonialQuotes = [
    '"I finally found a problem worth solving — with proof people will pay."',
    '"Saved me 3 months of customer interviews."',
    '"The pricing intelligence alone paid for itself."',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-sidebar-background to-background text-foreground overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-rotate-slow"
          style={{
            top: '20%',
            left: '10%',
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl animate-rotate-slow"
          style={{
            bottom: '20%',
            right: '10%',
            transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)`,
            animationDirection: 'reverse',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl animate-rotate-slow"
          style={{
            top: '60%',
            left: '50%',
            transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
            animationDelay: '2s',
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-border backdrop-blur-xl bg-background/80 glass sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CreatuAI
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#discover" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
              Discover
            </a>
            <a href="#research" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
              Research
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
              How It Works
            </a>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/auth')}
              className="text-sm text-muted-foreground hover:text-foreground transition-smooth hidden md:block"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-glow transition-smooth font-medium"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 glass transition-smooth animate-fade-in"
            style={{
              transform: `translateY(${scrollY * -0.1}px)`,
            }}
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Problem Discovery + Idea Validation</span>
          </div>

          {/* Title */}
          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight animate-fade-in"
            style={{
              transform: `translateY(${scrollY * -0.15}px)`,
              animationDelay: '0.1s',
            }}
          >
            Your Next Startup Idea
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              Exists in Real Conversations
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in"
            style={{
              transform: `translateY(${scrollY * -0.2}px)`,
              animationDelay: '0.2s',
            }}
          >
            We analyze <span className="text-foreground font-semibold">Reddit, Hacker News, and Twitter</span> to surface
            validated startup problems — then help you validate your own ideas with
            <span className="text-foreground font-semibold"> market sizing, pricing intel, and GTM strategies</span>.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in"
            style={{
              transform: `translateY(${scrollY * -0.25}px)`,
              animationDelay: '0.3s',
            }}
          >
            <button
              onClick={() => navigate('/auth')}
              className="group px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-lg shadow-glow hover:shadow-glow-strong transition-smooth hover:scale-105 flex items-center gap-3"
            >
              Explore Problems
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-smooth" />
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="group px-8 py-4 rounded-xl border border-border bg-background/50 text-foreground font-semibold text-lg hover:border-primary/30 hover:bg-background/80 transition-smooth flex items-center gap-3"
            >
              Research My Idea
              <Lightbulb className="w-5 h-5 text-primary" />
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl glass border border-border/50 animate-fade-in"
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Discover Section */}
      <section id="discover" className="relative z-10 py-32 px-6 bg-gradient-to-b from-background to-sidebar-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
              <Search className="w-4 h-4 text-violet-500" />
              <span className="text-sm text-violet-500 font-medium">Problem Discovery</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-8">
              Discover Problems
              <br />
              <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
                People Actually Have
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stop building solutions to problems nobody cares about. Our AI surfaces validated pain points
              from real conversations — complete with demand signals and pricing intelligence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {discoverFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative p-8 rounded-2xl glass border border-border hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-smooth shadow-lg`}>
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>

          {/* Demo Card */}
          <div className="mt-16 p-8 rounded-2xl glass border border-border bg-gradient-to-br from-violet-500/5 to-purple-600/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-4 text-sm text-muted-foreground">Live Problem Example</span>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <h4 className="text-xl font-bold mb-4">"Managing Revenue Share in B2B SaaS Partnerships"</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 text-sm">SaaS</span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-sm">B2B</span>
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm">Fintech</span>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><Quote className="w-4 h-4 text-primary" /> "We track this in spreadsheets and it's a nightmare…" — r/SaaS</p>
                  <p className="flex items-center gap-2"><Quote className="w-4 h-4 text-primary" /> "I'd pay $49/mo for something that just works" — HN user</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-background/50 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Opportunity Score</p>
                  <p className="text-2xl font-bold text-primary">87/100</p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Trend</p>
                  <p className="text-lg font-semibold text-emerald-500">↑ 23% this week</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Section */}
      <section id="research" className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <Zap className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-emerald-500 font-medium">Idea Validation</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-8">
              Research Your Idea
              <br />
              <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                In Under 60 Seconds
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have your own startup idea? Run it through our AI validator. Get a comprehensive report with
              market sizing, competitive analysis, pricing strategy, and a clear recommendation:
              <span className="text-foreground font-semibold"> PURSUE, EXPLORE, or AVOID</span>.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {validateFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="group p-8 rounded-2xl glass border border-border hover:border-emerald-500/30 transition-all duration-300 hover:scale-[1.02] text-center"
                >
                  <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-smooth shadow-lg`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>

          {/* Validation Report Preview */}
          <div className="p-8 rounded-2xl glass border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-lg font-bold">Sample Validation Report</h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-2xl font-bold text-emerald-500 border-2 border-emerald-500/30">
                    A
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-500">PURSUE</p>
                    <p className="text-xs text-muted-foreground">High Confidence</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-4 rounded-lg bg-background/50 border border-border">
                <p className="text-3xl font-bold text-foreground">$2.1B</p>
                <p className="text-xs text-muted-foreground mt-1">TAM</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50 border border-border">
                <p className="text-3xl font-bold text-foreground">$45/mo</p>
                <p className="text-xs text-muted-foreground mt-1">Median WTP</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50 border border-border">
                <p className="text-3xl font-bold text-foreground">3</p>
                <p className="text-xs text-muted-foreground mt-1">Competitors</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50 border border-border">
                <p className="text-3xl font-bold text-foreground">82%</p>
                <p className="text-xs text-muted-foreground mt-1">Confidence</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> 37s analysis</span>
              <span>•</span>
              <span>205 Reddit discussions</span>
              <span>•</span>
              <span>20 pricing data points</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 py-32 px-6 bg-gradient-to-b from-background to-sidebar-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold mb-8">
              Start Building
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Something That Matters
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to find and research your next startup opportunity.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {howItWorks.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div key={index} className="relative">
                  {index < 2 && (
                    <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-x-1/2" />
                  )}
                  <div className="p-8 rounded-2xl glass border border-border hover:border-primary/30 transition-smooth">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-4xl font-bold text-primary/30">{item.step}</span>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials/Quotes */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What Founders Are Saying
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonialQuotes.map((quote, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl glass border border-border text-center"
              >
                <Quote className="w-8 h-8 text-primary/30 mx-auto mb-4" />
                <p className="text-lg text-foreground italic">{quote}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 md:p-16 rounded-3xl glass border border-border bg-gradient-to-br from-primary/5 via-accent/5 to-emerald-500/5">
            <h2 className="text-4xl md:text-6xl font-bold mb-8">
              Your Next Big Idea
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-emerald-500 bg-clip-text text-transparent">
                Is Waiting to Be Found
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Thousands of people are sharing their problems online every day.
              We turn those conversations into your competitive advantage.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/auth')}
                className="group px-10 py-5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-lg shadow-glow hover:shadow-glow-strong transition-smooth hover:scale-105 inline-flex items-center justify-center gap-3"
              >
                Start Exploring Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-smooth" />
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="px-10 py-5 rounded-xl border border-border bg-background/50 text-foreground font-bold text-lg hover:border-primary/30 transition-smooth hover:scale-105 inline-flex items-center justify-center gap-3"
              >
                Research My Idea
                <Lightbulb className="w-5 h-5 text-primary" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-background/80 glass py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                CreatuAI
              </span>
            </div>
            <div className="flex items-center justify-center gap-8">
              <button
                onClick={() => navigate('/privacy')}
                className="text-muted-foreground hover:text-foreground transition-smooth text-sm"
              >
                Privacy
              </button>
              <a
                href="#discover"
                className="text-muted-foreground hover:text-foreground transition-smooth text-sm"
              >
                Discover
              </a>
              <a
                href="#research"
                className="text-muted-foreground hover:text-foreground transition-smooth text-sm"
              >
                Research
              </a>
            </div>
            <p className="text-muted-foreground text-sm text-center md:text-right">
              © 2025 CreatuAI. Real problems, validated.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
