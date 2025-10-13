"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Sun, Moon, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import Image from "next/image";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const { login, signup } = useAuth();

  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([]);
  const [messages] = useState([
    "Imagine Smarter.",
    "Talk to Your AI Team.",
    "Ideas That Grow With You.",
    "Dream. Type. Discover.",
  ]);
  const [currentMsg, setCurrentMsg] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check system preference for dark mode
  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Bubble animation setup - adjust colors based on mode
  useEffect(() => {
    const createBubbles = () => {
      const arr = Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 25 + 8,
        delay: Math.random() * 5,
      }));
      setBubbles(arr);
    };
    createBubbles();
  }, []);

  // Rotating message effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMsg((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [messages]);

  // Parallax effect for bubbles
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const moveX = (e.clientX / innerWidth - 0.5) * 10;
      const moveY = (e.clientY / innerHeight - 0.5) * 10;
      
      document.documentElement.style.setProperty("--mouse-x", `${moveX}px`);
      document.documentElement.style.setProperty("--mouse-y", `${moveY}px`);
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleEmailInput = (val: string, type: "login" | "signup") => {
    if (type === "login") setLoginEmail(val);
    else setSignupEmail(val);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (error) {
      setLoginPassword("");
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
      setSignupPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-background transition-colors duration-300">
      {/* Theme Toggle */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="absolute top-6 right-6 z-50 p-3 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm hover:shadow-medium transition-all duration-300 group"
        aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDarkMode ? (
          <Sun className="w-5 h-5 text-foreground group-hover:scale-110 transition-transform" />
        ) : (
          <Moon className="w-5 h-5 text-foreground group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* LEFT SIDE - Visuals */}
      <div className={`hidden lg:flex lg:w-[60%] relative justify-center items-center overflow-hidden transition-colors duration-500 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100'
      }`}>
        <Image
          src="/images/kid-smiling-toy.jpg"
          alt="Creative AI experience"
          fill
          priority
          className="object-cover object-center scale-105 animate-fade-in transition-transform duration-700"
        />
        
        {/* Dynamic Overlay based on mode */}
        <div className={`absolute inset-0 transition-all duration-500 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-primary/40 via-background/50 to-background/80' 
            : 'bg-gradient-to-br from-white/40 via-background/30 to-background/60 backdrop-blur-xs'
        }`} />

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Bubbles with mode-appropriate colors and parallax */}
          {bubbles.map((bubble) => (
            <div
              key={bubble.id}
              className={`absolute rounded-full animate-float-slow backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-primary/25 border border-primary/30' 
                  : 'bg-primary/20 border border-primary/20'
              }`}
              style={{
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                animationDelay: `${bubble.delay}s`,
                transform: `translate(var(--mouse-x), var(--mouse-y))`,
              }}
            />
          ))}

          {/* Floating particles */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 rounded-full animate-pulse ${
                isDarkMode ? 'bg-primary/40' : 'bg-primary/30'
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Floating Text */}
        <div className="absolute z-20 text-center px-6 animate-fade-in-up max-w-4xl">
          <div className="mb-8">
            <h1 className={`text-5xl md:text-6xl xl:text-7xl font-black mb-6 transition-all duration-700 ${
              isDarkMode 
                ? 'text-white drop-shadow-glow' 
                : 'text-gray-900 drop-shadow-sm'
            }`}>
              {messages[currentMsg]}
            </h1>
            <p className={`text-xl md:text-2xl max-w-3xl mx-auto font-medium leading-relaxed ${
              isDarkMode ? 'text-white/90' : 'text-gray-700/95'
            }`}>
              Step into a world where every AI collaborates like a friend. Your ideas, shared and evolved.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {['AI Collaboration', 'Smart Ideas', 'Creative Flow', 'Team Work'].map((feature, index) => (
              <span
                key={feature}
                className={`px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm border transition-all duration-300 ${
                  isDarkMode
                    ? 'bg-primary/20 border-primary/30 text-white/90 hover:bg-primary/30'
                    : 'bg-white/60 border-white/40 text-gray-700 hover:bg-white/80'
                }`}
                style={{ animationDelay: `${index * 100 + 500}ms` }}
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Sparkle overlay - enhanced for dark mode */}
        {isDarkMode && (
          <div className="absolute inset-0 pointer-events-none animate-shimmer bg-[linear-gradient(110deg,transparent,transparent,transparent,transparent,transparent,rgba(255,255,255,0.03),transparent,transparent,transparent,transparent,transparent)] bg-[length:200%_100%] opacity-60" />
        )}
      </div>

      {/* RIGHT SIDE - Auth Form */}
      <div className="flex-1 lg:w-[40%] flex items-center justify-center p-4 sm:p-8 bg-background relative">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/50 to-background/80 lg:hidden" />
        
        <Card className={`w-full max-w-md p-6 sm:p-8 border transition-all duration-500 relative z-10 ${
          isDarkMode 
            ? 'bg-card/90 backdrop-blur-sm border-primary/20 shadow-strong hover:shadow-glow' 
            : 'bg-card/95 backdrop-blur-xs border-border/50 shadow-strong hover:shadow-glow-light'
        }`}>
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className={`h-20 w-20 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all duration-500 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-primary to-accent shadow-glow-strong' 
                  : 'bg-gradient-to-br from-primary to-accent shadow-glow-light'
              }`}>
                <Sparkles className="w-10 h-10 text-white animate-pulse-glow" />
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                CreatuAI
              </h1>
              <p className={`text-sm mt-2 font-medium ${
                isDarkMode ? 'text-muted-foreground' : 'text-muted-foreground/80'
              }`}>
                Where Creativity Meets Intelligence
              </p>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">
              Welcome Back
            </h2>
            <p className={`text-sm ${
              isDarkMode ? 'text-muted-foreground' : 'text-muted-foreground/90'
            }`}>
              Continue your creative AI journey
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className={`grid w-full grid-cols-2 mb-8 transition-colors ${
              isDarkMode ? 'bg-muted/50' : 'bg-muted/30'
            }`}>
              <TabsTrigger 
                value="login" 
                className="transition-all duration-300 data-[state=active]:shadow-sm"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="transition-all duration-300 data-[state=active]:shadow-sm"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* LOGIN FORM */}
            <TabsContent value="login" className="animate-scale-in">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="login-email" className="text-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      className="h-12 pl-10 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      value={loginEmail}
                      onChange={(e) => handleEmailInput(e.target.value, "login")}
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="login-password" className="text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      className="h-12 pl-10 pr-10 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className={`w-full h-12 transition-all duration-300 font-semibold text-base ${
                    isDarkMode 
                      ? 'shadow-medium hover:shadow-glow-strong' 
                      : 'shadow-soft hover:shadow-glow'
                  }`} 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Logging in...
                    </div>
                  ) : (
                    "Login to Your Account"
                  )}
                </Button>
              </form>

              {/* Forgot password link */}
              <div className="text-center mt-6">
                <button 
                  type="button" 
                  className={`text-sm font-medium transition-colors ${
                    isDarkMode 
                      ? 'text-primary/80 hover:text-primary' 
                      : 'text-primary/70 hover:text-primary'
                  }`}
                >
                  Forgot your password?
                </button>
              </div>
            </TabsContent>

            {/* SIGNUP FORM */}
            <TabsContent value="signup" className="animate-scale-in">
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="signup-name" className="text-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      required
                      className="h-12 pl-10 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="signup-email" className="text-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      className="h-12 pl-10 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      value={signupEmail}
                      onChange={(e) => handleEmailInput(e.target.value, "signup")}
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="signup-password" className="text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      className="h-12 pl-10 pr-10 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-muted-foreground/80' : 'text-muted-foreground/70'
                  }`}>
                    Use 8+ characters with a mix of letters, numbers & symbols
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className={`w-full h-12 transition-all duration-300 font-semibold text-base ${
                    isDarkMode 
                      ? 'shadow-medium hover:shadow-glow-strong' 
                      : 'shadow-soft hover:shadow-glow'
                  }`} 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Account...
                    </div>
                  ) : (
                    "Start Your Journey"
                  )}
                </Button>
              </form>

              {/* Terms notice */}
              <p className={`text-xs text-center mt-6 ${
                isDarkMode ? 'text-muted-foreground/70' : 'text-muted-foreground/60'
              }`}>
                By signing up, you agree to our{' '}
                <button type="button" className="underline hover:text-primary transition-colors">
                  Terms of Service
                </button>{' '}
                and{' '}
                <button type="button" className="underline hover:text-primary transition-colors">
                  Privacy Policy
                </button>
              </p>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;