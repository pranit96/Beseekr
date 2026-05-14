import { useEffect, useState } from "react";
import { getIsNewMode } from "@/utils/envFlags";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, TrendingUp, ArrowRight, FileText } from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GlobalFooter } from "@/components/GlobalFooter";

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const isNewMode = getIsNewMode();

  const go = (route: string) => {
    if (loading) return;
    if (!user) {
      sessionStorage.setItem("auth-redirect", route);
      navigate("/auth");
    } else {
      navigate(route);
    }
  };

  if (!isNewMode) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <GlobalHeader />

        {/* HERO */}
        <section className="max-w-5xl mx-auto px-6 py-24 sm:py-32">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-[-0.03em] text-foreground leading-[1.05] mb-6">
            {t("home.heroHeadline", "Build with clarity.")}
          </h1>
          <p className="text-lg sm:text-2xl font-medium text-muted-foreground/80 max-w-2xl leading-relaxed tracking-tight">
            {t(
              "home.heroDesc",
              "Find real problems, validate ideas, and execute faster — without noise.",
            )}
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

            <h2 className="text-3xl font-bold mb-3 tracking-tight text-foreground">
              {t("home.chatTitle", "AI Chat")}
            </h2>

            <p className="text-muted-foreground/80 text-lg mb-8 max-w-md leading-relaxed">
              {t(
                "home.chatDesc",
                "Think, write, and execute faster with a focused AI workspace.",
              )}
            </p>

            <div className="text-sm font-bold tracking-wider uppercase flex items-center gap-2 text-primary group-hover:translate-x-1 transition-transform">
              {user
                ? t("home.enterWorkspace", "Enter Workspace")
                : t("home.signInNow", "Sign In")}
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

            <h3 className="text-xl font-bold mb-2 tracking-tight text-foreground">
              {t("home.discoverTitle", "Discover")}
            </h3>

            <p className="text-muted-foreground/80 mb-6 leading-relaxed">
              {t(
                "home.discoverDesc",
                "Real startup ideas from real user pain points.",
              )}
            </p>

            <div className="text-xs font-bold tracking-wider uppercase flex items-center gap-1 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all">
              {t("home.explore", "Explore")}
              <ArrowRight className="w-3 h-3" />
            </div>
          </motion.div>

          {/* OPTION 3 CARD */}
          <motion.div
            onClick={() => go("/dashboard/resume")}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            className="border border-border/30 rounded-2xl p-8 cursor-pointer transition
                                bg-muted/10 backdrop-blur-md
                                hover:bg-purple-500/5
                                hover:border-purple-500/30 group shadow-2xl shadow-black/5"
          >
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>

            <h3 className="text-xl font-bold mb-2 tracking-tight text-foreground">
              {t("home.resumeTitle", "Resume ATS")}
            </h3>

            <p className="text-muted-foreground/80 mb-6 leading-relaxed">
              {t(
                "home.resumeDesc",
                "Upload, grade and optimize your resume with elite AI agents.",
              )}
            </p>

            <div className="text-xs font-bold tracking-wider uppercase flex items-center gap-1 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all">
              {t("home.optimize", "Optimize")}
              <ArrowRight className="w-3 h-3" />
            </div>
          </motion.div>
        </section>

        {/* FOOTER */}
        <GlobalFooter />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#09090b] text-foreground overflow-hidden selection:bg-primary/30">
      <div className="flex-shrink-0">
        <GlobalHeader />
      </div>

      {/* CENTER CONTENT: SCROLLABLE ONLY IF NECESSARY */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col min-h-0 custom-scrollbar relative">
        <div className="max-w-5xl mx-auto w-full px-6 pt-32 pb-12 md:pt-40 md:pb-16">
          {/* HERO WITH SAME TYPOGRAPHY AS CHAT PAGE */}
          <section className="mb-12 md:mb-16 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Eyebrow */}
            <div className="mb-5 flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-muted-foreground/60 uppercase flex items-center select-none">
                {t("home.welcome", "Welcome")}{" "}
                <span className="mx-2 opacity-50 text-[8px]">•</span>{" "}
                {t("home.ecosystem", "The Ecosystem")}
              </span>
            </div>

            {/* Multi-stack Headline exactly like Chat */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] flex flex-col gap-1 text-left mb-6">
              <span className="text-foreground">
                {t("home.heroHeadline", "Build with clarity.")}
              </span>
              <span className="text-muted-foreground/30">
                {t("home.heroSubHeadline", "Validate without noise.")}
              </span>
            </h1>

            <p className="text-base sm:text-lg font-medium text-muted-foreground/70 max-w-xl tracking-tight">
              {t(
                "home.heroDesc",
                "Find real problems, test ideas instantly, and ship faster in one high-focus stack.",
              )}
            </p>
          </section>

          {/* CARDS LAYOUT - SYMMETRICAL 3-COLUMN GRID */}
          <section className="grid md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 fill-mode-both">
            {/* MAIN CARD */}
            <motion.div
              onClick={() => go("/chat")}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              className="border border-border/30 rounded-3xl p-10 cursor-pointer transition bg-card/5 backdrop-blur-xl hover:bg-primary/[0.03] hover:border-primary/20 group shadow-2xl shadow-black/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none" />

              <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-primary/5">
                <MessageSquare className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold mb-2 tracking-tight text-foreground">
                {t("home.chatTitle", "AI Chat")}
              </h3>

              <p className="text-muted-foreground/80 text-sm mb-8 leading-relaxed">
                {t(
                  "home.chatDesc",
                  "Think, write, and execute faster with a focused AI workspace.",
                )}
              </p>

              <div className="text-xs font-bold tracking-widest uppercase flex items-center gap-2 text-primary group-hover:translate-x-1 transition-transform">
                {user
                  ? t("home.enterWorkspace", "Enter Workspace")
                  : t("home.signInNow", "Sign In Now")}
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

              <h3 className="text-xl font-bold mb-2 tracking-tight text-foreground">
                {t("home.discoverTitle", "Discover")}
              </h3>

              <p className="text-muted-foreground/80 mb-8 leading-relaxed text-sm">
                {t(
                  "home.discoverDesc",
                  "Real startup ideas extracted from real user pain points.",
                )}
              </p>

              <div className="text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 text-blue-400 group-hover:translate-x-1 transition-all">
                {t("home.explore", "Explore")}
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>

            {/* RESUME CARD */}
            <motion.div
              onClick={() => go("/dashboard/resume")}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="border border-border/30 rounded-3xl p-10 cursor-pointer transition
                               bg-card/5 backdrop-blur-xl
                               hover:bg-purple-500/[0.03]
                               hover:border-purple-500/20 group shadow-2xl shadow-black/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none" />

              <div className="h-14 w-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-8 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-purple-500/5">
                <FileText className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold mb-2 tracking-tight text-foreground">
                {t("home.resumeTitle", "Resume Builder")}
              </h3>

              <p className="text-muted-foreground/80 mb-8 leading-relaxed text-sm">
                {t(
                  "home.resumeDesc",
                  "Elite-grade ATS score evaluation, optimization and formatting pipeline.",
                )}
              </p>

              <div className="text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 text-purple-400 group-hover:translate-x-1 transition-all">
                {t("home.build", "Optimize")}
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          </section>
        </div>
      </main>

      <div className="flex-shrink-0">
        <GlobalFooter />
      </div>
    </div>
  );
}
