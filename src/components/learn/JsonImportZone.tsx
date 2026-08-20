import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { 
  UploadCloud, 
  FileJson, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Download, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Sparkles 
} from "lucide-react";
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
const MAX_SUBJECT_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_TOPIC_NAME_LENGTH = 300;
const MAX_NESTING_DEPTH = 5;

// Sample JSON template for user reference
const SAMPLE_PLAN_JSON = {
  title: "Full-Stack Web Development Mastery",
  subject: "Web Development",
  exam_date: "2026-12-31",
  target_score: "Senior Engineer Level",
  daily_study_hours: 2.5,
  topics: [
    {
      topic_name: "Advanced React & State Management",
      description: "Master React concurrency, custom hooks, and state management architectures with Redux Toolkit and Zustand.",
      days_to_allocate: 3
    },
    {
      topic_name: "Node.js Architecture & High-Performance APIs",
      description: "Deep dive into the Node.js event loop, streams, clustering, and building resilient REST/GraphQL APIs with Express.",
      days_to_allocate: 4
    },
    {
      topic_name: "Database Design & Query Optimization",
      description: "Design relational PostgreSQL schemas, optimize complex indexes, and handle connection pooling with Prisma.",
      days_to_allocate: 3
    },
    {
      topic_name: "System Design & Distributed Caching",
      description: "Architect scalable microservices, implement Redis caching strategies, and design rate-limiting and message queues.",
      days_to_allocate: 5
    }
  ]
};

// Check maximum object/array depth to prevent JSON recursion DoS
function getJsonDepth(obj: any, currentDepth = 1): number {
  if (obj === null || typeof obj !== "object") return currentDepth;
  if (currentDepth > MAX_NESTING_DEPTH) return currentDepth;
  let maxDepth = currentDepth;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      const depth = getJsonDepth(obj[key], currentDepth + 1);
      if (depth > maxDepth) maxDepth = depth;
    }
  }
  return maxDepth;
}

// Sanitize string to prevent XSS, HTML injection, and control character abuse
function sanitizeString(str: string): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/\0/g, "") // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove dangerous ASCII control characters
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .trim();
}

function validateImportJson(raw: string): { 
  valid: boolean; 
  data?: ImportPlanPayload; 
  error?: string;
  topicCount?: number;
} {
  if (!raw || typeof raw !== "string" || !raw.trim()) {
    return { valid: false, error: "Please provide JSON data to import." };
  }

  // 1. Payload size guard (DoS prevention)
  if (raw.length > MAX_JSON_SIZE) {
    return { 
      valid: false, 
      error: `File size (${(raw.length / 1024).toFixed(1)}KB) exceeds the maximum allowed limit of ${MAX_JSON_SIZE / 1024}KB.` 
    };
  }

  // 2. Prototype pollution prevention (check raw text first)
  const rawLower = raw.toLowerCase();
  if (
    rawLower.includes("__proto__") || 
    rawLower.includes("constructor") || 
    rawLower.includes("prototype") ||
    rawLower.includes("<script") ||
    rawLower.includes("javascript:") ||
    rawLower.includes("data:text/html")
  ) {
    return { 
      valid: false, 
      error: "Security Check Failed: Potentially unsafe content or malicious scripts detected." 
    };
  }

  // 3. Syntax parsing
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (err: any) {
    return { 
      valid: false, 
      error: `Invalid JSON syntax: ${err.message || "Please check formatting, commas, and quotes."}` 
    };
  }

  // 4. Object type check & Nesting depth
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { valid: false, error: "Root JSON must be a valid object (not an array or primitive)." };
  }

  if (getJsonDepth(parsed) > MAX_NESTING_DEPTH) {
    return { valid: false, error: `JSON exceeds maximum nesting depth (${MAX_NESTING_DEPTH} levels).` };
  }

  // 5. Title validation
  if (!parsed.title || typeof parsed.title !== "string" || !parsed.title.trim()) {
    return { valid: false, error: `"title" is required and must be a non-empty string.` };
  }
  if (parsed.title.trim().length > MAX_TITLE_LENGTH) {
    return { valid: false, error: `"title" cannot exceed ${MAX_TITLE_LENGTH} characters.` };
  }

  // 6. Subject validation
  if (!parsed.subject || typeof parsed.subject !== "string" || !parsed.subject.trim()) {
    return { valid: false, error: `"subject" is required and must be a non-empty string.` };
  }
  if (parsed.subject.trim().length > MAX_SUBJECT_LENGTH) {
    return { valid: false, error: `"subject" cannot exceed ${MAX_SUBJECT_LENGTH} characters.` };
  }

  // 7. Optional fields validation
  if (parsed.target_score !== undefined && parsed.target_score !== null) {
    if (typeof parsed.target_score !== "string" || parsed.target_score.length > 100) {
      return { valid: false, error: `"target_score" must be a string up to 100 characters.` };
    }
  }

  if (parsed.daily_study_hours !== undefined && parsed.daily_study_hours !== null) {
    const hours = Number(parsed.daily_study_hours);
    if (isNaN(hours) || hours < 0.1 || hours > 24.0) {
      return { valid: false, error: `"daily_study_hours" must be a number between 0.1 and 24.0.` };
    }
  }

  if (parsed.exam_date !== undefined && parsed.exam_date !== null && parsed.exam_date !== "") {
    if (typeof parsed.exam_date !== "string" || isNaN(Date.parse(parsed.exam_date))) {
      return { valid: false, error: `"exam_date" must be a valid date format (e.g. YYYY-MM-DD).` };
    }
  }

  // 8. Topics array validation
  if (!Array.isArray(parsed.topics) || parsed.topics.length === 0) {
    return { valid: false, error: `"topics" must be a non-empty array containing at least 1 topic.` };
  }
  if (parsed.topics.length > MAX_TOPICS) {
    return { valid: false, error: `Maximum ${MAX_TOPICS} topics allowed per plan (found ${parsed.topics.length}).` };
  }

  // 9. Topic item validation
  for (let i = 0; i < parsed.topics.length; i++) {
    const t = parsed.topics[i];
    if (!t || typeof t !== "object" || Array.isArray(t)) {
      return { valid: false, error: `Topic ${i + 1}: Must be an object.` };
    }

    if (!t.topic_name || typeof t.topic_name !== "string" || !t.topic_name.trim()) {
      return { valid: false, error: `Topic ${i + 1}: "topic_name" is required.` };
    }
    if (t.topic_name.trim().length > MAX_TOPIC_NAME_LENGTH) {
      return { valid: false, error: `Topic ${i + 1}: "topic_name" exceeds ${MAX_TOPIC_NAME_LENGTH} characters.` };
    }

    if (!t.description || typeof t.description !== "string" || !t.description.trim()) {
      return { valid: false, error: `Topic ${i + 1} ("${t.topic_name}"): "description" is required.` };
    }
    if (t.description.trim().length > MAX_DESCRIPTION_LENGTH) {
      return { valid: false, error: `Topic ${i + 1}: "description" exceeds ${MAX_DESCRIPTION_LENGTH} characters.` };
    }

    if (t.days_to_allocate !== undefined && t.days_to_allocate !== null) {
      const days = Number(t.days_to_allocate);
      if (!Number.isInteger(days) || days < 1 || days > 90) {
        return { valid: false, error: `Topic ${i + 1}: "days_to_allocate" must be an integer between 1 and 90.` };
      }
    }
  }

  // 10. Sanitized Payload Construction
  const sanitizedData: ImportPlanPayload = {
    title: sanitizeString(parsed.title),
    subject: sanitizeString(parsed.subject),
    exam_date: parsed.exam_date ? sanitizeString(parsed.exam_date) : undefined,
    target_score: parsed.target_score ? sanitizeString(parsed.target_score) : undefined,
    daily_study_hours: parsed.daily_study_hours ? Number(parsed.daily_study_hours) : undefined,
    topics: parsed.topics.map((t: any) => ({
      topic_name: sanitizeString(t.topic_name),
      description: sanitizeString(t.description),
      days_to_allocate: t.days_to_allocate ? Number(t.days_to_allocate) : 1,
    })),
  };

  return {
    valid: true,
    data: sanitizedData,
    topicCount: sanitizedData.topics.length,
  };
}

export function JsonImportZone({ onValidImport, className }: JsonImportZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [pastedJson, setPastedJson] = useState("");
  const [copied, setCopied] = useState(false);
  const [showSchemaGuide, setShowSchemaGuide] = useState(true);
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
    setSuccessInfo(null);

    const result = validateImportJson(rawContent);
    if (result.valid && result.data) {
      setSuccessInfo(`✓ Validated successfully: "${result.data.title}" with ${result.topicCount} topics.`);
      onValidImport(result.data);
      setPastedJson(""); // Clear on success
    } else {
      setError(result.error || "Invalid JSON structure.");
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      setError("Please upload a valid .json file.");
      return;
    }

    if (file.size > MAX_JSON_SIZE) {
      setError(`File size (${(file.size / 1024).toFixed(1)}KB) exceeds the maximum limit of ${MAX_JSON_SIZE / 1024}KB.`);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      processJson(content);
    };
    reader.onerror = () => {
      setError("Failed to read the file from disk.");
    };
    reader.readAsText(file);
  };

  const handlePasteChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setPastedJson(e.target.value);
    if (error) setError(null);
    if (successInfo) setSuccessInfo(null);
  };

  const handlePasteSubmit = () => {
    if (!pastedJson.trim()) {
      setError("Please paste your JSON structure before importing.");
      return;
    }
    processJson(pastedJson);
  };

  const handleCopySample = () => {
    const sampleStr = JSON.stringify(SAMPLE_PLAN_JSON, null, 2);
    navigator.clipboard.writeText(sampleStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoadSample = () => {
    setPastedJson(JSON.stringify(SAMPLE_PLAN_JSON, null, 2));
    setError(null);
  };

  const handleDownloadTemplate = () => {
    const sampleStr = JSON.stringify(SAMPLE_PLAN_JSON, null, 2);
    const blob = new Blob([sampleStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "learning_plan_template.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Security & Schema Guidance Header */}
      <div className="bg-card/20 border border-border/40 rounded-2xl p-4 transition-all">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowSchemaGuide(!showSchemaGuide)}
            className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-teal-400 transition-colors text-left"
          >
            <Info className="w-4 h-4 text-teal-400" />
            <span>JSON Schema Specification & Guide</span>
            {showSchemaGuide ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLoadSample}
              className="text-xs h-7 gap-1 text-teal-400 border-teal-500/30 hover:bg-teal-500/10"
            >
              <Sparkles className="w-3 h-3" />
              Load Example
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopySample}
              className="text-xs h-7 gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied!" : "Copy Sample"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDownloadTemplate}
              className="text-xs h-7 gap-1"
              title="Download template file"
            >
              <Download className="w-3 h-3" />
              Template
            </Button>
          </div>
        </div>

        {/* Expandable Schema Explanation */}
        {showSchemaGuide && (
          <div className="mt-4 pt-3 border-t border-border/30 space-y-3 text-xs text-muted-foreground">
            <p className="leading-relaxed">
              Import custom learning plans directly. All submissions are strictly validated against the following schema:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-border/40 text-foreground">
                    <th className="py-1.5 px-2">Field</th>
                    <th className="py-1.5 px-2">Type</th>
                    <th className="py-1.5 px-2">Required</th>
                    <th className="py-1.5 px-2">Constraints</th>
                    <th className="py-1.5 px-2">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 text-muted-foreground">
                  <tr>
                    <td className="py-1.5 px-2 text-teal-400 font-semibold">title</td>
                    <td className="py-1.5 px-2">string</td>
                    <td className="py-1.5 px-2 text-red-400">Yes</td>
                    <td className="py-1.5 px-2">Max 200 chars</td>
                    <td className="py-1.5 px-2 font-sans">Title of your study plan</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 text-teal-400 font-semibold">subject</td>
                    <td className="py-1.5 px-2">string</td>
                    <td className="py-1.5 px-2 text-red-400">Yes</td>
                    <td className="py-1.5 px-2">Max 200 chars</td>
                    <td className="py-1.5 px-2 font-sans">Core subject or domain</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 text-teal-400 font-semibold">exam_date</td>
                    <td className="py-1.5 px-2">string</td>
                    <td className="py-1.5 px-2 text-muted-foreground">No</td>
                    <td className="py-1.5 px-2">YYYY-MM-DD</td>
                    <td className="py-1.5 px-2 font-sans">Target completion date</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 text-teal-400 font-semibold">daily_study_hours</td>
                    <td className="py-1.5 px-2">number</td>
                    <td className="py-1.5 px-2 text-muted-foreground">No</td>
                    <td className="py-1.5 px-2">0.1 - 24.0</td>
                    <td className="py-1.5 px-2 font-sans">Dedicated daily hours (default 1.0)</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 text-teal-400 font-semibold">target_score</td>
                    <td className="py-1.5 px-2">string</td>
                    <td className="py-1.5 px-2 text-muted-foreground">No</td>
                    <td className="py-1.5 px-2">Max 100 chars</td>
                    <td className="py-1.5 px-2 font-sans">Goal (e.g., "Pass", "Score 95+")</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 text-teal-400 font-semibold">topics</td>
                    <td className="py-1.5 px-2">array</td>
                    <td className="py-1.5 px-2 text-red-400">Yes</td>
                    <td className="py-1.5 px-2">1 to 50 items</td>
                    <td className="py-1.5 px-2 font-sans">Sequential syllabus topic list</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 text-teal-400 font-semibold pl-4">└ topic_name</td>
                    <td className="py-1.5 px-2">string</td>
                    <td className="py-1.5 px-2 text-red-400">Yes</td>
                    <td className="py-1.5 px-2">Max 300 chars</td>
                    <td className="py-1.5 px-2 font-sans">Specific concept or topic title</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 text-teal-400 font-semibold pl-4">└ description</td>
                    <td className="py-1.5 px-2">string</td>
                    <td className="py-1.5 px-2 text-red-400">Yes</td>
                    <td className="py-1.5 px-2">Max 2000 chars</td>
                    <td className="py-1.5 px-2 font-sans">Overview & learning objectives</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 text-teal-400 font-semibold pl-4">└ days_to_allocate</td>
                    <td className="py-1.5 px-2">integer</td>
                    <td className="py-1.5 px-2 text-muted-foreground">No</td>
                    <td className="py-1.5 px-2">1 to 90</td>
                    <td className="py-1.5 px-2 font-sans">Estimated study days (default 1)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-teal-400/90 pt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Hardened Security: Payload size capped at 500KB with automatic script stripping and prototype pollution safeguards.</span>
            </div>
          </div>
        )}
      </div>

      {/* Validation Feedback Alerts */}
      {error && (
        <Alert variant="destructive" role="status" aria-live="polite" className="border-red-500/40 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertTitle className="text-red-300 font-semibold">Validation Error</AlertTitle>
          <AlertDescription className="text-red-200/90 text-xs mt-1">{error}</AlertDescription>
        </Alert>
      )}

      {successInfo && (
        <Alert className="border-teal-500/40 bg-teal-500/10 text-teal-300">
          <CheckCircle2 className="h-4 w-4 text-teal-400" />
          <AlertTitle className="font-semibold">Ready to Import</AlertTitle>
          <AlertDescription className="text-xs mt-1 text-teal-200/90">{successInfo}</AlertDescription>
        </Alert>
      )}

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        aria-label="Upload JSON learning plan"
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200",
          isDragging 
            ? "border-teal-400 bg-teal-500/15 scale-[0.99]" 
            : "border-border/50 hover:border-teal-500/50 hover:bg-teal-500/5"
        )}
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400 shadow-lg shadow-teal-500/5">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Click to upload or drag & drop a .json file</p>
            <p className="text-xs text-muted-foreground mt-1">
              JSON files only (max {MAX_JSON_SIZE / 1024}KB, max {MAX_TOPICS} topics)
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

      {/* Divider */}
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/40" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground font-medium">Or paste JSON content</span>
        </div>
      </div>

      {/* Direct Paste Textarea */}
      <div className="space-y-2">
        <Textarea
          placeholder={`{\n  "title": "My Study Plan",\n  "subject": "Computer Science",\n  "topics": [\n    {\n      "topic_name": "Data Structures",\n      "description": "Arrays, Linked Lists, Trees...",\n      "days_to_allocate": 2\n    }\n  ]\n}`}
          value={pastedJson}
          onChange={handlePasteChange}
          className="min-h-[160px] font-mono text-xs custom-scrollbar bg-background/50 border-border/40 focus:border-teal-500"
        />
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground">
            {pastedJson.length > 0 ? `${(pastedJson.length / 1024).toFixed(1)} KB / ${MAX_JSON_SIZE / 1024} KB` : ""}
          </span>
          <Button 
            onClick={handlePasteSubmit} 
            disabled={!pastedJson.trim()}
            className="bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/10 font-medium"
          >
            <FileJson className="w-4 h-4 mr-2" />
            Validate & Import Plan
          </Button>
        </div>
      </div>
    </div>
  );
}
