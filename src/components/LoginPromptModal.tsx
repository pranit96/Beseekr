// src/components/LoginPromptModal.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Lock,
  MessageSquare,
  Bot,
  Zap,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: "message_limit" | "agent_limit" | "feature_locked";
  customMessage?: string;
}

export const LoginPromptModal: React.FC<LoginPromptModalProps> = ({
  isOpen,
  onClose,
  reason = "message_limit",
  customMessage,
}) => {
  const navigate = useNavigate();

  const handleNavigateToAuth = (tab: "login" | "signup" = "login") => {
    // Save the current location so the user returns right back after login
    sessionStorage.setItem(
      "auth-redirect",
      window.location.pathname + window.location.search,
    );
    onClose();
    navigate(`/auth?tab=${tab}`);
  };

  const isMessageLimit = reason === "message_limit";
  const isAgentLimit = reason === "agent_limit";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden border border-primary/20 bg-background/95 backdrop-blur-2xl shadow-2xl shadow-primary/10 sm:rounded-2xl">
        {/* Glow Header Banner */}
        <div className="relative h-28 bg-gradient-to-br from-primary/30 via-violet-600/20 to-cyan-500/10 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/40 via-transparent to-transparent" />
          
          <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-2xl bg-background/80 border border-white/10 shadow-xl backdrop-blur-md">
            {isMessageLimit ? (
              <MessageSquare className="w-8 h-8 text-primary animate-pulse" />
            ) : isAgentLimit ? (
              <Bot className="w-8 h-8 text-cyan-400 animate-pulse" />
            ) : (
              <Lock className="w-8 h-8 text-primary" />
            )}
          </div>
        </div>

        <div className="p-6 pt-4 space-y-5">
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
              {isMessageLimit
                ? "Daily Message Limit Reached"
                : isAgentLimit
                  ? "Guest Agent Limit Reached"
                  : "Sign In to Continue"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              {customMessage ||
                (isMessageLimit
                  ? "You've used all 5 free messages for today. Sign in or create a free account to unlock unlimited AI chats and keep your conversation going without interruption."
                  : isAgentLimit
                    ? "You've created 3 custom agents in guest mode. Sign in to save them permanently across all your devices and build unlimited custom AI agents."
                    : "Please sign in to unlock this feature and sync your data.")}
            </DialogDescription>
          </DialogHeader>

          {/* Benefits Feature List */}
          <div className="rounded-xl border border-white/[0.06] bg-muted/30 p-4 space-y-2.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2.5 text-foreground font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Unlimited AI chats & multi-agent orchestration</span>
            </div>
            <div className="flex items-center gap-2.5 text-foreground font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Automatic sync — zero loss of your current chat & agents</span>
            </div>
            <div className="flex items-center gap-2.5 text-foreground font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Full access to document analysis, reasoning & tools</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col gap-2.5 pt-1">
            <Button
              onClick={() => handleNavigateToAuth("signup")}
              className="w-full h-11 text-sm font-semibold rounded-xl bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-700 shadow-lg shadow-primary/25 group"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              onClick={() => handleNavigateToAuth("login")}
              variant="outline"
              className="w-full h-10 text-sm font-medium rounded-xl border-border/60 hover:bg-muted/50"
            >
              Log In to Existing Account
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="text-xs text-muted-foreground/70 hover:text-muted-foreground py-1 text-center transition-colors"
            >
              Continue browsing in read-only mode
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginPromptModal;
