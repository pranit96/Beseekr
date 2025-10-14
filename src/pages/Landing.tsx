// src/pages/Landing.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MessageSquare, Users, Zap, Brain, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
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
      title: 'Multi-Agent Intelligence',
      description: 'Multiple AI agents work together, each specialized in different domains to provide comprehensive solutions.',
      gradient: 'from-purple-500 to-indigo-600',
    },
    {
      icon: MessageSquare,
      title: 'Natural Conversations',
      description: 'Chat naturally with your AI team. They understand context, remember details, and collaborate seamlessly.',
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      icon: Zap,
      title: 'Smart Orchestration',
      description: 'Our intelligent system automatically routes your queries to the most relevant agents for optimal results.',
      gradient: 'from-pink-500 to-rose-600',
    },
    {
      icon: Users,
      title: 'Custom Agents',
      description: 'Create personalized AI agents tailored to your specific needs, workflows, and expertise areas.',
      gradient: 'from-emerald-500 to-teal-600',
    },
  ];

  const benefits = [
    'Save hours with intelligent automation',
    'Get expert-level insights instantly',
    'Scale your productivity effortlessly',
    'Access multiple specializations at once',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl"
          style={{
            top: '10%',
            left: '10%',
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-3xl"
          style={{
            bottom: '10%',
            right: '10%',
            transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] bg-pink-500/20 rounded-full blur-3xl"
          style={{
            top: '50%',
            left: '50%',
            transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/10 backdrop-blur-xl bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              CreatuAI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/privacy')}
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8 backdrop-blur-sm"
            style={{
              transform: `translateY(${scrollY * -0.1}px)`,
            }}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Next-Generation AI Platform</span>
          </div>

          <h1
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            style={{
              transform: `translateY(${scrollY * -0.15}px)`,
            }}
          >
            Your Personal
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
              AI Think Tank
            </span>
          </h1>

          <p
            className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            style={{
              transform: `translateY(${scrollY * -0.2}px)`,
            }}
          >
            Experience the power of multiple AI agents working in harmony. Get expert insights,
            creative solutions, and intelligent assistance across every domain—all in one conversation.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            style={{
              transform: `translateY(${scrollY * -0.25}px)`,
            }}
          >
            <button
              onClick={() => navigate('/auth')}
              className="group px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 font-semibold text-lg shadow-2xl shadow-purple-500/50 transition-all hover:scale-105 flex items-center gap-2"
            >
              Try Demo Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 font-semibold text-lg transition-all"
            >
              Learn More
            </button>
          </div>

          {/* Floating Cards Animation */}
          <div className="relative mt-20 h-64">
            <div
              className="absolute left-1/4 top-0 w-48 h-32 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-white/10 p-4 animate-float-slow"
              style={{
                transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
              }}
            >
              <MessageSquare className="w-8 h-8 text-purple-400 mb-2" />
              <p className="text-sm text-slate-300">Natural conversations</p>
            </div>
            <div
              className="absolute right-1/4 top-12 w-48 h-32 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-xl border border-white/10 p-4"
              style={{
                transform: `translate(${-mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
                animation: 'float-slow 6s ease-in-out infinite 1s',
              }}
            >
              <Zap className="w-8 h-8 text-cyan-400 mb-2" />
              <p className="text-sm text-slate-300">Lightning fast</p>
            </div>
            <div
              className="absolute left-1/3 bottom-0 w-48 h-32 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 backdrop-blur-xl border border-white/10 p-4"
              style={{
                transform: `translate(${mousePosition.x * 0.3}px, ${-mousePosition.y * 0.3}px)`,
                animation: 'float-slow 6s ease-in-out infinite 2s',
              }}
            >
              <Brain className="w-8 h-8 text-pink-400 mb-2" />
              <p className="text-sm text-slate-300">Multi-agent AI</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Powerful Features for
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Modern Productivity
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Everything you need to supercharge your workflow with intelligent AI assistance
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all hover:scale-105"
                style={{
                  animation: `fade-in-up 0.6s ease-out ${index * 0.1}s backwards`,
                }}
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-slate-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 py-32 px-6 bg-white/5 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                Why Choose
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  CreatuAI?
                </span>
              </h2>
              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4"
                    style={{
                      animation: `slide-in-right 0.5s ease-out ${index * 0.1}s backwards`,
                    }}
                  >
                    <CheckCircle2 className="w-6 h-6 text-cyan-400 shrink-0 mt-1" />
                    <p className="text-lg text-slate-300">{benefit}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/auth')}
                className="mt-12 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 font-semibold text-lg shadow-2xl shadow-purple-500/50 transition-all hover:scale-105 flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <div className="relative w-full h-96 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 backdrop-blur-xl border border-white/10 p-8 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]" />
                <Shield className="w-20 h-20 text-purple-400 mb-6 relative z-10" />
                <h3 className="text-2xl font-bold mb-4 relative z-10">Enterprise Security</h3>
                <p className="text-slate-300 relative z-10">
                  Your data is encrypted and secure. We never share your conversations or personal
                  information with third parties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 backdrop-blur-xl border border-white/20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Your Workflow?
              </span>
            </h2>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Join thousands of users who are already experiencing the future of AI collaboration
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="px-10 py-5 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-bold text-lg shadow-2xl transition-all hover:scale-105 inline-flex items-center gap-2"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 backdrop-blur-xl bg-slate-950/50 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              CreatuAI
            </span>
          </div>
          <div className="flex items-center justify-center gap-8 mb-6">
            <button
              onClick={() => navigate('/privacy')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Sign In
            </button>
          </div>
          <p className="text-slate-400 text-sm">
            © 2024 CreatuAI. Empowering creativity with intelligent AI.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;