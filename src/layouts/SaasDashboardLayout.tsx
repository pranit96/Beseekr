import { Outlet, useLocation, Link } from "react-router-dom";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { TrialWelcomeBanner } from "@/components/TrialWelcomeBanner";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";

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
      <GlobalFooter />
    </div>
  );
}

export default SaasDashboardLayout;
