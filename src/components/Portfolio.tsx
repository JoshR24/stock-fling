import { useState, useEffect } from "react";
import { Stock } from "@/lib/mockStocks";
import { ScrollArea } from "./ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioPositions } from "./positions/PortfolioPositions";
import { AvailableCash } from "./portfolio/AvailableCash";
import { TradeForm } from "./portfolio/TradeForm";
import { StockList } from "./portfolio/StockList";
import { PaperTradingDisclaimer } from "./portfolio/PaperTradingDisclaimer";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface PortfolioProps {
  stocks: Stock[];
}

export const Portfolio = ({ stocks }: PortfolioProps) => {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
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

  const { data: balanceData } = useQuery({
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
    }
  });

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
  };

  const handleTradeComplete = () => {
    setSelectedStock(null);
  };

  if (stocks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">No stocks available.</p>
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
          
          {selectedStock && (
            <TradeForm 
              selectedStock={selectedStock}
              onTrade={handleTradeComplete}
            />
          )}

          <StockList 
            stocks={stocks}
            onSelectStock={handleStockSelect}
          />
        </div>
      </ScrollArea>
    </div>
  );
};