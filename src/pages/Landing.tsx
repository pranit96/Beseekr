// src/pages/Landing.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MessageSquare, Users, Zap, Brain, ArrowRight, CheckCircle2 } from 'lucide-react';

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

  const features = [
    {
      icon: Brain,
      title: 'Evidence-Based Discovery',
      description: 'Clustering of real user conversations reveals startup problems people are actively struggling with.',
      color: 'from-agent-1 to-agent-2',
    },
    {
      icon: MessageSquare,
      title: 'Demand & Pricing Signals',
      description: 'Extracts pricing intent from conversations: “I’d pay $49/mo…” and other willingness-to-pay signals.',
      color: 'from-agent-3 to-agent-4',
    },
    {
      icon: Zap,
      title: 'Trend Tracking',
      description: 'Daily snapshots show rising problems, fading pains, and emerging opportunities before anyone else sees it.',
      color: 'from-agent-2 to-agent-3',
    },
    {
      icon: Users,
      title: 'Real Founder Quotes',
      description: 'Direct quotes from founders describing their pain. No summaries — just raw insight.',
      color: 'from-agent-4 to-agent-5',
    },
  ];

  const benefits = [
    'Skip months of idea validation',
    'Build what people are already begging for',
    'Replace opinions with real user demand',
    'Turn thousands of conversations into clear insight',
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
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-border backdrop-blur-xl bg-background/80 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CreatuAI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/privacy')}
              className="text-sm text-muted-foreground hover:text-foreground transition-smooth"
            >
              Privacy
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:shadow-glow transition-smooth font-medium"
            >
              Explore Problems
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-48 px-6">
        <div className="max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 glass transition-smooth"
            style={{
              transform: `translateY(${scrollY * -0.1}px)`,
            }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Validated Startup Problems</span>
          </div>

          {/* Title */}
          <h1
            className="text-6xl md:text-8xl font-bold mb-8 leading-tight"
            style={{
              transform: `translateY(${scrollY * -0.15}px)`,
            }}
          >
            Find Real Problems <br /> Worth Building
          </h1>

          {/* Subtitle */}
          <p
            className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
            style={{
              transform: `translateY(${scrollY * -0.2}px)`,
            }}
          >
            Discover validated startup opportunities backed by real usage data from Reddit, HackerNews, Twitter, and LinkedIn.
            No surveys. No guesswork. Just evidence.
          </p>

          {/* CTA */}
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            style={{
              transform: `translateY(${scrollY * -0.25}px)`,
            }}
          >
            <button
              onClick={() => navigate('/auth')}
              className="group px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-lg shadow-glow hover:shadow-glow-strong transition-smooth hover:scale-105 flex items-center gap-3"
            >
              Explore Problems
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-smooth" />
            </button>
          </div>

          {/* Floating Cards */}
          <div className="relative mt-32 h-64">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className={`absolute w-56 h-40 rounded-2xl glass border border-border p-6 animate-float-slow`}
                style={{
                  left: `${20 + index * 30}%`,
                  top: index % 2 === 0 ? '0%' : '20%',
                  animationDelay: `${index * 2}s`,
                  transform: `translate(${mousePosition.x * (0.3 + index * 0.1)}px, ${mousePosition.y * (0.3 + index * 0.1)}px)`,
                }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${features[index].color} flex items-center justify-center mb-4 shadow-glow`}>
                  {(() => {
                    const IconComponent = features[index].icon;
                    return <IconComponent className="w-6 h-6 text-primary-foreground" />;
                  })()}
                </div>
                <p className="text-sm font-medium text-foreground">{features[index].title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 px-6 bg-gradient-to-b from-background to-sidebar-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-8">
              Powered by <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Real User Demand
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Thousands of conversations turned into actionable insights — so you can build something that truly matters.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative p-8 rounded-2xl glass border border-border hover:border-primary/30 transition-smooth hover:scale-105"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-smooth shadow-glow`}>
                    <IconComponent className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl md:text-6xl font-bold mb-8">
                Stop Guessing. <br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Start Knowing.
                </span>
              </h2>
              <div className="space-y-6 mb-12">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-lg text-foreground font-medium">{benefit}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/auth')}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-lg shadow-glow hover:shadow-glow-strong transition-smooth hover:scale-105 flex items-center gap-3"
              >
                Explore Problems
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Demo */}
            <div className="relative">
              <div className="relative w-full h-96 rounded-2xl glass border border-border p-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="space-y-4 text-left">
                    <p className="text-lg font-bold text-foreground">
                      Example Problem:
                    </p>
                    <p className="text-md text-foreground">
                      “Managing revenue share in B2B SaaS deals”
                    </p>
                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <p>Frequency: 87 (↑ 23% this week)</p>
                      <p>Pricing: “I’d pay $49/mo…” (12 mentions)</p>
                      <p>Competitors: Capshare, Stigg</p>
                      <p>Source: Reddit, HackerNews</p>
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground italic">
                      “We literally track this in spreadsheets…” — Reddit user
                    </div>
                    <div className="text-sm text-muted-foreground italic">
                      “Revenue split changes constantly…” — HN user
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl glass border border-border bg-gradient-to-br from-primary/5 to-accent/5">
            <h2 className="text-5xl md:text-6xl font-bold mb-8">
              Build What People <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Actually Want
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Thousands of founders are already talking about their biggest problems.
              You just need to listen the right way.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="px-10 py-5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-lg shadow-glow hover:shadow-glow-strong transition-smooth hover:scale-105 inline-flex items-center gap-3"
            >
              Explore Problems
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-background/80 glass py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CreatuAI
            </span>
          </div>
          <div className="flex items-center justify-center gap-8 mb-6">
            <button
              onClick={() => navigate('/privacy')}
              className="text-muted-foreground hover:text-foreground transition-smooth"
            >
              Privacy
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="text-muted-foreground hover:text-foreground transition-smooth"
            >
              Sign In
            </button>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2025 CreatuAI. Real problems, validated.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
