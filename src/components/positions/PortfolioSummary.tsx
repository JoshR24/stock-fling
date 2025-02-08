
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "../ui/card";
import { PortfolioTotals } from "./types";

interface PortfolioSummaryProps {
  totals: PortfolioTotals;
}

export const PortfolioSummary = ({ totals }: PortfolioSummaryProps) => {
  const { totalValue, totalGainLoss } = totals;
  
  return (
    <div className="grid grid-cols-2 gap-2">
      <Card className="p-2">
        <div className="flex items-center gap-1 text-muted-foreground mb-1 text-sm">
          <DollarSign className="h-4 w-4" />
          <span>Portfolio Value</span>
        </div>
        <span className="text-lg font-bold">
          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </Card>
      <Card className="p-2">
        <div className="flex items-center gap-1 text-muted-foreground mb-1 text-sm">
          {totalGainLoss >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span>Total Gain/Loss</span>
        </div>
        <span className={`text-lg font-bold ${totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          ${Math.abs(totalGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </Card>
    </div>
  );
};
