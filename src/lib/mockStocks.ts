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

// Extended list of popular stocks across different sectors
const stockUniverse = [
  // Technology
  'AAPL', 'GOOGL', 'MSFT', 'META', 'NVDA', 'AMD', 'INTC', 'TSM', 'CSCO', 'ORCL',
  // E-commerce & Internet
  'AMZN', 'BABA', 'SHOP', 'ETSY', 'EBAY', 'PYPL', 'SQ', 'ABNB',
  // Electric Vehicles & Auto
  'TSLA', 'F', 'GM', 'TM', 'RIVN', 'NIO', 'LCID',
  // Financial Services
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'V', 'MA', 'AXP',
  // Healthcare
  'JNJ', 'PFE', 'MRNA', 'ABBV', 'UNH', 'CVS', 'WBA',
  // Retail
  'WMT', 'TGT', 'COST', 'HD', 'LOW', 'DG', 'DLTR',
  // Entertainment & Media
  'NFLX', 'DIS', 'CMCSA', 'PARA', 'WBD', 'SPOT',
  // Telecommunications
  'VZ', 'T', 'TMUS',
  // Energy
  'XOM', 'CVX', 'COP', 'BP', 'SHEL',
  // Consumer Goods
  'KO', 'PEP', 'PG', 'MCD', 'SBUX', 'NKE'
];

// Keep track of stocks that have been shown to the user
let shownStocks = new Set<string>();

// Reset shown stocks if we've shown too many
const resetShownStocksIfNeeded = () => {
  if (shownStocks.size >= stockUniverse.length - 10) {
    console.log('Resetting shown stocks history');
    shownStocks.clear();
  }
};

export const generateStockBatch = async (count: number): Promise<Stock[]> => {
  resetShownStocksIfNeeded();
  
  // Filter out already shown stocks and randomly select from remaining
  const availableStocks = stockUniverse.filter(symbol => !shownStocks.has(symbol));
  const selectedStocks = availableStocks
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
  
  // Add selected stocks to shown stocks set
  selectedStocks.forEach(symbol => shownStocks.add(symbol));
  
  console.log('Selected stocks:', selectedStocks);
  console.log('Total shown stocks:', shownStocks.size);
  
  const stockPromises = selectedStocks.map(async (symbol) => {
    try {
      const { data, error } = await supabase.functions.invoke('fetchStockData', {
        body: { symbol }
      });

      if (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        throw error;
      }

      // Ensure the chart data is properly formatted
      const formattedChartData = data.chartData.map((point: any) => ({
        value: parseFloat(point.value)
      }));

      return {
        id: symbol,
        ...data,
        chartData: formattedChartData
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