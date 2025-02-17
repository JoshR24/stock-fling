
import { supabase } from "@/integrations/supabase/client";

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  chartData: { value: number; date: string }[];
  description: string;
  error?: string;
  news: {
    id: string;
    title: string;
    summary: string;
    date: string;
    url: string;
  }[];
}

interface StockDataCache {
  symbol: string;
  data: {
    name: string;
    price: number;
    change: number;
    description: string;
    news: any[];
    chartData: any[];
  };
  last_updated: string;
}

export const generateStockBatch = async (): Promise<Stock[]> => {
  console.log('Generating stock batch');
  
  // Get user's positions to exclude them
  const { data: { user } } = await supabase.auth.getUser();
  const { data: positions } = await supabase
    .from('paper_trading_positions')
    .select('symbol')
    .eq('user_id', user?.id);

  const positionSymbols = new Set(positions?.map(position => position.symbol) || []);
  console.log('Position symbols to exclude:', positionSymbols);
  
  try {
    // First get all available stock symbols
    const { data: availableStocks, error } = await supabase
      .from('stock_data_cache')
      .select('symbol, data, last_updated')
      .not('symbol', 'in', `(${Array.from(positionSymbols).map(s => `'${s}'`).join(',')})`)
      .order('last_updated', { ascending: false });

    if (error) {
      console.error('Error fetching stocks:', error);
      throw error;
    }

    if (!availableStocks || availableStocks.length === 0) {
      console.log('No available stocks found');
      return [];
    }

    // Process the stocks array
    const processedStocks = (availableStocks as StockDataCache[])
      .map(stock => ({
        id: stock.symbol,
        symbol: stock.symbol,
        name: stock.data.name || `${stock.symbol} Inc.`,
        price: stock.data.price || 0,
        change: stock.data.change || 0,
        description: stock.data.description || `Description for ${stock.symbol}`,
        news: stock.data.news || [],
        chartData: (stock.data.chartData || []).map((point: any) => ({
          value: parseFloat(point.value),
          date: point.date
        }))
      }))
      .sort(() => Math.random() - 0.5); // Shuffle the stocks

    console.log('Processed stocks:', processedStocks.length);
    return processedStocks;

  } catch (error) {
    console.error('Error generating stock batch:', error);
    throw new Error('Failed to load stock data, please try again');
  }
};
