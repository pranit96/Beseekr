// src/contexts/AuthContext.tsx - COMPLETE FILE WITH FIXES
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { apiClient } from "@/lib/api";
import { useToast, toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import socketService from "@/services/socketService";
import { createLogger } from "@/services/logging";
import { useTranslation } from "react-i18next";

const logger = createLogger("AuthContext");

const ENCRYPTION_KEY =
  "pw_act_f0a3c9b7e4128d5c6b907f1a3e8d2c4b5a6c7e8f9b0a1c2d3e4f5a6b7c8d9e0f";

// Encrypt active timestamp to prevent local sniffing while maintaining synchronous operations
const encryptActivityTime = (timestamp: number): string => {
  try {
    const text = timestamp.toString();
    let result = "";
    for (let i = 0; i < text.length; i++) {
      const charCode =
        text.charCodeAt(i) ^
        ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(result);
  } catch (e) {
    return timestamp.toString();
  }
};

// Decrypt active timestamp with transparent fallback to raw values
const decryptActivityTime = (encrypted: string): number => {
  try {
    const decoded = atob(encrypted);
    let result = "";
    for (let i = 0; i < decoded.length; i++) {
      const charCode =
        decoded.charCodeAt(i) ^
        ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    const num = parseInt(result, 10);
    return isNaN(num) ? 0 : num;
  } catch (e) {
    const num = parseInt(encrypted, 10);
    return isNaN(num) ? 0 : num;
  }
};

interface User {
  id: string;
  email: string;
  full_name?: string;
  name?: string; // Google OAuth returns name instead of full_name
  language?: string;
  timezone?: string;
  avatar?: string | null;
  tier?: string;
  preferred_currency?: string;
  providers?: string[];
  trial?: {
    active: boolean;
    ends_at: string;
    days_remaining: number;
  };
  role?: string;
  email_confirmed_at?: string;
  feature_flags?: {
    second_brain: boolean;
    weekly_digest: boolean;
    learn_by_doing?: boolean;
    enable_auto_job_apply?: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, full_name: string) => Promise<any>;
  logout: () => Promise<void>;
  exportData: () => Promise<any>;
  deleteAccount: (email: string) => Promise<void>;
  socketConnected: boolean;
  refreshAuth: (
    silent?: boolean,
    retries?: number,
    force?: boolean,
  ) => Promise<void>;
  verifyMFA: (factorId: string, code: string) => Promise<void>;
  isSessionValid: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// OPTIMIZED SESSION INTERVALS
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const TOKEN_REFRESH_INTERVAL = 8 * 60 * 1000; // 8 minutes (refresh before 15min expiry)
const ACTIVITY_TIMEOUT = 25 * 60 * 1000; // 25 minutes inactivity

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const refreshingRef = useRef(false);
  const refreshPromiseRef = useRef<Promise<any> | null>(null);
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout>();
  const tokenRefreshIntervalRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());
  const authErrorShownRef = useRef(false);

  // ENHANCED: Track user activity with debouncing
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;

    const updateActivity = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const now = Date.now();
        lastActivityRef.current = now;
        authErrorShownRef.current = false; // Reset error flag on activity
        try {
          localStorage.setItem("auth_activity", encryptActivityTime(now));
        } catch (e) {}
      }, 500);
    };

    const events = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "mousemove",
    ];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      clearTimeout(debounceTimer);
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  // DEFINE handleAuthError FIRST (before it's used in other callbacks)
  const handleAuthError = useCallback(() => {
    logger.info("Handling auth error - clearing all state and caches");

    // Clear API client cache and state
    apiClient.clearAllState();

    // Disconnect socket
    if (socketService.isConnected()) socketService.disconnect();

    // Clear intervals
    if (sessionCheckIntervalRef.current)
      clearInterval(sessionCheckIntervalRef.current);
    if (tokenRefreshIntervalRef.current)
      clearInterval(tokenRefreshIntervalRef.current);

    // Clear local state
    setUser(null);
    setSocketConnected(false);
    refreshingRef.current = false;

    // Clear localStorage
    localStorage.setItem("auth_logout", Date.now().toString());
    setTimeout(() => localStorage.removeItem("auth_logout"), 1000);

    // Dashboard routes are PUBLIC - don't redirect to auth
    // Only redirect for truly protected routes like /chat, /profile, etc.
    // The entire /dashboard tree is architecturally public — auth is handled
    // per-feature internally (e.g. ResumeContext, HiredShell banners).
    const currentPath = window.location.pathname;
    const isPublicPath =
      currentPath === "/" ||
      currentPath === "/auth" ||
      currentPath.startsWith("/auth/") || // OAuth callbacks like /auth/callback
      currentPath === "/privacy" ||
      currentPath === "/contact" ||
      currentPath.startsWith("/dashboard") || // Entire dashboard is public
      currentPath.startsWith("/pricing") ||
      currentPath.startsWith("/payment") ||
      currentPath.startsWith("/reset-password") ||
      currentPath.startsWith("/blog");

    // Only redirect to auth for protected routes
    if (!isPublicPath) {
      window.location.href = "/auth";

      if (!authErrorShownRef.current) {
        authErrorShownRef.current = true;
        toast({
          title: "Session expired",
          description: "Please log in again.",
          variant: "destructive",
        });
      }
    }
  }, []);

  // Check if session is still valid
  const isSessionValid = useCallback((): boolean => {
    if (!user) return false;
    const inactiveTime = Date.now() - lastActivityRef.current;
    return inactiveTime < ACTIVITY_TIMEOUT;
  }, [user]);

  // ENHANCED: Refresh authentication state with retry logic
  const refreshAuth = useCallback(
    async (
      silent: boolean = false,
      retries: number = 1,
      force: boolean = false,
    ) => {
      if (!force && refreshingRef.current && refreshPromiseRef.current) {
        logger.debug("Refresh already in progress, waiting for it");
        return refreshPromiseRef.current;
      }

      refreshingRef.current = true;
      refreshPromiseRef.current = (async () => {
        try {
          logger.info("Refreshing authentication state", { silent, retries });
          const response = await apiClient.getCurrentUser();

          if (response.success && response.data) {
            logger.info("Auth refresh successful");
            if ((response as any).mfa_required) {
              logger.warn("MFA required during refresh, redirecting to login");
              handleAuthError();
              return;
            }
            const fetchedUser = response.data.user;
            if (fetchedUser?.feature_flags) {
              const { second_brain, weekly_digest } = fetchedUser.feature_flags;
              document.cookie = `EnableSecondBrain=${second_brain}; path=/; max-age=86400; SameSite=Lax`;
              document.cookie = `EnableWeeklyDigest=${weekly_digest}; path=/; max-age=86400; SameSite=Lax`;
            }
            const wasNull = !user;
            setUser(fetchedUser);
            setCachedUser(fetchedUser); // SAFARI FIX: Update cache so dashboard sees logged-in state
            if (wasNull) {
              localStorage.setItem("auth_login", Date.now().toString());
            }
            lastActivityRef.current = Date.now();
            authErrorShownRef.current = false;

            // Sync language globally
            if (
              fetchedUser.language &&
              fetchedUser.language !== i18n.language
            ) {
              i18n.changeLanguage(fetchedUser.language);
            }

            if (!silent) {
              toast({
                title: "Session refreshed",
                description: "Your session has been updated.",
                duration: 2000,
              });
            }
          } else {
            throw new Error("Failed to refresh session");
          }
        } catch (error: any) {
          logger.error("Session refresh failed", {
            error: error.message,
            retries,
          });

          // Retry logic for transient network errors (NOT auth errors, NOT rate limits)
          const isAuthError = error.message?.includes("401") || error.message?.includes("Unauthorized");
          const isRateLimited = error.message?.includes("429") || error.message?.includes("Too Many");
          if (retries > 0 && !isAuthError && !isRateLimited) {
            // Exponential backoff: 2s for first retry, 4s for second, etc.
            const backoffMs = 2000 * (2 - retries + 1);
            logger.info("Retrying refresh", { retriesLeft: retries, backoffMs });
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            refreshingRef.current = false;
            return refreshAuth(silent, retries - 1);
          }

          if (
            error.message?.includes("401") ||
            error.message?.includes("Unauthorized")
          ) {
            handleAuthError();
          }
        } finally {
          refreshingRef.current = false;
          refreshPromiseRef.current = null;
        }
      })();

      return refreshPromiseRef.current;
    },
    [handleAuthError],
  );

  // ENHANCED: Inactivity session maintenance
  useEffect(() => {
    if (!user) {
      if (sessionCheckIntervalRef.current)
        clearInterval(sessionCheckIntervalRef.current);
      if (tokenRefreshIntervalRef.current)
        clearInterval(tokenRefreshIntervalRef.current);
      return;
    }

    // Inactivity check
    sessionCheckIntervalRef.current = setInterval(() => {
      try {
        const globalActivity = localStorage.getItem("auth_activity");
        if (globalActivity) {
          const globalTime = decryptActivityTime(globalActivity);
          if (globalTime > lastActivityRef.current) {
            lastActivityRef.current = globalTime;
          }
        }
      } catch (e) {}

      const inactiveTime = Date.now() - lastActivityRef.current;

      if (inactiveTime > ACTIVITY_TIMEOUT) {
        logger.warn("Session expired due to inactivity", { inactiveTime });
        if (!authErrorShownRef.current) {
          authErrorShownRef.current = true;
          handleAuthError();
        }
      }
    }, 60000); // Check local activity every minute (no server polling)

    // Proactive token refresh timer (refreshes before the 15-minute token expiry)
    tokenRefreshIntervalRef.current = setInterval(() => {
      logger.info("Proactively refreshing token via scheduled interval");
      refreshAuth(true); // Silent refresh
    }, TOKEN_REFRESH_INTERVAL);

    return () => {
      if (sessionCheckIntervalRef.current)
        clearInterval(sessionCheckIntervalRef.current);
      if (tokenRefreshIntervalRef.current)
        clearInterval(tokenRefreshIntervalRef.current);
    };
  }, [user, handleAuthError, refreshAuth]);

  // Keep a stable ref to refreshAuth so handleTokensRefreshed never changes its
  // reference — preventing the socket useEffect from firing on every silent token refresh.
  const refreshAuthRef = useRef(refreshAuth);
  useEffect(() => { refreshAuthRef.current = refreshAuth; }, [refreshAuth]);

  // Socket token refresh callback — stable ref, safe to pass to socketService once
  const handleTokensRefreshed = useCallback(
    (_tokens: { access_token: string; refresh_token: string }) => {
      logger.info("Socket tokens refreshed, updating auth state");
      lastActivityRef.current = Date.now();
      refreshAuthRef.current(true);
    },
    [], // empty deps: this callback is intentionally stable for the component lifetime
  );

  // ENHANCED: Socket initialization with better error handling
  // Dependency is user?.id only — connect/disconnect on real login/logout events,
  // NOT on every callback reference change (which caused the rapid reconnect loop).
  const handleTokensRefreshedRef = useRef(handleTokensRefreshed);
  useEffect(() => { handleTokensRefreshedRef.current = handleTokensRefreshed; }, [handleTokensRefreshed]);

  useEffect(() => {
    if (!user) {
      if (socketService.isConnected()) {
        logger.info("User logged out, disconnecting socket");
        socketService.disconnect();
        setSocketConnected(false);
      }
      return;
    }

    socketService.setTokenRefreshCallback(handleTokensRefreshedRef.current);

    const onConnectionStatus = (data: any) => {
      setSocketConnected(data.connected);

      if (data.connected) {
        logger.info("Socket connected", { socketId: data.socketId });
        lastActivityRef.current = Date.now();
      } else {
        logger.warn("Socket disconnected", { reason: data.reason });
      }
    };

    const onAuthError = (data: any) => {
      logger.error("Socket authentication failed", { error: data.error });
      if (!authErrorShownRef.current) {
        authErrorShownRef.current = true;
        handleAuthError();
      }
    };

    const onForcedDisconnect = (data: any) => {
      logger.warn("Socket force disconnected", { message: data.message });
      toast({
        title: "Connection Lost",
        description: data.message || "Please refresh and log in again.",
        variant: "destructive",
      });
      handleAuthError();
    };

    socketService.on("connection_status", onConnectionStatus);
    socketService.on("auth_error", onAuthError);
    socketService.on("forced_disconnect", onForcedDisconnect);

    // Connect if not already connected
    socketService.connect();

    return () => {
      // Clean up event listeners on unmount/re-render, but DO NOT disconnect the singleton socket
      // while the user is still authenticated.
      socketService.off("connection_status", onConnectionStatus);
      socketService.off("auth_error", onAuthError);
      socketService.off("forced_disconnect", onForcedDisconnect);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only react to actual login/logout

  // Initial auth check with retry
  // OPTIMISTIC AUTH: Cache user in localStorage for instant page loads
  const CACHED_USER_KEY = "beseekr_cached_user";
  const CACHE_EXPIRY_KEY = "beseekr_cache_expiry";
  const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  const getCachedUser = (): User | null => {
    try {
      const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
      if (expiry && Date.now() > parseInt(expiry)) {
        localStorage.removeItem(CACHED_USER_KEY);
        localStorage.removeItem(CACHE_EXPIRY_KEY);
        return null;
      }
      const cached = localStorage.getItem(CACHED_USER_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const setCachedUser = (user: User | null) => {
    try {
      if (user) {
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
        localStorage.setItem(CACHE_EXPIRY_KEY, String(Date.now() + CACHE_TTL));
      } else {
        localStorage.removeItem(CACHED_USER_KEY);
        localStorage.removeItem(CACHE_EXPIRY_KEY);
      }
    } catch {
      // localStorage might be full or disabled
    }
  };

  // ENHANCED: Initial auth check with optimistic loading
  useEffect(() => {
    // 0. SELF-HEALING OAUTH REDIRECT: Catch Supabase oauth codes landing on non-callback pages
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hasCode = searchParams.has("code") || hashParams.has("code");

      if (hasCode && !window.location.pathname.startsWith("/auth/callback")) {
        logger.info(
          "Detected OAuth code in URL on non-callback route, self-healing to /auth/callback",
        );
        const targetUrl = `/auth/callback${window.location.search}${window.location.hash}`;
        window.location.href = targetUrl;
        return;
      }
    } catch (e) {
      logger.error("OAuth self-healing check error:", e);
    }

    const initAuth = async () => {
      try {
        logger.info("Checking initial authentication state");

        // 1. OPTIMISTIC: Immediately show cached user (instant UI)
        const cachedUser = getCachedUser();
        // Only use cache if it has a role field (means it's from the new auth version)
        if (cachedUser && cachedUser.role) {
          logger.info("Using cached user for instant load", {
            userId: cachedUser.id,
            role: cachedUser.role,
          });
          setUser(cachedUser);
          setLoading(false); // Show content immediately

          if (cachedUser.language && cachedUser.language !== i18n.language) {
            i18n.changeLanguage(cachedUser.language);
          }
        } else if (cachedUser) {
          logger.info(
            "Cached user found but lacks role metadata, skipping optimistic load",
          );
        }

        // Set up API client unauthorized handler
        apiClient.setUnauthorizedHandler(() => {
          logger.warn("API client detected unauthorized request");
          if (!authErrorShownRef.current) {
            authErrorShownRef.current = true;
            handleAuthError();
            setCachedUser(null); // Clear cache on auth error
          }
        });

        // 2. VERIFY: API check in background (updates if different)
        await fetchCurrentUser();
      } catch (error) {
        logger.error("Initial auth check failed", { error });
        setLoading(false);
      }
    };

    initAuth();

    // Multi-tab sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_logout" && e.newValue) {
        logger.info("Logout detected in another tab");
        handleAuthError();
        setCachedUser(null);
      } else if (e.key === "auth_login" && e.newValue) {
        logger.info("Login detected in another tab, refreshing auth");
        refreshAuth(true);
      }
    };

    // Proactive background session sync on window focus/visibility
    let lastFocusRefresh = Date.now();
    const handleFocus = () => {
      const now = Date.now();
      if (now - lastFocusRefresh > 30000) {
        lastFocusRefresh = now;
        logger.info("Window focused, proactively refreshing auth state");
        refreshAuth(true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleFocus();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleAuthError, refreshAuth]);

  const fetchCurrentUser = async () => {
    try {
      const response = await apiClient.getCurrentUser();
      if (response.success && response.data) {
        if ((response as any).mfa_required) {
          logger.warn("MFA required during initial fetch");
          setUser(null);
          setCachedUser(null);
          setLoading(false);
          return;
        }
        const fetchedUser = response.data.user;
        if (fetchedUser?.feature_flags) {
          const { second_brain, weekly_digest } = fetchedUser.feature_flags;
          document.cookie = `EnableSecondBrain=${second_brain}; path=/; max-age=86400; SameSite=Lax`;
          document.cookie = `EnableWeeklyDigest=${weekly_digest}; path=/; max-age=86400; SameSite=Lax`;
        }
        setUser(fetchedUser);
        setCachedUser(fetchedUser); // Update cache
        lastActivityRef.current = Date.now();

        if (fetchedUser.language && fetchedUser.language !== i18n.language) {
          i18n.changeLanguage(fetchedUser.language);
        }
      } else {
        // Only clear if we explicitly got a failure from the API
        setUser(null);
        setCachedUser(null);
      }
    } catch (error: any) {
      logger.error("Failed to fetch user", { error: error.message });

      // ONLY clear session if it is explicitly a 401 Unauthorized error or "expired"
      const isSessionExpired =
        error.message?.includes("401") ||
        error.message?.includes("Unauthorized") ||
        error.message?.toLowerCase().includes("session expired") ||
        error.message?.toLowerCase().includes("invalid token");

      if (isSessionExpired) {
        logger.warn(
          "Session expired on initial fetch, clearing local auth state",
        );
        setUser(null);
        setCachedUser(null);
      } else {
        logger.info(
          "Retaining cached user session due to temporary error (e.g. rate limit, server down)",
          {
            errorMessage: error.message,
          },
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      if (response.success && response.data) {
        if ((response as any).mfa_required) {
          logger.info("MFA required for login");
          return { ...response.data, mfa_required: true };
        }

        const fetchedUser = response.data.user;
        setUser(fetchedUser);
        setCachedUser(fetchedUser);
        localStorage.setItem("auth_login", Date.now().toString());
        lastActivityRef.current = Date.now();
        authErrorShownRef.current = false;

        if (fetchedUser.language && fetchedUser.language !== i18n.language) {
          i18n.changeLanguage(fetchedUser.language);
        }

        toast({
          title: "Welcome back!",
          description: "Successfully logged in.",
        });

        const redirectUrl = sessionStorage.getItem("auth-redirect") || "/";
        sessionStorage.removeItem("auth-redirect");
        navigate(redirectUrl);
        return response.data;
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signup = async (email: string, password: string, full_name: string) => {
    try {
      const response = await apiClient.signup(email, password, full_name);
      if (response.success && response.data) {
        // Check if user needs email confirmation
        if (response.data.user && !response.data.user.email_confirmed_at) {
          // Email confirmation required - throw special error WITHOUT toast
          // Auth.tsx will catch this and show verification pending screen
          const error: any = new Error(
            "Please verify your email to continue. Check your inbox for the verification link.",
          );
          error.isEmailVerificationRequired = true;
          throw error;
        }

        setUser(response.data.user);
        lastActivityRef.current = Date.now();

        toast({
          title: "Account created!",
          description: "Welcome to beseekr.",
        });

        // Redirect to intended page or default to home
        const redirectUrl = sessionStorage.getItem("auth-redirect") || "/";
        sessionStorage.removeItem("auth-redirect");
        navigate(redirectUrl);
      }
    } catch (error: any) {
      // Only show toast for ACTUAL errors, not email verification pending
      if (!error.isEmailVerificationRequired) {
        toast({
          title: "Signup failed",
          description: error.message || "Could not create account",
          variant: "destructive",
        });
      }
      // Always re-throw so Auth.tsx can handle it
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (socketService.isConnected()) {
        socketService.disconnect();
        setSocketConnected(false);
      }

      if (sessionCheckIntervalRef.current)
        clearInterval(sessionCheckIntervalRef.current);
      if (tokenRefreshIntervalRef.current)
        clearInterval(tokenRefreshIntervalRef.current);

      await apiClient.logout();

      setUser(null);
      refreshingRef.current = false;

      localStorage.setItem("auth_logout", Date.now().toString());
      setTimeout(() => localStorage.removeItem("auth_logout"), 1000);

      navigate("/");

      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      logger.error("Logout error", { error });
      setUser(null);
      setSocketConnected(false);
      navigate("/");
    }
  };

  const exportData = async () => {
    try {
      const response = await apiClient.exportData();
      if (response.success) {
        return response.data;
      }
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteAccount = async (email: string) => {
    try {
      if (socketService.isConnected()) {
        socketService.disconnect();
        setSocketConnected(false);
      }

      if (sessionCheckIntervalRef.current)
        clearInterval(sessionCheckIntervalRef.current);
      if (tokenRefreshIntervalRef.current)
        clearInterval(tokenRefreshIntervalRef.current);

      const response = await apiClient.deleteProfile(email);

      if (response.success) {
        setUser(null);
        refreshingRef.current = false;

        localStorage.setItem("auth_logout", Date.now().toString());
        setTimeout(() => localStorage.removeItem("auth_logout"), 1000);

        navigate("/");

        toast({
          title: "Account deleted",
          description:
            "Your account and all data have been permanently deleted.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Deletion failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        exportData,
        deleteAccount,
        socketConnected,
        refreshAuth,
        verifyMFA: async (factorId: string, code: string) => {
          const res = await apiClient.verify2FA(factorId, code);
          if (res.success) {
            // Optimistically update user state if provided
            if (res.data?.user) {
              setUser(res.data.user);
              setCachedUser(res.data.user);
            }
            // Force a refresh to ensure the backend session is fully synced and cookies are processed
            await refreshAuth(true, 3, true);

            const redirectUrl = sessionStorage.getItem("auth-redirect") || "/";
            sessionStorage.removeItem("auth-redirect");
            navigate(redirectUrl);
          } else {
            throw new Error(res.error || "MFA verification failed");
          }
        },
        isSessionValid,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
