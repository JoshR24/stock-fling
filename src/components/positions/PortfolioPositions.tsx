
import { Card } from "../ui/card";
import { Stock } from "@/lib/mockStocks";
import { useMemo } from "react";
import { PortfolioSummary } from "./PortfolioSummary";
import { PositionsTable } from "./PositionsTable";
import { usePortfolioData } from "./usePortfolioData";
import { PortfolioPositionsProps } from "./types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const PortfolioPositions = ({ stocks }: PortfolioPositionsProps) => {
  const { portfolioData, isLoading } = usePortfolioData();

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
    },
  });

  const { totalValue, totalGainLoss, initialBalance, currentTotal } = useMemo(() => {
    if (!portfolioData || !balanceData) return { 
      totalValue: 0, 
      totalGainLoss: 0, 
      initialBalance: 100000, 
      currentTotal: 0 
    };

    const { positions, stockPrices } = portfolioData;
    const currentCash = balanceData.balance;

    const totals = positions.reduce((acc, position) => {
      const stockPrice = stockPrices.find(s => s.symbol === position.symbol);
      if (!stockPrice) return acc;

      const currentValue = position.quantity * stockPrice.currentPrice;
      const costBasis = position.quantity * position.average_price;
      
      return {
        totalValue: acc.totalValue + currentValue,
        totalGainLoss: acc.totalGainLoss + (currentValue - costBasis)
      };
    }, { totalValue: 0, totalGainLoss: 0 });

    return {
      ...totals,
      initialBalance: 100000,
      currentTotal: totals.totalValue + currentCash
    };
  }, [portfolioData, balanceData]);

  if (isLoading) {
    return (
      <Card className="p-2">
        <p className="text-center text-muted-foreground">Loading portfolio...</p>
      </Card>
    );
  }

  if (!portfolioData?.positions || portfolioData.positions.length === 0) {
    return (
      <Card className="p-2">
        <p className="text-center text-muted-foreground">No positions found. Start trading to see your portfolio here!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <PortfolioSummary totals={{ totalValue, totalGainLoss, initialBalance, currentTotal }} />
      <Card className="p-2">
        <PositionsTable 
          positions={portfolioData.positions} 
          stockPrices={portfolioData.stockPrices} 
        />
      </Card>
    </div>
  );
};
