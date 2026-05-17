import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasValidToken, setHasValidToken] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Parse hash parameters (Supabase sends tokens in URL hash)
    const hashParams = new URLSearchParams(location.hash.substring(1));
    // Also check standard query parameters as a fallback
    const queryParams = new URLSearchParams(location.search);

    // Supabase might send access_token (implicit flow) or code (PKCE flow)
    const accessToken =
      hashParams.get("access_token") ||
      queryParams.get("access_token") ||
      queryParams.get("token") ||
      queryParams.get("code");

    const type =
      hashParams.get("type") || queryParams.get("type") || "recovery";
    const errorDesc =
      hashParams.get("error_description") ||
      queryParams.get("error_description");

    // Handle explicit errors from Supabase (e.g. "Email link is invalid or has expired")
    if (errorDesc) {
      toast({
        title: "Reset Link Error",
        description: errorDesc.replace(/\+/g, " "),
        variant: "destructive",
      });
      setTimeout(() => navigate("/auth"), 3500);
      return;
    }

    // Check if this is a recovery/reset password link
    if (accessToken && type === "recovery") {
      setHasValidToken(true);
      // Store token temporarily for the API call
      sessionStorage.setItem("reset_token", accessToken);
    } else {
      toast({
        title: "Invalid reset link",
        description: "This password reset link is missing a valid token.",
        variant: "destructive",
      });
      setTimeout(() => navigate("/auth"), 2000);
    }
  }, [location, navigate, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("reset_token");
      if (!token) throw new Error("Reset token missing");

      const response = await apiClient.resetPassword(password, token);
      if (response.success) {
        toast({
          title: "Password reset successful",
          description:
            "Your password has been updated. You can now log in with your new password.",
        });
        navigate("/auth");
      }
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description:
          error.message ||
          "Failed to reset password. The link may have expired.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-background">
        <Card className="w-full max-w-md p-6 sm:p-8 glass shadow-strong border border-primary/20 bg-white/95 dark:bg-card/90">
          <div className="text-center">
            <div className="animate-pulse text-muted-foreground">
              Validating reset link...
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-background">
      <Card className="w-full max-w-md p-6 sm:p-8 glass shadow-strong border border-primary/20 bg-white/95 dark:bg-card/90">
        <div className="text-center mb-6">
          <div className="mb-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent mx-auto mb-3 flex items-center justify-center shadow-glow">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              beseekr
            </h1>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold mb-2 text-slate-700 dark:text-foreground">
            Reset Your Password
          </h2>
          <p className="text-sm text-slate-600 dark:text-muted-foreground">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              className="h-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-slate-500 dark:text-muted-foreground">
              Minimum 6 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              className="h-11"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 shadow-medium hover:shadow-glow"
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => navigate("/auth")}
          >
            Back to Login
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
