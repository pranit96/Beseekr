import { useEffect, useState } from "react";
import { getIsNewMode, getIsBudgetEnabled } from "@/utils/envFlags";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  MessageSquare,
  TrendingUp,
  ArrowRight,
  FileText,
  Wallet,
  Brain,
  Mail,
} from "lucide-react";
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

  const isBudgetEnabled = getIsBudgetEnabled();

  if (!isNewMode) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <GlobalHeader />

        {/* HERO */}
        <section className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-[-0.03em] text-foreground leading-[1.05] mb-6">
            {t("home.heroHeadline", "Uncover. Build. Launch.")}
          </h1>
          <p className="text-lg sm:text-2xl font-medium text-muted-foreground/80 max-w-2xl leading-relaxed tracking-tight">
            {t(
              "home.heroDesc",
              "The Seeker's Loop — a high-focus sandbox to validate real-world problems, execute solutions, and land high-impact opportunities.",
            )}
          </p>
        </section>

        {/* LAYOUT */}
        {/* LAYOUT */}
        <section className="max-w-5xl mx-auto px-6 pb-20 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* CARD 1: DISCOVER */}
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
              {t("home.discoverTitle", "1. Uncover Problems")}
            </h3>

            <p className="text-muted-foreground/80 mb-6 text-sm leading-relaxed">
              {t(
                "home.discoverDesc",
                "Find validated startup ideas and real user pain points so you never build in a vacuum.",
              )}
            </p>

            <div className="text-xs font-bold tracking-wider uppercase flex items-center gap-1 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all">
              {t("home.explore", "Explore Problems")}
              <ArrowRight className="w-3 h-3" />
            </div>
          </motion.div>

          {/* CARD 2: AI CHAT */}
          <motion.div
            onClick={() => go("/chat")}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className="border border-border/30 rounded-2xl p-8 cursor-pointer transition bg-muted/10 backdrop-blur-md hover:bg-primary/5 hover:border-primary/30 group shadow-2xl shadow-black/5"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>

            <h3 className="text-xl font-bold mb-2 tracking-tight text-foreground">
              {t("home.chatTitle", "2. Execute Solutions")}
            </h3>

            <p className="text-muted-foreground/80 mb-6 text-sm leading-relaxed">
              {t(
                "home.chatDesc",
                "Brainstorm, prototype, and draft your systems inside a context-rich, high-focus AI workspace.",
              )}
            </p>

            <div className="text-xs font-bold tracking-wider uppercase flex items-center gap-1 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all">
              {user
                ? t("home.enterWorkspace", "Open Workspace")
                : t("home.signInNow", "Sign In")}
              <ArrowRight className="w-3 h-3" />
            </div>
          </motion.div>

          {/* CARD 3: SECOND BRAIN */}
          <motion.div
            onClick={() => go("/brain")}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className="border border-border/30 rounded-2xl p-8 cursor-pointer transition bg-muted/10 backdrop-blur-md hover:bg-violet-500/5 hover:border-violet-500/30 group shadow-2xl shadow-black/5"
          >
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-4 group-hover:scale-110 transition-transform">
              <Brain className="w-5 h-5" />
            </div>

            <h3 className="text-xl font-bold mb-2 tracking-tight text-foreground">
              {t("home.brainTitle", "Mind")}
            </h3>

            <p className="text-muted-foreground/80 mb-6 text-sm leading-relaxed">
              {t(
                "home.brainDesc",
                "Save articles, notes, and links to your personal knowledge base. Query your knowledge with RAG.",
              )}
            </p>

            <div className="text-xs font-bold tracking-wider uppercase flex items-center gap-1 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all">
              {t("home.openBrain", "Open Brain")}
              <ArrowRight className="w-3 h-3" />
            </div>
          </motion.div>

          {/* CARD 4: WEEKLY DIGEST */}
          <motion.div
            onClick={() => go("/digest")}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className="border border-border/30 rounded-2xl p-8 cursor-pointer transition bg-muted/10 backdrop-blur-md hover:bg-indigo-500/5 hover:border-indigo-500/30 group shadow-2xl shadow-black/5"
          >
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
              <Mail className="w-5 h-5" />
            </div>

            <h3 className="text-xl font-bold mb-2 tracking-tight text-foreground">
              {t("home.digestTitle", "Weekly Digest")}
            </h3>

            <p className="text-muted-foreground/80 mb-6 text-sm leading-relaxed">
              {t(
                "home.digestDesc",
                "Connect RSS feeds, select your summary style, and receive weekly email digests every Sunday.",
              )}
            </p>

            <div className="text-xs font-bold tracking-wider uppercase flex items-center gap-1 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all">
              {t("home.openDigest", "Open Digest")}
              <ArrowRight className="w-3 h-3" />
            </div>
          </motion.div>

          {/* CARD 5: BUDGET */}
          {isBudgetEnabled && (
            <motion.div
              onClick={() => go("/dashboard/budget")}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="border border-border/30 rounded-2xl p-8 cursor-pointer transition
                                  bg-muted/10 backdrop-blur-md
                                  hover:bg-emerald-500/5
                                  hover:border-emerald-500/30 group shadow-2xl shadow-black/5"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <Wallet className="w-5 h-5" />
              </div>

              <h3 className="text-xl font-bold mb-2 tracking-tight text-foreground">
                {t("home.budgetTitle", "Budget")}
              </h3>

              <p className="text-muted-foreground/80 mb-6 text-sm leading-relaxed">
                {t(
                  "home.budgetDesc",
                  "Track spending, set saving goals, import statements, and get AI financial insights.",
                )}
              </p>

              <div className="text-xs font-bold tracking-wider uppercase flex items-center gap-1 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all">
                {t("home.openBudget", "Open Dashboard")}
                <ArrowRight className="w-3 h-3" />
              </div>
            </motion.div>
          )}
        </section>

        {/* FOOTER */}
        <GlobalFooter />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden selection:bg-primary/30">
      <div className="flex-shrink-0">
        <GlobalHeader />
      </div>

      {/* CENTER CONTENT: SCROLLABLE ONLY IF NECESSARY */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col min-h-0 custom-scrollbar relative">
        <div className="max-w-5xl mx-auto w-full px-6 pt-8 pb-12 md:pt-10 md:pb-16">
          {/* HERO */}
          <section className="mb-12 md:mb-16 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Eyebrow */}
            <div className="mb-5 flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-muted-foreground/60 uppercase flex items-center select-none">
                {t("home.welcome", "Welcome")}{" "}
                <span className="mx-2 opacity-50 text-[8px]">•</span>{" "}
                {t("home.ecosystem", "The Seeker's Loop")}
              </span>
            </div>

            {/* Multi-stack Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] flex flex-col gap-1 text-left mb-6">
              <span className="text-foreground">
                {t("home.heroHeadline", "Uncover. Build.")}
              </span>
              <span className="text-muted-foreground/30">
                {t("home.heroSubHeadline", "Launch your ideas.")}
              </span>
            </h1>

            <p className="text-base sm:text-lg font-medium text-muted-foreground/70 max-w-xl tracking-tight">
              {t(
                "home.heroDesc",
                "A cohesive, high-focus sandbox designed for modern builders to seek validated problems, prototype solutions, and land high-impact opportunities.",
              )}
            </p>
          </section>

          {/* CARDS LAYOUT - SYMMETRICAL GRID */}
          <section className="grid gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 fill-mode-both grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* CARD 1: DISCOVER */}
            <motion.div
              onClick={() => go("/dashboard/problems")}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="border border-border/30 rounded-3xl p-10 cursor-pointer transition
                               bg-card/5 backdrop-blur-xl
                               hover:bg-blue-500/[0.03]
                               hover:border-blue-500/20 group shadow-2xl shadow-black/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none" />

              <div className="h-14 w-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-8 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-blue-500/5">
                <TrendingUp className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold mb-2 tracking-tight text-foreground">
                {t("home.discoverTitle", "Uncover Problems")}
              </h3>

              <p className="text-muted-foreground/80 mb-8 leading-relaxed text-sm">
                {t(
                  "home.discoverDesc",
                  "Find validated startup ideas and real user pain points so you never build in a vacuum.",
                )}
              </p>

              <div className="text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 text-blue-400 group-hover:translate-x-1 transition-all">
                {t("home.explore", "Explore Problems")}
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>

            {/* CARD 2: AI CHAT */}
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
                  "Brainstorm, prototype, and draft your systems inside a context-rich, high-focus AI workspace.",
                )}
              </p>

              <div className="text-xs font-bold tracking-widest uppercase flex items-center gap-2 text-primary group-hover:translate-x-1 transition-transform">
                {user
                  ? t("home.enterWorkspace", "Open Workspace")
                  : t("home.signInNow", "Sign In Now")}
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>

            {/* CARD 3: SECOND BRAIN */}
            <motion.div
              onClick={() => go("/brain")}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              className="border border-border/30 rounded-3xl p-10 cursor-pointer transition bg-card/5 backdrop-blur-xl hover:bg-violet-500/[0.03] hover:border-violet-500/20 group shadow-2xl shadow-black/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/5 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none" />

              <div className="h-14 w-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-8 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-violet-500/5">
                <Brain className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold mb-2 tracking-tight text-foreground">
                {t("home.brainTitle", "Mind")}
              </h3>

              <p className="text-muted-foreground/80 text-sm mb-8 leading-relaxed">
                {t(
                  "home.brainDesc",
                  "Save articles, notes, and links to your personal knowledge base. Query your knowledge with RAG.",
                )}
              </p>

              <div className="text-xs font-bold tracking-widest uppercase flex items-center gap-2 text-violet-400 group-hover:translate-x-1 transition-transform">
                {t("home.openBrain", "Open Brain")}
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>

            {/* CARD 4: WEEKLY DIGEST */}
            <motion.div
              onClick={() => go("/digest")}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              className="border border-border/30 rounded-3xl p-10 cursor-pointer transition bg-card/5 backdrop-blur-xl hover:bg-indigo-500/[0.03] hover:border-indigo-500/20 group shadow-2xl shadow-black/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none" />

              <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-8 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-indigo-500/5">
                <Mail className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold mb-2 tracking-tight text-foreground">
                {t("home.digestTitle", "Weekly Digest")}
              </h3>

              <p className="text-muted-foreground/80 text-sm mb-8 leading-relaxed">
                {t(
                  "home.digestDesc",
                  "Connect RSS feeds, select your summary style, and receive weekly email digests every Sunday.",
                )}
              </p>

              <div className="text-xs font-bold tracking-widest uppercase flex items-center gap-2 text-indigo-400 group-hover:translate-x-1 transition-transform">
                {t("home.openDigest", "Open Digest")}
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>

            {/* CARD 5: BUDGET */}
            {isBudgetEnabled && (
              <motion.div
                onClick={() => go("/dashboard/budget")}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 200, damping: 22 }}
                className="border border-border/30 rounded-3xl p-10 cursor-pointer transition bg-card/5 backdrop-blur-xl hover:bg-emerald-500/[0.03] hover:border-emerald-500/20 group shadow-2xl shadow-black/20 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none" />

                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-8 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-emerald-500/5">
                  <Wallet className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold mb-2 tracking-tight text-foreground">
                  {t("home.budgetTitle", "Manage Budget")}
                </h3>

                <p className="text-muted-foreground/80 text-sm mb-8 leading-relaxed">
                  {t(
                    "home.budgetDesc",
                    "Track spending, set saving goals, import statements, and get AI financial insights.",
                  )}
                </p>

                <div className="text-xs font-bold tracking-widest uppercase flex items-center gap-2 text-emerald-400 group-hover:translate-x-1 transition-transform">
                  {t("home.openBudget", "Open Dashboard")}
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            )}
          </section>
        </div>
      </main>

      <div className="flex-shrink-0">
        <GlobalFooter />
      </div>
    </div>
  );
}
