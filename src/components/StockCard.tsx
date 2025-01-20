import { Stock } from "@/lib/mockStocks";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";

interface StockCardProps {
  stock: Stock;
  onSwipe: (direction: "left" | "right") => void;
}

export const StockCard = ({ stock, onSwipe }: StockCardProps) => {
  const isPositive = stock.change >= 0;
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(
    x,
    [-200, -100, 0, 100, 200],
    [1, 1, 0, 1, 1]
  );

  // Create separate transforms for left and right indicators
  const leftIndicatorOpacity = useTransform(
    x,
    [-200, -100, 0],
    [1, 0.5, 0]
  );
  const rightIndicatorOpacity = useTransform(
    x,
    [0, 100, 200],
    [0, 0.5, 1]
  );

  return (
    <motion.div
      className="absolute w-full h-full"
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={1}
      style={{ x, rotate }}
      onDragEnd={(e, { offset, velocity }) => {
        const swipe = Math.abs(velocity.x) * offset.x;
        if (swipe < -10000) {
          onSwipe("left");
        } else if (swipe > 10000) {
          onSwipe("right");
        }
      }}
    >
      {/* Left indicator (Pass) */}
      <motion.div
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-red-500/90 text-white px-6 py-2 rounded-lg font-semibold transform -rotate-12 pointer-events-none"
        style={{ opacity: leftIndicatorOpacity }}
      >
        PASS
      </motion.div>

      {/* Right indicator (Save) */}
      <motion.div
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-500/90 text-white px-6 py-2 rounded-lg font-semibold transform rotate-12 pointer-events-none"
        style={{ opacity: rightIndicatorOpacity }}
      >
        SAVE
      </motion.div>

      <Card className="w-full h-full glass-card overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">{stock.symbol}</h2>
                <p className="text-muted-foreground">{stock.name}</p>
              </div>
              <Badge variant={isPositive ? "default" : "destructive"}>
                {isPositive ? "+" : ""}{stock.change}%
              </Badge>
            </div>

            <div className="h-[200px]">
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

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-3xl font-bold">${stock.price.toFixed(2)}</span>
              </div>
              <p className="text-muted-foreground">{stock.description}</p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Recent News</h3>
              {stock.news.map((article) => (
                <div key={article.id} className="border-b border-border pb-4">
                  <h4 className="font-medium mb-1">{article.title}</h4>
                  <p className="text-sm text-muted-foreground mb-1">{article.summary}</p>
                  <span className="text-xs text-muted-foreground">{article.date}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-sm text-muted-foreground">
              <span>← Swipe left to pass</span>
              <span>Swipe right to save →</span>
            </div>
          </div>
        </ScrollArea>
      </Card>
    </motion.div>
  );
};