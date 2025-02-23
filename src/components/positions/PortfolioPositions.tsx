
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

    console.log('Calculating portfolio totals from:', {
      positions: positions.map(p => ({
        symbol: p.symbol,
        quantity: Number(p.quantity),
        avgPrice: Number(p.average_price)
      })),
      prices: stockPrices
    });

    const totals = positions.reduce((acc, position) => {
      const stockPrice = stockPrices.find(s => s.symbol === position.symbol);
      if (!stockPrice) return acc;

      const quantity = Number(position.quantity);
      const avgPrice = Number(position.average_price);
      const currentPrice = stockPrice.currentPrice;
      
      const currentValue = quantity * currentPrice;
      const costBasis = quantity * avgPrice;
      const positionGainLoss = currentValue - costBasis;

      console.log(`Position calculation for ${position.symbol}:`, {
        quantity,
        avgPrice,
        currentPrice,
        currentValue,
        costBasis,
        positionGainLoss
      });
      
      return {
        totalValue: acc.totalValue + currentValue,
        totalGainLoss: acc.totalGainLoss + positionGainLoss
      };
    }, { totalValue: 0, totalGainLoss: 0 });

    console.log('Final portfolio totals:', totals);

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
