import { Stock } from "@/lib/mockStocks";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface StockChartProps {
  stock: Stock;
  onTimeframeChange: (timeframe: '1D' | '5D' | '30D' | '1Y') => void;
}

export const StockChart = ({ stock, onTimeframeChange }: StockChartProps) => {
  const [timeframe, setTimeframe] = useState<'1D' | '5D' | '30D' | '1Y'>('30D');
  const isPositive = stock.change >= 0;
  
  if (!stock.chartData || stock.chartData.length === 0) {
    return (
      <div className="h-[150px] flex items-center justify-center text-muted-foreground">
        {stock.error || "No chart data available. This might be due to API rate limits, please try again in a minute."}
      </div>
    );
  }

  const getFilteredData = () => {
    switch (timeframe) {
      case '1D':
        return stock.chartData.slice(-1);
      case '5D':
        return stock.chartData.slice(-5);
      case '30D':
        return stock.chartData.slice(-30);
      case '1Y':
        return stock.chartData;
      default:
        return stock.chartData;
    }
  };

  const handleTimeframeChange = (newTimeframe: '1D' | '5D' | '30D' | '1Y') => {
    setTimeframe(newTimeframe);
    onTimeframeChange(newTimeframe);
  };
  
  return (
    <div className="space-y-2">
      <div className="flex gap-2 justify-end">
        <Button 
          variant={timeframe === '1D' ? "secondary" : "ghost"} 
          size="sm"
          onClick={() => handleTimeframeChange('1D')}
          className="h-6 px-2"
        >
          1D
        </Button>
        <Button 
          variant={timeframe === '5D' ? "secondary" : "ghost"} 
          size="sm"
          onClick={() => handleTimeframeChange('5D')}
          className="h-6 px-2"
        >
          5D
        </Button>
        <Button 
          variant={timeframe === '30D' ? "secondary" : "ghost"} 
          size="sm"
          onClick={() => handleTimeframeChange('30D')}
          className="h-6 px-2"
        >
          30D
        </Button>
        <Button 
          variant={timeframe === '1Y' ? "secondary" : "ghost"} 
          size="sm"
          onClick={() => handleTimeframeChange('1Y')}
          className="h-6 px-2"
        >
          1Y
        </Button>
      </div>
      
      <div className="h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={getFilteredData()}>
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
              type="linear"
              dataKey="value"
              stroke={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
              fill={`url(#gradient-${stock.id})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};