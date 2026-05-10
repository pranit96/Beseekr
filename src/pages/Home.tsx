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
    <div className="h-screen flex flex-col bg-[#09090b] text-foreground overflow-hidden selection:bg-primary/30">
      <div className="flex-shrink-0">
        <GlobalHeader />
      </div>

      {/* CENTER CONTENT: SCROLLABLE ONLY IF NECESSARY */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col justify-center min-h-0 custom-scrollbar relative">
        <div className="max-w-5xl mx-auto w-full px-6 py-12 lg:py-20">
          
          {/* HERO WITH SAME TYPOGRAPHY AS CHAT PAGE */}
          <section className="mb-12 md:mb-16 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Eyebrow */}
            <div className="mb-5 flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-muted-foreground/60 uppercase flex items-center select-none">
                Welcome <span className="mx-2 opacity-50 text-[8px]">•</span> The Ecosystem
              </span>
            </div>

            {/* Multi-stack Headline exactly like Chat */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] flex flex-col gap-1 text-left mb-6">
              <span className="text-foreground">Build with clarity.</span>
              <span className="text-muted-foreground/30">
                Validate without noise.
              </span>
            </h1>
            
            <p className="text-base sm:text-lg font-medium text-muted-foreground/70 max-w-xl tracking-tight">
              Find real problems, test ideas instantly, and ship faster in one high-focus stack.
            </p>
          </section>

          {/* CARDS LAYOUT */}
          <section className="grid md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 fill-mode-both">
            {/* MAIN CARD */}
            <motion.div
              onClick={() => go("/chat")}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              className="md:col-span-2 border border-border/30 rounded-3xl p-10 cursor-pointer transition bg-card/5 backdrop-blur-xl hover:bg-primary/[0.03] hover:border-primary/20 group shadow-2xl shadow-black/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none" />
              
              <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-primary/5">
                <MessageSquare className="w-6 h-6" />
              </div>

              <h2 className="text-3xl font-bold mb-3 tracking-tight text-foreground">AI Chat</h2>

              <p className="text-muted-foreground/80 text-lg mb-10 max-w-sm leading-relaxed">
                Think, write, and execute faster with a focused AI workspace.
              </p>

              <div className="text-xs font-bold tracking-widest uppercase flex items-center gap-2 text-primary group-hover:translate-x-1 transition-transform">
                {user ? "Enter Workspace" : "Sign In Now"}
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>

            {/* SECONDARY CARD */}
            <motion.div
              onClick={() => go("/dashboard/problems")}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="border border-border/30 rounded-3xl p-10 cursor-pointer transition
                               bg-card/5 backdrop-blur-xl
                               hover:bg-blue-500/[0.03]
                               hover:border-blue-500/20 group shadow-2xl shadow-black/20 relative overflow-hidden"
            >
              <div className="h-14 w-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-8 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-blue-500/5">
                <TrendingUp className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold mb-2 tracking-tight text-foreground">Discover</h3>

              <p className="text-muted-foreground/80 mb-8 leading-relaxed text-sm">
                Real startup ideas extracted from real user pain points.
              </p>

              <div className="text-xs font-bold tracking-widest uppercase flex items-center gap-1 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all">
                Explore
                <ArrowRight className="w-3 h-3" />
              </div>
            </motion.div>

            {/* COMING SOON (Re-integrated) */}
            <div className="border border-dashed border-border/20 rounded-3xl p-10 flex items-center justify-center bg-card/[0.02] shadow-xl">
              <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground/40">More tools coming</span>
            </div>
          </section>

        </div>
      </main>

      <div className="flex-shrink-0">
        <GlobalFooter />
      </div>
    </div>
  );
}
