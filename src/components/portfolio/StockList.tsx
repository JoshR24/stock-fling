
import { Stock } from "@/lib/mockStocks";
import { Card } from "../ui/card";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { Badge } from "../ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StockListProps {
  stocks: Stock[];
  onSelectStock: (stock: Stock) => void;
}

export const StockList = ({ stocks, onSelectStock }: StockListProps) => {
  // Fetch positions to ensure we show all owned stocks
  const { data: positions = [] } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('paper_trading_positions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      console.log('Fetched positions:', data);
      return data || [];
    }
  });

  // Filter stocks to only show those in positions
  const portfolioStocks = stocks.filter(stock => 
    positions.some(position => position.symbol === stock.symbol)
  );

  console.log('Portfolio stocks:', portfolioStocks);

  return (
    <>
      {portfolioStocks.map((stock) => (
        <Card 
          key={stock.id} 
          className="p-4 glass-card cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => onSelectStock(stock)}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold">{stock.symbol}</h3>
              <p className="text-sm text-muted-foreground">{stock.name}</p>
            </div>
            <Badge variant={stock.change >= 0 ? "default" : "destructive"}>
              {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(1)}%
            </Badge>
          </div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stock.chartData}>
                <defs>
                  <linearGradient id={`gradient-${stock.id}`} x1="0" y1="0" x2="0" y2="1">
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
                <YAxis domain={['auto', 'auto']} hide padding={{ top: 10, bottom: 10 }} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={stock.change >= 0 ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                  fillOpacity={1}
                  fill={`url(#gradient-${stock.id})`}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ))}
    </>
  );
};
