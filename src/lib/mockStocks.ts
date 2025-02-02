import { supabase } from "@/integrations/supabase/client";

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  chartData: { value: number; date?: string }[];
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
      .select('*')
      .not('symbol', 'in', `(${Array.from(positionSymbols).map(s => `'${s}'`).join(',')})`)
      .order('last_updated');

    if (error) {
      console.error('Error fetching stocks:', error);
      throw error;
    }

    if (!availableStocks || availableStocks.length === 0) {
      console.log('No available stocks found');
      return [];
    }

    // Shuffle the stocks array in memory
    const shuffledStocks = availableStocks
      .map(stock => ({
        id: stock.symbol,
        symbol: stock.symbol,
        name: stock.data.name,
        price: stock.data.price,
        change: stock.data.change,
        description: stock.data.description,
        news: stock.data.news,
        chartData: stock.data.chartData.map((point: any) => ({
          value: parseFloat(point.value)
        }))
      }))
      .sort(() => Math.random() - 0.5);

    console.log('Shuffled and processed stocks:', shuffledStocks.length);
    return shuffledStocks;

  } catch (error) {
    console.error('Error generating stock batch:', error);
    throw new Error('Failed to load stock data, please try again');
  }
};