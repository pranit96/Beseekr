import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        skipHtml={false}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-4 text-foreground">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mb-3 text-foreground">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mb-2 text-foreground">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mb-3 text-foreground/90 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-3 space-y-1 text-foreground/90">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-3 space-y-1 text-foreground/90">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="ml-4 text-foreground/90">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground/90">{children}</em>
          ),
          hr: () => <hr className="my-4 border-border" />,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/70 pl-4 italic text-muted-foreground my-3">
              {children}
            </blockquote>
          ),

          // ✅ FIXED: Strongly type the code component to accept "inline"
          code({
            inline,
            className,
            children,
            ...props
          }: {
            inline?: boolean;
            className?: string;
            children: React.ReactNode;
          }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match?.[1]?.toLowerCase();
            let codeContent = String(children).trim();

            if (inline) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-muted text-primary font-mono text-sm">
                  {codeContent}
                </code>
              );
            }

            // 🧠 Auto-detect code type
            const looksLikeJSON = !language && /^[\{\[].*[\}\]]$/s.test(codeContent);
            const looksLikeHTML = !language && /^<[^>]+>/.test(codeContent);
            const looksLikeYAML = !language && /^[A-Za-z0-9_-]+:/.test(codeContent);
            const looksLikeSQL = !language && /(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)/i.test(codeContent);
            const looksLikeBash = !language && /^\$|^#|^echo /.test(codeContent);

            let detectedLang =
              language ||
              (looksLikeJSON
                ? 'json'
                : looksLikeHTML
                ? 'html'
                : looksLikeYAML
                ? 'yaml'
                : looksLikeSQL
                ? 'sql'
                : looksLikeBash
                ? 'bash'
                : 'text');

            // 🧾 Pretty-print JSON
            if (detectedLang === 'json') {
              try {
                const parsed = JSON.parse(codeContent);
                codeContent = JSON.stringify(parsed, null, 2);
              } catch {
                /* leave invalid JSON as-is */
              }
            }

            return (
              <div className="relative group my-4">
                <button
                  onClick={() => handleCopy(codeContent)}
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/60 backdrop-blur-sm p-1 rounded-md border border-border text-xs hover:bg-background/90"
                  title="Copy code"
                >
                  <Copy
                    className={`w-3.5 h-3.5 ${
                      copiedCode === codeContent ? 'text-green-500' : 'text-muted-foreground'
                    }`}
                  />
                </button>

                <SyntaxHighlighter
                  language={detectedLang}
                  style={oneDark}
                  PreTag="div"
                  wrapLongLines
                  className="rounded-lg !bg-muted/50 !p-3 font-mono text-sm overflow-x-auto max-h-[400px]"
                  {...props}
                >
                  {codeContent}
                </SyntaxHighlighter>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
