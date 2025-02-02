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
import { StockCard } from "./StockCard";

interface PortfolioProps {
  stocks: Stock[];
}

export const Portfolio = ({ stocks }: PortfolioProps) => {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

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

  const handleSwipe = (direction: "left" | "right") => {
    // After a successful swipe, the stock will be removed from the list
    // The actual deletion is handled in the StockCard component
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
            <StockCard
              key={selectedStock.id}
              stock={selectedStock}
              onSwipe={handleSwipe}
              isPortfolioMode={true}
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