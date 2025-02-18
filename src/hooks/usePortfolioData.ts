
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { PortfolioData } from "@/components/positions/types";

export const usePortfolioData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: portfolioData, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get positions with a single query including all needed data
      const { data: positions, error: positionsError } = await supabase
        .from('paper_trading_positions')
        .select(`
          *,
          stock_data_cache (
            symbol,
            data
          )
        `)
        .eq('user_id', user.id);

      if (positionsError) throw positionsError;

      if (!positions || positions.length === 0) {
        return { positions: [], stockPrices: [] };
      }

      // Process the joined data
      const stockPrices = positions.map(position => {
        const stockInfo = position.stock_data_cache?.data || {};
        return {
          symbol: position.symbol,
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
    refetchInterval: 60000, // Refetch every minute instead of using real-time updates
  });

  // Optimize real-time updates to only listen for relevant symbols
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
          filter: `symbol=in.(${symbols.join(',')})`,
        },
        (payload) => {
          // Only invalidate if the price actually changed
          const newData = payload.new as any;
          const oldData = payload.old as any;
          if (newData?.data?.price !== oldData?.data?.price) {
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [portfolioData?.positions.length, queryClient]);

  return { portfolioData, isLoading };
};
