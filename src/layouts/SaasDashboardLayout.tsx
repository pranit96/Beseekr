import { Outlet, useLocation, Link } from "react-router-dom";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { TrialWelcomeBanner } from "@/components/TrialWelcomeBanner";
import { GlobalHeader } from "@/components/GlobalHeader";

export function SaasDashboardLayout() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Floating Header */}
      <GlobalHeader />

      {/* Main Content */}
      <main className="relative z-10 px-2 sm:px-4 py-4 sm:py-8 flex-1">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mx-auto max-w-6xl"
        >
          {/* Trial Welcome Banner */}
          {user?.trial?.active && (
            <TrialWelcomeBanner daysRemaining={user.trial.days_remaining} />
          )}
          <Outlet />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-background/80 backdrop-blur-sm mt-auto">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left - Brand & Copyright */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>
                © {new Date().getFullYear()} beseekr. All rights reserved.
              </span>
            </div>

            {/* Center - Links */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm">
              <Link
                to="/dashboard/problems"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Browse Problems
              </Link>
              <Link
                to="/dashboard/validate"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Validate Ideas
              </Link>
              <Link
                to="/dashboard/pricing"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
              <Link
                to="/about"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </Link>
              <Link
                to="/contact"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </Link>
              <Link
                to="/privacy"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
            </div>

            {/* Right - Social/Extra */}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default SaasDashboardLayout;
