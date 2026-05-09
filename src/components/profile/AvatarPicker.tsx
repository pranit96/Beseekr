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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AVATAR_CATEGORIES = {
  Portraits: [
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
  ],
  Abstract: [
    "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1505909182942-e2f09aee3e89?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1550859491-1ea5336f3db1?w=200&h=200&fit=crop",
  ],
  Nature: [
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=200&h=200&fit=crop",
  ],
  Animals: [
    "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1525983818625-78e718816c1a?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1561948955-570b270e7c36?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1537151608804-ea6fac25d4c8?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=200&h=200&fit=crop",
  ],
};

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

          <Tabs defaultValue="Portraits" className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-auto p-1 bg-muted/50 rounded-lg">
              {Object.keys(AVATAR_CATEGORIES).map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="text-xs py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(AVATAR_CATEGORIES).map(([category, urls]) => (
              <TabsContent key={category} value={category} className="mt-4">
                <div className="grid grid-cols-3 gap-3">
                  {urls.map((url) => (
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
              </TabsContent>
            ))}
          </Tabs>

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
