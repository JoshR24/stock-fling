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
import { useToast } from "@/hooks/use-toast";

interface StockCardProps {
  stock: Stock;
  onSwipe: (direction: "left" | "right") => void;
  isPortfolioMode?: boolean;
}

export const StockCard = ({ stock, onSwipe, isPortfolioMode = false }: StockCardProps) => {
  const [currentTimeframe, setCurrentTimeframe] = useState<'1D' | '5D' | '30D' | '1Y'>('30D');
  const { toast } = useToast();
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

  const handleSwipe = async (direction: "left" | "right") => {
    if (isPortfolioMode && direction === "left") {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: "Error",
            description: "You must be logged in to remove stocks from portfolio.",
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase
          .from('portfolios')
          .delete()
          .eq('user_id', user.id)
          .eq('symbol', stock.symbol);

        if (error) {
          console.error('Error removing from portfolio:', error);
          toast({
            title: "Error",
            description: "Failed to remove stock from portfolio. Please try again.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Removed from Portfolio",
          description: `${stock.symbol} has been removed from your portfolio.`,
        });
      } catch (error) {
        console.error('Error in removeFromPortfolio:', error);
        toast({
          title: "Error",
          description: "Failed to remove stock from portfolio. Please try again.",
          variant: "destructive",
        });
      }
    }
    onSwipe(direction);
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
          handleSwipe("left");
        } else if (swipe > 10000) {
          handleSwipe("right");
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
            <StockHeader stock={stock} timeframe={currentTimeframe} />
            <StockChart stock={stock} onTimeframeChange={setCurrentTimeframe} />
            <StockPrice stock={stock} />
            <div className="mt-2 text-sm text-muted-foreground leading-snug">
              {stock.description}
            </div>
            <StockNews stock={stock} />
            <SwipeInstructions />
          </div>
        </ScrollArea>
      </Card>
    </motion.div>
  );
};