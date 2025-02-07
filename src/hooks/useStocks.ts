
import { useState, useCallback } from "react";
import { Stock, generateStockBatch } from "@/lib/mockStocks";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useStocks = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const { toast } = useToast();

  const loadStocks = async () => {
    try {
      const newStocks = await generateStockBatch();
      setStocks(prev => {
        const existingSymbols = new Set(prev.map(s => s.symbol));
        return [...prev, ...newStocks.filter(s => !existingSymbols.has(s.symbol))];
      });
    } catch (error) {
      console.error('Error loading stocks:', error);
      toast({
        title: "Error",
        description: "Failed to load stock data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSwipe = useCallback(async (direction: "left" | "right") => {
    setStocks((prev) => {
      const [current, ...rest] = prev;
      if (direction === "right" && current) {
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
                symbol: current.symbol,
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
              description: `${current.symbol} has been added to your portfolio.`,
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
      return rest;
    });

    if (stocks.length <= 2) {
      await loadStocks();
    }
  }, [stocks.length, toast]);

  return {
    stocks,
    loadStocks,
    handleSwipe
  };
};
