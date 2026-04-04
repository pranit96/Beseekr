import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Quote as QuoteIcon, ThumbsUp } from "lucide-react";
import type { Quote } from "@/types/problems";

interface QuoteListProps {
  quotes: Quote[];
  title?: string;
  maxItems?: number;
}

export function QuoteList({
  quotes,
  title = "Top Quotes",
  maxItems,
}: QuoteListProps) {
  if (!quotes || quotes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <QuoteIcon className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No quotes available</p>
        </CardContent>
      </Card>
    );
  }

  const displayQuotes = maxItems ? quotes.slice(0, maxItems) : quotes;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <QuoteIcon className="h-4 w-4" />
          {title} ({quotes.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {displayQuotes.map((quote) => (
            <li key={quote.id} className="border-l-2 border-primary pl-3">
              <blockquote className="text-sm italic text-foreground">
                "{quote.text}"
              </blockquote>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{quote.source}</span>
                {quote.author && <span>— {quote.author}</span>}
                {quote.upvotes !== undefined && (
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    {quote.upvotes}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default QuoteList;
