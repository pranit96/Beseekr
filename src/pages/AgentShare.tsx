import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { Agent } from "@/types/agent";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { GlobalHeader } from "@/components/GlobalHeader";
import {
  Sparkles,
  Download,
  LogIn,
  ArrowLeft,
  Loader2,
  Lock,
  Globe,
  AlertCircle,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function AgentShare() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [agent, setAgent] = useState<Partial<Agent> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    // Set page title for SEO best practices
    document.title = "View Shared Agent | Prompt Weaver Desk";
  }, []);

  useEffect(() => {
    const fetchAgentDetails = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await apiClient.getSharedAgentPublicDetails(id);
        if (res.success && res.data) {
          setAgent(res.data);
        } else {
          throw new Error(res.error || "Agent not found or unavailable.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load shared agent.");
      } finally {
        setLoading(false);
      }
    };

    fetchAgentDetails();
  }, [id]);

  const handleImport = async () => {
    if (!id || importing) return;

    setImporting(true);
    try {
      const res = await apiClient.importSharedAgent(id);
      if (res.success) {
        // Trigger celebratory confetti explosion
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: agent?.color
            ? [agent.color, "#ffffff", "hsl(var(--primary))"]
            : undefined,
        });

        toast({
          title: "Agent Added Successfully!",
          description: `"${agent?.name}" has been added to your custom agents list.`,
        });

        // Redirect to agents workspace after short delay to let confetti complete
        setTimeout(() => {
          navigate("/agents");
        }, 1500);
      } else {
        throw new Error(res.error || "Failed to import agent.");
      }
    } catch (err: any) {
      toast({
        title: "Import failed",
        description: err.message,
        variant: "destructive",
      });
      setImporting(false);
    }
  };

  const handleLoginRedirect = () => {
    // Save current path to auth-redirect so login flows back correctly
    sessionStorage.setItem("auth-redirect", window.location.pathname);
    navigate("/auth");
  };

  const initial = agent?.name?.charAt(0)?.toUpperCase() || "A";

  // Security & injection mitigation: strictly validate CSS color format before injection
  const domainColor = (() => {
    const raw = agent?.color || "";
    const isValidHex =
      /^#([a-fA-F0-9]{3,4}|[a-fA-F0-9]{6}|[a-fA-F0-9]{8})$/.test(raw);
    const isValidHsl =
      /^hsl\(\s*\d+(\.\d+)?\s*(deg|rad|grad|turn)?\s*,\s*\d+(\.\d+)?%\s*,\s*\d+(\.\d+)?%\s*(,\s*\d+(\.\d+)?%?)?\s*\)$/i.test(
        raw,
      );
    const isValidRgb =
      /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*\d+(\.\d+)?)?\s*\)$/i.test(raw);
    const isPrimaryTheme = raw === "hsl(var(--primary))";

    return isValidHex || isValidHsl || isValidRgb || isPrimaryTheme
      ? raw
      : "hsl(var(--primary))";
  })();

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <GlobalHeader />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground/60 select-none animate-pulse">
            Loading shared agent...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden select-none">
      <GlobalHeader />

      {/* Aesthetic ambient glows */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden -z-10"
        aria-hidden="true"
      >
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.06] dark:opacity-[0.04] transition-all"
          style={{ backgroundColor: domainColor }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative z-10">
        {error || !agent ? (
          /* Error State Card */
          <div className="max-w-md w-full bg-background/60 backdrop-blur-xl border border-border/40 p-8 rounded-2xl shadow-xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <h2 className="text-base font-semibold mb-2">
              Failed to View Agent
            </h2>
            <p className="text-xs text-muted-foreground/60 leading-relaxed mb-6">
              {error ||
                "The share link is invalid, expired, or the agent has been deleted by its creator."}
            </p>
            <Button asChild variant="outline" className="text-xs">
              <Link to={user ? "/agents" : "/"}>Go Home</Link>
            </Button>
          </div>
        ) : (
          /* Main Agent Share Card */
          <div className="max-w-lg w-full bg-card/75 dark:bg-zinc-950/30 backdrop-blur-2xl border border-border/40 rounded-2xl shadow-2xl relative overflow-hidden transition-all hover:shadow-primary/5 hover:border-border/50">
            {/* Top color bar */}
            <div
              className="h-1.5 w-full opacity-70"
              style={{
                background: `linear-gradient(90deg, ${domainColor}, transparent, ${domainColor})`,
              }}
            />

            <div className="p-8 sm:p-10 flex flex-col items-center text-center">
              {/* Creator Tag */}
              <div className="bg-muted/40 border border-border/30 rounded-full px-3 py-1 text-[10px] font-semibold text-muted-foreground/80 mb-6 flex items-center gap-1">
                <Sparkles className="w-3 h-3" style={{ color: domainColor }} />
                AI Agent Invitation
              </div>

              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-3xl border shadow-md transition-all mb-4 select-none"
                style={{
                  background: `${domainColor}15`,
                  borderColor: `${domainColor}25`,
                  color: domainColor,
                }}
              >
                {initial}
              </div>

              {/* Name */}
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground/95 mb-1.5 max-w-sm truncate">
                {agent.name}
              </h1>

              {/* Domain */}
              <div className="flex items-center gap-1.5 mb-4">
                <span className="text-[10px] font-semibold text-muted-foreground/60 bg-muted/45 px-2.5 py-0.5 rounded-full border border-border/20">
                  {agent.domain || "General Workspace"}
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-medium text-emerald-500 select-none">
                  Active
                </span>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-muted-foreground/60 leading-relaxed max-w-md mb-8">
                {agent.description ||
                  "No description provided. This is a custom AI agent designed for specialized operations."}
              </p>

              {/* Security Boundary Indicator */}
              <div className="w-full flex items-center justify-center gap-2 bg-muted/10 border border-border/10 py-3 px-4 rounded-xl text-[11px] text-muted-foreground/50 mb-8">
                <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  System prompt logic is safely protected until imported
                </span>
              </div>

              {/* Action Trigger */}
              {user ? (
                user.id === agent.user_id ? (
                  <Button
                    disabled
                    size="lg"
                    className="w-full bg-muted text-muted-foreground border border-border/40 flex items-center justify-center gap-2 py-6 rounded-xl text-sm font-semibold cursor-not-allowed"
                  >
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Agent already exists in your collection</span>
                  </Button>
                ) : (
                  <Button
                    onClick={handleImport}
                    disabled={importing}
                    size="lg"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/95 shadow-md flex items-center justify-center gap-2 py-6 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Adding to collection...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Add to Collection</span>
                      </>
                    )}
                  </Button>
                )
              ) : (
                <Button
                  onClick={handleLoginRedirect}
                  size="lg"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/95 shadow-md flex items-center justify-center gap-2 py-6 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In to Import Agent</span>
                </Button>
              )}
            </div>

            {/* Back to Workspace footer */}
            <div className="border-t border-border/20 px-8 sm:px-10 py-4 flex items-center justify-center">
              <Link
                to={user ? "/agents" : "/"}
                className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-foreground transition-colors group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Back to Workspace
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
