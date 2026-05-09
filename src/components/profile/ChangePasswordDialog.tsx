import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useChangePassword } from "@/hooks/use-api-queries";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: Props) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const { user } = useAuth();
  const hasPassword = user?.providers?.includes("email") ?? true; // Assume password exists by default

  const changePassword = useChangePassword();

  const rules = [
    { label: "At least 8 characters", ok: next.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(next) },
    { label: "Lowercase letter", ok: /[a-z]/.test(next) },
    { label: "Number", ok: /[0-9]/.test(next) },
    { label: "Special character", ok: /[^A-Za-z0-9]/.test(next) },
  ];

  const valid =
    (!hasPassword || current.length > 0) &&
    rules.every((r) => r.ok) &&
    next === confirm;

  const handleSubmit = async () => {
    if (!valid) return;
    await changePassword.mutateAsync(
      {
        current_password: hasPassword ? current : undefined,
        new_password: next,
      },
      {
        onSuccess: () => {
          setCurrent("");
          setNext("");
          setConfirm("");
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" /> Change Password
          </DialogTitle>
          <DialogDescription>
            {hasPassword
              ? "Enter your current password and choose a strong new one."
              : "Set a strong password for your account to log in with your email."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {hasPassword && (
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  placeholder="Your current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>New Password</Label>
            <div className="relative">
              <Input
                type={showNext ? "text" : "password"}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="New password"
              />
              <button
                type="button"
                onClick={() => setShowNext(!showNext)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNext ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {next.length > 0 && (
              <div className="grid grid-cols-2 gap-1 pt-1">
                {rules.map((r) => (
                  <p
                    key={r.label}
                    className={`text-xs flex items-center gap-1 ${r.ok ? "text-emerald-500" : "text-muted-foreground"}`}
                  >
                    <span>{r.ok ? "✓" : "○"}</span> {r.label}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              className={
                confirm.length > 0 && confirm !== next
                  ? "border-destructive"
                  : ""
              }
            />
            {confirm.length > 0 && confirm !== next && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
          </div>

          <Button
            className="w-full"
            disabled={!valid || changePassword.isPending}
            onClick={handleSubmit}
          >
            {changePassword.isPending ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
