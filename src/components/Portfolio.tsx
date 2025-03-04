
import { useState, useEffect } from "react";
import { Stock } from "@/lib/mockStocks";
import { ScrollArea } from "./ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioPositions } from "./positions/PortfolioPositions";
import { AvailableCash } from "./portfolio/AvailableCash";
import { PaperTradingDisclaimer } from "./portfolio/PaperTradingDisclaimer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoadingPortfolio } from "./portfolio/LoadingPortfolio";

interface PortfolioProps {
  stocks: Stock[];
}

export const Portfolio = ({ stocks }: PortfolioProps) => {
  const queryClient = useQueryClient();

  // Set up real-time listener for stock price updates
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
          // Invalidate queries to trigger a refresh
          queryClient.invalidateQueries({ queryKey: ['positions'] });
          queryClient.invalidateQueries({ queryKey: ['balance'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: balanceData, isLoading: isBalanceLoading } = useQuery({
    queryKey: ['balance'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('paper_trading_balances')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  if (stocks.length === 0 || isBalanceLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingPortfolio />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <ScrollArea className="h-full">
        <div className="p-2 space-y-2">
          <PaperTradingDisclaimer />
          <AvailableCash balance={balanceData?.balance || 0} />
          <PortfolioPositions stocks={stocks} />
        </div>
      </ScrollArea>
    </div>
  );
};
