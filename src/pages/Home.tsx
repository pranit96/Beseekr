import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, TrendingUp, ArrowRight } from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const go = (route: string) => {
    if (loading) return;
    if (!user) {
      sessionStorage.setItem("auth-redirect", route);
      navigate("/auth");
    } else {
      navigate(route);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <GlobalHeader />

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">
          Build with clarity.
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg">
          Find real problems, validate ideas, and execute faster — without
          noise.
        </p>
      </section>

      {/* LAYOUT */}
      <section className="max-w-5xl mx-auto px-6 pb-20 grid md:grid-cols-3 gap-6">
        {/* MAIN CARD */}
        <motion.div
          onClick={() => go("/chat")}
          whileHover={{ scale: 1.015 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="md:col-span-2 border rounded-xl p-8 cursor-pointer transition bg-card hover:bg-muted/30"
        >
          <MessageSquare className="w-6 h-6 mb-4" />

          <h2 className="text-2xl font-semibold mb-2">AI Chat</h2>

          <p className="text-muted-foreground mb-6">
            Think, write, and execute faster with a focused AI workspace.
          </p>

          <button className="text-sm font-medium flex items-center gap-2">
            {user ? "Open Chat" : "Sign in"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* SECONDARY CARD */}
        <motion.div
          onClick={() => go("/dashboard/problems")}
          whileHover={{ scale: 1.06 }}
          transition={{ type: "spring", stiffness: 220, damping: 16 }}
          className="border rounded-xl p-6 cursor-pointer transition
                               bg-card
                               hover:bg-blue-500/5
                               hover:border-blue-400/40"
        >
          <TrendingUp className="w-5 h-5 mb-3" />

          <h3 className="font-medium mb-1">Problem Discovery</h3>

          <p className="text-sm text-muted-foreground mb-4">
            Real startup ideas from real user pain.
          </p>

          <button className="text-sm flex items-center gap-1">
            Explore
            <ArrowRight className="w-3 h-3" />
          </button>
        </motion.div>

        {/* COMING SOON */}
        <div className="border border-dashed rounded-xl p-6 text-sm text-muted-foreground flex items-center justify-center">
          More tools coming soon
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-4">
        <span>© 2026 Beseekr</span>
        <div className="flex items-center gap-4">
          <Link to="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
          <Link
            to="/privacy"
            className="hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
