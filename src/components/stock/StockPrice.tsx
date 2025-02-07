
import { Stock } from "@/lib/mockStocks";

interface StockPriceProps {
  stock: Stock;
}

export const StockPrice = ({ stock }: StockPriceProps) => {
  // Get the latest price from chart data
  const getLatestPrice = () => {
    if (stock.chartData && stock.chartData.length > 0) {
      return stock.chartData[stock.chartData.length - 1].value;
    }
    return stock.price; // Fallback to stock.price if no chart data
  };

  const latestPrice = getLatestPrice();

  return (
    <div>
      <div className="flex justify-between items-center">
        <span className="text-2xl font-bold">${latestPrice.toFixed(2)}</span>
      </div>
    </div>
  );
};
