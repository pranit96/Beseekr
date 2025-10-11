// src/components/messages/MarkdownRenderer.tsx
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import remarkToc from 'remark-toc';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
// NOTE: removed `rehype-highlight` and the highlight.js css import to avoid Vite/Rollup resolution issues

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
  maxHeight?: string;
}

export default function MarkdownRenderer({
  content,
  className = '',
  showToc = false,
  enableCopy = true,
  maxHeight = 'none'
}: MarkdownRendererProps) {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Preprocess: convert plain text headings into markdown headings (heuristic)
  const normalizeContent = (text: string) => {
    if (!text) return '';
    const lines = text.replace(/\r/g, '').split('\n');
    const out: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const nextLine = (lines[i + 1] || '').trim();

      if (!line) {
        out.push('');
        continue;
      }

      if (/:$/.test(line)) {
        out.push(`### ${line.replace(/:$/, '')}`);
        out.push('');
        continue;
      }

      const looksLikeTitle =
        line.length > 2 &&
        line.length <= 60 &&
        /^[A-Z][A-Za-z0-9 ',-]+$/.test(line) &&
        !/[.?!]$/.test(line) &&
        nextLine &&
        /^[A-Z0-9"']/.test(nextLine) &&
        nextLine.length > 10;

      if (looksLikeTitle) {
        out.push(`### ${line}`);
        out.push('');
        continue;
      }

      out.push(line);
    }

    return out.join('\n\n').replace(/\n{3,}/g, '\n\n');
  };

  // Generate Table of Contents from headings after render (if needed)
  useEffect(() => {
    if (showToc && contentRef.current) {
      const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const tocItems: TocItem[] = Array.from(headings).map((heading, index) => ({
        id: `heading-${index}`,
        text: heading.textContent || '',
        level: parseInt(heading.tagName.charAt(1)),
        element: heading as HTMLElement
      }));
      setToc(tocItems);
    }
  }, [content, showToc]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const scrollToHeading = (element: HTMLElement) => {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ReactMarkdown component overrides
  const components = {
    p: ({ children, ...props }: any) => (
      <p className="mb-4 text-foreground/95 leading-7 text-base" {...props}>
        {children}
      </p>
    ),
    h1: ({ children, ...props }: any) => (
      <h1 className="text-3xl font-bold mt-6 mb-4 text-foreground" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="text-2xl font-semibold mt-6 mb-3 text-foreground" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="text-xl font-semibold mt-5 mb-2 text-foreground/90" {...props}>
        {children}
      </h3>
    ),
    ul: ({ children, ...props }: any) => (
      <ul className="list-disc pl-6 space-y-2 mb-4 text-foreground/90" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="list-decimal pl-6 space-y-2 mb-4 text-foreground/90" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="leading-7" {...props}>{children}</li>
    ),
    strong: ({ children, ...props }: any) => (
      <strong className="font-semibold text-foreground" {...props}>{children}</strong>
    ),
    em: ({ children, ...props }: any) => (
      <em className="italic text-foreground/90" {...props}>{children}</em>
    ),
    a: ({ children, href, ...props }: any) => (
      <a href={href} className="text-primary hover:text-primary/80 underline" target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-4 border-primary/70 pl-4 py-2 my-4 bg-muted/30 italic text-foreground/80 rounded-r" {...props}>
        {children}
      </blockquote>
    ),
    code: ({ children, className, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const code = String(children).replace(/\n$/, '');
      const codeId = Math.random().toString(36).substring(7);

      if (language) {
        return (
          <div className="relative my-4 rounded-lg overflow-hidden border border-border/40">
            <div className="flex justify-between items-center px-3 py-2 bg-muted/40 border-b border-border/30">
              <span className="text-xs font-mono text-foreground/70 uppercase">{language}</span>
              {enableCopy && (
                <button
                  onClick={() => copyToClipboard(code, codeId)}
                  className="text-xs text-foreground/60 hover:text-foreground/80"
                >
                  {copiedCode === codeId ? '✓ Copied' : 'Copy'}
                </button>
              )}
            </div>
            <SyntaxHighlighter style={oneDark} language={language} PreTag="div" className="!m-0 !bg-transparent" customStyle={{ padding: '1rem', fontSize: '0.9rem' }}>
              {code}
            </SyntaxHighlighter>
          </div>
        );
      }

      return (
        <code className="font-mono bg-muted/60 rounded px-1.5 py-0.5 text-sm text-foreground/90 border border-border/30" {...props}>
          {children}
        </code>
      );
    },
    img: ({ src, alt, ...props }: any) => (
      <div className="my-6 flex justify-center">
        <img src={src} alt={alt} className="max-w-full h-auto rounded-lg shadow-md border border-border/30" loading="lazy" {...props} />
      </div>
    ),
  };

  // preprocess content
  const processed = normalizeContent(content || '');

  return (
    <div className="flex gap-6">
      {/* optional ToC */}
      {showToc && toc.length > 0 && (
        <div className="hidden lg:block flex-shrink-0 w-56">
          <div className="sticky top-6">
            <h3 className="text-sm font-semibold text-foreground/80 mb-3 uppercase">Contents</h3>
            <nav className="space-y-2">
              {toc.map((item, i) => (
                <button key={i} onClick={() => scrollToHeading(item.element)} className="block text-left text-sm truncate text-foreground/80 hover:text-primary">
                  {item.text}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div ref={contentRef} className={`flex-1 prose prose-lg dark:prose-invert max-w-none font-sans leading-relaxed tracking-[0.01em] ${maxHeight !== 'none' ? 'overflow-y-auto' : ''} ${className}`} style={{ maxHeight }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks, [remarkToc, { tight: true }]]}
          rehypePlugins={[rehypeRaw]}
          components={components}
        >
          {processed}
        </ReactMarkdown>
      </div>
    </div>
  );
}
