
import { useEffect, useState } from "react";
import { Stock } from "@/lib/mockStocks";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StockSearch } from "@/components/explore/StockSearch";
import { StockCategories } from "@/components/explore/StockCategories";
import { AIRecommendations } from "@/components/explore/AIRecommendations";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StockDetailView } from "@/components/recommendations/StockDetailView";

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  news?: {
    title: string;
    url: string;
    source: string;
    date: string;
    summary?: string;
  }[];
}

const Explore = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  const { data: stockData } = useQuery({
    queryKey: ['exploreStocks', selectedCategory],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('stock_data_cache')
          .select('*')
          .limit(5);

        if (error) throw error;

        return data.map(item => {
          const stockInfo = item.data as any;
          return {
            symbol: item.symbol,
            name: stockInfo.name || 'Unknown',
            price: stockInfo.price || 0,
            change: stockInfo.change || 0,
            news: stockInfo.news || []
          } as StockData;
        });
      } catch (error) {
        console.error('Error fetching stocks:', error);
        toast({
          title: "Error",
          description: "Failed to fetch stocks. Please try again later.",
          variant: "destructive",
        });
        return [];
      }
    },
    refetchInterval: 60000 // Refetch every minute
  });

  // Set up real-time listener for stock updates
  useEffect(() => {
    const channel = supabase
      .channel('stock-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stock_data_cache'
        },
        (payload) => {
          console.log('Received stock update:', payload);
          queryClient.invalidateQueries({ queryKey: ['exploreStocks'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleStockSelect = (symbol: string) => {
    setSelectedStock(symbol);
  };

  const handleBackClick = () => {
    setSelectedStock(null);
  };

  const handleAddToPortfolio = async (symbol: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add stocks to your portfolio.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('portfolios')
        .insert({
          user_id: user.id,
          symbol: symbol
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Stock added to portfolio successfully.",
      });
    } catch (error) {
      console.error('Error adding stock to portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to add stock to portfolio.",
        variant: "destructive",
      });
    }
  };

  // Find the full stock data for the selected stock
  const selectedStockData = stockData?.find(s => s.symbol === selectedStock);
  const stockForDetail = selectedStockData ? {
    id: selectedStockData.symbol,
    symbol: selectedStockData.symbol,
    name: selectedStockData.name,
    price: selectedStockData.price,
    change: selectedStockData.change,
    chartData: [], // You'll need to fetch this data
    news: selectedStockData.news || []
  } as Stock : null;

  return (
    <div className="h-full">
      {selectedStock && stockForDetail ? (
        <StockDetailView
          stock={stockForDetail}
          onClose={handleBackClick}
          onAddToPortfolio={handleAddToPortfolio}
          onSwipe={() => {}} // No-op since we don't need swipe functionality here
        />
      ) : (
        <>
          <StockSearch onSelect={handleStockSelect} />
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <StockCategories 
                selectedCategory={selectedCategory || ""} 
                onSelectCategory={(category) => setSelectedCategory(category)} 
              />
              <AIRecommendations onStockSelect={handleStockSelect} />
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Recent News</h3>
                {stockData?.map(stock => stock.news?.map((article) => (
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
                      {article.source}
                      <span className="mx-2">•</span>
                      {new Date(article.date).toLocaleDateString()}
                    </span>
                  </div>
                )))}
              </div>
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
};

export default Explore;
