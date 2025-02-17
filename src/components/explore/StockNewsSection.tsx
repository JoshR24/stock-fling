
import { Stock } from "@/lib/mockStocks";
import { ExternalLink } from "lucide-react";

interface StockNewsSectionProps {
  stocks: Stock[];
}

export const StockNewsSection = ({ stocks }: StockNewsSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Recent News</h3>
      {stocks?.map(stock => stock.news?.map((article) => (
        <div key={`${stock.symbol}-${article.title}`} className="border-b border-border pb-4">
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="group flex items-start gap-1 hover:text-primary transition-colors"
            onClick={(e) => {
              if (!article.url) {
                e.preventDefault();
                console.warn('No URL available for this article');
                return;
              }
              window.open(article.url, '_blank', 'noopener,noreferrer');
              e.preventDefault();
            }}
          >
            <h4 className="font-medium mb-1 flex-1">{article.title}</h4>
            <ExternalLink className="h-4 w-4 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
          {article.summary && (
            <p className="text-sm text-muted-foreground mb-1">{article.summary}</p>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(article.date).toLocaleDateString()}
          </span>
        </div>
      )))}
    </div>
  );
};
