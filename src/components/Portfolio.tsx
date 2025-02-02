import { useState, useEffect } from "react";
import { Stock } from "@/lib/mockStocks";
import { ScrollArea } from "./ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioPositions } from "./positions/PortfolioPositions";
import { AvailableCash } from "./portfolio/AvailableCash";
import { TradeForm } from "./portfolio/TradeForm";
import { StockList } from "./portfolio/StockList";
import { PaperTradingDisclaimer } from "./portfolio/PaperTradingDisclaimer";
import { Support } from "./portfolio/Support";

interface PortfolioProps {
  stocks: Stock[];
}

export const Portfolio = ({ stocks }: PortfolioProps) => {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [portfolioStocks, setPortfolioStocks] = useState<Stock[]>([]);
  const [supportEmail, setSupportEmail] = useState("support@stockfling.com");

  const fetchPortfolioAndBalance = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return;
    }

    // Fetch balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('paper_trading_balances')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (balanceError) {
      console.error('Error fetching balance:', balanceError);
      return;
    }

    if (balanceData) {
      setBalance(balanceData.balance);
    }

    // Fetch portfolio positions
    const { data: positionsData, error: positionsError } = await supabase
      .from('paper_trading_positions')
      .select('symbol, quantity, average_price')
      .eq('user_id', user.id);

    if (positionsError) {
      console.error('Error fetching positions:', positionsError);
      return;
    }

    const portfolioSymbols = new Set(positionsData.map(item => item.symbol));
    const portfolioStocks = stocks.filter(stock => portfolioSymbols.has(stock.symbol));
    setPortfolioStocks(portfolioStocks);
  };

  const fetchSupportInfo = async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('support_email')
      .single();

    if (!error && data) {
      setSupportEmail(data.support_email);
    }
  };

  useEffect(() => {
    fetchPortfolioAndBalance();
    fetchSupportInfo();
  }, [stocks]);

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
  };

  const handleTradeComplete = () => {
    setSelectedStock(null);
    fetchPortfolioAndBalance();
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
        <AvailableCash balance={balance} />
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