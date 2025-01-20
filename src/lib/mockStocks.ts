import { supabase } from "@/integrations/supabase/client";

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  chartData: { value: number }[];
  description: string;
  news: {
    id: string;
    title: string;
    summary: string;
    date: string;
  }[];
}

const defaultStocks = [
  'AAPL',
  'GOOGL',
  'MSFT',
  'AMZN',
  'META',
  'TSLA',
  'NVDA',
  'JPM',
  'V',
  'WMT'
];

export const generateStockBatch = async (count: number): Promise<Stock[]> => {
  const selectedStocks = defaultStocks.sort(() => Math.random() - 0.5).slice(0, count);
  
  const stockPromises = selectedStocks.map(async (symbol) => {
    try {
      const { data, error } = await supabase.functions.invoke('fetchStockData', {
        body: { symbol }
      });

      if (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        throw error;
      }

      return {
        id: symbol,
        ...data
      };
    } catch (error) {
      console.error(`Failed to fetch data for ${symbol}:`, error);
      throw error;
    }
  });

  try {
    return await Promise.all(stockPromises);
  } catch (error) {
    console.error('Error generating stock batch:', error);
    throw new Error('Failed to load stock data, please try again');
  }
};