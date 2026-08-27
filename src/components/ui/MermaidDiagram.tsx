import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import {
  Check,
  Copy,
  Code,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  Download,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Configure mermaid once globally
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  fontFamily: "inherit",
  themeVariables: {
    darkMode: true,
    background: "#090d16",
    mainBkg: "#0f172a",
    textColor: "#e2e8f0",
    primaryColor: "#0f766e",
    primaryTextColor: "#f8fafc",
    primaryBorderColor: "#14b8a6",
    lineColor: "#2dd4bf",
    secondaryColor: "#0369a1",
    secondaryTextColor: "#f8fafc",
    secondaryBorderColor: "#38bdf8",
    tertiaryColor: "#1e1b4b",
    tertiaryTextColor: "#f8fafc",
    tertiaryBorderColor: "#818cf8",
    nodeBorder: "#14b8a6",
    clusterBkg: "rgba(20, 184, 166, 0.06)",
    clusterBorder: "rgba(20, 184, 166, 0.3)",
    defaultLinkColor: "#2dd4bf",
    titleColor: "#f8fafc",
    edgeLabelBackground: "#0f172a",
    actorBkg: "#0f766e",
    actorBorder: "#14b8a6",
    actorTextColor: "#f8fafc",
    signalColor: "#2dd4bf",
    signalTextColor: "#f8fafc",
  },
  flowchart: {
    curve: "basis",
    htmlLabels: true,
    padding: 16,
  },
  sequence: {
    actorMargin: 50,
    messageMargin: 40,
    boxMargin: 10,
    boxTextMargin: 5,
    noteMargin: 10,
    messageAlign: "center",
  },
});

interface MermaidDiagramProps {
  chart: string;
  className?: string;
  title?: string;
}

// Automatic Mermaid Syntax Repair Helper
function repairMermaidSyntax(rawCode: string): string {
  if (!rawCode || typeof rawCode !== "string") return rawCode;

  let code = rawCode.trim();
  // Strip markdown code fences if present
  if (code.startsWith("```mermaid")) {
    code = code
      .replace(/^```mermaid\s*\n?/, "")
      .replace(/```$/, "")
      .trim();
  } else if (code.startsWith("```")) {
    code = code
      .replace(/^```\w*\s*\n?/, "")
      .replace(/```$/, "")
      .trim();
  }

  // 1. Normalize unicode characters (non-breaking spaces, unicode hyphens/dashes, smart quotes)
  code = code
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, "-")
    .replace(/[\u00A0\u2000-\u200B\u202F\uFEFF]/g, " ");

  // 2. Fix broken arrow syntax
  code = code
    .replace(/-->\s*>/g, "-->")
    .replace(/--\s*>/g, "-->")
    .replace(/->\s*>/g, "-->");

  // 3. Process line-by-line to safely quote unquoted node labels containing special chars
  const lines = code.split("\n");
  const repairedLines = lines.map((line) => {
    let l = line;
    // Don't modify diagram declaration header
    if (
      /^\s*(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph|journey|C4Context|mindmap|timeline|quadrantChart)\b/i.test(
        l,
      )
    ) {
      return l;
    }

    // Match node definitions with square brackets: id[content]
    // e.g. A[Start: Define Goal (Weight loss, etc.)] -> A["Start: Define Goal (Weight loss, etc.)"]
    l = l.replace(
      /\b([A-Za-z0-9_]+)\[(?!\s*")([^\]]+)\]/g,
      (_match, id, text) => {
        const safeText = text.replace(/"/g, '\\"');
        return `${id}["${safeText.trim()}"]`;
      },
    );

    // Match node definitions with curly braces: id{content}
    // e.g. B{Choose IF Protocol} -> B{"Choose IF Protocol"}
    l = l.replace(
      /\b([A-Za-z0-9_]+)\{(?!\s*")([^\}]+)\}/g,
      (_match, id, text) => {
        const safeText = text.replace(/"/g, '\\"');
        return `${id}{"${safeText.trim()}"}`;
      },
    );

    // Match node definitions with round parens: id(content)
    l = l.replace(
      /\b([A-Za-z0-9_]+)\((?!\s*[\("])([^\)]+)\)/g,
      (_match, id, text) => {
        const safeText = text.replace(/"/g, '\\"');
        return `${id}("${safeText.trim()}")`;
      },
    );

    // Match edge labels: -->|text| e.g. -->|16/8| or -->|label with (parens)|
    l = l.replace(/-->\|(?!\s*")([^\|]+)\|/g, (_match, text) => {
      const safeText = text.replace(/"/g, '\\"');
      return `-->|"${safeText.trim()}"|`;
    });

    return l;
  });

  return repairedLines.join("\n");
}

export function MermaidDiagram({
  chart,
  className,
  title,
}: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgHtml, setSvgHtml] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Generate unique valid ID for Mermaid render — must be stable across renders
  // Using useRef so Math.random() is only called once, preventing an infinite
  // useEffect re-run loop (new id → effect fires → setIsLoading → re-render → repeat).
  const diagramIdRef = useRef(`mermaid-${Math.random().toString(36).substring(2, 9)}-${Math.random().toString(36).substring(2, 7)}`);
  const diagramId = diagramIdRef.current;

  const cleanChart = React.useMemo(() => {
    return repairMermaidSyntax(chart);
  }, [chart]);

  useEffect(() => {
    let isMounted = true;

    async function renderChart() {
      if (!cleanChart) return;
      setIsLoading(true);
      setError(null);

      try {
        // Validate & parse diagram syntax
        await mermaid.parse(cleanChart);

        // Render to SVG
        const { svg } = await mermaid.render(diagramId, cleanChart);

        if (isMounted) {
          setSvgHtml(svg);
          setError(null);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.warn("[MermaidDiagram] Render error:", err?.message || err);
        if (isMounted) {
          setError(err?.message || "Syntax error in diagram");
          setIsLoading(false);
        }
      }
    }

    renderChart();

    return () => {
      isMounted = false;
    };
  // diagramId is intentionally omitted from deps — it's stable (from useRef)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanChart, retryCount]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanChart);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy code", e);
    }
  };

  const handleDownloadSvg = () => {
    if (!svgHtml) return;
    const blob = new Blob([svgHtml], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diagram-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));
  const handleResetZoom = () => setZoom(1);
  const handleRetry = () => setRetryCount((c) => c + 1);

  return (
    <div
      className={cn(
        "my-6 rounded-2xl border border-teal-500/20 bg-card/10 backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-300",
        className,
      )}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-card/40 border-b border-border/40 text-xs text-muted-foreground flex-wrap gap-2">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              error ? "bg-amber-400" : "bg-teal-400 animate-pulse",
            )}
          />
          <span>{title || "Architecture / Flow Diagram"}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {!error && !showCode && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <span className="text-[11px] font-mono w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
              {zoom !== 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleResetZoom}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              )}
              <div className="w-px h-4 bg-border/40 mx-1" />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownloadSvg}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Download SVG"
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCode(!showCode)}
            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
          >
            {showCode ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <Code className="w-3.5 h-3.5" />
            )}
            <span>{showCode ? "Diagram" : "Code"}</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Copy Mermaid Code"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-teal-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 overflow-x-auto custom-scrollbar flex items-center justify-center min-h-[160px] bg-gradient-to-b from-background/30 to-background/70">
        {showCode ? (
          <pre className="w-full text-xs font-mono text-teal-300 p-4 rounded-xl bg-background/80 border border-border/30 overflow-x-auto">
            <code>{cleanChart}</code>
          </pre>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 max-w-lg">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>
                Due to some technical issue unable to render diagram. Please try
                again.
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              The diagram syntax was malformed or could not be compiled. You can
              retry rendering or inspect the source code.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="h-8 text-xs border-teal-500/40 text-teal-400 hover:bg-teal-500/10 gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try Again
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCode(true)}
                className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              >
                <Code className="w-3.5 h-3.5" />
                View Raw Code
              </Button>
            </div>
          </div>
        ) : (
          <div
            ref={containerRef}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              transition: "transform 0.15s ease-out",
            }}
            className="w-full flex justify-center items-center select-none [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:drop-shadow-lg"
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        )}
      </div>
    </div>
  );
}

export default MermaidDiagram;
