// src/pages/healing/components/CrisisScreen.tsx
// Full-screen crisis safety card — shown when safety detection triggers.
// Calm, non-alarming. No "I can't help" cold rejection.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Phone, Globe, ChevronRight, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Helpline } from "@/api/healing";

interface CrisisScreenProps {
  helplines: Helpline[];
  onContinue: () => void;
}

export function CrisisScreen({ helplines, onContinue }: CrisisScreenProps) {
  const { t } = useTranslation();
  const [confirmed, setConfirmed] = useState(false);

  const handleContinue = () => {
    setConfirmed(true);
    setTimeout(onContinue, 300);
  };

  return (
    <AnimatePresence>
      {!confirmed && (
        <motion.div
          key="crisis"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="crisis-title"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="max-w-md w-full rounded-3xl border border-border bg-card shadow-2xl p-8 text-center"
          >
            {/* Icon */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-8 w-8 text-primary" />
            </div>

            {/* Heading */}
            <h1
              id="crisis-title"
              className="text-2xl font-semibold tracking-tight text-foreground mb-3"
            >
              {t("healing.crisis.title", "We're here with you")}
            </h1>

            {/* Supportive copy — no cold rejection, no lecturing */}
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              {t(
                "healing.crisis.body",
                "What you're feeling sounds really heavy right now. You don't have to carry it alone. Reaching out to someone can make a real difference.",
              )}
            </p>

            {/* Helplines */}
            {helplines && helplines.length > 0 && (
              <div className="mb-6 space-y-2 text-left">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  {t("healing.crisis.helplines", "Support resources")}
                </p>
                {helplines.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3"
                  >
                    {h.url ? (
                      <Globe className="h-5 w-5 shrink-0 text-primary" />
                    ) : (
                      <Phone className="h-5 w-5 shrink-0 text-primary" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{h.name}</p>
                      {h.note && (
                        <p className="text-xs text-muted-foreground">{h.note}</p>
                      )}
                    </div>
                    {h.number && (
                      <a
                        href={`tel:${h.number}`}
                        className="text-sm font-semibold text-primary hover:underline shrink-0"
                        aria-label={`Call ${h.name}`}
                      >
                        {h.number}
                      </a>
                    )}
                    {h.url && (
                      <a
                        href={h.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline shrink-0"
                      >
                        {t("healing.crisis.visit", "Visit")}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Emergency fallback */}
            <p className="text-xs text-muted-foreground mb-6">
              {t("healing.crisis.emergency", "For immediate danger, call your local emergency number (e.g. 112).")}
            </p>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={handleContinue}
                aria-label={t("healing.crisis.safe_continue", "I'm safe, continue exercise")}
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                {t("healing.crisis.safe_continue", "I'm safe, continue exercise")}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground">
                {t(
                  "healing.crisis.disclaimer",
                  "This self-help tool is not a substitute for professional care.",
                )}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
