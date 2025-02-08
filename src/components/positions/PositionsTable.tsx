
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Position, StockPrice } from "./types";

interface PositionsTableProps {
  positions: Position[];
  stockPrices: StockPrice[];
}

export const PositionsTable = ({ positions, stockPrices }: PositionsTableProps) => {
  return (
    <div className="overflow-x-auto -mx-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Symbol</TableHead>
            <TableHead className="text-xs text-right">Qty</TableHead>
            <TableHead className="text-xs text-right">Price</TableHead>
            <TableHead className="text-xs text-right">Gain/Loss</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position) => {
            const stockPrice = stockPrices.find(s => s.symbol === position.symbol);
            if (!stockPrice) return null;

            const currentValue = position.quantity * stockPrice.currentPrice;
            const costBasis = position.quantity * position.average_price;
            const gainLoss = currentValue - costBasis;
            const gainLossPercent = costBasis !== 0 ? (gainLoss / costBasis) * 100 : 0;

            return (
              <TableRow key={position.symbol}>
                <TableCell className="font-medium text-xs py-2">{position.symbol}</TableCell>
                <TableCell className="text-right text-xs py-2">{position.quantity}</TableCell>
                <TableCell className="text-right text-xs py-2">${stockPrice.currentPrice.toFixed(2)}</TableCell>
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
  );
};
