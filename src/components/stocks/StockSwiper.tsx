
import { useState, useCallback } from "react";
import { Stock } from "@/lib/mockStocks";
import { StockCard } from "@/components/StockCard";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StockSwiperProps {
  stocks: Stock[];
  onLoadMore: () => Promise<void>;
}

export const StockSwiper = ({ stocks, onLoadMore }: StockSwiperProps) => {
  const { toast } = useToast();

  const handleSwipe = useCallback(async (direction: "left" | "right") => {
    if (direction === "right" && stocks[0]) {
      const saveToPortfolio = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            toast({
              title: "Error",
              description: "You must be logged in to save to portfolio.",
              variant: "destructive",
            });
            return;
          }

          const { error } = await supabase
            .from('portfolios')
            .insert({ 
              symbol: stocks[0].symbol,
              user_id: user.id
            });

          if (error) {
            console.error('Error saving to portfolio:', error);
            toast({
              title: "Error",
              description: "Failed to save stock to portfolio. Please try again.",
              variant: "destructive",
            });
            return;
          }

          toast({
            title: "Added to Portfolio",
            description: `${stocks[0].symbol} has been added to your portfolio.`,
          });
        } catch (error) {
          console.error('Error in saveToPortfolio:', error);
          toast({
            title: "Error",
            description: "Failed to save stock to portfolio. Please try again.",
            variant: "destructive",
          });
        }
      };

      saveToPortfolio();
    }

    if (stocks.length <= 2) {
      await onLoadMore();
    }
  }, [stocks, onLoadMore, toast]);

  return (
    <>
      {stocks.length === 0 ? (
        <div className="w-full h-full">
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
      ) : (
        <AnimatePresence>
          {stocks.slice(0, 1).map((stock) => (
            <StockCard
              key={stock.id}
              stock={stock}
              onSwipe={handleSwipe}
            />
          ))}
        </AnimatePresence>
      )}
    </>
  );
};
