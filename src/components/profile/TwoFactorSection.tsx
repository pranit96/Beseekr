import { useState } from "react";
import { ShieldCheck, ShieldOff, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  use2FAStatus,
  useEnroll2FA,
  useVerify2FA,
  useUnenroll2FA,
} from "@/hooks/use-api-queries";

export function TwoFactorSection() {
  const { data: twoFA, isLoading } = use2FAStatus();
  const enrollMutation = useEnroll2FA();
  const verifyMutation = useVerify2FA();
  const unenrollMutation = useUnenroll2FA();

  const [enrollData, setEnrollData] = useState<{
    id: string;
    totp: { qr_code: string; secret: string };
  } | null>(null);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  const handleEnroll = async () => {
    const res = await enrollMutation.mutateAsync();
    if (res.success && res.data) {
      setEnrollData(res.data as any);
    }
  };

  const handleVerify = async () => {
    if (!enrollData || code.length !== 6) return;
    await verifyMutation.mutateAsync(
      { factor_id: enrollData.id, code },
      {
        onSuccess: () => {
          setEnrollData(null);
          setCode("");
        },
      },
    );
  };

  const handleCopySecret = () => {
    if (enrollData?.totp.secret) {
      navigator.clipboard.writeText(enrollData.totp.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-muted rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="font-medium flex items-center gap-2">
            Two-Factor Authentication
            {twoFA?.enabled ? (
              <Badge className="bg-emerald-500 hover:bg-emerald-600 font-normal">
                Enabled
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950 font-normal"
              >
                Off
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {twoFA?.enabled
              ? "Your account is protected with an authenticator app."
              : "Add an extra layer of security using an authenticator app."}
          </p>
          {twoFA?.enabled && twoFA.factors[0] && (
            <p className="text-xs text-muted-foreground">
              Enabled{" "}
              {new Date(twoFA.factors[0].created_at).toLocaleDateString()}
            </p>
          )}
        </div>
        {twoFA?.enabled ? (
          <Button
            variant="outline"
            className="border-destructive/50 text-destructive hover:bg-destructive/10 whitespace-nowrap"
            onClick={() => setShowDisableConfirm(true)}
            disabled={unenrollMutation.isPending}
          >
            <ShieldOff className="w-4 h-4 mr-2" />
            Disable 2FA
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={handleEnroll}
            disabled={enrollMutation.isPending}
            className="whitespace-nowrap"
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            {enrollMutation.isPending ? "Setting up..." : "Enable 2FA"}
          </Button>
        )}
      </div>

      {/* Enrollment flow */}
      <Dialog
        open={!!enrollData}
        onOpenChange={(o) => !o && setEnrollData(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Authenticator</DialogTitle>
            <DialogDescription>
              Scan this QR code with your authenticator app (Google
              Authenticator, Authy, etc.), then enter the 6-digit code to
              confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 pt-2">
            {enrollData?.totp.qr_code && (
              <img
                src={enrollData.totp.qr_code}
                alt="2FA QR Code"
                className="w-48 h-48 rounded-xl border p-2"
              />
            )}
            <div className="w-full space-y-2">
              <Label>Manual entry key</Label>
              <div className="flex gap-2">
                <Input
                  value={enrollData?.totp.secret || ""}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopySecret}
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="w-full space-y-2">
              <Label>Verification code</Label>
              <Input
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="text-center font-mono text-lg tracking-widest"
              />
            </div>
            <Button
              className="w-full"
              disabled={code.length !== 6 || verifyMutation.isPending}
              onClick={handleVerify}
            >
              {verifyMutation.isPending ? "Verifying..." : "Confirm & Enable"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disable confirmation */}
      <Dialog open={showDisableConfirm} onOpenChange={setShowDisableConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Disable 2FA?</DialogTitle>
            <DialogDescription>
              This will remove two-factor authentication from your account,
              making it less secure.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDisableConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={unenrollMutation.isPending}
              onClick={() =>
                unenrollMutation.mutateAsync(undefined, {
                  onSuccess: () => setShowDisableConfirm(false),
                })
              }
            >
              {unenrollMutation.isPending ? "Disabling..." : "Disable"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
