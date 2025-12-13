import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./hooks/use-theme";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { KeyboardShortcutsDialog } from "./components/KeyboardShortcutsDialog";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { useEffect, lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Critical page imports (loaded immediately)
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import Contact from "./pages/Contact";

// Lazy loaded pages (reduced initial bundle)
const Chat = lazy(() => import("./pages/Chat"));
const Agents = lazy(() => import("./pages/Agents"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Profile = lazy(() => import("./pages/Profile"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Landing = lazy(() => import("./pages/Landing"));
const DeepAnalytics = lazy(() => import("./pages/DeepAnalytics"));
const Deck = lazy(() => import("./pages/Deck"));

// SaaS Dashboard - Critical, loaded immediately
import { SaasDashboardLayout } from "./layouts/SaasDashboardLayout";
import ProblemsList from "./pages/saas/ProblemsList";
import ProblemDetails from "./pages/saas/ProblemDetails";
import Validate from "./pages/saas/Validate";
import SaasWatchlist from "./pages/saas/Watchlist";
import Pricing from "./pages/saas/Pricing";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  useEffect(() => {
    // Performance monitoring
    import('./lib/performance').then(({ perf }) => {
      perf.reportWebVitals();
    }).catch(() => { });

    import('./lib/performance-budget').then(({ performanceBudget }) => {
      setTimeout(() => performanceBudget.check(), 3000);
    }).catch(() => { });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <KeyboardShortcutsDialog />
            <BrowserRouter>
              <AuthProvider>
                <Routes>
                  {/* =============================================
                      ROOT - Redirect to dashboard (NO AUTH CHECK)
                      ============================================= */}
                  <Route path="/" element={<Navigate to="/dashboard/problems" replace />} />

                  {/* =============================================
                      PUBLIC ROUTES - No auth required
                      ============================================= */}

                  {/* Auth page - anyone can access */}
                  <Route path="/auth" element={<Auth />} />

                  {/* Password reset */}
                  <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>} />

                  {/* Privacy policy */}
                  <Route path="/privacy" element={<Privacy />} />

                  {/* Contact page */}
                  <Route path="/contact" element={<Contact />} />

                  {/* Payment success - Razorpay redirect */}
                  <Route path="/payment/success" element={<PaymentSuccess />} />

                  {/* Payment failed - Razorpay redirect */}
                  <Route path="/payment/failed" element={<PaymentFailed />} />

                  {/* =============================================
                      DASHBOARD - FULLY PUBLIC
                      Auth is handled INSIDE each page component
                      when accessing premium features
                      ============================================= */}
                  <Route path="/dashboard" element={<SaasDashboardLayout />}>
                    <Route index element={<Navigate to="problems" replace />} />
                    <Route path="problems" element={<ProblemsList />} />
                    <Route path="problems/:id" element={<ProblemDetails />} />
                    <Route path="validate" element={<Validate />} />
                    <Route path="validate/:id" element={<Validate />} />
                    <Route path="watchlist" element={<SaasWatchlist />} />
                    <Route path="pricing" element={<Pricing />} />
                    <Route path="profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
                  </Route>

                  {/* =============================================
                      PROTECTED ROUTES - Legacy routes requiring auth
                      ============================================= */}
                  <Route
                    path="/chat"
                    element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Chat /></Suspense></ProtectedRoute>}
                  />
                  <Route
                    path="/agents"
                    element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Agents /></Suspense></ProtectedRoute>}
                  />
                  <Route
                    path="/analytics"
                    element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Analytics /></Suspense></ProtectedRoute>}
                  />
                  <Route
                    path="/metaLayer"
                    element={<ProtectedRoute><Suspense fallback={<PageLoader />}><DeepAnalytics /></Suspense></ProtectedRoute>}
                  />
                  <Route
                    path="/profile"
                    element={<Navigate to="/dashboard/profile" replace />}
                  />
                  <Route
                    path="/deck"
                    element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Deck /></Suspense></ProtectedRoute>}
                  />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AuthProvider>
            </BrowserRouter>
            <VercelAnalytics />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;