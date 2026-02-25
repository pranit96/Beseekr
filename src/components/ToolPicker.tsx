import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { ToolDefinition } from '@/types/agent';
import {
    FileText,
    FileOutput,
    Mail,
    Search,
    MessageSquare,
    Database,
    Loader2,
    Wrench,
    FileSpreadsheet,
    FileType,
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

const TOOL_COLORS: Record<string, string> = {
    parse_document: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-400/50',
    generate_pdf: 'from-red-500/20 to-red-600/10 border-red-500/30 hover:border-red-400/50',
    send_email: 'from-green-500/20 to-green-600/10 border-green-500/30 hover:border-green-400/50',
    web_search: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 hover:border-purple-400/50',
    search_reddit: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 hover:border-orange-400/50',
    search_knowledge: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 hover:border-cyan-400/50',
    generate_docx: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 hover:border-indigo-400/50',
    generate_spreadsheet: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-400/50',
    scrape_url: 'from-violet-500/20 to-violet-600/10 border-violet-500/30 hover:border-violet-400/50',
    analyze_data: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 hover:border-amber-400/50',
    summarize_text: 'from-sky-500/20 to-sky-600/10 border-sky-500/30 hover:border-sky-400/50',
    translate_text: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 hover:border-rose-400/50',
};

const TOOL_ICON_COLORS: Record<string, string> = {
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

interface ToolPickerProps {
    selectedTools: string[];
    onChange: (tools: string[]) => void;
}

export function ToolPicker({ selectedTools, onChange }: ToolPickerProps) {
    const [tools, setTools] = useState<ToolDefinition[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTools() {
            try {
                const res = await apiClient.getTools();
                if (res.success && res.data) {
                    setTools(res.data);
                }
            } catch (err) {
                console.error('Failed to fetch tools:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchTools();
    }, []);

    const toggleTool = (toolName: string) => {
        if (selectedTools.includes(toolName)) {
            onChange(selectedTools.filter((t) => t !== toolName));
        } else {
            onChange([...selectedTools, toolName]);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading tools...
            </div>
        );
    }

    if (!tools.length) return null;

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Agent Tools</span>
                {selectedTools.length > 0 && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        {selectedTools.length} active
                    </span>
                )}
            </div>
            <p className="text-xs text-muted-foreground">
                Enable tools to let this agent perform real actions — search the web, send emails, create documents, analyze data, and more.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tools.map((tool) => {
                    const isSelected = selectedTools.includes(tool.name);
                    const Icon = TOOL_ICONS[tool.name] || Wrench;
                    const colorClass = TOOL_COLORS[tool.name] || 'from-gray-500/20 to-gray-600/10 border-gray-500/30 hover:border-gray-400/50';
                    const iconColor = TOOL_ICON_COLORS[tool.name] || 'text-gray-400';

                    return (
                        <button
                            key={tool.name}
                            type="button"
                            onClick={() => toggleTool(tool.name)}
                            className={`
                relative flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 text-left
                bg-gradient-to-br ${colorClass}
                ${isSelected
                                    ? 'ring-2 ring-primary/40 shadow-md shadow-primary/5'
                                    : 'opacity-60 hover:opacity-90'
                                }
              `}
                        >
                            {/* Selection indicator */}
                            <div className={`
                absolute top-2 right-2 w-4 h-4 rounded-full border-2 transition-all
                ${isSelected
                                    ? 'bg-primary border-primary scale-100'
                                    : 'border-muted-foreground/40 scale-90'
                                }
              `}>
                                {isSelected && (
                                    <svg className="w-full h-full text-primary-foreground" viewBox="0 0 16 16" fill="none">
                                        <path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>

                            <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 pr-5">
                                <div className="text-sm font-medium text-foreground leading-tight">
                                    {tool.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                    {tool.description.length > 80
                                        ? tool.description.substring(0, 80) + '…'
                                        : tool.description}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
