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
import { ResumeProvider } from "./contexts/ResumeContext";
import { KeyboardShortcutsDialog } from "./components/KeyboardShortcutsDialog";
import { ErrorBoundary } from "./components/ErrorBoundary";
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
const Analytics = lazyRetry(() => import("./pages/Analytics"), "Analytics");
const Profile = lazyRetry(() => import("./pages/Profile"), "Profile");
const ResetPassword = lazyRetry(
  () => import("./pages/ResetPassword"),
  "ResetPassword",
);
const Landing = lazyRetry(() => import("./pages/Landing"), "Landing");
const DeepAnalytics = lazyRetry(
  () => import("./pages/DeepAnalytics"),
  "DeepAnalytics",
);
const AutonomousWorkflow = lazyRetry(
  () => import("./pages/AutonomousWorkflow"),
  "AutonomousWorkflow",
);
// const Deck = lazyRetry(() => import("./pages/Deck"), "Deck");
const AuthCallback = lazyRetry(
  () => import("./pages/AuthCallback"),
  "AuthCallback",
);
// const WellnessDashboard = lazyRetry(() => import("./pages/health/WellnessDashboard"), "WellnessDashboard");
// const WellnessOnboarding = lazyRetry(() => import("./pages/health/WellnessOnboarding"), "WellnessOnboarding");
// const WellnessPlan = lazyRetry(() => import("./pages/health/WellnessPlan"), "WellnessPlan");
// const WellnessNutrition = lazyRetry(() => import("./pages/health/WellnessNutrition"), "WellnessNutrition");
// const WellnessTraining = lazyRetry(() => import("./pages/health/WellnessTraining"), "WellnessTraining");
// const WellnessHabits = lazyRetry(() => import("./pages/health/WellnessHabits"), "WellnessHabits");
// const WellnessMind = lazyRetry(() => import("./pages/health/WellnessMind"), "WellnessMind");
// const WellnessWeekly = lazyRetry(() => import("./pages/health/WellnessWeekly"), "WellnessWeekly");
// const WellnessWeight = lazyRetry(() => import("./pages/health/WellnessWeight"), "WellnessWeight");

// Blog Pages - Public routes at /blogs
const BlogList = lazyRetry(() => import("./pages/blogs/BlogList"), "BlogList");
const BlogPost = lazyRetry(() => import("./pages/blogs/BlogPost"), "BlogPost");

// SaaS Dashboard - Layout loaded immediately, pages lazy loaded
import { SaasDashboardLayout } from "./layouts/SaasDashboardLayout";

// Trading System - Layout loaded immediately, pages lazy loaded
// import { TradingLayout } from "./layouts/TradingLayout";

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
const GetHiredPortal = lazyRetry(
  () => import("./pages/GetHiredPortal"),
  "GetHiredPortal",
);
const ResumeUpload = lazyRetry(
  () => import("./pages/ResumeUpload"),
  "ResumeUpload",
);
const ResumeTemplateSelect = lazyRetry(
  () => import("./pages/ResumeTemplateSelect"),
  "ResumeTemplateSelect",
);
const ResumeWorkspace = lazyRetry(
  () => import("./pages/ResumeWorkspace"),
  "ResumeWorkspace",
);
const JobTracker = lazyRetry(() => import("./pages/JobTracker"), "JobTracker");
const InterviewPrep = lazyRetry(
  () => import("./pages/InterviewPrep"),
  "InterviewPrep",
);

// Trading System pages with retry logic
// const TradingOverview = lazyRetry(() => import("./pages/trading/Overview"), "TradingOverview");
// const TradingLive = lazyRetry(() => import("./pages/trading/LiveTrading"), "TradingLive");
// const TradingPositions = lazyRetry(() => import("./pages/trading/Positions"), "TradingPositions");
// const TradingHistory = lazyRetry(() => import("./pages/trading/TradeHistory"), "TradingHistory");
// const TradingSignals = lazyRetry(() => import("./pages/trading/Signals"), "TradingSignals");
// const TradingAnalytics = lazyRetry(() => import("./pages/trading/Analytics"), "TradingAnalytics");
// const TradingMarket = lazyRetry(() => import("./pages/trading/Market"), "TradingMarket");
// const TradingSystem = lazyRetry(() => import("./pages/trading/System"), "TradingSystem");
// const TradingAlerts = lazyRetry(() => import("./pages/trading/Alerts"), "TradingAlerts");
// const TradingSettings = lazyRetry(() => import("./pages/trading/Settings"), "TradingSettings");
// const TradingWatchlist = lazyRetry(() => import("./pages/trading/Watchlist"), "TradingWatchlist");
// const TradingPaperTrading = lazyRetry(() => import("./pages/trading/PaperTrading"), "TradingPaperTrading");
// const TradingDataValidation = lazyRetry(() => import("./pages/trading/DataValidation"), "TradingDataValidation");
// const TradingDailyPicks = lazyRetry(() => import("./pages/trading/DailyPicks"), "TradingDailyPicks");

// CAT Prep Dashboard - HIDDEN (module disabled)
// import { CatDashboardLayout } from "./layouts/CatDashboardLayout";
// const CatDashboard = lazyRetry(() => import("./pages/cat/Dashboard"), "CatDashboard");
// const CatSubjects = lazyRetry(() => import("./pages/cat/Subjects"), "CatSubjects");
// const CatTasks = lazyRetry(() => import("./pages/cat/Tasks"), "CatTasks");
// const CatNotes = lazyRetry(() => import("./pages/cat/Notes"), "CatNotes");
// const CatFlashcards = lazyRetry(() => import("./pages/cat/Flashcards"), "CatFlashcards");
// const CatMocks = lazyRetry(() => import("./pages/cat/Mocks"), "CatMocks");
// const CatMockTest = lazyRetry(() => import("./pages/cat/MockTest"), "CatMockTest");
// const CatPractice = lazyRetry(() => import("./pages/cat/Practice"), "CatPractice");
// const CatExternalMocks = lazyRetry(() => import("./pages/cat/ExternalMocks"), "CatExternalMocks");
// const CatRevisions = lazyRetry(() => import("./pages/cat/Revisions"), "CatRevisions");
// const CatMistakes = lazyRetry(() => import("./pages/cat/Mistakes"), "CatMistakes");
// const CatBookmarks = lazyRetry(() => import("./pages/cat/Bookmarks"), "CatBookmarks");
// const CatResources = lazyRetry(() => import("./pages/cat/Resources"), "CatResources");
// const CatAnalytics = lazyRetry(() => import("./pages/cat/Analytics"), "CatAnalytics");
// const CatSettings = lazyRetry(() => import("./pages/cat/Settings"), "CatSettings");
// const CatLearn = lazyRetry(() => import("./pages/cat/Learn"), "CatLearn");
// const CatAdaptiveExam = lazyRetry(() => import("./pages/cat/AdaptiveExam"), "CatAdaptiveExam");
// const CatAssess = lazyRetry(() => import("./pages/cat/Assess"), "CatAssess");
// const CatReview = lazyRetry(() => import("./pages/cat/Review"), "CatReview");

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

                  {/* Wellness (health) */}
                  {/* <Route path="/wellness" element={
                    <Suspense fallback={<PageLoader />}>
                      <WellnessDashboard />
                    </Suspense>
                  } />
                  <Route path="/wellness/onboarding" element={
                    <Suspense fallback={<PageLoader />}>
                      <WellnessOnboarding />
                    </Suspense>
                  } />
                  <Route path="/wellness/plan" element={
                    <Suspense fallback={<PageLoader />}>
                      <WellnessPlan />
                    </Suspense>
                  } />
                  <Route path="/wellness/nutrition" element={
                    <Suspense fallback={<PageLoader />}>
                      <WellnessNutrition />
                    </Suspense>
                  } />
                  <Route path="/wellness/training" element={
                    <Suspense fallback={<PageLoader />}>
                      <WellnessTraining />
                    </Suspense>
                  } />
                  <Route path="/wellness/habits" element={
                    <Suspense fallback={<PageLoader />}>
                      <WellnessHabits />
                    </Suspense>
                  } />
                  <Route path="/wellness/mind" element={
                    <Suspense fallback={<PageLoader />}>
                      <WellnessMind />
                    </Suspense>
                  } />
                  <Route path="/wellness/weekly" element={
                    <Suspense fallback={<PageLoader />}>
                      <WellnessWeekly />
                    </Suspense>
                  } />
                  <Route path="/wellness/weight" element={
                    <Suspense fallback={<PageLoader />}>
                      <WellnessWeight />
                    </Suspense>
                  } /> */}

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
                    <Route
                      path="resume"
                      element={<Navigate to="../hired" replace />}
                    />
                    <Route
                      path="hired"
                      element={
                        <ResumeProvider>
                          <Outlet />
                        </ResumeProvider>
                      }
                    >
                      <Route
                        index
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <GetHiredPortal />
                          </Suspense>
                        }
                      />
                      <Route
                        path="resume"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <ResumeWorkspace />
                          </Suspense>
                        }
                      />
                      <Route
                        path="upload"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <ResumeUpload />
                          </Suspense>
                        }
                      />
                      <Route
                        path="templates"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <ResumeTemplateSelect />
                          </Suspense>
                        }
                      />
                      <Route
                        path="tracker"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <JobTracker />
                          </Suspense>
                        }
                      />
                      <Route
                        path="prep"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <InterviewPrep />
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
                  </Route>

                  {/* =============================================
                      TRADING SYSTEM - NEW PROFESSIONAL INTERFACE
                      Complete from-scratch implementation
                      ============================================= */}
                  {/* <Route path="/trading" element={<TradingLayout />}>
                    <Route index element={<Navigate to="picks" replace />} />
                    <Route path="picks" element={<Suspense fallback={<PageLoader />}><TradingDailyPicks /></Suspense>} />
                    <Route path="overview" element={<Suspense fallback={<PageLoader />}><TradingOverview /></Suspense>} />
                    <Route path="live" element={<Suspense fallback={<PageLoader />}><TradingLive /></Suspense>} />
                    <Route path="positions" element={<Suspense fallback={<PageLoader />}><TradingPositions /></Suspense>} />
                    <Route path="history" element={<Suspense fallback={<PageLoader />}><TradingHistory /></Suspense>} />
                    <Route path="signals" element={<Suspense fallback={<PageLoader />}><TradingSignals /></Suspense>} />
                    <Route path="analytics" element={<Suspense fallback={<PageLoader />}><TradingAnalytics /></Suspense>} />
                    <Route path="market" element={<Suspense fallback={<PageLoader />}><TradingMarket /></Suspense>} />
                    <Route path="system" element={<Suspense fallback={<PageLoader />}><TradingSystem /></Suspense>} />
                    <Route path="alerts" element={<Suspense fallback={<PageLoader />}><TradingAlerts /></Suspense>} />
                    <Route path="settings" element={<Suspense fallback={<PageLoader />}><TradingSettings /></Suspense>} />
                    <Route path="watchlist" element={<Suspense fallback={<PageLoader />}><TradingWatchlist /></Suspense>} />
                    <Route path="paper-trading" element={<Suspense fallback={<PageLoader />}><TradingPaperTrading /></Suspense>} />
                    <Route path="data-validation" element={<Suspense fallback={<PageLoader />}><TradingDataValidation /></Suspense>} />
                  </Route> */}

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
                  {/* <Route
                    path="/deck"
                    element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Deck /></Suspense></ProtectedRoute>}
                  /> */}

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AuthProvider>
            </BrowserRouter>
            <VercelAnalytics />
            <SpeedInsightsTracker />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
