import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Zap,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  supabase,
  isSupabaseConfigured,
  isSafariBrowser,
} from "@/lib/supabase";
import { analytics } from "@/lib/analytics";
import { Logo } from "@/components/Logo";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resendCountdown, setResendCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, signup, verifyMFA } = useAuth();
  const { toast } = useToast();
  const [mfaData, setMfaData] = useState<{
    factorId: string;
    userId: string;
  } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);

  // Google OAuth handler
  const handleGoogleSignIn = async () => {
    // Track Google OAuth initiation
    analytics.track("google_oauth_initiated", { source: "auth_page" });

    if (!isSupabaseConfigured()) {
      analytics.track("google_oauth_error", { error: "not_configured" });
      toast({
        title: "Configuration Error",
        description:
          "Google sign-in is not available. Please contact support or try email/password signup.",
        variant: "destructive",
      });
      console.error("Supabase not configured - missing environment variables");
      return;
    }

    setIsGoogleLoading(true);

    // Detect Safari for conditional handling
    const isSafari = isSafariBrowser();

    // Initiating Google OAuth

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: false, // Explicitly use redirect flow (not popup)
          queryParams: {
            access_type: "offline", // Request refresh token
            prompt: "consent", // Force consent screen to ensure we get refresh token
          },
        },
      });

      if (error) {
        throw error;
      }
      // If no error, browser will redirect to Google
      // On Safari mobile, this may take a moment
      console.log("Redirecting to Google OAuth...");
    } catch (error: any) {
      analytics.track("google_oauth_error", { error: error.message });
      console.error("Google sign-in error:", error);

      // Provide more helpful error message for Safari users
      let errorMessage =
        error.message || "Could not connect to Google. Please try again.";

      if (isSafari && error.message?.includes("popup")) {
        errorMessage =
          "Safari blocked the sign-in popup. Please allow popups and try again, or use email/password signup.";
      } else if (isSafari) {
        errorMessage = `${errorMessage} If this persists on Safari, try using email/password signup instead.`;
      }

      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };

  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // Password validation function
  const validatePassword = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  };

  const isPasswordValid = (validation: typeof passwordValidation) => {
    return Object.values(validation).every(Boolean);
  };

  const [bubbles, setBubbles] = useState<
    { id: number; x: number; y: number; size: number }[]
  >([]);
  const [messages] = useState([
    "Find Real Problems.",
    "Build What Matters.",
    "Validated Opportunities.",
    "Your Next Startup Idea.",
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
      document.documentElement.style.setProperty(
        "--mouse-x",
        `${(e.clientX / innerWidth - 0.5) * 12}px`,
      );
      document.documentElement.style.setProperty(
        "--mouse-y",
        `${(e.clientY / innerHeight - 0.5) * 12}px`,
      );
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Countdown timer for resend verification
  useEffect(() => {
    if (!verificationPending || canResend) return;

    if (resendCountdown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [verificationPending, resendCountdown, canResend]);

  // SAFARI FIX: Clean up potentially corrupt OAuth state on mount
  // This prevents the Google button from disappearing after failed OAuth attempts
  useEffect(() => {
    const cleanupOAuthState = () => {
      try {
        // Check if we just came from a failed OAuth attempt
        const oauthRefreshAttempted = sessionStorage.getItem(
          "oauth-refresh-attempted",
        );

        if (oauthRefreshAttempted) {
          console.log("Cleaning up OAuth state from previous attempt");
          sessionStorage.removeItem("oauth-refresh-attempted");

          // Don't remove beseekr-auth-token here as it might be a valid session
          // Only remove if it's clearly corrupted (Supabase returns error)
          const checkSupabaseState = async () => {
            try {
              const { data, error } = await supabase.auth.getSession();
              if (error || !data.session) {
                console.log(
                  "No valid Supabase session found, cleaning up storage",
                );
                localStorage.removeItem("beseekr-auth-token");
              }
            } catch (e) {
              console.log(
                "Supabase session check failed, storage might be corrupted",
              );
              // Don't remove - let user try OAuth again
            }
          };

          checkSupabaseState();
        }
      } catch (e) {
        console.error("OAuth state cleanup error:", e);
      }
    };

    cleanupOAuthState();
  }, []); // Only run on mount

  const handleEmailInput = (val: string, type: "login" | "signup") => {
    if (type === "login") setLoginEmail(val);
    else setSignupEmail(val);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    analytics.track("login_initiated", { method: "email" });
    setIsLoading(true);
    setLoginError("");
    try {
      const res = await login(loginEmail, loginPassword);
      if (res?.mfa_required) {
        setMfaData(res);
        analytics.track("mfa_challenge_shown", { method: "email" });
      } else {
        analytics.track("login_success", { method: "email" });
      }
    } catch (error: any) {
      analytics.track("login_error", { method: "email", error: error.message });
      const errorMsg = error.message || "Invalid email or password";
      setLoginError(errorMsg);
      setLoginPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    analytics.track("signup_initiated", { method: "email" });
    setIsLoading(true);
    setSignupError("");

    // Validate password format before submitting
    const validation = validatePassword(signupPassword);
    if (!isPasswordValid(validation)) {
      analytics.track("signup_validation_error", {
        error: "password_requirements",
      });
      setSignupError("Please ensure your password meets all requirements");
      setIsLoading(false);
      return;
    }

    try {
      await signup(signupEmail, signupPassword, signupName);
      analytics.track("signup_success", { method: "email" });
      // If we get here, signup was successful and user is logged in
    } catch (error: any) {
      // Check if this is email verification required (not an actual error)
      if (
        error.isEmailVerificationRequired ||
        error.message?.includes("verify your email") ||
        error.message?.includes("email confirmation")
      ) {
        // Show verification pending screen silently (no error message)
        analytics.track("verification_email_shown", { email: signupEmail });
        setVerificationEmail(signupEmail);
        setVerificationPending(true);
        // Clear form
        setSignupName("");
        setSignupEmail("");
        setSignupPassword("");
      } else {
        // This is an actual error - show it
        analytics.track("signup_error", {
          method: "email",
          error: error.message,
        });
        const errorMsg = error.message || "Failed to create account";
        setSignupError(errorMsg);
        setSignupPassword("");
      }
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
          description:
            response.message ||
            "If an account exists with this email, a password reset link has been sent.",
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

  const handleResendVerification = async () => {
    if (!canResend || isResending) return;

    analytics.track("verification_email_resend_initiated", {
      email: verificationEmail,
    });
    setIsResending(true);
    try {
      const response =
        await apiClient.resendVerificationEmail(verificationEmail);
      if (response.success) {
        analytics.track("verification_email_resent", {
          email: verificationEmail,
        });
        toast({
          title: "Email sent!",
          description:
            "If an account exists with this email and is not yet verified, you will receive a verification link.",
        });
        // Reset countdown (reduced from 60s to 30s for better UX)
        setResendCountdown(30);
        setCanResend(false);
      }
    } catch (error: any) {
      analytics.track("verification_email_resend_error", {
        error: error.message,
      });
      toast({
        title: "Failed to resend",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
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
        <div
          className="absolute inset-0 mix-blend-multiply pointer-events-none
                        bg-gradient-to-br from-primary/30 via-white/60 to-white/90
                        dark:from-primary/50 dark:via-background/70 dark:to-background/90"
        />

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
            Discover validated startup problems from real conversations. Turn
            market insights into your next big idea.
          </p>
        </div>

        {/* Sparkle overlay */}
        <div className="absolute inset-0 pointer-events-none animate-shimmer bg-[linear-gradient(110deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03),rgba(255,255,255,0.06))] bg-[length:200%_100%] opacity-60 dark:opacity-30" />
      </div>

      {/* RIGHT SIDE - Auth Form */}
      <div className="flex-1 lg:w-[40%] flex items-center justify-center p-4 sm:p-8 relative">
        <Card
          className="w-full max-w-md p-6 sm:p-8 glass shadow-strong border border-primary/20 transition-all
                          bg-white/95 text-slate-900 dark:bg-card/90 dark:text-foreground"
        >
          <div className="text-center px-6 py-12">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <div className="w-28 sm:w-32 opacity-90">
                <Logo />
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-foreground">
              Discover opportunities that already work.
            </h1>

            {/* Subheading */}
            <p className="mt-3 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Skip the guesswork. Explore ideas backed by real validation,
              traction, and demand.
            </p>
          </div>
          {verificationPending ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center animate-bounce-slow">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800 dark:text-foreground">
                  Verification Email Sent!
                </h3>
                <p className="text-sm text-slate-600 dark:text-muted-foreground">
                  We've sent a verification link to:
                </p>
                <p className="text-base font-semibold text-primary">
                  {verificationEmail}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-2 text-left border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                  📧 Next Steps:
                </p>
                <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the verification link in the email</li>
                  <li>Return here and log in with your credentials</li>
                </ol>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleResendVerification}
                  disabled={!canResend || isResending}
                  className="w-full h-11 shadow-medium hover:shadow-glow"
                  variant={canResend ? "default" : "secondary"}
                >
                  {isResending
                    ? "Sending..."
                    : canResend
                      ? "Resend Verification Email"
                      : `Resend available in ${resendCountdown}s`}
                </Button>

                <Button
                  onClick={() => {
                    setVerificationPending(false);
                    setVerificationEmail("");
                    setResendCountdown(60);
                    setCanResend(false);
                  }}
                  className="w-full h-11 shadow-medium hover:shadow-glow"
                  variant="outline"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            </div>
          ) : mfaData ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Zap className="w-8 h-8 text-primary" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800 dark:text-foreground">
                  Two-Factor Authentication
                </h3>
                <p className="text-sm text-slate-600 dark:text-muted-foreground">
                  Enter the 6-digit code from your authenticator app to
                  continue.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="000000"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) =>
                      setMfaCode(e.target.value.replace(/\D/g, ""))
                    }
                    className="text-center font-mono text-2xl tracking-[0.5em] h-14"
                    autoFocus
                  />
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={async () => {
                      if (mfaCode.length !== 6) return;
                      setIsVerifyingMfa(true);
                      try {
                        await verifyMFA(mfaData.factorId, mfaCode);
                        analytics.track("mfa_success", { method: "email" });
                      } catch (err: any) {
                        toast({
                          title: "Verification failed",
                          description:
                            err.message || "Invalid code. Please try again.",
                          variant: "destructive",
                        });
                        setMfaCode("");
                      } finally {
                        setIsVerifyingMfa(false);
                      }
                    }}
                    disabled={mfaCode.length !== 6 || isVerifyingMfa}
                    className="w-full h-11 shadow-medium hover:shadow-glow"
                  >
                    {isVerifyingMfa ? "Verifying..." : "Verify & Login"}
                  </Button>

                  <Button
                    onClick={() => {
                      setMfaData(null);
                      setMfaCode("");
                    }}
                    className="w-full h-11 shadow-medium hover:shadow-glow"
                    variant="outline"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Button>
                </div>
              </div>
            </div>
          ) : showForgotPassword ? (
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
                <h3 className="text-lg font-semibold text-slate-700 dark:text-foreground">
                  Reset Password
                </h3>
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
                <Button
                  type="submit"
                  className="w-full h-11 shadow-medium hover:shadow-glow"
                  disabled={isLoading}
                >
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
                <div className="space-y-4">
                  {/* Google Sign-In - Primary Option */}
                  <div className="relative">
                    <Button
                      type="button"
                      className="w-full h-12 gap-3 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-primary/50 shadow-sm transition-all"
                      onClick={handleGoogleSignIn}
                      disabled={isGoogleLoading || isLoading}
                    >
                      {isGoogleLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                      )}
                      {isGoogleLoading
                        ? "Connecting..."
                        : "Continue with Google"}
                    </Button>
                    <span className="absolute -top-2 left-4 px-2 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Fastest
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-card px-2 text-gray-500 dark:text-gray-400">
                        Or use email
                      </span>
                    </div>
                  </div>

                  {/* Email/Password Form */}
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
                          onChange={(e) =>
                            handleEmailInput(e.target.value, "login")
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          placeholder="••••••••"
                          required
                          className={`h-11 pr-10 ${loginError ? "border-red-500 dark:border-red-500" : ""}`}
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginPassword(e.target.value);
                            setLoginError("");
                          }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowLoginPassword(!showLoginPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {showLoginPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {loginError && (
                        <div className="flex items-center gap-1.5 text-red-500 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{loginError}</span>
                        </div>
                      )}
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
                    <Button
                      type="submit"
                      className="w-full h-11 shadow-medium hover:shadow-glow"
                      disabled={isLoading}
                    >
                      {isLoading ? "Logging in..." : "Login with Email"}
                    </Button>
                  </form>
                </div>
              </TabsContent>

              {/* SIGNUP */}
              <TabsContent value="signup">
                <div className="space-y-4">
                  {/* Google Sign-Up - Primary Option */}
                  <div className="relative">
                    <Button
                      type="button"
                      className="w-full h-12 gap-3 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-primary/50 shadow-sm transition-all"
                      onClick={handleGoogleSignIn}
                      disabled={isGoogleLoading || isLoading}
                    >
                      {isGoogleLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                      )}
                      {isGoogleLoading
                        ? "Connecting..."
                        : "Continue with Google"}
                    </Button>
                    <span className="absolute -top-2 left-4 px-2 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Fastest
                    </span>
                  </div>

                  {/* Trial highlight */}
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 text-center justify-center">
                      <span className="text-lg">🎉</span>
                      <span className="text-sm font-medium text-foreground">
                        7 Days of Pro Access Free!
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      No credit card required
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-card px-2 text-gray-500 dark:text-gray-400">
                        Or use email
                      </span>
                    </div>
                  </div>

                  {/* Email/Password Form */}
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
                          onChange={(e) =>
                            handleEmailInput(e.target.value, "signup")
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showSignupPassword ? "text" : "password"}
                          placeholder="••••••••"
                          required
                          className={`h-11 pr-10 ${
                            signupPassword &&
                            isPasswordValid(passwordValidation)
                              ? "border-green-500 dark:border-green-500"
                              : signupPassword
                                ? "border-yellow-500 dark:border-yellow-500"
                                : ""
                          }`}
                          value={signupPassword}
                          onChange={(e) => {
                            const newPassword = e.target.value;
                            setSignupPassword(newPassword);
                            setPasswordValidation(
                              validatePassword(newPassword),
                            );
                            setSignupError("");
                          }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowSignupPassword(!showSignupPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {showSignupPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Password Requirements */}
                      {signupPassword && (
                        <div className="space-y-1.5 text-xs mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            {passwordValidation.minLength ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-gray-400" />
                            )}
                            <span
                              className={
                                passwordValidation.minLength
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-gray-600 dark:text-gray-400"
                              }
                            >
                              At least 8 characters
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {passwordValidation.hasUpperCase ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-gray-400" />
                            )}
                            <span
                              className={
                                passwordValidation.hasUpperCase
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-gray-600 dark:text-gray-400"
                              }
                            >
                              One uppercase letter
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {passwordValidation.hasLowerCase ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-gray-400" />
                            )}
                            <span
                              className={
                                passwordValidation.hasLowerCase
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-gray-600 dark:text-gray-400"
                              }
                            >
                              One lowercase letter
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {passwordValidation.hasNumber ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-gray-400" />
                            )}
                            <span
                              className={
                                passwordValidation.hasNumber
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-gray-600 dark:text-gray-400"
                              }
                            >
                              One number
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {passwordValidation.hasSpecialChar ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-gray-400" />
                            )}
                            <span
                              className={
                                passwordValidation.hasSpecialChar
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-gray-600 dark:text-gray-400"
                              }
                            >
                              One special character (!@#$%^&amp;*...)
                            </span>
                          </div>
                        </div>
                      )}

                      {signupError && (
                        <div className="flex items-center gap-1.5 text-red-500 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{signupError}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-11 shadow-medium hover:shadow-glow"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating account..." : "Sign Up with Email"}
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Auth;
