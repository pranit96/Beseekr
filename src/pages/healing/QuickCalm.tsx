// src/pages/healing/QuickCalm.tsx
// Physiological Sigh + 5-4-3-2-1 Grounding exercise

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { Button } from "@/components/ui/button";
import { BreathingCircle } from "./components/BreathingCircle";

type Tool = "breathing" | "54321";

const SENSES_54321 = [
  { count: 5, sense: "see",   icon: "👀", key: "healing.quick_calm.see" },
  { count: 4, sense: "touch", icon: "🤲", key: "healing.quick_calm.touch" },
  { count: 3, sense: "hear",  icon: "👂", key: "healing.quick_calm.hear" },
  { count: 2, sense: "smell", icon: "👃", key: "healing.quick_calm.smell" },
  { count: 1, sense: "taste", icon: "👅", key: "healing.quick_calm.taste" },
];

function Grounding54321() {
  const { t } = useTranslation();
  const [step54, setStep54] = useState(0);
  const [inputs, setInputs] = useState<string[]>(Array(5).fill(""));

  const current = SENSES_54321[step54];
  const done = step54 >= SENSES_54321.length;

  const handleNext = () => setStep54((s) => Math.min(s + 1, SENSES_54321.length));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {t("healing.quick_calm.54321_title", "5-4-3-2-1 Grounding")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("healing.quick_calm.54321_hint", "Bring yourself back to the present moment by engaging your senses.")}
        </p>
      </div>

      {/* Completed items */}
      {inputs.filter(Boolean).length > 0 && (
        <div className="space-y-1">
          {SENSES_54321.slice(0, step54).map((s, i) => inputs[i] && (
            <div key={s.sense} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span>{s.icon}</span>
              <span className="line-through opacity-60">{inputs[i]}</span>
              <CheckCircle className="ml-auto h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            </div>
          ))}
        </div>
      )}

      {!done && (
        <AnimatePresence mode="wait">
          <motion.div
            key={step54}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-border bg-card p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{current.icon}</span>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("healing.quick_calm.name", `Name ${current.count} things you can`, { count: current.count })}
                </p>
                <p className="text-base font-semibold text-foreground">
                  {t(current.key, current.sense)}
                </p>
              </div>
            </div>
            <textarea
              className="w-full resize-none rounded-xl border border-border bg-muted/20 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              placeholder={t("healing.quick_calm.sense_placeholder", `List ${current.count} things…`)}
              value={inputs[step54]}
              onChange={(e) => {
                const next = [...inputs];
                next[step54] = e.target.value;
                setInputs(next);
              }}
              aria-label={t(current.key, current.sense)}
            />
            <Button onClick={handleNext} className="w-full" disabled={!inputs[step54]?.trim()} id={`54321-next-${step54}`}>
              {step54 < SENSES_54321.length - 1
                ? t("common.next", "Next")
                : t("healing.quick_calm.finish", "Finish")}
            </Button>
          </motion.div>
        </AnimatePresence>
      )}

      {done && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-2xl border border-green-300/40 bg-green-50 dark:bg-green-950/20 p-5 text-center"
        >
          <CheckCircle className="mx-auto h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
          <p className="font-semibold text-green-700 dark:text-green-300">
            {t("healing.quick_calm.grounded", "You're grounded. Take a breath.")}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => { setStep54(0); setInputs(Array(5).fill("")); }}>
            {t("healing.quick_calm.try_again", "Try again")}
          </Button>
        </motion.div>
      )}
    </div>
  );
}

export default function QuickCalm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tool, setTool] = useState<Tool | null>(null);
  const [initialMode, setInitialMode] = useState<string>("sigh");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-cyan-500/20">
      <GlobalHeader />

      <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Breadcrumb & Sub Navigation Bar */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (tool ? setTool(null) : navigate("/healing"))}
              className="gap-2 text-muted-foreground hover:text-foreground -ml-2 h-9 px-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{tool ? "Back to All Modes" : "Back to Healing"}</span>
            </Button>
            <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Healing / <strong className="text-foreground">Quick Calm</strong>
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("healing.quick_calm.title", "Quick Calm Studio")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t(
              "healing.disclaimer_short",
              "Immediate somatic downregulation & sensory grounding protocols",
            )}
          </p>
        </div>

        {/* Tool selector */}
        {!tool && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              {t(
                "healing.quick_calm.choose",
                "Choose a calming protocol to lower physiological arousal right now:",
              )}
            </p>

            {/* Breathing Studio */}
            <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-card to-card p-6 shadow-sm space-y-4">
              <div className="flex items-start gap-4">
                <span className="text-3xl p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/20">
                  🫁
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-foreground text-lg">
                      Breathing Studio
                    </h2>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                      5 Protocols
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Guided rhythm pacing with zero-flicker animations, phase timers, and optional harmonic chimes.
                  </p>
                </div>
              </div>

              {/* Protocol Quick-Start Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {[
                  { id: "sigh", name: "Physiological Sigh", desc: "Instant stress reset" },
                  { id: "478", name: "4-7-8 Relax & Sleep", desc: "Deep rest & bedtime" },
                  { id: "box", name: "Box Breathing", desc: "Focus & concentration" },
                  { id: "coherent", name: "Resonant Coherence", desc: "Cleanse & balance HRV" },
                  { id: "energize", name: "Awaken & Energize", desc: "Morning oxygen boost" },
                ].map((proto) => (
                  <button
                    key={proto.id}
                    type="button"
                    onClick={() => {
                      setInitialMode(proto.id);
                      setTool("breathing");
                    }}
                    className="p-3 text-left rounded-2xl border border-border/60 bg-background/60 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-xs group"
                  >
                    <p className="font-semibold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {proto.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {proto.desc}
                    </p>
                  </button>
                ))}
              </div>

              <Button
                onClick={() => {
                  setInitialMode("sigh");
                  setTool("breathing");
                }}
                className="w-full h-11 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-medium"
                id="quick-calm-sigh-btn"
              >
                Open Breathing Studio
              </Button>
            </div>

            {/* 5-4-3-2-1 Grounding */}
            <button
              type="button"
              onClick={() => setTool("54321")}
              className="w-full text-left rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card p-6 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all shadow-sm group"
              id="quick-calm-54321-btn"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                  🌿
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground text-lg">
                      {t("healing.quick_calm.54321_short", "5-4-3-2-1 Sensory Grounding")}
                    </p>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      Mindfulness
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                    Anchor yourself in the tangible present moment by actively observing 5 sights, 4 touches, 3 sounds, 2 smells, and 1 taste.
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Breathing Studio */}
        {tool === "breathing" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm p-6 sm:p-8 shadow-md"
          >
            <BreathingCircle
              initialModeId={initialMode}
              onComplete={() => {
                // Completed session
              }}
            />
          </motion.div>
        )}

        {/* 5-4-3-2-1 Grounding */}
        {tool === "54321" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm p-6 sm:p-8 shadow-md"
          >
            <Grounding54321 />
          </motion.div>
        )}
      </main>

      <GlobalFooter />
    </div>
  );
}
