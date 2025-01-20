import { Stock } from "@/lib/mockStocks";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

interface StockCardProps {
  stock: Stock;
  onSwipe: (direction: "left" | "right") => void;
}

export const StockCard = ({ stock, onSwipe }: StockCardProps) => {
  const isPositive = stock.change >= 0;

  return (
    <motion.div
      className="absolute w-full h-full"
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={1}
      onDragEnd={(e, { offset, velocity }) => {
        const swipe = Math.abs(velocity.x) * offset.x;
        if (swipe < -10000) {
          onSwipe("left");
        } else if (swipe > 10000) {
          onSwipe("right");
        }
      }}
    >
      <Card className="w-full h-full p-6 glass-card overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">{stock.symbol}</h2>
            <p className="text-muted-foreground">{stock.name}</p>
          </div>
          <Badge variant={isPositive ? "default" : "destructive"}>
            {isPositive ? "+" : ""}{stock.change}%
          </Badge>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stock.chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
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
              <YAxis domain={['dataMin', 'dataMax']} hide />
              <Area
                type="monotone"
                dataKey="value"
                stroke={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-3xl font-bold">${stock.price.toFixed(2)}</span>
          </div>
          <p className="text-muted-foreground">{stock.description}</p>
        </div>

        <div className="absolute bottom-6 left-6 right-6 flex justify-between text-sm text-muted-foreground">
          <span>← Swipe left to pass</span>
          <span>Swipe right to save →</span>
        </div>
      </Card>
    </motion.div>
  );
};