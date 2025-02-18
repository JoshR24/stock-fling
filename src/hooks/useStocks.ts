
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
      // Get user's positions first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get positions in a single query
      const { data: positions } = await supabase
        .from('paper_trading_positions')
        .select('symbol')
        .eq('user_id', user.id);

      const positionSymbols = new Set(positions?.map(position => position.symbol) || []);

      // Fetch available stocks efficiently
      const { data: availableStocks, error } = await supabase
        .from('stock_data_cache')
        .select('symbol, data, last_updated')
        .not('symbol', 'in', `(${Array.from(positionSymbols).map(s => `'${s}'`).join(',')})`)
        .order('last_updated', { ascending: false })
        .limit(10); // Limit the number of stocks fetched

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
        news: stock.data.news?.slice(0, 5), // Limit news items
        chartData: stock.data.chartData?.slice(-30) || [] // Only keep last 30 data points
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
        // Save to portfolio
        supabase
          .from('portfolios')
          .insert({ 
            symbol: current.symbol,
            user_id: supabase.auth.getUser().then(({ data }) => data.user?.id)
          })
          .then(({ error }) => {
            if (error) {
              toast({
                title: "Error",
                description: "Failed to save stock to portfolio. Please try again.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Added to Portfolio",
                description: `${current.symbol} has been added to your portfolio.`,
              });
            }
          });
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
