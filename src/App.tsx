import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { ThemeProvider } from "./hooks/use-theme";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { TopBar } from "./components/TopBar";

import Chat from "./pages/Chat";
import Agents from "./pages/Agents";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import Privacy from "./pages/Privacy";

const queryClient = new QueryClient();

// PublicRoute: prevents signed-in users from visiting auth pages
const PublicRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (user) return <Navigate to="/chat" replace />; // signed-in users redirected to app
  return <Outlet />; // render nested public routes
};

// ProtectedLayout: renders TopBar + protected content; enforces auth
const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <TopBar />
      {/* push page content below TopBar if your TopBar is fixed; adjust padding as needed */}
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
};

// Simple Public layout (no TopBar)
const PublicLayout = () => <Outlet />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes: Landing, Auth, Privacy */}
              <Route element={<PublicLayout />}>
                <Route element={<PublicRoute />}>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/privacy" element={<Privacy />} />
                </Route>

                {/* Landing is public and allowed for everyone (even signed-in users) */}
                <Route path="/" element={<Landing />} />
                <Route path="/landing" element={<Landing />} />
              </Route>

              {/* Protected routes - TopBar will only render for these */}
               <Route element={<ProtectedLayout />}>
                <Route path="/chat" element={<Chat />} />
                <Route path="/agents" element={<Agents />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/profile" element={<Profile />} />
                {/* convenient redirect for base protected path */}
                <Route path="/app" element={<Navigate to="/chat" replace />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
