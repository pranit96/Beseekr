// src/components/ExportChatDialog.tsx
import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Download, Check, FileText, FileCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage } from '@/types/agent';

interface ExportChatDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    messages: ChatMessage[];
    conversationTitle?: string;
}

function formatMessagesAsMarkdown(messages: ChatMessage[], title?: string): string {
    const lines: string[] = [];
    lines.push(`# ${title || 'Chat Export'}`);
    lines.push(`*Exported on ${new Date().toLocaleString()}*`);
    lines.push('');
    lines.push('---');
    lines.push('');

    for (const msg of messages) {
        if (msg.type === 'user') {
            lines.push('## 🧑 You');
            lines.push('');
            lines.push(msg.content);
            lines.push('');
        } else if (msg.type === 'agent' && msg.agentResponses) {
            for (const resp of msg.agentResponses) {
                lines.push(`## 🤖 ${resp.agentName}`);
                if (resp.metadata?.domain) {
                    lines.push(`*Domain: ${resp.metadata.domain}*`);
                }
                lines.push('');
                lines.push(resp.content || '*No response*');
                lines.push('');
                if (resp.metadata?.usage?.total_tokens) {
                    lines.push(`> Tokens: ${resp.metadata.usage.total_tokens}`);
                    lines.push('');
                }
            }
        }
        lines.push('---');
        lines.push('');
    }

    return lines.join('\n');
}

function formatMessagesAsText(messages: ChatMessage[]): string {
    const lines: string[] = [];

    for (const msg of messages) {
        if (msg.type === 'user') {
            lines.push(`You: ${msg.content}`);
            lines.push('');
        } else if (msg.type === 'agent' && msg.agentResponses) {
            for (const resp of msg.agentResponses) {
                lines.push(`${resp.agentName}: ${resp.content || '(no response)'}`);
                lines.push('');
            }
        }
    }

    return lines.join('\n');
}

export const ExportChatDialog: React.FC<ExportChatDialogProps> = ({
    open,
    onOpenChange,
    messages,
    conversationTitle,
}) => {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleCopyMarkdown = async () => {
        const md = formatMessagesAsMarkdown(messages, conversationTitle);
        await navigator.clipboard.writeText(md);
        setCopied(true);
        toast({ title: 'Copied!', description: 'Full conversation copied as Markdown.' });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyPlainText = async () => {
        const text = formatMessagesAsText(messages);
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast({ title: 'Copied!', description: 'Full conversation copied as plain text.' });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadMarkdown = () => {
        const md = formatMessagesAsMarkdown(messages, conversationTitle);
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(conversationTitle || 'chat-export').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: 'Downloaded!', description: 'Chat saved as Markdown file.' });
    };

    const handleDownloadJSON = () => {
        const data = {
            title: conversationTitle || 'Chat Export',
            exported_at: new Date().toISOString(),
            message_count: messages.length,
            messages: messages.map(msg => ({
                type: msg.type,
                content: msg.content,
                timestamp: msg.timestamp,
                ...(msg.type === 'agent' && msg.agentResponses ? {
                    agent_responses: msg.agentResponses.map(r => ({
                        agent_name: r.agentName,
                        content: r.content,
                        status: r.status,
                        tokens: r.metadata?.usage?.total_tokens,
                    })),
                } : {}),
            })),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(conversationTitle || 'chat-export').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: 'Downloaded!', description: 'Chat saved as JSON file.' });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Download className="w-5 h-5 text-primary" />
                        Export Conversation
                    </DialogTitle>
                    <DialogDescription>
                        {messages.length} messages · {conversationTitle || 'Untitled Chat'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 pt-2">
                    {/* Copy Section */}
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Copy to Clipboard</p>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                className="h-auto py-3 flex flex-col items-center gap-1.5"
                                onClick={handleCopyMarkdown}
                            >
                                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                                <span className="text-xs font-medium">Copy as Markdown</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-auto py-3 flex flex-col items-center gap-1.5"
                                onClick={handleCopyPlainText}
                            >
                                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                                <span className="text-xs font-medium">Copy as Text</span>
                            </Button>
                        </div>
                    </div>

                    {/* Download Section */}
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Download File</p>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                className="h-auto py-3 flex flex-col items-center gap-1.5"
                                onClick={handleDownloadMarkdown}
                            >
                                <FileText className="w-5 h-5 text-blue-500" />
                                <span className="text-xs font-medium">.md Markdown</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-auto py-3 flex flex-col items-center gap-1.5"
                                onClick={handleDownloadJSON}
                            >
                                <FileCode className="w-5 h-5 text-amber-500" />
                                <span className="text-xs font-medium">.json Data</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ExportChatDialog;
