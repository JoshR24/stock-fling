import { Stock } from "@/lib/mockStocks";
import { Badge } from "../ui/badge";

interface StockHeaderProps {
  stock: Stock;
}

export const StockHeader = ({ stock }: StockHeaderProps) => {
  const isPositive = stock.change >= 0;
  const formattedChange = stock.change.toFixed(1);
  
  return (
    <div className="flex justify-between items-start">
      <div>
        <h2 className="text-2xl font-bold">{stock.symbol}</h2>
        <p className="text-muted-foreground">{stock.name}</p>
      </div>
      <Badge variant={isPositive ? "default" : "destructive"}>
        {isPositive ? "+" : ""}{formattedChange}%
      </Badge>
    </div>
  );
};