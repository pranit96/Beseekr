// src/layouts/ProtectedLayout.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GlobalHeader } from "@/components/GlobalHeader";

type LayoutContextType = {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const useLayout = (): LayoutContextType => {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be used within ProtectedLayout");
  return ctx;
};

export const ProtectedLayout: React.FC = () => {
  const { user, loading } = useAuth();

  // Sidebar state lives here now
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    const saved =
      typeof window !== "undefined"
        ? sessionStorage.getItem("sidebarOpen")
        : null;
    return saved === "false" ? false : true;
  });

  useEffect(() => {
    sessionStorage.setItem("sidebarOpen", sidebarOpen.toString());
  }, [sidebarOpen]);

  // auth gating similar to what you had before
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <LayoutContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      <div className="min-h-screen bg-background text-foreground">
        <GlobalHeader />

        <main className="min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </LayoutContext.Provider>
  );
};

export default ProtectedLayout;
