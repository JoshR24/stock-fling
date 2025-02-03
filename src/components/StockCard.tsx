import { Stock } from "@/lib/mockStocks";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { StockHeader } from "./stock/StockHeader";
import { StockChart } from "./stock/StockChart";
import { StockPrice } from "./stock/StockPrice";
import { StockNews } from "./stock/StockNews";
import { SwipeInstructions } from "./stock/SwipeInstructions";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StockDataCacheEntry } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";

interface StockCardProps {
  stock: Stock;
  onSwipe: (direction: "left" | "right") => void;
}

export const StockCard = ({ stock, onSwipe }: StockCardProps) => {
  const [currentTimeframe, setCurrentTimeframe] = useState<'1D' | '5D' | '30D' | '1Y'>('30D');
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  
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

  // Fetch real-time stock data
  const { data: stockData } = useQuery({
    queryKey: ['stockPrice', stock.symbol],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_data_cache')
        .select('*')
        .eq('symbol', stock.symbol)
        .single();

      if (error) throw error;

      return data.data as StockDataCacheEntry;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Set up real-time listener for stock price updates
  useEffect(() => {
    const channel = supabase
      .channel('stock-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stock_data_cache',
          filter: `symbol=eq.${stock.symbol}`
        },
        (payload) => {
          console.log('Received stock update:', payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [stock.symbol]);

  // Update stock data with real-time values
  const updatedStock: Stock = {
    ...stock,
    price: stockData?.price ?? stock.price,
    change: stockData?.change ?? stock.change,
    chartData: stockData?.chartData ?? stock.chartData,
    news: stockData?.news ?? stock.news,
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