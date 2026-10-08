// src/pages/healing/QuickCalm.tsx
// Premium Calm Studio — Breathing protocols + 5-4-3-2-1 sensory grounding

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle, Wind, Leaf } from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { Button } from "@/components/ui/button";
import { BreathingCircle } from "./components/BreathingCircle";
import { cn } from "@/lib/utils";

type Tool = "breathing" | "54321";

const SENSES_54321 = [
  { count: 5, sense: "see",   icon: "👀", prompt: "Name 5 things you can see",   placeholder: "The lamp, a blue mug, my hands…", key: "healing.quick_calm.see" },
  { count: 4, sense: "touch", icon: "🤲", prompt: "Name 4 textures you can feel", placeholder: "Smooth keyboard, warm tea cup…",   key: "healing.quick_calm.touch" },
  { count: 3, sense: "hear",  icon: "👂", prompt: "Name 3 sounds you can hear",   placeholder: "AC hum, distant traffic, my breath…", key: "healing.quick_calm.hear" },
  { count: 2, sense: "smell", icon: "👃", prompt: "Name 2 smells in the air",     placeholder: "Coffee, fresh air through the window…", key: "healing.quick_calm.smell" },
  { count: 1, sense: "taste", icon: "👅", prompt: "Name 1 taste you notice",      placeholder: "Lingering coffee, mint, neutral…",     key: "healing.quick_calm.taste" },
];

function Grounding54321() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [inputs, setInputs] = useState<string[]>(Array(5).fill(""));

  const current = SENSES_54321[step];
  const done = step >= SENSES_54321.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-foreground">
          {t("healing.quick_calm.54321_title", "5-4-3-2-1 Sensory Grounding")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Panic and anxiety live in the future or past. This practice anchors you firmly in the present by engaging your five senses one at a time.
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2">
        {SENSES_54321.map((s, i) => (
          <div
            key={s.sense}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              i < step ? "bg-emerald-500" : i === step && !done ? "bg-emerald-400/60" : "bg-muted/50",
            )}
          />
        ))}
      </div>

      {/* Completed entries */}
      {inputs.filter(Boolean).length > 0 && (
        <div className="space-y-1.5">
          {SENSES_54321.slice(0, step).map((s, i) =>
            inputs[i] ? (
              <div key={s.sense} className="flex items-start gap-2.5 text-sm p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <span className="text-base shrink-0">{s.icon}</span>
                <span className="text-muted-foreground line-through flex-1">{inputs[i]}</span>
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Active step */}
      {!done && (
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="rounded-2xl border border-border/60 bg-card/80 p-5 space-y-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-4xl">{current.icon}</span>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                  Step {step + 1} of {SENSES_54321.length}
                </p>
                <p className="text-base font-bold text-foreground">{current.prompt}</p>
              </div>
            </div>

            <textarea
              className="w-full resize-none rounded-xl border border-border/60 bg-background/60 p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
              rows={3}
              placeholder={current.placeholder}
              value={inputs[step]}
              onChange={(e) => {
                const next = [...inputs];
                next[step] = e.target.value;
                setInputs(next);
              }}
              aria-label={current.prompt}
              autoFocus
            />

            <Button
              onClick={() => setStep((s) => Math.min(s + 1, SENSES_54321.length))}
              className="w-full h-11 rounded-xl font-semibold"
              disabled={!inputs[step]?.trim()}
              id={`54321-next-${step}`}
            >
              {step < SENSES_54321.length - 1 ? "Next Sense →" : "I'm Grounded ✓"}
            </Button>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Completion */}
      {done && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card p-6 text-center space-y-3"
        >
          <CheckCircle className="mx-auto h-10 w-10 text-emerald-500" />
          <div>
            <p className="text-base font-bold text-foreground">You're grounded in the present.</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Notice how your breath has slowed. The present moment is always safe.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => { setStep(0); setInputs(Array(5).fill("")); }}
            className="rounded-xl"
          >
            Do it again
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

      <main className="relative z-10 flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Nav bar */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (tool ? setTool(null) : navigate("/healing"))}
              className="gap-2 text-muted-foreground hover:text-foreground -ml-2 h-9 px-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{tool ? "All tools" : "Healing Hub"}</span>
            </Button>
            <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Healing /{" "}
              <strong className="text-foreground">
                {tool === "breathing" ? "Breathing Studio" : tool === "54321" ? "Grounding" : "Quick Calm"}
              </strong>
            </span>
          </div>
        </div>

        {/* Title when on landing */}
        {!tool && (
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("healing.quick_calm.title", "Quick Calm Studio")}
            </h1>
            <p className="text-sm text-muted-foreground">
              Immediate physiological downregulation — choose your protocol below.
            </p>
          </div>
        )}

        {/* ─── Tool Selector ──────────────────────────────────────────────── */}
        {!tool && (
          <div className="space-y-3 pt-1">
            {/* Breathing Studio Card */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => { setInitialMode("sigh"); setTool("breathing"); }}
              className="w-full text-left rounded-3xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-card to-card p-6 shadow-sm hover:border-sky-500/50 hover:shadow-md transition-all group"
              id="quick-calm-breathing-btn"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl p-3 rounded-2xl bg-sky-500/15 border border-sky-500/20 group-hover:scale-105 transition-transform shrink-0">
                  🌬️
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="font-bold text-foreground text-lg">Breathing Studio</h2>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                      6 Protocols
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Evidence-based breathing exercises with guided animations, body-cue instructions, situation cards, and harmonic audio chimes.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {["Stress Reset", "Sleep", "Focus", "Anxiety", "HRV Balance", "Energy"].map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <Wind className="w-5 h-5 text-sky-500/60 shrink-0 mt-1 group-hover:text-sky-500 transition-colors" />
              </div>
            </motion.button>

            {/* Grounding Card */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setTool("54321")}
              className="w-full text-left rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card p-6 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all group"
              id="quick-calm-54321-btn"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
                  🌿
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-bold text-foreground text-lg">
                      {t("healing.quick_calm.54321_short", "5-4-3-2-1 Sensory Grounding")}
                    </h2>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      Mindfulness
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Anchor yourself to the present moment using all five senses. Cuts through panic, dissociation, and anxious spirals fast.
                  </p>
                </div>
                <Leaf className="w-5 h-5 text-emerald-500/60 shrink-0 mt-1 group-hover:text-emerald-500 transition-colors" />
              </div>
            </motion.button>
          </div>
        )}

        {/* ─── Breathing Studio ──────────────────────────────────────────── */}
        {tool === "breathing" && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-border/50 bg-card/70 backdrop-blur-sm p-6 sm:p-8 shadow-md"
            >
              <BreathingCircle
                initialModeId={initialMode}
                onComplete={() => {/* session complete */}}
              />
            </motion.div>
          </AnimatePresence>
        )}

        {/* ─── Grounding ─────────────────────────────────────────────────── */}
        {tool === "54321" && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-border/50 bg-card/70 backdrop-blur-sm p-6 sm:p-8 shadow-md"
            >
              <Grounding54321 />
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <GlobalFooter />
    </div>
  );
}
