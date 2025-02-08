
import { Card } from "../ui/card";
import { Stock } from "@/lib/mockStocks";
import { useMemo } from "react";
import { PortfolioSummary } from "./PortfolioSummary";
import { PositionsTable } from "./PositionsTable";
import { usePortfolioData } from "./usePortfolioData";
import { PortfolioPositionsProps } from "./types";

export const PortfolioPositions = ({ stocks }: PortfolioPositionsProps) => {
  const { portfolioData, isLoading } = usePortfolioData();

  const { totalValue, totalGainLoss } = useMemo(() => {
    if (!portfolioData) return { totalValue: 0, totalGainLoss: 0 };

    const { positions, stockPrices } = portfolioData;

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

    return totals;
  }, [portfolioData]);

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
      <PortfolioSummary totals={{ totalValue, totalGainLoss }} />
      <Card className="p-2">
        <PositionsTable 
          positions={portfolioData.positions} 
          stockPrices={portfolioData.stockPrices} 
        />
      </Card>
    </div>
  );
};
