// src/components/messages/MarkdownRenderer.tsx
import React from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

interface Props {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<Props> = ({ content, className = '' }) => {
  const html = React.useMemo(() => {
    if (!content) return '';
    try {
      // marked.parse can have differing typings in some environments;
      // force to string for DOMPurify.sanitize
      const raw = (marked.parse(content) as unknown) as string;
      const sanitized = DOMPurify.sanitize(raw, { ADD_ATTR: ['target'] }) as string;
      return sanitized;
    } catch (err) {
      // fallback: sanitize plain text
      return DOMPurify.sanitize(String(content)) as string;
    }
  }, [content]);

  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default MarkdownRenderer;
