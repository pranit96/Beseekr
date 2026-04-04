// src/components/messages/MarkdownRenderer.tsx
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import { createLogger } from "@/services/logging";

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
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Preprocess: strip code fences, fix tables, and convert plain text headings into markdown headings
  const normalizeContent = (text: string) => {
    if (!text) return "";

    // Strip markdown code fences if present (```markdown ... ``` or ```...```)
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      // Remove opening fence (```markdown or ```md or just ```)
      cleaned = cleaned.replace(/^```(?:markdown|md)?\n?/, "");
      // Remove closing fence
      cleaned = cleaned.replace(/\n?```\s*$/, "");
    }

    const lines = cleaned.replace(/\r/g, "").split("\n");
    const out: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const trimmedLine = line.trim();
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

      if (/:$/.test(trimmedLine)) {
        out.push(`### ${trimmedLine.replace(/:$/, "")}`);
        out.push("");
        continue;
      }

      const looksLikeTitle =
        trimmedLine.length > 2 &&
        trimmedLine.length <= 60 &&
        /^[A-Z][A-Za-z0-9 ',-]+$/.test(trimmedLine) &&
        !/[.?!]$/.test(trimmedLine) &&
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
      const tocItems: TocItem[] = Array.from(headings).map(
        (heading, index) => ({
          id: `heading-${index}`,
          text: heading.textContent || "",
          level: parseInt(heading.tagName.charAt(1)),
          element: heading as HTMLElement,
        }),
      );

      tocItems.forEach((item, i) => {
        if (item.element && !item.element.id) {
          item.element.id = `heading-${i}`;
        }
      });

      setToc(tocItems);
    }
  }, [content, showToc]);

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
    element.scrollIntoView({ behavior: "smooth", block: "start" });
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
    a: ({ children, href, ...props }: any) => (
      <a
        href={href}
        className="text-primary hover:text-primary/80 underline"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote
        className="border-l-4 border-primary/70 pl-4 py-2 my-4 bg-muted/30 italic text-foreground/80 rounded-r text-[15px]"
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
    code: ({ children, className, inline, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";
      const code = String(children).replace(/\n$/, "");
      const codeId = Math.random().toString(36).substring(7);

      if (!inline && language) {
        return (
          <div className="relative my-4 rounded-lg overflow-hidden border border-border/40">
            <div className="flex justify-between items-center px-3 py-2 bg-muted/40 border-b border-border/30">
              <span className="text-xs font-mono text-foreground/70 uppercase">
                {language}
              </span>
              {enableCopy && (
                <button
                  onClick={() => copyToClipboard(code, codeId)}
                  className="text-xs text-foreground/60 hover:text-foreground/80"
                  aria-label={`Copy ${language} code`}
                >
                  {copiedCode === codeId ? "✓ Copied" : "Copy"}
                </button>
              )}
            </div>
            <div style={{ maxHeight: "60vh", overflow: "auto" }}>
              <pre
                style={{
                  padding: "1rem",
                  fontSize: "0.9rem",
                  whiteSpace: "pre",
                  backgroundColor: "#000000",
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
          className="font-mono bg-muted/60 rounded px-1.5 py-0.5 text-sm text-foreground/90 border border-border/30"
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
      <div className="my-6 flex justify-center">
        <img
          src={src}
          alt={alt}
          className="max-w-full h-auto rounded-lg shadow-md border border-border/30"
          loading="lazy"
          {...props}
        />
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
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={[rehypeRaw]}
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
            <h3 className="text-sm font-semibold text-foreground/80 mb-3 uppercase">
              Contents
            </h3>
            <nav className="space-y-2">
              {toc.map((item, i) => (
                <button
                  key={i}
                  onClick={() => scrollToHeading(item.element)}
                  className="block text-left text-sm truncate text-foreground/80 hover:text-primary"
                  aria-label={`Go to ${item.text}`}
                >
                  {item.text}
                </button>
              ))}
            </nav>
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
            [() => remarkToc({ tight: true })],
          ]}
          rehypePlugins={[rehypeRaw]}
          components={components}
        >
          {processed}
        </ReactMarkdown>
      </div>
    </div>
  );
}
