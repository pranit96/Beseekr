import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, ArrowLeft } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { login, signup } = useAuth();
  const { toast } = useToast();

  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number; size: number }[]>([]);
  const [messages] = useState([
    "Imagine Smarter.",
    "Talk to Your AI Team.",
    "Ideas That Grow With You.",
    "Dream. Type. Discover.",
  ]);
  const [currentMsg, setCurrentMsg] = useState(0);

  // Bubble animation setup
  useEffect(() => {
    const createBubbles = () => {
      const arr = Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 30 + 10,
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

  // Parallax effect (subtle)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      document.documentElement.style.setProperty("--mouse-x", `${(e.clientX / innerWidth - 0.5) * 12}px`);
      document.documentElement.style.setProperty("--mouse-y", `${(e.clientY / innerHeight - 0.5) * 12}px`);
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await apiClient.forgotPassword(forgotPasswordEmail);
      if (response.success) {
        toast({
          title: "Email sent",
          description: response.message || "If an account exists with this email, a password reset link has been sent.",
        });
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-white text-slate-900 dark:bg-background dark:text-foreground">
      {/* LEFT SIDE - Visuals */}
      <div className="hidden lg:flex lg:w-[60%] relative justify-center items-center overflow-hidden">
        <img
          src="/images/kid-smiling-toy.jpg"
          alt="Creative AI experience"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 animate-fade-in"
        />

        {/* Overlay */}
        <div className="absolute inset-0 mix-blend-multiply pointer-events-none
                        bg-gradient-to-br from-primary/30 via-white/60 to-white/90
                        dark:from-primary/50 dark:via-background/70 dark:to-background/90" />

        {/* Bubbles */}
        {bubbles.map((b) => (
          <div
            key={b.id}
            className="absolute rounded-full bg-primary/20 backdrop-blur-xs animate-float-slow"
            style={{
              width: `${b.size}px`,
              height: `${b.size}px`,
              left: `${b.x}%`,
              top: `${b.y}%`,
              transform: `translate(var(--mouse-x), var(--mouse-y))`,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            }}
          />
        ))}

        {/* Floating Text */}
        <div className="absolute z-20 text-center px-6 animate-fade-in max-w-4xl">
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold drop-shadow-md mb-3 transition-all duration-700 text-slate-900 dark:text-white"
            aria-live="polite"
          >
            {messages[currentMsg]}
          </h1>
          <p className="text-base md:text-lg text-slate-700 dark:text-white/80 max-w-2xl mx-auto">
            Step into a world where every AI collaborates like a friend. Your ideas, shared and evolved.
          </p>
        </div>

        {/* Sparkle overlay */}
        <div className="absolute inset-0 pointer-events-none animate-shimmer bg-[linear-gradient(110deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03),rgba(255,255,255,0.06))] bg-[length:200%_100%] opacity-60 dark:opacity-30" />
      </div>

      {/* RIGHT SIDE - Auth Form */}
      <div className="flex-1 lg:w-[40%] flex items-center justify-center p-4 sm:p-8 relative">
        <Card className="w-full max-w-md p-6 sm:p-8 glass shadow-strong border border-primary/20 transition-all
                          bg-white/95 text-slate-900 dark:bg-card/90 dark:text-foreground">
          <div className="text-center mb-6">
            <div className="mb-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent mx-auto mb-3 flex items-center justify-center shadow-glow">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                CreatuAI
              </h1>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2 text-slate-700 dark:text-foreground">
              Let's continue your creative AI journey
            </h2>
          </div>

          {showForgotPassword ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForgotPassword(false)}
                className="mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-foreground">Reset Password</h3>
                <p className="text-sm text-slate-600 dark:text-muted-foreground mt-1">
                  Enter your email and we'll send you a reset link
                </p>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="h-11"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full h-11 shadow-medium hover:shadow-glow" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </div>
          ) : (
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* LOGIN */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        className="h-11"
                        value={loginEmail}
                        onChange={(e) => handleEmailInput(e.target.value, "login")}
                      />
                    </div>
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
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-primary hover:text-primary/80 p-0 h-auto"
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <Button type="submit" className="w-full h-11 shadow-medium hover:shadow-glow" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              {/* SIGNUP */}
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
                    <div className="relative">
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        className="h-11"
                        value={signupEmail}
                        onChange={(e) => handleEmailInput(e.target.value, "signup")}
                      />
                    </div>
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
                  <Button type="submit" className="w-full h-11 shadow-medium hover:shadow-glow" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Auth;