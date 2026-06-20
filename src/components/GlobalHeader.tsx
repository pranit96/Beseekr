import { useMemo, useState } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/contexts/AuthContext";
import { paymentsApi } from "@/api/payments";
import { apiClient } from "@/lib/api";
import {
  Compass,
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  Clock,
  MessageSquare,
  BookOpen,
  Home,
  Menu,
  X,
  Bookmark,
  Zap,
  Bot,
  CreditCard,
  TrendingUp,
  Activity,
  FileText,
  Sparkles,
  Shield,
  Trophy,
  LayoutDashboard,
  Target,
  LayoutGrid,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { getIsBudgetEnabled } from "@/utils/envFlags";

const NAV_ITEMS = {
  home: {
    key: "home",
    name: "Home",
    href: "/",
    icon: Home,
    color: "from-slate-500 to-zinc-600",
    exact: true,
  },
  chat: {
    key: "chat",
    name: "AI Chat",
    href: "/chat",
    icon: MessageSquare,
    color: "from-violet-500 to-fuchsia-500",
    exact: false,
  },
  discover: {
    key: "discover",
    name: "Discover",
    href: "/dashboard/problems",
    icon: Compass,
    color: "from-violet-500 to-purple-600",
    exact: false,
  },
  blog: {
    key: "blog",
    name: "Blogs",
    href: "/blogs",
    icon: BookOpen,
    color: "from-amber-500 to-orange-500",
    exact: false,
  },
  agents: {
    key: "agents",
    name: "Agents",
    href: "/agents",
    icon: Bot,
    color: "from-cyan-500 to-blue-500",
    exact: false,
  },
  canvas: {
    key: "canvas",
    name: "AI canvase",
    href: "/canvas",
    icon: LayoutGrid,
    color: "from-purple-500 to-pink-500",
    exact: false,
  },
  research: {
    key: "research",
    name: "Research",
    href: "/dashboard/validate",
    icon: Zap,
    color: "from-blue-500 to-indigo-500",
    exact: false,
  },
  watchlist: {
    key: "watchlist",
    name: "Watchlist",
    href: "/dashboard/watchlist",
    icon: Bookmark,
    color: "from-emerald-500 to-teal-500",
    exact: false,
  },
  // resume: {
  //   key: "resume",
  //   name: "Resume",
  //   href: "/dashboard/resume",
  //   icon: FileText,
  //   color: "from-indigo-500 to-pink-500",
  //   exact: false,
  // },
  // resumePortal: {
  //   key: "resumePortal",
  //   name: "Portal",
  //   href: "/dashboard/resume",
  //   icon: Trophy,
  //   color: "from-indigo-500 to-pink-500",
  //   exact: true,
  // },
  // resumeUpload: {
  //   key: "resumeUpload",
  //   name: "Upload",
  //   href: "/dashboard/resume/upload",
  //   icon: FileText,
  //   color: "from-sky-400 to-indigo-500",
  //   exact: false,
  // },
  // resumeTailor: {
  //   key: "resumeTailor",
  //   name: "Job Tailor",
  //   href: "/dashboard/resume/tailor",
  //   icon: Trophy,
  //   color: "from-indigo-500 to-violet-500",
  //   exact: false,
  // },
  // resumeWorkspace: {
  //   key: "resumeWorkspace",
  //   name: "Workspace",
  //   href: "/dashboard/resume/workspace",
  //   icon: LayoutDashboard,
  //   color: "from-purple-500 to-indigo-500",
  //   exact: false,
  // },
  pricing: {
    key: "pricing",
    name: "Pricing",
    href: "/dashboard/pricing",
    icon: CreditCard,
    color: "from-amber-500 to-orange-500",
    exact: false,
  },
  budget: {
    key: "budget",
    name: "Budget",
    href: "/dashboard/budget",
    icon: Wallet,
    color: "from-emerald-500 to-teal-500",
    exact: false,
  },
};

function isPathActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function getNavigationContext(pathname: string, isPremium: boolean, isBudgetEnabled: boolean) {
  const isChatContext =
    pathname.startsWith("/chat") ||
    pathname.startsWith("/agents") ||
    pathname.startsWith("/canvas");
  const isResumeContext = pathname.startsWith("/dashboard/resume");
  const isDiscoverContext =
    pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/dashboard/profile");

  if (isChatContext) {
    const items = [
      NAV_ITEMS.home,
      NAV_ITEMS.chat,
      NAV_ITEMS.agents,
      NAV_ITEMS.canvas,
    ];
    if (isBudgetEnabled) {
      items.push(NAV_ITEMS.budget);
    }
    return items;
  } else if (isDiscoverContext) {
    const items = [
      NAV_ITEMS.home,
      NAV_ITEMS.discover,
      NAV_ITEMS.research,
      NAV_ITEMS.watchlist,
    ];
    if (isBudgetEnabled) {
      items.push(NAV_ITEMS.budget);
    }
    if (!isPremium) items.push(NAV_ITEMS.pricing);
    return items;
  }

  const items = [
    NAV_ITEMS.home,
    NAV_ITEMS.chat,
    NAV_ITEMS.discover,
    NAV_ITEMS.blog,
  ];
  if (isBudgetEnabled) {
    items.push(NAV_ITEMS.budget);
  }
  return items;
}

export function GlobalHeader() {
  const { t } = useTranslation();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const queryClient = useQueryClient();

  // Smart Preload and Prefetch system for instant loading performance
  const handlePrefetch = (href: string) => {
    try {
      // 1. Dynamic Route Chunk Preloading
      if (href === "/chat") {
        import("@/pages/Chat");
      } else if (href === "/blogs") {
        import("@/pages/blogs/BlogList");
      } else if (href === "/dashboard/problems") {
        import("@/pages/saas/ProblemsList");
      }

      // 2. React Query Data Prefetching
      if (href === "/chat" && user?.id) {
        // Prefetch active conversations list
        queryClient.prefetchQuery({
          queryKey: ["conversations", user.id],
          queryFn: async () => {
            const { apiClient } = await import("@/lib/api");
            const response = await apiClient.getConversations({
              status: "active",
              page: 1,
              limit: 30,
            });
            let rawConversations: any[] = [];
            if (response.success && response.data) {
              const resData = response.data as any;
              const serverConvs = Array.isArray(resData)
                ? resData
                : resData.conversations || resData.data || [];
              rawConversations = serverConvs.map((c: any) => ({
                id: c.id,
                title: c.title,
                status: c.status,
                last_message_at:
                  c.updated_at || c.created_at || new Date().toISOString(),
              }));
            }
            return rawConversations;
          },
          staleTime: 1000 * 60 * 5,
        });

        // Prefetch agents
        queryClient.prefetchQuery({
          queryKey: ["agents"],
          queryFn: async () => {
            const { apiClient } = await import("@/lib/api");
            const res = await apiClient.getAgents();
            return res.data || [];
          },
          staleTime: 5 * 60 * 1000,
        });
      } else if (href === "/blogs") {
        // Prefetch blog topics
        queryClient.prefetchQuery({
          queryKey: ["blogTopics"],
          queryFn: async () => {
            const { getTopics } = await import("@/api/blogs");
            const res = await getTopics();
            return res || [];
          },
          staleTime: 5 * 60 * 1000,
        });

        // Prefetch first page of blogs
        queryClient.prefetchInfiniteQuery({
          queryKey: ["blogs", undefined, ""],
          queryFn: async ({ pageParam = 1 }) => {
            const { getBlogs } = await import("@/api/blogs");
            const res = await getBlogs({
              page: pageParam,
              limit: 12,
            });
            return {
              data: res.data || [],
              nextPage:
                res.meta && res.meta.page < res.meta.totalPages
                  ? pageParam + 1
                  : undefined,
            };
          },
          initialPageParam: 1,
          staleTime: 5 * 60 * 1000,
        });
      } else if (href === "/dashboard/problems") {
        // Prefetch first page of problems list (default: hot sort)
        queryClient.prefetchQuery({
          queryKey: ["problems", 1, "hot"],
          queryFn: async () => {
            const { problemsApi } = await import("@/api/problems");
            return problemsApi.getProblems("hot", 1, 12);
          },
          staleTime: 5 * 60 * 1000,
        });

        if (user) {
          // Prefetch user watchlist
          queryClient.prefetchQuery({
            queryKey: ["watchlist"],
            queryFn: async () => {
              const { problemsApi } = await import("@/api/problems");
              return problemsApi.getWatchlist();
            },
            staleTime: 5 * 60 * 1000,
          });

          // Prefetch subscription plans
          queryClient.prefetchQuery({
            queryKey: ["subscription-plans"],
            queryFn: () => paymentsApi.getPlans(),
            staleTime: 5 * 60 * 1000,
          });
        }
      }
    } catch (e) {
      console.warn("Silent route preloading failed", e);
    }
  };

  // Save current path so auth flow redirects back after login
  const saveAuthRedirect = () => {
    const currentPath = location.pathname + location.search;
    if (currentPath !== "/auth" && !currentPath.startsWith("/auth/")) {
      sessionStorage.setItem("auth-redirect", currentPath);
    }
  };

  // Fetch plans to get user subscription status
  const { data: plansData } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: () => paymentsApi.getPlans(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Compute contextual navigation items based on current route
  const currentNavigation = useMemo(() => {
    const isPremium = plansData?.user?.is_premium === true;
    const isBudgetEnabled = getIsBudgetEnabled();
    return getNavigationContext(location.pathname, isPremium, isBudgetEnabled);
  }, [location.pathname, plansData?.user?.is_premium]);

  return (
    <>
      <header className="sticky top-0 z-50 px-2 sm:px-4 pt-2 sm:pt-3">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto max-w-7xl"
        >
          <div className="flex items-center justify-between rounded-xl sm:rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl px-3 sm:px-5 py-2 sm:py-2.5 shadow-lg shadow-black/5">
            {/* ── Logo ── */}
            <Logo className="text-xl sm:text-2xl" linkClassName="shrink-0" />

            {/* ── Desktop Nav Pills ── */}
            <nav className="hidden lg:flex items-center gap-0.5 p-1 rounded-xl bg-muted/50">
              {currentNavigation.map((item) => {
                const isActive = isPathActive(
                  location.pathname,
                  item.href,
                  item.exact,
                );
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onMouseEnter={() => handlePrefetch(item.href)}
                    onFocus={() => handlePrefetch(item.href)}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-1.5",
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-background rounded-lg shadow-sm border border-border/50"
                          transition={{
                            type: "spring",
                            bounce: 0.2,
                            duration: 0.6,
                          }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5">
                        <item.icon
                          className={cn(
                            "h-3.5 w-3.5 transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground",
                          )}
                        />
                        {t(`nav.${(item as any).key}`, item.name)}
                      </span>
                    </motion.div>
                  </NavLink>
                );
              })}
            </nav>

            {/* ── Tablet Nav (icons only, md–lg) ── */}
            <nav className="hidden md:flex lg:hidden items-center gap-0.5 p-0.5 rounded-lg bg-muted/50">
              {currentNavigation.map((item) => {
                const isActive = isPathActive(
                  location.pathname,
                  item.href,
                  item.exact,
                );
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onMouseEnter={() => handlePrefetch(item.href)}
                    onFocus={() => handlePrefetch(item.href)}
                    className="relative"
                    title={t(`nav.${(item as any).key}`, item.name)}
                  >
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "relative p-2 rounded-md transition-all duration-200",
                        isActive
                          ? "bg-background shadow-sm border border-border/50"
                          : "hover:bg-muted/50",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-4 w-4 transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                    </motion.div>
                  </NavLink>
                );
              })}
            </nav>

            {/* ── Right Controls ── */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Trial Badge */}
              {user?.trial?.active && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20"
                >
                  <Clock className="h-3 w-3 text-primary" />
                  <span className="text-xs font-medium text-primary">
                    {t("nav.trial.full", {
                      count: user.trial.days_remaining,
                      defaultValue: `${user.trial.days_remaining} ${user.trial.days_remaining === 1 ? "day" : "days"} left`,
                    })}
                  </span>
                </motion.div>
              )}

              {/* Theme Toggle */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="rounded-lg sm:rounded-xl h-8 w-8 sm:h-9 sm:w-9"
                  aria-label={
                    theme === "dark"
                      ? t("nav.theme.light", "Switch to light mode")
                      : t("nav.theme.dark", "Switch to dark mode")
                  }
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={theme}
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {theme === "dark" ? (
                        <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </Button>
              </motion.div>

              {/* Profile / Login */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-lg sm:rounded-xl h-8 w-8 sm:h-9 sm:w-9"
                        aria-label={t("nav.userMenu", "User menu")}
                      >
                        <User className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </motion.div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl">
                    <div className="px-3 py-3">
                      <p className="font-medium">
                        {user.full_name || user.name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                      {user.trial?.active && (
                        <div className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 w-fit">
                          <Clock className="h-3 w-3 text-primary" />
                          <span className="text-xs font-medium text-primary">
                            Trial:{" "}
                            {t("nav.trial.full", {
                              count: user.trial.days_remaining,
                              defaultValue: `${user.trial.days_remaining} ${user.trial.days_remaining === 1 ? "day" : "days"} left`,
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      asChild
                      className="rounded-lg cursor-pointer"
                    >
                      <Link
                        to="/dashboard/profile"
                        className="flex items-center w-full"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        {t("nav.settings", "Settings")}
                      </Link>
                    </DropdownMenuItem>

                    {user.role === "admin" && (
                      <DropdownMenuItem
                        asChild
                        className="rounded-lg cursor-pointer bg-primary/5 hover:bg-primary/10"
                      >
                        <Link to="/admin" className="flex items-center w-full">
                          <Shield className="mr-2 h-4 w-4 text-primary" />
                          {t("nav.admin", "Admin Console")}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="rounded-lg cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("nav.signOut", "Sign Out")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link to="/auth" onClick={saveAuthRedirect}>
                    <Button
                      size="sm"
                      className="rounded-lg sm:rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9"
                    >
                      {t("nav.loginSignUp", "Login / Sign Up")}
                    </Button>
                  </Link>
                </motion.div>
              )}

              {/* Mobile Hamburger */}
              <motion.div whileTap={{ scale: 0.95 }} className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen((prev) => !prev)}
                  className="rounded-lg h-8 w-8"
                  aria-label={t("nav.userMenu", "Toggle menu")}
                >
                  {mobileOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </header>

      {/* ── Mobile Full-Screen Menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-nav-overlay"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-x-0 top-[56px] z-40 md:hidden border-b border-border/50 bg-background/95 backdrop-blur-xl shadow-xl max-h-[calc(100vh-56px)] overflow-y-auto"
          >
            <nav className="px-4 py-3 space-y-1">
              {/* Contextual navigation items */}
              {currentNavigation.map((item) => {
                const isActive = isPathActive(
                  location.pathname,
                  item.href,
                  item.exact,
                );
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onMouseEnter={() => handlePrefetch(item.href)}
                    onFocus={() => handlePrefetch(item.href)}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center",
                        isActive
                          ? `bg-gradient-to-br ${item.color} shadow-md`
                          : "bg-muted",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-4 w-4",
                          isActive ? "text-white" : "text-muted-foreground",
                        )}
                      />
                    </div>
                    {t(`nav.${(item as any).key}`, item.name)}
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}

              {/* Logout for mobile users */}
              {user && (
                <>
                  <div className="border-t border-border/50 my-2" />
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("nav.signOut", "Sign Out")}
                  </button>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
