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
  try {
    // Get user's positions to exclude them
    const { data: { user } } = await supabase.auth.getUser();
    const { data: positions } = await supabase
      .from('paper_trading_positions')
      .select('symbol')
      .eq('user_id', user?.id);

    const positionSymbols = new Set(positions?.map(position => position.symbol) || []);
    console.log('Position symbols to exclude:', positionSymbols);
    
    // Get all available stocks except those in user's positions
    const { data: availableStocks, error } = await supabase
      .from('stock_data_cache')
      .select('*')
      .not('symbol', 'in', `(${Array.from(positionSymbols).map(s => `'${s}'`).join(',')})`)
      .order(supabase.raw('random()')); // This randomizes the order at the database level

    if (error) {
      console.error('Error fetching stocks:', error);
      throw error;
    }

    if (!availableStocks) {
      console.error('No stocks available');
      return [];
    }

    // Map the data to our Stock interface
    return availableStocks.map(stock => {
      const stockData = stock.data as any;
      
      // Ensure the chart data is properly formatted
      const formattedChartData = stockData.chartData.map((point: any) => ({
        value: parseFloat(point.value)
      }));

      return {
        id: stock.symbol,
        symbol: stock.symbol,
        name: stockData.name,
        price: stockData.price,
        change: stockData.change,
        description: stockData.description,
        news: stockData.news,
        chartData: formattedChartData
      };
    });
  } catch (error) {
    console.error('Error generating stock batch:', error);
    throw new Error('Failed to load stock data, please try again');
  }
};