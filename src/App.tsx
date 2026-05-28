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

// Critical page imports (loaded immediately)
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Home from "./pages/Home";

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
                      <Route
                        path="profile"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <Profile />
                          </Suspense>
                        }
                      />

                      {/* OLD STOCK ROUTES - Redirect to new trading system */}
                      <Route
                        path="stocks"
                        element={<Navigate to="/trading/overview" replace />}
                      />
                      <Route
                        path="stocks/*"
                        element={<Navigate to="/trading/overview" replace />}
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
                      path="/analytics"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<PageLoader />}>
                            <Analytics />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    {/* <Route
                    path="/metaLayer"
                    element={<ProtectedRoute><Suspense fallback={<PageLoader />}><DeepAnalytics /></Suspense></ProtectedRoute>}
                  /> */}
                    <Route
                      path="/profile"
                      element={<Navigate to="/dashboard/profile" replace />}
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
