
import { useEffect, useState } from "react";
import { Stock } from "@/lib/mockStocks";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StockSearch } from "@/components/explore/StockSearch";
import { StockCategories } from "@/components/explore/StockCategories";
import { AIRecommendations } from "@/components/explore/AIRecommendations";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

const Explore = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stockData } = useQuery({
    queryKey: ['exploreStocks', selectedCategory],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('stock_data_cache')
          .select('*')
          .limit(10);

        if (error) throw error;

        return data.map(item => {
          const stockInfo = item.data as any; // Type assertion since we can't modify types.ts
          return {
            symbol: item.symbol,
            name: stockInfo.name || 'Unknown',
            price: stockInfo.price || 0,
            change: stockInfo.change || 0
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

  return (
    <div className="h-full">
      <StockSearch />
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          <StockCategories selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
          <AIRecommendations />
          <div className="grid grid-cols-1 gap-4">
            {stockData?.map(stock => (
              <div key={stock.symbol} className="p-4 border rounded-md shadow-md">
                <h2 className="text-lg font-bold">{stock.name} ({stock.symbol})</h2>
                <p>Price: ${stock.price.toFixed(2)}</p>
                <p>Change: {stock.change.toFixed(2)}%</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Explore;
