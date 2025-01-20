import { Stock } from "@/lib/mockStocks";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

interface StockChartProps {
  stock: Stock;
}

export const StockChart = ({ stock }: StockChartProps) => {
  const isPositive = stock.change >= 0;
  
  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={stock.chartData}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Area
            type="monotone"
            dataKey="value"
            stroke={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
            fill={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};