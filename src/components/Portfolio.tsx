import { useState } from "react";
import { Stock } from "@/lib/mockStocks";
import { ScrollArea } from "./ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioPositions } from "./positions/PortfolioPositions";
import { AvailableCash } from "./portfolio/AvailableCash";
import { TradeForm } from "./portfolio/TradeForm";
import { StockList } from "./portfolio/StockList";
import { PaperTradingDisclaimer } from "./portfolio/PaperTradingDisclaimer";
import { Support } from "./portfolio/Support";
import { useQuery } from "@tanstack/react-query";

interface PortfolioProps {
  stocks: Stock[];
}

export const Portfolio = ({ stocks }: PortfolioProps) => {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [supportEmail, setSupportEmail] = useState("support@stockfling.com");

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
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
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

        <Support supportEmail={supportEmail} />
      </div>
    </ScrollArea>
  );
};