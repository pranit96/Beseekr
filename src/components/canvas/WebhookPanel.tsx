// src/components/canvas/WebhookPanel.tsx
// Feature: Live Webhook URL Generator
// Floating panel in canvas — generate, rotate, copy and monitor webhook hits

import { memo, useState, useCallback, useEffect } from "react";
import { X, Webhook, Copy, RefreshCw, CheckCheck, ShieldCheck, Zap, AlertTriangle } from "lucide-react";
import { apiClient as api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface WebhookHit {
  timestamp: string;
  ip: string;
  method: string;
  status: "ok" | "error";
}

interface WebhookPanelProps {
  workflowId: string | null;
  onClose: () => void;
}

const HMAC_ALGO_OPTIONS = ["sha256", "sha1", "none"] as const;

export const WebhookPanel = memo(({ workflowId, onClose }: WebhookPanelProps) => {
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [hmacAlgo, setHmacAlgo] = useState<"sha256" | "sha1" | "none">("sha256");
  const [loading, setLoading] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [copied, setCopied] = useState<"url" | "secret" | null>(null);
  const [hits, setHits] = useState<WebhookHit[]>([]);
  const [rateLimit, setRateLimit] = useState({ max: 10, window: 60, current: 0 });

  // Fetch existing webhook or create
  const fetchOrCreate = useCallback(async () => {
    if (!workflowId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/canvas-workflows/${workflowId}/webhook`);
      if (res.success && res.data) {
        setWebhookUrl(res.data.url);
        setSecret(res.data.secret);
        setHmacAlgo(res.data.hmac_algo || "sha256");
        setHits(res.data.recent_hits || []);
        setRateLimit(res.data.rate_limit || { max: 10, window: 60, current: 0 });
      }
    } catch {
      // No webhook yet — that's fine
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  const generateWebhook = useCallback(async () => {
    if (!workflowId) return;
    setLoading(true);
    try {
      const res = await api.post(`/api/canvas-workflows/${workflowId}/webhook/generate`, {
        hmac_algo: hmacAlgo,
      });
      if (res.success && res.data) {
        setWebhookUrl(res.data.url); 
        setSecret(res.data.secret);
        toast({ title: "Webhook generated!", description: "Your secret URL is ready to use." });
      }
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [workflowId, hmacAlgo, toast]);

  const rotateSecret = useCallback(async () => {
    if (!workflowId) return;
    setRotating(true);
    try {
      const res = await api.post(`/api/canvas-workflows/${workflowId}/webhook/rotate`);
      if (res.success && res.data) {
        setSecret(res.data.secret);
        toast({ title: "Secret rotated", description: "New HMAC secret generated. Update your integrations." });
      }
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setRotating(false);
    }
  }, [workflowId, toast]);

  const copy = useCallback((text: string, type: "url" | "secret") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  useEffect(() => { fetchOrCreate(); }, [fetchOrCreate]);

  const usagePercent = Math.min((rateLimit.current / rateLimit.max) * 100, 100);

  return (
    <div className="absolute top-4 right-4 z-30 w-[380px] rounded-2xl border border-border/30 bg-card/95 backdrop-blur-2xl shadow-2xl shadow-black/40 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/20 bg-gradient-to-r from-violet-500/10 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Webhook className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Inbound Webhook</h3>
            <p className="text-[10px] text-muted-foreground">Trigger this workflow via HTTP POST</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 py-3 space-y-3 flex-1 overflow-y-auto">
        {!webhookUrl ? (
          <div className="space-y-3">
            {/* No webhook yet */}
            <div className="py-6 flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Webhook className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground/80">No webhook yet</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Generate a secret URL to trigger this workflow from external services.</p>
              </div>
            </div>

            {/* HMAC config before generate */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Signature Algorithm</label>
              <div className="flex gap-1.5">
                {HMAC_ALGO_OPTIONS.map(algo => (
                  <button
                    key={algo}
                    onClick={() => setHmacAlgo(algo as any)}
                    className={`flex-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                      hmacAlgo === algo
                        ? "bg-violet-500/20 border-violet-500/50 text-violet-400"
                        : "bg-card/40 border-border/30 text-muted-foreground hover:border-border/60"
                    }`}
                  >
                    {algo.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateWebhook}
              disabled={loading || !workflowId}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 transition-all"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Generate Webhook
            </button>
          </div>
        ) : (
          <>
            {/* Webhook URL */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Webhook URL</label>
              <div className="flex gap-1.5">
                <div className="flex-1 px-2.5 py-2 rounded-xl bg-background/50 border border-border/30 font-mono text-[10px] text-foreground/70 truncate overflow-hidden">
                  {webhookUrl}
                </div>
                <button
                  onClick={() => copy(webhookUrl, "url")}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                    copied === "url"
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                      : "bg-muted/30 border-border/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {copied === "url" ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Secret */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">HMAC Secret</label>
                <button
                  onClick={rotateSecret}
                  disabled={rotating}
                  className="flex items-center gap-1 text-[10px] font-bold text-amber-400/70 hover:text-amber-400 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${rotating ? "animate-spin" : ""}`} />
                  Rotate
                </button>
              </div>
              <div className="flex gap-1.5">
                <div className="flex-1 px-2.5 py-2 rounded-xl bg-background/50 border border-border/30 font-mono text-[10px] text-foreground/70 truncate overflow-hidden">
                  {secret}
                </div>
                <button
                  onClick={() => copy(secret!, "secret")}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                    copied === "secret"
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                      : "bg-muted/30 border-border/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {copied === "secret" ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                <ShieldCheck className="w-3 h-3" />
                <span>Sign payload with <code className="font-mono text-violet-400">X-Signature-{hmacAlgo.toUpperCase()}</code> header</span>
              </div>
            </div>

            {/* Rate limit meter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Rate Limit</label>
                <span className={`text-[10px] font-bold ${usagePercent > 80 ? "text-rose-400" : "text-muted-foreground"}`}>
                  {rateLimit.current} / {rateLimit.max} per {rateLimit.window}s
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    usagePercent > 80 ? "bg-rose-500" : usagePercent > 50 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              {usagePercent > 80 && (
                <div className="flex items-center gap-1.5 text-[10px] text-rose-400">
                  <AlertTriangle className="w-3 h-3" />
                  Approaching rate limit
                </div>
              )}
            </div>

            {/* Recent hits */}
            {hits.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Recent Hits</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {hits.slice(0, 8).map((hit, i) => (
                    <div key={i} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-muted/15 border border-border/10">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${hit.status === "ok" ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span className="text-[10px] font-mono text-foreground/60">{hit.method}</span>
                        <span className="text-[10px] text-muted-foreground/50">{hit.ip}</span>
                      </div>
                      <span className="text-[9px] text-muted-foreground/40">
                        {new Date(hit.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Usage snippet */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Quick Start</label>
              <div className="px-3 py-2.5 rounded-xl bg-background/60 border border-border/20 overflow-x-auto">
                <pre className="text-[10px] font-mono text-foreground/70 leading-relaxed whitespace-pre">{`curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "X-Signature-SHA256: <hmac>" \\
  -d '{"input_text":"Hello world"}'`}</pre>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

WebhookPanel.displayName = "WebhookPanel";
