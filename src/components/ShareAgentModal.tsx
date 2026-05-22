import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { Agent } from "@/types/agent";
import {
  Copy,
  Check,
  Mail,
  Link2,
  QrCode,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";

interface ShareAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent | null;
}

export const ShareAgentModal = ({
  open,
  onOpenChange,
  agent,
}: ShareAgentModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [sharing, setSharing] = useState(false);
  const [currentTab, setCurrentTab] = useState("link");
  const [emailSent, setEmailSent] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset states when the dialog is closed or when switching tabs
  useEffect(() => {
    setEmailSent(false);
    setEmail("");
    setSentTo("");
    setError(null);
    setCopied(false);
  }, [currentTab, open]);

  if (!agent) return null;

  const initial = agent.name?.charAt(0)?.toUpperCase() || "A";
  const domainColor = agent.color || "hsl(var(--primary))";

  // Security & parameters sanitization: ensure hex contains only valid alphanumeric characters
  const safeColorHex = (() => {
    if (!domainColor) return "000000";
    if (domainColor.startsWith("#")) {
      const clean = domainColor.replace(/[^a-fA-F0-9]/g, "");
      return clean.length === 3 || clean.length === 6 ? clean : "000000";
    }
    return "000000"; // fallback for hsl/rgb to avoid query parameters exploits
  })();

  const shareUrl = `${window.location.origin}/agents/share/${agent.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    shareUrl,
  )}&color=${safeColorHex}`;

  const handleCopyLink = async () => {
    setError(null);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Invite link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to copy link");
    }
  };

  const handleShareEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSharing(true);
    setError(null);
    try {
      const res = await apiClient.shareAgentByEmail(agent.id, email);
      if (res.success) {
        setSentTo(email);
        setEmailSent(true);
        toast({
          title: "Invite Sent!",
          description: `An email has been sent to ${email} with instructions.`,
        });
        setEmail("");
        setTimeout(() => {
          setEmailSent(false);
          setSentTo("");
        }, 3000);
      } else {
        throw new Error(res.error || "Failed to share agent");
      }
    } catch (err: any) {
      setError(err.message || "Failed to share agent");
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background/80 backdrop-blur-xl border border-border/40 overflow-hidden rounded-2xl shadow-2xl p-0">
        {/* Neon accent glow matching agent color */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5 opacity-60"
          style={{
            background: `linear-gradient(90deg, ${domainColor}, transparent, ${domainColor})`,
          }}
        />

        <div className="p-6">
          <DialogHeader className="flex flex-row items-center gap-4 border-b border-border/10 pb-4 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border shadow-sm transition-all"
              style={{
                background: `${domainColor}15`,
                borderColor: `${domainColor}25`,
                color: domainColor,
              }}
            >
              {initial}
            </div>
            <div className="flex-1 text-left">
              <DialogTitle className="text-lg font-semibold text-foreground/90 flex items-center gap-1.5">
                Share {agent.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground/60 mt-0.5">
                Domain: {agent.domain || "General Workspace"}
              </DialogDescription>
            </div>
          </DialogHeader>

          <Tabs
            value={currentTab}
            onValueChange={setCurrentTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 gap-1 bg-muted/30 p-1 rounded-xl border border-border/10 mb-6">
              <TabsTrigger
                value="link"
                className="rounded-lg text-xs py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
              >
                <Link2 className="w-3.5 h-3.5 mr-1.5" />
                Invite Link
              </TabsTrigger>
              <TabsTrigger
                value="email"
                className="rounded-lg text-xs py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
              >
                <Mail className="w-3.5 h-3.5 mr-1.5" />
                Email
              </TabsTrigger>
              <TabsTrigger
                value="qrcode"
                className="rounded-lg text-xs py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
              >
                <QrCode className="w-3.5 h-3.5 mr-1.5" />
                QR Code
              </TabsTrigger>
            </TabsList>

            {/* TAB CONTENT: Invite Link */}
            <TabsContent
              value="link"
              className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-4"
            >
              <div className="space-y-2">
                <label
                  htmlFor="share-link-input"
                  className="text-xs font-semibold text-muted-foreground/75"
                >
                  Share via URL
                </label>
                {error && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center justify-between gap-2 animate-in fade-in duration-300">
                    <span className="flex-1">{error}</span>
                    <button
                      onClick={() => setError(null)}
                      className="text-[10px] underline hover:text-destructive/80 font-medium shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    id="share-link-input"
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-muted/20 border-border/40 focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-primary/40 text-xs font-mono h-10 select-all"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant={copied ? "default" : "outline"}
                    className={`h-10 px-4 transition-all flex items-center gap-1.5 shrink-0 ${
                      copied
                        ? "bg-emerald-600 hover:bg-emerald-600 text-white border-transparent"
                        : "bg-background/50 hover:bg-muted/30 hover:text-foreground border-border/40 shadow-sm"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 animate-scale-up" />
                        <span className="text-xs">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="text-xs">Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground/45 leading-relaxed bg-muted/10 p-3 rounded-lg border border-border/5">
                Anyone with this link can view the agent's safe profile and
                import a copy into their personal collection. The system prompt
                remains fully encrypted until they click import.
              </p>
            </TabsContent>

            {/* TAB CONTENT: Email Share */}
            <TabsContent
              value="email"
              className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-4"
            >
              <form onSubmit={handleShareEmail} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="share-email-input"
                    className="text-xs font-semibold text-muted-foreground/75"
                  >
                    Recipient Email Address
                  </label>
                  {error && (
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center justify-between gap-2 animate-in fade-in duration-300">
                      <span className="flex-1">{error}</span>
                      <button
                        type="button"
                        onClick={() => setError(null)}
                        className="text-[10px] underline hover:text-destructive/80 font-medium shrink-0"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      id="share-email-input"
                      type="email"
                      required
                      placeholder="e.g. teammate@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 bg-muted/20 border-border/40 focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-primary/40 text-xs h-10"
                    />
                    <Button
                      type="submit"
                      disabled={sharing || !email || emailSent}
                      className={`h-10 px-4 transition-all flex items-center gap-1.5 shrink-0 ${
                        emailSent
                          ? "bg-emerald-600 hover:bg-emerald-600 text-white border-transparent cursor-default"
                          : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                      }`}
                    >
                      {sharing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : emailSent ? (
                        <>
                          <Check className="w-3.5 h-3.5 animate-scale-up" />
                          <span className="text-xs">Sent</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span className="text-xs">Share</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
              <p className="text-[11px] text-muted-foreground/45 leading-relaxed bg-muted/10 p-3 rounded-lg border border-border/5">
                Sends a direct invite link via our sharing database. The
                recipient will see this shared agent in their "Shared with
                me" panel inside their personal dashboard workspace.
              </p>
            </TabsContent>

            {/* TAB CONTENT: QR Code */}
            <TabsContent
              value="qrcode"
              className="mt-0 outline-none flex flex-col items-center gap-4 py-1 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className="relative group p-2.5 bg-white dark:bg-zinc-100 border border-border/40 rounded-xl shadow-sm transition-all hover:shadow-md">
                {/* Visual Accent Box Shadows */}
                <div
                  className="absolute inset-0 opacity-15 blur-lg rounded-xl -z-10 group-hover:opacity-25 transition-opacity"
                  style={{ backgroundColor: domainColor }}
                />
                <img
                  src={qrCodeUrl}
                  alt={`QR Code to import ${agent.name}`}
                  className="w-32 h-32 rounded-lg border border-border/10 select-none pointer-events-none"
                  onError={(e) => {
                    // High-reliability secondary fallback to Google Charts API
                    const fallbackUrl = `https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=${encodeURIComponent(shareUrl)}`;
                    const img = e.target as HTMLImageElement;
                    if (img.src !== fallbackUrl) {
                      img.src = fallbackUrl;
                    }
                  }}
                />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-semibold text-foreground/80 flex items-center justify-center gap-1.5">
                  <Sparkles
                    className="w-3.5 h-3.5"
                    style={{ color: domainColor }}
                  />
                  Scan to Import Agent
                </p>
                <p className="text-[11px] text-muted-foreground/50 max-w-[280px] leading-relaxed mx-auto">
                  Scan this QR code with any smartphone camera to quickly preview
                  and add this agent to your mobile workspace.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
