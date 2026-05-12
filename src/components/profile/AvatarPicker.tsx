import { useState, useRef, useCallback } from "react";
import { Upload, CheckCircle2, Trash2, Loader2, ImagePlus, X } from "lucide-react";
import Cropper, { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAvatarGallery } from "@/hooks/use-api-queries";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

const FALLBACK_AVATAR_CATEGORIES: Record<string, string[]> = {
  Portraits: [
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&h=200&fit=crop",
  ],
  Abstract: [],
  Nature: [],
  Animals: [],
};

// Helper utility: creates an image object from a source URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // helpful for foreign sources
    image.src = url;
  });

// Helper utility: processes the crop from canvas and outputs a Blob file
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  // Set strict output size (e.g. upscale/downscale to 512px square for ideal avatar weight)
  canvas.width = 512;
  canvas.height = 512;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    512,
    512
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/jpeg", 0.9); // Generate standardized compressed JPEG
  });
}

interface Props {
  currentAvatar?: string | null;
  userInitial?: string;
  onAvatarChange: (url: string | null) => void;
}

export function AvatarPicker({
  currentAvatar,
  userInitial,
  onAvatarChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Cropping states
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: serverAvatars, isLoading } = useAvatarGallery();

  const displayAvatars =
    serverAvatars && Object.keys(serverAvatars).length > 0
      ? serverAvatars
      : FALLBACK_AVATAR_CATEGORIES;

  const categories = Object.keys(displayAvatars);
  const defaultCategory = categories.includes("Portraits")
    ? "Portraits"
    : categories[0] || "";

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Quick local size limit (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Images are limited to 2MB maximum.",
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageToCrop(reader.result as string);
    });
    reader.readAsDataURL(file);
  };

  const handleUploadCropped = async () => {
    if (isUploading || !imageToCrop || !croppedAreaPixels) return;

    setIsUploading(true);
    try {
      // 1. Perform local client-side crop to clean square canvas
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedBlob) throw new Error("Failed to generate crop");

      // 2. Wrap back into a File object
      const croppedFile = new File([croppedBlob], "avatar.jpg", {
        type: "image/jpeg",
      });

      // 3. Push to secured backend route
      const res = await apiClient.uploadAvatar(croppedFile);
      if (res.success && res.data?.avatar_url) {
        setSelected(res.data.avatar_url); // Sets active selection
        setImageToCrop(null); // Closes cropper view
        toast({
          title: "Upload successful",
          description: "Image has been prepared and optimized.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message || "Could not process crop or upload.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    if (selected) {
      onAvatarChange(selected);
      setOpen(false);
      setSelected(null);
    }
  };

  const handleCloseCropper = () => {
    setImageToCrop(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setOpen(true)}
            >
              <Upload className="w-4 h-4" />
              Change picture
            </Button>
            {currentAvatar && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                onClick={() => onAvatarChange(null)}
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Upload square image or pick from gallery
          </p>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {imageToCrop ? "Crop Profile Picture" : "Choose a Profile Picture"}
            </DialogTitle>
          </DialogHeader>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileSelect}
          />

          {/* MODE 1: Image Cropper Overlay */}
          {imageToCrop ? (
            <div className="flex flex-col gap-4">
              <div className="relative h-64 w-full bg-black/90 rounded-lg overflow-hidden border border-border">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              
              <div className="flex items-center gap-4 px-2">
                <span className="text-xs text-muted-foreground">Zoom</span>
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.1}
                  onValueChange={(v) => setZoom(v[0])}
                  className="flex-1"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={handleCloseCropper}
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button 
                  className="flex-1 gap-2"
                  onClick={handleUploadCropped}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Upload & Fit
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* MODE 2: Default Picker (Gallery / File Upload Trigger) */
            <>
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm">Loading curated gallery...</p>
                </div>
              ) : categories.length > 0 ? (
                <>
                  <div className="mb-4">
                    <Button
                      variant="outline"
                      type="button"
                      className="w-full h-16 border-dashed border-2 flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs font-medium">
                        Upload custom picture
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        JPG, PNG up to 2MB
                      </span>
                    </Button>
                  </div>

                  <div className="relative mb-2 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-muted" />
                    </div>
                    <span className="relative bg-background px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                      Or pick from gallery
                    </span>
                  </div>

                  <Tabs defaultValue={defaultCategory} className="w-full">
                    <TabsList className="w-full grid grid-cols-4 h-auto p-1 bg-muted/50 rounded-lg">
                      {categories.map((cat) => (
                        <TabsTrigger
                          key={cat}
                          value={cat}
                          className="text-xs py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
                        >
                          {cat}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {Object.entries(displayAvatars).map(([category, urls]) => (
                      <TabsContent
                        key={category}
                        value={category}
                        className="mt-4"
                      >
                        <div className="grid grid-cols-3 gap-3 h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                          {urls.map((url) => (
                            <button
                              key={url}
                              type="button"
                              onClick={() => setSelected(url)}
                              className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                                selected === url
                                  ? "border-primary scale-95"
                                  : "border-transparent hover:border-border bg-muted/20"
                              }`}
                            >
                              <img
                                src={url}
                                alt="Avatar option"
                                className="w-full h-full object-cover"
                                loading="lazy"
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

                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Curated system imagery
                  </p>

                  <Button
                    className="w-full mt-4"
                    disabled={!selected}
                    onClick={handleSave}
                  >
                    Select Picture
                  </Button>
                </>
              ) : (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  No avatars available
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
