import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Stock } from "@/lib/mockStocks";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  news?: {
    id: string;
    title: string;
    url: string;
    date: string;
    summary: string;
  }[];
  description: string;
}

const isMarketOpen = (): boolean => {
  const now = new Date();
  const day = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // Convert to ET (assuming server is in UTC)
  const etHours = (hours - 4 + 24) % 24; // Simple UTC to ET conversion (UTC-4)
  const currentTimeInMinutes = etHours * 60 + minutes;
  
  // Market hours: Monday (1) to Friday (5), 9:30 AM to 4:00 PM ET
  const marketOpenInMinutes = 9 * 60 + 30;  // 9:30 AM
  const marketCloseInMinutes = 16 * 60;     // 4:00 PM
  
  return day >= 1 && day <= 5 && // Monday to Friday
         currentTimeInMinutes >= marketOpenInMinutes &&
         currentTimeInMinutes < marketCloseInMinutes;
};

export const useExploreStocks = (selectedCategory: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
          const stockInfo = item.data as unknown as StockData;
          return {
            id: item.symbol,
            symbol: item.symbol,
            name: stockInfo.name || 'Unknown',
            price: stockInfo.price || 0,
            change: stockInfo.change || 0,
            description: stockInfo.description || `No description available for ${item.symbol}`,
            chartData: [], // Initialize with empty array if not available
            news: stockInfo.news?.map(n => ({
              id: n.id,
              title: n.title,
              summary: n.summary,
              date: n.date,
              url: n.url
            })) || []
          } as Stock;
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
    refetchInterval: isMarketOpen() ? 60000 : false // Only poll during market hours
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

  return { stockData };
};
