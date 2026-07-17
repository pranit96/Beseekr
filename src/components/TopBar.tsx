import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  Menu,
  X,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

import { useTranslation } from "react-i18next";
import { 
  getIsBudgetEnabled,
  getIsSecondBrainEnabled,
  getIsWeeklyDigestEnabled,
} from "@/utils/envFlags";

interface TopBarProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export const TopBar = ({
  sidebarOpen,
  onToggleSidebar,
  showSidebarToggle,
}: TopBarProps) => {
  const { t } = useTranslation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const isBudgetEnabled = getIsBudgetEnabled();
  const isSecondBrainEnabled = getIsSecondBrainEnabled();
  const isWeeklyDigestEnabled = getIsWeeklyDigestEnabled();

  const navigation = [
    { key: "home", name: "Home", href: "/" },
    { key: "chat", name: "Chat", href: "/chat" },
    { key: "agents", name: "Agents", href: "/agents" },
    ...(isSecondBrainEnabled ? [{ key: "brain", name: "Second Brain", href: "/brain" }] : []),
    ...(isWeeklyDigestEnabled ? [{ key: "digest", name: "Weekly Digest", href: "/digest" }] : []),
    { key: "analytics", name: "Analytics", href: "/analytics" },
    ...(isBudgetEnabled
      ? [{ key: "budget", name: "Budget", href: "/dashboard/budget" }]
      : []),
  ];

  const toggleMobileNav = () => setMobileNavOpen((prev) => !prev);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl pointer-events-auto">
      <div className="mx-auto w-full max-w-[2200px] flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-3 min-w-[240px]">
          {showSidebarToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="rounded-lg hover:bg-muted transition-all duration-300"
              aria-label="Toggle conversation history"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          )}

          <Logo className="text-2xl" />
        </div>

        {/* Center Section - Desktop Navigation */}
        <nav className="hidden md:flex items-center justify-center gap-2 flex-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={(e) => {
                  // Prevent navigation if already on the same page
                  if (isActive) {
                    e.preventDefault();
                  }
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {t(`nav.${item.key}`, item.name)}
              </Link>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center justify-end gap-2 min-w-[240px]">
          {/* Mobile Nav Toggle */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileNav}
              className="rounded-lg hover:bg-muted transition-all duration-300"
              aria-label="Toggle navigation"
            >
              {mobileNavOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Help / Shortcuts */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.dispatchEvent(new CustomEvent("open-help"))}
            title={t("nav.help", "Keyboard shortcuts & help")}
            className="rounded-lg"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Profile Dropdown / Login */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2">
                  <p className="text-sm font-medium">
                    {user.full_name || user.name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    to="/profile"
                    className="flex items-center w-full cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    {t("nav.profileSettings", "Profile Settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("nav.signOut", "Logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button
                size="sm"
                className="rounded-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-sm px-4 h-9"
              >
                {t("nav.loginSignUp", "Login / Sign Up")}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Animated Mobile Navigation */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            key="mobile-nav"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl px-4 py-2 shadow-sm"
          >
            <nav className="flex flex-col gap-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={(e) => {
                      // Prevent navigation if already on the same page
                      if (isActive) {
                        e.preventDefault();
                      }
                      setMobileNavOpen(false);
                    }}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    )}
                  >
                    {t(`nav.${item.key}`, item.name)}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
