import { Stock } from "@/lib/mockStocks";

interface StockPriceProps {
  stock: Stock;
}

export const StockPrice = ({ stock }: StockPriceProps) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-3xl font-bold">${stock.price.toFixed(2)}</span>
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed">{stock.description}</p>
    </div>
  );
};