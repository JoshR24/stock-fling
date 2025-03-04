
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

const isMarketOpen = (): boolean => {
  // Get current time in New York (ET)
  const now = new Date();
  const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  
  const day = nyTime.getDay();
  const hours = nyTime.getHours();
  const minutes = nyTime.getMinutes();
  const currentTimeInMinutes = hours * 60 + minutes;
  
  // Market hours: Monday (1) to Friday (5), 9:30 AM to 4:00 PM ET
  const marketOpenInMinutes = 9 * 60 + 30;  // 9:30 AM
  const marketCloseInMinutes = 16 * 60;     // 4:00 PM
  
  return day >= 1 && day <= 5 && // Monday to Friday
         currentTimeInMinutes >= marketOpenInMinutes &&
         currentTimeInMinutes < marketCloseInMinutes;
};

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

      // Only fetch stock data during market hours
      if (!isMarketOpen()) {
        console.log('Market is closed. Only fetching static data and news.');
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
        return;
      }

      // During market hours - fetch all data as before
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
    // Now we just remove the card on swipe, regardless of direction
    // The actual "right swipe" functionality is handled within the StockCard component
    setStocks((prev) => {
      const [_, ...rest] = prev;
      return rest;
    });

    if (stocks.length <= 2) {
      await loadStocks();
    }
  }, [stocks.length, toast]);

  return {
    stocks,
    loadStocks,
    handleSwipe,
    isMarketOpen: isMarketOpen()
  };
};
