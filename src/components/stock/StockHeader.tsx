import { Stock } from "@/lib/mockStocks";
import { Badge } from "../ui/badge";

interface StockHeaderProps {
  stock: Stock;
  timeframe: '1D' | '5D' | '30D' | '1Y';
}

export const StockHeader = ({ stock, timeframe }: StockHeaderProps) => {
  const calculateChange = () => {
    if (!stock.chartData || stock.chartData.length === 0) {
      return stock.change;
    }

    let relevantData;
    switch (timeframe) {
      case '1D':
        relevantData = stock.chartData.slice(-1);
        break;
      case '5D':
        relevantData = stock.chartData.slice(-5);
        break;
      case '30D':
        relevantData = stock.chartData.slice(-30);
        break;
      case '1Y':
        relevantData = stock.chartData;
        break;
      default:
        relevantData = stock.chartData;
    }

    if (relevantData.length < 2) {
      return stock.change;
    }

    const firstPrice = relevantData[0].value;
    const lastPrice = relevantData[relevantData.length - 1].value;
    const percentChange = ((lastPrice - firstPrice) / firstPrice) * 100;
    
    return percentChange;
  };
  
  const change = calculateChange();
  const isPositive = change >= 0;
  const formattedChange = change.toFixed(1);
  
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