import { Card } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { Stock } from "@/lib/mockStocks";
import { Badge } from "../ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Position {
  symbol: string;
  quantity: number;
  average_price: number;
}

interface PortfolioPositionsProps {
  stocks: Stock[];
}

export const PortfolioPositions = ({ stocks }: PortfolioPositionsProps) => {
  const { data: positions = [], isLoading, error } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error: positionsError } = await supabase
        .from('paper_trading_positions')
        .select('*')
        .eq('user_id', user.id);

      if (positionsError) throw positionsError;
      return data as Position[] || [];
    }
  });

  const totalValue = positions.reduce((sum, position) => {
    const stock = stocks.find(s => s.symbol === position.symbol);
    if (stock) {
      return sum + (position.quantity * stock.price);
    }
    return sum;
  }, 0);

  const totalGainLoss = positions.reduce((sum, position) => {
    const stock = stocks.find(s => s.symbol === position.symbol);
    if (stock) {
      const currentValue = position.quantity * stock.price;
      const costBasis = position.quantity * position.average_price;
      return sum + (currentValue - costBasis);
    }
    return sum;
  }, 0);

  if (isLoading) {
    return (
      <Card className="p-2">
        <p className="text-center text-muted-foreground">Loading portfolio...</p>
      </Card>
    );
  }

  if (!positions || positions.length === 0) {
    return (
      <Card className="p-2">
        <p className="text-center text-muted-foreground">No positions found. Start trading to see your portfolio here!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
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
            <span>Total G/L</span>
          </div>
          <span className={`text-lg font-bold ${totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${Math.abs(totalGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </Card>
      </div>

      <Card className="p-2">
        <div className="overflow-x-auto -mx-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Symbol</TableHead>
                <TableHead className="text-xs text-right">Qty</TableHead>
                <TableHead className="text-xs text-right">Avg</TableHead>
                <TableHead className="text-xs text-right">Price</TableHead>
                <TableHead className="text-xs text-right">G/L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => {
                const stock = stocks.find(s => s.symbol === position.symbol);
                if (!stock) return null;

                const currentValue = position.quantity * stock.price;
                const costBasis = position.quantity * position.average_price;
                const gainLoss = currentValue - costBasis;
                const gainLossPercent = (gainLoss / costBasis) * 100;

                return (
                  <TableRow key={position.symbol}>
                    <TableCell className="font-medium text-xs py-2">{position.symbol}</TableCell>
                    <TableCell className="text-right text-xs py-2">{position.quantity}</TableCell>
                    <TableCell className="text-right text-xs py-2">${position.average_price.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-xs py-2">${stock.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-xs py-2">
                      <div className="flex items-center justify-end gap-1">
                        <span>${Math.abs(gainLoss).toFixed(2)}</span>
                        <Badge variant={gainLoss >= 0 ? "default" : "destructive"} className="text-[10px] px-1 py-0">
                          {gainLoss >= 0 ? "+" : "-"}{Math.abs(gainLossPercent).toFixed(1)}%
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};