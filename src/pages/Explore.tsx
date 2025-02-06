
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

  return (
    <div className="h-full">
      <StockSearch />
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          <StockCategories 
            selectedCategory={selectedCategory || ""} 
            onSelectCategory={(category) => setSelectedCategory(category)} 
          />
          <AIRecommendations onStockSelect={handleStockSelect} />
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Latest Market News</h2>
            {stockData?.map(stock => stock.news?.map((newsItem, index) => (
              <Card key={`${stock.symbol}-${index}`} className="p-4">
                <h3 className="font-medium">{newsItem.title}</h3>
                <div className="text-sm text-muted-foreground mt-1">
                  <span>{newsItem.source}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(newsItem.date).toLocaleDateString()}</span>
                </div>
                <a 
                  href={newsItem.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:text-blue-600 mt-2 block"
                >
                  Read more
                </a>
              </Card>
            )))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Explore;
