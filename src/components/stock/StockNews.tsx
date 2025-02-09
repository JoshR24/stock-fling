
import { Stock } from "@/lib/mockStocks";
import { ExternalLink } from "lucide-react";

interface StockNewsProps {
  stock: Stock;
}

export const StockNews = ({ stock }: StockNewsProps) => {
  // Early return with a message if no news is available
  if (!stock.news || stock.news.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Recent News</h3>
        <p className="text-muted-foreground">No recent news available for {stock.symbol}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Recent News</h3>
      {stock.news.map((article) => (
        <div key={article.id} className="border-b border-border pb-4">
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
              // Open in new tab manually to ensure it works
              window.open(article.url, '_blank', 'noopener,noreferrer');
              e.preventDefault();
            }}
          >
            <h4 className="font-medium mb-1 flex-1">{article.title}</h4>
            <ExternalLink className="h-4 w-4 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
          <p className="text-sm text-muted-foreground mb-1">{article.summary}</p>
          <span className="text-xs text-muted-foreground">{article.date}</span>
        </div>
      ))}
    </div>
  );
};
