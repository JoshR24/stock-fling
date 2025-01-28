import { Stock } from "@/lib/mockStocks";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";

interface StockChartProps {
  stock: Stock;
}

export const StockChart = ({ stock }: StockChartProps) => {
  const isPositive = stock.change >= 0;
  
  // Add error handling for empty chart data
  if (!stock.chartData || stock.chartData.length === 0) {
    return (
      <div className="h-[150px] flex items-center justify-center text-muted-foreground">
        {stock.error || "No chart data available. This might be due to API rate limits, please try again in a minute."}
      </div>
    );
  }
  
  return (
    <div className="h-[150px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={stock.chartData}>
          <defs>
            <linearGradient id={`gradient-${stock.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <YAxis 
            domain={['auto', 'auto']} 
            hide 
            padding={{ top: 10, bottom: 10 }} 
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const value = payload[0].value;
                const date = payload[0].payload.date;
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {date}
                        </span>
                        <span className="font-bold text-muted-foreground">
                          ${typeof value === 'number' ? value.toFixed(2) : value}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
            fill={`url(#gradient-${stock.id})`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};