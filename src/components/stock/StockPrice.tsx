import { Stock } from "@/lib/mockStocks";

interface StockPriceProps {
  stock: Stock;
}

export const StockPrice = ({ stock }: StockPriceProps) => {
  return (
    <div>
      <div className="flex justify-between items-center">
        <span className="text-2xl font-bold">${stock.price.toFixed(2)}</span>
      </div>
    </div>
  );
};