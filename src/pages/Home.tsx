import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, TrendingUp, ArrowRight } from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { GlobalFooter } from "@/components/GlobalFooter";

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
      <section className="max-w-5xl mx-auto px-6 py-24 sm:py-32">
        <h1 className="text-5xl sm:text-7xl font-bold tracking-[-0.03em] text-foreground leading-[1.05] mb-6">
          Build with clarity.
        </h1>
        <p className="text-lg sm:text-2xl font-medium text-muted-foreground/80 max-w-2xl leading-relaxed tracking-tight">
          Find real problems, validate ideas, and execute faster — without noise.
        </p>
      </section>

      {/* LAYOUT */}
      <section className="max-w-5xl mx-auto px-6 pb-20 grid md:grid-cols-3 gap-6">
        {/* MAIN CARD */}
        <motion.div
          onClick={() => go("/chat")}
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="md:col-span-2 border border-border/30 rounded-2xl p-10 cursor-pointer transition bg-muted/10 backdrop-blur-md hover:bg-muted/20 group shadow-2xl shadow-black/5"
        >
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-6 h-6" />
          </div>

          <h2 className="text-3xl font-bold mb-3 tracking-tight text-foreground">AI Chat</h2>

          <p className="text-muted-foreground/80 text-lg mb-8 max-w-md leading-relaxed">
            Think, write, and execute faster with a focused AI workspace.
          </p>

          <div className="text-sm font-bold tracking-wider uppercase flex items-center gap-2 text-primary group-hover:translate-x-1 transition-transform">
            {user ? "Enter Workspace" : "Sign In"}
            <ArrowRight className="w-4 h-4" />
          </div>
        </motion.div>

        {/* SECONDARY CARD */}
        <motion.div
          onClick={() => go("/dashboard/problems")}
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
          className="border border-border/30 rounded-2xl p-8 cursor-pointer transition
                               bg-muted/10 backdrop-blur-md
                               hover:bg-blue-500/5
                               hover:border-blue-500/30 group shadow-2xl shadow-black/5"
        >
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>

          <h3 className="text-xl font-bold mb-2 tracking-tight text-foreground">Discover</h3>

          <p className="text-muted-foreground/80 mb-6 leading-relaxed">
            Real startup ideas from real user pain points.
          </p>

          <div className="text-xs font-bold tracking-wider uppercase flex items-center gap-1 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all">
            Explore
            <ArrowRight className="w-3 h-3" />
          </div>
        </motion.div>

        {/* COMING SOON */}
        <div className="border border-dashed border-border/40 rounded-2xl p-8 text-sm font-medium text-muted-foreground/50 flex items-center justify-center bg-muted/[0.02]">
          Expand stack coming soon
        </div>
      </section>

      {/* FOOTER */}
      <GlobalFooter />
    </div>
  );
}
