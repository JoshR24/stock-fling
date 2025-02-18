import { Stock } from "@/lib/mockStocks";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { StockHeader } from "./stock/StockHeader";
import { StockChart } from "./stock/StockChart";
import { StockPrice } from "./stock/StockPrice";
import { StockNews } from "./stock/StockNews";
import { SwipeInstructions } from "./stock/SwipeInstructions";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface StockCardProps {
  stock: Stock;
  onSwipe: (direction: "left" | "right") => void;
}

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  description: string;
  volume: number;
  chartData: Array<{ value: number; date: string }>;
  news: Array<{ id: string; title: string; summary: string; date: string; url: string }>;
  timestamp: number;
}

export const StockCard = ({ stock, onSwipe }: StockCardProps) => {
  const [currentTimeframe, setCurrentTimeframe] = useState<'1D' | '5D' | '30D' | '1Y'>('30D');
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const { toast } = useToast();
  
  const redOverlayOpacity = useTransform(
    x,
    [-200, -100, 0],
    [0.3, 0.15, 0]
  );
  
  const greenOverlayOpacity = useTransform(
    x,
    [0, 100, 200],
    [0, 0.15, 0.3]
  );

  const isMarketOpen = (): boolean => {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Convert to ET (assuming server is in UTC)
    const etHours = (hours - 4 + 24) % 24; // Simple UTC to ET conversion (UTC-4)
    const currentTimeInMinutes = etHours * 60 + minutes;
    
    // Market hours: Monday (1) to Friday (5), 9:30 AM to 4:00 PM ET
    const marketOpenInMinutes = 9 * 60 + 30;  // 9:30 AM
    const marketCloseInMinutes = 16 * 60;     // 4:00 PM
    
    return day >= 1 && day <= 5 && // Monday to Friday
           currentTimeInMinutes >= marketOpenInMinutes &&
           currentTimeInMinutes < marketCloseInMinutes;
  };

  // Fetch real-time stock data
  const { data: stockData } = useQuery({
    queryKey: ['stockData', stock.symbol],
    queryFn: async () => {
      try {
        console.log('Fetching data from cache for:', stock.symbol);
        const { data, error } = await supabase
          .from('stock_data_cache')
          .select('data')
          .eq('symbol', stock.symbol)
          .single();

        if (error) {
          console.error('Error fetching stock data:', error);
          throw error;
        }

        const parsedData = data?.data as unknown as StockData;
        if (!parsedData || typeof parsedData !== 'object') {
          return null;
        }

        return parsedData;
      } catch (error) {
        console.error('Error fetching stock data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch stock data. Using cached data.",
          variant: "destructive",
        });
        return null;
      }
    },
    refetchInterval: isMarketOpen() ? 60000 : false, // Only poll during market hours
  });

  // Update stock data with real-time values or fallback to cached data
  const updatedStock: Stock = {
    ...stock,
    price: stockData?.price ?? stock.price,
    change: stockData?.change ?? stock.change,
    chartData: stockData?.chartData ?? stock.chartData,
    news: stockData?.news ?? stock.news,
    name: stockData?.name ?? stock.name,
    description: stockData?.description ?? stock.description
  };

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
      whileDrag={{ scale: 1.05 }}
      animate={{
        scale: 1,
        rotate: 0,
      }}
      exit={{
        x: x.get() < 0 ? -2000 : 2000,
        opacity: 0,
        transition: { duration: 0.5, type: "spring", bounce: 0, mass: 0.8 }
      }}
    >
      <Card className="w-full h-full glass-card overflow-hidden relative shadow-xl">
        <motion.div 
          className="absolute inset-0 bg-red-500 pointer-events-none z-10" 
          style={{ opacity: redOverlayOpacity }} 
        />
        
        <motion.div 
          className="absolute inset-0 bg-green-500 pointer-events-none z-10" 
          style={{ opacity: greenOverlayOpacity }} 
        />
        
        <ScrollArea className="h-full">
          <div className="p-3 space-y-2">
            <StockHeader stock={updatedStock} timeframe={currentTimeframe} />
            <StockChart stock={updatedStock} onTimeframeChange={setCurrentTimeframe} />
            <StockPrice stock={updatedStock} />
            <div className="mt-2 text-sm text-muted-foreground leading-snug">
              {updatedStock.description}
            </div>
            <StockNews stock={updatedStock} />
            <SwipeInstructions />
          </div>
        </ScrollArea>
      </Card>
    </motion.div>
  );
};
