import { useState } from "react";
import { Stock } from "@/lib/mockStocks";
import { ScrollArea } from "./ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioPositions } from "./positions/PortfolioPositions";
import { AvailableCash } from "./portfolio/AvailableCash";
import { TradeForm } from "./portfolio/TradeForm";
import { StockList } from "./portfolio/StockList";
import { PaperTradingDisclaimer } from "./portfolio/PaperTradingDisclaimer";
import { useQuery } from "@tanstack/react-query";

interface PortfolioProps {
  stocks: Stock[];
}

export const Portfolio = ({ stocks }: PortfolioProps) => {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  // Use React Query for data fetching
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
    <div className="w-full h-full">
      <ScrollArea className="h-full w-full">
        <div className="p-4 max-w-[100vw] mx-auto">
          <div className="space-y-4 max-w-4xl mx-auto">
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
        </div>
      </ScrollArea>
    </div>
  );
};