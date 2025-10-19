import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { createLogger } from '@/services/logging';

const logger = createLogger('useDownload');

interface DownloadOptions {
  filename?: string;
  format?: 'markdown' | 'pdf' | 'html' | 'json' | 'text';
}

export const useDownload = () => {
  const [isConverting, setIsConverting] = useState(false);

  const downloadFile = async (
    content: string,
    originalFormat: string,
    options: DownloadOptions = {}
  ) => {
    const { filename = `analysis-${Date.now()}`, format = originalFormat as any } = options;
    
    try {
      setIsConverting(true);
      
      // If same format, download directly
      if (format === originalFormat) {
        const blob = new Blob([content], { 
          type: getMimeType(originalFormat) 
        });
        downloadBlob(blob, `${filename}.${getFileExtension(originalFormat)}`);
        return;
      }

      // Convert to requested format
      let convertedContent = content;
      let finalFormat = format;
      
      // Handle JSON conversion
      if (format === 'json') {
        try {
          // If content is already JSON, parse and re-stringify
          if (originalFormat === 'json') {
            convertedContent = JSON.stringify(JSON.parse(content), null, 2);
          } else {
            // Wrap markdown/text in JSON structure
            convertedContent = JSON.stringify({
              content,
              originalFormat,
              convertedAt: new Date().toISOString()
            }, null, 2);
          }
        } catch (e) {
          // If parsing fails, wrap as string
          convertedContent = JSON.stringify({ content }, null, 2);
        }
      }
      
      // Handle HTML conversion
      if (format === 'html') {
        if (originalFormat === 'markdown') {
          // Simple markdown to HTML (you can enhance this with a proper library)
          convertedContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>${filename}</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }
                h1, h2, h3 { color: #1a1a1a; margin-top: 1.5rem; }
                code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 4px; }
                pre { background: #f5f5f5; padding: 1rem; border-radius: 8px; overflow-x: auto; }
                blockquote { border-left: 4px solid #ddd; padding-left: 1rem; margin-left: 0; color: #666; }
              </style>
            </head>
            <body>
              ${markdownToHtml(content)}
            </body>
            </html>
          `;
        } else {
          // Wrap non-markdown content in basic HTML
          convertedContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>${filename}</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; white-space: pre-wrap; }
              </style>
            </head>
            <body>
              ${content}
            </body>
            </html>
          `;
        }
        finalFormat = 'html';
      }
      
      // Handle plain text conversion
      if (format === 'text') {
        if (originalFormat === 'json') {
          try {
            const parsed = JSON.parse(content);
            // Extract main content if it exists
            convertedContent = parsed.content || JSON.stringify(parsed, null, 2);
          } catch {
            convertedContent = content;
          }
        }
        // For markdown, we could strip markdown syntax but keeping as-is for simplicity
        finalFormat = 'text';
      }
      
      // Handle PDF conversion (client-side using browser print)
      if (format === 'pdf') {
        // Create a hidden iframe for PDF generation
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) throw new Error('Could not create PDF document');
        
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>${filename}</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                line-height: 1.6; 
                padding: 2rem; 
                color: #1a1a1a;
              }
              h1, h2, h3 { margin-top: 1.5rem; }
              code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 4px; }
              pre { background: #f5f5f5; padding: 1rem; border-radius: 8px; overflow-x: auto; }
            </style>
          </head>
          <body>
            ${originalFormat === 'markdown' ? markdownToHtml(content) : `<pre>${content}</pre>`}
          </body>
          </html>
        `);
        doc.close();
        
        // Trigger print to PDF
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          document.body.removeChild(iframe);
          setIsConverting(false);
        }, 500);
        return;
      }
      
      // Download converted content
      const blob = new Blob([convertedContent], { 
        type: getMimeType(finalFormat) 
      });
      downloadBlob(blob, `${filename}.${getFileExtension(finalFormat)}`);
      logger.info('File downloaded successfully', { filename, format: finalFormat });
      
    } catch (error) {
      logger.error('Download failed', { error, filename, format });
      toast({
        title: 'Download failed',
        description: 'Could not convert/download the file. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsConverting(false);
    }
  };

  return { downloadFile, isConverting };
};

// Helper functions
const getMimeType = (format: string): string => {
  const mimeTypes: Record<string, string> = {
    markdown: 'text/markdown',
    md: 'text/markdown',
    pdf: 'application/pdf',
    html: 'text/html',
    json: 'application/json',
    text: 'text/plain',
    txt: 'text/plain'
  };
  return mimeTypes[format] || 'text/plain';
};

const getFileExtension = (format: string): string => {
  const extensions: Record<string, string> = {
    markdown: 'md',
    html: 'html',
    json: 'json',
    text: 'txt',
    pdf: 'pdf'
  };
  return extensions[format] || format;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  toast({
    title: 'Downloaded',
    description: `${filename} has been downloaded`
  });
};

// Simple markdown to HTML converter (basic implementation)
const markdownToHtml = (markdown: string): string => {
  let html = markdown
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/<\/li>\s*<li>/g, '</li><li>')
    .replace(/^-/g, '<ul>')
    .replace(/<\/li>/g, '</li></ul>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  
  // Fix multiple <ul> tags
  html = html.replace(/<\/ul>\s*<ul>/g, '');
  
  return html;
};