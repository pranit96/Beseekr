import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Bot, Workflow, Zap, Users } from 'lucide-react';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const { login, signup } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (error) {
      setLoginPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signup(signupEmail, signupPassword, signupName);
    } catch (error) {
      setSignupPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Bot,
      title: 'Multi-Agent AI',
      description: 'Orchestrate multiple AI agents working together seamlessly',
    },
    {
      icon: Workflow,
      title: 'Smart Workflows',
      description: 'Design custom workflows with sequential or parallel execution',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Get responses in seconds with optimized AI processing',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Share agents and workflows across your team',
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left side - 60% - Features showcase */}
      <div className="hidden lg:flex lg:w-[60%] bg-gradient-to-br from-primary/10 via-accent/5 to-background p-12 flex-col justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="mb-12 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AgentFlow
              </h1>
            </div>
            <p className="text-2xl font-semibold text-foreground mb-4">
              Orchestrate Intelligent AI Agents
            </p>
            <p className="text-muted-foreground text-lg">
              The next generation platform for building, managing, and deploying multi-agent AI systems. 
              Transform your workflow with intelligent automation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-background/60 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-glow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">
                  "AgentFlow transformed how we handle complex AI tasks. The multi-agent orchestration is game-changing!"
                </p>
                <p className="text-sm text-muted-foreground">— Sarah Chen, AI Engineer</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - 40% - Auth form */}
      <div className="flex-1 lg:w-[40%] flex items-center justify-center p-4 sm:p-8 bg-background">
        <Card className="w-full max-w-md p-6 sm:p-8 glass shadow-strong animate-fade-in">
          <div className="text-center mb-8">
            <div className="lg:hidden mb-6">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center shadow-glow">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AgentFlow
              </h1>
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">
              Sign in to continue orchestrating your AI agents
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="h-11"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="h-11"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 shadow-medium hover:shadow-glow transition-smooth"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    required
                    className="h-11"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="h-11"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="h-11"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 shadow-medium hover:shadow-glow transition-smooth"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
