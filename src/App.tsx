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
import { useEffect } from "react";

// Page imports
import Chat from "./pages/Chat";
import Agents from "./pages/Agents";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import Privacy from "./pages/Privacy";
import DeepAnalytics from "./pages/DeepAnalytics";
import Deck from "./pages/Deck";

// SaaS Dashboard (PUBLIC)
import { SaasDashboardLayout } from "./layouts/SaasDashboardLayout";
import ProblemsList from "./pages/saas/ProblemsList";
import ProblemDetails from "./pages/saas/ProblemDetails";
import Validate from "./pages/saas/Validate";
import SaasWatchlist from "./pages/saas/Watchlist";
import Pricing from "./pages/saas/Pricing";

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
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Privacy policy */}
                  <Route path="/privacy" element={<Privacy />} />

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
                  </Route>

                  {/* =============================================
                      PROTECTED ROUTES - Legacy routes requiring auth
                      ============================================= */}
                  <Route
                    path="/chat"
                    element={<ProtectedRoute><Chat /></ProtectedRoute>}
                  />
                  <Route
                    path="/agents"
                    element={<ProtectedRoute><Agents /></ProtectedRoute>}
                  />
                  <Route
                    path="/analytics"
                    element={<ProtectedRoute><Analytics /></ProtectedRoute>}
                  />
                  <Route
                    path="/metaLayer"
                    element={<ProtectedRoute><DeepAnalytics /></ProtectedRoute>}
                  />
                  <Route
                    path="/profile"
                    element={<ProtectedRoute><Profile /></ProtectedRoute>}
                  />
                  <Route
                    path="/deck"
                    element={<ProtectedRoute><Deck /></ProtectedRoute>}
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