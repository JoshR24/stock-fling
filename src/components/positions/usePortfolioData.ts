
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { PortfolioData } from "./types";

export const usePortfolioData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: portfolioData, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: positions, error: positionsError } = await supabase
        .from('paper_trading_positions')
        .select('*')
        .eq('user_id', user.id);

      if (positionsError) throw positionsError;

      if (!positions || positions.length === 0) {
        return { positions: [], stockPrices: [] };
      }

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
    staleTime: 30000, // Data stays fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache data for 5 minutes
    refetchOnMount: false, // Don't refetch on mount if data is fresh
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  useEffect(() => {
    if (!portfolioData?.positions.length) return;

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
