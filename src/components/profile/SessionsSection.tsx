import { Laptop, Smartphone, Tablet, Globe, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthSessions, useRevokeSession } from "@/hooks/use-api-queries";

function parseUA(ua: string | null) {
  if (!ua)
    return {
      device: "Unknown Device",
      browser: "Unknown Browser",
      icon: Globe,
    };
  const isMobile = /mobile|android|iphone/i.test(ua);
  const isTablet = /ipad|tablet/i.test(ua);
  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /chrome/i.test(ua)
      ? "Chrome"
      : /firefox/i.test(ua)
        ? "Firefox"
        : /safari/i.test(ua)
          ? "Safari"
          : "Browser";
  const os = /iphone|ipad/i.test(ua)
    ? "iOS"
    : /android/i.test(ua)
      ? "Android"
      : /windows/i.test(ua)
        ? "Windows"
        : /mac os|macintosh/i.test(ua)
          ? "macOS"
          : /linux/i.test(ua)
            ? "Linux"
            : "Unknown OS";
  const icon = isTablet ? Tablet : isMobile ? Smartphone : Laptop;
  return { device: os, browser, icon };
}

export function SessionsSection() {
  const { data: sessions, isLoading } = useAuthSessions();
  const revokeMutation = useRevokeSession();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl border bg-muted/30 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
        No active sessions found.
      </div>
    );
  }

  return (
    <div className="rounded-xl border divide-y">
      {sessions.map((session) => {
        const { device, browser, icon: Icon } = parseUA(session.user_agent);
        const lastUsed = session.last_used_at
          ? new Date(session.last_used_at).toLocaleString()
          : "Unknown";

        return (
          <div key={session.id} className="p-4 flex items-start gap-4">
            <div
              className={`p-2 rounded-full flex-shrink-0 ${session.is_current ? "bg-primary/10" : "bg-muted"}`}
            >
              <Icon
                className={`w-4 h-4 ${session.is_current ? "text-primary" : "text-muted-foreground"}`}
              />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="font-medium text-sm flex items-center gap-2">
                {device} &bull; {browser}
                {session.is_current && (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 font-normal text-xs">
                    Current session
                  </Badge>
                )}
              </div>
              {session.location && (
                <p className="text-xs text-muted-foreground font-medium">
                  {session.location}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Last active: {lastUsed}
              </p>
            </div>
            {!session.is_current && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                disabled={revokeMutation.isPending}
                onClick={() => revokeMutation.mutate(session.id)}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Revoke
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
