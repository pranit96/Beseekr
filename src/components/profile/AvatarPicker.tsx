import { useState } from "react";
import { Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// Curated Unsplash avatar photos (no API key needed - direct URLs)
const UNSPLASH_AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
];

interface Props {
  currentAvatar?: string | null;
  userInitial?: string;
  onAvatarChange: (url: string) => void;
}

export function AvatarPicker({
  currentAvatar,
  userInitial,
  onAvatarChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { refreshAuth } = useAuth();

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await apiClient.updateProfile({ avatar_url: selected });
      if (res.success) {
        onAvatarChange(selected);
        refreshAuth(true);
        toast({
          title: "Avatar updated",
          description: "Your profile picture has been saved.",
        });
        setOpen(false);
        setSelected(null);
      }
    } catch (err: any) {
      toast({
        title: "Failed to update avatar",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-6">
        <Avatar className="w-24 h-24 border-2 border-border">
          <AvatarImage src={currentAvatar || ""} />
          <AvatarFallback className="text-2xl bg-primary/5 text-primary font-semibold">
            {userInitial || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setOpen(true)}
          >
            <Upload className="w-4 h-4" />
            Change picture
          </Button>
          <p className="text-xs text-muted-foreground">
            Choose from gallery or upload your own
          </p>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose a Profile Picture</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 py-2">
            {UNSPLASH_AVATARS.map((url) => (
              <button
                key={url}
                onClick={() => setSelected(url)}
                className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                  selected === url
                    ? "border-primary scale-95"
                    : "border-transparent hover:border-border"
                }`}
              >
                <img
                  src={url}
                  alt="Avatar option"
                  className="w-full h-full object-cover"
                />
                {selected === url && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-white drop-shadow" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Photos from{" "}
            <a
              href="https://unsplash.com"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Unsplash
            </a>
          </p>

          <Button
            className="w-full"
            disabled={!selected || saving}
            onClick={handleSave}
          >
            {saving ? "Saving..." : "Save Picture"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
