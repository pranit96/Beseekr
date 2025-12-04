import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Link as LinkIcon } from 'lucide-react';
import type { Source } from '@/types/problems';

interface SourceListProps {
    sources: Source[];
}

const sourceTypeColors: Record<string, string> = {
    reddit: 'bg-orange-500',
    hackernews: 'bg-amber-500',
    twitter: 'bg-sky-500',
    linkedin: 'bg-blue-600',
};

export function SourceList({ sources }: SourceListProps) {
    if (!sources || sources.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        Sources
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No sources available</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Sources ({sources.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {sources.map((source) => (
                        <li key={source.id} className="flex items-start gap-2">
                            <Badge
                                className={`shrink-0 text-xs text-white ${sourceTypeColors[source.type] || 'bg-gray-500'}`}
                            >
                                {source.type}
                            </Badge>
                            <div className="flex-1 min-w-0">
                                <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center gap-1"
                                >
                                    <span className="truncate">{source.title}</span>
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                </a>
                                {source.date && (
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(source.date).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

export default SourceList;
