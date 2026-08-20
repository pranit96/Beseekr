import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import { ThemeProvider } from "./hooks/use-theme";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
// import { ResumeProvider } from "./contexts/ResumeContext";
import { DeviceProvider } from "./contexts/DeviceContext";
import { KeyboardShortcutsDialog } from "./components/KeyboardShortcutsDialog";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RoleGuard } from "./components/RoleGuard";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { SpeedInsightsTracker } from "@/components/SpeedInsightsTracker";
import { useEffect, lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import {
  getIsSecondBrainEnabled,
  getIsWeeklyDigestEnabled,
  getIsLearnByDoingEnabled,
} from "@/utils/envFlags";

// Critical page imports (loaded immediately)
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Home from "./pages/Home";
import VerifyEmail from "./pages/VerifyEmail";

/**
 * Wrapper for lazy imports that handles chunk loading failures after deployments.
 * When a new version is deployed, chunk hashes change. Users with cached main bundle
 * will fail to load new chunks. This wrapper auto-refreshes the page once to fix it.
 */
const lazyRetry = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  chunkName: string,
): React.LazyExoticComponent<T> => {
  return lazy(async () => {
    const sessionKey = `chunk-retry-${chunkName}`;
    const hasRefreshed = sessionStorage.getItem(sessionKey);

    try {
      const component = await importFn();
      // Success - clear any retry flag
      sessionStorage.removeItem(sessionKey);
      return component;
    } catch (error: any) {
      // Check if this is a chunk loading error (likely due to deployment)
      const isChunkError =
        error?.message?.includes(
          "Failed to fetch dynamically imported module",
        ) ||
        error?.message?.includes("Loading chunk") ||
        error?.message?.includes("Loading CSS chunk") ||
        error?.name === "ChunkLoadError";

      if (isChunkError && !hasRefreshed) {
        // Mark that we're retrying, then refresh
        sessionStorage.setItem(sessionKey, "true");
        console.log(`Chunk load failed for ${chunkName}, refreshing page...`);
        window.location.reload();
        // Return a placeholder while reloading
        return { default: (() => null) as unknown as T };
      }

      // Already refreshed or not a chunk error - throw to show error boundary
      throw error;
    }
  });
};

// Lazy loaded pages with retry logic for chunk loading failures
const Chat = lazyRetry(() => import("./pages/Chat"), "Chat");
const Agents = lazyRetry(() => import("./pages/Agents"), "Agents");
const Brain = lazyRetry(() => import("@/pages/Brain"), "Brain");
const LearnByDoing = lazyRetry(() => import("@/pages/LearnByDoing"), "LearnByDoing");
const Digest = lazyRetry(() => import("@/pages/Digest"), "Digest");
const AgentShare = lazyRetry(() => import("./pages/AgentShare"), "AgentShare");
const Analytics = lazyRetry(() => import("./pages/Analytics"), "Analytics");
const Profile = lazyRetry(() => import("./pages/Profile"), "Profile");
const ResetPassword = lazyRetry(
  () => import("./pages/ResetPassword"),
  "ResetPassword",
);
const Landing = lazyRetry(() => import("./pages/Landing"), "Landing");
const AutonomousWorkflow = lazyRetry(
  () => import("./pages/AutonomousWorkflow"),
  "AutonomousWorkflow",
);
const AgentCanvas = lazyRetry(
  () => import("./pages/AgentCanvas"),
  "AgentCanvas",
);
// const Deck = lazyRetry(() => import("./pages/Deck"), "Deck");
const AuthCallback = lazyRetry(
  () => import("./pages/AuthCallback"),
  "AuthCallback",
);
const AdminDashboard = lazyRetry(
  () => import("./pages/admin/AdminDashboard"),
  "AdminDashboard",
);

// Blog Pages - Public routes at /blogs
const BlogList = lazyRetry(() => import("./pages/blogs/BlogList"), "BlogList");
const BlogPost = lazyRetry(() => import("./pages/blogs/BlogPost"), "BlogPost");

// SaaS Dashboard - Layout loaded immediately, pages lazy loaded
import { SaasDashboardLayout } from "./layouts/SaasDashboardLayout";

// Dashboard pages with retry logic
const ProblemsList = lazyRetry(
  () => import("./pages/saas/ProblemsList"),
  "ProblemsList",
);
const ProblemDetails = lazyRetry(
  () => import("./pages/saas/ProblemDetails"),
  "ProblemDetails",
);
const Validate = lazyRetry(() => import("./pages/saas/Validate"), "Validate");
const SaasWatchlist = lazyRetry(
  () => import("./pages/saas/Watchlist"),
  "Watchlist",
);
const Pricing = lazyRetry(() => import("./pages/saas/Pricing"), "Pricing");
const BudgetLayout = lazyRetry(
  () => import("./pages/budget/BudgetLayout"),
  "BudgetLayout",
);
const BudgetOverview = lazyRetry(
  () => import("./pages/budget/BudgetOverview"),
  "BudgetOverview",
);
const BudgetLedger = lazyRetry(
  () => import("./pages/budget/BudgetLedger"),
  "BudgetLedger",
);
const BudgetGoals = lazyRetry(
  () => import("./pages/budget/BudgetGoals"),
  "BudgetGoals",
);
const BudgetInsights = lazyRetry(
  () => import("./pages/budget/BudgetInsights"),
  "BudgetInsights",
);
const VisionBoard = lazyRetry(
  () => import("./pages/VisionBoard"),
  "VisionBoard",
);

// Loading fallback for lazy components
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      retry: 1,
    },
  },
});

/**
 * Protected route - only for legacy routes that truly require auth
 * Dashboard pages do NOT use this - they handle auth internally
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    // Save the intended destination so we can redirect back after login
    sessionStorage.setItem(
      "auth-redirect",
      location.pathname + location.search,
    );
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const FeatureGuard = ({
  children,
  featureKey,
}: {
  children: React.ReactNode;
  featureKey: "learn_by_doing" | "second_brain" | "weekly_digest";
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user?.feature_flags?.[featureKey]) {
    return <>{children}</>;
  }

  // Fallback to envFlags if we are specifically checking learn_by_doing 
  // (to support unauthenticated global marketing state)
  if (featureKey === "learn_by_doing" && getIsLearnByDoingEnabled()) {
    return <>{children}</>;
  }

  return <Navigate to="/" replace />;
};

const App = () => {
  useEffect(() => {
    // Performance monitoring
    import("./lib/performance")
      .then(({ perf }) => {
        perf.reportWebVitals();
      })
      .catch(() => {});

    import("./lib/performance-budget")
      .then(({ performanceBudget }) => {
        setTimeout(() => performanceBudget.check(), 3000);
      })
      .catch(() => {});

    // Fetch dynamic feature flags from backend config
    import("@/lib/api")
      .then(({ apiClient }) => {
        apiClient
          .getFeatureFlags()
          .then((res) => {
            if (res.success && res.data) {
              const { second_brain, weekly_digest, learn_by_doing } = res.data;
              document.cookie = `EnableSecondBrain=${second_brain}; path=/; max-age=86400; SameSite=Lax`;
              document.cookie = `EnableWeeklyDigest=${weekly_digest}; path=/; max-age=86400; SameSite=Lax`;
              document.cookie = `EnableLearnByDoing=${learn_by_doing}; path=/; max-age=86400; SameSite=Lax`;
            }
          })
          .catch((err) => {
            console.error("Failed to load feature flags:", err);
          });
      })
      .catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <DeviceProvider>
          <ThemeProvider defaultTheme="dark">
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <KeyboardShortcutsDialog />
              <BrowserRouter>
                <AuthProvider>
                  <Routes>
                    {/* ROOT */}
                    <Route path="/" element={<Home />} />

                    {/* =============================================
                      BLOG - Fully public, no auth required
                      ============================================= */}
                    <Route
                      path="/blog"
                      element={<Navigate to="/blogs" replace />}
                    />
                    <Route
                      path="/blogs"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <BlogList />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/blogs/:slug"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <BlogPost />
                        </Suspense>
                      }
                    />

                    {/* =============================================
                    PUBLIC ROUTES - No auth required
                    ============================================= */}

                    {/* Auth page - anyone can access */}
                    <Route path="/auth" element={<Auth />} />

                    {/* OAuth callback - handles Google redirect */}
                    <Route
                      path="/auth/callback"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <AuthCallback />
                        </Suspense>
                      }
                    />

                    {/* Email verification callback */}
                    <Route path="/verify-email" element={<VerifyEmail />} />

                    {/* Password reset */}
                    <Route
                      path="/reset-password"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <ResetPassword />
                        </Suspense>
                      }
                    />

                    {/* Privacy policy */}
                    <Route path="/privacy" element={<Privacy />} />

                    {/* Contact page */}
                    <Route path="/contact" element={<Contact />} />

                    {/* About page */}
                    <Route path="/about" element={<About />} />

                    {/* Shared agent preview landing page */}
                    <Route
                      path="/agents/share/:id"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <AgentShare />
                        </Suspense>
                      }
                    />

                    {/* Payment success - Razorpay redirect */}
                    <Route
                      path="/payment/success"
                      element={<PaymentSuccess />}
                    />

                    {/* Payment failed - Razorpay redirect */}
                    <Route path="/payment/failed" element={<PaymentFailed />} />

                    {/* =============================================
                      DASHBOARD - FULLY PUBLIC
                      Auth is handled INSIDE each page component
                      when accessing premium features
                      ============================================= */}
                    <Route path="/dashboard" element={<SaasDashboardLayout />}>
                      <Route
                        index
                        element={<Navigate to="problems" replace />}
                      />
                      <Route
                        path="problems"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <ProblemsList />
                          </Suspense>
                        }
                      />
                      <Route
                        path="problems/:id"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <ProblemDetails />
                          </Suspense>
                        }
                      />
                      <Route
                        path="validate"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <Validate />
                          </Suspense>
                        }
                      />
                      <Route
                        path="validate/:id"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <Validate />
                          </Suspense>
                        }
                      />
                      <Route
                        path="watchlist"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <SaasWatchlist />
                          </Suspense>
                        }
                      />
                      <Route
                        path="pricing"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <Pricing />
                          </Suspense>
                        }
                      />
                      {/* /dashboard/profile → /profile (backward compat redirect) */}
                      <Route
                        path="profile"
                        element={<Navigate to="/profile" replace />}
                      />
                      <Route
                        path="budget"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <BudgetLayout />
                          </Suspense>
                        }
                      >
                        <Route
                          index
                          element={<Navigate to="overview" replace />}
                        />
                        <Route
                          path="overview"
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <BudgetOverview />
                            </Suspense>
                          }
                        />
                        <Route
                          path="ledger"
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <BudgetLedger />
                            </Suspense>
                          }
                        />
                        <Route
                          path="goals"
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <BudgetGoals />
                            </Suspense>
                          }
                        />
                        <Route
                          path="insights"
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <BudgetInsights />
                            </Suspense>
                          }
                        />
                      </Route>

                      {/* OLD STOCK ROUTES - Redirect to new trading system */}
                      <Route
                        path="stocks"
                        element={<Navigate to="/trading/overview" replace />}
                      />
                      <Route
                        path="stocks/*"
                        element={<Navigate to="/trading/overview" replace />}
                      />
                      {/* Board moved to /board (standalone) */}
                      <Route
                        path="board"
                        element={<Navigate to="/board" replace />}
                      />
                    </Route>

                    {/* =============================================
                      CAT PREP DASHBOARD - HIDDEN (module disabled)
                      Redirect any /cat/* URLs to main dashboard
                      ============================================= */}
                    <Route
                      path="/cat/*"
                      element={<Navigate to="/dashboard/problems" replace />}
                    />

                    {/* =============================================
                      PROTECTED ROUTES - Legacy routes requiring auth
                      ============================================= */}
                    <Route
                      path="/chat"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<PageLoader />}>
                            <Chat />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/brain"
                      element={
                        getIsSecondBrainEnabled() ? (
                          <ProtectedRoute>
                            <Suspense fallback={<PageLoader />}>
                              <Brain />
                            </Suspense>
                          </ProtectedRoute>
                        ) : (
                          <Navigate to="/" replace />
                        )
                      }
                    />
                    <Route
                      path="/digest"
                      element={
                        getIsWeeklyDigestEnabled() ? (
                          <ProtectedRoute>
                            <Suspense fallback={<PageLoader />}>
                              <Digest />
                            </Suspense>
                          </ProtectedRoute>
                        ) : (
                          <Navigate to="/" replace />
                        )
                      }
                    />
                    <Route
                      path="/agents"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<PageLoader />}>
                            <Agents />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/workflow"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<PageLoader />}>
                            <AutonomousWorkflow />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/canvas"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<PageLoader />}>
                            <AgentCanvas />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/canvas/:id"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<PageLoader />}>
                            <AgentCanvas />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/analytics"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<PageLoader />}>
                            <Analytics />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    {/* Vision Board — standalone full-page like /brain */}
                    <Route
                      path="/board"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<PageLoader />}>
                            <VisionBoard />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    {/* Learn By Doing — standalone full-page like /brain */}
                    <Route
                      path="/learn"
                      element={
                        <ProtectedRoute>
                          <FeatureGuard featureKey="learn_by_doing">
                            <Suspense fallback={<PageLoader />}>
                              <LearnByDoing />
                            </Suspense>
                          </FeatureGuard>
                        </ProtectedRoute>
                      }
                    />
                    {/* <Route
                    path="/metaLayer"
                    element={<ProtectedRoute><Suspense fallback={<PageLoader />}><DeepAnalytics /></Suspense></ProtectedRoute>}
                  /> */}
                    {/* =============================================
                      PROFILE - Top-level, protected, standalone
                      (not inside dashboard layout)
                      ============================================= */}
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<PageLoader />}>
                            <Profile />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />

                    {/* =============================================
                      ADMIN CONSOLE - SECURE ACCESS
                      ============================================= */}
                    <Route
                      path="/admin"
                      element={
                        <RoleGuard>
                          <Suspense fallback={<PageLoader />}>
                            <AdminDashboard />
                          </Suspense>
                        </RoleGuard>
                      }
                    />

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AuthProvider>
              </BrowserRouter>
              <VercelAnalytics />
              <SpeedInsightsTracker />
            </TooltipProvider>
          </ThemeProvider>
        </DeviceProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
