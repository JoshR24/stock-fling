import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { Stock } from "@/lib/mockStocks";
import { Badge } from "../ui/badge";

interface Position {
  symbol: string;
  quantity: number;
  average_price: number;
}

interface PortfolioPositionsProps {
  stocks: Stock[];
}

export const PortfolioPositions = ({ stocks }: PortfolioPositionsProps) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalGainLoss, setTotalGainLoss] = useState(0);

  useEffect(() => {
    const fetchPositions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('paper_trading_positions')
        .select('symbol, quantity, average_price')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching positions:', error);
        return;
      }

      console.log('Fetched positions:', data);
      setPositions(data || []);
    };

    fetchPositions();
  }, []);

  useEffect(() => {
    let totalVal = 0;
    let totalGL = 0;

    positions.forEach(position => {
      const stock = stocks.find(s => s.symbol === position.symbol);
      if (stock) {
        const currentValue = position.quantity * stock.price;
        const costBasis = position.quantity * position.average_price;
        totalVal += currentValue;
        totalGL += currentValue - costBasis;
      }
    });

    console.log('Calculated total value:', totalVal);
    console.log('Calculated total gain/loss:', totalGL);
    setTotalValue(totalVal);
    setTotalGainLoss(totalGL);
  }, [positions, stocks]);

  if (positions.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-center text-muted-foreground">No positions found. Start trading to see your portfolio here!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="h-4 w-4" />
            <span>Portfolio Value</span>
          </div>
          <span className="text-2xl font-bold">
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            {totalGainLoss >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span>Total Gain/Loss</span>
          </div>
          <span className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${Math.abs(totalGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </Card>
      </div>

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Avg Price</TableHead>
              <TableHead>Current Price</TableHead>
              <TableHead>Gain/Loss</TableHead>
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
                  <TableCell className="font-medium">{position.symbol}</TableCell>
                  <TableCell>{position.quantity}</TableCell>
                  <TableCell>${position.average_price.toFixed(2)}</TableCell>
                  <TableCell>${stock.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>${Math.abs(gainLoss).toFixed(2)}</span>
                      <Badge variant={gainLoss >= 0 ? "default" : "destructive"}>
                        {gainLoss >= 0 ? "+" : "-"}{Math.abs(gainLossPercent).toFixed(1)}%
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};