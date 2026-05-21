// src/pages/AuthCallback.tsx
// Handles OAuth redirect from Supabase/Google

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { refreshAuth, verifyMFA } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "mfa">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [mfaData, setMfaData] = useState<{
    factorId: string;
    userId: string;
  } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);

  // Get the intended redirect URL (saved by ProtectedRoute) or fall back to home page
  const getRedirectUrl = () => {
    const saved = sessionStorage.getItem("auth-redirect");
    sessionStorage.removeItem("auth-redirect");
    return saved || "/";
  };

  useEffect(() => {
    let authListener: {
      data: { subscription: { unsubscribe: () => void } };
    } | null = null;

    const handleCallback = async () => {
      try {
        // Detect browser and device for debugging
        const userAgent = navigator.userAgent;
        const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
        const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);

        // Browser info logs removed for privacy

        // First, check if there are tokens in the URL hash
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1),
        );
        const hasTokensInUrl = hashParams.has("access_token");

        // Also check URL search params (some browsers may use this instead)
        const searchParams = new URLSearchParams(window.location.search);
        const hasTokensInSearch = searchParams.has("access_token");

        // CRITICAL: Explicitly catch OAuth Errors (User Canceled, Consent Denied, etc.)
        const errorInUrl = searchParams.get("error") || hashParams.get("error");
        if (errorInUrl) {
          const errorDesc =
            searchParams.get("error_description") ||
            hashParams.get("error_description") ||
            errorInUrl;
          console.warn(
            "OAuth flow halted by user or provider error:",
            errorInUrl,
          );
          throw new Error(errorDesc.replace(/\+/g, " "));
        }

        if (hasTokensInUrl || hasTokensInSearch) {
          // Tokens are in URL - Supabase needs to process them
          // Wait for auth state change which fires after Supabase processes the URL
          const session = await new Promise<any>((resolve, reject) => {
            // Increased timeout to 20 seconds for mobile connections and slow networks
            const timeout = setTimeout(() => {
              reject(
                new Error(
                  "Authentication timed out. Please check your internet connection and try again.",
                ),
              );
            }, 20000);

            let resolved = false;
            const safeResolve = (session: any) => {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                resolve(session);
              }
            };

            // Set up auth state change listener FIRST
            authListener = supabase.auth.onAuthStateChange((event, session) => {
              console.log(`OAuth Callback - Auth State Change: ${event}`);

              if (
                (event === "SIGNED_IN" ||
                  event === "TOKEN_REFRESHED" ||
                  event === "INITIAL_SESSION") &&
                session
              ) {
                safeResolve(session);
              }
            });

            // Give Supabase a moment to process the URL hash tokens before checking session
            // This delay is critical for PKCE flow where token exchange happens asynchronously
            setTimeout(async () => {
              if (resolved) return;

              try {
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                  console.error("OAuth Callback - getSession error:", error);
                  return;
                }
                if (data.session) {
                  console.log("OAuth Callback - Session found after delay");
                  safeResolve(data.session);
                }
              } catch (e) {
                console.error("OAuth Callback - getSession exception:", e);
              }
            }, 500); // 500ms delay to allow PKCE token exchange
          });

          if (!session?.access_token) {
            throw new Error(
              "No access token received from Google. Please try again.",
            );
          }

          console.log("OAuth Callback - Exchanging tokens with backend");

          // Exchange Supabase tokens with backend to create session cookie
          const response = await apiClient.googleCallback(
            session.access_token,
            session.refresh_token,
          );

          if (response.success) {
            if ((response as any).mfa_required) {
              console.log("OAuth Callback - MFA required");
              setMfaData(response.data);
              setStatus("mfa");
              return;
            }
            console.log("OAuth Callback - Backend authentication successful");
            // Refresh auth context to update user state across all components
            await refreshAuth(true, 3, true);
            setStatus("success");

            // SAFARI FIX: Use hard navigation for Safari to ensure UI state sync
            const redirectUrl = getRedirectUrl();
            setTimeout(() => {
              if (isSafari) {
                console.log(
                  "Safari detected - using hard navigation to ensure UI sync",
                );
                window.location.href = redirectUrl;
              } else {
                navigate(redirectUrl, { replace: true });
              }
            }, 1000);
          } else {
            throw new Error(
              response.error || "Failed to authenticate with server.",
            );
          }
        } else {
          console.log(
            "OAuth Callback - No tokens in URL, checking for existing session",
          );

          // No tokens in URL - try to get existing session
          // Safari mobile may have stored the session but cleared the URL
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            console.error("OAuth Callback - Session retrieval error:", error);
            throw new Error(error.message);
          }

          if (!data.session) {
            console.error("OAuth Callback - No session found");

            // Safari-specific: Try to recover from localStorage directly
            if (isSafari) {
              console.log("Safari detected - attempting localStorage recovery");
              try {
                const storedSession =
                  localStorage.getItem("beseekr-auth-token");
                if (storedSession) {
                  console.log("Found stored session in localStorage");
                  // Session exists but Supabase didn't pick it up
                  // Try to refresh the page once to let Supabase reinitialize
                  const hasRefreshed = sessionStorage.getItem(
                    "oauth-refresh-attempted",
                  );
                  if (!hasRefreshed) {
                    sessionStorage.setItem("oauth-refresh-attempted", "true");
                    console.log(
                      "Refreshing page to reinitialize Supabase session",
                    );
                    window.location.reload();
                    return; // Exit to prevent error showing
                  }
                }
              } catch (storageError) {
                console.error(
                  "Safari localStorage recovery failed:",
                  storageError,
                );
              }
            }

            throw new Error("No session found. Please try signing in again.");
          }

          console.log(
            "OAuth Callback - Exchanging stored session with backend",
          );

          const response = await apiClient.googleCallback(
            data.session.access_token,
            data.session.refresh_token,
          );

          if (response.success) {
            if ((response as any).mfa_required) {
              console.log("OAuth Callback - MFA required (existing session)");
              setMfaData(response.data);
              setStatus("mfa");
              return;
            }
            console.log("OAuth Callback - Backend authentication successful");
            // Refresh auth context to update user state across all components
            await refreshAuth(true, 3, true);
            setStatus("success");

            // SAFARI FIX: Use hard navigation for Safari to ensure UI state sync
            const redirectUrl = getRedirectUrl();
            setTimeout(() => {
              if (isSafari) {
                console.log(
                  "Safari detected - using hard navigation to ensure UI sync",
                );
                window.location.href = redirectUrl;
              } else {
                navigate(redirectUrl, { replace: true });
              }
            }, 1000);
          } else {
            throw new Error(
              response.error || "Failed to authenticate with server.",
            );
          }
        }
      } catch (err: any) {
        console.error("OAuth callback error:", err);
        console.error("OAuth callback error details:", {
          message: err.message,
          stack: err.stack,
          userAgent: navigator.userAgent,
        });

        // CRITICAL: Don't just set error status - this leaves user on callback page
        // Instead, redirect appropriately based on error type

        // Check if this is a timeout or network error (temporary)
        const isTemporaryError =
          err.message?.includes("timed out") ||
          err.message?.includes("network") ||
          err.message?.includes("fetch");

        // Check if this is an auth configuration error
        const isConfigError =
          err.message?.includes("not configured") ||
          err.message?.includes("environment");

        // Check if this was a user cancellation
        const isUserCancellation =
          err.message?.toLowerCase().includes("denied") ||
          err.message?.toLowerCase().includes("cancel");

        if (isUserCancellation) {
          console.log(
            "OAuth User Cancellation - redirecting straight back to Auth",
          );
          // Clear storage to remove dirty temporary login data
          localStorage.removeItem("beseekr-auth-token");
          navigate("/auth", { replace: true });
          return; // Halt early, don't show 3-second error screen
        }

        if (isConfigError) {
          // Configuration error - redirect to auth with clear message
          console.log("OAuth Config Error - redirecting to auth page");
          setStatus("error");
          setErrorMessage(err.message || "Authentication configuration error.");
          // Don't auto-redirect for config errors - let user see the error and manually go back
        } else if (isTemporaryError) {
          // Temporary error - show error but allow retry
          console.log("OAuth Temporary Error - showing retry option");
          setStatus("error");
          setErrorMessage(
            err.message || "Authentication failed. Please try again.",
          );
        } else {
          // Other auth errors - redirect to dashboard (public) with error toast
          console.log("OAuth Auth Error - redirecting to dashboard with error");
          setStatus("error");
          setErrorMessage(
            err.message ||
              "Authentication failed. Please try signing in again.",
          );

          // Clear any partial OAuth state that might be corrupting the auth page
          try {
            localStorage.removeItem("beseekr-auth-token");
            sessionStorage.removeItem("oauth-refresh-attempted");
          } catch (cleanupError) {
            console.error("Failed to clean up OAuth state:", cleanupError);
          }

          // Redirect to dashboard (public page) instead of /auth to avoid confusion
          // This prevents the Google button from disappearing issue
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 3000);
        }
      }
    };

    handleCallback();

    // Cleanup listener on unmount
    return () => {
      if (authListener?.data?.subscription) {
        authListener.data.subscription.unsubscribe();
      }
    };
  }, [navigate, refreshAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-6">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <div>
              <h2 className="text-xl font-semibold">Completing sign in...</h2>
              <p className="text-muted-foreground mt-2">
                Please wait while we verify your account.
              </p>
            </div>
          </>
        )}

        {status === "mfa" && mfaData && (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Loader2 className="h-8 w-8 text-primary" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-800 dark:text-foreground">
                MFA Required
              </h2>
              <p className="text-sm text-muted-foreground">
                Your Google account is linked, but you have 2FA enabled on your
                profile. Please enter your 6-digit code.
              </p>
            </div>

            <div className="space-y-4 text-left">
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) =>
                    setMfaCode(e.target.value.replace(/\D/g, ""))
                  }
                  className="w-full text-center font-mono text-2xl tracking-[0.5em] h-14 rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                    } catch (err: any) {
                      setErrorMessage(err.message || "Invalid code.");
                      setMfaCode("");
                    } finally {
                      setIsVerifyingMfa(false);
                    }
                  }}
                  disabled={mfaCode.length !== 6 || isVerifyingMfa}
                  className="w-full h-11"
                >
                  {isVerifyingMfa ? "Verifying..." : "Verify & Continue"}
                </Button>

                <Button
                  onClick={() => navigate("/auth")}
                  className="w-full h-11"
                  variant="outline"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-green-600">Welcome!</h2>
              <p className="text-muted-foreground mt-2">
                Redirecting to dashboard...
              </p>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-destructive">
                Authentication Failed
              </h2>
              <p className="text-muted-foreground mt-2">{errorMessage}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/auth")}>
                Try Again
              </Button>
              <Button onClick={() => navigate("/")}>Go to Home</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
