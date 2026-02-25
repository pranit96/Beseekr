import { useState, useEffect } from 'react';
import {
    FileText,
    FileOutput,
    Mail,
    Search,
    MessageSquare,
    Database,
    Wrench,
    Loader2,
    CheckCircle2,
    XCircle,
    FileType,
    FileSpreadsheet,
    Globe,
    BarChart3,
    AlignLeft,
    Languages,
} from 'lucide-react';

const TOOL_ICONS: Record<string, React.ElementType> = {
    parse_document: FileText,
    generate_pdf: FileOutput,
    send_email: Mail,
    web_search: Search,
    search_reddit: MessageSquare,
    search_knowledge: Database,
    generate_docx: FileType,
    generate_spreadsheet: FileSpreadsheet,
    scrape_url: Globe,
    analyze_data: BarChart3,
    summarize_text: AlignLeft,
    translate_text: Languages,
};

const TOOL_LABELS: Record<string, string> = {
    parse_document: 'Parsing document',
    generate_pdf: 'Generating PDF',
    send_email: 'Sending email',
    web_search: 'Searching the web',
    search_reddit: 'Searching Reddit',
    search_knowledge: 'Searching knowledge base',
    generate_docx: 'Creating Word document',
    generate_spreadsheet: 'Creating spreadsheet',
    scrape_url: 'Scraping webpage',
    analyze_data: 'Analyzing data',
    summarize_text: 'Summarizing text',
    translate_text: 'Translating text',
};

const TOOL_COLORS: Record<string, string> = {
    parse_document: 'text-blue-400',
    generate_pdf: 'text-red-400',
    send_email: 'text-green-400',
    web_search: 'text-purple-400',
    search_reddit: 'text-orange-400',
    search_knowledge: 'text-cyan-400',
    generate_docx: 'text-indigo-400',
    generate_spreadsheet: 'text-emerald-400',
    scrape_url: 'text-violet-400',
    analyze_data: 'text-amber-400',
    summarize_text: 'text-sky-400',
    translate_text: 'text-rose-400',
};

interface ToolExecution {
    callId: string;
    toolName: string;
    status: 'running' | 'success' | 'error';
    executionTimeMs?: number;
}

interface ToolExecutionIndicatorProps {
    executions: ToolExecution[];
}

export function ToolExecutionIndicator({ executions }: ToolExecutionIndicatorProps) {
    if (!executions.length) return null;

    return (
        <div className="flex flex-col gap-1.5 py-2 px-3 rounded-lg bg-muted/30 border border-border/40 mb-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <Wrench className="w-3 h-3" />
                <span>Agent using tools</span>
            </div>
            {executions.map((exec) => {
                const Icon = TOOL_ICONS[exec.toolName] || Wrench;
                const label = TOOL_LABELS[exec.toolName] || exec.toolName.replace(/_/g, ' ');
                const color = TOOL_COLORS[exec.toolName] || 'text-muted-foreground';

                return (
                    <div
                        key={exec.callId}
                        className="flex items-center gap-2 text-xs"
                    >
                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                        <span className="text-foreground/80">{label}</span>
                        {exec.status === 'running' && (
                            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-auto" />
                        )}
                        {exec.status === 'success' && (
                            <span className="flex items-center gap-1 ml-auto text-green-500">
                                <CheckCircle2 className="w-3 h-3" />
                                {exec.executionTimeMs && (
                                    <span className="text-muted-foreground">{exec.executionTimeMs}ms</span>
                                )}
                            </span>
                        )}
                        {exec.status === 'error' && (
                            <span className="flex items-center gap-1 ml-auto text-destructive">
                                <XCircle className="w-3 h-3" />
                                <span>Failed</span>
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// Hook to track tool executions from socket events
export function useToolExecutions(socket: any) {
    const [executions, setExecutions] = useState<ToolExecution[]>([]);

    useEffect(() => {
        if (!socket) return;

        const handleToolStart = (data: { call_id: string; tool_name: string }) => {
            setExecutions((prev) => [
                ...prev,
                {
                    callId: data.call_id,
                    toolName: data.tool_name,
                    status: 'running',
                },
            ]);
        };

        const handleToolResult = (data: {
            call_id: string;
            tool_name: string;
            success: boolean;
            execution_time_ms?: number;
        }) => {
            setExecutions((prev) =>
                prev.map((ex) =>
                    ex.callId === data.call_id
                        ? {
                            ...ex,
                            status: data.success ? 'success' : 'error',
                            executionTimeMs: data.execution_time_ms,
                        }
                        : ex
                )
            );
        };

        socket.on('orchestration:tool_start', handleToolStart);
        socket.on('orchestration:tool_result', handleToolResult);

        return () => {
            socket.off('orchestration:tool_start', handleToolStart);
            socket.off('orchestration:tool_result', handleToolResult);
        };
    }, [socket]);

    const clearExecutions = () => setExecutions([]);

    return { executions, clearExecutions };
}
