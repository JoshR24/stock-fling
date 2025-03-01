import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { PortfolioData } from "./types";

const isMarketOpen = (): boolean => {
  // Get current time in New York (ET)
  const now = new Date();
  const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  
  const day = nyTime.getDay();
  const hours = nyTime.getHours();
  const minutes = nyTime.getMinutes();
  const currentTimeInMinutes = hours * 60 + minutes;
  
  // Market hours: Monday (1) to Friday (5), 9:30 AM to 4:00 PM ET
  const marketOpenInMinutes = 9 * 60 + 30;  // 9:30 AM
  const marketCloseInMinutes = 16 * 60;     // 4:00 PM
  
  return day >= 1 && day <= 5 && // Monday to Friday
         currentTimeInMinutes >= marketOpenInMinutes &&
         currentTimeInMinutes < marketCloseInMinutes;
};

export const usePortfolioData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: portfolioData, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get initial balance
      const { data: initialBalanceData, error: initialBalanceError } = await supabase
        .from('paper_trading_balances')
        .select('balance, created_at')
        .eq('user_id', user.id)
        .single();

      // Get positions
      const { data: positions, error: positionsError } = await supabase
        .from('paper_trading_positions')
        .select('*')
        .eq('user_id', user.id);

      if (positionsError) throw positionsError;

      if (!positions || positions.length === 0) {
        console.log('No positions found');
        return { positions: [], stockPrices: [] };
      }

      // Get current stock prices - only fetch real-time data during market hours
      const { data: stockData, error: pricesError } = await supabase
        .from('stock_data_cache')
        .select('*')
        .in('symbol', positions.map(p => p.symbol));

      if (pricesError) {
        toast({
          title: "Error fetching stock prices",
          description: "Please try again later",
          variant: "destructive",
        });
        throw pricesError;
      }

      const stockPrices = (stockData || []).map(item => {
        const stockInfo = item.data as any;
        return {
          symbol: item.symbol,
          currentPrice: stockInfo.price || 0,
          change: stockInfo.change || 0
        };
      });

      return {
        positions,
        stockPrices
      } as PortfolioData;
    },
    staleTime: isMarketOpen() ? 30000 : 1 * 60 * 60 * 1000, // 30s during market hours, 1 hour otherwise
    gcTime: 5 * 60 * 1000,
    refetchInterval: isMarketOpen() ? 60000 : false, // Only poll during market hours
    refetchOnMount: isMarketOpen(), // Only fetch new data on mount during market hours
    refetchOnWindowFocus: isMarketOpen(), // Only fetch on window focus during market hours
  });

  useEffect(() => {
    if (!portfolioData?.positions.length || !isMarketOpen()) return;

    const symbols = portfolioData.positions.map(p => p.symbol);
    const channel = supabase
      .channel('stock-price-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stock_data_cache',
          filter: `symbol=in.(${symbols.map(s => `'${s}'`).join(',')})`,
        },
        (payload) => {
          console.log('Received stock update:', payload);
          queryClient.invalidateQueries({ queryKey: ['portfolio'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [portfolioData?.positions.length, queryClient]);

  return { portfolioData, isLoading };
};
