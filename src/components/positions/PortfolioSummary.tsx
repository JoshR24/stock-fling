
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "../ui/card";
import { PortfolioTotals } from "./types";

interface PortfolioSummaryProps {
  totals: PortfolioTotals;
}

export const PortfolioSummary = ({ totals }: PortfolioSummaryProps) => {
  const { totalValue, totalGainLoss, initialBalance, currentTotal } = totals;
  
  return (
    <div className="grid grid-cols-2 gap-2">
      <Card className="p-2">
        <div className="flex items-center gap-1 text-muted-foreground mb-1 text-sm">
          <DollarSign className="h-4 w-4" />
          <span>Total Account Value</span>
        </div>
        <div className="space-y-1">
          <div className="text-lg font-bold">
            ${currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-muted-foreground">
            Initial: ${initialBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
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
        <div className="space-y-1">
          <span className={`text-lg font-bold ${totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${Math.abs(totalGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div className="text-xs text-muted-foreground">
            {((totalGainLoss / initialBalance) * 100).toFixed(2)}% Return
          </div>
        </div>
      </Card>
    </div>
  );
};
