import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, FileJson, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImportPlanPayload } from "@/types/education";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface JsonImportZoneProps {
  onValidImport: (data: ImportPlanPayload) => void;
  className?: string;
}

const MAX_JSON_SIZE = 500 * 1024; // 500KB
const MAX_TOPICS = 50;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;

function validateImportJson(raw: string): { valid: boolean; data?: ImportPlanPayload; error?: string } {
  if (raw.length > MAX_JSON_SIZE) {
    return { valid: false, error: `File too large. Maximum ${MAX_JSON_SIZE / 1024}KB allowed.` };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { valid: false, error: "Invalid JSON syntax. Please check your file." };
  }

  const rawLower = raw.toLowerCase();
  if (rawLower.includes("__proto__") || rawLower.includes("constructor") || rawLower.includes("prototype")) {
    return { valid: false, error: "Malicious content detected." };
  }

  if (!parsed.title || typeof parsed.title !== "string" || parsed.title.length > MAX_TITLE_LENGTH) {
    return { valid: false, error: `"title" is required (max ${MAX_TITLE_LENGTH} chars).` };
  }
  if (!parsed.subject || typeof parsed.subject !== "string" || parsed.subject.length > MAX_TITLE_LENGTH) {
    return { valid: false, error: `"subject" is required (max ${MAX_TITLE_LENGTH} chars).` };
  }
  if (!Array.isArray(parsed.topics) || parsed.topics.length === 0) {
    return { valid: false, error: `"topics" must be a non-empty array.` };
  }
  if (parsed.topics.length > MAX_TOPICS) {
    return { valid: false, error: `Maximum ${MAX_TOPICS} topics allowed.` };
  }

  for (let i = 0; i < parsed.topics.length; i++) {
    const t = parsed.topics[i];
    if (!t.topic_name || typeof t.topic_name !== "string") {
      return { valid: false, error: `Topic ${i + 1}: "topic_name" is required.` };
    }
    if (t.topic_name.length > 300) {
      return { valid: false, error: `Topic ${i + 1}: topic_name exceeds 300 characters.` };
    }
    if (!t.description || typeof t.description !== "string") {
      return { valid: false, error: `Topic ${i + 1}: "description" is required.` };
    }
    if (t.description.length > MAX_DESCRIPTION_LENGTH) {
      return { valid: false, error: `Topic ${i + 1}: description exceeds ${MAX_DESCRIPTION_LENGTH} characters.` };
    }
    if (t.days_to_allocate !== undefined) {
      if (!Number.isInteger(t.days_to_allocate) || t.days_to_allocate < 1 || t.days_to_allocate > 90) {
        return { valid: false, error: `Topic ${i + 1}: "days_to_allocate" must be 1-90.` };
      }
    }
  }

  const sanitize = (s: string) => s.replace(/<[^>]*>/g, "").trim();

  return {
    valid: true,
    data: {
      title: sanitize(parsed.title),
      subject: sanitize(parsed.subject),
      exam_date: parsed.exam_date || undefined,
      daily_study_hours: parsed.daily_study_hours || undefined,
      topics: parsed.topics.map((t: any) => ({
        topic_name: sanitize(t.topic_name),
        description: sanitize(t.description),
        days_to_allocate: t.days_to_allocate,
      })),
    },
  };
}

export function JsonImportZone({ onValidImport, className }: JsonImportZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastedJson, setPastedJson] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processJson = (rawContent: string) => {
    setError(null);
    const { valid, data, error: validationError } = validateImportJson(rawContent);
    if (valid && data) {
      onValidImport(data);
      setPastedJson(""); // Clear on success
    } else {
      setError(validationError || "Invalid JSON");
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setError("Please upload a .json file");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      processJson(content);
    };
    reader.onerror = () => {
      setError("Failed to read file");
    };
    reader.readAsText(file);
  };

  const handlePasteChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setPastedJson(e.target.value);
  };

  const handlePasteSubmit = () => {
    if (!pastedJson.trim()) {
      setError("Please paste some JSON first");
      return;
    }
    processJson(pastedJson);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {error && (
        <Alert variant="destructive" role="status" aria-live="polite">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Validation Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        aria-label="Upload JSON learning plan"
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-200",
          isDragging 
            ? "border-teal-500 bg-teal-500/10" 
            : "border-border/50 hover:border-teal-500/50 hover:bg-teal-500/5"
        )}
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="p-3 rounded-full bg-teal-500/10 text-teal-500">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground mt-1">
              JSON files only (max {MAX_JSON_SIZE / 1024}KB)
            </p>
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".json,application/json"
          className="hidden"
        />
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or paste directly</span>
        </div>
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder="Paste your learning plan JSON here..."
          value={pastedJson}
          onChange={handlePasteChange}
          className="min-h-[150px] font-mono text-xs custom-scrollbar"
        />
        <div className="flex justify-end">
          <Button 
            onClick={handlePasteSubmit} 
            disabled={!pastedJson.trim()}
            className="bg-teal-500 hover:bg-teal-600 text-white"
          >
            <FileJson className="w-4 h-4 mr-2" />
            Import JSON
          </Button>
        </div>
      </div>
    </div>
  );
}
