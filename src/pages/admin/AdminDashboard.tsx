import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import {
  Shield,
  Activity,
  Settings,
  Terminal,
  RefreshCw,
  ChevronRight,
  Cpu,
  Zap,
  BookOpen,
} from "lucide-react";
import { AdminMonitoring, AdminSettings, AdminBlogs } from "./components";

const NAV = [
  {
    id: "overview",
    label: "Monitoring",
    icon: Activity,
    description: "Memory & system health",
  },
  {
    id: "settings",
    label: "Feature Flags",
    icon: Settings,
    description: "Live config & toggles",
  },
  {
    id: "blogs",
    label: "Blogs Suite",
    icon: BookOpen,
    description: "Manual generation & content analytics",
  },
];

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsRefreshing(false);
    toast({
      title: "Dashboard Refreshed",
      description: "All telemetry and settings have been reloaded.",
    });
  };

  const activeNav = NAV.find((n) => n.id === activeTab) || NAV[0];

  return (
    <div className="h-screen flex flex-col bg-[#09090b] text-foreground overflow-hidden">
      {/* ── TOP BAR ───────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-white/[0.06] bg-[#09090b]/90 backdrop-blur-xl z-20">
        <div className="max-w-screen-2xl mx-auto px-6 flex items-center h-14 gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 mr-6 shrink-0">
            <div className="w-7 h-7 bg-red-500/15 border border-red-500/25 rounded-lg flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-red-400" />
            </div>
            <span className="text-xs font-black tracking-[0.2em] text-muted-foreground uppercase">
              Admin
            </span>
          </div>

          {/* Nav items */}
          <nav className="flex items-center gap-0.5 flex-1">
            {NAV.map((item) => {
              const active = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    active
                      ? "bg-white/[0.08] text-white"
                      : "text-zinc-500 hover:text-muted-foreground hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Status + Refresh */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-full px-3 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400">
                System Live
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className="h-8 w-8 p-0 text-zinc-500 hover:text-white hover:bg-white/[0.05] rounded-lg"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </header>

      {/* ── PAGE HEADER ───────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-white/[0.05] bg-[#09090b]">
        <div className="max-w-screen-2xl mx-auto px-6 py-5">
          <div className="flex items-center gap-2 text-zinc-600 text-xs font-medium">
            <Shield className="w-3 h-3" />
            <ChevronRight className="w-3 h-3" />
            <span className="text-muted-foreground font-bold">
              {activeNav.label}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1.5">
            {activeNav.label}
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {activeNav.description}
          </p>
        </div>
      </div>

      {/* ── CONTENT ───────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-screen-2xl mx-auto px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === "overview" && <AdminMonitoring />}
              {activeTab === "settings" && <AdminSettings />}
              {activeTab === "blogs" && <AdminBlogs />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
