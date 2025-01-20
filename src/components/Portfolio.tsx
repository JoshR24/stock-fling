import { Stock } from "@/lib/mockStocks";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { Badge } from "./ui/badge";

interface PortfolioProps {
  stocks: Stock[];
}

export const Portfolio = ({ stocks }: PortfolioProps) => {
  if (stocks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">No stocks in your portfolio yet.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {stocks.map((stock) => (
          <Card key={stock.id} className="p-4 glass-card">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold">{stock.symbol}</h3>
                <p className="text-sm text-muted-foreground">{stock.name}</p>
              </div>
              <Badge variant={stock.change >= 0 ? "default" : "destructive"}>
                {stock.change >= 0 ? "+" : ""}{stock.change}%
              </Badge>
            </div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stock.chartData}>
                  <defs>
                    <linearGradient id={`color${stock.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={stock.change >= 0 ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={stock.change >= 0 ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <YAxis domain={['dataMin', 'dataMax']} hide />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={stock.change >= 0 ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                    fillOpacity={1}
                    fill={`url(#color${stock.id})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};