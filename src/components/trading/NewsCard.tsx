import { Newspaper, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsItem {
  id: string;
  title: string;
  content?: string;
  source: string;
  url: string;
  published_at: string;
  sentiment_score?: number;
  sentiment_label?: string;
}

interface NewsCardProps {
  news: NewsItem;
  onClick?: () => void;
}

export function NewsCard({ news, onClick }: NewsCardProps) {
  const getSentimentIcon = () => {
    if (!news.sentiment_score) return Minus;
    if (news.sentiment_score > 0.2) return TrendingUp;
    if (news.sentiment_score < -0.2) return TrendingDown;
    return Minus;
  };

  const getSentimentColor = () => {
    if (!news.sentiment_score) return "text-muted-foreground";
    if (news.sentiment_score > 0.2) return "text-green-500";
    if (news.sentiment_score < -0.2) return "text-red-500";
    return "text-muted-foreground";
  };

  const SentimentIcon = getSentimentIcon();
  const timeAgo = getTimeAgo(news.published_at);

  return (
    <div
      onClick={onClick}
      className="bg-muted rounded-lg p-4 hover:bg-slate-750 transition-colors cursor-pointer border border-border"
    >
      <div className="flex items-start gap-3">
        <Newspaper className="h-5 w-5 text-blue-400 flex-shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-white font-medium line-clamp-2">
              {news.title}
            </h3>
            <SentimentIcon
              className={cn("h-4 w-4 flex-shrink-0", getSentimentColor())}
            />
          </div>

          {news.content && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {news.content}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{news.source}</span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString();
}
