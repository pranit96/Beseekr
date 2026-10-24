import React from "react";
import { motion } from "framer-motion";
import { Mic, Volume2, Sparkles, Loader2, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export type InterviewerState =
  | "idle"
  | "listening"
  | "transcribing"
  | "thinking"
  | "speaking";

interface InterviewerAvatarProps {
  state: InterviewerState;
  interviewerName?: string;
  role?: string;
  company?: string;
  className?: string;
  isAudioPlaying?: boolean;
}

export const InterviewerAvatar: React.FC<InterviewerAvatarProps> = ({
  state,
  interviewerName = "AI Interviewer",
  role,
  company,
  className,
  isAudioPlaying,
}) => {
  const getStatusBadge = () => {
    switch (state) {
      case "listening":
        return {
          label: "Listening to you...",
          color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
          icon: <Mic className="w-3.5 h-3.5 animate-pulse text-emerald-600 dark:text-emerald-400" />,
        };
      case "transcribing":
        return {
          label: "Transcribing (Whisper STT)...",
          color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
          icon: <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />,
        };
      case "thinking":
        return {
          label: "Claude is analyzing...",
          color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30",
          icon: <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-600 dark:text-purple-400" />,
        };
      case "speaking":
        return {
          label: isAudioPlaying ? "Speaking (Voice AI)..." : "Replying...",
          color: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30",
          icon: <Volume2 className="w-3.5 h-3.5 animate-bounce text-violet-600 dark:text-violet-400" />,
        };
      default:
        return {
          label: "Ready for your answer",
          color: "bg-muted/50 text-muted-foreground border-border/50",
          icon: <Bot className="w-3.5 h-3.5" />,
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className={cn("flex flex-col items-center justify-center select-none", className)}>
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing aura */}
        <motion.div
          animate={{
            scale: state === "speaking" ? [1, 1.25, 1.1, 1.3, 1] : state === "thinking" ? [1, 1.15, 1] : 1,
            opacity: state === "speaking" ? [0.4, 0.8, 0.5, 0.9, 0.4] : state === "listening" ? 0.6 : 0.2,
          }}
          transition={{
            repeat: Infinity,
            duration: state === "speaking" ? 1.8 : 2.5,
            ease: "easeInOut",
          }}
          className={cn(
            "absolute -inset-4 rounded-full blur-xl pointer-events-none transition-colors duration-500",
            state === "speaking" && "bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600",
            state === "listening" && "bg-emerald-500/50",
            state === "thinking" && "bg-purple-500/50",
            state === "transcribing" && "bg-amber-500/50",
            state === "idle" && "bg-primary/20",
          )}
        />

        {/* Orbit ring when thinking */}
        {state === "thinking" && (
          <div className="absolute -inset-3 rounded-full border border-purple-400/40 border-t-purple-400 animate-spin pointer-events-none" />
        )}

        {/* Sound waves when speaking */}
        {state === "speaking" && (
          <>
            <motion.div
              animate={{ scale: [1, 1.45], opacity: [0.7, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut" }}
              className="absolute -inset-2 rounded-full border-2 border-violet-400/50 pointer-events-none"
            />
            <motion.div
              animate={{ scale: [1, 1.65], opacity: [0.5, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, delay: 0.4, ease: "easeOut" }}
              className="absolute -inset-2 rounded-full border-2 border-fuchsia-400/40 pointer-events-none"
            />
          </>
        )}

        {/* Core Avatar Sphere */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={cn(
            "relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-background via-card to-background border-2 shadow-xl backdrop-blur-2xl",
            state === "speaking" && "border-violet-500/60 shadow-violet-500/25",
            state === "listening" && "border-emerald-500/60 shadow-emerald-500/20",
            state === "thinking" && "border-purple-500/60 shadow-purple-500/20",
            state === "transcribing" && "border-amber-500/60 shadow-amber-500/20",
            state === "idle" && "border-border/60 shadow-black/10",
          )}
        >
          {/* Inner core animation */}
          <div className="flex items-center justify-center w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-gradient-to-tr from-violet-600/30 to-fuchsia-600/30 border border-violet-400/20 backdrop-blur-md">
            {state === "speaking" ? (
              <div className="flex items-center gap-1">
                {[55, 95, 70, 100, 60].map((h, i) => (
                  <motion.span
                    key={i}
                    animate={{ height: [`${h * 0.3}%`, `${h}%`, `${h * 0.4}%`] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.6 + i * 0.1,
                      ease: "easeInOut",
                    }}
                    className="w-1 bg-gradient-to-t from-violet-400 to-fuchsia-300 rounded-full"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            ) : state === "listening" ? (
              <Mic className="w-8 h-8 text-emerald-400 animate-pulse" />
            ) : state === "thinking" ? (
              <Sparkles className="w-8 h-8 text-purple-400 animate-spin" />
            ) : state === "transcribing" ? (
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            ) : (
              <Bot className="w-8 h-8 text-foreground/80" />
            )}
          </div>
        </motion.div>
      </div>

      {/* Information Header */}
      <div className="mt-4 text-center">
        <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
          {interviewerName}
        </h3>
        {(role || company) && (
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            {role} {company ? `• ${company}` : ""}
          </p>
        )}

        {/* Live Status Badge */}
        <div className="mt-2.5 flex justify-center">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors duration-300",
              badge.color,
            )}
          >
            {badge.icon}
            {badge.label}
          </span>
        </div>
      </div>
    </div>
  );
};
