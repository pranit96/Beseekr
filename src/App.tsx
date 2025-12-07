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
import { SaasDashboardLayout } from "./layouts/SaasDashboardLayout";
import ProblemsList from "./pages/saas/ProblemsList";
import ProblemDetails from "./pages/saas/ProblemDetails";
import Validate from "./pages/saas/Validate";
import SaasWatchlist from "./pages/saas/Watchlist";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds - data is fresh for 30s
      gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache for 5 min
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: true, // Refetch on mount if data is stale
      retry: 1, // Only retry once on failure
    },
  },
});

// Root redirect component
const RootRedirect = () => {
  const { user, loading } = useAuth();

  // Check if URL has password reset token in hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token') && hash.includes('type=recovery')) {
      // Redirect to reset password page with the hash
      window.location.href = `/reset-password${hash}`;
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Redirect to dashboard/problems for both guests and logged-in users
  return <Navigate to="/dashboard/problems" replace />;
};

// Protected route wrapper
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

// Public route wrapper (for auth page)
const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If already logged in, redirect to dashboard problems
  if (user) {
    return <Navigate to="/dashboard/problems" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  // Report web vitals and check performance budget on mount
  useEffect(() => {
    import('./lib/performance').then(({ perf }) => {
      perf.reportWebVitals();
    });
    import('./lib/performance-budget').then(({ performanceBudget }) => {
      setTimeout(() => performanceBudget.check(), 3000);
    });
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
                  {/* Root - shows landing if not logged in, redirects to chat if logged in */}
                  <Route path="/" element={<RootRedirect />} />

                  {/* Auth page - only accessible when not logged in */}
                  <Route
                    path="/auth"
                    element={
                      <PublicOnlyRoute>
                        <Auth />
                      </PublicOnlyRoute>
                    }
                  />

                  {/* Reset password page - accessible to everyone with valid token */}
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Privacy page - accessible to everyone */}
                  <Route path="/privacy" element={<Privacy />} />

                  {/* Protected routes - require authentication */}
                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute>
                        <Chat />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/agents"
                    element={
                      <ProtectedRoute>
                        <Agents />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute>
                        <Analytics />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/metaLayer"
                    element={
                      <ProtectedRoute>
                        <DeepAnalytics />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/deck"
                    element={
                      <ProtectedRoute>
                        <Deck />
                      </ProtectedRoute>
                    }
                  />

                  {/* SaaS Dashboard routes - public access to problems list */}
                  <Route
                    path="/dashboard"
                    element={<SaasDashboardLayout />}
                  >
                    <Route index element={<Navigate to="problems" replace />} />
                    <Route path="problems" element={<ProblemsList />} />
                    <Route path="problems/:id" element={<ProblemDetails />} />
                    <Route path="validate" element={<Validate />} />
                    <Route path="validate/:id" element={<Validate />} />
                    <Route path="watchlist" element={<SaasWatchlist />} />
                  </Route>

                  {/* Catch all route */}
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