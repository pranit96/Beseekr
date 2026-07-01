// src/pages/VerifyEmail.tsx
// Handles email verification redirects from Supabase

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { user, loading, refreshAuth } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleVerify = async () => {
      // 1. If already authenticated, redirect to home
      if (user) {
        setStatus("success");
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 1500);
        return;
      }

      const hash = window.location.hash;
      const search = window.location.search;
      const params = new URLSearchParams(search);
      const code = params.get("code");

      // Case A: PKCE code in query params
      if (code) {
        setStatus("loading");
        try {
          const apiBase =
            import.meta.env.VITE_API_BASE_URL || "https://api.beseekr.com";
          const redirectUrl = `${apiBase}/api/auth/google-popup-callback?code=${encodeURIComponent(
            code,
          )}&origin=${encodeURIComponent(window.location.origin)}`;
          window.location.href = redirectUrl;
        } catch (err: any) {
          console.error("PKCE redirect failed:", err);
          setStatus("error");
          setErrorMessage(
            err.message || "Failed to redirect for verification.",
          );
        }
        return;
      }

      // Case B: Implicit flow access_token in hash
      if (hash && hash.includes("access_token=")) {
        setStatus("loading");
        try {
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          const errorDesc = hashParams.get("error_description");

          if (errorDesc) {
            setStatus("error");
            setErrorMessage(decodeURIComponent(errorDesc));
            return;
          }

          if (!accessToken) {
            setStatus("error");
            setErrorMessage("No access token found in URL.");
            return;
          }

          const response = await apiClient.googleCallback(
            accessToken,
            refreshToken || undefined,
          );

          if (response.success) {
            // Success! Clean URL hash
            window.history.replaceState(
              null,
              "",
              window.location.pathname + window.location.search,
            );

            // Refresh auth context
            await refreshAuth(true, 3, true);

            setStatus("success");
            toast({
              title: "Email verified!",
              description: "Successfully logged in.",
            });

            setTimeout(() => {
              navigate("/", { replace: true });
            }, 2000);
          } else {
            setStatus("error");
            setErrorMessage(response.error || "Session verification failed.");
          }
        } catch (err: any) {
          console.error("Hash token exchange failed:", err);
          setStatus("error");
          setErrorMessage(err.message || "Verification request failed.");
        }
        return;
      }

      // Case C: Check if verification hash contains error
      if (hash && hash.includes("error_description=")) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const errorDesc = hashParams.get("error_description");
        setStatus("error");
        setErrorMessage(
          decodeURIComponent(errorDesc || "Verification failed."),
        );
        return;
      }

      // Case D: No tokens found
      if (!loading) {
        setStatus("error");
        setErrorMessage(
          "No verification token found in URL. Please make sure the link is complete.",
        );
      }
    };

    handleVerify();
  }, [user, loading, navigate, refreshAuth, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo />
        </div>

        <div className="flex flex-col items-center justify-center space-y-4 py-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">
                  Verifying your email...
                </h2>
                <p className="text-sm text-muted-foreground">
                  Setting up your secure session. Please hold on.
                </p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-green-600">
                  Email Verified!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your email is confirmed and you are logged in. Redirecting to
                  home...
                </p>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-destructive">
                  Verification Failed
                </h2>
                <p className="text-sm text-destructive max-w-xs break-words mx-auto">
                  {errorMessage}
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full pt-4">
                <Button onClick={() => navigate("/auth")} className="w-full">
                  Sign In / Sign Up
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go to Home
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
