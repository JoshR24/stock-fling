
import { useState, useCallback } from "react";
import { Stock } from "@/lib/mockStocks";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

interface StockDataCache {
  symbol: string;
  data: StockData;
  last_updated: string;
}

export const useStocks = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const { toast } = useToast();

  const loadStocks = async () => {
    try {
      // Get user's positions to exclude them
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: positions } = await supabase
        .from('paper_trading_positions')
        .select('symbol')
        .eq('user_id', user.id);

      const positionSymbols = new Set(positions?.map(position => position.symbol) || []);
      console.log('Position symbols to exclude:', positionSymbols);

      // Fetch available stocks from cache
      const { data: availableStocks, error } = await supabase
        .from('stock_data_cache')
        .select('symbol, data, last_updated')
        .not('symbol', 'in', `(${Array.from(positionSymbols).map(s => `'${s}'`).join(',')})`)
        .order('last_updated', { ascending: false });

      if (error) {
        console.error('Error fetching stocks:', error);
        throw error;
      }

      const processedStocks = (availableStocks as unknown as StockDataCache[] || []).map(stock => ({
        id: stock.symbol,
        symbol: stock.symbol,
        name: stock.data.name,
        price: stock.data.price,
        change: stock.data.change,
        description: stock.data.description,
        news: stock.data.news,
        chartData: stock.data.chartData?.map(point => ({
          value: point.value,
          date: point.date
        })) || []
      }));

      setStocks(prev => {
        const existingSymbols = new Set(prev.map(s => s.symbol));
        return [...prev, ...processedStocks.filter(s => !existingSymbols.has(s.symbol))];
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
