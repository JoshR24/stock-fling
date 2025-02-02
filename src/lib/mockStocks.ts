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
  'AAPL', 'GOOGL', 'MSFT', 'META', 'NVDA', 'AMD', 'INTC', 'TSM', 'CSCO', 'ORCL', 'IBM', 'ADBE', 'CRM', 'QCOM', 'TXN',
  // E-commerce & Internet
  'AMZN', 'BABA', 'SHOP', 'ETSY', 'EBAY', 'PYPL', 'SQ', 'ABNB', 'MELI', 'CHWY', 'W', 'PINS', 'SNAP', 'TWLO',
  // Electric Vehicles & Auto
  'TSLA', 'F', 'GM', 'TM', 'RIVN', 'NIO', 'LCID', 'LI', 'XPEV', 'FSR', 'NKLA', 'HMC',
  // Financial Services
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'V', 'MA', 'AXP', 'C', 'BLK', 'SCHW', 'USB', 'PNC', 'COF',
  // Healthcare
  'JNJ', 'PFE', 'MRNA', 'ABBV', 'UNH', 'CVS', 'WBA', 'LLY', 'TMO', 'DHR', 'BMY', 'AMGN', 'GILD', 'REGN',
  // Retail
  'WMT', 'TGT', 'COST', 'HD', 'LOW', 'DG', 'DLTR', 'KR', 'ULTA', 'BBY', 'DKS', 'M', 'GPS',
  // Entertainment & Media
  'NFLX', 'DIS', 'CMCSA', 'PARA', 'WBD', 'SPOT', 'ROKU', 'EA', 'TTWO', 'ATVI', 'LYV',
  // Telecommunications
  'VZ', 'T', 'TMUS', 'ERIC', 'NOK',
  // Energy
  'XOM', 'CVX', 'COP', 'BP', 'SHEL', 'SLB', 'EOG', 'PXD', 'MPC', 'PSX', 'VLO',
  // Consumer Goods
  'KO', 'PEP', 'PG', 'MCD', 'SBUX', 'NKE', 'YUM', 'EL', 'CL', 'KMB', 'HSY', 'K', 'GIS',
  // Industrial & Manufacturing
  'CAT', 'DE', 'BA', 'LMT', 'RTX', 'HON', 'MMM', 'GE', 'EMR', 'ETN', 'CMI',
  // Real Estate
  'AMT', 'PLD', 'CCI', 'EQIX', 'DLR', 'O', 'SPG', 'WELL', 'AVB',
  // Materials
  'LIN', 'APD', 'ECL', 'DD', 'NEM', 'FCX', 'DOW', 'NUE'
];

// Keep track of stocks that have been shown to the user
let shownStocks = new Set<string>();

// Reset shown stocks if we've shown all available stocks
const resetShownStocksIfNeeded = () => {
  if (shownStocks.size >= stockUniverse.length) {
    console.log('Resetting shown stocks history - all stocks have been shown');
    shownStocks.clear();
  }
};

export const generateStockBatch = async (count: number, requiredSymbols: string[] = []): Promise<Stock[]> => {
  console.log('Generating stock batch with required symbols:', requiredSymbols);
  resetShownStocksIfNeeded();
  
  // Always include required symbols (portfolio stocks)
  const portfolioStocks = requiredSymbols.filter(symbol => 
    stockUniverse.includes(symbol)
  );
  
  // Get available stocks (not required)
  const availableStocks = stockUniverse.filter(symbol => 
    !requiredSymbols.includes(symbol)
  );
  
  // Shuffle available stocks
  const shuffledStocks = availableStocks.sort(() => Math.random() - 0.5);
  
  // Calculate how many additional stocks we need
  const remainingCount = count - portfolioStocks.length;
  
  // Get additional random stocks
  const additionalStocks = remainingCount > 0 
    ? shuffledStocks.slice(0, remainingCount)
    : [];
  
  const selectedStocks = [...portfolioStocks, ...additionalStocks];
  
  // Add non-portfolio stocks to shown stocks set
  additionalStocks.forEach(symbol => shownStocks.add(symbol));
  
  console.log('Selected stocks:', selectedStocks);
  console.log('Total shown stocks:', shownStocks.size);
  console.log('Remaining unseen stocks:', stockUniverse.length - shownStocks.size);
  
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
