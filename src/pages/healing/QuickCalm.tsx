// src/pages/healing/QuickCalm.tsx
// Physiological Sigh + 5-4-3-2-1 Grounding exercise

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BreathingCircle } from "./components/BreathingCircle";

type Tool = "sigh" | "54321";

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
                  {t("healing.quick_calm.name", { count: current.count }, `Name ${current.count} things you can`)}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      <div className="mx-auto max-w-md px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => tool ? setTool(null) : navigate("/healing")} aria-label={t("common.back", "Back")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-base font-semibold text-foreground">
              {t("healing.quick_calm.title", "Quick Calm")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("healing.disclaimer_short", "Self-help tool — not medical advice")}
            </p>
          </div>
        </div>

        {/* Tool selector */}
        {!tool && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              {t("healing.quick_calm.choose", "Choose an exercise to help you feel calmer right now:")}
            </p>

            {/* Physiological Sigh */}
            <button
              type="button"
              onClick={() => setTool("sigh")}
              className="w-full text-left rounded-2xl border border-border bg-card p-5 hover:border-primary/50 hover:bg-primary/5 transition-all"
              id="quick-calm-sigh-btn"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🫁</span>
                <div>
                  <p className="font-semibold text-foreground">
                    {t("healing.quick_calm.sigh_title", "Physiological Sigh")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("healing.quick_calm.sigh_desc", "2 quick inhales + long exhale — activates your calm response in under 2 min.")}
                  </p>
                </div>
              </div>
            </button>

            {/* 5-4-3-2-1 */}
            <button
              type="button"
              onClick={() => setTool("54321")}
              className="w-full text-left rounded-2xl border border-border bg-card p-5 hover:border-primary/50 hover:bg-primary/5 transition-all"
              id="quick-calm-54321-btn"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌿</span>
                <div>
                  <p className="font-semibold text-foreground">
                    {t("healing.quick_calm.54321_short", "5-4-3-2-1 Grounding")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("healing.quick_calm.54321_short_desc", "Anchor yourself in the present moment using all 5 senses.")}
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Physiological Sigh */}
        {tool === "sigh" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold">
              {t("healing.quick_calm.sigh_title", "Physiological Sigh")}
            </h2>
            <BreathingCircle
              totalCycles={3}
              onComplete={() => {
                setTimeout(() => setTool(null), 3000);
              }}
            />
          </motion.div>
        )}

        {/* 5-4-3-2-1 */}
        {tool === "54321" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Grounding54321 />
          </motion.div>
        )}
      </div>
    </div>
  );
}
