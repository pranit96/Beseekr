import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles } from 'lucide-react';
import Image from 'next/image';

const emailSuggestions = ['@gmail.com', '@outlook.com', '@yahoo.com', '@icloud.com'];

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [emailHint, setEmailHint] = useState<string[]>([]);
  const { login, signup } = useAuth();

  useEffect(() => {
    if (signupEmail.includes('@')) {
      setEmailHint([]);
    } else if (signupEmail.length > 0) {
      setEmailHint(emailSuggestions.map((domain) => signupEmail + domain));
    } else {
      setEmailHint([]);
    }
  }, [signupEmail]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
    } catch {
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
    } catch {
      setSignupPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Bubbles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-6 h-6 bg-white/40 rounded-full blur-md animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 5}s`,
              transform: `scale(${0.5 + Math.random()})`,
            }}
          />
        ))}
      </div>

      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-[60%] flex-col justify-center items-center relative text-center p-12">
        <div className="relative z-10">
          <h1 className="text-5xl font-extrabold text-primary drop-shadow-md mb-4">Welcome to AgentFlow 🌟</h1>
          <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
            Connect, create, and collaborate with AI agents that understand your vibe. It’s like teamwork — but cooler, faster, and a little more magical.
          </p>
          <Image
            src="/images/kid-smiling-toy.png"
            alt="Happy kid with toy representing creative collaboration"
            width={400}
            height={400}
            className="rounded-3xl shadow-lg border border-gray-200 hover:scale-105 transition-transform duration-700 mx-auto"
          />
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md p-8 backdrop-blur-lg bg-white/70 shadow-lg rounded-3xl border border-white/40">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h2 className="text-3xl font-semibold text-gray-800">Hey there 👋</h2>
            <p className="text-gray-500">Let’s get you signed in or create a new adventure.</p>
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
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    required
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
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Let’s Go 🚀'}
                </Button>
              </form>
            </TabsContent>

            {/* SIGNUP */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 relative">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                  />
                </div>
                <div className="space-y-2 relative">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="text"
                    placeholder="you@example.com"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                  />
                  {emailHint.length > 0 && (
                    <ul className="absolute top-full mt-1 left-0 w-full bg-white shadow-md rounded-md z-10 border border-gray-200 animate-fade-in">
                      {emailHint.map((suggestion) => (
                        <li
                          key={suggestion}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
                          onClick={() => setSignupEmail(suggestion)}
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating your space...' : 'Sign Up ✨'}
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
