"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles } from "lucide-react";
import Image from "next/image";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const { login, signup } = useAuth();

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

  // Parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      document.documentElement.style.setProperty("--mouse-x", `${(e.clientX / innerWidth - 0.5) * 20}px`);
      document.documentElement.style.setProperty("--mouse-y", `${(e.clientY / innerHeight - 0.5) * 20}px`);
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

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* LEFT SIDE - Visuals */}
      <div className="hidden lg:flex lg:w-[60%] relative justify-center items-center overflow-hidden">
        <Image
          src="/images/kid-smiling-toy.jpg"
          alt="Creative AI experience"
          fill
          priority
          className="object-cover object-center scale-105 animate-fade-in"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/50 via-background/70 to-background/90 mix-blend-multiply" />

        {/* Bubbles */}
        {bubbles.map((b) => (
          <div
            key={b.id}
            className="absolute rounded-full bg-primary/20 backdrop-blur-sm animate-float-slow"
            style={{
              width: `${b.size}px`,
              height: `${b.size}px`,
              left: `${b.x}%`,
              top: `${b.y}%`,
              transform: `translate(var(--mouse-x), var(--mouse-y))`,
            }}
          />
        ))}

        {/* Floating Text */}
        <div className="absolute z-20 text-center px-6 animate-fade-in">
          <h1 className="text-5xl font-extrabold text-white drop-shadow-glow mb-4 transition-all duration-700">
            {messages[currentMsg]}
          </h1>
          <p className="text-lg text-white/80 max-w-lg mx-auto">
            Step into a world where every AI collaborates like a friend. Your ideas, shared and evolved.
          </p>
        </div>

        {/* Sparkle overlay */}
        <div className="absolute inset-0 pointer-events-none animate-shimmer bg-[linear-gradient(110deg,rgba(255,255,255,0.1),rgba(255,255,255,0.05),rgba(255,255,255,0.1))] bg-[length:200%_100%] opacity-30" />
      </div>

      {/* RIGHT SIDE - Auth Form */}
      <div className="flex-1 lg:w-[40%] flex items-center justify-center p-4 sm:p-8 bg-background relative">
        <Card className="w-full max-w-md p-6 sm:p-8 glass shadow-strong border border-primary/20 hover:shadow-glow transition-all">
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center shadow-glow">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                CreatuAI
              </h1>
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-foreground">Let’s continue your creative AI journey </h2>
            {/* <p className="text-muted-foreground">Let’s continue your creative AI journey</p> */}
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
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
        </Card>
      </div>
    </div>
  );
};

export default Auth;