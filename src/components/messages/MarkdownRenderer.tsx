// src/components/messages/MarkdownRenderer.tsx
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeKatex from "rehype-katex";
import { createLogger } from "@/services/logging";
import { X, ArrowUp, Check, Copy, ExternalLink } from "lucide-react";
import { MermaidDiagram } from "@/components/ui/MermaidDiagram";

// Import remark-toc ONLY if you plan to use TOC
import remarkToc from "remark-toc";

const logger = createLogger("MarkdownRenderer");
// NOTE: remark-toc is ONLY used when showToc=true

interface TocItem {
  id: string;
  text: string;
  level: number;
  element: HTMLElement;
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
  showToc?: boolean;
  enableCopy?: boolean;
  maxHeight?: string; // e.g. '60vh' or '400px' or 'none'
}

export default function MarkdownRenderer({
  content,
  className = "",
  showToc = false,
  enableCopy = true,
  maxHeight = "none",
}: MarkdownRendererProps) {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Preprocess: strip code fences, fix tables, repair LaTeX math equations, and convert plain text headings into markdown headings
  const normalizeContent = (text: string) => {
    if (!text) return "";

    // Strip markdown code fences only if they wrap the entire response (strictly markdown or md)
    let cleaned = text.trim();
    if (cleaned.startsWith("```markdown") || cleaned.startsWith("```md")) {
      // Remove opening fence (```markdown or ```md)
      cleaned = cleaned.replace(/^```(?:markdown|md)\n?/, "");
      // Remove closing fence
      cleaned = cleaned.replace(/\n?```\s*$/, "");
    }

    // 1. Safely unescape literal newlines without corrupting LaTeX tokens
    cleaned = cleaned.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");

    // 2. Repair damaged LaTeX tokens from unescaped JSON tabs or missing backslashes
    cleaned = cleaned
      .replace(/[\t ]ext\{/g, " \\text{")
      .replace(/[\t ]imes\b/g, " \\times")
      .replace(/[\t ]rac\{/g, " \\frac{")
      .replace(/[\t ]eta\b/g, " \\beta")
      .replace(/[\t ]heta\b/g, " \\theta")
      .replace(/[\t ]au\b/g, " \\tau")
      .replace(/[\t ]igma\b/g, " \\sigma")
      .replace(/[\t ]um\b/g, " \\sum")
      .replace(/[\t ]mathbf\{/g, " \\mathbf{")
      .replace(/[\t ]mathbb\{/g, " \\mathbb{")
      .replace(/[\t ]mathcal\{/g, " \\mathcal{");

    // 3. Convert LaTeX standard delimiters \( ... \) to $ ... $ and \[ ... \] to $$ ... $$ for remark-math
    cleaned = cleaned.replace(/\\\(([\s\S]*?)\\\)/g, (_m, p1) => `$${p1.trim()}$`);
    cleaned = cleaned.replace(/\\\[([\s\S]*?)\\\]/g, (_m, p1) => `\n\n$$\n${p1.trim()}\n$$\n\n`);

    // 4. Convert isolated bracket equations: [ \n <equation> \n ] (e.g., Bellman equation, Q-Learning)
    cleaned = cleaned.replace(/(^|\n)\[\s*\n([\s\S]*?)\n\s*\](?=\n|$)/g, (match, prefix, mathContent) => {
      if (/[=+\-*/\\_{}^\$\alpha-\omega\mathbb\mathcal\max\min\sum\int\leftarrow\rightarrow\approx\le\ge\in\forall\exists\partial\nabla]/.test(mathContent)) {
        return `${prefix}\n\n$$\n${mathContent.trim()}\n$$\n\n`;
      }
      return match;
    });

    // 5. Convert standalone \begin{...} ... \end{...} blocks if not already in $$
    cleaned = cleaned.replace(/(^|\n)(\\begin\{(?:equation|align|aligned|gather|matrix|pmatrix|bmatrix|vmatrix|cases|split)\*?\}[\s\S]*?\\end\{(?:equation|align|aligned|gather|matrix|pmatrix|bmatrix|vmatrix|cases|split)\*?\})/g, (_match, prefix, env) => {
      return `${prefix}\n\n$$\n${env.trim()}\n$$\n\n`;
    });

    const lines = cleaned.replace(/\r/g, "").split("\n");
    const out: string[] = [];
    let inCodeBlock = false;
    let inMathBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("```")) {
        inCodeBlock = !inCodeBlock;
        out.push(line);
        continue;
      }

      if (inCodeBlock) {
        out.push(line);
        continue;
      }

      if (trimmedLine.startsWith("$$")) {
        inMathBlock = !inMathBlock;
        out.push(line);
        continue;
      }

      if (inMathBlock) {
        out.push(line);
        continue;
      }

      const nextLine = (lines[i + 1] || "").trim();

      if (!trimmedLine) {
        out.push("");
        continue;
      }

      // Fix table rows: ensure proper spacing around pipes
      if (trimmedLine.includes("|")) {
        // Check if this looks like a table row
        const pipeCount = (trimmedLine.match(/\|/g) || []).length;
        if (pipeCount >= 2) {
          // This is likely a table row - ensure it starts and ends with |
          let fixedLine = trimmedLine;
          if (!fixedLine.startsWith("|")) fixedLine = "| " + fixedLine;
          if (!fixedLine.endsWith("|")) fixedLine = fixedLine + " |";

          // Check if next line is a separator line (contains dashes)
          const isHeaderRow =
            nextLine.includes("---") || nextLine.includes("|-");

          out.push(fixedLine);

          // If this is a header row and next line isn't a proper separator, add one
          if (isHeaderRow && i + 1 < lines.length) {
            const separatorLine = lines[i + 1].trim();
            if (!separatorLine.match(/^\|?[\s\-:|]+\|?$/)) {
              // Generate separator based on column count
              const colCount = (fixedLine.match(/\|/g) || []).length - 1;
              const separator =
                "| " + Array(colCount).fill("---").join(" | ") + " |";
              out.push(separator);
            }
          }
          continue;
        }
      }

      // Auto-convert lines ending in colon to h3, UNLESS they are too long, have markdown formatting, or contain math
      if (
        /:$/.test(trimmedLine) &&
        trimmedLine.length <= 60 &&
        !/^([#\-\*]|\d+\.)/.test(trimmedLine) &&
        !trimmedLine.includes("$") &&
        !trimmedLine.includes("\\")
      ) {
        out.push(`### ${trimmedLine.replace(/:$/, "")}`);
        out.push("");
        continue;
      }

      const looksLikeTitle =
        trimmedLine.length > 2 &&
        trimmedLine.length <= 60 &&
        /^[A-Z][A-Za-z0-9 ',\-()\/&]+$/.test(trimmedLine) &&
        !/[.?!]$/.test(trimmedLine) &&
        !/^([#\-\*]|\d+\.)/.test(trimmedLine) &&
        !trimmedLine.includes("$") &&
        !trimmedLine.includes("\\") &&
        nextLine &&
        /^[A-Z0-9"']/.test(nextLine) &&
        nextLine.length > 10;

      if (looksLikeTitle) {
        out.push(`### ${trimmedLine}`);
        out.push("");
        continue;
      }

      out.push(line);
    }

    return out.join("\n").replace(/\n{3,}/g, "\n\n");
  };

  // Generate Table of Contents from headings after render (only if showToc=true)
  useEffect(() => {
    if (showToc && contentRef.current) {
      const headings = contentRef.current.querySelectorAll(
        "h1, h2, h3, h4, h5, h6",
      );
      const tocItems: TocItem[] = Array.from(headings).map((heading, index) => {
        if (heading && !heading.id) {
          heading.id = `heading-${index}`;
        }
        return {
          id: heading.id || `heading-${index}`,
          text: heading.textContent || "",
          level: parseInt(heading.tagName.charAt(1)),
          element: heading as HTMLElement,
        };
      });

      setToc(tocItems);
    }
  }, [content, showToc]);

  // Intersection Observer for highlighting active TOC section as you scroll
  useEffect(() => {
    if (!showToc || toc.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleHeaders = entries.filter((entry) => entry.isIntersecting);
        if (visibleHeaders.length > 0) {
          // Select the first intersecting heading (closest to the top)
          setActiveId(visibleHeaders[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -50% 0px" },
    );

    toc.forEach((item) => {
      if (item.element) {
        observer.observe(item.element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [toc, showToc]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      logger.error("Failed to copy text", { error: err });
    }
  };

  const scrollToHeading = (element: HTMLElement) => {
    const yOffset = -80; // height of sticky header + spacing offset
    const y =
      element.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  // ReactMarkdown component overrides
  const components = {
    p: ({ children, ...props }: any) => (
      <p
        className="mb-4 text-foreground/90 leading-relaxed text-[15px]"
        {...props}
      >
        {children}
      </p>
    ),
    h1: ({ children, ...props }: any) => (
      <h1
        className="text-2xl font-bold mt-8 mb-4 text-foreground border-b pb-2"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2
        className="text-xl font-semibold mt-8 mb-3 text-foreground"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3
        className="text-lg font-semibold mt-6 mb-2 text-foreground/90"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: any) => (
      <h4
        className="text-base font-semibold mt-5 mb-2 text-foreground/90"
        {...props}
      >
        {children}
      </h4>
    ),
    h5: ({ children, ...props }: any) => (
      <h5
        className="text-sm font-semibold mt-4 mb-2 text-foreground/80 uppercase tracking-wider"
        {...props}
      >
        {children}
      </h5>
    ),
    h6: ({ children, ...props }: any) => (
      <h6
        className="text-sm font-medium mt-4 mb-2 text-foreground/80 uppercase tracking-widest"
        {...props}
      >
        {children}
      </h6>
    ),
    ul: ({ children, ...props }: any) => (
      <ul
        className="list-disc pl-6 space-y-1.5 mb-4 text-foreground/90"
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol
        className="list-decimal pl-6 space-y-1.5 mb-4 text-foreground/90"
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="leading-relaxed text-[15px]" {...props}>
        {children}
      </li>
    ),
    strong: ({ children, ...props }: any) => (
      <strong className="font-semibold text-foreground" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }: any) => (
      <em className="italic text-foreground/90" {...props}>
        {children}
      </em>
    ),
    a: ({ children, href, ...props }: any) => {
      const isExternal =
        href?.startsWith("http://") || href?.startsWith("https://");
      return (
        <a
          href={href}
          className="inline-flex items-center gap-0.5 text-primary hover:text-primary/80 underline underline-offset-2 transition-colors font-medium"
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          {...props}
        >
          {children}
          {isExternal && (
            <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-70 ml-0.5 inline-block" />
          )}
        </a>
      );
    },
    blockquote: ({ children, ...props }: any) => (
      <blockquote
        className="border-l-[4px] border-l-primary/60 pl-4 py-2.5 my-5 bg-primary/[0.02] dark:bg-primary/[0.01] rounded-r-lg shadow-sm backdrop-blur-[2px] italic text-foreground/85 text-[15px] leading-relaxed border-y border-r border-border/10"
        {...props}
      >
        {children}
      </blockquote>
    ),

    table: ({ children, ...props }: any) => (
      <div className="my-6 overflow-x-auto rounded-lg border border-border/40 shadow-sm">
        <table className="min-w-full border-collapse" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: any) => (
      <thead className="bg-muted/60 border-b-2 border-border/50" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }: any) => (
      <tbody className="divide-y divide-border/30" {...props}>
        {children}
      </tbody>
    ),
    tr: ({ children, ...props }: any) => (
      <tr className="hover:bg-muted/30 transition-colors" {...props}>
        {children}
      </tr>
    ),
    th: ({ children, ...props }: any) => (
      <th
        className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td className="px-4 py-3 text-sm text-foreground/90" {...props}>
        {children}
      </td>
    ),

    // Code renderer
    code: ({ node, children, className, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";
      const code = String(children).replace(/\n$/, "");
      const codeId = Math.random().toString(36).substring(7);

      const isBlock =
        node?.tagName === "code" && node?.parent?.tagName === "pre";

      const isMermaid =
        language === "mermaid" ||
        className?.includes("mermaid") ||
        /^(flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph|journey|graph\s+(TD|TB|BT|RL|LR))/im.test(
          code.trim(),
        );

      if (isBlock) {
        if (isMermaid) {
          return <MermaidDiagram chart={code} />;
        }

        return (
          <div className="relative my-4 rounded-lg overflow-hidden border border-border/40 bg-background">
            <div className="flex justify-between items-center px-4 py-2 bg-muted/40 border-b border-border/30">
              <span className="text-xs font-semibold font-mono text-foreground/70 uppercase tracking-wider">
                {language || "CODE"}
              </span>
              {enableCopy && (
                <button
                  onClick={() => copyToClipboard(code, codeId)}
                  className="text-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded px-1.5 py-0.5 transition-all"
                  aria-label={`Copy ${language} code`}
                >
                  {copiedCode === codeId ? (
                    <span className="flex items-center gap-1 text-emerald-500 font-medium animate-fade-in">
                      <Check className="w-3.5 h-3.5" /> Copied
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-foreground/60 hover:text-foreground/80 transition-colors">
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </span>
                  )}
                </button>
              )}
            </div>
            <div style={{ maxHeight: "60vh", overflow: "auto" }}>
              <pre
                className="bg-background text-foreground"
                style={{
                  padding: "1rem",
                  fontSize: "0.875rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Segoe UI Mono", "Courier New", monospace',
                  lineHeight: 1.6,
                  WebkitFontSmoothing: "antialiased",
                  MozOsxFontSmoothing: "grayscale",
                  margin: 0,
                }}
              >
                {code}
              </pre>
            </div>
          </div>
        );
      }

      // Inline code
      return (
        <code
          className="font-mono bg-muted/60 rounded px-1.5 py-0.5 text-[0.875rem] text-foreground/90 border border-border/30"
          style={{
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          }}
          {...props}
        >
          {children}
        </code>
      );
    },

    img: ({ src, alt, ...props }: any) => (
      <div className="my-6 flex flex-col items-center">
        <div
          className="relative overflow-hidden rounded-lg shadow-md border border-border/30 hover:border-primary/30 transition-all group cursor-zoom-in"
          onClick={() => setZoomedImage({ src, alt: alt || "" })}
        >
          <img
            src={src}
            alt={alt}
            className="max-w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            loading="lazy"
            {...props}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 bg-background/90 text-foreground text-xs font-medium px-2.5 py-1.5 rounded-full shadow-medium border border-border/30 transition-all scale-95 group-hover:scale-100 flex items-center gap-1">
              Click to zoom
            </span>
          </div>
        </div>
        {alt && (
          <span className="text-xs text-foreground/60 mt-2 font-sans italic">
            {alt}
          </span>
        )}
      </div>
    ),
  };

  const processed = normalizeContent(content || "");

  const outerStyle =
    maxHeight && maxHeight !== "none"
      ? ({ maxHeight } as React.CSSProperties)
      : undefined;
  const outerOverflowClass =
    maxHeight && maxHeight !== "none" ? "overflow-y-auto" : "";

  // 🟢 When TOC is OFF: render content directly (no flex, no sidebar)
  if (!showToc) {
    return (
      <div
        ref={contentRef}
        className={`prose prose-lg dark:prose-invert max-w-none font-sans leading-relaxed tracking-[0.01em] ${outerOverflowClass} ${className}`}
        style={outerStyle}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
          rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeKatex]}
          components={components}
        >
          {processed}
        </ReactMarkdown>
      </div>
    );
  }

  // 🟢 When TOC is ON: show sidebar + content (only if headings exist)
  return (
    <div className="flex gap-6">
      {toc.length > 0 && (
        <div className="hidden lg:block flex-shrink-0 w-56">
          <div className="sticky top-6">
            <h3 className="text-xs font-semibold text-foreground/80 mb-3 uppercase tracking-wider">
              On this page
            </h3>
            <nav className="space-y-1.5 border-l border-border/40 pl-4 py-1">
              {toc.map((item, i) => {
                const isActive = activeId === item.id;
                return (
                  <button
                    key={i}
                    onClick={() => scrollToHeading(item.element)}
                    className={`block text-left text-sm truncate w-full transition-all duration-200 relative py-1 ${
                      isActive
                        ? "text-primary font-medium translate-x-1"
                        : "text-foreground/60 hover:text-foreground/90 hover:translate-x-0.5"
                    }`}
                    style={{
                      paddingLeft: `${(item.level - 1) * 8}px`,
                    }}
                    aria-label={`Go to ${item.text}`}
                  >
                    {isActive && (
                      <span className="absolute left-[-17px] top-[6px] bottom-[6px] w-[3px] bg-primary rounded-full animate-fade-in" />
                    )}
                    {item.text}
                  </button>
                );
              })}
            </nav>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="mt-4 pt-3 border-t border-border/30 text-left text-xs font-semibold text-foreground/50 hover:text-primary transition-colors flex items-center gap-1.5 w-full uppercase tracking-wider"
            >
              <ArrowUp className="w-3.5 h-3.5" /> Back to Top
            </button>
          </div>
        </div>
      )}

      <div
        ref={contentRef}
        className={`flex-1 prose prose-lg dark:prose-invert max-w-none font-sans leading-relaxed tracking-[0.01em] ${outerOverflowClass} ${className}`}
        style={outerStyle}
      >
        <ReactMarkdown
          remarkPlugins={[
            remarkGfm,
            remarkBreaks,
            remarkMath,
            [() => remarkToc({ tight: true })],
          ]}
          rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeKatex]}
          components={components}
        >
          {processed}
        </ReactMarkdown>
      </div>

      {/* Glassmorphic Lightbox/Zoom for Images */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-w-7xl max-h-[90vh] overflow-hidden rounded-xl shadow-strong border border-border/50 bg-card/50 backdrop-blur-lg p-2 transition-transform duration-300 scale-100 hover:scale-[1.01]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomedImage.src}
              alt={zoomedImage.alt}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-inner"
            />
            {zoomedImage.alt && (
              <p className="text-center text-xs text-foreground/75 mt-2.5 font-medium tracking-wide">
                {zoomedImage.alt}
              </p>
            )}
            <button
              className="absolute top-4 right-4 bg-background/80 hover:bg-background text-foreground/80 hover:text-foreground rounded-full p-2 border border-border/40 shadow-medium transition-all focus:outline-none"
              onClick={() => setZoomedImage(null)}
              aria-label="Close image preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
