// src/pages/notebooks/components/CreateNotebookModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal for creating a new notebook.
// Supports file upload (PDF, Word, JSON, TXT), URL scraping, text, and JSON.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Link, Code, UploadCloud, Loader2, FileCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  title: z.string().max(200, "Max 200 chars").optional().or(z.literal("")),
  description: z.string().max(1000).optional(),
  source_text: z.string().max(50000).optional(),
  source_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description?: string;
    source_type: string;
    source_text?: string;
    source_url?: string;
  }) => Promise<any>;
}

export function CreateNotebookModal({ open, onClose, onCreate }: Props) {
  const [sourceTab, setSourceTab] = useState<"file" | "text" | "url" | "json">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    setSourceTab("file");
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB on the free tier render.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      if (sourceTab === "file") {
        if (!selectedFile) {
          toast({
            title: "Please choose a file",
            description: "Select a PDF, DOCX, TXT, or JSON file to upload.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);
        if (values.title?.trim()) formData.append("title", values.title.trim());
        if (values.description?.trim()) formData.append("description", values.description.trim());

        const res = await apiClient.uploadNotebookDocument(formData);
        if (res?.success) {
          toast({
            title: "Document processed!",
            description: "Notebook created and text extracted successfully.",
          });
          handleClose();
          await onCreate(res.data);
          return;
        } else {
          throw new Error(res?.error || "Upload failed");
        }
      }

      const title = values.title?.trim() || (sourceTab === "url" ? "Article Notebook" : "New Notebook");
      await onCreate({
        title,
        description: values.description,
        source_type: sourceTab,
        source_text: sourceTab !== "url" ? values.source_text : undefined,
        source_url: sourceTab === "url" ? values.source_url : undefined,
      });
      handleClose();
    } catch (err: any) {
      toast({
        title: "Failed to create notebook",
        description: err.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Create New Notebook</DialogTitle>
          <DialogDescription>
            Import articles, documents, JSON, or paste text. AI generates flashcards, quizzes, interview questions, and a mind map.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">
              Notebook Title <span className="text-muted-foreground text-xs">(optional if uploading document)</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. System Design Principles or leave blank to use file name"
              {...register("title")}
              className={cn(errors.title && "border-red-500")}
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">
              Description <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="description"
              placeholder="Brief context or goals"
              {...register("description")}
            />
          </div>

          {/* Source tabs */}
          <div className="space-y-2">
            <Label>Source Content *</Label>
            <Tabs value={sourceTab} onValueChange={(v) => setSourceTab(v as any)}>
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="file" className="gap-1.5 text-xs">
                  <UploadCloud className="h-3.5 w-3.5" /> Document
                </TabsTrigger>
                <TabsTrigger value="url" className="gap-1.5 text-xs">
                  <Link className="h-3.5 w-3.5" /> URL / Article
                </TabsTrigger>
                <TabsTrigger value="text" className="gap-1.5 text-xs">
                  <FileText className="h-3.5 w-3.5" /> Paste Text
                </TabsTrigger>
                <TabsTrigger value="json" className="gap-1.5 text-xs">
                  <Code className="h-3.5 w-3.5" /> JSON Data
                </TabsTrigger>
              </TabsList>

              {/* Document upload tab */}
              <TabsContent value="file" className="mt-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc,.txt,.json,.md"
                  className="hidden"
                />

                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-muted/40 transition-colors"
                  >
                    <UploadCloud className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium">Click to select PDF or Word document</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports PDF, DOCX, TXT, JSON (max 10MB — optimized for Render free tier)
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-xl p-4 flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center">
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[320px]">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to extract
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* URL scrape tab */}
              <TabsContent value="url" className="mt-3 space-y-2">
                <Input
                  type="url"
                  placeholder="https://example.com/article-or-documentation"
                  {...register("source_url")}
                  className={cn(errors.source_url && "border-red-500")}
                />
                {errors.source_url && <p className="text-xs text-red-500">{errors.source_url.message}</p>}
                <p className="text-xs text-muted-foreground">
                  ✨ The backend automatically fetches and extracts the clean article content from this URL.
                </p>
              </TabsContent>

              {/* Paste text tab */}
              <TabsContent value="text" className="mt-3">
                <Textarea
                  placeholder="Paste your notes, article, documentation, or lecture material here..."
                  className="min-h-[160px] resize-y text-sm"
                  {...register("source_text")}
                />
                <p className="text-xs text-muted-foreground mt-1">Minimum 100 characters for high-quality AI analysis</p>
              </TabsContent>

              {/* JSON tab */}
              <TabsContent value="json" className="mt-3">
                <Textarea
                  placeholder='Paste JSON data here. Example: [{"key": "value"}]'
                  className="min-h-[160px] resize-y font-mono text-xs"
                  {...register("source_text")}
                />
                <p className="text-xs text-muted-foreground mt-1">Structured JSON data will be parsed and synthesized</p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {sourceTab === "file" ? "Upload & Process" : "Create Notebook"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
