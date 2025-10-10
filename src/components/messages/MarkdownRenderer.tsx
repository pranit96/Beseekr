import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkToc from 'remark-toc';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'highlight.js/styles/github-dark.css';

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

  // Generate Table of Contents from headings
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

  // Define proper types for ReactMarkdown components
  const components = {
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className="mb-6 text-foreground/95 leading-8 text-base" {...props}>
        {children}
      </p>
    ),
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1
        className="text-3xl font-bold mt-10 mb-6 pb-3 border-b border-border/40 text-foreground"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2
        className="text-2xl font-semibold mt-10 mb-5 pb-2 border-b border-border/30 text-foreground"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 className="text-xl font-semibold mt-8 mb-4 text-foreground/90" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h4 className="text-lg font-semibold mt-6 mb-3 text-foreground/85" {...props}>
        {children}
      </h4>
    ),
    ul: ({ children, depth = 0, ...props }: any) => (
      <ul 
        className={`list-disc space-y-2 mb-6 text-foreground/90 ${
          depth > 0 ? 'pl-4' : 'pl-6'
        }`} 
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, depth = 0, ...props }: any) => (
      <ol 
        className={`list-decimal space-y-2 mb-6 text-foreground/90 ${
          depth > 0 ? 'pl-4' : 'pl-6'
        }`} 
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }: React.LiHTMLAttributes<HTMLLIElement>) => (
      <li className="leading-7 mb-1" {...props}>
        {children}
      </li>
    ),
    strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <strong className="font-bold text-foreground" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <em className="italic text-foreground/90" {...props}>
        {children}
      </em>
    ),
    a: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a
        href={href}
        className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors duration-200"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
    blockquote: ({ children, ...props }: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
      <blockquote
        className="border-l-4 border-primary/70 pl-6 py-2 my-6 bg-muted/30 italic text-foreground/80 rounded-r-lg"
        {...props}
      >
        {children}
      </blockquote>
    ),
    hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => (
      <hr className="my-8 border-border/40" {...props} />
    ),
    table: ({ children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
      <div className="overflow-x-auto my-6 rounded-lg border border-border/40">
        <table className="min-w-full divide-y divide-border/40" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
      <thead className="bg-muted/50" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
      <tbody className="divide-y divide-border/40" {...props}>
        {children}
      </tbody>
    ),
    th: ({ children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
      <th
        className="px-4 py-3 text-left text-sm font-semibold text-foreground bg-muted/30"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
      <td className="px-4 py-3 text-sm text-foreground/90" {...props}>
        {children}
      </td>
    ),
    code: ({ 
      children, 
      className, 
      ...props 
    }: React.HTMLAttributes<HTMLElement> & { className?: string }) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const code = String(children).replace(/\n$/, '');
      const codeId = Math.random().toString(36).substring(7);

      if (language) {
        return (
          <div className="relative my-6 rounded-lg overflow-hidden border border-border/40">
            <div className="flex justify-between items-center px-4 py-2 bg-muted/40 border-b border-border/30">
              <span className="text-xs font-mono text-foreground/70 uppercase">
                {language}
              </span>
              {enableCopy && (
                <button
                  onClick={() => copyToClipboard(code, codeId)}
                  className="flex items-center gap-1 text-xs text-foreground/60 hover:text-foreground/80 transition-colors duration-200"
                >
                  {copiedCode === codeId ? (
                    <>
                      <span>✓ Copied</span>
                    </>
                  ) : (
                    <>
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <SyntaxHighlighter
              style={oneDark}
              language={language}
              PreTag="div"
              className="!m-0 !bg-transparent"
              customStyle={{
                padding: '1rem',
                fontSize: '0.875rem',
                lineHeight: '1.5',
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        );
      }

      return (
        <code
          className="font-mono bg-muted/60 rounded px-1.5 py-0.5 text-sm text-foreground/90 border border-border/30"
          {...props}
        >
          {children}
        </code>
      );
    },
    img: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
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

  return (
    <div className="flex gap-8">
      {/* Table of Contents */}
      {showToc && toc.length > 0 && (
        <div className="hidden lg:block flex-shrink-0 w-64">
          <div className="sticky top-4">
            <h3 className="text-sm font-semibold text-foreground/80 mb-3 uppercase tracking-wide">
              Table of Contents
            </h3>
            <nav className="space-y-2">
              {toc.map((item, index) => (
                <button
                  key={index}
                  onClick={() => scrollToHeading(item.element)}
                  className={`block w-full text-left text-sm hover:text-primary transition-colors duration-200 truncate ${
                    item.level === 1 
                      ? 'font-medium text-foreground/90' 
                      : item.level === 2 
                      ? 'font-normal text-foreground/80 ml-2' 
                      : 'font-light text-foreground/70 ml-4'
                  }`}
                >
                  {item.text}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div 
        ref={contentRef}
        className={`flex-1 prose prose-lg dark:prose-invert max-w-none font-sans leading-relaxed tracking-[0.01em] ${
          maxHeight !== 'none' ? 'overflow-y-auto' : ''
        } ${className}`}
        style={{ maxHeight }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm, [remarkToc, { tight: true }]]}
          rehypePlugins={[rehypeHighlight, rehypeRaw]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}